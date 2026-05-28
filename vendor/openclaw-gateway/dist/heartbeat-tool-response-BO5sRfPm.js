import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { o as isRecord } from "./record-coerce-Btbek4uV.js";
import { t as HEARTBEAT_TOKEN } from "./tokens-BpOBzvOi.js";
//#region src/auto-reply/heartbeat-tool-response.ts
const HEARTBEAT_RESPONSE_TOOL_NAME = "heartbeat_respond";
const HEARTBEAT_RESPONSE_CHANNEL_DATA_KEY = "openclawHeartbeatResponse";
const HEARTBEAT_TOOL_OUTCOMES = [
	"no_change",
	"progress",
	"done",
	"blocked",
	"needs_attention"
];
const HEARTBEAT_TOOL_PRIORITIES = [
	"low",
	"normal",
	"high"
];
const OUTCOMES = new Set(HEARTBEAT_TOOL_OUTCOMES);
const PRIORITIES = new Set(HEARTBEAT_TOOL_PRIORITIES);
function readStringAlias(record, ...keys) {
	for (const key of keys) {
		const value = normalizeOptionalString(record[key]);
		if (value) return value;
	}
}
function readBooleanAlias(record, ...keys) {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "boolean") return value;
	}
}
function normalizeHeartbeatToolResponse(value) {
	if (!isRecord(value)) return;
	const outcome = normalizeOptionalString(value.outcome);
	const notify = readBooleanAlias(value, "notify");
	const summary = normalizeOptionalString(value.summary);
	if (!outcome || !OUTCOMES.has(outcome) || notify === void 0 || !summary) return;
	const priority = normalizeOptionalString(value.priority);
	const notificationText = readStringAlias(value, "notificationText", "notification_text");
	const reason = normalizeOptionalString(value.reason);
	const nextCheck = readStringAlias(value, "nextCheck", "next_check");
	return {
		outcome,
		notify,
		summary,
		...notificationText ? { notificationText } : {},
		...reason ? { reason } : {},
		...priority && PRIORITIES.has(priority) ? { priority } : {},
		...nextCheck ? { nextCheck } : {}
	};
}
function getHeartbeatToolNotificationText(response) {
	return response.notify ? (response.notificationText ?? response.summary).trim() : "";
}
function createHeartbeatToolResponsePayload(response) {
	return {
		text: response.notify ? getHeartbeatToolNotificationText(response) : HEARTBEAT_TOKEN,
		channelData: { [HEARTBEAT_RESPONSE_CHANNEL_DATA_KEY]: response }
	};
}
function getHeartbeatToolResponseFromPayload(payload) {
	return normalizeHeartbeatToolResponse(payload?.channelData?.[HEARTBEAT_RESPONSE_CHANNEL_DATA_KEY]);
}
function resolveHeartbeatToolResponseFromReplyResult(replyResult) {
	if (!replyResult) return;
	const payloads = Array.isArray(replyResult) ? replyResult : [replyResult];
	for (let idx = payloads.length - 1; idx >= 0; idx -= 1) {
		const response = getHeartbeatToolResponseFromPayload(payloads[idx]);
		if (response) return response;
	}
}
//#endregion
export { getHeartbeatToolNotificationText as a, createHeartbeatToolResponsePayload as i, HEARTBEAT_TOOL_OUTCOMES as n, normalizeHeartbeatToolResponse as o, HEARTBEAT_TOOL_PRIORITIES as r, resolveHeartbeatToolResponseFromReplyResult as s, HEARTBEAT_RESPONSE_TOOL_NAME as t };
