import assert from "node:assert/strict";
import { processMessageForTriggers } from "./matcher.js";
import { buildSkillRegistry } from "../skills/registry.js";

const registry = buildSkillRegistry({
  customSkills: [
    {
      id: "custom-risk-review",
      name: "交付风险评审",
      description: "识别项目交付风险、客户沟通风险和上线回退风险",
      category: "skill",
      enabled: true,
    },
  ],
  aiApps: [
    {
      id: "app-firewall",
      name: "防火墙策略助手",
      description: "生成防火墙策略核查清单和割接方案",
      type: "workflow",
      enabled: true,
      config: { endpoint: "https://example.invalid/api" },
    },
  ],
});

const customMatched = await processMessageForTriggers("user-1", "这个项目交付有什么风险", {
  registry,
});

assert.equal(customMatched.skillInjected, true);
assert.equal(customMatched.matchedTrigger?.trigger.skillId, "custom-risk-review");
assert(customMatched.processedMessage.includes("[使用技能:交付风险评审]"));

const appMatched = await processMessageForTriggers("user-1", "帮我生成防火墙策略核查清单", {
  registry,
});

assert.equal(appMatched.skillInjected, true);
assert.equal(appMatched.matchedTrigger?.trigger.skillId, "app-firewall");
assert(appMatched.processedMessage.includes("[使用技能:防火墙策略助手]"));

console.log("Registry fallback trigger assertions passed");
