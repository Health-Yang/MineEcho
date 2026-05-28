import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { t as discoverOpenClawPlugins } from "./discovery-DHnXdmOi.js";
import { r as loadInstalledPluginIndexInstallRecordsSync } from "./installed-plugin-index-record-reader-CQGWoRBr.js";
//#region src/plugins/channel-catalog-registry.ts
function listChannelCatalogEntries(params = {}) {
	const installRecords = resolveInstallRecords(params);
	return (params.discovery ?? discoverOpenClawPlugins({
		workspaceDir: params.workspaceDir,
		env: params.env,
		...installRecords && Object.keys(installRecords).length > 0 ? { installRecords } : {}
	})).candidates.flatMap((candidate) => {
		if (params.origin && candidate.origin !== params.origin) return [];
		const channel = candidate.packageManifest?.channel;
		if (!channel?.id) return [];
		const pluginId = resolveChannelCatalogPluginId(candidate);
		if (!pluginId) return [];
		return [{
			pluginId,
			origin: candidate.origin,
			packageName: candidate.packageName,
			workspaceDir: candidate.workspaceDir,
			rootDir: candidate.rootDir,
			channel,
			...candidate.packageManifest?.install ? { install: candidate.packageManifest.install } : {}
		}];
	});
}
function resolveChannelCatalogPluginId(candidate) {
	return normalizeOptionalString(candidate.bundledManifest?.id) ?? normalizeOptionalString(candidate.bundledManifestId) ?? normalizeOptionalString(candidate.packageManifest?.plugin?.id) ?? normalizeOptionalString(candidate.idHint);
}
function resolveInstallRecords(params) {
	if (params.installRecords) return params.installRecords;
	if (params.origin === "bundled") return;
	try {
		return loadInstalledPluginIndexInstallRecordsSync(params.env ? { env: params.env } : {});
	} catch {
		return;
	}
}
//#endregion
export { listChannelCatalogEntries as t };
