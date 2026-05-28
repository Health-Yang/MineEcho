import "./session-binding-service-C_ndVxi-.js";
import "./pairing-store-BHCtszQV.js";
import "./thread-bindings-policy-lrMOhQXC.js";
import "./conversation-binding-jzFwkanA.js";
import "./binding-registry-BmHBIFuT.js";
import "./session-B3CfqbFv.js";
import "./channel-access-compat-IL3vJ99R.js";
import "./binding-targets-Xq4RLJcg.js";
import "./binding-routing-BJ9sblon.js";
import "./pairing-labels-BK3ZAmH6.js";
//#region src/channels/session-meta.ts
let inboundSessionRuntimePromise = null;
function loadInboundSessionRuntime() {
	inboundSessionRuntimePromise ??= import("./inbound.runtime.js");
	return inboundSessionRuntimePromise;
}
async function recordInboundSessionMetaSafe(params) {
	const runtime = await loadInboundSessionRuntime();
	const storePath = runtime.resolveStorePath(params.cfg.session?.store, { agentId: params.agentId });
	try {
		await runtime.recordSessionMetaFromInbound({
			storePath,
			sessionKey: params.sessionKey,
			ctx: params.ctx
		});
	} catch (err) {
		params.onError?.(err);
	}
}
//#endregion
export { recordInboundSessionMetaSafe as t };
