import { apiFetch } from "./api";

export interface MemoryAlignmentCandidate {
  memoryId: string;
  memoryLevel: 0 | 1 | 2 | 3;
  memorySource: string;
  memoryExcerpt: string;
  knowledgeNodeId: string;
  knowledgeLabel: string;
  knowledgeType: string;
  knowledgeSource?: string;
  confidence: number;
  score?: {
    final: number;
    labelMatch: number;
    descriptionMatch: number;
    conflictPenalty: number;
  };
  status: "aligned" | "conflict";
  evidence: Array<{ type: string; value: string }>;
  sourceSpans?: Array<{
    kind: "memory" | "knowledge";
    text: string;
    source?: string;
  }>;
  provenance: {
    memoryId: string;
    knowledgeNodeId: string;
    memoryCreatedAt?: number;
    knowledgeSource?: string;
    generatedAt: number;
  };
}

export interface MemoryAlignmentPreview {
  userId: string;
  candidates: MemoryAlignmentCandidate[];
  memoryCount: number;
  graphNodeCount: number;
  previewOnly: boolean;
}

export interface MemoryAlignmentStatus {
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

export interface MemoryAlignmentCommitResult {
  committedNodes: number;
  committedEdges: number;
  skipped: number;
  historyRecord?: MemoryAlignmentHistoryRecord;
}

export interface AutoCommitMemoryAlignmentResult {
  scannedMemories: number;
  candidateCount: number;
  selectedCount: number;
  committedNodes: number;
  committedEdges: number;
  skippedConflict: number;
  skippedLowConfidence: number;
  historyRecord?: MemoryAlignmentHistoryRecord;
}

export interface MemoryAlignmentHistoryRecord {
  id: string;
  userId: string;
  createdAt: number;
  selectedCount: number;
  committedNodes: number;
  committedEdges: number;
  skipped: number;
  includedConflicts: boolean;
  candidateRefs: Array<{
    memoryId: string;
    knowledgeNodeId: string;
    knowledgeLabel: string;
    status: "aligned" | "conflict";
    confidence: number;
  }>;
}

export interface MemoryAlignmentHistory {
  records: MemoryAlignmentHistoryRecord[];
}

interface FetchMemoryAlignmentPreviewOptions {
  days?: number;
  limit?: number;
  minConfidence?: number;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function fetchMemoryAlignmentPreview(
  options: FetchMemoryAlignmentPreviewOptions = {}
): Promise<MemoryAlignmentPreview> {
  const fetcher = options.fetcher || apiFetch;
  const body = {
    days: options.days ?? 30,
    limit: options.limit ?? 20,
    minConfidence: options.minConfidence ?? 0.72,
  };

  const response = await fetcher("/api/knowledge-base/align-memory-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || "记忆对齐预览失败");
  }

  return result.data as MemoryAlignmentPreview;
}

interface FetchMemoryAlignmentStatusOptions {
  days?: number;
  limit?: number;
  minConfidence?: number;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function fetchMemoryAlignmentStatus(
  options: FetchMemoryAlignmentStatusOptions = {}
): Promise<MemoryAlignmentStatus> {
  const fetcher = options.fetcher || apiFetch;
  const params = new URLSearchParams({
    days: String(options.days ?? 30),
    limit: String(options.limit ?? 20),
    minConfidence: String(options.minConfidence ?? 0.72),
  });
  const response = await fetcher(`/api/knowledge-base/align-memory-status?${params.toString()}`);

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || "记忆对齐状态读取失败");
  }

  return result.data as MemoryAlignmentStatus;
}

interface CommitMemoryAlignmentOptions {
  candidates: MemoryAlignmentCandidate[];
  includeConflicts?: boolean;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function commitMemoryAlignment(
  options: CommitMemoryAlignmentOptions
): Promise<MemoryAlignmentCommitResult> {
  const fetcher = options.fetcher || apiFetch;
  const response = await fetcher("/api/knowledge-base/align-memory-commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidates: options.candidates,
      includeConflicts: options.includeConflicts === true,
    }),
  });

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || "记忆对齐沉淀失败");
  }

  return result.data as MemoryAlignmentCommitResult;
}

interface AutoCommitMemoryAlignmentOptions {
  days?: number;
  previewLimit?: number;
  commitLimit?: number;
  minConfidence?: number;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function autoCommitMemoryAlignment(
  options: AutoCommitMemoryAlignmentOptions = {}
): Promise<AutoCommitMemoryAlignmentResult> {
  const fetcher = options.fetcher || apiFetch;
  const response = await fetcher("/api/knowledge-base/align-memory-auto-commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      days: options.days ?? 30,
      previewLimit: options.previewLimit ?? 100,
      commitLimit: options.commitLimit ?? 20,
      minConfidence: options.minConfidence ?? 0.88,
    }),
  });

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || "自动记忆对齐失败");
  }

  return result.data as AutoCommitMemoryAlignmentResult;
}

interface FetchMemoryAlignmentHistoryOptions {
  limit?: number;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
}

export async function fetchMemoryAlignmentHistory(
  options: FetchMemoryAlignmentHistoryOptions = {}
): Promise<MemoryAlignmentHistory> {
  const fetcher = options.fetcher || apiFetch;
  const limit = options.limit ?? 20;
  const response = await fetcher(`/api/knowledge-base/alignment-history?limit=${encodeURIComponent(String(limit))}`);

  const result = await response.json();
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message || "记忆对齐历史读取失败");
  }

  return result.data as MemoryAlignmentHistory;
}
