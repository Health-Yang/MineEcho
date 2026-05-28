import assert from "node:assert/strict";
import { buildSkillRegistry } from "./registry.js";
import { routeSkillQuery } from "./router.js";

const registry = buildSkillRegistry({
  customSkills: [
    {
      id: "custom-hci-planner",
      name: "HCI 方案规划",
      description: "用于深信服 HCI 超融合架构、资源规划和实施方案生成",
      category: "skill",
      enabled: true,
    },
  ],
  state: {},
  now: 1,
});

assert.equal(registry.entries.length, 1);
assert.equal(registry.entries[0].id, "custom-hci-planner");
assert(registry.entries[0].triggers.some((trigger) => trigger.includes("HCI")));

const result = routeSkillQuery("请帮我生成一份深信服 HCI 超融合实施方案", registry, {
  mode: "auto",
});

assert.equal(result.selectedSkillId, "custom-hci-planner");
assert.equal(result.selectedSkillName, "HCI 方案规划");
assert(result.candidates[0].score >= 0.35);

const disabledRegistry = buildSkillRegistry({
  customSkills: [
    {
      id: "custom-hci-planner",
      name: "HCI 方案规划",
      description: "用于深信服 HCI 超融合架构、资源规划和实施方案生成",
      category: "skill",
      enabled: false,
    },
  ],
  state: {},
  now: 1,
});

assert.equal(routeSkillQuery("HCI 实施方案", disabledRegistry).selectedSkillId, null);

console.log("Skill import route assertions passed");
