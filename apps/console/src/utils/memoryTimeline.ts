import { apiFetch } from "./api";

export type MemoryLevel = "L0" | "L1" | "L2" | "L3";
export type MemorySourceType =
  | "user-profile"
  | "skill-pattern"
  | "interaction"
  | "burnout"
  | "daily"
  | "knowledge"
  | "manual"
  | "meeting"
  | "summary"
  | "level-group";

export interface MemoryNode {
  id: string;
  level: MemoryLevel;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceType?: MemorySourceType;
  sourceLabel: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  note?: string;
  tokenCount?: number;
  importance?: number;
  children?: MemoryNode[];
}

const SOURCE_LABELS: Record<string, string> = {
  conversation: "对话记忆",
  document: "知识记忆",
  skill: "技能记忆",
  knowledge: "知识记忆",
  manual: "手动记忆",
  meeting: "会议记忆",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  "user-profile": "用户画像",
  "skill-pattern": "技能记忆",
  interaction: "对话记忆",
  burnout: "状态监测",
  daily: "日常记录",
  knowledge: "知识记忆",
  manual: "手动记忆",
  meeting: "会议记忆",
  summary: "分层摘要",
  "level-group": "记忆层级",
};

export function getMemorySourceLabel(sourceType?: string, source?: string, sourceLabel?: string): string {
  if (sourceLabel) return sourceLabel;
  if (sourceType && SOURCE_TYPE_LABELS[sourceType]) return SOURCE_TYPE_LABELS[sourceType];
  if (source && SOURCE_LABELS[source]) return SOURCE_LABELS[source];
  return "记忆记录";
}

export interface MemoryStats {
  totalMemories: number;
  lastUpdated: number;
  totalTokens?: number;
  levels: {
    l0: number;
    l1: number;
    l2: number;
    l3: number;
  };
}

export interface MemoryTimeline {
  nodes: MemoryNode[];
  stats: MemoryStats;
}

function normalizeNode(value: any): MemoryNode | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const children = Array.isArray(value.children)
    ? value.children.map(normalizeNode).filter((node: MemoryNode | null): node is MemoryNode => node !== null)
    : undefined;

  return {
    id: value.id,
    level: value.level,
    title: String(value.title || "未命名记忆"),
    summary: String(value.summary || ""),
    content: String(value.content || value.summary || ""),
    source: String(value.source || "memory-tree"),
    sourceType: value.sourceType,
    sourceLabel: getMemorySourceLabel(value.sourceType, value.source, value.sourceLabel),
    tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
    createdAt: Number(value.createdAt || Date.now()),
    updatedAt: Number(value.updatedAt || value.createdAt || Date.now()),
    tokenCount: typeof value.tokenCount === "number" ? value.tokenCount : undefined,
    importance: typeof value.importance === "number" ? value.importance : undefined,
    children,
  };
}

export function normalizeMemoryTimeline(value: unknown): MemoryTimeline {
  const raw = value && typeof value === "object" ? value as any : {};
  const nodes = Array.isArray(raw.nodes)
    ? raw.nodes.map(normalizeNode).filter((node: MemoryNode | null): node is MemoryNode => node !== null)
    : [];
  const stats = raw.stats && typeof raw.stats === "object" ? raw.stats : {};

  return {
    nodes,
    stats: {
      totalMemories: Number(stats.totalMemories || 0),
      lastUpdated: Number(stats.lastUpdated || Date.now()),
      totalTokens: typeof stats.totalTokens === "number" ? stats.totalTokens : undefined,
      levels: {
        l0: Number(stats.levels?.l0 || 0),
        l1: Number(stats.levels?.l1 || 0),
        l2: Number(stats.levels?.l2 || 0),
        l3: Number(stats.levels?.l3 || 0),
      },
    },
  };
}

export async function fetchMemoryTimeline(options: { days?: number; limit?: number } = {}): Promise<MemoryTimeline> {
  const params = new URLSearchParams();
  params.set("days", String(options.days ?? 30));
  params.set("limit", String(options.limit ?? 120));
  const response = await apiFetch(`/api/memory/timeline?${params.toString()}`);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || result.error || "记忆加载失败");
  }
  return normalizeMemoryTimeline(result);
}
