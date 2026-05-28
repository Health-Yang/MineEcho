/**
 * Memory Tree Summarizer
 * LLM-based summary generation with fallback to inert summarizer
 */

import { logger } from "../../utils/logger.js";
import type { L0Chunk, L1Summary, L2Summary, L3Summary, SummaryOutput, MemoryEntity, EntityKind } from "./types.js";
import { DEFAULT_MEMORY_TREE_CONFIG } from "./types.js";
import { chatSend } from "../../gateway/client.js";

// ============================================================================
// Prompt Templates
// ============================================================================

const L1_SUMMARY_PROMPT = `你是 MineEcho 的记忆系统。请将以下对话片段总结成一个简洁的日摘要。

要求：
1. 保留关键决策、结论、待办事项
2. 提取重要的实体（人名、项目名、技术名词）
3. 识别关系（谁做了什么、使用了什么技术）
4. 摘要长度约 300-500 字
5. 使用中文

对话片段：
{content}

请生成摘要:`;

const L2_SUMMARY_PROMPT = `你是 MineEcho 的记忆系统。请将以下日摘要合并成一个周摘要。

要求：
1. 总结本周的主要活动和进展
2. 提取关键里程碑和成果
3. 识别重复出现的主题或关注点
4. 摘要长度约 500-700 字
5. 使用中文

日摘要：
{content}

请生成周摘要:`;

const L3_SUMMARY_PROMPT = `你是 MineEcho 的记忆系统。请将以下周摘要合并成一个月的记忆回顾。

要求：
1. 总结本月的主要主题和趋势
2. 提取重要成就和教训
3. 识别长期关注的项目或话题
4. 摘要长度约 800-1000 字
5. 使用中文

周摘要：
{content}

请生成月摘要:`;

const ENTITY_EXTRACTION_PROMPT = `从以下内容中提取实体和关系。

实体类型：person（人名）, project（项目名）, concept（概念）, technology（技术）, location（地点）, organization（组织）, event（事件）

关系类型：uses（使用）, related_to（关联）, part_of（属于）, depends_on（依赖）, created_by（创建）

要求：
1. 只提取明确提到的实体
2. 关系必须基于文本中明确表达的关联
3. 返回 JSON 格式

内容：
{content}

返回格式：
{
  "entities": [{"name": "名称", "kind": "类型", "description": "描述"}],
  "relations": [{"from": "实体A", "to": "实体B", "label": "关系类型", "evidence": "证据文本"}]
}`;

// ============================================================================
// Token Estimation
// ============================================================================

/**
 * Rough token estimation (Chinese ≈ 2 chars/token, English ≈ 4 chars/token)
 */
export function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[一-龥]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars / 2 + otherChars / 4);
}

/**
 * Truncate text to fit within token budget
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const currentTokens = estimateTokens(text);
  if (currentTokens <= maxTokens) {
    return text;
  }

  // Simple truncation: estimate ratio and cut
  const ratio = maxTokens / currentTokens;
  const targetLength = Math.floor(text.length * ratio * 0.9); // Safety margin

  // Try to cut at paragraph or sentence boundary
  const paragraphs = text.split(/\n\n+/);
  let result = "";

  for (const para of paragraphs) {
    if (estimateTokens(result + para) > maxTokens) {
      break;
    }
    result += (result ? "\n\n" : "") + para;
  }

  // If still too long, cut at sentence
  if (estimateTokens(result) > maxTokens) {
    const sentences = text.split(/[。！？\n]/);
    result = "";
    for (const sentence of sentences) {
      if (estimateTokens(result + sentence) > maxTokens) {
        break;
      }
      result += sentence + "。";
    }
  }

  return result || text.slice(0, maxTokens * 2);
}

// ============================================================================
// LLM Helper (wrapper around chatSend)
// ============================================================================

/**
 * Simple wrapper that calls the BFF chatSend and returns text response.
 * Session ID is fixed for memory-system calls to isolate from user conversations.
 */
async function callLLM(prompt: string, maxTokens: number): Promise<string> {
  const result = await chatSend("__memory-system__", prompt, { model: undefined });
  if (result.error) {
    throw new Error(result.error);
  }
  return result.content ?? "";
}

// ============================================================================
// LLM Summarizer
// ============================================================================

