import assert from "node:assert/strict";
import { normalizeContextEvidence } from "./chatContextEvidence";

const normalized = normalizeContextEvidence({
  memories: [
    { type: "profile", label: "用户画像", preview: "React、TypeScript" },
    { type: "recent", label: "近期记忆", preview: "HCI 技术原理" },
    { type: "recent", label: "空", preview: "" },
  ],
  knowledge: [
    { path: "wiki/concepts/hci.md", label: "HCI 技术原理" },
    { path: "", label: "bad" },
  ],
  skill: { id: "hci-skill", name: "HCI Skill", score: 0.9 },
});

assert.equal(normalized.memories.length, 2);
assert.equal(normalized.knowledge.length, 1);
assert.equal(normalized.skill?.id, "hci-skill");

const empty = normalizeContextEvidence(null);
assert.deepEqual(empty.memories, []);
assert.deepEqual(empty.knowledge, []);
assert.equal(empty.skill, null);

console.log("Chat context evidence UI assertions passed");
