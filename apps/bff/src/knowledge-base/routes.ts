import { Router } from "express";
import multer from "multer";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { dirname, join, relative, normalize, resolve } from "node:path";
import { logger } from "../utils/logger.js";
import { extname } from "node:path";
import { createSourcePageFromRaw, getKbTree, ensureKbInitialized, isBinaryExt } from "./service.js";
import { getKbBasePath, resolveKbPath } from "./paths.js";
import { extractTextFromFile, EXTRACTABLE_EXTS } from "./extractors.js";
import { getKnowledgeGraph, invalidateGraphCache } from "./graph.js";
import { getGraphStore } from "./graph-store.js";
import { buildKnowledgeConsistencyReport } from "./consistency.js";
import { buildKnowledgeTasksReport, synthesizeGraphStatusesFromStore } from "./tasks.js";
import { getDefaultIndexer, type IndexJob as WikiIndexJob } from "./indexer.js";
import {
  getJobStatus,
  getRecentJobs,
  deleteJob,
  getOrganizeStatus,
  getAllOrganizeStatuses,
  getAllGraphExtractionStatuses,
} from "./lightrag-index-status.js";
import { memoryTreeManager } from "../memory/index.js";
import {
  alignMemoryItemsToGraph,
  buildAlignmentGraphPatch,
  buildMemoryAlignmentStatus,
  knowledgeGraphNodesForAlignment,
  selectAutoCommitAlignmentCandidates,
} from "./alignment.js";
import { extractEntitiesForFile } from "./entity-extractor.js";
import { buildGraphNeighborhood } from "./graph-neighborhood.js";
import {
  appendAlignmentCommitRecord,
  buildAlignmentCommitRecord,
  listAlignmentCommitRecords,
} from "./alignment-history.js";
import { cleanUrlImportContent } from "./url-cleaner.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

function fixFilenameEncoding(filename: string): string {
  try {
    const buf = Buffer.from(filename, "latin1");
    const utf8 = buf.toString("utf-8");
    if (/[\u4e00-\u9fa5]/.test(utf8) && !/ï¿½|Ã|Â/.test(utf8)) {
      return utf8;
    }
  } catch {}
  return filename;
}

function sanitizeFilename(fileName: string): string {
  let sanitized = fileName.replace(/[^\w\u4e00-\u9fa5.\-]/g, "_").replace(/_{2,}/g, "_");
  if (!sanitized || sanitized === ".md") {
    sanitized = `imported_${Date.now()}.md`;
  }
  return sanitized;
}

function isPathWithinBase(filePath: string): boolean {
  const base = getKbBasePath();
  const resolved = resolve(base, normalize(filePath));
  // Ensure resolved path starts with base path
  return resolved.startsWith(base + "/") || resolved === base;
}

function validateKbPath(filePath: string): { valid: boolean; error?: string } {
  if (!filePath || typeof filePath !== "string") {
    return { valid: false, error: "filePath must be a non-empty string" };
  }
  // Block null bytes
  if (filePath.includes("\x00")) {
    return { valid: false, error: "Invalid characters in filePath" };
  }
  // Block URL-encoded traversal sequences (case-insensitive)
  if (/%2e|%2f|%5c|%252e|%252f|%255c|\.{2,}/i.test(filePath)) {
    return { valid: false, error: "Invalid path traversal sequence" };
  }
  if (!isPathWithinBase(filePath)) {
    return { valid: false, error: "filePath must be within knowledge base directory" };
  }
  return { valid: true };
}

/**
 * Best-effort SSRF prevention for URL imports.
 * NOTE: This does NOT protect against DNS rebinding. For production,
 * resolve the hostname to an IP and validate the resolved IP before fetching.
 */
