import type { L0Chunk, MemoryItem, MemorySource } from "../memory/memory-tree/types.js";

export type MemoryTimelineLevel = "L0" | "L1" | "L2" | "L3";

export interface MemoryTimelineNode {
  id: string;
  level: MemoryTimelineLevel;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceType: string;
  sourceLabel: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  tokenCount: number;
  importance?: number;
  children?: MemoryTimelineNode[];
}

export interface MemoryTimelineStats {
  totalMemories: number;
  lastUpdated: number;
  levels: {
    l0: number;
    l1: number;
    l2: number;
    l3: number;
  };
  totalTokens: number;
}

export interface MemoryTimelineResponse {
  nodes: MemoryTimelineNode[];
  stats: MemoryTimelineStats;
}

const SOURCE_LABELS: Record<MemorySource | string, string> = {
  conversation: "对话记忆",
  document: "文档记忆",
  skill: "技能记忆",
  knowledge: "知识记忆",
  manual: "手动记忆",
  meeting: "会议记忆",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  interaction: "对话记忆",
  "skill-pattern": "技能记忆",
  knowledge: "知识记忆",
  manual: "手动记忆",
  meeting: "会议记忆",
  summary: "分层摘要",
  "level-group": "记忆层级",
};

function trimText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}...`;
}

function extractTitle(content: string, fallback: string): string {
  const firstMeaningfulLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("AI:"));

  if (!firstMeaningfulLine) return fallback;
  return trimText(firstMeaningfulLine.replace(/^用户[:：]\s*/, ""), 36);
}

function sourceTypeFromSource(source: MemorySource | string): string {
  if (source === "skill") return "skill-pattern";
  if (source === "document" || source === "knowledge") return "knowledge";
  if (source === "meeting") return "meeting";
  if (source === "manual") return "manual";
  return "interaction";
}

function sourceLabelFromSource(source: MemorySource | string): string {
  return SOURCE_LABELS[source] || SOURCE_TYPE_LABELS[sourceTypeFromSource(source)] || "记忆记录";
}

function tagsForSource(source: MemorySource | string, extra: string[] = []): string[] {
  return Array.from(new Set([source, ...extra].filter(Boolean))).map(String).slice(0, 6);
}

export function buildMemoryTimelineResponse(input: {
  chunks: L0Chunk[];
  items: MemoryItem[];
  lastUpdated?: number;
}): MemoryTimelineResponse {
  const l0Nodes: MemoryTimelineNode[] = input.chunks.map((chunk) => ({
    id: chunk.id,
    level: "L0",
    title: extractTitle(chunk.content, SOURCE_LABELS[chunk.source] || "原始记忆"),
    summary: trimText(chunk.content, 96),
    content: chunk.content,
    source: chunk.sourceRef?.id || chunk.source,
    sourceType: sourceTypeFromSource(chunk.source),
    sourceLabel: sourceLabelFromSource(chunk.source),
    tags: tagsForSource(chunk.source, chunk.entityTags),
    createdAt: chunk.createdAt,
    updatedAt: chunk.createdAt,
    tokenCount: chunk.tokenCount,
    importance: chunk.importance,
  }));

  const summaryNodes: MemoryTimelineNode[] = input.items
    .filter((item) => item.level > 0)
    .map((item) => {
      const level = `L${item.level}` as MemoryTimelineLevel;
      const titlePrefix = item.level === 1 ? "日摘要" : item.level === 2 ? "周摘要" : "月回顾";
      return {
        id: item.id,
        level,
        title: `${titlePrefix} ${item.dateKey}`,
        summary: trimText(item.content, 96),
        content: item.content,
        source: item.dateKey,
        sourceType: "summary",
        sourceLabel: "分层摘要",
        tags: tagsForSource(item.source, [level.toLowerCase(), "summary"]),
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        tokenCount: item.tokenCount,
        importance: item.importance,
      };
    });

  const byLevel: Array<{ level: MemoryTimelineLevel; title: string; summary: string; children: MemoryTimelineNode[] }> = [
    { level: "L0", title: "L0 原始记忆", summary: "从对话、技能和导入内容实时写入的细粒度记忆", children: l0Nodes },
    { level: "L1", title: "L1 日摘要", summary: "按天压缩后的关键主题和决策", children: summaryNodes.filter((node) => node.level === "L1") },
    { level: "L2", title: "L2 周摘要", summary: "跨天合并后的阶段性模式", children: summaryNodes.filter((node) => node.level === "L2") },
    { level: "L3", title: "L3 月回顾", summary: "长期趋势和高密度归档", children: summaryNodes.filter((node) => node.level === "L3") },
  ];

  const lastUpdated = input.lastUpdated || Date.now();
  const nodes = byLevel
    .filter((group) => group.children.length > 0)
    .map((group) => ({
      id: `group-${group.level.toLowerCase()}`,
      level: group.level,
      title: group.title,
      summary: group.summary,
      content: `${group.title}\n\n${group.summary}\n\n共 ${group.children.length} 条。`,
      source: "memory-tree",
      sourceType: "level-group",
      sourceLabel: "记忆层级",
      tags: [group.level.toLowerCase(), "memory-tree"],
      createdAt: Math.max(...group.children.map((child) => child.createdAt), lastUpdated),
      updatedAt: Math.max(...group.children.map((child) => child.updatedAt), lastUpdated),
      tokenCount: group.children.reduce((sum, child) => sum + child.tokenCount, 0),
      children: group.children,
    }));

  const levels = {
    l0: l0Nodes.length,
    l1: summaryNodes.filter((node) => node.level === "L1").length,
    l2: summaryNodes.filter((node) => node.level === "L2").length,
    l3: summaryNodes.filter((node) => node.level === "L3").length,
  };

  return {
    nodes,
    stats: {
      totalMemories: levels.l0 + levels.l1 + levels.l2 + levels.l3,
      lastUpdated,
      levels,
      totalTokens: [...l0Nodes, ...summaryNodes].reduce((sum, node) => sum + node.tokenCount, 0),
    },
  };
}
