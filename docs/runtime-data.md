# Runtime Data

MineEcho is local-first. Runtime data, credentials, imported skills, and user content should stay outside source control.

## Main Runtime Directory

By default the BFF stores local runtime files under:

```sh
apps/bff/.mineecho/
```

Set `MINEECHO_CONFIG_HOME` to move this directory:

```sh
MINEECHO_CONFIG_HOME=/path/to/mineecho-data
```

`MINECHO_CONFIG_HOME` is still accepted as a legacy alias, but `MINEECHO_CONFIG_HOME` takes precedence when both are set. On startup, if both are set, the new directory is empty, and the legacy directory exists, MineEcho copies the legacy runtime files into the new directory once.

The repository ignores `.mineecho/`, `.openclaw/`, `apps/**/.mineecho/`, `apps/**/.openclaw/`, and `apps/**/workspace/`.

## Common Files

| Path | Purpose | Contains sensitive data? | Safe to delete? |
| --- | --- | --- | --- |
| `.mineecho/.env` | Local runtime environment written by setup/config flows | Yes | Yes, but local config is lost |
| `.mineecho/encrypted-keys.json` | Stored provider/API credentials | Yes | Yes, but providers must be configured again |
| `.mineecho/enterprise.json` | Enterprise/account integration config | Maybe | Yes, but enterprise mode is reset |
| `.mineecho/ai-apps.json` | AI app connection metadata | Often, if API keys are configured | Yes, imported AI apps are removed |
| `.mineecho/custom-skills.json` | JSON-imported skill metadata | Usually no | Yes, imported custom skills are removed |
| `.mineecho/skills-state.json` | Skill enable/disable flags | No | Yes, skill toggles reset |
| `.mineecho/tokenjuice-metrics.json` | TokenJuice compression/cost metrics | No direct secrets | Yes, metrics reset |
| `.mineecho/performance-metrics.json` | Console performance telemetry posted to the BFF | May include paths/user-agent/IP | Yes, metrics reset |
| `.mineecho/chat-history/` | Local chat transcripts | Yes | Yes, chat history is removed |
| `.mineecho/audio/` | Meeting/audio recordings | Yes | Yes, recordings are removed |
| `.mineecho/logs/` | Audit and diagnostic logs | Maybe | Yes, logs are removed |
| `.mineecho/.usage-queue/` | Queued usage reports | Maybe | Yes, unsent reports are removed |
| `.mineecho/sync-tasks.json` | Skill sync task progress | No | Yes, sync progress resets |

Core BFF runtime files use the shared `getMineEchoHome()` resolver, so setting `MINEECHO_CONFIG_HOME` keeps credentials, imported skills, metrics, chat history, recordings, device identity, and workspace config under the same runtime directory.

## AI App Runtime Limits

For OpenAI/FastGPT-style AI apps, MineEcho sends `max_tokens` with chat requests. The priority is:

1. Per-app "Max output tokens" in the AI Apps page.
2. `MINEECHO_AI_APP_MAX_TOKENS`.
3. Default `65536`.

Values below `512` are ignored and values above `131072` are clamped. The external model or platform may still enforce a lower limit.

`MINEECHO_AI_APP_TIMEOUT_MS` controls the external AI app request timeout. The default is `120000` ms; valid values are clamped to `5000`-`600000` ms.

## PI/Gateway Compatibility Data

MineEcho is developed on top of capabilities from the OpenClaw PI framework, and the current runtime still reuses Gateway-related packages and protocol capabilities. Gateway compatibility runtime files commonly live under:

```sh
apps/bff/.openclaw/
```

or under the directory pointed to by `OPENCLAW_HOME`.

Typical contents include Gateway tokens, generated workspace state, imported Gateway skills, and local tool output. Treat this directory as runtime state and keep it out of commits.

## Knowledge Base Data

Knowledge-base files are managed by the BFF knowledge-base service and may include:

- Imported raw documents.
- Generated wiki pages.
- Graph/embedding/index state.
- `alignment-history.json`, which records reviewed memory-to-knowledge alignment commits.

These files can contain private user or company knowledge. Do not publish them with the repository.

## Cleanup Checklist Before Publishing

Run from the repository root:

```sh
npm run check:release
```

Expected output for a clean open-source tree is a passing message. For local diagnostics without failing the command, run:

```sh
node scripts/check-release.mjs --warn-only
```

## Current Cleanup Roadmap

- Continue auditing lower-priority learning/analytics paths so historical trajectory data follows the same runtime directory policy.
- Move JSON runtime stores that grow over time to SQLite or append-only JSONL where useful.
- Add an explicit export/redaction command for sharing diagnostics without leaking user data.
