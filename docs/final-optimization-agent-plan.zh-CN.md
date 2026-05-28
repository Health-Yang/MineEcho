# MineEcho P0/P1/P2 Final Optimization Plan

> Agent team execution baseline. The master agent owns integration, conflict control, and final verification. Worker agents must keep edits inside their assigned file scope and must not revert unrelated changes.

## Goal

Make MineEcho feel like one coherent product before open source release: memory works visibly, knowledge and graph alignment are explainable, skills and AI apps route reliably, local/offline states are honest, and the release package is clean.

## Product Truth To Preserve

- 记: chat and meeting results enter layered memory and can be recalled across days.
- 学: imported knowledge and high-confidence memories can align into the knowledge graph.
- 用: installed skills and AI apps are surfaced as callable capabilities.
- 省: TokenJuice reduces noisy imported content and command/tool output without truncating model responses artificially.

## Execution Phases

### P0: Release Trust And Core Closure

1. **Release trust gate**
   - Re-run sensitive/runtime file checks.
   - Improve release checklist wording if gaps are found.
   - Ensure no user-facing fake success state remains.
   - Expected verification: `npm run export:release`, targeted text scan.

2. **Memory evidence visibility**
   - Make chat/meeting memory evidence visible enough for users to trust recall.
   - Keep behavior factual: show what context was used, not marketing copy.
   - Expected verification: existing chat context evidence and memory timeline tests.

3. **Meeting-to-memory status**
   - Surface that meetings are persisted as memory and can later align to knowledge graph.
   - Avoid writing directly to graph from meeting; use existing memory alignment pipeline.
   - Expected verification: meeting memory test, console build.

4. **Skill/AI app end-to-end confidence**
   - Smoke-test import, health, preferred skill routing, and direct AI app chat.
   - Fix only real failures.
   - Expected verification: existing BFF and console skill/AI app tests.

### P1: Performance And Daily UX

1. **Bundle and lazy-load pass**
   - Reduce initial route pressure by lazy loading heavyweight views/renderers where practical.
   - Primary targets: Mermaid/Markdown, knowledge graph, Cytoscape, large page modules.
   - Keep this conservative: no dependency swaps.
   - Expected verification: console build and route smoke.

2. **Knowledge graph performance**
   - Keep interaction smooth on larger graphs using existing performance utility boundaries.
   - Prefer limits, neighborhood focus, cached layout, and reduced redraw over visual complexity.
   - Expected verification: `test:knowledge-graph-performance`, console build.

3. **Memory page information architecture**
   - Clarify L0/L1/L2/L3 versus source views such as chat, meeting, skill, knowledge.
   - Add source labels and empty/loading/error states where missing.
   - Expected verification: memory timeline tests and console build.

4. **Settings simplification**
   - Reorganize settings into concrete groups: model/gateway, memory, knowledge, skills, local mode, diagnostics.
   - Do not remove real config capabilities.
   - Expected verification: console build.

### P2: Open Source Polish

1. **Chinese enterprise/product document**
   - Explain positioning, architecture, deployment, privacy, and extension points.
   - Must be honest about experimental channels.

2. **Brand and compatibility cleanup**
   - Keep OpenClaw only for compatibility internals.
   - User-facing docs/UI should say MineEcho unless explaining compatibility.

3. **README and release checklist final pass**
   - Make first-run path clear.
   - Make local data/runtime directories clear.
   - Make contribution boundaries clear.

4. **Known limitations document**
   - Explicitly list current limitations: bundle warnings, experimental non-Web channels, model/provider requirements, graph scale limits.

## Agent Team Boundaries

- **Agent A: Release Trust / Docs**
  - Owns docs and release scripts/checklist only.
  - Must not edit app runtime code.

- **Agent B: Frontend Performance**
  - Owns Vite/console lazy loading and performance utility changes.
  - Must not edit BFF routes or docs unless needed for build config comments.

- **Agent C: Memory Visibility**
  - Owns memory/meeting UI labels and evidence display utilities.
  - Must not edit meeting persistence backend unless a test proves a backend bug.

- **Agent D: Skills/AI App Smoke**
  - Owns tests and small fixes around skills/AI app import/routing.
  - Must not redesign SkillsPage layout in the same pass.

## Master Integration Rules

- Run targeted tests after each accepted agent patch.
- Run `npm run verify` before claiming completion.
- Run `npm run export:release` after release/doc changes.
- Prefer small follow-up patches over accepting broad refactors.
- Track remaining limitations instead of hiding unfinished experimental features.

