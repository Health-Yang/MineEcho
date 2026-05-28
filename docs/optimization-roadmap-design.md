# MineEcho Optimization Roadmap Design Skeleton

> Status: design skeleton for staged optimization work. This document proposes data contracts, sequencing, and acceptance criteria without requiring a large production rewrite.
> Updated: 2026-05-27

## 1. Product Direction

MineEcho should become a local-first workplace intelligence agent that improves through use while staying inspectable and low-dependency. The optimization direction is to reuse the current building blocks instead of replacing them:

- Skills remain the primary capability surface.
- Memory Tree becomes the durable learning substrate.
- Knowledge Base remains the durable document and wiki substrate.
- Graph navigation connects skills, memory, and knowledge into explainable routes.
- TokenJuice closes the cost and context-quality loop for tool output, memory distillation, and retrieval.

The near-term implementation should be additive: new docs, new types, small storage tables, background jobs, and read-only routing decisions before any invasive chat/runtime rewrite.

## 2. Existing Anchors

| Area | Current anchor | Reuse direction |
|------|----------------|-----------------|
| Skills | `apps/bff/src/skills/*`, `apps/bff/src/triggers/*` | Promote scanned/custom skills into a registry with routing metadata. |
| Memory | `apps/bff/src/memory/*`, `apps/bff/src/memory/memory-tree/*` | Distill interactions into L0-L3 with provenance and retention policy. |
| Knowledge | `apps/bff/src/knowledge-base/*` | Align wiki pages, chunks, graph nodes, and memories through shared provenance IDs. |
| Graph | `apps/bff/src/knowledge-base/graph-store.ts` | Extend node/edge semantics before adding a separate graph engine. |
| TokenJuice | `apps/bff/src/tokenjuice/*` | Feed reduction stats into routing, context budgets, and distillation quality metrics. |

## 3. Roadmap

### P0: Skill Registry and Router Baseline

Goal: introduce a typed registry and deterministic router so MineEcho can explain which skill it would use and why.

Scope:
- Keep current skill scan, custom skill state, and personalized triggers.
- Add registry records as derived metadata, not as a new skill runtime.
- Add a dry-run route before automated invocation changes.

Proposed capabilities:
- Registry can list available skills, enabled state, categories, trigger phrases, safety scan status, supported inputs, and cost hints.
- Router scores candidates from explicit mentions, personalized triggers, recent memory, current mode, and knowledge graph hints.
- Router returns `selectedSkillId`, candidate scores, and evidence without executing the skill in P0.

Acceptance criteria:
- A registry snapshot can be produced from existing built-in/custom skills.
- Disabled skills never appear as executable candidates.
- Router dry-run returns top 3 candidates with score components and source evidence.
- Existing manual skill usage behavior is unchanged.
- Safety scan findings are visible in the registry model.

### P1: Memory Distillation Pipeline

Goal: make memory write paths explainable, bounded, and useful for later routing.

Scope:
- Reuse Memory Tree L0-L3, short-term memory, and background review.
- Add provenance and distillation metadata to proposed records.
- Keep distillation asynchronous and non-blocking.

Proposed pipeline:
1. Capture: chat turns, skill usage, KB interactions, and tool outputs create source events.
2. Reduce: TokenJuice compacts noisy tool output before memory insertion.
3. Score: importance, novelty, confidence, and risk flags decide whether an item enters L0.
4. Distill: L0 buckets seal into L1/L2/L3 summaries using existing fanout and quota rules.
5. Link: entities and relations attach to graph nodes with provenance.

Acceptance criteria:
- Each distilled memory can be traced back to one or more source events.
- L0 write path rejects low-confidence/high-risk memories unless explicitly marked manual.
- Token budgets are enforced before context injection.
- Distillation failures do not block chat responses.
- A recall result can show why each memory was included.

### P2: Knowledge Alignment

Goal: align memory, wiki knowledge, skills, and graph entities so retrieval does not return disconnected fragments.

Scope:
- Do not replace current hybrid KB search.
- Add shared entity IDs, provenance contracts, and alignment jobs.
- Start with batch alignment; real-time alignment can come later.

Proposed capabilities:
- Normalize entities across Memory Tree and Knowledge Base.
- Attach source spans and confidence to facts extracted from wiki pages and memory summaries.
- Mark knowledge as `raw`, `wiki`, `memory`, `skill`, or `tool_observation`.
- Add conflict state for facts that disagree.

Acceptance criteria:
- A wiki page and memory summary that mention the same project can resolve to the same canonical entity.
- Search results can include provenance labels and confidence.
- Conflicting facts are not silently merged.
- Existing KB upload, organize, graph, and search APIs continue to work.

### P3: Graph Navigation

