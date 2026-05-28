import { r as resolveAgentModelFallbackValues } from "./model-input-C697EEaR.js";
import { u as resolveAgentModelFallbacksOverride } from "./agent-scope-CudANNo3.js";
import { a as createModelVisibilityPolicyWithFallbacks } from "./model-selection-shared-BuXkxoPc.js";
//#region src/agents/model-visibility-policy.ts
const RUNTIME_MODEL_VISIBILITY_NORMALIZATION = {
	allowManifestNormalization: true,
	allowPluginNormalization: true
};
function resolveAllowedFallbacks(params) {
	if (params.agentId) {
		const override = resolveAgentModelFallbacksOverride(params.cfg, params.agentId);
		if (override !== void 0) return override;
	}
	return resolveAgentModelFallbackValues(params.cfg.agents?.defaults?.model);
}
function createModelVisibilityPolicy(params) {
	return createModelVisibilityPolicyWithFallbacks({
		cfg: params.cfg,
		catalog: params.catalog,
		defaultProvider: params.defaultProvider,
		defaultModel: params.defaultModel,
		fallbackModels: resolveAllowedFallbacks({
			cfg: params.cfg,
			agentId: params.agentId
		}),
		allowManifestNormalization: params.allowManifestNormalization ?? false,
		allowPluginNormalization: params.allowPluginNormalization ?? false,
		manifestPlugins: params.manifestPlugins
	});
}
//#endregion
export { createModelVisibilityPolicy as n, RUNTIME_MODEL_VISIBILITY_NORMALIZATION as t };
