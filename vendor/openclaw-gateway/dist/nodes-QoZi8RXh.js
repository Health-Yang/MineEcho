import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString, o as normalizeNullableString } from "./string-coerce-DKw2K5wM.js";
import { n as asNullableRecord } from "./record-coerce-Btbek4uV.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { h as normalizeUniqueTrimmedStringList } from "./string-normalization-B8G0vlWE.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import { i as GATEWAY_CLIENT_NAMES, r as GATEWAY_CLIENT_MODES } from "./client-info-BxgIUTRt.js";
import { Ii as ErrorCodes, Li as errorShape, St as validateNodeRenameParams, _t as validateNodePairVerifyParams, dt as validateNodeListParams, ft as validateNodePairApproveParams, gt as validateNodePairRequestParams, ht as validateNodePairRemoveParams, lt as validateNodeInvokeParams, mt as validateNodePairRejectParams, ot as validateNodeDescribeParams, pt as validateNodePairListParams, st as validateNodeEventParams, ut as validateNodeInvokeResultParams, vt as validateNodePendingAckParams } from "./protocol-BkfNT2Bp.js";
import { n as DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS } from "./plugin-approvals-C9xbHKhZ.js";
import { t as getActiveRuntimePluginRegistry } from "./active-runtime-registry-B4V2YD1G.js";
import { c as refreshClientPluginNodeCapability } from "./plugin-node-capability-C7GppvZZ.js";
import { a as normalizeDeclaredNodeCommands, n as isForegroundRestrictedPluginNodeCommand, o as resolveNodeCommandAllowlist, r as isNodeCommandAllowed } from "./node-command-policy-7dlnrPMy.js";
import { i as safeParseJson, n as respondUnavailableOnNodeInvokeError, r as respondUnavailableOnThrow, t as respondInvalidParams } from "./nodes.helpers-pWq0E7xD.js";
import { a as removePairedNode, i as rejectNodePairing, l as verifyNodeToken, o as renamePairedNode, r as listNodePairing, s as requestNodePairing, t as approveNodePairing } from "./node-pairing-BVmUcGRr.js";
import { i as recordRemoteNodeInfo, o as refreshRemoteNodeBins, s as removeRemoteNodeInfo } from "./skills-remote-D26P_2EB.js";
import { l as listDevicePairing } from "./device-pairing-3ziNdlg5.js";
import { a as matchSystemRunApprovalBinding, c as toSystemRunApprovalMismatchError, n as resolveSystemRunCommandRequest, o as missingSystemRunApprovalBinding, r as buildSystemRunApprovalBinding } from "./system-run-command-ByhmoDQa.js";
import { r as resolveSystemRunApprovalRuntimeContext } from "./system-run-approval-context-BSJdZXth.js";
import { a as resolveApnsAuthConfigFromEnv, d as resolveApnsRelayConfigFromEnv, n as loadApnsRegistration, o as sendApnsAlert, s as sendApnsBackgroundWake, t as clearApnsRegistrationIfCurrent, u as shouldClearStoredApnsRegistration } from "./push-apns-y_pm988l.js";
import { n as getKnownNode, r as listKnownNodes, t as createKnownNodeCatalog } from "./node-catalog-BDt3sPKN.js";
import { o as resolveApprovalRequestRecipientConnIds } from "./approval-shared-DcUd2XkA.js";
import { a as nodeWakeNudgeById, i as nodeWakeById, n as NODE_WAKE_RECONNECT_WAIT_MS, t as NODE_WAKE_RECONNECT_RETRY_WAIT_MS } from "./nodes-wake-state-D3Lnk3Xv.js";
import { randomUUID } from "node:crypto";
//#region src/gateway/node-invoke-plugin-policy.ts
function parseScopes(client) {
	return Array.isArray(client?.connect?.scopes) ? client.connect.scopes.filter((scope) => typeof scope === "string") : [];
}
function parsePayload(payloadJSON, payload) {
	if (!payloadJSON) return payload;
	try {
		return JSON.parse(payloadJSON);
	} catch {
		return payload;
	}
}
function findDangerousPluginNodeCommand(registry, command) {
	const normalizedCommand = command.trim();
	if (!normalizedCommand) return null;
	return registry?.nodeHostCommands?.find((entry) => entry.command.dangerous === true && entry.command.command.trim() === normalizedCommand) ?? null;
}
function createApprovalRuntime(params) {
	const manager = params.context.pluginApprovalManager;
	if (!manager) return;
	return { async request(input) {
		const timeoutMs = typeof input.timeoutMs === "number" && Number.isFinite(input.timeoutMs) ? input.timeoutMs : DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS;
		const request = {
			pluginId: params.pluginId,
			title: input.title.slice(0, 80),
			description: input.description.slice(0, 256),
			severity: input.severity ?? "warning",
			toolName: normalizeOptionalString(input.toolName) ?? null,
			toolCallId: normalizeOptionalString(input.toolCallId) ?? null,
			agentId: normalizeOptionalString(input.agentId) ?? null,
			sessionKey: normalizeOptionalString(input.sessionKey) ?? null
		};
		const record = manager.create(request, timeoutMs, `plugin:${randomUUID()}`);
		record.requestedByConnId = params.client?.connId ?? null;
		record.requestedByDeviceId = params.client?.connect?.device?.id ?? null;
		record.requestedByClientId = params.client?.connect?.client?.id ?? null;
		record.requestedByDeviceTokenAuth = params.client?.isDeviceTokenAuth === true;
		const decisionPromise = manager.register(record, timeoutMs);
		const requestEvent = {
			id: record.id,
			request: record.request,
			createdAtMs: record.createdAtMs,
			expiresAtMs: record.expiresAtMs
		};
		const approvalClientConnIds = resolveApprovalRequestRecipientConnIds({
			context: params.context,
			record,
			excludeConnId: params.client?.connId
		});
		if (approvalClientConnIds) params.context.broadcastToConnIds("plugin.approval.requested", requestEvent, approvalClientConnIds, { dropIfSlow: true });
		else params.context.broadcast("plugin.approval.requested", requestEvent, { dropIfSlow: true });
		if (!(approvalClientConnIds !== null ? approvalClientConnIds.size > 0 : params.context.hasExecApprovalClients?.(params.client?.connId) ?? false)) {
			manager.expire(record.id, "no-approval-route");
			return {
				id: record.id,
				decision: null
			};
		}
		const decision = await decisionPromise;
		return {
			id: record.id,
			decision
		};
	} };
}
async function applyPluginNodeInvokePolicy(params) {
	const registry = getActiveRuntimePluginRegistry();
	const entry = registry?.nodeInvokePolicies?.find((candidate) => candidate.policy.commands.includes(params.command));
	if (!entry) {
		const dangerousCommand = findDangerousPluginNodeCommand(registry, params.command);
		if (dangerousCommand) return {
			ok: false,
			code: "PLUGIN_POLICY_MISSING",
			message: `node.invoke ${params.command} is registered as dangerous by plugin ${dangerousCommand.pluginId} but has no plugin node.invoke policy`
		};
		return null;
	}
	const invokeNode = async (override = {}) => {
		const res = await params.context.nodeRegistry.invoke({
			nodeId: params.nodeSession.nodeId,
			command: params.command,
			params: override.params ?? params.params,
			timeoutMs: override.timeoutMs ?? params.timeoutMs,
			idempotencyKey: override.idempotencyKey ?? params.idempotencyKey
		});
		if (!res.ok) return {
			ok: false,
			code: res.error?.code,
			message: res.error?.message ?? "node command failed",
			details: { nodeError: res.error ?? null }
		};
		return {
			ok: true,
			payload: parsePayload(res.payloadJSON, res.payload),
			payloadJSON: res.payloadJSON ?? null
		};
	};
	return await entry.policy.handle({
		nodeId: params.nodeSession.nodeId,
		command: params.command,
		params: params.params,
		timeoutMs: params.timeoutMs,
		idempotencyKey: params.idempotencyKey,
		config: params.context.getRuntimeConfig(),
		pluginConfig: entry.pluginConfig,
		node: {
			nodeId: params.nodeSession.nodeId,
			displayName: params.nodeSession.displayName,
			platform: params.nodeSession.platform,
			deviceFamily: params.nodeSession.deviceFamily,
			commands: params.nodeSession.commands
		},
		client: params.client ? {
			connId: params.client.connId,
			scopes: parseScopes(params.client)
		} : null,
		approvals: createApprovalRuntime({
			context: params.context,
			client: params.client,
			pluginId: entry.pluginId
		}),
		invokeNode
	});
}
//#endregion
//#region src/gateway/node-invoke-system-run-approval-errors.ts
function systemRunApprovalGuardError(params) {
	const details = params.details ? { ...params.details } : {};
	return {
		ok: false,
		message: params.message,
		details: {
			code: params.code,
			...details
		}
	};
}
function systemRunApprovalRequired(runId) {
	return systemRunApprovalGuardError({
		code: "APPROVAL_REQUIRED",
		message: "approval required",
		details: { runId }
	});
}
//#endregion
//#region src/gateway/node-invoke-system-run-approval-match.ts
function requestMismatch() {
	return {
		ok: false,
		code: "APPROVAL_REQUEST_MISMATCH",
		message: "approval id does not match request"
	};
}
function evaluateSystemRunApprovalMatch(params) {
	if (params.request.host !== "node") return requestMismatch();
	const actualBinding = buildSystemRunApprovalBinding({
		argv: params.argv,
		cwd: params.binding.cwd,
		agentId: params.binding.agentId,
		sessionKey: params.binding.sessionKey,
		env: params.binding.env
	});
	const expectedBinding = params.request.systemRunBinding;
	if (!expectedBinding) return missingSystemRunApprovalBinding({ actualEnvKeys: actualBinding.envKeys });
	return matchSystemRunApprovalBinding({
		expected: expectedBinding,
		actual: actualBinding.binding,
		actualEnvKeys: actualBinding.envKeys
	});
}
//#endregion
//#region src/gateway/node-invoke-system-run-approval.ts
const BACKEND_BRIDGEABLE_NO_DEVICE_REQUEST_CLIENT_IDS = new Set([
	GATEWAY_CLIENT_NAMES.CONTROL_UI,
	GATEWAY_CLIENT_NAMES.WEBCHAT_UI,
	GATEWAY_CLIENT_NAMES.WEBCHAT,
	GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT
]);
function normalizeApprovalDecision(value) {
	const s = normalizeNullableString(value);
	return s === "allow-once" || s === "allow-always" ? s : null;
}
function clientHasApprovals(client) {
	const scopes = Array.isArray(client?.connect?.scopes) ? client?.connect?.scopes : [];
	return scopes.includes("operator.admin") || scopes.includes("operator.approvals");
}
function isTrustedBackendApprovalClient(client) {
	return clientHasApprovals(client) && client?.connect?.client?.id === GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT && client.connect.client.mode === GATEWAY_CLIENT_MODES.BACKEND && client.isDeviceTokenAuth !== true;
}
function canBridgeNoDeviceApprovalFromBackend(params) {
	const requestedByClientId = normalizeNullableString(params.snapshot.requestedByClientId);
	const request = params.snapshot.request;
	return params.snapshot.requestedByDeviceId == null && params.snapshot.requestedByDeviceTokenAuth !== true && !hasChatApprovalReplayBinding(request) && requestedByClientId !== null && BACKEND_BRIDGEABLE_NO_DEVICE_REQUEST_CLIENT_IDS.has(requestedByClientId) && isTrustedBackendApprovalClient(params.client);
}
function hasChatApprovalReplayBinding(request) {
	return normalizeComparableString(request.turnSourceChannel, { lowercase: true }) !== null || normalizeComparableString(request.turnSourceTo) !== null || normalizeComparableString(request.turnSourceAccountId) !== null || normalizeComparableString(request.turnSourceThreadId) !== null;
}
function normalizeComparableString(value, opts = {}) {
	const normalized = typeof value === "number" && Number.isFinite(value) ? String(value) : normalizeNullableString(value);
	if (!normalized) return null;
	return opts.lowercase ? normalized.toLowerCase() : normalized;
}
function matchesRequiredString(params) {
	const expected = normalizeComparableString(params.expected, { lowercase: params.lowercase });
	if (!expected) return false;
	return expected === normalizeComparableString(params.actual, { lowercase: params.lowercase });
}
function matchesOptionalString(params) {
	const expected = normalizeComparableString(params.expected, { lowercase: params.lowercase });
	if (!expected) return true;
	return expected === normalizeComparableString(params.actual, { lowercase: params.lowercase });
}
function canBridgeNoDeviceChatApprovalFromBackend(params) {
	if (params.snapshot.requestedByDeviceId != null || params.snapshot.requestedByDeviceTokenAuth === true || !isTrustedBackendApprovalClient(params.client)) return false;
	const request = params.snapshot.request;
	const plan = request.systemRunPlan ?? null;
	return matchesRequiredString({
		expected: request.turnSourceChannel,
		actual: params.rawParams.turnSourceChannel,
		lowercase: true
	}) && matchesOptionalString({
		expected: request.turnSourceTo,
		actual: params.rawParams.turnSourceTo
	}) && matchesRequiredString({
		expected: plan?.sessionKey ?? request.sessionKey,
		actual: params.rawParams.sessionKey
	}) && matchesOptionalString({
		expected: plan?.agentId ?? request.agentId,
		actual: params.rawParams.agentId
	}) && matchesOptionalString({
		expected: request.turnSourceAccountId,
		actual: params.rawParams.turnSourceAccountId
	}) && matchesOptionalString({
		expected: request.turnSourceThreadId,
		actual: params.rawParams.turnSourceThreadId
	});
}
function pickSystemRunParams(raw) {
	const next = {};
	for (const key of [
		"command",
		"rawCommand",
		"systemRunPlan",
		"cwd",
		"env",
		"timeoutMs",
		"needsScreenRecording",
		"agentId",
		"sessionKey",
		"runId",
		"suppressNotifyOnExit"
	]) if (key in raw) next[key] = raw[key];
	return next;
}
/**
* Gate `system.run` approval flags (`approved`, `approvalDecision`) behind a real
* `exec.approval.*` record. This prevents users with only `operator.write` from
* bypassing node-host approvals by injecting control fields into `node.invoke`.
*/
function sanitizeSystemRunParamsForForwarding(opts) {
	const obj = asNullableRecord(opts.rawParams);
	if (!obj) return {
		ok: true,
		params: opts.rawParams
	};
	const p = obj;
	const approved = p.approved === true;
	const requestedDecision = normalizeApprovalDecision(p.approvalDecision);
	const wantsApprovalOverride = approved || requestedDecision !== null;
	const next = pickSystemRunParams(obj);
	if (!wantsApprovalOverride) {
		const cmdTextResolution = resolveSystemRunCommandRequest({
			command: p.command,
			rawCommand: p.rawCommand
		});
		if (!cmdTextResolution.ok) return {
			ok: false,
			message: cmdTextResolution.message,
			details: cmdTextResolution.details
		};
		return {
			ok: true,
			params: next
		};
	}
	const runId = normalizeNullableString(p.runId);
	if (!runId) return systemRunApprovalGuardError({
		code: "MISSING_RUN_ID",
		message: "approval override requires params.runId"
	});
	const manager = opts.execApprovalManager;
	if (!manager) return systemRunApprovalGuardError({
		code: "APPROVALS_UNAVAILABLE",
		message: "exec approvals unavailable"
	});
	const snapshot = manager.getSnapshot(runId);
	if (!snapshot) return systemRunApprovalGuardError({
		code: "UNKNOWN_APPROVAL_ID",
		message: "unknown or expired approval id",
		details: { runId }
	});
	if ((typeof opts.nowMs === "number" ? opts.nowMs : Date.now()) > snapshot.expiresAtMs) return systemRunApprovalGuardError({
		code: "APPROVAL_EXPIRED",
		message: "approval expired",
		details: { runId }
	});
	const targetNodeId = normalizeNullableString(opts.nodeId);
	if (!targetNodeId) return systemRunApprovalGuardError({
		code: "MISSING_NODE_ID",
		message: "node.invoke requires nodeId",
		details: { runId }
	});
	const approvalNodeId = normalizeNullableString(snapshot.request.nodeId);
	if (!approvalNodeId) return systemRunApprovalGuardError({
		code: "APPROVAL_NODE_BINDING_MISSING",
		message: "approval id missing node binding",
		details: { runId }
	});
	if (approvalNodeId !== targetNodeId) return systemRunApprovalGuardError({
		code: "APPROVAL_NODE_MISMATCH",
		message: "approval id not valid for this node",
		details: { runId }
	});
	const snapshotDeviceId = snapshot.requestedByDeviceId ?? null;
	const clientDeviceId = opts.client?.connect?.device?.id ?? null;
	if (snapshotDeviceId) {
		if (snapshotDeviceId !== clientDeviceId) return systemRunApprovalGuardError({
			code: "APPROVAL_DEVICE_MISMATCH",
			message: "approval id not valid for this device",
			details: { runId }
		});
	} else if (snapshot.requestedByConnId && snapshot.requestedByConnId !== (opts.client?.connId ?? null) && !canBridgeNoDeviceApprovalFromBackend({
		snapshot,
		client: opts.client
	}) && !canBridgeNoDeviceChatApprovalFromBackend({
		snapshot,
		rawParams: p,
		client: opts.client
	})) return systemRunApprovalGuardError({
		code: "APPROVAL_CLIENT_MISMATCH",
		message: "approval id not valid for this client",
		details: { runId }
	});
	const runtimeContext = resolveSystemRunApprovalRuntimeContext({
		plan: snapshot.request.systemRunPlan ?? null,
		command: p.command,
		rawCommand: p.rawCommand,
		cwd: p.cwd,
		agentId: p.agentId,
		sessionKey: p.sessionKey
	});
	if (!runtimeContext.ok) return {
		ok: false,
		message: runtimeContext.message,
		details: runtimeContext.details
	};
	if (runtimeContext.plan) {
		next.command = [...runtimeContext.plan.argv];
		next.systemRunPlan = runtimeContext.plan;
		if (runtimeContext.commandText) next.rawCommand = runtimeContext.commandText;
		else delete next.rawCommand;
		if (runtimeContext.cwd) next.cwd = runtimeContext.cwd;
		else delete next.cwd;
		if (runtimeContext.agentId) next.agentId = runtimeContext.agentId;
		else delete next.agentId;
		if (runtimeContext.sessionKey) next.sessionKey = runtimeContext.sessionKey;
		else delete next.sessionKey;
	}
	const approvalMatch = evaluateSystemRunApprovalMatch({
		argv: runtimeContext.argv,
		request: snapshot.request,
		binding: {
			cwd: runtimeContext.cwd,
			agentId: runtimeContext.agentId,
			sessionKey: runtimeContext.sessionKey,
			env: p.env
		}
	});
	if (!approvalMatch.ok) return toSystemRunApprovalMismatchError({
		runId,
		match: approvalMatch
	});
	if (snapshot.decision === "allow-once") {
		if (typeof manager.consumeAllowOnce !== "function" || !manager.consumeAllowOnce(runId)) return systemRunApprovalRequired(runId);
		next.approved = true;
		next.approvalDecision = "allow-once";
		return {
			ok: true,
			params: next
		};
	}
	if (snapshot.decision === "allow-always") {
		next.approved = true;
		next.approvalDecision = "allow-always";
		return {
			ok: true,
			params: next
		};
	}
	if (snapshot.resolvedAtMs !== void 0 && snapshot.decision === void 0 && snapshot.resolvedBy === null && approved && requestedDecision === "allow-once" && clientHasApprovals(opts.client)) {
		next.approved = true;
		next.approvalDecision = "allow-once";
		return {
			ok: true,
			params: next
		};
	}
	return systemRunApprovalRequired(runId);
}
//#endregion
//#region src/gateway/node-invoke-sanitize.ts
function sanitizeNodeInvokeParamsForForwarding(opts) {
	if (opts.command === "system.run") return sanitizeSystemRunParamsForForwarding({
		nodeId: opts.nodeId,
		rawParams: opts.rawParams,
		client: opts.client,
		execApprovalManager: opts.execApprovalManager
	});
	return {
		ok: true,
		params: opts.rawParams
	};
}
//#endregion
//#region src/gateway/server-methods/nodes.handlers.invoke-result.ts
function normalizeNodeInvokeResultParams(params) {
	if (!params || typeof params !== "object") return params;
	const normalized = { ...params };
	if (normalized.payloadJSON === null) delete normalized.payloadJSON;
	else if (normalized.payloadJSON !== void 0 && typeof normalized.payloadJSON !== "string") {
		if (normalized.payload === void 0) normalized.payload = normalized.payloadJSON;
		delete normalized.payloadJSON;
	}
	if (normalized.error === null) delete normalized.error;
	return normalized;
}
const handleNodeInvokeResult = async ({ params, respond, context, client }) => {
	const normalizedParams = normalizeNodeInvokeResultParams(params);
	if (!validateNodeInvokeResultParams(normalizedParams)) {
		respondInvalidParams({
			respond,
			method: "node.invoke.result",
			validator: validateNodeInvokeResultParams
		});
		return;
	}
	const p = normalizedParams;
	const callerNodeId = client?.connect?.device?.id ?? client?.connect?.client?.id;
	if (callerNodeId && callerNodeId !== p.nodeId) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "nodeId mismatch"));
		return;
	}
	if (!context.nodeRegistry.handleInvokeResult({
		id: p.id,
		nodeId: p.nodeId,
		connId: client?.connId,
		ok: p.ok,
		payload: p.payload,
		payloadJSON: p.payloadJSON ?? null,
		error: p.error ?? null
	})) {
		context.logGateway.debug(`late invoke result ignored: id=${p.id} node=${p.nodeId}`);
		respond(true, {
			ok: true,
			ignored: true
		}, void 0);
		return;
	}
	respond(true, { ok: true }, void 0);
};
//#endregion
//#region src/gateway/server-methods/nodes.ts
const NODE_WAKE_THROTTLE_MS = 15e3;
const NODE_WAKE_NUDGE_THROTTLE_MS = 10 * 6e4;
const NODE_PENDING_ACTION_TTL_MS = 10 * 6e4;
const NODE_PENDING_ACTION_MAX_PER_NODE = 64;
const TALK_PTT_COMMANDS = new Set([
	"talk.ptt.start",
	"talk.ptt.stop",
	"talk.ptt.cancel",
	"talk.ptt.once"
]);
const talkPttEventSeqBySessionId = /* @__PURE__ */ new Map();
const pendingNodeActionsById = /* @__PURE__ */ new Map();
function normalizeBrowserProxyPath(value) {
	const trimmed = value.trim();
	if (!trimmed) return trimmed;
	const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
	if (withLeadingSlash.length <= 1) return withLeadingSlash;
	return withLeadingSlash.replace(/\/+$/, "");
}
function isPersistentBrowserProxyMutation(method, path) {
	const normalizedPath = normalizeBrowserProxyPath(path);
	if (method === "POST" && (normalizedPath === "/profiles/create" || normalizedPath === "/reset-profile")) return true;
	return method === "DELETE" && /^\/profiles\/[^/]+$/.test(normalizedPath);
}
function isForbiddenBrowserProxyMutation(params) {
	if (!params || typeof params !== "object") return false;
	const candidate = params;
	const method = (normalizeOptionalString(candidate.method) ?? "").toUpperCase();
	const path = normalizeOptionalString(candidate.path) ?? "";
	return Boolean(method && path && isPersistentBrowserProxyMutation(method, path));
}
function normalizePluginSurfaceRefreshParams(params) {
	if (!params || typeof params !== "object") return;
	const surface = normalizeOptionalString(params.surface);
	if (!surface) return;
	return { surface };
}
function respondRefreshedPluginSurface(params) {
	const refreshed = params.client ? refreshClientPluginNodeCapability({
		client: params.client,
		surface: params.client.pluginNodeCapabilitySurfaces?.[params.surface] ?? { surface: params.surface }
	}) : void 0;
	if (!refreshed) {
		params.respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, `${params.surface} plugin surface unavailable`));
		return;
	}
	params.respond(true, {
		surface: refreshed.surface,
		pluginSurfaceUrls: { [refreshed.surface]: refreshed.scopedUrl },
		expiresAtMs: refreshed.expiresAtMs
	}, void 0);
}
async function resolveDirectNodePushConfig() {
	const auth = await resolveApnsAuthConfigFromEnv(process.env);
	return auth.ok ? {
		ok: true,
		auth: auth.value
	} : {
		ok: false,
		error: auth.error
	};
}
function resolveRelayNodePushConfig(cfg) {
	const relay = resolveApnsRelayConfigFromEnv(process.env, cfg.gateway);
	return relay.ok ? {
		ok: true,
		relayConfig: relay.value
	} : {
		ok: false,
		error: relay.error
	};
}
async function clearStaleApnsRegistrationIfNeeded(registration, nodeId, params) {
	if (!shouldClearStoredApnsRegistration({
		registration,
		result: params
	})) return;
	await clearApnsRegistrationIfCurrent({
		nodeId,
		registration
	});
}
async function delayMs(ms) {
	await new Promise((resolve) => setTimeout(resolve, ms));
}
function isForegroundRestrictedIosCommand(command) {
	return isForegroundRestrictedPluginNodeCommand(command) || command.startsWith("camera.") || command.startsWith("screen.") || command.startsWith("talk.");
}
function shouldQueueAsPendingForegroundAction(params) {
	const platform = normalizeLowercaseStringOrEmpty(params.platform);
	if (!platform.startsWith("ios") && !platform.startsWith("ipados")) return false;
	if (!isForegroundRestrictedIosCommand(params.command)) return false;
	const error = params.error && typeof params.error === "object" ? params.error : null;
	const code = normalizeOptionalString(error?.code)?.toUpperCase() ?? "";
	const message = normalizeOptionalString(error?.message)?.toUpperCase() ?? "";
	return code === "NODE_BACKGROUND_UNAVAILABLE" || message.includes("BACKGROUND_UNAVAILABLE");
}
function prunePendingNodeActions(nodeId, nowMs) {
	const queue = pendingNodeActionsById.get(nodeId) ?? [];
	const minTimestampMs = nowMs - NODE_PENDING_ACTION_TTL_MS;
	const live = queue.filter((entry) => entry.enqueuedAtMs >= minTimestampMs);
	if (live.length === 0) {
		pendingNodeActionsById.delete(nodeId);
		return [];
	}
	pendingNodeActionsById.set(nodeId, live);
	return live;
}
function enqueuePendingNodeAction(params) {
	const nowMs = Date.now();
	const queue = prunePendingNodeActions(params.nodeId, nowMs);
	const existing = queue.find((entry) => entry.idempotencyKey === params.idempotencyKey);
	if (existing) return existing;
	const entry = {
		id: randomUUID(),
		nodeId: params.nodeId,
		command: params.command,
		paramsJSON: params.paramsJSON,
		idempotencyKey: params.idempotencyKey,
		enqueuedAtMs: nowMs
	};
	queue.push(entry);
	if (queue.length > NODE_PENDING_ACTION_MAX_PER_NODE) queue.splice(0, queue.length - NODE_PENDING_ACTION_MAX_PER_NODE);
	pendingNodeActionsById.set(params.nodeId, queue);
	return entry;
}
function listPendingNodeActions(nodeId) {
	return prunePendingNodeActions(nodeId, Date.now());
}
function refreshConnectedNodeSurfaceCaches(params) {
	const cfg = params.cfg ?? params.context.getRuntimeConfig();
	const { nodeSession } = params;
	recordRemoteNodeInfo({
		nodeId: nodeSession.nodeId,
		displayName: nodeSession.displayName,
		platform: nodeSession.platform,
		deviceFamily: nodeSession.deviceFamily,
		commands: nodeSession.commands,
		remoteIp: nodeSession.remoteIp
	});
	refreshRemoteNodeBins({
		nodeId: nodeSession.nodeId,
		platform: nodeSession.platform,
		deviceFamily: nodeSession.deviceFamily,
		commands: nodeSession.commands,
		cfg
	}).catch((err) => params.context.logGateway.warn(`remote bin probe failed for ${nodeSession.nodeId}: ${formatErrorMessage(err)}`));
}
function resolveAllowedPendingNodeActions(params) {
	const pending = listPendingNodeActions(params.nodeId);
	if (pending.length === 0) return pending;
	const connect = params.client?.connect;
	const declaredCommands = Array.isArray(connect?.commands) ? connect.commands : [];
	const allowlist = resolveNodeCommandAllowlist(params.cfg, {
		platform: connect?.client?.platform,
		deviceFamily: connect?.client?.deviceFamily,
		caps: connect?.caps,
		commands: declaredCommands
	});
	const allowed = pending.filter((entry) => {
		return isNodeCommandAllowed({
			command: entry.command,
			declaredCommands,
			allowlist
		}).ok;
	});
	if (allowed.length !== pending.length) if (allowed.length === 0) pendingNodeActionsById.delete(params.nodeId);
	else pendingNodeActionsById.set(params.nodeId, allowed);
	return allowed;
}
function ackPendingNodeActions(nodeId, ids) {
	if (ids.length === 0) return listPendingNodeActions(nodeId);
	const pending = prunePendingNodeActions(nodeId, Date.now());
	const idSet = new Set(ids);
	const remaining = pending.filter((entry) => !idSet.has(entry.id));
	if (remaining.length === 0) {
		pendingNodeActionsById.delete(nodeId);
		return [];
	}
	pendingNodeActionsById.set(nodeId, remaining);
	return remaining;
}
function toPendingParamsJSON(params) {
	if (params === void 0) return;
	try {
		return JSON.stringify(params);
	} catch {
		return;
	}
}
function emitTalkPttNodeEvent(params) {
	if (!TALK_PTT_COMMANDS.has(params.command)) return;
	const payloadObj = typeof params.payload === "object" && params.payload !== null ? params.payload : {};
	const captureId = normalizeOptionalString(payloadObj.captureId) ?? randomUUID();
	const sessionId = `node:${params.nodeId}:talk:${captureId}`;
	const seq = (talkPttEventSeqBySessionId.get(sessionId) ?? 0) + 1;
	talkPttEventSeqBySessionId.set(sessionId, seq);
	while (talkPttEventSeqBySessionId.size > 2048) {
		const oldest = talkPttEventSeqBySessionId.keys().next().value;
		if (oldest === void 0) break;
		talkPttEventSeqBySessionId.delete(oldest);
	}
	const type = params.command === "talk.ptt.start" ? "capture.started" : params.command === "talk.ptt.cancel" ? "capture.cancelled" : params.command === "talk.ptt.once" ? "capture.once" : "capture.stopped";
	const final = params.command !== "talk.ptt.start";
	const talkEvent = {
		id: `${sessionId}:${seq}`,
		type,
		sessionId,
		captureId,
		seq,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		mode: "stt-tts",
		transport: "managed-room",
		brain: "agent-consult",
		final,
		payload: {
			nodeId: params.nodeId,
			command: params.command,
			status: normalizeOptionalString(payloadObj.status) ?? void 0,
			transcript: normalizeOptionalString(payloadObj.transcript) ?? void 0
		}
	};
	params.context.broadcast("talk.event", {
		nodeId: params.nodeId,
		command: params.command,
		talkEvent
	}, { dropIfSlow: true });
}
async function maybeWakeNodeWithApns(nodeId, opts) {
	const state = nodeWakeById.get(nodeId) ?? { lastWakeAtMs: 0 };
	nodeWakeById.set(nodeId, state);
	if (state.inFlight) return await state.inFlight;
	const now = Date.now();
	if (!(opts?.force === true) && state.lastWakeAtMs > 0 && now - state.lastWakeAtMs < NODE_WAKE_THROTTLE_MS) return {
		available: true,
		throttled: true,
		path: "throttled",
		durationMs: 0
	};
	state.inFlight = (async () => {
		const startedAtMs = Date.now();
		const withDuration = (attempt) => ({
			...attempt,
			durationMs: Math.max(0, Date.now() - startedAtMs)
		});
		try {
			const registration = await loadApnsRegistration(nodeId);
			if (!registration) {
				nodeWakeById.delete(nodeId);
				return withDuration({
					available: false,
					throttled: false,
					path: "no-registration"
				});
			}
			let wakeResult;
			if (registration.transport === "relay") {
				const relay = resolveRelayNodePushConfig(opts?.cfg ?? getRuntimeConfig());
				if (!relay.ok) return withDuration({
					available: false,
					throttled: false,
					path: "no-auth",
					apnsReason: relay.error
				});
				state.lastWakeAtMs = Date.now();
				wakeResult = await sendApnsBackgroundWake({
					registration,
					nodeId,
					wakeReason: opts?.wakeReason ?? "node.invoke",
					relayConfig: relay.relayConfig
				});
			} else {
				const auth = await resolveDirectNodePushConfig();
				if (!auth.ok) return withDuration({
					available: false,
					throttled: false,
					path: "no-auth",
					apnsReason: auth.error
				});
				state.lastWakeAtMs = Date.now();
				wakeResult = await sendApnsBackgroundWake({
					registration,
					nodeId,
					wakeReason: opts?.wakeReason ?? "node.invoke",
					auth: auth.auth
				});
			}
			await clearStaleApnsRegistrationIfNeeded(registration, nodeId, wakeResult);
			if (!wakeResult.ok) return withDuration({
				available: true,
				throttled: false,
				path: "send-error",
				apnsStatus: wakeResult.status,
				apnsReason: wakeResult.reason
			});
			return withDuration({
				available: true,
				throttled: false,
				path: "sent",
				apnsStatus: wakeResult.status,
				apnsReason: wakeResult.reason
			});
		} catch (err) {
			const message = formatErrorMessage(err);
			if (state.lastWakeAtMs === 0) return withDuration({
				available: false,
				throttled: false,
				path: "send-error",
				apnsReason: message
			});
			return withDuration({
				available: true,
				throttled: false,
				path: "send-error",
				apnsReason: message
			});
		}
	})();
	try {
		return await state.inFlight;
	} finally {
		state.inFlight = void 0;
	}
}
async function maybeSendNodeWakeNudge(nodeId, opts) {
	const startedAtMs = Date.now();
	const withDuration = (attempt) => ({
		...attempt,
		durationMs: Math.max(0, Date.now() - startedAtMs)
	});
	const lastNudgeAtMs = nodeWakeNudgeById.get(nodeId) ?? 0;
	if (lastNudgeAtMs > 0 && Date.now() - lastNudgeAtMs < NODE_WAKE_NUDGE_THROTTLE_MS) return withDuration({
		sent: false,
		throttled: true,
		reason: "throttled"
	});
	const registration = await loadApnsRegistration(nodeId);
	if (!registration) return withDuration({
		sent: false,
		throttled: false,
		reason: "no-registration"
	});
	try {
		let result;
		if (registration.transport === "relay") {
			const relay = resolveRelayNodePushConfig(opts?.cfg ?? getRuntimeConfig());
			if (!relay.ok) return withDuration({
				sent: false,
				throttled: false,
				reason: "no-auth",
				apnsReason: relay.error
			});
			result = await sendApnsAlert({
				registration,
				nodeId,
				title: "OpenClaw needs a quick reopen",
				body: "Tap to reopen OpenClaw and restore the node connection.",
				relayConfig: relay.relayConfig
			});
		} else {
			const auth = await resolveDirectNodePushConfig();
			if (!auth.ok) return withDuration({
				sent: false,
				throttled: false,
				reason: "no-auth",
				apnsReason: auth.error
			});
			result = await sendApnsAlert({
				registration,
				nodeId,
				title: "OpenClaw needs a quick reopen",
				body: "Tap to reopen OpenClaw and restore the node connection.",
				auth: auth.auth
			});
		}
		await clearStaleApnsRegistrationIfNeeded(registration, nodeId, result);
		if (!result.ok) return withDuration({
			sent: false,
			throttled: false,
			reason: "apns-not-ok",
			apnsStatus: result.status,
			apnsReason: result.reason
		});
		nodeWakeNudgeById.set(nodeId, Date.now());
		return withDuration({
			sent: true,
			throttled: false,
			reason: "sent",
			apnsStatus: result.status,
			apnsReason: result.reason
		});
	} catch (err) {
		return withDuration({
			sent: false,
			throttled: false,
			reason: "send-error",
			apnsReason: formatErrorMessage(err)
		});
	}
}
async function waitForNodeReconnect(params) {
	const timeoutMs = Math.max(250, params.timeoutMs ?? 3e3);
	const pollMs = Math.max(50, params.pollMs ?? 150);
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (params.context.nodeRegistry.get(params.nodeId)) return true;
		await delayMs(pollMs);
	}
	return Boolean(params.context.nodeRegistry.get(params.nodeId));
}
const nodeHandlers = {
	"node.pair.request": async ({ params, respond, context }) => {
		if (!validateNodePairRequestParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pair.request",
				validator: validateNodePairRequestParams
			});
			return;
		}
		const p = params;
		await respondUnavailableOnThrow(respond, async () => {
			const result = await requestNodePairing({
				nodeId: p.nodeId,
				displayName: p.displayName,
				platform: p.platform,
				version: p.version,
				coreVersion: p.coreVersion,
				uiVersion: p.uiVersion,
				deviceFamily: p.deviceFamily,
				modelIdentifier: p.modelIdentifier,
				caps: p.caps,
				commands: p.commands,
				permissions: p.permissions,
				remoteIp: p.remoteIp,
				silent: p.silent
			});
			const resolvedAt = Date.now();
			for (const superseded of result.superseded ?? []) context.broadcast("node.pair.resolved", {
				requestId: superseded.requestId,
				nodeId: superseded.nodeId,
				decision: "rejected",
				ts: resolvedAt
			}, { dropIfSlow: true });
			if (result.status === "pending" && result.created) context.broadcast("node.pair.requested", result.request, { dropIfSlow: true });
			respond(true, result, void 0);
		});
	},
	"node.pair.list": async ({ params, respond }) => {
		if (!validateNodePairListParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pair.list",
				validator: validateNodePairListParams
			});
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			respond(true, await listNodePairing(), void 0);
		});
	},
	"node.pair.approve": async ({ params, respond, context, client }) => {
		if (!validateNodePairApproveParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pair.approve",
				validator: validateNodePairApproveParams
			});
			return;
		}
		const { requestId } = params;
		const callerScopes = Array.isArray(client?.connect?.scopes) ? client.connect.scopes : [];
		await respondUnavailableOnThrow(respond, async () => {
			const approved = await approveNodePairing(requestId, { callerScopes });
			if (!approved) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown requestId"));
				return;
			}
			if ("status" in approved && approved.status === "forbidden") {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `missing scope: ${approved.missingScope}`));
				return;
			}
			if (!("node" in approved)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown requestId"));
				return;
			}
			const approvedNode = approved.node;
			const cfg = context.getRuntimeConfig();
			const currentAllowlist = resolveNodeCommandAllowlist(cfg, {
				platform: approvedNode.platform,
				deviceFamily: approvedNode.deviceFamily,
				caps: approvedNode.caps,
				commands: approvedNode.commands,
				approvedCommands: approvedNode.commands
			});
			const currentAllowedCommands = normalizeDeclaredNodeCommands({
				declaredCommands: approvedNode.commands ?? [],
				allowlist: currentAllowlist
			});
			const updatedNode = context.nodeRegistry.updateSurface(approvedNode.nodeId, {
				caps: approvedNode.caps ?? [],
				commands: currentAllowedCommands,
				permissions: approvedNode.permissions
			});
			if (updatedNode) refreshConnectedNodeSurfaceCaches({
				context,
				nodeSession: updatedNode,
				cfg
			});
			context.broadcast("node.pair.resolved", {
				requestId,
				nodeId: approvedNode.nodeId,
				decision: "approved",
				ts: Date.now()
			}, { dropIfSlow: true });
			respond(true, approved, void 0);
		});
	},
	"node.pair.reject": async ({ params, respond, context }) => {
		if (!validateNodePairRejectParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pair.reject",
				validator: validateNodePairRejectParams
			});
			return;
		}
		const { requestId } = params;
		await respondUnavailableOnThrow(respond, async () => {
			const rejected = await rejectNodePairing(requestId);
			if (!rejected) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown requestId"));
				return;
			}
			context.broadcast("node.pair.resolved", {
				requestId,
				nodeId: rejected.nodeId,
				decision: "rejected",
				ts: Date.now()
			}, { dropIfSlow: true });
			respond(true, rejected, void 0);
		});
	},
	"node.pair.remove": async ({ params, respond, context }) => {
		if (!validateNodePairRemoveParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pair.remove",
				validator: validateNodePairRemoveParams
			});
			return;
		}
		const { nodeId } = params;
		await respondUnavailableOnThrow(respond, async () => {
			const removed = await removePairedNode(nodeId);
			if (!removed) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
				return;
			}
			pendingNodeActionsById.delete(removed.nodeId);
			context.nodeRegistry.updateSurface(removed.nodeId, {
				caps: [],
				commands: [],
				permissions: void 0
			});
			removeRemoteNodeInfo(removed.nodeId);
			context.broadcast("node.pair.resolved", {
				requestId: "",
				nodeId: removed.nodeId,
				decision: "removed",
				ts: Date.now()
			}, { dropIfSlow: true });
			respond(true, removed, void 0);
		});
	},
	"node.pair.verify": async ({ params, respond }) => {
		if (!validateNodePairVerifyParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pair.verify",
				validator: validateNodePairVerifyParams
			});
			return;
		}
		const { nodeId, token } = params;
		await respondUnavailableOnThrow(respond, async () => {
			respond(true, await verifyNodeToken(nodeId, token), void 0);
		});
	},
	"node.rename": async ({ params, respond }) => {
		if (!validateNodeRenameParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.rename",
				validator: validateNodeRenameParams
			});
			return;
		}
		const { nodeId, displayName } = params;
		await respondUnavailableOnThrow(respond, async () => {
			const trimmed = displayName.trim();
			if (!trimmed) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "displayName required"));
				return;
			}
			const updated = await renamePairedNode(nodeId, trimmed);
			if (!updated) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
				return;
			}
			respond(true, {
				nodeId: updated.nodeId,
				displayName: updated.displayName
			}, void 0);
		});
	},
	"node.list": async ({ params, respond, context }) => {
		if (!validateNodeListParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.list",
				validator: validateNodeListParams
			});
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			const [devicePairing, nodePairing] = await Promise.all([listDevicePairing(), listNodePairing()]);
			const nodes = listKnownNodes(createKnownNodeCatalog({
				pairedDevices: devicePairing.paired,
				pairedNodes: nodePairing.paired,
				connectedNodes: context.nodeRegistry.listConnected()
			}));
			respond(true, {
				ts: Date.now(),
				nodes
			}, void 0);
		});
	},
	"node.describe": async ({ params, respond, context }) => {
		if (!validateNodeDescribeParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.describe",
				validator: validateNodeDescribeParams
			});
			return;
		}
		const { nodeId } = params;
		const id = normalizeOptionalString(nodeId) ?? "";
		if (!id) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			const [devicePairing, nodePairing] = await Promise.all([listDevicePairing(), listNodePairing()]);
			const node = getKnownNode(createKnownNodeCatalog({
				pairedDevices: devicePairing.paired,
				pairedNodes: nodePairing.paired,
				connectedNodes: context.nodeRegistry.listConnected()
			}), id);
			if (!node) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown nodeId"));
				return;
			}
			respond(true, {
				ts: Date.now(),
				...node
			}, void 0);
		});
	},
	"node.pluginSurface.refresh": async ({ params, respond, client }) => {
		const parsed = normalizePluginSurfaceRefreshParams(params);
		if (!parsed) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "surface required"));
			return;
		}
		respondRefreshedPluginSurface({
			surface: parsed.surface,
			client,
			respond
		});
	},
	"node.pending.pull": async ({ params, respond, client, context }) => {
		if (!validateNodeListParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pending.pull",
				validator: validateNodeListParams
			});
			return;
		}
		const trimmedNodeId = normalizeOptionalString(client?.connect?.device?.id ?? client?.connect?.client?.id) ?? "";
		if (!trimmedNodeId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		respond(true, {
			nodeId: trimmedNodeId,
			actions: resolveAllowedPendingNodeActions({
				nodeId: trimmedNodeId,
				client,
				cfg: context.getRuntimeConfig()
			}).map((entry) => ({
				id: entry.id,
				command: entry.command,
				paramsJSON: entry.paramsJSON ?? null,
				enqueuedAtMs: entry.enqueuedAtMs
			}))
		}, void 0);
	},
	"node.pending.ack": async ({ params, respond, client }) => {
		if (!validateNodePendingAckParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.pending.ack",
				validator: validateNodePendingAckParams
			});
			return;
		}
		const trimmedNodeId = normalizeOptionalString(client?.connect?.device?.id ?? client?.connect?.client?.id) ?? "";
		if (!trimmedNodeId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "nodeId required"));
			return;
		}
		const ackIds = normalizeUniqueTrimmedStringList(params.ids);
		respond(true, {
			nodeId: trimmedNodeId,
			ackedIds: ackIds,
			remainingCount: ackPendingNodeActions(trimmedNodeId, ackIds).length
		}, void 0);
	},
	"node.invoke": async ({ params, respond, context, client, req }) => {
		if (!validateNodeInvokeParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.invoke",
				validator: validateNodeInvokeParams
			});
			return;
		}
		const p = params;
		const nodeId = normalizeOptionalString(p.nodeId) ?? "";
		const command = normalizeOptionalString(p.command) ?? "";
		if (!nodeId || !command) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "nodeId and command required"));
			return;
		}
		if (command === "system.execApprovals.get" || command === "system.execApprovals.set") {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "node.invoke does not allow system.execApprovals.*; use exec.approvals.node.*", { details: { command } }));
			return;
		}
		if (command === "browser.proxy" && isForbiddenBrowserProxyMutation(p.params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "node.invoke cannot mutate persistent browser profiles via browser.proxy", { details: { command } }));
			return;
		}
		await respondUnavailableOnThrow(respond, async () => {
			const cfg = context.getRuntimeConfig();
			let nodeSession = context.nodeRegistry.get(nodeId);
			if (!nodeSession) {
				const wakeReqId = req.id;
				const wakeFlowStartedAtMs = Date.now();
				context.logGateway.info(`node wake start node=${nodeId} req=${wakeReqId} command=${command}`);
				const wake = await maybeWakeNodeWithApns(nodeId, { cfg });
				context.logGateway.info(`node wake stage=wake1 node=${nodeId} req=${wakeReqId} available=${wake.available} throttled=${wake.throttled} path=${wake.path} durationMs=${wake.durationMs} apnsStatus=${wake.apnsStatus ?? -1} apnsReason=${wake.apnsReason ?? "-"}`);
				if (wake.available) {
					const waitStartedAtMs = Date.now();
					const waitTimeoutMs = NODE_WAKE_RECONNECT_WAIT_MS;
					const reconnected = await waitForNodeReconnect({
						nodeId,
						context,
						timeoutMs: waitTimeoutMs
					});
					const waitDurationMs = Math.max(0, Date.now() - waitStartedAtMs);
					context.logGateway.info(`node wake stage=wait1 node=${nodeId} req=${wakeReqId} reconnected=${reconnected} timeoutMs=${waitTimeoutMs} durationMs=${waitDurationMs}`);
				}
				nodeSession = context.nodeRegistry.get(nodeId);
				if (!nodeSession && wake.available) {
					const retryWake = await maybeWakeNodeWithApns(nodeId, {
						force: true,
						cfg
					});
					context.logGateway.info(`node wake stage=wake2 node=${nodeId} req=${wakeReqId} force=true available=${retryWake.available} throttled=${retryWake.throttled} path=${retryWake.path} durationMs=${retryWake.durationMs} apnsStatus=${retryWake.apnsStatus ?? -1} apnsReason=${retryWake.apnsReason ?? "-"}`);
					if (retryWake.available) {
						const waitStartedAtMs = Date.now();
						const waitTimeoutMs = NODE_WAKE_RECONNECT_RETRY_WAIT_MS;
						const reconnected = await waitForNodeReconnect({
							nodeId,
							context,
							timeoutMs: waitTimeoutMs
						});
						const waitDurationMs = Math.max(0, Date.now() - waitStartedAtMs);
						context.logGateway.info(`node wake stage=wait2 node=${nodeId} req=${wakeReqId} reconnected=${reconnected} timeoutMs=${waitTimeoutMs} durationMs=${waitDurationMs}`);
					}
					nodeSession = context.nodeRegistry.get(nodeId);
				}
				if (!nodeSession) {
					const totalDurationMs = Math.max(0, Date.now() - wakeFlowStartedAtMs);
					const nudge = await maybeSendNodeWakeNudge(nodeId, { cfg });
					context.logGateway.info(`node wake nudge node=${nodeId} req=${wakeReqId} sent=${nudge.sent} throttled=${nudge.throttled} reason=${nudge.reason} durationMs=${nudge.durationMs} apnsStatus=${nudge.apnsStatus ?? -1} apnsReason=${nudge.apnsReason ?? "-"}`);
					context.logGateway.warn(`node wake done node=${nodeId} req=${wakeReqId} connected=false reason=not_connected totalMs=${totalDurationMs}`);
					respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, "node not connected", { details: { code: "NOT_CONNECTED" } }));
					return;
				}
				const totalDurationMs = Math.max(0, Date.now() - wakeFlowStartedAtMs);
				context.logGateway.info(`node wake done node=${nodeId} req=${wakeReqId} connected=true totalMs=${totalDurationMs}`);
			}
			const allowlist = resolveNodeCommandAllowlist(cfg, {
				...nodeSession,
				approvedCommands: nodeSession.commands
			});
			const allowed = isNodeCommandAllowed({
				command,
				declaredCommands: nodeSession.commands,
				allowlist
			});
			if (!allowed.ok) {
				const hint = buildNodeCommandRejectionHint(allowed.reason, command, nodeSession);
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, hint, { details: {
					reason: allowed.reason,
					command
				} }));
				return;
			}
			const forwardedParams = sanitizeNodeInvokeParamsForForwarding({
				nodeId,
				command,
				rawParams: p.params,
				client,
				execApprovalManager: context.execApprovalManager
			});
			if (!forwardedParams.ok) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, forwardedParams.message, { details: forwardedParams.details ?? null }));
				return;
			}
			const policyResult = await applyPluginNodeInvokePolicy({
				context,
				client,
				nodeSession,
				command,
				params: forwardedParams.params,
				timeoutMs: p.timeoutMs,
				idempotencyKey: p.idempotencyKey
			});
			if (policyResult) {
				if (!policyResult.ok) {
					respond(false, void 0, errorShape(policyResult.unavailable ? ErrorCodes.UNAVAILABLE : ErrorCodes.INVALID_REQUEST, policyResult.message, { details: {
						...policyResult.details,
						...policyResult.code ? { code: policyResult.code } : {}
					} }));
					return;
				}
				emitTalkPttNodeEvent({
					context,
					nodeId,
					command,
					payload: policyResult.payloadJSON ? safeParseJson(policyResult.payloadJSON) : policyResult.payload
				});
				respond(true, {
					ok: true,
					nodeId,
					command,
					payload: policyResult.payload,
					payloadJSON: policyResult.payloadJSON ?? null
				}, void 0);
				return;
			}
			const res = await context.nodeRegistry.invoke({
				nodeId,
				command,
				params: forwardedParams.params,
				timeoutMs: p.timeoutMs,
				idempotencyKey: p.idempotencyKey
			});
			if (!res.ok) {
				if (shouldQueueAsPendingForegroundAction({
					platform: nodeSession.platform,
					command,
					error: res.error
				})) {
					const queued = enqueuePendingNodeAction({
						nodeId,
						command,
						paramsJSON: toPendingParamsJSON(forwardedParams.params),
						idempotencyKey: p.idempotencyKey
					});
					const wake = await maybeWakeNodeWithApns(nodeId, { cfg });
					context.logGateway.info(`node pending queued node=${nodeId} req=${req.id} command=${command} queuedId=${queued.id} wakePath=${wake.path} wakeAvailable=${wake.available}`);
					respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, "node command queued until iOS returns to foreground", {
						retryable: true,
						details: {
							code: "QUEUED_UNTIL_FOREGROUND",
							queuedActionId: queued.id,
							nodeId,
							command,
							wake: {
								path: wake.path,
								available: wake.available,
								throttled: wake.throttled,
								apnsStatus: wake.apnsStatus,
								apnsReason: wake.apnsReason
							},
							nodeError: res.error ?? null
						}
					}));
					return;
				}
				if (!respondUnavailableOnNodeInvokeError(respond, res)) return;
				return;
			}
			const payload = res.payloadJSON ? safeParseJson(res.payloadJSON) : res.payload;
			emitTalkPttNodeEvent({
				context,
				nodeId,
				command,
				payload
			});
			respond(true, {
				ok: true,
				nodeId,
				command,
				payload,
				payloadJSON: res.payloadJSON ?? null
			}, void 0);
		});
	},
	"node.invoke.result": handleNodeInvokeResult,
	"node.event": async ({ params, respond, context, client }) => {
		if (!validateNodeEventParams(params)) {
			respondInvalidParams({
				respond,
				method: "node.event",
				validator: validateNodeEventParams
			});
			return;
		}
		const p = params;
		const payloadJSON = typeof p.payloadJSON === "string" ? p.payloadJSON : p.payload !== void 0 ? JSON.stringify(p.payload) : null;
		await respondUnavailableOnThrow(respond, async () => {
			const { handleNodeEvent } = await import("./server-node-events-BQ41Un2j.js");
			const nodeId = client?.connect?.device?.id ?? client?.connect?.client?.id ?? "node";
			respond(true, await handleNodeEvent({
				deps: context.deps,
				broadcast: context.broadcast,
				nodeSendToSession: context.nodeSendToSession,
				nodeSubscribe: context.nodeSubscribe,
				nodeUnsubscribe: context.nodeUnsubscribe,
				broadcastVoiceWakeChanged: context.broadcastVoiceWakeChanged,
				addChatRun: context.addChatRun,
				removeChatRun: context.removeChatRun,
				chatAbortControllers: context.chatAbortControllers,
				chatAbortedRuns: context.chatAbortedRuns,
				chatRunBuffers: context.chatRunBuffers,
				chatDeltaSentAt: context.chatDeltaSentAt,
				dedupe: context.dedupe,
				agentRunSeq: context.agentRunSeq,
				getHealthCache: context.getHealthCache,
				refreshHealthSnapshot: context.refreshHealthSnapshot,
				loadGatewayModelCatalog: context.loadGatewayModelCatalog,
				authorizeNodeSystemRunEvent: (eventParams) => context.nodeRegistry.authorizeSystemRunEvent({
					nodeId: eventParams.nodeId,
					connId: eventParams.connId,
					runId: eventParams.runId,
					sessionKey: eventParams.sessionKey,
					terminal: eventParams.terminal
				}),
				logGateway: { warn: context.logGateway.warn }
			}, nodeId, {
				event: p.event,
				payloadJSON
			}, {
				connId: client?.connId,
				deviceId: client?.connect?.device?.id
			}) ?? { ok: true }, void 0);
		});
	}
};
function buildNodeCommandRejectionHint(reason, command, node) {
	const platform = node?.platform ?? "unknown";
	if (reason === "command not declared by node") return `node command not allowed: the node (platform: ${platform}) does not support "${command}"`;
	if (reason === "command not allowlisted") {
		if (command.startsWith("talk.")) return `node command not allowed: "${command}" requires a trusted Talk-capable node`;
		return `node command not allowed: "${command}" is not in the allowlist for platform "${platform}"`;
	}
	if (reason === "node did not declare commands") return `node command not allowed: the node did not declare any supported commands`;
	return `node command not allowed: ${reason}`;
}
//#endregion
export { waitForNodeReconnect as i, maybeWakeNodeWithApns as n, nodeHandlers as r, maybeSendNodeWakeNudge as t };
