//#region src/agents/openai-compatible-conversation-turn.ts
function hasNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
function hasNonEmptyContentPart(part) {
	if (!part || typeof part !== "object") return false;
	const record = part;
	if (record.type === "text") return hasNonEmptyString(record.text);
	return true;
}
function hasNonEmptyMessageContent(content) {
	if (hasNonEmptyString(content)) return true;
	if (!Array.isArray(content)) return false;
	return content.some(hasNonEmptyContentPart);
}
function hasAssistantToolCall(message) {
	const toolCalls = message.tool_calls;
	return Array.isArray(toolCalls) && toolCalls.some((toolCall) => {
		return Boolean(toolCall && typeof toolCall === "object");
	});
}
function hasOpenAICompatibleConversationTurn(messages) {
	if (!Array.isArray(messages)) return false;
	return messages.some((message) => {
		if (!message || typeof message !== "object") return false;
		const record = message;
		if (record.role === "user") return hasNonEmptyMessageContent(record.content);
		if (record.role === "assistant") return hasNonEmptyMessageContent(record.content) || hasAssistantToolCall(record);
		return false;
	});
}
//#endregion
export { hasOpenAICompatibleConversationTurn as t };
