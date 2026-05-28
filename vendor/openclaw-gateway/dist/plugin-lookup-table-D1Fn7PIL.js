import { a as resolvePluginMetadataSnapshot, n as isPluginMetadataSnapshotCompatible } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { g as hashJson } from "./installed-plugin-index-store-Db9FQc7C.js";
import { c as resolveGatewayStartupPluginPlanFromRegistry } from "./channel-plugin-ids-KD4z3Jyk.js";
//#region src/plugins/plugin-lookup-table.ts
function loadPluginLookUpTable(params) {
	const requestedSnapshotConfig = params.activationSourceConfig ?? params.config;
	const metadataSnapshot = params.metadataSnapshot && isPluginMetadataSnapshotCompatible({
		snapshot: params.metadataSnapshot,
		config: requestedSnapshotConfig,
		env: params.env,
		workspaceDir: params.workspaceDir,
		index: params.index
	}) ? params.metadataSnapshot : resolvePluginMetadataSnapshot({
		config: requestedSnapshotConfig,
		workspaceDir: params.workspaceDir,
		env: params.env,
		allowWorkspaceScopedCurrent: params.workspaceDir === void 0,
		...params.index ? { index: params.index } : {}
	});
	const { index, manifestRegistry } = metadataSnapshot;
	const startupPlanStartedAt = performance.now();
	const startup = resolveGatewayStartupPluginPlanFromRegistry({
		config: params.config,
		...params.activationSourceConfig !== void 0 ? { activationSourceConfig: params.activationSourceConfig } : {},
		env: params.env,
		index,
		manifestRegistry
	});
	const startupPlanMs = performance.now() - startupPlanStartedAt;
	return {
		...metadataSnapshot,
		key: hashJson({
			policyHash: index.policyHash,
			generatedAtMs: index.generatedAtMs,
			plugins: index.plugins.map((plugin) => [
				plugin.pluginId,
				plugin.manifestHash,
				plugin.installRecordHash
			]),
			startup
		}),
		startup,
		metrics: {
			...metadataSnapshot.metrics,
			startupPlanMs,
			totalMs: metadataSnapshot.metrics.totalMs + startupPlanMs,
			startupPluginCount: startup.pluginIds.length,
			deferredChannelPluginCount: startup.configuredDeferredChannelPluginIds.length
		}
	};
}
//#endregion
export { loadPluginLookUpTable as t };
