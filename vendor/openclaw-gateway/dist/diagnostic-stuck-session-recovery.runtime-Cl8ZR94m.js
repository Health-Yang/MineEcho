import { t as getDiagnosticSessionActivitySnapshot } from "./diagnostic-run-activity-DfY2SXQ5.js";
import { C as formatRecoveryOutcome, T as resolveCronSessionDiagnosticContext, w as formatStoppedCronSessionDiagnosticFields } from "./diagnostic-BDsaMZfL.js";
import { t as diagnosticLogger } from "./diagnostic-runtime-woKtZlOK.js";
import { i as isDiagnosticSessionStateCurrent } from "./diagnostic-session-state-DwjGSduD.js";
import { f as resolveActiveEmbeddedRunHandleSessionId, h as resolveActiveEmbeddedRunSessionIdBySessionFile, m as resolveActiveEmbeddedRunSessionId, o as isEmbeddedPiRunActive, p as resolveActiveEmbeddedRunHandleSessionIdBySessionFile, s as isEmbeddedPiRunHandleActive, t as abortAndDrainEmbeddedPiRun } from "./runs-p1TN18LG.js";
import { m as resetCommandLane, o as getCommandLaneSnapshot } from "./command-queue-fCeWoVd6.js";
import { t as resolveEmbeddedSessionLane } from "./lanes-BrQRlRRS.js";
//#region src/logging/diagnostic-stuck-session-recovery.runtime.ts
const STUCK_SESSION_ABORT_SETTLE_MS = 15e3;
const STUCK_SESSION_PROGRESS_STALE_MS = 5 * 6e4;
function resolveStaleActiveProgressAbortMs(params) {
	const configured = params.staleActiveProgressAbortMs;
	return typeof configured === "number" && configured > 0 ? configured : STUCK_SESSION_PROGRESS_STALE_MS;
}
function isActiveRunProgressStale(params) {
	if ((params.queueDepth ?? 0) <= 0) return false;
	const lastProgressAgeMs = getDiagnosticSessionActivitySnapshot({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey
	}).lastProgressAgeMs;
	return typeof lastProgressAgeMs === "number" && lastProgressAgeMs >= params.staleAbortMs;
}
const recoveriesInFlight = /* @__PURE__ */ new Set();
function recoveryKey(params) {
	return params.sessionKey?.trim() || params.sessionId?.trim() || void 0;
}
function formatRecoveryContext(params, extra) {
	const fields = [
		`sessionId=${params.sessionId ?? extra?.activeSessionId ?? "unknown"}`,
		`sessionKey=${params.sessionKey ?? "unknown"}`,
		`age=${Math.round(params.ageMs / 1e3)}s`,
		`queueDepth=${params.queueDepth ?? 0}`
	];
	if (extra?.activeSessionId) fields.push(`activeSessionId=${extra.activeSessionId}`);
	if (extra?.lane) fields.push(`lane=${extra.lane}`);
	if (extra?.activeCount !== void 0) fields.push(`laneActive=${extra.activeCount}`);
	if (extra?.queuedCount !== void 0) fields.push(`laneQueued=${extra.queuedCount}`);
	return fields.join(" ");
}
async function recoverStuckDiagnosticSession(params) {
	const key = recoveryKey(params);
	if (!key || recoveriesInFlight.has(key)) return {
		status: "skipped",
		action: "observe_only",
		reason: key ? "already_in_flight" : "missing_session_ref",
		sessionId: params.sessionId,
		sessionKey: params.sessionKey
	};
	recoveriesInFlight.add(key);
	try {
		if (!isDiagnosticSessionStateCurrent({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			generation: params.stateGeneration,
			state: params.expectedState ?? "processing"
		})) return {
			status: "skipped",
			action: "observe_only",
			reason: "stale_session_state",
			sessionId: params.sessionId,
			sessionKey: params.sessionKey
		};
		const fallbackActiveSessionId = params.sessionId && isEmbeddedPiRunHandleActive(params.sessionId) ? params.sessionId : void 0;
		const fileActiveSessionId = params.sessionFile ? resolveActiveEmbeddedRunHandleSessionIdBySessionFile(params.sessionFile) : void 0;
		let activeSessionId = params.sessionKey ? resolveActiveEmbeddedRunHandleSessionId(params.sessionKey) ?? fileActiveSessionId ?? fallbackActiveSessionId : fileActiveSessionId ?? fallbackActiveSessionId;
		const fileActiveWorkSessionId = params.sessionFile ? resolveActiveEmbeddedRunSessionIdBySessionFile(params.sessionFile) : void 0;
		const activeWorkSessionId = params.sessionKey ? resolveActiveEmbeddedRunSessionId(params.sessionKey) ?? fileActiveWorkSessionId ?? params.sessionId : fileActiveWorkSessionId ?? params.sessionId;
		const laneKey = params.sessionKey?.trim() || params.sessionId?.trim();
		const sessionLane = laneKey ? resolveEmbeddedSessionLane(laneKey) : null;
		let aborted = false;
		let drained = true;
		let forceCleared = false;
		const staleActiveProgressAbortMs = resolveStaleActiveProgressAbortMs(params);
		if (activeSessionId) {
			const reclaimStaleActiveRun = params.allowActiveAbort !== true && isActiveRunProgressStale({
				sessionId: activeSessionId,
				sessionKey: params.sessionKey,
				queueDepth: params.queueDepth,
				staleAbortMs: staleActiveProgressAbortMs
			});
			if (params.allowActiveAbort !== true && !reclaimStaleActiveRun) {
				const outcome = {
					status: "skipped",
					action: "observe_only",
					reason: "active_embedded_run",
					sessionId: params.sessionId,
					sessionKey: params.sessionKey,
					activeSessionId,
					activeWorkKind: "embedded_run"
				};
				diagnosticLogger.warn(`stuck session recovery skipped: ${formatRecoveryContext(params, { activeSessionId })}`);
				diagnosticLogger.warn(`stuck session recovery outcome: ${formatRecoveryOutcome(outcome)}`);
				return outcome;
			}
			if (reclaimStaleActiveRun) diagnosticLogger.warn(`stuck session recovery reclaiming stale active run: ${formatRecoveryContext(params, { activeSessionId })}`);
			const result = await abortAndDrainEmbeddedPiRun({
				sessionId: activeSessionId,
				sessionKey: params.sessionKey,
				settleMs: STUCK_SESSION_ABORT_SETTLE_MS,
				forceClear: true,
				reason: "stuck_recovery"
			});
			aborted = result.aborted;
			drained = result.drained;
			forceCleared = result.forceCleared;
		}
		if (!activeSessionId && activeWorkSessionId && isEmbeddedPiRunActive(activeWorkSessionId)) {
			const reclaimStaleReplyWork = params.allowActiveAbort !== true && isActiveRunProgressStale({
				sessionId: activeWorkSessionId,
				sessionKey: params.sessionKey,
				queueDepth: params.queueDepth,
				staleAbortMs: staleActiveProgressAbortMs
			});
			if (params.allowActiveAbort === true || reclaimStaleReplyWork) {
				if (reclaimStaleReplyWork) diagnosticLogger.warn(`stuck session recovery reclaiming stale active reply work: ${formatRecoveryContext(params, { activeSessionId: activeWorkSessionId })}`);
				const result = await abortAndDrainEmbeddedPiRun({
					sessionId: activeWorkSessionId,
					sessionKey: params.sessionKey,
					settleMs: STUCK_SESSION_ABORT_SETTLE_MS,
					forceClear: true,
					reason: "stuck_recovery"
				});
				aborted = result.aborted;
				drained = result.drained;
				forceCleared = result.forceCleared;
				activeSessionId = activeWorkSessionId;
			} else {
				const outcome = {
					status: "skipped",
					action: "keep_lane",
					reason: "active_reply_work",
					sessionId: params.sessionId,
					sessionKey: params.sessionKey,
					activeSessionId: activeWorkSessionId,
					activeWorkKind: "embedded_run"
				};
				diagnosticLogger.warn(`stuck session recovery outcome: ${formatRecoveryOutcome(outcome)}`);
				return outcome;
			}
		}
		if (!activeSessionId && sessionLane) {
			const laneSnapshot = getCommandLaneSnapshot(sessionLane);
			if (laneSnapshot.activeCount > 0) {
				const outcome = {
					status: "skipped",
					action: "keep_lane",
					reason: "active_lane_task",
					sessionId: params.sessionId,
					sessionKey: params.sessionKey,
					lane: sessionLane,
					activeCount: laneSnapshot.activeCount,
					queuedCount: laneSnapshot.queuedCount
				};
				diagnosticLogger.warn(`stuck session recovery outcome: ${formatRecoveryOutcome(outcome)}`);
				return outcome;
			}
		}
		const queuedCount = sessionLane ? getCommandLaneSnapshot(sessionLane).queuedCount : 0;
		const released = sessionLane && (!activeSessionId || !aborted || !drained) ? resetCommandLane(sessionLane) : 0;
		const clearStaleQueuedSession = !aborted && released === 0 && (params.queueDepth ?? 0) > 0;
		if (aborted || forceCleared || released > 0 || clearStaleQueuedSession) {
			const action = aborted || forceCleared ? "abort_embedded_run" : "release_lane";
			const stoppedFields = formatStoppedCronSessionDiagnosticFields(resolveCronSessionDiagnosticContext({
				sessionKey: params.sessionKey,
				activeSessionId
			}));
			diagnosticLogger.warn(`stuck session recovery: sessionId=${params.sessionId ?? activeSessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} age=${Math.round(params.ageMs / 1e3)}s action=${action} aborted=${aborted} drained=${drained} released=${released}${stoppedFields ? ` ${stoppedFields}` : ""}`);
			const outcome = aborted || forceCleared ? {
				status: "aborted",
				action: "abort_embedded_run",
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				activeSessionId,
				activeWorkKind: "embedded_run",
				aborted,
				drained,
				forceCleared,
				released,
				lane: sessionLane ?? void 0,
				...queuedCount > 0 ? { queuedCount } : {}
			} : {
				status: "released",
				action: "release_lane",
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				released,
				lane: sessionLane ?? void 0
			};
			diagnosticLogger.warn(`stuck session recovery outcome: ${formatRecoveryOutcome(outcome)}`);
			return outcome;
		}
		const outcome = {
			status: "noop",
			action: "none",
			reason: "no_active_work",
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			lane: sessionLane ?? void 0
		};
		diagnosticLogger.warn(`stuck session recovery outcome: ${formatRecoveryOutcome(outcome)}`);
		return outcome;
	} catch (err) {
		const outcome = {
			status: "failed",
			action: "none",
			reason: "exception",
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			error: String(err)
		};
		diagnosticLogger.warn(`stuck session recovery failed: sessionId=${params.sessionId ?? "unknown"} sessionKey=${params.sessionKey ?? "unknown"} err=${String(err)}`);
		return outcome;
	} finally {
		recoveriesInFlight.delete(key);
	}
}
const testing = { resetRecoveriesInFlight() {
	recoveriesInFlight.clear();
} };
//#endregion
export { testing as __testing, testing, recoverStuckDiagnosticSession };
