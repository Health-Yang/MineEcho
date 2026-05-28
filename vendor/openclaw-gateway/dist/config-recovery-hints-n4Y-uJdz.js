import { t as formatCliCommand } from "./command-format-CItqrBX6.js";
//#region src/cli/config-recovery-hints.ts
function formatInvalidConfigRecoveryHint() {
	return [`Run "${formatCliCommand("openclaw doctor --fix")}" to repair, then retry.`, "If startup is still blocked, inspect the adjacent .bak backup before restoring it manually."].join("\n");
}
function formatPluginPackagingRuntimeOutputRecoveryHint() {
	return ["This is a plugin packaging issue, not a local config problem.", "Update or reinstall the plugin after the publisher ships compiled JavaScript, or disable/uninstall the plugin until then."].join("\n");
}
//#endregion
export { formatPluginPackagingRuntimeOutputRecoveryHint as n, formatInvalidConfigRecoveryHint as t };
