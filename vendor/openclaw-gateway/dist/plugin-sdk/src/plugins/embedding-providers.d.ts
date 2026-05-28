import type { EmbeddingProviderAdapter, RegisteredEmbeddingProvider } from "./embedding-provider-types.js";
export type { EmbeddingInput, EmbeddingProvider, EmbeddingProviderAdapter, EmbeddingProviderCallOptions, EmbeddingProviderCreateOptions, EmbeddingProviderCreateResult, EmbeddingProviderRuntime, RegisteredEmbeddingProvider, } from "./embedding-provider-types.js";
export declare function registerEmbeddingProvider(adapter: EmbeddingProviderAdapter, options?: {
    ownerPluginId?: string;
}): void;
export declare function getRegisteredEmbeddingProvider(id: string): RegisteredEmbeddingProvider | undefined;
export declare function getEmbeddingProvider(id: string): EmbeddingProviderAdapter | undefined;
export declare function listRegisteredEmbeddingProviders(): RegisteredEmbeddingProvider[];
export declare function listEmbeddingProviders(): EmbeddingProviderAdapter[];
export declare function restoreEmbeddingProviders(adapters: EmbeddingProviderAdapter[]): void;
export declare function restoreRegisteredEmbeddingProviders(entries: RegisteredEmbeddingProvider[]): void;
export declare function clearEmbeddingProviders(): void;
export declare const resetEmbeddingProviders: typeof clearEmbeddingProviders;
