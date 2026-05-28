import { i as resolveAgentModelPrimaryValue } from "./model-input-C697EEaR.js";
import { r as logConfigUpdated } from "./logging-MS6xnFJj.js";
import { t as applyDefaultModelPrimaryUpdate, u as updateConfig } from "./shared-DkSSKqzU.js";
//#region src/commands/models/set-image.ts
async function modelsSetImageCommand(modelRaw, runtime) {
	const updated = await updateConfig((cfg) => {
		return applyDefaultModelPrimaryUpdate({
			cfg,
			modelRaw,
			field: "imageModel"
		});
	});
	logConfigUpdated(runtime);
	runtime.log(`Image model: ${resolveAgentModelPrimaryValue(updated.agents?.defaults?.imageModel) ?? modelRaw}`);
}
//#endregion
export { modelsSetImageCommand };
