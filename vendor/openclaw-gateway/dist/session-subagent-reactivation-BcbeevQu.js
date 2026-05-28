import { r as getLatestSubagentRunByChildSessionKey } from "./subagent-registry-read-CLlen2wN.js";
//#region src/gateway/session-subagent-reactivation.ts
async function loadSessionSubagentReactivationRuntime() {
	return import("./session-subagent-reactivation.runtime.js");
}
async function reactivateCompletedSubagentSession(params) {
	const runId = params.runId?.trim();
	if (!runId) return false;
	const existing = getLatestSubagentRunByChildSessionKey(params.sessionKey);
	if (!existing || typeof existing.endedAt !== "number") return false;
	const { replaceSubagentRunAfterSteer } = await loadSessionSubagentReactivationRuntime();
	return replaceSubagentRunAfterSteer({
		previousRunId: existing.runId,
		nextRunId: runId,
		fallback: existing,
		runTimeoutSeconds: existing.runTimeoutSeconds ?? 0
	});
}
//#endregion
export { reactivateCompletedSubagentSession as t };
