import { n as resolveRemoteEmbeddingClient, t as createRemoteEmbeddingProvider } from "./memory-core-host-engine-embeddings-3xR1uFL6.js";
import { t as DEEPINFRA_BASE_URL } from "./provider-models-BJjZmbD6.js";
import { p as normalizeDeepInfraModelRef, t as DEEPINFRA_EMBED_FALLBACK_MODELS } from "./media-models-esM5_HbQ.js";
//#region extensions/deepinfra/embedding-provider.ts
const DEFAULT_DEEPINFRA_EMBEDDING_MODEL = DEEPINFRA_EMBED_FALLBACK_MODELS[0];
async function createDeepInfraEmbeddingProvider(options) {
	const defaultModel = options.defaultModel ?? DEFAULT_DEEPINFRA_EMBEDDING_MODEL;
	const client = await resolveRemoteEmbeddingClient({
		provider: "deepinfra",
		options: {
			...options,
			model: normalizeDeepInfraModelRef(options.model, defaultModel)
		},
		defaultBaseUrl: DEEPINFRA_BASE_URL,
		normalizeModel: (model) => normalizeDeepInfraModelRef(model, defaultModel)
	});
	return {
		provider: createRemoteEmbeddingProvider({
			id: "deepinfra",
			client,
			errorPrefix: "DeepInfra embeddings API error"
		}),
		client
	};
}
//#endregion
export { createDeepInfraEmbeddingProvider as n, DEFAULT_DEEPINFRA_EMBEDDING_MODEL as t };
