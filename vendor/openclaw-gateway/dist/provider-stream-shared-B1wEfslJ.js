import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { n as parseStandalonePlainTextToolCallBlocks } from "./tool-payload-BwXNuCsb.js";
import "./anthropic-payload-policy-BMckDm45.js";
import { i as streamWithPayloadPatch } from "./moonshot-thinking-stream-wrappers-oygQHkq7.js";
import { randomUUID } from "node:crypto";
import { createAssistantMessageEventStream, streamSimple } from "@earendil-works/pi-ai";
//#region src/agents/pi-embedded-runner/zai-stream-wrappers.ts
/**
* Inject `tool_stream=true` so tool-call deltas stream in real time.
* Providers can disable this by setting `params.tool_stream=false`.
*
* @deprecated Provider-owned stream helper; do not use from third-party plugins.
*/
function createToolStreamWrapper(baseStreamFn, enabled) {
	const underlying = baseStreamFn ?? streamSimple;
	return (model, context, options) => {
		if (!enabled) return underlying(model, context, options);
		return streamWithPayloadPatch(underlying, model, context, options, (payloadObj) => {
			payloadObj.tool_stream = true;
		});
	};
}
/** @deprecated Z.ai provider-owned stream helper; do not use from third-party plugins. */
const createZaiToolStreamWrapper = createToolStreamWrapper;
//#endregion
//#region src/plugin-sdk/provider-stream-shared.ts
function composeProviderStreamWrappers(baseStreamFn, ...wrappers) {
	return wrappers.reduce((streamFn, wrapper) => wrapper ? wrapper(streamFn) : streamFn, baseStreamFn);
}
function toRecord(value) {
	return value && typeof value === "object" ? value : void 0;
}
function resolveContextToolNames(context) {
	const tools = context.tools;
	if (!Array.isArray(tools)) return /* @__PURE__ */ new Set();
	const names = tools.map((tool) => {
		const record = toRecord(tool);
		return typeof record?.name === "string" && record.name.trim() ? record.name : void 0;
	}).filter((name) => Boolean(name));
	return new Set(names);
}
function couldStillBePlainTextToolCall(text, toolNames) {
	if (text.length > 256e3) return false;
	const trimmed = text.trimStart();
	return trimmed.length === 0 || couldStillBeBracketedToolCall(trimmed, toolNames) || couldStillBeHarmonyToolCall(trimmed, toolNames);
}
function matchesLiteralPrefix(text, literal) {
	return literal.startsWith(text) || text.startsWith(literal);
}
function skipHorizontalWhitespace(text, start) {
	let cursor = start;
	while (text[cursor] === " " || text[cursor] === "	") cursor += 1;
	return cursor;
}
function isToolNameChar(char) {
	return Boolean(char && /[A-Za-z0-9_-]/.test(char));
}
function hasToolNamePrefix(toolNames, prefix) {
	for (const toolName of toolNames) if (toolName.startsWith(prefix)) return true;
	return false;
}
function couldStillBeJsonPayload(text, start) {
	let cursor = start;
	while (cursor < text.length && /\s/.test(text[cursor] ?? "")) cursor += 1;
	return cursor >= text.length || text[cursor] === "{";
}
function couldStillBeBracketedToolCall(text, toolNames) {
	if (!text.startsWith("[")) return false;
	if (matchesLiteralPrefix(text, "[tool:")) {
		if (text.length <= 6) return true;
		let cursor = 6;
		while (isToolNameChar(text[cursor])) cursor += 1;
		const name = text.slice(6, cursor);
		if (!name || !hasToolNamePrefix(toolNames, name)) return false;
		if (cursor >= text.length) return true;
		if (text[cursor] !== "]") return false;
		return couldStillBeJsonPayload(text, cursor + 1);
	}
	let cursor = 1;
	while (isToolNameChar(text[cursor])) cursor += 1;
	const name = text.slice(1, cursor);
	if (!name || !hasToolNamePrefix(toolNames, name)) return false;
	if (cursor >= text.length) return true;
	if (text[cursor] !== "]") return false;
	cursor = skipHorizontalWhitespace(text, cursor + 1);
	if (cursor >= text.length) return true;
	if (text[cursor] === "\r") {
		if (cursor + 1 >= text.length) return true;
		return couldStillBeJsonPayload(text, text[cursor + 1] === "\n" ? cursor + 2 : cursor + 1);
	}
	if (text[cursor] !== "\n") return false;
	return couldStillBeJsonPayload(text, cursor + 1);
}
function couldStillBeHarmonyToolCall(text, toolNames) {
	const channelMarker = "<|channel|>";
	let cursor = 0;
	if (matchesLiteralPrefix(text, channelMarker)) {
		if (text.length <= 11) return true;
		cursor = 11;
	}
	const rest = text.slice(cursor);
	const channel = [
		"commentary",
		"analysis",
		"final"
	].find((candidate) => matchesLiteralPrefix(rest, candidate));
	if (!channel) return false;
	if (rest.length <= channel.length) return true;
	cursor += channel.length;
	cursor = skipHorizontalWhitespace(text, cursor);
	if (cursor >= text.length) return true;
	const toMarker = "to=";
	const toRest = text.slice(cursor);
	if (!matchesLiteralPrefix(toRest, toMarker)) return false;
	if (toRest.length <= 3) return true;
	cursor += 3;
	const nameStart = cursor;
	while (isToolNameChar(text[cursor])) cursor += 1;
	const name = text.slice(nameStart, cursor);
	if (!name || !hasToolNamePrefix(toolNames, name)) return false;
	if (cursor >= text.length) return true;
	cursor = skipHorizontalWhitespace(text, cursor);
	if (cursor >= text.length) return true;
	if (!toolNames.has(name)) return false;
	const codeMarker = "code";
	const codeRest = text.slice(cursor);
	if (!matchesLiteralPrefix(codeRest, codeMarker)) return false;
	if (codeRest.length <= 4) return true;
	cursor += 4;
	while (cursor < text.length && /\s/.test(text[cursor] ?? "")) cursor += 1;
	if (cursor >= text.length) return true;
	if (matchesLiteralPrefix(text.slice(cursor), "<|message|>")) return true;
	return text[cursor] === "{";
}
function createSyntheticToolCallId() {
	return `call_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}
function createPlainTextToolCallBlock(parsed) {
	return {
		type: "toolCall",
		id: createSyntheticToolCallId(),
		name: parsed.name,
		arguments: parsed.arguments,
		partialArgs: JSON.stringify(parsed.arguments)
	};
}
function promotePlainTextToolCalls(message, toolNames) {
	const messageRecord = toRecord(message);
	if (!messageRecord) return;
	if (!Array.isArray(messageRecord.content)) {
		if (typeof messageRecord.content !== "string" || !messageRecord.content.trim()) return;
		const parsed = parseStandalonePlainTextToolCallBlocks(messageRecord.content, { allowedToolNames: toolNames });
		if (!parsed) return;
		return {
			...messageRecord,
			content: parsed.map(createPlainTextToolCallBlock),
			stopReason: "toolUse"
		};
	}
	if (messageRecord.content.some((block) => toRecord(block)?.type === "toolCall") || messageRecord.content.length === 0) return;
	let promoted = false;
	const nextContent = [];
	for (const block of messageRecord.content) {
		const blockRecord = toRecord(block);
		if (!blockRecord) return;
		if (blockRecord.type !== "text") {
			nextContent.push(blockRecord);
			continue;
		}
		const text = typeof blockRecord.text === "string" ? blockRecord.text : "";
		if (!text.trim()) continue;
		const parsed = parseStandalonePlainTextToolCallBlocks(text, { allowedToolNames: toolNames });
		if (!parsed) return;
		nextContent.push(...parsed.map(createPlainTextToolCallBlock));
		promoted = true;
	}
	if (!promoted) return;
	return {
		...messageRecord,
		content: nextContent,
		stopReason: "toolUse"
	};
}
function emitPromotedToolCallEvents(stream, message) {
	(Array.isArray(message.content) ? message.content : []).forEach((block, contentIndex) => {
		const record = toRecord(block);
		if (record?.type !== "toolCall") return;
		stream.push({
			type: "toolcall_start",
			contentIndex,
			partial: message
		});
		stream.push({
			type: "toolcall_delta",
			contentIndex,
			delta: typeof record.partialArgs === "string" ? record.partialArgs : "{}",
			partial: message
		});
	});
}
function wrapPlainTextToolCallStream(source, context) {
	const toolNames = resolveContextToolNames(context);
	if (toolNames.size === 0) return source;
	const output = createAssistantMessageEventStream();
	const stream = output;
	(async () => {
		const bufferedTextEvents = [];
		let bufferedText = "";
		let ended = false;
		const endStream = () => {
			if (!ended) {
				ended = true;
				stream.end();
			}
		};
		const flushBufferedTextEvents = () => {
			for (const event of bufferedTextEvents.splice(0)) stream.push(event);
			bufferedText = "";
		};
		try {
			for await (const event of source) {
				const record = toRecord(event);
				const type = typeof record?.type === "string" ? record.type : "";
				if (type === "text_start" || type === "text_delta" || type === "text_end") {
					bufferedTextEvents.push(event);
					if (typeof record?.delta === "string") bufferedText += record.delta;
					else if (typeof record?.content === "string" && !bufferedText) bufferedText = record.content;
					if (!couldStillBePlainTextToolCall(bufferedText, toolNames)) flushBufferedTextEvents();
					continue;
				}
				if (type === "done") {
					const promotedMessage = promotePlainTextToolCalls(record?.message, toolNames);
					if (promotedMessage) {
						bufferedTextEvents.splice(0);
						bufferedText = "";
						emitPromotedToolCallEvents(stream, promotedMessage);
						stream.push({
							...record,
							reason: "toolUse",
							message: promotedMessage
						});
					} else {
						flushBufferedTextEvents();
						stream.push(event);
					}
					endStream();
					return;
				}
				flushBufferedTextEvents();
				stream.push(event);
				if (type === "error") {
					endStream();
					return;
				}
			}
			flushBufferedTextEvents();
		} catch (error) {
			stream.push({
				type: "error",
				reason: "error",
				error: {
					role: "assistant",
					content: [],
					stopReason: "error",
					errorMessage: error instanceof Error ? error.message : String(error)
				}
			});
		} finally {
			endStream();
		}
	})();
	return output;
}
/**
* Provider stream wrapper for local/proxy providers that sometimes emit a
* standalone textual tool-call block even when native tool calling is enabled.
*/
function createPlainTextToolCallCompatWrapper(baseStreamFn) {
	const underlying = baseStreamFn ?? streamSimple;
	return (model, context, options) => {
		const maybeStream = underlying(model, context, options);
		if (maybeStream && typeof maybeStream === "object" && "then" in maybeStream) return Promise.resolve(maybeStream).then((stream) => wrapPlainTextToolCallStream(stream, context));
		return wrapPlainTextToolCallStream(maybeStream, context);
	};
}
/** @deprecated Bundled provider stream helper; do not use from third-party plugins. */
function defaultToolStreamExtraParams(extraParams) {
	if (extraParams?.tool_stream !== void 0) return extraParams;
	return {
		...extraParams,
		tool_stream: true
	};
}
function createPayloadPatchStreamWrapper(baseStreamFn, patchPayload, wrapperOptions) {
	const underlying = baseStreamFn ?? streamSimple;
	return (model, context, options) => {
		if (wrapperOptions?.shouldPatch && !wrapperOptions.shouldPatch({
			model,
			context,
			options
		})) return underlying(model, context, options);
		return streamWithPayloadPatch(underlying, model, context, options, (payload) => patchPayload({
			payload,
			model,
			context,
			options
		}));
	};
}
function isAnthropicThinkingEnabled(payload) {
	const thinking = payload.thinking;
	if (!thinking || typeof thinking !== "object") return false;
	return thinking.type !== "disabled";
}
function assistantMessageHasAnthropicToolUse(message) {
	if (Array.isArray(message.tool_calls) && message.tool_calls.length > 0) return true;
	const content = message.content;
	if (!Array.isArray(content)) return false;
	return content.some((block) => block && typeof block === "object" && (block.type === "tool_use" || block.type === "toolCall"));
}
function stripTrailingAssistantPrefillMessages(payload) {
	if (!Array.isArray(payload.messages)) return 0;
	let stripped = 0;
	while (payload.messages.length > 0) {
		const finalMessage = payload.messages[payload.messages.length - 1];
		if (!finalMessage || typeof finalMessage !== "object") break;
		const message = finalMessage;
		if (message.role !== "assistant" || assistantMessageHasAnthropicToolUse(message)) break;
		payload.messages.pop();
		stripped += 1;
	}
	return stripped;
}
/** @deprecated Anthropic-family provider stream helper; do not use from third-party plugins. */
function stripTrailingAnthropicAssistantPrefillWhenThinking(payload) {
	if (!isAnthropicThinkingEnabled(payload)) return 0;
	return stripTrailingAssistantPrefillMessages(payload);
}
/** @deprecated Anthropic-family provider stream helper; do not use from third-party plugins. */
function createAnthropicThinkingPrefillPayloadWrapper(baseStreamFn, onStripped, wrapperOptions) {
	return createPayloadPatchStreamWrapper(baseStreamFn, ({ payload }) => {
		const stripped = stripTrailingAnthropicAssistantPrefillWhenThinking(payload);
		if (stripped > 0) onStripped?.(stripped);
	}, wrapperOptions);
}
/** @deprecated OpenAI-compatible provider stream helper; do not use from third-party plugins. */
function isOpenAICompatibleThinkingEnabled(params) {
	const options = params.options ?? {};
	const raw = options.reasoningEffort ?? options.reasoning ?? params.thinkingLevel ?? "high";
	if (typeof raw !== "string") return true;
	const normalized = raw.trim().toLowerCase();
	return normalized !== "off" && normalized !== "none";
}
function isDisabledDeepSeekV4ThinkingLevel(thinkingLevel) {
	const normalized = typeof thinkingLevel === "string" ? thinkingLevel.toLowerCase() : "";
	return normalized === "off" || normalized === "none";
}
function resolveDeepSeekV4ReasoningEffort(thinkingLevel) {
	return thinkingLevel === "xhigh" || thinkingLevel === "max" ? "max" : "high";
}
function stripDeepSeekV4ReasoningContent(payload) {
	if (!Array.isArray(payload.messages)) return;
	for (const message of payload.messages) {
		if (!message || typeof message !== "object") continue;
		delete message.reasoning_content;
	}
}
function ensureDeepSeekV4AssistantReasoningContent(payload, params) {
	if (!Array.isArray(payload.messages)) return;
	for (const message of payload.messages) {
		if (!message || typeof message !== "object") continue;
		const record = message;
		if (record.role !== "assistant") continue;
		if (params?.shouldBackfillAssistantMessage && !params.shouldBackfillAssistantMessage(record)) continue;
		if (!("reasoning_content" in record)) record.reasoning_content = "";
	}
}
/** @deprecated DeepSeek provider stream helper; do not use from third-party plugins. */
function createDeepSeekV4OpenAICompatibleThinkingWrapper(params) {
	if (!params.baseStreamFn) return;
	const underlying = params.baseStreamFn;
	const resolveReasoningEffort = params.resolveReasoningEffort ?? resolveDeepSeekV4ReasoningEffort;
	return (model, context, options) => {
		if (!params.shouldPatchModel(model)) return underlying(model, context, options);
		return streamWithPayloadPatch(underlying, model, context, options, (payload) => {
			if (isDisabledDeepSeekV4ThinkingLevel(params.thinkingLevel)) {
				payload.thinking = { type: "disabled" };
				delete payload.reasoning_effort;
				delete payload.reasoning;
				stripDeepSeekV4ReasoningContent(payload);
				return;
			}
			payload.thinking = { type: "enabled" };
			payload.reasoning_effort = resolveReasoningEffort(params.thinkingLevel);
			ensureDeepSeekV4AssistantReasoningContent(payload, { shouldBackfillAssistantMessage: params.shouldBackfillAssistantReasoningContent });
		});
	};
}
function promoteThinkingOnlyFinalOutputToText(message) {
	if (!message || typeof message !== "object") return;
	const record = message;
	if (record.stopReason !== "stop" && record.stopReason !== "length") return;
	if (!Array.isArray(record.content) || record.content.length === 0) return;
	let hasVisibleText = false;
	let hasToolCall = false;
	let hasVisibleThinking = false;
	for (const block of record.content) {
		if (!block || typeof block !== "object") continue;
		const typedBlock = block;
		if (typedBlock.type === "text" && typeof typedBlock.text === "string" && typedBlock.text.trim()) hasVisibleText = true;
		if (typedBlock.type === "toolCall" || typedBlock.type === "tool_use") hasToolCall = true;
		if (typedBlock.type === "thinking" && typeof typedBlock.thinking === "string" && typedBlock.thinking.trim()) hasVisibleThinking = true;
	}
	if (hasVisibleText || hasToolCall || !hasVisibleThinking) return;
	record.content = record.content.map((block) => {
		if (!block || typeof block !== "object") return block;
		const typedBlock = block;
		if (typedBlock.type !== "thinking" || typeof typedBlock.thinking !== "string" || !typedBlock.thinking.trim()) return block;
		return {
			type: "text",
			text: typedBlock.thinking
		};
	});
}
function wrapThinkingOnlyFinalTextStream(stream) {
	const originalResult = stream.result.bind(stream);
	stream.result = async () => {
		const message = await originalResult();
		promoteThinkingOnlyFinalOutputToText(message);
		return message;
	};
	const originalAsyncIterator = stream[Symbol.asyncIterator].bind(stream);
	stream[Symbol.asyncIterator] = function() {
		const iterator = originalAsyncIterator();
		return {
			async next() {
				const result = await iterator.next();
				if (!result.done && result.value && typeof result.value === "object") {
					const event = result.value;
					promoteThinkingOnlyFinalOutputToText(event.partial);
					promoteThinkingOnlyFinalOutputToText(event.message);
				}
				return result;
			},
			async return(value) {
				return iterator.return?.(value) ?? {
					done: true,
					value: void 0
				};
			},
			async throw(error) {
				return iterator.throw?.(error) ?? {
					done: true,
					value: void 0
				};
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		};
	};
	return stream;
}
/** @deprecated OpenAI-compatible provider stream helper; do not use from third-party plugins. */
function createThinkingOnlyFinalTextWrapper(params) {
	if (!params.baseStreamFn) return;
	const underlying = params.baseStreamFn;
	return (model, context, options) => {
		const maybeStream = underlying(model, context, options);
		if (!params.shouldPatchModel(model)) return maybeStream;
		if (maybeStream && typeof maybeStream === "object" && "then" in maybeStream) return Promise.resolve(maybeStream).then((stream) => wrapThinkingOnlyFinalTextStream(stream));
		return wrapThinkingOnlyFinalTextStream(maybeStream);
	};
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function isGoogleThinkingRequiredModel(modelId) {
	return normalizeLowercaseStringOrEmpty(modelId).includes("gemini-2.5-pro");
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function isGoogleGemini25ThinkingBudgetModel(modelId) {
	return /(?:^|\/)gemini-2\.5-/.test(normalizeLowercaseStringOrEmpty(modelId));
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function isGoogleGemini3ProModel(modelId) {
	const normalized = normalizeLowercaseStringOrEmpty(modelId);
	return /(?:^|\/)gemini-(?:3(?:\.\d+)?-pro|pro-latest)(?:-|$)/.test(normalized);
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function isGoogleGemini3FlashModel(modelId) {
	const normalized = normalizeLowercaseStringOrEmpty(modelId);
	return /(?:^|\/)gemini-(?:3(?:\.\d+)?-flash|flash(?:-lite)?-latest)(?:-|$)/.test(normalized);
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function isGoogleGemini3ThinkingLevelModel(modelId) {
	return isGoogleGemini3ProModel(modelId) || isGoogleGemini3FlashModel(modelId);
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function resolveGoogleGemini3ThinkingLevel(params) {
	if (typeof params.modelId !== "string") return;
	if (isGoogleGemini3ProModel(params.modelId)) {
		switch (params.thinkingLevel) {
			case "off":
			case "minimal":
			case "low": return "LOW";
			case "medium":
			case "high":
			case "max":
			case "xhigh": return "HIGH";
			case "adaptive": return;
			case void 0: break;
		}
		if (typeof params.thinkingBudget === "number") {
			if (params.thinkingBudget < 0) return;
			return params.thinkingBudget <= 2048 ? "LOW" : "HIGH";
		}
		return;
	}
	if (!isGoogleGemini3FlashModel(params.modelId)) return;
	switch (params.thinkingLevel) {
		case "off":
		case "minimal": return "MINIMAL";
		case "low": return "LOW";
		case "medium": return "MEDIUM";
		case "high":
		case "max":
		case "xhigh": return "HIGH";
		case "adaptive": return;
		case void 0: break;
	}
	if (typeof params.thinkingBudget !== "number") return;
	if (params.thinkingBudget < 0) return;
	if (params.thinkingBudget <= 0) return "MINIMAL";
	if (params.thinkingBudget <= 2048) return "LOW";
	if (params.thinkingBudget <= 8192) return "MEDIUM";
	return "HIGH";
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function stripInvalidGoogleThinkingBudget(params) {
	if (params.thinkingConfig.thinkingBudget !== 0 || typeof params.modelId !== "string" || !isGoogleThinkingRequiredModel(params.modelId)) return false;
	delete params.thinkingConfig.thinkingBudget;
	return true;
}
function isGemma4Model(modelId) {
	return normalizeLowercaseStringOrEmpty(modelId).startsWith("gemma-4");
}
function mapThinkLevelToGemma4ThinkingLevel(thinkingLevel) {
	switch (thinkingLevel) {
		case "off": return;
		case "minimal":
		case "low": return "MINIMAL";
		case "medium":
		case "adaptive":
		case "high":
		case "max":
		case "xhigh": return "HIGH";
		default: return;
	}
}
function normalizeGemma4ThinkingLevel(value) {
	if (typeof value !== "string") return;
	switch (value.trim().toUpperCase()) {
		case "MINIMAL":
		case "LOW": return "MINIMAL";
		case "MEDIUM":
		case "HIGH": return "HIGH";
		default: return;
	}
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function sanitizeGoogleThinkingPayload(params) {
	if (!params.payload || typeof params.payload !== "object") return;
	const payloadObj = params.payload;
	sanitizeGoogleThinkingConfigContainer({
		container: payloadObj.config,
		modelId: params.modelId,
		thinkingLevel: params.thinkingLevel
	});
	sanitizeGoogleThinkingConfigContainer({
		container: payloadObj.generationConfig,
		modelId: params.modelId,
		thinkingLevel: params.thinkingLevel
	});
}
function sanitizeGoogleThinkingConfigContainer(params) {
	if (!params.container || typeof params.container !== "object") return;
	const configObj = params.container;
	const thinkingConfig = configObj.thinkingConfig;
	if (!thinkingConfig || typeof thinkingConfig !== "object") return;
	const thinkingConfigObj = thinkingConfig;
	if (typeof params.modelId === "string" && isGemma4Model(params.modelId)) {
		const normalizedThinkingLevel = normalizeGemma4ThinkingLevel(thinkingConfigObj.thinkingLevel);
		const explicitMappedLevel = mapThinkLevelToGemma4ThinkingLevel(params.thinkingLevel);
		const disabledViaBudget = typeof thinkingConfigObj.thinkingBudget === "number" && thinkingConfigObj.thinkingBudget <= 0;
		const hadThinkingBudget = thinkingConfigObj.thinkingBudget !== void 0;
		delete thinkingConfigObj.thinkingBudget;
		if (params.thinkingLevel === "off" || disabledViaBudget && explicitMappedLevel === void 0 && !normalizedThinkingLevel) {
			delete thinkingConfigObj.thinkingLevel;
			if (Object.keys(thinkingConfigObj).length === 0) delete configObj.thinkingConfig;
			return;
		}
		const mappedLevel = explicitMappedLevel ?? normalizedThinkingLevel ?? (hadThinkingBudget ? "MINIMAL" : void 0);
		if (mappedLevel) thinkingConfigObj.thinkingLevel = mappedLevel;
		return;
	}
	const thinkingBudget = thinkingConfigObj.thinkingBudget;
	if (params.thinkingLevel === "adaptive" && typeof params.modelId === "string" && isGoogleGemini25ThinkingBudgetModel(params.modelId)) {
		delete thinkingConfigObj.thinkingLevel;
		thinkingConfigObj.thinkingBudget = -1;
		return;
	}
	if (params.thinkingLevel === "adaptive" && typeof params.modelId === "string" && isGoogleGemini3ThinkingLevelModel(params.modelId)) {
		delete thinkingConfigObj.thinkingBudget;
		delete thinkingConfigObj.thinkingLevel;
		if (Object.keys(thinkingConfigObj).length === 0) delete configObj.thinkingConfig;
		return;
	}
	if (typeof params.modelId === "string" && isGoogleGemini3ThinkingLevelModel(params.modelId)) {
		const mappedLevel = resolveGoogleGemini3ThinkingLevel({
			modelId: params.modelId,
			thinkingLevel: params.thinkingLevel,
			thinkingBudget: typeof thinkingBudget === "number" ? thinkingBudget : void 0
		});
		delete thinkingConfigObj.thinkingBudget;
		if (mappedLevel) thinkingConfigObj.thinkingLevel = mappedLevel;
		if (Object.keys(thinkingConfigObj).length === 0) delete configObj.thinkingConfig;
		return;
	}
	if (stripInvalidGoogleThinkingBudget({
		thinkingConfig: thinkingConfigObj,
		modelId: params.modelId
	})) {
		if (Object.keys(thinkingConfigObj).length === 0) delete configObj.thinkingConfig;
		return;
	}
	if (typeof thinkingBudget !== "number" || thinkingBudget >= 0) return;
	delete thinkingConfigObj.thinkingBudget;
	if (Object.keys(thinkingConfigObj).length === 0) delete configObj.thinkingConfig;
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function createGoogleThinkingPayloadWrapper(baseStreamFn, thinkingLevel) {
	return createPayloadPatchStreamWrapper(baseStreamFn, ({ payload, model }) => {
		if (model.api === "google-generative-ai") sanitizeGoogleThinkingPayload({
			payload,
			modelId: model.id,
			thinkingLevel
		});
	});
}
/** @deprecated Google provider-owned stream helper; do not use from third-party plugins. */
function createGoogleThinkingStreamWrapper(ctx) {
	return createGoogleThinkingPayloadWrapper(ctx.streamFn, ctx.thinkingLevel);
}
//#endregion
export { sanitizeGoogleThinkingPayload as _, createGoogleThinkingStreamWrapper as a, createToolStreamWrapper as b, createThinkingOnlyFinalTextWrapper as c, isGoogleGemini3FlashModel as d, isGoogleGemini3ProModel as f, resolveGoogleGemini3ThinkingLevel as g, isOpenAICompatibleThinkingEnabled as h, createGoogleThinkingPayloadWrapper as i, defaultToolStreamExtraParams as l, isGoogleThinkingRequiredModel as m, createAnthropicThinkingPrefillPayloadWrapper as n, createPayloadPatchStreamWrapper as o, isGoogleGemini3ThinkingLevelModel as p, createDeepSeekV4OpenAICompatibleThinkingWrapper as r, createPlainTextToolCallCompatWrapper as s, composeProviderStreamWrappers as t, isGoogleGemini25ThinkingBudgetModel as u, stripInvalidGoogleThinkingBudget as v, createZaiToolStreamWrapper as x, stripTrailingAnthropicAssistantPrefillWhenThinking as y };
