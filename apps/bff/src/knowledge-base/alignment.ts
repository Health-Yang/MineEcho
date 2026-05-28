import type { KnowledgeGraph } from "./graph.js";
import type { GraphEdge, GraphNode } from "./graph-store.js";
import type { MemorySource } from "../memory/memory-tree/types.js";

export interface AlignmentMemoryItem {
  id: string;
  level: 0 | 1 | 2 | 3;
  source: MemorySource;
  content: string;
  createdAt: number;
}

export interface AlignmentGraphNode {
  id: string;
  label: string;
  type: string;
  description?: string;
  sourceFile?: string;
  filePath?: string;
  summary?: string;
  importance?: number;
}

export interface MemoryKnowledgeAlignmentCandidate {
  memoryId: string;
  memoryLevel: 0 | 1 | 2 | 3;
  memorySource: MemorySource;
  memoryExcerpt: string;
  knowledgeNodeId: string;
  knowledgeLabel: string;
  knowledgeType: string;
  knowledgeSource?: string;
  confidence: number;
  score: {
    final: number;
    labelMatch: number;
    descriptionMatch: number;
    conflictPenalty: number;
  };
  status: "aligned" | "conflict";
  evidence: Array<{
    type: "label" | "description" | "alias" | "conflict-keyword";
    value: string;
  }>;
  sourceSpans: Array<{
    kind: "memory" | "knowledge";
    text: string;
    source?: string;
  }>;
  provenance: {
    memoryId: string;
    knowledgeNodeId: string;
    memoryCreatedAt: number;
    knowledgeSource?: string;
    generatedAt: number;
  };
}

export interface MemoryKnowledgeAlignmentStatus {
  userId: string;
  memoryCount: number;
  graphNodeCount: number;
  candidateCount: number;
  alignedCount: number;
  conflictCount: number;
  historyCount: number;
  hasActionableCandidates: boolean;
  lastCandidateAt: number | null;
  generatedAt: number;
}

interface AlignmentOptions {
  minConfidence?: number;
  limit?: number;
  now?: number;
}

interface AlignmentCommitOptions {
  includeConflicts?: boolean;
}

interface AutoAlignmentOptions {
  minConfidence?: number;
  limit?: number;
}

const CONFLICT_KEYWORDS = [
  "冲突",
  "矛盾",
  "不同",
  "不一致",
  "过期",
  "废弃",
  "不是",
  "错误",
  "conflict",
  "outdated",
  "deprecated",
  "wrong",
];

export function normalizeAlignmentLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fa5]+/gu, "")
    .trim();
}

