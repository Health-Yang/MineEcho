/**
 * Run with: node src/routes/ai-apps.generated-script.assert.mjs
 */

import assert from "node:assert";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const source = await readFile(join(here, "ai-apps.ts"), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);

  const nextMarker = source.indexOf("\n/**", start + 1);
  assert.notEqual(nextMarker, -1, `${name} must be followed by a block marker`);
  return source.slice(start, nextMarker);
}

function assertTemplate(name) {
  const body = extractFunction(name);
  const script = materializeTemplate(body);

  assert(!body.includes("logger"), `${name} generated script must not reference logger`);
  assert(body.includes("process.stdout.write"), `${name} generated script must write result to stdout`);
  assert(body.includes("process.stderr.write"), `${name} generated script must write errors to stderr`);
  assert(body.includes("req.setTimeout(CONFIG.timeoutMs"), `${name} generated script must configure request timeout from config`);
  assert(body.includes("maxTokens"), `${name} generated script must carry app max token config`);
  assert(!body.includes("max_tokens: 8192"), `${name} generated script must not hardcode a small output cap`);
  assert(!body.includes("req.setTimeout(30000"), `${name} generated script must not use the old 30s timeout`);
  assert(!body.includes("console.log"), `${name} generated script must not log to console`);
  assert(!body.includes("console.error"), `${name} generated script must not log errors to console`);

  assert(!script.includes("logger"), `${name} materialized script must not reference logger`);
  assert(script.includes("process.stdout.write"), `${name} materialized script must write result to stdout`);
  assert(script.includes("process.stderr.write"), `${name} materialized script must write errors to stderr`);
  assert(script.includes("req.setTimeout(CONFIG.timeoutMs"), `${name} materialized script must configure request timeout from config`);
  assert(script.includes("maxTokens"), `${name} materialized script must carry max token config`);
  assert(!script.includes("max_tokens: 8192"), `${name} materialized script must not hardcode a small output cap`);
  assert(!script.includes("req.setTimeout(30000"), `${name} materialized script must not use the old 30s timeout`);
  const writeErrorMatch = script.match(/function writeError\(error\) \{([\s\S]*?)\n\}/);
  assert(writeErrorMatch, `${name} materialized script must define writeError`);
  assert(writeErrorMatch[1].includes("redactSecrets"), `${name} errors must be redacted before stderr`);
  assert(script.includes("[REDACTED]"), `${name} materialized script must redact secrets`);

  return script;
}

function materializeTemplate(body) {
  const match = body.match(/return `([\s\S]*)`;\n}/);
  assert(match, "generator must return a template literal");
  return match[1].replace(/\$\{[^}]+\}/g, JSON.stringify("test-value"));
}

async function assertValidJavaScript(name, script) {
  const dir = await mkdtemp(join(tmpdir(), "ai-apps-call-js-"));
  const scriptPath = join(dir, "call.js");
  try {
    await writeFile(scriptPath, script, "utf8");
    const check = spawnSync(process.execPath, ["--check", scriptPath], { encoding: "utf8" });
    assert.equal(check.status, 0, `${name} materialized script must be valid JavaScript\n${check.stderr}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

await assertValidJavaScript("generateRagScript", assertTemplate("generateRagScript"));
await assertValidJavaScript("generateWorkflowScript", assertTemplate("generateWorkflowScript"));

console.log("AI Apps generated call.js assertions passed");
