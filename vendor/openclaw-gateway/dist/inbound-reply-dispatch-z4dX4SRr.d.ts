import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { n as GetReplyOptions } from "./get-reply-options.types-tz7CitlR.js";
import { t as ReplyPayload } from "./reply-payload-DVcklM6x.js";
import { t as FinalizedMsgContext } from "./templating-5iVgSDdS.js";
import { n as ReplyDispatcher } from "./reply-dispatcher.types-B-zV5y6R.js";
import { t as DispatchFromConfigResult } from "./dispatch-from-config.types-uvbRieso.js";
import { t as DispatchReplyWithBufferedBlockDispatcher } from "./provider-dispatcher.types-CEHhVTOh.js";
import { O as RunChannelTurnParams, T as PreparedChannelTurn, _ as ChannelTurnResult, b as DispatchedChannelTurnResult, n as AssembledChannelTurn } from "./types-a_7hWZPH.js";
import { o as DurableInboundReplyDeliveryOptions } from "./kernel-Cr2adFnD.js";
import { a as hasVisibleChannelTurnDispatch, i as hasFinalChannelTurnDispatch, o as resolveChannelTurnDispatchCounts } from "./dispatch-result-DLXmUyf_.js";
import { t as recordInboundSession } from "./session-CJGy4K7z.js";

