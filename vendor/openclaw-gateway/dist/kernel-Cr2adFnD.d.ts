import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { d as ContextVisibilityMode } from "./types.base-DFyTixvq.js";
import { t as ReplyPayload } from "./reply-payload-DVcklM6x.js";
import { t as InboundEventKind } from "./kind-CFh9tvAP.js";
import { i as CommandTurnContext, t as FinalizedMsgContext } from "./templating-5iVgSDdS.js";
import { P as MessageReceipt } from "./types-CxYxc234.js";
import { t as FinalizeInboundContextOptions } from "./inbound-context-Jvj1BmhZ.js";
import { n as DurableFinalDeliveryRequirement, r as DurableFinalDeliveryRequirements, t as DeliverOutboundPayloadsParams } from "./deliver-D7CBLySq.js";
import { i as createChannelReplyPipeline, n as CreateChannelReplyPipelineParams } from "./reply-pipeline-DUNi9mTh.js";
import { A as SupplementalContextFacts, C as NormalizedTurnInput, D as RouteFacts, E as ReplyPlanFacts, M as clearChannelBotPairLoopGuardForTests, N as listTrackedChannelBotPairsForTests, O as RunChannelTurnParams, P as recordChannelBotPairLoopAndCheckSuppression, S as MessageFacts, T as PreparedChannelTurn, _ as ChannelTurnResult, a as ChannelDeliveryResult, b as DispatchedChannelTurnResult, c as ChannelTurnAdapter, d as ChannelTurnDroppedHistoryOptions, f as ChannelTurnHistoryFinalizeOptions, g as ChannelTurnResolved, h as ChannelTurnReplyPipelineOptions, i as ChannelDeliveryIntent, j as ChannelBotLoopProtectionFacts, k as SenderFacts, l as ChannelTurnAdmission, m as ChannelTurnRecordOptions, n as AssembledChannelTurn, o as ChannelEventClass, p as ChannelTurnLogEvent, r as ChannelDeliveryInfo, s as ChannelEventDeliveryAdapter, t as AccessFacts, u as ChannelTurnDispatcherOptions, v as CommandFacts, w as PreflightFacts, x as InboundMediaFacts, y as ConversationFacts } from "./types-a_7hWZPH.js";
import { n as createChannelHistoryWindow, t as ChannelHistoryWindow } from "./history-window-DpOfKxmG.js";
import { a as hasVisibleChannelTurnDispatch, i as hasFinalChannelTurnDispatch, n as ChannelTurnVisibleDeliverySignals, o as resolveChannelTurnDispatchCounts, r as EMPTY_CHANNEL_TURN_DISPATCH_COUNTS, t as ChannelTurnDispatchResultLike } from "./dispatch-result-DLXmUyf_.js";

//#region src/channels/inbound-event/context.d.ts
type MaybePromise<T> = T | Promise<T>;
type ChannelInboundSupplementalMediaResolver = () => MaybePromise<readonly InboundMediaFacts[] | null | undefined>;
type ChannelInboundSupplementalQuoteFacts = NonNullable<SupplementalContextFacts["quote"]> & {
  isSelf?: boolean;
  media?: readonly InboundMediaFacts[] | ChannelInboundSupplementalMediaResolver;
};
type ChannelInboundSupplementalFacts = Omit<SupplementalContextFacts, "quote"> & {
  quote?: ChannelInboundSupplementalQuoteFacts;
};
/**
 * @deprecated Prefer passing `resolveSupplementalMedia: true` directly to
 * `buildChannelInboundEventContext` without naming this compatibility type.
 */
type ChannelInboundSupplementalResolutionOptions = {
  resolveSupplementalMedia: true;
  suppressSelfQuoteBody?: boolean;
  suppressSelfQuoteMedia?: boolean;
};
type BuildAccessFacts = Omit<AccessFacts, "commands"> & {
  commands?: Partial<NonNullable<AccessFacts["commands"]>>;
};
type BuildChannelInboundEventContextParams = {
  channel: string;
  accountId?: string;
  provider?: string;
  surface?: string;
  messageId?: string;
  messageIdFull?: string;
  timestamp?: number;
  from: string;
  sender: SenderFacts;
  conversation: ConversationFacts;
  route: RouteFacts;
  reply: ReplyPlanFacts;
  message: MessageFacts;
  access?: BuildAccessFacts;
  command?: CommandFacts;
  commandTurn?: CommandTurnContext;
  media?: InboundMediaFacts[];
  supplemental?: ChannelInboundSupplementalFacts;
  contextVisibility?: ContextVisibilityMode;
  finalize?: FinalizeInboundContextFn;
  finalizeOptions?: FinalizeInboundContextOptions;
  extra?: Record<string, unknown>;
};
/**
 * @deprecated Prefer `BuildChannelInboundEventContextParams` with
 * `resolveSupplementalMedia: true` at call sites that need lazy quote media.
 */
