# MineEcho

[中文文档](README.zh-CN.md)

MineEcho is a source-available, local-first AI assistant framework for building private, extensible assistant workflows on top of local services and user-owned knowledge.

The project is designed around four baseline ideas:

- **Skill routing:** route user intent to focused capabilities instead of pushing every task through one general prompt.
- **Memory distillation:** compact interaction history into durable working memory while keeping raw transcripts optional and local.
- **Wiki and graph knowledge base:** organize notes, entities, and relationships into a browsable knowledge layer that can support retrieval and reasoning.
- **Cost controls:** keep local defaults, explicit provider configuration, and bounded memory/performance settings so experimentation does not silently become expensive.

## Current Capabilities

- Local console and BFF for chat, skills, memory, knowledge base, calendar/meeting helpers, and configuration.
- Skill center with JSON skill import, ZIP/.skill package import, URL install, AI app registration, trigger refresh, and routing preview APIs.
- AI app adapters that convert RAG/workflow apps into Gateway-callable skills.
- Memory-to-knowledge alignment preview, commit history, and knowledge graph refresh hooks.
- Knowledge graph neighborhood API for explaining selected nodes and one-hop relationships.
- TokenJuice compression metrics with local persistence.

## Quick Start

Install dependencies for both local apps:

```sh
npm run install:apps
cp apps/bff/.env.example apps/bff/.env
# Optional, only when you need to override Console defaults:
# cp apps/console/.env.example apps/console/.env
```

Start the BFF and Console together from the repository root:

```sh
npm run dev
```

The development URLs are:

- Console: `http://127.0.0.1:5175/`
- BFF: `http://127.0.0.1:3085/`

The checked-in Vite dev config proxies `/api` to the local BFF.

You can still start the two apps separately when debugging one side:

```sh
npm run dev:bff
npm run dev:console
```

Build checks:

```sh
npm run build
```

Start the built BFF package:

```sh
npm run start:bff
```

Smoke verification:

```sh
npm run verify
```

Runtime smoke check, after `npm run dev` is running:

```sh
npm run smoke
```

Dependency audit for release-blocking advisories:

```sh
npm run audit:apps
```

## Local-First Defaults

MineEcho should run against loopback services by default. Secrets, provider API keys, production endpoints, and user data belong in ignored local environment files, not in source control.

Start from the example environment files and copy only the settings needed for your machine:

```sh
cp apps/bff/.env.example apps/bff/.env
# Optional:
# cp apps/console/.env.example apps/console/.env
```

Then edit `.env` locally. Keep any real tokens or service credentials out of commits.

Local development does not force the console login screen by default. Set `VITE_MINEECHO_AUTH_REQUIRED=true` when you need to test the auth flow explicitly.

The BFF defaults to port `3085`. Override it with `BFF_PORT` only if you also update the Console proxy target.

The following runtime directories are intentionally ignored and should stay out of source control:

- `.mineecho/`
- `.openclaw/`
- `apps/**/.mineecho/`
- `apps/**/.openclaw/`
- `apps/**/workspace/`

MineEcho still embeds OpenClaw as the local Gateway compatibility layer in parts of the backend. Those names can appear in protocol adapters, package names, and config-file compatibility code; they are implementation details, not user-facing product branding.

For a more detailed file-by-file map, see [`docs/runtime-data.md`](docs/runtime-data.md).

## Project Docs

- Environment variables: [`docs/environment.md`](docs/environment.md)
- Architecture overview: [`docs/architecture.md`](docs/architecture.md)
- Runtime data and local secrets: [`docs/runtime-data.md`](docs/runtime-data.md)
- Commercial use: [`COMMERCIAL.md`](COMMERCIAL.md)
- Contribution workflow: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](SECURITY.md)
- Release checklist: [`docs/release-checklist.md`](docs/release-checklist.md)
- Changelog: [`CHANGELOG.md`](CHANGELOG.md)

## Skill and AI App Routing

MineEcho routes user intent to skills before pushing every request through a generic chat flow.

- Imported skills and AI apps are represented in the skill registry.
- ZIP/.skill imports are safety-scanned and normalized so `SKILL.md` lands at the skill root.
- AI apps and custom skills derive fallback triggers from `name + description`, so they remain discoverable even before a trigger index is refreshed.
- When a user asks a question, the router scores trigger, name, description, and mode evidence, then returns the best skill candidates.

## Memory and Knowledge

MineEcho includes memory and knowledge-base primitives that are intended to evolve into a long-running personal or team assistant:

- Interaction memory and user profile data can be summarized into durable memory layers.
- Imported knowledge can be organized into wiki files and graph nodes.
- Memory-to-knowledge alignment can preview candidate links, commit reviewed links, and store per-user alignment history.

The current implementation is intentionally review-first. Fully autonomous background consolidation is still on the roadmap.

## OpenClaw Gateway Compatibility

MineEcho currently uses OpenClaw as the embedded Gateway layer for tool/skill execution compatibility. This means source files may still contain OpenClaw protocol names, package names, config file names, or adapter comments.

The intended boundary is:

- **MineEcho:** product UI, BFF orchestration, memory, knowledge, skill registry, routing, and local-first runtime defaults.
- **Gateway compatibility layer:** OpenClaw package/protocol integration used to execute skills and bridge existing Gateway behavior.

Avoid renaming Gateway protocol paths blindly; doing so can break compatibility.

## Repository Layout

- `apps/bff/` - backend-for-frontend service configuration and runtime package.
- `apps/console/` - console application package.
- `docs/` - project notes and documentation.
- `designs/` and `_designs/` - design materials and experiments.

## Roadmap

- Memory consolidation jobs that summarize old interactions into knowledge candidates.
- Knowledge graph entity normalization, alias merging, and node-level change history.
- Skill health checks: trigger preview, script presence, route test, connectivity, and risk report.
- TokenJuice budget agent for task-aware model/context routing.
- Runtime data consolidation through a single config-home abstraction.
- End-to-end integration tests for AI app import, skill package import, chat routing, and knowledge alignment.

## License

MineEcho is source-available under the PolyForm Noncommercial License 1.0.0. Noncommercial use is allowed under [`LICENSE`](LICENSE). Commercial use requires a separate written license; see [`COMMERCIAL.md`](COMMERCIAL.md).

Because this license restricts commercial use, MineEcho is not distributed under an OSI-approved open source license.
