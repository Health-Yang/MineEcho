import { f as ModelProviderConfig } from "./types.models-CH300rpt.js";
//#region extensions/huggingface/provider-catalog.d.ts
declare function buildHuggingfaceProvider(discoveryApiKey?: string): Promise<ModelProviderConfig>;
//#endregion
export { buildHuggingfaceProvider as t };