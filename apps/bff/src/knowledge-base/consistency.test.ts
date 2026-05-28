import assert from "node:assert/strict";
import { buildKnowledgeConsistencyReport } from "./consistency.js";

const report = buildKnowledgeConsistencyReport({
  filePaths: [
    "raw/current.md",
    "wiki/concepts/current-concept.md",
  ],
  graphNodes: [
    { id: "kg:current", label: "Current", sourceFile: "wiki/concepts/current-concept.md" },
    { id: "kg:stale-a", label: "Stale A", sourceFile: "wiki/concepts/missing.md" },
    { id: "kg:stale-b", label: "Stale B", sourceFile: "wiki/concepts/missing.md" },
    { id: "kg:memory", label: "Memory", sourceFile: "memory/aligned" },
    { id: "kg:global", label: "Global" },
  ],
  graphEdges: [
    { source: "kg:stale-a", target: "kg:current", relation: "related" },
    { source: "kg:stale-b", target: "kg:stale-a", relation: "related" },
    { source: "kg:current", target: "kg:global", relation: "related" },
  ],
});

assert.equal(report.status, "warning");
assert.equal(report.fileCount, 2);
assert.equal(report.graphNodeCount, 5);
assert.equal(report.graphEdgeCount, 3);
assert.deepEqual(report.staleGraphSources, [
  {
    sourceFile: "wiki/concepts/missing.md",
    nodeCount: 2,
    edgeCount: 2,
  },
]);

const clean = buildKnowledgeConsistencyReport({
  filePaths: ["wiki/sources/a.md"],
  graphNodes: [{ id: "kg:a", label: "A", sourceFile: "wiki/sources/a.md" }],
  graphEdges: [],
});

assert.equal(clean.status, "ok");
assert.deepEqual(clean.staleGraphSources, []);

console.log("Knowledge consistency assertions passed");
