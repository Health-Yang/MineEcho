import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  appendAlignmentCommitRecord,
  listAlignmentCommitRecords,
  type AlignmentCommitRecord,
} from "./alignment-history.js";

const dir = mkdtempSync(join(tmpdir(), "mineecho-alignment-history-"));
const filePath = join(dir, "history.json");

const baseRecord: AlignmentCommitRecord = {
  id: "commit-1",
  userId: "user-1",
  createdAt: 1770000000000,
  selectedCount: 2,
  committedNodes: 1,
  committedEdges: 1,
  skipped: 1,
  includedConflicts: false,
  candidateRefs: [
    {
      memoryId: "mem-1",
      knowledgeNodeId: "kg:hci",
      knowledgeLabel: "深信服 HCI",
      status: "aligned",
      confidence: 0.9,
    },
  ],
};

appendAlignmentCommitRecord(baseRecord, { filePath });
appendAlignmentCommitRecord({ ...baseRecord, id: "commit-2", createdAt: 1770000001000 }, { filePath });
appendAlignmentCommitRecord({ ...baseRecord, id: "commit-2", selectedCount: 9, createdAt: 1770000002000 }, { filePath });
appendAlignmentCommitRecord({ ...baseRecord, id: "commit-3", userId: "user-2", createdAt: 1770000003000 }, { filePath });

const records = listAlignmentCommitRecords({ filePath, limit: 1 });

assert.equal(records.length, 1);
assert.equal(records[0].id, "commit-3");
assert.equal(records[0].candidateRefs[0].knowledgeLabel, "深信服 HCI");

const userOneRecords = listAlignmentCommitRecords({ filePath, userId: "user-1", limit: 10 });

assert.equal(userOneRecords.length, 2);
assert.equal(userOneRecords[0].id, "commit-2");
assert.equal(userOneRecords[0].selectedCount, 9);
assert.equal(userOneRecords[1].id, "commit-1");

rmSync(dir, { recursive: true, force: true });

console.log("Knowledge alignment history assertions passed");
