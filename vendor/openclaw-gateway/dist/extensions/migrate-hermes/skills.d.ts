import { l as MigrationItem } from "../../types-qwKXExVW.js";
import { t as HermesSource } from "../../source-BWpYJbX3.js";
import { t as PlannedTargets } from "../../targets-u6EryEIo.js";

//#region extensions/migrate-hermes/skills.d.ts
declare function buildSkillItems(params: {
  source: HermesSource;
  targets: PlannedTargets;
  overwrite?: boolean;
}): Promise<MigrationItem[]>;
//#endregion
export { buildSkillItems };