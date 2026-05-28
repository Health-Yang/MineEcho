#!/usr/bin/env node

import { copyFileSync, mkdirSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

function readArg(name, fallback) {
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

const sourceRoot = resolve(readArg("--source", process.cwd()));
const packageJson = JSON.parse(readFileSync(join(sourceRoot, "package.json"), "utf8"));
const defaultOut = join(sourceRoot, "releases", `mineecho-source-${packageJson.version || "dev"}`);
const outRoot = resolve(readArg("--out", defaultOut));
const skipCheck = args.includes("--skip-check");

const ignoredSegments = new Set([
  "node_modules",
  "dist",
  "release",
  "releases",
  "out",
  "coverage",
  ".git",
  ".cache",
  ".vite",
  ".turbo",
  ".next",
  ".nuxt",
  "__pycache__",
  ".venv",
  "venv",
  "env",
]);

const blockedNames = new Set([
  ".env",
  ".mineecho",
  ".openclaw",
  "workspace",
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

function normalizeRel(path) {
  return path.split(sep).join("/");
}

function shouldExclude(src) {
  const rel = normalizeRel(relative(sourceRoot, src));
  if (!rel) return false;
  if (allowedRelativePaths.has(rel)) return false;

  const parts = rel.split("/");
  if (parts.some((part) => ignoredSegments.has(part))) return true;

  const base = parts[parts.length - 1];
  return (
    blockedNames.has(base) ||
    (base.startsWith(".env.") && base !== ".env.example") ||
    base.endsWith(".sqlite") ||
    base.endsWith(".sqlite3") ||
    base.endsWith(".db") ||
    base.endsWith(".pem") ||
    base.endsWith(".key") ||
    base.endsWith(".log") ||
    base === ".DS_Store"
  );
}

if (outRoot === sourceRoot) {
  console.error("Refusing to export over the source directory.");
  process.exit(1);
}

if (sourceRoot.startsWith(`${outRoot}${sep}`)) {
  console.error("Refusing to export into a parent directory of the source.");
  process.exit(1);
}

rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

function copyFiltered(srcDir, destDir) {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const resolved = resolve(src);
    if (resolved === outRoot || resolved.startsWith(`${outRoot}${sep}`)) continue;
    if (shouldExclude(resolved)) continue;

    const dest = join(destDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(dest, { recursive: true });
      copyFiltered(src, dest);
    } else if (entry.isSymbolicLink()) {
      symlinkSync(readlinkSync(src), dest);
    } else if (entry.isFile()) {
      mkdirSync(destDir, { recursive: true });
      copyFileSync(src, dest);
    }
  }
}

copyFiltered(sourceRoot, outRoot);

if (!skipCheck) {
  const result = spawnSync(process.execPath, [join(outRoot, "scripts", "check-release.mjs")], {
    cwd: outRoot,
    encoding: "utf8",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Release source exported to ${outRoot}`);