Goal: use graph traversal as an explainable navigation layer across skills, memories, and knowledge.

Scope:
- Extend current SQLite graph semantics first.
- Avoid introducing a new graph database unless SQLite traversal becomes a measured bottleneck.

Proposed capabilities:
- Nodes represent entities, documents, memory summaries, skills, users, projects, tasks, and observations.
- Edges represent references, evidence, usage, ownership, dependency, contradiction, and summarization lineage.
- Graph navigation can answer: "what skill should handle this?", "what context explains this?", and "what source supports this claim?"

Acceptance criteria:
- Given a query, graph navigation returns a bounded subgraph with ranked nodes and edges.
- Traversal depth, edge types, and token budget are configurable.
- Every edge used for context has provenance or is labeled as inferred.
- UI graph consumers can distinguish KB-only nodes from memory/skill nodes.

### P4: TokenJuice Cost Loop

Goal: turn TokenJuice from a reducer into a feedback loop for cost, quality, and routing decisions.

Scope:
- Reuse existing rule loading, classification, and compaction results.
- Add metrics capture and policy decisions around output reduction.

Proposed capabilities:
- Store raw/reduced character counts, ratio, rule ID, family, and downstream usage.
- Prefer reducers that preserve error signatures, counts, and actionable lines.
- Use reduction ratio and recall usefulness as signals for registry routing and memory distillation.
- Surface per-session and per-skill context cost estimates.

Acceptance criteria:
- Each reduced tool output records stats and matched reducer metadata.
- The system can report top cost sources by skill, command family, and session.
- Memory distillation uses reduced text by default but can reference raw source by ID.
- Reduction never removes failure signatures when `preserveOnFailure` applies.

## 4. Proposed Data Models

These are contract proposals. Implementation can start as TypeScript interfaces and SQLite migrations when a phase begins.

### 4.1 Node Model

```typescript
export type MineEchoNodeType =
  | "user"
  | "skill"
  | "memory_l0"
  | "memory_l1"
  | "memory_l2"
  | "memory_l3"
  | "knowledge_page"
  | "knowledge_chunk"
  | "entity"
  | "project"
  | "task"
  | "tool_observation"
  | "fact";

export interface MineEchoGraphNode {
  id: string;
  type: MineEchoNodeType;
  label: string;
  userId?: string;
  summary?: string;
  sourceUri?: string;
  canonicalEntityId?: string;
  importance: number;       // 0-1 normalized, adapt current KB 0-100 on read.
  confidence: number;       // 0-1 extraction or alignment confidence.
  provenanceIds: string[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}
```

SQLite sketch:

```sql
CREATE TABLE mineecho_nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  label TEXT NOT NULL,
  user_id TEXT,
  summary TEXT,
  source_uri TEXT,
  canonical_entity_id TEXT,
  importance REAL NOT NULL DEFAULT 0.5,
  confidence REAL NOT NULL DEFAULT 0.5,
  provenance_ids TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_mineecho_nodes_type ON mineecho_nodes(type);
CREATE INDEX idx_mineecho_nodes_user ON mineecho_nodes(user_id);
CREATE INDEX idx_mineecho_nodes_canonical ON mineecho_nodes(canonical_entity_id);
```

### 4.2 Edge Model

```typescript
export type MineEchoEdgeType =
  | "references"
  | "supports"
  | "contradicts"
  | "derived_from"
  | "summarizes"
  | "mentions"
  | "uses_skill"
  | "suggests_skill"
  | "depends_on"
  | "owned_by"
  | "related_to";

export interface MineEchoGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: MineEchoEdgeType;
  label?: string;
  weight: number;           // 0-1 traversal strength.
  confidence: number;       // 0-1 relation confidence.
  direction: "directed" | "undirected";
  provenanceIds: string[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}
```

SQLite sketch:

```sql
CREATE TABLE mineecho_edges (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL,
  label TEXT,
  weight REAL NOT NULL DEFAULT 0.5,
  confidence REAL NOT NULL DEFAULT 0.5,
  direction TEXT NOT NULL DEFAULT 'directed',
  provenance_ids TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(source_id, target_id, type)
);

CREATE INDEX idx_mineecho_edges_source ON mineecho_edges(source_id);
CREATE INDEX idx_mineecho_edges_target ON mineecho_edges(target_id);
CREATE INDEX idx_mineecho_edges_type ON mineecho_edges(type);
```

### 4.3 Knowledge Provenance Model

