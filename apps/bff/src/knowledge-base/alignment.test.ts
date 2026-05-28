import assert from "node:assert/strict";
import { alignMemoryItemsToGraph, buildMemoryAlignmentStatus, normalizeAlignmentLabel } from "./alignment.js";

assert.equal(normalizeAlignmentLabel(" HCI 实施助手 "), "hci实施助手");
assert.equal(normalizeAlignmentLabel("Mine-Echo"), "mineecho");

const candidates = alignMemoryItemsToGraph(
  [
    {
      id: "mem-1",
      level: 1,
      source: "conversation",
      content: "今天整理了深信服 HCI 的部署方案，确认超融合节点规划。",
      createdAt: 1770000000000,
    },
    {
      id: "mem-2",
      level: 1,
      source: "conversation",
      content: "旧方案不是最终方案，深信服 HCI 的网络配置已经过期。",
      createdAt: 1770000001000,
    },
  ],
  [
    {
      id: "node-hci",
      label: "深信服 HCI",
      type: "entity",
      description: "超融合产品",
      sourceFile: "wiki/hci.md",
      importance: 80,
    },
    {
      id: "node-random",
      label: "财务报销",
      type: "topic",
      importance: 20,
    },
  ],
  { minConfidence: 0.75 }
);

assert.equal(candidates.length, 2);
assert.equal(candidates[0].memoryId, "mem-2");
assert.equal(candidates[0].status, "conflict");
assert.equal(candidates[0].knowledgeNodeId, "node-hci");
assert.equal(candidates[1].status, "aligned");
assert(candidates.every((candidate) => candidate.confidence >= 0.75));
assert.equal(candidates[1].score.final, candidates[1].confidence);
assert(candidates[1].score.labelMatch > 0);
assert(candidates[1].sourceSpans.some((span) => span.kind === "memory" && span.text.includes("深信服 HCI")));
assert.equal(candidates[1].provenance.memoryCreatedAt, 1770000000000);
assert.equal(candidates[1].provenance.knowledgeSource, "wiki/hci.md");

const status = buildMemoryAlignmentStatus({
  userId: "user-1",
  candidates,
  memoryCount: 2,
  graphNodeCount: 2,
  historyCount: 1,
  generatedAt: 1770000002000,
});

assert.equal(status.userId, "user-1");
assert.equal(status.candidateCount, 2);
assert.equal(status.alignedCount, 1);
assert.equal(status.conflictCount, 1);
assert.equal(status.hasActionableCandidates, true);
assert.equal(status.lastCandidateAt, 1770000001000);

console.log("Knowledge alignment assertions passed");
