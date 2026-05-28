import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString, s as normalizeOptionalLowercaseString, u as normalizeOptionalThreadValue } from "./string-coerce-DKw2K5wM.js";
import { t as getActivePluginChannelRegistryFromState } from "./runtime-channel-state-CQNj7c3E.js";
import { n as normalizeMessageChannel } from "./message-channel-core-NW6lw3Ys.js";
import { a as normalizeChannelId, t as getChannelPlugin } from "./registry-Be8exPcf.js";
import { t as getLoadedChannelPluginForRead } from "./registry-loaded-read-neKhpFRr.js";
import "./plugins-BGmuVWWz.js";
//#region src/infra/outbound/channel-target-prefix.ts
const TARGET_KIND_PREFIXES = new Set([
	"channel",
	"conversation",
	"dm",
	"group",
	"room",
	"thread",
	"user"
]);
function stripTargetProviderPrefix(raw, ...providers) {
	const trimmed = raw.trim();
	const lower = normalizeOptionalLowercaseString(trimmed) ?? "";
	for (const provider of providers) {
		const normalizedProvider = normalizeOptionalLowercaseString(provider);
		if (normalizedProvider && lower.startsWith(`${normalizedProvider}:`)) return trimmed.slice(normalizedProvider.length + 1).trim();
	}
	return trimmed;
}
function stripTargetKindPrefix(raw, kinds = [
	"channel",
	"conversation",
	"dm",
	"group",
	"room",
	"thread",
	"user"
]) {
	const kindPattern = kinds.map((kind) => normalizeOptionalLowercaseString(kind)).filter((kind) => Boolean(kind)).join("|");
	return kindPattern ? raw.replace(new RegExp(`^(${kindPattern}):`, "i"), "").trim() : raw.trim();
}
function stripTargetTopicSuffix(raw, options = {}) {
	const trimmed = raw.trim();
	const numericTopicMatch = options.allowNumericShorthand ? /^(-?\d+):(\d+)$/.exec(trimmed) : null;
	if (numericTopicMatch?.[1]) return numericTopicMatch[1];
	return trimmed.replace(/:topic:.*$/i, "").trim();
}
function resolvePluginTargetPrefix(prefix) {
	const normalizedPrefix = normalizeOptionalLowercaseString(prefix);
	if (!normalizedPrefix) return;
	const registry = getActivePluginChannelRegistryFromState();
	for (const entry of registry?.channels ?? []) {
		const plugin = entry.plugin;
		const channelId = normalizeOptionalLowercaseString(plugin.id);
		const candidates = plugin.messaging?.targetPrefixes ?? [];
		if (channelId && candidates.some((candidate) => normalizeOptionalLowercaseString(candidate) === normalizedPrefix)) return channelId;
	}
}
function resolveChannelTargetProviderPrefix(raw) {
	const prefix = normalizeOptionalLowercaseString(/^\s*([a-z][a-z0-9_-]*):/i.exec(raw ?? "")?.[1]);
	if (!prefix || TARGET_KIND_PREFIXES.has(prefix)) return;
	const channel = resolvePluginTargetPrefix(prefix);
	return channel ? {
		prefix,
		channel
	} : void 0;
}
function resolveTargetPrefixedChannel(raw) {
	return resolveChannelTargetProviderPrefix(raw)?.channel;
}
function validateTargetProviderPrefix(params) {
	const selectedChannel = normalizeMessageChannel(params.channel) ?? normalizeOptionalLowercaseString(params.channel);
	if (!selectedChannel || selectedChannel === "last") return;
	const prefixed = resolveChannelTargetProviderPrefix(params.to);
	if (!prefixed || prefixed.channel === selectedChannel) return;
	return /* @__PURE__ */ new Error(`Target prefix "${prefixed.prefix}:" belongs to ${prefixed.channel}, not ${selectedChannel}.`);
}
//#endregion
//#region src/channels/plugins/target-parsing-loaded.ts
function resolveCompatParsedRouteTarget(params) {
	const channel = normalizeLowercaseStringOrEmpty(params.channel);
	const rawTo = normalizeOptionalString(params.rawTarget);
	if (!channel || !rawTo) return null;
	const parsed = params.parseTarget(channel, rawTo);
	const fallbackThreadId = normalizeOptionalThreadValue(params.fallbackThreadId);
	return {
		channel,
		rawTo,
		to: parsed?.to ?? rawTo,
		threadId: normalizeOptionalThreadValue(parsed?.threadId ?? fallbackThreadId),
		chatType: parsed?.chatType
	};
}
/** @deprecated Use `messaging.targetResolver` and `messaging.resolveOutboundSessionRoute`. */
function parseExplicitTargetForLoadedChannel(channel, rawTarget) {
	const resolvedChannel = normalizeOptionalString(channel);
	if (!resolvedChannel) return null;
	const normalizedChannel = normalizeChannelId(resolvedChannel) ?? resolvedChannel;
	return getLoadedChannelPluginForRead(normalizedChannel)?.messaging?.parseExplicitTarget?.({ raw: rawTarget }) ?? getChannelPlugin(normalizedChannel)?.messaging?.parseExplicitTarget?.({ raw: rawTarget }) ?? null;
}
/** @deprecated Use `messaging.resolveOutboundSessionRoute` for provider-specific target grammar. */
function resolveRouteTargetForLoadedChannel(params) {
	return resolveCompatParsedRouteTarget({
		...params,
		parseTarget: parseExplicitTargetForLoadedChannel
	});
}
function resolveExplicitDeliveryTargetCompat(params) {
	return resolveRouteTargetForLoadedChannel(params);
}
//#endregion
export { stripTargetTopicSuffix as a, stripTargetProviderPrefix as i, resolveTargetPrefixedChannel as n, validateTargetProviderPrefix as o, stripTargetKindPrefix as r, resolveExplicitDeliveryTargetCompat as t };
