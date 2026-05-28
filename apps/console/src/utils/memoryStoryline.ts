import { apiFetch } from "./api";

export interface StorylineTopic {
  name: string;
  count: number;
  evidenceIds: string[];
}

export interface StorylineChapter {
  title: string;
  summary: string;
  evidenceIds: string[];
}

export interface StorylineEvent {
  date: string;
  title: string;
  level: "L0" | "L1" | "L2" | "L3";
  source: string;
  importance: number;
}

export interface MemoryStoryline {
  success: boolean;
  title: string;
  headline: string;
  itemCount: number;
  range: {
    start: number;
    end: number;
    days: number;
  };
  keyTopics: StorylineTopic[];
  chapters: StorylineChapter[];
  timeline: StorylineEvent[];
  nextQuestions: string[];
}

const EMPTY_STORYLINE: MemoryStoryline = {
  success: false,
  title: "阶段回顾",
  headline: "暂无足够记忆形成阶段回顾。",
  itemCount: 0,
  range: { start: 0, end: 0, days: 30 },
  keyTopics: [],
  chapters: [],
  timeline: [],
  nextQuestions: [],
};

export function normalizeMemoryStoryline(value: unknown): MemoryStoryline {
  if (!value || typeof value !== "object") return { ...EMPTY_STORYLINE };
  const raw = value as any;
  return {
    success: Boolean(raw.success),
    title: String(raw.title || "阶段回顾"),
    headline: String(raw.headline || EMPTY_STORYLINE.headline),
    itemCount: Number(raw.itemCount || 0),
    range: {
      start: Number(raw.range?.start || 0),
      end: Number(raw.range?.end || 0),
      days: Number(raw.range?.days || 30),
    },
    keyTopics: Array.isArray(raw.keyTopics)
      ? raw.keyTopics.map((item: any) => ({
          name: String(item.name || "未命名主题"),
          count: Number(item.count || 0),
          evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds.map(String) : [],
        }))
      : [],
    chapters: Array.isArray(raw.chapters)
      ? raw.chapters.map((item: any) => ({
          title: String(item.title || "阶段片段"),
          summary: String(item.summary || ""),
          evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds.map(String) : [],
        }))
      : [],
    timeline: Array.isArray(raw.timeline)
      ? raw.timeline.map((item: any) => ({
          date: String(item.date || ""),
          title: String(item.title || ""),
          level: ["L0", "L1", "L2", "L3"].includes(item.level) ? item.level : "L0",
          source: String(item.source || "memory"),
          importance: Number(item.importance || 0),
        }))
      : [],
    nextQuestions: Array.isArray(raw.nextQuestions) ? raw.nextQuestions.map(String) : [],
  };
}

export async function fetchMemoryStoryline(days = 30): Promise<MemoryStoryline> {
  const params = new URLSearchParams();
  params.set("days", String(days));
  const response = await apiFetch(`/api/memory/storyline?${params.toString()}`);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || result.error || "阶段回顾生成失败");
  }
  return normalizeMemoryStoryline(result);
}
