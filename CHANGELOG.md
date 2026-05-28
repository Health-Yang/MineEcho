# Changelog

All notable MineEcho changes are summarized here.

## 0.1.0 - Initial Open-Source Preparation

### Added

- Local-first Console and BFF startup flow with root-level scripts.
- Skill Center support for skill imports, package imports, URL installs, AI app registration, trigger refresh, and routing preview.
- AI app adapters for converting RAG/workflow apps into Gateway-callable skills.
- Memory-to-knowledge alignment preview, commit history, and graph refresh hooks.
- Knowledge Base task center with indexing, organization, graph extraction, consistency checks, and retry actions.
- Focused Knowledge Graph view for source-centered graph exploration.
- TokenLess metrics and local cost/compression persistence.
- Release checks for runtime data, local secrets, version consistency, and focused build/test verification.
- GitHub CI, PR template, issue templates, contribution guide, security policy, environment reference, runtime data guide, and release checklist.

### Changed

- Product-facing name standardized around MineEcho.
- Default local BFF port standardized to `3085` across Console, BFF, Docker, Electron, CLI, and docs.
- Local development no longer forces the login screen by default.
- AI app output token defaults raised to avoid premature truncation for capable models.
- Mermaid rendering now falls back instead of surfacing raw parser errors in normal chat flow.
- Knowledge Base storage migrated from legacy `v35-knowledge` naming to `knowledge`, while keeping compatibility migration logic.

### Known Limits

- Console production build still contains large Mermaid, Cytoscape, and Ant Design chunks. Further page-level/component-level lazy loading is planned.
- Fully autonomous memory consolidation into knowledge candidates is still roadmap work.
- Some OpenClaw names remain intentionally in Gateway compatibility paths and protocol integration code.
- `npm run check:release` must pass from a clean publish tree; it will fail in local development directories that contain `.mineecho/`, `.openclaw/`, or `apps/**/workspace/`.
