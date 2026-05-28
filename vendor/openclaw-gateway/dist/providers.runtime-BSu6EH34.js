import { g as sortUniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { i as loadPluginMetadataSnapshot } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { p as extractPluginInstallRecordsFromInstalledPluginIndex } from "./installed-plugin-index-store-Db9FQc7C.js";
import { n as hasExplicitPluginIdScope } from "./plugin-scope-Cg_NWH2k.js";
import { d as resolveEnabledProviderPluginIds, g as withBundledProviderVitestCompat, h as resolveOwningPluginIdsForProvider, l as resolveDiscoverableProviderOwnerPluginIds, m as resolveOwningPluginIdsForModelRefs, o as resolveActivatableProviderOwnerPluginIds, s as resolveBundledProviderCompatPluginIds, u as resolveDiscoveredProviderPluginIds } from "./plugin-auto-enable-CWrd66LC.js";
import { r as withActivatedPluginIds, t as resolveBundledPluginCompatibleActivationInputs } from "./activation-context-DXol3WSN.js";
import { t as resolveManifestActivationPluginIds } from "./activation-planner-DhpGcugY.js";
import { a as getRuntimePluginRegistryForLoadOptions, c as loadOpenClawPlugins, o as isPluginRegistryLoadInFlight } from "./loader-ChBMT90m.js";
import { c as getActivePluginRegistryWorkspaceDir } from "./runtime-B5Ug58ea.js";
import { n as getLoadedRuntimePluginRegistry } from "./active-runtime-registry-B4V2YD1G.js";
import { n as buildPluginRuntimeLoadOptionsFromValues, r as createPluginRuntimeLoaderLogger } from "./load-context-CcRFSIRs.js";
//#region src/plugins/provider-config-owner.ts
function resolveProviderConfigApiOwnerHint(params) {
	const providers = params.config?.models?.providers;
	if (!providers) return;
	const normalizedProvider = normalizeProviderId(params.provider);
	if (!normalizedProvider) return;
	const providerConfig = providers[params.provider] ?? Object.entries(providers).find(([candidateId]) => normalizeProviderId(candidateId) === normalizedProvider)?.[1];
	const api = typeof providerConfig?.api === "string" ? normalizeProviderId(providerConfig.api) : "";
	if (!api || api === normalizedProvider) return;
	return api;
}
//#endregion
//#region src/plugins/providers.runtime.ts
function dedupeSortedPluginIds(values) {
	return sortUniqueStrings(values);
}
function resolveExplicitProviderOwnerPluginIds(params, snapshot) {
	return dedupeSortedPluginIds(params.providerRefs.flatMap((provider) => {
		const plannedPluginIds = resolveManifestActivationPluginIds({
			trigger: {
				kind: "provider",
				provider
			},
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			manifestRecords: snapshot.manifestRegistry.plugins
		});
		if (plannedPluginIds.length > 0) return plannedPluginIds;
		const apiOwnerHint = resolveProviderConfigApiOwnerHint({
			provider,
			config: params.config
		});
		if (apiOwnerHint) {
			const apiOwnerPluginIds = resolveManifestActivationPluginIds({
				trigger: {
					kind: "provider",
					provider: apiOwnerHint
				},
				config: params.config,
				workspaceDir: params.workspaceDir,
				env: params.env,
				manifestRecords: snapshot.manifestRegistry.plugins
			});
			if (apiOwnerPluginIds.length > 0) return apiOwnerPluginIds;
			const legacyApiOwnerPluginIds = resolveOwningPluginIdsForProvider({
				provider: apiOwnerHint,
				config: params.config,
				workspaceDir: params.workspaceDir,
				env: params.env,
				manifestRegistry: snapshot.manifestRegistry
			});
			if (legacyApiOwnerPluginIds?.length) return legacyApiOwnerPluginIds;
		}
		return resolveOwningPluginIdsForProvider({
			provider,
			config: params.config,
			workspaceDir: params.workspaceDir,
			env: params.env,
			manifestRegistry: snapshot.manifestRegistry
		}) ?? [];
	}));
}
function mergeExplicitOwnerPluginIds(providerPluginIds, explicitOwnerPluginIds) {
	if (explicitOwnerPluginIds.length === 0) return [...providerPluginIds];
	return dedupeSortedPluginIds([...providerPluginIds, ...explicitOwnerPluginIds]);
}
function resolvePluginProviderLoadBase(params, snapshot) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? getActivePluginRegistryWorkspaceDir();
	const providerOwnedPluginIds = params.providerRefs?.length ? resolveExplicitProviderOwnerPluginIds({
		providerRefs: params.providerRefs,
		config: params.config,
		workspaceDir,
		env
	}, snapshot) : [];
	const modelOwnedPluginIds = params.modelRefs?.length ? resolveOwningPluginIdsForModelRefs({
		models: params.modelRefs,
		config: params.config,
		workspaceDir,
		env,
		manifestRegistry: snapshot.manifestRegistry
	}) : [];
	return {
		env,
		workspaceDir,
		requestedPluginIds: hasExplicitPluginIdScope(params.onlyPluginIds) || params.providerRefs?.length || params.modelRefs?.length || providerOwnedPluginIds.length > 0 || modelOwnedPluginIds.length > 0 ? dedupeSortedPluginIds([
			...params.onlyPluginIds ?? [],
			...providerOwnedPluginIds,
			...modelOwnedPluginIds
		]) : void 0,
		explicitOwnerPluginIds: dedupeSortedPluginIds([...providerOwnedPluginIds, ...modelOwnedPluginIds]),
		rawConfig: params.config
	};
}
function resolveSetupProviderPluginLoadState(params, base, snapshot) {
	const setupPluginIds = mergeExplicitOwnerPluginIds(resolveDiscoveredProviderPluginIds({
		config: params.config,
		workspaceDir: base.workspaceDir,
		env: base.env,
		onlyPluginIds: base.requestedPluginIds,
		includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
		registry: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	}), resolveDiscoverableProviderOwnerPluginIds({
		pluginIds: base.explicitOwnerPluginIds,
		config: params.config,
		workspaceDir: base.workspaceDir,
		env: base.env,
		includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
		registry: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	}));
	if (setupPluginIds.length === 0) return;
	const setupConfig = withActivatedPluginIds({
		config: base.rawConfig,
		pluginIds: setupPluginIds
	});
	return { loadOptions: buildPluginRuntimeLoadOptionsFromValues({
		config: setupConfig,
		activationSourceConfig: setupConfig,
		autoEnabledReasons: {},
		workspaceDir: base.workspaceDir,
		env: base.env,
		logger: createPluginRuntimeLoaderLogger(),
		manifestRegistry: snapshot.manifestRegistry,
		installRecords: extractPluginInstallRecordsFromInstalledPluginIndex(snapshot.index)
	}, {
		onlyPluginIds: setupPluginIds,
		pluginSdkResolution: params.pluginSdkResolution,
		cache: params.cache ?? false,
		activate: params.activate ?? false
	}) };
}
function resolveRuntimeProviderPluginLoadState(params, base, snapshot) {
	const explicitOwnerPluginIds = resolveActivatableProviderOwnerPluginIds({
		pluginIds: base.explicitOwnerPluginIds,
		config: base.rawConfig,
		workspaceDir: base.workspaceDir,
		env: base.env,
		includeUntrustedWorkspacePlugins: params.includeUntrustedWorkspacePlugins,
		registry: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	});
	const runtimeRequestedPluginIds = base.requestedPluginIds !== void 0 ? dedupeSortedPluginIds([...params.onlyPluginIds ?? [], ...explicitOwnerPluginIds]) : void 0;
	const activation = resolveBundledPluginCompatibleActivationInputs({
		rawConfig: withActivatedPluginIds({
			config: base.rawConfig,
			pluginIds: explicitOwnerPluginIds
		}),
		env: base.env,
		workspaceDir: base.workspaceDir,
		onlyPluginIds: runtimeRequestedPluginIds,
		applyAutoEnable: params.applyAutoEnable ?? true,
		compatMode: {
			allowlist: params.bundledProviderAllowlistCompat,
			enablement: "allowlist",
			vitest: params.bundledProviderVitestCompat
		},
		resolveCompatPluginIds: (compatParams) => resolveBundledProviderCompatPluginIds({
			...compatParams,
			manifestRegistry: snapshot.manifestRegistry
		})
	});
	const config = params.bundledProviderVitestCompat ? withBundledProviderVitestCompat({
		config: activation.config,
		pluginIds: activation.compatPluginIds,
		env: base.env
	}) : activation.config;
	const providerPluginIds = mergeExplicitOwnerPluginIds(resolveEnabledProviderPluginIds({
		config,
		workspaceDir: base.workspaceDir,
		env: base.env,
		onlyPluginIds: runtimeRequestedPluginIds,
		registry: snapshot.index,
		manifestRegistry: snapshot.manifestRegistry
	}), explicitOwnerPluginIds);
	return { loadOptions: buildPluginRuntimeLoadOptionsFromValues({
		config,
		activationSourceConfig: activation.activationSourceConfig,
		autoEnabledReasons: activation.autoEnabledReasons,
		workspaceDir: base.workspaceDir,
		env: base.env,
		logger: createPluginRuntimeLoaderLogger(),
		manifestRegistry: snapshot.manifestRegistry,
		installRecords: extractPluginInstallRecordsFromInstalledPluginIndex(snapshot.index)
	}, {
		onlyPluginIds: providerPluginIds,
		pluginSdkResolution: params.pluginSdkResolution,
		cache: params.cache ?? true,
		activate: params.activate ?? false
	}) };
}
function isPluginProvidersLoadInFlight(params) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? getActivePluginRegistryWorkspaceDir();
	const snapshot = params.pluginMetadataSnapshot ?? loadPluginMetadataSnapshot({
		config: params.config ?? {},
		workspaceDir,
		env
	});
	const base = resolvePluginProviderLoadBase({
		...params,
		workspaceDir,
		env
	}, snapshot);
	const loadState = params.mode === "setup" ? resolveSetupProviderPluginLoadState(params, base, snapshot) : resolveRuntimeProviderPluginLoadState(params, base, snapshot);
	if (!loadState) return false;
	return isPluginRegistryLoadInFlight(loadState.loadOptions);
}
function resolvePluginProviders(params) {
	const env = params.env ?? process.env;
	const workspaceDir = params.workspaceDir ?? getActivePluginRegistryWorkspaceDir();
	const snapshot = params.pluginMetadataSnapshot ?? loadPluginMetadataSnapshot({
		config: params.config ?? {},
		workspaceDir,
		env
	});
	const base = resolvePluginProviderLoadBase({
		...params,
		workspaceDir,
		env
	}, snapshot);
	if (params.mode === "setup") {
		const loadState = resolveSetupProviderPluginLoadState(params, base, snapshot);
		if (!loadState) return [];
		return loadOpenClawPlugins(loadState.loadOptions).providers.map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId }));
	}
	const loadState = resolveRuntimeProviderPluginLoadState(params, base, snapshot);
	const registry = loadState.loadOptions.onlyPluginIds?.length === 0 ? void 0 : getLoadedRuntimePluginRegistry({
		env: base.env,
		loadOptions: loadState.loadOptions,
		workspaceDir: base.workspaceDir,
		requiredPluginIds: loadState.loadOptions.onlyPluginIds
	}) ?? getRuntimePluginRegistryForLoadOptions(loadState.loadOptions);
	if (!registry) return [];
	return registry.providers.map((entry) => Object.assign({}, entry.provider, { pluginId: entry.pluginId }));
}
//#endregion
export { resolvePluginProviders as n, resolveProviderConfigApiOwnerHint as r, isPluginProvidersLoadInFlight as t };
