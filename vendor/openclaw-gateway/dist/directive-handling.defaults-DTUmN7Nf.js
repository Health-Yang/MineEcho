import { i as buildModelAliasIndex } from "./model-selection-shared-BuXkxoPc.js";
import { s as resolveDefaultModelForAgent } from "./model-selection-DF4MbMUd.js";
//#region src/auto-reply/reply/directive-handling.defaults.ts
function resolveDefaultModel(params) {
	const mainModel = resolveDefaultModelForAgent({
		cfg: params.cfg,
		agentId: params.agentId,
		allowPluginNormalization: false
	});
	const defaultProvider = mainModel.provider;
	return {
		defaultProvider,
		defaultModel: mainModel.model,
		aliasIndex: buildModelAliasIndex({
			cfg: params.cfg,
			defaultProvider,
			allowPluginNormalization: false
		})
	};
}
//#endregion
export { resolveDefaultModel as t };
