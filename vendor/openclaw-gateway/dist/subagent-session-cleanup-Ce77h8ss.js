import { i as asOptionalRecord } from "./record-coerce-Btbek4uV.js";
import { d as resolveAgentIdFromSessionKey } from "./session-key-yaI3D3Bl.js";
import { t as asFiniteNumber } from "./number-coercion-CZ-2BQ9V.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import "./config-BtNBbhZb.js";
import { r as callGateway } from "./call-D_O83KsN.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { i as readSessionEntry } from "./store-load-Di_AfnVx.js";
import "./sessions-Ct4mpWsk.js";
import "./runs-p1TN18LG.js";
import { a as isSilentReplyText, n as SILENT_REPLY_TOKEN, t as HEARTBEAT_TOKEN } from "./tokens-BpOBzvOi.js";
import { l as readSessionMessagesAsync } from "./session-utils.fs-D_Qde0sG.js";
import { n as sanitizeTextContent, t as extractAssistantText } from "./chat-history-text-BUSxe-g7.js";
import { n as wrapPromptDataBlock } from "./sanitize-for-prompt-ByaJGDhT.js";
import "./server-plugins-BniQMVzq.js";
import { i as isBlockedLivenessState, n as isAbortedAgentStopReason, r as formatBlockedLivenessError } from "./run-termination-DzoWxvjU.js";
//#region src/agents/tools/sessions-send-tokens.ts
const ANNOUNCE_SKIP_TOKEN = "ANNOUNCE_SKIP";
const REPLY_SKIP_TOKEN = "REPLY_SKIP";
const NON_DELIVERABLE_REPLY_TOKENS = [
	ANNOUNCE_SKIP_TOKEN,
	REPLY_SKIP_TOKEN,
	SILENT_REPLY_TOKEN,
	HEARTBEAT_TOKEN
];
function isAnnounceSkip(text) {
	return (text ?? "").trim() === ANNOUNCE_SKIP_TOKEN;
}
function isReplySkip(text) {
	return (text ?? "").trim() === REPLY_SKIP_TOKEN;
}
function isNonDeliverableSessionsReply(text) {
	return NON_DELIVERABLE_REPLY_TOKENS.some((token) => isSilentReplyText(text, token));
}
//#endregion
//#region src/agents/subagent-announce-capture.ts
async function readLatestSubagentOutputWithRetryUsing(params) {
	const maxWaitMs = Math.max(0, Math.min(params.maxWaitMs, 15e3));
	let waitedMs = 0;
	let result;
	while (waitedMs < maxWaitMs) {
		result = await params.readSubagentOutput(params.sessionKey, params.outcome);
		if (result?.trim()) return result;
		const remainingMs = maxWaitMs - waitedMs;
		if (remainingMs <= 0) break;
		const sleepMs = Math.min(params.retryIntervalMs, remainingMs);
		await new Promise((resolve) => setTimeout(resolve, sleepMs));
		waitedMs += sleepMs;
	}
	return result;
}
async function captureSubagentCompletionReplyUsing(params) {
	const immediate = await params.readSubagentOutput(params.sessionKey);
	if (immediate?.trim()) return immediate;
	if (params.waitForReply === false) return;
	return await readLatestSubagentOutputWithRetryUsing({
		sessionKey: params.sessionKey,
		maxWaitMs: params.maxWaitMs,
		retryIntervalMs: params.retryIntervalMs,
		readSubagentOutput: params.readSubagentOutput
	});
}
//#endregion
//#region src/agents/subagent-yield-output.ts
function readToolName(value) {
	const record = asOptionalRecord(value);
	if (!record) return;
	for (const key of [
		"name",
		"toolName",
		"tool_name",
		"functionName",
		"function_name"
	]) {
		const candidate = record[key];
		if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
	}
}
function isToolCallBlock(value) {
	const record = asOptionalRecord(value);
	if (!record) return false;
	return record.type === "toolCall" || record.type === "tool_use" || record.type === "toolUse" || record.type === "functionCall" || record.type === "function_call";
}
function assistantCallsSessionsYield(message) {
	const record = asOptionalRecord(message);
	if (!record || record.role !== "assistant" || !Array.isArray(record.content)) return false;
	return record.content.some((block) => isToolCallBlock(block) && readToolName(block) === "sessions_yield");
}
function parseJsonObject(text) {
	const trimmed = text.trim();
	if (!trimmed.startsWith("{")) return;
	try {
		return asOptionalRecord(JSON.parse(trimmed));
	} catch {
		return;
	}
}
function readStructuredToolPayload(content) {
	const record = asOptionalRecord(content);
	if (record) return record;
	if (typeof content === "string") return parseJsonObject(content);
	if (!Array.isArray(content)) return;
	for (const block of content) {
		const blockRecord = asOptionalRecord(block);
		if (!blockRecord) continue;
		const text = blockRecord.text;
		if (typeof text !== "string") continue;
		const parsed = parseJsonObject(text);
		if (parsed) return parsed;
	}
}
function isSessionsYieldToolResult(message, previousAssistantCalledYield) {
	const record = asOptionalRecord(message);
	if (!record || record.role !== "toolResult" && record.role !== "tool") return false;
	if (readToolName(record) === "sessions_yield") return true;
	if (!previousAssistantCalledYield) return false;
	if (asOptionalRecord(record.details)?.status === "yielded") return true;
	return readStructuredToolPayload(record.content)?.status === "yielded";
}
//#endregion
//#region src/agents/subagent-announce-output.ts
const FAST_TEST_RETRY_INTERVAL_MS = 8;
let subagentAnnounceOutputDeps = {
	callGateway,
	getRuntimeConfig,
	readSessionEntry,
	readSessionMessagesAsync,
	resolveAgentIdFromSessionKey,
	resolveStorePath
};
function isFastTestMode() {
	return process.env.OPENCLAW_TEST_FAST === "1";
}
function withSubagentOutcomeTiming(outcome, timing) {
	const startedAt = asFiniteNumber(timing.startedAt) ?? asFiniteNumber(outcome.startedAt);
	const endedAt = asFiniteNumber(timing.endedAt) ?? asFiniteNumber(outcome.endedAt);
	const nextTiming = {};
	if (typeof startedAt === "number") nextTiming.startedAt = startedAt;
	if (typeof endedAt === "number") nextTiming.endedAt = endedAt;
	if (typeof startedAt === "number" && typeof endedAt === "number") nextTiming.elapsedMs = Math.max(0, endedAt - startedAt);
	return {
		...outcome,
		...nextTiming
	};
}
function extractSubagentAssistantText(message) {
	if (!message || typeof message !== "object") return "";
	if (message.role !== "assistant") return "";
	const content = message.content;
	if (typeof content === "string") return sanitizeTextContent(content);
	return extractAssistantText(message) ?? "";
}
function countAssistantToolCalls(message) {
	if (!message || typeof message !== "object") return 0;
	const content = message.content;
	const contentToolCalls = Array.isArray(content) ? content.filter((block) => block && typeof block === "object" && (block.type === "toolCall" || block.type === "tool_use")).length : 0;
	const toolCalls = message.toolCalls ?? message.tool_calls;
	return contentToolCalls + (Array.isArray(toolCalls) ? toolCalls.length : 0);
}
function summarizeSubagentOutputHistory(messages) {
	const snapshot = {};
	let previousAssistantCalledYield = false;
	for (const message of messages) {
		if (!message || typeof message !== "object") continue;
		if (message.role === "assistant") {
			if (assistantCallsSessionsYield(message)) {
				snapshot.latestAssistantText = void 0;
				snapshot.latestSilentText = void 0;
				snapshot.waitingForContinuation = true;
				previousAssistantCalledYield = true;
				continue;
			}
			const text = extractSubagentAssistantText(message).trim();
			if (!text) {
				snapshot.latestToolCallCount = (snapshot.latestToolCallCount ?? 0) + countAssistantToolCalls(message);
				snapshot.waitingForContinuation = false;
				previousAssistantCalledYield = false;
				continue;
			}
			if (isAnnounceSkip(text) || isSilentReplyText(text, "NO_REPLY")) {
				snapshot.latestSilentText = text;
				snapshot.latestAssistantText = void 0;
				snapshot.waitingForContinuation = false;
				previousAssistantCalledYield = false;
				continue;
			}
			snapshot.latestSilentText = void 0;
			snapshot.latestAssistantText = text;
			snapshot.waitingForContinuation = false;
			previousAssistantCalledYield = false;
			continue;
		}
		if (isSessionsYieldToolResult(message, previousAssistantCalledYield)) {
			snapshot.latestAssistantText = void 0;
			snapshot.latestSilentText = void 0;
			snapshot.waitingForContinuation = true;
			previousAssistantCalledYield = false;
			continue;
		}
		previousAssistantCalledYield = false;
	}
	return snapshot;
}
function selectSubagentOutputText(snapshot) {
	if (snapshot.waitingForContinuation) return;
	if (snapshot.latestSilentText) return snapshot.latestSilentText;
	if (snapshot.latestAssistantText) return snapshot.latestAssistantText;
	if (snapshot.latestToolCallCount && snapshot.latestToolCallCount > 0) return `${snapshot.latestToolCallCount} tool call(s) made without visible output.`;
}
async function readSubagentOutput(sessionKey, _outcome, options) {
	let messages;
	if (options?.sessionFile) messages = await subagentAnnounceOutputDeps.readSessionMessagesAsync(sessionKey, void 0, options.sessionFile, {
		mode: "recent",
		maxMessages: 100,
		maxBytes: 1024 * 1024
	});
	const history = messages === void 0 ? await subagentAnnounceOutputDeps.callGateway({
		method: "chat.history",
		params: {
			sessionKey,
			limit: 100
		}
	}) : void 0;
	const selected = selectSubagentOutputText(summarizeSubagentOutputHistory(messages ?? (Array.isArray(history?.messages) ? history.messages : [])));
	if (selected?.trim()) return selected;
}
async function readLatestSubagentOutputWithRetry(params) {
	return await readLatestSubagentOutputWithRetryUsing({
		sessionKey: params.sessionKey,
		maxWaitMs: params.maxWaitMs,
		outcome: params.outcome,
		retryIntervalMs: isFastTestMode() ? FAST_TEST_RETRY_INTERVAL_MS : 100,
		readSubagentOutput
	});
}
async function waitForSubagentRunOutcome(runId, timeoutMs) {
	const waitMs = Math.max(0, Math.floor(timeoutMs));
	return await subagentAnnounceOutputDeps.callGateway({
		method: "agent.wait",
		params: {
			runId,
			timeoutMs: waitMs
		},
		timeoutMs: waitMs + 2e3
	});
}
function applySubagentWaitOutcome(params) {
	const next = {
		outcome: params.outcome,
		startedAt: params.startedAt,
		endedAt: params.endedAt
	};
	if (typeof params.wait?.startedAt === "number" && typeof next.startedAt !== "number") next.startedAt = params.wait.startedAt;
	if (typeof params.wait?.endedAt === "number" && typeof next.endedAt !== "number") next.endedAt = params.wait.endedAt;
	const waitError = typeof params.wait?.error === "string" ? params.wait.error : void 0;
	let outcome = next.outcome;
	if (isBlockedLivenessState(params.wait?.livenessState)) outcome = {
		status: "error",
		error: formatBlockedLivenessError(waitError)
	};
	else if (isAbortedAgentStopReason(params.wait?.stopReason)) outcome = {
		status: "error",
		error: "subagent run terminated"
	};
	else if (params.wait?.status === "timeout") outcome = { status: "timeout" };
	else if (params.wait?.status === "error") outcome = {
		status: "error",
		error: waitError
	};
	else if (params.wait?.status === "ok") outcome = { status: "ok" };
	next.outcome = outcome ? withSubagentOutcomeTiming(outcome, next) : void 0;
	return next;
}
async function captureSubagentCompletionReply(sessionKey, options) {
	return await captureSubagentCompletionReplyUsing({
		sessionKey,
		waitForReply: options?.waitForReply,
		maxWaitMs: isFastTestMode() ? 50 : 1500,
		retryIntervalMs: isFastTestMode() ? FAST_TEST_RETRY_INTERVAL_MS : 100,
		readSubagentOutput: async (nextSessionKey) => await readSubagentOutput(nextSessionKey, options?.outcome, { sessionFile: options?.sessionFile })
	});
}
function describeSubagentOutcome(outcome) {
	if (!outcome) return "unknown";
	if (outcome.status === "ok") return "ok";
	if (outcome.status === "timeout") return "timeout";
	if (outcome.status === "error") return outcome.error?.trim() ? `error: ${outcome.error.trim()}` : "error";
	return "unknown";
}
function formatChildResultData(resultText) {
	return wrapPromptDataBlock({
		label: "Child result",
		text: resultText?.trim() || "(no output)"
	}) || "Child result: (no output)";
}
function selectChildCompletionResultText(child) {
	return (child.completion?.resultText ?? child.delivery?.payload?.frozenResultText ?? child.completion?.fallbackResultText ?? child.delivery?.payload?.fallbackFrozenResultText ?? child.frozenResultText ?? void 0)?.trim();
}
function buildChildCompletionFindings(children) {
	const sorted = [...children].toSorted((a, b) => {
		if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
		return (typeof a.endedAt === "number" ? a.endedAt : Number.MAX_SAFE_INTEGER) - (typeof b.endedAt === "number" ? b.endedAt : Number.MAX_SAFE_INTEGER);
	});
	const sections = [];
	for (const [index, child] of sorted.entries()) {
		const resultText = selectChildCompletionResultText(child);
		const outcome = describeSubagentOutcome(child.outcome);
		if (child.outcome?.status === "ok" && resultText && (isAnnounceSkip(resultText) || isSilentReplyText(resultText, "NO_REPLY"))) continue;
		const title = child.label?.trim() || child.task.trim() || child.childSessionKey.trim() || `child ${index + 1}`;
		const displayIndex = sections.length + 1;
		sections.push([
			`${displayIndex}. ${title}`,
			`status: ${outcome}`,
			formatChildResultData(resultText)
		].join("\n"));
	}
	if (sections.length === 0) return;
	return [
		"Child completion results:",
		"",
		...sections
	].join("\n\n");
}
function dedupeLatestChildCompletionRows(children) {
	const latestByChildSessionKey = /* @__PURE__ */ new Map();
	for (const child of children) {
		const existing = latestByChildSessionKey.get(child.childSessionKey);
		if (!existing || child.createdAt > existing.createdAt) latestByChildSessionKey.set(child.childSessionKey, child);
	}
	return [...latestByChildSessionKey.values()];
}
function filterCurrentDirectChildCompletionRows(children, params) {
	if (typeof params.getLatestSubagentRunByChildSessionKey !== "function") return children;
	return children.filter((child) => {
		const latest = params.getLatestSubagentRunByChildSessionKey?.(child.childSessionKey);
		if (!latest) return true;
		return latest.runId === child.runId && latest.requesterSessionKey === params.requesterSessionKey;
	});
}
function formatDurationShort(valueMs) {
	if (!valueMs || !Number.isFinite(valueMs) || valueMs <= 0) return "n/a";
	const totalSeconds = Math.round(valueMs / 1e3);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor(totalSeconds % 3600 / 60);
	const seconds = totalSeconds % 60;
	if (hours > 0) return `${hours}h${minutes}m`;
	if (minutes > 0) return `${minutes}m${seconds}s`;
	return `${seconds}s`;
}
function formatTokenCount(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "0";
	if (value >= 1e6) return `${(value / 1e6).toFixed(1)}m`;
	if (value >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
	return String(Math.round(value));
}
async function buildCompactAnnounceStatsLine(params) {
	const cfg = subagentAnnounceOutputDeps.getRuntimeConfig();
	const agentId = subagentAnnounceOutputDeps.resolveAgentIdFromSessionKey(params.sessionKey);
	const storePath = subagentAnnounceOutputDeps.resolveStorePath(cfg.session?.store, { agentId });
	let entry = subagentAnnounceOutputDeps.readSessionEntry(storePath, params.sessionKey);
	const tokenWaitAttempts = isFastTestMode() ? 1 : 3;
	for (let attempt = 0; attempt < tokenWaitAttempts; attempt += 1) {
		if (typeof entry?.inputTokens === "number" || typeof entry?.outputTokens === "number" || typeof entry?.totalTokens === "number") break;
		if (!isFastTestMode()) await new Promise((resolve) => setTimeout(resolve, 150));
		entry = subagentAnnounceOutputDeps.readSessionEntry(storePath, params.sessionKey);
	}
	const input = typeof entry?.inputTokens === "number" ? entry.inputTokens : 0;
	const output = typeof entry?.outputTokens === "number" ? entry.outputTokens : 0;
	const ioTotal = input + output;
	const promptCache = typeof entry?.totalTokens === "number" ? entry.totalTokens : void 0;
	const parts = [`runtime ${formatDurationShort(typeof params.startedAt === "number" && typeof params.endedAt === "number" ? Math.max(0, params.endedAt - params.startedAt) : void 0)}`, `tokens ${formatTokenCount(ioTotal)} (in ${formatTokenCount(input)} / out ${formatTokenCount(output)})`];
	if (typeof promptCache === "number" && promptCache > ioTotal) parts.push(`prompt/cache ${formatTokenCount(promptCache)}`);
	return `Stats: ${parts.join(" • ")}`;
}
//#endregion
//#region src/agents/subagent-session-cleanup.ts
async function deleteSubagentSessionForCleanup(params) {
	try {
		await params.callGateway({
			method: "sessions.delete",
			params: {
				key: params.childSessionKey,
				deleteTranscript: true,
				emitLifecycleHooks: params.spawnMode === "session"
			},
			timeoutMs: 1e4
		});
	} catch (error) {
		params.onError?.(error);
	}
}
//#endregion
export { captureSubagentCompletionReply as a, readLatestSubagentOutputWithRetry as c, withSubagentOutcomeTiming as d, ANNOUNCE_SKIP_TOKEN as f, isReplySkip as g, isNonDeliverableSessionsReply as h, buildCompactAnnounceStatsLine as i, readSubagentOutput as l, isAnnounceSkip as m, applySubagentWaitOutcome as n, dedupeLatestChildCompletionRows as o, REPLY_SKIP_TOKEN as p, buildChildCompletionFindings as r, filterCurrentDirectChildCompletionRows as s, deleteSubagentSessionForCleanup as t, waitForSubagentRunOutcome as u };
