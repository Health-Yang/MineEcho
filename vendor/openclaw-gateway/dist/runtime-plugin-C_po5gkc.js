import { p as normalizeUniqueStringEntries } from "./string-normalization-B8G0vlWE.js";
import { h as resolveOwningPluginIdsForProvider, o as resolveActivatableProviderOwnerPluginIds, s as resolveBundledProviderCompatPluginIds } from "./plugin-auto-enable-CWrd66LC.js";
import { t as resolveAgentHarnessPolicy } from "./policy-vFgV2Ptr.js";
import { r as withActivatedPluginIds } from "./activation-context-DXol3WSN.js";
//#region src/agents/harness/runtime-plugin.ts
function restrictiveAllowlistOmitsPlugin(config, pluginId) {
	if (config?.plugins?.bundledDiscovery === "compat") return false;
	const allow = config?.plugins?.allow ?? [];
	return allow.length > 0 && !allow.includes(pluginId);
}
function resolveCodexHarnessPluginIds(params) {
	if (restrictiveAllowlistOmitsPlugin(params.config, "codex")) return ["codex"];
	const providerOwnerPluginIds = normalizeUniqueStringEntries(resolveOwningPluginIdsForProvider({
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir
	}) ?? []);
	if (providerOwnerPluginIds.length === 0) return ["codex"];
	const safeProviderOwnerPluginIds = normalizeUniqueStringEntries([...resolveBundledProviderCompatPluginIds({
		config: params.config,
		workspaceDir: params.workspaceDir,
		onlyPluginIds: providerOwnerPluginIds
	}), ...resolveActivatableProviderOwnerPluginIds({
		pluginIds: providerOwnerPluginIds,
		config: params.config,
		workspaceDir: params.workspaceDir
	})]);
	return normalizeUniqueStringEntries(["codex", ...providerOwnerPluginIds.filter((pluginId) => pluginId !== "codex" && safeProviderOwnerPluginIds.includes(pluginId))]);
}
function withRuntimePluginIdsAllowed(params) {
	if (params.pluginIds.length === 0) return params.config;
	if (restrictiveAllowlistOmitsPlugin(params.config, params.requiredPluginId)) return params.config;
	const allow = normalizeUniqueStringEntries([...params.config?.plugins?.allow ?? [], ...params.pluginIds]);
	return {
		...params.config,
		plugins: {
			...params.config?.plugins,
			allow
		}
	};
}
async function ensureSelectedAgentHarnessPlugin(params) {
	const runtimeOverride = params.agentHarnessRuntimeOverride?.trim();
	const policy = resolveAgentHarnessPolicy({
		provider: params.provider,
		modelId: params.modelId,
		config: params.config,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
	if ((runtimeOverride && runtimeOverride !== "auto" && runtimeOverride !== "default" ? runtimeOverride : policy.runtime) !== "codex") return;
	const { ensurePluginRegistryLoaded } = await import("./runtime-registry-loader-DGTbTAuF.js");
	const pluginIds = resolveCodexHarnessPluginIds({
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir
	});
	const configWithAllowedRuntimePlugins = withRuntimePluginIdsAllowed({
		config: params.config,
		requiredPluginId: "codex",
		pluginIds
	});
	const activatedConfig = withActivatedPluginIds({
		config: configWithAllowedRuntimePlugins,
		pluginIds
	}) ?? configWithAllowedRuntimePlugins;
	ensurePluginRegistryLoaded({
		scope: "all",
		...activatedConfig ? {
			config: activatedConfig,
			activationSourceConfig: activatedConfig
		} : {},
		workspaceDir: params.workspaceDir,
		onlyPluginIds: pluginIds
	});
}
//#endregion
export { ensureSelectedAgentHarnessPlugin as t };
