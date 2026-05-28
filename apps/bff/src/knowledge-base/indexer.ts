import { chunkDocument } from "./chunker.js";
import { getActiveProvider, isEmbeddingAvailable } from "./embedding.js";
import { getVectorStore } from "./vector-store.js";
import { logger } from "../utils/logger.js";
import { extractEntitiesForFile } from "./entity-extractor.js";
import {
  createIndexJob,
  updateJobStatus,
  updateJobProgress,
  getRecentJobs as getPersistedRecentJobs,
} from "./lightrag-index-status.js";

export interface IndexJob {
  id: string;
  filePath: string;
  status: "pending" | "running" | "completed" | "failed";
  totalChunks: number;
  processedChunks: number;
  error?: string;
  note?: string;
  startedAt?: number;
  completedAt?: number;
}

interface Indexer {
  indexFile(filePath: string, markdown: string, metadata: object): Promise<IndexJob>;
  deleteFileIndex(filePath: string): Promise<void>;
  getJobStatus(jobId: string): IndexJob | undefined;
  getAllJobs(): IndexJob[];
}

const jobs = new Map<string, IndexJob>();
const indexingLocks = new Map<string, Promise<void>>();
const JOB_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateJobId(): string {
  return `idx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanupOldJobs(): void {
  const cutoff = Date.now() - JOB_RETENTION_MS;
  for (const [jobId, job] of jobs) {
    if ((job.status === "completed" || job.status === "failed") && job.completedAt && job.completedAt < cutoff) {
      jobs.delete(jobId);
    }
  }
}

async function runIndexJob(job: IndexJob, filePath: string, markdown: string, metadata: object): Promise<void> {
  job.status = "running";
  job.startedAt = Date.now();
  updateJobStatus(filePath, "processing");

  try {
    // 1. Chunk the document
    const chunks = chunkDocument(filePath, markdown, metadata as { title?: string; type?: string; tags?: string[] });
    job.totalChunks = chunks.length;
    job.processedChunks = 0;
    updateJobProgress(filePath, chunks.length, 0);

    logger.info(`[Indexer] Job ${job.id}: ${chunks.length} chunks for ${filePath}`);

    // 2. Check embedding availability
    const provider = getActiveProvider();
    if (!provider || !isEmbeddingAvailable()) {
      job.status = "completed";
      job.note = "embedding unavailable, using keyword fallback";
      job.completedAt = Date.now();
      updateJobStatus(filePath, "completed", undefined, job.note);
      logger.info(`[Indexer] Job ${job.id}: no embedding provider, fallback to keywords`);

      // Still trigger entity extraction (cold path)
      try {
        extractEntitiesForFile(filePath, markdown).catch((err) => {
          logger.warn(`[Indexer] Entity extraction failed for ${filePath}:`, err);
        });
      } catch (err) {
        logger.warn(`[Indexer] Failed to start entity extraction for ${filePath}:`, err);
      }
      return;
    }

    // 3. Get vector store for this provider
    const store = getVectorStore(provider.name);

    // 4. Delete old vectors for this file (incremental update)
    await store.deleteByFilePath(filePath);
    logger.info(`[Indexer] Job ${job.id}: deleted old vectors for ${filePath}`);

    // 5. Batch embeddings (with safety timeout)
    const texts = chunks.map((c) => c.content);
    const embeddings = await Promise.race([
      provider.batchEmbeddings(texts),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("batchEmbeddings timeout after 60s")), 60000)
      ),
    ]);

    if (!embeddings) {
      job.status = "completed";
      job.note = "embedding API returned null, using keyword fallback";
      job.completedAt = Date.now();
      updateJobStatus(filePath, "completed", undefined, job.note);
      logger.warn(`[Indexer] Job ${job.id}: batchEmbeddings returned null for ${filePath}`);

      // Still trigger entity extraction (cold path)
      try {
        extractEntitiesForFile(filePath, markdown).catch((err) => {
          logger.warn(`[Indexer] Entity extraction failed for ${filePath}:`, err);
        });
      } catch (err) {
        logger.warn(`[Indexer] Failed to start entity extraction for ${filePath}:`, err);
      }
      return;
    }

    if (embeddings.length !== chunks.length) {
      job.status = "failed";
      job.error = `embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`;
      job.completedAt = Date.now();
      updateJobStatus(filePath, "failed", job.error);
      logger.error(`[Indexer] Job ${job.id}: ${job.error}`);
      return;
    }

    // 6. Build vector records and store
    const records = chunks.map((chunk, i) => ({
      id: chunk.id,
      filePath: chunk.metadata.filePath,
      chunkIndex: chunk.metadata.index,
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: embeddings[i],
    }));

    await store.addBatch(records);
    job.processedChunks = chunks.length;
    job.status = "completed";
    job.completedAt = Date.now();
    updateJobProgress(filePath, chunks.length, chunks.length);
    updateJobStatus(filePath, "completed");
    logger.info(`[Indexer] Job ${job.id}: completed, indexed ${chunks.length} chunks`);

    // Trigger async entity extraction (cold path - does not block)
    try {
      extractEntitiesForFile(filePath, markdown).catch((err) => {
        logger.warn(`[Indexer] Entity extraction failed for ${filePath}:`, err);
      });
    } catch (err) {
      logger.warn(`[Indexer] Failed to start entity extraction for ${filePath}:`, err);
    }
  } catch (error) {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : String(error);
    job.completedAt = Date.now();
    updateJobStatus(filePath, "failed", job.error);
    logger.error(`[Indexer] Job ${job.id}: failed -`, error);
  }
}

export function createIndexer(): Indexer {
  return {
    async indexFile(filePath: string, markdown: string, metadata: object): Promise<IndexJob> {
      cleanupOldJobs();

      // Wait for any existing indexing of this file to complete
      const existingLock = indexingLocks.get(filePath);
      if (existingLock) {
        logger.info(`[Indexer] Waiting for existing indexing of ${filePath} to complete`);
        await existingLock.catch(() => {}); // ignore errors from previous run
      }

      const jobId = generateJobId();
      const job: IndexJob = {
        id: jobId,
        filePath,
        status: "pending",
        totalChunks: 0,
        processedChunks: 0,
      };
      jobs.set(jobId, job);

      // Persist to SQLite (docId = filePath for lookup consistency)
      createIndexJob(filePath, filePath);

      // Create lock promise that encompasses the entire job execution
      const jobPromise = runIndexJob(job, filePath, markdown, metadata)
        .catch((err) => {
          logger.error(`[Indexer] Unhandled error in job ${jobId}:`, err);
          job.status = "failed";
          job.error = err instanceof Error ? err.message : String(err);
          job.completedAt = Date.now();
          updateJobStatus(filePath, "failed", job.error);
        })
        .finally(() => {
          indexingLocks.delete(filePath);
        });

      indexingLocks.set(filePath, jobPromise);

      return job;
    },

    async deleteFileIndex(filePath: string): Promise<void> {
      const provider = getActiveProvider();
      if (provider) {
        try {
          const store = getVectorStore(provider.name);
          await store.deleteByFilePath(filePath);
          logger.info(`[Indexer] Deleted vector index for ${filePath}`);
        } catch (err) {
          logger.warn(`[Indexer] Failed to delete vector index for ${filePath}:`, err);
        }
      }
    },

    getJobStatus(jobId: string): IndexJob | undefined {
      // Memory-only lookup: jobId is a random idx-xxx string.
      // Persisted jobs are loaded via getAllJobs() which maps them correctly.
      return jobs.get(jobId);
    },

    getAllJobs(): IndexJob[] {
      // Memory jobs take precedence (they have real-time progress)
      const memoryJobs = Array.from(jobs.values());
      const memoryPaths = new Set(memoryJobs.map((j) => j.filePath));

      // Also load persisted jobs for files not in memory (e.g., after BFF restart)
      const persisted = getPersistedRecentJobs(200).filter((p) => !memoryPaths.has(p.filePath));

      // Convert persisted jobs to IndexJob format
      const persistedJobs: IndexJob[] = persisted.map((p) => ({
        id: p.docId,
        filePath: p.filePath,
        status: p.status === "processing" ? "running" : (p.status as IndexJob["status"]),
        totalChunks: p.totalChunks || 0,
        processedChunks: p.processedChunks || 0,
        error: p.errorMessage || undefined,
        note: p.note || undefined,
        startedAt: p.createdAt,
        completedAt: p.status === "completed" || p.status === "failed" ? p.updatedAt : undefined,
      }));

      return [...memoryJobs, ...persistedJobs].sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
    },
  };
}

// Singleton indexer instance for convenience
let defaultIndexer: Indexer | null = null;

export function getDefaultIndexer(): Indexer {
  if (!defaultIndexer) {
    defaultIndexer = createIndexer();
  }
  return defaultIndexer;
}