type BuildChannelInboundEventContextAsyncParams = BuildChannelInboundEventContextParams & ChannelInboundSupplementalResolutionOptions;
type BuiltChannelInboundEventContext = FinalizedMsgContext & {
  Body: string;
  BodyForAgent: string;
  BodyForCommands: string;
  ChatType: ConversationFacts["kind"];
  CommandAuthorized: boolean;
  CommandBody: string;
  From: string;
  RawBody: string;
  SessionKey: string;
  To: string;
  InboundEventKind: InboundEventKind;
};
type FinalizeInboundContextFn = (ctx: Record<string, unknown>, opts?: FinalizeInboundContextOptions) => unknown;
/**
 * @deprecated Used by deprecated `finalizeChannelInboundContext`; new channel
 * code should pass facts to `buildChannelInboundEventContext`.
 */
type FinalizeChannelInboundContextParams<T extends Record<string, unknown>> = {
  context: T;
  supplemental?: SupplementalContextFacts | ChannelInboundSupplementalFacts;
  contextVisibility?: ContextVisibilityMode;
  media?: readonly InboundMediaFacts[];
  finalize?: FinalizeInboundContextFn;
  finalizeOptions?: FinalizeInboundContextOptions;
};
/**
 * @deprecated Prefer `FinalizeChannelInboundContextParams<T>` with
 * `resolveSupplementalMedia: true` when lazy quote media must be resolved.
 */
type FinalizeChannelInboundContextAsyncParams<T extends Record<string, unknown>> = FinalizeChannelInboundContextParams<T> & {
  resolveSupplementalMedia: true;
} & Pick<ChannelInboundSupplementalResolutionOptions, "suppressSelfQuoteBody" | "suppressSelfQuoteMedia">;
/**
 * @deprecated Result type for deprecated `finalizeChannelInboundContext`.
 */
type FinalizeChannelInboundContextResult<T extends Record<string, unknown>> = {
  context: T & FinalizedMsgContext;
  supplemental?: SupplementalContextFacts;
  quoteHidden: boolean;
  forwardedHidden: boolean;
  threadHidden: boolean;
};
declare function filterChannelInboundSupplementalContext(params: {
  supplemental?: SupplementalContextFacts;
  contextVisibility?: ContextVisibilityMode;
}): SupplementalContextFacts | undefined;
declare function filterChannelInboundQuoteContext(contextVisibility: ContextVisibilityMode | undefined, quote: SupplementalContextFacts["quote"] | undefined): SupplementalContextFacts["quote"] | undefined;
/**
 * @deprecated Prefer `buildChannelInboundEventContext({ resolveSupplementalMedia: true })`
 * for channel inbound payloads.
 */
declare function resolveChannelInboundSupplementalContext(params: {
  supplemental?: ChannelInboundSupplementalFacts;
  contextVisibility?: ContextVisibilityMode;
  media?: readonly InboundMediaFacts[];
  suppressSelfQuoteBody?: boolean;
  suppressSelfQuoteMedia?: boolean;
}): Promise<{
  supplemental?: SupplementalContextFacts;
  media: InboundMediaFacts[];
  quoteHidden: boolean;
}>;
/**
 * @deprecated Public compatibility for callers that already prepared legacy
 * prompt fields. New channel code should use `buildChannelInboundEventContext`.
 */
