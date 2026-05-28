import { m as ModelProviderDeclarationConfig } from "./types.models-CH300rpt.js";
//#region extensions/kilocode/provider-catalog.d.ts
declare function buildKilocodeProvider(): ModelProviderDeclarationConfig;
declare function buildKilocodeProviderWithDiscovery(): Promise<ModelProviderDeclarationConfig>;
//#endregion
export { buildKilocodeProviderWithDiscovery as n, buildKilocodeProvider as t };