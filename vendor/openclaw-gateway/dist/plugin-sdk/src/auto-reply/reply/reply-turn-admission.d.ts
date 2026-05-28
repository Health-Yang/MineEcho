import { type ReplyOperation } from "./reply-run-registry.js";
export type ReplyTurnKind = "visible" | "heartbeat" | "queued_followup" | "control_abort";
export type ReplyTurnAdmission = {
    status: "owned";
    operation: ReplyOperation;
} | {
    status: "skipped";
    reason: "active-run" | "aborted";
    activeOperation?: ReplyOperation;
};
export declare function admitReplyTurn(params: {
    sessionKey: string;
    sessionId: string;
    kind: ReplyTurnKind;
    resetTriggered: boolean;
    upstreamAbortSignal?: AbortSignal;
    waitTimeoutMs?: number;
    waitForActive?: boolean;
}): Promise<ReplyTurnAdmission>;
export declare function resolveReplyTurnKind(opts?: {
    isHeartbeat?: boolean;
}): ReplyTurnKind;
