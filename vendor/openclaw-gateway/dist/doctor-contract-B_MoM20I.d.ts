import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { C as ChannelDoctorConfigMutation, T as ChannelDoctorLegacyConfigRule } from "./types.adapters-BhW9RjuN.js";
//#region extensions/telegram/src/doctor-contract.d.ts
declare const legacyConfigRules: ChannelDoctorLegacyConfigRule[];
declare function normalizeCompatibilityConfig({
  cfg
}: {
  cfg: OpenClawConfig;
}): ChannelDoctorConfigMutation;
//#endregion
export { normalizeCompatibilityConfig as n, legacyConfigRules as t };