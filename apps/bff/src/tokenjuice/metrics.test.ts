import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  clearTokenJuiceMetrics,
  configureTokenJuiceMetricsPersistence,
  getTokenJuiceMetrics,
  loadTokenJuiceMetrics,
  recordTokenJuiceMetric,
} from "./metrics.js";

configureTokenJuiceMetricsPersistence({ filePath: null });
clearTokenJuiceMetrics();

recordTokenJuiceMetric({
  family: "git",
  reducer: "git/status",
  rawChars: 1200,
  reducedChars: 300,
  ratio: 0.25,
});
recordTokenJuiceMetric({
  family: "git",
  reducer: "git/status",
  rawChars: 800,
  reducedChars: 400,
  ratio: 0.5,
});
recordTokenJuiceMetric({
  family: "npm",
  reducer: "npm/test",
  rawChars: 1000,
  reducedChars: 1000,
  ratio: 1,
});

const metrics = getTokenJuiceMetrics();

assert.equal(metrics.totalRuns, 3);
assert.equal(metrics.totalRawChars, 3000);
assert.equal(metrics.totalReducedChars, 1700);
assert.equal(metrics.totalSavedChars, 1300);
assert.equal(metrics.estimatedTokensSaved, 325);
assert.equal(metrics.averageRatio, 1700 / 3000);
assert.equal(metrics.byFamily[0].family, "git");
assert.equal(metrics.byFamily[0].runs, 2);
assert.equal(metrics.byFamily[0].savedChars, 1300);
assert.equal(metrics.byReducer[0].reducer, "git/status");

clearTokenJuiceMetrics();
assert.equal(getTokenJuiceMetrics().totalRuns, 0);

const tempDir = await mkdtemp(join(tmpdir(), "mineecho-tokenjuice-"));
const metricsFile = join(tempDir, "metrics.json");

try {
  clearTokenJuiceMetrics();
  configureTokenJuiceMetricsPersistence({ filePath: metricsFile });
  recordTokenJuiceMetric({
    family: "docker",
    reducer: "docker/build",
    rawChars: 2400,
    reducedChars: 600,
    ratio: 0.25,
    timestamp: 123456,
  });

  const persisted = JSON.parse(await readFile(metricsFile, "utf8"));
  assert.equal(persisted.records.length, 1);
  assert.equal(persisted.records[0].family, "docker");

  clearTokenJuiceMetrics({ persist: false });

  await loadTokenJuiceMetrics();
  const restored = getTokenJuiceMetrics();
  assert.equal(restored.totalRuns, 1);
  assert.equal(restored.totalSavedChars, 1800);
  assert.equal(restored.byReducer[0].reducer, "docker/build");

  clearTokenJuiceMetrics({ persist: false });
  configureTokenJuiceMetricsPersistence({ filePath: metricsFile });
  recordTokenJuiceMetric({
    family: "git",
    reducer: "git/diff",
    rawChars: 1000,
    reducedChars: 250,
    ratio: 0.25,
    timestamp: 123457,
  });

  const appended = getTokenJuiceMetrics();
  assert.equal(appended.totalRuns, 2);
  assert.equal(appended.totalSavedChars, 2550);
} finally {
  configureTokenJuiceMetricsPersistence({ filePath: null });
  clearTokenJuiceMetrics();
  await rm(tempDir, { recursive: true, force: true });
}

console.log("TokenLess metrics assertions passed");
