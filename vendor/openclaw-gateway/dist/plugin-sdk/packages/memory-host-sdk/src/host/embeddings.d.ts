import type { EmbeddingProvider, EmbeddingProviderOptions } from "./embeddings.types.js";
export type { EmbeddingProvider, EmbeddingProviderFallback, EmbeddingProviderId, EmbeddingProviderOptions, EmbeddingProviderRequest, GeminiTaskType, } from "./embeddings.types.js";
export { DEFAULT_LOCAL_MODEL } from "./embedding-defaults.js";
export type LocalEmbeddingProviderRuntimeOptions = {
    workerScriptPath?: string;
};
export declare function createLocalEmbeddingProvider(options: EmbeddingProviderOptions): Promise<EmbeddingProvider>;
export declare function createLocalEmbeddingProviderInProcess(options: EmbeddingProviderOptions): Promise<EmbeddingProvider>;
