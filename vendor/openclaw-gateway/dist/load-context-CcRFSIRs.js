import "./agent-scope-CudANNo3.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { a as resolvePluginMetadataSnapshot } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { p as extractPluginInstallRecordsFromInstalledPluginIndex } from "./installed-plugin-index-store-Db9FQc7C.js";
import { S as setCurrentPluginMetadataSnapshot, b as isReusableCurrentPluginMetadataSnapshot, v as clearCurrentPluginMetadataSnapshot } from "./plugin-registry-BALJ9TgI.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import "./config-BtNBbhZb.js";
import { t as applyPluginAutoEnable } from "./plugin-auto-enable-CWrd66LC.js";
import { F as resolvePluginActivationSourceConfig } from "./loader-ChBMT90m.js";
import "./logging-3S-Z1HW2.js";
//#region src/plugins/runtime/load-context.ts
const log = createSubsystemLogger("plugins");
function createPluginRuntimeLoaderLogger() {
	return {
		info: (message) => log.info(message),
		warn: (message) => log.warn(message),
		error: (message) => log.error(message),
		debug: (message) => log.debug(message)
	};
}
function resolvePluginRuntimeLoadContext(options) {
	const env = options?.env ?? process.env;
	const rawConfig = options?.config ?? getRuntimeConfig();
	const rawWorkspaceDir = options?.workspaceDir ?? resolveAgentWorkspaceDir(rawConfig, resolveDefaultAgentId(rawConfig));
	const metadataSnapshot = options?.manifestRegistry ? void 0 : resolvePluginMetadataSnapshot({
		config: rawConfig,
		env,
		workspaceDir: rawWorkspaceDir,
		allowWorkspaceScopedCurrent: true
	});
	const manifestRegistry = options?.manifestRegistry ?? metadataSnapshot?.manifestRegistry;
	const installRecords = metadataSnapshot ? extractPluginInstallRecordsFromInstalledPluginIndex(metadataSnapshot.index) : void 0;
	const activationSourceConfig = resolvePluginActivationSourceConfig({
		config: rawConfig,
		activationSourceConfig: options?.activationSourceConfig
	});
	const autoEnabled = applyPluginAutoEnable({
		config: rawConfig,
		env,
		manifestRegistry,
		discovery: metadataSnapshot?.discovery
	});
	const config = autoEnabled.config;
	const workspaceDir = options?.workspaceDir ?? resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config));
	if (metadataSnapshot) if (isReusableCurrentPluginMetadataSnapshot(metadataSnapshot)) setCurrentPluginMetadataSnapshot(metadataSnapshot, {
		config: rawConfig,
		compatibleConfigs: [config, activationSourceConfig],
		env,
		workspaceDir
	});
	else clearCurrentPluginMetadataSnapshot();
	return {
		rawConfig,
		config,
		activationSourceConfig,
		autoEnabledReasons: autoEnabled.autoEnabledReasons,
		workspaceDir,
		env,
		logger: options?.logger ?? createPluginRuntimeLoaderLogger(),
		manifestRegistry,
		installRecords
	};
}
function buildPluginRuntimeLoadOptions(context, overrides) {
	return buildPluginRuntimeLoadOptionsFromValues(context, overrides);
}
function buildPluginRuntimeLoadOptionsFromValues(values, overrides) {
	return {
		config: values.config,
		activationSourceConfig: values.activationSourceConfig,
		autoEnabledReasons: values.autoEnabledReasons,
		workspaceDir: values.workspaceDir,
		env: values.env,
		logger: values.logger,
		manifestRegistry: values.manifestRegistry,
		installRecords: values.installRecords,
		...overrides
	};
}
//#endregion
export { resolvePluginRuntimeLoadContext as i, buildPluginRuntimeLoadOptionsFromValues as n, createPluginRuntimeLoaderLogger as r, buildPluginRuntimeLoadOptions as t };