export async function generateL1SummaryFromChunks(chunks: L0Chunk[]): Promise<SummaryOutput> {
  if (chunks.length === 0) {
    return { summary: "", tokenCount: 0, keyPoints: [], entities: [], relations: [] };
  }

  // Combine chunk contents with token budget
  const combinedContent = chunks
    .map((c, i) => `[片段${i + 1}]\n${c.content}`)
    .join("\n\n");

  const maxTokens = DEFAULT_MEMORY_TREE_CONFIG.l1SummaryTokens * 2; // Allow some overhead for prompt
  const truncatedContent = truncateToTokens(combinedContent, maxTokens);

  const prompt = L1_SUMMARY_PROMPT.replace("{content}", truncatedContent);

  try {
    const response = await callLLM(prompt, DEFAULT_MEMORY_TREE_CONFIG.l1SummaryTokens);

    const summary = response.trim();
    const tokenCount = estimateTokens(summary);

    // Extract key points (simple heuristic: bullet points or numbered items)
    const keyPoints = summary
      .split(/\n/)
      .filter((line: string) => line.match(/^[●•\-\d\.]/))
      .map((line: string) => line.replace(/^[●•\-\d\.\s]+/, "").trim());

    // Extract entities and relations
    const entityResult = await extractEntities(truncatedContent);

    return {
      summary,
      tokenCount,
      keyPoints,
      entities: entityResult.entities,
      relations: entityResult.relations,
    };
  } catch (err) {
    logger.error("[Summarizer] LLM L1 summary failed, using inert fallback:", err);
    return generateInertL1Summary(chunks);
  }
}

export async function generateL2SummaryFromL1(l1Summaries: L1Summary[]): Promise<SummaryOutput> {
  if (l1Summaries.length === 0) {
    return { summary: "", tokenCount: 0, keyPoints: [], entities: [], relations: [] };
  }

  const combinedContent = l1Summaries
    .map((s, i) => `[第${i + 1}天]\n${s.summary}`)
    .join("\n\n");

  const maxTokens = DEFAULT_MEMORY_TREE_CONFIG.l2SummaryTokens * 2;
  const truncatedContent = truncateToTokens(combinedContent, maxTokens);

  const prompt = L2_SUMMARY_PROMPT.replace("{content}", truncatedContent);

  try {
    const response = await callLLM(prompt, DEFAULT_MEMORY_TREE_CONFIG.l2SummaryTokens);

    const summary = response.trim();
    const tokenCount = estimateTokens(summary);
    const keyPoints = summary.split(/\n/).filter((line: string) => line.match(/^[●•\-\d\.]/)).map((line: string) => line.replace(/^[●•\-\d\.\s]+/, "").trim());

    return {
      summary,
      tokenCount,
      keyPoints,
      entities: [],
      relations: [],
    };
  } catch (err) {
    logger.error("[Summarizer] LLM L2 summary failed, using inert fallback:", err);
    return generateInertL2Summary(l1Summaries);
  }
}

export async function generateL3SummaryFromL2(l2Summaries: L2Summary[]): Promise<SummaryOutput> {
  if (l2Summaries.length === 0) {
    return { summary: "", tokenCount: 0, keyPoints: [], entities: [], relations: [] };
  }

  const combinedContent = l2Summaries
    .map((s, i) => `[第${i + 1}周]\n${s.summary}`)
    .join("\n\n");

  const maxTokens = DEFAULT_MEMORY_TREE_CONFIG.l3SummaryTokens * 2;
  const truncatedContent = truncateToTokens(combinedContent, maxTokens);

  const prompt = L3_SUMMARY_PROMPT.replace("{content}", truncatedContent);

  try {
    const response = await callLLM(prompt, DEFAULT_MEMORY_TREE_CONFIG.l3SummaryTokens);

    const summary = response.trim();
    const tokenCount = estimateTokens(summary);
    const keyPoints = summary.split(/\n/).filter((line: string) => line.match(/^[●•\-\d\.]/)).map((line: string) => line.replace(/^[●•\-\d\.\s]+/, "").trim());

    return {
      summary,
      tokenCount,
      keyPoints,
      entities: [],
      relations: [],
    };
  } catch (err) {
    logger.error("[Summarizer] LLM L3 summary failed, using inert fallback:", err);
    return generateInertL3Summary(l2Summaries);
  }
}

// ============================================================================
// Inert Summarizer (Fallback)
// ============================================================================

function generateInertL1Summary(chunks: L0Chunk[]): SummaryOutput {
  // Simple concatenation of first and last chunks
  const sorted = [...chunks].sort((a, b) => a.createdAt - b.createdAt);
  const firstContent = sorted.slice(0, 2).map(c => c.content).join("\n\n");
  const lastContent = sorted.slice(-2).map(c => c.content).join("\n\n");

  const summary = `日记忆摘要（自动生成）\n\n开头：\n${firstContent}\n\n...（省略中间内容）...\n\n结尾：\n${lastContent}`;

  return {
    summary,
    tokenCount: estimateTokens(summary),
    keyPoints: [],
    entities: [],
    relations: [],
  };
}

