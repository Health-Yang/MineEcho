# Release Checklist

Use this before publishing MineEcho as a source-available repository or cutting a public release.

## 1. Work From A Clean Tree

Create a clean export or fresh clone. Do not publish from a local development directory that contains runtime state.

Required check:

```sh
npm run export:release
npm run check:release
npm run check:versions
```

The export command writes a filtered source tree to `releases/mineecho-source-<version>/` and runs the release data check inside that export. Publish from the export directory or a fresh clone, not from a local development tree.

The checks must pass. If they report `.mineecho/`, `.openclaw/`, `apps/**/workspace/`, local databases, keys, runtime JSON files, logs, or env files, remove them from the publish tree.
The version check must show the same MineEcho version across the root package, BFF package, Console package, and their lock files.

## 2. Verify Builds And Focused Tests

```sh
npm run verify
npm run audit:apps
```

Expected result:

- BFF URL test passes.
- LightRAG path test passes.
- Knowledge task test passes.
- Version check passes.
- BFF TypeScript build passes.
- Console TypeScript/Vite build passes.
- Dependency audit has no high or critical advisories.

The Console build may warn about large chunks. That is acceptable until the graph and Mermaid dependencies are split further at the page/component level.

`npm run audit:apps` defaults to `MINEECHO_AUDIT_LEVEL=high`. Use `MINEECHO_AUDIT_LEVEL=moderate npm run audit:apps` when you want a stricter dependency review.

Known dependency note: BFF currently uses `exceljs@4.4.0`, whose latest published version still depends on `uuid@8`. npm may suggest `npm audit fix --force`, but that recommendation downgrades `exceljs` and should not be applied without a spreadsheet import regression pass.

## 3. Check Documentation

Review these files:

- `README.md`
- `README.zh-CN.md`
- `LICENSE`
- `COMMERCIAL.md`
- `COMMERCIAL.zh-CN.md`
- `CONTRIBUTING.md`
- `CONTRIBUTING.zh-CN.md`
- `SECURITY.md`
- `SECURITY.zh-CN.md`
- `CHANGELOG.md`
- `docs/environment.md`
- `docs/environment.zh-CN.md`
- `docs/architecture.md`
- `docs/architecture.zh-CN.md`
- `docs/product-positioning.zh-CN.md`
- `docs/runtime-data.md`
- `docs/runtime-data.zh-CN.md`
- `docs/known-limitations.zh-CN.md`

Confirm ports, commands, runtime paths, and compatibility notes match the code.
Confirm that user-facing product docs use MineEcho as the product name and mention OpenClaw only as Gateway compatibility or legacy configuration context.

## 4. Check Runtime Defaults

Expected defaults:

- Console dev URL: `http://127.0.0.1:5175/`
- BFF URL: `http://127.0.0.1:3085/`
- Gateway port: `18789`
- Local auth bypass is enabled unless `VITE_MINEECHO_AUTH_REQUIRED=true`.
- BFF auth is disabled unless `MINECHO_REQUIRE_AUTH=true`.

## 5. Check Compatibility Boundaries

Do not rename OpenClaw Gateway protocol paths, config paths, or package integration code without a migration plan.

Legacy aliases may remain only when intentional:

- `MINECHO_CONFIG_HOME`
- `MINECHO_KB_BASE_PATH`
- `SCLAW_HOST`

## 6. Check GitHub Metadata

Confirm these files exist:

- `.github/workflows/ci.yml`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/config.yml`

## 7. Manual Smoke Test

With the dev services running:

```sh
npm run smoke
```

If you need to target a non-default Console URL, set `MINEECHO_CONSOLE_URL` before running the command.

Then open `http://127.0.0.1:5175/` and verify:

- Console opens without forced login by default.
- Chat page can reach the BFF.
- Knowledge Base task center renders.
- Skill Center and AI Apps pages load.
