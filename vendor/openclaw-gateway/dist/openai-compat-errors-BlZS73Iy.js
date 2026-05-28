import { d as normalizeTrimmedStringList } from "./string-normalization-B8G0vlWE.js";
import { n as extractTextFromChatContent } from "./chat-content-BNTcXm1Z.js";
import { c as resolveFailoverStatus, r as describeFailoverError } from "./failover-error-wBZizcCn.js";
import "./selection-C4e-Qn9W.js";
import { i as buildHistoryContextFromEntries } from "./history-hgslOCXm.js";
//#region src/gateway/agent-event-assistant-text.ts
function resolveAssistantStreamDeltaText(evt) {
	const delta = evt.data.delta;
	const text = evt.data.text;
	return typeof delta === "string" ? delta : typeof text === "string" ? text : "";
}
//#endregion
//#region src/gateway/agent-prompt.ts
/**
* Coerce body to string. Handles cases where body is a content array
* (e.g. [{type:"text", text:"hello"}]) that would serialize as
* [object Object] if used directly in a template literal.
*/
function safeBody(body) {
	return typeof body === "string" ? body : extractTextFromChatContent(body) ?? "";
}
function toPromptEntry(entry) {
	const body = safeBody(entry.entry.body);
	if (entry.role === "assistant" && entry.internalStreamError === true && body.trim() === "[assistant turn failed before producing content]") return null;
	return {
		...entry.entry,
		body
	};
}
function buildAgentMessageFromConversationEntries(entries) {
	if (entries.length === 0) return "";
	let currentIndex = -1;
	for (let i = entries.length - 1; i >= 0; i -= 1) {
		const role = entries[i]?.role;
		if (role === "user" || role === "tool") {
			currentIndex = i;
			break;
		}
	}
	if (currentIndex < 0) currentIndex = entries.length - 1;
	const currentConversationEntry = entries[currentIndex];
	const currentEntry = currentConversationEntry?.entry;
	if (!currentConversationEntry || !currentEntry) return "";
	const historyEntries = entries.slice(0, currentIndex).map(toPromptEntry).filter((entry) => entry !== null);
	const currentPromptEntry = toPromptEntry(currentConversationEntry);
	if (!currentPromptEntry) return "";
	if (historyEntries.length === 0) return currentPromptEntry.body;
	const formatEntry = (entry) => `${entry.sender}: ${entry.body}`;
	return buildHistoryContextFromEntries({
		entries: [...historyEntries, currentPromptEntry],
		currentMessage: formatEntry(currentPromptEntry),
		formatEntry
	});
}
//#endregion
//#region src/gateway/input-allowlist.ts
/**
* Normalize optional gateway URL-input hostname allowlists.
*
* Semantics are intentionally:
* - missing / empty / whitespace-only list => no hostname allowlist restriction
* - deny-all URL fetching => use the corresponding `allowUrl: false` switch
*/
function normalizeInputHostnameAllowlist(values) {
	if (!values || values.length === 0) return;
	const normalized = normalizeTrimmedStringList(values);
	return normalized.length > 0 ? normalized : void 0;
}
//#endregion
//#region src/gateway/openai-compat-errors.ts
const ERROR_TYPE_BY_REASON = {
	auth: "authentication_error",
	auth_permanent: "permission_error",
	billing: "insufficient_quota",
	format: "invalid_request_error",
	model_not_found: "invalid_request_error",
	overloaded: "api_error",
	rate_limit: "rate_limit_error",
	server_error: "api_error",
	session_expired: "invalid_request_error",
	timeout: "api_error"
};
function statusForReason(reason, status) {
	if (reason === "server_error") return status && status >= 400 && status < 500 ? status : 502;
	if (reason === "timeout") return status && status >= 400 && status < 500 ? status : 504;
	return status ?? resolveFailoverStatus(reason) ?? 500;
}
function messageForReason(params) {
	if (params.reason === "server_error") return "upstream provider error";
	if (params.reason === "timeout") return "upstream provider timeout";
	if (params.reason === "overloaded") return "upstream provider overloaded";
	return params.rawError?.trim() || params.message.trim() || "request failed";
}
function resolveOpenAiCompatError(err) {
	const described = describeFailoverError(err);
	const reason = described.reason;
	if (!reason) return;
	const type = ERROR_TYPE_BY_REASON[reason];
	if (!type) return;
	return {
		status: statusForReason(reason, described.status),
		error: {
			message: messageForReason({
				reason,
				message: described.message,
				rawError: described.rawError
			}),
			type,
			...described.code ? { code: described.code } : {}
		}
	};
}
function validateOpenAiSamplingParams(params) {
	if (params.temperature != null) {
		if (typeof params.temperature !== "number" || !Number.isFinite(params.temperature)) return "`temperature` must be a finite number.";
		if (params.temperature < 0 || params.temperature > 2) return "`temperature` must be between 0 and 2.";
	}
	if (params.topP != null) {
		if (typeof params.topP !== "number" || !Number.isFinite(params.topP)) return "`top_p` must be a finite number.";
		if (params.topP < 0 || params.topP > 1) return "`top_p` must be between 0 and 1.";
	}
	if (params.frequencyPenalty != null) {
		if (typeof params.frequencyPenalty !== "number" || !Number.isFinite(params.frequencyPenalty)) return "`frequency_penalty` must be a finite number.";
		if (params.frequencyPenalty < -2 || params.frequencyPenalty > 2) return "`frequency_penalty` must be between -2.0 and 2.0.";
	}
	if (params.presencePenalty != null) {
		if (typeof params.presencePenalty !== "number" || !Number.isFinite(params.presencePenalty)) return "`presence_penalty` must be a finite number.";
		if (params.presencePenalty < -2 || params.presencePenalty > 2) return "`presence_penalty` must be between -2.0 and 2.0.";
	}
	if (params.seed != null) {
		if (typeof params.seed !== "number" || !Number.isFinite(params.seed)) return "`seed` must be a finite number.";
		if (!Number.isInteger(params.seed)) return "`seed` must be an integer.";
	}
}
//#endregion
export { resolveAssistantStreamDeltaText as a, buildAgentMessageFromConversationEntries as i, validateOpenAiSamplingParams as n, normalizeInputHostnameAllowlist as r, resolveOpenAiCompatError as t };
