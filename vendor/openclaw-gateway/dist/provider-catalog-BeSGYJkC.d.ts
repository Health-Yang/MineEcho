import { m as ModelProviderDeclarationConfig } from "./types.models-CH300rpt.js";
//#region extensions/vercel-ai-gateway/provider-catalog.d.ts
declare function buildStaticVercelAiGatewayProvider(): ModelProviderDeclarationConfig;
declare function buildVercelAiGatewayProvider(): Promise<ModelProviderDeclarationConfig>;
//#endregion
export { buildVercelAiGatewayProvider as n, buildStaticVercelAiGatewayProvider as t };