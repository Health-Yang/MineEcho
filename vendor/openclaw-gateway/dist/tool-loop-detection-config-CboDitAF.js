import "./agent-scope-CudANNo3.js";
import { r as resolveAgentConfig } from "./agent-scope-config-BfxErZq2.js";
//#region src/agents/tool-loop-detection-config.ts
function resolveToolLoopDetectionConfig(params) {
	const global = params.cfg?.tools?.loopDetection;
	const agent = params.agentId && params.cfg ? resolveAgentConfig(params.cfg, params.agentId)?.tools?.loopDetection : void 0;
	if (!agent) return global;
	if (!global) return agent;
	return {
		...global,
		...agent,
		detectors: {
			...global.detectors,
			...agent.detectors
		},
		postCompactionGuard: {
			...global.postCompactionGuard,
			...agent.postCompactionGuard
		}
	};
}
//#endregion
export { resolveToolLoopDetectionConfig as t };
