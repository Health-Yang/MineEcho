import { Ui as MemoryEmbeddingProviderAdapter } from "./types-qwKXExVW.js";
import { c as DeepInfraSurfaceModel } from "./provider-models--rKimEI6.js";
//#region extensions/deepinfra/memory-embedding-adapter.d.ts
declare function buildDeepInfraMemoryEmbeddingAdapter(options?: {
  embedModels?: readonly DeepInfraSurfaceModel[];
}): MemoryEmbeddingProviderAdapter;
declare const deepinfraMemoryEmbeddingProviderAdapter: MemoryEmbeddingProviderAdapter;
//#endregion
export { deepinfraMemoryEmbeddingProviderAdapter as n, buildDeepInfraMemoryEmbeddingAdapter as t };