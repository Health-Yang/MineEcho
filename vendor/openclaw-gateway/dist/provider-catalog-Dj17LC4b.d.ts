import { m as ModelProviderDeclarationConfig } from "./types.models-CH300rpt.js";
//#region extensions/qwen/provider-catalog.d.ts
declare function buildQwenProvider(params?: {
  baseUrl?: string;
}): ModelProviderDeclarationConfig;
declare const buildModelStudioProvider: typeof buildQwenProvider;
//#endregion
export { buildQwenProvider as n, buildModelStudioProvider as t };