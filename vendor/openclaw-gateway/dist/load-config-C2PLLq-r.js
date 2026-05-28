import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import { s as getRuntimeConfigSourceSnapshot, v as setRuntimeConfigSnapshot } from "./runtime-snapshot-D93_HOsR.js";
import "./config-BtNBbhZb.js";
import { l as getModelsCommandSecretTargetIds } from "./command-secret-targets-CC7zWwhc.js";
import { t as resolveCommandConfigWithSecrets } from "./command-config-resolution-BT7EeD15.js";
//#region src/commands/models/load-config.ts
async function loadModelsConfigWithSource(params) {
	const runtimeConfig = getRuntimeConfig();
	const sourceConfig = getRuntimeConfigSourceSnapshot() ?? runtimeConfig;
	const { resolvedConfig, diagnostics } = await resolveCommandConfigWithSecrets({
		config: runtimeConfig,
		commandName: params.commandName,
		targetIds: getModelsCommandSecretTargetIds(),
		runtime: params.runtime
	});
	setRuntimeConfigSnapshot(resolvedConfig, sourceConfig);
	return {
		sourceConfig,
		resolvedConfig,
		diagnostics
	};
}
async function loadModelsConfig(params) {
	return (await loadModelsConfigWithSource(params)).resolvedConfig;
}
//#endregion
export { loadModelsConfigWithSource as n, loadModelsConfig as t };
