import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { t as buildChannelApprovalNativeTargetKey } from "./approval-native-target-key-CygHVcC3.js";
import "./runtime-env-CcOqZeJj.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { c as buildExecApprovalPendingReplyPayload, i as buildApprovalPresentationFromActionDescriptors } from "./exec-approval-reply-CvpRi92u.js";
import { r as createChannelApprovalNativeRuntimeAdapter } from "./approval-handler-runtime-BJGaOTXR.js";
import "./approval-handler-runtime-a-DiOAZU.js";
import "./approval-native-runtime-0Hr9Qyul.js";
import { r as buildPluginApprovalPendingReplyPayload } from "./approval-renderers-MGVAWGjJ.js";
import "./approval-reply-runtime-tyqyLKul.js";
import { a as isTelegramExecApprovalHandlerConfigured, u as shouldHandleTelegramExecApprovalRequest } from "./exec-approvals-BiFNs5Sh.js";
import { t as resolveTelegramInlineButtons } from "./button-types-2wGRZKBe.js";
import { i as editMessageReplyMarkupTelegram, p as sendTypingTelegram, u as sendMessageTelegram } from "./send-C2dmqXHG.js";
//#region extensions/telegram/src/approval-handler.runtime.ts
const log = createSubsystemLogger("telegram/approvals");
function resolveHandlerContext(params) {
	const context = params.context;
	const accountId = normalizeOptionalString(params.accountId) ?? "";
	if (!context?.token || !accountId) return null;
	return {
		accountId,
		context
	};
}
function listDecisionActions(view) {
	return view.actions.flatMap((action) => action.kind === "decision" ? [action.decision] : []);
}
function buildTelegramApprovalCommandText(params) {
	return `/approve ${params.approvalCommandId} ${params.decision}`;
}
function listNativeButtonActions(view) {
	return view.actions.flatMap((action) => action.kind === "decision" ? [{
		kind: "decision",
		decision: action.decision,
		label: action.label,
		style: action.style,
		command: buildTelegramApprovalCommandText({
			approvalCommandId: view.approvalId,
			decision: action.decision
		})
	}] : []);
}
function buildPendingPayload(params) {
	return {
		text: (params.approvalKind === "plugin" ? buildPluginApprovalPendingReplyPayload({
			request: params.request,
			nowMs: params.nowMs
		}) : buildExecApprovalPendingReplyPayload({
			approvalId: params.request.id,
			approvalSlug: params.request.id.slice(0, 8),
			approvalCommandId: params.request.id,
			warningText: params.view.approvalKind === "exec" ? params.view.warningText ?? void 0 : void 0,
			command: params.view.approvalKind === "exec" ? params.view.commandText : "",
			cwd: params.view.approvalKind === "exec" ? params.view.cwd ?? void 0 : void 0,
			host: params.view.approvalKind === "exec" && params.view.host === "node" ? "node" : "gateway",
			nodeId: params.view.approvalKind === "exec" ? params.view.nodeId ?? void 0 : void 0,
			allowedDecisions: listDecisionActions(params.view),
			expiresAtMs: params.request.expiresAtMs,
			nowMs: params.nowMs
		})).text ?? "",
		buttons: resolveTelegramInlineButtons({ presentation: buildApprovalPresentationFromActionDescriptors(listNativeButtonActions(params.view)) })
	};
}
const telegramApprovalNativeRuntime = createChannelApprovalNativeRuntimeAdapter({
	eventKinds: ["exec", "plugin"],
	availability: {
		isConfigured: (params) => {
			const resolved = resolveHandlerContext(params);
			return resolved ? isTelegramExecApprovalHandlerConfigured({
				cfg: params.cfg,
				accountId: resolved.accountId
			}) : false;
		},
		shouldHandle: (params) => {
			const resolved = resolveHandlerContext(params);
			return resolved ? shouldHandleTelegramExecApprovalRequest({
				cfg: params.cfg,
				accountId: resolved.accountId,
				request: params.request
			}) : false;
		}
	},
	presentation: {
		buildPendingPayload: ({ request, approvalKind, nowMs, view }) => buildPendingPayload({
			request,
			approvalKind,
			nowMs,
			view
		}),
		buildResolvedResult: () => ({ kind: "clear-actions" }),
		buildExpiredResult: () => ({ kind: "clear-actions" })
	},
	transport: {
		prepareTarget: ({ plannedTarget }) => ({
			dedupeKey: buildChannelApprovalNativeTargetKey(plannedTarget.target),
			target: {
				chatId: plannedTarget.target.to,
				messageThreadId: typeof plannedTarget.target.threadId === "number" ? plannedTarget.target.threadId : void 0
			}
		}),
		deliverPending: async ({ cfg, accountId, context, preparedTarget, pendingPayload }) => {
			const resolved = resolveHandlerContext({
				cfg,
				accountId,
				context
			});
			if (!resolved) return null;
			const sendTyping = resolved.context.deps?.sendTyping ?? sendTypingTelegram;
			const sendMessage = resolved.context.deps?.sendMessage ?? sendMessageTelegram;
			await sendTyping(preparedTarget.chatId, {
				cfg,
				token: resolved.context.token,
				accountId: resolved.accountId,
				...preparedTarget.messageThreadId != null ? { messageThreadId: preparedTarget.messageThreadId } : {}
			}).catch(() => {});
			const result = await sendMessage(preparedTarget.chatId, pendingPayload.text, {
				cfg,
				token: resolved.context.token,
				accountId: resolved.accountId,
				buttons: pendingPayload.buttons,
				...preparedTarget.messageThreadId != null ? { messageThreadId: preparedTarget.messageThreadId } : {}
			});
			return {
				chatId: result.chatId,
				messageId: result.messageId
			};
		}
	},
	interactions: { clearPendingActions: async ({ cfg, accountId, context, entry }) => {
		const resolved = resolveHandlerContext({
			cfg,
			accountId,
			context
		});
		if (!resolved) return;
		await (resolved.context.deps?.editReplyMarkup ?? editMessageReplyMarkupTelegram)(entry.chatId, entry.messageId, [], {
			cfg,
			token: resolved.context.token,
			accountId: resolved.accountId
		});
	} },
	observe: { onDeliveryError: ({ error, request }) => {
		log.error(`telegram approvals: failed to send request ${request.id}: ${String(error)}`);
	} }
});
//#endregion
export { telegramApprovalNativeRuntime };
