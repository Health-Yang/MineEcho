import { SessionManager } from "@earendil-works/pi-coding-agent";
import type { SessionCompactionCheckpoint, SessionCompactionCheckpointReason, SessionEntry } from "../config/sessions.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";
export declare const MAX_COMPACTION_CHECKPOINT_LEAF_SCAN_BYTES: number;
export declare const MAX_COMPACTION_CHECKPOINT_RETAINED_BYTES_PER_SESSION: number;
export type CapturedCompactionCheckpointSnapshot = {
    sessionId: string;
    sessionFile?: string;
    leafId: string;
};
type ForkedCompactionCheckpointTranscript = {
    sessionId: string;
    sessionFile: string;
};
export declare function resolveSessionCompactionCheckpointReason(params: {
    trigger?: "budget" | "overflow" | "manual";
    timedOut?: boolean;
}): SessionCompactionCheckpointReason;
export declare function readSessionLeafIdFromTranscriptAsync(sessionFile: string, maxBytes?: number): Promise<string | null>;
export declare function forkCompactionCheckpointTranscriptAsync(params: {
    sourceFile: string;
    sourceLeafId?: string;
    targetCwd?: string;
    sessionDir?: string;
}): Promise<ForkedCompactionCheckpointTranscript | null>;
/**
 * Capture the stable pre-compaction identity without duplicating the transcript.
 * Branch/restore uses the compacted successor transcript, while legacy
 * checkpoints that already have a snapshot file keep working.
 */
export declare function captureCompactionCheckpointSnapshotAsync(params: {
    sessionManager?: Pick<SessionManager, "getLeafId">;
    sessionFile: string;
    maxBytes?: number;
}): Promise<CapturedCompactionCheckpointSnapshot | null>;
export declare function cleanupCompactionCheckpointSnapshot(snapshot: CapturedCompactionCheckpointSnapshot | null | undefined): Promise<void>;
export declare function persistSessionCompactionCheckpoint(params: {
    cfg: OpenClawConfig;
    sessionKey: string;
    sessionId: string;
    reason: SessionCompactionCheckpointReason;
    snapshot: CapturedCompactionCheckpointSnapshot;
    summary?: string;
    firstKeptEntryId?: string;
    tokensBefore?: number;
    tokensAfter?: number;
    postSessionFile?: string;
    postLeafId?: string;
    postEntryId?: string;
    createdAt?: number;
}): Promise<SessionCompactionCheckpoint | null>;
export declare function listSessionCompactionCheckpoints(entry: Pick<SessionEntry, "compactionCheckpoints"> | undefined): SessionCompactionCheckpoint[];
export declare function getSessionCompactionCheckpoint(params: {
    entry: Pick<SessionEntry, "compactionCheckpoints"> | undefined;
    checkpointId: string;
}): SessionCompactionCheckpoint | undefined;
export {};