function generateInertL2Summary(l1Summaries: L1Summary[]): SummaryOutput {
  const summary = l1Summaries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => `【${s.date}】${s.summary.slice(0, 200)}...`)
    .join("\n\n");

  return {
    summary,
    tokenCount: estimateTokens(summary),
    keyPoints: [],
    entities: [],
    relations: [],
  };
}

function generateInertL3Summary(l2Summaries: L2Summary[]): SummaryOutput {
  const summary = l2Summaries
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map(s => `【${s.weekStart}】${s.summary.slice(0, 300)}...`)
    .join("\n\n");

  return {
    summary,
    tokenCount: estimateTokens(summary),
    keyPoints: [],
    entities: [],
    relations: [],
  };
}

// ============================================================================
// Entity Extraction
// ============================================================================

export async function extractEntities(content: string): Promise<{
  entities: Array<{ name: string; kind: EntityKind; description?: string }>;
  relations: Array<{ from: string; to: string; label: string; evidence: string }>;
}> {
  // Quick check for Chinese content
  const hasChinese = /[一-龥]/.test(content);
  if (!hasChinese) {
    // English content - use simple regex extraction
    return extractEnglishEntities(content);
  }

  const maxTokens = 2000;
  const truncated = truncateToTokens(content, maxTokens);
  const prompt = ENTITY_EXTRACTION_PROMPT.replace("{content}", truncated);

  try {
    const response = await callLLM(prompt, 500);

    // Try to parse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        entities: (parsed.entities || []).map((e: { name: string; kind: string; description?: string }) => ({
          name: e.name,
          kind: e.kind as EntityKind,
          description: e.description,
        })),
        relations: (parsed.relations || []).map((r: { from: string; to: string; label: string; evidence: string }) => ({
          from: r.from,
          to: r.to,
          label: r.label,
          evidence: r.evidence,
        })),
      };
    }
  } catch (err) {
    logger.warn("[Summarizer] Entity extraction parse failed:", err);
  }

  // Fallback: empty result
  return { entities: [], relations: [] };
}

function extractEnglishEntities(content: string): {
  entities: Array<{ name: string; kind: EntityKind; description?: string }>;
  relations: Array<{ from: string; to: string; label: string; evidence: string }>;
} {
  // Simple entity patterns for English
  const entities: Array<{ name: string; kind: EntityKind; description?: string }> = [];
  const seen = new Set<string>();

  // Capitalized words (potential entities)
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;
  while ((match = capitalizedPattern.exec(content)) !== null) {
    const name = match[1];
    if (!seen.has(name) && name.length > 2) {
      seen.add(name);
      // Check context to determine kind
      const kind: EntityKind = "concept";
      entities.push({ name, kind });
    }
  }

  return { entities, relations: [] };
}

// ============================================================================
// Summary Generation Helpers
// ============================================================================

export function createL1Summary(
  userId: string,
  date: string,
  chunks: L0Chunk[],
  output: SummaryOutput
): L1Summary {
  return {
    id: `l1-${userId}-${date}`,
    userId,
    date,
    summary: output.summary,
    tokenCount: output.tokenCount,
    childIds: chunks.map(c => c.id),
    createdAt: Date.now(),
  };
}

export function createL2Summary(
  userId: string,
  weekStart: string,
  l1Summaries: L1Summary[],
  output: SummaryOutput
): L2Summary {
  return {
    id: `l2-${userId}-${weekStart}`,
    userId,
    weekStart,
    summary: output.summary,
    tokenCount: output.tokenCount,
    childIds: l1Summaries.map(s => s.id),
    createdAt: Date.now(),
  };
}

export function createL3Summary(
  userId: string,
  month: string,
  l2Summaries: L2Summary[],
  output: SummaryOutput
): L3Summary {
  return {
    id: `l3-${userId}-${month}`,
    userId,
    month,
    summary: output.summary,
    tokenCount: output.tokenCount,
    childIds: l2Summaries.map(s => s.id),
    createdAt: Date.now(),
  };
}

// ============================================================================
// Batch Summary Generation
// ============================================================================

export async function generateMissingDailySummaries(
  userId: string,
  existingSummaries: Set<string>,
  chunksByDate: Map<string, L0Chunk[]>
): Promise<L1Summary[]> {
  const summaries: L1Summary[] = [];

  for (const [date, chunks] of chunksByDate) {
    if (existingSummaries.has(date)) continue;

    if (chunks.length > 0) {
      logger.info(`[Summarizer] Generating L1 summary for ${date} with ${chunks.length} chunks`);
      const output = await generateL1SummaryFromChunks(chunks);
      const summary = createL1Summary(userId, date, chunks, output);
      summaries.push(summary);
    }
  }

  return summaries;
}