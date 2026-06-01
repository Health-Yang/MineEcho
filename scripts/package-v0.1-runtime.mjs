#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { arch, platform } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const root = process.cwd();
const packageJson = JSON.parse(readFile("package.json"));
const includeNodeModules = !args.includes("--no-node-modules");
const skipBuild = args.includes("--skip-build");
const outArg = readArg("--out");
const outRoot = resolve(outArg || join(root, "releases", `MineEcho-v${packageJson.version}-runtime-${platform()}-${arch()}`));

const blockedNames = new Set([
  ".env",
  ".mineecho",
  ".openclaw",
  ".git",
  ".cache",
  ".vite",
  "workspace",
  ".runtime",
  "release",
  "releases",
  "out",
  "coverage",
  "encrypted-keys.json",
  "openclaw.json",
  "ai-apps.json",
  "custom-skills.json",
  "tokenjuice-metrics.json",
  "performance-metrics.json",
  "enterprise.json",
]);

const allowedRelativePaths = new Set([
  "apps/bff/.env.example",
  "apps/console/.env.example",
]);

const alwaysSkipSegments = new Set([".git", "release", "releases", "out", "coverage"]);

main();

function main() {
  assertNotInsideSource();

  if (!skipBuild) {
    run("npm", ["run", "build"]);
  }

  if (includeNodeModules) {
    assertExists("apps/bff/node_modules");
    assertExists("apps/console/node_modules");
    assertExists("vendor/openclaw-gateway/node_modules");
  }

  rmSync(outRoot, { recursive: true, force: true });
  mkdirSync(outRoot, { recursive: true });
  copyFiltered(root, outRoot);
  writeRuntimeManifest();

  console.log(`MineEcho v0.1 runtime package exported to ${outRoot}`);
  console.log(includeNodeModules ? "Included node_modules for offline-first startup." : "Skipped node_modules by request.");
}

function readArg(name) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return "";
}

function readFile(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function assertNotInsideSource() {
  if (outRoot === root || root.startsWith(`${outRoot}${sep}`)) {
    throw new Error("Refusing to export over the source directory or into its parent.");
  }
}

function assertExists(relPath) {
  if (!existsSync(join(root, relPath))) {
    throw new Error(`Missing ${relPath}. Run npm run install:apps before packaging the offline runtime.`);
  }
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed with exit code ${result.status}`);
  }
}

function copyFiltered(srcDir, destDir) {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const rel = normalize(relative(root, src));
    if (!rel) continue;
    if (resolve(src) === outRoot || resolve(src).startsWith(`${outRoot}${sep}`)) continue;
    if (shouldExclude(rel, entry.name)) continue;

    const dest = join(destDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(dest, { recursive: true });
      copyFiltered(src, dest);
    } else if (entry.isFile()) {
      mkdirSync(destDir, { recursive: true });
      copyFileSync(src, dest);
    } else if (entry.isSymbolicLink()) {
      mkdirSync(destDir, { recursive: true });
      symlinkSync(readlinkSync(src), dest);
    }
  }
}

function shouldExclude(rel, name) {
  if (allowedRelativePaths.has(rel)) return false;
  const parts = rel.split("/");
  if (parts.some((part) => alwaysSkipSegments.has(part))) return true;
  if (!includeNodeModules && parts.includes("node_modules")) return true;
  if (blockedNames.has(name)) return true;
  if (name.startsWith(".env.") && name !== ".env.example") return true;
  if (name.endsWith(".sqlite") || name.endsWith(".sqlite3") || name.endsWith(".db")) return true;
  if (name.endsWith(".pem") || name.endsWith(".key") || name.endsWith(".log")) return true;
  if (name.endsWith(".tsbuildinfo") || name === ".DS_Store") return true;

  if (parts.includes("node_modules")) {
    return isNodeModuleJunk(name);
  }
  return false;
}

function isNodeModuleJunk(name) {
  return (
    name === ".cache" ||
    name === ".package-lock.json" ||
    name === ".DS_Store" ||
    name === "npm-debug.log"
  );
}

function normalize(path) {
  return path.split(sep).join("/");
}

function writeRuntimeManifest() {
  const manifest = {
    name: "MineEcho v0.1 runtime package",
    version: packageJson.version,
    platform: platform(),
    arch: arch(),
    includesNodeModules: includeNodeModules,
    includesOpenClawGateway: existsSync(join(outRoot, "vendor", "openclaw-gateway", "openclaw.mjs")),
    packagedAt: new Date().toISOString(),
    startup: {
      macosLinux: "./start-mineecho-v0.1.sh",
      windows: "start-mineecho-v0.1.bat",
      consoleUrl: "http://127.0.0.1:5175",
    },
  };
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(join(outRoot, "RUNTIME-MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}
