import { r as resolveAgentModelFallbackValues } from "./model-input-C697EEaR.js";
import { i as buildModelAliasIndex, m as resolveAllowedModelRefFromAliasIndex, o as getModelRefStatusWithFallbackModels } from "./model-selection-shared-BuXkxoPc.js";
//#region src/agents/model-selection-resolve.ts
function resolveDefaultFallbackModels(cfg) {
	return resolveAgentModelFallbackValues(cfg.agents?.defaults?.model);
}
function getModelRefStatus(params) {
	const { cfg, catalog, ref, defaultProvider, defaultModel, manifestPlugins } = params;
	return getModelRefStatusWithFallbackModels({
		cfg,
		catalog,
		ref,
		defaultProvider,
		defaultModel,
		fallbackModels: resolveDefaultFallbackModels(cfg),
		manifestPlugins
	});
}
function resolveAllowedModelRef(params) {
	const aliasIndex = buildModelAliasIndex({
		cfg: params.cfg,
		defaultProvider: params.defaultProvider,
		manifestPlugins: params.manifestPlugins
	});
	return resolveAllowedModelRefFromAliasIndex({
		cfg: params.cfg,
		raw: params.raw,
		defaultProvider: params.defaultProvider,
		aliasIndex,
		manifestPlugins: params.manifestPlugins,
		getStatus: (ref) => getModelRefStatus({
			cfg: params.cfg,
			catalog: params.catalog,
			ref,
			defaultProvider: params.defaultProvider,
			defaultModel: params.defaultModel,
			manifestPlugins: params.manifestPlugins
		})
	});
}
//#endregion
export { resolveAllowedModelRef as n, getModelRefStatus as t };
