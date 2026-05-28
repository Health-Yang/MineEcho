import { m as ModelProviderDeclarationConfig } from "./types.models-CH300rpt.js";
//#region extensions/minimax/provider-catalog.d.ts
declare function buildMinimaxProvider(env?: NodeJS.ProcessEnv): ModelProviderDeclarationConfig;
declare function buildMinimaxPortalProvider(env?: NodeJS.ProcessEnv): ModelProviderDeclarationConfig;
//#endregion
export { buildMinimaxProvider as n, buildMinimaxPortalProvider as t };