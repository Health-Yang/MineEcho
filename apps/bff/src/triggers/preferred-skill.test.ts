import assert from "node:assert/strict";
import { buildPreferredSkillMatch } from "./matcher.js";

const entries = [
  {
    skillId: "app-hci",
    name: "HCI 实施助手",
    triggers: ["HCI", "超融合"],
  },
  {
    skillId: "doc-summary",
    name: "文档摘要",
    triggers: ["摘要"],
  },
];

const match = buildPreferredSkillMatch("user-1", { skillId: "app-hci", skillName: "客户端名称" }, entries);

assert.equal(match?.trigger.skillId, "app-hci");
assert.equal(match?.trigger.skillName, "HCI 实施助手");
assert.equal(match?.confidence, 1);
assert.equal(match?.matchType, "exact");

const missing = buildPreferredSkillMatch("user-1", { skillId: "missing", skillName: "Missing" }, entries);
assert.equal(missing, null);

const empty = buildPreferredSkillMatch("user-1", { skillId: "   ", skillName: "Blank" }, entries);
assert.equal(empty, null);

console.log("Preferred skill trigger assertions passed");
