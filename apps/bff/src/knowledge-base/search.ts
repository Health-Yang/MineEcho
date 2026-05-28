import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, extname, relative } from "node:path";
import { logger } from "../utils/logger.js";
import { getKbBasePath, resolveKbPath } from "./paths.js";
import { chunkDocument, Chunk } from "./chunker.js";
import { extractTextFromFile } from "./extractors.js";
import { getActiveProvider, isEmbeddingAvailable } from "./embedding.js";
import { getVectorStore, VectorSearchResult } from "./vector-store.js";
import { getGraphStore } from "./graph-store.js";

// ── Stopwords ───────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "的", "了", "在", "是", "我", "有", "和", "就", "不", "人",
  "都", "一", "上", "也", "很", "到", "说", "要", "去", "你",
  "会", "着", "没有", "看", "好", "自己", "这", "那", "可以", "但是",
  "因为", "所以", "如果", "然后", "现在", "我们", "他们", "这个", "那个",
  "什么", "怎么", "为什么", "如何",
]);

// ── BM25 ────────────────────────────────────────────────────────────────────

interface Bm25Result {
  id: string;
  score: number;
  chunk: Chunk;
}

/**
 * Extract query tokens from a query string.
 * - Chinese: consecutive CJK chars (2-6 chars) as n-grams
 * - English: words with 3+ letters
 */
export function extractQueryTokens(query: string): string[] {
  const tokens: string[] = [];
  const lower = query.toLowerCase();

  // English words (3+ letters)
  const engWords = lower.match(/[a-z]{3,}/g) || [];
  for (const w of engWords) {
    if (!STOPWORDS.has(w)) tokens.push(w);
  }

  // Chinese n-grams (2-6 chars)
  const cjkChars = lower.replace(/[^\u4e00-\u9fa5]/g, "");
  for (let n = 2; n <= 6; n++) {
    for (let i = 0; i <= cjkChars.length - n; i++) {
      const gram = cjkChars.slice(i, i + n);
      // Skip if all chars are stopwords
      let hasNonStop = false;
      for (const ch of gram) {
        if (!STOPWORDS.has(ch)) {
          hasNonStop = true;
          break;
        }
      }
      if (hasNonStop) tokens.push(gram);
    }
  }

  return tokens;
}

function tokenizeDocument(text: string): Map<string, number> {
  const freq = new Map<string, number>();
  const lower = text.toLowerCase();

  // English words
  const engWords = lower.match(/[a-z]{3,}/g) || [];
  for (const w of engWords) {
    if (!STOPWORDS.has(w)) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }
  }

  // Chinese n-grams (2-6 chars)
  const cjkChars = lower.replace(/[^\u4e00-\u9fa5]/g, "");
  for (let n = 2; n <= 6; n++) {
    for (let i = 0; i <= cjkChars.length - n; i++) {
      const gram = cjkChars.slice(i, i + n);
      let hasNonStop = false;
      for (const ch of gram) {
        if (!STOPWORDS.has(ch)) {
          hasNonStop = true;
          break;
        }
      }
      if (hasNonStop) {
        freq.set(gram, (freq.get(gram) || 0) + 1);
      }
    }
  }

  return freq;
}

function parseFrontmatterTags(content: string): string[] {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return [];
  const raw = match[1];
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0 && line.slice(0, idx).trim() === "tags") {
      let value = line.slice(idx + 1).trim();
      if (value.startsWith("[") && value.endsWith("]")) {
        return value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["'](.*)["']$/, "$1"));
      }
    }
  }
  return [];
}

