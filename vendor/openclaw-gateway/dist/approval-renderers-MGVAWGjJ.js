import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { d as buildPluginApprovalRequestMessage, f as buildPluginApprovalResolvedMessage, m as resolvePluginApprovalRequestAllowedDecisions } from "./plugin-approvals-C9xbHKhZ.js";
import { i as buildApprovalPresentationFromActionDescriptors, r as buildApprovalPresentation } from "./exec-approval-reply-CvpRi92u.js";
//#region src/plugin-sdk/approval-renderers.ts
const DEFAULT_ALLOWED_DECISIONS = [
	"allow-once",
	"allow-always",
	"deny"
];
/** Build a pending approval reply payload using the portable presentation API. */
function buildApprovalPendingReplyPayload(params) {
	const allowedDecisions = params.allowedDecisions ?? DEFAULT_ALLOWED_DECISIONS;
	const actions = params.actions?.length ? params.actions : void 0;
	const title = normalizeOptionalString(params.title);
	const description = normalizeOptionalString(params.description);
	const toolName = normalizeOptionalString(params.toolName);
	const pluginId = normalizeOptionalString(params.pluginId);
	return {
		text: params.text,
		presentation: actions ? buildApprovalPresentationFromActionDescriptors(actions) : buildApprovalPresentation({
			approvalId: params.approvalId,
			allowedDecisions
		}),
		channelData: {
			execApproval: {
				approvalId: params.approvalId,
				approvalSlug: params.approvalSlug,
				approvalKind: params.approvalKind ?? "exec",
				agentId: normalizeOptionalString(params.agentId),
				allowedDecisions,
				...actions ? { actions } : {},
				sessionKey: normalizeOptionalString(params.sessionKey),
				...title ? { title } : {},
				...description ? { description } : {},
				...params.severity ? { severity: params.severity } : {},
				...toolName ? { toolName } : {},
				...pluginId ? { pluginId } : {},
				state: "pending"
			},
			...params.channelData
		}
	};
}
/** Build a resolved approval reply payload with approval metadata but no controls. */
function buildApprovalResolvedReplyPayload(params) {
	return {
		text: params.text,
		channelData: {
			execApproval: {
				approvalId: params.approvalId,
				approvalSlug: params.approvalSlug,
				state: "resolved"
			},
			...params.channelData
		}
	};
}
function buildPluginApprovalPendingReplyPayload(params) {
	return buildApprovalPendingReplyPayload({
		approvalKind: "plugin",
		approvalId: params.request.id,
		approvalSlug: params.approvalSlug ?? params.request.id.slice(0, 8),
		text: params.text ?? buildPluginApprovalRequestMessage(params.request, params.nowMs),
		allowedDecisions: params.allowedDecisions ?? resolvePluginApprovalRequestAllowedDecisions(params.request.request),
		actions: params.request.request.actions ?? void 0,
		agentId: params.request.request.agentId,
		sessionKey: params.request.request.sessionKey,
		title: params.request.request.title,
		description: params.request.request.description,
		severity: params.request.request.severity,
		toolName: params.request.request.toolName,
		pluginId: params.request.request.pluginId,
		channelData: params.channelData
	});
}
function buildPluginApprovalResolvedReplyPayload(params) {
	return buildApprovalResolvedReplyPayload({
		approvalId: params.resolved.id,
		approvalSlug: params.approvalSlug ?? params.resolved.id.slice(0, 8),
		text: params.text ?? buildPluginApprovalResolvedMessage(params.resolved),
		channelData: params.channelData
	});
}
//#endregion
export { buildPluginApprovalResolvedReplyPayload as i, buildApprovalResolvedReplyPayload as n, buildPluginApprovalPendingReplyPayload as r, buildApprovalPendingReplyPayload as t };
