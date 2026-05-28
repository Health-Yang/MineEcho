import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import "./agent-scope-CudANNo3.js";
import { c as parseAgentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { l as normalizeAgentId, u as normalizeMainKey } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-BfxErZq2.js";
//#region src/agents/session-agent-binding.ts
/**
* Resolve the trusted active agent bound to a host-owned session reference.
*/
function resolveBoundAgentIdForSession(params) {
	const explicitAgentId = normalizeOptionalString(params.agentId);
	if (explicitAgentId) return normalizeAgentId(explicitAgentId);
	const normalizedSessionKey = normalizeOptionalString(params.sessionKey);
	if (!normalizedSessionKey) return;
	const parsed = parseAgentSessionKey(normalizedSessionKey);
	if (parsed?.agentId) return normalizeAgentId(parsed.agentId);
	const loweredSessionKey = normalizeLowercaseStringOrEmpty(normalizedSessionKey);
	const mainKey = normalizeMainKey(params.config?.session?.mainKey);
	if (loweredSessionKey === "main" || loweredSessionKey === mainKey) return resolveDefaultAgentId(params.config ?? {});
}
//#endregion
export { resolveBoundAgentIdForSession as t };
