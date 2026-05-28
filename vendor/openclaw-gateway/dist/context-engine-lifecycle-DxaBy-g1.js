import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { o as resolveContextEngineOwnerPluginId } from "./registry-DxH_0Os-.js";
import { d as stripRuntimeContextCustomMessages } from "./internal-runtime-context-DftY0OXU.js";
import { a as failTaskRunByRunId, c as recordTaskRunProgressByRunId, l as setDetachedTaskDeliveryStatusByRunId, n as completeTaskRunByRunId, r as createQueuedTaskRun, u as startTaskRunByRunId } from "./detached-task-runtime-BOScrQoy.js";
import { n as sleepWithAbort } from "./backoff-BQ4uO4hX.js";
import { c as getQueueSize, d as isGatewayDraining, i as enqueueCommandInLane, n as GatewayDrainingError } from "./command-queue-fCeWoVd6.js";
import { l as findActiveSessionTask } from "./openclaw-tools-BUQsixTe.js";
import { g as resolveContextEngineCapabilities, n as buildAfterTurnRuntimeContextFromUsage, t as buildAfterTurnRuntimeContext } from "./attempt.prompt-helpers-6Y-UzS6M.js";
import { t as log } from "./logger-DLLDK9dc.js";
import { r as resolveSessionLane } from "./lanes-BrQRlRRS.js";
import { c as updateTaskNotifyPolicyForOwner, i as findTaskByRunIdForOwner, n as cancelTaskByIdForOwner } from "./task-owner-access-BI6tRq9Y.js";
import { n as rewriteTranscriptEntriesInSessionManager, t as rewriteTranscriptEntriesInSessionFile } from "./transcript-rewrite-DWoIGpXc.js";
import { randomUUID } from "node:crypto";
//#region src/agents/pi-embedded-runner/context-engine-maintenance.ts
const TURN_MAINTENANCE_TASK_KIND = "context_engine_turn_maintenance";
const TURN_MAINTENANCE_TASK_LABEL = "Context engine turn maintenance";
const TURN_MAINTENANCE_TASK_TASK = "Deferred context-engine maintenance after turn.";
const TURN_MAINTENANCE_LANE_PREFIX = "context-engine-turn-maintenance:";
const TURN_MAINTENANCE_WAIT_POLL_MS = 100;
const TURN_MAINTENANCE_LONG_WAIT_MS = 1e4;
const DEFERRED_TURN_MAINTENANCE_ABORT_STATE_KEY = Symbol.for("openclaw.contextEngineTurnMaintenanceAbortState");
const activeDeferredTurnMaintenanceRuns = /* @__PURE__ */ new Map();
function resolveDeferredTurnMaintenanceAbortState(processLike) {
	const existing = processLike[DEFERRED_TURN_MAINTENANCE_ABORT_STATE_KEY];
	if (existing) return existing;
	const created = {
		registered: false,
		controllers: /* @__PURE__ */ new Set(),
		cleanupHandlers: /* @__PURE__ */ new Map()
	};
	processLike[DEFERRED_TURN_MAINTENANCE_ABORT_STATE_KEY] = created;
	return created;
}
function unregisterDeferredTurnMaintenanceAbortSignalHandlers(processLike, state) {
	if (!state.registered) return;
	for (const [signal, handler] of state.cleanupHandlers) processLike.off(signal, handler);
	state.cleanupHandlers.clear();
	state.registered = false;
}
function normalizeSessionKey(sessionKey) {
	return normalizeOptionalString(sessionKey) || void 0;
}
function resolveDeferredTurnMaintenanceLane(sessionKey) {
	return `${TURN_MAINTENANCE_LANE_PREFIX}${sessionKey}`;
}
async function disposeDeferredMaintenanceContextEngine(contextEngine) {
	try {
		await contextEngine.dispose?.();
	} catch (err) {
		log.warn("context engine dispose failed after deferred maintenance", { errorMessage: formatErrorMessage(err) });
	}
}
function createDeferredTurnMaintenanceAbortSignal(params) {
	if (typeof AbortController === "undefined") return {
		abortSignal: void 0,
		dispose: () => {}
	};
	const processLike = params?.processLike ?? process;
	const state = resolveDeferredTurnMaintenanceAbortState(processLike);
	const handleTerminationSignal = (signalName) => {
		const shouldReraise = typeof processLike.listenerCount === "function" ? processLike.listenerCount(signalName) === 1 : false;
		for (const activeController of state.controllers) if (!activeController.signal.aborted) activeController.abort(/* @__PURE__ */ new Error(`received ${signalName} while waiting for deferred maintenance`));
		state.controllers.clear();
		unregisterDeferredTurnMaintenanceAbortSignalHandlers(processLike, state);
		if (shouldReraise && typeof processLike.kill === "function") try {
			processLike.kill(processLike.pid ?? process.pid, signalName);
		} catch {}
	};
	if (!state.registered) {
		state.registered = true;
		const onSigint = () => handleTerminationSignal("SIGINT");
		const onSigterm = () => handleTerminationSignal("SIGTERM");
		state.cleanupHandlers.set("SIGINT", onSigint);
		state.cleanupHandlers.set("SIGTERM", onSigterm);
		processLike.on("SIGINT", onSigint);
		processLike.on("SIGTERM", onSigterm);
	}
	const controller = new AbortController();
	state.controllers.add(controller);
	let disposed = false;
	const cleanup = () => {
		if (disposed) return;
		disposed = true;
		state.controllers.delete(controller);
		if (state.controllers.size === 0) unregisterDeferredTurnMaintenanceAbortSignalHandlers(processLike, state);
	};
	return {
		abortSignal: controller.signal,
		dispose: cleanup
	};
}
function markDeferredTurnMaintenanceTaskScheduleFailure(params) {
	const errorMessage = formatErrorMessage(params.error);
	log.warn(`failed to schedule deferred context engine maintenance: ${errorMessage}`);
	cancelTaskByIdForOwner({
		taskId: params.taskId,
		callerOwnerKey: params.sessionKey,
		endedAt: Date.now(),
		terminalSummary: `Deferred maintenance could not be scheduled: ${errorMessage}`
	});
}
function buildTurnMaintenanceTaskDescriptor(params) {
	const runId = `turn-maint:${params.sessionKey}:${Date.now().toString(36)}:${randomUUID().slice(0, 8)}`;
	return createQueuedTaskRun({
		runtime: "acp",
		taskKind: TURN_MAINTENANCE_TASK_KIND,
		sourceId: TURN_MAINTENANCE_TASK_KIND,
		requesterSessionKey: params.sessionKey,
		ownerKey: params.sessionKey,
		scopeKind: "session",
		runId,
		label: TURN_MAINTENANCE_TASK_LABEL,
		task: TURN_MAINTENANCE_TASK_TASK,
		notifyPolicy: "silent",
		deliveryStatus: "pending",
		preferMetadata: true
	});
}
function promoteTurnMaintenanceTaskVisibility(params) {
	const task = findTaskByRunIdForOwner({
		runId: params.runId,
		callerOwnerKey: params.sessionKey
	});
	if (!task) return createQueuedTaskRun({
		runtime: "acp",
		taskKind: TURN_MAINTENANCE_TASK_KIND,
		sourceId: TURN_MAINTENANCE_TASK_KIND,
		requesterSessionKey: params.sessionKey,
		ownerKey: params.sessionKey,
		scopeKind: "session",
		runId: params.runId,
		label: TURN_MAINTENANCE_TASK_LABEL,
		task: TURN_MAINTENANCE_TASK_TASK,
		notifyPolicy: params.notifyPolicy,
		deliveryStatus: "pending",
		preferMetadata: true
	});
	setDetachedTaskDeliveryStatusByRunId({
		runId: params.runId,
		runtime: "acp",
		sessionKey: params.sessionKey,
		deliveryStatus: "pending"
	});
	if (task.notifyPolicy !== params.notifyPolicy) updateTaskNotifyPolicyForOwner({
		taskId: task.taskId,
		callerOwnerKey: params.sessionKey,
		notifyPolicy: params.notifyPolicy
	});
	return findTaskByRunIdForOwner({
		runId: params.runId,
		callerOwnerKey: params.sessionKey
	}) ?? task;
}
/**
* Attach runtime-owned transcript rewrite helpers to an existing
* context-engine runtime context payload.
*/
function buildContextEngineMaintenanceRuntimeContext(params) {
	return {
		...params.runtimeContext,
		...resolveContextEngineCapabilities({
			config: params.config,
			sessionKey: params.sessionKey,
			agentId: params.agentId,
			authProfileId: normalizeOptionalString(params.runtimeContext?.authProfileId),
			contextEnginePluginId: params.contextEnginePluginId,
			purpose: params.purpose ?? "context-engine.maintenance"
		}),
		...params.allowDeferredCompactionExecution ? { allowDeferredCompactionExecution: true } : {},
		rewriteTranscriptEntries: async (request) => {
			if (params.sessionManager) {
				const sessionManager = params.sessionManager;
				const rewriteSessionManagerEntries = () => rewriteTranscriptEntriesInSessionManager({
					sessionManager,
					replacements: request.replacements
				});
				return params.withSessionManagerRewriteLock ? await params.withSessionManagerRewriteLock(rewriteSessionManagerEntries) : rewriteSessionManagerEntries();
			}
			const rewriteTranscriptEntriesInFile = async () => await rewriteTranscriptEntriesInSessionFile({
				sessionFile: params.sessionFile,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey,
				config: params.config,
				request
			});
			const rewriteSessionKey = normalizeSessionKey(params.sessionKey ?? params.sessionId);
			if (params.deferTranscriptRewriteToSessionLane && rewriteSessionKey) return await enqueueCommandInLane(resolveSessionLane(rewriteSessionKey), async () => await rewriteTranscriptEntriesInFile());
			return await rewriteTranscriptEntriesInFile();
		}
	};
}
async function executeContextEngineMaintenance(params) {
	if (typeof params.contextEngine.maintain !== "function") return;
	const result = await params.contextEngine.maintain({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sessionFile: params.sessionFile,
		runtimeContext: buildContextEngineMaintenanceRuntimeContext({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile,
			sessionManager: params.executionMode === "background" ? void 0 : params.sessionManager,
			withSessionManagerRewriteLock: params.executionMode === "background" ? void 0 : params.withSessionManagerRewriteLock,
			runtimeContext: params.runtimeContext,
			agentId: params.agentId,
			allowDeferredCompactionExecution: params.executionMode === "background",
			deferTranscriptRewriteToSessionLane: params.executionMode === "background",
			config: params.config,
			purpose: `context-engine.${params.reason}.maintenance`,
			contextEnginePluginId: resolveContextEngineOwnerPluginId(params.contextEngine)
		})
	});
	if (result.changed) log.info(`[context-engine] maintenance(${params.reason}) changed transcript rewrittenEntries=${result.rewrittenEntries} bytesFreed=${result.bytesFreed} sessionKey=${params.sessionKey ?? params.sessionId ?? "unknown"}`);
	return result;
}
async function runDeferredTurnMaintenanceWorker(params) {
	let surfacedUserNotice = false;
	let longRunningTimer = null;
	const shutdownAbort = createDeferredTurnMaintenanceAbortSignal();
	const surfaceMaintenanceUpdate = (summary, eventSummary) => {
		promoteTurnMaintenanceTaskVisibility({
			sessionKey: params.sessionKey,
			runId: params.runId,
			notifyPolicy: "state_changes"
		});
		surfacedUserNotice = true;
		recordTaskRunProgressByRunId({
			runId: params.runId,
			runtime: "acp",
			sessionKey: params.sessionKey,
			lastEventAt: Date.now(),
			progressSummary: summary,
			eventSummary
		});
	};
	try {
		const sessionLane = resolveSessionLane(params.sessionKey);
		const startedWaitingAt = Date.now();
		let lastWaitNoticeAt = 0;
		for (;;) {
			while (getQueueSize(sessionLane) > 0) {
				const now = Date.now();
				if (now - startedWaitingAt >= TURN_MAINTENANCE_LONG_WAIT_MS && now - lastWaitNoticeAt >= TURN_MAINTENANCE_LONG_WAIT_MS) {
					lastWaitNoticeAt = now;
					surfaceMaintenanceUpdate("Waiting for the session lane to go idle.", surfacedUserNotice ? "Still waiting for the session lane to go idle." : "Deferred maintenance is waiting for the session lane to go idle.");
				}
				await sleepWithAbort(TURN_MAINTENANCE_WAIT_POLL_MS, shutdownAbort.abortSignal);
			}
			await Promise.resolve();
			if (getQueueSize(sessionLane) === 0) break;
		}
		const runningAt = Date.now();
		startTaskRunByRunId({
			runId: params.runId,
			runtime: "acp",
			sessionKey: params.sessionKey,
			startedAt: runningAt,
			lastEventAt: runningAt,
			progressSummary: "Running deferred maintenance.",
			eventSummary: "Starting deferred maintenance."
		});
		longRunningTimer = setTimeout(() => {
			try {
				surfaceMaintenanceUpdate("Deferred maintenance is still running.", "Deferred maintenance is still running.");
			} catch (error) {
				log.warn(`failed to surface deferred maintenance progress: ${String(error)}`);
			}
		}, TURN_MAINTENANCE_LONG_WAIT_MS);
		const result = await executeContextEngineMaintenance({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile,
			reason: "turn",
			sessionManager: params.sessionManager,
			runtimeContext: params.runtimeContext,
			agentId: params.agentId,
			config: params.config,
			executionMode: "background"
		});
		if (longRunningTimer) {
			clearTimeout(longRunningTimer);
			longRunningTimer = null;
		}
		const endedAt = Date.now();
		completeTaskRunByRunId({
			runId: params.runId,
			runtime: "acp",
			sessionKey: params.sessionKey,
			endedAt,
			lastEventAt: endedAt,
			progressSummary: result?.changed ? "Deferred maintenance completed with transcript changes." : "Deferred maintenance completed.",
			terminalSummary: result?.changed ? `Rewrote ${result.rewrittenEntries} transcript entr${result.rewrittenEntries === 1 ? "y" : "ies"} and freed ${result.bytesFreed} bytes.` : "No transcript changes were needed."
		});
	} catch (err) {
		if (shutdownAbort.abortSignal?.aborted) {
			if (longRunningTimer) {
				clearTimeout(longRunningTimer);
				longRunningTimer = null;
			}
			const task = findTaskByRunIdForOwner({
				runId: params.runId,
				callerOwnerKey: params.sessionKey
			});
			if (task) cancelTaskByIdForOwner({
				taskId: task.taskId,
				callerOwnerKey: params.sessionKey,
				endedAt: Date.now(),
				terminalSummary: "Deferred maintenance cancelled during shutdown."
			});
			return;
		}
		if (longRunningTimer) {
			clearTimeout(longRunningTimer);
			longRunningTimer = null;
		}
		const endedAt = Date.now();
		const reason = formatErrorMessage(err);
		if (!surfacedUserNotice) promoteTurnMaintenanceTaskVisibility({
			sessionKey: params.sessionKey,
			runId: params.runId,
			notifyPolicy: "done_only"
		});
		failTaskRunByRunId({
			runId: params.runId,
			runtime: "acp",
			sessionKey: params.sessionKey,
			endedAt,
			lastEventAt: endedAt,
			error: reason,
			progressSummary: "Deferred maintenance failed.",
			terminalSummary: reason
		});
		log.warn(`deferred context engine maintenance failed: ${reason}`);
	} finally {
		shutdownAbort.dispose();
		if (params.disposeContextEngineAfterMaintenance) await disposeDeferredMaintenanceContextEngine(params.contextEngine);
	}
}
function scheduleDeferredTurnMaintenance(params) {
	const sessionKey = normalizeSessionKey(params.sessionKey);
	if (!sessionKey) return;
	if (isGatewayDraining()) {
		params.onScheduleFailure?.(new GatewayDrainingError());
		return;
	}
	const activeRun = activeDeferredTurnMaintenanceRuns.get(sessionKey);
	if (activeRun) {
		const supersededParams = activeRun.rerunRequested ? activeRun.latestParams : void 0;
		activeRun.rerunRequested = true;
		activeRun.latestParams = {
			...params,
			sessionKey
		};
		if (supersededParams?.disposeContextEngineAfterMaintenance && supersededParams.contextEngine !== params.contextEngine) disposeDeferredMaintenanceContextEngine(supersededParams.contextEngine);
		return activeRun.promise;
	}
	const existingTask = findActiveSessionTask({
		sessionKey,
		runtime: "acp",
		taskKind: TURN_MAINTENANCE_TASK_KIND
	});
	const reusableTask = existingTask?.runId?.trim() ? existingTask : void 0;
	if (existingTask && !reusableTask) {
		updateTaskNotifyPolicyForOwner({
			taskId: existingTask.taskId,
			callerOwnerKey: sessionKey,
			notifyPolicy: "silent"
		});
		cancelTaskByIdForOwner({
			taskId: existingTask.taskId,
			callerOwnerKey: sessionKey,
			endedAt: Date.now(),
			terminalSummary: "Superseded by refreshed deferred maintenance task."
		});
	}
	const task = reusableTask ?? buildTurnMaintenanceTaskDescriptor({ sessionKey });
	log.info(`[context-engine] deferred turn maintenance ${reusableTask ? "resuming" : "queued"} taskId=${task.taskId} sessionKey=${sessionKey} lane=${resolveDeferredTurnMaintenanceLane(sessionKey)}`);
	const schedulerAbort = createDeferredTurnMaintenanceAbortSignal();
	let runPromise;
	try {
		runPromise = enqueueCommandInLane(resolveDeferredTurnMaintenanceLane(sessionKey), async () => runDeferredTurnMaintenanceWorker({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey,
			sessionFile: params.sessionFile,
			sessionManager: params.sessionManager,
			runtimeContext: params.runtimeContext,
			agentId: params.agentId,
			config: params.config,
			runId: task.runId,
			disposeContextEngineAfterMaintenance: params.disposeContextEngineAfterMaintenance
		}));
	} catch (err) {
		schedulerAbort.dispose();
		markDeferredTurnMaintenanceTaskScheduleFailure({
			sessionKey,
			taskId: task.taskId,
			error: err
		});
		return;
	}
	let state;
	const trackedPromise = runPromise.catch((err) => {
		params.onScheduleFailure?.(err);
		markDeferredTurnMaintenanceTaskScheduleFailure({
			sessionKey,
			taskId: task.taskId,
			error: err
		});
	}).finally(async () => {
		schedulerAbort.dispose();
		const current = activeDeferredTurnMaintenanceRuns.get(sessionKey);
		if (current !== state) return;
		const shutdownTriggered = schedulerAbort.abortSignal?.aborted === true;
		const rerunParams = current.rerunRequested && !shutdownTriggered ? current.latestParams : void 0;
		const discardedRerunParams = current.rerunRequested && shutdownTriggered ? current.latestParams : void 0;
		activeDeferredTurnMaintenanceRuns.delete(sessionKey);
		if (rerunParams) await scheduleDeferredTurnMaintenance(rerunParams);
		else if (discardedRerunParams?.disposeContextEngineAfterMaintenance) await disposeDeferredMaintenanceContextEngine(discardedRerunParams.contextEngine);
	});
	state = {
		promise: trackedPromise,
		rerunRequested: false,
		latestParams: {
			...params,
			sessionKey
		}
	};
	activeDeferredTurnMaintenanceRuns.set(sessionKey, state);
	return trackedPromise;
}
/**
* Run optional context-engine transcript maintenance and normalize the result.
*/
async function runContextEngineMaintenance(params) {
	if (typeof params.contextEngine?.maintain !== "function") return;
	const executionMode = params.executionMode ?? "foreground";
	if (params.reason === "turn" && executionMode !== "background" && params.contextEngine.info.turnMaintenanceMode === "background") {
		try {
			const deferred = scheduleDeferredTurnMaintenance({
				contextEngine: params.contextEngine,
				sessionId: params.sessionId,
				sessionKey: params.sessionKey ?? params.sessionId,
				sessionFile: params.sessionFile,
				sessionManager: params.sessionManager,
				runtimeContext: params.runtimeContext,
				agentId: params.agentId,
				config: params.config,
				disposeContextEngineAfterMaintenance: params.disposeDeferredContextEngineAfterMaintenance,
				onScheduleFailure: params.onDeferredMaintenanceFailure
			});
			if (deferred) params.onDeferredMaintenance?.(deferred);
		} catch (err) {
			log.warn(`failed to schedule deferred context engine maintenance: ${String(err)}`);
		}
		return;
	}
	try {
		return await executeContextEngineMaintenance({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile,
			reason: params.reason,
			sessionManager: params.sessionManager,
			withSessionManagerRewriteLock: params.withSessionManagerRewriteLock,
			runtimeContext: params.runtimeContext,
			agentId: params.agentId,
			executionMode,
			config: params.config
		});
	} catch (err) {
		log.warn(`context engine maintain failed (${params.reason}): ${String(err)}`);
		return;
	}
}
//#endregion
//#region src/agents/harness/context-engine-lifecycle.ts
/**
* Run optional bootstrap + bootstrap maintenance for a harness-owned context engine.
*/
async function bootstrapHarnessContextEngine(params) {
	if (!params.hadSessionFile || !(params.contextEngine?.bootstrap || params.contextEngine?.maintain)) return;
	try {
		if (typeof params.contextEngine?.bootstrap === "function") await params.contextEngine.bootstrap({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile
		});
		await (params.runMaintenance ?? runHarnessContextEngineMaintenance)({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile,
			reason: "bootstrap",
			sessionManager: params.sessionManager,
			runtimeContext: params.runtimeContext,
			config: params.config
		});
	} catch (bootstrapErr) {
		params.warn(`context engine bootstrap failed: ${String(bootstrapErr)}`);
	}
}
/**
* Assemble model context through the active harness-owned context engine.
*/
async function assembleHarnessContextEngine(params) {
	if (!params.contextEngine) return;
	const messages = stripRuntimeContextCustomMessages(params.messages);
	return await params.contextEngine.assemble({
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		messages,
		tokenBudget: params.tokenBudget,
		...params.availableTools ? { availableTools: params.availableTools } : {},
		...params.citationsMode ? { citationsMode: params.citationsMode } : {},
		model: params.modelId,
		...params.prompt !== void 0 ? { prompt: params.prompt } : {}
	});
}
/**
* Finalize a completed harness turn via afterTurn or ingest fallbacks.
*/
async function finalizeHarnessContextEngineTurn(params) {
	if (!params.contextEngine) return { postTurnFinalizationSucceeded: true };
	const conversationSnapshot = buildContextEngineConversationSnapshot({
		messagesSnapshot: params.messagesSnapshot,
		prePromptMessageCount: params.prePromptMessageCount
	});
	let postTurnFinalizationSucceeded = true;
	if (typeof params.contextEngine.afterTurn === "function") try {
		await params.contextEngine.afterTurn({
			sessionId: params.sessionIdUsed,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile,
			messages: conversationSnapshot.messages,
			prePromptMessageCount: conversationSnapshot.prePromptMessageCount,
			tokenBudget: params.tokenBudget,
			runtimeContext: params.runtimeContext
		});
	} catch (afterTurnErr) {
		postTurnFinalizationSucceeded = false;
		params.warn(`context engine afterTurn failed: ${String(afterTurnErr)}`);
	}
	else {
		const newMessages = conversationSnapshot.messages.slice(conversationSnapshot.prePromptMessageCount);
		if (newMessages.length > 0) if (typeof params.contextEngine.ingestBatch === "function") try {
			await params.contextEngine.ingestBatch({
				sessionId: params.sessionIdUsed,
				sessionKey: params.sessionKey,
				messages: newMessages
			});
		} catch (ingestErr) {
			postTurnFinalizationSucceeded = false;
			params.warn(`context engine ingest failed: ${String(ingestErr)}`);
		}
		else for (const msg of newMessages) try {
			await params.contextEngine.ingest?.({
				sessionId: params.sessionIdUsed,
				sessionKey: params.sessionKey,
				message: msg
			});
		} catch (ingestErr) {
			postTurnFinalizationSucceeded = false;
			params.warn(`context engine ingest failed: ${String(ingestErr)}`);
		}
	}
	if (!params.promptError && !params.aborted && !params.yieldAborted && postTurnFinalizationSucceeded) await (params.runMaintenance ?? runHarnessContextEngineMaintenance)({
		contextEngine: params.contextEngine,
		sessionId: params.sessionIdUsed,
		sessionKey: params.sessionKey,
		sessionFile: params.sessionFile,
		reason: "turn",
		sessionManager: params.sessionManager,
		runtimeContext: params.runtimeContext,
		config: params.config
	});
	return { postTurnFinalizationSucceeded };
}
function buildContextEngineConversationSnapshot(params) {
	const prePromptMessages = stripRuntimeContextCustomMessages(params.messagesSnapshot.slice(0, params.prePromptMessageCount));
	const turnMessages = stripRuntimeContextCustomMessages(params.messagesSnapshot.slice(params.prePromptMessageCount));
	return {
		messages: [...prePromptMessages, ...turnMessages],
		prePromptMessageCount: prePromptMessages.length
	};
}
/**
* Build runtime context passed into harness context-engine hooks.
*/
function buildHarnessContextEngineRuntimeContext(params) {
	return buildAfterTurnRuntimeContext(params);
}
/**
* Build runtime context passed into harness context-engine hooks from usage data.
*/
function buildHarnessContextEngineRuntimeContextFromUsage(params) {
	return buildAfterTurnRuntimeContextFromUsage(params);
}
/**
* Run optional transcript maintenance for a harness-owned context engine.
*/
async function runHarnessContextEngineMaintenance(params) {
	return await runContextEngineMaintenance({
		contextEngine: params.contextEngine,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		sessionFile: params.sessionFile,
		reason: params.reason,
		sessionManager: params.sessionManager,
		runtimeContext: params.runtimeContext,
		executionMode: params.executionMode,
		onDeferredMaintenance: params.onDeferredMaintenance,
		config: params.config
	});
}
/**
* Return true when a non-legacy context engine should affect plugin harness behavior.
*/
function isActiveHarnessContextEngine(contextEngine) {
	return Boolean(contextEngine && contextEngine.info.id !== "legacy");
}
//#endregion
export { finalizeHarnessContextEngineTurn as a, runContextEngineMaintenance as c, buildHarnessContextEngineRuntimeContextFromUsage as i, bootstrapHarnessContextEngine as n, isActiveHarnessContextEngine as o, buildHarnessContextEngineRuntimeContext as r, runHarnessContextEngineMaintenance as s, assembleHarnessContextEngine as t };
