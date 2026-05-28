import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { c as EmbeddingProviderAdapter } from "./embedding-providers-DkT4Cx4A.js";

//#region src/plugins/embedding-provider-runtime.d.ts
declare function listEmbeddingProviders(cfg?: OpenClawConfig): EmbeddingProviderAdapter[];
declare function getEmbeddingProvider(id: string, cfg?: OpenClawConfig): EmbeddingProviderAdapter | undefined;
//#endregion
export { listEmbeddingProviders as n, getEmbeddingProvider as t };