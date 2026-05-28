import assert from "node:assert/strict";
import { fetchSkillHealth, summarizeSkillHealth, type SkillHealthReport } from "./skillHealth";

const calls: Array<{ url: string; init?: RequestInit }> = [];

const healthReport: SkillHealthReport = {
  skillId: "app-hci",
  name: "HCI 实施助手",
  enabled: true,
  source: "ai-app",
  checks: {
    metadata: { status: "pass", message: "Metadata is complete" },
    triggers: { status: "warn", message: "Weak synonym coverage" },
    executable: { status: "pass", message: "Executable entrypoint was found" },
    routing: { status: "pass", message: "Matched query" },
  },
  triggerCount: 4,
  routeScore: 0.82,
  routeEvidence: [{ type: "trigger", value: "超融合", weight: 0.9 }],
};

const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => ({
      code: 0,
      message: "success",
      data: healthReport,
    }),
  } as Response;
};

const result = await fetchSkillHealth("app-hci", {
  query: "超融合 方案 & 部署",
  fetcher,
});

assert.equal(calls[0].url, "/api/skills/app-hci/health?query=%E8%B6%85%E8%9E%8D%E5%90%88+%E6%96%B9%E6%A1%88+%26+%E9%83%A8%E7%BD%B2");
assert.equal(calls[0].init, undefined);
assert.equal(result.skillId, "app-hci");
assert.equal(result.checks.routing.status, "pass");
assert.equal(result.checks.triggers.status, "warn");
assert.equal(result.routeScore, 0.82);
assert.deepEqual(result.routeEvidence, [{ type: "trigger", value: "超融合", weight: 0.9 }]);

const summary = summarizeSkillHealth(healthReport);
assert.equal(summary.status, "warn");
assert.equal(summary.label, "需关注");
assert.equal(summary.passCount, 3);
assert.equal(summary.warnCount, 1);
assert.equal(summary.failCount, 0);
assert.equal(summary.totalCount, 4);

const failedSummary = summarizeSkillHealth({
  ...healthReport,
  checks: {
    ...healthReport.checks,
    routing: { status: "fail", message: "Route query did not select this skill." },
  },
});
assert.equal(failedSummary.status, "fail");
assert.equal(failedSummary.label, "异常");
assert.equal(failedSummary.failCount, 1);

await fetchSkillHealth("skill/custom id", { fetcher });
assert.equal(calls[1].url, "/api/skills/skill%2Fcustom%20id/health");

const failingFetcher = async (): Promise<Response> =>
  ({
    ok: false,
    status: 503,
    json: async () => ({ code: 1, message: "health backend unavailable" }),
  }) as Response;

await assert.rejects(
  fetchSkillHealth("app-hci", { fetcher: failingFetcher }),
  /health backend unavailable/
);

const errorPayloadFetcher = async (): Promise<Response> =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ code: 400, message: "invalid skill id" }),
  }) as Response;

await assert.rejects(
  fetchSkillHealth("missing", { fetcher: errorPayloadFetcher }),
  /invalid skill id/
);

console.log("Skill health API assertions passed");
