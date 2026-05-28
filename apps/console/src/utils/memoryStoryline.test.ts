import assert from "node:assert/strict";
import { normalizeMemoryStoryline } from "./memoryStoryline";

const result = normalizeMemoryStoryline({
  success: true,
  title: "30 天阶段回顾",
  headline: "这段时间主要围绕 长期记忆、TokenLess 展开。",
  itemCount: 4,
  range: { start: 1, end: 2, days: 30 },
  keyTopics: [{ name: "长期记忆", count: 2, evidenceIds: ["a"] }],
  chapters: [{ title: "长期记忆", summary: "用户持续优化 MineEcho 记忆能力。", evidenceIds: ["a"] }],
  timeline: [{ date: "2026-05-28", title: "接入记忆故事线", level: "L1", source: "conversation", importance: 0.7 }],
  nextQuestions: ["哪些记忆应该沉淀为长期目标？"],
});

assert.equal(result.success, true);
assert.equal(result.title, "30 天阶段回顾");
assert.equal(result.keyTopics[0].name, "长期记忆");
assert.equal(result.chapters[0].title, "长期记忆");
assert.equal(result.timeline[0].level, "L1");
assert.equal(result.nextQuestions.length, 1);

const empty = normalizeMemoryStoryline(null);
assert.equal(empty.success, false);
assert.equal(empty.itemCount, 0);
assert.deepEqual(empty.chapters, []);

console.log("Memory storyline UI assertions passed");
