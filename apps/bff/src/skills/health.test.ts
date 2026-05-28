import assert from "node:assert/strict";
import { buildSkillHealthReport, buildSkillHealthEntryFromInfo } from "./health.js";

const healthy = buildSkillHealthReport({
  entry: {
    id: "app-hci",
    name: "HCI 实施助手",
    description: "深信服超融合 HCI 部署、巡检、故障排查知识库",
    source: "ai-app",
    enabled: true,
    triggers: ["HCI", "超融合", "部署方案"],
    category: "AI 应用",
    appType: "rag",
  },
  extensionSkillRootPath: "/tmp/skills/app-hci",
  skillMarkdownPath: "/tmp/skills/app-hci/SKILL.md",
  executablePath: "/tmp/skills/app-hci/scripts/call.js",
  routeQuery: "帮我做一个超融合部署方案",
});

assert.equal(healthy.skillId, "app-hci");
assert.equal(healthy.name, "HCI 实施助手");
assert.equal(healthy.enabled, true);
assert.equal(healthy.source, "ai-app");
assert.equal(healthy.triggerCount, 3);
assert.equal(healthy.checks.metadata.status, "pass");
assert.equal(healthy.checks.triggers.status, "pass");
assert.equal(healthy.checks.executable.status, "pass");
assert.equal(healthy.checks.routing.status, "pass");
assert(healthy.routeScore !== undefined && healthy.routeScore >= 0.7);
assert(healthy.routeEvidence?.some((item) => item.type === "trigger" && item.value === "超融合"));

const missingTriggers = buildSkillHealthReport({
  entry: {
    id: "custom-empty",
    name: "空触发技能",
    description: "只有描述，没有触发词",
    source: "custom",
    enabled: true,
    triggers: [],
  },
});

assert.equal(missingTriggers.triggerCount, 0);
assert(["warn", "fail"].includes(missingTriggers.checks.triggers.status));
assert.notEqual(missingTriggers.checks.triggers.status, "pass");

const disabled = buildSkillHealthReport({
  entry: {
    id: "disabled-skill",
    name: "停用技能",
    description: "停用技能不应被自动路由",
    source: "trigger-index",
    enabled: false,
    triggers: ["停用"],
  },
  routeQuery: "停用",
});

assert.notEqual(disabled.checks.routing.status, "pass");
assert(["warn", "fail"].includes(disabled.checks.routing.status));

const builtinEntry = buildSkillHealthEntryFromInfo({
  id: "using-mineecho-skills",
  name: "using-mineecho-skills",
  description: "技能系统导航。当用户询问有什么技能时使用此技能。",
  source: "openclaw-builtin",
  enabled: true,
});

assert.equal(builtinEntry.id, "using-mineecho-skills");
assert.equal(builtinEntry.source, "trigger-index");
assert.equal(builtinEntry.enabled, true);
assert(builtinEntry.triggers.includes("using-mineecho-skills"));
assert(builtinEntry.triggers.includes("技能系统导航"));

console.log("Skill health assertions passed");
