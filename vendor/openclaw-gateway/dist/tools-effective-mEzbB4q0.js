import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { _ as resolveSessionAgentId } from "./agent-scope-CudANNo3.js";
import { n as listAgentIds } from "./agent-scope-config-BfxErZq2.js";
import { a as logWarn, t as logDebug } from "./logger-Bcz1IQSW.js";
import { g as resolveRuntimeConfigCacheKey } from "./runtime-snapshot-D93_HOsR.js";
import "./config-BtNBbhZb.js";
import { Ii as ErrorCodes, Li as errorShape, Vn as validateToolsEffectiveParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { n as getActivePluginChannelRegistryVersion, s as getActivePluginRegistryVersion } from "./runtime-B5Ug58ea.js";
import { h as stringifyRouteThreadId } from "./channel-route-Dvehdg4D.js";
import { n as deliveryContextFromSession } from "./delivery-context.shared-B9zntlj0.js";
import { c as loadSessionEntry, v as resolveSessionModelRef } from "./session-utils-CmwnszsS.js";
import { i as resolveReplyToMode } from "./reply-threading-DPCtWyLO.js";
import { t as resolveEffectiveToolInventory } from "./tools-effective-inventory-DmHbo4Jt.js";
//#region src/gateway/server-methods/tools-effective.ts
const TOOLS_EFFECTIVE_FRESH_TTL_MS = 1e4;
const TOOLS_EFFECTIVE_STALE_TTL_MS = 12e4;
const TOOLS_EFFECTIVE_SLOW_LOG_MS = 250;
const TOOLS_EFFECTIVE_CACHE_LIMIT = 128;
let nowForToolsEffectiveCache = () => Date.now();
const toolsEffectiveCache = /* @__PURE__ */ new Map();
const toolsEffectiveInflight = /* @__PURE__ */ new Map();
function resolveRequestedAgentIdOrRespondError(params) {
	const knownAgents = listAgentIds(params.cfg);
	const requestedAgentId = normalizeOptionalString(params.rawAgentId) ?? "";
	if (!requestedAgentId) return;
	if (!knownAgents.includes(requestedAgentId)) {
		params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unknown agent id "${requestedAgentId}"`));
		return null;
	}
	return requestedAgentId;
}
function optionalCacheString(value) {
	return value?.trim() ?? "";
}
function buildToolsEffectiveCacheKey(params) {
	const context = params.context;
	return JSON.stringify({
		v: 1,
		config: resolveRuntimeConfigCacheKey(context.cfg),
		pluginRegistry: getActivePluginRegistryVersion(),
		channelRegistry: getActivePluginChannelRegistryVersion(),
		sessionKey: params.sessionKey,
		agentId: context.agentId,
		modelProvider: optionalCacheString(context.modelProvider),
		modelId: optionalCacheString(context.modelId),
		messageProvider: optionalCacheString(context.messageProvider),
		accountId: optionalCacheString(context.accountId),
		currentChannelId: optionalCacheString(context.currentChannelId),
		currentThreadTs: optionalCacheString(context.currentThreadTs),
		groupId: optionalCacheString(context.groupId),
		groupChannel: optionalCacheString(context.groupChannel),
		groupSpace: optionalCacheString(context.groupSpace),
		replyToMode: optionalCacheString(context.replyToMode)
	});
}
function trimToolsEffectiveCache() {
	while (toolsEffectiveCache.size > TOOLS_EFFECTIVE_CACHE_LIMIT) {
		const oldest = toolsEffectiveCache.keys().next().value;
		if (typeof oldest !== "string") return;
		toolsEffectiveCache.delete(oldest);
	}
}
function cacheToolsEffectiveResult(key, value) {
	toolsEffectiveCache.delete(key);
	toolsEffectiveCache.set(key, {
		value,
		createdAtMs: nowForToolsEffectiveCache()
	});
	trimToolsEffectiveCache();
}
function scheduleToolsEffectiveRefresh(key, context) {
	const existing = toolsEffectiveInflight.get(key);
	if (existing) return existing;
	const startedAt = nowForToolsEffectiveCache();
	const task = new Promise((resolve, reject) => {
		setImmediate(() => {
			try {
				const value = resolveEffectiveToolInventory({
					cfg: context.cfg,
					agentId: context.agentId,
					sessionKey: context.sessionKey,
					messageProvider: context.messageProvider,
					modelProvider: context.modelProvider,
					modelId: context.modelId,
					currentChannelId: context.currentChannelId,
					currentThreadTs: context.currentThreadTs,
					accountId: context.accountId,
					groupId: context.groupId,
					groupChannel: context.groupChannel,
					groupSpace: context.groupSpace,
					replyToMode: context.replyToMode
				});
				cacheToolsEffectiveResult(key, value);
				const durationMs = nowForToolsEffectiveCache() - startedAt;
				if (durationMs >= TOOLS_EFFECTIVE_SLOW_LOG_MS) logDebug(`tools-effective: refresh durationMs=${durationMs} agent=${context.agentId} session=${context.sessionKey} tools=${value.groups.reduce((sum, group) => sum + group.tools.length, 0)}`);
				resolve(value);
			} catch (err) {
				reject(err);
			} finally {
				toolsEffectiveInflight.delete(key);
			}
		});
	});
	toolsEffectiveInflight.set(key, task);
	return task;
}
function refreshToolsEffectiveInBackground(key, context) {
	scheduleToolsEffectiveRefresh(key, context).catch((err) => {
		logWarn(`tools-effective: background refresh failed: ${String(err)}`);
	});
}
async function resolveCachedToolsEffective(params) {
	const key = buildToolsEffectiveCacheKey(params);
	const now = nowForToolsEffectiveCache();
	const cached = toolsEffectiveCache.get(key);
	if (cached) {
		const ageMs = now - cached.createdAtMs;
		if (ageMs < TOOLS_EFFECTIVE_FRESH_TTL_MS) return cached.value;
		if (ageMs < TOOLS_EFFECTIVE_STALE_TTL_MS) {
			refreshToolsEffectiveInBackground(key, params.context);
			return cached.value;
		}
	}
	return scheduleToolsEffectiveRefresh(key, params.context);
}
function resolveTrustedToolsEffectiveContext(params) {
	const loaded = loadSessionEntry(params.sessionKey);
	if (!loaded.entry) {
		params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unknown session key "${params.sessionKey}"`));
		return null;
	}
	const sessionAgentId = resolveSessionAgentId({
		sessionKey: loaded.canonicalKey ?? params.sessionKey,
		config: loaded.cfg
	});
	if (params.requestedAgentId && params.requestedAgentId !== sessionAgentId) {
		params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `agent id "${params.requestedAgentId}" does not match session agent "${sessionAgentId}"`));
		return null;
	}
	const delivery = deliveryContextFromSession(loaded.entry);
	const resolvedModel = resolveSessionModelRef(loaded.cfg, loaded.entry, sessionAgentId);
	return {
		cfg: loaded.cfg,
		agentId: sessionAgentId,
		sessionKey: params.sessionKey,
		modelProvider: resolvedModel.provider,
		modelId: resolvedModel.model,
		messageProvider: delivery?.channel ?? loaded.entry.lastChannel ?? loaded.entry.channel ?? loaded.entry.origin?.provider,
		accountId: delivery?.accountId ?? loaded.entry.lastAccountId ?? loaded.entry.origin?.accountId,
		currentChannelId: delivery?.to,
		currentThreadTs: delivery?.threadId != null ? stringifyRouteThreadId(delivery.threadId) : loaded.entry.lastThreadId != null ? stringifyRouteThreadId(loaded.entry.lastThreadId) : loaded.entry.origin?.threadId != null ? stringifyRouteThreadId(loaded.entry.origin.threadId) : void 0,
		groupId: loaded.entry.groupId,
		groupChannel: loaded.entry.groupChannel,
		groupSpace: loaded.entry.space,
		replyToMode: resolveReplyToMode(loaded.cfg, delivery?.channel ?? loaded.entry.lastChannel ?? loaded.entry.channel ?? loaded.entry.origin?.provider, delivery?.accountId ?? loaded.entry.lastAccountId ?? loaded.entry.origin?.accountId, loaded.entry.chatType ?? loaded.entry.origin?.chatType)
	};
}
const toolsEffectiveHandlers = { "tools.effective": async ({ params, respond, context }) => {
	if (!validateToolsEffectiveParams(params)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid tools.effective params: ${formatValidationErrors(validateToolsEffectiveParams.errors)}`));
		return;
	}
	const cfg = context.getRuntimeConfig();
	const requestedAgentId = resolveRequestedAgentIdOrRespondError({
		rawAgentId: params.agentId,
		cfg,
		respond
	});
	if (requestedAgentId === null) return;
	const trustedContext = resolveTrustedToolsEffectiveContext({
		sessionKey: params.sessionKey,
		requestedAgentId,
		respond
	});
	if (!trustedContext) return;
	try {
		respond(true, await resolveCachedToolsEffective({
			sessionKey: params.sessionKey,
			context: trustedContext
		}), void 0);
	} catch (err) {
		respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, `tools.effective failed: ${String(err)}`));
	}
} };
const testing = {
	resetToolsEffectiveCacheForTest() {
		toolsEffectiveCache.clear();
		toolsEffectiveInflight.clear();
	},
	setToolsEffectiveNowForTest(now) {
		nowForToolsEffectiveCache = now;
	},
	resetToolsEffectiveNowForTest() {
		nowForToolsEffectiveCache = () => Date.now();
	}
};
//#endregion
export { testing as __testing, testing, toolsEffectiveHandlers };
