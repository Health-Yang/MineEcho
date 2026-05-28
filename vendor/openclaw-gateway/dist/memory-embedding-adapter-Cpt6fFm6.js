import { s as isMissingEmbeddingApiKeyError } from "./memory-core-host-engine-embeddings-3xR1uFL6.js";
import { n as createDeepInfraEmbeddingProvider, t as DEFAULT_DEEPINFRA_EMBEDDING_MODEL } from "./embedding-provider-BUj4x2hg.js";
//#region extensions/deepinfra/memory-embedding-adapter.ts
function buildDeepInfraMemoryEmbeddingAdapter(options) {
	const defaultModel = options?.embedModels?.[0]?.id ?? DEFAULT_DEEPINFRA_EMBEDDING_MODEL;
	return {
		id: "deepinfra",
		defaultModel,
		transport: "remote",
		authProviderId: "deepinfra",
		autoSelectPriority: 55,
		allowExplicitWhenConfiguredAuto: true,
		shouldContinueAutoSelection: isMissingEmbeddingApiKeyError,
		create: async (createOptions) => {
			const { provider, client } = await createDeepInfraEmbeddingProvider({
				...createOptions,
				provider: "deepinfra",
				fallback: "none",
				defaultModel
			});
			return {
				provider,
				runtime: {
					id: "deepinfra",
					cacheKeyData: {
						provider: "deepinfra",
						model: client.model
					}
				}
			};
		}
	};
}
const deepinfraMemoryEmbeddingProviderAdapter = buildDeepInfraMemoryEmbeddingAdapter();
//#endregion
export { deepinfraMemoryEmbeddingProviderAdapter as n, buildDeepInfraMemoryEmbeddingAdapter as t };
