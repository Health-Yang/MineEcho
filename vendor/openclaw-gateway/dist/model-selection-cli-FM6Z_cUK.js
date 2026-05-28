import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { a as resolvePluginMetadataSnapshot } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { c as isInstalledPluginEnabled } from "./installed-plugin-index-store-Db9FQc7C.js";
import { n as getActivePluginRegistryWorkspaceDirFromState } from "./runtime-state-DRIYGASz.js";
import { t as getActiveRuntimePluginRegistry } from "./active-runtime-registry-B4V2YD1G.js";
import "./model-selection-normalize-l_jinpMc.js";
import { createRequire } from "node:module";
//#region src/plugins/cli-backends.runtime.ts
function resolveRuntimeCliBackends() {
	return (getActiveRuntimePluginRegistry()?.cliBackends ?? []).map((entry) => Object.assign({}, entry.backend, { pluginId: entry.pluginId }));
}
createRequire(import.meta.url);
let cachedSetupCliBackendDescriptors;
function resolveMetadataSnapshotForSetupCliBackends(params = {}) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? getActivePluginRegistryWorkspaceDirFromState();
	return {
		snapshot: resolvePluginMetadataSnapshot({
			config: params.config ?? {},
			env,
			...workspaceDir !== void 0 ? {
				workspaceDir,
				allowWorkspaceScopedCurrent: true
			} : {}
		}),
		cacheable: true
	};
}
function resolveSetupCliBackendDescriptors(params = {}) {
	const { snapshot, cacheable } = resolveMetadataSnapshotForSetupCliBackends(params);
	const configFingerprint = snapshot.configFingerprint;
	if (cacheable && configFingerprint && cachedSetupCliBackendDescriptors?.configFingerprint === configFingerprint) return cachedSetupCliBackendDescriptors.entries;
	const entries = snapshot.plugins.flatMap((plugin) => {
		if (!isInstalledPluginEnabled(snapshot.index, plugin.id)) return [];
		return [...plugin.cliBackends, ...plugin.setup?.cliBackends ?? []].map((backendId) => ({
			pluginId: plugin.id,
			backend: { id: backendId }
		}));
	});
	if (cacheable && configFingerprint) cachedSetupCliBackendDescriptors = {
		configFingerprint,
		entries
	};
	return entries;
}
function resolvePluginSetupCliBackendDescriptor(params) {
	const normalized = normalizeProviderId(params.backend);
	return resolveSetupCliBackendDescriptors(params).find((entry) => normalizeProviderId(entry.backend.id) === normalized);
}
//#endregion
//#region src/agents/model-selection-cli.ts
function isCliProvider(provider, cfg) {
	const normalized = normalizeProviderId(provider);
	const backends = cfg?.agents?.defaults?.cliBackends ?? {};
	if (Object.keys(backends).some((key) => normalizeProviderId(key) === normalized)) return true;
	if (resolveRuntimeCliBackends().some((backend) => normalizeProviderId(backend.id) === normalized)) return true;
	if (resolvePluginSetupCliBackendDescriptor({
		backend: normalized,
		config: cfg
	})) return true;
	return false;
}
//#endregion
export { resolveRuntimeCliBackends as n, isCliProvider as t };
