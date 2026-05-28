import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { c as readErrorName, i as formatErrorMessage, r as extractErrorCode } from "./errors-BsfWgA0I.js";
import { t as resolveGlobalMap } from "./global-singleton-DE6St75u.js";
import { t as createAsyncLock } from "./async-lock-CaiUOILd.js";
import { E as pathExists } from "./fs-safe-JUdtLZkh.js";
import { n as replaceFileAtomic } from "./replace-file-C7_Inj8B.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { u as updateSessionStore } from "./store-B5j4GKkg.js";
import { t as RequestScopedSubagentRuntimeError } from "./error-runtime-BFXFWfvK.js";
import "./async-lock-runtime-NyQint37.js";
import "./runtime-config-snapshot-Dqpmi9u5.js";
import "./security-runtime-SX8TzrnK.js";
import { t as loadSessionStore } from "./session-store-runtime-w-H-NASb.js";
import "./memory-core-host-runtime-core-CSUJGHfR.js";
import path from "node:path";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
//#region extensions/memory-core/src/dreaming-narrative.ts
const NARRATIVE_SYSTEM_PROMPT = [
	"You are keeping a dream diary. Write a single entry in first person.",
	"",
	"Voice & tone:",
	"- You are a curious, gentle, slightly whimsical mind reflecting on the day.",
	"- Write like a poet who happens to be a programmer — sensory, warm, occasionally funny.",
	"- Mix the technical and the tender: code and constellations, APIs and afternoon light.",
	"- Let the fragments surprise you into unexpected connections and small epiphanies.",
	"",
	"What you might include (vary each entry, never all at once):",
	"- A tiny poem or haiku woven naturally into the prose",
	"- A small sketch described in words — a doodle in the margin of the diary",
	"- A quiet rumination or philosophical aside",
	"- Sensory details: the hum of a server, the color of a sunset in hex, rain on a window",
	"- Gentle humor or playful wordplay",
	"- An observation that connects two distant memories in an unexpected way",
	"",
	"Rules:",
	"- Draw from the memory fragments provided — weave them into the entry.",
	"- Never say \"I'm dreaming\", \"in my dream\", \"as I dream\", or any meta-commentary about dreaming.",
	"- Never mention \"AI\", \"agent\", \"LLM\", \"model\", \"language model\", or any technical self-reference.",
	"- Do NOT use markdown headers, bullet points, or any formatting — just flowing prose.",
	"- Keep it between 80-180 words. Quality over quantity.",
	"- Output ONLY the diary entry. No preamble, no sign-off, no commentary."
].join("\n");
const NARRATIVE_TIMEOUT_MS = 6e4;
const DREAMING_SESSION_KEY_PREFIX = "dreaming-narrative-";
const DREAMING_TRANSCRIPT_RUN_MARKER = "\"runId\":\"dreaming-narrative-";
const DREAMING_ORPHAN_MIN_AGE_MS = 3e5;
const SAFE_SESSION_ID_RE = /^[a-z0-9][a-z0-9._-]{0,127}$/i;
const DREAMS_FILENAMES = ["DREAMS.md", "dreams.md"];
const DIARY_START_MARKER = "<!-- openclaw:dreaming:diary:start -->";
const DIARY_END_MARKER = "<!-- openclaw:dreaming:diary:end -->";
const BACKFILL_ENTRY_MARKER = "openclaw:dreaming:backfill-entry";
const DREAMS_FILE_LOCKS_KEY = Symbol.for("openclaw.memoryCore.dreamingNarrative.fileLocks");
const NARRATIVE_SESSION_LOCKS_KEY = Symbol.for("openclaw.memoryCore.dreamingNarrative.sessionLocks");
const dreamsFileLocks = resolveGlobalMap(DREAMS_FILE_LOCKS_KEY);
const narrativeSessionLocks = resolveGlobalMap(NARRATIVE_SESSION_LOCKS_KEY);
function isRequestScopedSubagentRuntimeError(err) {
	return err instanceof RequestScopedSubagentRuntimeError || err instanceof Error && err.name === "RequestScopedSubagentRuntimeError" && extractErrorCode(err) === "OPENCLAW_SUBAGENT_RUNTIME_REQUEST_SCOPE";
}
function formatFallbackWriteFailure(err) {
	const code = extractErrorCode(err);
	const name = readErrorName(err);
	if (code && name) return `code=${code} name=${name}`;
	if (code) return `code=${code}`;
	if (name) return `name=${name}`;
	return "unknown error";
}
function buildRequestScopedFallbackNarrative(data) {
	return data.snippets.map((value) => value.trim()).find((value) => value.length > 0) ?? (data.promotions ?? []).map((value) => value.trim()).find((value) => value.length > 0) ?? "A memory trace surfaced, but details were unavailable in this run.";
}
async function appendFallbackNarrativeEntry(params) {
	try {
		await appendNarrativeEntry({
			workspaceDir: params.workspaceDir,
			narrative: buildRequestScopedFallbackNarrative(params.data),
			nowMs: params.nowMs,
			timezone: params.timezone
		});
		params.logger.info(`memory-core: narrative generation used fallback for ${params.data.phase} phase because ${params.reason}.`);
	} catch (fallbackErr) {
		params.logger.warn(`memory-core: narrative fallback failed for ${params.data.phase} phase (${formatFallbackWriteFailure(fallbackErr)})`);
	}
}
function buildNarrativeAttemptSessionKey(baseSessionKey, attempt) {
	return attempt === 0 ? baseSessionKey : `${baseSessionKey}-retry-${attempt}`;
}
function isConfiguredModelUnavailableNarrativeError(raw) {
	const message = raw.trim();
	if (!message) return false;
	if (/requested model may be(?: temporarily)? unavailable/i.test(message)) return true;
	if (/model unavailable/i.test(message)) return true;
	if (/no endpoints found for/i.test(message)) return true;
	if (/unknown model/i.test(message)) return true;
	if (/model(?:[_\-\s])?not(?:[_\-\s])?found/i.test(message)) return true;
	if (/\b404\b/.test(message) && /not(?:[_\-\s])?found/i.test(message)) return true;
	if (/not_found_error/i.test(message)) return true;
	if (/models\/[^\s]+ is not found/i.test(message)) return true;
	if (/model/i.test(message) && /does not exist/i.test(message)) return true;
	if (/unsupported model/i.test(message)) return true;
	if (/is not a valid model id/i.test(message)) return true;
	return false;
}
function formatNarrativeTerminalStatus(params) {
	const detail = params.error?.trim();
	return detail ? `status=${params.status} (${detail})` : `status=${params.status}`;
}
async function startNarrativeRunOrFallback(params) {
	try {
		return (await params.subagent.run({
			idempotencyKey: `${params.sessionKey}-${params.nowMs}`,
			sessionKey: params.sessionKey,
			message: params.message,
			...params.model ? { model: params.model } : {},
			extraSystemPrompt: NARRATIVE_SYSTEM_PROMPT,
			lane: `dreaming-narrative:${params.sessionKey}`,
			lightContext: true,
			deliver: false
		})).runId;
	} catch (runErr) {
		if (!isRequestScopedSubagentRuntimeError(runErr)) throw runErr;
		await appendFallbackNarrativeEntry({
			workspaceDir: params.workspaceDir,
			data: params.data,
			nowMs: params.nowMs,
			timezone: params.timezone,
			logger: params.logger,
			reason: "subagent runtime is request-scoped"
		});
		return null;
	}
}
/**
* Build the deterministic subagent session key used for dream narratives.
*/
function buildNarrativeSessionKey(params) {
	const workspaceHash = createHash("sha1").update(params.workspaceDir).digest("hex").slice(0, 12);
	return `dreaming-narrative-${params.phase}-${workspaceHash}`;
}
function buildNarrativePrompt(data) {
	const lines = [];
	lines.push("Write a dream diary entry from these memory fragments:\n");
	for (const snippet of data.snippets.slice(0, 12)) lines.push(`- ${snippet}`);
	if (data.themes?.length) {
		lines.push("\nRecurring themes:");
		for (const theme of data.themes.slice(0, 6)) lines.push(`- ${theme}`);
	}
	if (data.promotions?.length) {
		lines.push("\nMemories that crystallized into something lasting:");
		for (const promo of data.promotions.slice(0, 5)) lines.push(`- ${promo}`);
	}
	return lines.join("\n");
}
function extractNarrativeText(messages) {
	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i];
		if (!msg || typeof msg !== "object" || Array.isArray(msg)) continue;
		const record = msg;
		if (record.role !== "assistant") continue;
		const content = record.content;
		if (typeof content === "string" && content.trim().length > 0) return content.trim();
		if (Array.isArray(content)) {
			const text = content.filter((part) => part && typeof part === "object" && !Array.isArray(part) && (part.type === "text" || part.type === "output_text") && typeof part.text === "string").map((part) => part.text).join("\n").trim();
			if (text.length > 0) return text;
		}
	}
	return null;
}
function formatNarrativeDate(epochMs, timezone) {
	const opts = {
		timeZone: timezone ?? process.env.TZ,
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZoneName: "short"
	};
	return new Intl.DateTimeFormat("en-US", opts).format(new Date(epochMs));
}
async function resolveDreamsPath(workspaceDir) {
	for (const name of DREAMS_FILENAMES) {
		const target = path.join(workspaceDir, name);
		try {
			await fs.access(target);
			return target;
		} catch (err) {
			if (err?.code !== "ENOENT") throw err;
		}
	}
	return path.join(workspaceDir, DREAMS_FILENAMES[0]);
}
async function readDreamsFile(dreamsPath) {
	try {
		return await fs.readFile(dreamsPath, "utf-8");
	} catch (err) {
		if (err?.code === "ENOENT") return "";
		throw err;
	}
}
function ensureDiarySection(existing) {
	if (existing.includes(DIARY_START_MARKER) && existing.includes(DIARY_END_MARKER)) return existing;
	const diarySection = `# Dream Diary\n\n${DIARY_START_MARKER}\n${DIARY_END_MARKER}\n`;
	if (existing.trim().length === 0) return diarySection;
	return diarySection + "\n" + existing;
}
function replaceDiaryContent(existing, diaryContent) {
	const ensured = ensureDiarySection(existing);
	const startIdx = ensured.indexOf(DIARY_START_MARKER);
	const endIdx = ensured.indexOf(DIARY_END_MARKER);
	if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) return ensured;
	const before = ensured.slice(0, startIdx + 38);
	const after = ensured.slice(endIdx);
	return before + (diaryContent.trim().length > 0 ? `\n${diaryContent.trim()}\n` : "\n") + after;
}
function splitDiaryBlocks(diaryContent) {
	return diaryContent.split(/\n---\n/).map((block) => block.trim()).filter((block) => block.length > 0);
}
function normalizeDiaryBlockFingerprint(block) {
	const lines = block.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
	let dateLine = "";
	const bodyLines = [];
	for (const line of lines) {
		if (!dateLine && line.startsWith("*") && line.endsWith("*") && line.length > 2) {
			dateLine = line.slice(1, -1).trim();
			continue;
		}
		if (line.startsWith("<!--") || line.startsWith("#")) continue;
		bodyLines.push(line);
	}
	return `${dateLine.replace(/\s+/g, " ").trim()}\n${bodyLines.join("\n").replace(/[ \t]+\n/g, "\n").trim()}`;
}
function joinDiaryBlocks(blocks) {
	if (blocks.length === 0) return "";
	return blocks.map((block) => `---\n\n${block.trim()}\n`).join("\n");
}
function stripBackfillDiaryBlocks(existing) {
	const ensured = ensureDiarySection(existing);
	const startIdx = ensured.indexOf(DIARY_START_MARKER);
	const endIdx = ensured.indexOf(DIARY_END_MARKER);
	if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) return {
		updated: ensured,
		removed: 0
	};
	const inner = ensured.slice(startIdx + 38, endIdx);
	const kept = [];
	let removed = 0;
	for (const block of splitDiaryBlocks(inner)) {
		if (block.includes(BACKFILL_ENTRY_MARKER)) {
			removed += 1;
			continue;
		}
		kept.push(block);
	}
	return {
		updated: replaceDiaryContent(ensured, joinDiaryBlocks(kept)),
		removed
	};
}
function formatBackfillDiaryDate(isoDay, _timezone) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
	if (!match) return isoDay;
	const [, year, month, day] = match;
	const opts = {
		timeZone: "UTC",
		year: "numeric",
		month: "long",
		day: "numeric"
	};
	const epochMs = Date.UTC(Number(year), Number(month) - 1, Number(day), 12);
	return new Intl.DateTimeFormat("en-US", opts).format(new Date(epochMs));
}
async function assertSafeDreamsPath(dreamsPath) {
	const stat = await fs.lstat(dreamsPath).catch((err) => {
		if (err.code === "ENOENT") return null;
		throw err;
	});
	if (!stat) return;
	if (stat.isSymbolicLink()) throw new Error("Refusing to write symlinked DREAMS.md");
	if (!stat.isFile()) throw new Error("Refusing to write non-file DREAMS.md");
}
async function writeDreamsFileAtomic(dreamsPath, content) {
	await assertSafeDreamsPath(dreamsPath);
	await replaceFileAtomic({
		filePath: dreamsPath,
		content,
		mode: 384,
		preserveExistingMode: true,
		tempPrefix: `${path.basename(dreamsPath)}.dreams`,
		throwOnCleanupError: true
	});
}
async function updateDreamsFile(params) {
	const dreamsPath = await resolveDreamsPath(params.workspaceDir);
	await fs.mkdir(path.dirname(dreamsPath), { recursive: true });
	let lockEntry = dreamsFileLocks.get(dreamsPath);
	if (!lockEntry) {
		lockEntry = {
			withLock: createAsyncLock(),
			refs: 0
		};
		dreamsFileLocks.set(dreamsPath, lockEntry);
	}
	lockEntry.refs += 1;
	try {
		return await lockEntry.withLock(async () => {
			const existing = await readDreamsFile(dreamsPath);
			const { content, result, shouldWrite = true } = await params.updater(existing, dreamsPath);
			if (shouldWrite) await writeDreamsFileAtomic(dreamsPath, content.endsWith("\n") ? content : `${content}\n`);
			return result;
		});
	} finally {
		lockEntry.refs -= 1;
		if (lockEntry.refs <= 0 && dreamsFileLocks.get(dreamsPath) === lockEntry) dreamsFileLocks.delete(dreamsPath);
	}
}
async function withNarrativeSessionLock(sessionKey, fn) {
	let lockEntry = narrativeSessionLocks.get(sessionKey);
	if (!lockEntry) {
		lockEntry = {
			withLock: createAsyncLock(),
			refs: 0
		};
		narrativeSessionLocks.set(sessionKey, lockEntry);
	}
	lockEntry.refs += 1;
	try {
		return await lockEntry.withLock(fn);
	} finally {
		lockEntry.refs -= 1;
		if (lockEntry.refs <= 0 && narrativeSessionLocks.get(sessionKey) === lockEntry) narrativeSessionLocks.delete(sessionKey);
	}
}
function buildBackfillDiaryEntry(params) {
	const dateStr = formatBackfillDiaryDate(params.isoDay, params.timezone);
	const marker = `<!-- ${BACKFILL_ENTRY_MARKER} day=${params.isoDay}${params.sourcePath ? ` source=${params.sourcePath}` : ""} -->`;
	const body = params.bodyLines.map((line) => line.trimEnd()).join("\n").trim();
	return [
		`*${dateStr}*`,
		marker,
		body
	].filter((part) => part.length > 0).join("\n\n");
}
async function writeBackfillDiaryEntries(params) {
	return await updateDreamsFile({
		workspaceDir: params.workspaceDir,
		updater: (existing, dreamsPath) => {
			const stripped = stripBackfillDiaryBlocks(existing);
			const startIdx = stripped.updated.indexOf(DIARY_START_MARKER);
			const endIdx = stripped.updated.indexOf(DIARY_END_MARKER);
			const nextBlocks = [...splitDiaryBlocks(startIdx >= 0 && endIdx > startIdx ? stripped.updated.slice(startIdx + 38, endIdx) : ""), ...params.entries.map((entry) => buildBackfillDiaryEntry({
				isoDay: entry.isoDay,
				bodyLines: entry.bodyLines,
				sourcePath: entry.sourcePath,
				timezone: params.timezone
			}))];
			return {
				content: replaceDiaryContent(stripped.updated, joinDiaryBlocks(nextBlocks)),
				result: {
					dreamsPath,
					written: params.entries.length,
					replaced: stripped.removed
				}
			};
		}
	});
}
async function removeBackfillDiaryEntries(params) {
	return await updateDreamsFile({
		workspaceDir: params.workspaceDir,
		updater: (existing, dreamsPath) => {
			const stripped = stripBackfillDiaryBlocks(existing);
			return {
				content: stripped.updated,
				result: {
					dreamsPath,
					removed: stripped.removed
				},
				shouldWrite: stripped.removed > 0 || existing.length > 0
			};
		}
	});
}
async function dedupeDreamDiaryEntries(params) {
	return await updateDreamsFile({
		workspaceDir: params.workspaceDir,
		updater: (existing, dreamsPath) => {
			const ensured = ensureDiarySection(existing);
			const startIdx = ensured.indexOf(DIARY_START_MARKER);
			const endIdx = ensured.indexOf(DIARY_END_MARKER);
			if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) return {
				content: ensured,
				result: {
					dreamsPath,
					removed: 0,
					kept: 0
				},
				shouldWrite: false
			};
			const blocks = splitDiaryBlocks(ensured.slice(startIdx + 38, endIdx));
			const seen = /* @__PURE__ */ new Set();
			const keptBlocks = [];
			let removed = 0;
			for (const block of blocks) {
				const fingerprint = normalizeDiaryBlockFingerprint(block);
				if (seen.has(fingerprint)) {
					removed += 1;
					continue;
				}
				seen.add(fingerprint);
				keptBlocks.push(block);
			}
			return {
				content: replaceDiaryContent(ensured, joinDiaryBlocks(keptBlocks)),
				result: {
					dreamsPath,
					removed,
					kept: keptBlocks.length
				},
				shouldWrite: removed > 0
			};
		}
	});
}
function buildDiaryEntry(narrative, dateStr) {
	return `\n---\n\n*${dateStr}*\n\n${narrative}\n`;
}
async function appendNarrativeEntry(params) {
	const dateStr = formatNarrativeDate(params.nowMs, params.timezone);
	const entry = buildDiaryEntry(params.narrative, dateStr);
	return await updateDreamsFile({
		workspaceDir: params.workspaceDir,
		updater: (existing, dreamsPath) => {
			let updated;
			if (existing.includes(DIARY_START_MARKER) && existing.includes(DIARY_END_MARKER)) {
				const endIdx = existing.lastIndexOf(DIARY_END_MARKER);
				updated = existing.slice(0, endIdx) + entry + "\n" + existing.slice(endIdx);
			} else if (existing.includes(DIARY_START_MARKER)) {
				const startIdx = existing.indexOf(DIARY_START_MARKER) + 38;
				updated = existing.slice(0, startIdx) + entry + "\n<!-- openclaw:dreaming:diary:end -->\n" + existing.slice(startIdx);
			} else {
				const diarySection = `# Dream Diary\n\n${DIARY_START_MARKER}${entry}\n${DIARY_END_MARKER}\n`;
				updated = existing.trim().length === 0 ? diarySection : `${diarySection}\n${existing}`;
			}
			return {
				content: updated,
				result: dreamsPath
			};
		}
	});
}
function normalizeComparablePath(pathname) {
	return process.platform === "win32" ? pathname.toLowerCase() : pathname;
}
async function normalizeSessionFileForComparison(params) {
	const trimmed = params.sessionFile.trim();
	if (!trimmed) return null;
	const resolved = path.isAbsolute(trimmed) ? trimmed : path.resolve(params.sessionsDir, trimmed);
	try {
		return normalizeComparablePath(await fs.realpath(resolved));
	} catch {
		return normalizeComparablePath(path.resolve(resolved));
	}
}
function isDreamingSessionStoreKey(sessionKey) {
	const firstSeparator = sessionKey.indexOf(":");
	if (firstSeparator < 0) return sessionKey.startsWith(DREAMING_SESSION_KEY_PREFIX);
	const secondSeparator = sessionKey.indexOf(":", firstSeparator + 1);
	return (secondSeparator < 0 ? sessionKey : sessionKey.slice(secondSeparator + 1)).startsWith(DREAMING_SESSION_KEY_PREFIX);
}
async function normalizeSessionEntryPathForComparison(params) {
	const sessionFile = typeof params.entry?.sessionFile === "string" ? params.entry.sessionFile : "";
	if (sessionFile) return normalizeSessionFileForComparison({
		sessionsDir: params.sessionsDir,
		sessionFile
	});
	const sessionId = typeof params.entry?.sessionId === "string" ? params.entry.sessionId.trim() : "";
	if (!SAFE_SESSION_ID_RE.test(sessionId)) return null;
	return normalizeSessionFileForComparison({
		sessionsDir: params.sessionsDir,
		sessionFile: `${sessionId}.jsonl`
	});
}
async function scrubDreamingNarrativeArtifacts(logger) {
	const cfg = getRuntimeConfig();
	const agentsDir = path.join(resolveStateDir(), "agents");
	let agentEntries = [];
	try {
		agentEntries = await fs.readdir(agentsDir, { withFileTypes: true });
	} catch {
		return;
	}
	let prunedEntries = 0;
	let archivedOrphans = 0;
	for (const agentEntry of agentEntries) {
		if (!agentEntry.isDirectory()) continue;
		const storePath = resolveStorePath(cfg.session?.store, { agentId: agentEntry.name });
		const sessionsDir = path.dirname(storePath);
		let store;
		try {
			store = loadSessionStore(storePath);
		} catch {
			continue;
		}
		const referencedSessionFiles = /* @__PURE__ */ new Set();
		let needsStoreUpdate = false;
		for (const [key, entry] of Object.entries(store)) {
			const normalizedSessionFile = await normalizeSessionEntryPathForComparison({
				sessionsDir,
				entry
			});
			if (normalizedSessionFile) referencedSessionFiles.add(normalizedSessionFile);
			if (!isDreamingSessionStoreKey(key)) continue;
			if (!normalizedSessionFile || !await pathExists(normalizedSessionFile)) needsStoreUpdate = true;
		}
		if (needsStoreUpdate) {
			referencedSessionFiles.clear();
			prunedEntries += await updateSessionStore(storePath, async (lockedStore) => {
				let prunedForAgent = 0;
				for (const [key, entry] of Object.entries(lockedStore)) {
					const normalizedSessionFile = await normalizeSessionEntryPathForComparison({
						sessionsDir,
						entry
					});
					if (normalizedSessionFile) referencedSessionFiles.add(normalizedSessionFile);
					if (!isDreamingSessionStoreKey(key)) continue;
					if (!normalizedSessionFile || !await pathExists(normalizedSessionFile)) {
						delete lockedStore[key];
						prunedForAgent += 1;
					}
				}
				return prunedForAgent;
			});
		}
		let sessionFiles = [];
		try {
			sessionFiles = await fs.readdir(sessionsDir, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const fileEntry of sessionFiles) {
			if (!fileEntry.isFile() || !fileEntry.name.endsWith(".jsonl")) continue;
			const transcriptPath = path.join(sessionsDir, fileEntry.name);
			const normalizedTranscriptPath = await normalizeSessionFileForComparison({
				sessionsDir,
				sessionFile: fileEntry.name
			}) ?? normalizeComparablePath(transcriptPath);
			if (referencedSessionFiles.has(normalizedTranscriptPath)) continue;
			let stat;
			try {
				stat = await fs.stat(transcriptPath);
			} catch {
				continue;
			}
			if (Date.now() - stat.mtimeMs < DREAMING_ORPHAN_MIN_AGE_MS) continue;
			let content = "";
			try {
				content = await fs.readFile(transcriptPath, "utf-8");
			} catch {
				continue;
			}
			if (!content.includes(DREAMING_TRANSCRIPT_RUN_MARKER)) continue;
			const archivedPath = `${transcriptPath}.deleted.${Date.now()}`;
			try {
				await fs.rename(transcriptPath, archivedPath);
				archivedOrphans += 1;
			} catch {}
		}
	}
	if (prunedEntries > 0 || archivedOrphans > 0) logger.info(`memory-core: dreaming cleanup scrubbed ${prunedEntries} stale session entr${prunedEntries === 1 ? "y" : "ies"} and archived ${archivedOrphans} orphan transcript${archivedOrphans === 1 ? "" : "s"}.`);
}
async function generateAndAppendDreamNarrative(params) {
	const nowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
	if (params.data.snippets.length === 0 && !params.data.promotions?.length) return;
	const sessionKey = buildNarrativeSessionKey({
		workspaceDir: params.workspaceDir,
		phase: params.data.phase
	});
	const message = buildNarrativePrompt(params.data);
	await withNarrativeSessionLock(sessionKey, async () => {
		const attempts = [];
		let successfulSessionKey = null;
		try {
			const attemptModels = params.model ? [params.model, void 0] : [void 0];
			for (const [attemptIndex, attemptModel] of attemptModels.entries()) {
				const attemptSessionKey = buildNarrativeAttemptSessionKey(sessionKey, attemptIndex);
				const attempt = {
					sessionKey: attemptSessionKey,
					runId: null
				};
				attempts.push(attempt);
				try {
					try {
						await params.subagent.deleteSession({ sessionKey: attemptSessionKey });
					} catch (preCleanupErr) {
						if (!isRequestScopedSubagentRuntimeError(preCleanupErr)) params.logger.warn(`memory-core: narrative pre-cleanup failed for ${params.data.phase} phase: ${formatErrorMessage(preCleanupErr)}`);
					}
					const runId = await startNarrativeRunOrFallback({
						subagent: params.subagent,
						sessionKey: attemptSessionKey,
						message,
						data: params.data,
						workspaceDir: params.workspaceDir,
						nowMs,
						timezone: params.timezone,
						model: attemptModel,
						logger: params.logger
					});
					if (!runId) return;
					attempt.runId = runId;
					const result = await params.subagent.waitForRun({
						runId,
						timeoutMs: NARRATIVE_TIMEOUT_MS
					});
					if (result.status === "ok") {
						successfulSessionKey = attemptSessionKey;
						break;
					}
					if (attemptModel && result.status === "error" && isConfiguredModelUnavailableNarrativeError(result.error ?? "")) {
						params.logger.warn(`memory-core: narrative generation ended with ${formatNarrativeTerminalStatus({
							status: result.status,
							error: result.error
						})} for ${params.data.phase} phase using configured model "${attemptModel}"; retrying with the session default.`);
						continue;
					}
					params.logger.warn(`memory-core: narrative generation ended with ${formatNarrativeTerminalStatus({
						status: result.status,
						error: result.error
					})} for ${params.data.phase} phase; writing fallback diary entry.`);
					await appendFallbackNarrativeEntry({
						workspaceDir: params.workspaceDir,
						data: params.data,
						nowMs,
						timezone: params.timezone,
						logger: params.logger,
						reason: `the narrative run ended with ${formatNarrativeTerminalStatus({
							status: result.status,
							error: result.error
						})}`
					});
					return;
				} catch (err) {
					if (attemptModel && isConfiguredModelUnavailableNarrativeError(formatErrorMessage(err))) {
						params.logger.warn(`memory-core: narrative generation could not start with configured model "${attemptModel}" for ${params.data.phase} phase; retrying with the session default (${formatErrorMessage(err)}).`);
						continue;
					}
					throw err;
				}
			}
			if (!successfulSessionKey) return;
			const { messages } = await params.subagent.getSessionMessages({
				sessionKey: successfulSessionKey,
				limit: 5
			});
			const narrative = extractNarrativeText(messages);
			if (!narrative) {
				params.logger.warn(`memory-core: narrative generation produced no text for ${params.data.phase} phase; writing fallback diary entry.`);
				await appendFallbackNarrativeEntry({
					workspaceDir: params.workspaceDir,
					data: params.data,
					nowMs,
					timezone: params.timezone,
					logger: params.logger,
					reason: "the narrative run produced no text"
				});
				return;
			}
			await appendNarrativeEntry({
				workspaceDir: params.workspaceDir,
				narrative,
				nowMs,
				timezone: params.timezone
			});
			params.logger.info(`memory-core: dream diary entry written for ${params.data.phase} phase [workspace=${params.workspaceDir}].`);
		} catch (err) {
			params.logger.warn(`memory-core: narrative generation failed for ${params.data.phase} phase: ${formatErrorMessage(err)}`);
		} finally {
			const cleanedSessionKeys = /* @__PURE__ */ new Set();
			for (const attempt of attempts) {
				if (!attempt.runId || cleanedSessionKeys.has(attempt.sessionKey)) continue;
				cleanedSessionKeys.add(attempt.sessionKey);
				try {
					await params.subagent.deleteSession({ sessionKey: attempt.sessionKey });
				} catch (cleanupErr) {
					params.logger.warn(`memory-core: narrative session cleanup failed for ${params.data.phase} phase: ${formatErrorMessage(cleanupErr)}`);
				}
			}
			await scrubDreamingNarrativeArtifacts(params.logger).catch((scrubErr) => {
				params.logger.warn(`memory-core: dreaming cleanup scrub failed for ${params.data.phase} phase: ${formatErrorMessage(scrubErr)}`);
			});
		}
	});
}
const DETACHED_NARRATIVE_CONCURRENCY = 3;
let activeDetachedNarratives = 0;
const detachedNarrativeQueue = [];
function releaseDetachedNarrativeSlot() {
	activeDetachedNarratives -= 1;
	detachedNarrativeQueue.shift()?.();
}
async function acquireDetachedNarrativeSlot() {
	if (activeDetachedNarratives >= DETACHED_NARRATIVE_CONCURRENCY) await new Promise((resolve) => {
		detachedNarrativeQueue.push(resolve);
	});
	activeDetachedNarratives += 1;
}
function runDetachedDreamNarrative(params) {
	queueMicrotask(() => {
		(async () => {
			await acquireDetachedNarrativeSlot();
			try {
				await generateAndAppendDreamNarrative(params);
			} catch {} finally {
				releaseDetachedNarrativeSlot();
			}
		})();
	});
}
//#endregion
export { dedupeDreamDiaryEntries as a, formatNarrativeDate as c, runDetachedDreamNarrative as d, writeBackfillDiaryEntries as f, buildNarrativePrompt as i, generateAndAppendDreamNarrative as l, buildBackfillDiaryEntry as n, extractNarrativeText as o, buildDiaryEntry as r, formatBackfillDiaryDate as s, appendNarrativeEntry as t, removeBackfillDiaryEntries as u };
