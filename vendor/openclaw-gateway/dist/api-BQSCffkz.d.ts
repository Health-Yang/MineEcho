import { D as OpenClawPluginToolContext } from "./types-core-CiUqduCn.js";
import { r as AnyAgentTool } from "./common-BDN0bXby.js";
import { s as ChannelSetupWizard } from "./setup-wizard-types-CDi6EJxd.js";
import { H as ChannelSetupAdapter } from "./types.adapters-BhW9RjuN.js";
//#region extensions/zalouser/src/tool.d.ts
type ZalouserToolContext = Pick<OpenClawPluginToolContext, "deliveryContext">;
declare function createZalouserTool(context?: ZalouserToolContext): AnyAgentTool;
//#endregion
//#region extensions/zalouser/src/setup-core.d.ts
declare const zalouserSetupAdapter: ChannelSetupAdapter;
declare function createZalouserSetupWizardProxy(loadWizard: () => Promise<ChannelSetupWizard>): ChannelSetupWizard;
//#endregion
//#region extensions/zalouser/src/setup-surface.d.ts
declare const zalouserSetupWizard: ChannelSetupWizard;
//#endregion
export { createZalouserTool as i, createZalouserSetupWizardProxy as n, zalouserSetupAdapter as r, zalouserSetupWizard as t };