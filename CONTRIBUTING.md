# Contributing

Thanks for contributing to MineEcho. The project is still moving quickly, so keep changes small, verifiable, and local-first.

## Development Setup

```sh
npm run install:apps
cp apps/bff/.env.example apps/bff/.env
npm run dev
```

Open the Console at `http://127.0.0.1:5175/`. The BFF runs at `http://127.0.0.1:3085/`.

## Verification

Run the root verification command before opening a pull request:

```sh
npm run verify
```

Pull requests also run GitHub Actions CI with `npm run check:release` and `npm run verify`.
`npm run verify` includes a version consistency check across the root, BFF, and Console packages.

For focused work, use the package-level scripts in `apps/bff/package.json` and `apps/console/package.json`.

## Local Data and Secrets

Do not commit runtime data or secrets. In particular, keep these out of commits:

- `.env` and `.env.*`, except checked-in `.env.example` files.
- `.mineecho/`
- `.openclaw/`
- `apps/**/.mineecho/`
- `apps/**/.openclaw/`
- `apps/**/workspace/`
- local databases, logs, recordings, imported documents, AI app credentials, and Gateway tokens.

Before publishing a branch, run the cleanup check in `docs/runtime-data.md`.

```sh
npm run check:release
```

If you find a vulnerability or accidental secret exposure, follow [`SECURITY.md`](SECURITY.md). Do not include exploit details, private data, or real credentials in public issues.

## Compatibility Boundaries

MineEcho embeds OpenClaw as a Gateway compatibility layer. Do not rename OpenClaw protocol paths, config names, or package integration code unless the change includes a compatibility plan and verification.

Use MineEcho names for new product-facing code and documentation. Legacy names such as `MINECHO_CONFIG_HOME`, `MINECHO_KB_BASE_PATH`, and `SCLAW_HOST` may remain only where they are deliberate compatibility aliases.

## Pull Request Guidelines

- Explain the user-facing behavior change.
- List verification commands and results.
- Keep unrelated refactors out of the PR.
- Add or update focused tests for routing, knowledge, memory, AI app, or runtime behavior changes.
- Update `README.md`, `README.zh-CN.md`, or `docs/` when commands, ports, environment variables, or runtime paths change.
