import { t as formatCliCommand } from "./command-format-CItqrBX6.js";
import { u as readConfigFileSnapshot } from "./io-BlARNTf3.js";
import { n as formatConfigIssueLines } from "./issue-format-c8ezaSew.js";
import { n as isPluginPackagingRuntimeOutputInvalidConfigSnapshot } from "./recovery-policy-CKSxWKv4.js";
import "./config-BtNBbhZb.js";
import { n as formatPluginPackagingRuntimeOutputRecoveryHint } from "./config-recovery-hints-n4Y-uJdz.js";
import { l as formatPluginCompatibilityNotice, r as buildPluginCompatibilitySnapshotNotices } from "./status-D3q_e-nF.js";
//#region src/commands/config-validation.ts
async function requireValidConfigFileSnapshot(runtime, opts) {
	const snapshot = await readConfigFileSnapshot();
	if (snapshot.exists && !snapshot.valid) {
		const issues = snapshot.issues.length > 0 ? formatConfigIssueLines(snapshot.issues, "-").join("\n") : "Unknown validation issue.";
		runtime.error(`OpenClaw config is invalid: ${snapshot.path}\n${issues}`);
		runtime.error(isPluginPackagingRuntimeOutputInvalidConfigSnapshot(snapshot) ? `Fix: ${formatPluginPackagingRuntimeOutputRecoveryHint()}` : `Fix: ${formatCliCommand("openclaw doctor --fix")}`);
		runtime.error(`Inspect: ${formatCliCommand("openclaw config validate")}`);
		runtime.exit(1);
		return null;
	}
	if (opts?.includeCompatibilityAdvisory !== true) return snapshot;
	const compatibility = buildPluginCompatibilitySnapshotNotices({ config: snapshot.config });
	if (compatibility.length > 0) runtime.log([
		`Plugin compatibility: ${compatibility.length} notice${compatibility.length === 1 ? "" : "s"}.`,
		...compatibility.slice(0, 3).map((notice) => `- ${formatPluginCompatibilityNotice(notice)}`),
		...compatibility.length > 3 ? [`- ... +${compatibility.length - 3} more`] : [],
		`Review: ${formatCliCommand("openclaw doctor")}`
	].join("\n"));
	return snapshot;
}
async function requireValidConfigSnapshot(runtime, opts) {
	return (await requireValidConfigFileSnapshot(runtime, opts))?.config ?? null;
}
//#endregion
export { requireValidConfigSnapshot as n, requireValidConfigFileSnapshot as t };
