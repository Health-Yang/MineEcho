import assert from "node:assert/strict";
import { buildDreamInsights } from "../memory/memory-dream.js";

const insights = buildDreamInsights([
  {
    id: "l0-tokenjuice",
    userId: "anonymous",
    source: "conversation",
    content: "TokenJuice 需要在普通聊天上下文预算中真实生效。",
    tokenCount: 20,
    createdAt: Date.now(),
    entityTags: ["TokenJuice"],
    importance: 0.8,
  },
]);

const response = {
  success: true,
  range: { start: 1, end: 2, days: 7 },
  ...insights,
};

assert.equal(response.success, true);
assert.equal(response.range.days, 7);
assert.equal(response.processedChunks, 1);
assert(response.themes.some((theme) => theme.name === "TokenJuice 降本"));
assert(Array.isArray(response.semanticMemories));
assert(Array.isArray(response.openQuestions));
assert(Array.isArray(response.forgettingCandidates));

console.log("memory dream route response assertions passed");
