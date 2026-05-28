import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import "./account-id-B0YIFDpA.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { f as buildPluginApprovalResolvedMessage, u as buildPluginApprovalExpiredMessage } from "./plugin-approvals-C9xbHKhZ.js";
import { t as buildChannelApprovalNativeTargetKey } from "./approval-native-target-key-CygHVcC3.js";
import "./runtime-env-CcOqZeJj.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { r as createChannelApprovalNativeRuntimeAdapter } from "./approval-handler-runtime-BJGaOTXR.js";
import "./approval-handler-runtime-a-DiOAZU.js";
import "./approval-native-runtime-0Hr9Qyul.js";
import { n as buildApprovalResolvedReplyPayload } from "./approval-renderers-MGVAWGjJ.js";
import { i as buildApprovalReactionPendingContent } from "./approval-reaction-runtime-Ca4ba5X9.js";
import "./approval-runtime-DVCqoMA9.js";
import { d as normalizeSignalMessagingTarget } from "./identity-DoC1DJz7.js";
import { c as resolveSignalApprovalTargetAuthorKeys, i as hasSignalApprovalReactionApprovers, l as unregisterSignalApprovalReactionTarget, o as registerSignalApprovalReactionTarget, r as sendTypingSignal, s as resolveSignalApprovalConversationKey, t as sendMessageSignal } from "./send-uGMevXGS.js";
//#region extensions/signal/src/approval-handler.runtime.ts
const log = createSubsystemLogger("signal/approvals");
function readSignalApprovalRuntimeContext(context) {
	const value = context;
	return {
		baseUrl: typeof value?.baseUrl === "string" && value.baseUrl.trim() ? value.baseUrl.trim() : void 0,
		account: typeof value?.account === "string" && value.account.trim() ? value.account.trim() : void 0,
		accountUuid: typeof value?.accountUuid === "string" && value.accountUuid.trim() ? value.accountUuid.trim() : void 0
	};
}
function buildPendingPayload(params) {
	return buildApprovalReactionPendingContent(params);
}
function buildResolvedText(params) {
	if (params.view.approvalKind === "plugin") return buildPluginApprovalResolvedMessage(params.resolved);
	const resolvedByText = params.resolved.resolvedBy ? ` Resolved by ${params.resolved.resolvedBy}.` : "";
	return buildApprovalResolvedReplyPayload({
		approvalId: params.request.id,
		approvalSlug: params.request.id.slice(0, 8),
		text: `✅ Exec approval ${params.resolved.decision}.${resolvedByText} ID: ${params.request.id}`
	}).text ?? "";
}
function buildExpiredText(params) {
	if (params.view.approvalKind === "plugin") return buildPluginApprovalExpiredMessage(params.request);
	return `⏱️ Exec approval expired. ID: ${params.request.id}`;
}
function resolvePreparedAccountId(params) {
	return normalizeOptionalString(params.plannedAccountId) ?? normalizeOptionalString(params.contextAccountId) ?? "default";
}
const signalApprovalNativeRuntime = createChannelApprovalNativeRuntimeAdapter({
	eventKinds: ["exec", "plugin"],
	availability: {
		isConfigured: ({ context }) => Boolean(context),
		shouldHandle: ({ context }) => Boolean(context)
	},
	presentation: {
		buildPendingPayload: ({ request, nowMs, view }) => buildPendingPayload({
			request,
			nowMs,
			view
		}),
		buildResolvedResult: ({ request, resolved, view }) => ({
			kind: "update",
			payload: { text: buildResolvedText({
				request,
				resolved,
				view
			}) }
		}),
		buildExpiredResult: ({ request, view }) => ({
			kind: "update",
			payload: { text: buildExpiredText({
				request,
				view
			}) }
		})
	},
	transport: {
		prepareTarget: ({ plannedTarget, accountId, context }) => {
			const to = normalizeSignalMessagingTarget(plannedTarget.target.to);
			if (!to) return null;
			const runtimeContext = readSignalApprovalRuntimeContext(context);
			const targetAuthorKeys = resolveSignalApprovalTargetAuthorKeys({
				targetAuthor: runtimeContext.account,
				targetAuthorUuid: runtimeContext.accountUuid
			});
			const prepared = {
				to,
				accountId: resolvePreparedAccountId({
					plannedAccountId: plannedTarget.target.accountId,
					contextAccountId: accountId
				}),
				...runtimeContext.baseUrl ? { baseUrl: runtimeContext.baseUrl } : {},
				...runtimeContext.account ? { account: runtimeContext.account } : {},
				...runtimeContext.accountUuid ? { accountUuid: runtimeContext.accountUuid } : {},
				targetAuthorKeys
			};
			return {
				dedupeKey: `${prepared.accountId}:${buildChannelApprovalNativeTargetKey({ to: prepared.to })}`,
				target: prepared
			};
		},
		deliverPending: async ({ cfg, preparedTarget, pendingPayload }) => {
			await sendTypingSignal(preparedTarget.to, {
				cfg,
				accountId: preparedTarget.accountId,
				...preparedTarget.baseUrl ? { baseUrl: preparedTarget.baseUrl } : {},
				...preparedTarget.account ? { account: preparedTarget.account } : {}
			}).catch(() => {});
			const reactionsActive = preparedTarget.targetAuthorKeys.length > 0 && hasSignalApprovalReactionApprovers({
				cfg,
				accountId: preparedTarget.accountId
			});
			const payload = reactionsActive ? pendingPayload.reactionPayload : pendingPayload.manualFallbackPayload;
			const result = await sendMessageSignal(preparedTarget.to, payload.text ?? "", {
				cfg,
				accountId: preparedTarget.accountId,
				...preparedTarget.baseUrl ? { baseUrl: preparedTarget.baseUrl } : {},
				...preparedTarget.account ? { account: preparedTarget.account } : {},
				textMode: "plain"
			});
			if (!result.messageId || result.messageId === "unknown") return null;
			const conversationKey = resolveSignalApprovalConversationKey(preparedTarget.to);
			if (!conversationKey) return null;
			return {
				accountId: preparedTarget.accountId,
				to: preparedTarget.to,
				conversationKey,
				messageId: result.messageId,
				targetAuthorKeys: preparedTarget.targetAuthorKeys,
				reactionsActive,
				...preparedTarget.baseUrl ? { baseUrl: preparedTarget.baseUrl } : {},
				...preparedTarget.account ? { account: preparedTarget.account } : {}
			};
		},
		updateEntry: async ({ cfg, entry, payload }) => {
			await sendMessageSignal(entry.to, payload.text, {
				cfg,
				accountId: entry.accountId,
				...entry.baseUrl ? { baseUrl: entry.baseUrl } : {},
				...entry.account ? { account: entry.account } : {},
				textMode: "plain"
			});
		}
	},
	interactions: {
		bindPending: ({ entry, request, view, pendingPayload }) => {
			if (!entry.reactionsActive) return null;
			return registerSignalApprovalReactionTarget({
				accountId: entry.accountId,
				conversationKey: entry.conversationKey,
				messageId: entry.messageId,
				approvalId: request.id,
				allowedDecisions: pendingPayload.reactionPayload.allowedDecisions,
				targetAuthorKeys: entry.targetAuthorKeys,
				route: {
					deliveryMode: "session",
					...normalizeOptionalString(request.request.agentId) ? { agentId: normalizeOptionalString(request.request.agentId) } : {},
					...normalizeOptionalString(request.request.sessionKey) ? { sessionKey: normalizeOptionalString(request.request.sessionKey) } : {}
				},
				routeAllowed: true,
				ttlMs: Math.max(1, view.expiresAtMs - Date.now())
			}) ? true : null;
		},
		unbindPending: ({ entry }) => {
			unregisterSignalApprovalReactionTarget({
				accountId: entry.accountId,
				conversationKey: entry.conversationKey,
				messageId: entry.messageId
			});
		},
		cancelDelivered: ({ entry }) => {
			unregisterSignalApprovalReactionTarget({
				accountId: entry.accountId,
				conversationKey: entry.conversationKey,
				messageId: entry.messageId
			});
		}
	},
	observe: { onDeliveryError: ({ error, request }) => {
		log.error(`signal approvals: failed to send request ${request.id}: ${String(error)}`);
	} }
});
//#endregion
export { signalApprovalNativeRuntime };
