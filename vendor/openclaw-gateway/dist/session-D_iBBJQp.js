import "./agent-scope-CudANNo3.js";
import { d as resolveAgentIdFromSessionKey, l as normalizeAgentId, r as buildAgentMainSessionKey, s as isUnscopedSessionKeySentinel, t as DEFAULT_AGENT_ID, u as normalizeMainKey } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId, n as listAgentIds } from "./agent-scope-config-BfxErZq2.js";
import { g as normalizeVerboseLevel, p as normalizeThinkLevel } from "./thinking-DKulK0JL.js";
import { r as resolveExplicitAgentSessionKey } from "./main-session-896o98eb.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { t as loadSessionStore } from "./store-load-Di_AfnVx.js";
import { c as resolveSessionLifecycleTimestamps } from "./sessions-Ct4mpWsk.js";
import { c as resolveSessionResetPolicy, n as resolveChannelResetConfig, o as evaluateSessionFreshness, r as resolveSessionResetType } from "./reset-g3NFNZsz.js";
import { n as resolveSessionKey } from "./session-key-Da-0RWbO.js";
import { n as clearBootstrapSnapshotOnSessionRollover } from "./bootstrap-cache-CvvVq7hM.js";
import { n as resolveSessionIdMatchSelection } from "./session-id-resolution-o9Vdnlwd.js";
import crypto from "node:crypto";
//#region src/agents/command/session.ts
function buildExplicitSessionIdSessionKey(params) {
	return `agent:${normalizeAgentId(params.agentId)}:explicit:${params.sessionId.trim()}`;
}
function resolveLegacyMainStoreSessionForDefaultAgent(opts) {
	if (opts.defaultAgentId === "main" || !opts.sessionKey) return;
	const defaultMainSessionKey = buildAgentMainSessionKey({
		agentId: opts.defaultAgentId,
		mainKey: opts.mainKey
	});
	if (opts.sessionKey !== defaultMainSessionKey || opts.sessionStore[opts.sessionKey]) return;
	const legacyStorePath = resolveStorePath(opts.cfg.session?.store, { agentId: DEFAULT_AGENT_ID });
	const legacyKeys = [buildAgentMainSessionKey({
		agentId: DEFAULT_AGENT_ID,
		mainKey: opts.mainKey
	}), buildAgentMainSessionKey({
		agentId: DEFAULT_AGENT_ID,
		mainKey: "main"
	})];
	if (legacyStorePath === opts.storePath) {
		for (const legacyKey of legacyKeys) {
			const legacyEntry = opts.sessionStore[legacyKey];
			if (legacyEntry) {
				const sessionStore = opts.cloneOnWrite ? { ...opts.sessionStore } : opts.sessionStore;
				sessionStore[opts.sessionKey] = { ...legacyEntry };
				return {
					sessionKey: opts.sessionKey,
					sessionStore,
					storePath: opts.storePath
				};
			}
		}
		return;
	}
	const legacyStore = loadSessionStore(legacyStorePath, opts.cloneOnWrite ? { clone: false } : void 0);
	for (const legacyKey of legacyKeys) {
		const legacyEntry = legacyStore[legacyKey];
		if (legacyEntry) {
			const sessionStore = opts.cloneOnWrite ? { ...opts.sessionStore } : opts.sessionStore;
			sessionStore[opts.sessionKey] = { ...legacyEntry };
			return {
				sessionKey: opts.sessionKey,
				sessionStore,
				storePath: opts.storePath
			};
		}
	}
}
function collectSessionIdMatchesForRequest(opts) {
	const matches = [];
	const primaryStoreMatches = [];
	const storeByKey = /* @__PURE__ */ new Map();
	const addMatches = (candidateStore, candidateStorePath, options) => {
		for (const [candidateKey, candidateEntry] of Object.entries(candidateStore)) {
			if (candidateEntry?.sessionId !== opts.sessionId) continue;
			matches.push([candidateKey, candidateEntry]);
			if (options?.primary) primaryStoreMatches.push([candidateKey, candidateEntry]);
			storeByKey.set(candidateKey, {
				sessionKey: candidateKey,
				sessionStore: candidateStore,
				storePath: candidateStorePath
			});
		}
	};
	addMatches(opts.sessionStore, opts.storePath, { primary: true });
	if (!opts.searchOtherAgentStores) return {
		matches,
		primaryStoreMatches,
		storeByKey
	};
	for (const agentId of listAgentIds(opts.cfg)) {
		if (agentId === opts.storeAgentId) continue;
		const candidateStorePath = resolveStorePath(opts.cfg.session?.store, { agentId });
		addMatches(loadSessionStore(candidateStorePath, opts.clone === false ? { clone: false } : void 0), candidateStorePath);
	}
	return {
		matches,
		primaryStoreMatches,
		storeByKey
	};
}
/**
* Resolve an existing stored session key for a session id from a specific agent store.
* This scopes the lookup to the target store without implicitly converting `agentId`
* into that agent's main session key.
*/
function resolveStoredSessionKeyForSessionId(opts) {
	const sessionId = opts.sessionId.trim();
	const storeAgentId = opts.agentId?.trim() ? normalizeAgentId(opts.agentId) : void 0;
	const storePath = resolveStorePath(opts.cfg.session?.store, { agentId: storeAgentId });
	const sessionStore = loadSessionStore(storePath);
	if (!sessionId) return {
		sessionKey: void 0,
		sessionStore,
		storePath
	};
	const selection = resolveSessionIdMatchSelection(Object.entries(sessionStore).filter(([, entry]) => entry?.sessionId === sessionId), sessionId);
	return {
		sessionKey: selection.kind === "selected" ? selection.sessionKey : void 0,
		sessionStore,
		storePath
	};
}
function resolveSessionKeyForRequest(opts) {
	const sessionCfg = opts.cfg.session;
	const scope = sessionCfg?.scope ?? "per-sender";
	const mainKey = normalizeMainKey(sessionCfg?.mainKey);
	const defaultAgentId = normalizeAgentId(resolveDefaultAgentId(opts.cfg));
	const requestedAgentId = opts.agentId?.trim() ? normalizeAgentId(opts.agentId) : void 0;
	const requestedSessionId = opts.sessionId?.trim() || void 0;
	const explicitSessionKey = opts.sessionKey?.trim() || (!requestedSessionId ? resolveExplicitAgentSessionKey({
		cfg: opts.cfg,
		agentId: requestedAgentId
	}) : void 0);
	const storeAgentId = explicitSessionKey ? isUnscopedSessionKeySentinel(explicitSessionKey) ? requestedAgentId ?? defaultAgentId : resolveAgentIdFromSessionKey(explicitSessionKey) : requestedAgentId ?? defaultAgentId;
	const storePath = resolveStorePath(sessionCfg?.store, { agentId: storeAgentId });
	const sessionStore = loadSessionStore(storePath, opts.clone === false ? { clone: false } : void 0);
	const ctx = opts.to?.trim() ? { From: opts.to } : void 0;
	let sessionKey = explicitSessionKey ?? (ctx ? resolveSessionKey(scope, ctx, mainKey, storeAgentId) : void 0);
	if (ctx && !requestedAgentId && !requestedSessionId && !explicitSessionKey) {
		const legacyMainSession = resolveLegacyMainStoreSessionForDefaultAgent({
			cfg: opts.cfg,
			defaultAgentId,
			mainKey,
			sessionKey,
			sessionStore,
			storePath,
			cloneOnWrite: opts.clone === false
		});
		if (legacyMainSession) return legacyMainSession;
	}
	if (requestedSessionId && !explicitSessionKey && (!sessionKey || sessionStore[sessionKey]?.sessionId !== requestedSessionId)) {
		const { matches, primaryStoreMatches, storeByKey } = collectSessionIdMatchesForRequest({
			cfg: opts.cfg,
			sessionStore,
			storePath,
			storeAgentId,
			sessionId: requestedSessionId,
			searchOtherAgentStores: requestedAgentId === void 0,
			...opts.clone === false ? { clone: false } : {}
		});
		const preferredSelection = resolveSessionIdMatchSelection(matches, requestedSessionId);
		const currentStoreSelection = preferredSelection.kind === "selected" ? preferredSelection : resolveSessionIdMatchSelection(primaryStoreMatches, requestedSessionId);
		if (currentStoreSelection.kind === "selected") {
			const preferred = storeByKey.get(currentStoreSelection.sessionKey);
			if (preferred) return preferred;
			sessionKey = currentStoreSelection.sessionKey;
		}
	}
	if (requestedSessionId && !sessionKey) sessionKey = buildExplicitSessionIdSessionKey({
		sessionId: requestedSessionId,
		agentId: opts.agentId
	});
	return {
		sessionKey,
		sessionStore,
		storePath
	};
}
function resolveSession(opts) {
	const sessionCfg = opts.cfg.session;
	const { sessionKey, sessionStore, storePath } = resolveSessionKeyForRequest({
		cfg: opts.cfg,
		to: opts.to,
		sessionId: opts.sessionId,
		sessionKey: opts.sessionKey,
		agentId: opts.agentId,
		...opts.clone === false ? { clone: false } : {}
	});
	const now = Date.now();
	const sessionEntry = sessionKey ? sessionStore[sessionKey] : void 0;
	const resetPolicy = resolveSessionResetPolicy({
		sessionCfg,
		resetType: resolveSessionResetType({ sessionKey }),
		resetOverride: resolveChannelResetConfig({
			sessionCfg,
			channel: sessionEntry?.lastChannel ?? sessionEntry?.channel ?? sessionEntry?.origin?.provider
		})
	});
	const fresh = sessionEntry ? evaluateSessionFreshness({
		updatedAt: sessionEntry.updatedAt,
		...resolveSessionLifecycleTimestamps({
			entry: sessionEntry,
			agentId: opts.agentId,
			storePath
		}),
		now,
		policy: resetPolicy
	}).fresh : false;
	const sessionId = opts.sessionId?.trim() || (fresh ? sessionEntry?.sessionId : void 0) || crypto.randomUUID();
	const isNewSession = !fresh && !opts.sessionId;
	clearBootstrapSnapshotOnSessionRollover({
		sessionKey,
		previousSessionId: isNewSession ? sessionEntry?.sessionId : void 0
	});
	return {
		sessionId,
		sessionKey,
		sessionEntry,
		sessionStore,
		storePath,
		isNewSession,
		persistedThinking: fresh && sessionEntry?.thinkingLevel ? normalizeThinkLevel(sessionEntry.thinkingLevel) : void 0,
		persistedVerbose: fresh && sessionEntry?.verboseLevel ? normalizeVerboseLevel(sessionEntry.verboseLevel) : void 0
	};
}
//#endregion
export { resolveStoredSessionKeyForSessionId as i, resolveSession as n, resolveSessionKeyForRequest as r, buildExplicitSessionIdSessionKey as t };