```typescript
export type MineEchoProvenanceKind =
  | "chat_turn"
  | "skill_manifest"
  | "skill_scan"
  | "skill_invocation"
  | "raw_file"
  | "wiki_page"
  | "kb_chunk"
  | "memory_summary"
  | "tool_output"
  | "manual_note";

export interface TextSpanRef {
  start?: number;
  end?: number;
  lineStart?: number;
  lineEnd?: number;
  quoteHash?: string;
}

export interface MineEchoProvenance {
  id: string;
  kind: MineEchoProvenanceKind;
  userId?: string;
  sourceUri: string;         // file path, route/id, session/id, skill/id, or command/run id.
  sourceTitle?: string;
  span?: TextSpanRef;
  extractor: "human" | "system" | "llm" | "tokenjuice" | "importer";
  extractorVersion?: string;
  confidence: number;
  capturedAt: number;
  checksum?: string;
  rawRef?: string;           // stable pointer to raw source when inline text is reduced.
  metadata?: Record<string, unknown>;
}
```

SQLite sketch:

```sql
CREATE TABLE mineecho_provenance (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  user_id TEXT,
  source_uri TEXT NOT NULL,
  source_title TEXT,
  span_json TEXT,
  extractor TEXT NOT NULL,
  extractor_version TEXT,
  confidence REAL NOT NULL DEFAULT 0.5,
  captured_at INTEGER NOT NULL,
  checksum TEXT,
  raw_ref TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_mineecho_provenance_kind ON mineecho_provenance(kind);
CREATE INDEX idx_mineecho_provenance_source ON mineecho_provenance(source_uri);
```

## 5. Skill Registry and Router Contract

```typescript
export interface SkillRegistryRecord {
  id: string;
  name: string;
  description?: string;
  category: string;
  enabled: boolean;
  source: "builtin" | "custom" | "imported";
  triggerPhrases: string[];
  inputKinds: string[];
  outputKinds: string[];
  safety: {
    scannedAt?: number;
    pass: boolean;
    findings: Array<{ code: string; message: string; file?: string }>;
  };
  costHint?: {
    expectedTokens?: number;
    expectedLatencyMs?: number;
    requiresNetwork?: boolean;
  };
  provenanceIds: string[];
}

export interface SkillRouteDecision {
  query: string;
  selectedSkillId?: string;
  candidates: Array<{
    skillId: string;
    score: number;
    scoreParts: {
      explicitMention?: number;
      personalizedTrigger?: number;
      modeAffinity?: number;
      graphAffinity?: number;
      recentSuccess?: number;
      costPenalty?: number;
      safetyPenalty?: number;
    };
    evidence: Array<{ provenanceId?: string; reason: string }>;
  }>;
  shouldAutoExecute: boolean;
  requiresConfirmation: boolean;
}
```

Initial routing policy:
- Auto-execution stays disabled until router dry-run metrics are reviewed.
- Any network, file mutation, or external process skill requires confirmation unless already invoked manually.
- Safety findings lower candidate score and can force `requiresConfirmation`.

## 6. TokenJuice Feedback Metrics

```typescript
export interface TokenJuiceUsageRecord {
  id: string;
  userId?: string;
  sessionId?: string;
  skillId?: string;
  toolName: string;
  commandFamily?: string;
  reducerId?: string;
  rawChars: number;
  reducedChars: number;
  ratio: number;
  preservedFailure: boolean;
  usedForMemory: boolean;
  usedForContext: boolean;
  provenanceId: string;
  createdAt: number;
}
```

Acceptance metrics:
- `ratio` median by command family.
- failed command outputs with preserved error signature.
- context tokens saved per session.
- downstream usefulness: recalled, cited, or routed from this reduced output.

## 7. Implementation Guardrails

- Prefer additive tables and exported type contracts before changing runtime behavior.
- Keep router dry-run observable before enabling automated skill execution.
- Keep memory distillation asynchronous and failure-isolated.
- Keep raw source references for any reduced or summarized content.
- Avoid introducing new infrastructure until current SQLite-backed stores are measured as insufficient.
- Keep UI changes minimal until graph/node models stabilize.

## 8. Phase-Level Verification

| Phase | Verification |
|-------|--------------|
| P0 | Unit tests for registry normalization and router scoring; dry-run route returns evidence. |
| P1 | Tests for provenance persistence, L0 admission policy, TokenJuice reduction before memory insert, and recall explanations. |
| P2 | Alignment tests for duplicate entity merge, conflict preservation, and provenance labels in search results. |
| P3 | Graph traversal tests for depth, edge type filtering, budget truncation, and provenance requirements. |
| P4 | TokenJuice stats tests for rule metadata, failure preservation, and aggregate cost reports. |

## 9. Open Questions

- Should the unified graph live beside the current KB graph database or extend `kb-graph.db` in place?
- What is the first skill category allowed to move from dry-run routing to confirmed execution?
- Which provenance sources need user-visible deletion first for privacy controls?
- Should conflict resolution be manual-only, or can high-confidence newer facts supersede older facts with audit history?
