/**
 * LightRAG Index Worker
 *
 * Background queue processor for indexing files into LightRAG.
 * LightRAG Python is single-process, so concurrency = 1.
 * Uses LightRAG doc_status file polling for accurate state tracking.
 */

import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { logger } from "../utils/logger.js";
import { lightragClient } from "./lightrag-client.js";
import { extractTextFromFile } from "./extractors.js";
import { resolveKbPath } from "./paths.js";
import { getLightRagWorkingDir } from "./lightrag-path.js";
import {
  getPendingJobs,
  getJobStatus,
  updateJobStatus,
  deleteJob,
  createIndexJob,
  type IndexJob,
} from "./lightrag-index-status.js";

const POLL_INTERVAL_MS = 5000;
const MAX_CONCURRENT = 1;
const MAX_RETRIES = 3;
const STATUS_CHECK_INTERVAL_MS = 15000; // Check doc_status every 15s
const MAX_STATUS_WAIT_MS = 30 * 60 * 1000; // Max 30 min wait for indexing

let isRunning = false;
let timer: NodeJS.Timeout | null = null;
let activeCount = 0;

/**
 * Simple HTML tag removal for better LightRAG ingestion.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n[ \t]*\n[ \t]*\n+/g, "\n\n")
    .trim();
}

/**
 * Check LightRAG's internal doc_status file for a document's real processing state.
 */
async function checkLightRAGDocStatus(docId: string): Promise<"pending" | "processing" | "processed" | "failed" | null> {
  try {
    const workingDir = getLightRagWorkingDir();
    const statusPath = `${workingDir}/kv_store_doc_status.json`;
    const content = await readFile(statusPath, "utf-8");
    const data = JSON.parse(content) as Record<string, { status?: string; error?: string }>;
    const doc = data[docId];
    if (!doc) return null;
    const status = doc.status;
    if (status === "PENDING" || status === "pending") return "pending";
    if (status === "PROCESSING" || status === "processing") return "processing";
    if (status === "PROCESSED" || status === "processed") return "processed";
    if (status === "FAILED" || status === "failed") return "failed";
    return null;
  } catch {
    return null;
  }
}

/**
 * Wait for LightRAG to finish processing a document by polling its doc_status file.
 */
async function waitForLightRAGProcessing(
  docId: string,
  startTime: number
): Promise<{ status: "completed" | "failed"; error?: string }> {
  while (Date.now() - startTime < MAX_STATUS_WAIT_MS) {
    const lrStatus = await checkLightRAGDocStatus(docId);
    logger.info(`[LightRAGWorker] ${docId} LightRAG status: ${lrStatus || "unknown"}`);

    if (lrStatus === "processed") {
      return { status: "completed" };
    }
    if (lrStatus === "failed") {
      return { status: "failed", error: "LightRAG processing failed" };
    }
    if (lrStatus === null) {
      // Document not found in LightRAG status - may have been deleted or never queued
      return { status: "failed", error: "Document not found in LightRAG status store" };
    }

    // Still pending or processing - wait and check again
    await new Promise((r) => setTimeout(r, STATUS_CHECK_INTERVAL_MS));
  }
  return { status: "failed", error: `LightRAG processing timed out after ${MAX_STATUS_WAIT_MS / 60000} minutes` };
}

/**
 * Extract text and index a single file into LightRAG.
 */
