import "./provider-model-shared-Co6lnz7Y.js";
import { c as buildSingleProviderApiKeyCatalog } from "./provider-catalog-shared-DGUcvumn.js";
import { a as DEEPINFRA_MODEL_CATALOG, o as buildDeepInfraModelDefinition, s as discoverDeepInfraModels, t as DEEPINFRA_BASE_URL } from "./provider-models-BJjZmbD6.js";
//#region extensions/deepinfra/provider-catalog.ts
function buildStaticDeepInfraProvider() {
	return {
		baseUrl: DEEPINFRA_BASE_URL,
		api: "openai-completions",
		models: DEEPINFRA_MODEL_CATALOG.map(buildDeepInfraModelDefinition)
	};
}
async function buildDeepInfraProvider(options) {
	return {
		baseUrl: DEEPINFRA_BASE_URL,
		api: "openai-completions",
		models: await discoverDeepInfraModels(options)
	};
}
function buildDeepInfraApiKeyCatalog(ctx) {
	return buildSingleProviderApiKeyCatalog({
		ctx,
		providerId: "deepinfra",
		buildProvider: () => buildDeepInfraProvider({
			hasApiKey: true,
			env: ctx.env,
			agentDir: ctx.agentDir
		})
	});
}
//#endregion
export { buildDeepInfraProvider as n, buildStaticDeepInfraProvider as r, buildDeepInfraApiKeyCatalog as t };
