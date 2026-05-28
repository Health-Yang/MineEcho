import assert from "node:assert/strict";
import { buildMemoryStoryline } from "./memory-storyline.js";
import type { MemoryItem } from "./memory-tree/types.js";

const items: MemoryItem[] = [
  {
    id: "m1",
    userId: "u1",
    level: 0,
    source: "conversation",
    content: "用户优化 MineEcho 的长期记忆，希望 MineEcho 能记住前几天的问题。",
    tokenCount: 20,
    createdAt: 1770000000000,
    dateKey: "2026-02-01",
    importance: 0.8,
    childCount: 0,
  },
  {
    id: "m2",
    userId: "u1",
    level: 1,
    source: "conversation",
    content: "阶段内重点接入 TokenJuice 上下文预算，并扩展技能中心。",
    tokenCount: 18,
    createdAt: 1770086400000,
    dateKey: "2026-02-02",
    importance: 0.7,
    childCount: 3,
  },
  {
    id: "m3",
    userId: "u1",
    level: 2,
    source: "conversation",
    content: "知识图谱和知识库保持稳定，下一步需要阶段回顾。",
    tokenCount: 16,
    createdAt: 1770172800000,
    dateKey: "2026-02-03",
    importance: 0.6,
    childCount: 2,
  },
];

const storyline = buildMemoryStoryline(items, { start: 1770000000000, end: 1770259200000, days: 30 });

assert.equal(storyline.itemCount, 3);
assert(storyline.title.includes("阶段回顾"));
assert(storyline.headline.includes("长期记忆") || storyline.headline.includes("TokenJuice"));
assert(storyline.chapters.length >= 1);
assert(storyline.timeline.length >= 2);
assert(storyline.keyTopics.some((topic) => topic.name === "长期记忆"));
assert(storyline.nextQuestions.length > 0);

console.log("memory storyline assertions passed");