//#region src/infra/outbound/reply-payload-normalize.d.ts
type OutboundReplyPayload = {
  text?: string;
  mediaUrls?: string[];
  mediaUrl?: string;
  presentation?: ReplyPayload["presentation"];
  /**
   * @deprecated Use presentation. Runtime support remains for legacy producers.
   */
  interactive?: ReplyPayload["interactive"];
  channelData?: ReplyPayload["channelData"];
  sensitiveMedia?: boolean;
  replyToId?: string;
};
//#endregion
//#region src/channels/message/inbound-reply-dispatch.d.ts
type ReplyOptionsWithoutModelSelected = Omit<Omit<GetReplyOptions, "onBlockReply">, "onModelSelected">;
type RecordInboundSessionFn = typeof recordInboundSession;
type ReplyDispatchFromConfigOptions = Omit<GetReplyOptions, "onBlockReply">;
type ChannelInboundEventRunnerParams<TRaw, TDispatchResult = DispatchFromConfigResult> = RunChannelTurnParams<TRaw, TDispatchResult>;
type PreparedInboundReply<TDispatchResult> = PreparedChannelTurn<TDispatchResult>;
type AssembledInboundReply = AssembledChannelTurn;
type InboundReplyDispatchResult<TDispatchResult> = ChannelTurnResult<TDispatchResult>;
/** Run an already prepared inbound reply through shared session-record + dispatch ordering. */
type PreparedInboundReplyTurnWithBotLoopProtection<TDispatchResult> = PreparedChannelTurn<TDispatchResult> & {
  botLoopProtection: NonNullable<PreparedChannelTurn<TDispatchResult>["botLoopProtection"]>;
};
type PreparedInboundReplyTurnWithoutBotLoopProtection<TDispatchResult> = Omit<PreparedChannelTurn<TDispatchResult>, "botLoopProtection"> & {
  botLoopProtection?: undefined;
};
declare function runPreparedInboundReply<TDispatchResult>(params: PreparedInboundReplyTurnWithBotLoopProtection<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
declare function runPreparedInboundReply<TDispatchResult>(params: PreparedInboundReplyTurnWithoutBotLoopProtection<TDispatchResult>): Promise<DispatchedChannelTurnResult<TDispatchResult>>;
declare function runPreparedInboundReply<TDispatchResult>(params: PreparedChannelTurn<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
/** @deprecated Use `runPreparedInboundReply`. */
declare function runPreparedInboundReplyTurn<TDispatchResult>(params: PreparedInboundReplyTurnWithBotLoopProtection<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
declare function runPreparedInboundReplyTurn<TDispatchResult>(params: PreparedInboundReplyTurnWithoutBotLoopProtection<TDispatchResult>): Promise<DispatchedChannelTurnResult<TDispatchResult>>;
declare function runPreparedInboundReplyTurn<TDispatchResult>(params: PreparedChannelTurn<TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
declare function runChannelInboundEvent<TRaw, TDispatchResult = DispatchFromConfigResult>(params: ChannelInboundEventRunnerParams<TRaw, TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
/** @deprecated Use `runChannelInboundEvent`. */
declare function runInboundReplyTurn<TRaw, TDispatchResult = DispatchFromConfigResult>(params: ChannelInboundEventRunnerParams<TRaw, TDispatchResult>): Promise<ChannelTurnResult<TDispatchResult>>;
declare function dispatchChannelInboundReply(params: AssembledInboundReply): Promise<ChannelTurnResult>;
/** Run `dispatchReplyFromConfig` with a dispatcher that always gets its settled callback. */
declare function dispatchReplyFromConfigWithSettledDispatcher(params: {
  cfg: OpenClawConfig;
  ctxPayload: FinalizedMsgContext;
  dispatcher: ReplyDispatcher;
  onSettled: () => void | Promise<void>;
  replyOptions?: ReplyDispatchFromConfigOptions;
  configOverride?: OpenClawConfig;
}): Promise<DispatchFromConfigResult>;
/** Assemble the common inbound reply dispatch dependencies for a resolved route. */
declare function buildInboundReplyDispatchBase(params: {
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
  recordInboundSession: typeof recordInboundSession;
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
declare function dispatchChannelMessageReplyWithBase(params: BuildInboundReplyDispatchBaseParams & Pick<RecordChannelMessageReplyDispatchParams, "deliver" | "durable" | "onRecordError" | "onDispatchError" | "replyOptions">): Promise<void>;
/**
 * Resolve the shared dispatch base and immediately record + dispatch one inbound reply turn.
 *
 * @deprecated Legacy inbound reply helper. New channel plugins should expose a
 * `message` adapter via `defineChannelMessageAdapter(...)` and use
 * `dispatchChannelMessageReplyWithBase` only for compatibility dispatchers that
 * have not moved to the message lifecycle yet.
 */
declare function dispatchInboundReplyWithBase(params: Parameters<typeof dispatchChannelMessageReplyWithBase>[0]): Promise<void>;
/**
 * Record the inbound session first, then dispatch the reply using normalized outbound delivery.
 *
 * @deprecated Compatibility reply-dispatch bridge. New channel plugins should
 * expose a `message` adapter via `defineChannelMessageAdapter(...)` and route
 * sends through `deliverInboundReplyWithMessageSendContext(...)` or
 * `sendDurableMessageBatch(...)`.
 */
declare function recordChannelMessageReplyDispatch(params: RecordChannelMessageReplyDispatchParams): Promise<void>;
/**
 * Record the inbound session first, then dispatch the reply using normalized outbound delivery.
 *
 * @deprecated Legacy inbound reply helper. New channel plugins should expose a
 * `message` adapter via `defineChannelMessageAdapter(...)` and use
 * `recordChannelMessageReplyDispatch` only for compatibility dispatchers that
 * have not moved to the message lifecycle yet.
 */
declare function recordInboundSessionAndDispatchReply(params: RecordChannelMessageReplyDispatchParams): Promise<void>;
/** @deprecated Compatibility helper for legacy reply dispatch bridges. */
declare const buildChannelMessageReplyDispatchBase: typeof buildInboundReplyDispatchBase;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
declare const hasFinalChannelMessageReplyDispatch: typeof hasFinalChannelTurnDispatch;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
declare const hasVisibleChannelMessageReplyDispatch: typeof hasVisibleChannelTurnDispatch;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
declare const resolveChannelMessageReplyDispatchCounts: typeof resolveChannelTurnDispatchCounts;
//#endregion
export { runInboundReplyTurn as _, buildChannelMessageReplyDispatchBase as a, dispatchChannelMessageReplyWithBase as c, hasFinalChannelMessageReplyDispatch as d, hasVisibleChannelMessageReplyDispatch as f, runChannelInboundEvent as g, resolveChannelMessageReplyDispatchCounts as h, PreparedInboundReply as i, dispatchInboundReplyWithBase as l, recordInboundSessionAndDispatchReply as m, ChannelInboundEventRunnerParams as n, buildInboundReplyDispatchBase as o, recordChannelMessageReplyDispatch as p, InboundReplyDispatchResult as r, dispatchChannelInboundReply as s, AssembledInboundReply as t, dispatchReplyFromConfigWithSettledDispatcher as u, runPreparedInboundReply as v, runPreparedInboundReplyTurn as y };