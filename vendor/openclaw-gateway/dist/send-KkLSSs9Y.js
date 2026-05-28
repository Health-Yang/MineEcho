import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { r as logVerbose } from "./globals-DZ-ifL5z.js";
import { c as kindFromMime } from "./mime-DppuT-pZ.js";
import { r as stripInlineDirectiveTagsForDelivery } from "./directive-tags-DBD-mk-0.js";
import { t as createMessageReceiptFromOutboundResults } from "./receipt-KEYzve-j.js";
import { t as resolveOutboundAttachmentFromUrl } from "./outbound-attachment-Cwl5taSm.js";
import "./runtime-env-CcOqZeJj.js";
import "./state-paths-CdKTFFfY.js";
import { t as resolveMarkdownTableMode } from "./markdown-tables-B8E9CbD4.js";
import { t as convertMarkdownTables } from "./tables-CSTxKJa3.js";
import { t as requireRuntimeConfig } from "./plugin-config-runtime-CbVZSjfC.js";
import "./channel-outbound-DuRkxH3q.js";
import "./media-runtime-BndVydhQ.js";
import "./text-chunking-CWOBXxG4.js";
import "./markdown-table-runtime-D0twI-Sd.js";
import { a as resolveIMessageAccount } from "./accounts-BET9ibA4.js";
import { t as createIMessageRpcClient } from "./client-bpCbHKc9.js";
import { c as parseIMessageTarget, o as normalizeIMessageHandle, t as formatIMessageChatTarget } from "./targets-BQLF_yw-.js";
import { r as rememberIMessageReplyCache } from "./monitor-reply-cache-CT4PzuVs.js";
import { a as extractIMessageApprovalPromptBinding, i as appendIMessageApprovalReactionHintForOutboundMessage, u as registerIMessageApprovalReactionTargetForOutboundMessage } from "./normalize-C6-Ial3a.js";
import { t as extractMarkdownFormatRuns } from "./markdown-format-Cqti91oT.js";
import { createRequire } from "node:module";
import fs, { accessSync, constants, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
//#region extensions/imessage/src/monitor/persisted-echo-cache.ts
const PERSISTED_ECHO_TTL_MS = 720 * 60 * 1e3;
const MAX_PERSISTED_ECHO_ENTRIES = 256;
const PERSISTED_ECHO_DIR_MODE = 448;
const PERSISTED_ECHO_FILE_MODE = 384;
function resolvePersistedEchoPath() {
	return path.join(resolveStateDir(), "imessage", "sent-echoes.jsonl");
}
function clampPersistedEchoModes(filePath) {
	try {
		fs.chmodSync(path.dirname(filePath), PERSISTED_ECHO_DIR_MODE);
		fs.chmodSync(filePath, PERSISTED_ECHO_FILE_MODE);
	} catch {}
}
function normalizeText(text) {
	return text?.replace(/\r\n?/g, "\n").trim() || void 0;
}
function normalizeMessageId(messageId) {
	const normalized = messageId?.trim();
	if (!normalized || normalized === "ok" || normalized === "unknown") return;
	return normalized;
}
function parseEntry(line) {
	try {
		const parsed = JSON.parse(line);
		if (typeof parsed.scope !== "string" || typeof parsed.timestamp !== "number") return null;
		return {
			scope: parsed.scope,
			text: typeof parsed.text === "string" ? parsed.text : void 0,
			messageId: typeof parsed.messageId === "string" ? parsed.messageId : void 0,
			timestamp: parsed.timestamp
		};
	} catch {
		return null;
	}
}
let mirror = null;
let persistenceFailureLogged = false;
function reportFailure(scope, err) {
	if (persistenceFailureLogged) return;
	persistenceFailureLogged = true;
	logVerbose(`imessage echo-cache: ${scope} disabled after first failure: ${String(err)}`);
}
function loadMirrorIfStale() {
	const filePath = resolvePersistedEchoPath();
	let mtimeMs;
	try {
		mtimeMs = fs.statSync(filePath).mtimeMs;
	} catch (err) {
		if (err?.code !== "ENOENT") reportFailure("stat", err);
		mirror = {
			entries: [],
			mtimeMs: 0
		};
		return;
	}
	if (mirror && mirror.mtimeMs === mtimeMs) return;
	let raw;
	try {
		raw = fs.readFileSync(filePath, "utf8");
	} catch (err) {
		reportFailure("read", err);
		mirror = {
			entries: [],
			mtimeMs
		};
		return;
	}
	const cutoff = Date.now() - PERSISTED_ECHO_TTL_MS;
	mirror = {
		entries: raw.split(/\n+/).map(parseEntry).filter((entry) => Boolean(entry && entry.timestamp >= cutoff)).slice(-256),
		mtimeMs
	};
}
function readRecentEntries() {
	loadMirrorIfStale();
	return mirror?.entries ?? [];
}
const COMPACT_AT_ENTRY_COUNT = MAX_PERSISTED_ECHO_ENTRIES * 2;
function compactRecentEntries(entries) {
	const filePath = resolvePersistedEchoPath();
	try {
		fs.mkdirSync(path.dirname(filePath), {
			recursive: true,
			mode: PERSISTED_ECHO_DIR_MODE
		});
		fs.writeFileSync(filePath, entries.map((entry) => JSON.stringify(entry)).join("\n") + (entries.length ? "\n" : ""), {
			encoding: "utf8",
			mode: PERSISTED_ECHO_FILE_MODE
		});
		clampPersistedEchoModes(filePath);
	} catch (err) {
		reportFailure("compact", err);
		return;
	}
	let mtimeMs = 0;
	try {
		mtimeMs = fs.statSync(filePath).mtimeMs;
	} catch {}
	mirror = {
		entries: [...entries],
		mtimeMs
	};
}
function appendEntry(entry) {
	const filePath = resolvePersistedEchoPath();
	try {
		fs.mkdirSync(path.dirname(filePath), {
			recursive: true,
			mode: PERSISTED_ECHO_DIR_MODE
		});
		fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, {
			encoding: "utf8",
			mode: PERSISTED_ECHO_FILE_MODE
		});
		clampPersistedEchoModes(filePath);
	} catch (err) {
		reportFailure("append", err);
		return;
	}
	let mtimeMs = 0;
	try {
		mtimeMs = fs.statSync(filePath).mtimeMs;
	} catch {}
	if (mirror) mirror = {
		entries: [...mirror.entries, entry],
		mtimeMs
	};
	else mirror = {
		entries: [entry],
		mtimeMs
	};
}
function rememberPersistedIMessageEcho(params) {
	const entry = {
		scope: params.scope,
		text: normalizeText(params.text),
		messageId: normalizeMessageId(params.messageId),
		timestamp: Date.now()
	};
	if (!entry.text && !entry.messageId) return;
	loadMirrorIfStale();
	appendEntry(entry);
	const total = mirror?.entries.length ?? 0;
	const cutoff = Date.now() - PERSISTED_ECHO_TTL_MS;
	const oldestStale = mirror?.entries[0] && mirror.entries[0].timestamp < cutoff;
	if (total > COMPACT_AT_ENTRY_COUNT || oldestStale) compactRecentEntries((mirror?.entries ?? []).filter((e) => e.timestamp >= cutoff).slice(-256));
}
function hasPersistedIMessageEcho(params) {
	const text = normalizeText(params.text);
	const messageId = normalizeMessageId(params.messageId);
	if (!text && !messageId) return false;
	for (const entry of readRecentEntries()) {
		if (entry.scope !== params.scope) continue;
		if (messageId && entry.messageId === messageId) return true;
		if (text && entry.text === text) return true;
	}
	return false;
}
//#endregion
//#region extensions/imessage/src/send.ts
const require = createRequire(import.meta.url);
const MAX_REPLY_TO_ID_LENGTH = 256;
const sshWrapperCliPathCache = /* @__PURE__ */ new Map();
function safeHomeDir() {
	const home = process.env.HOME?.trim();
	if (home) return home;
	try {
		return os.homedir().trim() || void 0;
	} catch {
		return;
	}
}
function expandCliPathForInspection(cliPath) {
	if (!cliPath.startsWith("~")) return cliPath;
	const home = safeHomeDir();
	return home ? cliPath.replace(/^~(?=$|[\\/])/, home) : cliPath;
}
function isSshIMessageCliWrapper(cliPath) {
	if (cliPath === "imsg") return false;
	const cached = sshWrapperCliPathCache.get(cliPath);
	if (cached !== void 0) return cached;
	let detected = false;
	try {
		const content = readFileSync(expandCliPathForInspection(cliPath), "utf8");
		detected = /\bssh\b[\s\S]*\bimsg\b/u.test(content);
	} catch {
		detected = false;
	}
	sshWrapperCliPathCache.set(cliPath, detected);
	return detected;
}
function isLocalIMessageCliPath(params) {
	const cliPath = params.cliPath.trim();
	if (params.remoteHost?.trim() || isSshIMessageCliWrapper(cliPath)) return false;
	return cliPath === "imsg" || path.basename(cliPath) === "imsg";
}
function resolveChatDbLookupPath(params) {
	const configured = params.dbPath?.trim();
	if (configured) return configured;
	if (!isLocalIMessageCliPath({
		cliPath: params.cliPath,
		remoteHost: params.remoteHost
	})) return;
	const home = safeHomeDir();
	return home ? path.join(home, "Library", "Messages", "chat.db") : void 0;
}
function stripUnsafeReplyTagChars(value) {
	let next = "";
	for (const ch of value) {
		const code = ch.charCodeAt(0);
		if (code >= 0 && code <= 31 || code === 127 || ch === "[" || ch === "]") continue;
		next += ch;
	}
	return next;
}
function sanitizeReplyToId(rawReplyToId) {
	const trimmed = rawReplyToId?.trim();
	if (!trimmed) return;
	const sanitized = stripUnsafeReplyTagChars(trimmed).trim();
	if (!sanitized) return;
	if (sanitized.length > MAX_REPLY_TO_ID_LENGTH) return sanitized.slice(0, MAX_REPLY_TO_ID_LENGTH);
	return sanitized;
}
function resolveMessageId(result) {
	if (!result) return null;
	const raw = typeof result.messageId === "string" && result.messageId.trim() || typeof result.message_id === "string" && result.message_id.trim() || typeof result.id === "string" && result.id.trim() || typeof result.guid === "string" && result.guid.trim() || (typeof result.message_id === "number" ? String(result.message_id) : null) || (typeof result.id === "number" ? String(result.id) : null);
	return raw ? raw.trim() : null;
}
function resolveOutboundMessageGuid(result) {
	if (!result) return null;
	const candidates = [
		result.guid,
		result.messageId,
		result.message_id,
		result.id
	];
	for (const value of candidates) {
		if (typeof value !== "string") continue;
		const trimmed = value.trim();
		if (trimmed && !/^\d+$/.test(trimmed)) return trimmed;
	}
	return null;
}
function isNumericMessageRowId(value) {
	return typeof value === "string" && /^\d+$/.test(value.trim());
}
function normalizeResolvedMessageGuid(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed && !isNumericMessageRowId(trimmed) ? trimmed : null;
}
function loadNodeSqlite() {
	try {
		return require("node:sqlite");
	} catch {
		return null;
	}
}
function resolveMessageGuidFromChatDb(params) {
	const dbPath = params.dbPath?.trim();
	const messageId = params.messageId.trim();
	if (!dbPath || !isNumericMessageRowId(messageId)) return null;
	const sqlite = loadNodeSqlite();
	if (!sqlite) return null;
	let db = null;
	try {
		db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
		return normalizeResolvedMessageGuid(db.prepare("SELECT guid FROM message WHERE ROWID = ?").get(messageId)?.guid);
	} catch {
		return null;
	} finally {
		try {
			db?.close();
		} catch {}
	}
}
function getStringRowValue(row, key) {
	return normalizeResolvedMessageGuid(row?.[key]);
}
function appleMessageDateLowerBoundMs(sentAfterMs) {
	if (!Number.isFinite(sentAfterMs)) return null;
	return Math.max(0, Math.floor((sentAfterMs - 9783072e5 - 5e3) * 1e6));
}
function resolveLatestSentMessageGuidFromChatDb(params) {
	const dbPath = params.dbPath?.trim();
	if (!dbPath) return null;
	const sqlite = loadNodeSqlite();
	if (!sqlite) return null;
	let db = null;
	try {
		db = new sqlite.DatabaseSync(dbPath, { readOnly: true });
		const targetClauses = [];
		const targetParams = [];
		const lowerBound = appleMessageDateLowerBoundMs(params.sentAfterMs);
		if (params.text) {
			targetClauses.push("m.text = ?");
			targetParams.push(params.text);
		}
		if (lowerBound !== null) {
			targetClauses.push("m.date >= ?");
			targetParams.push(lowerBound);
		}
		if (params.target.kind === "chat_id") {
			targetClauses.push("cmj.chat_id = ?");
			targetParams.push(params.target.chatId);
		} else if (params.target.kind === "chat_guid") {
			targetClauses.push("c.guid = ?");
			targetParams.push(params.target.chatGuid);
		} else if (params.target.kind === "chat_identifier") {
			targetClauses.push("c.chat_identifier = ?");
			targetParams.push(params.target.chatIdentifier);
		} else {
			const normalizedHandle = normalizeIMessageHandle(params.target.to);
			targetClauses.push("(h.id = ? OR h.uncanonicalized_id = ?)");
			targetParams.push(normalizedHandle, params.target.to);
		}
		const selectSql = `
      SELECT m.guid
      FROM message m
      LEFT JOIN chat_message_join cmj ON cmj.message_id = m.ROWID
      LEFT JOIN chat c ON c.ROWID = cmj.chat_id
      LEFT JOIN handle h ON h.ROWID = m.handle_id
      WHERE m.is_from_me = 1
      ${targetClauses.length ? `AND ${targetClauses.join(" AND ")}` : ""}
      ORDER BY m.date DESC, m.ROWID DESC
      LIMIT 10
    `;
		return getStringRowValue(db.prepare(selectSql).all(...targetParams)[0], "guid");
	} catch {
		return null;
	} finally {
		try {
			db?.close();
		} catch {}
	}
}
function canResolveLatestSentMessageGuidFromChatDb(dbPath) {
	const normalizedDbPath = dbPath?.trim();
	if (!normalizedDbPath || !loadNodeSqlite()) return false;
	try {
		accessSync(normalizedDbPath, constants.R_OK);
		return true;
	} catch {
		return false;
	}
}
async function resolveApprovalBindingMessageGuid(params) {
	const immediateGuid = resolveOutboundMessageGuid(params.result);
	if (immediateGuid) return immediateGuid;
	const messageId = params.messageId?.trim();
	if (!messageId || !isNumericMessageRowId(messageId)) return null;
	return normalizeResolvedMessageGuid(await (params.resolveMessageGuidImpl ?? resolveMessageGuidFromChatDb)({
		dbPath: params.dbPath,
		messageId
	}));
}
function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
async function resolveFallbackSentMessageGuid(params) {
	const resolver = params.resolveSentMessageGuidImpl ?? resolveLatestSentMessageGuidFromChatDb;
	if (!params.resolveSentMessageGuidImpl && !canResolveLatestSentMessageGuidFromChatDb(params.dbPath)) return null;
	const deadlineMs = Date.now() + 5e3;
	while (Date.now() <= deadlineMs) {
		const resolved = normalizeResolvedMessageGuid(await resolver({
			dbPath: params.dbPath,
			target: params.target,
			text: params.text,
			sentAfterMs: params.sentAfterMs
		}));
		if (resolved) return resolved;
		if (Date.now() >= deadlineMs) return null;
		await delay(250);
	}
	return null;
}
function shouldRecoverApprovalPromptGuid(params) {
	return !params.filePath && !params.replyToId && Boolean(params.message.trim()) && Boolean(extractIMessageApprovalPromptBinding(params.message));
}
function resolveOutboundEchoText(text, mediaContentType) {
	if (text.trim()) return text;
	const kind = kindFromMime(mediaContentType ?? void 0);
	if (!kind) return;
	return kind === "image" ? "<media:image>" : `<media:${kind}>`;
}
function createIMessageSendReceipt(params) {
	const messageId = params.messageId.trim();
	const results = messageId && messageId !== "unknown" && messageId !== "ok" ? [{
		channel: "imessage",
		messageId,
		meta: { targetKind: params.target.kind }
	}] : [];
	if (results[0]) {
		if (params.target.kind === "chat_id") results[0].chatId = String(params.target.chatId);
		else if (params.target.kind === "chat_guid") results[0].conversationId = params.target.chatGuid;
		else if (params.target.kind === "chat_identifier") results[0].conversationId = params.target.chatIdentifier;
	}
	const receiptParams = {
		results,
		kind: params.kind
	};
	if (params.replyToId) receiptParams.replyToId = params.replyToId;
	return createMessageReceiptFromOutboundResults(receiptParams);
}
function resolveOutboundEchoScope(params) {
	if (params.target.kind === "chat_id") return `${params.accountId}:${formatIMessageChatTarget(params.target.chatId)}`;
	if (params.target.kind === "chat_guid") return `${params.accountId}:chat_guid:${params.target.chatGuid}`;
	if (params.target.kind === "chat_identifier") return `${params.accountId}:chat_identifier:${params.target.chatIdentifier}`;
	return `${params.accountId}:imessage:${params.target.to}`;
}
function buildIMessageCliJsonArgs(args, dbPath) {
	const trimmedDbPath = dbPath?.trim();
	return [
		...args,
		...trimmedDbPath ? ["--db", trimmedDbPath] : [],
		"--json"
	];
}
function resolveIMessageCliFailure(result) {
	if (result.success !== false) return null;
	return typeof result.error === "string" && result.error.trim() ? result.error.trim() : "iMessage action failed";
}
function isIMessageRpcSendTimeout(error) {
	const message = error instanceof Error ? error.message : String(error);
	return /imsg rpc timeout \(send\)/i.test(message);
}
async function runIMessageCliJson(cliPath, dbPath, args, timeoutMs) {
	return await new Promise((resolve, reject) => {
		const child = spawn(cliPath, buildIMessageCliJsonArgs(args, dbPath), { stdio: [
			"ignore",
			"pipe",
			"pipe"
		] });
		let stdout = "";
		let stderr = "";
		let killEscalation = null;
		const timer = timeoutMs && timeoutMs > 0 ? setTimeout(() => {
			child.kill("SIGTERM");
			killEscalation = setTimeout(() => {
				try {
					child.kill("SIGKILL");
				} catch {}
			}, 2e3);
			reject(/* @__PURE__ */ new Error(`iMessage action timed out after ${timeoutMs}ms`));
		}, timeoutMs) : null;
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.on("error", (error) => {
			if (timer) clearTimeout(timer);
			if (killEscalation) clearTimeout(killEscalation);
			reject(error);
		});
		child.on("close", (code) => {
			if (timer) clearTimeout(timer);
			if (killEscalation) clearTimeout(killEscalation);
			const last = stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).at(-1);
			let parsed = null;
			if (last) try {
				const json = JSON.parse(last);
				if (json && typeof json === "object" && !Array.isArray(json)) parsed = json;
			} catch {}
			if (code === 0 && parsed) {
				const failure = resolveIMessageCliFailure(parsed);
				if (failure) {
					reject(new Error(failure));
					return;
				}
				resolve(parsed);
				return;
			}
			if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
				reject(new Error(parsed.error.trim()));
				return;
			}
			const detail = stderr.trim() || stdout.trim() || `imsg exited with code ${code}`;
			reject(new Error(detail));
		});
	});
}
function stringValue(value) {
	return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function isAttachmentCommandFallbackError(error) {
	const message = error instanceof Error ? error.message : String(error);
	return /(?:unknown|unrecognized|invalid|unsupported)\s+(?:command|subcommand)|not a recognized command|send-attachment.*(?:not found|unsupported|unavailable)|private api bridge.*unavailable|requires the imsg private api bridge|run imsg launch/iu.test(message);
}
async function resolveAttachmentChatGuid(params) {
	if (params.target.kind === "chat_guid") return params.target.chatGuid;
	if (params.target.kind !== "chat_id") return null;
	const result = await params.runCliJson([
		"group",
		"--chat-id",
		String(params.target.chatId)
	]);
	return stringValue(result.guid) ?? stringValue(result.chat_guid) ?? null;
}
async function trySendAttachmentForExplicitChat(params) {
	let attachmentChatGuid = null;
	try {
		attachmentChatGuid = await resolveAttachmentChatGuid({
			target: params.target,
			runCliJson: params.runCliJson
		});
	} catch (error) {
		if (isAttachmentCommandFallbackError(error)) return null;
		throw error;
	}
	if (!attachmentChatGuid) return null;
	let result;
	try {
		result = await params.runCliJson([
			"send-attachment",
			"--chat",
			attachmentChatGuid,
			"--file",
			params.filePath,
			"--transport",
			"auto"
		]);
	} catch (error) {
		if (isAttachmentCommandFallbackError(error)) return null;
		throw error;
	}
	const failure = resolveIMessageCliFailure(result);
	if (failure) {
		const error = new Error(failure);
		if (isAttachmentCommandFallbackError(error)) return null;
		throw error;
	}
	const resolvedId = resolveMessageId(result);
	const approvalBindingMessageId = await resolveApprovalBindingMessageGuid({
		dbPath: params.dbPath,
		messageId: resolvedId,
		result,
		resolveMessageGuidImpl: params.resolveMessageGuidImpl
	});
	const messageId = resolvedId ?? (result.ok || result.success ? "ok" : "unknown");
	const echoScope = resolveOutboundEchoScope({
		accountId: params.accountId,
		target: params.target
	});
	if (echoScope) rememberPersistedIMessageEcho({
		scope: echoScope,
		text: params.echoText,
		messageId: resolvedId ?? void 0
	});
	if (resolvedId) rememberIMessageReplyCache({
		accountId: params.accountId,
		messageId: resolvedId,
		chatGuid: params.target.kind === "chat_guid" ? params.target.chatGuid : attachmentChatGuid,
		chatId: params.target.kind === "chat_id" ? params.target.chatId : void 0,
		timestamp: Date.now(),
		isFromMe: true
	});
	return {
		messageId,
		...approvalBindingMessageId ? { guid: approvalBindingMessageId } : {},
		sentText: "",
		...params.echoText ? { echoText: params.echoText } : {},
		receipt: createIMessageSendReceipt({
			messageId,
			target: params.target,
			kind: "media"
		})
	};
}
async function sendMessageIMessage(to, text, opts) {
	const cfg = requireRuntimeConfig(opts.config, "iMessage send");
	const account = opts.account ?? resolveIMessageAccount({
		cfg,
		accountId: opts.accountId
	});
	const cliPath = opts.cliPath?.trim() || account.config.cliPath?.trim() || "imsg";
	const dbPath = opts.dbPath?.trim() || account.config.dbPath?.trim();
	const chatDbLookupPath = resolveChatDbLookupPath({
		cliPath,
		dbPath,
		remoteHost: account.config.remoteHost
	});
	const target = parseIMessageTarget(opts.chatId ? formatIMessageChatTarget(opts.chatId) : to);
	const service = opts.service ?? (target.kind === "handle" ? target.service : void 0) ?? account.config.service;
	const region = opts.region?.trim() || account.config.region?.trim() || "US";
	const maxBytes = typeof opts.maxBytes === "number" ? opts.maxBytes : typeof account.config.mediaMaxMb === "number" ? account.config.mediaMaxMb * 1024 * 1024 : 16 * 1024 * 1024;
	let message = text ? appendIMessageApprovalReactionHintForOutboundMessage(text) : "";
	let filePath;
	let mediaContentType;
	if (opts.mediaUrl?.trim()) {
		const resolved = await (opts.resolveAttachmentImpl ?? resolveOutboundAttachmentFromUrl)(opts.mediaUrl.trim(), maxBytes, {
			localRoots: opts.mediaLocalRoots,
			readFile: opts.mediaReadFile
		});
		filePath = resolved.path;
		mediaContentType = resolved.contentType ?? void 0;
	}
	if (!message.trim() && !filePath) throw new Error("iMessage send requires text or media");
	if (message.trim()) {
		const tableMode = resolveMarkdownTableMode({
			cfg,
			channel: "imessage",
			accountId: account.accountId
		});
		message = convertMarkdownTables(message, tableMode);
	}
	message = stripInlineDirectiveTagsForDelivery(message).text;
	if (!message.trim() && !filePath) throw new Error("iMessage send requires text or media");
	const formatted = message.trim() ? extractMarkdownFormatRuns(message) : {
		text: message,
		ranges: []
	};
	message = formatted.text;
	if (!message.trim() && !filePath) throw new Error("iMessage send requires text or media");
	const echoText = resolveOutboundEchoText(message, filePath ? mediaContentType : void 0);
	const resolvedReplyToId = sanitizeReplyToId(opts.replyToId);
	const runCliJson = opts.runCliJson ?? ((args) => runIMessageCliJson(cliPath, dbPath, args, opts.timeoutMs));
	if (filePath && !message.trim() && !resolvedReplyToId) {
		const attachmentResult = await trySendAttachmentForExplicitChat({
			accountId: account.accountId,
			dbPath: chatDbLookupPath,
			target,
			filePath,
			echoText,
			runCliJson,
			resolveMessageGuidImpl: opts.resolveMessageGuidImpl
		});
		if (attachmentResult) return attachmentResult;
	}
	const params = {
		text: message,
		service: service || "auto",
		region
	};
	if (resolvedReplyToId) params.reply_to = resolvedReplyToId;
	if (formatted.ranges.length > 0) params.formatting = formatted.ranges;
	if (filePath) params.file = filePath;
	if (target.kind === "chat_id") params.chat_id = target.chatId;
	else if (target.kind === "chat_guid") params.chat_guid = target.chatGuid;
	else if (target.kind === "chat_identifier") params.chat_identifier = target.chatIdentifier;
	else params.to = target.to;
	const client = opts.client ?? (opts.createClient ? await opts.createClient({
		cliPath,
		dbPath
	}) : await createIMessageRpcClient({
		cliPath,
		dbPath
	}));
	let shouldClose = !opts.client;
	let result;
	let sendStartedAtMs = Date.now();
	try {
		try {
			result = await client.request("send", params, { timeoutMs: opts.timeoutMs });
		} catch (error) {
			if (filePath || resolvedReplyToId || !isIMessageRpcSendTimeout(error)) throw error;
			if (!shouldRecoverApprovalPromptGuid({
				message,
				filePath,
				replyToId: resolvedReplyToId
			})) throw error;
			const recoveredGuid = await resolveFallbackSentMessageGuid({
				dbPath: chatDbLookupPath,
				target,
				text: message,
				sentAfterMs: sendStartedAtMs,
				resolveSentMessageGuidImpl: opts.resolveSentMessageGuidImpl
			});
			if (!recoveredGuid) throw error;
			result = {
				guid: recoveredGuid,
				status: "sent"
			};
		}
		const resolvedId = resolveMessageId(result);
		const messageId = resolvedId ?? (result?.ok || result?.success || result?.status === "sent" ? "ok" : "unknown");
		let approvalBindingMessageId = await resolveApprovalBindingMessageGuid({
			dbPath: chatDbLookupPath,
			messageId: resolvedId,
			result,
			resolveMessageGuidImpl: opts.resolveMessageGuidImpl
		});
		if (!approvalBindingMessageId && shouldRecoverApprovalPromptGuid({
			message,
			filePath,
			replyToId: resolvedReplyToId
		})) approvalBindingMessageId = await resolveFallbackSentMessageGuid({
			dbPath: chatDbLookupPath,
			target,
			text: message,
			sentAfterMs: sendStartedAtMs,
			resolveSentMessageGuidImpl: opts.resolveSentMessageGuidImpl
		});
		const echoScope = resolveOutboundEchoScope({
			accountId: account.accountId,
			target
		});
		if (echoScope) rememberPersistedIMessageEcho({
			scope: echoScope,
			text: echoText,
			messageId: resolvedId ?? void 0
		});
		if (resolvedId) rememberIMessageReplyCache({
			accountId: account.accountId,
			messageId: resolvedId,
			chatGuid: target.kind === "chat_guid" ? target.chatGuid : void 0,
			chatIdentifier: target.kind === "chat_identifier" ? target.chatIdentifier : target.kind === "handle" ? `${target.service === "sms" ? "SMS" : "iMessage"};-;${target.to}` : void 0,
			chatId: target.kind === "chat_id" ? target.chatId : void 0,
			timestamp: Date.now(),
			isFromMe: true
		});
		if (message && approvalBindingMessageId) {
			const handleForKey = target.kind === "handle" ? normalizeIMessageHandle(target.to) : void 0;
			const conversation = {
				...target.kind === "chat_guid" ? { chatGuid: target.chatGuid } : {},
				...target.kind === "chat_identifier" ? { chatIdentifier: target.chatIdentifier } : {},
				...target.kind === "chat_id" ? { chatId: target.chatId } : {},
				...handleForKey ? { handle: handleForKey } : {}
			};
			registerIMessageApprovalReactionTargetForOutboundMessage({
				accountId: account.accountId,
				conversation,
				messageId: approvalBindingMessageId,
				text: message
			});
		}
		return {
			messageId,
			...approvalBindingMessageId ? { guid: approvalBindingMessageId } : {},
			sentText: message,
			...echoText ? { echoText } : {},
			receipt: createIMessageSendReceipt({
				messageId,
				target,
				kind: filePath ? "media" : "text",
				...resolvedReplyToId ? { replyToId: resolvedReplyToId } : {}
			})
		};
	} finally {
		if (shouldClose) await client.stop();
	}
}
//#endregion
export { hasPersistedIMessageEcho as n, sendMessageIMessage as t };
