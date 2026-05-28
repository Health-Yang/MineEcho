import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getMineEchoHome, prepareMineEchoHome } from "./config-path.js";

assert.equal(getMineEchoHome({ MINEECHO_CONFIG_HOME: "/tmp/mineecho-config" }), "/tmp/mineecho-config");
assert.equal(getMineEchoHome({ MINECHO_CONFIG_HOME: "/tmp/legacy-minecho-config" }), "/tmp/legacy-minecho-config");
assert.equal(
  getMineEchoHome({
    MINEECHO_CONFIG_HOME: "/tmp/mineecho-config",
    MINECHO_CONFIG_HOME: "/tmp/legacy-minecho-config",
  }),
  "/tmp/mineecho-config"
);
assert.equal(getMineEchoHome({}), join(process.cwd(), ".mineecho"));

const tmpRoot = mkdtempSync(join(tmpdir(), "mineecho-config-path-"));
try {
  const legacyHome = join(tmpRoot, "legacy");
  const newHome = join(tmpRoot, "new");
  mkdirSync(legacyHome, { recursive: true });
  writeFileSync(join(legacyHome, "marker.txt"), "legacy", { flag: "wx" });

  prepareMineEchoHome({
    MINECHO_CONFIG_HOME: legacyHome,
    MINEECHO_CONFIG_HOME: newHome,
  });

  assert.equal(readFileSync(join(newHome, "marker.txt"), "utf8"), "legacy");

  const existingNewHome = join(tmpRoot, "existing-new");
  mkdirSync(existingNewHome, { recursive: true });
  writeFileSync(join(existingNewHome, "marker.txt"), "new", { flag: "wx" });
  prepareMineEchoHome({
    MINECHO_CONFIG_HOME: legacyHome,
    MINEECHO_CONFIG_HOME: existingNewHome,
  });
  assert.equal(readFileSync(join(existingNewHome, "marker.txt"), "utf8"), "new");
  assert.equal(existsSync(join(existingNewHome, "marker.txt")), true);
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}

console.log("MineEcho config path assertions passed");
