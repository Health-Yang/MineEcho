import { i as isPathInside } from "./path-BlG8lhgR.js";
import { v as resolveSessionAgentIds } from "./agent-scope-CudANNo3.js";
import "./path-guards-CBe_wA_B.js";
import { a as resolveSessionFilePathOptions, i as resolveSessionFilePath } from "./paths-DZXdqwOo.js";
import path from "node:path";
import fs from "node:fs/promises";
import { migrateSessionEntries, parseSessionEntries } from "@earendil-works/pi-coding-agent";
function limitAgentHookHistoryMessages(messages, maxMessages = 100) {
	if (maxMessages <= 0) return [];
	return messages.slice(-maxMessages);
}
function buildAgentHookConversationMessages(params) {
	return [...limitAgentHookHistoryMessages(params.historyMessages ?? []), ...params.currentTurnMessages ?? []];
}
const MAX_CLI_SESSION_HISTORY_MESSAGES = 100;
const MAX_CLI_SESSION_RESEED_HISTORY_CHARS = 12 * 1024;
const MAX_AUTO_CLI_SESSION_RESEED_HISTORY_CHARS = 256 * 1024;
const CLI_SESSION_RESEED_HISTORY_CONTEXT_SHARE = .08;
const CHARS_PER_TOKEN_ESTIMATE = 4;
const RAW_TRANSCRIPT_RESEED_ALLOWED_REASONS = new Set([
	"missing-transcript",
	"system-prompt",
	"mcp",
	"session-expired"
]);
function resolveAutoCliSessionReseedHistoryChars(contextWindowTokens) {
	if (!Number.isFinite(contextWindowTokens) || contextWindowTokens <= 0) return MAX_CLI_SESSION_RESEED_HISTORY_CHARS;
	const contextShareChars = Math.floor(contextWindowTokens * CLI_SESSION_RESEED_HISTORY_CONTEXT_SHARE * CHARS_PER_TOKEN_ESTIMATE);
	return Math.max(MAX_CLI_SESSION_RESEED_HISTORY_CHARS, Math.min(MAX_AUTO_CLI_SESSION_RESEED_HISTORY_CHARS, contextShareChars));
}
function coerceHistoryText(content) {
	if (typeof content === "string") return content.trim();
	if (!Array.isArray(content)) return "";
	return content.flatMap((block) => {
		if (!block || typeof block !== "object") return [];
		const text = block.text;
		return typeof text === "string" && text.trim().length > 0 ? [text.trim()] : [];
	}).join("\n").trim();
}
function coerceHistoryTimestamp(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") return value;
	return 0;
}
function historyEntryToContextEngineMessage(entry) {
	if (entry.type === "message") return entry.message;
	if (entry.type === "custom_message") return {
		role: "custom",
		customType: typeof entry.customType === "string" ? entry.customType : "custom",
		content: entry.content,
		display: entry.display !== false,
		details: entry.details,
		timestamp: coerceHistoryTimestamp(entry.timestamp)
	};
	if (entry.type === "branch_summary") return {
		role: "branchSummary",
		summary: typeof entry.summary === "string" ? entry.summary : "",
		fromId: typeof entry.fromId === "string" ? entry.fromId : "root",
		timestamp: coerceHistoryTimestamp(entry.timestamp)
	};
}
function loadContextEngineMessagesFromEntries(entries) {
	return entries.flatMap((entry) => {
		const message = historyEntryToContextEngineMessage(entry);
		return message ? [message] : [];
	});
}
function renderHistoryMessage(message) {
	if (!message || typeof message !== "object") return;
	const entry = message;
	const role = entry.role === "assistant" ? "Assistant" : entry.role === "user" ? "User" : entry.role === "compactionSummary" ? "Compaction summary" : void 0;
	if (!role) return;
	const text = entry.role === "compactionSummary" && typeof entry.summary === "string" ? entry.summary.trim() : coerceHistoryText(entry.content);
	return text ? `${role}: ${text}` : void 0;
}
function buildCliSessionHistoryPrompt(params) {
	const maxHistoryChars = params.maxHistoryChars ?? 12288;
	const firstEntry = params.messages[0];
	const firstIsCompaction = !!firstEntry && typeof firstEntry === "object" && firstEntry.role === "compactionSummary";
	const summaryRendered = firstIsCompaction ? renderHistoryMessage(firstEntry) : void 0;
	const tailRaw = (firstIsCompaction ? params.messages.slice(1) : params.messages).flatMap((message) => {
		const rendered = renderHistoryMessage(message);
		return rendered ? [rendered] : [];
	}).join("\n\n").trim();
	const truncationMarker = "[OpenClaw reseed history truncated; older turns dropped]";
	const renderTruncatedSummaryWithTail = (renderedSummary) => {
		const tailBudget = tailRaw.length > 0 ? Math.min(tailRaw.length, Math.floor(maxHistoryChars / 2)) : 0;
		const separatorBudget = tailBudget > 0 ? 2 : 1;
		const summaryBudget = Math.max(0, maxHistoryChars - 56 - separatorBudget - tailBudget);
		return [
			truncationMarker,
			renderedSummary.slice(0, summaryBudget).trimEnd(),
			tailBudget > 0 ? tailRaw.slice(-tailBudget).trimStart() : ""
		].filter(Boolean).join("\n");
	};
	let renderedHistory;
	if (summaryRendered) if (summaryRendered.length >= maxHistoryChars) renderedHistory = renderTruncatedSummaryWithTail(summaryRendered);
	else if (tailRaw.length === 0) renderedHistory = summaryRendered;
	else {
		const summaryBlock = `${summaryRendered}\n\n`;
		const remainingBudget = maxHistoryChars - summaryBlock.length;
		if (remainingBudget <= 0) renderedHistory = renderTruncatedSummaryWithTail(summaryRendered);
		else if (tailRaw.length > remainingBudget) renderedHistory = `${summaryBlock}${truncationMarker}\n${tailRaw.slice(-remainingBudget).trimStart()}`;
		else renderedHistory = `${summaryBlock}${tailRaw}`;
	}
	else renderedHistory = tailRaw.length > maxHistoryChars ? `${truncationMarker}\n${tailRaw.slice(-maxHistoryChars).trimStart()}` : tailRaw;
	if (!renderedHistory) return;
	return [
		"Continue this conversation using the OpenClaw transcript below as prior session history.",
		"Treat it as authoritative context for this fresh CLI session.",
		"",
		"<conversation_history>",
		renderedHistory,
		"</conversation_history>",
		"",
		"<next_user_message>",
		params.prompt,
		"</next_user_message>"
	].join("\n");
}
async function safeRealpath(filePath) {
	try {
		return await fs.realpath(filePath);
	} catch {
		return;
	}
}
function resolveSafeCliSessionFile(params) {
	const { defaultAgentId, sessionAgentId } = resolveSessionAgentIds({
		sessionKey: params.sessionKey,
		config: params.config,
		agentId: params.agentId
	});
	const pathOptions = resolveSessionFilePathOptions({
		agentId: sessionAgentId ?? defaultAgentId,
		storePath: params.config?.session?.store
	});
	const sessionFile = resolveSessionFilePath(params.sessionId, { sessionFile: params.sessionFile }, pathOptions);
	return {
		sessionFile,
		sessionsDir: pathOptions?.sessionsDir ?? path.dirname(sessionFile)
	};
}
async function loadCliSessionEntries(params) {
	try {
		const { sessionFile, sessionsDir } = resolveSafeCliSessionFile(params);
		const entryStat = await fs.lstat(sessionFile);
		if (!entryStat.isFile() || entryStat.isSymbolicLink()) return [];
		const realSessionsDir = await safeRealpath(sessionsDir) ?? path.resolve(sessionsDir);
		const realSessionFile = await safeRealpath(sessionFile);
		if (!realSessionFile || realSessionFile === realSessionsDir || !isPathInside(realSessionsDir, realSessionFile)) return [];
		const stat = await fs.stat(realSessionFile);
		if (!stat.isFile() || stat.size > 5242880) return [];
		const entries = parseSessionEntries(await fs.readFile(realSessionFile, "utf-8"));
		migrateSessionEntries(entries);
		return entries.filter((entry) => entry.type !== "session");
	} catch {
		return [];
	}
}
async function hasCliSessionTranscript(params) {
	try {
		const { sessionFile, sessionsDir } = resolveSafeCliSessionFile(params);
		const entryStat = await fs.lstat(sessionFile);
		if (!entryStat.isFile() || entryStat.isSymbolicLink()) return false;
		const realSessionsDir = await safeRealpath(sessionsDir) ?? path.resolve(sessionsDir);
		const realSessionFile = await safeRealpath(sessionFile);
		if (!realSessionFile || realSessionFile === realSessionsDir || !isPathInside(realSessionsDir, realSessionFile)) return false;
		const stat = await fs.stat(realSessionFile);
		return stat.isFile() && stat.size <= 5242880;
	} catch {
		return false;
	}
}
async function loadCliSessionHistoryMessages(params) {
	return limitAgentHookHistoryMessages((await loadCliSessionEntries(params)).flatMap((entry) => {
		const candidate = entry;
		return candidate.type === "message" ? [candidate.message] : [];
	}), MAX_CLI_SESSION_HISTORY_MESSAGES);
}
async function loadCliSessionContextEngineMessages(params) {
	const entries = await loadCliSessionEntries(params);
	const latestCompactionIndex = entries.findLastIndex((entry) => {
		const candidate = entry;
		return candidate.type === "compaction" && typeof candidate.summary === "string";
	});
	if (latestCompactionIndex < 0) return loadContextEngineMessagesFromEntries(entries);
	const compaction = entries[latestCompactionIndex];
	const summary = typeof compaction.summary === "string" ? compaction.summary.trim() : "";
	if (!summary) return loadContextEngineMessagesFromEntries(entries);
	const tailMessages = loadContextEngineMessagesFromEntries(entries.slice(latestCompactionIndex + 1));
	return [{
		role: "compactionSummary",
		summary,
		timestamp: coerceHistoryTimestamp(compaction.timestamp),
		tokensBefore: typeof compaction.tokensBefore === "number" ? compaction.tokensBefore : 0,
		...typeof compaction.tokensAfter === "number" ? { tokensAfter: compaction.tokensAfter } : {},
		...typeof compaction.firstKeptEntryId === "string" ? { firstKeptEntryId: compaction.firstKeptEntryId } : {},
		...compaction.details !== void 0 ? { details: compaction.details } : {}
	}, ...tailMessages];
}
async function loadCliSessionReseedMessages(params) {
	const entries = await loadCliSessionEntries(params);
	const loadRawTail = () => {
		if (params.allowRawTranscriptReseed !== true || !params.rawTranscriptReseedReason || !RAW_TRANSCRIPT_RESEED_ALLOWED_REASONS.has(params.rawTranscriptReseedReason)) return [];
		return limitAgentHookHistoryMessages(entries.flatMap((entry) => {
			const candidate = entry;
			return candidate.type === "message" ? [candidate.message] : [];
		}), MAX_CLI_SESSION_HISTORY_MESSAGES);
	};
	const latestCompactionIndex = entries.findLastIndex((entry) => {
		const candidate = entry;
		return candidate.type === "compaction" && typeof candidate.summary === "string";
	});
	if (latestCompactionIndex < 0) return loadRawTail();
	const compaction = entries[latestCompactionIndex];
	const summary = typeof compaction.summary === "string" ? compaction.summary.trim() : "";
	if (!summary) return loadRawTail();
	const tailMessages = entries.slice(latestCompactionIndex + 1).flatMap((entry) => {
		const candidate = entry;
		return candidate.type === "message" ? [candidate.message] : [];
	});
	return [{
		role: "compactionSummary",
		summary
	}, ...limitAgentHookHistoryMessages(tailMessages, MAX_CLI_SESSION_HISTORY_MESSAGES - 1)];
}
//#endregion
export { loadCliSessionReseedMessages as a, loadCliSessionHistoryMessages as i, hasCliSessionTranscript as n, resolveAutoCliSessionReseedHistoryChars as o, loadCliSessionContextEngineMessages as r, buildAgentHookConversationMessages as s, buildCliSessionHistoryPrompt as t };
