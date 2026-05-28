import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString, u as normalizeOptionalThreadValue } from "./string-coerce-DKw2K5wM.js";
import { t as formatCliCommand } from "./command-format-CItqrBX6.js";
import { n as normalizeMessageChannel, t as isDeliverableMessageChannel } from "./message-channel-core-NW6lw3Ys.js";
import { s as channelRouteTargetsShareConversation } from "./channel-route-Dvehdg4D.js";
import { n as deliveryContextFromSession } from "./delivery-context.shared-B9zntlj0.js";
import { m as mapAllowFromEntries } from "./channel-config-helpers-h3merl20.js";
import { n as missingTargetError } from "./target-errors-Cjh6i-kG.js";
import { n as resolveTargetPrefixedChannel, o as validateTargetProviderPrefix, t as resolveExplicitDeliveryTargetCompat } from "./target-parsing-loaded-BPWzTLZz.js";
//#region src/infra/outbound/targets-resolve-shared.ts
function buildWebChatDeliveryError() {
	return /* @__PURE__ */ new Error(`Delivering to WebChat is not supported via \`${formatCliCommand("openclaw agent")}\`; use WhatsApp/Telegram or run with --deliver=false.`);
}
function resolveOutboundTargetWithPlugin(params) {
	if (params.target.channel === "webchat") return {
		ok: false,
		error: buildWebChatDeliveryError()
	};
	const plugin = params.plugin;
	if (!plugin) return params.onMissingPlugin?.();
	const allowFromRaw = params.target.allowFrom ?? (params.target.cfg && plugin.config.resolveAllowFrom ? plugin.config.resolveAllowFrom({
		cfg: params.target.cfg,
		accountId: params.target.accountId ?? void 0
	}) : void 0);
	const allowFrom = allowFromRaw ? mapAllowFromEntries(allowFromRaw) : void 0;
	const effectiveTo = params.target.to?.trim() || (params.target.cfg && plugin.config.resolveDefaultTo ? plugin.config.resolveDefaultTo({
		cfg: params.target.cfg,
		accountId: params.target.accountId ?? void 0
	}) : void 0);
	const targetPrefixError = validateTargetProviderPrefix({
		channel: params.target.channel,
		to: effectiveTo
	});
	if (targetPrefixError) return {
		ok: false,
		error: targetPrefixError
	};
	const resolveTarget = plugin.outbound?.resolveTarget;
	if (resolveTarget) return resolveTarget({
		cfg: params.target.cfg,
		to: effectiveTo,
		allowFrom,
		accountId: params.target.accountId ?? void 0,
		mode: params.target.mode ?? "explicit"
	});
	if (effectiveTo) return {
		ok: true,
		to: effectiveTo
	};
	const hint = plugin.messaging?.targetResolver?.hint;
	return {
		ok: false,
		error: missingTargetError(plugin.meta.label ?? params.target.channel, hint)
	};
}
//#endregion
//#region src/infra/outbound/targets-session.ts
function resolveParsedRouteTarget(params) {
	const channel = normalizeLowercaseStringOrEmpty(params.channel);
	const rawTo = normalizeOptionalString(params.rawTarget);
	if (!channel || !rawTo) return null;
	const parsed = resolveExplicitDeliveryTargetCompat({
		channel,
		rawTarget: rawTo,
		fallbackThreadId: params.fallbackThreadId
	});
	const threadId = normalizeOptionalThreadValue(parsed?.threadId ?? params.fallbackThreadId);
	return {
		channel,
		rawTo,
		to: parsed?.to ?? rawTo,
		...threadId != null ? { threadId } : {},
		chatType: parsed?.chatType
	};
}
function resolveSessionDeliveryTarget(params) {
	const context = deliveryContextFromSession(params.entry);
	const sessionLastChannel = context?.channel && isDeliverableMessageChannel(context.channel) ? context.channel : void 0;
	const parsedSessionTarget = sessionLastChannel ? resolveParsedRouteTarget({
		channel: sessionLastChannel,
		rawTarget: context?.to,
		fallbackThreadId: context?.threadId
	}) : null;
	const hasTurnSourceChannel = params.turnSourceChannel != null;
	const parsedTurnSourceTarget = hasTurnSourceChannel && params.turnSourceChannel ? resolveParsedRouteTarget({
		channel: params.turnSourceChannel,
		rawTarget: params.turnSourceTo,
		fallbackThreadId: params.turnSourceThreadId
	}) : null;
	const hasTurnSourceThreadId = parsedTurnSourceTarget?.threadId != null;
	const lastChannel = hasTurnSourceChannel ? params.turnSourceChannel : sessionLastChannel;
	const lastTo = hasTurnSourceChannel ? parsedTurnSourceTarget?.to ?? params.turnSourceTo : parsedSessionTarget?.to ?? context?.to;
	const lastAccountId = hasTurnSourceChannel ? params.turnSourceAccountId : context?.accountId;
	const turnToMatchesSession = !params.turnSourceTo || !context?.to || params.turnSourceChannel === sessionLastChannel && channelRouteTargetsShareConversation({
		left: parsedTurnSourceTarget,
		right: parsedSessionTarget
	});
	const lastThreadId = hasTurnSourceThreadId ? parsedTurnSourceTarget?.threadId : hasTurnSourceChannel && (params.turnSourceChannel !== sessionLastChannel || !turnToMatchesSession) ? void 0 : parsedSessionTarget?.threadId;
	const rawRequested = params.requestedChannel ?? "last";
	const requested = rawRequested === "last" ? "last" : normalizeMessageChannel(rawRequested);
	const requestedChannel = requested === "last" ? "last" : requested && isDeliverableMessageChannel(requested) ? requested : void 0;
	const rawExplicitTo = typeof params.explicitTo === "string" && params.explicitTo.trim() ? params.explicitTo.trim() : void 0;
	const explicitPrefixedChannel = requestedChannel === "last" ? resolveTargetPrefixedChannel(rawExplicitTo) : void 0;
	let channel = explicitPrefixedChannel && isDeliverableMessageChannel(explicitPrefixedChannel) ? explicitPrefixedChannel : requestedChannel === "last" ? lastChannel : requestedChannel;
	if (!channel && params.fallbackChannel && isDeliverableMessageChannel(params.fallbackChannel)) channel = params.fallbackChannel;
	const parsedExplicitTarget = channel && rawExplicitTo ? resolveExplicitDeliveryTargetCompat({
		channel,
		rawTarget: rawExplicitTo,
		fallbackThreadId: params.explicitThreadId
	}) : null;
	const explicitTo = parsedExplicitTarget?.to ?? rawExplicitTo;
	const explicitThreadId = normalizeOptionalThreadValue(parsedExplicitTarget?.threadId ?? params.explicitThreadId);
	let to = explicitTo;
	if (!to && lastTo) {
		if (channel && channel === lastChannel) to = lastTo;
		else if (params.allowMismatchedLastTo) to = lastTo;
	}
	const mode = params.mode ?? (explicitTo ? "explicit" : "implicit");
	const accountId = channel && channel === lastChannel ? lastAccountId : void 0;
	const threadId = channel && channel === lastChannel ? mode === "heartbeat" ? hasTurnSourceThreadId ? params.turnSourceThreadId : void 0 : lastThreadId : void 0;
	return {
		channel,
		to,
		accountId,
		threadId: explicitThreadId ?? threadId,
		mode,
		lastChannel,
		lastTo,
		lastAccountId,
		lastThreadId
	};
}
//#endregion
export { resolveOutboundTargetWithPlugin as n, resolveSessionDeliveryTarget as t };
