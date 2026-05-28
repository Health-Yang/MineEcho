import { s as normalizeSortedUniqueStringEntries } from "./string-normalization-B8G0vlWE.js";
import { l as resolveCompatibleRuntimePluginRegistry } from "./loader-ChBMT90m.js";
import { a as getActivePluginRegistry, c as getActivePluginRegistryWorkspaceDir, r as getActivePluginHttpRouteRegistry, t as getActivePluginChannelRegistry } from "./runtime-B5Ug58ea.js";
//#region src/plugins/active-runtime-registry.ts
function getActiveRuntimePluginRegistry() {
	return getActivePluginRegistry();
}
function normalizeRequiredPluginIds(ids) {
	if (ids === void 0) return;
	return normalizeSortedUniqueStringEntries(ids);
}
function registryContainsRuntimePluginIds(registry, pluginIds) {
	if (pluginIds === void 0) return true;
	const present = /* @__PURE__ */ new Set();
	const loaded = /* @__PURE__ */ new Set();
	const pluginStatusById = /* @__PURE__ */ new Map();
	for (const plugin of registry.plugins ?? []) {
		present.add(plugin.id);
		pluginStatusById.set(plugin.id, plugin.status);
		if (plugin.status === void 0 || plugin.status === "loaded") loaded.add(plugin.id);
	}
	for (const [key, value] of Object.entries(registry)) {
		if (key === "diagnostics" || key === "channelSetups") continue;
		if (!Array.isArray(value)) continue;
		for (const entry of value) if (entry && typeof entry === "object" && "pluginId" in entry) {
			const pluginId = entry.pluginId;
			if (typeof pluginId === "string" && pluginId.length > 0) {
				present.add(pluginId);
				const status = pluginStatusById.get(pluginId);
				if (status === void 0 || status === "loaded") loaded.add(pluginId);
			}
		}
	}
	if (pluginIds.length === 0) return present.size === 0;
	return pluginIds.every((pluginId) => loaded.has(pluginId));
}
function resolveSurfaceRegistry(surface) {
	switch (surface) {
		case "active": return getActivePluginRegistry();
		case "channel": return getActivePluginChannelRegistry();
		case "http-route": return getActivePluginHttpRouteRegistry();
	}
	return null;
}
function getLoadedRuntimePluginRegistry(params = {}) {
	const surface = params.surface ?? "active";
	const requiredPluginIds = normalizeRequiredPluginIds(params.requiredPluginIds ?? params.loadOptions?.onlyPluginIds);
	if (surface === "active" && params.loadOptions && requiredPluginIds?.length !== 0) {
		const compatible = resolveCompatibleRuntimePluginRegistry(params.loadOptions);
		if (!compatible || !registryContainsRuntimePluginIds(compatible, requiredPluginIds)) return;
		return compatible;
	}
	const activeWorkspaceDir = getActivePluginRegistryWorkspaceDir();
	const requestedWorkspaceDir = params.workspaceDir ?? params.loadOptions?.workspaceDir;
	if (requestedWorkspaceDir !== void 0 && activeWorkspaceDir !== requestedWorkspaceDir) return;
	const registry = resolveSurfaceRegistry(surface);
	if (!registry) return;
	if (!registryContainsRuntimePluginIds(registry, requiredPluginIds)) return;
	return registry;
}
//#endregion
export { getLoadedRuntimePluginRegistry as n, registryContainsRuntimePluginIds as r, getActiveRuntimePluginRegistry as t };
