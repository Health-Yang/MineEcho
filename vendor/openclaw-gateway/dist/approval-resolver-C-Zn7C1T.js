import { t as isApprovalNotFoundError } from "./approval-errors-DDTMcUp-.js";
import "./error-runtime-BFXFWfvK.js";
import { t as resolveApprovalOverGateway } from "./approval-gateway-resolver-Co1AXxAF.js";
import "./approval-gateway-runtime-DUP3xGBL.js";
//#region extensions/imessage/src/approval-resolver.ts
async function resolveIMessageApproval(params) {
	await resolveApprovalOverGateway({
		cfg: params.cfg,
		approvalId: params.approvalId,
		decision: params.decision,
		senderId: params.senderId,
		gatewayUrl: params.gatewayUrl,
		clientDisplayName: `iMessage approval (${params.senderId?.trim() || "unknown"})`
	});
}
//#endregion
export { isApprovalNotFoundError, resolveIMessageApproval };
