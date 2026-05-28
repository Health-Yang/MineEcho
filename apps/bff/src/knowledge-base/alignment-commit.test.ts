import assert from "node:assert/strict";
import {
  buildAlignmentGraphPatch,
  selectAutoCommitAlignmentCandidates,
  type MemoryKnowledgeAlignmentCandidate,
} from "./alignment.js";

const baseCandidate: MemoryKnowledgeAlignmentCandidate = {
  memoryId: "mem-1",
  memoryLevel: 1,
  memorySource: "conversation",
  memoryExcerpt: "深信服 HCI 部署方案",
  knowledgeNodeId: "kg:hci",
  knowledgeLabel: "深信服 HCI",
  knowledgeType: "entity",
  confidence: 0.9,
  score: {
    final: 0.9,
    labelMatch: 0.9,
    descriptionMatch: 0,
    conflictPenalty: 0,
  },
  status: "aligned",
  evidence: [{ type: "label", value: "深信服 HCI" }],
  sourceSpans: [
    { kind: "memory", text: "深信服 HCI 部署方案", source: "memory://conversation/mem-1" },
    { kind: "knowledge", text: "深信服 HCI", source: "wiki/hci.md" },
  ],
  provenance: {
    memoryId: "mem-1",
    knowledgeNodeId: "kg:hci",
    memoryCreatedAt: 1770000000000,
    knowledgeSource: "wiki/hci.md",
    generatedAt: 1770000000000,
  },
};

const patch = buildAlignmentGraphPatch("user-1", [
  baseCandidate,
  { ...baseCandidate, memoryId: "mem-2", status: "conflict" },
]);

assert.equal(patch.nodes.length, 1);
assert.equal(patch.edges.length, 1);
assert.equal(patch.nodes[0].id, "memalign:user-1:mem-1:kg:hci");
assert.equal(patch.nodes[0].sourceFile, "memory://user-1/mem-1");
assert.equal(patch.edges[0].relation, "supports");

const withConflicts = buildAlignmentGraphPatch("user-1", [
  { ...baseCandidate, memoryId: "mem-2", status: "conflict" },
], { includeConflicts: true });

assert.equal(withConflicts.nodes.length, 1);
assert.equal(withConflicts.edges[0].relation, "contradicts");

const autoSelection = selectAutoCommitAlignmentCandidates([
  baseCandidate,
  { ...baseCandidate, memoryId: "mem-low", confidence: 0.6 },
  { ...baseCandidate, memoryId: "mem-conflict", status: "conflict" },
], { minConfidence: 0.88 });

assert.equal(autoSelection.selected.length, 1);
assert.equal(autoSelection.selected[0].memoryId, "mem-1");
assert.equal(autoSelection.skippedLowConfidence, 1);
assert.equal(autoSelection.skippedConflict, 1);

console.log("Knowledge alignment commit assertions passed");
