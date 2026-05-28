import assert from "node:assert/strict";
import { buildSkillFocusPath } from "./skillNavigation";

assert.equal(buildSkillFocusPath("app-hci"), "/skills?focusSkill=app-hci");
assert.equal(buildSkillFocusPath("app x"), "/skills?focusSkill=app%20x");
assert.equal(buildSkillFocusPath("中文 技能"), "/skills?focusSkill=%E4%B8%AD%E6%96%87%20%E6%8A%80%E8%83%BD");

console.log("Skill navigation assertions passed");
