import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { getKbBasePath } from "./paths.js";
import type { MemoryKnowledgeAlignmentCandidate } from "./alignment.js";

export interface AlignmentCommitRecord {
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
    status: MemoryKnowledgeAlignmentCandidate["status"];
    confidence: number;
  }>;
}

interface AlignmentHistoryOptions {
  filePath?: string;
  limit?: number;
  userId?: string;
}

function getDefaultHistoryPath(): string {
  return join(dirname(getKbBasePath()), "alignment-history.json");
}

function readRecords(filePath: string): AlignmentCommitRecord[] {
  if (!existsSync(filePath)) return [];
  try {
    const data = JSON.parse(readFileSync(filePath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeRecords(filePath: string, records: AlignmentCommitRecord[]): void {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export function appendAlignmentCommitRecord(
  record: AlignmentCommitRecord,
  options: AlignmentHistoryOptions = {}
): AlignmentCommitRecord {
  const filePath = options.filePath || getDefaultHistoryPath();
  const records = readRecords(filePath).filter((item) => item.id !== record.id);
  records.push(record);
  records.sort((a, b) => b.createdAt - a.createdAt);
  writeRecords(filePath, records.slice(0, 200));
  return record;
}

export function listAlignmentCommitRecords(
  options: AlignmentHistoryOptions = {}
): AlignmentCommitRecord[] {
  const limit = Math.min(200, Math.max(1, Number(options.limit) || 50));
  const filePath = options.filePath || getDefaultHistoryPath();
  return readRecords(filePath)
    .filter((record) => !options.userId || record.userId === options.userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export function buildAlignmentCommitRecord(params: {
  userId: string;
  candidates: MemoryKnowledgeAlignmentCandidate[];
  committedNodes: number;
  committedEdges: number;
  skipped: number;
  includedConflicts: boolean;
  now?: number;
}): AlignmentCommitRecord {
  const createdAt = params.now ?? Date.now();
  return {
    id: `memalign-${params.userId}-${createdAt}`,
    userId: params.userId,
    createdAt,
    selectedCount: params.candidates.length,
    committedNodes: params.committedNodes,
    committedEdges: params.committedEdges,
    skipped: params.skipped,
    includedConflicts: params.includedConflicts,
    candidateRefs: params.candidates.slice(0, 50).map((candidate) => ({
      memoryId: candidate.memoryId,
      knowledgeNodeId: candidate.knowledgeNodeId,
      knowledgeLabel: candidate.knowledgeLabel,
      status: candidate.status,
      confidence: candidate.confidence,
    })),
  };
}
