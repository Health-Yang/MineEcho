import { i as OpenClawConfig } from "../../types.openclaw-AW0IHsvN.js";
import { m as MigrationProviderContext } from "../../types-qwKXExVW.js";
//#region extensions/migrate-hermes/auth-config.d.ts
type HermesAuthProfileConfig = {
  profileId: string;
  provider: string;
  mode: "api_key" | "oauth" | "token";
  email?: string;
  displayName?: string;
};
type HermesAuthConfigApplyResult = "configured" | "conflict" | "unavailable";
declare function hasAuthProfileConfigConflict(config: OpenClawConfig, profile: HermesAuthProfileConfig, overwrite: boolean): boolean;
declare function hasCurrentAuthProfileConfigConflict(ctx: MigrationProviderContext, profile: HermesAuthProfileConfig): boolean;
declare function applyAuthProfileConfigWithConflictCheck(params: {
  ctx: MigrationProviderContext;
  profile: HermesAuthProfileConfig;
  applyConfigPatch?: (config: OpenClawConfig) => OpenClawConfig;
}): Promise<HermesAuthConfigApplyResult>;
//#endregion
export { HermesAuthConfigApplyResult, HermesAuthProfileConfig, applyAuthProfileConfigWithConflictCheck, hasAuthProfileConfigConflict, hasCurrentAuthProfileConfigConflict };