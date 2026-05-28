import { p as resolveUserPath } from "./utils-B5r0V84N.js";
import "./agent-scope-CudANNo3.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { s as normalizePluginsConfig } from "./config-state-CzzsKZJi.js";
import { o as getMemoryRuntime } from "./memory-state-CEaNZbtE.js";
import { n as getLoadedRuntimePluginRegistry } from "./active-runtime-registry-B4V2YD1G.js";
import { t as ensureStandaloneRuntimePluginRegistryLoaded } from "./standalone-runtime-registry-loader-LxoASgi8.js";
//#region src/plugins/memory-runtime.ts
function resolveMemoryRuntimePluginIds(config) {
	const plugins = normalizePluginsConfig(config.plugins);
	const memorySlot = plugins.slots.memory;
	if (!plugins.enabled || typeof memorySlot !== "string" || memorySlot.trim().length === 0) return [];
	const pluginId = memorySlot.trim();
	if (plugins.deny.includes(pluginId) || plugins.entries[pluginId]?.enabled === false) return [];
	return [pluginId];
}
function resolveMemoryRuntimeWorkspaceDir(cfg) {
	const dir = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
	if (typeof dir !== "string" || !dir.trim()) return;
	return resolveUserPath(dir);
}
function ensureMemoryRuntime(cfg) {
	const current = getMemoryRuntime();
	if (current || !cfg) return current;
	const onlyPluginIds = resolveMemoryRuntimePluginIds(cfg);
	if (onlyPluginIds.length === 0) return getMemoryRuntime();
	getLoadedRuntimePluginRegistry({ requiredPluginIds: onlyPluginIds });
	if (getMemoryRuntime()) return getMemoryRuntime();
	ensureStandaloneRuntimePluginRegistryLoaded({
		requiredPluginIds: onlyPluginIds,
		loadOptions: {
			config: cfg,
			onlyPluginIds,
			workspaceDir: resolveMemoryRuntimeWorkspaceDir(cfg)
		}
	});
	return getMemoryRuntime();
}
async function getActiveMemorySearchManager(params) {
	const runtime = ensureMemoryRuntime(params.cfg);
	if (!runtime) return {
		manager: null,
		error: "memory plugin unavailable"
	};
	return await runtime.getMemorySearchManager(params);
}
function resolveActiveMemoryBackendConfig(params) {
	return ensureMemoryRuntime(params.cfg)?.resolveMemoryBackendConfig(params) ?? null;
}
async function closeActiveMemorySearchManagers(cfg) {
	await getMemoryRuntime()?.closeAllMemorySearchManagers?.();
}
async function closeActiveMemorySearchManager(params) {
	await getMemoryRuntime()?.closeMemorySearchManager?.(params);
}
//#endregion
export { resolveActiveMemoryBackendConfig as i, closeActiveMemorySearchManagers as n, getActiveMemorySearchManager as r, closeActiveMemorySearchManager as t };
