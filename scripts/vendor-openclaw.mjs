import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = process.env.OPENCLAW_VENDOR_VERSION || "2026.5.27";
const root = process.cwd();
const vendorDir = join(root, "vendor", "openclaw-gateway");
const tempDir = mkdtempSync(join(tmpdir(), "mineecho-openclaw-"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    stdio: options.stdio || "inherit",
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
  return result;
}

try {
  run("npm", ["pack", `openclaw@${VERSION}`, "--silent"], { cwd: tempDir });
  const tarball = join(tempDir, `openclaw-${VERSION}.tgz`);
  run("tar", ["-xzf", tarball], { cwd: tempDir });

  const packageDir = join(tempDir, "package");
  const sourcePackageJson = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));

  rmSync(vendorDir, { recursive: true, force: true });
  mkdirSync(vendorDir, { recursive: true });

  for (const name of ["openclaw.mjs", "LICENSE", "README.md", "npm-shrinkwrap.json"]) {
    const source = join(packageDir, name);
    if (existsSync(source)) copyFileSync(source, join(vendorDir, name));
  }

  for (const name of ["dist", "skills", "scripts", "patches"]) {
    const source = join(packageDir, name);
    if (existsSync(source)) cpSync(source, join(vendorDir, name), { recursive: true });
  }

  const runtimePackageJson = {
    name: "mineecho-openclaw-gateway-runtime",
    version: sourcePackageJson.version,
    private: true,
    description: "Vendored OpenClaw Gateway runtime used by MineEcho.",
    type: sourcePackageJson.type || "module",
    license: sourcePackageJson.license || "MIT",
    engines: sourcePackageJson.engines || { node: ">=22.19.0" },
    bin: sourcePackageJson.bin || { openclaw: "openclaw.mjs" },
    dependencies: sourcePackageJson.dependencies || {},
    optionalDependencies: sourcePackageJson.optionalDependencies || {},
  };
  writeFileSync(join(vendorDir, "package.json"), JSON.stringify(runtimePackageJson, null, 2) + "\n", "utf8");

  const notice = [
    "# OpenClaw Gateway Runtime",
    "",
    `This directory vendors the OpenClaw npm package runtime used by MineEcho's PI/Gateway compatibility layer.`,
    "",
    `- Source package: openclaw@${sourcePackageJson.version}`,
    `- Source repository: ${sourcePackageJson.repository?.url || "https://github.com/openclaw/openclaw"}`,
    `- License: ${sourcePackageJson.license || "MIT"}`,
    "",
    "MineEcho keeps this runtime source in-repository so local users do not need to install OpenClaw separately. Third-party dependencies are installed by `npm run install:apps` into this directory's local `node_modules`, which is not committed.",
    "",
    "To refresh this runtime, run:",
    "",
    "```sh",
    "npm run vendor:openclaw",
    "npm --prefix vendor/openclaw-gateway install",
    "```",
    "",
  ].join("\n");
  writeFileSync(join(vendorDir, "NOTICE.md"), notice, "utf8");

  console.log(`Vendored openclaw@${sourcePackageJson.version} into ${vendorDir}`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
