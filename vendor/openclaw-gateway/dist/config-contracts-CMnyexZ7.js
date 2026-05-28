import { s as normalizeSortedUniqueStringEntries } from "./string-normalization-B8G0vlWE.js";
import { t as discoverOpenClawPlugins } from "./discovery-DHnXdmOi.js";
import { t as loadPluginManifestRegistry } from "./manifest-registry-DYz4Sf21.js";
import { n as loadPluginManifestRegistryForPluginRegistry } from "./plugin-registry-BALJ9TgI.js";
import "./config-contract-matches-iiEX69xg.js";
//#region src/plugins/config-contracts.ts
function resolvePluginConfigContractsById(params) {
	const matches = /* @__PURE__ */ new Map();
	const pluginIds = normalizeSortedUniqueStringEntries(params.pluginIds);
	if (pluginIds.length === 0) return matches;
	const fallbackBundledPluginIds = new Set(normalizeSortedUniqueStringEntries(params.fallbackBundledPluginIds));
	const bundledContractFallbacks = /* @__PURE__ */ new Map();
	const findBundledConfigContracts = (pluginId) => {
		if (bundledContractFallbacks.has(pluginId)) return bundledContractFallbacks.get(pluginId);
		const discovery = params.discovery ?? discoverOpenClawPlugins({
			workspaceDir: params.workspaceDir,
			env: params.env
		});
		const registry = loadPluginManifestRegistry({
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			candidates: discovery.candidates.filter((candidate) => candidate.origin === "bundled"),
			diagnostics: discovery.diagnostics
		});
		for (const plugin of registry.plugins) bundledContractFallbacks.set(plugin.id, plugin.configContracts);
		if (!bundledContractFallbacks.has(pluginId)) bundledContractFallbacks.set(pluginId, void 0);
		return bundledContractFallbacks.get(pluginId);
	};
	const resolvedPluginOrigins = /* @__PURE__ */ new Map();
	const registry = loadPluginManifestRegistryForPluginRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeDisabled: true
	});
	for (const plugin of registry.plugins) {
		if (!pluginIds.includes(plugin.id)) continue;
		resolvedPluginOrigins.set(plugin.id, plugin.origin);
		if (!plugin.configContracts) continue;
		matches.set(plugin.id, {
			origin: plugin.origin,
			configContracts: plugin.configContracts
		});
	}
	if (params.fallbackToBundledMetadata ?? true) for (const pluginId of pluginIds) {
		const existing = matches.get(pluginId);
		if (existing && (params.fallbackToBundledMetadataForResolvedBundled && existing.origin === "bundled" || fallbackBundledPluginIds.has(pluginId))) {
			const bundledConfigContracts = findBundledConfigContracts(pluginId);
			if (bundledConfigContracts) matches.set(pluginId, {
				origin: fallbackBundledPluginIds.has(pluginId) ? "bundled" : existing.origin,
				configContracts: {
					...bundledConfigContracts,
					...existing.configContracts,
					...bundledConfigContracts.secretInputs ? { secretInputs: bundledConfigContracts.secretInputs } : {}
				}
			});
			continue;
		}
		if (matches.has(pluginId)) continue;
		const resolvedOrigin = resolvedPluginOrigins.get(pluginId);
		if (resolvedOrigin && !(params.fallbackToBundledMetadataForResolvedBundled && resolvedOrigin === "bundled") && !fallbackBundledPluginIds.has(pluginId)) continue;
		const bundledConfigContracts = findBundledConfigContracts(pluginId);
		if (!bundledConfigContracts) continue;
		matches.set(pluginId, {
			origin: "bundled",
			configContracts: bundledConfigContracts
		});
	}
	return matches;
}
//#endregion
export { resolvePluginConfigContractsById as t };
