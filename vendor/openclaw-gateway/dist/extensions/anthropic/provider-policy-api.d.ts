import { i as OpenClawConfig } from "../../types.openclaw-AW0IHsvN.js";
import { f as ModelProviderConfig } from "../../types.models-CH300rpt.js";
import { $n as ProviderThinkingProfile } from "../../types-qwKXExVW.js";
import { t as applyAnthropicConfigDefaults } from "../../config-defaults-C3jOB9hD.js";
//#region extensions/anthropic/provider-policy-api.d.ts
declare function normalizeConfig(params: {
  provider: string;
  providerConfig: ModelProviderConfig;
}): ModelProviderConfig;
declare function applyConfigDefaults(params: Parameters<typeof applyAnthropicConfigDefaults>[0]): OpenClawConfig;
declare function resolveThinkingProfile(params: {
  provider: string;
  modelId: string;
}): ProviderThinkingProfile | null;
//#endregion
export { applyConfigDefaults, normalizeConfig, resolveThinkingProfile };