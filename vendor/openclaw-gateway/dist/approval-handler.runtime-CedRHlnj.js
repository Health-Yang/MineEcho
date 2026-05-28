import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { f as buildPluginApprovalResolvedMessage, u as buildPluginApprovalExpiredMessage } from "./plugin-approvals-C9xbHKhZ.js";
import { t as buildChannelApprovalNativeTargetKey } from "./approval-native-target-key-CygHVcC3.js";
import "./runtime-env-CcOqZeJj.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { r as createChannelApprovalNativeRuntimeAdapter } from "./approval-handler-runtime-BJGaOTXR.js";
import "./approval-handler-runtime-a-DiOAZU.js";
import "./approval-native-runtime-0Hr9Qyul.js";
import { n as buildApprovalResolvedReplyPayload } from "./approval-renderers-MGVAWGjJ.js";
import { i as buildApprovalReactionPendingContent, r as buildApprovalReactionHint } from "./approval-reaction-runtime-Ca4ba5X9.js";
import "./approval-runtime-DVCqoMA9.js";
import { c as parseIMessageTarget, o as normalizeIMessageHandle } from "./targets-BQLF_yw-.js";
import { d as unregisterIMessageApprovalReactionTarget, l as registerIMessageApprovalReactionTarget, n as normalizeIMessageMessagingTarget } from "./normalize-C6-Ial3a.js";
import { t as sendMessageIMessage } from "./send-KkLSSs9Y.js";
//#region extensions/imessage/src/approval-handler.runtime.ts
const log = createSubsystemLogger("imessage/approvals");
function buildPendingPayload(params) {
	const pendingContent = buildApprovalReactionPendingContent({
		request: params.request,
		view: params.view,
		nowMs: params.nowMs
	});
	if (params.approvalKind === "plugin") return {
		text: [pendingContent.manualFallbackPayload.text, buildApprovalReactionHint({ allowedDecisions: pendingContent.reactionPayload.allowedDecisions })].filter(Boolean).join("\n\n"),
		allowedDecisions: pendingContent.reactionPayload.allowedDecisions
	};
	return {
		text: pendingContent.reactionPayload.text ?? "",
		allowedDecisions: pendingContent.reactionPayload.allowedDecisions
	};
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
	return normalizeOptionalString(params.plannedAccountId) ?? normalizeOptionalString(params.contextAccountId);
}
function buildConversationKeyForTarget(to) {
	try {
		const parsed = parseIMessageTarget(to);
		if (parsed.kind === "chat_id") return { chatId: parsed.chatId };
		if (parsed.kind === "chat_guid") return { chatGuid: parsed.chatGuid };
		if (parsed.kind === "chat_identifier") return { chatIdentifier: parsed.chatIdentifier };
		const handle = normalizeIMessageHandle(parsed.to);
		return handle ? { handle } : null;
	} catch {
		return null;
	}
}
const imessageApprovalNativeRuntime = createChannelApprovalNativeRuntimeAdapter({
	eventKinds: ["exec", "plugin"],
	availability: {
		isConfigured: ({ context }) => Boolean(context),
		shouldHandle: ({ context }) => Boolean(context)
	},
	presentation: {
		buildPendingPayload: ({ request, approvalKind, nowMs, view }) => buildPendingPayload({
			request,
			approvalKind,
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
		prepareTarget: ({ plannedTarget, accountId }) => {
			const to = normalizeIMessageMessagingTarget(plannedTarget.target.to);
			if (!to) return null;
			const prepared = {
				to,
				accountId: resolvePreparedAccountId({
					plannedAccountId: plannedTarget.target.accountId,
					contextAccountId: accountId
				})
			};
			return {
				dedupeKey: `${prepared.accountId ?? ""}:${buildChannelApprovalNativeTargetKey({ to: prepared.to })}`,
				target: prepared
			};
		},
		deliverPending: async ({ cfg, preparedTarget, pendingPayload }) => {
			const guid = (await sendMessageIMessage(preparedTarget.to, pendingPayload.text, {
				config: cfg,
				...preparedTarget.accountId ? { accountId: preparedTarget.accountId } : {}
			})).guid;
			if (!guid) return null;
			const conversation = buildConversationKeyForTarget(preparedTarget.to);
			if (!conversation) return null;
			return {
				...preparedTarget.accountId ? { accountId: preparedTarget.accountId } : {},
				to: preparedTarget.to,
				conversation,
				messageId: guid
			};
		},
		updateEntry: async ({ cfg, entry, payload }) => {
			await sendMessageIMessage(entry.to, payload.text, {
				config: cfg,
				...entry.accountId ? { accountId: entry.accountId } : {},
				replyToId: entry.messageId
			});
		}
	},
	interactions: {
		bindPending: ({ entry, request, view, pendingPayload }) => {
			const accountId = entry.accountId?.trim();
			if (!accountId) {
				log.error(`imessage approvals: refusing to bind reaction target for ${request.id}; missing accountId in prepared entry`);
				return null;
			}
			const ttlMs = view.expiresAtMs - Date.now();
			if (ttlMs <= 0) {
				log.error(`imessage approvals: refusing to bind reaction target for ${request.id}; approval already expired at bind time`);
				return null;
			}
			return registerIMessageApprovalReactionTarget({
				accountId,
				conversation: entry.conversation,
				messageId: entry.messageId,
				approvalId: request.id,
				allowedDecisions: pendingPayload.allowedDecisions,
				ttlMs
			}) ? true : null;
		},
		unbindPending: ({ entry }) => {
			const accountId = entry.accountId?.trim();
			if (!accountId) return;
			unregisterIMessageApprovalReactionTarget({
				accountId,
				conversation: entry.conversation,
				messageId: entry.messageId
			});
		},
		cancelDelivered: ({ entry }) => {
			const accountId = entry.accountId?.trim();
			if (!accountId) return;
			unregisterIMessageApprovalReactionTarget({
				accountId,
				conversation: entry.conversation,
				messageId: entry.messageId
			});
		}
	},
	observe: { onDeliveryError: ({ error, request }) => {
		log.error(`imessage approvals: failed to send request ${request.id}: ${String(error)}`);
	} }
});
//#endregion
export { imessageApprovalNativeRuntime };
