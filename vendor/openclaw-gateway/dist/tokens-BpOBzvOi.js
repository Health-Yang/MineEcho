import { t as escapeRegExp } from "./regexp-gnNKXe6h.js";
//#region src/auto-reply/tokens.ts
const HEARTBEAT_TOKEN = "HEARTBEAT_OK";
const SILENT_REPLY_TOKEN = "NO_REPLY";
const silentExactRegexByToken = /* @__PURE__ */ new Map();
const silentTrailingRegexByToken = /* @__PURE__ */ new Map();
const silentLeadingAttachedRegexByToken = /* @__PURE__ */ new Map();
function getSilentExactRegex(token) {
	const cached = silentExactRegexByToken.get(token);
	if (cached) return cached;
	const escaped = escapeRegExp(token);
	const regex = new RegExp(`^\\s*${escaped}(?:\\s+${escaped})*\\s*$`, "i");
	silentExactRegexByToken.set(token, regex);
	return regex;
}
function getSilentTrailingRegex(token) {
	const cached = silentTrailingRegexByToken.get(token);
	if (cached) return cached;
	const escaped = escapeRegExp(token);
	const regex = new RegExp(`(?:^|\\s+|\\*+)${escaped}\\s*$`, "i");
	silentTrailingRegexByToken.set(token, regex);
	return regex;
}
function isSilentReplyText(text, token = SILENT_REPLY_TOKEN) {
	if (!text) return false;
	return getSilentExactRegex(token).test(text);
}
function isSilentReplyEnvelopeText(text, token = SILENT_REPLY_TOKEN) {
	if (!text) return false;
	const trimmed = text.trim();
	if (!trimmed || !trimmed.startsWith("{") || !trimmed.endsWith("}") || !trimmed.includes(token)) return false;
	try {
		const parsed = JSON.parse(trimmed);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
		const keys = Object.keys(parsed);
		return keys.length === 1 && keys[0] === "action" && typeof parsed.action === "string" && parsed.action.trim() === token;
	} catch {
		return false;
	}
}
const taggedReasoningPrefixRe = /^\s*<\s*(?:(?:antml:)?(?:think(?:ing)?|thought)|antthinking)\b[^<>]*>[\s\S]*?<\s*\/\s*(?:(?:antml:)?(?:think(?:ing)?|thought)|antthinking)\s*>\s*/i;
const openReasoningPrefixRe = /^\s*<\s*(?:(?:antml:)?(?:think(?:ing)?|thought)|antthinking)\b[^<>]*>/i;
const plainReasoningPrefixRe = /^\s*(?:think(?:ing)?|thought|analysis|reasoning)\s*:?\s*\r?\n/i;
function stripLeadingReasoningBlocks(text) {
	let current = text;
	while (true) {
		const next = current.replace(taggedReasoningPrefixRe, "");
		if (next === current) return current;
		current = next;
	}
}
function stripFinalSilentToken(text, token) {
	const escaped = escapeRegExp(token);
	const stripped = text.replace(new RegExp(`(?:^|[\\s*.])${escaped}\\s*$`, "i"), "").trim();
	return stripped === text.trim() ? null : stripped;
}
const silentIntentTextRe = /^\s*(?:i|i'll|i\s+will|i'm|i\s+am|we|we'll|we\s+will|the\s+assistant|assistant|the\s+bot|bot|openclaw)\s+(?:(?:will\s+)?(?:stay|remain|keep|be)\s+(?:quiet|silent)(?:\s+(?:here|for\s+now|on\s+this|in\s+this\s+(?:chat|thread|channel|conversation)))?|(?:do\s+not|don't|dont|will\s+not|won't|would\s+not|should\s+not)\s+(?:reply|respond)(?:\s+(?:here|for\s+now|on\s+this|in\s+this\s+(?:chat|thread|channel|conversation)))?|(?:have|has)\s+nothing\s+(?:to|for)\s+(?:say|add|reply|respond))(?:[.!?]+)?\s*$/i;
function hasSilentIntentFinalSilentToken(text, token) {
	const withoutToken = stripFinalSilentToken(text, token);
	if (withoutToken === null) return false;
	return !withoutToken || silentIntentTextRe.test(withoutToken);
}
const substantiveAnswerCueRe = /\b(?:answer|here(?:'s|\s+is)|tell\s+them|you\s+(?:should|can|could|need|must)|please|try|use|send|service\s+is|resolved|retry|yes|no,|sure)\b/i;
const bareReasoningPlaceholderRe = /^\s*(?:(?:internal|private)\s+)?(?:reasoning|thinking|thoughts?|analysis)(?:\s+notes?)?\s*$/i;
function hasPlainReasoningFinalSilentToken(text, token) {
	const withoutToken = stripFinalSilentToken(text, token);
	if (withoutToken === null) return false;
	if (!withoutToken || silentIntentTextRe.test(withoutToken)) return true;
	const lines = withoutToken.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	const finalLine = lines.at(-1);
	const previousLines = lines.slice(0, -1).join("\n");
	return Boolean(finalLine && silentIntentTextRe.test(finalLine) && previousLines && !substantiveAnswerCueRe.test(previousLines)) || bareReasoningPlaceholderRe.test(withoutToken);
}
function isReasoningPrefixedSilentReplyText(text, token = SILENT_REPLY_TOKEN) {
	if (!text) return false;
	const trimmed = text.trim();
	if (!trimmed) return false;
	const withoutLeadingReasoningBlocks = stripLeadingReasoningBlocks(trimmed);
	if (withoutLeadingReasoningBlocks !== trimmed) return isSilentReplyText(withoutLeadingReasoningBlocks, token) || hasSilentIntentFinalSilentToken(withoutLeadingReasoningBlocks, token);
	if (openReasoningPrefixRe.test(trimmed)) {
		const withoutOpenReasoningPrefix = trimmed.replace(openReasoningPrefixRe, "");
		return isSilentReplyText(withoutOpenReasoningPrefix, token) || hasPlainReasoningFinalSilentToken(withoutOpenReasoningPrefix, token);
	}
	if (!plainReasoningPrefixRe.test(trimmed)) return false;
	const withoutPlainReasoningPrefix = trimmed.replace(plainReasoningPrefixRe, "");
	return isSilentReplyText(withoutPlainReasoningPrefix, token) || hasPlainReasoningFinalSilentToken(withoutPlainReasoningPrefix, token);
}
function isSilentReplyPayloadText(text, token = SILENT_REPLY_TOKEN) {
	return isSilentReplyText(text, token) || isSilentReplyEnvelopeText(text, token) || isReasoningPrefixedSilentReplyText(text, token);
}
/**
* Strip a trailing silent reply token from mixed-content text.
* Returns the remaining text with the token removed (trimmed).
* If the result is empty, the entire message should be treated as silent.
*/
function stripSilentToken(text, token = SILENT_REPLY_TOKEN) {
	return text.replace(getSilentTrailingRegex(token), "").trim();
}
const silentLeadingRegexByToken = /* @__PURE__ */ new Map();
function getSilentLeadingAttachedRegex(token) {
	const cached = silentLeadingAttachedRegexByToken.get(token);
	if (cached) return cached;
	const escaped = escapeRegExp(token);
	const regex = new RegExp(`^\\s*(?:${escaped}\\s+)*${escaped}(?=[\\p{L}\\p{N}])`, "iu");
	silentLeadingAttachedRegexByToken.set(token, regex);
	return regex;
}
function getSilentLeadingRegex(token) {
	const cached = silentLeadingRegexByToken.get(token);
	if (cached) return cached;
	const escaped = escapeRegExp(token);
	const regex = new RegExp(`^(?:\\s*${escaped})+\\s*`, "i");
	silentLeadingRegexByToken.set(token, regex);
	return regex;
}
/**
* Strip leading silent reply tokens from text.
* Handles cases like "NO_REPLYThe user is saying..." where the token
* is not separated from the following text.
*/
function stripLeadingSilentToken(text, token = SILENT_REPLY_TOKEN) {
	return text.replace(getSilentLeadingRegex(token), "").trim();
}
/**
* Check whether text starts with one or more leading silent reply tokens where
* the final token is glued directly to visible content.
*/
function startsWithSilentToken(text, token = SILENT_REPLY_TOKEN) {
	if (!text) return false;
	return getSilentLeadingAttachedRegex(token).test(text);
}
function isSilentReplyPrefixText(text, token = SILENT_REPLY_TOKEN) {
	if (!text) return false;
	const trimmed = text.trimStart();
	if (!trimmed) return false;
	if (trimmed !== trimmed.toUpperCase()) return false;
	const normalized = trimmed.toUpperCase();
	if (!normalized) return false;
	if (normalized.length < 2) return false;
	if (/[^A-Z_]/.test(normalized)) return false;
	const tokenUpper = token.toUpperCase();
	if (!tokenUpper.startsWith(normalized)) return false;
	if (normalized.includes("_")) return true;
	return tokenUpper === "NO_REPLY" && normalized === "NO";
}
//#endregion
export { isSilentReplyText as a, stripSilentToken as c, isSilentReplyPrefixText as i, SILENT_REPLY_TOKEN as n, startsWithSilentToken as o, isSilentReplyPayloadText as r, stripLeadingSilentToken as s, HEARTBEAT_TOKEN as t };
