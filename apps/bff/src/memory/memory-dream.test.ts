import assert from "node:assert/strict";
import { buildDreamInsights } from "./memory-dream.js";
import type { L0Chunk } from "./memory-tree/types.js";

const chunks: L0Chunk[] = [
  {
    id: "l0-a",
    userId: "u1",
    source: "conversation",
    content: "用户正在优化 MineEcho 的长期记忆，希望 MineEcho 能记住前几天问过的 HCI 和知识图谱问题。",
    tokenCount: 40,
    createdAt: 1770000000000,
    entityTags: ["MineEcho", "HCI"],
    importance: 0.85,
  },
  {
    id: "l0-b",
    userId: "u1",
    source: "conversation",
    content: "用户强调 TokenJuice 要在普通聊天和任务执行中真实降本，尤其是写代码、排查错误、执行命令和写文档。",
    tokenCount: 42,
    createdAt: 1770000100000,
    entityTags: ["TokenJuice"],
    importance: 0.8,
  },
  {
    id: "l0-c",
    userId: "u1",
    source: "conversation",
    content: "好的。",
    tokenCount: 2,
    createdAt: 1770000200000,
    entityTags: [],
    importance: 0.1,
  },
];

const insights = buildDreamInsights(chunks);

assert.equal(insights.processedChunks, 3);
assert(insights.themes.some((theme) => theme.name === "长期记忆"));
assert(insights.themes.some((theme) => theme.name === "TokenJuice 降本"));
assert(insights.semanticMemories.some((memory) => memory.includes("MineEcho")));
assert(insights.forgettingCandidates.some((candidate) => candidate.id === "l0-c"));
assert(insights.openQuestions.some((question) => question.includes("长期记忆")));

console.log("memory dream assertions passed");
