/**
 * Entity Extractor - Async LLM-based entity/relationship extraction
 * Triggered as a background job after file indexing completes.
 */

import { chatSend } from "../gateway/client.js";
import { logger } from "../utils/logger.js";
import { getGraphStore, GraphNode, GraphEdge } from "./graph-store.js";
import { invalidateGraphCache } from "./graph.js";
import { setGraphExtractionStatus } from "./lightrag-index-status.js";

const EXTRACTION_SESSION = "kb-extract";
const MAX_CHUNK_SIZE = 6000;
const MAX_CHUNKS = 10;

interface ExtractedEntity {
  name: string;
  description: string;
  importance: number;
  type: "concept" | "entity" | "fact";
}

interface ExtractedRelationship {
  from: string;
  to: string;
  relation: string;
}

interface ExtractionResult {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

function splitIntoChunks(text: string, maxSize = MAX_CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  let current = "";

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  for (const p of paragraphs) {
    if (current.length + p.length + 2 > maxSize && current.length > 0) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text];
}

function buildExtractionPrompt(chunk: string, fileName: string, chunkIndex: number, totalChunks: number): string {
  return `你是一位知识图谱工程师。请从以下文档片段中提取实体和关系，用于构建知识图谱。

来源文件：${fileName}
片段：${chunkIndex + 1}/${totalChunks}

内容：
\`\`\`
${chunk.slice(0, MAX_CHUNK_SIZE)}
\`\`\`

请提取以下内容（JSON 格式返回，不要加 markdown 代码块）：

1. **entities**：实体和概念列表
   - name: 实体/概念名称
   - description: 一句话定义或描述
   - importance: 重要性 1-10
   - type: "concept"（概念/原理）或 "entity"（产品/公司/人物/项目）

2. **relationships**：实体之间的关系
   - from: 源实体名称
   - to: 目标实体名称
   - relation: 关系类型（如"属于"、"实现"、"依赖"、"对比"、"包含"、"使用"等）

如果片段内容为空或属于参考文献/附录等次要内容，返回空结果。

JSON 格式：
{
  "entities": [
    {"name": "...", "description": "...", "importance": 8, "type": "concept"}
  ],
  "relationships": [
    {"from": "...", "to": "...", "relation": "..."}
  ]
}

只返回纯 JSON，不要任何额外文字。`;
}

function parseExtractionResult(replyText: string): ExtractionResult {
  const defaultResult: ExtractionResult = { entities: [], relationships: [] };
  if (!replyText.trim()) return defaultResult;

  const jsonMatch = replyText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return defaultResult;

  try {
    const data = JSON.parse(jsonMatch[0]);
    const entities: ExtractedEntity[] = [];
    const relationships: ExtractedRelationship[] = [];

    if (Array.isArray(data.entities)) {
      for (const e of data.entities) {
        if (e?.name) {
          entities.push({
            name: String(e.name),
            description: typeof e.description === "string" ? e.description : "",
            importance: typeof e.importance === "number" ? Math.min(10, Math.max(1, e.importance)) : 5,
            type: e.type === "entity" ? "entity" : "concept",
          });
        }
      }
    }

    if (Array.isArray(data.relationships)) {
      for (const r of data.relationships) {
        if (r?.from && r?.to) {
          relationships.push({
            from: String(r.from),
            to: String(r.to),
            relation: typeof r.relation === "string" ? r.relation : "relates_to",
          });
        }
      }
    }

    return { entities, relationships };
  } catch {
    return defaultResult;
  }
}

function deduplicateEntities(entities: ExtractedEntity[]): ExtractedEntity[] {
  const seen = new Map<string, ExtractedEntity>();
  for (const e of entities) {
    const key = e.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || e.importance > existing.importance) {
      seen.set(key, e);
    }
  }
  return Array.from(seen.values());
}

