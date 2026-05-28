import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureStarterSkillsInstalled, STARTER_SKILLS } from "./starter-skill-installer.js";

const expectedStarterSkillIds = [
  "mineecho-systematic-debugging",
  "mineecho-command-log-analyst",
  "mineecho-code-reviewer",
  "mineecho-test-verifier",
  "mineecho-document-materials",
  "mineecho-spreadsheet-analyst",
  "mineecho-presentation-reporter",
  "mineecho-product-planner",
  "mineecho-project-planner",
  "mineecho-security-privacy",
  "mineecho-frontend-ui-reviewer",
  "mineecho-ai-tool-integrator",
];

const forbiddenProductTerms = ["Codex", "Claude Code", "Superpowers", "agent skills"];

const dir = await mkdtemp(join(tmpdir(), "mineecho-starter-skills-"));

try {
  const starterSkillIds = STARTER_SKILLS.map((skill) => skill.id);
  for (const expectedId of expectedStarterSkillIds) {
    assert(starterSkillIds.includes(expectedId), `missing starter skill ${expectedId}`);
  }
  assert.equal(new Set(starterSkillIds).size, STARTER_SKILLS.length);

  const first = await ensureStarterSkillsInstalled({ skillsDir: dir });
  assert.equal(first.installed, STARTER_SKILLS.length);
  assert.equal(first.skipped, 0);

  for (const skill of STARTER_SKILLS) {
    assert(skill.triggers.length >= 5, `${skill.id} should include clear triggers`);
    assert(skill.body.trim().startsWith(`# ${skill.name}`), `${skill.id} body should start with its name heading`);

    const skillPath = join(dir, skill.id, "SKILL.md");
    assert.equal(existsSync(skillPath), true);
    const content = await readFile(skillPath, "utf-8");
    assert(content.includes(`name: ${skill.name}`));
    assert(content.includes(`description: ${skill.description}`));
    assert(content.includes("triggers:"));
    for (const trigger of skill.triggers) {
      assert(content.includes(`  - ${trigger}`), `${skill.id} should render trigger ${trigger}`);
    }
    for (const forbiddenTerm of forbiddenProductTerms) {
      assert(!content.includes(forbiddenTerm), `${skill.id} should not expose ${forbiddenTerm}`);
    }
  }

  const existingPath = join(dir, STARTER_SKILLS[0].id, "SKILL.md");
  await readFile(existingPath, "utf-8");
  const second = await ensureStarterSkillsInstalled({ skillsDir: dir });
  assert.equal(second.installed, 0);
  assert.equal(second.skipped, STARTER_SKILLS.length);

  console.log("Starter skill installer assertions passed");
} finally {
  await rm(dir, { recursive: true, force: true });
}
