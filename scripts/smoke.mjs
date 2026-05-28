const consoleUrl = normalizeBaseUrl(
  process.env.MINEECHO_CONSOLE_URL || "http://127.0.0.1:5175",
);

const checks = [
  {
    name: "BFF health through Console proxy",
    path: "/api/health",
    validate: (body) =>
      body &&
      typeof body === "object" &&
      (body.status === "ok" || body.ok === true),
  },
  {
    name: "Knowledge-base consistency",
    path: "/api/knowledge-base/consistency",
    validate: (body) => {
      const payload = body?.data || body;
      return (
        payload &&
        typeof payload === "object" &&
        payload.status === "ok" &&
        Number.isFinite(payload.fileCount) &&
        Number.isFinite(payload.graphNodeCount) &&
        Array.isArray(payload.staleGraphSources)
      );
    },
  },
];

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function fetchJson(path) {
  const response = await fetch(`${consoleUrl}${path}`, {
    headers: { accept: "application/json" },
  });
  const text = await response.text();

  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`expected JSON but received: ${text.slice(0, 160)}`);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

console.log(`Running smoke checks against ${consoleUrl}`);

let failed = false;

for (const check of checks) {
  try {
    const body = await fetchJson(check.path);
    if (!check.validate(body)) {
      throw new Error(`unexpected response shape: ${JSON.stringify(body)}`);
    }
    console.log(`ok - ${check.name}`);
  } catch (error) {
    failed = true;
    console.error(`fail - ${check.name}`);
    console.error(`  ${error.message}`);
  }
}

if (failed) {
  console.error("\nStart MineEcho with `npm run dev`, then run `npm run smoke` again.");
  process.exit(1);
}

console.log("Smoke checks passed.");
