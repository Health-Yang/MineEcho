import { c as normalizeOptionalString, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { a as formatUncaughtError, c as readErrorName } from "./errors-BsfWgA0I.js";
import { n as isAbortError } from "./unhandled-rejections-uJ1-s-X0.js";
import { _ as uniqueStrings, l as normalizeStringEntries } from "./string-normalization-B8G0vlWE.js";
import "./agent-scope-CudANNo3.js";
import { a as isSubagentSessionKey, l as parseRawSessionConversationRef, n as isAcpSessionKey, u as parseThreadSessionSuffix } from "./session-key-utils-AmKO9Roj.js";
import { d as resolveAgentIdFromSessionKey, l as normalizeAgentId, o as classifySessionKeyShape } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId, n as listAgentIds, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { n as defaultRuntime } from "./runtime-yzlkhCoS.js";
import { r as resolveProviderIdForAuth } from "./provider-auth-aliases-5VCl4fwR.js";
import { a as hasGatewayClientCap, r as GATEWAY_CLIENT_MODES, t as GATEWAY_CLIENT_CAPS } from "./client-info-BxgIUTRt.js";
import { a as isInternalNonDeliveryChannel } from "./message-channel-core-NW6lw3Ys.js";
import { c as isGatewayMessageChannel, s as isDeliverableMessageChannel, u as normalizeMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { r as setSafeTimeout } from "./timer-delay-awNPCchy.js";
import { Ii as ErrorCodes, Li as errorShape, i as validateAgentWaitParams, n as validateAgentIdentityParams, r as validateAgentParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { c as normalizeInputProvenance, l as shouldPreserveUserFacingSessionStateForInputProvenance, r as annotateInterSessionPromptText } from "./input-provenance-D_ZjwTES.js";
import { t as ADMIN_SCOPE } from "./operator-scopes-DGvgHuOd.js";
import "./method-scopes-BnJ64Q8O.js";
import { i as resolveAssistantAvatarUrl } from "./control-ui-shared-_7aiIzji.js";
import { l as onAgentEvent, u as registerAgentRunContext } from "./agent-events-BuYtWSh4.js";
import { n as resolveAgentMainSessionKey, r as resolveExplicitAgentSessionKey } from "./main-session-896o98eb.js";
import { n as canonicalizeSpawnedByForAgent } from "./session-store-key-Bm8fGm9t.js";
import { i as mergeDeliveryContext, o as normalizeDeliveryContext, s as normalizeSessionDeliveryFields } from "./delivery-context.shared-B9zntlj0.js";
import { a as resolveSessionFilePathOptions, i as resolveSessionFilePath } from "./paths-DZXdqwOo.js";
import { u as updateSessionStore } from "./store-B5j4GKkg.js";
import { n as mergeSessionEntry } from "./types-D7s3-R_6.js";
import { c as resolveSessionLifecycleTimestamps } from "./sessions-Ct4mpWsk.js";
import { c as resolveSessionResetPolicy, n as resolveChannelResetConfig, o as evaluateSessionFreshness, r as resolveSessionResetType } from "./reset-g3NFNZsz.js";
import { t as asBoolean } from "./boolean-CZag3-H2.js";
import { r as resolveAgentTimeoutMs } from "./task-completion-contract-D5t-_eBh.js";
import { i as createRunningTaskRun, o as finalizeTaskRunByRunId } from "./detached-task-runtime-BOScrQoy.js";
import { c as loadSessionEntry, l as migrateAndPruneGatewaySessionStoreKey, p as resolveGatewayModelSupportsImages, s as loadGatewaySessionRow, v as resolveSessionModelRef } from "./session-utils-CmwnszsS.js";
import { i as resolveSandboxConfigForAgent } from "./config-DTzdayJb.js";
import { o as isTimeoutError } from "./failover-error-wBZizcCn.js";
import { s as resolveTrustedGroupId } from "./pi-tools.policy-Y73YR7fr.js";
import { i as resolveIngressWorkspaceOverrideForSpawnedRun, r as normalizeSpawnedRunMetadata } from "./spawn-requester-origin-DRzgz0AK.js";
import { n as shouldDowngradeDeliveryToSessionOnly } from "./best-effort-delivery-D44NhGom.js";
import { n as resolveMessageChannelSelection } from "./channel-selection-BbtweWak.js";
import { i as isBlockedLivenessState, n as isAbortedAgentStopReason, r as formatBlockedLivenessError, t as AGENT_RUN_ABORTED_ERROR } from "./run-termination-DzoWxvjU.js";
import { s as normalizeAgentRunTimeoutPhase } from "./run-wait-DO7Iqhxb.js";
import { n as resolveSendPolicy } from "./send-policy-BUg-fAPA.js";
import { a as resolveAgentRunExpiresAtMs, i as registerChatAbortController, o as updateChatRunProvider } from "./chat-abort-BRIlXlGa.js";
import { a as emitGatewaySessionEndPluginHook, c as performGatewaySessionReset, o as emitGatewaySessionStartPluginHook } from "./session-reset-service-BTKvwiKu.js";
import { i as resolveBareSessionResetPromptState, n as shouldApplyStartupContext, r as resolveBareResetBootstrapFileAccess, t as buildSessionStartupContextPrelude } from "./startup-context-CShukRyj.js";
import { n as resolvePublicAgentAvatarSource, t as resolveAgentAvatar } from "./identity-avatar-OMwLytt0.js";
import { n as agentCommandFromIngress } from "./agent-command-l6N_480Y.js";
import { t as formatForLog } from "./ws-log-Fic6EinB.js";
import "./agent-BDcPW73x.js";
import { n as consumeExecApprovalFollowupRuntimeHandoff, r as parseExecApprovalFollowupApprovalId } from "./bash-tools.exec-approval-followup-state-CZKm2nN5.js";
import { n as resolveAgentOutboundTarget, t as resolveAgentDeliveryPlanWithSessionRoute } from "./agent-delivery-Mo4b1kFL.js";
import { a as resolveChatAttachmentMaxBytes, i as parseMessageWithAttachments, n as MediaOffloadError, t as normalizeRpcAttachmentsToChatAttachments } from "./attachment-normalize-CeQlBJCY.js";
import { n as timestampOptsFromConfig, t as injectTimestamp } from "./agent-timestamp-JdPenpRZ.js";
import { n as setGatewayDedupeEntry, r as waitForTerminalGatewayDedupe, t as readTerminalSnapshotFromGatewayDedupe } from "./agent-wait-dedupe-x4nPImUT.js";
import { n as resolveAssistantIdentity } from "./assistant-identity-DfhdJohv.js";
import { r as resolveVoiceWakeRouteByTrigger, t as loadVoiceWakeRoutingConfig } from "./voicewake-routing-D3DNz6h6.js";
import { t as reactivateCompletedSubagentSession } from "./session-subagent-reactivation-BcbeevQu.js";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
//#region src/gateway/server-methods/agent-job.ts
const AGENT_RUN_CACHE_TTL_MS = 10 * 6e4;
/**
* Embedded runs can emit transient lifecycle `error` events while auth/model
* failover is still in progress. Give errors a short grace window so a
* subsequent `start` event can cancel premature terminal snapshots.
*/
const AGENT_RUN_ERROR_RETRY_GRACE_MS = 15e3;
/**
* Some embedded runtimes emit an intermediate lifecycle `end` with
* `aborted=true` immediately before retrying the same run. Hold timeout
* snapshots briefly so `agent.wait` does not resolve to a stale timeout when a
* final success is about to arrive.
*/
const AGENT_RUN_TIMEOUT_RETRY_GRACE_MS = 15e3;
const agentRunCache = /* @__PURE__ */ new Map();
const agentRunStarts = /* @__PURE__ */ new Map();
const pendingAgentRunErrors = /* @__PURE__ */ new Map();
const pendingAgentRunTimeouts = /* @__PURE__ */ new Map();
const agentRunWaiterCounts = /* @__PURE__ */ new Map();
let agentRunListenerStarted = false;
function pruneAgentRunCache(now = Date.now()) {
	for (const [runId, entry] of agentRunCache) if (now - entry.ts > AGENT_RUN_CACHE_TTL_MS) agentRunCache.delete(runId);
}
function recordAgentRunSnapshot(entry) {
	pruneAgentRunCache(entry.ts);
	agentRunCache.set(entry.runId, entry);
}
function clearPendingAgentRunError(runId) {
	const pending = pendingAgentRunErrors.get(runId);
	if (!pending) return;
	clearTimeout(pending.timer);
	pendingAgentRunErrors.delete(runId);
}
function clearPendingAgentRunTimeout(runId) {
	const pending = pendingAgentRunTimeouts.get(runId);
	if (!pending) return;
	clearTimeout(pending.timer);
	pendingAgentRunTimeouts.delete(runId);
}
function schedulePendingAgentRunError(snapshot) {
	clearPendingAgentRunTimeout(snapshot.runId);
	clearPendingAgentRunError(snapshot.runId);
	const dueAt = Date.now() + AGENT_RUN_ERROR_RETRY_GRACE_MS;
	const timer = setTimeout(() => {
		const pending = pendingAgentRunErrors.get(snapshot.runId);
		if (!pending) return;
		pendingAgentRunErrors.delete(snapshot.runId);
		recordAgentRunSnapshot(pending.snapshot);
	}, AGENT_RUN_ERROR_RETRY_GRACE_MS);
	timer.unref?.();
	pendingAgentRunErrors.set(snapshot.runId, {
		snapshot,
		dueAt,
		timer
	});
}
function schedulePendingAgentRunTimeout(snapshot) {
	clearPendingAgentRunError(snapshot.runId);
	clearPendingAgentRunTimeout(snapshot.runId);
	const dueAt = Date.now() + AGENT_RUN_TIMEOUT_RETRY_GRACE_MS;
	const timer = setTimeout(() => {
		const pending = pendingAgentRunTimeouts.get(snapshot.runId);
		if (!pending) return;
		pendingAgentRunTimeouts.delete(snapshot.runId);
		recordAgentRunSnapshot(pending.snapshot);
	}, AGENT_RUN_TIMEOUT_RETRY_GRACE_MS);
	timer.unref?.();
	pendingAgentRunTimeouts.set(snapshot.runId, {
		snapshot,
		dueAt,
		timer
	});
}
function getPendingAgentRunError(runId) {
	const pending = pendingAgentRunErrors.get(runId);
	if (!pending) return;
	return {
		snapshot: pending.snapshot,
		dueAt: pending.dueAt
	};
}
function getPendingAgentRunTimeout(runId) {
	const pending = pendingAgentRunTimeouts.get(runId);
	if (!pending) return;
	return {
		snapshot: pending.snapshot,
		dueAt: pending.dueAt
	};
}
function createPendingErrorTimeoutSnapshot(snapshot) {
	return {
		runId: snapshot.runId,
		status: "timeout",
		startedAt: snapshot.startedAt,
		error: snapshot.error,
		pendingError: true,
		...snapshot.providerStarted !== void 0 ? { providerStarted: snapshot.providerStarted } : {},
		ts: Date.now()
	};
}
function createSnapshotFromLifecycleEvent(params) {
	const { runId, phase, data } = params;
	const startedAt = typeof data?.startedAt === "number" ? data.startedAt : agentRunStarts.get(runId);
	const endedAt = typeof data?.endedAt === "number" ? data.endedAt : void 0;
	const error = typeof data?.error === "string" ? data.error : void 0;
	const stopReason = typeof data?.stopReason === "string" ? data.stopReason : void 0;
	const livenessState = typeof data?.livenessState === "string" ? data.livenessState : void 0;
	const blocked = isBlockedLivenessState(livenessState);
	const abortedStopReason = isAbortedAgentStopReason(stopReason);
	const status = phase === "error" || blocked || abortedStopReason ? "error" : data?.aborted ? "timeout" : "ok";
	const resolvedError = abortedStopReason && !error ? AGENT_RUN_ABORTED_ERROR : error;
	const timeoutPhase = status === "timeout" ? normalizeAgentRunTimeoutPhase(data?.timeoutPhase) : void 0;
	const providerStarted = asBoolean(data?.providerStarted);
	return {
		runId,
		status,
		startedAt,
		endedAt,
		error: blocked ? formatBlockedLivenessError(resolvedError) : resolvedError,
		stopReason,
		livenessState,
		...data?.yielded === true ? { yielded: true } : {},
		...timeoutPhase ? { timeoutPhase } : {},
		...providerStarted !== void 0 ? { providerStarted } : {},
		ts: Date.now()
	};
}
function ensureAgentRunListener() {
	if (agentRunListenerStarted) return;
	agentRunListenerStarted = true;
	onAgentEvent((evt) => {
		if (!evt) return;
		if (evt.stream !== "lifecycle") return;
		const phase = evt.data?.phase;
		if (phase === "start") {
			const startedAt = typeof evt.data?.startedAt === "number" ? evt.data.startedAt : void 0;
			agentRunStarts.set(evt.runId, startedAt ?? Date.now());
			clearPendingAgentRunError(evt.runId);
			clearPendingAgentRunTimeout(evt.runId);
			agentRunCache.delete(evt.runId);
			return;
		}
		if (phase !== "end" && phase !== "error") return;
		const snapshot = createSnapshotFromLifecycleEvent({
			runId: evt.runId,
			phase,
			data: evt.data
		});
		agentRunStarts.delete(evt.runId);
		if (phase === "error") {
			schedulePendingAgentRunError(snapshot);
			return;
		}
		if (snapshot.status === "timeout") {
			schedulePendingAgentRunTimeout(snapshot);
			return;
		}
		clearPendingAgentRunError(evt.runId);
		clearPendingAgentRunTimeout(evt.runId);
		recordAgentRunSnapshot(snapshot);
	});
}
function getCachedAgentRun(runId) {
	pruneAgentRunCache();
	return agentRunCache.get(runId);
}
function addAgentRunWaiter(runId) {
	agentRunWaiterCounts.set(runId, (agentRunWaiterCounts.get(runId) ?? 0) + 1);
	let removed = false;
	return () => {
		if (removed) return;
		removed = true;
		const nextCount = (agentRunWaiterCounts.get(runId) ?? 1) - 1;
		if (nextCount <= 0) {
			agentRunWaiterCounts.delete(runId);
			return;
		}
		agentRunWaiterCounts.set(runId, nextCount);
	};
}
async function waitForAgentJob(params) {
	const { runId, timeoutMs, signal, ignoreCachedSnapshot = false } = params;
	ensureAgentRunListener();
	const cached = ignoreCachedSnapshot ? void 0 : getCachedAgentRun(runId);
	if (cached) return cached;
	if (timeoutMs <= 0 || signal?.aborted) return null;
	return await new Promise((resolve) => {
		let settled = false;
		let pendingErrorTimer;
		let pendingTimeoutTimer;
		let onAbort;
		let removeWaiter = () => {};
		const clearPendingErrorTimer = () => {
			if (!pendingErrorTimer) return;
			clearTimeout(pendingErrorTimer);
			pendingErrorTimer = void 0;
		};
		const clearPendingTimeoutTimer = () => {
			if (!pendingTimeoutTimer) return;
			clearTimeout(pendingTimeoutTimer);
			pendingTimeoutTimer = void 0;
		};
		const finish = (entry) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			clearPendingErrorTimer();
			clearPendingTimeoutTimer();
			unsubscribe();
			removeWaiter();
			if (onAbort) signal?.removeEventListener("abort", onAbort);
			resolve(entry);
		};
		const scheduleTerminalFinish = (kind, snapshot, delayMs) => {
			clearPendingErrorTimer();
			clearPendingTimeoutTimer();
			const timerRef = setSafeTimeout(() => {
				const latest = ignoreCachedSnapshot ? void 0 : getCachedAgentRun(runId);
				if (latest) {
					finish(latest);
					return;
				}
				recordAgentRunSnapshot(snapshot);
				finish(snapshot);
			}, delayMs);
			timerRef.unref?.();
			if (kind === "error") pendingErrorTimer = timerRef;
			else pendingTimeoutTimer = timerRef;
		};
		const scheduleErrorFinish = (snapshot, delayMs = AGENT_RUN_ERROR_RETRY_GRACE_MS) => {
			scheduleTerminalFinish("error", snapshot, delayMs);
		};
		const scheduleTimeoutFinish = (snapshot, delayMs = AGENT_RUN_TIMEOUT_RETRY_GRACE_MS) => {
			scheduleTerminalFinish("timeout", snapshot, delayMs);
		};
		if (!ignoreCachedSnapshot) {
			const pendingError = getPendingAgentRunError(runId);
			if (pendingError) scheduleErrorFinish(pendingError.snapshot, pendingError.dueAt - Date.now());
			const pendingTimeout = getPendingAgentRunTimeout(runId);
			if (pendingTimeout) scheduleTimeoutFinish(pendingTimeout.snapshot, pendingTimeout.dueAt - Date.now());
		}
		const unsubscribe = onAgentEvent((evt) => {
			if (!evt || evt.stream !== "lifecycle") return;
			if (evt.runId !== runId) return;
			const phase = evt.data?.phase;
			if (phase === "start") {
				clearPendingErrorTimer();
				clearPendingTimeoutTimer();
				return;
			}
			if (phase !== "end" && phase !== "error") return;
			const latest = ignoreCachedSnapshot ? void 0 : getCachedAgentRun(runId);
			if (latest) {
				finish(latest);
				return;
			}
			const snapshot = createSnapshotFromLifecycleEvent({
				runId: evt.runId,
				phase,
				data: evt.data
			});
			if (phase === "error") {
				scheduleErrorFinish(snapshot);
				return;
			}
			if (snapshot.status === "timeout") {
				scheduleTimeoutFinish(snapshot);
				return;
			}
			recordAgentRunSnapshot(snapshot);
			finish(snapshot);
		});
		removeWaiter = addAgentRunWaiter(runId);
		const timer = setSafeTimeout(() => {
			const pendingError = getPendingAgentRunError(runId);
			finish(pendingError ? createPendingErrorTimeoutSnapshot(pendingError.snapshot) : null);
		}, timeoutMs);
		onAbort = () => finish(null);
		signal?.addEventListener("abort", onAbort, { once: true });
	});
}
ensureAgentRunListener();
//#endregion
//#region src/gateway/server-methods/agent.ts
const RESET_COMMAND_RE = /^\/(new|reset)(?:\s+([\s\S]*))?$/i;
function formatAttachmentFailureForLog(err) {
	const primary = formatUncaughtError(err);
	const cause = err instanceof Error ? err.cause : void 0;
	if (cause === void 0) return primary;
	const causeText = formatUncaughtError(cause);
	if (!causeText || causeText === primary) return primary;
	return `${primary}\nCaused by: ${causeText}`;
}
function logAttachmentFailure(logGateway, label, err) {
	logGateway.error(label, {
		error: formatAttachmentFailureForLog(err),
		consoleMessage: `${label}: ${formatForLog(err)}`
	});
}
function clientHasAdminScope(client) {
	return (Array.isArray(client?.connect?.scopes) ? client.connect.scopes : []).includes(ADMIN_SCOPE);
}
function resolveAllowModelOverrideFromClient(client) {
	return clientHasAdminScope(client) || client?.internal?.allowModelOverride === true;
}
function resolveCanResetSessionFromClient(client) {
	return clientHasAdminScope(client);
}
function resolveCanUseInternalRuntimeHandoff(client) {
	return client?.connect?.client?.mode === GATEWAY_CLIENT_MODES.BACKEND;
}
function emitAgentSendSessionLifecycleTransition(transition) {
	if (!transition) return;
	if (transition.previousSessionId) emitGatewaySessionEndPluginHook({
		cfg: transition.cfg,
		sessionKey: transition.sessionKey,
		sessionId: transition.previousSessionId,
		storePath: transition.storePath,
		sessionFile: transition.previousSessionFile,
		agentId: transition.agentId,
		reason: transition.previousEndReason ?? "unknown",
		nextSessionId: transition.sessionId,
		nextSessionKey: transition.sessionKey
	});
	emitGatewaySessionStartPluginHook({
		cfg: transition.cfg,
		sessionKey: transition.sessionKey,
		sessionId: transition.sessionId,
		resumedFrom: transition.previousSessionId,
		storePath: transition.storePath,
		sessionFile: transition.sessionFile,
		agentId: transition.agentId
	});
}
async function runSessionResetFromAgent(params) {
	const result = await performGatewaySessionReset({
		key: params.key,
		reason: params.reason,
		commandSource: "gateway:agent"
	});
	if (!result.ok) return result;
	return {
		ok: true,
		key: result.key,
		sessionId: result.entry.sessionId
	};
}
function resolveSessionRuntimeWorkspace(params) {
	const sessionAgentId = resolveAgentIdFromSessionKey(params.sessionKey);
	const workspaceOverride = resolveIngressWorkspaceOverrideForSpawnedRun({
		spawnedBy: params.spawnedBy,
		workspaceDir: params.sessionEntry?.spawnedWorkspaceDir
	});
	return {
		runtimeWorkspaceDir: workspaceOverride ?? resolveAgentWorkspaceDir(params.cfg, sessionAgentId),
		isCanonicalWorkspace: !workspaceOverride
	};
}
function shouldSkipStartupContextForSpawnedSandbox(params) {
	if (!params.spawnedBy) return false;
	const agentId = resolveAgentIdFromSessionKey(params.sessionKey);
	const sandboxCfg = resolveSandboxConfigForAgent(params.cfg, agentId);
	if (sandboxCfg.mode === "off") return false;
	if (sandboxCfg.mode === "non-main") {
		const mainSessionKey = resolveAgentMainSessionKey({
			cfg: params.cfg,
			agentId
		});
		if (params.sessionKey.trim() === mainSessionKey.trim()) return false;
	}
	return sandboxCfg.workspaceAccess !== "rw";
}
function normalizeTrustedGroupMetadata(value) {
	return {
		groupId: normalizeOptionalString(value?.groupId),
		groupChannel: normalizeOptionalString(value?.groupChannel),
		groupSpace: normalizeOptionalString(value?.groupSpace ?? value?.space)
	};
}
function resolveSessionKeyGroupId(sessionKey) {
	const { baseSessionKey } = parseThreadSessionSuffix(sessionKey);
	const conversation = parseRawSessionConversationRef(baseSessionKey ?? sessionKey);
	if (!conversation || conversation.kind !== "group" && conversation.kind !== "channel") return;
	return conversation.rawId;
}
function resolveTrustedGroupMetadata(params) {
	return {
		groupId: params.stored.groupId ?? params.inherited?.groupId ?? resolveSessionKeyGroupId(params.sessionKey) ?? (params.spawnedBy ? resolveSessionKeyGroupId(params.spawnedBy) : void 0),
		groupChannel: params.stored.groupChannel ?? params.inherited?.groupChannel,
		groupSpace: params.stored.groupSpace ?? params.inherited?.groupSpace
	};
}
function requestGroupMatchesTrusted(params) {
	const requestGroupId = params.requestGroupId?.trim();
	if (!requestGroupId) return true;
	return Boolean(params.trustedGroupId && requestGroupId === params.trustedGroupId);
}
function emitSessionsChanged(context, payload) {
	const connIds = context.getSessionEventSubscriberConnIds();
	if (connIds.size === 0) return;
	const sessionRow = payload.sessionKey ? loadGatewaySessionRow(payload.sessionKey) : null;
	context.broadcastToConnIds("sessions.changed", {
		...payload,
		ts: Date.now(),
		...sessionRow ? {
			updatedAt: sessionRow.updatedAt ?? void 0,
			sessionId: sessionRow.sessionId,
			kind: sessionRow.kind,
			channel: sessionRow.channel,
			subject: sessionRow.subject,
			groupChannel: sessionRow.groupChannel,
			space: sessionRow.space,
			chatType: sessionRow.chatType,
			origin: sessionRow.origin,
			spawnedBy: sessionRow.spawnedBy,
			spawnedWorkspaceDir: sessionRow.spawnedWorkspaceDir,
			forkedFromParent: sessionRow.forkedFromParent,
			spawnDepth: sessionRow.spawnDepth,
			subagentRole: sessionRow.subagentRole,
			subagentControlScope: sessionRow.subagentControlScope,
			label: sessionRow.label,
			displayName: sessionRow.displayName,
			deliveryContext: sessionRow.deliveryContext,
			parentSessionKey: sessionRow.parentSessionKey,
			childSessions: sessionRow.childSessions,
			thinkingLevel: sessionRow.thinkingLevel,
			fastMode: sessionRow.fastMode,
			verboseLevel: sessionRow.verboseLevel,
			traceLevel: sessionRow.traceLevel,
			reasoningLevel: sessionRow.reasoningLevel,
			elevatedLevel: sessionRow.elevatedLevel,
			sendPolicy: sessionRow.sendPolicy,
			systemSent: sessionRow.systemSent,
			abortedLastRun: sessionRow.abortedLastRun,
			inputTokens: sessionRow.inputTokens,
			outputTokens: sessionRow.outputTokens,
			lastChannel: sessionRow.lastChannel,
			lastTo: sessionRow.lastTo,
			lastAccountId: sessionRow.lastAccountId,
			lastThreadId: sessionRow.lastThreadId,
			totalTokens: sessionRow.totalTokens,
			totalTokensFresh: sessionRow.totalTokensFresh,
			contextTokens: sessionRow.contextTokens,
			estimatedCostUsd: sessionRow.estimatedCostUsd,
			responseUsage: sessionRow.responseUsage,
			modelProvider: sessionRow.modelProvider,
			model: sessionRow.model,
			status: sessionRow.status,
			startedAt: sessionRow.startedAt,
			endedAt: sessionRow.endedAt,
			runtimeMs: sessionRow.runtimeMs,
			compactionCheckpointCount: sessionRow.compactionCheckpointCount,
			latestCompactionCheckpoint: sessionRow.latestCompactionCheckpoint
		} : {}
	}, connIds, { dropIfSlow: true });
}
function resolveFailedTrackedAgentTaskStatus(error) {
	return isAbortError(error) || isTimeoutError(error) ? "timed_out" : "failed";
}
function tryFinalizeTrackedAgentTask(params) {
	try {
		finalizeTaskRunByRunId({
			runId: params.runId,
			runtime: "cli",
			status: params.status,
			endedAt: Date.now(),
			...params.error !== void 0 ? { error: params.error } : {},
			...params.terminalSummary !== void 0 ? { terminalSummary: params.terminalSummary } : {}
		});
	} catch {}
}
function resolveAgentDedupeKeys(params) {
	const keys = [`agent:${params.idempotencyKey}`];
	const approvalId = params.execApprovalFollowupApprovalId?.trim();
	if (approvalId) keys.push(`agent:exec-approval-followup:${approvalId}`);
	return uniqueStrings(keys);
}
function readGatewayDedupeEntry(params) {
	for (const key of params.keys) {
		const entry = params.dedupe.get(key);
		if (entry) return entry;
	}
}
function isAcceptedAgentDedupePayload(payload) {
	return typeof payload === "object" && payload !== null && payload.status === "accepted";
}
function isPreRegistrationAbortedAgentDedupePayload(payload) {
	const stopReason = payload?.stopReason;
	return typeof payload === "object" && payload !== null && payload.status === "timeout" && (stopReason === "rpc" || stopReason === "stop");
}
function isPreRegistrationAbortedAgentDedupeEntryForSession(params) {
	if (!params.entry?.ok || !isPreRegistrationAbortedAgentDedupePayload(params.entry.payload)) return false;
	const payload = params.entry.payload;
	const payloadRunId = typeof payload.runId === "string" ? payload.runId.trim() : "";
	if (payloadRunId && payloadRunId !== params.runId) return false;
	const payloadSessionKey = typeof payload.sessionKey === "string" && payload.sessionKey.trim() ? payload.sessionKey.trim() : void 0;
	const expectedSessionKeys = new Set([params.sessionKey, ...params.alternateSessionKeys ?? []].filter((value) => Boolean(value?.trim())));
	return !payloadSessionKey || expectedSessionKeys.size === 0 || expectedSessionKeys.has(payloadSessionKey);
}
function setGatewayDedupeEntries(params) {
	for (const key of params.keys) setGatewayDedupeEntry({
		dedupe: params.dedupe,
		key,
		entry: params.entry
	});
}
function setAbortedAgentDedupeEntries(params) {
	setGatewayDedupeEntries({
		dedupe: params.dedupe,
		keys: params.keys,
		entry: {
			ts: Date.now(),
			ok: true,
			payload: {
				runId: params.runId,
				status: "timeout",
				summary: "aborted",
				stopReason: params.stopReason,
				timeoutPhase: "queue",
				providerStarted: false
			}
		}
	});
}
function readAgentRunTimeoutAttribution(meta) {
	const record = meta && typeof meta === "object" && !Array.isArray(meta) ? meta : void 0;
	return {
		timeoutPhase: normalizeAgentRunTimeoutPhase(record?.timeoutPhase),
		providerStarted: asBoolean(record?.providerStarted)
	};
}
function isGatewayAbortSignalReason(reason) {
	return reason === void 0 || isAbortError(reason) || readErrorName(reason) === "TimeoutError";
}
function isGatewayAgentAbortRejection(error, signal) {
	if (!signal.aborted) return false;
	if (readErrorName(signal.reason) === "TimeoutError") return true;
	if (!isGatewayAbortSignalReason(signal.reason)) return false;
	return isAbortError(error) || readErrorName(error) === "TimeoutError";
}
function resolveGatewayAgentAbortStopReason(signal) {
	return readErrorName(signal.reason) === "TimeoutError" ? "timeout" : "rpc";
}
function resolveAbortedAgentStopReason(entry) {
	return entry?.abortStopReason?.trim() || "rpc";
}
function deleteGatewayDedupeEntries(params) {
	for (const key of params.keys) params.dedupe.delete(key);
}
function dispatchAgentRunFromGateway(params) {
	const inputProvenance = normalizeInputProvenance(params.ingressOpts.inputProvenance);
	const shouldTrackTask = params.ingressOpts.sessionKey?.trim() && inputProvenance?.kind !== "inter_session";
	if (shouldTrackTask) try {
		createRunningTaskRun({
			runtime: "cli",
			sourceId: params.runId,
			ownerKey: params.ingressOpts.sessionKey,
			scopeKind: "session",
			requesterOrigin: normalizeDeliveryContext({
				channel: params.ingressOpts.channel,
				to: params.ingressOpts.to,
				accountId: params.ingressOpts.accountId,
				threadId: params.ingressOpts.threadId
			}),
			childSessionKey: params.ingressOpts.sessionKey,
			runId: params.runId,
			task: params.ingressOpts.message,
			deliveryStatus: "not_applicable",
			startedAt: Date.now()
		});
	} catch {}
	agentCommandFromIngress(params.ingressOpts, defaultRuntime, params.context.deps).then((result) => {
		const aborted = result?.meta?.aborted === true;
		const timeoutAttribution = readAgentRunTimeoutAttribution(result?.meta);
		if (shouldTrackTask) tryFinalizeTrackedAgentTask({
			runId: params.runId,
			status: aborted ? "timed_out" : "succeeded",
			terminalSummary: aborted ? "aborted" : "completed"
		});
		const payload = {
			runId: params.runId,
			status: aborted ? "timeout" : "ok",
			summary: aborted ? "aborted" : "completed",
			...aborted ? { stopReason: result?.meta?.stopReason ?? "rpc" } : {},
			...aborted && timeoutAttribution.timeoutPhase ? { timeoutPhase: timeoutAttribution.timeoutPhase } : {},
			...aborted && timeoutAttribution.providerStarted !== void 0 ? { providerStarted: timeoutAttribution.providerStarted } : {},
			result
		};
		setGatewayDedupeEntries({
			dedupe: params.context.dedupe,
			keys: params.dedupeKeys,
			entry: {
				ts: Date.now(),
				ok: true,
				payload
			}
		});
		params.respond(true, payload, void 0, { runId: params.runId });
	}).catch((err) => {
		const aborted = isGatewayAgentAbortRejection(err, params.abortController.signal);
		const renderedErr = formatForLog(err);
		if (shouldTrackTask) tryFinalizeTrackedAgentTask({
			runId: params.runId,
			status: aborted ? "timed_out" : resolveFailedTrackedAgentTaskStatus(err),
			error: renderedErr,
			terminalSummary: renderedErr
		});
		const error = errorShape(ErrorCodes.UNAVAILABLE, renderedErr);
		const stopReason = resolveGatewayAgentAbortStopReason(params.abortController.signal);
		const payload = {
			runId: params.runId,
			status: aborted ? "timeout" : "error",
			summary: aborted ? "aborted" : renderedErr,
			...aborted ? {
				stopReason,
				timeoutPhase: "gateway_draining"
			} : {}
		};
		setGatewayDedupeEntries({
			dedupe: params.context.dedupe,
			keys: params.dedupeKeys,
			entry: {
				ts: Date.now(),
				ok: aborted,
				payload,
				...aborted ? {} : { error }
			}
		});
		params.respond(aborted, payload, aborted ? void 0 : error, {
			runId: params.runId,
			...aborted ? {} : { error: formatForLog(err) }
		});
	}).finally(() => {
		if (params.context.chatAbortControllers.get(params.runId)?.controller === params.abortController) params.context.chatAbortControllers.delete(params.runId);
	});
}
function shouldSuppressAgentPromptPersistence(params) {
	if (params.inputProvenance?.kind !== "inter_session" || params.inputProvenance.sourceTool !== "subagent_announce") return false;
	return params.internalEvents?.some((event) => event.type === "task_completion" && event.source === "subagent") === true;
}
function yieldAfterAgentAcceptedAck() {
	return new Promise((resolve) => {
		setTimeout(resolve, 10);
	});
}
const agentHandlers = {
	agent: async ({ params, respond, context, client, isWebchatConnect }) => {
		const p = params;
		if (!validateAgentParams(p)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent params: ${formatValidationErrors(validateAgentParams.errors)}`));
			return;
		}
		const request = p;
		const allowModelOverride = resolveAllowModelOverrideFromClient(client);
		const canResetSession = resolveCanResetSessionFromClient(client);
		const canUseInternalRuntimeHandoff = resolveCanUseInternalRuntimeHandoff(client);
		const requestedModelOverride = Boolean(request.provider || request.model);
		const requestedInternalSessionEffects = request.sessionEffects === "internal";
		const requestedPromptPersistenceSuppression = request.suppressPromptPersistence === true;
		const isRawModelRun = request.modelRun === true || request.promptMode === "none";
		if (requestedModelOverride && !allowModelOverride) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "provider/model overrides are not authorized for this caller."));
			return;
		}
		if ((requestedInternalSessionEffects || requestedPromptPersistenceSuppression) && !canUseInternalRuntimeHandoff) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "internal session-effect controls are reserved for backend callers."));
			return;
		}
		const providerOverride = allowModelOverride ? request.provider : void 0;
		const modelOverride = allowModelOverride ? request.model : void 0;
		const cfg = context.getRuntimeConfig();
		const idem = request.idempotencyKey;
		const runId = idem;
		const execApprovalFollowupApprovalId = parseExecApprovalFollowupApprovalId(idem);
		if (execApprovalFollowupApprovalId && !canUseInternalRuntimeHandoff) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "exec approval followup idempotency keys are reserved for backend callers."));
			return;
		}
		const normalizedSpawned = normalizeSpawnedRunMetadata({
			groupId: request.groupId,
			groupChannel: request.groupChannel,
			groupSpace: request.groupSpace
		});
		let resolvedGroupId = normalizedSpawned.groupId;
		let resolvedGroupChannel = normalizedSpawned.groupChannel;
		let resolvedGroupSpace = normalizedSpawned.groupSpace;
		let spawnedByValue;
		const inputProvenance = normalizeInputProvenance(request.inputProvenance);
		const preserveUserFacingSessionModelState = canUseInternalRuntimeHandoff && shouldPreserveUserFacingSessionStateForInputProvenance(inputProvenance);
		const sessionEffects = requestedInternalSessionEffects ? "internal" : request.sessionEffects;
		const suppressVisibleSessionEffects = sessionEffects === "internal";
		const agentDedupeKeys = resolveAgentDedupeKeys({
			idempotencyKey: idem,
			execApprovalFollowupApprovalId
		});
		const cached = readGatewayDedupeEntry({
			dedupe: context.dedupe,
			keys: agentDedupeKeys
		});
		if (cached) {
			if (cached.ok && isAcceptedAgentDedupePayload(cached.payload)) {
				const cachedRunId = typeof cached.payload.runId === "string" && cached.payload.runId.trim() ? cached.payload.runId.trim() : runId;
				const cachedSessionKey = typeof cached.payload.sessionKey === "string" && cached.payload.sessionKey.trim() ? cached.payload.sessionKey.trim() : void 0;
				respond(true, {
					runId: cachedRunId,
					status: "in_flight",
					...cachedSessionKey ? { sessionKey: cachedSessionKey } : {}
				}, void 0, {
					cached: true,
					runId: cachedRunId
				});
				return;
			}
			respond(cached.ok, cached.payload, cached.error, { cached: true });
			return;
		}
		let agentDedupeReserved = false;
		let agentRunAccepted = false;
		const ownerConnId = typeof client?.connId === "string" ? client.connId : void 0;
		const ownerDeviceId = typeof client?.connect?.device?.id === "string" ? client.connect.device.id : void 0;
		const reservePreAcceptedAgentDedupe = (sessionKey) => {
			if (agentDedupeReserved || !sessionKey) return;
			const acceptedAt = Date.now();
			const pendingTimeoutMs = resolveAgentTimeoutMs({
				cfg,
				overrideSeconds: typeof request.timeout === "number" ? request.timeout : void 0
			});
			setGatewayDedupeEntries({
				dedupe: context.dedupe,
				keys: agentDedupeKeys,
				entry: {
					ts: acceptedAt,
					ok: true,
					payload: {
						runId,
						status: "accepted",
						sessionKey,
						acceptedAt,
						dedupeKeys: agentDedupeKeys,
						expiresAtMs: resolveAgentRunExpiresAtMs({
							now: acceptedAt,
							timeoutMs: pendingTimeoutMs
						}),
						ownerConnId,
						ownerDeviceId
					}
				}
			});
			agentDedupeReserved = true;
		};
		const clearUnacceptedExecApprovalFollowupDedupe = () => {
			if (!agentDedupeReserved || agentRunAccepted) return;
			if (isPreRegistrationAbortedAgentDedupeEntryForSession({
				entry: readGatewayDedupeEntry({
					dedupe: context.dedupe,
					keys: agentDedupeKeys
				}),
				runId
			})) return;
			deleteGatewayDedupeEntries({
				dedupe: context.dedupe,
				keys: agentDedupeKeys
			});
			agentDedupeReserved = false;
		};
		const normalizedAttachments = normalizeRpcAttachmentsToChatAttachments(request.attachments);
		const requestedBestEffortDeliver = typeof request.bestEffortDeliver === "boolean" ? request.bestEffortDeliver : void 0;
		const knownAgents = listAgentIds(cfg);
		const agentIdRaw = normalizeOptionalString(request.agentId) ?? "";
		let agentId = agentIdRaw ? normalizeAgentId(agentIdRaw) : void 0;
		if (agentId && !knownAgents.includes(agentId)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent params: unknown agent id "${request.agentId}"`));
			return;
		}
		const requestedSessionKeyRaw = normalizeOptionalString(request.sessionKey);
		if (requestedSessionKeyRaw && classifySessionKeyShape(requestedSessionKeyRaw) === "malformed_agent") {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent params: malformed session key "${requestedSessionKeyRaw}"`));
			return;
		}
		const requestedSessionId = normalizeOptionalString(request.sessionId);
		let requestedSessionKey = requestedSessionKeyRaw ?? (!requestedSessionId ? resolveExplicitAgentSessionKey({
			cfg,
			agentId
		}) : void 0);
		if (agentId && requestedSessionKeyRaw) {
			const sessionAgentId = resolveAgentIdFromSessionKey(requestedSessionKeyRaw);
			if (sessionAgentId !== agentId) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent params: agent "${request.agentId}" does not match session key agent "${sessionAgentId}"`));
				return;
			}
		}
		const preAcceptedReservedSessionKey = requestedSessionKey;
		reservePreAcceptedAgentDedupe(preAcceptedReservedSessionKey);
		try {
			let message = (request.message ?? "").trim();
			if (!isRawModelRun) message = annotateInterSessionPromptText(message, inputProvenance);
			let images = [];
			let imageOrder = [];
			if (normalizedAttachments.length > 0) {
				let baseProvider;
				let baseModel;
				if (requestedSessionKeyRaw) {
					const { cfg: sessCfg, entry: sessEntry } = loadSessionEntry(requestedSessionKeyRaw, { clone: false });
					const modelRef = resolveSessionModelRef(sessCfg, sessEntry, resolveAgentIdFromSessionKey(requestedSessionKeyRaw));
					baseProvider = modelRef.provider;
					baseModel = modelRef.model;
				}
				const effectiveProvider = providerOverride || baseProvider;
				const effectiveModel = modelOverride || baseModel;
				const supportsInlineImages = await resolveGatewayModelSupportsImages({
					loadGatewayModelCatalog: context.loadGatewayModelCatalog,
					provider: effectiveProvider,
					model: effectiveModel
				});
				try {
					const parsed = await parseMessageWithAttachments(message, normalizedAttachments, {
						maxBytes: resolveChatAttachmentMaxBytes(cfg),
						log: context.logGateway,
						supportsInlineImages,
						acceptNonImage: false
					});
					message = parsed.message.trim();
					images = parsed.images;
					imageOrder = parsed.imageOrder;
				} catch (err) {
					logAttachmentFailure(context.logGateway, "agent attachment parse failed", err);
					respond(false, void 0, errorShape(err instanceof MediaOffloadError ? ErrorCodes.UNAVAILABLE : ErrorCodes.INVALID_REQUEST, String(err)));
					return;
				}
			}
			const isKnownGatewayChannel = (value) => isGatewayMessageChannel(value) || isInternalNonDeliveryChannel(value);
			const channelHints = normalizeStringEntries([request.channel, request.replyChannel].filter((value) => typeof value === "string"));
			for (const rawChannel of channelHints) {
				const normalized = normalizeMessageChannel(rawChannel);
				if (normalized && normalized !== "last" && !isKnownGatewayChannel(normalized)) {
					respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent params: unknown channel: ${normalized}`));
					return;
				}
			}
			const voiceWakeTrigger = normalizeOptionalString(request.voiceWakeTrigger) ?? "";
			const replyTo = normalizeOptionalString(request.replyTo) ?? "";
			const to = normalizeOptionalString(request.to) ?? "";
			const explicitVoiceWakeSessionTarget = !agentId && requestedSessionKeyRaw ? (() => {
				const { cfg: sessionCfg, canonicalKey } = loadSessionEntry(requestedSessionKeyRaw, { clone: false });
				const routedAgentId = resolveAgentIdFromSessionKey(canonicalKey);
				if (routedAgentId !== normalizeAgentId(resolveDefaultAgentId(sessionCfg))) return true;
				return canonicalKey !== resolveAgentMainSessionKey({
					cfg: sessionCfg,
					agentId: routedAgentId
				});
			})() : false;
			const canAutoRouteVoiceWake = !agentId && !explicitVoiceWakeSessionTarget && !requestedSessionId && !replyTo && !to;
			if (Object.prototype.hasOwnProperty.call(request, "voiceWakeTrigger") && canAutoRouteVoiceWake) try {
				const routingConfig = await loadVoiceWakeRoutingConfig();
				const route = resolveVoiceWakeRouteByTrigger({
					trigger: voiceWakeTrigger || void 0,
					config: routingConfig
				});
				if ("agentId" in route) if (knownAgents.includes(route.agentId)) {
					agentId = route.agentId;
					requestedSessionKey = resolveExplicitAgentSessionKey({
						cfg,
						agentId
					});
				} else context.logGateway.warn(`voicewake routing ignored unknown agentId="${route.agentId}" trigger="${voiceWakeTrigger}"`);
				else if ("sessionKey" in route) if (classifySessionKeyShape(route.sessionKey) !== "malformed_agent") {
					const canonicalRouteSession = loadSessionEntry(route.sessionKey, { clone: false }).canonicalKey;
					const routedAgentId = resolveAgentIdFromSessionKey(canonicalRouteSession);
					if (knownAgents.includes(routedAgentId)) {
						requestedSessionKey = canonicalRouteSession;
						agentId = routedAgentId;
					} else context.logGateway.warn(`voicewake routing ignored unknown session agent="${routedAgentId}" sessionKey="${canonicalRouteSession}" trigger="${voiceWakeTrigger}"`);
				} else context.logGateway.warn(`voicewake routing ignored malformed sessionKey="${route.sessionKey}" trigger="${voiceWakeTrigger}"`);
			} catch (err) {
				context.logGateway.warn(`voicewake routing load failed: ${formatForLog(err)}`);
			}
			let resolvedSessionId = requestedSessionId;
			let sessionEntry;
			let bestEffortDeliver = requestedBestEffortDeliver ?? false;
			let cfgForAgent;
			let resolvedSessionKey = requestedSessionKey;
			let isNewSession = false;
			let skipTimestampInjection = false;
			let shouldPrependStartupContext = false;
			let skipAgentInitialSessionTouch = false;
			const resetCommandMatch = message.match(RESET_COMMAND_RE);
			if (resetCommandMatch && requestedSessionKey) {
				if (!canResetSession) {
					respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `missing scope: ${ADMIN_SCOPE}`));
					return;
				}
				const resetReason = normalizeOptionalLowercaseString(resetCommandMatch[1]) === "new" ? "new" : "reset";
				const resetResult = await runSessionResetFromAgent({
					key: requestedSessionKey,
					reason: resetReason
				});
				if (!resetResult.ok) {
					respond(false, void 0, resetResult.error);
					return;
				}
				requestedSessionKey = resetResult.key;
				resolvedSessionId = resetResult.sessionId ?? resolvedSessionId;
				const postResetMessage = normalizeOptionalString(resetCommandMatch[2]) ?? "";
				if (postResetMessage) message = postResetMessage;
				else {
					const resetLoadedSession = loadSessionEntry(requestedSessionKey, { clone: false });
					const resetCfg = resetLoadedSession?.cfg ?? cfg;
					const resetSessionEntry = resetLoadedSession?.entry;
					const resetSpawnedBy = canonicalizeSpawnedByForAgent(resetCfg, resolveAgentIdFromSessionKey(requestedSessionKey), resetSessionEntry?.spawnedBy);
					const { runtimeWorkspaceDir, isCanonicalWorkspace } = resolveSessionRuntimeWorkspace({
						cfg: resetCfg,
						sessionKey: requestedSessionKey,
						sessionEntry: resetSessionEntry,
						spawnedBy: resetSpawnedBy
					});
					const resetSessionAgentId = resolveAgentIdFromSessionKey(requestedSessionKey);
					const resetBaseModelRef = resolveSessionModelRef(resetCfg, resetSessionEntry, resetSessionAgentId);
					const resetEffectiveModelRef = {
						provider: providerOverride || resetBaseModelRef.provider,
						model: modelOverride || resetBaseModelRef.model
					};
					const bareResetPromptState = await resolveBareSessionResetPromptState({
						cfg: resetCfg,
						workspaceDir: runtimeWorkspaceDir,
						isPrimaryRun: !isSubagentSessionKey(requestedSessionKey) && !isAcpSessionKey(requestedSessionKey),
						isCanonicalWorkspace,
						hasBootstrapFileAccess: resolveBareResetBootstrapFileAccess({
							cfg: resetCfg,
							agentId: resetSessionAgentId,
							sessionKey: requestedSessionKey,
							workspaceDir: runtimeWorkspaceDir,
							modelProvider: resetEffectiveModelRef.provider,
							modelId: resetEffectiveModelRef.model
						})
					});
					message = bareResetPromptState.prompt;
					skipTimestampInjection = true;
					shouldPrependStartupContext = bareResetPromptState.shouldPrependStartupContext && shouldApplyStartupContext({
						cfg,
						action: resetReason
					});
				}
			}
			if (!skipTimestampInjection && !isRawModelRun && inputProvenance?.kind !== "inter_session") message = injectTimestamp(message, timestampOptsFromConfig(cfg));
			if (requestedSessionKey) {
				const { cfg, storePath, entry, canonicalKey } = loadSessionEntry(requestedSessionKey, { clone: false });
				cfgForAgent = cfg;
				const now = Date.now();
				const resetPolicy = resolveSessionResetPolicy({
					sessionCfg: cfg.session,
					resetType: resolveSessionResetType({ sessionKey: canonicalKey }),
					resetOverride: resolveChannelResetConfig({
						sessionCfg: cfg.session,
						channel: entry?.lastChannel ?? entry?.channel ?? request.channel
					})
				});
				const lifecycleTimestamps = entry ? resolveSessionLifecycleTimestamps({
					entry,
					storePath,
					agentId: resolveAgentIdFromSessionKey(canonicalKey)
				}) : void 0;
				const freshness = entry ? evaluateSessionFreshness({
					updatedAt: entry.updatedAt,
					...lifecycleTimestamps,
					now,
					policy: resetPolicy
				}) : void 0;
				let failedSessionTranscriptMissing = false;
				if (entry?.status === "failed" && entry.sessionId?.trim()) try {
					const sessionPathOpts = resolveSessionFilePathOptions({
						storePath,
						agentId: resolveAgentIdFromSessionKey(canonicalKey)
					});
					failedSessionTranscriptMissing = !existsSync(resolveSessionFilePath(entry.sessionId, entry, sessionPathOpts));
				} catch {
					failedSessionTranscriptMissing = true;
				}
				const canReuseSession = Boolean(entry?.sessionId) && (freshness?.fresh ?? false) && !failedSessionTranscriptMissing;
				const usableRequestedSessionId = requestedSessionId && (!entry?.sessionId || canReuseSession) ? requestedSessionId : void 0;
				const sessionId = usableRequestedSessionId ? usableRequestedSessionId : (canReuseSession ? entry?.sessionId : void 0) ?? randomUUID();
				isNewSession = !entry || !canReuseSession && !usableRequestedSessionId || Boolean(usableRequestedSessionId && entry?.sessionId !== usableRequestedSessionId);
				const rotatedSessionId = Boolean(entry?.sessionId && entry.sessionId !== sessionId);
				const touchInteraction = request.bootstrapContextRunKind !== "cron" && request.bootstrapContextRunKind !== "heartbeat" && !request.internalEvents?.length;
				const sessionAgent = resolveAgentIdFromSessionKey(canonicalKey);
				const requestDeliveryHint = normalizeDeliveryContext({
					channel: request.channel?.trim(),
					to: request.to?.trim(),
					accountId: request.accountId?.trim(),
					threadId: request.threadId
				});
				const buildSessionPatch = (freshEntry) => {
					const freshSpawnedBy = canonicalizeSpawnedByForAgent(cfg, sessionAgent, freshEntry?.spawnedBy);
					const storedGroup = normalizeTrustedGroupMetadata(freshEntry);
					let inheritedGroup;
					if (freshSpawnedBy && (!storedGroup.groupId || !storedGroup.groupChannel || !storedGroup.groupSpace)) try {
						const parentEntry = loadSessionEntry(freshSpawnedBy)?.entry;
						inheritedGroup = normalizeTrustedGroupMetadata({
							groupId: parentEntry?.groupId,
							groupChannel: parentEntry?.groupChannel,
							groupSpace: parentEntry?.space
						});
					} catch {
						inheritedGroup = void 0;
					}
					const trustedGroup = resolveTrustedGroupMetadata({
						sessionKey: canonicalKey,
						spawnedBy: freshSpawnedBy,
						stored: storedGroup,
						inherited: inheritedGroup
					});
					const nextGroup = (trustedGroup.groupId ? resolveTrustedGroupId({
						groupId: trustedGroup.groupId,
						sessionKey: canonicalKey,
						spawnedBy: freshSpawnedBy
					}) : void 0)?.dropped === true ? {
						groupId: void 0,
						groupChannel: void 0,
						groupSpace: void 0
					} : (() => {
						const trustRequestSelectors = Boolean(trustedGroup.groupId) && requestGroupMatchesTrusted({
							requestGroupId: normalizedSpawned.groupId,
							trustedGroupId: trustedGroup.groupId
						});
						return {
							groupId: trustedGroup.groupId,
							groupChannel: trustedGroup.groupChannel ?? (trustRequestSelectors ? normalizedSpawned.groupChannel : void 0),
							groupSpace: trustedGroup.groupSpace ?? (trustRequestSelectors ? normalizedSpawned.groupSpace : void 0)
						};
					})();
					const deliveryFields = normalizeSessionDeliveryFields(freshEntry);
					const effectiveDelivery = mergeDeliveryContext(deliveryFields.deliveryContext, requestDeliveryHint);
					const effectiveDeliveryFields = normalizeSessionDeliveryFields({
						route: deliveryFields.route,
						deliveryContext: effectiveDelivery
					});
					const labelValue = normalizeOptionalString(request.label) || freshEntry?.label;
					const channelValue = freshEntry?.channel ?? request.channel?.trim();
					const pluginOwnerId = freshEntry === void 0 ? normalizeOptionalString(client?.internal?.pluginRuntimeOwnerId) : void 0;
					const freshSessionRotatedSinceLoad = Boolean(entry?.sessionId && freshEntry?.sessionId && freshEntry.sessionId !== entry.sessionId);
					const patchSessionId = freshSessionRotatedSinceLoad ? freshEntry?.sessionId : sessionId;
					const shouldClearRotatedState = rotatedSessionId && !freshSessionRotatedSinceLoad;
					return {
						patch: {
							sessionId: patchSessionId,
							updatedAt: now,
							...isNewSession && !freshSessionRotatedSinceLoad ? { sessionStartedAt: now } : {},
							...touchInteraction ? { lastInteractionAt: now } : {},
							...effectiveDeliveryFields.route ? { route: effectiveDeliveryFields.route } : {},
							...effectiveDeliveryFields.deliveryContext ? { deliveryContext: effectiveDeliveryFields.deliveryContext } : {},
							...effectiveDeliveryFields.lastChannel ? { lastChannel: effectiveDeliveryFields.lastChannel } : {},
							...effectiveDeliveryFields.lastTo ? { lastTo: effectiveDeliveryFields.lastTo } : {},
							...effectiveDeliveryFields.lastAccountId ? { lastAccountId: effectiveDeliveryFields.lastAccountId } : {},
							...effectiveDeliveryFields.lastThreadId != null ? { lastThreadId: effectiveDeliveryFields.lastThreadId } : {},
							...labelValue ? { label: labelValue } : {},
							...freshSpawnedBy ? { spawnedBy: freshSpawnedBy } : {},
							...channelValue ? { channel: channelValue } : {},
							groupId: nextGroup.groupId,
							groupChannel: nextGroup.groupChannel,
							space: nextGroup.groupSpace,
							...pluginOwnerId ? { pluginOwnerId } : {},
							...shouldClearRotatedState ? {
								status: void 0,
								startedAt: void 0,
								endedAt: void 0,
								runtimeMs: void 0,
								abortedLastRun: void 0,
								sessionFile: void 0
							} : {}
						},
						spawnedBy: freshSpawnedBy,
						groupId: nextGroup.groupId,
						groupChannel: nextGroup.groupChannel,
						groupSpace: nextGroup.groupSpace,
						freshSessionRotatedSinceLoad
					};
				};
				let patchBuild = buildSessionPatch(entry);
				sessionEntry = mergeSessionEntry(entry, patchBuild.patch);
				resolvedSessionId = sessionEntry?.sessionId ?? sessionId;
				const canonicalSessionKey = canonicalKey;
				resolvedSessionKey = canonicalSessionKey;
				const agentId = resolveAgentIdFromSessionKey(canonicalSessionKey);
				const mainSessionKey = resolveAgentMainSessionKey({
					cfg,
					agentId
				});
				const recoveredSessionStartedAt = !isNewSession && entry !== void 0 && entry.sessionStartedAt === void 0 ? resolveSessionLifecycleTimestamps({
					entry,
					storePath,
					agentId
				}).sessionStartedAt : void 0;
				if (storePath && !suppressVisibleSessionEffects) {
					const requestedStoreKey = requestedSessionKey;
					let deniedBySendPolicy = false;
					const persisted = await updateSessionStore(storePath, (store) => {
						const { primaryKey } = migrateAndPruneGatewaySessionStoreKey({
							cfg,
							key: requestedStoreKey,
							store
						});
						const freshEntry = store[primaryKey];
						patchBuild = buildSessionPatch(freshEntry);
						const merged = mergeSessionEntry(freshEntry, recoveredSessionStartedAt !== void 0 && freshEntry?.sessionStartedAt === void 0 && freshEntry?.sessionId === entry?.sessionId ? {
							...patchBuild.patch,
							sessionStartedAt: recoveredSessionStartedAt
						} : patchBuild.patch);
						if ((request.deliver === true ? resolveSendPolicy({
							cfg,
							entry: merged,
							sessionKey: canonicalKey,
							channel: merged?.channel,
							chatType: merged?.chatType
						}) : "allow") === "deny") {
							deniedBySendPolicy = true;
							return merged;
						}
						store[primaryKey] = merged;
						return merged;
					}, { takeCacheOwnership: true });
					if (persisted) {
						sessionEntry = persisted;
						resolvedSessionId = sessionEntry.sessionId;
					}
					skipAgentInitialSessionTouch = touchInteraction;
					if (deniedBySendPolicy) {
						respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "send blocked by session policy"));
						return;
					}
				}
				spawnedByValue = patchBuild.spawnedBy;
				resolvedGroupId = patchBuild.groupId;
				resolvedGroupChannel = patchBuild.groupChannel;
				resolvedGroupSpace = patchBuild.groupSpace;
				if (!suppressVisibleSessionEffects && isNewSession && resolvedSessionId && storePath && !patchBuild.freshSessionRotatedSinceLoad) {
					const previousSessionId = rotatedSessionId ? entry?.sessionId : void 0;
					emitAgentSendSessionLifecycleTransition({
						cfg,
						sessionKey: canonicalSessionKey,
						sessionId: resolvedSessionId,
						storePath,
						sessionFile: sessionEntry?.sessionFile,
						agentId,
						previousSessionId,
						previousSessionFile: previousSessionId ? entry?.sessionFile : void 0,
						previousEndReason: previousSessionId ? freshness?.staleReason ?? (usableRequestedSessionId && entry?.sessionId !== usableRequestedSessionId ? "new" : "unknown") : void 0
					});
				}
				if (request.deliver === true) {
					if (resolveSendPolicy({
						cfg,
						entry: sessionEntry,
						sessionKey: canonicalKey,
						channel: sessionEntry?.channel,
						chatType: sessionEntry?.chatType
					}) === "deny") {
						respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "send blocked by session policy"));
						return;
					}
				}
				if (!suppressVisibleSessionEffects && (canonicalSessionKey === mainSessionKey || canonicalSessionKey === "global")) {
					context.addChatRun(idem, {
						sessionKey: canonicalSessionKey,
						clientRunId: idem
					});
					if (requestedBestEffortDeliver === void 0) bestEffortDeliver = true;
				}
				registerAgentRunContext(idem, suppressVisibleSessionEffects ? { isControlUiVisible: false } : { sessionKey: canonicalSessionKey });
			}
			const connId = typeof client?.connId === "string" ? client.connId : void 0;
			const wantsToolEvents = hasGatewayClientCap(client?.connect?.caps, GATEWAY_CLIENT_CAPS.TOOL_EVENTS);
			if (connId && wantsToolEvents) {
				context.registerToolEventRecipient(runId, connId);
				for (const [activeRunId, active] of context.chatAbortControllers) if (activeRunId !== runId && active.sessionKey === requestedSessionKey) context.registerToolEventRecipient(activeRunId, connId);
			}
			const wantsDelivery = request.deliver === true;
			const explicitTo = normalizeOptionalString(request.replyTo) ?? normalizeOptionalString(request.to);
			const explicitThreadId = normalizeOptionalString(request.threadId);
			const turnSourceChannel = normalizeOptionalString(request.channel);
			const turnSourceTo = normalizeOptionalString(request.to);
			const turnSourceAccountId = normalizeOptionalString(request.accountId);
			const deliveryPlan = await resolveAgentDeliveryPlanWithSessionRoute({
				cfg: cfgForAgent ?? cfg,
				agentId: resolvedSessionKey ? resolveAgentIdFromSessionKey(resolvedSessionKey) : agentId ?? resolveDefaultAgentId(cfgForAgent ?? cfg),
				currentSessionKey: resolvedSessionKey,
				sessionEntry,
				requestedChannel: request.replyChannel ?? request.channel,
				explicitTo,
				explicitThreadId,
				accountId: request.replyAccountId ?? request.accountId,
				wantsDelivery,
				turnSourceChannel,
				turnSourceTo,
				turnSourceAccountId,
				turnSourceThreadId: explicitThreadId
			});
			let resolvedChannel = deliveryPlan.resolvedChannel;
			let deliveryTargetMode = deliveryPlan.deliveryTargetMode;
			let resolvedAccountId = deliveryPlan.resolvedAccountId;
			let resolvedTo = deliveryPlan.resolvedTo;
			let effectivePlan = deliveryPlan;
			let deliveryDowngradeReason = null;
			let deliveryTargetResolutionError;
			if (wantsDelivery && resolvedChannel === "webchat") {
				const cfgResolved = cfgForAgent ?? cfg;
				try {
					resolvedChannel = (await resolveMessageChannelSelection({ cfg: cfgResolved })).channel;
					deliveryTargetMode = deliveryTargetMode ?? "implicit";
					effectivePlan = {
						...deliveryPlan,
						resolvedChannel,
						deliveryTargetMode,
						resolvedAccountId
					};
				} catch (err) {
					if (!shouldDowngradeDeliveryToSessionOnly({
						wantsDelivery,
						bestEffortDeliver,
						resolvedChannel
					})) {
						respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, formatForLog(err)));
						return;
					}
					deliveryDowngradeReason = String(err);
				}
			}
			if (!resolvedTo && isDeliverableMessageChannel(resolvedChannel)) {
				const fallback = resolveAgentOutboundTarget({
					cfg: cfgForAgent ?? cfg,
					plan: effectivePlan,
					targetMode: deliveryTargetMode ?? "implicit",
					validateExplicitTarget: false
				});
				if (fallback.resolvedTarget?.ok) resolvedTo = fallback.resolvedTo;
				else if (fallback.resolvedTarget && !fallback.resolvedTarget.ok) deliveryTargetResolutionError = fallback.resolvedTarget.error;
			}
			if (wantsDelivery && isDeliverableMessageChannel(resolvedChannel) && !resolvedTo) {
				if (!bestEffortDeliver) {
					respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, deliveryTargetResolutionError ? String(deliveryTargetResolutionError) : `delivery target is required for ${resolvedChannel}: pass --to/--reply-to or configure a default target`));
					return;
				}
				context.logGateway.info(deliveryTargetResolutionError ? `agent delivery target missing (bestEffortDeliver): ${String(deliveryTargetResolutionError)}` : "agent delivery target missing (bestEffortDeliver): no deliverable target");
			}
			if (wantsDelivery && resolvedChannel === "webchat") {
				if (!shouldDowngradeDeliveryToSessionOnly({
					wantsDelivery,
					bestEffortDeliver,
					resolvedChannel
				})) {
					respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "delivery channel is required: pass --channel/--reply-channel or use a main session with a previous channel"));
					return;
				}
				context.logGateway.info(deliveryDowngradeReason ? `agent delivery downgraded to session-only (bestEffortDeliver): ${deliveryDowngradeReason}` : "agent delivery downgraded to session-only (bestEffortDeliver): no deliverable channel");
			}
			const normalizedTurnSource = normalizeMessageChannel(turnSourceChannel);
			const originMessageChannel = (normalizedTurnSource && isKnownGatewayChannel(normalizedTurnSource) ? normalizedTurnSource : void 0) ?? (client?.connect && isWebchatConnect(client.connect) ? "webchat" : resolvedChannel);
			const deliver = request.deliver === true && resolvedChannel !== "webchat";
			const preRegistrationAbort = readGatewayDedupeEntry({
				dedupe: context.dedupe,
				keys: agentDedupeKeys
			});
			if (isPreRegistrationAbortedAgentDedupeEntryForSession({
				entry: preRegistrationAbort,
				runId,
				sessionKey: resolvedSessionKey,
				alternateSessionKeys: [preAcceptedReservedSessionKey, requestedSessionKey]
			})) {
				agentRunAccepted = true;
				respond(true, preRegistrationAbort?.payload, void 0, {
					cached: true,
					runId
				});
				return;
			}
			const now = Date.now();
			const timeoutMs = resolveAgentTimeoutMs({
				cfg: cfgForAgent ?? cfg,
				overrideSeconds: typeof request.timeout === "number" ? request.timeout : void 0
			});
			const activeModelProvider = providerOverride ?? resolveSessionModelRef(cfgForAgent ?? cfg, sessionEntry, resolvedSessionKey ? resolveAgentIdFromSessionKey(resolvedSessionKey) : agentId ?? resolveDefaultAgentId(cfgForAgent ?? cfg)).provider;
			const activeAuthProvider = resolveProviderIdForAuth(activeModelProvider, { config: cfgForAgent ?? cfg });
			const activeRunAbort = registerChatAbortController({
				chatAbortControllers: context.chatAbortControllers,
				runId,
				sessionId: resolvedSessionId ?? runId,
				sessionKey: resolvedSessionKey,
				timeoutMs,
				now,
				expiresAtMs: resolveAgentRunExpiresAtMs({
					now,
					timeoutMs
				}),
				ownerConnId,
				ownerDeviceId,
				providerId: activeModelProvider,
				authProviderId: activeAuthProvider,
				kind: "agent"
			});
			const existingRunAbort = context.chatAbortControllers.get(runId);
			if (!activeRunAbort.registered && existingRunAbort) {
				agentRunAccepted = existingRunAbort.kind === "agent";
				respond(true, {
					runId,
					status: "in_flight"
				}, void 0, {
					cached: true,
					runId
				});
				return;
			}
			const accepted = {
				runId,
				sessionKey: resolvedSessionKey,
				status: "accepted",
				acceptedAt: Date.now()
			};
			const acceptedDedupePayload = {
				...accepted,
				dedupeKeys: agentDedupeKeys,
				ownerConnId,
				ownerDeviceId
			};
			agentRunAccepted = true;
			setGatewayDedupeEntries({
				dedupe: context.dedupe,
				keys: agentDedupeKeys,
				entry: {
					ts: Date.now(),
					ok: true,
					payload: acceptedDedupePayload
				}
			});
			respond(true, accepted, void 0, { runId });
			(async () => {
				await yieldAfterAgentAcceptedAck();
				let dispatched = false;
				try {
					if (activeRunAbort.controller.signal.aborted) {
						const stopReason = resolveAbortedAgentStopReason(activeRunAbort.entry);
						setAbortedAgentDedupeEntries({
							dedupe: context.dedupe,
							keys: agentDedupeKeys,
							runId,
							stopReason
						});
						respond(true, {
							runId,
							status: "timeout",
							summary: "aborted",
							stopReason,
							timeoutPhase: "queue",
							providerStarted: false
						}, void 0, { runId });
						return;
					}
					if (resolvedSessionKey) await reactivateCompletedSubagentSession({
						sessionKey: resolvedSessionKey,
						runId
					});
					if (requestedSessionKey && resolvedSessionKey && isNewSession) emitSessionsChanged(context, {
						sessionKey: resolvedSessionKey,
						reason: "create"
					});
					if (resolvedSessionKey) emitSessionsChanged(context, {
						sessionKey: resolvedSessionKey,
						reason: "send"
					});
					if (shouldPrependStartupContext && resolvedSessionKey) {
						const startupCfg = cfgForAgent ?? cfg;
						if (!shouldSkipStartupContextForSpawnedSandbox({
							cfg: startupCfg,
							sessionKey: resolvedSessionKey,
							spawnedBy: spawnedByValue
						})) {
							const { runtimeWorkspaceDir } = resolveSessionRuntimeWorkspace({
								cfg: startupCfg,
								sessionKey: resolvedSessionKey,
								sessionEntry,
								spawnedBy: spawnedByValue
							});
							const startupContextPrelude = await buildSessionStartupContextPrelude({
								workspaceDir: runtimeWorkspaceDir,
								cfg: startupCfg
							});
							if (startupContextPrelude) message = `${startupContextPrelude}\n\n${message}`;
						}
					}
					if (!isRawModelRun) message = annotateInterSessionPromptText(message, inputProvenance);
					const resolvedThreadId = explicitThreadId ?? deliveryPlan.resolvedThreadId;
					const ingressAgentId = agentId && (!resolvedSessionKey || resolveAgentIdFromSessionKey(resolvedSessionKey) === agentId) ? agentId : void 0;
					let execApprovalFollowupRuntimeHandoff = canUseInternalRuntimeHandoff && execApprovalFollowupApprovalId ? consumeExecApprovalFollowupRuntimeHandoff({
						handoffId: request.internalRuntimeHandoffId,
						approvalId: execApprovalFollowupApprovalId,
						idempotencyKey: idem,
						sessionKey: resolvedSessionKey
					}) : void 0;
					if (!execApprovalFollowupRuntimeHandoff && canUseInternalRuntimeHandoff && execApprovalFollowupApprovalId && requestedSessionKeyRaw && requestedSessionKeyRaw !== resolvedSessionKey) execApprovalFollowupRuntimeHandoff = consumeExecApprovalFollowupRuntimeHandoff({
						handoffId: request.internalRuntimeHandoffId,
						approvalId: execApprovalFollowupApprovalId,
						idempotencyKey: idem,
						sessionKey: requestedSessionKeyRaw
					});
					const execApprovalFollowupElevatedDefaults = execApprovalFollowupRuntimeHandoff?.bashElevated;
					dispatchAgentRunFromGateway({
						ingressOpts: {
							message,
							images,
							imageOrder,
							agentId: ingressAgentId,
							provider: providerOverride,
							model: modelOverride,
							to: resolvedTo,
							sessionId: resolvedSessionId,
							sessionKey: resolvedSessionKey,
							thinking: request.thinking,
							deliver,
							deliveryTargetMode,
							channel: resolvedChannel,
							accountId: resolvedAccountId,
							threadId: resolvedThreadId,
							runContext: {
								messageChannel: originMessageChannel,
								accountId: resolvedAccountId,
								groupId: resolvedGroupId,
								groupChannel: resolvedGroupChannel,
								groupSpace: resolvedGroupSpace,
								currentThreadTs: resolvedThreadId != null ? String(resolvedThreadId) : void 0
							},
							...execApprovalFollowupElevatedDefaults ? { bashElevated: execApprovalFollowupElevatedDefaults } : {},
							groupId: resolvedGroupId,
							groupChannel: resolvedGroupChannel,
							groupSpace: resolvedGroupSpace,
							spawnedBy: spawnedByValue,
							timeout: request.timeout?.toString(),
							bestEffortDeliver,
							messageChannel: originMessageChannel,
							runId,
							lane: request.lane,
							modelRun: request.modelRun === true,
							promptMode: request.promptMode,
							extraSystemPrompt: request.extraSystemPrompt,
							bootstrapContextMode: request.bootstrapContextMode,
							bootstrapContextRunKind: request.bootstrapContextRunKind,
							acpTurnSource: request.acpTurnSource,
							internalEvents: request.internalEvents,
							inputProvenance,
							sessionEffects,
							skipInitialSessionTouch: skipAgentInitialSessionTouch,
							preserveUserFacingSessionModelState,
							sourceReplyDeliveryMode: request.sourceReplyDeliveryMode,
							disableMessageTool: request.disableMessageTool,
							suppressPromptPersistence: requestedPromptPersistenceSuppression || shouldSuppressAgentPromptPersistence({
								inputProvenance,
								internalEvents: request.internalEvents
							}),
							cleanupBundleMcpOnRunEnd: request.cleanupBundleMcpOnRunEnd,
							abortSignal: activeRunAbort.controller.signal,
							onActiveModelSelected: ({ provider }) => {
								updateChatRunProvider(context.chatAbortControllers, {
									runId,
									providerId: provider,
									authProviderId: resolveProviderIdForAuth(provider, { config: cfgForAgent ?? cfg })
								});
							},
							workspaceDir: resolveIngressWorkspaceOverrideForSpawnedRun({
								spawnedBy: spawnedByValue,
								workspaceDir: sessionEntry?.spawnedWorkspaceDir
							}),
							allowModelOverride
						},
						runId,
						dedupeKeys: agentDedupeKeys,
						abortController: activeRunAbort.controller,
						respond,
						context
					});
					dispatched = true;
				} catch (err) {
					const error = errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err));
					const payload = {
						runId,
						status: "error",
						summary: formatForLog(err)
					};
					setGatewayDedupeEntries({
						dedupe: context.dedupe,
						keys: agentDedupeKeys,
						entry: {
							ts: Date.now(),
							ok: false,
							payload,
							error
						}
					});
					respond(false, payload, error, {
						runId,
						error: formatForLog(err)
					});
				} finally {
					if (!dispatched) activeRunAbort.cleanup();
				}
			})();
		} finally {
			clearUnacceptedExecApprovalFollowupDedupe();
		}
	},
	"agent.identity.get": ({ params, respond, context }) => {
		if (!validateAgentIdentityParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent.identity.get params: ${formatValidationErrors(validateAgentIdentityParams.errors)}`));
			return;
		}
		const p = params;
		const agentIdRaw = normalizeOptionalString(p.agentId) ?? "";
		const sessionKeyRaw = normalizeOptionalString(p.sessionKey) ?? "";
		let agentId = agentIdRaw ? normalizeAgentId(agentIdRaw) : void 0;
		if (sessionKeyRaw) {
			if (classifySessionKeyShape(sessionKeyRaw) === "malformed_agent") {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent.identity.get params: malformed session key "${sessionKeyRaw}"`));
				return;
			}
			const resolved = resolveAgentIdFromSessionKey(sessionKeyRaw);
			if (agentId && resolved !== agentId) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent.identity.get params: agent "${agentIdRaw}" does not match session key agent "${resolved}"`));
				return;
			}
			agentId = resolved;
		}
		const cfg = context.getRuntimeConfig();
		const identity = resolveAssistantIdentity({
			cfg,
			agentId
		});
		const avatarValue = resolveAssistantAvatarUrl({
			avatar: identity.avatar,
			agentId: identity.agentId,
			basePath: cfg.gateway?.controlUi?.basePath
		}) ?? identity.avatar;
		const avatarResolution = resolveAgentAvatar(cfg, identity.agentId, { includeUiOverride: true });
		respond(true, {
			...identity,
			avatar: avatarValue,
			avatarSource: resolvePublicAgentAvatarSource(avatarResolution),
			avatarStatus: avatarResolution.kind,
			avatarReason: avatarResolution.kind === "none" ? avatarResolution.reason : void 0
		}, void 0);
	},
	"agent.wait": async ({ params, respond, context }) => {
		if (!validateAgentWaitParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agent.wait params: ${formatValidationErrors(validateAgentWaitParams.errors)}`));
			return;
		}
		const p = params;
		const runId = (p.runId ?? "").trim();
		const timeoutMs = typeof p.timeoutMs === "number" && Number.isFinite(p.timeoutMs) ? Math.max(0, Math.floor(p.timeoutMs)) : 3e4;
		const activeChatEntry = context.chatAbortControllers.get(runId);
		const hasActiveChatRun = activeChatEntry !== void 0 && activeChatEntry.kind !== "agent";
		const cachedGatewaySnapshot = readTerminalSnapshotFromGatewayDedupe({
			dedupe: context.dedupe,
			runId,
			ignoreAgentTerminalSnapshot: hasActiveChatRun
		});
		if (cachedGatewaySnapshot) {
			respond(true, {
				runId,
				status: cachedGatewaySnapshot.status,
				startedAt: cachedGatewaySnapshot.startedAt,
				endedAt: cachedGatewaySnapshot.endedAt,
				error: cachedGatewaySnapshot.error,
				stopReason: cachedGatewaySnapshot.stopReason,
				livenessState: cachedGatewaySnapshot.livenessState,
				yielded: cachedGatewaySnapshot.yielded,
				pendingError: cachedGatewaySnapshot.pendingError,
				timeoutPhase: cachedGatewaySnapshot.timeoutPhase,
				providerStarted: cachedGatewaySnapshot.providerStarted
			});
			return;
		}
		const lifecycleAbortController = new AbortController();
		const dedupeAbortController = new AbortController();
		const lifecyclePromise = waitForAgentJob({
			runId,
			timeoutMs,
			signal: lifecycleAbortController.signal,
			ignoreCachedSnapshot: hasActiveChatRun
		});
		const dedupePromise = waitForTerminalGatewayDedupe({
			dedupe: context.dedupe,
			runId,
			timeoutMs,
			signal: dedupeAbortController.signal,
			ignoreAgentTerminalSnapshot: hasActiveChatRun
		});
		const first = await Promise.race([lifecyclePromise.then((snapshot) => ({
			source: "lifecycle",
			snapshot
		})), dedupePromise.then((snapshot) => ({
			source: "dedupe",
			snapshot
		}))]);
		let snapshot = first.snapshot;
		if (snapshot) if (first.source === "lifecycle") dedupeAbortController.abort();
		else lifecycleAbortController.abort();
		else {
			snapshot = first.source === "lifecycle" ? await dedupePromise : await lifecyclePromise;
			lifecycleAbortController.abort();
			dedupeAbortController.abort();
		}
		if (!snapshot) {
			const activeRunRegistered = activeChatEntry !== void 0;
			respond(true, {
				runId,
				status: "timeout",
				timeoutPhase: activeRunRegistered ? "gateway_draining" : "queue",
				...activeRunRegistered ? {} : { providerStarted: false }
			});
			return;
		}
		respond(true, {
			runId,
			status: snapshot.status,
			startedAt: snapshot.startedAt,
			endedAt: snapshot.endedAt,
			error: snapshot.error,
			stopReason: snapshot.stopReason,
			livenessState: snapshot.livenessState,
			yielded: snapshot.yielded,
			pendingError: snapshot.pendingError,
			timeoutPhase: snapshot.timeoutPhase,
			providerStarted: snapshot.providerStarted
		});
	}
};
//#endregion
export { agentHandlers };
