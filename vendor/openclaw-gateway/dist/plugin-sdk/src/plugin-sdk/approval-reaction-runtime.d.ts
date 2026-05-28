import type { ApprovalRequest, PendingApprovalView } from "../infra/approval-view-model.types.js";
import { type ExecApprovalReplyDecision } from "../infra/exec-approval-reply.js";
import type { ReplyPayload } from "./reply-payload.js";
export { shouldSuppressLocalNativeExecApprovalPrompt } from "./approval-native-helpers.js";
type ApprovalKind = "exec" | "plugin";
type KeyedStore<TValue> = {
    register(key: string, value: TValue, opts?: {
        ttlMs?: number;
    }): Promise<void>;
    lookup(key: string): Promise<TValue | undefined>;
    delete(key: string): Promise<boolean>;
};
type PersistedApprovalReactionTarget<TTarget> = {
    version: 1;
    target: TTarget;
};
export type ApprovalReactionTargetStore<TTarget> = {
    register(key: string, target: TTarget, opts?: {
        ttlMs?: number;
    }): void;
    lookup(key: string): Promise<TTarget | null>;
    delete(key: string): void;
    clearForTest(): void;
};
export type ApprovalReactionDecisionBinding = {
    decision: ExecApprovalReplyDecision;
    emoji: string;
    label: string;
};
export type ApprovalReactionDecisionResolution = {
    decision: ExecApprovalReplyDecision;
    normalizedEmoji: string;
};
export type ApprovalReactionTargetRecord<TRoute = unknown> = {
    approvalId: string;
    approvalKind?: ApprovalKind;
    allowedDecisions: readonly ExecApprovalReplyDecision[];
    route?: TRoute;
    expiresAtMs?: number;
};
export type ApprovalReactionTargetResolution<TRoute = unknown> = ApprovalReactionDecisionResolution & {
    approvalId: string;
    approvalKind: ApprovalKind;
    route?: TRoute;
};
export type ApprovalReactionPromptPayload = ReplyPayload & {
    allowedDecisions: readonly ExecApprovalReplyDecision[];
    reactionBindings: readonly ApprovalReactionDecisionBinding[];
};
export type ApprovalReactionPendingContent = {
    reactionPayload: ApprovalReactionPromptPayload;
    manualFallbackPayload: ReplyPayload;
};
export declare const APPROVAL_REACTION_BINDINGS: readonly [{
    readonly decision: "allow-once";
    readonly emoji: "👍";
    readonly label: "Allow Once";
}, {
    readonly decision: "allow-always";
    readonly emoji: "♾️";
    readonly label: "Allow Always";
}, {
    readonly decision: "deny";
    readonly emoji: "👎";
    readonly label: "Deny";
}];
export declare function listApprovalReactionBindings(params: {
    allowedDecisions: readonly ExecApprovalReplyDecision[];
}): ApprovalReactionDecisionBinding[];
export declare function buildApprovalReactionHint(params: {
    allowedDecisions: readonly ExecApprovalReplyDecision[];
}): string | null;
export declare function normalizeApprovalReactionEmoji(reactionKey: string): string;
export declare function resolveApprovalReactionDecision(params: {
    reactionKey: string;
    allowedDecisions: readonly ExecApprovalReplyDecision[];
}): ApprovalReactionDecisionResolution | null;
export declare function resolveApprovalReactionTarget<TRoute = unknown>(params: {
    target: ApprovalReactionTargetRecord<TRoute> | null | undefined;
    reactionKey: string;
}): ApprovalReactionTargetResolution<TRoute> | null;
export declare function buildApprovalPendingPromptPayload(params: {
    request: ApprovalRequest;
    view: PendingApprovalView;
    nowMs: number;
}): ApprovalReactionPromptPayload;
export declare function buildApprovalReactionPromptPayloadForRequest(params: {
    request: ApprovalRequest;
    nowMs: number;
}): ApprovalReactionPromptPayload;
export declare function buildApprovalReactionPendingContent(params: {
    request: ApprovalRequest;
    view: PendingApprovalView;
    nowMs: number;
}): ApprovalReactionPendingContent;
export declare function buildApprovalReactionPendingContentForRequest(params: {
    request: ApprovalRequest;
    nowMs: number;
}): ApprovalReactionPendingContent;
export declare function createApprovalReactionTargetStore<TTarget>(params: {
    namespace: string;
    maxEntries: number;
    defaultTtlMs: number;
    openStore?: (params: {
        namespace: string;
        maxEntries: number;
        defaultTtlMs: number;
    }) => KeyedStore<PersistedApprovalReactionTarget<TTarget>> | undefined;
    logPersistentError?: (error: unknown) => void;
    readPersistedTarget?: (target: unknown) => TTarget | null;
    nowMs?: () => number;
}): ApprovalReactionTargetStore<TTarget>;
