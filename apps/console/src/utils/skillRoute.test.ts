import assert from "node:assert/strict";
import { fetchSkillRoute } from "./skillRoute";

const calls: Array<{ url: string; init?: RequestInit }> = [];

const response = {
  route: {
    query: "帮我做超融合部署方案",
    selectedSkillId: "app-hci",
    selectedSkillName: "HCI 实施助手",
    candidates: [
      {
        skillId: "app-hci",
        skillName: "HCI 实施助手",
        source: "ai-app",
        score: 0.86,
        scoreComponents: { trigger: 0.9, name: 0, description: 0.2, mode: 0.05 },
        evidence: [{ type: "trigger", value: "超融合", weight: 0.9 }],
      },
    ],
  },
  registryGeneratedAt: 1770000000000,
};

const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => response,
  } as Response;
};

const result = await fetchSkillRoute("帮我做超融合部署方案", {
  mode: "auto",
  limit: 2,
  fetcher,
});

assert.equal(result?.selectedSkillId, "app-hci");
assert.equal(calls[0].url, "/api/skills/route");
assert.equal(calls[0].init?.method, "POST");
assert.equal((calls[0].init?.headers as Record<string, string>)["Content-Type"], "application/json");
assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
  query: "帮我做超融合部署方案",
  mode: "auto",
  limit: 2,
});

const empty = await fetchSkillRoute("   ", { fetcher });
assert.equal(empty, null);
assert.equal(calls.length, 1);

console.log("Skill route API assertions passed");
