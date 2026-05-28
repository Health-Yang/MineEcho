import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import "./agent-scope-CudANNo3.js";
import { r as resolveAgentConfig } from "./agent-scope-config-BfxErZq2.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { a as readSessionUpdatedAt } from "./store-B5j4GKkg.js";
import "./sessions-Ct4mpWsk.js";
import { r as isControlCommandMessage } from "./command-detection-BHZ65i3a.js";
import "./mentions-Dqn1ebZ6.js";
import { a as resolveEnvelopeFormatOptions } from "./envelope-BhctI43w.js";
import { n as resolveInboundDebounceMs, t as createInboundDebouncer } from "./inbound-debounce-DQpLvByk.js";
import { _ as filterChannelInboundSupplementalContext, h as buildChannelInboundEventContext } from "./kernel-Cmg67z5F.js";
import "./inbound-reply-dispatch-Cyw7nhJQ.js";
import "./direct-dm-x23v2Tdk.js";
//#region src/channels/inbound-debounce-policy.ts
function shouldDebounceTextInbound(params) {
	if (params.allowDebounce === false) return false;
	if (params.hasMedia) return false;
	const text = normalizeOptionalString(params.text) ?? "";
	if (!text) return false;
	return !isControlCommandMessage(text, params.cfg, params.commandOptions);
}
function createChannelInboundDebouncer(params) {
	const debounceMs = resolveInboundDebounceMs({
		cfg: params.cfg,
		channel: params.channel,
		overrideMs: params.debounceMsOverride
	});
	const { cfg: _cfg, channel: _channel, debounceMsOverride: _override, ...rest } = params;
	return {
		debounceMs,
		debouncer: createInboundDebouncer({
			debounceMs,
			...rest
		})
	};
}
//#endregion
//#region src/channels/location.ts
function resolveLocation(location) {
	const source = location.source ?? (location.isLive ? "live" : location.name || location.address ? "place" : "pin");
	const isLive = location.isLive ?? source === "live";
	return {
		...location,
		source,
		isLive
	};
}
function formatAccuracy(accuracy) {
	if (!Number.isFinite(accuracy)) return "";
	return ` ±${Math.round(accuracy ?? 0)}m`;
}
function formatCoords(latitude, longitude) {
	return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
function formatLocationText(location) {
	const resolved = resolveLocation(location);
	const coords = formatCoords(resolved.latitude, resolved.longitude);
	const accuracy = formatAccuracy(resolved.accuracy);
	if (resolved.source === "live" || resolved.isLive) return `🛰 Live location: ${coords}${accuracy}`;
	return `📍 ${coords}${accuracy}`;
}
function toLocationContext(location) {
	const resolved = resolveLocation(location);
	return {
		LocationLat: resolved.latitude,
		LocationLon: resolved.longitude,
		LocationAccuracy: resolved.accuracy,
		LocationName: resolved.name,
		LocationAddress: resolved.address,
		LocationSource: resolved.source,
		LocationIsLive: resolved.isLive,
		LocationCaption: resolved.caption
	};
}
//#endregion
//#region src/channels/session-envelope.ts
function resolveInboundSessionEnvelopeContext(params) {
	const storePath = resolveStorePath(params.cfg.session?.store, { agentId: params.agentId });
	return {
		storePath,
		envelopeOptions: resolveEnvelopeFormatOptions(params.cfg),
		previousTimestamp: readSessionUpdatedAt({
			storePath,
			sessionKey: params.sessionKey
		})
	};
}
//#endregion
//#region src/channels/inbound-event/classification.ts
function classifyChannelInboundEvent(params) {
	if (params.unmentionedGroupPolicy !== "room_event") return "user_request";
	if (params.conversation.kind !== "group" && params.conversation.kind !== "channel") return "user_request";
	if (params.wasMentioned === true || params.hasControlCommand === true || params.hasAbortRequest === true || params.commandSource === "native") return "user_request";
	return "room_event";
}
function resolveUnmentionedGroupInboundPolicy(params) {
	const agentGroupChat = params.agentId ? resolveAgentConfig(params.cfg, params.agentId)?.groupChat : void 0;
	if (agentGroupChat && Object.hasOwn(agentGroupChat, "unmentionedInbound")) return agentGroupChat.unmentionedInbound ?? "user_request";
	return params.cfg.messages?.groupChat?.unmentionedInbound ?? "user_request";
}
//#endregion
//#region src/plugin-sdk/channel-inbound.ts
/** @deprecated Use `buildChannelInboundEventContext`. */
function buildChannelTurnContext(params) {
	const inboundEventKind = params.message.inboundEventKind ?? params.message.inboundTurnKind;
	const ctx = buildChannelInboundEventContext({
		...params,
		message: {
			...params.message,
			...inboundEventKind ? { inboundEventKind } : {}
		}
	});
	return {
		...ctx,
		InboundTurnKind: ctx.InboundEventKind
	};
}
/** @deprecated Use `filterChannelInboundSupplementalContext`. */
const filterChannelTurnSupplementalContext = filterChannelInboundSupplementalContext;
//#endregion
export { resolveInboundSessionEnvelopeContext as a, createChannelInboundDebouncer as c, resolveUnmentionedGroupInboundPolicy as i, shouldDebounceTextInbound as l, filterChannelTurnSupplementalContext as n, formatLocationText as o, classifyChannelInboundEvent as r, toLocationContext as s, buildChannelTurnContext as t };