function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname;
    // Block internal/private IPs to prevent SSRF
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") return false;
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/.test(hostname)) return false;
    if (/^127\./.test(hostname)) return false; // blocks 127.1, 127.0.0.2, etc.
    if (/^0\./.test(hostname)) return false;
    if (/^::1$|^\[::1\]$/.test(hostname)) return false;
    if (/^\[0:0:0:0:0:0:0:1\]$/.test(hostname)) return false; // IPv6 localhost variant
    if (/^[0-7]+\./.test(hostname)) return false; // octal IP
    if (/^0x/.test(hostname)) return false; // hex IP
    // Block zero IP and explicit 0.0.0.0
    if (parsed.host === "0.0.0.0" || parsed.host === "0" || parsed.host === "[::]") return false;
    return true;
  } catch {
    return false;
  }
}

export const knowledgeBaseRouter = Router();

function getUserId(req: { headers: { [key: string]: string | string[] | undefined } }): string {
  const headerId = req.headers["x-user-id"];
  if (headerId && typeof headerId === "string") return headerId;
  return "anonymous";
}

function flattenKbFilePaths(nodes: any[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node?.isDirectory && Array.isArray(node.children)) {
      paths.push(...flattenKbFilePaths(node.children));
    } else if (node?.path && typeof node.path === "string") {
      paths.push(node.path);
    }
  }
  return paths;
}

async function buildConsistencyReport() {
  await ensureKbInitialized();
  const tree = await getKbTree();
  const filePaths = flattenKbFilePaths(tree);
  const graphStore = getGraphStore();
  const storeData = graphStore.isAvailable() ? graphStore.getAll() : { nodes: [], edges: [] };
  return buildKnowledgeConsistencyReport({
    filePaths,
    graphNodes: storeData.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      sourceFile: node.sourceFile,
    })),
    graphEdges: storeData.edges,
  });
}

