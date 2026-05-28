import { type ExecApprovalReplyMetadata } from "../infra/exec-approval-reply.js";
import type { ExecApprovalSessionTarget } from "../infra/exec-approval-session-target.js";
import type { ExecApprovalRequest } from "../infra/exec-approvals.js";
import type { PluginApprovalRequest } from "../infra/plugin-approvals.js";
import type { ChannelApprovalCapability, ChannelOutboundPayloadHint } from "./channel-contract.js";
import type { OpenClawConfig } from "./config-runtime.js";
import type { ReplyPayload } from "./reply-payload.js";
type ApprovalRequest = ExecApprovalRequest | PluginApprovalRequest;
type ApprovalKind = "exec" | "plugin";
type DeliverySuppressionInput = Parameters<NonNullable<NonNullable<ChannelApprovalCapability["delivery"]>["shouldSuppressForwardingFallback"]>>[0];
type NativeApprovalForwardTarget = DeliverySuppressionInput["target"];
type LocalNativeExecApprovalConfig = {
    enabled?: boolean | "auto";
    mode?: string | null;
    agentFilter?: string[];
    sessionFilter?: string[];
};
type ApprovalResolverParams = {
    cfg: OpenClawConfig;
    accountId?: string | null;
    approvalKind?: ApprovalKind;
    request: ApprovalRequest;
};
type NativeApprovalTargetNormalizer<TTarget> = (target: TTarget, request: ApprovalRequest) => TTarget | null | undefined;
type NativeApprovalForwardingFallbackSuppressorParams<TTarget extends NativeApprovalTarget> = {
    channel: string;
    normalizeForwardTarget: (target: NativeApprovalForwardTarget) => TTarget | null;
    resolveAccountId?: (params: {
        forwardingTarget: TTarget;
        target: NativeApprovalForwardTarget;
        request: ApprovalRequest;
    }) => string | null | undefined;
    resolveApprovalKind?: (params: {
        approvalKind?: ApprovalKind;
        request: ApprovalRequest;
    }) => ApprovalKind;
    isSessionRouteEligible: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
        approvalKind: ApprovalKind;
        request: ApprovalRequest;
    }) => boolean;
    isExplicitTargetEligible?: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
        approvalKind: ApprovalKind;
        request: ApprovalRequest;
        target: NativeApprovalForwardTarget;
    }) => boolean;
    resolveForwardingTargetForMatch?: (params: {
        forwardingTarget: TTarget;
        accountId?: string | null;
        target: NativeApprovalForwardTarget;
        approvalKind: ApprovalKind;
        request: ApprovalRequest;
    }) => TTarget | null;
    resolveOriginTarget: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
        approvalKind: ApprovalKind;
        request: ApprovalRequest;
    }) => TTarget | null;
    resolveApproverDmTargets: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
        approvalKind: ApprovalKind;
        request: ApprovalRequest;
    }) => readonly TTarget[];
    targetsMatch?: (left: TTarget, right: TTarget) => boolean;
};
type NativeOriginResolverParams<TTarget extends NativeApprovalTarget> = {
    channel: string;
    shouldHandleRequest?: (params: ApprovalResolverParams) => boolean;
    resolveTurnSourceTarget: (request: ApprovalRequest) => TTarget | null;
    resolveSessionTarget: (sessionTarget: ExecApprovalSessionTarget, request: ApprovalRequest) => TTarget | null;
    normalizeTarget?: NativeApprovalTargetNormalizer<TTarget>;
    normalizeTargetForMatch?: NativeApprovalTargetNormalizer<TTarget>;
    targetsMatch?: (a: TTarget, b: TTarget) => boolean;
    resolveFallbackTarget?: (request: ApprovalRequest) => TTarget | null;
};
type CustomOriginResolverParams<TTarget> = {
    channel: string;
    shouldHandleRequest?: (params: ApprovalResolverParams) => boolean;
    resolveTurnSourceTarget: (request: ApprovalRequest) => TTarget | null;
    resolveSessionTarget: (sessionTarget: ExecApprovalSessionTarget, request: ApprovalRequest) => TTarget | null;
    normalizeTarget?: NativeApprovalTargetNormalizer<TTarget>;
    normalizeTargetForMatch?: NativeApprovalTargetNormalizer<TTarget>;
    targetsMatch: (a: TTarget, b: TTarget) => boolean;
    resolveFallbackTarget?: (request: ApprovalRequest) => TTarget | null;
};
export type NativeApprovalTarget = {
    to: string;
    accountId?: string | null;
    threadId?: string | number | null;
};
export declare function nativeApprovalTargetsMatch(params: {
    channel?: string | null;
    left: NativeApprovalTarget;
    right: NativeApprovalTarget;
}): boolean;
export declare function shouldSuppressLocalNativeExecApprovalPrompt(params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    payload: ReplyPayload;
    hint?: ChannelOutboundPayloadHint;
    isTransportEnabled?: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
    }) => boolean;
    isNativeDeliveryEnabled?: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
    }) => boolean;
    resolveApprovalConfig?: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
        metadata: ExecApprovalReplyMetadata;
    }) => LocalNativeExecApprovalConfig | undefined;
    requireApprovalConfigEnabled?: boolean;
    enforceForwardingMode?: boolean;
    isSessionRouteEligible?: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
        metadata: ExecApprovalReplyMetadata;
    }) => boolean;
    hasExactTargetProof?: boolean;
    fallbackAgentIdFromSessionKey?: boolean;
}): boolean;
export declare function createNativeApprovalForwardingFallbackSuppressor<TTarget extends NativeApprovalTarget>(params: NativeApprovalForwardingFallbackSuppressorParams<TTarget>): NonNullable<NonNullable<ChannelApprovalCapability["delivery"]>["shouldSuppressForwardingFallback"]>;
export declare function createChannelNativeOriginTargetResolver<TTarget extends NativeApprovalTarget>(params: NativeOriginResolverParams<TTarget>): (input: ApprovalResolverParams) => TTarget | null;
export declare function createChannelNativeOriginTargetResolver<TTarget>(params: CustomOriginResolverParams<TTarget>): (input: ApprovalResolverParams) => TTarget | null;
export declare function createChannelApproverDmTargetResolver<TApprover, TTarget extends NativeApprovalTarget = NativeApprovalTarget>(params: {
    shouldHandleRequest?: (params: ApprovalResolverParams) => boolean;
    resolveApprovers: (params: {
        cfg: OpenClawConfig;
        accountId?: string | null;
    }) => readonly TApprover[];
    mapApprover: (approver: TApprover, params: ApprovalResolverParams) => TTarget | null | undefined;
}): (input: ApprovalResolverParams) => TTarget[];
export {};
