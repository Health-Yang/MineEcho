import { f as logToolLoopAction } from "./diagnostic-BDsaMZfL.js";
import { n as getDiagnosticSessionState } from "./diagnostic-session-state-DwjGSduD.js";
import { n as recordToolCall, r as recordToolCallOutcome, t as detectToolCallLoop } from "./tool-loop-detection-DCMwy8RL.js";
//#region src/agents/pi-tools.before-tool-call.runtime.ts
const beforeToolCallRuntime = {
	getDiagnosticSessionState,
	logToolLoopAction,
	detectToolCallLoop,
	recordToolCall,
	recordToolCallOutcome
};
//#endregion
export { beforeToolCallRuntime };
