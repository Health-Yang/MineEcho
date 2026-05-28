import { spawnSync } from "node:child_process";

const auditLevel = process.env.MINEECHO_AUDIT_LEVEL || "high";
const apps = [
  { name: "BFF", prefix: "apps/bff" },
  { name: "Console", prefix: "apps/console" },
];

let failed = false;

for (const app of apps) {
  console.log(`\n== ${app.name}: npm audit --audit-level=${auditLevel} ==`);
  const result = spawnSync(
    "npm",
    ["--prefix", app.prefix, "audit", `--audit-level=${auditLevel}`],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "inherit",
    },
  );

  if (result.error) {
    failed = true;
    console.error(`${app.name} audit could not start: ${result.error.message}`);
    continue;
  }

  if (result.status !== 0) {
    failed = true;
  }
}

if (failed) {
  console.error(
    `\nDependency audit failed at level "${auditLevel}". Review the advisories before publishing.`,
  );
  process.exit(1);
}

console.log(`\nDependency audit passed at level "${auditLevel}".`);
