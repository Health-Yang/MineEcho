import { z as resolveCronMaxConcurrentRuns } from "./io-BlARNTf3.js";
import { n as resolveSubagentMaxConcurrent, t as resolveAgentMaxConcurrent } from "./agent-limits-Y6_vNNMs.js";
import { h as setCommandLaneConcurrency } from "./command-queue-fCeWoVd6.js";
//#region src/gateway/server-lanes.ts
function applyGatewayLaneConcurrency(cfg) {
	const cronMaxConcurrentRuns = resolveCronMaxConcurrentRuns(cfg.cron);
	setCommandLaneConcurrency("cron", cronMaxConcurrentRuns);
	setCommandLaneConcurrency("cron-nested", cronMaxConcurrentRuns);
	setCommandLaneConcurrency("main", resolveAgentMaxConcurrent(cfg));
	setCommandLaneConcurrency("subagent", resolveSubagentMaxConcurrent(cfg));
}
//#endregion
//#region src/gateway/server/hook-client-ip-config.ts
function resolveHookClientIpConfig(cfg) {
	return {
		trustedProxies: cfg.gateway?.trustedProxies,
		allowRealIpFallback: cfg.gateway?.allowRealIpFallback === true
	};
}
//#endregion
export { applyGatewayLaneConcurrency as n, resolveHookClientIpConfig as t };
