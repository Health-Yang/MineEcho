import { t as normalizeChatType } from "./chat-type-DeA3YwAD.js";
import { t as deriveSessionChatTypeFromKey } from "./session-chat-type-shared-CloMfBfk.js";
import { r as resolveSourceReplyDeliveryMode } from "./source-reply-delivery-mode-hCdT_qdg.js";
//#region src/auto-reply/reply/completion-delivery-policy.ts
function resolveCompletionChatType(params) {
	const explicit = normalizeChatType(params.requesterEntry?.chatType ?? params.requesterEntry?.origin?.chatType ?? void 0);
	if (explicit) return explicit;
	for (const key of [params.targetRequesterSessionKey, params.requesterSessionKey]) {
		const derived = deriveSessionChatTypeFromKey(key);
		if (derived !== "unknown") return derived;
	}
	return inferCompletionChatTypeFromTarget(params.directOrigin?.to ?? params.requesterSessionOrigin?.to);
}
function completionRequiresMessageToolDelivery(params) {
	return resolveSourceReplyDeliveryMode({
		cfg: params.cfg,
		ctx: { ChatType: resolveCompletionChatType(params) },
		messageToolAvailable: params.messageToolAvailable
	}) === "message_tool_only";
}
function shouldRouteCompletionThroughRequesterSession(sessionKey) {
	const chatType = deriveSessionChatTypeFromKey(sessionKey);
	return chatType === "group" || chatType === "channel";
}
function inferCompletionChatTypeFromTarget(to) {
	const normalized = to?.trim().toLowerCase();
	if (!normalized) return "unknown";
	if (normalized.startsWith("group:")) return "group";
	if (normalized.startsWith("channel:") || normalized.startsWith("thread:")) return "channel";
	if (normalized.startsWith("dm:") || normalized.startsWith("direct:") || normalized.startsWith("user:")) return "direct";
	return "unknown";
}
//#endregion
export { shouldRouteCompletionThroughRequesterSession as n, completionRequiresMessageToolDelivery as t };
