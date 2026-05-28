import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  extractSkillArchiveEntries,
  findSkillPackageRoot,
  validateSkillArchiveEntries,
  type SkillArchiveEntry,
} from "./import-package.js";

function file(entryName: string, content = ""): SkillArchiveEntry {
  return {
    isDirectory: false,
    entryName,
    getData: () => Buffer.from(content, "utf8"),
  };
}

function dir(entryName: string): SkillArchiveEntry {
  return {
    isDirectory: true,
    entryName,
    getData: () => Buffer.alloc(0),
  };
}

const nestedEntries = [
  dir("my-skill/"),
  file("my-skill/SKILL.md", "---\nname: Nested Skill\n---\n"),
  dir("my-skill/scripts/"),
  file("my-skill/scripts/call.js", "console.log('ok');"),
  file("README.md", "outer readme should not be imported"),
];

assert.equal(findSkillPackageRoot(nestedEntries), "my-skill/");
assert.deepEqual(validateSkillArchiveEntries(nestedEntries), []);

const targetDir = await mkdtemp(join(tmpdir(), "mineecho-skill-import-"));
try {
  await extractSkillArchiveEntries(nestedEntries, targetDir, "my-skill/");
  assert.equal(await readFile(join(targetDir, "SKILL.md"), "utf8"), "---\nname: Nested Skill\n---\n");
  assert.equal(await readFile(join(targetDir, "scripts", "call.js"), "utf8"), "console.log('ok');");
} finally {
  await rm(targetDir, { recursive: true, force: true });
}

assert.equal(findSkillPackageRoot([file("SKILL.md", "")]), "");
assert.deepEqual(validateSkillArchiveEntries([file("../evil.txt", "")]), [
  { code: "ZIP_PATH_TRAVERSAL", message: "压缩包包含不安全路径: ../evil.txt", file: "../evil.txt" },
]);
assert.deepEqual(validateSkillArchiveEntries([file("/absolute.txt", "")]), [
  { code: "ZIP_ABSOLUTE_PATH", message: "压缩包包含绝对路径: /absolute.txt", file: "/absolute.txt" },
]);

console.log("Skill import package assertions passed");