declare function finalizeChannelInboundContext<T extends Record<string, unknown>>(params: FinalizeChannelInboundContextAsyncParams<T>): Promise<FinalizeChannelInboundContextResult<T>>;
declare function finalizeChannelInboundContext<T extends Record<string, unknown>>(params: FinalizeChannelInboundContextParams<T>): FinalizeChannelInboundContextResult<T>;
declare function buildChannelInboundEventContext(params: BuildChannelInboundEventContextAsyncParams): Promise<BuiltChannelInboundEventContext>;
declare function buildChannelInboundEventContext(params: BuildChannelInboundEventContextParams): BuiltChannelInboundEventContext;
//#endregion
//#region src/channels/turn/durable-delivery.d.ts
type DurableInboundReplyDeliveryOptions = Pick<DeliverOutboundPayloadsParams, "deps" | "formatting" | "identity" | "mediaAccess" | "replyToMode" | "silent" | "threadId"> & {
  to?: string | null;
  replyToId?: string | null;
  requiredCapabilities?: DurableFinalDeliveryRequirements;
};
type DurableInboundReplyDeliveryParams = DurableInboundReplyDeliveryOptions & {
  cfg: OpenClawConfig;
  channel: string;
  accountId?: string;
  agentId: string;
  ctxPayload: FinalizedMsgContext;
  payload: ReplyPayload;
  info: ChannelDeliveryInfo;
};
type DurableInboundReplyDeliveryResult = {
  status: "not_applicable";
  reason: "non_final";
} | {
  status: "unsupported";
  reason: "missing_channel" | "missing_target" | "missing_outbound_handler" | "capability_mismatch";
  capability?: DurableFinalDeliveryRequirement;
} | {
  status: "handled_visible";
  delivery: ChannelDeliveryResult;
} | {
  status: "handled_no_send";
  reason: "no_visible_result";
  delivery: ChannelDeliveryResult;
} | {
  status: "failed";
  error: unknown;
  sentBeforeError?: true;
};
declare function isDurableInboundReplyDeliveryHandled(result: DurableInboundReplyDeliveryResult): result is Extract<DurableInboundReplyDeliveryResult, {
  status: "handled_visible" | "handled_no_send";
}>;
declare function throwIfDurableInboundReplyDeliveryFailed(result: DurableInboundReplyDeliveryResult): void;
declare function deliverInboundReplyWithMessageSendContext(params: DurableInboundReplyDeliveryParams): Promise<DurableInboundReplyDeliveryResult>;
/** @deprecated Use `deliverInboundReplyWithMessageSendContext`. */
declare const deliverDurableInboundReplyPayload: typeof deliverInboundReplyWithMessageSendContext;
//#endregion
//#region src/channels/turn/delivery-result.d.ts
declare function createChannelDeliveryResultFromReceipt(params: {
  receipt: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
  deliveryIntent?: ChannelDeliveryIntent;
}): ChannelDeliveryResult;
declare namespace kernel_d_exports {
  export { AccessFacts, AssembledChannelTurn, BuildChannelInboundEventContextParams, ChannelBotLoopProtectionFacts, ChannelDeliveryInfo, ChannelDeliveryResult, ChannelEventClass, ChannelEventDeliveryAdapter, ChannelHistoryWindow, ChannelTurnAdapter, ChannelTurnAdmission, ChannelTurnDispatchResultLike, ChannelTurnDispatcherOptions, ChannelTurnDroppedHistoryOptions, ChannelTurnHistoryFinalizeOptions, ChannelTurnLogEvent, ChannelTurnRecordOptions, ChannelTurnReplyPipelineOptions, ChannelTurnResolved, ChannelTurnResult, ChannelTurnVisibleDeliverySignals, ConversationFacts, DispatchedChannelTurnResult, DurableInboundReplyDeliveryOptions, DurableInboundReplyDeliveryParams, DurableInboundReplyDeliveryResult, EMPTY_CHANNEL_TURN_DISPATCH_COUNTS, InboundMediaFacts, MessageFacts, NormalizedTurnInput, PreflightFacts, PreparedChannelTurn, ReplyPlanFacts, RouteFacts, RunChannelTurnParams, SenderFacts, SupplementalContextFacts, buildChannelInboundEventContext, clearChannelBotPairLoopGuardForTests, createChannelDeliveryResultFromReceipt, createChannelHistoryWindow, createChannelTurnReplyPipeline, createNoopChannelEventDeliveryAdapter, deliverDurableInboundReplyPayload, deliverInboundReplyWithMessageSendContext, dispatchAssembledChannelTurn, dispatchChannelInboundReply, filterChannelInboundSupplementalContext, hasFinalChannelTurnDispatch, hasVisibleChannelTurnDispatch, isDurableInboundReplyDeliveryHandled, listTrackedChannelBotPairsForTests, recordChannelBotPairLoopAndCheckSuppression, recordDroppedChannelInboundHistory, recordDroppedChannelTurnHistory, resolveChannelTurnDispatchCounts, runChannelInboundEvent, runChannelTurn, runPreparedChannelTurn, runPreparedInboundReply, throwIfDurableInboundReplyDeliveryFailed };
}
/**
 * @deprecated Compatibility assembly for legacy buffered reply dispatchers.
 * New channel plugins should expose `defineChannelMessageAdapter(...)` from
 * `openclaw/plugin-sdk/channel-outbound` and route send/receive behavior through
 * the message lifecycle helpers.
 */
