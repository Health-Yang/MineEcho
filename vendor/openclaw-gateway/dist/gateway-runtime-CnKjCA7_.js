import "./net-ziAus6sd.js";
import "./auth-CbKYHGo4.js";
import "./client-D_fPrX3v.js";
import "./protocol-BkfNT2Bp.js";
import "./operator-approvals-client-HIkR19p1.js";
import "./gateway-rpc-D3vd8eva.js";
import "./hosted-plugin-surface-url-DJuleBwa.js";
import "./node-command-policy-7dlnrPMy.js";
import "./nodes.helpers-pWq0E7xD.js";
import "./startup-auth-DBw8tWxq.js";
//#region src/gateway/channel-status-patches.ts
function createConnectedChannelStatusPatch(at = Date.now()) {
	return {
		connected: true,
		lastConnectedAt: at,
		lastEventAt: at
	};
}
function createTransportActivityStatusPatch(at = Date.now()) {
	return { lastTransportActivityAt: at };
}
//#endregion
export { createTransportActivityStatusPatch as n, createConnectedChannelStatusPatch as t };
