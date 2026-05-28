import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { t as sanitizeForLog } from "./ansi-4r6vVvJt.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { _ as resolveSessionAgentId } from "./agent-scope-CudANNo3.js";
import { t as asFiniteNumber } from "./number-coercion-CZ-2BQ9V.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import "./hook-runner-global-CjzahG2G.js";
import { m as triggerInternalHook, n as createInternalHookEvent } from "./internal-hooks-CeA6cnAD.js";
import { p as isCompactionCheckpointTranscriptFileName } from "./paths-DZXdqwOo.js";
import { u as updateSessionStore } from "./store-B5j4GKkg.js";
import "./sessions-Ct4mpWsk.js";
import { u as streamSessionTranscriptLines } from "./transcript-DxGLLD67.js";
import { t as emitSessionTranscriptUpdate } from "./transcript-events-cdgltU-p.js";
import { m as resolveGatewaySessionStoreTarget } from "./session-utils-CmwnszsS.js";
import { t as log$1 } from "./logger-DLLDK9dc.js";
import { r as getActiveMemorySearchManager } from "./memory-runtime-CI_B_YP5.js";
import { t as resolveMemorySearchConfig } from "./memory-search-CsIXN6vZ.js";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { CURRENT_SESSION_VERSION, migrateSessionEntries } from "@earendil-works/pi-coding-agent";
//#region src/gateway/session-compaction-checkpoints.ts
const log = createSubsystemLogger("gateway/session-compaction-checkpoints");
const MAX_COMPACTION_CHECKPOINT_LEAF_SCAN_BYTES = 64 * 1024 * 1024;
function checkpointSnapshotPath(checkpoint) {
	return checkpoint.preCompaction.sessionFile?.trim() || void 0;
}
function checkpointSnapshotBytes(checkpoint, snapshotBytesByPath) {
	const sessionFile = checkpointSnapshotPath(checkpoint);
	if (!sessionFile) return 0;
	const bytes = snapshotBytesByPath.get(sessionFile);
	return typeof bytes === "number" && Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
}
function trimSessionCheckpoints(checkpoints, snapshotBytesByPath = /* @__PURE__ */ new Map()) {
	if (!Array.isArray(checkpoints) || checkpoints.length === 0) return {
		kept: void 0,
		removed: []
	};
	const countTrimmed = checkpoints.slice(-25);
	const countRemoved = checkpoints.slice(0, Math.max(0, checkpoints.length - countTrimmed.length));
	const keptNewestFirst = [];
	const byteRemovedNewestFirst = [];
	let retainedBytes = 0;
	for (let index = countTrimmed.length - 1; index >= 0; index -= 1) {
		const checkpoint = countTrimmed[index];
		if (!checkpoint) continue;
		const checkpointBytes = checkpointSnapshotBytes(checkpoint, snapshotBytesByPath);
		if (keptNewestFirst.length === 0 || retainedBytes + checkpointBytes <= 134217728) {
			keptNewestFirst.push(checkpoint);
			retainedBytes += checkpointBytes;
		} else byteRemovedNewestFirst.push(checkpoint);
	}
	const kept = keptNewestFirst.toReversed();
	return {
		kept: kept.length > 0 ? kept : void 0,
		removed: [...countRemoved, ...byteRemovedNewestFirst.toReversed()]
	};
}
function sessionStoreCheckpoints(entry) {
	return Array.isArray(entry?.compactionCheckpoints) ? [...entry.compactionCheckpoints] : [];
}
async function statCheckpointSnapshotBytes(checkpoints) {
	const bytesByPath = /* @__PURE__ */ new Map();
	await Promise.all(checkpoints.map(async (checkpoint) => {
		const sessionFile = checkpointSnapshotPath(checkpoint);
		if (!sessionFile || bytesByPath.has(sessionFile)) return;
		try {
			const stat = await fs.stat(sessionFile);
			bytesByPath.set(sessionFile, stat.isFile() ? stat.size : 0);
		} catch {
			bytesByPath.set(sessionFile, 0);
		}
	}));
	return bytesByPath;
}
function resolveSessionCompactionCheckpointReason(params) {
	if (params.trigger === "manual") return "manual";
	if (params.timedOut) return "timeout-retry";
	if (params.trigger === "overflow") return "overflow-retry";
	return "auto-threshold";
}
const SESSION_HEADER_READ_MAX_BYTES = 64 * 1024;
const SESSION_TAIL_READ_INITIAL_BYTES = 64 * 1024;
async function readFileRangeAsync(fileHandle, position, length) {
	const buffer = Buffer.alloc(length);
	let offset = 0;
	while (offset < length) {
		const { bytesRead } = await fileHandle.read(buffer, offset, length - offset, position + offset);
		if (bytesRead <= 0) break;
		offset += bytesRead;
	}
	return offset === length ? buffer : buffer.subarray(0, offset);
}
async function readSessionHeaderFromTranscriptAsync(sessionFile) {
	let fileHandle;
	try {
		fileHandle = await fs.open(sessionFile, "r");
		const buffer = await readFileRangeAsync(fileHandle, 0, SESSION_HEADER_READ_MAX_BYTES);
		if (buffer.length <= 0) return null;
		const firstLine = buffer.toString("utf-8").split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0);
		if (!firstLine) return null;
		const parsed = JSON.parse(firstLine);
		if (parsed.type !== "session" || typeof parsed.id !== "string" || !parsed.id.trim()) return null;
		return {
			id: parsed.id.trim(),
			...typeof parsed.cwd === "string" && parsed.cwd.trim() ? { cwd: parsed.cwd } : {}
		};
	} catch {
		return null;
	} finally {
		if (fileHandle) await fileHandle.close().catch(() => void 0);
	}
}
async function readSessionIdFromTranscriptHeaderAsync(sessionFile) {
	return (await readSessionHeaderFromTranscriptAsync(sessionFile))?.id ?? null;
}
function parseTranscriptLineId(line) {
	try {
		const parsed = JSON.parse(line);
		if (parsed.type === "session") return { kind: "session" };
		if (typeof parsed.id === "string" && parsed.id.trim()) return {
			kind: "entry",
			id: parsed.id.trim()
		};
	} catch {
		return null;
	}
	return null;
}
async function readTranscriptEntriesForForkAsync(params) {
	const entries = [];
	const stopAfterEntryId = params.stopAfterEntryId?.trim();
	let foundStopEntry = false;
	try {
		for await (const line of streamSessionTranscriptLines(params.sessionFile)) try {
			const parsed = JSON.parse(line);
			if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
			entries.push(parsed);
			if (stopAfterEntryId && parsed.type !== "session" && parsed.id === stopAfterEntryId) {
				foundStopEntry = true;
				break;
			}
		} catch {}
	} catch {
		return null;
	}
	const firstEntry = entries[0];
	if (firstEntry?.type !== "session" || typeof firstEntry.id !== "string") return null;
	if (stopAfterEntryId && !foundStopEntry) return null;
	return entries;
}
function trimTranscriptEntriesThroughLeaf(entries, leafId) {
	const normalizedLeafId = leafId?.trim();
	if (!normalizedLeafId) return entries;
	const leafIndex = entries.findIndex((entry, index) => index > 0 && entry.id === normalizedLeafId);
	if (leafIndex < 1) return null;
	return entries.slice(0, leafIndex + 1);
}
async function readSessionLeafIdFromTranscriptAsync(sessionFile, maxBytes = MAX_COMPACTION_CHECKPOINT_LEAF_SCAN_BYTES) {
	let fileHandle;
	try {
		fileHandle = await fs.open(sessionFile, "r");
		const stat = await fileHandle.stat();
		if (!stat.isFile() || stat.size <= 0) return null;
		const requestedMaxBytes = Number.isFinite(maxBytes) ? Math.max(1024, Math.floor(maxBytes)) : MAX_COMPACTION_CHECKPOINT_LEAF_SCAN_BYTES;
		const maxReadableBytes = Math.min(stat.size, requestedMaxBytes);
		let readLength = Math.min(maxReadableBytes, SESSION_TAIL_READ_INITIAL_BYTES);
		while (readLength > 0) {
			const readStart = Math.max(0, stat.size - readLength);
			const lines = (await readFileRangeAsync(fileHandle, readStart, readLength)).toString("utf-8").split(/\r?\n/);
			const candidateLines = readStart > 0 ? lines.slice(1) : lines;
			for (let i = candidateLines.length - 1; i >= 0; i -= 1) {
				const line = candidateLines[i]?.trim();
				if (!line) continue;
				const parsed = parseTranscriptLineId(line);
				if (!parsed) continue;
				if (parsed.kind === "session") return null;
				return parsed.id;
			}
			if (readStart === 0) return null;
			const nextReadLength = Math.min(maxReadableBytes, readLength * 2);
			if (nextReadLength === readLength) return null;
			readLength = nextReadLength;
		}
	} catch {
		return null;
	} finally {
		if (fileHandle) await fileHandle.close().catch(() => void 0);
	}
	return null;
}
async function forkCompactionCheckpointTranscriptAsync(params) {
	const sourceFile = params.sourceFile.trim();
	if (!sourceFile) return null;
	const sourceHeader = await readSessionHeaderFromTranscriptAsync(sourceFile);
	if (!sourceHeader) return null;
	const entries = await readTranscriptEntriesForForkAsync({
		sessionFile: sourceFile,
		stopAfterEntryId: params.sourceLeafId
	});
	if (!entries) return null;
	migrateSessionEntries(entries);
	const forkEntries = trimTranscriptEntriesThroughLeaf(entries, params.sourceLeafId);
	if (!forkEntries) return null;
	const targetCwd = params.targetCwd ?? sourceHeader.cwd ?? process.cwd();
	const sessionDir = params.sessionDir ?? path.dirname(sourceFile);
	const sessionId = randomUUID();
	const timestamp = (/* @__PURE__ */ new Date()).toISOString();
	const fileTimestamp = timestamp.replace(/[:.]/g, "-");
	const sessionFile = path.join(sessionDir, `${fileTimestamp}_${sessionId}.jsonl`);
	const header = {
		type: "session",
		version: CURRENT_SESSION_VERSION,
		id: sessionId,
		timestamp,
		cwd: targetCwd,
		parentSession: sourceFile
	};
	try {
		await fs.mkdir(sessionDir, { recursive: true });
		const lines = [JSON.stringify(header)];
		for (const entry of forkEntries) if (entry.type !== "session") lines.push(JSON.stringify(entry));
		await fs.writeFile(sessionFile, `${lines.join("\n")}\n`, {
			encoding: "utf-8",
			flag: "wx"
		});
		return {
			sessionId,
			sessionFile
		};
	} catch {
		try {
			await fs.unlink(sessionFile);
		} catch {}
		return null;
	}
}
/**
* Capture the stable pre-compaction identity without duplicating the transcript.
* Branch/restore uses the compacted successor transcript, while legacy
* checkpoints that already have a snapshot file keep working.
*/
async function captureCompactionCheckpointSnapshotAsync(params) {
	const getLeafId = params.sessionManager && typeof params.sessionManager.getLeafId === "function" ? params.sessionManager.getLeafId.bind(params.sessionManager) : null;
	const sessionFile = params.sessionFile.trim();
	if (!sessionFile || params.sessionManager && !getLeafId) return null;
	const liveLeafId = getLeafId ? getLeafId() : void 0;
	if (getLeafId && !liveLeafId) return null;
	const maxBytes = params.maxBytes ?? 67108864;
	const sessionId = await readSessionIdFromTranscriptHeaderAsync(sessionFile);
	const leafId = liveLeafId ?? await readSessionLeafIdFromTranscriptAsync(sessionFile, maxBytes);
	if (!sessionId || !leafId) return null;
	return {
		sessionId,
		leafId
	};
}
async function cleanupCompactionCheckpointSnapshot(snapshot) {
	if (!snapshot?.sessionFile) return;
	try {
		await fs.unlink(snapshot.sessionFile);
	} catch {}
}
async function cleanupTrimmedCompactionCheckpointFiles(params) {
	if (params.removed.length === 0 || !params.artifactDir) return;
	const artifactDir = path.resolve(params.artifactDir);
	const retainedPaths = new Set((params.retained ?? []).map((checkpoint) => checkpoint.preCompaction.sessionFile?.trim()).filter((filePath) => Boolean(filePath)));
	for (const checkpoint of params.removed) {
		const sessionFile = checkpoint.preCompaction.sessionFile?.trim();
		if (!sessionFile || retainedPaths.has(sessionFile)) continue;
		const resolvedSessionFile = path.resolve(sessionFile);
		if (path.dirname(resolvedSessionFile) !== artifactDir || !isCompactionCheckpointTranscriptFileName(path.basename(resolvedSessionFile))) continue;
		try {
			await fs.unlink(resolvedSessionFile);
		} catch {}
	}
}
async function persistSessionCompactionCheckpoint(params) {
	const snapshotSessionFile = params.snapshot.sessionFile?.trim();
	const postSessionFile = params.postSessionFile?.trim();
	const postSourceLeafId = params.postLeafId?.trim() || params.postEntryId?.trim();
	if (!snapshotSessionFile && (!postSessionFile || !postSourceLeafId)) {
		log.warn("skipping compaction checkpoint persist: missing stable fork source", { sessionKey: params.sessionKey });
		return null;
	}
	const target = resolveGatewaySessionStoreTarget({
		cfg: params.cfg,
		key: params.sessionKey
	});
	const createdAt = params.createdAt ?? Date.now();
	const checkpoint = {
		checkpointId: randomUUID(),
		sessionKey: target.canonicalKey,
		sessionId: params.sessionId,
		createdAt,
		reason: params.reason,
		...typeof params.tokensBefore === "number" ? { tokensBefore: params.tokensBefore } : {},
		...typeof params.tokensAfter === "number" ? { tokensAfter: params.tokensAfter } : {},
		...params.summary?.trim() ? { summary: params.summary.trim() } : {},
		...params.firstKeptEntryId?.trim() ? { firstKeptEntryId: params.firstKeptEntryId.trim() } : {},
		preCompaction: {
			sessionId: params.snapshot.sessionId,
			...params.snapshot.sessionFile?.trim() ? { sessionFile: params.snapshot.sessionFile.trim() } : {},
			leafId: params.snapshot.leafId
		},
		postCompaction: {
			sessionId: params.sessionId,
			...postSessionFile ? { sessionFile: postSessionFile } : {},
			...params.postLeafId?.trim() ? { leafId: params.postLeafId.trim() } : {},
			...params.postEntryId?.trim() ? { entryId: params.postEntryId.trim() } : {}
		}
	};
	let stored = false;
	let trimmedCheckpoints;
	await updateSessionStore(target.storePath, async (store) => {
		const existing = store[target.canonicalKey];
		if (!existing?.sessionId) return;
		const checkpoints = sessionStoreCheckpoints(existing);
		checkpoints.push(checkpoint);
		trimmedCheckpoints = trimSessionCheckpoints(checkpoints, await statCheckpointSnapshotBytes(checkpoints));
		store[target.canonicalKey] = {
			...existing,
			updatedAt: Math.max(existing.updatedAt ?? 0, createdAt),
			compactionCheckpoints: trimmedCheckpoints.kept
		};
		stored = true;
	});
	if (!stored) {
		log.warn("skipping compaction checkpoint persist: session not found", { sessionKey: params.sessionKey });
		return null;
	}
	const checkpointArtifactFile = snapshotSessionFile || postSessionFile || "";
	await cleanupTrimmedCompactionCheckpointFiles({
		removed: trimmedCheckpoints?.removed ?? [],
		retained: trimmedCheckpoints?.kept,
		...checkpointArtifactFile ? { artifactDir: path.dirname(checkpointArtifactFile) } : {}
	});
	return checkpoint;
}
function listSessionCompactionCheckpoints(entry) {
	return sessionStoreCheckpoints(entry).toSorted((a, b) => b.createdAt - a.createdAt);
}
function getSessionCompactionCheckpoint(params) {
	const checkpointId = params.checkpointId.trim();
	if (!checkpointId) return;
	return listSessionCompactionCheckpoints(params.entry).find((checkpoint) => checkpoint.checkpointId === checkpointId);
}
//#endregion
//#region src/agents/pi-embedded-runner/compact-reasons.ts
const MAX_COMPACTION_REASON_DETAIL_CHARS = 100;
const DEFERRED_CONTEXT_ENGINE_COMPACTION_REASON = "deferred to background context-engine maintenance";
function isGenericCompactionCancelledReason(reason) {
	const normalized = normalizeLowercaseStringOrEmpty(reason);
	return normalized === "compaction cancelled" || normalized === "error: compaction cancelled";
}
function resolveCompactionFailureReason(params) {
	if (isGenericCompactionCancelledReason(params.reason) && params.safeguardCancelReason) return params.safeguardCancelReason;
	return params.reason;
}
function classifyCompactionReason(reason) {
	const text = normalizeLowercaseStringOrEmpty(reason);
	if (!text) return "unknown";
	if (text.includes("nothing to compact")) return "no_compactable_entries";
	if (text.includes("below threshold") || text.includes("already under target")) return "below_threshold";
	if (text.includes("already compacted")) return "already_compacted_recently";
	if (text.includes("deferred to background")) return "deferred_background";
	if (text.includes("still exceeds target")) return "live_context_still_exceeds_target";
	if (text.includes("guard")) return "guard_blocked";
	if (text.includes("summary")) return "summary_failed";
	if (text.includes("timed out") || text.includes("timeout")) return "timeout";
	if (text.includes("400") || text.includes("401") || text.includes("403") || text.includes("429")) return "provider_error_4xx";
	if (text.includes("500") || text.includes("502") || text.includes("503") || text.includes("504")) return "provider_error_5xx";
	return "unknown";
}
function formatUnknownCompactionReasonDetail(reason) {
	const sanitized = sanitizeForLog((reason ?? "").replace(/\s+/g, " ")).trim().replace(/[^A-Za-z0-9._:@/+~-]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
	if (!sanitized) return;
	return sanitized.slice(0, MAX_COMPACTION_REASON_DETAIL_CHARS);
}
//#endregion
//#region src/agents/pi-embedded-runner/compaction-hooks.ts
function resolvePostCompactionIndexSyncMode(config) {
	const mode = config?.agents?.defaults?.compaction?.postIndexSync;
	if (mode === "off" || mode === "async" || mode === "await") return mode;
	return "async";
}
async function runPostCompactionSessionMemorySync(params) {
	if (!params.config) return;
	try {
		const sessionFile = params.sessionFile.trim();
		if (!sessionFile) return;
		const agentId = resolveSessionAgentId({
			sessionKey: params.sessionKey,
			config: params.config
		});
		const resolvedMemory = resolveMemorySearchConfig(params.config, agentId);
		if (!resolvedMemory || !resolvedMemory.sources.includes("sessions")) return;
		if (!resolvedMemory.sync.sessions.postCompactionForce) return;
		const { manager } = await getActiveMemorySearchManager({
			cfg: params.config,
			agentId
		});
		if (!manager?.sync) return;
		await manager.sync({
			reason: "post-compaction",
			sessionFiles: [sessionFile]
		});
	} catch (err) {
		log$1.warn(`memory sync skipped (post-compaction): ${formatErrorMessage(err)}`);
	}
}
function syncPostCompactionSessionMemory(params) {
	if (params.mode === "off" || !params.config) return Promise.resolve();
	const syncTask = runPostCompactionSessionMemorySync({
		config: params.config,
		sessionKey: params.sessionKey,
		sessionFile: params.sessionFile
	});
	if (params.mode === "await") return syncTask;
	return Promise.resolve();
}
async function runPostCompactionSideEffects(params) {
	const sessionFile = params.sessionFile.trim();
	if (!sessionFile) return;
	emitSessionTranscriptUpdate({
		sessionFile,
		sessionKey: params.sessionKey
	});
	await syncPostCompactionSessionMemory({
		config: params.config,
		sessionKey: params.sessionKey,
		sessionFile,
		mode: resolvePostCompactionIndexSyncMode(params.config)
	});
}
function asCompactionHookRunner(hookRunner) {
	if (!hookRunner) return null;
	return {
		hasHooks: (hookName) => hookRunner.hasHooks?.(hookName) ?? false,
		runBeforeCompaction: hookRunner.runBeforeCompaction?.bind(hookRunner),
		runAfterCompaction: hookRunner.runAfterCompaction?.bind(hookRunner)
	};
}
function estimateTokenCountSafe(messages, estimateTokensFn) {
	try {
		let total = 0;
		for (const message of messages) total += estimateTokensFn(message);
		return total;
	} catch {
		return;
	}
}
function buildBeforeCompactionHookMetrics(params) {
	return {
		messageCountOriginal: params.originalMessages.length,
		tokenCountOriginal: estimateTokenCountSafe(params.originalMessages, params.estimateTokensFn),
		messageCountBefore: params.currentMessages.length,
		tokenCountBefore: params.observedTokenCount ?? estimateTokenCountSafe(params.currentMessages, params.estimateTokensFn)
	};
}
async function runBeforeCompactionHooks(params) {
	const missingSessionKey = !params.sessionKey || !params.sessionKey.trim();
	const hookSessionKey = params.sessionKey?.trim() || params.sessionId;
	try {
		const hookEvent = createInternalHookEvent("session", "compact:before", hookSessionKey, {
			sessionId: params.sessionId,
			missingSessionKey,
			messageCount: params.metrics.messageCountBefore,
			tokenCount: params.metrics.tokenCountBefore,
			messageCountOriginal: params.metrics.messageCountOriginal,
			tokenCountOriginal: params.metrics.tokenCountOriginal
		});
		await triggerInternalHook(hookEvent);
		if (hookEvent.messages.length > 0) await params.onHookMessages?.({
			phase: "before",
			messages: hookEvent.messages.slice(),
			sessionId: params.sessionId,
			sessionKey: hookSessionKey
		});
	} catch (err) {
		log$1.warn("session:compact:before hook failed", {
			errorMessage: formatErrorMessage(err),
			errorStack: err instanceof Error ? err.stack : void 0
		});
	}
	if (params.hookRunner?.hasHooks?.("before_compaction")) try {
		await params.hookRunner.runBeforeCompaction?.({
			messageCount: params.metrics.messageCountBefore,
			tokenCount: params.metrics.tokenCountBefore
		}, {
			sessionId: params.sessionId,
			agentId: params.sessionAgentId,
			sessionKey: hookSessionKey,
			workspaceDir: params.workspaceDir,
			messageProvider: params.messageProvider
		});
	} catch (err) {
		log$1.warn("before_compaction hook failed", {
			errorMessage: formatErrorMessage(err),
			errorStack: err instanceof Error ? err.stack : void 0
		});
	}
	return {
		hookSessionKey,
		missingSessionKey
	};
}
function estimateTokensAfterCompaction(params) {
	const tokensAfter = estimateTokenCountSafe(params.messagesAfter, params.estimateTokensFn);
	if (tokensAfter === void 0) return;
	const sanityCheckBaseline = params.observedTokenCount ?? params.fullSessionTokensBefore;
	if (sanityCheckBaseline > 0 && tokensAfter > (params.observedTokenCount !== void 0 ? sanityCheckBaseline : sanityCheckBaseline * 1.1)) return;
	return tokensAfter;
}
async function runAfterCompactionHooks(params) {
	try {
		const hookEvent = createInternalHookEvent("session", "compact:after", params.hookSessionKey, {
			sessionId: params.sessionId,
			missingSessionKey: params.missingSessionKey,
			messageCount: params.messageCountAfter,
			tokenCount: params.tokensAfter,
			compactedCount: params.compactedCount,
			summaryLength: params.summaryLength,
			tokensBefore: params.tokensBefore,
			tokensAfter: params.tokensAfter,
			firstKeptEntryId: params.firstKeptEntryId
		});
		await triggerInternalHook(hookEvent);
		if (hookEvent.messages.length > 0) await params.onHookMessages?.({
			phase: "after",
			messages: hookEvent.messages.slice(),
			sessionId: params.sessionId,
			sessionKey: params.hookSessionKey
		});
	} catch (err) {
		log$1.warn("session:compact:after hook failed", {
			errorMessage: formatErrorMessage(err),
			errorStack: err instanceof Error ? err.stack : void 0
		});
	}
	if (params.hookRunner?.hasHooks?.("after_compaction")) try {
		await params.hookRunner.runAfterCompaction?.({
			messageCount: params.messageCountAfter,
			tokenCount: params.tokensAfter,
			compactedCount: params.compactedCount,
			sessionFile: params.sessionFile
		}, {
			sessionId: params.sessionId,
			agentId: params.sessionAgentId,
			sessionKey: params.hookSessionKey,
			workspaceDir: params.workspaceDir,
			messageProvider: params.messageProvider
		});
	} catch (err) {
		log$1.warn("after_compaction hook failed", {
			errorMessage: formatErrorMessage(err),
			errorStack: err instanceof Error ? err.stack : void 0
		});
	}
}
//#endregion
//#region src/agents/pi-embedded-runner/model-context-tokens.ts
function readPiModelContextTokens(model) {
	const value = model?.contextTokens;
	return asFiniteNumber(value);
}
//#endregion
export { persistSessionCompactionCheckpoint as _, runAfterCompactionHooks as a, DEFERRED_CONTEXT_ENGINE_COMPACTION_REASON as c, resolveCompactionFailureReason as d, captureCompactionCheckpointSnapshotAsync as f, listSessionCompactionCheckpoints as g, getSessionCompactionCheckpoint as h, estimateTokensAfterCompaction as i, classifyCompactionReason as l, forkCompactionCheckpointTranscriptAsync as m, asCompactionHookRunner as n, runBeforeCompactionHooks as o, cleanupCompactionCheckpointSnapshot as p, buildBeforeCompactionHookMetrics as r, runPostCompactionSideEffects as s, readPiModelContextTokens as t, formatUnknownCompactionReasonDetail as u, readSessionLeafIdFromTranscriptAsync as v, resolveSessionCompactionCheckpointReason as y };
