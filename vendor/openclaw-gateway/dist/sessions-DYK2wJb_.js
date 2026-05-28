import { c as normalizeOptionalString, p as readStringValue, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import "./agent-scope-CudANNo3.js";
import { c as parseAgentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { d as resolveAgentIdFromSessionKey, l as normalizeAgentId, v as toAgentStoreSessionKey } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { c as measureDiagnosticsTimelineSpan, l as measureDiagnosticsTimelineSpanSync } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { f as normalizeReasoningLevel, p as normalizeThinkLevel } from "./thinking-DKulK0JL.js";
import { n as GATEWAY_CLIENT_IDS } from "./client-info-BxgIUTRt.js";
import { $t as validateSessionsSendParams, Bt as validateSessionsCompactionListParams, Ft as validateSessionsAbortParams, Gt as validateSessionsListParams, Ht as validateSessionsCreateParams, Ii as ErrorCodes, It as validateSessionsCleanupParams, Jt as validateSessionsPatchParams, Kt as validateSessionsMessagesSubscribeParams, Li as errorShape, Lt as validateSessionsCompactParams, Qt as validateSessionsResolveParams, Rt as validateSessionsCompactionBranchParams, Ut as validateSessionsDeleteParams, Vt as validateSessionsCompactionRestoreParams, Wt as validateSessionsDescribeParams, Xt as validateSessionsPreviewParams, Yt as validateSessionsPluginPatchParams, Zt as validateSessionsResetParams, qt as validateSessionsMessagesUnsubscribeParams, zt as validateSessionsCompactionGetParams } from "./protocol-BkfNT2Bp.js";
import { t as ADMIN_SCOPE } from "./operator-scopes-DGvgHuOd.js";
import { v as patchPluginSessionExtension } from "./loader-ChBMT90m.js";
import { i as hasInternalHookListeners, m as triggerInternalHook, n as createInternalHookEvent } from "./internal-hooks-CeA6cnAD.js";
import { t as isPluginJsonValue } from "./host-hook-json-BHsxXV1L.js";
import { i as resolveMainSessionKey, n as resolveAgentMainSessionKey } from "./main-session-896o98eb.js";
import { a as resolveStoredSessionKeyForAgentStore, i as resolveSessionStoreKey, o as resolveStoredSessionOwnerAgentId, r as resolveSessionStoreAgentId } from "./session-store-key-Bm8fGm9t.js";
import { a as resolveSessionFilePathOptions, i as resolveSessionFilePath } from "./paths-DZXdqwOo.js";
import { t as loadSessionStore } from "./store-load-Di_AfnVx.js";
import { u as updateSessionStore } from "./store-B5j4GKkg.js";
import { t as listConfiguredSessionStoreAgentIds } from "./targets-Drw2Jswe.js";
import { t as loadCombinedSessionStoreForGateway } from "./combined-store-gateway-v8_BZzBh.js";
import { i as serializeSessionCleanupResult, r as runSessionsCleanup } from "./sessions-Ct4mpWsk.js";
import { b as waitForEmbeddedPiRunEnd, n as abortEmbeddedPiRun, o as isEmbeddedPiRunActive } from "./runs-p1TN18LG.js";
import { a as readRecentSessionMessagesWithStatsAsync, c as readSessionMessageCountAsync, o as readRecentSessionTranscriptLines, u as readSessionPreviewItemsFromTranscript } from "./session-utils.fs-D_Qde0sG.js";
import { a as resolveSessionTranscriptCandidates, t as archiveFileOnDisk } from "./session-transcript-files.fs-A8IXCaWE.js";
import { t as resolveModelAgentRuntimeMetadata } from "./agent-runtime-metadata-CoyiWxvX.js";
import { c as loadSessionEntry, d as resolveDeletedAgentIdFromSessionKey, f as resolveFreshestSessionEntryFromStoreKeys, g as resolveSessionDisplayModelIdentityRef, l as migrateAndPruneGatewaySessionStoreKey, m as resolveGatewaySessionStoreTarget, o as listSessionsFromStoreAsync, s as loadGatewaySessionRow, t as buildGatewaySessionRow, v as resolveSessionModelRef } from "./session-utils-CmwnszsS.js";
import { r as triggerSessionPatchHook } from "./openclaw-tools-BUQsixTe.js";
import { a as clearSessionQueues } from "./queue-BguXrIlu.js";
import { g as listSessionCompactionCheckpoints, h as getSessionCompactionCheckpoint, m as forkCompactionCheckpointTranscriptAsync } from "./model-context-tokens-BpXhDFUw.js";
import { n as compactEmbeddedPiSession } from "./pi-embedded-DHh5YEOO.js";
import { i as chatHandlers } from "./chat-Y6fYG4Dw.js";
import { n as setGatewayDedupeEntry } from "./agent-wait-dedupe-x4nPImUT.js";
import { t as resolveSessionKeyFromResolveParams } from "./sessions-resolve-DTmbqujH.js";
import { t as reactivateCompletedSubagentSession } from "./session-subagent-reactivation-BcbeevQu.js";
import { n as resolveSessionKeyForRun } from "./server-session-key-DEGjEDLL.js";
import { t as assertValidParams } from "./validation-DVnDjOVK.js";
import { t as applySessionsPatchToStore } from "./sessions-patch-DlUy-GLP.js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { CURRENT_SESSION_VERSION } from "@earendil-works/pi-coding-agent";
//#region src/gateway/server-methods/sessions.ts
function filterSessionStoreToConfiguredAgents(cfg, store) {
	const configuredAgentIds = new Set(listConfiguredSessionStoreAgentIds(cfg));
	const isConfiguredSessionKey = (key) => {
		const normalizedKey = normalizeOptionalString(key);
		if (!normalizedKey) return false;
		const agentId = resolveSessionStoreAgentId(cfg, resolveSessionStoreKey({
			cfg,
			sessionKey: normalizedKey
		}));
		return configuredAgentIds.has(normalizeAgentId(agentId));
	};
	return Object.fromEntries(Object.entries(store).filter(([key, entry]) => {
		if (key === "global" || key === "unknown") return true;
		if (isConfiguredSessionKey(key)) return true;
		return isConfiguredSessionKey(entry?.spawnedBy) || isConfiguredSessionKey(entry?.parentSessionKey);
	}));
}
let sessionsRuntimeModulePromise;
let loggedSlowSessionsListCatalog = false;
const SESSIONS_LIST_MODEL_CATALOG_TIMEOUT_MS = 750;
function loadSessionsRuntimeModule() {
	sessionsRuntimeModulePromise ??= import("./sessions.runtime.js");
	return sessionsRuntimeModulePromise;
}
async function loadOptionalSessionsListModelCatalog(context) {
	let timeout;
	const timedOut = Symbol("sessions-list-model-catalog-timeout");
	const timeoutPromise = new Promise((resolve) => {
		timeout = setTimeout(() => resolve(timedOut), SESSIONS_LIST_MODEL_CATALOG_TIMEOUT_MS);
		timeout.unref?.();
	});
	try {
		const result = await Promise.race([context.loadGatewayModelCatalog().catch(() => void 0), timeoutPromise]);
		if (result === timedOut) {
			if (!loggedSlowSessionsListCatalog) {
				loggedSlowSessionsListCatalog = true;
				context.logGateway.debug(`sessions.list continuing without model catalog after ${SESSIONS_LIST_MODEL_CATALOG_TIMEOUT_MS}ms`);
			}
			return;
		}
		return Array.isArray(result) ? result : void 0;
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
function requireSessionKey(key, respond) {
	const normalized = normalizeOptionalString(typeof key === "string" ? key : typeof key === "number" ? String(key) : typeof key === "bigint" ? String(key) : "") ?? "";
	if (!normalized) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "key required"));
		return null;
	}
	return normalized;
}
function rejectPluginRuntimeDeleteMismatch(params) {
	const pluginOwnerId = normalizeOptionalString(params.client?.internal?.pluginRuntimeOwnerId);
	if (!pluginOwnerId || !params.entry) return false;
	if (normalizeOptionalString(params.entry.pluginOwnerId) === pluginOwnerId) return false;
	params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `Plugin "${pluginOwnerId}" cannot delete session "${params.key}" because it did not create it.`));
	return true;
}
function resolveGatewaySessionTargetFromKey(key, cfg) {
	const target = resolveGatewaySessionStoreTarget({
		cfg,
		key
	});
	return {
		cfg,
		target,
		storePath: target.storePath
	};
}
function resolveOptionalInitialSessionMessage(params) {
	if (typeof params.task === "string" && params.task.trim()) return params.task;
	if (typeof params.message === "string" && params.message.trim()) return params.message;
}
function shouldAttachPendingMessageSeq(params) {
	if (params.cached) return false;
	return (params.payload && typeof params.payload === "object" ? params.payload.status : void 0) === "started";
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
			hasActiveRun: hasTrackedActiveSessionRun({
				context,
				requestedKey: payload.sessionKey ?? sessionRow.key,
				canonicalKey: sessionRow.key
			}),
			startedAt: sessionRow.startedAt,
			endedAt: sessionRow.endedAt,
			runtimeMs: sessionRow.runtimeMs,
			compactionCheckpointCount: sessionRow.compactionCheckpointCount,
			latestCompactionCheckpoint: sessionRow.latestCompactionCheckpoint,
			pluginExtensions: sessionRow.pluginExtensions
		} : {}
	}, connIds, { dropIfSlow: true });
}
function emitSessionOperation(context, payload) {
	const connIds = context.getSessionEventSubscriberConnIds();
	if (connIds.size === 0) return;
	context.broadcastToConnIds("session.operation", {
		...payload,
		ts: Date.now()
	}, connIds, { dropIfSlow: true });
}
function rejectWebchatSessionMutation(params) {
	if (!params.client?.connect || !params.isWebchatConnect(params.client.connect)) return false;
	if (params.client.connect.client.id === GATEWAY_CLIENT_IDS.CONTROL_UI) return false;
	params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `webchat clients cannot ${params.action} sessions; use chat.send for session-scoped updates`));
	return true;
}
function buildDashboardSessionKey(agentId) {
	return `agent:${agentId}:dashboard:${randomUUID()}`;
}
function cloneCheckpointSessionEntry(params) {
	return {
		...params.currentEntry,
		sessionId: params.nextSessionId,
		sessionFile: params.nextSessionFile,
		updatedAt: Date.now(),
		systemSent: false,
		abortedLastRun: false,
		startedAt: void 0,
		endedAt: void 0,
		runtimeMs: void 0,
		status: void 0,
		inputTokens: void 0,
		outputTokens: void 0,
		cacheRead: void 0,
		cacheWrite: void 0,
		estimatedCostUsd: void 0,
		totalTokens: typeof params.totalTokens === "number" && Number.isFinite(params.totalTokens) ? params.totalTokens : void 0,
		totalTokensFresh: typeof params.totalTokens === "number" && Number.isFinite(params.totalTokens) ? true : void 0,
		label: params.label ?? params.currentEntry.label,
		parentSessionKey: params.parentSessionKey ?? params.currentEntry.parentSessionKey,
		compactionCheckpoints: params.preserveCompactionCheckpoints ? params.currentEntry.compactionCheckpoints : void 0
	};
}
function resolveCheckpointForkSource(checkpoint) {
	const preCompactionFile = checkpoint.preCompaction.sessionFile?.trim();
	if (preCompactionFile) return {
		sourceFile: preCompactionFile,
		sourceLeafId: checkpoint.preCompaction.leafId,
		totalTokens: checkpoint.tokensBefore
	};
	const postCompactionFile = checkpoint.postCompaction.sessionFile?.trim();
	if (!postCompactionFile) return null;
	const postCompactionLeafId = checkpoint.postCompaction.leafId ?? checkpoint.postCompaction.entryId;
	if (!postCompactionLeafId) return null;
	return {
		sourceFile: postCompactionFile,
		sourceLeafId: postCompactionLeafId,
		totalTokens: checkpoint.tokensAfter
	};
}
function isAgentMainSessionKey(cfg, sessionKey) {
	const parsed = parseAgentSessionKey(sessionKey);
	if (!parsed) return false;
	return sessionKey === resolveAgentMainSessionKey({
		cfg,
		agentId: parsed.agentId
	});
}
async function createAgentMainSessionForSend(params) {
	const agentId = parseAgentSessionKey(params.canonicalKey)?.agentId;
	if (!agentId) return {
		ok: false,
		error: errorShape(ErrorCodes.INVALID_REQUEST, `session not found: ${params.canonicalKey}`)
	};
	let createResult;
	await sessionsHandlers["sessions.create"]({
		req: params.req,
		params: {
			key: params.canonicalKey,
			agentId
		},
		respond: (ok, payload, error) => {
			createResult = {
				ok,
				payload: payload && typeof payload === "object" ? payload : void 0,
				error
			};
		},
		context: params.context,
		client: params.client,
		isWebchatConnect: params.isWebchatConnect
	});
	if (!createResult) return {
		ok: false,
		error: errorShape(ErrorCodes.UNAVAILABLE, "sessions.create did not respond")
	};
	if (!createResult.ok) return {
		ok: false,
		error: createResult.error ?? errorShape(ErrorCodes.UNAVAILABLE, "failed to create session")
	};
	const createdKey = normalizeOptionalString(createResult.payload?.key) ?? params.canonicalKey;
	const loaded = loadSessionEntry(createdKey);
	if (!loaded.entry?.sessionId) return {
		ok: false,
		error: errorShape(ErrorCodes.UNAVAILABLE, `session not created: ${createdKey}`)
	};
	return {
		ok: true,
		entry: loaded.entry,
		canonicalKey: loaded.canonicalKey,
		storePath: loaded.storePath
	};
}
function ensureSessionTranscriptFile(params) {
	try {
		const transcriptPath = resolveSessionFilePath(params.sessionId, params.sessionFile ? { sessionFile: params.sessionFile } : void 0, resolveSessionFilePathOptions({
			storePath: params.storePath,
			agentId: params.agentId
		}));
		if (!fs.existsSync(transcriptPath)) {
			fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
			const header = {
				type: "session",
				version: CURRENT_SESSION_VERSION,
				id: params.sessionId,
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				cwd: process.cwd()
			};
			fs.writeFileSync(transcriptPath, `${JSON.stringify(header)}\n`, {
				encoding: "utf-8",
				mode: 384
			});
		}
		return {
			ok: true,
			transcriptPath
		};
	} catch (err) {
		return {
			ok: false,
			error: formatErrorMessage(err)
		};
	}
}
function resolveAbortSessionKey(params) {
	if (params.activeRunSessionKey) return params.activeRunSessionKey;
	const candidates = [
		params.canonicalKey,
		params.requestedKey,
		...params.aliasKeys ?? []
	];
	for (const active of params.context.chatAbortControllers.values()) for (const candidate of candidates) if (active.sessionKey === candidate) return candidate;
	return params.requestedKey;
}
function resolveSessionKeyAgentId(sessionKey, cfg) {
	const key = normalizeOptionalString(sessionKey);
	if (!key) return;
	if (!parseAgentSessionKey(key) && key.toLowerCase().startsWith("agent:")) return;
	return resolveSessionStoreAgentId(cfg, resolveSessionStoreKey({
		cfg,
		sessionKey: key
	}));
}
function sessionKeyBelongsToAgent(sessionKey, agentId, cfg) {
	const key = normalizeOptionalString(sessionKey);
	if (cfg.session?.scope === "global" && key?.toLowerCase() === "global") return true;
	const sessionAgentId = resolveSessionKeyAgentId(sessionKey, cfg);
	return Boolean(sessionAgentId && sessionAgentId === normalizeAgentId(agentId));
}
function resolveScopedAbortKey(params) {
	const key = normalizeOptionalString(params.key);
	if (!key) return;
	const requestedAgentId = normalizeOptionalString(params.agentId);
	if (!requestedAgentId) return key;
	const scopedAgentId = normalizeAgentId(requestedAgentId);
	const ownerAgentId = resolveStoredSessionOwnerAgentId({
		cfg: params.cfg,
		agentId: scopedAgentId,
		sessionKey: key
	});
	if (ownerAgentId && ownerAgentId !== scopedAgentId) return;
	return resolveStoredSessionKeyForAgentStore({
		cfg: params.cfg,
		agentId: scopedAgentId,
		sessionKey: key
	});
}
function collectTrackedActiveSessionRunKeys(context) {
	const keys = /* @__PURE__ */ new Set();
	if (!(context.chatAbortControllers instanceof Map)) return keys;
	for (const active of context.chatAbortControllers.values()) if (typeof active.sessionKey === "string" && active.sessionKey.trim()) keys.add(active.sessionKey);
	return keys;
}
function hasTrackedActiveSessionRun(params) {
	const activeSessionKeys = collectTrackedActiveSessionRunKeys(params.context);
	return activeSessionKeys.has(params.canonicalKey) || activeSessionKeys.has(params.requestedKey);
}
async function interruptSessionRunIfActive(params) {
	const hasTrackedRun = hasTrackedActiveSessionRun({
		context: params.context,
		requestedKey: params.requestedKey,
		canonicalKey: params.canonicalKey
	});
	const hasEmbeddedRun = typeof params.sessionId === "string" && params.sessionId ? isEmbeddedPiRunActive(params.sessionId) : false;
	if (!hasTrackedRun && !hasEmbeddedRun) return { interrupted: false };
	if (hasTrackedRun) {
		let abortOk = true;
		let abortError;
		const abortSessionKey = resolveAbortSessionKey({
			context: params.context,
			requestedKey: params.requestedKey,
			canonicalKey: params.canonicalKey
		});
		await chatHandlers["chat.abort"]({
			req: params.req,
			params: { sessionKey: abortSessionKey },
			respond: (ok, _payload, error) => {
				abortOk = ok;
				abortError = error;
			},
			context: params.context,
			client: params.client,
			isWebchatConnect: params.isWebchatConnect
		});
		if (!abortOk) return {
			interrupted: true,
			error: abortError ?? errorShape(ErrorCodes.UNAVAILABLE, "failed to interrupt active session")
		};
	}
	if (hasEmbeddedRun && params.sessionId) abortEmbeddedPiRun(params.sessionId);
	clearSessionQueues([
		params.requestedKey,
		params.canonicalKey,
		params.sessionId
	]);
	if (hasEmbeddedRun && params.sessionId) {
		if (!await waitForEmbeddedPiRunEnd(params.sessionId, 15e3)) return {
			interrupted: true,
			error: errorShape(ErrorCodes.UNAVAILABLE, `Session ${params.requestedKey} is still active; try again in a moment.`)
		};
	}
	return { interrupted: true };
}
async function handleSessionSend(params) {
	if (!assertValidParams(params.params, validateSessionsSendParams, params.method, params.respond)) return;
	const p = params.params;
	const key = requireSessionKey(p.key, params.respond);
	if (!key) return;
	const loaded = loadSessionEntry(key);
	const { cfg } = loaded;
	let { entry, canonicalKey, storePath } = loaded;
	const deletedAgentId = resolveDeletedAgentIdFromSessionKey(cfg, canonicalKey);
	if (deletedAgentId !== null) {
		params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `Agent "${deletedAgentId}" no longer exists in configuration`));
		return;
	}
	if (!entry?.sessionId && !params.interruptIfActive && isAgentMainSessionKey(cfg, canonicalKey)) {
		const created = await createAgentMainSessionForSend({
			req: params.req,
			canonicalKey,
			context: params.context,
			client: params.client,
			isWebchatConnect: params.isWebchatConnect
		});
		if (!created.ok) {
			params.respond(false, void 0, created.error);
			return;
		}
		entry = created.entry;
		canonicalKey = created.canonicalKey;
		storePath = created.storePath;
	}
	if (!entry?.sessionId) {
		params.respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `session not found: ${key}`));
		return;
	}
	let interruptedActiveRun = false;
	if (params.interruptIfActive) {
		const interruptResult = await interruptSessionRunIfActive({
			req: params.req,
			context: params.context,
			client: params.client,
			isWebchatConnect: params.isWebchatConnect,
			requestedKey: key,
			canonicalKey,
			sessionId: entry.sessionId
		});
		if (interruptResult.error) {
			params.respond(false, void 0, interruptResult.error);
			return;
		}
		interruptedActiveRun = interruptResult.interrupted;
	}
	const messageSeq = await readSessionMessageCountAsync(entry.sessionId, storePath, entry.sessionFile) + 1;
	let sendAcked = false;
	let sendPayload;
	let sendCached = false;
	let startedRunId;
	const rawIdempotencyKey = p.idempotencyKey;
	const idempotencyKey = typeof rawIdempotencyKey === "string" && rawIdempotencyKey.trim() ? rawIdempotencyKey.trim() : randomUUID();
	await chatHandlers["chat.send"]({
		req: params.req,
		params: {
			sessionKey: canonicalKey,
			message: p.message,
			thinking: p.thinking,
			attachments: p.attachments,
			timeoutMs: p.timeoutMs,
			idempotencyKey
		},
		respond: (ok, payload, error, meta) => {
			sendAcked = ok;
			sendPayload = payload;
			sendCached = meta?.cached === true;
			startedRunId = payload && typeof payload === "object" && typeof payload.runId === "string" ? payload.runId : void 0;
			if (ok && shouldAttachPendingMessageSeq({
				payload,
				cached: meta?.cached === true
			})) {
				params.respond(true, {
					...payload && typeof payload === "object" ? payload : {},
					messageSeq,
					...interruptedActiveRun ? { interruptedActiveRun: true } : {}
				}, void 0, meta);
				return;
			}
			params.respond(ok, ok && payload && typeof payload === "object" ? {
				...payload,
				...interruptedActiveRun ? { interruptedActiveRun: true } : {}
			} : payload, error, meta);
		},
		context: params.context,
		client: params.client,
		isWebchatConnect: params.isWebchatConnect
	});
	if (sendAcked) {
		if (shouldAttachPendingMessageSeq({
			payload: sendPayload,
			cached: sendCached
		})) await reactivateCompletedSubagentSession({
			sessionKey: canonicalKey,
			runId: startedRunId
		});
		emitSessionsChanged(params.context, {
			sessionKey: canonicalKey,
			reason: interruptedActiveRun ? "steer" : "send"
		});
	}
}
const sessionsHandlers = {
	"sessions.list": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateSessionsListParams, "sessions.list", respond)) return;
		const p = params;
		const cfg = context.getRuntimeConfig();
		const configuredAgentsOnly = p.configuredAgentsOnly === true;
		respond(true, await measureDiagnosticsTimelineSpan("gateway.sessions.list", async () => {
			const { storePath, store } = measureDiagnosticsTimelineSpanSync("gateway.sessions.list.store_load", () => loadCombinedSessionStoreForGateway(cfg, { agentId: p.agentId }), {
				config: cfg,
				phase: "sessions.list",
				attributes: {
					agentId: p.agentId ?? null,
					configuredAgentsOnly
				}
			});
			const listStore = configuredAgentsOnly ? filterSessionStoreToConfiguredAgents(cfg, store) : store;
			const modelCatalog = await measureDiagnosticsTimelineSpan("gateway.sessions.list.model_catalog", () => loadOptionalSessionsListModelCatalog(context), {
				config: cfg,
				phase: "sessions.list"
			});
			const result = await measureDiagnosticsTimelineSpan("gateway.sessions.list.rows", () => listSessionsFromStoreAsync({
				cfg,
				storePath,
				store: listStore,
				modelCatalog,
				opts: p
			}), {
				config: cfg,
				phase: "sessions.list",
				attributes: { storeEntries: Object.keys(listStore).length }
			});
			const sessions = measureDiagnosticsTimelineSpanSync("gateway.sessions.list.active_run_flags", () => {
				const activeSessionKeys = collectTrackedActiveSessionRunKeys(context);
				return result.sessions.map((session) => Object.assign({}, session, { hasActiveRun: activeSessionKeys.has(session.key) }));
			}, {
				config: cfg,
				phase: "sessions.list",
				attributes: { sessions: result.sessions.length }
			});
			return {
				...result,
				sessions
			};
		}, {
			config: cfg,
			phase: "sessions.list",
			attributes: {
				agentId: p.agentId ?? null,
				configuredAgentsOnly
			}
		}), void 0);
	},
	"sessions.cleanup": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateSessionsCleanupParams, "sessions.cleanup", respond)) return;
		try {
			const { mode, appliedSummaries } = await runSessionsCleanup({
				cfg: context.getRuntimeConfig(),
				opts: {
					agent: params.agent,
					allAgents: params.allAgents,
					enforce: params.enforce,
					activeKey: params.activeKey,
					fixMissing: params.fixMissing,
					fixDmScope: params.fixDmScope
				}
			});
			respond(true, serializeSessionCleanupResult({
				mode,
				dryRun: false,
				summaries: appliedSummaries
			}), void 0);
			for (const summary of appliedSummaries) {
				emitSessionsChanged(context, {
					reason: "cleanup",
					sessionKey: void 0
				});
				if (summary.wouldMutate) context.logGateway.debug(`sessions.cleanup applied ${summary.storePath}: ${summary.beforeCount} -> ${summary.afterCount}`);
			}
		} catch (error) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, formatErrorMessage(error)));
		}
	},
	"sessions.subscribe": ({ client, context, respond }) => {
		const connId = client?.connId?.trim();
		if (connId) context.subscribeSessionEvents(connId);
		respond(true, { subscribed: Boolean(connId) }, void 0);
	},
	"sessions.unsubscribe": ({ client, context, respond }) => {
		const connId = client?.connId?.trim();
		if (connId) context.unsubscribeSessionEvents(connId);
		respond(true, { subscribed: false }, void 0);
	},
	"sessions.messages.subscribe": ({ params, client, context, respond }) => {
		if (!assertValidParams(params, validateSessionsMessagesSubscribeParams, "sessions.messages.subscribe", respond)) return;
		const connId = client?.connId?.trim();
		const key = requireSessionKey(params.key, respond);
		if (!key) return;
		const { canonicalKey } = loadSessionEntry(key);
		if (connId) {
			context.subscribeSessionMessageEvents(connId, canonicalKey);
			respond(true, {
				subscribed: true,
				key: canonicalKey
			}, void 0);
			return;
		}
		respond(true, {
			subscribed: false,
			key: canonicalKey
		}, void 0);
	},
	"sessions.messages.unsubscribe": ({ params, client, context, respond }) => {
		if (!assertValidParams(params, validateSessionsMessagesUnsubscribeParams, "sessions.messages.unsubscribe", respond)) return;
		const connId = client?.connId?.trim();
		const key = requireSessionKey(params.key, respond);
		if (!key) return;
		const { canonicalKey } = loadSessionEntry(key);
		if (connId) context.unsubscribeSessionMessageEvents(connId, canonicalKey);
		respond(true, {
			subscribed: false,
			key: canonicalKey
		}, void 0);
	},
	"sessions.preview": ({ params, respond, context }) => {
		if (!assertValidParams(params, validateSessionsPreviewParams, "sessions.preview", respond)) return;
		const p = params;
		const keys = (Array.isArray(p.keys) ? p.keys : []).map((key) => normalizeOptionalString(key ?? "")).filter((key) => Boolean(key)).slice(0, 64);
		const limit = typeof p.limit === "number" && Number.isFinite(p.limit) ? Math.max(1, p.limit) : 12;
		const maxChars = typeof p.maxChars === "number" && Number.isFinite(p.maxChars) ? Math.max(20, p.maxChars) : 240;
		if (keys.length === 0) {
			respond(true, {
				ts: Date.now(),
				previews: []
			}, void 0);
			return;
		}
		const cfg = context.getRuntimeConfig();
		const storeCache = /* @__PURE__ */ new Map();
		const previews = [];
		for (const key of keys) try {
			const storeTarget = resolveGatewaySessionStoreTarget({
				cfg,
				key,
				scanLegacyKeys: false
			});
			const store = storeCache.get(storeTarget.storePath) ?? loadSessionStore(storeTarget.storePath);
			storeCache.set(storeTarget.storePath, store);
			const target = resolveGatewaySessionStoreTarget({
				cfg,
				key,
				store
			});
			const entry = resolveFreshestSessionEntryFromStoreKeys(store, target.storeKeys);
			if (!entry?.sessionId) {
				previews.push({
					key,
					status: "missing",
					items: []
				});
				continue;
			}
			const items = readSessionPreviewItemsFromTranscript(entry.sessionId, target.storePath, entry.sessionFile, target.agentId, limit, maxChars);
			previews.push({
				key,
				status: items.length > 0 ? "ok" : "empty",
				items
			});
		} catch {
			previews.push({
				key,
				status: "error",
				items: []
			});
		}
		respond(true, {
			ts: Date.now(),
			previews
		}, void 0);
	},
	"sessions.describe": ({ params, respond, context }) => {
		if (!assertValidParams(params, validateSessionsDescribeParams, "sessions.describe", respond)) return;
		const key = requireSessionKey(params.key, respond);
		if (!key) return;
		const cfg = context.getRuntimeConfig();
		const { target, storePath } = resolveGatewaySessionTargetFromKey(key, cfg);
		const store = loadSessionStore(storePath);
		const entry = resolveFreshestSessionEntryFromStoreKeys(store, target.storeKeys);
		if (!entry) {
			respond(true, { session: null }, void 0);
			return;
		}
		respond(true, { session: buildGatewaySessionRow({
			cfg,
			storePath,
			store,
			key: target.canonicalKey,
			entry,
			includeDerivedTitles: params.includeDerivedTitles,
			includeLastMessage: params.includeLastMessage,
			transcriptUsageMaxBytes: 64 * 1024
		}) }, void 0);
	},
	"sessions.resolve": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateSessionsResolveParams, "sessions.resolve", respond)) return;
		const p = params;
		const resolved = await resolveSessionKeyFromResolveParams({
			cfg: context.getRuntimeConfig(),
			p
		});
		if (!resolved.ok) {
			respond(false, void 0, resolved.error);
			return;
		}
		respond(true, {
			ok: true,
			key: resolved.key
		}, void 0);
	},
	"sessions.compaction.list": ({ params, respond }) => {
		if (!assertValidParams(params, validateSessionsCompactionListParams, "sessions.compaction.list", respond)) return;
		const key = requireSessionKey(params.key, respond);
		if (!key) return;
		const { entry, canonicalKey } = loadSessionEntry(key);
		respond(true, {
			ok: true,
			key: canonicalKey,
			checkpoints: listSessionCompactionCheckpoints(entry)
		}, void 0);
	},
	"sessions.compaction.get": ({ params, respond }) => {
		if (!assertValidParams(params, validateSessionsCompactionGetParams, "sessions.compaction.get", respond)) return;
		const p = params;
		const key = requireSessionKey(p.key, respond);
		if (!key) return;
		const checkpointId = normalizeOptionalString(p.checkpointId) ?? "";
		if (!checkpointId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "checkpointId required"));
			return;
		}
		const { entry, canonicalKey } = loadSessionEntry(key);
		const checkpoint = getSessionCompactionCheckpoint({
			entry,
			checkpointId
		});
		if (!checkpoint) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `checkpoint not found: ${checkpointId}`));
			return;
		}
		respond(true, {
			ok: true,
			key: canonicalKey,
			checkpoint
		}, void 0);
	},
	"sessions.create": async ({ req, params, respond, context, client, isWebchatConnect }) => {
		if (!assertValidParams(params, validateSessionsCreateParams, "sessions.create", respond)) return;
		const p = params;
		const cfg = context.getRuntimeConfig();
		const requestedKey = normalizeOptionalString(p.key);
		const agentId = normalizeAgentId(normalizeOptionalString(p.agentId) ?? resolveDefaultAgentId(cfg));
		if (requestedKey) {
			const requestedAgentId = parseAgentSessionKey(requestedKey)?.agentId;
			if (requestedAgentId && requestedAgentId !== agentId && normalizeOptionalString(p.agentId)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `sessions.create key agent (${requestedAgentId}) does not match agentId (${agentId})`));
				return;
			}
		}
		const parentSessionKey = normalizeOptionalString(p.parentSessionKey);
		let canonicalParentSessionKey;
		if (parentSessionKey) {
			const parent = loadSessionEntry(parentSessionKey);
			if (!parent.entry?.sessionId) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unknown parent session: ${parentSessionKey}`));
				return;
			}
			canonicalParentSessionKey = parent.canonicalKey;
		}
		if (canonicalParentSessionKey && p.emitCommandHooks === true && !requestedKey && !resolveOptionalInitialSessionMessage(p) && cfg.session?.dmScope === "main") {
			const parentMainKey = resolveAgentMainSessionKey({
				cfg,
				agentId: normalizeAgentId(resolveAgentIdFromSessionKey(canonicalParentSessionKey) ?? resolveDefaultAgentId(cfg))
			});
			if (canonicalParentSessionKey === parentMainKey) {
				const { performGatewaySessionReset } = await loadSessionsRuntimeModule();
				const resetResult = await performGatewaySessionReset({
					key: canonicalParentSessionKey,
					reason: "new",
					commandSource: "webchat"
				});
				if (!resetResult.ok) {
					respond(false, void 0, resetResult.error);
					return;
				}
				respond(true, {
					ok: true,
					key: resetResult.key,
					sessionId: resetResult.entry.sessionId,
					entry: resetResult.entry,
					runStarted: false
				}, void 0);
				emitSessionsChanged(context, {
					sessionKey: resetResult.key,
					reason: "new"
				});
				return;
			}
		}
		if (canonicalParentSessionKey && p.emitCommandHooks === true) {
			const { entry: parentEntry } = loadSessionEntry(canonicalParentSessionKey);
			const workspaceDir = resolveAgentWorkspaceDir(cfg, normalizeAgentId(resolveAgentIdFromSessionKey(canonicalParentSessionKey) ?? resolveDefaultAgentId(cfg)));
			if (hasInternalHookListeners("command", "new")) await triggerInternalHook(createInternalHookEvent("command", "new", canonicalParentSessionKey, {
				sessionEntry: parentEntry,
				previousSessionEntry: parentEntry,
				commandSource: "webchat",
				cfg,
				workspaceDir
			}));
			const parentTarget = resolveGatewaySessionStoreTarget({
				cfg,
				key: canonicalParentSessionKey
			});
			const { emitGatewayBeforeResetPluginHook } = await loadSessionsRuntimeModule();
			await emitGatewayBeforeResetPluginHook({
				cfg,
				key: canonicalParentSessionKey,
				target: parentTarget,
				storePath: parentTarget.storePath,
				entry: parentEntry,
				reason: "new"
			});
		}
		const loweredRequestedKey = normalizeOptionalLowercaseString(requestedKey);
		const target = resolveGatewaySessionStoreTarget({
			cfg,
			key: requestedKey ? loweredRequestedKey === "global" || loweredRequestedKey === "unknown" ? loweredRequestedKey : toAgentStoreSessionKey({
				agentId,
				requestKey: requestedKey,
				mainKey: cfg.session?.mainKey
			}) : buildDashboardSessionKey(agentId)
		});
		const targetAgentId = resolveAgentIdFromSessionKey(target.canonicalKey);
		const created = await updateSessionStore(target.storePath, async (store) => {
			const patched = await applySessionsPatchToStore({
				cfg,
				store,
				storeKey: target.canonicalKey,
				patch: {
					key: target.canonicalKey,
					label: normalizeOptionalString(p.label),
					model: normalizeOptionalString(p.model)
				},
				loadGatewayModelCatalog: context.loadGatewayModelCatalog
			});
			if (!patched.ok || !canonicalParentSessionKey) return patched;
			const nextEntry = {
				...patched.entry,
				parentSessionKey: canonicalParentSessionKey
			};
			store[target.canonicalKey] = nextEntry;
			return {
				...patched,
				entry: nextEntry
			};
		});
		if (!created.ok) {
			respond(false, void 0, created.error);
			return;
		}
		const ensured = ensureSessionTranscriptFile({
			sessionId: created.entry.sessionId,
			storePath: target.storePath,
			sessionFile: created.entry.sessionFile,
			agentId: targetAgentId
		});
		if (!ensured.ok) {
			await updateSessionStore(target.storePath, (store) => {
				delete store[target.canonicalKey];
			});
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, `failed to create session transcript: ${ensured.error}`));
			return;
		}
		const createdEntry = created.entry.sessionFile === ensured.transcriptPath ? created.entry : {
			...created.entry,
			sessionFile: ensured.transcriptPath
		};
		if (createdEntry !== created.entry) await updateSessionStore(target.storePath, (store) => {
			const existing = store[target.canonicalKey];
			if (existing) store[target.canonicalKey] = {
				...existing,
				sessionFile: ensured.transcriptPath
			};
		});
		const initialMessage = resolveOptionalInitialSessionMessage(p);
		let runPayload;
		let runError;
		let runMeta;
		const messageSeq = initialMessage ? await readSessionMessageCountAsync(createdEntry.sessionId, target.storePath, createdEntry.sessionFile) + 1 : void 0;
		if (initialMessage) await chatHandlers["chat.send"]({
			req,
			params: {
				sessionKey: target.canonicalKey,
				message: initialMessage,
				idempotencyKey: randomUUID()
			},
			respond: (ok, payload, error, meta) => {
				if (ok && payload && typeof payload === "object") runPayload = payload;
				else runError = error;
				runMeta = meta;
			},
			context,
			client,
			isWebchatConnect
		});
		const runStarted = runPayload !== void 0 && shouldAttachPendingMessageSeq({
			payload: runPayload,
			cached: runMeta?.cached === true
		});
		respond(true, {
			ok: true,
			key: target.canonicalKey,
			sessionId: createdEntry.sessionId,
			entry: createdEntry,
			runStarted,
			...runPayload ? runPayload : {},
			...runStarted && typeof messageSeq === "number" ? { messageSeq } : {},
			...runError ? { runError } : {}
		}, void 0);
		emitSessionsChanged(context, {
			sessionKey: target.canonicalKey,
			reason: "create"
		});
		if (runStarted) emitSessionsChanged(context, {
			sessionKey: target.canonicalKey,
			reason: "send"
		});
		if (canonicalParentSessionKey && p.emitCommandHooks === true) {
			const { entry: parentEntry } = loadSessionEntry(canonicalParentSessionKey);
			const parentTarget = resolveGatewaySessionStoreTarget({
				cfg,
				key: canonicalParentSessionKey
			});
			const { emitGatewaySessionEndPluginHook, emitGatewaySessionStartPluginHook } = await loadSessionsRuntimeModule();
			emitGatewaySessionEndPluginHook({
				cfg,
				sessionKey: canonicalParentSessionKey,
				sessionId: parentEntry?.sessionId,
				storePath: parentTarget.storePath,
				sessionFile: parentEntry?.sessionFile,
				agentId: parentTarget.agentId,
				reason: "new",
				nextSessionId: createdEntry.sessionId,
				nextSessionKey: target.canonicalKey
			});
			emitGatewaySessionStartPluginHook({
				cfg,
				sessionKey: target.canonicalKey,
				sessionId: createdEntry.sessionId,
				resumedFrom: parentEntry?.sessionId,
				storePath: target.storePath,
				sessionFile: createdEntry.sessionFile,
				agentId: target.agentId
			});
		}
	},
	"sessions.compaction.branch": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateSessionsCompactionBranchParams, "sessions.compaction.branch", respond)) return;
		const p = params;
		const key = requireSessionKey(p.key, respond);
		if (!key) return;
		const checkpointId = typeof p.checkpointId === "string" && p.checkpointId.trim() ? p.checkpointId.trim() : "";
		if (!checkpointId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "checkpointId required"));
			return;
		}
		const { cfg, entry, canonicalKey } = loadSessionEntry(key);
		const target = resolveGatewaySessionStoreTarget({
			cfg,
			key: canonicalKey
		});
		if (!entry?.sessionId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `session not found: ${key}`));
			return;
		}
		const checkpoint = getSessionCompactionCheckpoint({
			entry,
			checkpointId
		});
		const forkSource = checkpoint ? resolveCheckpointForkSource(checkpoint) : null;
		if (!checkpoint || !forkSource) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `checkpoint not found: ${checkpointId}`));
			return;
		}
		const branchedSession = await forkCompactionCheckpointTranscriptAsync({
			sourceFile: forkSource.sourceFile,
			sourceLeafId: forkSource.sourceLeafId,
			sessionDir: path.dirname(forkSource.sourceFile)
		});
		if (!branchedSession?.sessionFile) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, "failed to create checkpoint branch transcript"));
			return;
		}
		const nextKey = buildDashboardSessionKey(target.agentId);
		const label = entry.label?.trim() ? `${entry.label.trim()} (checkpoint)` : "Checkpoint branch";
		const nextEntry = cloneCheckpointSessionEntry({
			currentEntry: entry,
			nextSessionId: branchedSession.sessionId,
			nextSessionFile: branchedSession.sessionFile,
			label,
			parentSessionKey: canonicalKey,
			totalTokens: forkSource.totalTokens
		});
		await updateSessionStore(target.storePath, (store) => {
			store[nextKey] = nextEntry;
		});
		respond(true, {
			ok: true,
			sourceKey: canonicalKey,
			key: nextKey,
			sessionId: nextEntry.sessionId,
			checkpoint,
			entry: nextEntry
		}, void 0);
		emitSessionsChanged(context, {
			sessionKey: canonicalKey,
			reason: "checkpoint-branch"
		});
		emitSessionsChanged(context, {
			sessionKey: nextKey,
			reason: "checkpoint-branch"
		});
	},
	"sessions.compaction.restore": async ({ req, params, respond, context, client, isWebchatConnect }) => {
		if (!assertValidParams(params, validateSessionsCompactionRestoreParams, "sessions.compaction.restore", respond)) return;
		const p = params;
		const key = requireSessionKey(p.key, respond);
		if (!key) return;
		if (rejectWebchatSessionMutation({
			action: "restore",
			client,
			isWebchatConnect,
			respond
		})) return;
		const checkpointId = typeof p.checkpointId === "string" && p.checkpointId.trim() ? p.checkpointId.trim() : "";
		if (!checkpointId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "checkpointId required"));
			return;
		}
		const { entry, canonicalKey, storePath } = loadSessionEntry(key);
		if (!entry?.sessionId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `session not found: ${key}`));
			return;
		}
		const checkpoint = getSessionCompactionCheckpoint({
			entry,
			checkpointId
		});
		const forkSource = checkpoint ? resolveCheckpointForkSource(checkpoint) : null;
		if (!checkpoint || !forkSource) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `checkpoint not found: ${checkpointId}`));
			return;
		}
		const interruptResult = await interruptSessionRunIfActive({
			req,
			context,
			client,
			isWebchatConnect,
			requestedKey: key,
			canonicalKey,
			sessionId: entry.sessionId
		});
		if (interruptResult.error) {
			respond(false, void 0, interruptResult.error);
			return;
		}
		const restoredSession = await forkCompactionCheckpointTranscriptAsync({
			sourceFile: forkSource.sourceFile,
			sourceLeafId: forkSource.sourceLeafId,
			sessionDir: path.dirname(forkSource.sourceFile)
		});
		if (!restoredSession?.sessionFile) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, "failed to restore checkpoint transcript"));
			return;
		}
		const nextEntry = cloneCheckpointSessionEntry({
			currentEntry: entry,
			nextSessionId: restoredSession.sessionId,
			nextSessionFile: restoredSession.sessionFile,
			totalTokens: forkSource.totalTokens,
			preserveCompactionCheckpoints: true
		});
		await updateSessionStore(storePath, (store) => {
			store[canonicalKey] = nextEntry;
		});
		respond(true, {
			ok: true,
			key: canonicalKey,
			sessionId: nextEntry.sessionId,
			checkpoint,
			entry: nextEntry
		}, void 0);
		emitSessionsChanged(context, {
			sessionKey: canonicalKey,
			reason: "checkpoint-restore"
		});
	},
	"sessions.send": async ({ req, params, respond, context, client, isWebchatConnect }) => {
		await handleSessionSend({
			method: "sessions.send",
			req,
			params,
			respond,
			context,
			client,
			isWebchatConnect,
			interruptIfActive: false
		});
	},
	"sessions.steer": async ({ req, params, respond, context, client, isWebchatConnect }) => {
		await handleSessionSend({
			method: "sessions.steer",
			req,
			params,
			respond,
			context,
			client,
			isWebchatConnect,
			interruptIfActive: true
		});
	},
	"sessions.abort": async ({ req, params, respond, context, client, isWebchatConnect }) => {
		if (!assertValidParams(params, validateSessionsAbortParams, "sessions.abort", respond)) return;
		const p = params;
		const cfg = context.getRuntimeConfig();
		const requestedRunId = readStringValue(p.runId);
		const requestedKey = normalizeOptionalString(p.key);
		const requestedParamAgentId = normalizeOptionalString(p.agentId);
		const scopedRequestedKey = resolveScopedAbortKey({
			cfg,
			key: requestedKey,
			agentId: requestedParamAgentId
		});
		if (requestedKey && requestedParamAgentId && !scopedRequestedKey) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "session key agent does not match agentId"));
			return;
		}
		const requestedKeyAgentId = scopedRequestedKey ? resolveSessionKeyAgentId(scopedRequestedKey, cfg) : void 0;
		const activeRunSessionKey = requestedRunId ? context.chatAbortControllers.get(requestedRunId)?.sessionKey : void 0;
		const inferredRunAgentId = requestedParamAgentId ?? requestedKeyAgentId ?? (requestedRunId && !activeRunSessionKey ? resolveDefaultAgentId(cfg) : void 0);
		const requestedRunAgentId = requestedRunId ? inferredRunAgentId ? normalizeAgentId(inferredRunAgentId) : void 0 : void 0;
		const scopedActiveRunSessionKey = activeRunSessionKey ? requestedRunAgentId ? sessionKeyBelongsToAgent(activeRunSessionKey, requestedRunAgentId, cfg) ? activeRunSessionKey : void 0 : activeRunSessionKey : void 0;
		const keyCandidate = scopedRequestedKey ?? scopedActiveRunSessionKey ?? (requestedRunId ? resolveSessionKeyForRun(requestedRunId, { agentId: requestedRunAgentId ?? resolveDefaultAgentId(cfg) }) : void 0);
		if (!keyCandidate && requestedRunId) {
			respond(true, {
				ok: true,
				abortedRunId: null,
				status: "no-active-run"
			});
			return;
		}
		const key = requireSessionKey(keyCandidate, respond);
		if (!key) return;
		const { canonicalKey } = loadSessionEntry(key);
		const abortSessionKey = resolveAbortSessionKey({
			context,
			requestedKey: key,
			canonicalKey,
			activeRunSessionKey: scopedActiveRunSessionKey,
			aliasKeys: requestedKey && requestedKey !== key && (!requestedParamAgentId || sessionKeyBelongsToAgent(requestedKey, requestedParamAgentId, cfg)) ? [requestedKey] : void 0
		});
		const preAbortRunKinds = /* @__PURE__ */ new Map();
		if (requestedRunId) preAbortRunKinds.set(requestedRunId, context.chatAbortControllers.get(requestedRunId)?.kind);
		else for (const [rid, entry] of context.chatAbortControllers) preAbortRunKinds.set(rid, entry.kind);
		let abortedRunId = null;
		await chatHandlers["chat.abort"]({
			req,
			params: {
				sessionKey: abortSessionKey,
				runId: requestedRunId
			},
			respond: (ok, payload, error, meta) => {
				if (!ok) {
					respond(ok, payload, error, meta);
					return;
				}
				const firstAbortedRunId = (payload && typeof payload === "object" && Array.isArray(payload.runIds) ? payload.runIds.filter((value) => Boolean(normalizeOptionalString(value))) : [])[0] ?? null;
				abortedRunId = firstAbortedRunId;
				if (firstAbortedRunId) {
					const endedAt = Date.now();
					const dedupePrefix = preAbortRunKinds.get(firstAbortedRunId) === "agent" ? "agent" : "chat";
					setGatewayDedupeEntry({
						dedupe: context.dedupe,
						key: `${dedupePrefix}:${firstAbortedRunId}`,
						entry: {
							ts: endedAt,
							ok: true,
							payload: {
								status: "timeout",
								runId: firstAbortedRunId,
								stopReason: "rpc",
								endedAt
							}
						}
					});
				}
				respond(true, {
					ok: true,
					abortedRunId,
					status: abortedRunId ? "aborted" : "no-active-run"
				}, void 0, meta);
			},
			context,
			client,
			isWebchatConnect
		});
		if (abortedRunId) emitSessionsChanged(context, {
			sessionKey: canonicalKey,
			reason: "abort"
		});
	},
	"sessions.patch": async ({ params, respond, context, client, isWebchatConnect }) => {
		if (!assertValidParams(params, validateSessionsPatchParams, "sessions.patch", respond)) return;
		const p = params;
		const key = requireSessionKey(p.key, respond);
		if (!key) return;
		if (rejectWebchatSessionMutation({
			action: "patch",
			client,
			isWebchatConnect,
			respond
		})) return;
		const { cfg, target, storePath } = resolveGatewaySessionTargetFromKey(key, context.getRuntimeConfig());
		const applied = await updateSessionStore(storePath, async (store) => {
			const { primaryKey } = migrateAndPruneGatewaySessionStoreKey({
				cfg,
				key,
				store
			});
			return await applySessionsPatchToStore({
				cfg,
				store,
				storeKey: primaryKey,
				patch: p,
				loadGatewayModelCatalog: context.loadGatewayModelCatalog
			});
		});
		if (!applied.ok) {
			respond(false, void 0, applied.error);
			return;
		}
		triggerSessionPatchHook({
			cfg,
			sessionEntry: applied.entry,
			sessionKey: target.canonicalKey ?? key,
			patch: p
		});
		const agentId = normalizeAgentId(parseAgentSessionKey(target.canonicalKey ?? key)?.agentId ?? resolveDefaultAgentId(cfg));
		const resolved = resolveSessionModelRef(cfg, applied.entry, agentId);
		const resolvedDisplayModel = resolveSessionDisplayModelIdentityRef({
			cfg,
			agentId,
			provider: resolved.provider,
			model: resolved.model
		});
		const agentRuntime = resolveModelAgentRuntimeMetadata({
			cfg,
			agentId,
			provider: resolvedDisplayModel.provider,
			model: resolvedDisplayModel.model,
			sessionKey: target.canonicalKey ?? key,
			acpRuntime: applied.entry?.acp != null,
			acpBackend: applied.entry?.acp?.backend
		});
		respond(true, {
			ok: true,
			path: storePath,
			key: target.canonicalKey,
			entry: applied.entry,
			resolved: {
				modelProvider: resolvedDisplayModel.provider,
				model: resolvedDisplayModel.model,
				agentRuntime
			}
		}, void 0);
		emitSessionsChanged(context, {
			sessionKey: target.canonicalKey,
			reason: "patch"
		});
	},
	"sessions.pluginPatch": async ({ params, respond, context, client, isWebchatConnect }) => {
		if (!assertValidParams(params, validateSessionsPluginPatchParams, "sessions.pluginPatch", respond)) return;
		const key = requireSessionKey(params.key, respond);
		if (!key) return;
		if (rejectWebchatSessionMutation({
			action: "patch",
			client,
			isWebchatConnect,
			respond
		})) return;
		if (!(Array.isArray(client?.connect.scopes) ? client.connect.scopes : []).includes("operator.admin")) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `sessions.pluginPatch requires gateway scope: ${ADMIN_SCOPE}`));
			return;
		}
		const pluginId = normalizeOptionalString(params.pluginId);
		const namespace = normalizeOptionalString(params.namespace);
		if (!pluginId || !namespace) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "pluginId and namespace are required"));
			return;
		}
		if (params.unset === true && params.value !== void 0) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "sessions.pluginPatch cannot specify both unset and value"));
			return;
		}
		if (params.value !== void 0 && !isPluginJsonValue(params.value)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "sessions.pluginPatch value must be JSON-compatible"));
			return;
		}
		const patched = await patchPluginSessionExtension({
			cfg: context.getRuntimeConfig(),
			sessionKey: key,
			pluginId,
			namespace,
			value: params.value,
			unset: params.unset === true
		});
		if (!patched.ok) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, patched.error));
			return;
		}
		respond(true, {
			ok: true,
			key: patched.key,
			value: patched.value
		}, void 0);
		emitSessionsChanged(context, {
			sessionKey: patched.key,
			reason: "plugin-patch"
		});
	},
	"sessions.reset": async ({ params, respond, context }) => {
		if (!assertValidParams(params, validateSessionsResetParams, "sessions.reset", respond)) return;
		const p = params;
		const key = requireSessionKey(p.key, respond);
		if (!key) return;
		const reason = p.reason === "new" ? "new" : "reset";
		const { performGatewaySessionReset } = await loadSessionsRuntimeModule();
		const result = await performGatewaySessionReset({
			key,
			reason,
			commandSource: "gateway:sessions.reset"
		});
		if (!result.ok) {
			respond(false, void 0, result.error);
			return;
		}
		respond(true, {
			ok: true,
			key: result.key,
			entry: result.entry
		}, void 0);
		emitSessionsChanged(context, {
			sessionKey: result.key,
			reason
		});
	},
	"sessions.delete": async ({ params, respond, client, isWebchatConnect, context }) => {
		if (!assertValidParams(params, validateSessionsDeleteParams, "sessions.delete", respond)) return;
		const p = params;
		const key = requireSessionKey(p.key, respond);
		if (!key) return;
		if (rejectWebchatSessionMutation({
			action: "delete",
			client,
			isWebchatConnect,
			respond
		})) return;
		const { cfg, target, storePath } = resolveGatewaySessionTargetFromKey(key, context.getRuntimeConfig());
		const mainKey = resolveMainSessionKey(cfg);
		if (target.canonicalKey === mainKey) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `Cannot delete the main session (${mainKey}).`));
			return;
		}
		const deleteTranscript = typeof p.deleteTranscript === "boolean" ? p.deleteTranscript : true;
		const { archiveSessionTranscriptsForSessionDetailed, cleanupSessionBeforeMutation, emitGatewaySessionEndPluginHook, emitSessionUnboundLifecycleEvent } = await loadSessionsRuntimeModule();
		const { entry, legacyKey, canonicalKey } = loadSessionEntry(key);
		if (rejectPluginRuntimeDeleteMismatch({
			client,
			key: canonicalKey ?? key,
			entry,
			respond
		})) return;
		const mutationCleanupError = await cleanupSessionBeforeMutation({
			cfg,
			key,
			target,
			entry,
			legacyKey,
			canonicalKey,
			reason: "session-delete"
		});
		if (mutationCleanupError) {
			respond(false, void 0, mutationCleanupError);
			return;
		}
		const sessionId = entry?.sessionId;
		const deleted = await updateSessionStore(storePath, (store) => {
			const { primaryKey } = migrateAndPruneGatewaySessionStoreKey({
				cfg,
				key,
				store
			});
			const hadEntry = Boolean(store[primaryKey]);
			if (hadEntry) delete store[primaryKey];
			return hadEntry;
		});
		const archivedTranscripts = deleted && deleteTranscript ? archiveSessionTranscriptsForSessionDetailed({
			sessionId,
			storePath,
			sessionFile: entry?.sessionFile,
			agentId: target.agentId,
			reason: "deleted"
		}) : [];
		const archived = archivedTranscripts.map((entry) => entry.archivedPath);
		if (deleted) {
			emitGatewaySessionEndPluginHook({
				cfg,
				sessionKey: target.canonicalKey ?? key,
				sessionId,
				storePath,
				sessionFile: entry?.sessionFile,
				agentId: target.agentId,
				reason: "deleted",
				archivedTranscripts
			});
			const emitLifecycleHooks = p.emitLifecycleHooks !== false;
			await emitSessionUnboundLifecycleEvent({
				targetSessionKey: target.canonicalKey ?? key,
				reason: "session-delete",
				emitHooks: emitLifecycleHooks
			});
		}
		respond(true, {
			ok: true,
			key: target.canonicalKey,
			deleted,
			archived
		}, void 0);
		if (deleted) emitSessionsChanged(context, {
			sessionKey: target.canonicalKey,
			reason: "delete"
		});
	},
	"sessions.get": async ({ params, respond, context }) => {
		const p = params;
		const key = requireSessionKey(p.key ?? p.sessionKey, respond);
		if (!key) return;
		const limit = typeof p.limit === "number" && Number.isFinite(p.limit) ? Math.max(1, Math.floor(p.limit)) : 200;
		const { target, storePath } = resolveGatewaySessionTargetFromKey(key, context.getRuntimeConfig());
		const entry = resolveFreshestSessionEntryFromStoreKeys(loadSessionStore(storePath), target.storeKeys);
		if (!entry?.sessionId) {
			respond(true, { messages: [] }, void 0);
			return;
		}
		const { messages } = await readRecentSessionMessagesWithStatsAsync(entry.sessionId, storePath, entry.sessionFile, {
			maxMessages: limit,
			maxLines: limit * 20 + 20
		});
		respond(true, { messages }, void 0);
	},
	"sessions.compact": async ({ req, params, respond, context, client, isWebchatConnect }) => {
		if (!assertValidParams(params, validateSessionsCompactParams, "sessions.compact", respond)) return;
		const p = params;
		const key = requireSessionKey(p.key, respond);
		if (!key) return;
		if (rejectWebchatSessionMutation({
			action: "compact",
			client,
			isWebchatConnect,
			respond
		})) return;
		const maxLines = typeof p.maxLines === "number" && Number.isFinite(p.maxLines) ? Math.max(1, Math.floor(p.maxLines)) : void 0;
		const { cfg, target, storePath } = resolveGatewaySessionTargetFromKey(key, context.getRuntimeConfig());
		const compactTarget = await updateSessionStore(storePath, (store) => {
			const { entry, primaryKey } = migrateAndPruneGatewaySessionStoreKey({
				cfg,
				key,
				store
			});
			return {
				entry,
				primaryKey
			};
		});
		const entry = compactTarget.entry;
		const sessionId = entry?.sessionId;
		if (!sessionId) {
			respond(true, {
				ok: true,
				key: target.canonicalKey,
				compacted: false,
				reason: "no sessionId"
			}, void 0);
			return;
		}
		const filePath = resolveSessionTranscriptCandidates(sessionId, storePath, entry?.sessionFile, target.agentId).find((candidate) => fs.existsSync(candidate));
		if (!filePath) {
			respond(true, {
				ok: true,
				key: target.canonicalKey,
				compacted: false,
				reason: "no transcript"
			}, void 0);
			return;
		}
		if (maxLines === void 0) {
			const interruptResult = await interruptSessionRunIfActive({
				req,
				context,
				client,
				isWebchatConnect,
				requestedKey: key,
				canonicalKey: target.canonicalKey,
				sessionId
			});
			if (interruptResult.error) {
				respond(false, void 0, interruptResult.error);
				return;
			}
			const resolvedModel = resolveSessionModelRef(cfg, entry, target.agentId);
			const workspaceDir = normalizeOptionalString(entry?.spawnedWorkspaceDir) || resolveAgentWorkspaceDir(cfg, target.agentId);
			const operationId = randomUUID();
			emitSessionOperation(context, {
				operationId,
				operation: "compact",
				phase: "start",
				sessionKey: target.canonicalKey
			});
			let result;
			try {
				result = await compactEmbeddedPiSession({
					sessionId,
					sessionKey: target.canonicalKey,
					allowGatewaySubagentBinding: true,
					sessionFile: filePath,
					workspaceDir,
					config: cfg,
					provider: resolvedModel.provider,
					model: resolvedModel.model,
					agentHarnessId: entry?.sessionId === sessionId ? entry.agentHarnessId : void 0,
					thinkLevel: normalizeThinkLevel(entry?.thinkingLevel),
					reasoningLevel: normalizeReasoningLevel(entry?.reasoningLevel),
					bashElevated: {
						enabled: false,
						allowed: false,
						defaultLevel: "off"
					},
					trigger: "manual"
				});
			} catch (err) {
				emitSessionOperation(context, {
					operationId,
					operation: "compact",
					phase: "end",
					sessionKey: target.canonicalKey,
					completed: false,
					reason: formatErrorMessage(err)
				});
				throw err;
			}
			emitSessionOperation(context, {
				operationId,
				operation: "compact",
				phase: "end",
				sessionKey: target.canonicalKey,
				completed: result.ok && result.compacted,
				reason: result.reason
			});
			if (result.ok && result.compacted) await updateSessionStore(storePath, (store) => {
				const entryToUpdate = store[compactTarget.primaryKey];
				if (!entryToUpdate) return;
				entryToUpdate.updatedAt = Date.now();
				entryToUpdate.compactionCount = Math.max(0, entryToUpdate.compactionCount ?? 0) + 1;
				if (result.result?.sessionId && result.result.sessionId !== entryToUpdate.sessionId) entryToUpdate.sessionId = result.result.sessionId;
				if (result.result?.sessionFile) entryToUpdate.sessionFile = result.result.sessionFile;
				delete entryToUpdate.inputTokens;
				delete entryToUpdate.outputTokens;
				delete entryToUpdate.contextBudgetStatus;
				if (typeof result.result?.tokensAfter === "number" && Number.isFinite(result.result.tokensAfter)) {
					entryToUpdate.totalTokens = result.result.tokensAfter;
					entryToUpdate.totalTokensFresh = true;
				} else {
					delete entryToUpdate.totalTokens;
					delete entryToUpdate.totalTokensFresh;
				}
			});
			respond(true, {
				ok: result.ok,
				key: target.canonicalKey,
				compacted: result.compacted,
				reason: result.reason,
				result: result.result
			}, void 0);
			if (result.ok) emitSessionsChanged(context, {
				sessionKey: target.canonicalKey,
				reason: "compact",
				compacted: result.compacted
			});
			return;
		}
		const tail = readRecentSessionTranscriptLines({
			sessionId,
			storePath,
			sessionFile: entry?.sessionFile,
			agentId: target.agentId,
			maxLines
		});
		const lines = tail?.lines ?? [];
		const totalLines = tail?.totalLines ?? 0;
		if (totalLines <= maxLines) {
			respond(true, {
				ok: true,
				key: target.canonicalKey,
				compacted: false,
				kept: totalLines
			}, void 0);
			return;
		}
		const archived = archiveFileOnDisk(filePath, "bak");
		fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf-8");
		await updateSessionStore(storePath, (store) => {
			const entryToUpdate = store[compactTarget.primaryKey];
			if (!entryToUpdate) return;
			delete entryToUpdate.inputTokens;
			delete entryToUpdate.outputTokens;
			delete entryToUpdate.totalTokens;
			delete entryToUpdate.totalTokensFresh;
			delete entryToUpdate.contextBudgetStatus;
			entryToUpdate.updatedAt = Date.now();
		});
		respond(true, {
			ok: true,
			key: target.canonicalKey,
			compacted: true,
			archived,
			kept: lines.length
		}, void 0);
		emitSessionsChanged(context, {
			sessionKey: target.canonicalKey,
			reason: "compact",
			compacted: true
		});
	}
};
//#endregion
export { sessionsHandlers };
