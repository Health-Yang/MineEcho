import { g as sortUniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { a as resolvePluginMetadataSnapshot } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { c as isInstalledPluginEnabled } from "./installed-plugin-index-store-Db9FQc7C.js";
//#region src/plugins/manifest-contract-eligibility.ts
function isManifestPluginAvailableForControlPlane(params) {
	if (params.plugin.origin === "bundled") return true;
	return isInstalledPluginEnabled(params.snapshot.index, params.plugin.id, params.config);
}
function hasManifestContractValue(params) {
	const values = params.plugin.contracts?.[params.contract] ?? [];
	return values.length > 0 && (!params.value || values.includes(params.value));
}
function listAvailableManifestContractPlugins(params) {
	return params.snapshot.plugins.filter((plugin) => hasManifestContractValue({
		plugin,
		contract: params.contract,
		value: params.value
	}) && isManifestPluginAvailableForControlPlane({
		snapshot: params.snapshot,
		plugin,
		config: params.config
	}));
}
function listAvailableManifestContractValues(params) {
	const values = /* @__PURE__ */ new Set();
	for (const plugin of listAvailableManifestContractPlugins(params)) for (const value of plugin.contracts?.[params.contract] ?? []) values.add(value);
	return sortUniqueStrings(values);
}
function loadManifestContractSnapshot(params) {
	const snapshot = loadManifestMetadataSnapshot(params);
	return {
		index: snapshot.index,
		plugins: snapshot.plugins
	};
}
function loadManifestMetadataRegistry(params) {
	const snapshot = loadManifestMetadataSnapshot(params);
	return {
		index: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	};
}
function loadManifestMetadataSnapshot(params) {
	return resolvePluginMetadataSnapshot({
		config: params.config ?? {},
		env: params.env ?? process.env,
		...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
		allowWorkspaceScopedCurrent: params.workspaceDir === void 0
	});
}
//#endregion
export { loadManifestContractSnapshot as a, listAvailableManifestContractValues as i, isManifestPluginAvailableForControlPlane as n, loadManifestMetadataRegistry as o, listAvailableManifestContractPlugins as r, loadManifestMetadataSnapshot as s, hasManifestContractValue as t };
