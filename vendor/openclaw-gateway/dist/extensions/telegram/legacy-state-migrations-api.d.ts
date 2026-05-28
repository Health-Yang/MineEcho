import { i as OpenClawConfig } from "../../types.openclaw-AW0IHsvN.js";
import { g as ChannelLegacyStateMigrationPlan } from "../../types.core-CmhUJuY-.js";
//#region extensions/telegram/src/state-migrations.d.ts
declare function detectTelegramLegacyStateMigrations(params: {
  cfg: OpenClawConfig;
  env: NodeJS.ProcessEnv;
  stateDir?: string;
}): Promise<ChannelLegacyStateMigrationPlan[]>;
//#endregion
export { detectTelegramLegacyStateMigrations };