function deduplicateRelationships(rels: ExtractedRelationship[]): ExtractedRelationship[] {
  const seen = new Set<string>();
  const result: ExtractedRelationship[] = [];
  for (const r of rels) {
    const key = `${r.from.toLowerCase()}|${r.relation.toLowerCase()}|${r.to.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(r);
    }
  }
  return result;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/**
 * Extract entities and relationships from file content and store in graph-store.
 * This is a background job - it runs asynchronously and does not block.
 */
export async function extractEntitiesForFile(filePath: string, content: string): Promise<void> {
  const graphStore = getGraphStore();
  if (!graphStore.isAvailable()) {
    setGraphExtractionStatus(filePath, "skipped", { errorMessage: "graph store unavailable" });
    logger.info(`[EntityExtractor] Graph store not available, skipping extraction for ${filePath}`);
    return;
  }
  setGraphExtractionStatus(filePath, "processing", { nodeCount: 0, edgeCount: 0, errorMessage: null });

  // Clean up old graph entries for this file before re-extracting
  try {
    graphStore.deleteByFile(filePath);
    invalidateGraphCache();
    logger.info(`[EntityExtractor] Cleaned old graph entries for ${filePath}`);
  } catch (err) {
    logger.warn(`[EntityExtractor] Failed to clean old entries for ${filePath}:`, err);
  }

  const fileName = filePath.split("/").pop() || filePath;

  try {
    let chunks = splitIntoChunks(content);
    if (chunks.length > MAX_CHUNKS) {
      logger.warn(`[EntityExtractor] Too many chunks (${chunks.length}), truncating to ${MAX_CHUNKS}`);
      chunks = chunks.slice(0, MAX_CHUNKS);
    }

    logger.info(`[EntityExtractor] Starting extraction for ${fileName}: ${chunks.length} chunks`);

    const allEntities: ExtractedEntity[] = [];
    const allRelationships: ExtractedRelationship[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const prompt = buildExtractionPrompt(chunks[i], fileName, i, chunks.length);

      let result = await chatSend(EXTRACTION_SESSION, prompt);
      if (result.error) {
        logger.warn(`[EntityExtractor] Chunk ${i + 1} failed, retrying...`, result.error);
        await new Promise((r) => setTimeout(r, 2000));
        result = await chatSend(EXTRACTION_SESSION, prompt);
        if (result.error) {
          logger.warn(`[EntityExtractor] Chunk ${i + 1} retry failed:`, result.error);
          continue;
        }
      }

      const extraction = parseExtractionResult(result.content || "");
      if (extraction.entities.length === 0 && extraction.relationships.length === 0) {
        logger.info(`[EntityExtractor] Chunk ${i + 1}: no entities found`);
        continue;
      }

      allEntities.push(...extraction.entities);
      allRelationships.push(...extraction.relationships);
      logger.info(
        `[EntityExtractor] Chunk ${i + 1}: ${extraction.entities.length} entities, ${extraction.relationships.length} relationships`
      );
    }

    const dedupedEntities = deduplicateEntities(allEntities);
    const dedupedRelationships = deduplicateRelationships(allRelationships);

    // Convert to graph nodes and edges
    const nodes: GraphNode[] = [];
    const nodeIdMap = new Map<string, string>(); // normalized name -> node id

    for (const e of dedupedEntities) {
      const nodeId = `kg:${slugify(e.name)}`;
      nodeIdMap.set(e.name.toLowerCase(), nodeId);

      nodes.push({
        id: nodeId,
        label: e.name,
        type: e.type,
        description: e.description,
        sourceFile: filePath,
        importance: e.importance * 10, // scale 1-10 to 10-100
      });
    }

    const edges: GraphEdge[] = [];
    for (const r of dedupedRelationships) {
      const sourceId = nodeIdMap.get(r.from.toLowerCase());
      const targetId = nodeIdMap.get(r.to.toLowerCase());
      if (sourceId && targetId && sourceId !== targetId) {
        edges.push({
          source: sourceId,
          target: targetId,
          relation: r.relation,
          strength: 2,
        });
      }
    }

    // Batch write to graph store
    if (nodes.length > 0) {
      graphStore.addNodesBatch(nodes);
    }
    if (edges.length > 0) {
      graphStore.addEdgesBatch(edges);
    }
    if (nodes.length > 0 || edges.length > 0) {
      invalidateGraphCache();
    }

    logger.info(
      `[EntityExtractor] Completed for ${fileName}: ${nodes.length} nodes, ${edges.length} edges written to graph store`
    );
    setGraphExtractionStatus(filePath, "completed", {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      errorMessage: null,
    });
  } catch (error) {
    setGraphExtractionStatus(filePath, "failed", {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    logger.error(`[EntityExtractor] Extraction failed for ${fileName}:`, error);
  }
}
