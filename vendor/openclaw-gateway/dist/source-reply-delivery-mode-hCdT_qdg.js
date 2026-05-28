import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import "./message-channel-core-NW6lw3Ys.js";
import { u as normalizeMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { t as normalizeChatType } from "./chat-type-DeA3YwAD.js";
import { i as isExplicitCommandTurn, s as resolveCommandTurnContext } from "./command-turn-context-Cqhb6nXp.js";
import { r as isControlCommandMessage } from "./command-detection-BHZ65i3a.js";
//#region src/auto-reply/command-turn-detection.ts
function resolveCommandBody(input) {
	return normalizeOptionalString(input.CommandBody) ?? normalizeOptionalString(input.BodyForCommands) ?? normalizeOptionalString(input.RawBody) ?? normalizeOptionalString(input.Body);
}
function resolveVisibleMessageBody(input) {
	return normalizeOptionalString(input.RawBody) ?? normalizeOptionalString(input.Body);
}
function resolveStructuredNormalFallbackBody(input) {
	const visibleBody = resolveVisibleMessageBody(input);
	if (!/^[!/]/.test(visibleBody ?? "")) return;
	return resolveCommandBody(input) ?? visibleBody;
}
function hasCommandSourceMetadata(input) {
	return input.CommandSource === "native" || input.CommandSource === "text" || input.CommandSource === "message";
}
function isExplicitCommandTurnContext(input, cfg) {
	if (isExplicitCommandTurn(resolveCommandTurnContext(input))) return true;
	if (input.CommandSource === "native" || input.CommandSource === "text") return false;
	const fallbackBody = input.CommandTurn !== void 0 || hasCommandSourceMetadata(input) ? resolveStructuredNormalFallbackBody(input) : resolveCommandBody(input);
	return input.CommandAuthorized === true && isControlCommandMessage(fallbackBody, cfg, { botUsername: normalizeOptionalString(input.BotUsername) });
}
//#endregion
//#region src/auto-reply/reply/source-reply-delivery-mode.ts
function isExplicitSourceReplyCommand(ctx, cfg) {
	return isExplicitCommandTurnContext(ctx, cfg);
}
function isUnauthorizedTextSlashCommand(ctx) {
	const commandTurn = resolveCommandTurnContext(ctx);
	return commandTurn.kind === "text-slash" && !commandTurn.authorized && (commandTurn.commandName !== void 0 || commandTurn.body?.trim().startsWith("/") === true);
}
function isInternalRoomEvent(ctx) {
	return ctx.InboundEventKind === "room_event" && isInternalSourceReplyChannel(ctx);
}
function isInternalSourceReplyChannel(ctx) {
	const providerChannel = normalizeMessageChannel(ctx.Provider);
	const surfaceChannel = normalizeMessageChannel(ctx.Surface);
	return (providerChannel ?? surfaceChannel) === "webchat" && (surfaceChannel === "webchat" || !surfaceChannel) && ctx.ExplicitDeliverRoute !== true;
}
function resolveSourceReplyDeliveryMode(params) {
	if (params.strictMessageToolOnly === true) return "message_tool_only";
	if (params.ctx.InboundEventKind === "room_event" && !isInternalRoomEvent(params.ctx)) return "message_tool_only";
	if (params.requested && (params.requested !== "message_tool_only" || params.messageToolAvailable !== false)) return params.requested;
	if (isExplicitSourceReplyCommand(params.ctx, params.cfg)) return "automatic";
	const chatType = normalizeChatType(params.ctx.ChatType);
	if ((chatType === "group" || chatType === "channel") && isUnauthorizedTextSlashCommand(params.ctx)) return "message_tool_only";
	let mode;
	if (chatType === "group" || chatType === "channel") mode = (params.cfg.messages?.groupChat?.visibleReplies ?? params.cfg.messages?.visibleReplies) === "message_tool" ? "message_tool_only" : "automatic";
	else mode = (params.cfg.messages?.visibleReplies ?? (isInternalSourceReplyChannel(params.ctx) ? "automatic" : params.defaultVisibleReplies)) === "message_tool" ? "message_tool_only" : "automatic";
	if (mode === "message_tool_only" && params.messageToolAvailable === false) return "automatic";
	return mode;
}
function resolveSourceReplyVisibilityPolicy(params) {
	const sourceReplyDeliveryMode = resolveSourceReplyDeliveryMode({
		cfg: params.cfg,
		ctx: params.ctx,
		requested: params.requested,
		strictMessageToolOnly: params.strictMessageToolOnly,
		messageToolAvailable: params.messageToolAvailable,
		defaultVisibleReplies: params.defaultVisibleReplies
	});
	const sendPolicyDenied = params.sendPolicy === "deny";
	const suppressAutomaticSourceDelivery = sourceReplyDeliveryMode === "message_tool_only";
	const suppressDelivery = sendPolicyDenied || suppressAutomaticSourceDelivery;
	const deliverySuppressionReason = sendPolicyDenied ? "sendPolicy: deny" : suppressAutomaticSourceDelivery ? "sourceReplyDeliveryMode: message_tool_only" : "";
	return {
		sourceReplyDeliveryMode,
		sendPolicyDenied,
		suppressAutomaticSourceDelivery,
		suppressDelivery,
		suppressHookUserDelivery: params.suppressAcpChildUserDelivery === true || suppressDelivery,
		suppressHookReplyLifecycle: sendPolicyDenied || params.suppressAcpChildUserDelivery === true || params.explicitSuppressTyping === true || params.shouldSuppressTyping === true,
		suppressTyping: sendPolicyDenied || params.explicitSuppressTyping === true || params.shouldSuppressTyping === true,
		deliverySuppressionReason
	};
}
//#endregion
export { resolveSourceReplyVisibilityPolicy as i, isInternalSourceReplyChannel as n, resolveSourceReplyDeliveryMode as r, isExplicitSourceReplyCommand as t };
