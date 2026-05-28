import { l as normalizeStringEntries } from "./string-normalization-B8G0vlWE.js";
import { b as isPlainObject } from "./utils-B5r0V84N.js";
import { a as emitTrustedDiagnosticEvent, b as freezeDiagnosticTraceContext, g as createChildDiagnosticTraceContext } from "./diagnostic-events-CNGydBWO.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import "./config-BtNBbhZb.js";
import { a as normalizeAnyChannelId } from "./registry-49GbU2k5.js";
import { _ as getPluginSessionExtensionStateSync } from "./loader-ChBMT90m.js";
import { d as PluginApprovalResolutions } from "./command-registration-DKP4-Wk7.js";
import { t as getGlobalHookRunner } from "./hook-runner-global-CjzahG2G.js";
import { a as getActivePluginRegistry } from "./runtime-B5Ug58ea.js";
import { i as resolveSandboxInputPath } from "./sandbox-paths-U414eGG1.js";
import { i as listChannelPlugins, t as getChannelPlugin } from "./registry-Be8exPcf.js";
import "./plugins-BGmuVWWz.js";
import { m as normalizeToolName } from "./tool-policy-CY4w5sXw.js";
import { i as getPluginToolMeta, n as copyPluginToolMeta } from "./tools-Ciw2IILF.js";
import { c as resolveMessageActionDiscoveryChannelId, l as resolveMessageActionDiscoveryForPlugin, r as createMessageActionDiscoveryContext, s as resolveCurrentChannelMessageToolDiscoveryAdapter } from "./message-action-discovery-BCy4bTc9.js";
import { n as channelPluginHasNativeApprovalPromptUi, t as NATIVE_APPROVAL_PROMPT_RUNTIME_CAPABILITY } from "./native-approval-prompt-BJOiwbRq.js";
import { r as diagnosticHttpStatusCode, t as diagnosticErrorCategory } from "./diagnostic-error-metadata-CJCFvsh5.js";
import { a as createLazyRuntimeSurface } from "./lazy-runtime-D-7_JraP.js";
import { t as adjustedParamsByToolCallId } from "./pi-tools.before-tool-call.state-B92-KsPf.js";
import { n as resolveSkillTelemetrySource, r as resolveSkillTelemetrySourceValue } from "./source-BMYA8dtz.js";
import { t as callGatewayTool } from "./gateway-WWlz8UU2.js";
import path from "node:path";
import os from "node:os";
//#region src/agents/channel-tools.ts
const channelAgentToolMeta = /* @__PURE__ */ new WeakMap();
function getChannelAgentToolMeta(tool) {
	return channelAgentToolMeta.get(tool);
}
function copyChannelAgentToolMeta(source, target) {
	const meta = channelAgentToolMeta.get(source);
	if (meta) channelAgentToolMeta.set(target, meta);
}
/**
* Get the list of supported message actions for a specific channel.
* Returns an empty array if channel is not found or has no actions configured.
*/
function listChannelSupportedActions(params) {
	const channelId = resolveMessageActionDiscoveryChannelId(params.channel);
	if (!channelId) return [];
	const pluginActions = resolveCurrentChannelMessageToolDiscoveryAdapter(channelId);
	if (!pluginActions?.actions) return [];
	return resolveMessageActionDiscoveryForPlugin({
		pluginId: pluginActions.pluginId,
		actions: pluginActions.actions,
		context: createMessageActionDiscoveryContext(params),
		includeActions: true
	}).actions;
}
/**
* Get the list of all supported message actions across all configured channels.
*/
function listAllChannelSupportedActions(params) {
	const actions = /* @__PURE__ */ new Set();
	for (const plugin of listChannelPlugins()) {
		const channelActions = resolveMessageActionDiscoveryForPlugin({
			pluginId: plugin.id,
			actions: plugin.actions,
			context: createMessageActionDiscoveryContext({
				...params,
				currentChannelProvider: plugin.id
			}),
			includeActions: true
		}).actions;
		for (const action of channelActions) actions.add(action);
	}
	return Array.from(actions);
}
function listChannelAgentTools(params) {
	const tools = [];
	for (const plugin of listChannelPlugins()) {
		const entry = plugin.agentTools;
		if (!entry) continue;
		const resolved = typeof entry === "function" ? entry(params) : entry;
		if (Array.isArray(resolved)) {
			for (const tool of resolved) channelAgentToolMeta.set(tool, { channelId: plugin.id });
			tools.push(...resolved);
		}
	}
	return tools;
}
function resolveChannelMessageToolHints(params) {
	const channelId = normalizeAnyChannelId(params.channel);
	if (!channelId) return [];
	const resolve = getChannelPlugin(channelId)?.agentPrompt?.messageToolHints;
	if (!resolve) return [];
	return normalizeStringEntries(resolve({
		cfg: params.cfg ?? {},
		accountId: params.accountId
	}));
}
function resolveChannelPromptCapabilities(params) {
	const channelId = normalizeAnyChannelId(params.channel);
	if (!channelId) return [];
	const plugin = getChannelPlugin(channelId);
	const cfg = params.cfg ?? {};
	const capabilities = normalizePromptCapabilities(plugin?.agentPrompt?.messageToolCapabilities?.({
		cfg,
		accountId: params.accountId
	}));
	if (channelPluginHasNativeApprovalPromptUi(plugin)) capabilities.push(NATIVE_APPROVAL_PROMPT_RUNTIME_CAPABILITY);
	return capabilities;
}
function normalizePromptCapabilities(capabilities) {
	return normalizeStringEntries(capabilities ?? []);
}
function resolveChannelReactionGuidance(params) {
	const channelId = normalizeAnyChannelId(params.channel);
	if (!channelId) return;
	const resolve = getChannelPlugin(channelId)?.agentPrompt?.reactionGuidance;
	if (!resolve) return;
	const resolved = resolve({
		cfg: params.cfg ?? {},
		accountId: params.accountId
	});
	if (!resolved?.level) return;
	return {
		level: resolved.level,
		channel: resolved.channelLabel?.trim() || channelId
	};
}
//#endregion
//#region src/agents/code-mode-control-tools.ts
const CODE_MODE_EXEC_TOOL_NAME = "exec";
const CODE_MODE_WAIT_TOOL_NAME = "wait";
const CODE_MODE_EXEC_TOOL_KIND = "code_mode_exec";
const codeModeControlTools = /* @__PURE__ */ new WeakSet();
function markCodeModeControlTool(tool) {
	codeModeControlTools.add(tool);
	return tool;
}
function isCodeModeControlTool(tool) {
	return codeModeControlTools.has(tool);
}
function isCodeModeExecTool(tool) {
	return isCodeModeControlTool(tool) && normalizeToolName(tool.name) === "exec";
}
function resolveCodeModeExecToolInputKind(params) {
	if (!isPlainObject(params)) return;
	const language = params.language;
	if (language === void 0 || language === "javascript") return "javascript";
	if (language === "typescript") return "typescript";
}
function normalizeCodeModeExecParams(params) {
	if (!isPlainObject(params)) return params;
	const code = params.code;
	const command = params.command;
	if (typeof code === "string" && typeof command !== "string") return {
		...params,
		command: params.code
	};
	if (typeof command === "string" && typeof code !== "string") return {
		...params,
		code: params.command
	};
	return params;
}
function getCodeModeExecBeforeHookMetadata(params) {
	if (!isCodeModeExecTool(params.tool)) return;
	const toolInputKind = resolveCodeModeExecToolInputKind(params.params);
	return {
		toolKind: CODE_MODE_EXEC_TOOL_KIND,
		...toolInputKind && { toolInputKind }
	};
}
function getCodeModeExecBeforeHookMetadataForToolKind(params) {
	if (params.toolKind !== "code_mode_exec") return;
	const toolInputKind = resolveCodeModeExecToolInputKind(params.params);
	return {
		toolKind: CODE_MODE_EXEC_TOOL_KIND,
		...toolInputKind && { toolInputKind }
	};
}
function normalizeCodeModeExecBeforeHookParams(params) {
	if (!isCodeModeExecTool(params.tool)) return params.params;
	return normalizeCodeModeExecParams(params.params);
}
function normalizeCodeModeExecBeforeHookParamsForToolKind(params) {
	if (params.toolKind !== "code_mode_exec") return params.params;
	return normalizeCodeModeExecParams(params.params);
}
function reconcileCodeModeExecBeforeHookParams(params) {
	if (!isCodeModeExecTool(params.tool) || !isPlainObject(params.originalParams) || !isPlainObject(params.hookParams) || !isPlainObject(params.adjustedParams)) return params.adjustedParams;
	const hookCode = params.hookParams.code;
	const hookCommand = params.hookParams.command;
	if (typeof hookCode !== "string" || hookCode !== hookCommand) return params.adjustedParams;
	const adjustedCode = params.adjustedParams.code;
	const adjustedCommand = params.adjustedParams.command;
	const adjustedCodeChanged = typeof adjustedCode === "string" && adjustedCode !== hookCode;
	const adjustedCommandChanged = typeof adjustedCommand === "string" && adjustedCommand !== hookCode;
	if (adjustedCodeChanged === adjustedCommandChanged) return params.adjustedParams;
	if (adjustedCodeChanged) return {
		...params.adjustedParams,
		command: adjustedCode
	};
	if (adjustedCommandChanged) return {
		...params.adjustedParams,
		code: adjustedCommand
	};
	return params.adjustedParams;
}
//#endregion
//#region src/agents/apply-patch-paths.ts
/**
* Lightweight path extractor for the `apply_patch` envelope grammar.
*
* The full parser in `apply-patch.ts` validates and applies a patch end-to-end.
* Plugins running inside `before_tool_call` only need the destination paths so
* they can compute path policy decisions before the patch is applied. This
* helper walks the input lines and collects every path mentioned by:
*
*   - `*** Add File: <path>`
*   - `*** Update File: <path>`         (and the optional `*** Move to: <new>`
*                                         sub-marker that immediately follows)
*   - `*** Delete File: <path>`
*
* Unlike the strict parser, this helper is forgiving: it does not require the
* `*** Begin Patch` / `*** End Patch` envelope, it ignores non-marker lines
* while scanning the full input, and it may therefore still pick up marker-like
* lines that appear later in malformed input. Top-level hunk headers are matched
* after trimming leading whitespace, like the executor parser; marker-like patch
* body lines remain ignored while scanning an update hunk. Empty paths are dropped.
*
* The shape of the input mirrors how `apply_patch` receives it: either a
* string (the full patch text) or an object with an `input` field carrying the
* patch text. Anything else returns an empty array.
*/
const ADD_FILE_MARKER = "*** Add File: ";
const DELETE_FILE_MARKER = "*** Delete File: ";
const UPDATE_FILE_MARKER = "*** Update File: ";
const MOVE_TO_MARKER = "*** Move to: ";
function readPatchText(input) {
	if (typeof input === "string") return input;
	if (input && typeof input === "object" && "input" in input) {
		const candidate = input.input;
		if (typeof candidate === "string") return candidate;
	}
}
function normalizePatchPath(raw, options = {}) {
	if (raw.length === 0) return;
	const cwd = options.cwd ?? options.sandbox?.root ?? process.cwd();
	try {
		const resolved = options.sandbox ? options.sandbox.bridge.resolvePath({
			filePath: raw,
			cwd
		}) : void 0;
		const normalized = path.normalize(resolved ? resolved.hostPath ?? resolved.containerPath : resolveSandboxInputPath(raw, cwd));
		return normalized && normalized !== "." ? normalized : void 0;
	} catch {
		return;
	}
}
function pushPath(target, seen, raw, options) {
	const normalized = normalizePatchPath(raw, options);
	if (!normalized) return;
	if (seen.has(normalized)) return;
	seen.add(normalized);
	target.push(normalized);
}
function readMarkerPath(line, marker) {
	const candidate = normalizeMarkerHeaderLine(line);
	if (!candidate?.startsWith(marker)) return;
	return candidate.slice(marker.length);
}
function normalizeMarkerHeaderLine(line, options) {
	if (line === void 0) return;
	const startTrimmed = line.trimStart();
	if (!startTrimmed.startsWith("***")) return;
	const leadingWhitespace = line.length - startTrimmed.length;
	if (options?.allowSingleSpaceIndent === false && leadingWhitespace === 1 && line.startsWith(" ")) return;
	return startTrimmed.trimEnd();
}
/**
* Walk an apply_patch envelope and return every destination path found, in
* the order they appear. Duplicates are de-duplicated (the same file may be
* referenced multiple times within a single envelope). Returns `[]` for any
* input that is not a recognised envelope.
*/
function extractApplyPatchTargetPaths(input, options = {}) {
	const text = readPatchText(input);
	if (text === void 0 || text.length === 0) return [];
	const lines = text.split(/\r?\n/);
	const paths = [];
	const seen = /* @__PURE__ */ new Set();
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const addPath = readMarkerPath(line, ADD_FILE_MARKER);
		if (addPath !== void 0) {
			pushPath(paths, seen, addPath, options);
			while (index + 1 < lines.length && lines[index + 1].startsWith("+")) index += 1;
			continue;
		}
		const deletePath = readMarkerPath(line, DELETE_FILE_MARKER);
		if (deletePath !== void 0) {
			pushPath(paths, seen, deletePath, options);
			continue;
		}
		const updatePath = readMarkerPath(line, UPDATE_FILE_MARKER);
		if (updatePath !== void 0) {
			pushPath(paths, seen, updatePath, options);
			let lookahead = index + 1;
			while (lookahead < lines.length && lines[lookahead].trim() === "") lookahead += 1;
			const movePath = readMarkerPath(lines[lookahead], MOVE_TO_MARKER);
			if (movePath !== void 0) {
				pushPath(paths, seen, movePath, options);
				lookahead += 1;
			}
			while (lookahead < lines.length) {
				if (lines[lookahead].trim() === "") {
					lookahead += 1;
					continue;
				}
				if (lines[lookahead].startsWith("***")) break;
				lookahead += 1;
			}
			index = lookahead - 1;
		}
	}
	return paths;
}
//#endregion
//#region src/plugins/host-tool-param-parsers.ts
/**
* Per-tool host-owned param derivers. Keep this map small and focused — every
* entry runs synchronously inside the before_tool_call hot path.
*/
const HOST_TOOL_PARAM_PARSERS = { apply_patch: (params, options) => {
	const paths = extractApplyPatchTargetPaths(params, options);
	return paths.length > 0 ? { derivedPaths: Object.freeze([...paths]) } : {};
} };
/**
* Derive host-owned metadata for a tool call. Returns an empty object when no
* parser is registered for the tool, which lets callers spread the result
* unconditionally without a nullability check.
*/
function deriveToolParams(toolName, params, options) {
	if (!Object.hasOwn(HOST_TOOL_PARAM_PARSERS, toolName)) return {};
	const parser = HOST_TOOL_PARAM_PARSERS[toolName];
	return parser ? parser(params, options) : {};
}
//#endregion
//#region src/plugins/trusted-tool-policy.ts
function hasTrustedToolPolicies() {
	return (getActivePluginRegistry()?.trustedToolPolicies?.length ?? 0) > 0;
}
function normalizeDerivedEventFields(value) {
	return Array.isArray(value?.derivedPaths) ? { derivedPaths: Object.freeze([...value.derivedPaths]) } : {};
}
function normalizeToolIdentity(value) {
	return {
		...value?.toolKind && { toolKind: value.toolKind },
		...value?.toolInputKind && { toolInputKind: value.toolInputKind }
	};
}
async function runTrustedToolPolicies(event, ctx, options) {
	const policies = getActivePluginRegistry()?.trustedToolPolicies ?? [];
	let adjustedParams = event.params;
	let hasAdjustedParams = false;
	let approval;
	const sessionExtensionStateCache = /* @__PURE__ */ new Map();
	let resolvedSessionConfig = options?.config;
	let didResolveSessionConfig = Boolean(options?.config);
	const resolveSessionConfig = () => {
		if (!didResolveSessionConfig) {
			didResolveSessionConfig = true;
			try {
				resolvedSessionConfig = getRuntimeConfig();
			} catch {
				resolvedSessionConfig = void 0;
			}
		}
		return resolvedSessionConfig;
	};
	const { derivedPaths, toolKind, toolInputKind, ...eventWithoutDerivedPaths } = event;
	const { toolKind: ctxToolKind, toolInputKind: ctxToolInputKind, ...ctxWithoutToolIdentity } = ctx;
	let currentDerivedEvent = normalizeDerivedEventFields({ derivedPaths });
	let currentEventToolIdentity = normalizeToolIdentity({
		toolKind,
		toolInputKind
	});
	let currentContextToolIdentity = normalizeToolIdentity({
		toolKind: ctxToolKind,
		toolInputKind: ctxToolInputKind
	});
	const buildEvent = () => {
		return {
			...eventWithoutDerivedPaths,
			params: adjustedParams,
			...currentEventToolIdentity,
			...currentDerivedEvent
		};
	};
	for (const registration of policies) {
		const policyCtx = {
			...ctxWithoutToolIdentity,
			...currentContextToolIdentity,
			getSessionExtension: (namespace) => {
				const normalizedNamespace = namespace.trim();
				const cacheKey = registration.pluginId;
				if (!sessionExtensionStateCache.has(cacheKey)) {
					const config = ctx.sessionKey ? resolveSessionConfig() : void 0;
					sessionExtensionStateCache.set(cacheKey, config ? getPluginSessionExtensionStateSync({
						cfg: config,
						pluginId: registration.pluginId,
						sessionKey: ctx.sessionKey
					}) : void 0);
				}
				const pluginState = sessionExtensionStateCache.get(cacheKey);
				if (!normalizedNamespace || !pluginState) return;
				return pluginState[normalizedNamespace];
			}
		};
		const decision = await registration.policy.evaluate(buildEvent(), policyCtx);
		if (!decision) continue;
		if ("allow" in decision && decision.allow === false) return {
			block: true,
			blockReason: decision.reason ?? `blocked by ${registration.policy.id}`
		};
		if ("block" in decision && decision.block === true) return {
			...decision,
			blockReason: decision.blockReason ?? `blocked by ${registration.policy.id}`
		};
		if ("params" in decision && isPlainObject(decision.params)) {
			const normalized = options?.normalizeEvent?.({
				...eventWithoutDerivedPaths,
				params: decision.params,
				...currentEventToolIdentity,
				...currentDerivedEvent
			}, policyCtx);
			adjustedParams = normalized?.params ?? decision.params;
			if (normalized?.event) currentEventToolIdentity = normalizeToolIdentity(normalized.event);
			if (normalized?.ctx) currentContextToolIdentity = normalizeToolIdentity(normalized.ctx);
			else if (normalized?.event) currentContextToolIdentity = normalizeToolIdentity(normalized.event);
			hasAdjustedParams = true;
			currentDerivedEvent = normalizeDerivedEventFields(options?.deriveEvent?.(adjustedParams));
		}
		if ("requireApproval" in decision && decision.requireApproval && !approval) approval = decision.requireApproval;
	}
	if (!hasAdjustedParams && !approval) return;
	return {
		...hasAdjustedParams ? { params: adjustedParams } : {},
		...approval ? { requireApproval: approval } : {}
	};
}
//#endregion
//#region src/agents/pi-tools.before-tool-call.ts
function isAbortSignalCancellation(err, signal) {
	if (!signal?.aborted) return false;
	if (err === signal.reason) return true;
	return err instanceof Error && err.name === "AbortError";
}
function getBeforeToolCallPolicyDiagnosticState() {
	const trustedToolPolicies = (getActivePluginRegistry()?.trustedToolPolicies ?? []).map((entry) => {
		const policy = {
			id: entry.policy.id,
			pluginId: entry.pluginId
		};
		if (entry.pluginName) policy.pluginName = entry.pluginName;
		return policy;
	});
	return {
		hasBeforeToolCallHook: getGlobalHookRunner()?.hasHooks("before_tool_call") === true,
		trustedToolPolicies
	};
}
function hasBeforeToolCallPolicy() {
	const state = getBeforeToolCallPolicyDiagnosticState();
	return state.hasBeforeToolCallHook || state.trustedToolPolicies.length > 0;
}
const log = createSubsystemLogger("agents/tools");
const BEFORE_TOOL_CALL_WRAPPED = Symbol("beforeToolCallWrapped");
const BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS = Symbol("beforeToolCallDiagnosticOptions");
const BEFORE_TOOL_CALL_SOURCE_TOOL = Symbol("beforeToolCallSourceTool");
const BEFORE_TOOL_CALL_HOOK_CONTEXT = Symbol("beforeToolCallHookContext");
const BEFORE_TOOL_CALL_HOOK_FAILURE_REASON = "Tool call blocked because before_tool_call hook failed";
const MAX_TRACKED_ADJUSTED_PARAMS = 1024;
const LOOP_WARNING_BUCKET_SIZE = 10;
const MAX_LOOP_WARNING_KEYS = 256;
/**
* Error used when before_tool_call intentionally vetoes a tool call.
*/
var BeforeToolCallBlockedError = class extends Error {
	constructor(reason) {
		super(reason);
		this.reason = reason;
		this.name = "BeforeToolCallBlockedError";
	}
};
function recordAdjustedParamsForToolCall(toolCallId, params, runId) {
	if (!toolCallId) return;
	const adjustedParamsKey = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	adjustedParamsByToolCallId.set(adjustedParamsKey, params);
	if (adjustedParamsByToolCallId.size > MAX_TRACKED_ADJUSTED_PARAMS) {
		const oldest = adjustedParamsByToolCallId.keys().next().value;
		if (oldest) adjustedParamsByToolCallId.delete(oldest);
	}
}
/**
* Returns true when an error represents an intentional before_tool_call veto.
*/
function isBeforeToolCallBlockedError(err) {
	return err instanceof BeforeToolCallBlockedError;
}
const loadBeforeToolCallRuntime = createLazyRuntimeSurface(() => import("./pi-tools.before-tool-call.runtime.js"), ({ beforeToolCallRuntime }) => beforeToolCallRuntime);
function buildAdjustedParamsKey(params) {
	if (params.runId && params.runId.trim()) return `${params.runId}:${params.toolCallId}`;
	return params.toolCallId;
}
function mergeParamsWithApprovalOverrides(originalParams, approvalParams) {
	if (approvalParams && isPlainObject(approvalParams)) {
		if (isPlainObject(originalParams)) return {
			...originalParams,
			...approvalParams
		};
		return approvalParams;
	}
	return originalParams;
}
function unwrapErrorCause(err) {
	try {
		if (!(err instanceof Error)) return err;
		const cause = Object.getOwnPropertyDescriptor(err, "cause");
		if (cause && "value" in cause && cause.value !== void 0) return cause.value;
	} catch {
		return err;
	}
	return err;
}
function resolveToolDiagnosticIdentity(tool) {
	const pluginMeta = getPluginToolMeta(tool);
	if (pluginMeta) return pluginMeta.pluginId === "bundle-mcp" ? {
		toolSource: "mcp",
		toolOwner: pluginMeta.pluginId
	} : {
		toolSource: "plugin",
		toolOwner: pluginMeta.pluginId
	};
	const channelMeta = getChannelAgentToolMeta(tool);
	if (channelMeta) return {
		toolSource: "channel",
		toolOwner: channelMeta.channelId
	};
	return { toolSource: "core" };
}
function resolveRelativeToolPath(candidate, ctx) {
	const trimmed = candidate.trim();
	if (!trimmed) return;
	if (trimmed === "~") return os.homedir();
	if (trimmed.startsWith("~/")) return path.resolve(os.homedir(), trimmed.slice(2));
	if (path.isAbsolute(trimmed)) return path.resolve(trimmed);
	const base = ctx?.workspaceDir ?? ctx?.cwd;
	return base ? path.resolve(base, trimmed) : void 0;
}
function readToolPathCandidates(params, ctx) {
	if (!isPlainObject(params)) return [];
	return (typeof params.path === "string" ? [params.path] : []).map((candidate) => resolveRelativeToolPath(candidate, ctx)).filter((candidate) => Boolean(candidate));
}
function skillInstructionPaths(snapshot) {
	const matches = /* @__PURE__ */ new Map();
	for (const skill of snapshot?.resolvedSkills ?? []) {
		const skillName = typeof skill.name === "string" ? skill.name.trim() : "";
		if (!skillName) continue;
		const match = {
			skillName,
			skillSource: resolveSkillTelemetrySource(skill),
			activation: "read"
		};
		const filePath = typeof skill.filePath === "string" ? skill.filePath.trim() : "";
		if (filePath && path.isAbsolute(filePath)) matches.set(path.resolve(filePath), match);
		const baseDir = typeof skill.baseDir === "string" ? skill.baseDir.trim() : "";
		if (baseDir && path.isAbsolute(baseDir)) matches.set(path.resolve(baseDir, "SKILL.md"), match);
	}
	return matches;
}
function findSkillUsageMatch(params) {
	const command = params.ctx?.skillCommand;
	if (command) {
		const commandToolName = normalizeToolName(command.toolName ?? params.toolName);
		if (!commandToolName || commandToolName === params.toolName) return {
			skillName: command.skillName,
			skillSource: resolveSkillTelemetrySourceValue(command.skillSource),
			activation: "command"
		};
	}
	if (params.toolName !== "read" || !params.ctx?.skillsSnapshot?.resolvedSkills?.length) return;
	const skillPaths = skillInstructionPaths(params.ctx.skillsSnapshot);
	for (const candidate of readToolPathCandidates(params.toolParams, params.ctx)) {
		const match = skillPaths.get(candidate);
		if (match) return match;
	}
}
function emitSkillUsedDiagnostic(params) {
	const trace = params.ctx?.trace ? freezeDiagnosticTraceContext(createChildDiagnosticTraceContext(params.ctx.trace)) : void 0;
	emitTrustedDiagnosticEvent({
		type: "skill.used",
		...params.ctx?.runId && { runId: params.ctx.runId },
		...params.ctx?.sessionKey && { sessionKey: params.ctx.sessionKey },
		...params.ctx?.sessionId && { sessionId: params.ctx.sessionId },
		...params.ctx?.agentId && { agentId: params.ctx.agentId },
		...trace && { trace },
		skillName: params.match.skillName,
		skillSource: params.match.skillSource,
		activation: params.match.activation,
		toolName: params.toolName,
		...params.toolCallId && { toolCallId: params.toolCallId }
	});
}
function notifyPluginApprovalResolution(approval, resolution) {
	const onResolution = approval.onResolution;
	if (typeof onResolution !== "function") return;
	try {
		Promise.resolve(onResolution(resolution)).catch((err) => {
			log.warn(`plugin onResolution callback failed: ${String(err)}`);
		});
	} catch (err) {
		log.warn(`plugin onResolution callback failed: ${String(err)}`);
	}
}
async function requestPluginToolApproval(params) {
	const approval = params.approval;
	try {
		const requestResult = await callGatewayTool("plugin.approval.request", { timeoutMs: (approval.timeoutMs ?? 12e4) + 1e4 }, {
			pluginId: approval.pluginId,
			title: approval.title,
			description: approval.description,
			severity: approval.severity,
			allowedDecisions: approval.allowedDecisions,
			actions: approval.actions,
			keepPendingWithoutRoute: approval.keepPendingWithoutRoute,
			toolName: params.toolName,
			toolCallId: params.toolCallId,
			agentId: params.ctx?.agentId,
			sessionKey: params.ctx?.sessionKey,
			timeoutMs: approval.timeoutMs ?? 12e4,
			twoPhase: true
		}, { expectFinal: false });
		const id = requestResult?.id;
		if (!id) {
			notifyPluginApprovalResolution(approval, PluginApprovalResolutions.CANCELLED);
			return {
				blocked: true,
				kind: "failure",
				deniedReason: "plugin-approval",
				reason: approval.description || "Plugin approval request failed",
				params: params.baseParams
			};
		}
		const hasImmediateDecision = Object.prototype.hasOwnProperty.call(requestResult ?? {}, "decision");
		let decision;
		if (hasImmediateDecision) {
			decision = requestResult?.decision;
			if (decision === null) {
				notifyPluginApprovalResolution(approval, PluginApprovalResolutions.CANCELLED);
				return {
					blocked: true,
					kind: "failure",
					deniedReason: "plugin-approval",
					reason: "Plugin approval unavailable (no approval route)",
					params: params.baseParams
				};
			}
		} else {
			const waitPromise = callGatewayTool("plugin.approval.waitDecision", { timeoutMs: (approval.timeoutMs ?? 12e4) + 1e4 }, { id });
			let waitResult;
			if (params.signal) {
				let onAbort;
				const abortPromise = new Promise((_, reject) => {
					if (params.signal.aborted) {
						reject(params.signal.reason);
						return;
					}
					onAbort = () => reject(params.signal.reason);
					params.signal.addEventListener("abort", onAbort, { once: true });
				});
				try {
					waitResult = await Promise.race([waitPromise, abortPromise]);
				} finally {
					if (onAbort) params.signal.removeEventListener("abort", onAbort);
				}
			} else waitResult = await waitPromise;
			decision = waitResult?.decision;
		}
		notifyPluginApprovalResolution(approval, decision === PluginApprovalResolutions.ALLOW_ONCE || decision === PluginApprovalResolutions.ALLOW_ALWAYS || decision === PluginApprovalResolutions.DENY ? decision : PluginApprovalResolutions.TIMEOUT);
		if (decision === PluginApprovalResolutions.ALLOW_ONCE || decision === PluginApprovalResolutions.ALLOW_ALWAYS) return {
			blocked: false,
			params: mergeParamsWithApprovalOverrides(params.baseParams, params.overrideParams)
		};
		if (decision === PluginApprovalResolutions.DENY) return {
			blocked: true,
			kind: "failure",
			deniedReason: "plugin-approval",
			reason: "Denied by user",
			params: params.baseParams
		};
		if ((approval.timeoutBehavior ?? "deny") === "allow") return {
			blocked: false,
			params: mergeParamsWithApprovalOverrides(params.baseParams, params.overrideParams)
		};
		return {
			blocked: true,
			kind: "failure",
			deniedReason: "plugin-approval",
			reason: "Approval timed out",
			params: params.baseParams
		};
	} catch (err) {
		notifyPluginApprovalResolution(approval, PluginApprovalResolutions.CANCELLED);
		if (isAbortSignalCancellation(err, params.signal)) {
			log.warn(`plugin approval wait cancelled by run abort: ${String(err)}`);
			return {
				blocked: true,
				kind: "failure",
				deniedReason: "plugin-approval",
				reason: "Approval cancelled (run aborted)",
				params: params.baseParams
			};
		}
		log.warn(`plugin approval gateway request failed; blocking tool call: ${String(err)}`);
		return {
			blocked: true,
			kind: "failure",
			deniedReason: "plugin-approval",
			reason: "Plugin approval required (gateway unavailable)",
			params: params.baseParams
		};
	}
}
function buildBlockedToolResult(params) {
	return {
		content: [{
			type: "text",
			text: params.reason
		}],
		details: {
			status: "blocked",
			deniedReason: params.deniedReason ?? "plugin-before-tool-call",
			reason: params.reason
		}
	};
}
function summarizeToolParams(params) {
	if (params === null) return { kind: "null" };
	if (params === void 0) return { kind: "undefined" };
	if (Array.isArray(params)) return {
		kind: "array",
		length: params.length
	};
	if (typeof params === "object") return { kind: "object" };
	if (typeof params === "string") return {
		kind: "string",
		length: params.length
	};
	if (typeof params === "number") return { kind: "number" };
	if (typeof params === "boolean") return { kind: "boolean" };
	return { kind: "other" };
}
function shouldEmitLoopWarning(state, warningKey, count) {
	if (!state.toolLoopWarningBuckets) state.toolLoopWarningBuckets = /* @__PURE__ */ new Map();
	const bucket = Math.floor(count / LOOP_WARNING_BUCKET_SIZE);
	if (bucket <= (state.toolLoopWarningBuckets.get(warningKey) ?? 0)) return false;
	state.toolLoopWarningBuckets.set(warningKey, bucket);
	if (state.toolLoopWarningBuckets.size > MAX_LOOP_WARNING_KEYS) {
		const oldest = state.toolLoopWarningBuckets.keys().next().value;
		if (oldest) state.toolLoopWarningBuckets.delete(oldest);
	}
	return true;
}
async function recordLoopOutcome(args) {
	if (!args.ctx?.sessionKey && !args.ctx?.sessionId) return;
	let recordedOutcome;
	try {
		const { getDiagnosticSessionState, recordToolCallOutcome } = await loadBeforeToolCallRuntime();
		const record = recordToolCallOutcome(getDiagnosticSessionState({
			sessionKey: args.ctx.sessionKey,
			sessionId: args.ctx.sessionId
		}), {
			toolName: args.toolName,
			toolParams: args.toolParams,
			toolCallId: args.toolCallId,
			result: args.result,
			error: args.error,
			config: args.ctx.loopDetection,
			...args.ctx.runId && { runId: args.ctx.runId }
		});
		if (record?.resultHash && args.ctx.onToolOutcome) recordedOutcome = {
			toolName: record.toolName,
			argsHash: record.argsHash,
			resultHash: record.resultHash
		};
	} catch (err) {
		log.warn(`tool loop outcome tracking failed: tool=${args.toolName} error=${String(err)}`);
	}
	if (recordedOutcome) args.ctx.onToolOutcome?.(recordedOutcome);
}
async function runBeforeToolCallHook(args) {
	const toolName = normalizeToolName(args.toolName || "tool");
	const params = args.params;
	if (args.ctx?.sessionKey) {
		const { getDiagnosticSessionState, logToolLoopAction, detectToolCallLoop, recordToolCall } = await loadBeforeToolCallRuntime();
		const sessionState = getDiagnosticSessionState({
			sessionKey: args.ctx.sessionKey,
			sessionId: args.ctx.sessionId
		});
		const loopScope = args.ctx.runId ? { runId: args.ctx.runId } : void 0;
		const loopResult = detectToolCallLoop(sessionState, toolName, params, args.ctx.loopDetection, loopScope);
		if (loopResult.stuck) {
			if (loopResult.level === "critical") {
				log.error(`Blocking ${toolName} due to critical loop: ${loopResult.message}`);
				logToolLoopAction({
					sessionKey: args.ctx.sessionKey,
					sessionId: args.ctx.sessionId,
					toolName,
					level: "critical",
					action: "block",
					detector: loopResult.detector,
					count: loopResult.count,
					message: loopResult.message,
					pairedToolName: loopResult.pairedToolName
				});
				return {
					blocked: true,
					kind: "veto",
					deniedReason: "tool-loop",
					reason: loopResult.message,
					params
				};
			}
			const baseWarningKey = loopResult.warningKey ?? `${loopResult.detector}:${toolName}`;
			if (shouldEmitLoopWarning(sessionState, args.ctx.runId ? `${args.ctx.runId}:${baseWarningKey}` : baseWarningKey, loopResult.count)) {
				log.warn(`Loop warning for ${toolName}: ${loopResult.message}`);
				logToolLoopAction({
					sessionKey: args.ctx.sessionKey,
					sessionId: args.ctx.sessionId,
					toolName,
					level: "warning",
					action: "warn",
					detector: loopResult.detector,
					count: loopResult.count,
					message: loopResult.message,
					pairedToolName: loopResult.pairedToolName
				});
			}
		}
		if (args.ctx.loopDetection?.enabled !== false) recordToolCall(sessionState, toolName, params, args.toolCallId, args.ctx.loopDetection, loopScope);
	}
	const hookRunner = getGlobalHookRunner();
	try {
		const hasBeforeToolCallHooks = hookRunner?.hasHooks("before_tool_call") === true;
		const shouldRunTrustedPolicies = hasTrustedToolPolicies();
		if (!shouldRunTrustedPolicies && !hasBeforeToolCallHooks) return {
			blocked: false,
			params
		};
		const normalizedParams = isPlainObject(params) ? params : {};
		const deriveOptions = args.ctx?.cwd || args.ctx?.sandbox ? {
			...args.ctx.cwd ? { cwd: args.ctx.cwd } : {},
			...args.ctx.sandbox ? { sandbox: args.ctx.sandbox } : {}
		} : void 0;
		const derivedToolParams = deriveToolParams(toolName, normalizedParams, deriveOptions);
		const deriveToolEventParams = (candidateParams) => {
			const derived = deriveToolParams(toolName, candidateParams, deriveOptions);
			return derived.derivedPaths ? { derivedPaths: derived.derivedPaths } : {};
		};
		const toolIdentity = {
			...args.toolKind && { toolKind: args.toolKind },
			...args.toolInputKind && { toolInputKind: args.toolInputKind }
		};
		const buildToolContext = (identity) => ({
			toolName,
			...identity,
			...args.ctx?.agentId && { agentId: args.ctx.agentId },
			...args.ctx?.sessionKey && { sessionKey: args.ctx.sessionKey },
			...args.ctx?.sessionId && { sessionId: args.ctx.sessionId },
			...args.ctx?.runId && { runId: args.ctx.runId },
			...args.ctx?.trace && { trace: freezeDiagnosticTraceContext(args.ctx.trace) },
			...args.toolCallId && { toolCallId: args.toolCallId },
			...args.ctx?.channelId && { channelId: args.ctx.channelId }
		});
		const toolContext = buildToolContext(toolIdentity);
		const trustedPolicyResult = shouldRunTrustedPolicies ? await runTrustedToolPolicies({
			toolName,
			params: normalizedParams,
			...toolIdentity,
			...args.ctx?.runId && { runId: args.ctx.runId },
			...args.toolCallId && { toolCallId: args.toolCallId },
			...derivedToolParams.derivedPaths ? { derivedPaths: derivedToolParams.derivedPaths } : {}
		}, toolContext, {
			...args.ctx?.config ? { config: args.ctx.config } : {},
			deriveEvent: deriveToolEventParams,
			normalizeEvent(eventValue) {
				const normalizedEventParams = normalizeCodeModeExecBeforeHookParamsForToolKind({
					toolKind: eventValue.toolKind,
					params: eventValue.params
				});
				if (!isPlainObject(normalizedEventParams)) return;
				const normalizedEventIdentity = getCodeModeExecBeforeHookMetadataForToolKind({
					toolKind: eventValue.toolKind,
					params: normalizedEventParams
				});
				return {
					params: normalizedEventParams,
					...normalizedEventIdentity ? {
						event: normalizedEventIdentity,
						ctx: normalizedEventIdentity
					} : {}
				};
			}
		}) : void 0;
		if (trustedPolicyResult?.block) return {
			blocked: true,
			kind: "veto",
			deniedReason: "plugin-before-tool-call",
			reason: trustedPolicyResult.blockReason || "Tool call blocked by trusted plugin policy",
			params
		};
		if (trustedPolicyResult?.requireApproval) {
			if (args.approvalMode === "report") {
				notifyPluginApprovalResolution(trustedPolicyResult.requireApproval, PluginApprovalResolutions.CANCELLED);
				return {
					blocked: true,
					kind: "failure",
					deniedReason: "plugin-approval",
					reason: trustedPolicyResult.requireApproval.description || trustedPolicyResult.requireApproval.title || "Plugin approval required",
					params
				};
			}
			return await requestPluginToolApproval({
				approval: trustedPolicyResult.requireApproval,
				toolName,
				toolCallId: args.toolCallId,
				ctx: args.ctx,
				signal: args.signal,
				baseParams: params,
				overrideParams: trustedPolicyResult.params
			});
		}
		const rawPolicyAdjustedParams = trustedPolicyResult?.params ?? params;
		const policyAdjustedParams = normalizeCodeModeExecBeforeHookParamsForToolKind({
			toolKind: args.toolKind,
			params: rawPolicyAdjustedParams
		});
		const policyAdjustedToolIdentity = getCodeModeExecBeforeHookMetadataForToolKind({
			toolKind: args.toolKind,
			params: policyAdjustedParams
		}) ?? toolIdentity;
		const policyAdjustedToolContext = buildToolContext(policyAdjustedToolIdentity);
		const policyAdjustedDerivedToolParams = trustedPolicyResult?.params && isPlainObject(policyAdjustedParams) ? deriveToolParams(toolName, policyAdjustedParams, deriveOptions) : derivedToolParams;
		if (!hasBeforeToolCallHooks) return {
			blocked: false,
			params: policyAdjustedParams
		};
		const hookEventParams = isPlainObject(policyAdjustedParams) ? policyAdjustedParams : {};
		const hookResult = await hookRunner.runBeforeToolCall({
			toolName,
			params: hookEventParams,
			...policyAdjustedToolIdentity,
			...args.ctx?.runId && { runId: args.ctx.runId },
			...args.toolCallId && { toolCallId: args.toolCallId },
			...policyAdjustedDerivedToolParams.derivedPaths ? { derivedPaths: policyAdjustedDerivedToolParams.derivedPaths } : {}
		}, policyAdjustedToolContext);
		if (hookResult?.block) return {
			blocked: true,
			kind: "veto",
			deniedReason: "plugin-before-tool-call",
			reason: hookResult.blockReason || "Tool call blocked by plugin hook",
			params: policyAdjustedParams
		};
		if (hookResult?.requireApproval) {
			if (args.approvalMode === "report") {
				notifyPluginApprovalResolution(hookResult.requireApproval, PluginApprovalResolutions.CANCELLED);
				return {
					blocked: true,
					kind: "failure",
					deniedReason: "plugin-approval",
					reason: hookResult.requireApproval.description || hookResult.requireApproval.title || "Plugin approval required",
					params: policyAdjustedParams
				};
			}
			return await requestPluginToolApproval({
				approval: hookResult.requireApproval,
				toolName,
				toolCallId: args.toolCallId,
				ctx: args.ctx,
				signal: args.signal,
				baseParams: policyAdjustedParams,
				overrideParams: hookResult.params
			});
		}
		if (hookResult?.params) return {
			blocked: false,
			params: mergeParamsWithApprovalOverrides(policyAdjustedParams, hookResult.params)
		};
		return {
			blocked: false,
			params: policyAdjustedParams
		};
	} catch (err) {
		const toolCallId = args.toolCallId ? ` toolCallId=${args.toolCallId}` : "";
		const cause = unwrapErrorCause(err);
		log.error(`before_tool_call hook failed: tool=${toolName}${toolCallId} error=${String(cause)}`);
		return {
			blocked: true,
			kind: "failure",
			deniedReason: "plugin-before-tool-call",
			reason: BEFORE_TOOL_CALL_HOOK_FAILURE_REASON,
			params
		};
	}
}
function wrapToolWithBeforeToolCallHook(tool, ctx, options = {}) {
	const execute = tool.execute;
	if (!execute) return tool;
	const toolName = tool.name || "tool";
	const diagnosticIdentity = resolveToolDiagnosticIdentity(tool);
	const hookOptions = {
		...options.approvalMode ? { approvalMode: options.approvalMode } : {},
		emitDiagnostics: options.emitDiagnostics !== false
	};
	const wrappedTool = {
		...tool,
		execute: async (toolCallId, params, signal, onUpdate) => {
			const hookParams = normalizeCodeModeExecBeforeHookParams({
				tool,
				params
			});
			const outcome = await runBeforeToolCallHook({
				toolName,
				params: hookParams,
				...getCodeModeExecBeforeHookMetadata({
					tool,
					params
				}),
				toolCallId,
				ctx,
				signal,
				approvalMode: hookOptions.approvalMode
			});
			if (outcome.blocked) {
				if (outcome.kind !== "veto") throw new Error(outcome.reason);
				const normalizedToolName = normalizeToolName(toolName || "tool");
				const trace = ctx?.trace ? freezeDiagnosticTraceContext(createChildDiagnosticTraceContext(ctx.trace)) : void 0;
				const eventBase = {
					...ctx?.runId && { runId: ctx.runId },
					...ctx?.sessionKey && { sessionKey: ctx.sessionKey },
					...ctx?.sessionId && { sessionId: ctx.sessionId },
					...trace && { trace },
					toolName: normalizedToolName,
					...diagnosticIdentity,
					...toolCallId && { toolCallId },
					paramsSummary: summarizeToolParams(outcome.params ?? hookParams)
				};
				if (hookOptions.emitDiagnostics) emitTrustedDiagnosticEvent({
					type: "tool.execution.blocked",
					...eventBase,
					reason: outcome.reason,
					deniedReason: outcome.deniedReason ?? "plugin-before-tool-call"
				});
				const blockedResult = buildBlockedToolResult({
					reason: outcome.reason,
					deniedReason: outcome.deniedReason ?? "plugin-before-tool-call"
				});
				await recordLoopOutcome({
					ctx,
					toolName: normalizedToolName,
					toolParams: outcome.params ?? hookParams,
					toolCallId,
					result: blockedResult
				});
				return blockedResult;
			}
			const executeParams = reconcileCodeModeExecBeforeHookParams({
				tool,
				originalParams: params,
				hookParams,
				adjustedParams: outcome.params
			});
			recordAdjustedParamsForToolCall(toolCallId, executeParams, ctx?.runId);
			const normalizedToolName = normalizeToolName(toolName || "tool");
			const trace = ctx?.trace ? freezeDiagnosticTraceContext(createChildDiagnosticTraceContext(ctx.trace)) : void 0;
			const eventBase = {
				...ctx?.runId && { runId: ctx.runId },
				...ctx?.sessionKey && { sessionKey: ctx.sessionKey },
				...ctx?.sessionId && { sessionId: ctx.sessionId },
				...trace && { trace },
				toolName: normalizedToolName,
				...diagnosticIdentity,
				...toolCallId && { toolCallId },
				paramsSummary: summarizeToolParams(executeParams)
			};
			if (hookOptions.emitDiagnostics) emitTrustedDiagnosticEvent({
				type: "tool.execution.started",
				...eventBase
			});
			const startedAt = Date.now();
			try {
				const result = await execute(toolCallId, executeParams, signal, onUpdate);
				const durationMs = Date.now() - startedAt;
				await recordLoopOutcome({
					ctx,
					toolName: normalizedToolName,
					toolParams: executeParams,
					toolCallId,
					result
				});
				const skillMatch = findSkillUsageMatch({
					toolName: normalizedToolName,
					toolParams: executeParams,
					ctx
				});
				if (hookOptions.emitDiagnostics) {
					if (skillMatch) emitSkillUsedDiagnostic({
						ctx,
						match: skillMatch,
						toolName: normalizedToolName,
						toolCallId
					});
					emitTrustedDiagnosticEvent({
						type: "tool.execution.completed",
						...eventBase,
						durationMs
					});
				}
				return result;
			} catch (err) {
				const cause = unwrapErrorCause(err);
				const errorCode = diagnosticHttpStatusCode(cause);
				if (hookOptions.emitDiagnostics) emitTrustedDiagnosticEvent({
					type: "tool.execution.error",
					...eventBase,
					durationMs: Date.now() - startedAt,
					errorCategory: diagnosticErrorCategory(cause),
					...errorCode ? { errorCode } : {}
				});
				await recordLoopOutcome({
					ctx,
					toolName: normalizedToolName,
					toolParams: executeParams,
					toolCallId,
					error: err
				});
				throw err;
			}
		}
	};
	copyPluginToolMeta(tool, wrappedTool);
	copyChannelAgentToolMeta(tool, wrappedTool);
	Object.defineProperty(wrappedTool, BEFORE_TOOL_CALL_WRAPPED, {
		value: true,
		enumerable: true
	});
	Object.defineProperty(wrappedTool, BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS, {
		value: hookOptions,
		enumerable: false
	});
	Object.defineProperty(wrappedTool, BEFORE_TOOL_CALL_SOURCE_TOOL, {
		value: tool,
		enumerable: false
	});
	Object.defineProperty(wrappedTool, BEFORE_TOOL_CALL_HOOK_CONTEXT, {
		value: ctx,
		enumerable: false
	});
	return wrappedTool;
}
function isToolWrappedWithBeforeToolCallHook(tool) {
	return tool[BEFORE_TOOL_CALL_WRAPPED] === true;
}
function setBeforeToolCallDiagnosticsEnabled(tool, enabled) {
	const options = tool[BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS];
	if (options && typeof options === "object" && "emitDiagnostics" in options) options.emitDiagnostics = enabled;
}
function rewrapToolWithBeforeToolCallHook(tool, ctx, options = {}) {
	const taggedTool = tool;
	const source = taggedTool[BEFORE_TOOL_CALL_SOURCE_TOOL];
	const wrappedContext = taggedTool[BEFORE_TOOL_CALL_HOOK_CONTEXT];
	return wrapToolWithBeforeToolCallHook(source && typeof source === "object" ? source : tool, ctx ?? (wrappedContext && typeof wrappedContext === "object" ? wrappedContext : void 0), options);
}
function copyBeforeToolCallHookMarker(source, target) {
	if (!isToolWrappedWithBeforeToolCallHook(source)) return;
	Object.defineProperty(target, BEFORE_TOOL_CALL_WRAPPED, {
		value: true,
		enumerable: true
	});
	const taggedSource = source;
	const sourceTool = taggedSource[BEFORE_TOOL_CALL_SOURCE_TOOL];
	if (sourceTool && typeof sourceTool === "object") Object.defineProperty(target, BEFORE_TOOL_CALL_SOURCE_TOOL, {
		value: sourceTool,
		enumerable: false
	});
	const hookContext = taggedSource[BEFORE_TOOL_CALL_HOOK_CONTEXT];
	Object.defineProperty(target, BEFORE_TOOL_CALL_HOOK_CONTEXT, {
		value: hookContext,
		enumerable: false
	});
}
function consumeAdjustedParamsForToolCall(toolCallId, runId) {
	const adjustedParamsKey = buildAdjustedParamsKey({
		runId,
		toolCallId
	});
	const params = adjustedParamsByToolCallId.get(adjustedParamsKey);
	adjustedParamsByToolCallId.delete(adjustedParamsKey);
	return params;
}
const testing = {
	BEFORE_TOOL_CALL_DIAGNOSTIC_OPTIONS,
	BEFORE_TOOL_CALL_HOOK_CONTEXT,
	BEFORE_TOOL_CALL_SOURCE_TOOL,
	BEFORE_TOOL_CALL_WRAPPED,
	buildAdjustedParamsKey,
	adjustedParamsByToolCallId,
	runBeforeToolCallHook,
	mergeParamsWithApprovalOverrides,
	isPlainObject
};
//#endregion
export { resolveChannelReactionGuidance as A, copyChannelAgentToolMeta as C, listChannelSupportedActions as D, listChannelAgentTools as E, resolveChannelMessageToolHints as O, reconcileCodeModeExecBeforeHookParams as S, listAllChannelSupportedActions as T, CODE_MODE_WAIT_TOOL_NAME as _, getBeforeToolCallPolicyDiagnosticState as a, markCodeModeControlTool as b, isBeforeToolCallBlockedError as c, rewrapToolWithBeforeToolCallHook as d, runBeforeToolCallHook as f, CODE_MODE_EXEC_TOOL_NAME as g, wrapToolWithBeforeToolCallHook as h, copyBeforeToolCallHookMarker as i, resolveChannelPromptCapabilities as k, isToolWrappedWithBeforeToolCallHook as l, testing as m, buildBlockedToolResult as n, hasBeforeToolCallPolicy as o, setBeforeToolCallDiagnosticsEnabled as p, consumeAdjustedParamsForToolCall as r, isAbortSignalCancellation as s, BeforeToolCallBlockedError as t, recordAdjustedParamsForToolCall as u, getCodeModeExecBeforeHookMetadata as v, getChannelAgentToolMeta as w, normalizeCodeModeExecBeforeHookParams as x, isCodeModeControlTool as y };