function parseFrontmatterTitle(content: string): string | undefined {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return undefined;
  const raw = match[1];
  for (const line of raw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0 && line.slice(0, idx).trim() === "title") {
      return line.slice(idx + 1).trim().replace(/^["'](.*)["']$/, "$1");
    }
  }
  return undefined;
}

/**
 * BM25 search over a set of chunks.
 * Parameters: k1=1.5, b=0.75
 * Frontmatter bonus: tag match +10, title match +5
 */
export function bm25Search(query: string, chunks: Chunk[]): Bm25Result[] {
  const queryTokens = extractQueryTokens(query);
  if (queryTokens.length === 0) return [];

  // Pre-tokenize all chunks
  const docFreqs: Map<string, number>[] = [];
  const docLens: number[] = [];
  let totalDocLen = 0;

  for (const chunk of chunks) {
    const freq = tokenizeDocument(chunk.content);
    docFreqs.push(freq);
    const len = chunk.content.length;
    docLens.push(len);
    totalDocLen += len;
  }

  const N = chunks.length;
  const avgDocLen = N > 0 ? totalDocLen / N : 1;
  const k1 = 1.5;
  const b = 0.75;

  // Compute DF for each query token
  const dfMap = new Map<string, number>();
  for (const token of queryTokens) {
    let df = 0;
    for (const freq of docFreqs) {
      if (freq.has(token)) df++;
    }
    dfMap.set(token, df);
  }

  const results: Bm25Result[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const freq = docFreqs[i];
    const docLen = docLens[i];
    let score = 0;

    for (const token of queryTokens) {
      const f = freq.get(token) || 0;
      if (f === 0) continue;
      const nq = dfMap.get(token) || 0;
      const idf = Math.log((N - nq + 0.5) / (nq + 0.5) + 1);
      const denom = f + k1 * (1 - b + b * (docLen / avgDocLen));
      score += idf * ((f * (k1 + 1)) / denom);
    }

    // Frontmatter bonus
    const fullContent = chunk.content;
    const fmTags = parseFrontmatterTags(fullContent);
    const fmTitle = parseFrontmatterTitle(fullContent);
    const basenameLower = basename(chunk.metadata.filePath, ".md").toLowerCase();

    for (const token of queryTokens) {
      if (fmTags.some((t) => t.toLowerCase().includes(token))) {
        score += 10;
      }
      if (fmTitle && fmTitle.toLowerCase().includes(token)) {
        score += 5;
      }
      if (basenameLower.includes(token)) {
        score += 5;
      }
    }

    if (score > 0) {
      results.push({ id: chunk.id, score, chunk });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ── Structured Search ───────────────────────────────────────────────────────

interface StructuredResult {
  id: string;
  score: number;
  chunk: Chunk;
}

/**
 * Structured search: type matching, tag matching, title matching.
 */
export function structuredSearch(query: string, chunks: Chunk[]): StructuredResult[] {
  const lower = query.toLowerCase();
  const tokens = extractQueryTokens(query);
  if (tokens.length === 0) return [];

  // Type hints
  const typeHints: string[] = [];
  if (lower.includes("概念")) typeHints.push("concept");
  if (lower.includes("实体")) typeHints.push("entity");
  if (lower.includes("来源")) typeHints.push("source");

  const results: StructuredResult[] = [];

  for (const chunk of chunks) {
    let score = 0;
    const meta = chunk.metadata;

    // Type match
    if (typeHints.length > 0 && typeHints.includes(meta.type)) {
      score += 15;
    }

    // Tag match
    for (const token of tokens) {
      for (const tag of meta.tags) {
        if (tag.toLowerCase().includes(token)) {
          score += 8;
        }
      }
    }

    // Title / basename match
    const basenameLower = basename(meta.filePath, ".md").toLowerCase();
    for (const token of tokens) {
      if (meta.title.toLowerCase().includes(token)) {
        score += 6;
      }
      if (basenameLower.includes(token)) {
        score += 4;
      }
      if (meta.heading && meta.heading.toLowerCase().includes(token)) {
        score += 3;
      }
    }

    if (score > 0) {
      results.push({ id: chunk.id, score, chunk });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ── Vector Search ───────────────────────────────────────────────────────────

/**
 * Vector search using the active embedding provider and vector store.
 */
export async function vectorSearch(
  query: string,
  topK: number
): Promise<VectorSearchResult[]> {
  const provider = getActiveProvider();
  if (!provider) {
    logger.info("[HybridSearch] No embedding provider available");
    return [];
  }

  const embedding = await provider.getEmbedding(query);
  if (!embedding) {
    logger.warn("[HybridSearch] Failed to get embedding for query");
    return [];
  }

  const store = getVectorStore(provider.name);
  return store.search(embedding, topK);
}

// ── RRF Fusion ──────────────────────────────────────────────────────────────

interface RankedItem {
  id: string;
  score: number;
}

/**
 * Reciprocal Rank Fusion (RRF) for merging multiple ranked lists.
 */
export function reciprocalRankFusion(
  resultLists: Array<Array<{ id: string; score: number }>>,
  k = 60
): RankedItem[] {
  const scores = new Map<string, number>();

  for (const list of resultLists) {
    for (let i = 0; i < list.length; i++) {
      const id = list[i].id;
      scores.set(id, (scores.get(id) || 0) + 1 / (k + i + 1));
    }
  }

  return Array.from(scores.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

// ── Wiki Chunk Loading ──────────────────────────────────────────────────────

async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function listWikiFiles(dirPath: string, basePath: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await listWikiFiles(fullPath, basePath);
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(relative(basePath, fullPath));
      }
    }
  } catch {
    // ignore
  }
  return files;
}

// Cache for wiki chunks to avoid re-reading files on every search
let wikiChunksCache: { chunks: Chunk[]; mtime: number } | null = null;

async function getCachedKbChunks(basePath: string): Promise<Chunk[]> {
  // Simple cache: check if any kb file has been modified since last cache
  const wikiDir = join(basePath, "wiki");
  const rawDir = join(basePath, "raw");

  if (wikiChunksCache) {
    // Check if cache is still valid (no files modified after cache time)
    let cacheValid = true;
    const checkDirs = [wikiDir, rawDir].filter((d) => existsSync(d));
    for (const dir of checkDirs) {
      const files = await listWikiFiles(dir, basePath);
      for (const f of files) {
        try {
          const st = await stat(resolveKbPath(f));
          if (st.mtimeMs > wikiChunksCache.mtime) {
            cacheValid = false;
            break;
          }
        } catch {
          cacheValid = false;
          break;
        }
      }
      if (!cacheValid) break;
    }
    if (cacheValid) return wikiChunksCache.chunks;
  }

  const chunks = await loadAllKbChunks(basePath);
  wikiChunksCache = { chunks, mtime: Date.now() };
  return chunks;
}

/**
 * Load all wiki files and chunk them.
 */
async function loadAllKbChunks(basePath: string): Promise<Chunk[]> {
  const allChunks: Chunk[] = [];

  // Load wiki chunks
  const wikiDir = join(basePath, "wiki");
  if (existsSync(wikiDir)) {
    const wikiFiles = await listWikiFiles(wikiDir, basePath);
    for (const relPath of wikiFiles) {
      const content = await safeReadFile(resolveKbPath(relPath));
      if (!content.trim()) continue;
      const chunks = chunkDocument(relPath, content, {});
      allChunks.push(...chunks);
    }
  }

  // Load raw file chunks
  const rawDir = join(basePath, "raw");
  if (existsSync(rawDir)) {
    const rawFiles = await listWikiFiles(rawDir, basePath);
    for (const relPath of rawFiles) {
      try {
        const content = await extractTextFromFile(resolveKbPath(relPath));
        if (!content.trim()) continue;
        const fileName = basename(relPath, extname(relPath));
        const chunks = chunkDocument(relPath, content, { title: fileName });
        allChunks.push(...chunks);
      } catch {
        // Skip files that can't be extracted
      }
    }
  }

  return allChunks;
}

/**
 * Load chunks only for specific files (optimization for hybrid search).
 */
async function loadChunksForFiles(filePaths: Set<string>): Promise<Chunk[]> {
  const allChunks: Chunk[] = [];
  for (const filePath of filePaths) {
    let content: string;
    try {
      if (filePath.startsWith("raw/")) {
        content = await extractTextFromFile(resolveKbPath(filePath));
      } else {
        content = await safeReadFile(resolveKbPath(filePath));
      }
    } catch {
      continue;
    }
    if (!content.trim()) continue;
    const fileName = basename(filePath, extname(filePath));
    const chunks = chunkDocument(filePath, content, { title: fileName });
    allChunks.push(...chunks);
  }
  return allChunks;
}

// ── Graph Channel Search ────────────────────────────────────────────────────

interface GraphChannelResult {
  id: string;
  score: number;
  chunk: Chunk;
}

/**
 * Graph channel: query tokens → graph node matching → neighbor traversal →
 * load chunks from related files → score by relevance.
 */
async function graphChannelSearch(query: string, chunks: Chunk[]): Promise<GraphChannelResult[]> {
  const graphStore = getGraphStore();
  if (!graphStore.isAvailable()) {
    return [];
  }

  const tokens = extractQueryTokens(query);
  if (tokens.length === 0) return [];

  // Find matching graph nodes by label
  const matchedNodeIds = new Set<string>();
  for (const token of tokens) {
    const nodes = graphStore.findNodesByLabel(token, 20);
    for (const node of nodes) {
      matchedNodeIds.add(node.id);
    }
  }

  if (matchedNodeIds.size === 0) {
    // Fallback: try to find nodes whose labels contain ANY query token
    // (broader match than the exact token search above)
    for (const token of tokens) {
      const nodes = graphStore.findNodesByLabel(token, 50);
      for (const node of nodes) {
        matchedNodeIds.add(node.id);
      }
    }
    if (matchedNodeIds.size > 0) {
      logger.info(`[GraphChannel] Fallback matched ${matchedNodeIds.size} nodes by partial label`);
    }
  }

  if (matchedNodeIds.size === 0) {
    logger.info(`[GraphChannel] No nodes matched for query tokens: ${tokens.join(", ")}`);
    return [];
  }

  // Traverse neighbors (1-2 hops) to expand context
  const allRelatedNodeIds = new Set<string>(matchedNodeIds);
  const relatedFiles = new Set<string>();

  for (const nodeId of matchedNodeIds) {
    // 1-hop neighbors
    const neighbors1 = graphStore.getNodeNeighbors(nodeId, 1);
    for (const n of neighbors1.nodes) {
      allRelatedNodeIds.add(n.id);
      if (n.sourceFile) relatedFiles.add(n.sourceFile);
    }
    // 2-hop neighbors (lighter, only nodes)
    for (const edge of neighbors1.edges) {
      const neighborId = edge.source === nodeId ? edge.target : edge.source;
      const neighbors2 = graphStore.getNodeNeighbors(neighborId, 1);
      for (const n of neighbors2.nodes) {
        allRelatedNodeIds.add(n.id);
        if (n.sourceFile) relatedFiles.add(n.sourceFile);
      }
    }
  }

  if (relatedFiles.size === 0) {
    return [];
  }

  logger.info(`[GraphChannel] Matched ${matchedNodeIds.size} nodes, ${allRelatedNodeIds.size} total nodes, ${relatedFiles.size} files`);

  // Filter chunks to only those from related files
  const relatedChunks = chunks.filter((c) => relatedFiles.has(c.metadata.filePath));
  if (relatedChunks.length === 0) {
    return [];
  }

  // Score related chunks using BM25 on the subset
  const bm25Results = bm25Search(query, relatedChunks);

  // Use BM25 scores from related chunks
  // and apply a boost factor since these chunks came from graph-relevant files
  const results: GraphChannelResult[] = [];
  for (const r of bm25Results) {
    results.push({
      id: r.id,
      score: r.score * 1.5, // boost graph-relevant chunks
      chunk: r.chunk,
    });
  }

  return results.slice(0, 5);
}

// ── Hybrid Search ───────────────────────────────────────────────────────────

export interface HybridSearchResult {
  id: string;
  score: number;
  content: string;
  metadata: object;
}

/**
 * Hybrid search combining vector, BM25, structured, and graph channels with RRF fusion.
 *
 * Strategy:
 * 1. If embedding available:
 *    - Vector search top-5
 *    - BM25 on files from vector results (optimized, not full scan)
 *    - Structured search on files from vector results
 *    - Graph channel on all knowledge base chunks
 *    - RRF fusion → top-5
 * 2. If embedding unavailable:
 *    - BM25 full scan top-5
 *    - Structured search full scan top-5
 *    - Graph channel on all knowledge base chunks
 *    - RRF fusion → top-5
 * 3. Filter by relevance threshold (score < 0.03 discarded)
 */
export async function hybridSearch(query: string): Promise<HybridSearchResult[]> {
  const startTime = Date.now();
  const basePath = getKbBasePath();
  const embeddingEnabled = isEmbeddingAvailable();

  logger.info(`[HybridSearch] query="${query.slice(0, 50)}...", embedding=${embeddingEnabled}`);

  let vectorResults: VectorSearchResult[] = [];
  let bm25Results: Bm25Result[] = [];
  let structuredResults: StructuredResult[] = [];
  let graphResults: GraphChannelResult[] = [];
  let allChunks: Chunk[] = [];

  if (embeddingEnabled) {
    // Path 1: embedding available
    vectorResults = await vectorSearch(query, 5);
    logger.info(`[HybridSearch] vector results: ${vectorResults.length}`);
  }

  // BM25 and structured search always run on the full corpus so they can
  // discover files that vector search missed (e.g. keyword matches where
  // embedding failed). The performance difference is negligible for typical
  // KB sizes (<1000 chunks).
  allChunks = await getCachedKbChunks(basePath);
  logger.info(`[HybridSearch] Loaded ${allChunks.length} chunks from wiki`);
  bm25Results = bm25Search(query, allChunks).slice(0, 5);
  structuredResults = structuredSearch(query, allChunks).slice(0, 5);

  // Graph channel: needs all chunks (or load if not already loaded)
  if (allChunks.length === 0) {
    allChunks = await getCachedKbChunks(basePath);
  }
  graphResults = await graphChannelSearch(query, allChunks);
  logger.info(`[HybridSearch] graph results: ${graphResults.length}`);

  // Build result lists for RRF
  const lists: Array<Array<{ id: string; score: number }>> = [];

  if (vectorResults.length > 0) {
    lists.push(vectorResults.map((r) => ({ id: r.id, score: r.score })));
  }
  if (bm25Results.length > 0) {
    lists.push(bm25Results.map((r) => ({ id: r.id, score: r.score })));
  }
  if (structuredResults.length > 0) {
    lists.push(structuredResults.map((r) => ({ id: r.id, score: r.score })));
  }
  if (graphResults.length > 0) {
    lists.push(graphResults.map((r) => ({ id: r.id, score: r.score })));
  }

  logger.info(
    `[HybridSearch] RRF input — vector=${vectorResults.length}, BM25=${bm25Results.length}, structured=${structuredResults.length}, graph=${graphResults.length}`
  );

  if (lists.length === 0) {
    logger.info(`[HybridSearch] No results found, took ${Date.now() - startTime}ms`);
    return [];
  }

  const fused = reciprocalRankFusion(lists);

  // Build a lookup map for all results
  const resultMap = new Map<string, HybridSearchResult>();

  for (const vr of vectorResults) {
    resultMap.set(vr.id, {
      id: vr.id,
      score: vr.score,
      content: vr.content,
      metadata: vr.metadata,
    });
  }
  for (const br of bm25Results) {
    if (!resultMap.has(br.id)) {
      resultMap.set(br.id, {
        id: br.id,
        score: br.score,
        content: br.chunk.content,
        metadata: br.chunk.metadata,
      });
    }
  }
  for (const sr of structuredResults) {
    if (!resultMap.has(sr.id)) {
      resultMap.set(sr.id, {
        id: sr.id,
        score: sr.score,
        content: sr.chunk.content,
        metadata: sr.chunk.metadata,
      });
    }
  }
  for (const gr of graphResults) {
    if (!resultMap.has(gr.id)) {
      resultMap.set(gr.id, {
        id: gr.id,
        score: gr.score,
        content: gr.chunk.content,
        metadata: gr.chunk.metadata,
      });
    }
  }

  // Take top-5 — no relevance threshold. If a channel found it and RRF
  // ranked it in the top-5, it is relevant. Raw scores from different
  // channels (cosine similarity, BM25, structured, graph) are not directly
  // comparable, so a single numeric threshold would incorrectly filter valid
  // results (e.g. BM25 scores can legitimately be < 0.03).
  const finalResults: HybridSearchResult[] = [];

  for (const item of fused.slice(0, 5)) {
    const full = resultMap.get(item.id);
    if (full) {
      finalResults.push({
        ...full,
        score: item.score, // use fused RRF score
      });
    }
  }

  logger.info(`[HybridSearch] Found ${finalResults.length} results, took ${Date.now() - startTime}ms`);
  return finalResults;
}
