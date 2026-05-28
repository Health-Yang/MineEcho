import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { d as resolveAgentIdFromSessionKey } from "./session-key-yaI3D3Bl.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { t as getChannelPlugin } from "./registry-Be8exPcf.js";
import { o as recordSessionMetaFromInbound } from "./store-B5j4GKkg.js";
import "./plugins-BGmuVWWz.js";
import "./inbound.runtime-Bbu-gTxV.js";
import { t as buildOutboundBaseSessionKey } from "./base-session-key-DR3_ol9s.js";
//#region src/infra/outbound/outbound-session.ts
function resolveOutboundChannelPlugin(channel) {
	return getChannelPlugin(channel);
}
function stripProviderPrefix(raw, channel) {
	const trimmed = raw.trim();
	const lower = normalizeLowercaseStringOrEmpty(trimmed);
	const prefix = `${normalizeLowercaseStringOrEmpty(channel)}:`;
	if (lower.startsWith(prefix)) return trimmed.slice(prefix.length).trim();
	return trimmed;
}
function stripKindPrefix(raw) {
	return raw.replace(/^(user|channel|group|conversation|room|dm|thread):/i, "").trim();
}
const FALLBACK_TARGET_KIND_PREFIXES = [
	{
		kind: "direct",
		pattern: /^(user:|dm:)/i
	},
	{
		kind: "channel",
		pattern: /^(channel:|conversation:|thread:)/i
	},
	{
		kind: "group",
		pattern: /^(group:|room:)/i
	}
];
function normalizeInferredPeerKind(value) {
	return value === "direct" || value === "group" || value === "channel" ? value : void 0;
}
function inferPeerKindFromPlugin(params) {
	for (const target of params.targets) {
		const inferred = normalizeInferredPeerKind(params.plugin?.messaging?.inferTargetChatType?.({ to: target }));
		if (inferred) return inferred;
	}
}
function inferPeerKindFromLegacyParser(params) {
	for (const target of params.targets) {
		const parsed = params.plugin?.messaging?.parseExplicitTarget?.({ raw: target });
		const inferred = normalizeInferredPeerKind(parsed?.chatType);
		if (inferred) return inferred;
	}
}
function inferPeerKindFromFallbackPrefixes(targets) {
	for (const target of targets) for (const fallback of FALLBACK_TARGET_KIND_PREFIXES) if (fallback.pattern.test(target)) return fallback.kind;
}
function inferPeerKind(params) {
	const resolvedKind = params.resolvedTarget?.kind;
	if (resolvedKind === "user") return "direct";
	if (resolvedKind === "channel") return "channel";
	if (resolvedKind === "group") {
		const chatTypes = resolveOutboundChannelPlugin(params.channel)?.capabilities?.chatTypes ?? [];
		const supportsChannel = chatTypes.includes("channel");
		const supportsGroup = chatTypes.includes("group");
		if (supportsChannel && !supportsGroup) return "channel";
		return "group";
	}
	const plugin = resolveOutboundChannelPlugin(params.channel);
	const strippedTarget = stripProviderPrefix(params.target, params.channel).trim();
	const targets = uniqueStrings([params.target, strippedTarget].filter(Boolean));
	return inferPeerKindFromPlugin({
		plugin,
		targets
	}) ?? inferPeerKindFromLegacyParser({
		plugin,
		targets
	}) ?? inferPeerKindFromFallbackPrefixes(targets) ?? "direct";
}
function resolveFallbackSession(params) {
	const trimmed = stripProviderPrefix(params.target, params.channel).trim();
	if (!trimmed) return null;
	const peerKind = inferPeerKind({
		channel: params.channel,
		target: params.target,
		resolvedTarget: params.resolvedTarget
	});
	const peerId = stripKindPrefix(trimmed);
	if (!peerId) return null;
	const peer = {
		kind: peerKind,
		id: peerId
	};
	const baseSessionKey = buildOutboundBaseSessionKey({
		cfg: params.cfg,
		agentId: params.agentId,
		channel: params.channel,
		accountId: params.accountId,
		peer
	});
	return {
		sessionKey: baseSessionKey,
		baseSessionKey,
		peer,
		chatType: peerKind === "direct" ? "direct" : peerKind === "channel" ? "channel" : "group",
		from: peerKind === "direct" ? `${params.channel}:${peerId}` : `${params.channel}:${peerKind}:${peerId}`,
		to: `${peerKind === "direct" ? "user" : "channel"}:${peerId}`
	};
}
async function resolveOutboundSessionRoute(params) {
	const target = params.target.trim();
	if (!target) return null;
	const nextParams = {
		...params,
		target
	};
	const resolver = resolveOutboundChannelPlugin(params.channel)?.messaging?.resolveOutboundSessionRoute;
	if (resolver) return await resolver(nextParams);
	return resolveFallbackSession(nextParams);
}
async function ensureOutboundSessionEntry(params) {
	const storePath = resolveStorePath(params.cfg.session?.store, { agentId: resolveAgentIdFromSessionKey(params.route.sessionKey) });
	const ctx = {
		From: params.route.from,
		To: params.route.to,
		SessionKey: params.route.sessionKey,
		AccountId: params.accountId ?? void 0,
		ChatType: params.route.chatType,
		Provider: params.channel,
		Surface: params.channel,
		MessageThreadId: params.route.threadId,
		OriginatingChannel: params.channel,
		OriginatingTo: params.route.to
	};
	try {
		await recordSessionMetaFromInbound({
			storePath,
			sessionKey: params.route.sessionKey,
			ctx
		});
	} catch {}
}
//#endregion
export { resolveOutboundSessionRoute as n, ensureOutboundSessionEntry as t };