function excerpt(value: string, maxLength = 180): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function findSourceSpan(content: string, needle: string, maxLength = 120): string {
  const text = content.replace(/\s+/g, " ").trim();
  if (!needle) return excerpt(text, maxLength);
  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const index = lowerText.indexOf(lowerNeedle);
  if (index < 0) return excerpt(text, maxLength);

  const start = Math.max(0, index - 36);
  const end = Math.min(text.length, index + needle.length + 36);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function containsConflictKeyword(content: string): string | null {
  const normalized = content.toLowerCase();
  return CONFLICT_KEYWORDS.find((keyword) => normalized.includes(keyword)) || null;
}

function scoreMemoryToNode(memory: AlignmentMemoryItem, node: AlignmentGraphNode): {
  confidence: number;
  evidence: MemoryKnowledgeAlignmentCandidate["evidence"];
  score: MemoryKnowledgeAlignmentCandidate["score"];
} {
  const content = memory.content || "";
  const normalizedContent = normalizeAlignmentLabel(content);
  const normalizedLabel = normalizeAlignmentLabel(node.label || "");
  const evidence: MemoryKnowledgeAlignmentCandidate["evidence"] = [];

  const score: MemoryKnowledgeAlignmentCandidate["score"] = {
    final: 0,
    labelMatch: 0,
    descriptionMatch: 0,
    conflictPenalty: 0,
  };

  if (!normalizedContent || !normalizedLabel) return { confidence: 0, evidence, score };

  let confidence = 0;

  if (normalizedContent.includes(normalizedLabel)) {
    score.labelMatch = normalizedLabel.length >= 4 ? 0.9 : 0.8;
    confidence = Math.max(confidence, score.labelMatch);
    evidence.push({ type: "label", value: node.label });
  }

  const description = node.description || node.summary || "";
  const descriptionTokens = description
    .split(/[,\s，。；;、]+/)
    .map(normalizeAlignmentLabel)
    .filter((token) => token.length >= 3);

  for (const token of descriptionTokens.slice(0, 8)) {
    if (normalizedContent.includes(token)) {
      score.descriptionMatch = 0.75;
      confidence = Math.max(confidence, score.descriptionMatch);
      evidence.push({ type: "description", value: token });
      break;
    }
  }

  score.final = confidence;

  return {
    confidence,
    evidence,
    score,
  };
}

export function alignMemoryItemsToGraph(
  memories: AlignmentMemoryItem[],
  nodes: AlignmentGraphNode[],
  options: AlignmentOptions = {}
): MemoryKnowledgeAlignmentCandidate[] {
  const minConfidence = options.minConfidence ?? 0.72;
  const generatedAt = options.now ?? Date.now();
  const candidates: MemoryKnowledgeAlignmentCandidate[] = [];

  for (const memory of memories) {
    for (const node of nodes) {
      const scored = scoreMemoryToNode(memory, node);
      if (scored.confidence < minConfidence) continue;

      const conflictKeyword = containsConflictKeyword(memory.content);
      const evidence = [...scored.evidence];
      if (conflictKeyword) {
        evidence.push({ type: "conflict-keyword", value: conflictKeyword });
        scored.score.conflictPenalty = 0.2;
      }
      scored.score.final = scored.confidence;
      const knowledgeSource = node.sourceFile || node.filePath;
      const strongestEvidence = scored.evidence[0]?.value || node.label;

      candidates.push({
        memoryId: memory.id,
        memoryLevel: memory.level,
        memorySource: memory.source,
        memoryExcerpt: excerpt(memory.content),
        knowledgeNodeId: node.id,
        knowledgeLabel: node.label,
        knowledgeType: node.type,
        knowledgeSource: node.sourceFile || node.filePath,
        confidence: scored.confidence,
        score: scored.score,
        status: conflictKeyword ? "conflict" : "aligned",
        evidence,
        sourceSpans: [
          {
            kind: "memory",
            text: findSourceSpan(memory.content, strongestEvidence),
            source: `memory://${memory.source}/${memory.id}`,
          },
          {
            kind: "knowledge",
            text: node.description || node.summary || node.label,
            source: knowledgeSource,
          },
        ],
        provenance: {
          memoryId: memory.id,
          knowledgeNodeId: node.id,
          memoryCreatedAt: memory.createdAt,
          knowledgeSource,
          generatedAt,
        },
      });
    }
  }

  candidates.sort((a, b) => {
    if (a.status !== b.status) return a.status === "conflict" ? -1 : 1;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.provenance.generatedAt - a.provenance.generatedAt;
  });

  return typeof options.limit === "number" ? candidates.slice(0, options.limit) : candidates;
}

export function buildMemoryAlignmentStatus(input: {
  userId: string;
  candidates: MemoryKnowledgeAlignmentCandidate[];
  memoryCount: number;
  graphNodeCount: number;
  historyCount?: number;
  generatedAt?: number;
}): MemoryKnowledgeAlignmentStatus {
  const alignedCount = input.candidates.filter((candidate) => candidate.status === "aligned").length;
  const conflictCount = input.candidates.filter((candidate) => candidate.status === "conflict").length;
  const lastCandidateAt = input.candidates.length > 0
    ? Math.max(...input.candidates.map((candidate) => candidate.provenance.memoryCreatedAt || 0))
    : null;

  return {
    userId: input.userId,
    memoryCount: input.memoryCount,
    graphNodeCount: input.graphNodeCount,
    candidateCount: input.candidates.length,
    alignedCount,
    conflictCount,
    historyCount: input.historyCount || 0,
    hasActionableCandidates: alignedCount > 0,
    lastCandidateAt,
    generatedAt: input.generatedAt || Date.now(),
  };
}

export function knowledgeGraphNodesForAlignment(graph: KnowledgeGraph): AlignmentGraphNode[] {
  return graph.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    filePath: node.filePath,
    summary: node.summary,
    importance: node.importance,
  }));
}

function stableGraphIdPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fa5:_-]+/gu, "")
    .slice(0, 80) || "unknown";
}

export function buildAlignmentGraphPatch(
  userId: string,
  candidates: MemoryKnowledgeAlignmentCandidate[],
  options: AlignmentCommitOptions = {}
): { nodes: GraphNode[]; edges: GraphEdge[]; skipped: number } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let skipped = 0;

  for (const candidate of candidates) {
    if (candidate.status === "conflict" && !options.includeConflicts) {
      skipped++;
      continue;
    }

    const memoryPart = stableGraphIdPart(candidate.memoryId);
    const knowledgePart = stableGraphIdPart(candidate.knowledgeNodeId);
    const nodeId = `memalign:${stableGraphIdPart(userId)}:${memoryPart}:${knowledgePart}`;

    nodes.push({
      id: nodeId,
      label: `记忆: ${candidate.knowledgeLabel}`,
      type: "fact",
      description: candidate.memoryExcerpt,
      sourceFile: `memory://${userId}/${candidate.memoryId}`,
      importance: Math.round(candidate.confidence * 100),
    });

    edges.push({
      source: nodeId,
      target: candidate.knowledgeNodeId,
      relation: candidate.status === "conflict" ? "contradicts" : "supports",
      strength: Math.max(1, Math.round(candidate.confidence * 5)),
    });
  }

  return { nodes, edges, skipped };
}

export function selectAutoCommitAlignmentCandidates(
  candidates: MemoryKnowledgeAlignmentCandidate[],
  options: AutoAlignmentOptions = {}
): {
  selected: MemoryKnowledgeAlignmentCandidate[];
  skippedConflict: number;
  skippedLowConfidence: number;
} {
  const minConfidence = options.minConfidence ?? 0.88;
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  let skippedConflict = 0;
  let skippedLowConfidence = 0;
  const selected: MemoryKnowledgeAlignmentCandidate[] = [];

  for (const candidate of candidates) {
    if (candidate.status === "conflict") {
      skippedConflict++;
      continue;
    }
    if (candidate.confidence < minConfidence) {
      skippedLowConfidence++;
      continue;
    }
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return { selected, skippedConflict, skippedLowConfidence };
}
