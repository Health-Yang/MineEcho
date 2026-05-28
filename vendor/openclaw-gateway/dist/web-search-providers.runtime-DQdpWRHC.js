import "./manifest-registry-DYz4Sf21.js";
import "./loader-ChBMT90m.js";
import { c as resolveManifestDeclaredWebProviderCandidatePluginIds, n as sortWebSearchProviders, s as mapRegistryProviders, t as resolveBundledWebSearchResolutionConfig } from "./web-search-providers.shared-D9PjQnj0.js";
import { n as resolveBundledWebSearchProvidersFromPublicArtifacts } from "./web-provider-public-artifacts-q1RYSYXG.js";
import { n as resolveRuntimeWebProviders, t as resolvePluginWebProviders } from "./web-provider-runtime-shared-ChTS46Rt.js";
//#region src/plugins/web-search-providers.runtime.ts
function resolveWebSearchCandidatePluginIds(params) {
	return resolveManifestDeclaredWebProviderCandidatePluginIds({
		contract: "webSearchProviders",
		configKey: "webSearch",
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		onlyPluginIds: params.onlyPluginIds,
		origin: params.origin
	});
}
function mapRegistryWebSearchProviders(params) {
	return mapRegistryProviders({
		entries: params.registry.webSearchProviders,
		onlyPluginIds: params.onlyPluginIds,
		sortProviders: sortWebSearchProviders
	});
}
function resolvePluginWebSearchProviders(params) {
	return resolvePluginWebProviders(params, {
		resolveBundledResolutionConfig: resolveBundledWebSearchResolutionConfig,
		resolveCandidatePluginIds: resolveWebSearchCandidatePluginIds,
		mapRegistryProviders: mapRegistryWebSearchProviders,
		resolveBundledPublicArtifactProviders: resolveBundledWebSearchProvidersFromPublicArtifacts
	});
}
function resolveRuntimeWebSearchProviders(params) {
	return resolveRuntimeWebProviders(params, {
		resolveBundledResolutionConfig: resolveBundledWebSearchResolutionConfig,
		resolveCandidatePluginIds: resolveWebSearchCandidatePluginIds,
		mapRegistryProviders: mapRegistryWebSearchProviders
	});
}
//#endregion
export { resolveRuntimeWebSearchProviders as n, resolvePluginWebSearchProviders as t };
