import { f as ModelProviderConfig } from "../../types.models-CH300rpt.js";
import { $n as ProviderThinkingProfile, Zn as ProviderDefaultThinkingPolicyContext } from "../../types-qwKXExVW.js";
//#region extensions/google/provider-policy-api.d.ts
declare function normalizeConfig(params: {
  provider: string;
  providerConfig: ModelProviderConfig;
}): ModelProviderConfig;
declare function resolveThinkingProfile(context: ProviderDefaultThinkingPolicyContext): ProviderThinkingProfile | undefined;
//#endregion
export { normalizeConfig, resolveThinkingProfile };