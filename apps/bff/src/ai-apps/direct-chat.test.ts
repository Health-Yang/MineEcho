import assert from "node:assert/strict";
import { findEnabledAiAppForSkill } from "./direct-chat.js";
import { buildSkillRegistry } from "../skills/registry.js";
import { routeSkillQuery } from "../skills/router.js";

const apps = [
  {
    id: "app-hci",
    name: "HCI 助手",
    description: "HCI 产品问答",
    type: "rag" as const,
    enabled: true,
    config: { endpoint: "https://example.com/api" },
  },
  {
    id: "app-disabled",
    name: "停用应用",
    description: "停用",
    type: "rag" as const,
    enabled: false,
    config: { endpoint: "https://example.com/api" },
  },
];

assert.equal(findEnabledAiAppForSkill(apps, "app-hci")?.id, "app-hci");
assert.equal(findEnabledAiAppForSkill(apps, "app-disabled"), null);
assert.equal(findEnabledAiAppForSkill(apps, undefined), null);
assert.equal(findEnabledAiAppForSkill(apps, "missing"), null);

const importedAiApps = [
  {
    id: "app-network-cutover",
    name: "网络割接助手",
    description: "用于生成网络割接方案、回退方案和防火墙策略核查清单",
    type: "workflow" as const,
    enabled: true,
    config: {
      endpoint: "https://example.com/cutover",
      requestStyle: "messages" as const,
      queryKey: "messages",
      responseContentPath: "data.answer",
      maxTokens: 4096,
    },
  },
];

const registry = buildSkillRegistry({
  aiApps: importedAiApps,
  now: 1,
});
const routed = routeSkillQuery("帮我生成一份防火墙策略核查清单", registry, {
  mode: "auto",
});
const routedApp = findEnabledAiAppForSkill(importedAiApps, routed.selectedSkillId || undefined);

assert.equal(routed.selectedSkillId, "app-network-cutover");
assert.equal(routed.selectedSkillName, "网络割接助手");
assert.equal(routed.candidates[0].source, "ai-app");
assert.equal(routedApp?.id, "app-network-cutover");
assert.equal(routedApp?.name, "网络割接助手");
assert.equal(routedApp?.type, "workflow");
assert.equal(routedApp?.config.endpoint, "https://example.com/cutover");
assert.equal(routedApp?.config.requestStyle, "messages");
assert.equal(routedApp?.config.queryKey, "messages");
assert.equal(routedApp?.config.responseContentPath, "data.answer");
assert.equal(routedApp?.config.maxTokens, 4096);

console.log("AI app direct chat assertions passed");
