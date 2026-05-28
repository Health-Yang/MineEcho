import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const bffDir = join(root, "apps", "bff");
const consoleDir = join(root, "apps", "console");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
let shuttingDown = false;

const missing = [
  [join(bffDir, "node_modules"), "apps/bff"],
  [join(consoleDir, "node_modules"), "apps/console"],
].filter(([path]) => !existsSync(path));

if (missing.length > 0) {
  console.error("Missing dependencies:");
  for (const [, label] of missing) {
    console.error(`- ${label}`);
  }
  console.error("\nRun `npm run install:apps` first.");
  process.exit(1);
}

const services = [
  {
    name: "bff",
    cwd: bffDir,
    args: ["run", "dev"],
  },
  {
    name: "console",
    cwd: consoleDir,
    args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5175"],
  },
];

const children = services.map((service) => {
  const child = spawn(npmCommand, service.args, {
    cwd: service.cwd,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    process.stdout.write(prefixLines(service.name, chunk));
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(prefixLines(service.name, chunk));
  });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[${service.name}] exited with ${signal ?? code}`);
    shutdown(code ?? 1);
  });

  return child;
});

function prefixLines(name, chunk) {
  const text = chunk.toString();
  return text
    .split(/\n/)
    .map((line, index, lines) => {
      if (index === lines.length - 1 && line === "") return "";
      return `[${name}] ${line}`;
    })
    .join("\n");
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
