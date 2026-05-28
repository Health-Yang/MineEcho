import { A as OpenClawPluginDefinition, cn as ProviderPlugin, k as OpenClawPluginConfigSchema } from "../../types-qwKXExVW.js";
//#region extensions/openai/setup-api.d.ts
declare function buildOpenAISetupProvider(): ProviderPlugin;
declare function buildOpenAICodexSetupProvider(): ProviderPlugin;
declare const _default: {
  id: string;
  name: string;
  description: string;
  configSchema: OpenClawPluginConfigSchema;
  register: NonNullable<OpenClawPluginDefinition["register"]>;
} & Pick<OpenClawPluginDefinition, "kind" | "reload" | "nodeHostCommands" | "securityAuditCollectors">;
//#endregion
export { buildOpenAICodexSetupProvider, buildOpenAISetupProvider, _default as default };