import { apiFetch } from "./api";

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

export interface MemoryDreamResult {
  success: boolean;
  range: {
    start: number;
    end: number;
    days: number;
  };
  processedChunks: number;
  themes: DreamTheme[];
  semanticMemories: string[];
  openQuestions: string[];
  forgettingCandidates: ForgettingCandidate[];
  summaries: {
    l1: Array<{ date: string; id: string }>;
    l2?: { weekStart: string; id: string } | null;
    l3?: { month: string; id: string } | null;
  };
}

const EMPTY_DREAM_RESULT: MemoryDreamResult = {
  success: false,
  range: { start: 0, end: 0, days: 7 },
  processedChunks: 0,
  themes: [],
  semanticMemories: [],
  openQuestions: [],
  forgettingCandidates: [],
  summaries: { l1: [], l2: null, l3: null },
};

function normalizeTheme(value: any): DreamTheme | null {
  if (!value || typeof value !== "object") return null;
  return {
    name: String(value.name || "未命名主题"),
    count: Number(value.count || 0),
    evidenceIds: Array.isArray(value.evidenceIds) ? value.evidenceIds.map(String) : [],
  };
}

function normalizeCandidate(value: any): ForgettingCandidate | null {
  if (!value || typeof value !== "object" || !value.id) return null;
  return {
    id: String(value.id),
    reason: String(value.reason || "低价值记忆候选"),
    importance: Number(value.importance || 0),
    createdAt: Number(value.createdAt || Date.now()),
    preview: String(value.preview || ""),
  };
}

export function normalizeMemoryDreamResult(value: unknown): MemoryDreamResult {
  if (!value || typeof value !== "object") return { ...EMPTY_DREAM_RESULT };
  const raw = value as any;
  const summaries = raw.summaries && typeof raw.summaries === "object" ? raw.summaries : {};

  return {
    success: Boolean(raw.success),
    range: {
      start: Number(raw.range?.start || 0),
      end: Number(raw.range?.end || 0),
      days: Number(raw.range?.days || 7),
    },
    processedChunks: Number(raw.processedChunks || 0),
    themes: Array.isArray(raw.themes)
      ? raw.themes.map(normalizeTheme).filter((item: DreamTheme | null): item is DreamTheme => item !== null)
      : [],
    semanticMemories: Array.isArray(raw.semanticMemories) ? raw.semanticMemories.map(String) : [],
    openQuestions: Array.isArray(raw.openQuestions) ? raw.openQuestions.map(String) : [],
    forgettingCandidates: Array.isArray(raw.forgettingCandidates)
      ? raw.forgettingCandidates
          .map(normalizeCandidate)
          .filter((item: ForgettingCandidate | null): item is ForgettingCandidate => item !== null)
      : [],
    summaries: {
      l1: Array.isArray(summaries.l1)
        ? summaries.l1.map((item: any) => ({ date: String(item.date || ""), id: String(item.id || "") }))
        : [],
      l2: summaries.l2 ? { weekStart: String(summaries.l2.weekStart || ""), id: String(summaries.l2.id || "") } : null,
      l3: summaries.l3 ? { month: String(summaries.l3.month || ""), id: String(summaries.l3.id || "") } : null,
    },
  };
}

export async function fetchMemoryDreamPreview(days = 7): Promise<MemoryDreamResult> {
  const params = new URLSearchParams();
  params.set("days", String(days));
  const response = await apiFetch(`/api/memory/dream/preview?${params.toString()}`);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || result.error || "记忆整理预览失败");
  }
  return normalizeMemoryDreamResult(result);
}

export async function runMemoryDream(days = 7): Promise<MemoryDreamResult> {
  const response = await apiFetch("/api/memory/dream/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ days }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || result.error || "记忆整理失败");
  }
  return normalizeMemoryDreamResult(result);
}
