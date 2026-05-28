import { m as ModelProviderDeclarationConfig } from "./types.models-CH300rpt.js";
//#region extensions/xai/provider-catalog.d.ts
declare function buildXaiProvider(api?: ModelProviderDeclarationConfig["api"]): ModelProviderDeclarationConfig;
//#endregion
export { buildXaiProvider as t };