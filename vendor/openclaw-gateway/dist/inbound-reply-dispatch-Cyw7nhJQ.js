import { T as normalizeOutboundReplyPayload } from "./reply-payload-swpu2tGD.js";
import { i as dispatchReplyFromConfig, o as withReplyDispatcher } from "./dispatch-BGwFKOyt.js";
import { d as isDurableInboundReplyDeliveryHandled, f as throwIfDurableInboundReplyDeliveryFailed, l as runPreparedInboundReply$1, o as runChannelInboundEvent$1, r as dispatchChannelInboundReply$1, u as deliverInboundReplyWithMessageSendContext } from "./kernel-Cmg67z5F.js";
import { i as resolveChannelTurnDispatchCounts, n as hasFinalChannelTurnDispatch, r as hasVisibleChannelTurnDispatch } from "./dispatch-result-BM3RYtx4.js";
//#region src/channels/message/inbound-reply-dispatch.ts
/**
* Shared inbound reply dispatch helpers for channel message adapters and
* deprecated SDK compatibility facades.
*/
async function runPreparedInboundReply(params) {
	return await runPreparedInboundReply$1(params);
}
async function runPreparedInboundReplyTurn(params) {
	return await runPreparedInboundReply(params);
}
async function runChannelInboundEvent(params) {
	return await runChannelInboundEvent$1(params);
}
/** @deprecated Use `runChannelInboundEvent`. */
async function runInboundReplyTurn(params) {
	return await runChannelInboundEvent(params);
}
async function dispatchChannelInboundReply(params) {
	return await dispatchChannelInboundReply$1(params);
}
/** Run `dispatchReplyFromConfig` with a dispatcher that always gets its settled callback. */
async function dispatchReplyFromConfigWithSettledDispatcher(params) {
	return await withReplyDispatcher({
		dispatcher: params.dispatcher,
		onSettled: params.onSettled,
		run: () => dispatchReplyFromConfig({
			ctx: params.ctxPayload,
			cfg: params.cfg,
			dispatcher: params.dispatcher,
			replyOptions: params.replyOptions,
			configOverride: params.configOverride
		})
	});
}
/** Assemble the common inbound reply dispatch dependencies for a resolved route. */
function buildInboundReplyDispatchBase(params) {
	return {
		cfg: params.cfg,
		channel: params.channel,
		accountId: params.accountId,
		agentId: params.route.agentId,
		routeSessionKey: params.route.sessionKey,
		storePath: params.storePath,
		ctxPayload: params.ctxPayload,
		recordInboundSession: params.core.channel.session.recordInboundSession,
		dispatchReplyWithBufferedBlockDispatcher: params.core.channel.reply.dispatchReplyWithBufferedBlockDispatcher
	};
}
/**
* Resolve the shared dispatch base and immediately record + dispatch one inbound reply turn.
*
* @deprecated Compatibility reply-dispatch bridge. New channel plugins should
* expose a `message` adapter via `defineChannelMessageAdapter(...)` and route
* sends through `deliverInboundReplyWithMessageSendContext(...)` or
* `sendDurableMessageBatch(...)`.
*/
async function dispatchChannelMessageReplyWithBase(params) {
	await recordChannelMessageReplyDispatch({
		...buildInboundReplyDispatchBase(params),
		deliver: params.deliver,
		durable: params.durable,
		onRecordError: params.onRecordError,
		onDispatchError: params.onDispatchError,
		replyOptions: params.replyOptions
	});
}
/**
* Resolve the shared dispatch base and immediately record + dispatch one inbound reply turn.
*
* @deprecated Legacy inbound reply helper. New channel plugins should expose a
* `message` adapter via `defineChannelMessageAdapter(...)` and use
* `dispatchChannelMessageReplyWithBase` only for compatibility dispatchers that
* have not moved to the message lifecycle yet.
*/
async function dispatchInboundReplyWithBase(params) {
	await dispatchChannelMessageReplyWithBase(params);
}
/**
* Record the inbound session first, then dispatch the reply using normalized outbound delivery.
*
* @deprecated Compatibility reply-dispatch bridge. New channel plugins should
* expose a `message` adapter via `defineChannelMessageAdapter(...)` and route
* sends through `deliverInboundReplyWithMessageSendContext(...)` or
* `sendDurableMessageBatch(...)`.
*/
async function recordChannelMessageReplyDispatch(params) {
	await dispatchChannelInboundReply$1({
		cfg: params.cfg,
		channel: params.channel,
		accountId: params.accountId,
		agentId: params.agentId,
		routeSessionKey: params.routeSessionKey,
		storePath: params.storePath,
		ctxPayload: params.ctxPayload,
		recordInboundSession: params.recordInboundSession,
		dispatchReplyWithBufferedBlockDispatcher: params.dispatchReplyWithBufferedBlockDispatcher,
		delivery: {
			preparePayload: (payload) => payload && typeof payload === "object" ? normalizeOutboundReplyPayload(payload) : {},
			deliver: async (payload, info) => {
				if (params.durable) {
					const durable = await deliverInboundReplyWithMessageSendContext({
						cfg: params.cfg,
						channel: params.channel,
						accountId: params.accountId,
						agentId: params.agentId,
						ctxPayload: params.ctxPayload,
						payload,
						info,
						...params.durable
					});
					throwIfDurableInboundReplyDeliveryFailed(durable);
					if (isDurableInboundReplyDeliveryHandled(durable)) return durable.delivery;
				}
				return await params.deliver(payload);
			},
			onError: params.onDispatchError
		},
		replyPipeline: {},
		replyOptions: params.replyOptions,
		record: { onRecordError: params.onRecordError }
	});
}
/**
* Record the inbound session first, then dispatch the reply using normalized outbound delivery.
*
* @deprecated Legacy inbound reply helper. New channel plugins should expose a
* `message` adapter via `defineChannelMessageAdapter(...)` and use
* `recordChannelMessageReplyDispatch` only for compatibility dispatchers that
* have not moved to the message lifecycle yet.
*/
async function recordInboundSessionAndDispatchReply(params) {
	await recordChannelMessageReplyDispatch(params);
}
/** @deprecated Compatibility helper for legacy reply dispatch bridges. */
const buildChannelMessageReplyDispatchBase = buildInboundReplyDispatchBase;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
const hasFinalChannelMessageReplyDispatch = hasFinalChannelTurnDispatch;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
const hasVisibleChannelMessageReplyDispatch = hasVisibleChannelTurnDispatch;
/** @deprecated Compatibility helper for legacy reply dispatch results. */
const resolveChannelMessageReplyDispatchCounts = resolveChannelTurnDispatchCounts;
//#endregion
export { dispatchInboundReplyWithBase as a, hasVisibleChannelMessageReplyDispatch as c, resolveChannelMessageReplyDispatchCounts as d, runChannelInboundEvent as f, runPreparedInboundReplyTurn as h, dispatchChannelMessageReplyWithBase as i, recordChannelMessageReplyDispatch as l, runPreparedInboundReply as m, buildInboundReplyDispatchBase as n, dispatchReplyFromConfigWithSettledDispatcher as o, runInboundReplyTurn as p, dispatchChannelInboundReply as r, hasFinalChannelMessageReplyDispatch as s, buildChannelMessageReplyDispatchBase as t, recordInboundSessionAndDispatchReply as u };
