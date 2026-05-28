import { l as MigrationItem, m as MigrationProviderContext } from "../../types-qwKXExVW.js";
import { t as HermesSource } from "../../source-BWpYJbX3.js";
import { t as PlannedTargets } from "../../targets-u6EryEIo.js";

//#region extensions/migrate-hermes/auth.d.ts
declare function buildAuthItems(params: {
  ctx: MigrationProviderContext;
  source: HermesSource;
  targets: PlannedTargets;
}): Promise<MigrationItem[]>;
declare function applyAuthItem(ctx: MigrationProviderContext, item: MigrationItem, targets: PlannedTargets): Promise<MigrationItem>;
//#endregion
export { applyAuthItem, buildAuthItems };