async function processJob(job: IndexJob): Promise<void> {
  updateJobStatus(job.docId, "processing");
  logger.info(`[LightRAGWorker] Processing job ${job.docId}: ${job.filePath}`);

  const startTime = Date.now();

  try {
    const ext = extname(job.filePath).toLowerCase();
    const resolvedPath = resolveKbPath(job.filePath);

    let content: string | Buffer;

    if (ext === ".txt" || ext === ".md" || ext === ".pdf") {
      // Direct binary upload to LightRAG
      content = await readFile(resolvedPath);
      await lightragClient.insertFile(content as Buffer, job.docId);
    } else if (ext === ".docx" || ext === ".pptx" || ext === ".xlsx") {
      // Extract text in BFF, then insert text
      const text = await extractTextFromFile(resolvedPath);
      if (text && text.trim()) {
        await lightragClient.insert(text.trim(), job.docId);
      } else {
        throw new Error("无法从文件中提取文本内容");
      }
    } else if (ext === ".html" || ext === ".htm") {
      // Strip HTML tags for better LightRAG ingestion
      const raw = await readFile(resolvedPath, "utf-8");
      const cleaned = stripHtmlTags(raw);
      if (cleaned && cleaned.trim()) {
        await lightragClient.insert(cleaned.trim(), job.docId);
      } else {
        throw new Error("HTML 文件内容为空");
      }
    } else {
      // Try text extraction for anything else
      const text = await extractTextFromFile(resolvedPath);
      if (text && text.trim()) {
        await lightragClient.insert(text.trim(), job.docId);
      } else {
        throw new Error(`不支持的文件格式: ${ext || "unknown"}`);
      }
    }

    // LightRAG insert returned - but processing may still be ongoing.
    // Poll doc_status until processing is truly complete.
    logger.info(`[LightRAGWorker] ${job.docId} insert accepted, waiting for LightRAG processing...`);
    const result = await waitForLightRAGProcessing(job.docId, startTime);

    if (result.status === "completed") {
      updateJobStatus(job.docId, "completed");
      logger.info(`[LightRAGWorker] Completed job ${job.docId}`);
    } else {
      throw new Error(result.error || "LightRAG processing failed");
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const isTimeout = errMsg.includes("timed out") || errMsg.includes("AbortError");

    if (isTimeout) {
      // HTTP timeout: LightRAG may still be processing in the background.
      // Don't mark as failed yet; next tick will poll doc_status.
      logger.warn(`[LightRAGWorker] ${job.docId} HTTP timeout, will poll doc_status next tick`);
      // Keep status as "processing" - the status-polling logic in tick() will handle it
      return;
    }

    const shouldRetry = job.retryCount < MAX_RETRIES;
    updateJobStatus(job.docId, shouldRetry ? "failed" : "failed", errMsg);
    logger.error(
      `[LightRAGWorker] Job ${job.docId} failed (retry ${job.retryCount}/${MAX_RETRIES}): ${errMsg}`
    );
    if (!shouldRetry) {
      logger.error(`[LightRAGWorker] Job ${job.docId} exhausted all retries`);
    }
    throw error;
  }
}

/**
 * Check processing jobs by reading LightRAG doc_status directly.
 * This handles the case where insert HTTP call timed out but
 * LightRAG continued processing in the background.
 */
async function checkProcessingJobs(): Promise<void> {
  const { getRecentJobs } = await import("./lightrag-index-status.js");
  const recentJobs = getRecentJobs(200);
  const processingJobs = recentJobs.filter((j) => j.status === "processing");

  for (const job of processingJobs) {
    const lrStatus = await checkLightRAGDocStatus(job.docId);
    logger.info(`[LightRAGWorker] Checking ${job.docId}: LightRAG status=${lrStatus || "unknown"}`);

    if (lrStatus === "processed") {
      updateJobStatus(job.docId, "completed");
      logger.info(`[LightRAGWorker] ${job.docId} confirmed completed via doc_status`);
    } else if (lrStatus === "failed") {
      const shouldRetry = job.retryCount < MAX_RETRIES;
      updateJobStatus(
        job.docId,
        shouldRetry ? "failed" : "failed",
        "LightRAG processing failed"
      );
      logger.error(
        `[LightRAGWorker] ${job.docId} confirmed failed via doc_status (retry ${job.retryCount}/${MAX_RETRIES})`
      );
    }
    // For pending/processing/unknown: keep waiting
  }
}

async function tick(): Promise<void> {
  // First, check any jobs stuck in "processing" state
  await checkProcessingJobs();

  if (activeCount >= MAX_CONCURRENT) return;

  // Skip if LightRAG is not healthy
  try {
    await lightragClient.health();
  } catch {
    logger.debug("[LightRAGWorker] LightRAG unhealthy, skipping tick");
    return;
  }

  const pending = getPendingJobs(MAX_CONCURRENT);
  if (pending.length === 0) return;

  for (const job of pending) {
    if (activeCount >= MAX_CONCURRENT) break;
    activeCount++;

    processJob(job)
      .catch(() => {
        // Error already logged inside processJob
      })
      .finally(() => {
        activeCount--;
      });
  }
}

export function startLightRAGIndexWorker(): void {
  if (isRunning) return;
  isRunning = true;
  logger.info("[LightRAGWorker] Started");

  // Immediate first tick
  tick().catch((err) => logger.error("[LightRAGWorker] Tick error:", err));

  timer = setInterval(() => {
    tick().catch((err) => logger.error("[LightRAGWorker] Tick error:", err));
  }, POLL_INTERVAL_MS);
}

export function stopLightRAGIndexWorker(): void {
  if (!isRunning) return;
  isRunning = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  logger.info("[LightRAGWorker] Stopped");
}

export function enqueueLightRAGIndex(docId: string, filePath: string): void {
  createIndexJob(docId, filePath);
  logger.info(`[LightRAGWorker] Enqueued ${docId}: ${filePath}`);

  // Kick worker immediately if idle
  if (activeCount < MAX_CONCURRENT && isRunning) {
    tick().catch((err) => logger.error("[LightRAGWorker] Kick tick error:", err));
  }
}
