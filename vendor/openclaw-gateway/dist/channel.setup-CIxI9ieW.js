import { t as createZalouserPluginBase } from "./shared-fIY36R9X.js";
import { n as zalouserSetupAdapter } from "./setup-core-Bi-KA85l.js";
import { t as zalouserSetupWizard } from "./setup-surface-BzNrYwHq.js";
//#region extensions/zalouser/src/channel.setup.ts
const zalouserSetupPlugin = { ...createZalouserPluginBase({
	setupWizard: zalouserSetupWizard,
	setup: zalouserSetupAdapter
}) };
//#endregion
export { zalouserSetupPlugin as t };
