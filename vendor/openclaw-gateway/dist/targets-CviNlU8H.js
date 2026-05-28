import { n as normalizeAccountId } from "./account-id-B0YIFDpA.js";
import "./message-channel-core-NW6lw3Ys.js";
import { s as isDeliverableMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { i as mergeDeliveryContext, n as deliveryContextFromSession } from "./delivery-context.shared-B9zntlj0.js";
import { t as normalizeChatType } from "./chat-type-DeA3YwAD.js";
import { r as resolveOutboundChannelPlugin, t as normalizeDeliverableOutboundChannel } from "./channel-resolution-DAbY66ca.js";
import { m as mapAllowFromEntries } from "./channel-config-helpers-h3merl20.js";
import { n as resolveOutboundSessionRoute } from "./outbound-session-DPM4FIwc.js";
import { i as resolveChannelTarget } from "./target-resolver-B7hXUFIt.js";
import { n as resolveOutboundTargetWithPlugin, t as resolveSessionDeliveryTarget } from "./targets-session-DV5D5VT7.js";
//#region src/infra/outbound/targets.ts
function resolveOutboundTarget(params) {
	return resolveOutboundTargetWithPlugin({
		plugin: resolveOutboundChannelPlugin({
			channel: params.channel,
			cfg: params.cfg,
			allowBootstrap: params.allowBootstrap
		}),
		target: params,
		onMissingPlugin: () => params.channel === "webchat" ? void 0 : {
			ok: false,
			error: /* @__PURE__ */ new Error(`Unsupported channel: ${params.channel}`)
		}
	}) ?? {
		ok: false,
		error: /* @__PURE__ */ new Error(`Unsupported channel: ${params.channel}`)
	};
}
function resolveHeartbeatDeliveryTarget(params) {
	const { cfg, entry } = params;
	const heartbeat = params.heartbeat ?? cfg.agents?.defaults?.heartbeat;
	const rawTarget = heartbeat?.target;
	let target = "none";
	if (rawTarget === "none" || rawTarget === "last") target = rawTarget;
	else if (typeof rawTarget === "string") {
		const normalized = normalizeDeliverableOutboundChannel(rawTarget);
		if (normalized) target = normalized;
	}
	if (target === "none") {
		const base = resolveSessionDeliveryTarget({ entry });
		return buildNoHeartbeatDeliveryTarget({
			reason: "target-none",
			lastChannel: base.lastChannel,
			lastAccountId: base.lastAccountId
		});
	}
	const resolvedTurnSource = target === "last" ? mergeDeliveryContext(params.turnSource, deliveryContextFromSession(entry)) : void 0;
	const resolvedTarget = resolveSessionDeliveryTarget({
		entry,
		requestedChannel: target === "last" ? "last" : target,
		explicitTo: heartbeat?.to,
		mode: "heartbeat",
		turnSourceChannel: resolvedTurnSource?.channel && isDeliverableMessageChannel(resolvedTurnSource.channel) ? resolvedTurnSource.channel : void 0,
		turnSourceTo: resolvedTurnSource?.to,
		turnSourceAccountId: resolvedTurnSource?.accountId,
		turnSourceThreadId: params.turnSource?.threadId
	});
	const heartbeatAccountId = heartbeat?.accountId?.trim();
	let effectiveAccountId = heartbeatAccountId || resolvedTarget.accountId;
	if (heartbeatAccountId && resolvedTarget.channel) {
		const listAccountIds = resolveOutboundChannelPlugin({
			channel: resolvedTarget.channel,
			cfg
		})?.config.listAccountIds;
		const accountIds = listAccountIds ? listAccountIds(cfg) : [];
		if (accountIds.length > 0) {
			const normalizedAccountId = normalizeAccountId(heartbeatAccountId);
			if (!new Set(accountIds.map((accountId) => normalizeAccountId(accountId))).has(normalizedAccountId)) return buildNoHeartbeatDeliveryTarget({
				reason: "unknown-account",
				accountId: normalizedAccountId,
				lastChannel: resolvedTarget.lastChannel,
				lastAccountId: resolvedTarget.lastAccountId
			});
			effectiveAccountId = normalizedAccountId;
		}
	}
	if (!resolvedTarget.channel || !resolvedTarget.to) return buildNoHeartbeatDeliveryTarget({
		reason: "no-target",
		accountId: effectiveAccountId,
		lastChannel: resolvedTarget.lastChannel,
		lastAccountId: resolvedTarget.lastAccountId
	});
	const resolved = resolveOutboundTarget({
		channel: resolvedTarget.channel,
		to: resolvedTarget.to,
		cfg,
		accountId: effectiveAccountId,
		mode: "heartbeat"
	});
	if (!resolved.ok) return buildNoHeartbeatDeliveryTarget({
		reason: "no-target",
		accountId: effectiveAccountId,
		lastChannel: resolvedTarget.lastChannel,
		lastAccountId: resolvedTarget.lastAccountId
	});
	const sessionChatTypeHint = target === "last" && !heartbeat?.to ? normalizeChatType(entry?.chatType) : void 0;
	const deliveryChatType = resolveHeartbeatDeliveryChatType({
		channel: resolvedTarget.channel,
		to: resolved.to,
		sessionChatType: sessionChatTypeHint
	});
	if (deliveryChatType === "direct" && heartbeat?.directPolicy === "block") return buildNoHeartbeatDeliveryTarget({
		reason: "dm-blocked",
		accountId: effectiveAccountId,
		lastChannel: resolvedTarget.lastChannel,
		lastAccountId: resolvedTarget.lastAccountId
	});
	let reason;
	if (resolveOutboundChannelPlugin({
		channel: resolvedTarget.channel,
		cfg
	})?.config.resolveAllowFrom) {
		const explicit = resolveOutboundTarget({
			channel: resolvedTarget.channel,
			to: resolvedTarget.to,
			cfg,
			accountId: effectiveAccountId,
			mode: "explicit"
		});
		if (explicit.ok && explicit.to !== resolved.to) reason = "allowFrom-fallback";
	}
	const inheritedHeartbeatThreadId = shouldReuseHeartbeatRouteThreadId({
		cfg,
		target,
		heartbeat,
		turnSource: params.turnSource,
		entry,
		resolvedTarget
	}) ? resolvedTarget.lastThreadId : void 0;
	return {
		channel: resolvedTarget.channel,
		to: resolved.to,
		chatType: deliveryChatType,
		reason,
		accountId: effectiveAccountId,
		threadId: resolvedTarget.threadId ?? inheritedHeartbeatThreadId,
		lastChannel: resolvedTarget.lastChannel,
		lastAccountId: resolvedTarget.lastAccountId
	};
}
function buildNoHeartbeatDeliveryTarget(params) {
	return {
		channel: "none",
		reason: params.reason,
		accountId: params.accountId,
		lastChannel: params.lastChannel,
		lastAccountId: params.lastAccountId
	};
}
async function resolveHeartbeatDeliveryTargetWithSessionRoute(params) {
	const delivery = resolveHeartbeatDeliveryTarget(params);
	const heartbeat = params.heartbeat ?? params.cfg.agents?.defaults?.heartbeat;
	if (delivery.channel === "none" || !delivery.to) return delivery;
	const deliveryTo = delivery.to;
	if (!resolveOutboundChannelPlugin({
		channel: delivery.channel,
		cfg: params.cfg
	})?.messaging?.resolveOutboundSessionRoute) return delivery;
	let routeResolvedTarget;
	const targetResolution = await (async () => {
		try {
			return await resolveChannelTarget({
				cfg: params.cfg,
				channel: delivery.channel,
				input: deliveryTo,
				accountId: delivery.accountId,
				unknownTargetMode: "normalized"
			});
		} catch {
			return null;
		}
	})();
	if (targetResolution?.ok) routeResolvedTarget = targetResolution.target;
	const route = await (async () => {
		try {
			return await resolveOutboundSessionRoute({
				cfg: params.cfg,
				channel: delivery.channel,
				agentId: params.agentId,
				accountId: delivery.accountId,
				target: routeResolvedTarget?.to ?? deliveryTo,
				resolvedTarget: routeResolvedTarget,
				currentSessionKey: params.currentSessionKey,
				threadId: delivery.threadId
			});
		} catch {
			return null;
		}
	})();
	if (!route) return delivery;
	if (route.chatType === "direct" && heartbeat?.directPolicy === "block") return buildNoHeartbeatDeliveryTarget({
		reason: "dm-blocked",
		accountId: delivery.accountId,
		lastChannel: delivery.lastChannel,
		lastAccountId: delivery.lastAccountId
	});
	return {
		...delivery,
		to: route.to,
		chatType: route.chatType,
		threadId: route.threadId ?? delivery.threadId
	};
}
function inferChatTypeFromTarget(params) {
	const to = params.to.trim();
	if (!to) return;
	if (/^user:/i.test(to)) return "direct";
	if (/^(channel:|thread:)/i.test(to)) return "channel";
	if (/^group:/i.test(to)) return "group";
	return resolveOutboundChannelPlugin({ channel: params.channel })?.messaging?.inferTargetChatType?.({ to }) ?? void 0;
}
function resolveHeartbeatDeliveryChatType(params) {
	if (params.sessionChatType) return params.sessionChatType;
	return inferChatTypeFromTarget({
		channel: params.channel,
		to: params.to
	});
}
function shouldReuseHeartbeatRouteThreadId(params) {
	const channel = params.resolvedTarget.channel;
	return (channel && resolveOutboundChannelPlugin({
		channel,
		cfg: params.cfg
	})?.messaging)?.preserveHeartbeatThreadIdForGroupRoute === true && params.resolvedTarget.threadId == null && params.target === "last" && !params.heartbeat?.to && params.turnSource?.threadId == null && params.resolvedTarget.channel === params.resolvedTarget.lastChannel && Boolean(params.resolvedTarget.to) && Boolean(params.resolvedTarget.lastTo) && params.resolvedTarget.to === params.resolvedTarget.lastTo && normalizeChatType(params.entry?.chatType) === "group";
}
function resolveHeartbeatSenderId(params) {
	const { allowFrom, deliveryTo, lastTo, provider } = params;
	const candidates = [
		deliveryTo?.trim(),
		provider && deliveryTo ? `${provider}:${deliveryTo}` : void 0,
		lastTo?.trim(),
		provider && lastTo ? `${provider}:${lastTo}` : void 0
	].filter((val) => Boolean(val?.trim()));
	const allowList = mapAllowFromEntries(allowFrom).filter((entry) => entry && entry !== "*");
	if (allowFrom.includes("*")) return candidates[0] ?? "heartbeat";
	if (candidates.length > 0 && allowList.length > 0) {
		const matched = candidates.find((candidate) => allowList.includes(candidate));
		if (matched) return matched;
	}
	if (candidates.length > 0 && allowList.length === 0) return candidates[0];
	if (allowList.length > 0) return allowList[0];
	return candidates[0] ?? "heartbeat";
}
function resolveHeartbeatSenderContext(params) {
	const provider = params.delivery.channel !== "none" ? params.delivery.channel : params.delivery.lastChannel;
	const accountId = params.delivery.accountId ?? (provider === params.delivery.lastChannel ? params.delivery.lastAccountId : void 0);
	const allowFrom = mapAllowFromEntries(provider ? resolveOutboundChannelPlugin({
		channel: provider,
		cfg: params.cfg
	})?.config.resolveAllowFrom?.({
		cfg: params.cfg,
		accountId
	}) ?? [] : []);
	return {
		sender: resolveHeartbeatSenderId({
			allowFrom,
			deliveryTo: params.delivery.to,
			lastTo: params.entry?.lastTo,
			provider
		}),
		provider,
		allowFrom
	};
}
//#endregion
export { resolveOutboundTarget as i, resolveHeartbeatDeliveryTargetWithSessionRoute as n, resolveHeartbeatSenderContext as r, resolveHeartbeatDeliveryTarget as t };
