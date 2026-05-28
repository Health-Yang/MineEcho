//#region src/shared/agent-liveness.ts
function isBlockedLivenessState(livenessState) {
	return typeof livenessState === "string" && livenessState.trim().toLowerCase() === "blocked";
}
function formatBlockedLivenessError(error) {
	return (typeof error === "string" ? error.trim() : "") || "Agent run blocked before producing a usable result.";
}
function normalizeBlockedLivenessWaitStatus(params) {
	const error = typeof params.error === "string" ? params.error : void 0;
	if (!isBlockedLivenessState(params.livenessState)) return {
		status: params.status,
		error
	};
	return {
		status: "error",
		error: formatBlockedLivenessError(error)
	};
}
//#endregion
//#region src/agents/run-termination.ts
const AGENT_RUN_ABORTED_STOP_REASON = "aborted";
const AGENT_RUN_ABORTED_ERROR = "agent run aborted";
function isAbortedAgentStopReason(value) {
	return value === AGENT_RUN_ABORTED_STOP_REASON;
}
//#endregion
export { normalizeBlockedLivenessWaitStatus as a, isBlockedLivenessState as i, isAbortedAgentStopReason as n, formatBlockedLivenessError as r, AGENT_RUN_ABORTED_ERROR as t };
