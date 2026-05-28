import { m as ModelProviderDeclarationConfig } from "./types.models-CH300rpt.js";
import { Bt as ProviderCatalogResult, Rt as ProviderCatalogContext } from "./types-qwKXExVW.js";
//#region extensions/deepinfra/provider-catalog.d.ts
declare function buildStaticDeepInfraProvider(): ModelProviderDeclarationConfig;
declare function buildDeepInfraProvider(options?: {
  hasApiKey?: boolean;
  env?: NodeJS.ProcessEnv;
  agentDir?: string;
}): Promise<ModelProviderDeclarationConfig>;
declare function buildDeepInfraApiKeyCatalog(ctx: ProviderCatalogContext): Promise<ProviderCatalogResult>;
//#endregion
export { buildDeepInfraProvider as n, buildStaticDeepInfraProvider as r, buildDeepInfraApiKeyCatalog as t };