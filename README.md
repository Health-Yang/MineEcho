# MineEcho

[中文文档](README.zh-CN.md)

MineEcho is a source-available, local-first AI assistant framework for building private, extensible assistant workflows on top of local services and user-owned knowledge.

MineEcho is not meant to be just another chat UI. Its product loop is:

> **Remember** user preferences and past work.  
> **Learn** from imported knowledge through Wiki++ and graph context.  
> **Use** skills and external AI apps through one routing surface.  
> **Save** context cost with TokenLess reducers and local metrics.

## Why MineEcho

| Common product shape | Typical gap | MineEcho difference |
|----------------------|-------------|---------------------|
| Chat UI | No durable memory, tools and knowledge stay separate | Memory tree + knowledge base + skill routing + cost layer |
| RAG knowledge base | Fragmented chunks, little action capability | raw/wiki storage, four-channel retrieval, AI apps as callable skills |
| Agent tool framework | Tool output is noisy and context-heavy | TokenLess keeps key errors, counts, and actionable lines |
| Enterprise AI app portal | Apps become silos | AI apps are converted into skills with triggers, routing, and health checks |

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
- TokenLess compression metrics with local persistence.

## Core Highlights

### Memory: runtime memory plus L0-L3 memory tree

MineEcho separates memory into two complementary views:

- **Working / Short-term / Long-term:** current session, daily interactions, cross-session profile and insights.
- **L0 / L1 / L2 / L3 Memory Tree:** raw memory chunks, daily summaries, weekly summaries, and monthly archives.

When a user asks a question, MineEcho recalls recent L0 chunks with keyword, semantic, local-vector, importance, and recency scoring, then reranks the top candidates with the configured embedding provider when available. L1/L2 summaries pass a local semantic gate before embedding-enhanced ranking, which reduces unrelated long-term context injection.

### Wiki++ knowledge base

MineEcho's knowledge base is organized as raw source files plus AI-maintained wiki pages. Query-time retrieval uses four channels:

1. Vector search for semantic similarity.
2. BM25 for Chinese/English keyword matching.
3. Structured search over title, type, tags, and headings.
4. Graph channel search over entities and one-hop neighborhoods.

This makes it closer to a high-density, maintainable AI knowledge substrate than a simple chunk-only RAG store.

### Skills and AI apps as one capability layer

Native skills, imported skills, and registered AI apps enter the same registry. AI apps are converted into Gateway-callable skills, triggers are derived from `name + description`, and the router scores trigger, name, description, and mode evidence before returning candidates. AI apps therefore participate in the same routing and workflow surface as local skills.

### TokenLess cost controls

TokenLess ships with 15 built-in reducer rules for git, npm, cargo, docker, document extraction, and generic long output. It keeps errors, counts, head/tail context, and actionable lines instead of blindly truncating output. Based on the current rule structure, long tool/document outputs commonly fall into an estimated 20%-85% token-saving range depending on repetition and output shape; MineEcho records raw/reduced characters and estimated tokens saved locally for real workload measurement.

## Quick Start

This is the full path for first-time users.

### 1. Prepare your machine

Install:

- Git
- Node.js 22 or later
- npm, usually bundled with Node.js

Check versions:

```sh
git --version
node -v
npm -v
```

If `node -v` is lower than 22, upgrade Node.js first.

### 2. Clone the repository

```sh
git clone https://github.com/565628110-byte/MineEcho.git
cd MineEcho
```

### 3. Install dependencies

```sh
npm run install:apps
```

This installs dependencies for both BFF and Console.

### 4. Create local environment files

```sh
cp apps/bff/.env.example apps/bff/.env
# Optional, only when you need to override Console defaults:
# cp apps/console/.env.example apps/console/.env
```

MineEcho does not ship real model API keys. You can start without keys first, then configure model providers in the Console settings page.

### 5. Start development services

```sh
npm run dev
```

The development URLs are:

- Console: `http://127.0.0.1:5175/`
- BFF: `http://127.0.0.1:3085/`

The checked-in Vite dev config proxies `/api` to the local BFF.

On first launch, open the Console and complete model/API key configuration in Settings. Keep real provider keys in local `.env` files or local Console settings, not in Git.

### 6. Debug BFF or Console separately

You can start the two apps separately when debugging one side:

```sh
npm run dev:bff
npm run dev:console
```

### 7. Verify and build

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

MineEcho reuses Gateway-related packages from the OpenClaw PI framework in parts of the backend. Those names can appear in protocol adapters, package names, and config-file compatibility code; they are implementation details, not user-facing product branding.

For a more detailed file-by-file map, see [`docs/runtime-data.md`](docs/runtime-data.md).

## Project Docs

- Environment variables: [`docs/environment.md`](docs/environment.md)
- Architecture overview: [`docs/architecture.md`](docs/architecture.md)
- Product positioning and highlights: [`docs/product-positioning.zh-CN.md`](docs/product-positioning.zh-CN.md)
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

MineEcho is developed on top of capabilities from the OpenClaw PI framework, with additional product layers for memory, Wiki++ knowledge, AI-app-to-skill conversion, TokenLess, and the local Console.

The current PI-framework integration still uses Gateway-related packages at runtime for skill execution, tool calls, and protocol bridging. Source files may therefore still contain OpenClaw protocol names, Gateway package names, config file names, or adapter comments.

The intended boundary is:

- **MineEcho:** product UI, BFF orchestration, memory, knowledge, skill registry, routing, and local-first runtime defaults.
- **PI/Gateway compatibility layer:** Gateway-related packages and protocol capabilities from the OpenClaw PI framework, reused for skill execution and tool interoperability.

Avoid renaming OpenClaw/Gateway protocol or config paths blindly; doing so can break lower-level compatibility.

## Repository Layout

- `apps/bff/` - backend-for-frontend service configuration and runtime package.
- `apps/console/` - console application package.
- `docs/` - project notes and documentation.
- `designs/` and `_designs/` - design materials and experiments.

## Roadmap

- Memory consolidation jobs that summarize old interactions into knowledge candidates.
- Knowledge graph entity normalization, alias merging, and node-level change history.
- Skill health checks: trigger preview, script presence, route test, connectivity, and risk report.
- TokenLess budget agent for task-aware model/context routing.
- Runtime data consolidation through a single config-home abstraction.
- End-to-end integration tests for AI app import, skill package import, chat routing, and knowledge alignment.

## License

MineEcho is source-available under the PolyForm Noncommercial License 1.0.0. Noncommercial use is allowed under [`LICENSE`](LICENSE). Commercial use requires a separate written license; see [`COMMERCIAL.md`](COMMERCIAL.md).

Because this license restricts commercial use, MineEcho is not distributed under an OSI-approved open source license.