declare function createChannelTurnReplyPipeline(params: CreateChannelReplyPipelineParams): ReturnType<typeof createChannelReplyPipeline>;
declare function createNoopChannelEventDeliveryAdapter(): ChannelEventDeliveryAdapter;
declare function recordDroppedChannelTurnHistory(params: {
  input: NormalizedTurnInput;
  preflight: PreflightFacts;
  admission?: ChannelTurnAdmission;
}): Promise<void>;
declare const recordDroppedChannelInboundHistory: typeof recordDroppedChannelTurnHistory;
type AssembledChannelTurnWithBotLoopProtection = AssembledChannelTurn & {
  botLoopProtection: NonNullable<AssembledChannelTurn["botLoopProtection"]>;
};
type AssembledChannelTurnWithoutBotLoopProtection = Omit<AssembledChannelTurn, "botLoopProtection"> & {
  botLoopProtection?: undefined;
};
declare function dispatchAssembledChannelTurn(params: AssembledChannelTurnWithBotLoopProtection): Promise<ChannelTurnResult>;
declare function dispatchAssembledChannelTurn(params: AssembledChannelTurnWithoutBotLoopProtection): Promise<DispatchedChannelTurnResult>;
declare function dispatchAssembledChannelTurn(params: AssembledChannelTurn): Promise<ChannelTurnResult>;
declare const dispatchChannelInboundReply: typeof dispatchAssembledChannelTurn;
type PreparedChannelTurnWithBotLoopProtection<TDispatchResult> = PreparedChannelTurn<TDispatchResult> & {
  botLoopProtection: NonNullable<PreparedChannelTurn<TDispatchResult>["botLoopProtection"]>;
};
type PreparedChannelTurnWithoutBotLoopProtection<TDispatchResult> = Omit<PreparedChannelTurn<TDispatchResult>, "botLoopProtection"> & {
  botLoopProtection?: undefined;
};
declare function runPreparedChannelTurn<TDispatchResult = DispatchedChannelTurnResult["dispatchResult"]>(params: PreparedChannelTurnWithBotLoopProtection<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
declare function runPreparedChannelTurn<TDispatchResult = DispatchedChannelTurnResult["dispatchResult"]>(params: PreparedChannelTurnWithoutBotLoopProtection<TDispatchResult>): Promise<DispatchedChannelTurnResult<TDispatchResult>>;
declare function runPreparedChannelTurn<TDispatchResult = DispatchedChannelTurnResult["dispatchResult"]>(params: PreparedChannelTurn<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
declare const runPreparedInboundReply: typeof runPreparedChannelTurn;
declare function runChannelTurn<TRaw, TDispatchResult = DispatchedChannelTurnResult["dispatchResult"]>(params: RunChannelTurnParams<TRaw, TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
declare const runChannelInboundEvent: typeof runChannelTurn;
//#endregion
export { buildChannelInboundEventContext as _, runPreparedInboundReply as a, finalizeChannelInboundContext as b, DurableInboundReplyDeliveryResult as c, BuildChannelInboundEventContextParams as d, BuiltChannelInboundEventContext as f, FinalizeChannelInboundContextResult as g, FinalizeChannelInboundContextParams as h, runChannelInboundEvent as i, deliverInboundReplyWithMessageSendContext as l, FinalizeChannelInboundContextAsyncParams as m, kernel_d_exports as n, DurableInboundReplyDeliveryOptions as o, ChannelInboundSupplementalResolutionOptions as p, recordDroppedChannelInboundHistory as r, DurableInboundReplyDeliveryParams as s, dispatchChannelInboundReply as t, BuildChannelInboundEventContextAsyncParams as u, filterChannelInboundQuoteContext as v, resolveChannelInboundSupplementalContext as x, filterChannelInboundSupplementalContext as y };