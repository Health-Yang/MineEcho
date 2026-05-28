import { f as ModelProviderConfig } from "../../types.models-CH300rpt.js";
import { $n as ProviderThinkingProfile } from "../../types-qwKXExVW.js";
//#region extensions/openai/provider-policy-api.d.ts
declare function normalizeConfig(params: {
  provider: string;
  providerConfig: ModelProviderConfig;
}): ModelProviderConfig;
declare function resolveThinkingProfile(params: {
  provider: string;
  modelId: string;
}): ProviderThinkingProfile | null;
//#endregion
export { normalizeConfig, resolveThinkingProfile };