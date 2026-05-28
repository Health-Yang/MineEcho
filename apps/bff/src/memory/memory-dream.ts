import { memoryTreeManager } from "./memory-tree/tree-manager.js";
import type { L0Chunk, L1Summary, L2Summary, L3Summary } from "./memory-tree/types.js";

export interface DreamTheme {
  name: string;
  count: number;
  evidenceIds: string[];
}

export interface ForgettingCandidate {
  id: string;
  reason: string;
  importance: number;
  createdAt: number;
  preview: string;
}

export interface DreamInsights {
  processedChunks: number;
  themes: DreamTheme[];
  semanticMemories: string[];
  openQuestions: string[];
  forgettingCandidates: ForgettingCandidate[];
}

export interface DreamRunResult extends DreamInsights {
  success: boolean;
  range: {
    start: number;
    end: number;
    days: number;
  };
  summaries: {
    l1: Array<{ date: string; id: string }>;
    l2?: { weekStart: string; id: string } | null;
    l3?: { month: string; id: string } | null;
  };
}

const THEME_RULES: Array<{ name: string; patterns: RegExp[] }> = [
  { name: "长期记忆", patterns: [/长期记忆|记住|记得|召回|旧记忆|记忆系统|语义记忆/i] },
  { name: "TokenJuice 降本", patterns: [/TokenJuice|token|降本|压缩|上下文预算|成本/i] },
  { name: "知识图谱", patterns: [/知识图谱|图谱|节点|关系|实体/i] },
  { name: "知识库", patterns: [/知识库|知识卡片|资料|引用|RAG/i] },
  { name: "技能与工具", patterns: [/技能|AI应用|工具|命令|执行|工作流/i] },
  { name: "编程排错", patterns: [/代码|编程|报错|排查|debug|测试|构建/i] },
  { name: "文档材料", patterns: [/文档|材料|报告|PPT|汇报|总结/i] },
  { name: "产品优化", patterns: [/产品|体验|页面|UI|优化|开源/i] },
];

function compactPreview(text: string, maxLength = 140): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function extractKeywords(chunks: L0Chunk[]): string[] {
  const tags = chunks.flatMap((chunk) => chunk.entityTags || []).filter(Boolean);
  const fromRules = THEME_RULES
    .filter((rule) => chunks.some((chunk) => rule.patterns.some((pattern) => pattern.test(chunk.content))))
    .map((rule) => rule.name);
  return unique([...tags, ...fromRules]).slice(0, 8);
}

export function buildDreamInsights(chunks: L0Chunk[]): DreamInsights {
  const themes = THEME_RULES
    .map((rule) => {
      const matched = chunks.filter((chunk) => rule.patterns.some((pattern) => pattern.test(chunk.content)));
      return {
        name: rule.name,
        count: matched.length,
        evidenceIds: matched.slice(0, 5).map((chunk) => chunk.id),
      };
    })
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));

  const importantChunks = chunks
    .filter((chunk) => chunk.importance >= 0.55 && chunk.content.trim().length >= 16)
    .sort((a, b) => b.importance - a.importance || b.createdAt - a.createdAt)
    .slice(0, 8);

  const keywords = extractKeywords(importantChunks);
  const semanticMemories = importantChunks.slice(0, 5).map((chunk) => {
    const source = chunk.source ? `来源: ${chunk.source}` : "来源: memory";
    return `${compactPreview(chunk.content, 180)} (${source}; 重要度: ${chunk.importance.toFixed(2)})`;
  });

  const forgettingCandidates = chunks
    .filter((chunk) => {
      const shortAck = /^(好的|嗯|是的|可以|继续|收到|谢谢)[。.!！\s]*$/i.test(chunk.content.trim());
      return chunk.importance <= 0.2 || shortAck || chunk.content.trim().length <= 6;
    })
    .slice(0, 12)
    .map((chunk) => ({
      id: chunk.id,
      reason: chunk.importance <= 0.2 ? "低重要度且缺少长期语义信息" : "短确认类片段，适合降低召回权重",
      importance: chunk.importance,
      createdAt: chunk.createdAt,
      preview: compactPreview(chunk.content, 80),
    }));

  const openQuestions = themes.slice(0, 4).map((theme) => {
    if (theme.name === "长期记忆") return "长期记忆里哪些内容应稳定保留为用户偏好或项目背景？";
    if (theme.name === "TokenJuice 降本") return "TokenJuice 在哪些任务场景里最需要保留原始证据，哪些可以大胆压缩？";
    if (theme.name === "知识图谱") return "知识图谱中哪些实体关系已经确认，哪些只是临时推断？";
    return `${theme.name} 相关内容是否需要沉淀成知识库条目或长期记忆？`;
  });

  if (openQuestions.length === 0 && keywords.length > 0) {
    openQuestions.push(`这些高频主题是否需要沉淀为长期记忆：${keywords.slice(0, 4).join("、")}？`);
  }

  return {
    processedChunks: chunks.length,
    themes,
    semanticMemories,
    openQuestions,
    forgettingCandidates,
  };
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function weekStartFor(ts: number): string {
  const date = new Date(ts);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function monthFor(ts: number): string {
  return new Date(ts).toISOString().slice(0, 7);
}

export async function runMemoryDream(userId: string, options: { days?: number; now?: number } = {}): Promise<DreamRunResult> {
  const now = options.now ?? Date.now();
  const days = Math.min(Math.max(options.days ?? 7, 1), 90);
  const start = now - days * 24 * 60 * 60 * 1000;
  const chunks = memoryTreeManager.getChunks(userId, { since: start, limit: 500 });
  const insights = buildDreamInsights(chunks);

  const dates = unique(chunks.map((chunk) => formatDate(chunk.createdAt))).sort();
  const l1: L1Summary[] = [];
  for (const date of dates) {
    const summary = await memoryTreeManager.generateL1Summary(userId, date);
    if (summary) l1.push(summary);
  }

  let l2: L2Summary | null = null;
  let l3: L3Summary | null = null;
  if (l1.length >= 2) {
    l2 = await memoryTreeManager.generateL2Summary(userId, weekStartFor(now));
  }
  if (l2) {
    l3 = await memoryTreeManager.generateL3Summary(userId, monthFor(now));
  }

  return {
    success: true,
    ...insights,
    range: { start, end: now, days },
    summaries: {
      l1: l1.map((summary) => ({ date: summary.date, id: summary.id })),
      l2: l2 ? { weekStart: l2.weekStart, id: l2.id } : null,
      l3: l3 ? { month: l3.month, id: l3.id } : null,
    },
  };
}
