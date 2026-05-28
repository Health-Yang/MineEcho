import assert from "node:assert/strict";
import { buildSkillRegistry } from "./registry.js";
import { routeSkillQuery } from "./router.js";

const registry = buildSkillRegistry({
  triggerEntries: [
    {
      skillId: "app-hci",
      name: "HCI 实施助手",
      triggers: ["HCI", "超融合", "部署方案"],
    },
    {
      skillId: "doc-summary",
      name: "文档摘要",
      triggers: ["摘要", "总结"],
    },
  ],
  customSkills: [
    {
      id: "custom-risk",
      name: "风险评审",
      description: "识别项目交付风险和客户沟通风险",
      category: "skill",
      enabled: true,
    },
  ],
  aiApps: [
    {
      id: "app-hci",
      name: "HCI 实施助手",
      description: "深信服超融合 HCI 部署、巡检、故障排查知识库",
      type: "rag",
      enabled: true,
      config: { endpoint: "https://example.invalid/api" },
    },
  ],
  state: {
    "doc-summary": false,
  },
});

assert.equal(registry.entries.length, 3);
assert.equal(registry.entries.find((entry) => entry.id === "app-hci")?.source, "ai-app");
assert.equal(registry.entries.find((entry) => entry.id === "doc-summary")?.enabled, false);

const routed = routeSkillQuery("帮我做一个超融合部署方案", registry, {
  limit: 3,
  mode: "auto",
});

assert.equal(routed.selectedSkillId, "app-hci");
assert.equal(routed.candidates[0].skillId, "app-hci");
assert(routed.candidates[0].scoreComponents.trigger >= 0.7);
assert(routed.candidates[0].evidence.some((item) => item.type === "trigger" && item.value === "超融合"));
assert(!routed.candidates.some((candidate) => candidate.skillId === "doc-summary"));

const riskRoute = routeSkillQuery("这个项目交付有什么风险", registry, {
  limit: 3,
  mode: "general",
});

assert.equal(riskRoute.selectedSkillId, "custom-risk");
assert(riskRoute.candidates[0].scoreComponents.description > 0);
assert(riskRoute.candidates[0].evidence.some((item) => item.type === "trigger"));

const noRoute = routeSkillQuery("今天天气怎么样", registry, { limit: 3 });
assert.equal(noRoute.selectedSkillId, null);
assert.deepEqual(noRoute.candidates, []);

const aiAppOnlyRegistry = buildSkillRegistry({
  aiApps: [
    {
      id: "app-network",
      name: "网络割接助手",
      description: "用于生成网络割接方案、回退方案和防火墙策略核查清单",
      type: "workflow",
      enabled: true,
      config: { endpoint: "https://example.invalid/api" },
    },
  ],
});

const aiAppOnlyRoute = routeSkillQuery("帮我生成一个防火墙策略核查清单", aiAppOnlyRegistry, {
  limit: 3,
  mode: "auto",
});

assert.equal(aiAppOnlyRoute.selectedSkillId, "app-network");
assert(aiAppOnlyRoute.candidates[0].evidence.some((item) => item.type === "trigger" && item.value === "防火墙"));

console.log("Skill registry/router assertions passed");
