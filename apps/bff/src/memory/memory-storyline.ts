import { memoryTreeManager } from "./memory-tree/tree-manager.js";
import type { MemoryItem } from "./memory-tree/types.js";

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
  level: `L${0 | 1 | 2 | 3}`;
  source: string;
  importance: number;
}

export interface MemoryStoryline {
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

const TOPIC_RULES: Array<{ name: string; patterns: RegExp[]; question: string }> = [
  {
    name: "长期记忆",
    patterns: [/长期记忆|记住|记得|召回|旧记忆|语义记忆|记忆系统/i],
    question: "哪些记忆应该沉淀为稳定偏好、项目背景或长期目标？",
  },
  {
    name: "TokenJuice",
    patterns: [/TokenJuice|token|降本|压缩|上下文预算|成本/i],
    question: "哪些任务最需要 TokenJuice 保留完整证据，哪些可以继续压缩？",
  },
  {
    name: "知识图谱",
    patterns: [/知识图谱|图谱|实体|关系|节点/i],
    question: "知识图谱中哪些关系已经可信，哪些还需要用户确认？",
  },
  {
    name: "知识库",
    patterns: [/知识库|知识卡片|资料|引用|RAG|Karpathy/i],
    question: "哪些高密度结论适合沉淀成知识库条目？",
  },
  {
    name: "技能中心",
    patterns: [/技能|AI应用|工具|工作流|导入|调用/i],
    question: "哪些常见任务应该继续内置为默认技能？",
  },
  {
    name: "产品体验",
    patterns: [/产品|体验|页面|UI|优化|开源|布局/i],
    question: "哪些体验问题会影响开源用户的第一印象？",
  },
  {
    name: "编程排错",
    patterns: [/代码|编程|报错|排查|debug|测试|构建|命令/i],
    question: "哪些工程任务已经可以稳定交给 MineEcho 执行？",
  },
];

function compact(text: string, maxLength = 120): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 1)}…`;
}

function formatDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function summarizeItems(items: MemoryItem[], maxLength = 180): string {
  return compact(items.map((item) => item.content).join(" "), maxLength);
}

export function buildMemoryStoryline(
  items: MemoryItem[],
  range: { start: number; end: number; days: number }
): MemoryStoryline {
  const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);
  const keyTopics = TOPIC_RULES
    .map((rule) => {
      const matched = sorted.filter((item) => rule.patterns.some((pattern) => pattern.test(item.content)));
      return {
        name: rule.name,
        count: matched.length,
        evidenceIds: matched.slice(0, 5).map((item) => item.id),
      };
    })
    .filter((topic) => topic.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));

  const primaryTopics = keyTopics.slice(0, 3).map((topic) => topic.name);
  const title = `${range.days} 天阶段回顾`;
  const headline = primaryTopics.length > 0
    ? `这段时间主要围绕 ${primaryTopics.join("、")} 展开。`
    : "这段时间的记忆还比较分散，尚未形成稳定主题。";

  const chapters = keyTopics.slice(0, 4).map((topic) => {
    const evidence = sorted.filter((item) => topic.evidenceIds.includes(item.id));
    return {
      title: topic.name,
      summary: summarizeItems(evidence.length > 0 ? evidence : sorted, 180),
      evidenceIds: topic.evidenceIds,
    };
  });

  if (chapters.length === 0 && sorted.length > 0) {
    chapters.push({
      title: "近期轨迹",
      summary: summarizeItems(sorted, 180),
      evidenceIds: sorted.slice(0, 5).map((item) => item.id),
    });
  }

  const timeline = sorted
    .filter((item) => item.importance >= 0.45 || item.level > 0)
    .slice(-8)
    .map((item) => ({
      date: formatDate(item.createdAt),
      title: compact(item.content, 72),
      level: `L${item.level}` as `L${0 | 1 | 2 | 3}`,
      source: item.source,
      importance: item.importance,
    }));

  const nextQuestions = keyTopics.length > 0
    ? TOPIC_RULES
        .filter((rule) => keyTopics.some((topic) => topic.name === rule.name))
        .slice(0, 4)
        .map((rule) => rule.question)
    : ["接下来哪些内容值得 MineEcho 长期记住？"];

  return {
    title,
    headline,
    itemCount: sorted.length,
    range,
    keyTopics,
    chapters,
    timeline,
    nextQuestions,
  };
}

export async function generateMemoryStoryline(
  userId: string,
  options: { days?: number; now?: number } = {}
): Promise<MemoryStoryline> {
  const now = options.now ?? Date.now();
  const days = Math.min(Math.max(options.days ?? 30, 1), 365);
  const start = now - days * 24 * 60 * 60 * 1000;
  const result = await memoryTreeManager.aggregatedQuery(userId, {
    timeRange: { start, end: now },
    limit: 240,
    sortBy: "createdAt",
    sortOrder: "asc",
    includeArchived: false,
  });
  return buildMemoryStoryline(result.items, { start, end: now, days });
}
