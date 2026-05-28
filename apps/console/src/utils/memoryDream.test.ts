import assert from "node:assert/strict";
import { normalizeMemoryDreamResult } from "./memoryDream";

const result = normalizeMemoryDreamResult({
  success: true,
  range: { start: 1, end: 2, days: 7 },
  processedChunks: 3,
  themes: [{ name: "长期记忆", count: 2, evidenceIds: ["a", "b"] }],
  semanticMemories: ["用户希望 MineEcho 记住长期任务"],
  openQuestions: ["哪些长期记忆需要稳定保留？"],
  forgettingCandidates: [{ id: "c", reason: "低重要度", importance: 0.1, createdAt: 1, preview: "好的" }],
  summaries: { l1: [{ date: "2026-05-28", id: "l1" }], l2: null, l3: null },
});

assert.equal(result.success, true);
assert.equal(result.processedChunks, 3);
assert.equal(result.themes[0].name, "长期记忆");
assert.equal(result.semanticMemories[0], "用户希望 MineEcho 记住长期任务");
assert.equal(result.forgettingCandidates[0].id, "c");
assert.equal(result.summaries.l1[0].id, "l1");

const empty = normalizeMemoryDreamResult(null);
assert.equal(empty.success, false);
assert.equal(empty.processedChunks, 0);
assert.deepEqual(empty.themes, []);

console.log("Memory dream UI assertions passed");
