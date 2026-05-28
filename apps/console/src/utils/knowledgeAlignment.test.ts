import assert from "node:assert/strict";
import {
  autoCommitMemoryAlignment,
  commitMemoryAlignment,
  fetchMemoryAlignmentHistory,
  fetchMemoryAlignmentPreview,
  fetchMemoryAlignmentStatus,
  type MemoryAlignmentCandidate,
} from "./knowledgeAlignment";

const calls: Array<{ url: string; init?: RequestInit }> = [];
const candidates: MemoryAlignmentCandidate[] = [
  {
    memoryId: "mem-1",
    memoryLevel: 1,
    memorySource: "conversation",
    memoryExcerpt: "深信服 HCI 部署方案",
    knowledgeNodeId: "node-hci",
    knowledgeLabel: "深信服 HCI",
    knowledgeType: "entity",
    confidence: 0.9,
    score: {
      final: 0.9,
      labelMatch: 0.9,
      descriptionMatch: 0,
      conflictPenalty: 0,
    },
    status: "aligned",
    evidence: [{ type: "label", value: "深信服 HCI" }],
    sourceSpans: [
      { kind: "memory", text: "深信服 HCI 部署方案", source: "memory://conversation/mem-1" },
      { kind: "knowledge", text: "深信服 HCI", source: "wiki/hci.md" },
    ],
    provenance: {
      memoryId: "mem-1",
      knowledgeNodeId: "node-hci",
      memoryCreatedAt: 1770000000000,
      knowledgeSource: "wiki/hci.md",
      generatedAt: 1770000000000,
    },
  },
];
const response = {
  code: 0,
  message: "success",
  data: {
    userId: "anonymous",
    candidates,
    memoryCount: 3,
    graphNodeCount: 8,
    previewOnly: true,
  },
};

const fetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => response,
  } as Response;
};

const result = await fetchMemoryAlignmentPreview({
  days: 14,
  limit: 5,
  minConfidence: 0.8,
  fetcher,
});

assert.equal(result.candidates.length, 1);
assert.equal(result.previewOnly, true);
assert.equal(calls[0].url, "/api/knowledge-base/align-memory-preview");
assert.equal(calls[0].init?.method, "POST");
assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
  days: 14,
  limit: 5,
  minConfidence: 0.8,
});

console.log("Knowledge alignment API assertions passed");

calls.length = 0;
const statusResponse = {
  code: 0,
  message: "success",
  data: {
    userId: "anonymous",
    memoryCount: 3,
    graphNodeCount: 8,
    candidateCount: 1,
    alignedCount: 1,
    conflictCount: 0,
    historyCount: 2,
    hasActionableCandidates: true,
    lastCandidateAt: 1770000000000,
    generatedAt: 1770000001000,
  },
};
const statusFetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => statusResponse,
  } as Response;
};

const status = await fetchMemoryAlignmentStatus({
  days: 7,
  limit: 12,
  minConfidence: 0.78,
  fetcher: statusFetcher,
});

assert.equal(status.candidateCount, 1);
assert.equal(calls[0].url, "/api/knowledge-base/align-memory-status?days=7&limit=12&minConfidence=0.78");

console.log("Knowledge alignment status API assertions passed");

calls.length = 0;
const commitResponse = {
  code: 0,
  message: "success",
  data: {
    committedNodes: 1,
    committedEdges: 1,
    skipped: 0,
  },
};
const commitFetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => commitResponse,
  } as Response;
};

const commit = await commitMemoryAlignment({
  candidates: response.data.candidates,
  includeConflicts: false,
  fetcher: commitFetcher,
});

assert.equal(commit.committedNodes, 1);
assert.equal(calls[0].url, "/api/knowledge-base/align-memory-commit");
assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
  candidates: response.data.candidates,
  includeConflicts: false,
});

console.log("Knowledge alignment commit API assertions passed");

calls.length = 0;
const autoCommitResponse = {
  code: 0,
  message: "success",
  data: {
    scannedMemories: 3,
    candidateCount: 2,
    selectedCount: 1,
    committedNodes: 1,
    committedEdges: 1,
    skippedConflict: 0,
    skippedLowConfidence: 1,
  },
};
const autoCommitFetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => autoCommitResponse,
  } as Response;
};

const autoCommit = await autoCommitMemoryAlignment({
  days: 14,
  previewLimit: 50,
  commitLimit: 8,
  minConfidence: 0.9,
  fetcher: autoCommitFetcher,
});

assert.equal(autoCommit.selectedCount, 1);
assert.equal(calls[0].url, "/api/knowledge-base/align-memory-auto-commit");
assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
  days: 14,
  previewLimit: 50,
  commitLimit: 8,
  minConfidence: 0.9,
});

console.log("Knowledge alignment auto commit API assertions passed");

calls.length = 0;
const historyResponse = {
  code: 0,
  message: "success",
  data: {
    records: [
      {
        id: "commit-1",
        userId: "anonymous",
        createdAt: 1770000000000,
        selectedCount: 1,
        committedNodes: 1,
        committedEdges: 1,
        skipped: 0,
        includedConflicts: false,
        candidateRefs: [
          {
            memoryId: "mem-1",
            knowledgeNodeId: "node-hci",
            knowledgeLabel: "深信服 HCI",
            status: "aligned",
            confidence: 0.9,
          },
        ],
      },
    ],
  },
};
const historyFetcher = async (url: string, init?: RequestInit): Promise<Response> => {
  calls.push({ url, init });
  return {
    ok: true,
    json: async () => historyResponse,
  } as Response;
};

const history = await fetchMemoryAlignmentHistory({ limit: 10, fetcher: historyFetcher });

assert.equal(history.records.length, 1);
assert.equal(calls[0].url, "/api/knowledge-base/alignment-history?limit=10");

console.log("Knowledge alignment history API assertions passed");
