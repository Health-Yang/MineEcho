import assert from "node:assert/strict";
import { buildPreferredSkillPayload } from "./preferredSkill";
import type { SkillRouteResult } from "./skillRoute";

const route: SkillRouteResult = {
  query: "帮我做超融合部署方案",
  selectedSkillId: "app-hci",
  selectedSkillName: "HCI 实施助手",
  candidates: [],
};

assert.deepEqual(buildPreferredSkillPayload(route), {
  skillId: "app-hci",
  skillName: "HCI 实施助手",
});

assert.equal(buildPreferredSkillPayload({ ...route, selectedSkillId: null }), undefined);
assert.equal(buildPreferredSkillPayload(null), undefined);

console.log("Preferred skill payload assertions passed");
