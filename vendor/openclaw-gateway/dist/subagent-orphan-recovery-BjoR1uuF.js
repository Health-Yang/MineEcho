import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { d as resolveAgentIdFromSessionKey } from "./session-key-yaI3D3Bl.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import "./config-BtNBbhZb.js";
import { r as callGateway } from "./call-D_O83KsN.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { t as loadSessionStore } from "./store-load-Di_AfnVx.js";
import { u as updateSessionStore } from "./store-B5j4GKkg.js";
import "./sessions-Ct4mpWsk.js";
import { l as readSessionMessagesAsync } from "./session-utils.fs-D_Qde0sG.js";
import { a as markSubagentRecoveryAttempt, n as evaluateSubagentRecoveryGate, o as markSubagentRecoveryWedged } from "./subagent-recovery-state-Chw_zLIZ.js";
import { r as resolveInternalSessionEffectsTranscriptPath } from "./internal-session-effects-BOnfxdYU.js";
import { n as finalizeInterruptedSubagentRun, r as replaceSubagentRunAfterSteer } from "./subagent-registry-steer-runtime-9Vso0zzU.js";
import crypto from "node:crypto";
//#region src/agents/subagent-orphan-recovery.ts
/**
* Post-restart interrupted-run resume for subagent sessions.
*
* After a SIGUSR1 gateway reload aborts in-flight subagent LLM calls,
* this module scans for interrupted sessions (those with `abortedLastRun: true`
* that are still tracked as active in the subagent registry) and sends a
* synthetic resume message to restart their work. Parent notification is handled
* separately by completion delivery after the child reaches a terminal result.
*
* @see https://github.com/openclaw/openclaw/issues/47711
*/
const log = createSubsystemLogger("subagent-interrupted-resume");
/** Delay before attempting recovery to let the gateway finish bootstrapping. */
const DEFAULT_RECOVERY_DELAY_MS = 5e3;
function isLegacyRestartInterruptedTimeout(runRecord, entry) {
	return entry?.abortedLastRun === true && runRecord.outcome?.status === "timeout" && typeof runRecord.endedAt === "number" && runRecord.endedAt > 0;
}
function reclassifyLegacyRestartInterruptedRun(runRecord) {
	const interruptedAt = runRecord.endedAt;
	runRecord.execution = {
		...runRecord.execution,
		status: "interrupted",
		interruptedAt,
		interruptionReason: "gateway-restart",
		endedAt: void 0,
		outcome: void 0
	};
	runRecord.endedAt = void 0;
	runRecord.endedReason = void 0;
	runRecord.outcome = void 0;
}
/**
* Build the resume message for an orphaned subagent.
*/
function buildResumeMessage(task, lastHumanMessage) {
	const maxTaskLen = 2e3;
	let message = `[System] Your previous turn was interrupted by a gateway reload. Your original task was:\n\n${task.length > maxTaskLen ? `${task.slice(0, maxTaskLen)}...` : task}\n\n`;
	if (lastHumanMessage) message += `The last message from the user before the interruption was:\n\n${lastHumanMessage}\n\n`;
	message += `Please continue where you left off.`;
	return message;
}
function extractMessageText(msg) {
	if (!msg || typeof msg !== "object") return;
	const m = msg;
	if (typeof m.content === "string") return m.content;
	if (Array.isArray(m.content)) return m.content.filter((c) => typeof c === "object" && c !== null && c.type === "text" && typeof c.text === "string").map((c) => c.text).filter(Boolean).join("\n") || void 0;
}
/**
* Send a resume message to an orphaned subagent session via the gateway agent method.
*/
async function resumeOrphanedSession(params) {
	let resumeMessage = buildResumeMessage(params.task, params.lastHumanMessage);
	if (params.configChangeHint) resumeMessage += params.configChangeHint;
	try {
		const idempotencyKey = crypto.randomUUID();
		const result = await callGateway({
			method: "agent",
			params: {
				message: resumeMessage,
				sessionKey: params.sessionKey,
				idempotencyKey,
				deliver: false,
				lane: "subagent",
				inputProvenance: {
					kind: "inter_session",
					sourceSessionKey: params.originalRun.requesterSessionKey,
					sourceChannel: "internal",
					sourceTool: "subagent_interrupted_resume"
				},
				sessionEffects: "internal",
				suppressPromptPersistence: true
			},
			timeoutMs: 1e4
		});
		if (!replaceSubagentRunAfterSteer({
			previousRunId: params.originalRunId,
			nextRunId: result.runId,
			fallback: params.originalRun,
			transcriptFile: resolveInternalSessionEffectsTranscriptPath(result.runId)
		})) {
			log.warn(`resumed orphaned session ${params.sessionKey} but remap failed (old run already removed); treating resume as accepted to avoid duplicate restarts`);
			return { resumed: true };
		}
		log.info(`resumed orphaned session: ${params.sessionKey}`);
		return { resumed: true };
	} catch (err) {
		const error = formatErrorMessage(err);
		log.warn(`failed to resume orphaned session ${params.sessionKey}: ${error}`);
		return {
			resumed: false,
			error
		};
	}
}
/**
* Scan for and resume orphaned subagent sessions after a gateway restart.
*
* An orphaned session is one where:
* 1. It has an active (not ended) entry in the subagent run registry
* 2. Its session store entry has `abortedLastRun: true`
*
* For each orphaned session found, we:
* 1. Clear the `abortedLastRun` flag
* 2. Send a synthetic resume message to trigger a new LLM turn
*/
async function recoverOrphanedSubagentSessions(params) {
	const result = {
		recovered: 0,
		failed: 0,
		skipped: 0,
		failedRuns: []
	};
	const resumedSessionKeys = params.resumedSessionKeys ?? /* @__PURE__ */ new Set();
	const configChangePattern = /openclaw\.json|openclaw gateway restart|config\.patch/i;
	try {
		const activeRuns = params.getActiveRuns();
		if (activeRuns.size === 0) return result;
		const cfg = getRuntimeConfig();
		const storeCache = /* @__PURE__ */ new Map();
		for (const [runId, runRecord] of activeRuns.entries()) {
			const childSessionKey = runRecord.childSessionKey?.trim();
			if (!childSessionKey) continue;
			const now = Date.now();
			if (resumedSessionKeys.has(childSessionKey)) {
				result.skipped++;
				continue;
			}
			try {
				const agentId = resolveAgentIdFromSessionKey(childSessionKey);
				const storePath = resolveStorePath(cfg.session?.store, { agentId });
				let store = storeCache.get(storePath);
				if (!store) {
					store = loadSessionStore(storePath);
					storeCache.set(storePath, store);
				}
				const entry = store[childSessionKey];
				if (!entry) {
					result.skipped++;
					continue;
				}
				if (isLegacyRestartInterruptedTimeout(runRecord, entry)) reclassifyLegacyRestartInterruptedRun(runRecord);
				if (typeof runRecord.endedAt === "number" && runRecord.endedAt > 0) {
					result.skipped++;
					continue;
				}
				if (!entry.abortedLastRun) {
					result.skipped++;
					continue;
				}
				const recoveryGate = evaluateSubagentRecoveryGate(entry, now);
				if (!recoveryGate.allowed) {
					if (recoveryGate.shouldMarkWedged) try {
						await updateSessionStore(storePath, (currentStore) => {
							const current = currentStore[childSessionKey];
							if (current) {
								markSubagentRecoveryWedged({
									entry: current,
									now,
									runId,
									reason: recoveryGate.reason
								});
								currentStore[childSessionKey] = current;
							}
						});
						markSubagentRecoveryWedged({
							entry,
							now,
							runId,
							reason: recoveryGate.reason
						});
					} catch (err) {
						log.warn(`failed to persist wedged subagent recovery marker for ${childSessionKey}: ${String(err)}`);
					}
					log.warn(`skipping orphan recovery for ${childSessionKey}: ${recoveryGate.reason}`);
					result.skipped++;
					result.failedRuns.push({
						runId,
						childSessionKey,
						error: recoveryGate.reason
					});
					continue;
				}
				log.info(`found orphaned subagent session: ${childSessionKey} (run=${runId})`);
				const messages = await readSessionMessagesAsync(entry.sessionId, storePath, entry.sessionFile, {
					mode: "recent",
					maxMessages: 200,
					maxBytes: 1024 * 1024
				});
				const lastHumanMessage = [...messages].toReversed().find((msg) => msg?.role === "user");
				const configChangeDetected = messages.some((msg) => {
					if (msg?.role !== "assistant") return false;
					const text = extractMessageText(msg);
					return typeof text === "string" && configChangePattern.test(text);
				});
				const resumeResult = await resumeOrphanedSession({
					sessionKey: childSessionKey,
					task: runRecord.task,
					lastHumanMessage: extractMessageText(lastHumanMessage),
					configChangeHint: configChangeDetected ? "\n\n[config changes from your previous run were already applied — do not re-modify openclaw.json or restart the gateway]" : void 0,
					originalRunId: runId,
					originalRun: runRecord
				});
				if (resumeResult.resumed) {
					resumedSessionKeys.add(childSessionKey);
					try {
						await updateSessionStore(storePath, (currentStore) => {
							const current = currentStore[childSessionKey];
							if (current) {
								current.abortedLastRun = false;
								markSubagentRecoveryAttempt({
									entry: current,
									now: Date.now(),
									runId,
									attempt: recoveryGate.nextAttempt
								});
								current.updatedAt = Date.now();
								currentStore[childSessionKey] = current;
							}
						});
					} catch (err) {
						log.warn(`resume succeeded but failed to update session store for ${childSessionKey}: ${String(err)}`);
					}
					result.recovered++;
				} else {
					log.warn(`resume failed for ${childSessionKey}; abortedLastRun flag preserved for retry on next restart`);
					result.failed++;
					result.failedRuns.push({
						runId,
						childSessionKey,
						error: resumeResult.error
					});
				}
			} catch (err) {
				const error = formatErrorMessage(err);
				log.warn(`error processing orphaned session ${childSessionKey}: ${error}`);
				result.failed++;
				result.failedRuns.push({
					runId,
					childSessionKey,
					error
				});
			}
		}
	} catch (err) {
		log.warn(`orphan recovery scan failed: ${String(err)}`);
		if (result.failed === 0) result.failed = 1;
	}
	if (result.recovered > 0 || result.failed > 0) log.info(`orphan recovery complete: recovered=${result.recovered} failed=${result.failed} skipped=${result.skipped}`);
	return result;
}
/** Maximum number of retry attempts for orphan recovery. */
const MAX_RECOVERY_RETRIES = 3;
/** Backoff multiplier between retries (exponential). */
const RETRY_BACKOFF_MULTIPLIER = 2;
function buildRecoveryFailureMessage(params) {
	const base = `Subagent run was interrupted by a gateway restart or connection loss. Automatic recovery failed after ${params.attempts} attempt${params.attempts === 1 ? "" : "s"}. Please retry.`;
	const detail = params.error?.trim();
	if (!detail) return base;
	return `${base} (${detail})`;
}
/**
* Schedule orphan recovery after a delay, with retry logic.
* The delay gives the gateway time to fully bootstrap after restart.
* If recovery fails (e.g. gateway not yet ready), retries with exponential backoff.
*/
function scheduleOrphanRecovery(params) {
	const initialDelay = params.delayMs ?? DEFAULT_RECOVERY_DELAY_MS;
	const maxRetries = params.maxRetries ?? MAX_RECOVERY_RETRIES;
	const resumedSessionKeys = /* @__PURE__ */ new Set();
	const attemptRecovery = (attempt, delay) => {
		setTimeout(() => {
			recoverOrphanedSubagentSessions({
				...params,
				resumedSessionKeys
			}).then((result) => {
				if (result.failed > 0 && attempt < maxRetries) {
					const nextDelay = delay * RETRY_BACKOFF_MULTIPLIER;
					log.info(`orphan recovery had ${result.failed} failure(s); retrying in ${nextDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
					attemptRecovery(attempt + 1, nextDelay);
					return;
				}
				if (result.failedRuns.length === 0) return;
				const attempts = attempt + 1;
				Promise.allSettled(result.failedRuns.map((run) => finalizeInterruptedSubagentRun({
					runId: run.runId,
					childSessionKey: run.childSessionKey,
					error: buildRecoveryFailureMessage({
						attempts,
						error: run.error
					})
				})));
			}).catch((err) => {
				if (attempt < maxRetries) {
					const nextDelay = delay * RETRY_BACKOFF_MULTIPLIER;
					log.warn(`scheduled orphan recovery failed: ${String(err)}; retrying in ${nextDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
					attemptRecovery(attempt + 1, nextDelay);
				} else log.warn(`scheduled orphan recovery failed after ${maxRetries} retries: ${String(err)}`);
			});
		}, delay).unref?.();
	};
	attemptRecovery(0, initialDelay);
}
//#endregion
export { scheduleOrphanRecovery };
