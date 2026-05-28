import { a as SourceReplyDeliveryMode } from "./get-reply-options.types-tz7CitlR.js";

//#region src/agents/pi-embedded-runner/run-state.d.ts
type EmbeddedPiQueueHandle = {
  kind?: "embedded";
  queueMessage: (text: string, options?: EmbeddedPiQueueMessageOptions) => Promise<void>;
  isStreaming: () => boolean;
  isCompacting: () => boolean;
  supportsTranscriptCommitWait?: boolean;
  cancel?: (reason?: "user_abort" | "restart" | "superseded") => void;
  abort: () => void;
  sourceReplyDeliveryMode?: SourceReplyDeliveryMode;
};
type EmbeddedPiQueueMessageOptions = {
  steeringMode?: "all";
  debounceMs?: number;
  deliveryTimeoutMs?: number;
  waitForTranscriptCommit?: boolean;
  sourceReplyDeliveryMode?: SourceReplyDeliveryMode;
};
declare function getActiveEmbeddedRunCount(): number;
declare function listActiveEmbeddedRunSessionKeys(): string[];
declare function listActiveEmbeddedRunSessionIds(): string[];
//#endregion
//#region src/agents/pi-embedded-runner/runs.d.ts
type EmbeddedPiQueueFailureReason = "no_active_run" | "not_streaming" | "compacting" | "source_reply_delivery_mode_mismatch" | "transcript_commit_wait_unsupported" | "runtime_rejected";
type EmbeddedPiQueueMessageOutcome = {
  queued: true;
  sessionId: string;
  target: "embedded_run" | "reply_run";
  gatewayHealth: "live";
  deliveredAtMs?: number;
  enqueuedAtMs?: number;
} | {
  queued: false;
  sessionId: string;
  reason: EmbeddedPiQueueFailureReason;
  gatewayHealth: "live";
  errorMessage?: string;
};
/**
 * Abort embedded PI runs.
 *
 * - With a sessionId, aborts that single run.
 * - With no sessionId, supports targeted abort modes (for example, compacting runs only).
 */
declare function abortEmbeddedPiRun(sessionId: string): boolean;
declare function abortEmbeddedPiRun(sessionId: undefined, opts: {
  mode: "all" | "compacting";
}): boolean;
declare function resolveActiveEmbeddedRunSessionId(sessionKey: string): string | undefined;
/**
 * Wait for active embedded runs to drain.
 *
 * Used during restarts so in-flight runs can release session write locks before
 * the next lifecycle starts. If no timeout is passed, waits indefinitely.
 */
declare function waitForActiveEmbeddedRuns(timeoutMs?: number, opts?: {
  pollMs?: number;
}): Promise<{
  drained: boolean;
}>;
declare function setActiveEmbeddedRun(sessionId: string, handle: EmbeddedPiQueueHandle, sessionKey?: string, sessionFile?: string): void;
declare function clearActiveEmbeddedRun(sessionId: string, handle: EmbeddedPiQueueHandle, sessionKey?: string, sessionFile?: string): void;
//#endregion
export { setActiveEmbeddedRun as a, getActiveEmbeddedRunCount as c, resolveActiveEmbeddedRunSessionId as i, listActiveEmbeddedRunSessionIds as l, abortEmbeddedPiRun as n, waitForActiveEmbeddedRuns as o, clearActiveEmbeddedRun as r, EmbeddedPiQueueMessageOptions as s, EmbeddedPiQueueMessageOutcome as t, listActiveEmbeddedRunSessionKeys as u };