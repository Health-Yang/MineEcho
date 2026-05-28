import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempRoot = mkdtempSync(join(tmpdir(), "mineecho-export-test-"));
const source = join(tempRoot, "source");
const output = join(tempRoot, "release");

mkdirSync(join(source, "apps", "bff", ".mineecho"), { recursive: true });
mkdirSync(join(source, "apps", "bff", ".openclaw"), { recursive: true });
mkdirSync(join(source, "apps", "bff", "workspace"), { recursive: true });
mkdirSync(join(source, "apps", "bff"), { recursive: true });
mkdirSync(join(source, "src"), { recursive: true });

writeFileSync(join(source, "package.json"), JSON.stringify({ name: "mineecho-test", version: "9.9.9" }));
writeFileSync(join(source, ".env"), "SECRET=1");
writeFileSync(join(source, "apps", "bff", ".env.example"), "EXAMPLE=1");
writeFileSync(join(source, "apps", "bff", ".env.local"), "SECRET=1");
writeFileSync(join(source, "apps", "bff", ".mineecho", "token.json"), "{}");
writeFileSync(join(source, "apps", "bff", ".openclaw", "openclaw.json"), "{}");
writeFileSync(join(source, "apps", "bff", "workspace", "data.txt"), "runtime");
writeFileSync(join(source, "src", "index.ts"), "export {};\n");

const result = spawnSync(process.execPath, [
  join(process.cwd(), "scripts", "export-release.mjs"),
  "--source",
  source,
  "--out",
  output,
  "--skip-check",
], {
  cwd: process.cwd(),
  encoding: "utf8",
});

try {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(join(output, "package.json")), true);
  assert.equal(existsSync(join(output, "src", "index.ts")), true);
  assert.equal(existsSync(join(output, "apps", "bff", ".env.example")), true);
  assert.equal(existsSync(join(output, ".env")), false);
  assert.equal(existsSync(join(output, "apps", "bff", ".env.local")), false);
  assert.equal(existsSync(join(output, "apps", "bff", ".mineecho")), false);
  assert.equal(existsSync(join(output, "apps", "bff", ".openclaw")), false);
  assert.equal(existsSync(join(output, "apps", "bff", "workspace")), false);
  console.log("Release export assertions passed");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
