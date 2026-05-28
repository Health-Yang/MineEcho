import { Gi as MemoryEmbeddingProviderCreateOptions, Ki as MemoryEmbeddingProviderCreateResult } from "../../types-qwKXExVW.js";
//#region extensions/deepinfra/embedding-provider.d.ts
declare const DEFAULT_DEEPINFRA_EMBEDDING_MODEL: "BAAI/bge-m3";
declare function createDeepInfraEmbeddingProvider(options: MemoryEmbeddingProviderCreateOptions & {
  defaultModel?: string;
}): Promise<MemoryEmbeddingProviderCreateResult & {
  client: {
    model: string;
  };
}>;
//#endregion
export { DEFAULT_DEEPINFRA_EMBEDDING_MODEL, createDeepInfraEmbeddingProvider };