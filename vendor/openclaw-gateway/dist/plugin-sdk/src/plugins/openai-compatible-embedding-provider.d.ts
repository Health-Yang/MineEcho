import { type SsrFPolicy } from "../infra/net/ssrf.js";
import type { EmbeddingProvider, EmbeddingProviderAdapter, EmbeddingProviderCreateOptions } from "./embedding-provider-types.js";
export declare const OPENAI_COMPATIBLE_EMBEDDING_PROVIDER_ID = "openai-compatible";
export type OpenAICompatibleEmbeddingClient = {
    baseUrl: string;
    headers: Record<string, string>;
    ssrfPolicy?: SsrFPolicy;
    model: string;
    dimensions?: number;
    inputType?: string;
    queryInputType?: string;
    documentInputType?: string;
};
export declare function createOpenAICompatibleEmbeddingClient(options: EmbeddingProviderCreateOptions): Promise<OpenAICompatibleEmbeddingClient>;
export declare function createOpenAICompatibleEmbeddingProvider(options: EmbeddingProviderCreateOptions): Promise<{
    provider: EmbeddingProvider;
    client: OpenAICompatibleEmbeddingClient;
}>;
export declare const openAICompatibleEmbeddingProviderAdapter: EmbeddingProviderAdapter;
