import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const warnOnly = process.argv.includes("--warn-only");
const root = process.cwd();

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

const findings = [];

function shouldSkip(relPath) {
  if (!relPath) return false;
  return relPath.split(sep).some((segment) => ignoredSegments.has(segment));
}

function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(root, fullPath);
    if (shouldSkip(relPath)) continue;
    if (allowedRelativePaths.has(relPath)) continue;

    const isBlockedFile =
      blockedNames.has(entry.name) ||
      (entry.name.startsWith(".env.") && entry.name !== ".env.example") ||
      entry.name.endsWith(".sqlite") ||
      entry.name.endsWith(".sqlite3") ||
      entry.name.endsWith(".db") ||
      entry.name.endsWith(".pem") ||
      entry.name.endsWith(".key") ||
      entry.name.endsWith(".tsbuildinfo");

    if (isBlockedFile) {
      findings.push({
        path: relPath,
        type: entry.isDirectory() ? "directory" : "file",
      });
      if (entry.isDirectory()) continue;
    }

    if (entry.isDirectory()) {
      scan(fullPath);
    } else if (entry.isSymbolicLink()) {
      try {
        if (statSync(fullPath).isDirectory()) scan(fullPath);
      } catch {
        // Broken symlinks are not release blockers here.
      }
    }
  }
}

scan(root);

if (findings.length === 0) {
  console.log("Release check passed: no runtime data or sensitive local files found.");
  process.exit(0);
}

console.error("Release check found runtime data or sensitive local files:");
for (const finding of findings.sort((a, b) => a.path.localeCompare(b.path))) {
  console.error(`- ${finding.path} (${finding.type})`);
}
console.error("\nRemove these from the publish tree or run from a clean export before open-sourcing.");

process.exit(warnOnly ? 0 : 1);
