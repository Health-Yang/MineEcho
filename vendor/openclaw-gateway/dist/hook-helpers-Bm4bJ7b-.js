import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { t as getGlobalHookRunner } from "./hook-runner-global-CjzahG2G.js";
import { r as consumeAdjustedParamsForToolCall } from "./pi-tools.before-tool-call-BEgB-RpB.js";
//#region src/agents/harness/hook-helpers.ts
const log = createSubsystemLogger("agents/harness");
async function runAgentHarnessAfterToolCallHook(params) {
	const hookRunner = getGlobalHookRunner();
	if (!hookRunner?.hasHooks("after_tool_call")) return;
	const adjustedArgs = consumeAdjustedParamsForToolCall(params.toolCallId, params.runId);
	const eventArgs = adjustedArgs && typeof adjustedArgs === "object" ? adjustedArgs : params.startArgs;
	try {
		await hookRunner.runAfterToolCall({
			toolName: params.toolName,
			params: eventArgs,
			...params.runId ? { runId: params.runId } : {},
			toolCallId: params.toolCallId,
			...params.result ? { result: params.result } : {},
			...params.error ? { error: params.error } : {},
			...params.startedAt != null ? { durationMs: Date.now() - params.startedAt } : {}
		}, {
			toolName: params.toolName,
			...params.agentId ? { agentId: params.agentId } : {},
			...params.sessionId ? { sessionId: params.sessionId } : {},
			...params.sessionKey ? { sessionKey: params.sessionKey } : {},
			...params.runId ? { runId: params.runId } : {},
			...params.channelId ? { channelId: params.channelId } : {},
			toolCallId: params.toolCallId
		});
	} catch (error) {
		log.warn(`after_tool_call hook failed: tool=${params.toolName} error=${String(error)}`);
	}
}
function runAgentHarnessBeforeMessageWriteHook(params) {
	const hookRunner = getGlobalHookRunner();
	if (!hookRunner?.hasHooks("before_message_write")) return params.message;
	const result = hookRunner.runBeforeMessageWrite({ message: params.message }, {
		...params.agentId ? { agentId: params.agentId } : {},
		...params.sessionKey ? { sessionKey: params.sessionKey } : {}
	});
	if (result?.block) return null;
	return result?.message ?? params.message;
}
//#endregion
export { runAgentHarnessBeforeMessageWriteHook as n, runAgentHarnessAfterToolCallHook as t };
