import { n as markDiagnosticEmbeddedRunEnded, r as markDiagnosticEmbeddedRunStarted } from "./diagnostic-run-activity-DfY2SXQ5.js";
import { c as isReplyRunActiveForSessionId, f as queueReplyRunMessage, h as waitForReplyRunEndBySessionId, i as abortReplyRunBySessionId, l as isReplyRunStreamingForSessionId, m as resolveActiveReplyRunSessionId, o as forceClearReplyRunBySessionId, r as abortActiveReplyRuns } from "./reply-run-registry-BYXDUcCT.js";
import { S as updateDiagnosticSessionFile, o as logMessageQueued, u as logSessionStateChange } from "./diagnostic-BDsaMZfL.js";
import { t as diagnosticLogger } from "./diagnostic-runtime-woKtZlOK.js";
import { a as EMBEDDED_RUN_MODEL_SWITCH_REQUESTS, i as ACTIVE_EMBEDDED_RUN_SNAPSHOTS, n as ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE, o as EMBEDDED_RUN_WAITERS, r as ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY, s as getActiveEmbeddedRunCount, t as ACTIVE_EMBEDDED_RUNS } from "./run-state-Du9_ntOI.js";
import fs from "node:fs";
import path from "node:path";
//#region src/agents/pi-embedded-runner/session-file-key.ts
function resolveEmbeddedSessionFileKey(sessionFile) {
	const resolvedSessionFile = path.resolve(sessionFile);
	const realpathSync = fs.realpathSync.native ?? fs.realpathSync;
	try {
		return realpathSync(resolvedSessionFile);
	} catch {}
	const sessionDir = path.dirname(resolvedSessionFile);
	try {
		return path.join(realpathSync(sessionDir), path.basename(resolvedSessionFile));
	} catch {
		return resolvedSessionFile;
	}
}
//#endregion
//#region src/agents/pi-embedded-runner/runs.ts
function createQueueFailureOutcome(sessionId, reason, errorMessage) {
	return {
		queued: false,
		sessionId,
		reason,
		gatewayHealth: "live",
		...errorMessage ? { errorMessage } : {}
	};
}
function formatEmbeddedPiQueueFailureSummary(outcome) {
	if (outcome.queued) return;
	const errorPart = outcome.errorMessage ? ` error=${outcome.errorMessage}` : "";
	return `queue_message_failed reason=${outcome.reason} sessionId=${outcome.sessionId} gatewayHealth=${outcome.gatewayHealth}${errorPart}`;
}
function setActiveRunSessionKey(sessionKey, sessionId) {
	const normalizedSessionKey = sessionKey?.trim();
	if (!normalizedSessionKey) return;
	ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.set(normalizedSessionKey, sessionId);
}
function clearActiveRunSessionKeys(sessionId, sessionKey) {
	const normalizedSessionKey = sessionKey?.trim();
	if (normalizedSessionKey) {
		if (ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.get(normalizedSessionKey) === sessionId) ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.delete(normalizedSessionKey);
		return;
	}
	for (const [key, activeSessionId] of ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY) if (activeSessionId === sessionId) ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.delete(key);
}
function setActiveRunSessionFile(sessionFile, sessionId) {
	if (!sessionFile?.trim()) return;
	ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.set(resolveEmbeddedSessionFileKey(sessionFile), sessionId);
}
function clearActiveRunSessionFiles(sessionId, sessionFile) {
	const normalizedSessionFile = sessionFile?.trim();
	if (normalizedSessionFile) {
		const sessionFileKey = resolveEmbeddedSessionFileKey(normalizedSessionFile);
		if (ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.get(sessionFileKey) === sessionId) ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.delete(sessionFileKey);
	}
	for (const [sessionFileKey, activeSessionId] of ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE) if (activeSessionId === sessionId) ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.delete(sessionFileKey);
}
/**
* @deprecated Use queueEmbeddedPiMessageWithOutcomeAsync for delivery decisions.
* This boolean helper only reports immediate queue eligibility; it cannot surface
* async runtime rejection from the active run.
*/
function queueEmbeddedPiMessage(sessionId, text, options) {
	return queueEmbeddedPiMessageWithOutcome(sessionId, text, options).queued;
}
/**
* @deprecated Prefer queueEmbeddedPiMessageWithOutcomeAsync when callers need to
* know whether steering was accepted. This sync helper is fire-and-forget after
* initial eligibility and only logs later runtime rejection.
*/
function queueEmbeddedPiMessageWithOutcome(sessionId, text, options) {
	const prepared = prepareEmbeddedPiQueueMessage(sessionId, text, options);
	if (prepared.kind === "complete") return prepared.outcome;
	logMessageQueued({
		sessionId,
		source: "pi-embedded-runner"
	});
	prepared.handle.queueMessage(text, options ?? { steeringMode: "all" }).catch((err) => {
		diagnosticLogger.debug(`queue message rejected after enqueue: sessionId=${sessionId} err=${formatQueueError(err)}`);
	});
	return {
		queued: true,
		sessionId,
		target: "embedded_run",
		gatewayHealth: "live",
		enqueuedAtMs: Date.now()
	};
}
function formatQueueError(err) {
	return err instanceof Error ? err.message : String(err);
}
async function queueEmbeddedPiMessageWithOutcomeAsync(sessionId, text, options) {
	const prepared = prepareEmbeddedPiQueueMessage(sessionId, text, options);
	if (prepared.kind === "complete") return prepared.outcome;
	try {
		const enqueuedAtMs = Date.now();
		await prepared.handle.queueMessage(text, options ?? { steeringMode: "all" });
		const deliveredAtMs = options?.waitForTranscriptCommit ? Date.now() : void 0;
		logMessageQueued({
			sessionId,
			source: "pi-embedded-runner"
		});
		return {
			queued: true,
			sessionId,
			target: "embedded_run",
			gatewayHealth: "live",
			...deliveredAtMs !== void 0 ? { deliveredAtMs } : {},
			enqueuedAtMs
		};
	} catch (err) {
		const errorMessage = formatQueueError(err);
		diagnosticLogger.debug(`queue message rejected: sessionId=${sessionId} err=${errorMessage}`);
		return createQueueFailureOutcome(sessionId, "runtime_rejected", errorMessage);
	}
}
function prepareEmbeddedPiQueueMessage(sessionId, text, options) {
	const handle = ACTIVE_EMBEDDED_RUNS.get(sessionId);
	if (!handle) {
		if (queueReplyRunMessage(sessionId, text)) {
			logMessageQueued({
				sessionId,
				source: "pi-embedded-runner"
			});
			return {
				kind: "complete",
				outcome: {
					queued: true,
					sessionId,
					target: "reply_run",
					gatewayHealth: "live",
					enqueuedAtMs: Date.now()
				}
			};
		}
		if (options?.waitForTranscriptCommit === true) {
			diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=transcript_commit_wait_unsupported`);
			return {
				kind: "complete",
				outcome: createQueueFailureOutcome(sessionId, "transcript_commit_wait_unsupported")
			};
		}
		diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=no_active_run`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "no_active_run")
		};
	}
	if (!handle.isStreaming()) {
		diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=not_streaming`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "not_streaming")
		};
	}
	if (handle.isCompacting()) {
		diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=compacting`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "compacting")
		};
	}
	if (options?.waitForTranscriptCommit === true && handle.supportsTranscriptCommitWait !== true) {
		diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=transcript_commit_wait_unsupported`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "transcript_commit_wait_unsupported")
		};
	}
	if (options?.sourceReplyDeliveryMode === "message_tool_only" && handle.sourceReplyDeliveryMode !== "message_tool_only") {
		diagnosticLogger.debug(`queue message failed: sessionId=${sessionId} reason=source_reply_delivery_mode_mismatch`);
		return {
			kind: "complete",
			outcome: createQueueFailureOutcome(sessionId, "source_reply_delivery_mode_mismatch")
		};
	}
	return {
		kind: "embedded_run",
		handle
	};
}
function abortEmbeddedPiRun(sessionId, opts) {
	if (typeof sessionId === "string" && sessionId.length > 0) {
		const handle = ACTIVE_EMBEDDED_RUNS.get(sessionId);
		if (!handle) {
			if (abortReplyRunBySessionId(sessionId)) return true;
			diagnosticLogger.debug(`abort failed: sessionId=${sessionId} reason=no_active_run`);
			return false;
		}
		diagnosticLogger.debug(`aborting run: sessionId=${sessionId}`);
		try {
			handle.abort();
		} catch (err) {
			diagnosticLogger.warn(`abort failed: sessionId=${sessionId} err=${String(err)}`);
			return false;
		}
		return true;
	}
	const mode = opts?.mode;
	if (mode === "compacting") {
		let aborted = false;
		for (const [id, handle] of ACTIVE_EMBEDDED_RUNS) {
			if (!handle.isCompacting()) continue;
			diagnosticLogger.debug(`aborting compacting run: sessionId=${id}`);
			try {
				handle.abort();
				aborted = true;
			} catch (err) {
				diagnosticLogger.warn(`abort failed: sessionId=${id} err=${String(err)}`);
			}
		}
		return abortActiveReplyRuns({ mode }) || aborted;
	}
	if (mode === "all") {
		let aborted = false;
		for (const [id, handle] of ACTIVE_EMBEDDED_RUNS) {
			diagnosticLogger.debug(`aborting run: sessionId=${id}`);
			try {
				handle.abort();
				aborted = true;
			} catch (err) {
				diagnosticLogger.warn(`abort failed: sessionId=${id} err=${String(err)}`);
			}
		}
		return abortActiveReplyRuns({ mode }) || aborted;
	}
	return false;
}
function isEmbeddedPiRunActive(sessionId) {
	const active = ACTIVE_EMBEDDED_RUNS.has(sessionId) || isReplyRunActiveForSessionId(sessionId);
	if (active) diagnosticLogger.debug(`run active check: sessionId=${sessionId} active=true`);
	return active;
}
function isEmbeddedPiRunHandleActive(sessionId) {
	const active = ACTIVE_EMBEDDED_RUNS.has(sessionId);
	if (active) diagnosticLogger.debug(`run handle active check: sessionId=${sessionId} active=true`);
	return active;
}
function isEmbeddedPiRunStreaming(sessionId) {
	const handle = ACTIVE_EMBEDDED_RUNS.get(sessionId);
	if (!handle) return isReplyRunStreamingForSessionId(sessionId);
	return handle.isStreaming();
}
function resolveActiveEmbeddedRunHandleSessionId(sessionKey) {
	const normalizedSessionKey = sessionKey.trim();
	if (!normalizedSessionKey) return;
	return ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.get(normalizedSessionKey);
}
function resolveActiveEmbeddedRunHandleSessionIdBySessionFile(sessionFile) {
	const normalizedSessionFile = sessionFile.trim();
	if (!normalizedSessionFile) return;
	return ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_FILE.get(resolveEmbeddedSessionFileKey(normalizedSessionFile));
}
function resolveActiveEmbeddedRunSessionId(sessionKey) {
	const normalizedSessionKey = sessionKey.trim();
	if (!normalizedSessionKey) return;
	return resolveActiveReplyRunSessionId(normalizedSessionKey) ?? ACTIVE_EMBEDDED_RUN_SESSION_IDS_BY_KEY.get(normalizedSessionKey);
}
function resolveActiveEmbeddedRunSessionIdBySessionFile(sessionFile) {
	return resolveActiveEmbeddedRunHandleSessionIdBySessionFile(sessionFile);
}
function getActiveEmbeddedRunSnapshot(sessionId) {
	return ACTIVE_EMBEDDED_RUN_SNAPSHOTS.get(sessionId);
}
/**
* Wait for active embedded runs to drain.
*
* Used during restarts so in-flight runs can release session write locks before
* the next lifecycle starts. If no timeout is passed, waits indefinitely.
*/
async function waitForActiveEmbeddedRuns(timeoutMs, opts) {
	const pollMsRaw = opts?.pollMs ?? 250;
	const pollMs = Math.max(10, Math.floor(pollMsRaw));
	if (timeoutMs !== void 0 && timeoutMs <= 0) return { drained: getActiveEmbeddedRunCount() === 0 };
	const maxWaitMs = typeof timeoutMs === "number" && Number.isFinite(timeoutMs) ? Math.max(pollMs, Math.floor(timeoutMs)) : void 0;
	const startedAt = Date.now();
	while (true) {
		if (getActiveEmbeddedRunCount() === 0) return { drained: true };
		const elapsedMs = Date.now() - startedAt;
		if (maxWaitMs !== void 0 && elapsedMs >= maxWaitMs) {
			diagnosticLogger.warn(`wait for active embedded runs timed out: activeRuns=${getActiveEmbeddedRunCount()} timeoutMs=${maxWaitMs}`);
			return { drained: false };
		}
		await new Promise((resolve) => setTimeout(resolve, pollMs));
	}
}
function waitForEmbeddedPiRunEnd(sessionId, timeoutMs = 15e3) {
	if (!sessionId) return Promise.resolve(true);
	if (!ACTIVE_EMBEDDED_RUNS.has(sessionId)) return waitForReplyRunEndBySessionId(sessionId, timeoutMs);
	diagnosticLogger.debug(`waiting for run end: sessionId=${sessionId} timeoutMs=${timeoutMs}`);
	return new Promise((resolve) => {
		const waiters = EMBEDDED_RUN_WAITERS.get(sessionId) ?? /* @__PURE__ */ new Set();
		const waiter = {
			resolve,
			timer: setTimeout(() => {
				waiters.delete(waiter);
				if (waiters.size === 0) EMBEDDED_RUN_WAITERS.delete(sessionId);
				diagnosticLogger.warn(`wait timeout: sessionId=${sessionId} timeoutMs=${timeoutMs}`);
				resolve(false);
			}, Math.max(100, timeoutMs))
		};
		waiters.add(waiter);
		EMBEDDED_RUN_WAITERS.set(sessionId, waiters);
		if (!ACTIVE_EMBEDDED_RUNS.has(sessionId)) {
			waiters.delete(waiter);
			if (waiters.size === 0) EMBEDDED_RUN_WAITERS.delete(sessionId);
			clearTimeout(waiter.timer);
			resolve(true);
		}
	});
}
async function abortAndDrainEmbeddedPiRun(params) {
	const settleMs = params.settleMs ?? 15e3;
	const aborted = abortEmbeddedPiRun(params.sessionId);
	const drained = aborted ? await waitForEmbeddedPiRunEnd(params.sessionId, settleMs) : false;
	return {
		aborted,
		drained,
		forceCleared: params.forceClear === true && (!aborted || !drained) ? forceClearEmbeddedPiRun(params.sessionId, params.sessionKey, params.reason) : false
	};
}
function notifyEmbeddedRunEnded(sessionId) {
	const waiters = EMBEDDED_RUN_WAITERS.get(sessionId);
	if (!waiters || waiters.size === 0) return;
	EMBEDDED_RUN_WAITERS.delete(sessionId);
	diagnosticLogger.debug(`notifying waiters: sessionId=${sessionId} waiterCount=${waiters.size}`);
	for (const waiter of waiters) {
		clearTimeout(waiter.timer);
		waiter.resolve(true);
	}
}
function setActiveEmbeddedRun(sessionId, handle, sessionKey, sessionFile) {
	const wasActive = ACTIVE_EMBEDDED_RUNS.has(sessionId);
	ACTIVE_EMBEDDED_RUNS.set(sessionId, handle);
	setActiveRunSessionKey(sessionKey, sessionId);
	clearActiveRunSessionFiles(sessionId);
	setActiveRunSessionFile(sessionFile, sessionId);
	logSessionStateChange({
		sessionId,
		sessionKey,
		sessionFile,
		state: "processing",
		reason: wasActive ? "run_replaced" : "run_started"
	});
	markDiagnosticEmbeddedRunStarted({
		sessionId,
		sessionKey
	});
	if (!sessionId.startsWith("probe-")) diagnosticLogger.debug(`run registered: sessionId=${sessionId} totalActive=${ACTIVE_EMBEDDED_RUNS.size}`);
}
function updateActiveEmbeddedRunSnapshot(sessionId, snapshot) {
	if (!ACTIVE_EMBEDDED_RUNS.has(sessionId)) return;
	ACTIVE_EMBEDDED_RUN_SNAPSHOTS.set(sessionId, snapshot);
}
function updateActiveEmbeddedRunSessionFile(sessionId, sessionFile) {
	if (!ACTIVE_EMBEDDED_RUNS.has(sessionId)) return;
	clearActiveRunSessionFiles(sessionId);
	setActiveRunSessionFile(sessionFile, sessionId);
	updateDiagnosticSessionFile({
		sessionId,
		sessionFile
	});
}
function clearActiveEmbeddedRun(sessionId, handle, sessionKey, sessionFile) {
	const activeHandle = ACTIVE_EMBEDDED_RUNS.get(sessionId);
	if (activeHandle === void 0) return;
	if (activeHandle === handle) {
		ACTIVE_EMBEDDED_RUNS.delete(sessionId);
		ACTIVE_EMBEDDED_RUN_SNAPSHOTS.delete(sessionId);
		EMBEDDED_RUN_MODEL_SWITCH_REQUESTS.delete(sessionId);
		clearActiveRunSessionKeys(sessionId, sessionKey);
		clearActiveRunSessionFiles(sessionId, sessionFile);
		logSessionStateChange({
			sessionId,
			sessionKey,
			sessionFile,
			state: "idle",
			reason: "run_completed"
		});
		markDiagnosticEmbeddedRunEnded({
			sessionId,
			sessionKey
		});
		if (!sessionId.startsWith("probe-")) diagnosticLogger.debug(`run cleared: sessionId=${sessionId} totalActive=${ACTIVE_EMBEDDED_RUNS.size}`);
		notifyEmbeddedRunEnded(sessionId);
	} else diagnosticLogger.debug(`run clear skipped: sessionId=${sessionId} reason=handle_mismatch`);
}
function forceClearEmbeddedPiRun(sessionId, sessionKey, reason = "stuck_recovery") {
	let cleared = false;
	if (ACTIVE_EMBEDDED_RUNS.has(sessionId)) {
		ACTIVE_EMBEDDED_RUNS.delete(sessionId);
		ACTIVE_EMBEDDED_RUN_SNAPSHOTS.delete(sessionId);
		EMBEDDED_RUN_MODEL_SWITCH_REQUESTS.delete(sessionId);
		clearActiveRunSessionKeys(sessionId, sessionKey);
		clearActiveRunSessionFiles(sessionId);
		logSessionStateChange({
			sessionId,
			sessionKey,
			state: "idle",
			reason
		});
		markDiagnosticEmbeddedRunEnded({
			sessionId,
			sessionKey
		});
		notifyEmbeddedRunEnded(sessionId);
		cleared = true;
	}
	return forceClearReplyRunBySessionId(sessionId, /* @__PURE__ */ new Error(`Embedded run force-cleared by ${reason}`)) || cleared;
}
//#endregion
export { updateActiveEmbeddedRunSessionFile as _, getActiveEmbeddedRunSnapshot as a, waitForEmbeddedPiRunEnd as b, isEmbeddedPiRunStreaming as c, queueEmbeddedPiMessageWithOutcomeAsync as d, resolveActiveEmbeddedRunHandleSessionId as f, setActiveEmbeddedRun as g, resolveActiveEmbeddedRunSessionIdBySessionFile as h, formatEmbeddedPiQueueFailureSummary as i, queueEmbeddedPiMessage as l, resolveActiveEmbeddedRunSessionId as m, abortEmbeddedPiRun as n, isEmbeddedPiRunActive as o, resolveActiveEmbeddedRunHandleSessionIdBySessionFile as p, clearActiveEmbeddedRun as r, isEmbeddedPiRunHandleActive as s, abortAndDrainEmbeddedPiRun as t, queueEmbeddedPiMessageWithOutcome as u, updateActiveEmbeddedRunSnapshot as v, resolveEmbeddedSessionFileKey as x, waitForActiveEmbeddedRuns as y };
