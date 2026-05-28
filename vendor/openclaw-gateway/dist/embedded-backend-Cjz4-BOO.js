import { _ as resolveSessionAgentId } from "./agent-scope-CudANNo3.js";
import { n as defaultRuntime } from "./runtime-yzlkhCoS.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import { r as DEFAULT_PROVIDER } from "./defaults-mDjiWzE5.js";
import "./config-BtNBbhZb.js";
import { i as INTERNAL_MESSAGE_CHANNEL } from "./message-channel-core-NW6lw3Ys.js";
import "./message-channel-CD8Rw4Ab.js";
import { l as onAgentEvent } from "./agent-events-BuYtWSh4.js";
import { u as updateSessionStore } from "./store-B5j4GKkg.js";
import { t as loadCombinedSessionStoreForGateway } from "./combined-store-gateway-v8_BZzBh.js";
import "./sessions-Ct4mpWsk.js";
import { r as buildConfiguredModelCatalog } from "./model-selection-shared-BuXkxoPc.js";
import { t as resolveThinkingDefault } from "./model-thinking-default-aCWhd_zB.js";
import { t as buildAllowedModelSet } from "./model-selection-DF4MbMUd.js";
import { l as readSessionMessagesAsync, n as capArrayByJsonBytes } from "./session-utils.fs-D_Qde0sG.js";
import { i as ensureContextWindowCacheLoaded } from "./context-C43hdmok.js";
import { c as loadSessionEntry, i as listAgentsForGateway, l as migrateAndPruneGatewaySessionStoreKey, m as resolveGatewaySessionStoreTarget, o as listSessionsFromStoreAsync, v as resolveSessionModelRef } from "./session-utils-CmwnszsS.js";
import { E as setEmbeddedMode } from "./openclaw-tools-BUQsixTe.js";
import { r as isChatStopCommandText } from "./chat-abort-BRIlXlGa.js";
import { c as performGatewaySessionReset } from "./session-reset-service-BTKvwiKu.js";
import { c as getMaxChatHistoryMessagesBytes } from "./server-constants-BGwLM6XN.js";
import { n as agentCommandFromIngress } from "./agent-command-l6N_480Y.js";
import { t as createDefaultDeps } from "./deps-2n_htaMu.js";
import { t as loadGatewayModelCatalog } from "./server-model-catalog-BPVi24kM.js";
import { t as augmentChatHistoryWithCliSessionImports } from "./cli-session-history-JHvrrk_w.js";
import { a as projectRecentChatDisplayMessages, o as resolveEffectiveChatHistoryMaxChars } from "./chat-display-projection-C0lsXGny.js";
import { n as augmentChatHistoryWithCanvasBlocks, o as enforceChatHistoryFinalBudget, s as replaceOversizedChatHistoryMessages, t as CHAT_HISTORY_MAX_SINGLE_MESSAGE_BYTES } from "./chat-Y6fYG4Dw.js";
import { n as timestampOptsFromConfig, t as injectTimestamp } from "./agent-timestamp-JdPenpRZ.js";
import { t as resolveLocalRunShutdownGraceMs } from "./local-run-shutdown-B71jGMgK.js";
import { i as shouldSuppressAssistantEventForLiveChat, n as projectLiveAssistantBufferedText, r as resolveMergedAssistantText, t as normalizeLiveAssistantEventText } from "./live-chat-projector-CoLxgBoy.js";
import { t as applySessionsPatchToStore } from "./sessions-patch-DlUy-GLP.js";
import { randomUUID } from "node:crypto";
//#region src/tui/embedded-backend.ts
const LIFECYCLE_ERROR_RETRY_GRACE_MS = 15e3;
const silentRuntime = {
	log: (..._args) => void 0,
	error: (..._args) => void 0,
	exit: (code) => {
		throw new Error(`embedded tui runtime exit ${String(code)}`);
	}
};
function hasProviderWildcardModelAllowlist(cfg) {
	return [cfg.agents?.defaults?.models, ...cfg.agents?.list?.map((agent) => agent?.models) ?? []].some((models) => Object.keys(models ?? {}).some((key) => key.trim().endsWith("/*")));
}
function resolveConfiguredReplaceModeCatalog(cfg) {
	if (cfg.models?.mode !== "replace") return;
	if (hasProviderWildcardModelAllowlist(cfg)) return;
	return buildConfiguredModelCatalog({ cfg });
}
function shouldLoadFullGatewayCatalogForReplaceMode(cfg) {
	return cfg.models?.mode === "replace" && hasProviderWildcardModelAllowlist(cfg);
}
async function loadEmbeddedTuiModelCatalog(cfg) {
	const configuredCatalog = resolveConfiguredReplaceModeCatalog(cfg);
	if (configuredCatalog !== void 0) return configuredCatalog;
	return await loadGatewayModelCatalog(shouldLoadFullGatewayCatalogForReplaceMode(cfg) ? { readOnly: false } : void 0);
}
function resolveBtwQuestion(message) {
	const question = /^\/(?:btw|side)(?::|\s)+(.*)$/i.exec(message.trim())?.[1]?.trim();
	return question ? question : void 0;
}
function payloadText(parts) {
	if (!Array.isArray(parts)) return "";
	return parts.map((part) => {
		if (!part || typeof part !== "object") return "";
		const payload = part;
		return typeof payload.text === "string" ? payload.text.trim() : "";
	}).filter(Boolean).join("\n\n").trim();
}
function timeoutSecondsFromMs(timeoutMs) {
	if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs < 0) return;
	return String(Math.max(0, Math.ceil(timeoutMs / 1e3)));
}
function resolveDeltaPayload(text, previousText) {
	if (previousText === void 0) return { deltaText: text };
	if (!text.startsWith(previousText)) return {
		deltaText: text,
		replace: true
	};
	return { deltaText: text.slice(previousText.length) };
}
function createQueuedRunReadiness() {
	let resolve;
	const promise = new Promise((ready) => {
		resolve = ready;
	});
	if (!resolve) throw new Error("Expected queue readiness resolver to be initialized");
	const resolveReady = resolve;
	let settled = false;
	return {
		promise,
		markReady: () => {
			if (settled) return;
			settled = true;
			resolveReady();
		}
	};
}
async function waitForLocalRunShutdown(promises) {
	if (promises.length === 0) return true;
	const timeoutMs = resolveLocalRunShutdownGraceMs();
	if (timeoutMs <= 0) return false;
	let timeout;
	let completed = false;
	await Promise.race([Promise.allSettled(promises).then(() => {
		completed = true;
	}), new Promise((resolve) => {
		timeout = setTimeout(resolve, timeoutMs);
		timeout.unref?.();
	})]);
	if (timeout) clearTimeout(timeout);
	return completed;
}
async function waitForQueuedLocalRun(previousRun, runId) {
	await previousRun.run.queuedRunReady;
	if (!previousRun.run.finishing && !previousRun.run.lifecycleEnded) {
		await previousRun.promise;
		return;
	}
	const timeoutMs = resolveLocalRunShutdownGraceMs();
	if (timeoutMs <= 0) throw new Error(`timed out waiting for previous local run to finish post-turn maintenance for ${runId}`);
	let timeout;
	try {
		await Promise.race([previousRun.promise, new Promise((_, reject) => {
			timeout = setTimeout(() => {
				reject(/* @__PURE__ */ new Error(`timed out waiting for previous local run to finish post-turn maintenance for ${runId}`));
			}, timeoutMs);
			timeout.unref?.();
		})]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
var EmbeddedTuiBackend = class {
	constructor() {
		this.connection = { url: "local embedded" };
		this.deps = createDefaultDeps();
		this.runs = /* @__PURE__ */ new Map();
		this.runPromises = /* @__PURE__ */ new Map();
		this.seq = 0;
		this.pendingLifecycleErrors = /* @__PURE__ */ new Map();
	}
	start() {
		if (this.unsubscribe) return;
		setEmbeddedMode(true);
		ensureContextWindowCacheLoaded();
		this.previousRuntimeLog = defaultRuntime.log;
		this.previousRuntimeError = defaultRuntime.error;
		defaultRuntime.log = silentRuntime.log;
		defaultRuntime.error = silentRuntime.error;
		this.unsubscribe = onAgentEvent((evt) => {
			this.handleAgentEvent(evt);
		});
		queueMicrotask(() => {
			this.onConnected?.();
		});
	}
	async stop() {
		const maintenancePromises = [];
		for (const [runId, run] of this.runs) {
			if (run.finishing || run.lifecycleEnded) {
				const promise = this.runPromises.get(runId);
				if (promise) maintenancePromises.push(promise);
				continue;
			}
			run.controller.abort();
		}
		if (!await waitForLocalRunShutdown(maintenancePromises)) {
			for (const run of this.runs.values()) if (run.finishing || run.lifecycleEnded) run.controller.abort();
		}
		this.unsubscribe?.();
		this.unsubscribe = void 0;
		this.clearPendingLifecycleErrors();
		for (const run of this.runs.values()) run.controller.abort();
		this.runs.clear();
		this.runPromises.clear();
		defaultRuntime.log = this.previousRuntimeLog ?? defaultRuntime.log;
		defaultRuntime.error = this.previousRuntimeError ?? defaultRuntime.error;
		this.previousRuntimeLog = void 0;
		this.previousRuntimeError = void 0;
		setEmbeddedMode(false);
	}
	async sendChat(opts) {
		const runId = opts.runId ?? randomUUID();
		const question = resolveBtwQuestion(opts.message);
		const stopCommand = this.hasAbortableSessionRun(opts.sessionKey) && isChatStopCommandText(opts.message);
		const queuedAfter = question || stopCommand ? void 0 : this.findQueuedSessionRunPromise(opts.sessionKey);
		if (stopCommand) {
			this.abortSessionRuns(opts.sessionKey);
			return { runId };
		}
		const controller = new AbortController();
		const queuedRunReadiness = createQueuedRunReadiness();
		this.runs.set(runId, {
			sessionKey: opts.sessionKey,
			controller,
			buffer: "",
			isBtw: Boolean(question),
			question,
			finishing: false,
			lifecycleEnded: false,
			finalSent: false,
			registered: false,
			queuedRunReady: queuedRunReadiness.promise,
			markQueuedRunReady: queuedRunReadiness.markReady
		});
		const runPromise = this.runTurn({
			runId,
			sessionKey: opts.sessionKey,
			message: opts.message,
			thinking: opts.thinking,
			deliver: opts.deliver,
			timeoutMs: opts.timeoutMs,
			controller,
			queuedAfter
		});
		this.runPromises.set(runId, runPromise);
		runPromise.finally(() => {
			this.runPromises.delete(runId);
		});
		return { runId };
	}
	async abortChat(opts) {
		const run = this.runs.get(opts.runId);
		if (!run || run.sessionKey !== opts.sessionKey) return {
			ok: true,
			aborted: false
		};
		if (!this.isAbortableRun(opts.runId, run)) return {
			ok: true,
			aborted: false
		};
		run.controller.abort();
		return {
			ok: true,
			aborted: true
		};
	}
	async loadHistory(opts) {
		const { cfg, storePath, entry } = loadSessionEntry(opts.sessionKey);
		const sessionId = entry?.sessionId;
		const resolvedSessionModel = resolveSessionModelRef(cfg, entry, resolveSessionAgentId({
			sessionKey: opts.sessionKey,
			config: cfg
		}));
		const max = Math.min(1e3, typeof opts.limit === "number" ? opts.limit : 200);
		const maxHistoryBytes = getMaxChatHistoryMessagesBytes();
		const localMessages = sessionId && storePath ? await readSessionMessagesAsync(sessionId, storePath, entry?.sessionFile, {
			mode: "recent",
			maxMessages: max,
			maxBytes: Math.max(maxHistoryBytes * 2, 1024 * 1024)
		}) : [];
		const capped = capArrayByJsonBytes(replaceOversizedChatHistoryMessages({
			messages: augmentChatHistoryWithCanvasBlocks(projectRecentChatDisplayMessages(augmentChatHistoryWithCliSessionImports({
				entry,
				provider: resolvedSessionModel.provider,
				localMessages
			}), {
				maxChars: resolveEffectiveChatHistoryMaxChars(cfg),
				maxMessages: max
			})),
			maxSingleMessageBytes: Math.min(CHAT_HISTORY_MAX_SINGLE_MESSAGE_BYTES, maxHistoryBytes)
		}).messages, maxHistoryBytes).items;
		const messages = enforceChatHistoryFinalBudget({
			messages: capped,
			maxBytes: maxHistoryBytes
		}).messages;
		let thinkingLevel = entry?.thinkingLevel;
		if (!thinkingLevel) {
			const catalog = await loadEmbeddedTuiModelCatalog(cfg);
			thinkingLevel = resolveThinkingDefault({
				cfg,
				provider: resolvedSessionModel.provider,
				model: resolvedSessionModel.model,
				catalog
			});
		}
		return {
			sessionKey: opts.sessionKey,
			sessionId,
			messages,
			thinkingLevel,
			fastMode: entry?.fastMode,
			verboseLevel: entry?.verboseLevel ?? cfg.agents?.defaults?.verboseDefault
		};
	}
	async listSessions(opts) {
		const cfg = getRuntimeConfig();
		const { storePath, store } = loadCombinedSessionStoreForGateway(cfg);
		return await listSessionsFromStoreAsync({
			cfg,
			storePath,
			store,
			opts: opts ?? {}
		});
	}
	async listAgents() {
		return listAgentsForGateway(getRuntimeConfig());
	}
	async patchSession(opts) {
		const cfg = getRuntimeConfig();
		const target = resolveGatewaySessionStoreTarget({
			cfg,
			key: opts.key
		});
		const applied = await updateSessionStore(target.storePath, async (store) => {
			const { primaryKey } = migrateAndPruneGatewaySessionStoreKey({
				cfg,
				key: opts.key,
				store
			});
			return await applySessionsPatchToStore({
				cfg,
				store,
				storeKey: primaryKey,
				patch: opts,
				loadGatewayModelCatalog: () => loadEmbeddedTuiModelCatalog(cfg)
			});
		});
		if (!applied.ok) throw new Error(applied.error.message);
		const agentId = resolveSessionAgentId({
			sessionKey: target.canonicalKey ?? opts.key,
			config: cfg
		});
		const resolved = resolveSessionModelRef(cfg, applied.entry, agentId);
		return {
			ok: true,
			path: target.storePath,
			key: target.canonicalKey ?? opts.key,
			entry: applied.entry,
			resolved: {
				modelProvider: resolved.provider,
				model: resolved.model
			}
		};
	}
	async resetSession(key, reason) {
		const result = await performGatewaySessionReset({
			key,
			reason: reason === "new" ? "new" : "reset",
			commandSource: "tui:embedded"
		});
		if (!result.ok) throw new Error(result.error.message);
		return {
			ok: true,
			key: result.key,
			entry: result.entry
		};
	}
	async getGatewayStatus() {
		return `local embedded mode${this.runs.size > 0 ? ` (${String(this.runs.size)} active run${this.runs.size === 1 ? "" : "s"})` : ""}`;
	}
	async listModels() {
		const cfg = getRuntimeConfig();
		const catalog = await loadEmbeddedTuiModelCatalog(cfg);
		const { allowedCatalog } = buildAllowedModelSet({
			cfg,
			catalog,
			defaultProvider: DEFAULT_PROVIDER
		});
		return (allowedCatalog.length > 0 ? allowedCatalog : catalog).map((entry) => ({
			id: entry.id,
			name: entry.name ?? entry.id,
			provider: entry.provider,
			contextWindow: entry.contextWindow,
			reasoning: entry.reasoning
		}));
	}
	findQueuedSessionRunPromise(sessionKey) {
		let queuedAfter;
		for (const [runId, run] of this.runs) if (run.sessionKey === sessionKey && !run.isBtw) {
			const promise = this.runPromises.get(runId);
			if (promise) queuedAfter = {
				run,
				promise
			};
		}
		return queuedAfter;
	}
	abortSessionRuns(sessionKey) {
		for (const [runId, run] of this.runs) if (run.sessionKey === sessionKey && !run.isBtw && this.isAbortableRun(runId, run)) run.controller.abort();
	}
	hasAbortableSessionRun(sessionKey) {
		for (const [runId, run] of this.runs) if (run.sessionKey === sessionKey && !run.isBtw && this.isAbortableRun(runId, run)) return true;
		return false;
	}
	isAbortableRun(runId, run) {
		return !run.lifecycleEnded || this.runPromises.has(runId);
	}
	nextSeq() {
		this.seq += 1;
		return this.seq;
	}
	emit(event, payload) {
		this.onEvent?.({
			event,
			payload,
			seq: this.nextSeq()
		});
	}
	clearPendingLifecycleError(runId) {
		const pending = this.pendingLifecycleErrors.get(runId);
		if (!pending) return;
		clearTimeout(pending);
		this.pendingLifecycleErrors.delete(runId);
	}
	clearPendingLifecycleErrors() {
		for (const pending of this.pendingLifecycleErrors.values()) clearTimeout(pending);
		this.pendingLifecycleErrors.clear();
	}
	scheduleChatError(runId, run, errorMessage) {
		this.clearPendingLifecycleError(runId);
		const timer = setTimeout(() => {
			this.pendingLifecycleErrors.delete(runId);
			this.emitChatError(runId, run, errorMessage);
		}, LIFECYCLE_ERROR_RETRY_GRACE_MS);
		timer.unref?.();
		this.pendingLifecycleErrors.set(runId, timer);
	}
	emitChatDelta(runId, run) {
		const projected = projectLiveAssistantBufferedText(run.buffer.trim(), { suppressLeadFragments: true });
		const text = projected.text.trim();
		if (!text || projected.suppress) return;
		const deltaPayload = resolveDeltaPayload(text, run.lastBroadcastText);
		if (!deltaPayload.deltaText && !deltaPayload.replace) return;
		run.registered = true;
		run.lastBroadcastText = text;
		this.emit("chat", {
			runId,
			sessionKey: run.sessionKey,
			state: "delta",
			...deltaPayload,
			message: {
				role: "assistant",
				content: [{
					type: "text",
					text
				}],
				timestamp: Date.now()
			}
		});
	}
	emitChatFinal(runId, run, stopReason) {
		this.clearPendingLifecycleError(runId);
		run.markQueuedRunReady();
		const alreadyFinal = run.finalSent;
		run.finishing = false;
		run.lifecycleEnded = true;
		run.finalSent = true;
		if (alreadyFinal) return;
		run.registered = true;
		run.lastBroadcastText = void 0;
		const projected = projectLiveAssistantBufferedText(run.buffer.trim(), { suppressLeadFragments: false });
		const text = projected.text.trim();
		const shouldIncludeMessage = Boolean(text) && !projected.suppress;
		this.emit("chat", {
			runId,
			sessionKey: run.sessionKey,
			state: "final",
			...stopReason ? { stopReason } : {},
			...shouldIncludeMessage ? { message: {
				role: "assistant",
				content: [{
					type: "text",
					text
				}],
				timestamp: Date.now()
			} } : {}
		});
	}
	emitChatAborted(runId, run) {
		this.clearPendingLifecycleError(runId);
		run.markQueuedRunReady();
		const alreadyFinal = run.finalSent;
		run.finishing = false;
		run.lifecycleEnded = true;
		run.finalSent = true;
		if (alreadyFinal) return;
		run.registered = true;
		run.lastBroadcastText = void 0;
		this.emit("chat", {
			runId,
			sessionKey: run.sessionKey,
			state: "aborted"
		});
	}
	emitChatError(runId, run, errorMessage) {
		this.clearPendingLifecycleError(runId);
		run.markQueuedRunReady();
		const alreadyFinal = run.finalSent;
		run.finishing = false;
		run.lifecycleEnded = true;
		run.finalSent = true;
		if (alreadyFinal) return;
		run.registered = true;
		run.lastBroadcastText = void 0;
		this.emit("chat", {
			runId,
			sessionKey: run.sessionKey,
			state: "error",
			...errorMessage ? { errorMessage } : {}
		});
	}
	ensureRunRegistered(runId, run) {
		if (run.registered || run.isBtw) return;
		run.registered = true;
		run.lastBroadcastText = "";
		this.emit("chat", {
			runId,
			sessionKey: run.sessionKey,
			state: "delta",
			deltaText: "",
			message: {
				role: "assistant",
				content: [{
					type: "text",
					text: ""
				}],
				timestamp: Date.now()
			}
		});
	}
	async handleAgentEvent(evt) {
		const run = this.runs.get(evt.runId);
		if (!run) return;
		const lifecyclePhase = evt.stream === "lifecycle" && typeof evt.data?.phase === "string" ? evt.data.phase : "";
		if (evt.stream !== "lifecycle" || lifecyclePhase !== "error") this.clearPendingLifecycleError(evt.runId);
		if (evt.stream !== "assistant") this.ensureRunRegistered(evt.runId, run);
		this.emit("agent", {
			runId: evt.runId,
			stream: evt.stream,
			data: evt.data
		});
		if (evt.stream === "assistant" && !run.isBtw && typeof evt.data?.text === "string" && !shouldSuppressAssistantEventForLiveChat(evt.data)) {
			const cleaned = normalizeLiveAssistantEventText({
				text: evt.data.text,
				delta: evt.data.delta
			});
			run.buffer = resolveMergedAssistantText({
				previousText: run.buffer,
				nextText: cleaned.text,
				nextDelta: cleaned.delta
			});
			this.emitChatDelta(evt.runId, run);
			return;
		}
		if (evt.stream !== "lifecycle") return;
		const phase = lifecyclePhase;
		const aborted = evt.data?.aborted === true || run.controller.signal.aborted;
		if (phase === "finishing") {
			run.finishing = true;
			run.markQueuedRunReady();
			run.lifecycleStopReason = typeof evt.data?.stopReason === "string" ? evt.data.stopReason : void 0;
			return;
		}
		if (phase === "end") {
			run.finishing = false;
			if (aborted) {
				this.emitChatAborted(evt.runId, run);
				return;
			}
			run.lifecycleEnded = true;
			run.markQueuedRunReady();
			run.lifecycleStopReason = typeof evt.data?.stopReason === "string" ? evt.data.stopReason : void 0;
			return;
		}
		if (phase === "error") {
			run.finishing = false;
			if (aborted) {
				this.emitChatAborted(evt.runId, run);
				return;
			}
			const errorMessage = typeof evt.data?.error === "string" ? evt.data.error : void 0;
			run.buffer = "";
			this.scheduleChatError(evt.runId, run, errorMessage);
		}
	}
	async runTurn(params) {
		try {
			if (params.queuedAfter) {
				try {
					await waitForQueuedLocalRun(params.queuedAfter, params.runId);
				} catch (error) {
					const run = this.runs.get(params.runId);
					if (run) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						this.emitChatError(params.runId, run, `previous run did not finish cleanly: ${errorMessage}`);
					}
					return;
				}
				if (params.controller.signal.aborted) {
					const run = this.runs.get(params.runId);
					if (run) this.emitChatAborted(params.runId, run);
					return;
				}
			}
			const { cfg, canonicalKey, entry } = loadSessionEntry(params.sessionKey);
			const result = await agentCommandFromIngress({
				message: injectTimestamp(params.message, timestampOptsFromConfig(cfg)),
				sessionKey: canonicalKey,
				...entry?.sessionId ? { sessionId: entry.sessionId } : {},
				thinking: params.thinking,
				deliver: params.deliver,
				channel: INTERNAL_MESSAGE_CHANNEL,
				runContext: { messageChannel: INTERNAL_MESSAGE_CHANNEL },
				timeout: timeoutSecondsFromMs(params.timeoutMs),
				runId: params.runId,
				abortSignal: params.controller.signal,
				allowModelOverride: false
			}, silentRuntime, this.deps);
			const run = this.runs.get(params.runId);
			if (!run) return;
			if (params.controller.signal.aborted || result?.meta?.aborted === true) {
				this.emitChatAborted(params.runId, run);
				return;
			}
			if (run.isBtw) {
				const text = payloadText(result?.payloads);
				if (run.question && text) this.emit("chat.side_result", {
					kind: "btw",
					runId: params.runId,
					sessionKey: run.sessionKey,
					question: run.question,
					text
				});
				this.emitChatFinal(params.runId, run);
				return;
			}
			if (!run.finalSent) {
				const normalizedText = payloadText(result?.payloads);
				if (normalizedText && !run.buffer) run.buffer = normalizedText;
				const stopReason = run.lifecycleStopReason ?? (typeof result?.meta?.stopReason === "string" ? result.meta.stopReason : void 0);
				this.emitChatFinal(params.runId, run, stopReason);
			}
		} catch (error) {
			const run = this.runs.get(params.runId);
			if (!run) return;
			if (params.controller.signal.aborted) {
				this.emitChatAborted(params.runId, run);
				return;
			}
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.emitChatError(params.runId, run, errorMessage);
		} finally {
			this.runs.get(params.runId)?.markQueuedRunReady();
			this.runs.delete(params.runId);
		}
	}
};
//#endregion
export { EmbeddedTuiBackend };
