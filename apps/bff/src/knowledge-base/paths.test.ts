import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { getKbBasePath, prepareKbBasePath } from "./paths.js";

const tmpRoot = mkdtempSync(join(tmpdir(), "mineecho-kb-path-"));
try {
  const mineechoHome = join(tmpRoot, ".mineecho");
  const newKb = join(tmpRoot, "knowledge");
  const legacyKb = join(tmpRoot, "v35-knowledge");
  mkdirSync(join(newKb, "wiki"), { recursive: true });
  writeFileSync(join(newKb, "wiki", "index.md"), "# scaffold\n");
  mkdirSync(join(legacyKb, "raw"), { recursive: true });
  mkdirSync(join(legacyKb, "wiki", "concepts"), { recursive: true });
  writeFileSync(join(legacyKb, "raw", "source.md"), "legacy raw");
  writeFileSync(join(legacyKb, "wiki", "concepts", "concept.md"), "# legacy concept");

  assert.equal(getKbBasePath({ MINEECHO_CONFIG_HOME: mineechoHome } as NodeJS.ProcessEnv), newKb);
  prepareKbBasePath({ MINEECHO_CONFIG_HOME: mineechoHome } as NodeJS.ProcessEnv);
  assert.equal(readFileSync(join(newKb, "raw", "source.md"), "utf8"), "legacy raw");
  assert.equal(readFileSync(join(newKb, "wiki", "concepts", "concept.md"), "utf8"), "# legacy concept");

  const existingRoot = mkdtempSync(join(tmpRoot, "existing-"));
  const existingHome = join(existingRoot, ".mineecho");
  const existingKb = join(dirname(existingHome), "knowledge");
  const existingLegacy = join(dirname(existingHome), "v35-knowledge");
  mkdirSync(join(existingKb, "raw"), { recursive: true });
  writeFileSync(join(existingKb, "raw", "current.md"), "current");
  mkdirSync(join(existingLegacy, "raw"), { recursive: true });
  writeFileSync(join(existingLegacy, "raw", "legacy.md"), "legacy");

  prepareKbBasePath({ MINEECHO_CONFIG_HOME: existingHome } as NodeJS.ProcessEnv);
  assert.equal(readFileSync(join(existingKb, "raw", "current.md"), "utf8"), "current");
  assert.equal(existsSync(join(existingKb, "raw", "legacy.md")), false);
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

console.log("Knowledge base path assertions passed");
