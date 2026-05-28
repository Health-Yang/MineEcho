import type { LocalEmbeddingProviderRuntimeOptions } from "./embeddings.js";
import type { EmbeddingProvider, EmbeddingProviderOptions } from "./embeddings.types.js";
export declare function createLocalEmbeddingWorkerProvider(options: EmbeddingProviderOptions, runtimeOptions?: LocalEmbeddingProviderRuntimeOptions): Promise<EmbeddingProvider>;
