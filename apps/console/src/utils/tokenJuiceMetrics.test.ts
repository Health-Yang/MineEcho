import assert from "node:assert/strict";
import { fetchTokenLessMetrics } from "./tokenJuiceMetrics";

const calls: Array<{ url: string; init?: RequestInit }> = [];
const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => ({
      code: 0,
      message: "success",
      data: {
        totalRuns: 2,
        totalRawChars: 2000,
        totalReducedChars: 800,
        totalSavedChars: 1200,
        estimatedTokensSaved: 300,
        averageRatio: 0.4,
        recent: [],
        byFamily: [{ family: "git", runs: 2, rawChars: 2000, reducedChars: 800, savedChars: 1200, averageRatio: 0.4 }],
        byReducer: [],
      },
    }),
  } as Response;
};

const metrics = await fetchTokenLessMetrics({ fetcher });

assert.equal(metrics.totalRuns, 2);
assert.equal(metrics.estimatedTokensSaved, 300);
assert.equal(metrics.byFamily[0].family, "git");
assert.equal(calls[0].url, "/api/metrics/tokenjuice");

console.log("TokenLess metrics API assertions passed");
