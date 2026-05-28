import assert from "node:assert/strict";
import {
  buildKnowledgeEvidence,
  buildMemoryEvidence,
  buildSkillEvidence,
} from "./chat-context-evidence.js";

const memory = buildMemoryEvidence({
  userProfile: {
    workStyle: "专业风格，偏好详细回复",
    technicalStack: ["React", "TypeScript"],
    domainExpertise: ["HCI"],
    preferredResponseLength: "detailed",
  },
  recentInteractions: [
    { type: "question", content: "用户询问 HCI 技术原理", importance: 0.9 },
  ],
  relevantTreeMemories: [
    { label: "2026-05-26", content: "用户前几天问过 HCI 和知识图谱优化。", source: "conversation" },
  ],
});

assert.equal(memory.length, 3);
assert.equal(memory[0].type, "profile");
assert(memory[0].label.includes("用户画像"));
assert.equal(memory[1].type, "recent");
assert(memory[1].preview.includes("HCI"));
assert.equal(memory[2].type, "tree");
assert(memory[2].preview.includes("前几天"));

const knowledge = buildKnowledgeEvidence([
  { metadata: { filePath: "wiki/concepts/hci.md", title: "HCI 技术原理" } },
  { metadata: { filePath: "wiki/concepts/hci.md", title: "HCI 技术原理" } },
  { metadata: { filePath: "wiki/sources/report.md" } },
]);

assert.equal(knowledge.length, 2);
assert.equal(knowledge[0].path, "wiki/concepts/hci.md");
assert.equal(knowledge[0].label, "HCI 技术原理");
assert.equal(knowledge[1].label, "report.md");

const skill = buildSkillEvidence({
  skillId: "hci-solution-generator",
  skillName: "HCI 方案生成器",
  score: 12,
});

assert.equal(skill?.id, "hci-solution-generator");
assert.equal(skill?.name, "HCI 方案生成器");

assert.equal(buildSkillEvidence({ skillId: undefined, skillName: undefined }), null);

console.log("Chat context evidence assertions passed");
