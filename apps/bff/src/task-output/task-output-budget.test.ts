import assert from "node:assert/strict";
import { budgetTaskOutputForMemory } from "./task-output-budget.js";
import {
  clearTokenJuiceMetrics,
  configureTokenJuiceMetricsPersistence,
  getTokenJuiceMetrics,
} from "../tokenjuice/metrics.js";

configureTokenJuiceMetricsPersistence({ filePath: null });
clearTokenJuiceMetrics();

function repeatedLog(count: number): string {
  return Array.from({ length: count }, (_, index) => {
    const line = index % 5 === 0
      ? `ERROR src/module-${index}.ts:${index}: TypeError: Cannot read properties of undefined`
      : `node_modules/.vite/deps/chunk-${index}.js build trace verbose stack frame ${index}`;
    return line;
  }).join("\n");
}

async function testCompactsLongTaskOutputForMemory() {
  const raw = repeatedLog(180);
  const result = await budgetTaskOutputForMemory({
    toolName: "npm",
    command: "npm run build",
    output: raw,
    error: "build failed",
    exitCode: 1,
    scenario: "troubleshooting",
    maxInlineChars: 1200,
  });

  assert.equal(result.rawChars, raw.length + "build failed".length);
  assert.equal(result.compacted, true);
  assert.ok(result.content.length <= 1200, "memory content should be bounded");
  assert.ok(result.content.includes("TokenLess"), "compacted memory should disclose compaction");
  assert.ok(result.content.includes("npm run build"), "compacted memory should keep command context");
  assert.ok(result.reducedChars < result.rawChars);
  assert.ok(result.ratio < 1);

  const metrics = getTokenJuiceMetrics();
  assert.ok(metrics.totalRuns >= 1, "TokenLess metrics should be recorded");
}

async function testPreservesShortNaturalOutput() {
  const output = "AI 应用回答：HCI 是人机交互，重点关注用户、任务和界面之间的关系。";
  const result = await budgetTaskOutputForMemory({
    toolName: "ai_app",
    input: "解释 HCI",
    output,
    scenario: "ai-app",
    maxInlineChars: 1200,
  });

  assert.equal(result.content, output);
  assert.equal(result.compacted, false);
  assert.equal(result.rawChars, output.length);
  assert.equal(result.reducedChars, output.length);
  assert.equal(result.ratio, 1);
}

async function testDocumentsUseBudgetWhenVeryLong() {
  const output = Array.from({ length: 220 }, (_, index) => `会议转录 ${index}: 讨论 HCI 节点规划、网络配置和实施风险。`).join("\n");
  const result = await budgetTaskOutputForMemory({
    toolName: "meeting",
    output,
    scenario: "document",
    maxInlineChars: 1500,
  });

  assert.equal(result.compacted, true);
  assert.ok(result.content.length <= 1500);
  assert.ok(result.content.includes("TokenLess"));
}

async function run() {
  await testCompactsLongTaskOutputForMemory();
  await testPreservesShortNaturalOutput();
  await testDocumentsUseBudgetWhenVeryLong();
  clearTokenJuiceMetrics();
  configureTokenJuiceMetricsPersistence({ filePath: null });
  console.log("task-output-budget tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
