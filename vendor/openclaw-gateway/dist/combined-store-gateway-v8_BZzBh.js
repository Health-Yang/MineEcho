import "./agent-scope-CudANNo3.js";
import { l as normalizeAgentId } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-BfxErZq2.js";
import { a as resolveStoredSessionKeyForAgentStore, n as canonicalizeSpawnedByForAgent } from "./session-store-key-Bm8fGm9t.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { t as loadSessionStore } from "./store-load-Di_AfnVx.js";
import { a as resolveSessionStoreTargets, i as resolveAllAgentSessionStoreTargetsSync, n as resolveAgentSessionStoreTargetsSync } from "./targets-Drw2Jswe.js";
//#region src/config/sessions/combined-store-gateway.ts
function isStorePathTemplate(store) {
	return typeof store === "string" && store.includes("{agentId}");
}
function mergeSessionEntryIntoCombined(params) {
	const { cfg, combined, entry, agentId, canonicalKey } = params;
	const existing = combined[canonicalKey];
	if (existing && (existing.updatedAt ?? 0) > (entry.updatedAt ?? 0)) {
		const spawnedBy = canonicalizeSpawnedByForAgent(cfg, agentId, existing.spawnedBy ?? entry.spawnedBy);
		combined[canonicalKey] = {
			...entry,
			...existing,
			spawnedBy
		};
		return;
	}
	const spawnedBy = canonicalizeSpawnedByForAgent(cfg, agentId, entry.spawnedBy ?? existing?.spawnedBy);
	if (!existing && entry.spawnedBy === spawnedBy) combined[canonicalKey] = entry;
	else combined[canonicalKey] = {
		...existing,
		...entry,
		spawnedBy
	};
}
function loadCombinedSessionStoreForGateway(cfg, opts = {}) {
	const storeConfig = cfg.session?.store;
	if (storeConfig && !isStorePathTemplate(storeConfig)) {
		const storePath = resolveStorePath(storeConfig);
		const defaultAgentId = normalizeAgentId(resolveDefaultAgentId(cfg));
		const store = loadSessionStore(storePath, { clone: false });
		const combined = {};
		for (const [key, entry] of Object.entries(store)) mergeSessionEntryIntoCombined({
			cfg,
			combined,
			entry,
			agentId: defaultAgentId,
			canonicalKey: resolveStoredSessionKeyForAgentStore({
				cfg,
				agentId: defaultAgentId,
				sessionKey: key
			})
		});
		return {
			storePath,
			store: combined
		};
	}
	const requestedAgentId = typeof opts.agentId === "string" && opts.agentId.trim() ? normalizeAgentId(opts.agentId) : void 0;
	const targets = requestedAgentId ? resolveAgentSessionStoreTargetsSync(cfg, requestedAgentId) : opts.configuredAgentsOnly === true ? resolveSessionStoreTargets(cfg, { allAgents: true }) : resolveAllAgentSessionStoreTargetsSync(cfg);
	const combined = {};
	for (const target of targets) {
		const agentId = target.agentId;
		const storePath = target.storePath;
		const store = loadSessionStore(storePath, { clone: false });
		for (const [key, entry] of Object.entries(store)) mergeSessionEntryIntoCombined({
			cfg,
			combined,
			entry,
			agentId,
			canonicalKey: resolveStoredSessionKeyForAgentStore({
				cfg,
				agentId,
				sessionKey: key
			})
		});
	}
	return {
		storePath: targets.length === 1 ? targets[0].storePath : typeof storeConfig === "string" && storeConfig.trim() ? storeConfig.trim() : "(multiple)",
		store: combined
	};
}
//#endregion
export { loadCombinedSessionStoreForGateway as t };
