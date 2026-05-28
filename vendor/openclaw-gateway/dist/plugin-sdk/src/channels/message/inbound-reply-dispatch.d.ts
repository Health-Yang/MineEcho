/**
 * Shared inbound reply dispatch helpers for channel message adapters and
 * deprecated SDK compatibility facades.
 */
import type { GetReplyOptions } from "../../auto-reply/get-reply-options.types.js";
import { type DispatchFromConfigResult } from "../../auto-reply/reply/dispatch-from-config.js";
import type { DispatchReplyWithBufferedBlockDispatcher } from "../../auto-reply/reply/provider-dispatcher.types.js";
import type { ReplyDispatcher } from "../../auto-reply/reply/reply-dispatcher.types.js";
import type { FinalizedMsgContext } from "../../auto-reply/templating.js";
import type { OpenClawConfig } from "../../config/types.openclaw.js";
import { type OutboundReplyPayload } from "../../infra/outbound/reply-payload-normalize.js";
import { hasFinalChannelTurnDispatch, hasVisibleChannelTurnDispatch, deliverInboundReplyWithMessageSendContext, resolveChannelTurnDispatchCounts, recordDroppedChannelInboundHistory } from "../turn/kernel.js";
import type { ChannelTurnResult, DispatchedChannelTurnResult, DurableInboundReplyDeliveryOptions } from "../turn/kernel.js";
import type { AssembledChannelTurn, PreparedChannelTurn, RunChannelTurnParams } from "../turn/types.js";
export type { ChannelTurnDroppedHistoryOptions, ChannelTurnDroppedHistoryOptions as ChannelInboundDroppedHistoryOptions, ChannelTurnRecordOptions, ChannelTurnRecordOptions as InboundReplyRecordOptions, } from "../turn/types.js";
export type { DurableInboundReplyDeliveryParams } from "../turn/kernel.js";
export type { ChannelBotLoopProtectionFacts } from "../turn/kernel.js";
export { recordChannelBotPairLoopAndCheckSuppression } from "../turn/kernel.js";
type ReplyOptionsWithoutModelSelected = Omit<Omit<GetReplyOptions, "onBlockReply">, "onModelSelected">;
type RecordInboundSessionFn = typeof import("../session.js").recordInboundSession;
type ReplyDispatchFromConfigOptions = Omit<GetReplyOptions, "onBlockReply">;
export type ChannelInboundEventRunnerParams<TRaw, TDispatchResult = DispatchFromConfigResult> = RunChannelTurnParams<TRaw, TDispatchResult>;
export type PreparedInboundReply<TDispatchResult> = PreparedChannelTurn<TDispatchResult>;
export type AssembledInboundReply = AssembledChannelTurn;
export type InboundReplyDispatchResult<TDispatchResult> = ChannelTurnResult<TDispatchResult>;
/** Run an already prepared inbound reply through shared session-record + dispatch ordering. */
type PreparedInboundReplyTurnWithBotLoopProtection<TDispatchResult> = PreparedChannelTurn<TDispatchResult> & {
    botLoopProtection: NonNullable<PreparedChannelTurn<TDispatchResult>["botLoopProtection"]>;
};
type PreparedInboundReplyTurnWithoutBotLoopProtection<TDispatchResult> = Omit<PreparedChannelTurn<TDispatchResult>, "botLoopProtection"> & {
    botLoopProtection?: undefined;
};
export declare function runPreparedInboundReply<TDispatchResult>(params: PreparedInboundReplyTurnWithBotLoopProtection<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
export declare function runPreparedInboundReply<TDispatchResult>(params: PreparedInboundReplyTurnWithoutBotLoopProtection<TDispatchResult>): Promise<DispatchedChannelTurnResult<TDispatchResult>>;
export declare function runPreparedInboundReply<TDispatchResult>(params: PreparedChannelTurn<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
/** @deprecated Use `runPreparedInboundReply`. */
export declare function runPreparedInboundReplyTurn<TDispatchResult>(params: PreparedInboundReplyTurnWithBotLoopProtection<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
export declare function runPreparedInboundReplyTurn<TDispatchResult>(params: PreparedInboundReplyTurnWithoutBotLoopProtection<TDispatchResult>): Promise<DispatchedChannelTurnResult<TDispatchResult>>;
export declare function runPreparedInboundReplyTurn<TDispatchResult>(params: PreparedChannelTurn<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
export declare function runChannelInboundEvent<TRaw, TDispatchResult = DispatchFromConfigResult>(params: ChannelInboundEventRunnerParams<TRaw, TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
/** @deprecated Use `runChannelInboundEvent`. */
export declare function runInboundReplyTurn<TRaw, TDispatchResult = DispatchFromConfigResult>(params: ChannelInboundEventRunnerParams<TRaw, TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
export declare function dispatchChannelInboundReply(params: AssembledInboundReply): Promise<ChannelTurnResult>;
export { hasFinalChannelTurnDispatch as hasFinalInboundReplyDispatch, hasVisibleChannelTurnDispatch as hasVisibleInboundReplyDispatch, deliverInboundReplyWithMessageSendContext as deliverDurableInboundReplyPayload, deliverInboundReplyWithMessageSendContext, recordDroppedChannelInboundHistory as recordDroppedChannelTurnHistory, recordDroppedChannelInboundHistory, resolveChannelTurnDispatchCounts as resolveInboundReplyDispatchCounts, };
/** Run `dispatchReplyFromConfig` with a dispatcher that always gets its settled callback. */
export declare function dispatchReplyFromConfigWithSettledDispatcher(params: {
    cfg: OpenClawConfig;
    ctxPayload: FinalizedMsgContext;
    dispatcher: ReplyDispatcher;
    onSettled: () => void | Promise<void>;
    replyOptions?: ReplyDispatchFromConfigOptions;
    configOverride?: OpenClawConfig;
}): Promise<DispatchFromConfigResult>;
/** Assemble the common inbound reply dispatch dependencies for a resolved route. */
export declare function buildInboundReplyDispatchBase(params: {
    cfg: OpenClawConfig;
    channel: string;
    accountId?: string;
    route: {
        agentId: string;
        sessionKey: string;
    };
    storePath: string;
    ctxPayload: FinalizedMsgContext;
    core: {
        channel: {
            session: {
                recordInboundSession: RecordInboundSessionFn;
            };
            reply: {
                dispatchReplyWithBufferedBlockDispatcher: DispatchReplyWithBufferedBlockDispatcher;
            };
        };
    };
}): {
    cfg: OpenClawConfig;
    channel: string;
    accountId: string | undefined;
    agentId: string;
    routeSessionKey: string;
    storePath: string;
    ctxPayload: FinalizedMsgContext;
    recordInboundSession: typeof import("../session.js").recordInboundSession;
    dispatchReplyWithBufferedBlockDispatcher: DispatchReplyWithBufferedBlockDispatcher;
};
type BuildInboundReplyDispatchBaseParams = Parameters<typeof buildInboundReplyDispatchBase>[0];
type RecordChannelMessageReplyDispatchParams = {
    cfg: OpenClawConfig;
    channel: string;
    accountId?: string;
    agentId: string;
    routeSessionKey: string;
    storePath: string;
    ctxPayload: FinalizedMsgContext;
    recordInboundSession: RecordInboundSessionFn;
    dispatchReplyWithBufferedBlockDispatcher: DispatchReplyWithBufferedBlockDispatcher;
    deliver: (payload: OutboundReplyPayload) => Promise<void>;
    durable?: false | DurableInboundReplyDeliveryOptions;
    onRecordError: (err: unknown) => void;
    onDispatchError: (err: unknown, info: {
        kind: string;
    }) => void;
    replyOptions?: ReplyOptionsWithoutModelSelected;
};
/**
 * Resolve the shared dispatch base and immediately record + dispatch one inbound reply turn.
 *
 * @deprecated Compatibility reply-dispatch bridge. New channel plugins should
 * expose a `message` adapter via `defineChannelMessageAdapter(...)` and route
 * sends through `deliverInboundReplyWithMessageSendContext(...)` or
 * `sendDurableMessageBatch(...)`.
 */
export declare function dispatchChannelMessageReplyWithBase(params: BuildInboundReplyDispatchBaseParams & Pick<RecordChannelMessageReplyDispatchParams, "deliver" | "durable" | "onRecordError" | "onDispatchError" | "replyOptions">): Promise<void>;
/**
 * Resolve the shared dispatch base and immediately record + dispatch one inbound reply turn.
 *
 * @deprecated Legacy inbound reply helper. New channel plugins should expose a
 * `message` adapter via `defineChannelMessageAdapter(...)` and use
 * `dispatchChannelMessageReplyWithBase` only for compatibility dispatchers that
 * have not moved to the message lifecycle yet.
 */
export declare function dispatchInboundReplyWithBase(params: Parameters<typeof dispatchChannelMessageReplyWithBase>[0]): Promise<void>;
/**
 * Record the inbound session first, then dispatch the reply using normalized outbound delivery.
 *
 * @deprecated Compatibility reply-dispatch bridge. New channel plugins should
 * expose a `message` adapter via `defineChannelMessageAdapter(...)` and route
 * sends through `deliverInboundReplyWithMessageSendContext(...)` or
 * `sendDurableMessageBatch(...)`.
 */
export declare function recordChannelMessageReplyDispatch(params: RecordChannelMessageReplyDispatchParams): Promise<void>;
/**
 * Record the inbound session first, then dispatch the reply using normalized outbound delivery.
 *
 * @deprecated Legacy inbound reply helper. New channel plugins should expose a
 * `message` adapter via `defineChannelMessageAdapter(...)` and use
 * `recordChannelMessageReplyDispatch` only for compatibility dispatchers that
 * have not moved to the message lifecycle yet.
 */
export declare function recordInboundSessionAndDispatchReply(params: RecordChannelMessageReplyDispatchParams): Promise<void>;
/** @deprecated Compatibility helper for legacy reply dispatch bridges. */
export declare const buildChannelMessageReplyDispatchBase: typeof buildInboundReplyDispatchBase;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
export declare const hasFinalChannelMessageReplyDispatch: typeof hasFinalChannelTurnDispatch;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
export declare const hasVisibleChannelMessageReplyDispatch: typeof hasVisibleChannelTurnDispatch;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
export declare const resolveChannelMessageReplyDispatchCounts: typeof resolveChannelTurnDispatchCounts;
