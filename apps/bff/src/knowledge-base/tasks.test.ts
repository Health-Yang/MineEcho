import assert from "node:assert/strict";
import { buildKnowledgeTasksReport, synthesizeGraphStatusesFromStore } from "./tasks.js";

const report = buildKnowledgeTasksReport({
  indexJobs: [
    {
      docId: "raw/a.md",
      filePath: "raw/a.md",
      status: "completed",
      createdAt: 10,
      updatedAt: 20,
      totalChunks: 4,
      processedChunks: 4,
    },
    {
      docId: "raw/b.md",
      filePath: "raw/b.md",
      status: "processing",
      createdAt: 30,
      updatedAt: 40,
      totalChunks: 10,
      processedChunks: 3,
    },
    {
      docId: "raw/c.md",
      filePath: "raw/c.md",
      status: "failed",
      errorMessage: "boom",
      createdAt: 50,
      updatedAt: 60,
    },
  ],
  organizeStatuses: [
    {
      rawPath: "raw/a.md",
      wikiPaths: ["wiki/sources/a.md"],
      status: "completed",
      createdAt: 70,
      updatedAt: 80,
    },
    {
      rawPath: "raw/failed.md",
      wikiPaths: [],
      status: "failed",
      errorMessage: "LLM timeout",
      progress: 0,
      createdAt: 81,
      updatedAt: 82,
    },
  ],
  graphStatuses: [
    {
      filePath: "wiki/sources/a.md",
      status: "completed",
      nodeCount: 3,
      edgeCount: 2,
      errorMessage: null,
      createdAt: 90,
      updatedAt: 100,
    },
    {
      filePath: "wiki/sources/skipped.md",
      status: "skipped",
      nodeCount: 0,
      edgeCount: 0,
      errorMessage: "graph store unavailable",
      createdAt: 101,
      updatedAt: 102,
    },
  ],
  consistency: {
    status: "warning",
    fileCount: 3,
    graphNodeCount: 5,
    graphEdgeCount: 4,
    staleGraphSources: [{ sourceFile: "wiki/missing.md", nodeCount: 2, edgeCount: 1 }],
  },
});

assert.equal(report.summary.total, 8);
assert.equal(report.summary.running, 1);
assert.equal(report.summary.completed, 3);
assert.equal(report.summary.failed, 2);
assert.equal(report.summary.needsAttention, 4);
const consistencyTask = report.tasks.find((task) => task.id === "consistency:stale-graph");
assert.equal(consistencyTask?.status, "warning");
const failedIndexTask = report.tasks.find((task) => task.id === "index:raw/c.md");
assert.equal(failedIndexTask?.status, "failed");
const runningIndexTask = report.tasks.find((task) => task.id === "index:raw/b.md");
assert.equal(runningIndexTask?.progress, 30);
const organizeTask = report.tasks.find((task) => task.id === "organize:raw/a.md");
assert.deepEqual(organizeTask?.outputPaths, ["wiki/sources/a.md"]);
assert.equal(organizeTask?.message, "已生成 1 个 wiki 页面：wiki/sources/a.md");
const failedOrganizeTask = report.tasks.find((task) => task.id === "organize:raw/failed.md");
assert.equal(failedOrganizeTask?.status, "failed");
assert.equal(failedOrganizeTask?.message, "LLM timeout");
assert.equal(failedOrganizeTask?.action, "retry-organize");
const graphTask = report.tasks.find((task) => task.id === "graph:wiki/sources/a.md");
assert.equal(graphTask?.status, "completed");
assert.equal(graphTask?.message, "已写入 3 个节点、2 条关系");
const skippedGraphTask = report.tasks.find((task) => task.id === "graph:wiki/sources/skipped.md");
assert.equal(skippedGraphTask?.status, "warning");
assert.equal(skippedGraphTask?.message, "graph store unavailable");
assert.equal(skippedGraphTask?.action, "retry-graph");
assert.equal(consistencyTask?.action, "repair-consistency");

const synthesized = synthesizeGraphStatusesFromStore({
  existingStatuses: [{ filePath: "wiki/sources/a.md", status: "completed", nodeCount: 1, edgeCount: 0, errorMessage: null, createdAt: 1, updatedAt: 2 }],
  graphNodes: [
    { id: "kg:a", sourceFile: "wiki/sources/a.md" },
    { id: "kg:b", sourceFile: "raw/b.md" },
    { id: "kg:c", sourceFile: "raw/b.md" },
  ],
  graphEdges: [
    { source: "kg:b", target: "kg:c" },
    { source: "kg:a", target: "kg:b" },
  ],
  now: 200,
});
assert.deepEqual(
  synthesized.map((status) => [status.filePath, status.nodeCount, status.edgeCount]),
  [
    ["wiki/sources/a.md", 1, 0],
    ["raw/b.md", 2, 2],
  ]
);

console.log("Knowledge tasks assertions passed");
