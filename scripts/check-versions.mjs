import { readFileSync } from "node:fs";

const files = [
  "package.json",
  "apps/bff/package.json",
  "apps/bff/package-lock.json",
  "apps/console/package.json",
  "apps/console/package-lock.json",
];

const versions = files.map((file) => {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const packageVersion = data.version;
  const rootPackageVersion = data.packages?.[""]?.version;
  return {
    file,
    version: rootPackageVersion || packageVersion,
  };
});

const expected = versions[0].version;
const mismatches = versions.filter((entry) => entry.version !== expected);

if (mismatches.length === 0) {
  console.log(`Version check passed: ${expected}`);
  process.exit(0);
}

console.error(`Version check failed: expected all MineEcho packages to use ${expected}`);
for (const entry of versions) {
  const marker = entry.version === expected ? " " : "*";
  console.error(`${marker} ${entry.file}: ${entry.version}`);
}
process.exit(1);
