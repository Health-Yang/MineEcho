import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { a as normalizeAnyChannelId } from "./registry-49GbU2k5.js";
import { t as getActivePluginChannelRegistry } from "./runtime-B5Ug58ea.js";
import { h as stringifyRouteThreadId } from "./channel-route-Dvehdg4D.js";
import { a as normalizeChannelId, n as getLoadedChannelPlugin } from "./registry-Be8exPcf.js";
import "./plugins-BGmuVWWz.js";
import { r as normalizeConversationTargetRef } from "./session-binding-normalization-CP9fBmeY.js";
import { a as stripTargetTopicSuffix, i as stripTargetProviderPrefix, n as resolveTargetPrefixedChannel, r as stripTargetKindPrefix, t as resolveExplicitDeliveryTargetCompat } from "./target-parsing-loaded-BPWzTLZz.js";
import { t as resolveConversationIdFromTargets } from "./conversation-id-CzrxbaE6.js";
import { n as resolveBundledChannelThreadBindingInboundConversation, t as resolveBundledChannelThreadBindingDefaultPlacement } from "./thread-binding-api-gC6HHF2O.js";
//#region src/channels/conversation-resolution.ts
const CANONICAL_TARGET_PREFIXES = ["user:", "spaces/"];
function resolveChannelId(raw) {
	const normalizedRaw = normalizeOptionalString(raw);
	if (!normalizedRaw) return null;
	return normalizeAnyChannelId(normalizedRaw) ?? normalizeChannelId(normalizedRaw) ?? normalizeOptionalLowercaseString(normalizedRaw) ?? null;
}
function getActiveRegistryChannelPlugin(rawChannel) {
	const normalized = normalizeAnyChannelId(rawChannel) ?? normalizeOptionalString(rawChannel);
	if (!normalized) return;
	return getActivePluginChannelRegistry()?.channels.find((entry) => entry.plugin.id === normalized)?.plugin;
}
function getRuntimeChannelPluginCandidates(channel) {
	const candidates = [getActiveRegistryChannelPlugin(channel), getLoadedChannelPlugin(channel)].filter((plugin) => Boolean(plugin));
	return [...new Map(candidates.map((plugin) => [plugin.id, plugin])).values()];
}
function resolveRuntimeChannelPlugin(channel) {
	return getRuntimeChannelPluginCandidates(channel)[0];
}
function shouldDefaultParentConversationToSelf(plugin) {
	return plugin?.bindings?.selfParentConversationByDefault === true;
}
function normalizeResolutionTarget(params) {
	const conversationId = normalizeOptionalString(params.conversation?.conversationId);
	if (!conversationId) return null;
	const parentConversationId = normalizeOptionalString(params.conversation?.parentConversationId);
	const defaultParentToSelf = shouldDefaultParentConversationToSelf(params.plugin) && !params.threadId && !parentConversationId;
	const normalized = normalizeConversationTargetRef({
		conversationId,
		parentConversationId: defaultParentToSelf ? conversationId : parentConversationId
	});
	const normalizedParentConversationId = defaultParentToSelf ? normalized.conversationId : normalized.parentConversationId;
	const placementHint = params.includePlacementHint === false ? void 0 : resolveChannelDefaultBindingPlacement(params.channel);
	return {
		canonical: {
			channel: params.channel,
			accountId: params.accountId,
			conversationId: normalized.conversationId,
			...normalizedParentConversationId ? { parentConversationId: normalizedParentConversationId } : {}
		},
		...params.threadId ? { threadId: params.threadId } : {},
		...placementHint ? { placementHint } : {},
		source: params.source
	};
}
function resolveBindingAccountId(params) {
	return normalizeOptionalString(params.rawAccountId) || normalizeOptionalString(params.plugin?.config.defaultAccountId?.(params.cfg)) || "default";
}
function resolveFallbackConversationTargetId(params) {
	const { allowNumericTopicShorthand = false } = params;
	const target = normalizeOptionalString(params.rawTarget);
	if (!target) return;
	const withoutKind = stripTargetKindPrefix(target);
	const withoutTopic = params.preserveExplicitTopicSuffix && /:topic:/iu.test(withoutKind) ? withoutKind : stripTargetTopicSuffix(withoutKind, { allowNumericShorthand: allowNumericTopicShorthand });
	return resolveConversationIdFromTargets({ targets: [withoutTopic] }) ?? (withoutTopic !== target ? withoutTopic : void 0) ?? resolveConversationIdFromTargets({ targets: [target] });
}
function resolveChannelTargetId(params) {
	const target = normalizeOptionalString(params.target);
	if (!target) return;
	const lower = normalizeLowercaseStringOrEmpty(target);
	const channelPrefix = `${params.channel}:`;
	if (lower.startsWith(channelPrefix)) return resolveChannelTargetId({
		channel: params.channel,
		target: target.slice(channelPrefix.length),
		preserveExplicitTopicSuffix: params.preserveExplicitTopicSuffix
	});
	if (CANONICAL_TARGET_PREFIXES.some((prefix) => lower.startsWith(prefix))) return target;
	const prefixedChannel = resolveTargetPrefixedChannel(target);
	if (!prefixedChannel || prefixedChannel !== params.channel) {
		const explicitConversationId = resolveFallbackConversationTargetId({
			rawTarget: target,
			allowNumericTopicShorthand: params.channel === "telegram",
			preserveExplicitTopicSuffix: params.preserveExplicitTopicSuffix
		});
		if (explicitConversationId) return explicitConversationId;
	}
	const normalizedTarget = normalizeOptionalString(resolveRuntimeChannelPlugin(params.channel)?.messaging?.normalizeTarget?.(target));
	if (normalizedTarget) {
		const withoutProvider = stripTargetProviderPrefix(normalizedTarget, params.channel);
		return resolveFallbackConversationTargetId({
			rawTarget: withoutProvider,
			allowNumericTopicShorthand: params.channel === "telegram",
			preserveExplicitTopicSuffix: params.preserveExplicitTopicSuffix
		}) || withoutProvider || normalizedTarget;
	}
	const parsedTarget = resolveExplicitDeliveryTargetCompat({
		channel: params.channel,
		rawTarget: target
	});
	if (parsedTarget?.to) return resolveConversationIdFromTargets({ targets: [parsedTarget.to] }) ?? parsedTarget.to;
	return target;
}
function buildThreadingContext(params) {
	const to = normalizeOptionalString(params.originatingTo) ?? normalizeOptionalString(params.fallbackTo);
	return {
		...to ? { To: to } : {},
		...params.from ? { From: params.from } : {},
		...params.chatType ? { ChatType: params.chatType } : {},
		...params.threadId ? { MessageThreadId: params.threadId } : {},
		...params.nativeChannelId ? { NativeChannelId: params.nativeChannelId } : {}
	};
}
function resolveChannelDefaultBindingPlacement(rawChannel) {
	const channel = resolveChannelId(rawChannel);
	if (!channel) return;
	return resolveRuntimeChannelPlugin(channel)?.conversationBindings?.defaultTopLevelPlacement ?? resolveBundledChannelThreadBindingDefaultPlacement(channel);
}
function resolveCommandConversationResolution(params) {
	const channel = resolveChannelId(params.channel);
	if (!channel) return null;
	const plugin = resolveRuntimeChannelPlugin(channel);
	const accountId = resolveBindingAccountId({
		rawAccountId: params.accountId,
		plugin,
		cfg: params.cfg
	});
	const threadId = stringifyRouteThreadId(params.threadId);
	const commandParams = {
		accountId,
		threadId,
		threadParentId: normalizeOptionalString(params.threadParentId),
		senderId: normalizeOptionalString(params.senderId),
		sessionKey: normalizeOptionalString(params.sessionKey),
		parentSessionKey: normalizeOptionalString(params.parentSessionKey),
		from: normalizeOptionalString(params.from),
		chatType: normalizeOptionalString(params.chatType),
		originatingTo: params.originatingTo ?? void 0,
		commandTo: params.commandTo ?? void 0,
		fallbackTo: params.fallbackTo ?? void 0
	};
	const resolvedByProvider = plugin?.bindings?.resolveCommandConversation?.(commandParams);
	const providerResolution = normalizeResolutionTarget({
		channel,
		accountId,
		conversation: resolvedByProvider,
		source: "command-provider",
		threadId,
		plugin,
		includePlacementHint: params.includePlacementHint
	});
	if (providerResolution) return providerResolution;
	const focusedBinding = plugin?.threading?.resolveFocusedBinding?.({
		cfg: params.cfg,
		accountId,
		context: buildThreadingContext({
			fallbackTo: params.fallbackTo ?? void 0,
			originatingTo: params.originatingTo ?? void 0,
			threadId,
			from: normalizeOptionalString(params.from),
			chatType: normalizeOptionalString(params.chatType),
			nativeChannelId: normalizeOptionalString(params.nativeChannelId)
		})
	});
	const focusedResolution = normalizeResolutionTarget({
		channel,
		accountId,
		conversation: focusedBinding,
		source: "focused-binding",
		threadId,
		plugin,
		includePlacementHint: params.includePlacementHint
	});
	if (focusedResolution) return focusedResolution;
	const baseConversationId = resolveChannelTargetId({
		channel,
		target: params.originatingTo
	}) ?? resolveChannelTargetId({
		channel,
		target: params.commandTo
	}) ?? resolveChannelTargetId({
		channel,
		target: params.fallbackTo
	});
	const parentConversationId = resolveChannelTargetId({
		channel,
		target: params.threadParentId
	}) ?? (threadId && baseConversationId && baseConversationId !== threadId ? baseConversationId : void 0);
	const conversationId = threadId || baseConversationId;
	if (!conversationId) return null;
	return normalizeResolutionTarget({
		channel,
		accountId,
		conversation: {
			conversationId,
			parentConversationId
		},
		source: "command-fallback",
		threadId,
		plugin,
		includePlacementHint: params.includePlacementHint
	});
}
function resolveInboundConversationResolution(params) {
	const channel = resolveChannelId(params.channel);
	if (!channel) return null;
	const plugin = resolveRuntimeChannelPlugin(channel);
	const accountId = resolveBindingAccountId({
		rawAccountId: params.accountId,
		plugin,
		cfg: params.cfg
	});
	const threadId = stringifyRouteThreadId(params.threadId);
	const resolverParams = {
		from: normalizeOptionalString(params.from),
		to: normalizeOptionalString(params.to),
		conversationId: normalizeOptionalString(params.conversationId) ?? normalizeOptionalString(params.groupId) ?? normalizeOptionalString(params.to),
		threadId,
		isGroup: params.isGroup ?? true
	};
	const providerConversation = plugin?.messaging?.resolveInboundConversation?.(resolverParams);
	const providerResolution = normalizeResolutionTarget({
		channel,
		accountId,
		conversation: providerConversation,
		source: "inbound-provider",
		threadId,
		plugin
	});
	if (providerResolution || providerConversation === null) return providerResolution;
	const artifactConversation = resolveBundledChannelThreadBindingInboundConversation({
		channelId: channel,
		...resolverParams
	});
	const artifactResolution = normalizeResolutionTarget({
		channel,
		accountId,
		conversation: artifactConversation,
		source: "inbound-bundled-artifact",
		threadId,
		plugin
	});
	if (artifactResolution || artifactConversation === null) return artifactResolution;
	const parentConversationId = resolveChannelTargetId({
		channel,
		target: params.to,
		preserveExplicitTopicSuffix: threadId == null
	}) ?? resolveChannelTargetId({
		channel,
		target: params.conversationId,
		preserveExplicitTopicSuffix: threadId == null
	}) ?? resolveChannelTargetId({
		channel,
		target: params.groupId,
		preserveExplicitTopicSuffix: threadId == null
	});
	const genericConversationId = threadId ?? resolveChannelTargetId({
		channel,
		target: params.conversationId,
		preserveExplicitTopicSuffix: threadId == null
	}) ?? resolveChannelTargetId({
		channel,
		target: params.groupId,
		preserveExplicitTopicSuffix: threadId == null
	}) ?? parentConversationId;
	if (!genericConversationId) return null;
	return normalizeResolutionTarget({
		channel,
		accountId,
		conversation: {
			conversationId: genericConversationId,
			parentConversationId: threadId != null ? parentConversationId : void 0
		},
		source: "inbound-fallback",
		threadId,
		plugin
	});
}
//#endregion
export { resolveCommandConversationResolution as n, resolveInboundConversationResolution as r, resolveChannelDefaultBindingPlacement as t };