knowledgeBaseRouter.get("/consistency", async (_req, res) => {
  try {
    const report = await buildConsistencyReport();
    res.json({ code: 0, message: "success", data: report });
  } catch (error) {
    logger.error("[KnowledgeBase] Consistency check error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "一致性检查失败", data: null });
  }
});

knowledgeBaseRouter.post("/consistency/repair", async (req, res) => {
  try {
    const { action } = req.body || {};
    if (action !== "prune-stale-graph") {
      return res.status(400).json({ code: 400, message: "不支持的修复动作", data: null });
    }

    const before = await buildConsistencyReport();
    const graphStore = getGraphStore();
    if (!graphStore.isAvailable()) {
      return res.status(503).json({ code: 503, message: "图谱存储不可用", data: null });
    }

    for (const source of before.staleGraphSources) {
      graphStore.deleteBySourcePath(source.sourceFile);
    }
    invalidateGraphCache();
    const after = await buildConsistencyReport();
    res.json({ code: 0, message: "success", data: { before, after } });
  } catch (error) {
    logger.error("[KnowledgeBase] Consistency repair error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "一致性修复失败", data: null });
  }
});

knowledgeBaseRouter.get("/tasks", async (_req, res) => {
  try {
    const [consistency, indexJobs, organizeStatuses, graphStatuses] = await Promise.all([
      buildConsistencyReport(),
      Promise.resolve(getDefaultIndexer().getAllJobs().slice(0, 100)),
      Promise.resolve(getAllOrganizeStatuses().slice(0, 100)),
      Promise.resolve(getAllGraphExtractionStatuses(100)),
    ]);
    const graphStore = getGraphStore();
    const storeData = graphStore.isAvailable() ? graphStore.getAll() : { nodes: [], edges: [] };
    const visibleGraphStatuses = synthesizeGraphStatusesFromStore({
      existingStatuses: graphStatuses,
      graphNodes: storeData.nodes.map((node) => ({ id: node.id, sourceFile: node.sourceFile })),
      graphEdges: storeData.edges.map((edge) => ({ source: edge.source, target: edge.target })),
    }).slice(0, 100);
    const report = buildKnowledgeTasksReport({
      indexJobs: indexJobs.map((job) => ({
        docId: job.id,
        filePath: job.filePath,
        status: job.status,
        errorMessage: job.error,
        note: job.note,
        totalChunks: job.totalChunks,
        processedChunks: job.processedChunks,
        createdAt: job.startedAt,
        updatedAt: job.completedAt ?? job.startedAt,
      })),
      organizeStatuses,
      graphStatuses: visibleGraphStatuses,
      consistency,
    });
    res.json({ code: 0, message: "success", data: report });
  } catch (error) {
    logger.error("[KnowledgeBase] Tasks report error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "任务状态读取失败", data: null });
  }
});

/**
 * POST /api/knowledge-base/organize
 * Body: { filePath: string }
 * 触发 AI 整理指定 raw 文件，生成 wiki 页面
 */
knowledgeBaseRouter.post("/organize", async (req, res) => {
  try {
    const { filePath } = req.body || {};
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ code: 400, message: "缺少 filePath 参数", data: null });
    }
    const { organizeFile } = await import("./service.js");
    const result = await organizeFile(filePath);
    if (result.success) {
      res.json({ code: 0, message: "success", data: result });
    } else {
      res.status(500).json({ code: 500, message: result.error || "整理失败", data: null });
    }
  } catch (error) {
    logger.error("[KnowledgeBase] Organize error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "整理失败", data: null });
  }
});

/**
 * GET /api/knowledge-base/tree
 * 获取知识库目录树
 */
knowledgeBaseRouter.get("/tree", async (_req, res) => {
  try {
    await ensureKbInitialized();
    const tree = await getKbTree();
    res.json({ code: 0, message: "success", data: tree });
  } catch (error) {
    logger.error("[KnowledgeBase] Get tree error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * GET /api/knowledge-base/file?path=xxx
 * 读取知识库文件内容
 */
knowledgeBaseRouter.get("/file", async (req, res) => {
  try {
    await ensureKbInitialized();
    const filePath = req.query.path as string;
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ code: 400, message: "缺少 path 参数", data: null });
    }
    const validation = validateKbPath(filePath);
    if (!validation.valid) {
      return res.status(400).json({ code: 400, message: validation.error, data: null });
    }
    const ext = extname(filePath).slice(1).toLowerCase();
    const extWithDot = ext ? `.${ext}` : "";
    const isExtractable = EXTRACTABLE_EXTS.has(extWithDot);
    if (isBinaryExt(ext) && !isExtractable) {
      return res.status(400).json({
        code: 400,
        message: "该文件类型不支持文本预览，请转换为 Markdown 或纯文本后上传",
        data: null,
      });
    }
    const content = await extractTextFromFile(resolveKbPath(filePath));
    res.json({ code: 0, message: "success", data: content });
  } catch (error) {
    logger.error("[KnowledgeBase] Read file error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * POST /api/knowledge-base/upload
 * 上传文件到知识库 raw/ 目录
 */
knowledgeBaseRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    await ensureKbInitialized();
    const file = req.file;
    if (!file) {
      return res.status(400).json({ code: 400, message: "未上传文件", data: null });
    }
    const originalName = fixFilenameEncoding(file.originalname);
    const safeName = sanitizeFilename(originalName);
    const destPath = resolveKbPath(join("raw", safeName));
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, file.buffer);
    const relativePath = relative(getKbBasePath(), destPath).replace(/\\/g, "/");

    // Extract text and index immediately (hot path)
    let content: string;
    const ext = extname(relativePath).toLowerCase();
    if (ext === ".txt" || ext === ".md" || ext === ".html" || ext === ".htm") {
      content = file.buffer.toString("utf-8");
    } else {
      content = await extractTextFromFile(destPath);
    }

    const indexer = getDefaultIndexer();
    const job = await indexer.indexFile(relativePath, content || "", { title: safeName });

    res.json({
      code: 0,
      message: "success",
      data: { path: relativePath, jobId: job.id, indexStatus: job.status },
    });
  } catch (error) {
    logger.error("[KnowledgeBase] Upload error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * POST /api/knowledge-base/import-url
 * Body: { url: string, name?: string }
 * 从URL拉取内容并保存到知识库 raw/ 目录
 */
knowledgeBaseRouter.post("/import-url", async (req, res) => {
  try {
    await ensureKbInitialized();
    const { url, name } = req.body || {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({ code: 400, message: "缺少 url 参数", data: null });
    }

    if (!isValidHttpUrl(url)) {
      return res.status(400).json({ code: 400, message: "url 必须是有效的 HTTP/HTTPS 地址", data: null });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MineEchoKB/1.0)",
        },
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      logger.error("[KnowledgeBase] URL fetch error:", fetchError);
      return res.status(502).json({
        code: 502,
        message: fetchError instanceof Error ? fetchError.message : "请求 URL 失败",
        data: null,
      });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({
        code: 502,
        message: `目标服务器返回错误: ${response.status} ${response.statusText}`,
        data: null,
      });
    }

    const contentType = response.headers.get("content-type") || "";
    const rawBuffer = await response.arrayBuffer();
    const rawText = new TextDecoder("utf-8", { fatal: false }).decode(rawBuffer);

    const cleaned = await cleanUrlImportContent({ rawText, contentType, url });
    const cleanedText = cleaned.text;

    // Derive filename
    let fileName = name && typeof name === "string" ? name.trim() : "";
    if (!fileName) {
      try {
        const parsed = new URL(url);
        const pathPart = decodeURIComponent(parsed.pathname.split("/").pop() || "");
        fileName = pathPart || "imported";
      } catch {
        fileName = "imported";
      }
    }
    // Ensure .md extension
    if (!fileName.toLowerCase().endsWith(".md")) {
      fileName = `${fileName}.md`;
    }
    // Sanitize filename
    fileName = sanitizeFilename(fileName);

    const destPath = resolveKbPath(join("raw", fileName));
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, cleanedText, "utf-8");

    const relativePath = relative(getKbBasePath(), destPath).replace(/\\/g, "/");
    logger.info("[KnowledgeBase] Imported URL to:", {
      path: relativePath,
      rawChars: cleaned.stats.rawChars,
      cleanedChars: cleaned.stats.cleanedChars,
      tokenJuiceChars: cleaned.stats.tokenJuiceChars,
    });

    // Index immediately (hot path)
    const indexer = getDefaultIndexer();
    const job = await indexer.indexFile(relativePath, cleanedText, { title: fileName });
    const sourcePath = await createSourcePageFromRaw(relativePath);
    invalidateGraphCache();

    res.json({
      code: 0,
      message: "success",
      data: { path: relativePath, sourcePath, jobId: job.id, indexStatus: job.status, cleanup: cleaned.stats },
    });
  } catch (error) {
    logger.error("[KnowledgeBase] Import URL error:", error);
    res.status(500).json({
      code: 500,
      message: error instanceof Error ? error.message : "未知错误",
      data: null,
    });
  }
});

/**
 * GET /api/knowledge-base/graph
 * 获取知识库图谱数据
 */
knowledgeBaseRouter.get("/graph", async (_req, res) => {
  try {
    await ensureKbInitialized();
    const graph = await getKnowledgeGraph();
    res.json({ code: 0, message: "success", data: graph });
  } catch (error) {
    logger.error("[KnowledgeBase] Graph error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * GET /api/knowledge-base/graph-neighborhood
 * Return an explainable one-hop neighborhood for a selected graph node.
 */
knowledgeBaseRouter.get("/graph-neighborhood", async (req, res) => {
  try {
    await ensureKbInitialized();
    const nodeId = typeof req.query.nodeId === "string" ? req.query.nodeId : "";
    if (!nodeId) {
      return res.status(400).json({ code: 400, message: "缺少 nodeId 参数", data: null });
    }

    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const graph = await getKnowledgeGraph();
    const neighborhood = buildGraphNeighborhood(graph, nodeId, { limit });
    res.json({ code: 0, message: "success", data: neighborhood });
  } catch (error) {
    const message = error instanceof Error ? error.message : "图谱邻域读取失败";
    const status = message.startsWith("Node not found") ? 404 : 500;
    logger.error("[KnowledgeBase] Graph neighborhood error:", error);
    res.status(status).json({ code: status, message, data: null });
  }
});

/**
 * POST /api/knowledge-base/graph-extraction/retry
 * Body: { filePath: string }
 * Re-run entity and relationship extraction for one knowledge file.
 */
knowledgeBaseRouter.post("/graph-extraction/retry", async (req, res) => {
  try {
    await ensureKbInitialized();
    const { filePath } = req.body || {};
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ code: 400, message: "缺少 filePath 参数", data: null });
    }
    const validation = validateKbPath(filePath);
    if (!validation.valid) {
      return res.status(400).json({ code: 400, message: validation.error, data: null });
    }

    const content = await extractTextFromFile(resolveKbPath(filePath));
    extractEntitiesForFile(filePath, content || "").catch((error) => {
      logger.warn("[KnowledgeBase] Graph extraction retry failed:", error);
    });
    res.json({ code: 0, message: "success", data: { filePath, status: "processing" } });
  } catch (error) {
    logger.error("[KnowledgeBase] Graph extraction retry error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "图谱抽取重试失败", data: null });
  }
});

/**
 * POST /api/knowledge-base/search
 * 搜索知识库（向量+BM25+图谱混合）
 */
knowledgeBaseRouter.post("/search", async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ code: 400, message: "缺少 query 参数", data: null });
    }
    const { hybridSearch } = await import("./search.js");
    const results = await hybridSearch(query);
    res.json({ code: 0, message: "success", data: results });
  } catch (error) {
    logger.error("[KnowledgeBase] Search error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "搜索失败", data: null });
  }
});

/**
 * POST /api/knowledge-base/align-memory-preview
 * Preview memory-to-knowledge alignment candidates without mutating KB or graph data.
 */
knowledgeBaseRouter.post("/align-memory-preview", async (req, res) => {
  try {
    await ensureKbInitialized();
    const userId = getUserId(req);
    const {
      limit = 20,
      days = 30,
      minConfidence = 0.72,
      sources,
    } = req.body || {};

    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const daysNum = Math.min(365, Math.max(1, Number(days) || 30));
    const minConfidenceNum = Math.min(1, Math.max(0, Number(minConfidence) || 0.72));
    const sourceList = Array.isArray(sources)
      ? sources.filter((source): source is any => typeof source === "string")
      : undefined;

    const now = Date.now();
    const memoryResult = await memoryTreeManager.aggregatedQuery(userId, {
      timeRange: {
        start: now - daysNum * 24 * 60 * 60 * 1000,
        end: now,
      },
      sources: sourceList,
      limit: limitNum,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const graph = await getKnowledgeGraph();
    const candidates = alignMemoryItemsToGraph(
      memoryResult.items.map((item) => ({
        id: item.id,
        level: item.level,
        source: item.source,
        content: item.content,
        createdAt: item.createdAt,
      })),
      knowledgeGraphNodesForAlignment(graph),
      {
        minConfidence: minConfidenceNum,
        limit: limitNum,
        now,
      }
    );

    res.json({
      code: 0,
      message: "success",
      data: {
        userId,
        candidates,
        memoryCount: memoryResult.items.length,
        graphNodeCount: graph.nodes.length,
        previewOnly: true,
      },
    });
  } catch (error) {
    logger.error("[KnowledgeBase] Memory alignment preview error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "对齐预览失败", data: null });
  }
});

/**
 * GET /api/knowledge-base/align-memory-status
 * Lightweight status for surfacing whether memory can be aligned into the knowledge graph.
 */
knowledgeBaseRouter.get("/align-memory-status", async (req, res) => {
  try {
    await ensureKbInitialized();
    const userId = getUserId(req);
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const minConfidence = Math.min(1, Math.max(0, Number(req.query.minConfidence) || 0.72));
    const now = Date.now();

    const memoryResult = await memoryTreeManager.aggregatedQuery(userId, {
      timeRange: {
        start: now - days * 24 * 60 * 60 * 1000,
        end: now,
      },
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const graph = await getKnowledgeGraph();
    const candidates = alignMemoryItemsToGraph(
      memoryResult.items.map((item) => ({
        id: item.id,
        level: item.level,
        source: item.source,
        content: item.content,
        createdAt: item.createdAt,
      })),
      knowledgeGraphNodesForAlignment(graph),
      {
        minConfidence,
        limit,
        now,
      }
    );
    const history = listAlignmentCommitRecords({ limit: 100, userId });

    res.json({
      code: 0,
      message: "success",
      data: buildMemoryAlignmentStatus({
        userId,
        candidates,
        memoryCount: memoryResult.items.length,
        graphNodeCount: graph.nodes.length,
        historyCount: history.length,
        generatedAt: now,
      }),
    });
  } catch (error) {
    logger.error("[KnowledgeBase] Memory alignment status error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "记忆对齐状态读取失败", data: null });
  }
});

/**
 * GET /api/knowledge-base/alignment-history
 * List recent reviewed memory-to-knowledge alignment commits.
 */
knowledgeBaseRouter.get("/alignment-history", async (req, res) => {
  try {
    const userId = getUserId(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    res.json({
      code: 0,
      message: "success",
      data: {
        records: listAlignmentCommitRecords({ limit, userId }),
      },
    });
  } catch (error) {
    logger.error("[KnowledgeBase] Memory alignment history error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "对齐历史读取失败", data: null });
  }
});

/**
 * POST /api/knowledge-base/align-memory-commit
 * Persist user-reviewed memory alignment candidates into graph-store.
 */
knowledgeBaseRouter.post("/align-memory-commit", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { candidates, includeConflicts = false } = req.body || {};
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ code: 400, message: "缺少 candidates 参数", data: null });
    }

    const selected = candidates.slice(0, 100);
    const patch = buildAlignmentGraphPatch(userId, selected, { includeConflicts: includeConflicts === true });
    if (patch.nodes.length === 0 && patch.edges.length === 0) {
      const historyRecord = appendAlignmentCommitRecord(buildAlignmentCommitRecord({
        userId,
        candidates: selected,
        committedNodes: 0,
        committedEdges: 0,
        skipped: patch.skipped,
        includedConflicts: includeConflicts === true,
      }));
      return res.json({
        code: 0,
        message: "success",
        data: {
          committedNodes: 0,
          committedEdges: 0,
          skipped: patch.skipped,
          historyRecord,
        },
      });
    }

    const graphStore = getGraphStore();
    if (!graphStore.isAvailable()) {
      return res.status(503).json({ code: 503, message: "图谱存储不可用", data: null });
    }

    graphStore.addNodesBatch(patch.nodes);
    graphStore.addEdgesBatch(patch.edges);
    const historyRecord = appendAlignmentCommitRecord(buildAlignmentCommitRecord({
      userId,
      candidates: selected,
      committedNodes: patch.nodes.length,
      committedEdges: patch.edges.length,
      skipped: patch.skipped,
      includedConflicts: includeConflicts === true,
    }));
    invalidateGraphCache();

    res.json({
      code: 0,
      message: "success",
      data: {
        committedNodes: patch.nodes.length,
        committedEdges: patch.edges.length,
        skipped: patch.skipped,
        historyRecord,
      },
    });
  } catch (error) {
    logger.error("[KnowledgeBase] Memory alignment commit error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "记忆对齐沉淀失败", data: null });
  }
});

/**
 * POST /api/knowledge-base/align-memory-auto-commit
 * Conservative background-style memory-to-knowledge alignment.
 * Only high-confidence non-conflict candidates are committed automatically.
 */
knowledgeBaseRouter.post("/align-memory-auto-commit", async (req, res) => {
  try {
    await ensureKbInitialized();
    const userId = getUserId(req);
    const {
      days = 30,
      previewLimit = 100,
      commitLimit = 20,
      minConfidence = 0.88,
    } = req.body || {};

    const daysNum = Math.min(365, Math.max(1, Number(days) || 30));
    const previewLimitNum = Math.min(200, Math.max(1, Number(previewLimit) || 100));
    const commitLimitNum = Math.min(100, Math.max(1, Number(commitLimit) || 20));
    const minConfidenceNum = Math.min(1, Math.max(0.72, Number(minConfidence) || 0.88));
    const now = Date.now();

    const memoryResult = await memoryTreeManager.aggregatedQuery(userId, {
      timeRange: {
        start: now - daysNum * 24 * 60 * 60 * 1000,
        end: now,
      },
      limit: previewLimitNum,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const graph = await getKnowledgeGraph();
    const candidates = alignMemoryItemsToGraph(
      memoryResult.items.map((item) => ({
        id: item.id,
        level: item.level,
        source: item.source,
        content: item.content,
        createdAt: item.createdAt,
      })),
      knowledgeGraphNodesForAlignment(graph),
      {
        minConfidence: 0.72,
        limit: previewLimitNum,
        now,
      }
    );
    const selection = selectAutoCommitAlignmentCandidates(candidates, {
      minConfidence: minConfidenceNum,
      limit: commitLimitNum,
    });

    const patch = buildAlignmentGraphPatch(userId, selection.selected);
    if (patch.nodes.length > 0 || patch.edges.length > 0) {
      const graphStore = getGraphStore();
      if (!graphStore.isAvailable()) {
        return res.status(503).json({ code: 503, message: "图谱存储不可用", data: null });
      }
      graphStore.addNodesBatch(patch.nodes);
      graphStore.addEdgesBatch(patch.edges);
      invalidateGraphCache();
    }

    const historyRecord = appendAlignmentCommitRecord(buildAlignmentCommitRecord({
      userId,
      candidates: selection.selected,
      committedNodes: patch.nodes.length,
      committedEdges: patch.edges.length,
      skipped: patch.skipped + selection.skippedConflict + selection.skippedLowConfidence,
      includedConflicts: false,
    }));

    res.json({
      code: 0,
      message: "success",
      data: {
        scannedMemories: memoryResult.items.length,
        candidateCount: candidates.length,
        selectedCount: selection.selected.length,
        committedNodes: patch.nodes.length,
        committedEdges: patch.edges.length,
        skippedConflict: selection.skippedConflict,
        skippedLowConfidence: selection.skippedLowConfidence,
        historyRecord,
      },
    });
  } catch (error) {
    logger.error("[KnowledgeBase] Memory auto alignment commit error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "自动记忆对齐失败", data: null });
  }
});

/**
 * POST /api/knowledge-base/lightrag-query
 * 保留兼容，但底层走 Wiki 搜索
 */
knowledgeBaseRouter.post("/lightrag-query", async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ code: 400, message: "缺少 query 参数", data: null });
    }
    const { hybridSearch } = await import("./search.js");
    const results = await hybridSearch(query);
    // Format as LightRAG-compatible response
    const answer = results.length > 0
      ? results.map((r) => r.content).join("\n\n---\n\n").slice(0, 4000)
      : "未找到相关知识库内容";
    res.json({
      code: 0,
      message: "success",
      data: {
        answer,
        sources: results.map((r) => ({
          doc_id: (r.metadata as any)?.filePath || "unknown",
          content: r.content.slice(0, 200),
        })),
      },
    });
  } catch (error) {
    logger.error("[KnowledgeBase] Query error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "查询失败", data: null });
  }
});

/**
 * GET /api/knowledge-base/lightrag-graph
 * 返回 Wiki 知识图谱（替代 LightRAG）
 */
knowledgeBaseRouter.get("/lightrag-graph", async (_req, res) => {
  try {
    await ensureKbInitialized();
    const graph = await getKnowledgeGraph();
    // Normalize wiki graph format to LightRAG response format for frontend compatibility
    const nodes = graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      description: n.summary,
      filePath: n.filePath,
      sources: n.sources,
      importance: n.importance,
    }));
    const edges = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      relation: e.relation,
      weight: e.strength,
    }));
    res.json({ code: 0, message: "success", data: { nodes, edges } });
  } catch (error) {
    logger.error("[KnowledgeBase] Graph error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * GET /api/knowledge-base/index-status
 * 获取所有索引任务状态
 */
knowledgeBaseRouter.get("/index-status", async (_req, res) => {
  try {
    const indexer = getDefaultIndexer();
    const jobs = indexer.getAllJobs().slice(0, 200);
    // Normalize to frontend-compatible format
    const normalized = jobs.map((j: WikiIndexJob) => ({
      docId: j.id,
      filePath: j.filePath,
      status: j.status === "running" ? "processing" : j.status,
      retryCount: 0,
      errorMessage: j.error || null,
      createdAt: j.startedAt || Date.now(),
      completedAt: j.completedAt || null,
    }));
    res.json({ code: 0, message: "success", data: normalized });
  } catch (error) {
    logger.error("[KnowledgeBase] Index status error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * GET /api/knowledge-base/index-status/:docId
 * 获取单个文件的索引状态
 */
knowledgeBaseRouter.get("/index-status/:docId", async (req, res) => {
  try {
    const docId = req.params.docId;
    if (!docId) {
      return res.status(400).json({ code: 400, message: "缺少 docId 参数", data: null });
    }
    const indexer = getDefaultIndexer();
    const job = indexer.getJobStatus(docId);
    if (!job) {
      return res.json({ code: 0, message: "success", data: null });
    }
    const normalized = {
      docId: job.id,
      filePath: job.filePath,
      status: job.status === "running" ? "processing" : job.status,
      retryCount: 0,
      errorMessage: job.error || null,
      createdAt: job.startedAt || Date.now(),
      completedAt: job.completedAt || null,
    };
    res.json({ code: 0, message: "success", data: normalized });
  } catch (error) {
    logger.error("[KnowledgeBase] Index status detail error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * DELETE /api/knowledge-base/file
 * Body: { filePath: string }
 * 删除知识库文件或目录
 */
knowledgeBaseRouter.delete("/file", async (req, res) => {
  try {
    await ensureKbInitialized();
    const { filePath } = req.body || {};
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ code: 400, message: "缺少 filePath 参数", data: null });
    }
    const validation = validateKbPath(filePath);
    if (!validation.valid) {
      return res.status(400).json({ code: 400, message: validation.error, data: null });
    }
    // Prevent deletion of root directory or empty path
    const normalized = filePath.trim();
    if (!normalized || normalized === "." || normalized === "/") {
      return res.status(400).json({ code: 400, message: "无效的 filePath", data: null });
    }
    const resolvedPath = resolveKbPath(filePath);
    await rm(resolvedPath, { recursive: true, force: true });
    // Clean up vector index for deleted file
    try {
      const indexer = getDefaultIndexer();
      await indexer.deleteFileIndex(filePath);
    } catch (err) {
      logger.warn("[KnowledgeBase] Failed to delete vector index:", err);
    }
    // Clean up graph store references for deleted file
    try {
      const graphStore = getGraphStore();
      graphStore.deleteBySourcePath(filePath);
      invalidateGraphCache();
      const docId = filePath.replace(/\//g, "_");
      deleteJob(docId);
      logger.info("[KnowledgeBase] Cleaned up index status for:", docId);
    } catch (err) {
      logger.warn("[KnowledgeBase] Index status cleanup failed (non-critical):", err);
    }
    res.json({ code: 0, message: "success", data: null });
  } catch (error) {
    logger.error("[KnowledgeBase] Delete error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * GET /api/knowledge-base/organize-status
 * 获取所有已整理的 raw 文件状态
 */
knowledgeBaseRouter.get("/organize-status", async (_req, res) => {
  try {
    const statuses = getAllOrganizeStatuses();
    res.json({ code: 0, message: "success", data: statuses });
  } catch (error) {
    logger.error("[KnowledgeBase] Organize status error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});

/**
 * GET /api/knowledge-base/organize-status/:rawPath
 * 获取单个 raw 文件的整理状态
 */
knowledgeBaseRouter.get("/organize-status/:rawPath", async (req, res) => {
  try {
    const rawPath = req.params.rawPath;
    if (!rawPath) {
      return res.status(400).json({ code: 400, message: "缺少 rawPath 参数", data: null });
    }
    const status = getOrganizeStatus(rawPath);
    res.json({ code: 0, message: "success", data: status });
  } catch (error) {
    logger.error("[KnowledgeBase] Organize status detail error:", error);
    res.status(500).json({ code: 500, message: error instanceof Error ? error.message : "未知错误", data: null });
  }
});
