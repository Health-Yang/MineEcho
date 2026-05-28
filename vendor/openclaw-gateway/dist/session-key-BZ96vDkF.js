import { v as toAgentStoreSessionKey } from "./session-key-yaI3D3Bl.js";
import { t as canonicalizeMainSessionAlias } from "./main-session-896o98eb.js";
//#region src/cron/isolated-agent/session-key.ts
function resolveCronAgentSessionKey(params) {
	const raw = toAgentStoreSessionKey({
		agentId: params.agentId,
		requestKey: params.sessionKey.trim(),
		mainKey: params.mainKey
	});
	return canonicalizeMainSessionAlias({
		cfg: params.cfg,
		agentId: params.agentId,
		sessionKey: raw
	});
}
//#endregion
export { resolveCronAgentSessionKey as t };
