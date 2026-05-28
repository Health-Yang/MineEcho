import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { c as isRecord } from "./utils-B5r0V84N.js";
import { o as coerceSecretRef } from "./types.secrets-CtRQ27Ls.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { l as normalizeAgentId } from "./session-key-yaI3D3Bl.js";
import { t as asBoolean } from "./boolean-CZag3-H2.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./provider-model-shared-Co6lnz7Y.js";
import "./routing-BEOAuKfu.js";
import "./secret-input-BrsvLCK3.js";
import { a as registerHealthCheck } from "./health-check-registry-iNxbMjrn.js";
import "./health-DfBL--tQ.js";
import JSON5 from "json5";
import { basename, isAbsolute, resolve } from "node:path";
import { createHash } from "node:crypto";
//#region extensions/policy/src/tool-policy-conformance.ts
const POLICY_TOOL_GROUPS = {
	"group:openclaw": [
		"code_execution",
		"web_search",
		"web_fetch",
		"x_search",
		"memory_search",
		"memory_get",
		"sessions_list",
		"sessions_history",
		"sessions_send",
		"sessions_spawn",
		"sessions_yield",
		"subagents",
		"session_status",
		"browser",
		"message",
		"heartbeat_respond",
		"cron",
		"gateway",
		"nodes",
		"agents_list",
		"update_plan",
		"image",
		"image_generate",
		"music_generate",
		"video_generate",
		"tts"
	],
	"group:fs": [
		"read",
		"write",
		"edit",
		"apply_patch"
	],
	"group:runtime": [
		"exec",
		"process",
		"code_execution"
	],
	"group:web": [
		"web_search",
		"web_fetch",
		"x_search"
	],
	"group:memory": ["memory_search", "memory_get"],
	"group:sessions": [
		"sessions_list",
		"sessions_history",
		"sessions_send",
		"sessions_spawn",
		"sessions_yield",
		"subagents",
		"session_status"
	],
	"group:ui": ["browser", "canvas"],
	"group:messaging": ["message"],
	"group:automation": [
		"heartbeat_respond",
		"cron",
		"gateway"
	],
	"group:nodes": ["nodes"],
	"group:agents": ["agents_list", "update_plan"],
	"group:media": [
		"image",
		"image_generate",
		"music_generate",
		"video_generate",
		"tts"
	]
};
//#endregion
//#region extensions/policy/src/policy-state.ts
const RESERVED_CHANNEL_CONFIG_KEYS = new Set(["defaults", "modelByChannel"]);
const NON_SLUG_CHARS = /[^a-z0-9-]+/g;
const COLLAPSE_HYPHENS = /-+/g;
const TRIM_HYPHENS = /^-+|-+$/g;
function policyDocumentHash(policy) {
	return sha256(stableJson(policy));
}
function policyWorkspaceHash(evidence) {
	return sha256(stableJson(evidence));
}
function policyFindingsHash(findings) {
	return sha256(stableJson(findings));
}
function policyAttestationHash(input) {
	return sha256(stableJson(input));
}
function createPolicyAttestation(input) {
	const workspaceHash = policyWorkspaceHash(input.evidence);
	const findingsHash = policyFindingsHash(input.findings);
	return {
		checkedAt: input.checkedAt,
		...input.policyHash === void 0 ? {} : { policy: {
			path: input.policyPath,
			hash: input.policyHash
		} },
		workspace: {
			scope: "policy",
			hash: workspaceHash
		},
		findingsHash,
		attestationHash: policyAttestationHash({
			ok: input.ok,
			policyHash: input.policyHash,
			workspaceHash,
			findingsHash
		})
	};
}
function collectPolicyEvidence(cfg, options = {}) {
	const evidence = {
		channels: scanPolicyChannels(cfg),
		mcpServers: scanPolicyMcpServers(cfg),
		modelProviders: scanPolicyModelProviders(cfg),
		modelRefs: scanPolicyModelRefs(cfg),
		network: scanPolicyNetwork(cfg),
		...options.includeGatewayExposure === false ? {} : { gatewayExposure: scanPolicyGatewayExposure(cfg) },
		...options.includeAgentWorkspace === false ? {} : { agentWorkspace: scanPolicyAgentWorkspace(cfg) },
		...options.includeToolPosture === false ? {} : { toolPosture: scanPolicyToolPosture(cfg) },
		...options.includeSecrets === false ? {} : { secrets: scanPolicySecrets(cfg) },
		...options.includeAuthProfiles === false ? {} : { authProfiles: scanPolicyAuthProfiles(cfg) }
	};
	if (options.toolsRaw === void 0) return evidence;
	return scanPolicyTools(options.toolsRaw).then((tools) => ({
		...evidence,
		tools
	}));
}
function scanPolicyChannels(cfg) {
	return Object.entries(configuredChannels(cfg)).filter(([id]) => !RESERVED_CHANNEL_CONFIG_KEYS.has(id)).toSorted(([a], [b]) => a.localeCompare(b)).map(([id, value]) => {
		const entry = {
			id,
			provider: id,
			source: `oc://openclaw.config/channels/${id}`
		};
		if (isRecord(value) && typeof value.enabled === "boolean") entry.enabled = value.enabled;
		return entry;
	});
}
function scanPolicyMcpServers(cfg) {
	return Object.entries(configuredMcpServers(cfg)).toSorted(([a], [b]) => a.localeCompare(b)).map(([id, value]) => {
		const entry = {
			id,
			transport: mcpServerTransport(value),
			source: `oc://openclaw.config/mcp/servers/${ocPathSegment$1(id)}`
		};
		if (isRecord(value)) {
			if (typeof value.command === "string") entry.command = value.command;
			if (typeof value.url === "string") entry.url = redactMcpUrlForEvidence(value.url);
		}
		return entry;
	});
}
function scanPolicyModelProviders(cfg) {
	return Object.keys(configuredModelProviders(cfg)).toSorted((a, b) => a.localeCompare(b)).map((id) => ({
		id: normalizeProviderId(id),
		source: `oc://openclaw.config/models/providers/${id}`
	}));
}
function scanPolicyModelRefs(cfg) {
	const refs = [];
	if (isRecord(cfg.agents)) {
		collectModelRefsFromRecord(refs, cfg.agents, "oc://openclaw.config/agents");
		collectModelRefsFromAgentAllowlist(refs, cfg.agents);
	}
	return refs.toSorted((a, b) => a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model));
}
function scanPolicyNetwork(cfg) {
	return [
		networkBooleanEvidence(cfg, "browser-private-network", [
			"browser",
			"ssrfPolicy",
			"dangerouslyAllowPrivateNetwork"
		], "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork"),
		networkBooleanEvidence(cfg, "browser-private-network-legacy", [
			"browser",
			"ssrfPolicy",
			"allowPrivateNetwork"
		], "oc://openclaw.config/browser/ssrfPolicy/allowPrivateNetwork"),
		networkBooleanEvidence(cfg, "web-fetch-private-network", [
			"tools",
			"web",
			"fetch",
			"ssrfPolicy",
			"dangerouslyAllowPrivateNetwork"
		], "oc://openclaw.config/tools/web/fetch/ssrfPolicy/dangerouslyAllowPrivateNetwork"),
		networkBooleanEvidence(cfg, "web-fetch-private-network-legacy", [
			"tools",
			"web",
			"fetch",
			"ssrfPolicy",
			"allowPrivateNetwork"
		], "oc://openclaw.config/tools/web/fetch/ssrfPolicy/allowPrivateNetwork"),
		networkBooleanEvidence(cfg, "web-fetch-rfc2544-benchmark-range", [
			"tools",
			"web",
			"fetch",
			"ssrfPolicy",
			"allowRfc2544BenchmarkRange"
		], "oc://openclaw.config/tools/web/fetch/ssrfPolicy/allowRfc2544BenchmarkRange"),
		networkBooleanEvidence(cfg, "web-fetch-ipv6-unique-local-range", [
			"tools",
			"web",
			"fetch",
			"ssrfPolicy",
			"allowIpv6UniqueLocalRange"
		], "oc://openclaw.config/tools/web/fetch/ssrfPolicy/allowIpv6UniqueLocalRange")
	].filter((entry) => entry !== void 0);
}
function scanPolicyGatewayExposure(cfg) {
	const gateway = isRecord(cfg.gateway) ? cfg.gateway : {};
	const entries = [];
	const bind = typeof gateway.bind === "string" ? gateway.bind : void 0;
	const customBindHost = typeof gateway.customBindHost === "string" ? gateway.customBindHost : void 0;
	const hasCustomBindHost = customBindHost !== void 0 && customBindHost.trim() !== "";
	const tailscale = isRecord(gateway.tailscale) ? gateway.tailscale : {};
	const tailscaleForcesLoopback = tailscale.mode === "serve" || tailscale.mode === "funnel";
	entries.push({
		id: bind === void 0 ? "gateway-bind-default" : "gateway-bind",
		kind: "bind",
		source: "oc://openclaw.config/gateway/bind",
		value: bind ?? (tailscaleForcesLoopback ? "loopback" : "runtime-default"),
		nonLoopback: bind === void 0 ? !tailscaleForcesLoopback : bind === "custom" ? false : isGatewayNonLoopbackBind(bind),
		explicit: bind !== void 0
	});
	if (bind === "custom" && hasCustomBindHost) entries.push({
		id: "gateway-custom-bind-host",
		kind: "bind",
		source: "oc://openclaw.config/gateway/customBindHost",
		value: customBindHost,
		nonLoopback: isRuntimeNonLoopbackCustomBindHost(customBindHost)
	});
	const auth = isRecord(gateway.auth) ? gateway.auth : {};
	entries.push({
		id: "gateway-auth-mode",
		kind: "auth",
		source: "oc://openclaw.config/gateway/auth/mode",
		value: typeof auth.mode === "string" ? auth.mode : "token",
		explicit: typeof auth.mode === "string"
	});
	entries.push({
		id: "gateway-auth-rate-limit",
		kind: "authRateLimit",
		source: "oc://openclaw.config/gateway/auth/rateLimit",
		value: isRecord(auth.rateLimit),
		explicit: isRecord(auth.rateLimit)
	});
	const controlUi = isRecord(gateway.controlUi) ? gateway.controlUi : {};
	pushGatewayBooleanEvidence(entries, "gateway-control-ui-enabled", "controlUi", controlUi.enabled, "oc://openclaw.config/gateway/controlUi/enabled");
	pushGatewayBooleanEvidence(entries, "gateway-control-ui-insecure-auth", "controlUi", controlUi.allowInsecureAuth, "oc://openclaw.config/gateway/controlUi/allowInsecureAuth");
	pushGatewayBooleanEvidence(entries, "gateway-control-ui-device-auth-disabled", "controlUi", controlUi.dangerouslyDisableDeviceAuth, "oc://openclaw.config/gateway/controlUi/dangerouslyDisableDeviceAuth");
	pushGatewayBooleanEvidence(entries, "gateway-control-ui-host-origin-fallback", "controlUi", controlUi.dangerouslyAllowHostHeaderOriginFallback, "oc://openclaw.config/gateway/controlUi/dangerouslyAllowHostHeaderOriginFallback");
	if (typeof tailscale.mode === "string") entries.push({
		id: "gateway-tailscale-mode",
		kind: "tailscale",
		source: "oc://openclaw.config/gateway/tailscale/mode",
		value: tailscale.mode
	});
	if (tailscale.mode === "serve" && tailscale.preserveFunnel === true) entries.push({
		id: "gateway-tailscale-preserve-funnel",
		kind: "tailscale",
		source: "oc://openclaw.config/gateway/tailscale/preserveFunnel",
		value: "funnel"
	});
	const remote = isRecord(gateway.remote) ? gateway.remote : {};
	if (gateway.mode === "remote") {
		entries.push({
			id: "gateway-mode-remote",
			kind: "remote",
			source: "oc://openclaw.config/gateway/mode",
			value: "remote"
		});
		if (typeof remote.url === "string" && remote.url.trim() !== "") entries.push({
			id: "gateway-remote-url",
			kind: "remote",
			source: "oc://openclaw.config/gateway/remote/url",
			value: true
		});
	}
	const http = isRecord(gateway.http) ? gateway.http : {};
	const endpoints = isRecord(http.endpoints) ? http.endpoints : {};
	pushGatewayHttpEndpointEvidence(entries, endpoints, "chatCompletions");
	pushGatewayHttpEndpointEvidence(entries, endpoints, "responses");
	return entries.toSorted((a, b) => a.source.localeCompare(b.source));
}
function scanPolicyAgentWorkspace(cfg) {
	const agents = isRecord(cfg.agents) ? cfg.agents : {};
	const defaults = isRecord(agents.defaults) ? agents.defaults : {};
	const defaultSandbox = isRecord(defaults.sandbox) ? defaults.sandbox : {};
	const defaultTools = isRecord(cfg.tools) ? cfg.tools : {};
	const entries = [];
	pushAgentWorkspaceEvidence(entries, {
		id: "agents-defaults",
		scope: "defaults",
		sandbox: defaultSandbox,
		inheritedSandbox: {},
		tools: defaultTools,
		inheritedTools: {},
		workspaceSourceBase: "oc://openclaw.config/agents/defaults",
		inheritedWorkspaceSourceBase: "oc://openclaw.config/agents/defaults",
		toolsSourceBase: "oc://openclaw.config/tools",
		inheritedToolsSourceBase: "oc://openclaw.config/tools"
	});
	(Array.isArray(agents.list) ? agents.list : []).forEach((agent, index) => {
		if (!isRecord(agent)) return;
		const agentId = typeof agent.id === "string" && agent.id.trim() !== "" ? agent.id.trim() : void 0;
		const sandbox = isRecord(agent.sandbox) ? agent.sandbox : {};
		const tools = isRecord(agent.tools) ? agent.tools : {};
		pushAgentWorkspaceEvidence(entries, {
			id: agentId ?? `agent-${index}`,
			scope: "agent",
			agentId,
			sandbox,
			inheritedSandbox: defaultSandbox,
			tools,
			inheritedTools: defaultTools,
			workspaceSourceBase: `oc://openclaw.config/agents/list/#${index}`,
			inheritedWorkspaceSourceBase: "oc://openclaw.config/agents/defaults",
			toolsSourceBase: `oc://openclaw.config/agents/list/#${index}/tools`,
			inheritedToolsSourceBase: "oc://openclaw.config/tools"
		});
	});
	return entries.toSorted((a, b) => a.source.localeCompare(b.source) || a.id.localeCompare(b.id));
}
function scanPolicyToolPosture(cfg) {
	const globalTools = isRecord(cfg.tools) ? cfg.tools : {};
	const agents = isRecord(cfg.agents) ? cfg.agents : {};
	const defaults = isRecord(agents.defaults) ? agents.defaults : {};
	const defaultSandbox = isRecord(defaults.sandbox) ? defaults.sandbox : {};
	const entries = [];
	pushToolPostureEvidence(entries, {
		id: "tools",
		scope: "global",
		tools: globalTools,
		inheritedTools: {},
		sandbox: defaultSandbox,
		inheritedSandbox: {},
		sourceBase: "oc://openclaw.config/tools",
		inheritedSourceBase: "oc://openclaw.config/tools"
	});
	(Array.isArray(agents.list) ? agents.list : []).forEach((agent, index) => {
		if (!isRecord(agent)) return;
		const agentId = typeof agent.id === "string" && agent.id.trim() !== "" ? agent.id.trim() : void 0;
		pushToolPostureEvidence(entries, {
			id: agentId ?? `agent-${index}`,
			scope: "agent",
			agentId,
			tools: isRecord(agent.tools) ? agent.tools : {},
			inheritedTools: globalTools,
			sandbox: isRecord(agent.sandbox) ? agent.sandbox : {},
			inheritedSandbox: defaultSandbox,
			sourceBase: `oc://openclaw.config/agents/list/#${index}/tools`,
			inheritedSourceBase: "oc://openclaw.config/tools"
		});
	});
	return entries.toSorted((a, b) => a.source.localeCompare(b.source) || a.id.localeCompare(b.id));
}
function scanPolicySecrets(cfg) {
	return [...scanPolicySecretProviders(cfg), ...scanPolicySecretInputs(cfg)].toSorted((a, b) => a.source.localeCompare(b.source));
}
function scanPolicyAuthProfiles(cfg) {
	const auth = isRecord(cfg.auth) ? cfg.auth : {};
	const profiles = isRecord(auth.profiles) ? auth.profiles : {};
	return Object.entries(profiles).toSorted(([a], [b]) => a.localeCompare(b)).map(([id, value]) => {
		const entry = {
			id,
			source: `oc://openclaw.config/auth/profiles/${ocPathSegment$1(id)}`,
			validMetadata: isValidAuthProfileMetadata(value)
		};
		if (isRecord(value)) {
			if (typeof value.provider === "string") entry.provider = value.provider;
			if (typeof value.mode === "string") entry.mode = value.mode;
		}
		return entry;
	});
}
function scanPolicySecretProviders(cfg) {
	const secrets = isRecord(cfg.secrets) ? cfg.secrets : {};
	const providers = isRecord(secrets.providers) ? secrets.providers : {};
	return Object.entries(providers).map(([id, value]) => {
		const insecure = secretProviderInsecureFlags(value);
		const entry = {
			id,
			kind: "provider",
			source: `oc://openclaw.config/secrets/providers/${ocPathSegment$1(id)}`
		};
		if (isRecord(value) && typeof value.source === "string") entry.providerSource = value.source;
		if (insecure.length > 0) entry.insecure = insecure;
		return entry;
	});
}
function scanPolicySecretInputs(cfg) {
	const entries = [];
	collectSecretInputs(entries, cfg, [], secretRefDefaults((isRecord(cfg.secrets) ? cfg.secrets : {}).defaults));
	return entries;
}
function collectSecretInputs(entries, value, path, defaults) {
	if (Array.isArray(value)) {
		value.forEach((item, index) => collectSecretInputs(entries, item, [...path, `#${index}`], defaults));
		return;
	}
	if (!isRecord(value)) return;
	for (const [key, child] of Object.entries(value)) {
		const childPath = [...path, key];
		const source = configPathSource(childPath);
		const ref = isSecretInputPath(childPath) ? secretRefEvidence(child, defaults) : void 0;
		if (ref !== void 0) {
			entries.push({
				id: source,
				kind: "input",
				source,
				provenance: "secretRef",
				refSource: ref.source,
				refProvider: ref.provider
			});
			continue;
		}
		collectSecretInputs(entries, child, childPath, defaults);
	}
}
function configPathSource(path) {
	return `oc://openclaw.config/${path.map(ocPathSegment$1).join("/")}`;
}
function isSecretInputPath(path) {
	const key = path.at(-1);
	if (key === void 0) return false;
	if (matchesConfigPath(path, [
		"plugins",
		"entries",
		"acpx",
		"config",
		"mcpServers",
		"*",
		"env",
		"*"
	])) return true;
	if (isRawEnvMapValuePath(path)) return false;
	if (isSecretInputKey(key)) return true;
	return matchesConfigPath(path, [
		"models",
		"providers",
		"*",
		"headers",
		"*"
	]) || isConfiguredProviderRequestSecretPath(path, [
		"models",
		"providers",
		"*"
	]) || isMediaConfiguredProviderRequestSecretPath(path) || matchesConfigPath(path, [
		"agents",
		"defaults",
		"memorySearch",
		"remote",
		"headers",
		"*"
	]) || matchesConfigPath(path, [
		"diagnostics",
		"otel",
		"headers",
		"*"
	]);
}
function isRawEnvMapValuePath(path) {
	return path.length >= 2 && path.at(-2) === "env";
}
function isMediaConfiguredProviderRequestSecretPath(path) {
	return isConfiguredProviderRequestSecretPath(path, [
		"tools",
		"media",
		"models",
		"#"
	]) || isConfiguredProviderRequestSecretPath(path, [
		"tools",
		"media",
		"audio"
	]) || isConfiguredProviderRequestSecretPath(path, [
		"tools",
		"media",
		"audio",
		"models",
		"#"
	]) || isConfiguredProviderRequestSecretPath(path, [
		"tools",
		"media",
		"image"
	]) || isConfiguredProviderRequestSecretPath(path, [
		"tools",
		"media",
		"image",
		"models",
		"#"
	]) || isConfiguredProviderRequestSecretPath(path, [
		"tools",
		"media",
		"video"
	]) || isConfiguredProviderRequestSecretPath(path, [
		"tools",
		"media",
		"video",
		"models",
		"#"
	]);
}
function pushAgentWorkspaceEvidence(entries, params) {
	const explicitSandboxMode = normalizeOptionalString(params.sandbox.mode);
	const inheritedSandboxMode = normalizeOptionalString(params.inheritedSandbox.mode);
	const sandboxMode = explicitSandboxMode ?? inheritedSandboxMode ?? "off";
	const sandboxModeCoversAgentMain = sandboxMode === "all";
	const sandboxModeSource = explicitSandboxMode !== void 0 ? `${params.workspaceSourceBase}/sandbox/mode` : inheritedSandboxMode !== void 0 ? `${params.inheritedWorkspaceSourceBase}/sandbox/mode` : "oc://openclaw.config/agents/defaults/sandbox/mode";
	const explicitWorkspaceAccess = normalizeOptionalString(params.sandbox.workspaceAccess);
	const inheritedWorkspaceAccess = normalizeOptionalString(params.inheritedSandbox.workspaceAccess);
	entries.push({
		id: `${params.id}-workspace-access`,
		kind: "workspaceAccess",
		source: explicitWorkspaceAccess !== void 0 ? `${params.workspaceSourceBase}/sandbox/workspaceAccess` : inheritedWorkspaceAccess !== void 0 ? `${params.inheritedWorkspaceSourceBase}/sandbox/workspaceAccess` : "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
		scope: params.scope,
		...params.agentId === void 0 ? {} : { agentId: params.agentId },
		value: explicitWorkspaceAccess ?? inheritedWorkspaceAccess ?? "none",
		sandboxMode,
		sandboxModeSource,
		sandboxEnabled: sandboxModeCoversAgentMain,
		explicit: explicitWorkspaceAccess !== void 0
	});
	for (const tool of AGENT_WORKSPACE_POLICY_TOOLS) {
		const denyEvidence = agentWorkspaceToolDenyEvidence(params, tool, sandboxModeCoversAgentMain);
		entries.push({
			id: `${params.id}-tool-${tool}`,
			kind: "toolDeny",
			source: denyEvidence.source,
			scope: params.scope,
			...params.agentId === void 0 ? {} : { agentId: params.agentId },
			tool,
			denied: denyEvidence.denied,
			explicit: denyEvidence.denied
		});
	}
}
function agentWorkspaceToolDenyEvidence(params, tool, sandboxModeCoversAgentMain) {
	const localSandboxToolDeny = configuredSandboxToolDenyEntries(params.tools);
	const inheritedSandboxToolDeny = configuredSandboxToolDenyEntries(params.inheritedTools);
	const match = [
		{
			entries: readStringArray(params.tools.deny),
			source: `${params.toolsSourceBase}/deny`
		},
		{
			entries: readStringArray(params.inheritedTools.deny),
			source: `${params.inheritedToolsSourceBase}/deny`
		},
		...sandboxModeCoversAgentMain ? [localSandboxToolDeny !== void 0 ? {
			entries: localSandboxToolDeny,
			source: `${params.toolsSourceBase}/sandbox/tools/deny`
		} : {
			entries: inheritedSandboxToolDeny ?? [],
			source: `${params.inheritedToolsSourceBase}/sandbox/tools/deny`
		}] : []
	].find((entry) => toolListCoversTool$1(entry.entries, tool));
	if (match !== void 0) return {
		denied: true,
		source: match.source
	};
	return {
		denied: false,
		source: `${params.toolsSourceBase}/deny`
	};
}
function configuredSandboxToolDenyEntries(tools) {
	const sandbox = isRecord(tools.sandbox) ? tools.sandbox : {};
	const sandboxTools = isRecord(sandbox.tools) ? sandbox.tools : {};
	return Array.isArray(sandboxTools.deny) ? readStringArray(sandboxTools.deny) : void 0;
}
function pushToolPostureEvidence(entries, params) {
	const localProfile = normalizeOptionalString(params.tools.profile);
	const inheritedProfile = normalizeOptionalString(params.inheritedTools.profile);
	pushToolPostureValue(entries, params, {
		suffix: "profile",
		kind: "profile",
		value: localProfile ?? inheritedProfile ?? "full",
		explicit: localProfile !== void 0 || inheritedProfile !== void 0,
		inherited: localProfile === void 0 && inheritedProfile !== void 0
	});
	pushToolPostureList(entries, params, "allow");
	pushToolAlsoAllowPostureList(entries, params);
	pushToolPostureList(entries, params, "deny");
	pushToolFsPosture(entries, params);
	pushToolExecPosture(entries, params);
	pushToolElevatedPosture(entries, params);
}
function pushToolFsPosture(entries, params) {
	const localFs = isRecord(params.tools.fs) ? params.tools.fs : {};
	const inheritedFs = isRecord(params.inheritedTools.fs) ? params.inheritedTools.fs : {};
	const localWorkspaceOnly = asBoolean(localFs.workspaceOnly);
	const inheritedWorkspaceOnly = asBoolean(inheritedFs.workspaceOnly);
	pushToolPostureValue(entries, params, {
		suffix: "fs/workspaceOnly",
		kind: "fsWorkspaceOnly",
		value: localWorkspaceOnly ?? inheritedWorkspaceOnly ?? false,
		explicit: localWorkspaceOnly !== void 0 || inheritedWorkspaceOnly !== void 0,
		inherited: localWorkspaceOnly === void 0 && inheritedWorkspaceOnly !== void 0
	});
}
function pushToolExecPosture(entries, params) {
	const localExec = isRecord(params.tools.exec) ? params.tools.exec : {};
	const inheritedExec = isRecord(params.inheritedTools.exec) ? params.inheritedTools.exec : {};
	const localHost = normalizeOptionalString(localExec.host);
	const inheritedHost = normalizeOptionalString(inheritedExec.host);
	const host = localHost ?? inheritedHost ?? "auto";
	pushToolPostureValue(entries, params, {
		suffix: "exec/host",
		kind: "execHost",
		value: host,
		explicit: localHost !== void 0 || inheritedHost !== void 0,
		inherited: localHost === void 0 && inheritedHost !== void 0
	});
	const localSecurity = normalizeOptionalString(localExec.security);
	const inheritedSecurity = normalizeOptionalString(inheritedExec.security);
	const sandboxCanApply = (normalizeOptionalString(params.sandbox.mode) ?? normalizeOptionalString(params.inheritedSandbox.mode)) === "all";
	pushToolPostureValue(entries, params, {
		suffix: "exec/security",
		kind: "execSecurity",
		value: localSecurity ?? inheritedSecurity ?? (host === "sandbox" || host === "auto" && sandboxCanApply ? "deny" : "full"),
		explicit: localSecurity !== void 0 || inheritedSecurity !== void 0,
		inherited: localSecurity === void 0 && inheritedSecurity !== void 0
	});
	const localAsk = normalizeOptionalString(localExec.ask);
	const inheritedAsk = normalizeOptionalString(inheritedExec.ask);
	pushToolPostureValue(entries, params, {
		suffix: "exec/ask",
		kind: "execAsk",
		value: localAsk ?? inheritedAsk ?? "off",
		explicit: localAsk !== void 0 || inheritedAsk !== void 0,
		inherited: localAsk === void 0 && inheritedAsk !== void 0
	});
}
function pushToolElevatedPosture(entries, params) {
	const localElevated = isRecord(params.tools.elevated) ? params.tools.elevated : {};
	const inheritedElevated = isRecord(params.inheritedTools.elevated) ? params.inheritedTools.elevated : {};
	const localEnabled = asBoolean(localElevated.enabled);
	const inheritedEnabled = asBoolean(inheritedElevated.enabled);
	pushToolPostureValue(entries, params, {
		suffix: "elevated/enabled",
		kind: "elevatedEnabled",
		value: inheritedEnabled === false ? false : localEnabled ?? inheritedEnabled ?? true,
		explicit: localEnabled !== void 0 || inheritedEnabled !== void 0,
		inherited: inheritedEnabled === false && localEnabled !== false || localEnabled === void 0 && inheritedEnabled !== void 0
	});
	const localAllowFrom = isRecord(localElevated.allowFrom) ? localElevated.allowFrom : {};
	const inheritedAllowFrom = isRecord(inheritedElevated.allowFrom) ? inheritedElevated.allowFrom : {};
	const providers = [...new Set([...Object.keys(inheritedAllowFrom), ...Object.keys(localAllowFrom)])].toSorted((a, b) => a.localeCompare(b));
	for (const provider of providers) {
		const localEntries = readStringOrNumberArray(localAllowFrom[provider]);
		const inheritedEntries = readStringOrNumberArray(inheritedAllowFrom[provider]);
		const inherited = localEntries.length === 0 && inheritedEntries.length > 0;
		entries.push({
			id: `${params.id}-elevated-allow-from-${ocPathSegment$1(provider)}`,
			kind: "elevatedAllowFrom",
			source: `${inherited ? params.inheritedSourceBase : params.sourceBase}/elevated/allowFrom/${ocPathSegment$1(provider)}`,
			scope: params.scope,
			...params.agentId === void 0 ? {} : { agentId: params.agentId },
			entries: localEntries.length > 0 ? localEntries : inheritedEntries,
			explicit: localEntries.length > 0 || inheritedEntries.length > 0
		});
	}
}
function pushToolPostureValue(entries, params, entry) {
	entries.push({
		id: `${params.id}-${entry.suffix.replaceAll("/", "-")}`,
		kind: entry.kind,
		source: `${entry.inherited ? params.inheritedSourceBase : params.sourceBase}/${entry.suffix}`,
		scope: params.scope,
		...params.agentId === void 0 ? {} : { agentId: params.agentId },
		...entry.value === void 0 ? {} : { value: entry.value },
		explicit: entry.explicit
	});
}
function pushToolPostureList(entries, params, key) {
	const localEntries = readStringArray(params.tools[key]);
	const inheritedEntries = readStringArray(params.inheritedTools[key]);
	const inherited = localEntries.length === 0 && inheritedEntries.length > 0;
	entries.push({
		id: `${params.id}-${key}`,
		kind: key,
		source: `${inherited ? params.inheritedSourceBase : params.sourceBase}/${key}`,
		scope: params.scope,
		...params.agentId === void 0 ? {} : { agentId: params.agentId },
		entries: [...inheritedEntries, ...localEntries],
		explicit: localEntries.length > 0 || inheritedEntries.length > 0
	});
}
function pushToolAlsoAllowPostureList(entries, params) {
	const localValue = params.tools.alsoAllow;
	const inheritedValue = params.inheritedTools.alsoAllow;
	const localConfigured = Array.isArray(localValue);
	const inheritedConfigured = Array.isArray(inheritedValue);
	const localEntries = localConfigured ? readStringArray(localValue) : [];
	const inheritedEntries = inheritedConfigured ? readStringArray(inheritedValue) : [];
	const inherited = !localConfigured && inheritedConfigured;
	entries.push({
		id: `${params.id}-alsoAllow`,
		kind: "alsoAllow",
		source: `${inherited ? params.inheritedSourceBase : params.sourceBase}/alsoAllow`,
		scope: params.scope,
		...params.agentId === void 0 ? {} : { agentId: params.agentId },
		entries: inherited ? inheritedEntries : localEntries,
		explicit: localConfigured || inheritedConfigured
	});
}
const AGENT_WORKSPACE_POLICY_TOOLS = [
	"exec",
	"process",
	"write",
	"edit",
	"apply_patch"
];
function readStringArray(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((entry) => typeof entry === "string" && entry.trim() !== "");
}
function readStringOrNumberArray(value) {
	if (!Array.isArray(value)) return [];
	const entries = [];
	for (const entry of value) if (typeof entry === "string" && entry.trim() !== "") entries.push(entry.trim());
	else if (typeof entry === "number" && Number.isFinite(entry)) entries.push(String(entry));
	return entries;
}
function normalizePolicyToolName$1(value) {
	const normalized = value.trim().toLowerCase();
	if (normalized === "bash") return "exec";
	if (normalized === "apply-patch") return "apply_patch";
	return normalized;
}
function policyToolGlobMatches$1(tool, pattern) {
	const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${escaped.replaceAll("\\*", ".*")}$`).test(tool);
}
function toolListCoversTool$1(list, tool) {
	for (const entry of list) {
		const normalized = normalizePolicyToolName$1(entry);
		if (normalized === "*" || normalized === tool) return true;
		if (POLICY_TOOL_GROUPS[normalized]?.includes(tool)) return true;
		if (normalized.includes("*") && policyToolGlobMatches$1(tool, normalized)) return true;
	}
	return false;
}
function isConfiguredProviderRequestSecretPath(path, prefix) {
	if (path.length < prefix.length + 3) return false;
	if (!matchesConfigPathPrefix(path, prefix)) return false;
	const requestIndex = prefix.length;
	if (path[requestIndex] !== "request") return false;
	const suffix = path.slice(requestIndex + 1);
	if (suffix.length === 2 && suffix[0] === "headers") return true;
	if (suffix.length === 2 && suffix[0] === "auth" && isConfiguredProviderAuthSecretKey(suffix[1])) return true;
	if (suffix.length === 2 && suffix[0] === "tls" && isConfiguredProviderTlsSecretKey(suffix[1])) return true;
	return suffix.length === 3 && suffix[0] === "proxy" && suffix[1] === "tls" && isConfiguredProviderTlsSecretKey(suffix[2]);
}
function matchesConfigPathPrefix(path, prefix) {
	if (path.length < prefix.length) return false;
	return prefix.every((segment, index) => {
		const value = path[index];
		if (segment === "*") return value !== void 0 && value !== "";
		if (segment === "#") return value?.startsWith("#") ?? false;
		return value === segment;
	});
}
function matchesConfigPath(path, pattern) {
	return path.length === pattern.length && matchesConfigPathPrefix(path, pattern);
}
function isConfiguredProviderTlsSecretKey(key) {
	return key === "ca" || key === "cert" || key === "key" || key === "passphrase";
}
function isConfiguredProviderAuthSecretKey(key) {
	return key === "token" || key === "value";
}
function isSecretInputKey(key) {
	const normalized = key.toLowerCase();
	return normalized === "apikey" || normalized === "keyref" || normalized === "token" || normalized === "tokenref" || normalized === "password" || normalized === "secret" || normalized === "encryptkey" || normalized === "webhooksecret" || normalized === "serviceaccount" || normalized === "serviceaccountref" || normalized === "privatekey" || normalized === "certificate" || normalized === "certificatedata" || normalized === "identitydata" || normalized === "knownhosts" || normalized === "knownhostsdata" || normalized.endsWith("apikey") || normalized.endsWith("token") || normalized.endsWith("secret") || normalized.endsWith("password");
}
function secretRefDefaults(value) {
	if (!isRecord(value)) return;
	const defaults = {};
	if (typeof value.env === "string") defaults.env = value.env;
	if (typeof value.file === "string") defaults.file = value.file;
	if (typeof value.exec === "string") defaults.exec = value.exec;
	return defaults;
}
function secretRefEvidence(value, defaults) {
	const ref = coerceSecretRef(value, defaults);
	return ref === null ? void 0 : {
		source: ref.source,
		provider: ref.provider,
		id: ref.id
	};
}
function secretProviderInsecureFlags(value) {
	if (!isRecord(value)) return [];
	return [...value.allowInsecurePath === true ? ["allowInsecurePath"] : [], ...value.allowSymlinkCommand === true ? ["allowSymlinkCommand"] : []];
}
function isValidAuthProfileMetadata(value) {
	if (!isRecord(value)) return false;
	return typeof value.provider === "string" && value.provider.trim() !== "" && isAuthProfileMode(value.mode);
}
function isAuthProfileMode(value) {
	return value === "api_key" || value === "aws-sdk" || value === "oauth" || value === "token";
}
function scanPolicyTools(raw) {
	return Promise.resolve(scanPolicyToolHeaders(raw));
}
function scanPolicyToolHeaders(raw) {
	const section = markdownSectionLines(raw, "tools");
	if (section.length === 0) return [];
	const tools = [];
	for (let index = 0; index < section.length; index += 1) {
		const line = section[index]?.text ?? "";
		const heading = /^###\s+([^\s#]+)(.*)$/.exec(line);
		const bullet = /^[-*+]\s+([^:\s][^:]*?)\s*:(.*)$/.exec(line);
		const match = heading ?? bullet;
		if (match === null || slugify(match[1]).length === 0) continue;
		const id = slugify(match[1]);
		const entry = {
			id,
			source: `oc://TOOLS.md/tools/${id}`,
			line: section[index]?.line ?? index + 1
		};
		const metaLines = [match[2] ?? ""];
		for (let metaIndex = index + 1; metaIndex < section.length; metaIndex += 1) {
			const metaLine = section[metaIndex]?.text ?? "";
			if (/^###\s+\S+/.test(metaLine.trim()) || /^[-*+]\s+[^:\s][^:]*?\s*:/.test(metaLine)) break;
			metaLines.push(metaLine);
		}
		const meta = metaLines.join("\n");
		const risk = riskFromMeta(meta);
		const sensitivity = /\bsensitivity\s*:\s*([a-z0-9_-]+)\b/i.exec(meta)?.[1]?.toLowerCase();
		const owner = /\bowner\s*:\s*([^\s#]+)\b/i.exec(meta)?.[1];
		const capabilities = capabilityTokensFromMetaLines(metaLines);
		if (risk !== void 0) entry.risk = risk;
		if (sensitivity !== void 0) entry.sensitivity = sensitivity;
		if (owner !== void 0) entry.owner = owner;
		if (capabilities.length > 0) entry.capabilities = capabilities;
		tools.push(entry);
	}
	return tools;
}
function markdownSectionLines(raw, sectionSlug) {
	const lines = raw.split(/\r?\n/);
	let sectionDepth;
	const section = [];
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? "";
		const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
		if (heading !== null) {
			const depth = heading[1]?.length ?? 0;
			const slug = slugify(heading[2] ?? "");
			if (sectionDepth !== void 0 && depth <= sectionDepth) break;
			if (sectionDepth !== void 0) {
				section.push({
					line: index + 1,
					text: line
				});
				continue;
			}
			if (sectionDepth === void 0 && slug === sectionSlug) sectionDepth = depth;
			continue;
		}
		if (sectionDepth !== void 0) section.push({
			line: index + 1,
			text: line
		});
	}
	return section;
}
function slugify(text) {
	return text.toLowerCase().replace(/_/g, "-").replace(NON_SLUG_CHARS, "-").replace(COLLAPSE_HYPHENS, "-").replace(TRIM_HYPHENS, "");
}
function riskFromMeta(meta) {
	const namedRisk = /\brisk\s*:\s*([a-z0-9_-]+)\b/i.exec(meta)?.[1];
	if (namedRisk !== void 0) return namedRisk.toLowerCase();
	switch (/\bR([0-5])\b/.exec(meta)?.[1]) {
		case "0":
		case "1": return "low";
		case "2":
		case "3": return "medium";
		case "4": return "high";
		case "5": return "critical";
		default: return;
	}
}
function capabilityTokensFromMetaLines(lines) {
	return lines.flatMap((line, index) => {
		const trimmed = line.trim();
		if (trimmed.length === 0) return [];
		const tokens = trimmed.match(/\b[A-Z][A-Z0-9_]{2,}\b/g) ?? [];
		if (index === 0 || /\bcapabilities\s*:/i.test(trimmed)) return tokens;
		const withoutTokens = tokens.reduce((remaining, token) => {
			return remaining.replace(token, "");
		}, trimmed);
		return /^[\s,;:[\](){}#*_-]*$/.test(withoutTokens) ? tokens : [];
	});
}
function configuredChannels(cfg) {
	return isRecord(cfg.channels) ? cfg.channels : {};
}
function configuredMcpServers(cfg) {
	return isRecord(cfg.mcp) && isRecord(cfg.mcp.servers) ? cfg.mcp.servers : {};
}
function mcpServerTransport(value) {
	if (!isRecord(value)) return "unknown";
	if (typeof value.command === "string") return "stdio";
	if (value.transport === "sse" || value.transport === "streamable-http") return value.transport;
	if (typeof value.url === "string") return "streamable-http";
	return "unknown";
}
function redactMcpUrlForEvidence(raw) {
	try {
		const url = new URL(raw);
		return `${url.protocol}//${url.host}`;
	} catch {
		return "[redacted-url]";
	}
}
function configuredModelProviders(cfg) {
	return isRecord(cfg.models) && isRecord(cfg.models.providers) ? cfg.models.providers : {};
}
function networkBooleanEvidence(cfg, id, path, source) {
	const value = readBooleanPath(cfg, path);
	return value === void 0 ? void 0 : {
		id,
		source,
		value
	};
}
function pushGatewayBooleanEvidence(entries, id, kind, value, source) {
	if (typeof value !== "boolean") return;
	entries.push({
		id,
		kind,
		source,
		value
	});
}
function pushGatewayHttpEndpointEvidence(entries, endpoints, endpoint) {
	const config = endpoints[endpoint];
	if (!isRecord(config)) return;
	const source = `oc://openclaw.config/gateway/http/endpoints/${endpoint}`;
	const enabled = config.enabled === true;
	if (enabled) entries.push({
		id: `gateway-http-${endpoint}`,
		kind: "httpEndpoint",
		source: `${source}/enabled`,
		value: true,
		endpoint
	});
	if (!enabled) return;
	if (endpoint === "chatCompletions") {
		pushGatewayHttpUrlFetchEvidence(entries, source, endpoint, ["images"], config.images);
		return;
	}
	pushGatewayHttpUrlFetchEvidence(entries, source, endpoint, ["files"], config.files);
	pushGatewayHttpUrlFetchEvidence(entries, source, endpoint, ["images"], config.images);
}
function pushGatewayHttpUrlFetchEvidence(entries, endpointSource, endpoint, path, value) {
	const allowUrl = isRecord(value) ? value.allowUrl : void 0;
	if (allowUrl === false || allowUrl !== true && endpoint !== "responses") return;
	const allowlist = isRecord(value) ? value.urlAllowlist : void 0;
	const hasEffectiveAllowlist = Array.isArray(allowlist) && allowlist.some((entry) => isEffectiveGatewayUrlAllowlistEntry(entry));
	entries.push({
		id: `gateway-http-${endpoint}-${path.join("-")}-url-fetch`,
		kind: "httpUrlFetch",
		source: `${endpointSource}/${path.map(ocPathSegment$1).join("/")}/allowUrl`,
		value: true,
		endpoint,
		explicit: allowUrl === true,
		hasAllowlist: hasEffectiveAllowlist
	});
}
function isEffectiveGatewayUrlAllowlistEntry(value) {
	if (typeof value !== "string") return false;
	const normalized = value.trim().toLowerCase();
	return normalized !== "" && normalized !== "*" && normalized !== "*.";
}
function isGatewayNonLoopbackBind(value) {
	return value === "auto" || value === "lan" || value === "custom" || value === "tailnet";
}
function isRuntimeNonLoopbackCustomBindHost(value) {
	const normalized = value.trim().toLowerCase();
	return isCanonicalDottedDecimalIPv4(normalized) && !normalized.startsWith("127.");
}
function isCanonicalDottedDecimalIPv4(value) {
	return /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(value);
}
function readBooleanPath(value, path) {
	let current = value;
	for (const part of path) {
		if (!isRecord(current)) return;
		current = current[part];
	}
	return typeof current === "boolean" ? current : void 0;
}
function collectModelRefsFromValue(refs, value, source) {
	if (typeof value === "string") {
		pushModelRef(refs, value, source);
		return;
	}
	if (!isRecord(value)) return;
	if (typeof value.primary === "string") pushModelRef(refs, value.primary, `${source}/primary`);
	if (Array.isArray(value.fallbacks)) {
		for (const [index, fallback] of value.fallbacks.entries()) if (typeof fallback === "string") pushModelRef(refs, fallback, `${source}/fallbacks/#${index}`);
	}
}
function collectModelRefsFromRecord(refs, value, source) {
	for (const [key, child] of Object.entries(value)) {
		const childPath = `${source}/${key}`;
		if (isModelSettingKey(key)) {
			collectModelRefsFromValue(refs, child, childPath);
			continue;
		}
		if (Array.isArray(child)) {
			for (const [index, item] of child.entries()) if (isRecord(item)) collectModelRefsFromRecord(refs, item, `${childPath}/#${index}`);
			continue;
		}
		if (isRecord(child)) collectModelRefsFromRecord(refs, child, childPath);
	}
}
function collectModelRefsFromAgentAllowlist(refs, agents) {
	const defaults = agents.defaults;
	if (isRecord(defaults) && isRecord(defaults.models)) collectModelRefsFromModelMap(refs, defaults.models, "oc://openclaw.config/agents/defaults/models");
	const list = agents.list;
	if (!Array.isArray(list)) return;
	for (const [index, agent] of list.entries()) {
		if (!isRecord(agent) || !isRecord(agent.models)) continue;
		collectModelRefsFromModelMap(refs, agent.models, `oc://openclaw.config/agents/list/#${index}/models`);
	}
}
function collectModelRefsFromModelMap(refs, models, source) {
	for (const ref of Object.keys(models)) pushModelRef(refs, ref, `${source}/${ocPathSegment$1(ref)}`);
}
function isModelSettingKey(key) {
	return key === "model" || key.endsWith("Model");
}
function ocPathSegment$1(value) {
	if (/^(?:[A-Za-z0-9_-]+|#\d+)$/.test(value)) return value;
	if (value.includes("\"") || value.includes("\\")) return value;
	return `"${value}"`;
}
function pushModelRef(refs, ref, source) {
	const parsed = parseModelRef(ref);
	if (parsed === void 0) return;
	refs.push({
		ref,
		provider: parsed.provider,
		model: parsed.model,
		source
	});
}
function parseModelRef(ref) {
	const trimmed = ref.trim();
	const slash = trimmed.indexOf("/");
	if (slash <= 0 || slash >= trimmed.length - 1) return;
	return {
		provider: normalizeProviderId(trimmed.slice(0, slash)),
		model: trimmed.slice(slash + 1)
	};
}
function sha256(value) {
	return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}
function stableJson(value) {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
	if (isRecord(value)) return `{${Object.entries(value).toSorted(([a], [b]) => a.localeCompare(b)).map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`).join(",")}}`;
	return JSON.stringify(value);
}
//#endregion
//#region extensions/policy/src/doctor/register.ts
const CHECK_IDS = {
	policyAttestationMismatch: "policy/attestation-hash-mismatch",
	policyDeniedChannelProvider: "policy/channels-denied-provider",
	policyHashMismatch: "policy/policy-hash-mismatch",
	policyInvalidFile: "policy/policy-jsonc-invalid",
	policyMissingFile: "policy/policy-jsonc-missing",
	policyDeniedMcpServer: "policy/mcp-denied-server",
	policyUnapprovedMcpServer: "policy/mcp-unapproved-server",
	policyDeniedModelProvider: "policy/models-denied-provider",
	policyUnapprovedModelProvider: "policy/models-unapproved-provider",
	policyPrivateNetworkAccess: "policy/network-private-access-enabled",
	policyGatewayNonLoopbackBind: "policy/gateway-non-loopback-bind",
	policyGatewayAuthDisabled: "policy/gateway-auth-disabled",
	policyGatewayRateLimitMissing: "policy/gateway-rate-limit-missing",
	policyGatewayControlUiInsecure: "policy/gateway-control-ui-insecure",
	policyGatewayTailscaleFunnel: "policy/gateway-tailscale-funnel",
	policyGatewayRemoteEnabled: "policy/gateway-remote-enabled",
	policyGatewayHttpEndpointEnabled: "policy/gateway-http-endpoint-enabled",
	policyGatewayHttpUrlFetchUnrestricted: "policy/gateway-http-url-fetch-unrestricted",
	policyAgentsWorkspaceAccessDenied: "policy/agents-workspace-access-denied",
	policyAgentsToolNotDenied: "policy/agents-tool-not-denied",
	policyToolsElevatedEnabled: "policy/tools-elevated-enabled",
	policyToolsAlsoAllowMissing: "policy/tools-also-allow-missing",
	policyToolsAlsoAllowUnexpected: "policy/tools-also-allow-unexpected",
	policyToolsExecAskUnapproved: "policy/tools-exec-ask-unapproved",
	policyToolsExecHostUnapproved: "policy/tools-exec-host-unapproved",
	policyToolsExecSecurityUnapproved: "policy/tools-exec-security-unapproved",
	policyToolsFsWorkspaceOnlyRequired: "policy/tools-fs-workspace-only-required",
	policyToolsProfileUnapproved: "policy/tools-profile-unapproved",
	policyToolsRequiredDenyMissing: "policy/tools-required-deny-missing",
	policySecretsUnmanagedProvider: "policy/secrets-unmanaged-provider",
	policySecretsDeniedProviderSource: "policy/secrets-denied-provider-source",
	policySecretsInsecureProvider: "policy/secrets-insecure-provider",
	policyAuthProfileInvalidMetadata: "policy/auth-profile-invalid-metadata",
	policyAuthProfileUnapprovedMode: "policy/auth-profile-unapproved-mode",
	policyMissingToolOwner: "policy/tools-missing-owner",
	policyMissingToolRisk: "policy/tools-missing-risk-level",
	policyMissingToolSensitivity: "policy/tools-missing-sensitivity-token",
	policyUnknownToolRisk: "policy/tools-unknown-risk-level",
	policyUnknownToolSensitivity: "policy/tools-unknown-sensitivity-token"
};
const POLICY_CHECK_IDS = [
	CHECK_IDS.policyMissingFile,
	CHECK_IDS.policyInvalidFile,
	CHECK_IDS.policyHashMismatch,
	CHECK_IDS.policyAttestationMismatch,
	CHECK_IDS.policyDeniedChannelProvider,
	CHECK_IDS.policyDeniedMcpServer,
	CHECK_IDS.policyUnapprovedMcpServer,
	CHECK_IDS.policyDeniedModelProvider,
	CHECK_IDS.policyUnapprovedModelProvider,
	CHECK_IDS.policyPrivateNetworkAccess,
	CHECK_IDS.policyGatewayNonLoopbackBind,
	CHECK_IDS.policyGatewayAuthDisabled,
	CHECK_IDS.policyGatewayRateLimitMissing,
	CHECK_IDS.policyGatewayControlUiInsecure,
	CHECK_IDS.policyGatewayTailscaleFunnel,
	CHECK_IDS.policyGatewayRemoteEnabled,
	CHECK_IDS.policyGatewayHttpEndpointEnabled,
	CHECK_IDS.policyGatewayHttpUrlFetchUnrestricted,
	CHECK_IDS.policyAgentsWorkspaceAccessDenied,
	CHECK_IDS.policyAgentsToolNotDenied,
	CHECK_IDS.policyToolsProfileUnapproved,
	CHECK_IDS.policyToolsFsWorkspaceOnlyRequired,
	CHECK_IDS.policyToolsExecSecurityUnapproved,
	CHECK_IDS.policyToolsExecAskUnapproved,
	CHECK_IDS.policyToolsExecHostUnapproved,
	CHECK_IDS.policyToolsElevatedEnabled,
	CHECK_IDS.policyToolsAlsoAllowMissing,
	CHECK_IDS.policyToolsAlsoAllowUnexpected,
	CHECK_IDS.policyToolsRequiredDenyMissing,
	CHECK_IDS.policySecretsUnmanagedProvider,
	CHECK_IDS.policySecretsDeniedProviderSource,
	CHECK_IDS.policySecretsInsecureProvider,
	CHECK_IDS.policyAuthProfileInvalidMetadata,
	CHECK_IDS.policyAuthProfileUnapprovedMode,
	CHECK_IDS.policyMissingToolRisk,
	CHECK_IDS.policyUnknownToolRisk,
	CHECK_IDS.policyMissingToolSensitivity,
	CHECK_IDS.policyMissingToolOwner,
	CHECK_IDS.policyUnknownToolSensitivity
];
const POLICY_RULE_METADATA = [
	{
		policyPath: [
			"agents",
			"workspace",
			"allowedAccess"
		],
		strictness: "allowlist-subset",
		valueType: "string-list",
		checkIds: [CHECK_IDS.policyAgentsWorkspaceAccessDenied],
		emptyList: "disabled",
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: [
			"agents",
			"workspace",
			"denyTools"
		],
		strictness: "denylist-superset",
		valueType: "string-list",
		checkIds: [CHECK_IDS.policyAgentsToolNotDenied],
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: [
			"tools",
			"profiles",
			"allow"
		],
		strictness: "allowlist-subset",
		valueType: "string-list",
		checkIds: [CHECK_IDS.policyToolsProfileUnapproved],
		emptyList: "disabled",
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: [
			"tools",
			"fs",
			"requireWorkspaceOnly"
		],
		strictness: "requires-true",
		valueType: "boolean",
		checkIds: [CHECK_IDS.policyToolsFsWorkspaceOnlyRequired],
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: [
			"tools",
			"exec",
			"allowSecurity"
		],
		strictness: "allowlist-subset",
		valueType: "string-list",
		checkIds: [CHECK_IDS.policyToolsExecSecurityUnapproved],
		emptyList: "disabled",
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: [
			"tools",
			"exec",
			"requireAsk"
		],
		strictness: "allowlist-subset",
		valueType: "string-list",
		checkIds: [CHECK_IDS.policyToolsExecAskUnapproved],
		emptyList: "disabled",
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: [
			"tools",
			"exec",
			"allowHosts"
		],
		strictness: "allowlist-subset",
		valueType: "string-list",
		checkIds: [CHECK_IDS.policyToolsExecHostUnapproved],
		emptyList: "disabled",
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: [
			"tools",
			"elevated",
			"allow"
		],
		strictness: "requires-false",
		valueType: "boolean",
		checkIds: [CHECK_IDS.policyToolsElevatedEnabled],
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: [
			"tools",
			"alsoAllow",
			"expected"
		],
		strictness: "exact-list",
		valueType: "string-list",
		checkIds: [CHECK_IDS.policyToolsAlsoAllowMissing, CHECK_IDS.policyToolsAlsoAllowUnexpected],
		emptyList: "meaningful",
		scopeSelectors: ["agentIds"]
	},
	{
		policyPath: ["tools", "denyTools"],
		strictness: "denylist-superset",
		valueType: "string-list",
		checkIds: [CHECK_IDS.policyToolsRequiredDenyMissing],
		scopeSelectors: ["agentIds"]
	}
];
const KNOWN_RISK_LEVELS = [
	"low",
	"medium",
	"high",
	"critical"
];
const KNOWN_SENSITIVITY_LEVELS = [
	"public",
	"internal",
	"confidential",
	"restricted"
];
const SUPPORTED_TOOL_METADATA = [
	"risk",
	"sensitivity",
	"owner"
];
const SUPPORTED_AUTH_PROFILE_METADATA = ["provider", "mode"];
const SUPPORTED_AUTH_PROFILE_MODES = [
	"api_key",
	"aws-sdk",
	"oauth",
	"token"
];
const SUPPORTED_GATEWAY_HTTP_ENDPOINTS = ["chatCompletions", "responses"];
const SUPPORTED_AGENT_WORKSPACE_DENY_TOOLS = [
	"exec",
	"process",
	"write",
	"edit",
	"apply_patch"
];
const SUPPORTED_TOOL_PROFILES = [
	"minimal",
	"coding",
	"messaging",
	"full"
];
const SUPPORTED_TOOL_EXEC_SECURITY = [
	"deny",
	"allowlist",
	"full"
];
const SUPPORTED_TOOL_EXEC_ASK = [
	"off",
	"on-miss",
	"always"
];
const SUPPORTED_TOOL_EXEC_HOST = [
	"auto",
	"sandbox",
	"gateway",
	"node"
];
let registered = false;
const policyEvaluationCache = /* @__PURE__ */ new WeakMap();
function registerPolicyDoctorChecks(host) {
	if (registered) return;
	const registerHealthCheck$1 = host?.registerHealthCheck ?? registerHealthCheck;
	registerHealthCheck$1(policyMissingFileCheck);
	registerHealthCheck$1(policyInvalidFileCheck);
	registerHealthCheck$1(policyHashMismatchCheck);
	registerHealthCheck$1(policyAttestationMismatchCheck);
	registerHealthCheck$1(policyChannelsDeniedProviderCheck);
	registerHealthCheck$1(policyMcpDeniedServerCheck);
	registerHealthCheck$1(policyMcpUnapprovedServerCheck);
	registerHealthCheck$1(policyModelsDeniedProviderCheck);
	registerHealthCheck$1(policyModelsUnapprovedProviderCheck);
	registerHealthCheck$1(policyNetworkPrivateAccessCheck);
	registerHealthCheck$1(policyGatewayNonLoopbackBindCheck);
	registerHealthCheck$1(policyGatewayAuthDisabledCheck);
	registerHealthCheck$1(policyGatewayRateLimitMissingCheck);
	registerHealthCheck$1(policyGatewayControlUiInsecureCheck);
	registerHealthCheck$1(policyGatewayTailscaleFunnelCheck);
	registerHealthCheck$1(policyGatewayRemoteEnabledCheck);
	registerHealthCheck$1(policyGatewayHttpEndpointEnabledCheck);
	registerHealthCheck$1(policyGatewayHttpUrlFetchUnrestrictedCheck);
	registerHealthCheck$1(policyAgentsWorkspaceAccessDeniedCheck);
	registerHealthCheck$1(policyAgentsToolNotDeniedCheck);
	registerHealthCheck$1(policyToolsProfileUnapprovedCheck);
	registerHealthCheck$1(policyToolsFsWorkspaceOnlyRequiredCheck);
	registerHealthCheck$1(policyToolsExecSecurityUnapprovedCheck);
	registerHealthCheck$1(policyToolsExecAskUnapprovedCheck);
	registerHealthCheck$1(policyToolsExecHostUnapprovedCheck);
	registerHealthCheck$1(policyToolsElevatedEnabledCheck);
	registerHealthCheck$1(policyToolsAlsoAllowMissingCheck);
	registerHealthCheck$1(policyToolsAlsoAllowUnexpectedCheck);
	registerHealthCheck$1(policyToolsRequiredDenyMissingCheck);
	registerHealthCheck$1(policySecretsUnmanagedProviderCheck);
	registerHealthCheck$1(policySecretsDeniedProviderSourceCheck);
	registerHealthCheck$1(policySecretsInsecureProviderCheck);
	registerHealthCheck$1(policyAuthProfileInvalidMetadataCheck);
	registerHealthCheck$1(policyAuthProfileUnapprovedModeCheck);
	registerHealthCheck$1(policyToolsMissingRiskCheck);
	registerHealthCheck$1(policyToolsUnknownRiskCheck);
	registerHealthCheck$1(policyToolsMissingSensitivityCheck);
	registerHealthCheck$1(policyToolsMissingOwnerCheck);
	registerHealthCheck$1(policyToolsUnknownSensitivityCheck);
	registered = true;
}
function evaluatePolicy(ctx) {
	const cached = policyEvaluationCache.get(ctx);
	if (cached !== void 0) return cached;
	const next = evaluatePolicyUncached(ctx);
	policyEvaluationCache.set(ctx, next);
	return next;
}
const policyMissingFileCheck = {
	id: CHECK_IDS.policyMissingFile,
	kind: "plugin",
	description: "The enabled Policy plugin has a policy file to verify.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyMissingFile);
	}
};
const policyHashMismatchCheck = {
	id: CHECK_IDS.policyHashMismatch,
	kind: "plugin",
	description: "The policy file matches the configured expected hash.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyHashMismatch);
	}
};
const policyAttestationMismatchCheck = {
	id: CHECK_IDS.policyAttestationMismatch,
	kind: "plugin",
	description: "The current policy check matches the accepted attestation.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyAttestationMismatch);
	}
};
const policyInvalidFileCheck = {
	id: CHECK_IDS.policyInvalidFile,
	kind: "plugin",
	description: "The enabled policy file parses before policy checks run.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyInvalidFile);
	}
};
const policyChannelsDeniedProviderCheck = {
	id: CHECK_IDS.policyDeniedChannelProvider,
	kind: "plugin",
	description: "Configured channels satisfy policy deny rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyDeniedChannelProvider);
	},
	async repair(ctx, findings) {
		if (!workspaceRepairsEnabled(ctx)) return workspaceRepairsDisabledResult("channel config");
		const channelIds = channelIdsFromFindings(findings);
		if (channelIds.length === 0) return {
			status: "skipped",
			reason: "no channel findings matched a configurable channel",
			changes: []
		};
		const next = disableChannels(ctx.cfg, channelIds);
		if (next.changed.length === 0) return {
			status: "skipped",
			reason: "matching channels were already disabled or missing",
			changes: []
		};
		return {
			config: next.config,
			changes: next.changed.map((id) => `Disabled channels.${id}.enabled for policy conformance.`)
		};
	}
};
const policyMcpDeniedServerCheck = {
	id: CHECK_IDS.policyDeniedMcpServer,
	kind: "plugin",
	description: "Configured MCP servers do not match policy deny rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyDeniedMcpServer);
	}
};
const policyMcpUnapprovedServerCheck = {
	id: CHECK_IDS.policyUnapprovedMcpServer,
	kind: "plugin",
	description: "Configured MCP servers do not match policy allow rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyUnapprovedMcpServer);
	}
};
const policyModelsDeniedProviderCheck = {
	id: CHECK_IDS.policyDeniedModelProvider,
	kind: "plugin",
	description: "Configured model providers do not match policy deny rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyDeniedModelProvider);
	}
};
const policyModelsUnapprovedProviderCheck = {
	id: CHECK_IDS.policyUnapprovedModelProvider,
	kind: "plugin",
	description: "Configured model providers do not match policy allow rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyUnapprovedModelProvider);
	}
};
const policyNetworkPrivateAccessCheck = {
	id: CHECK_IDS.policyPrivateNetworkAccess,
	kind: "plugin",
	description: "Network SSRF policy settings match private-network requirements.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyPrivateNetworkAccess);
	}
};
const policyGatewayNonLoopbackBindCheck = {
	id: CHECK_IDS.policyGatewayNonLoopbackBind,
	kind: "plugin",
	description: "Gateway bind posture matches policy exposure requirements.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyGatewayNonLoopbackBind);
	}
};
const policyGatewayAuthDisabledCheck = {
	id: CHECK_IDS.policyGatewayAuthDisabled,
	kind: "plugin",
	description: "Gateway authentication remains enabled when required by policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyGatewayAuthDisabled);
	}
};
const policyGatewayRateLimitMissingCheck = {
	id: CHECK_IDS.policyGatewayRateLimitMissing,
	kind: "plugin",
	description: "Gateway authentication rate-limit posture is explicit when required by policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyGatewayRateLimitMissing);
	}
};
const policyGatewayControlUiInsecureCheck = {
	id: CHECK_IDS.policyGatewayControlUiInsecure,
	kind: "plugin",
	description: "Gateway Control UI insecure exposure toggles remain disabled by policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyGatewayControlUiInsecure);
	}
};
const policyGatewayTailscaleFunnelCheck = {
	id: CHECK_IDS.policyGatewayTailscaleFunnel,
	kind: "plugin",
	description: "Gateway Tailscale Funnel exposure matches policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyGatewayTailscaleFunnel);
	}
};
const policyGatewayRemoteEnabledCheck = {
	id: CHECK_IDS.policyGatewayRemoteEnabled,
	kind: "plugin",
	description: "Remote gateway mode matches policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyGatewayRemoteEnabled);
	}
};
const policyGatewayHttpEndpointEnabledCheck = {
	id: CHECK_IDS.policyGatewayHttpEndpointEnabled,
	kind: "plugin",
	description: "Gateway HTTP API endpoints match policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyGatewayHttpEndpointEnabled);
	}
};
const policyGatewayHttpUrlFetchUnrestrictedCheck = {
	id: CHECK_IDS.policyGatewayHttpUrlFetchUnrestricted,
	kind: "plugin",
	description: "Gateway HTTP URL-fetch inputs have allowlists when required by policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyGatewayHttpUrlFetchUnrestricted);
	}
};
const policyAgentsWorkspaceAccessDeniedCheck = {
	id: CHECK_IDS.policyAgentsWorkspaceAccessDenied,
	kind: "plugin",
	description: "Agent sandbox workspace access matches policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyAgentsWorkspaceAccessDenied);
	}
};
const policyAgentsToolNotDeniedCheck = {
	id: CHECK_IDS.policyAgentsToolNotDenied,
	kind: "plugin",
	description: "Agent workspace mutation/runtime tools are denied when policy requires it.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyAgentsToolNotDenied);
	}
};
const policyToolsProfileUnapprovedCheck = {
	id: CHECK_IDS.policyToolsProfileUnapproved,
	kind: "plugin",
	description: "Configured tool profiles match policy allow rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsProfileUnapproved);
	}
};
const policyToolsFsWorkspaceOnlyRequiredCheck = {
	id: CHECK_IDS.policyToolsFsWorkspaceOnlyRequired,
	kind: "plugin",
	description: "Filesystem tools use workspace-only posture when policy requires it.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsFsWorkspaceOnlyRequired);
	}
};
const policyToolsExecSecurityUnapprovedCheck = {
	id: CHECK_IDS.policyToolsExecSecurityUnapproved,
	kind: "plugin",
	description: "Exec tool security mode matches policy allow rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsExecSecurityUnapproved);
	}
};
const policyToolsExecAskUnapprovedCheck = {
	id: CHECK_IDS.policyToolsExecAskUnapproved,
	kind: "plugin",
	description: "Exec tool ask mode matches policy allow rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsExecAskUnapproved);
	}
};
const policyToolsExecHostUnapprovedCheck = {
	id: CHECK_IDS.policyToolsExecHostUnapproved,
	kind: "plugin",
	description: "Exec tool host routing matches policy allow rules.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsExecHostUnapproved);
	}
};
const policyToolsElevatedEnabledCheck = {
	id: CHECK_IDS.policyToolsElevatedEnabled,
	kind: "plugin",
	description: "Elevated tool mode remains disabled when policy requires it.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsElevatedEnabled);
	}
};
const policyToolsAlsoAllowMissingCheck = {
	id: CHECK_IDS.policyToolsAlsoAllowMissing,
	kind: "plugin",
	description: "Configured tools.alsoAllow entries include policy expected lists.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsAlsoAllowMissing);
	}
};
const policyToolsAlsoAllowUnexpectedCheck = {
	id: CHECK_IDS.policyToolsAlsoAllowUnexpected,
	kind: "plugin",
	description: "Configured tools.alsoAllow entries match policy expected lists.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsAlsoAllowUnexpected);
	}
};
const policyToolsRequiredDenyMissingCheck = {
	id: CHECK_IDS.policyToolsRequiredDenyMissing,
	kind: "plugin",
	description: "Configured tool deny lists include tools required by policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyToolsRequiredDenyMissing);
	}
};
const policySecretsUnmanagedProviderCheck = {
	id: CHECK_IDS.policySecretsUnmanagedProvider,
	kind: "plugin",
	description: "OpenClaw config SecretRefs use configured secret providers when policy requires managed providers.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policySecretsUnmanagedProvider);
	}
};
const policySecretsDeniedProviderSourceCheck = {
	id: CHECK_IDS.policySecretsDeniedProviderSource,
	kind: "plugin",
	description: "OpenClaw config secret providers and SecretRefs do not use sources denied by policy.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policySecretsDeniedProviderSource);
	}
};
const policySecretsInsecureProviderCheck = {
	id: CHECK_IDS.policySecretsInsecureProvider,
	kind: "plugin",
	description: "Configured secret providers do not opt into insecure posture unless policy allows it.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policySecretsInsecureProvider);
	}
};
const policyAuthProfileInvalidMetadataCheck = {
	id: CHECK_IDS.policyAuthProfileInvalidMetadata,
	kind: "plugin",
	description: "OpenClaw config auth profiles declare required provider and mode metadata.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyAuthProfileInvalidMetadata);
	}
};
const policyAuthProfileUnapprovedModeCheck = {
	id: CHECK_IDS.policyAuthProfileUnapprovedMode,
	kind: "plugin",
	description: "OpenClaw config auth profile modes stay within the policy allowlist.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyAuthProfileUnapprovedMode);
	}
};
const policyToolsMissingRiskCheck = {
	id: CHECK_IDS.policyMissingToolRisk,
	kind: "plugin",
	description: "TOOLS.md policy entries declare explicit risk levels.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyMissingToolRisk);
	}
};
const policyToolsUnknownRiskCheck = {
	id: CHECK_IDS.policyUnknownToolRisk,
	kind: "plugin",
	description: "TOOLS.md policy entries use known risk levels.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyUnknownToolRisk);
	}
};
const policyToolsMissingSensitivityCheck = {
	id: CHECK_IDS.policyMissingToolSensitivity,
	kind: "plugin",
	description: "TOOLS.md policy entries declare default artifact sensitivity.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyMissingToolSensitivity);
	}
};
const policyToolsUnknownSensitivityCheck = {
	id: CHECK_IDS.policyUnknownToolSensitivity,
	kind: "plugin",
	description: "TOOLS.md policy entries use known sensitivity levels.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyUnknownToolSensitivity);
	}
};
const policyToolsMissingOwnerCheck = {
	id: CHECK_IDS.policyMissingToolOwner,
	kind: "plugin",
	description: "TOOLS.md policy entries declare an accountable owner.",
	source: "policy",
	async detect(ctx) {
		return findingsForCheck(await evaluatePolicy(ctx), CHECK_IDS.policyMissingToolOwner);
	}
};
async function evaluatePolicyUncached(ctx) {
	const settings = policySettings(ctx);
	const policyPath = policyDisplayName(ctx);
	let evidence = collectPolicyEvidence(ctx.cfg, {
		includeGatewayExposure: false,
		includeAgentWorkspace: false,
		includeToolPosture: false,
		includeSecrets: false,
		includeAuthProfiles: false
	});
	const findings = [];
	if (!policyChecksEnabled(ctx, settings)) return {
		policyPath,
		evidence,
		expectedAttestationHash: settings.expectedAttestationHash,
		findings,
		attestedFindings: findings
	};
	const policyFile = await readPolicyFile(ctx);
	if (policyFile === null) {
		findings.push({
			checkId: CHECK_IDS.policyMissingFile,
			severity: "warning",
			message: `${policyPath} is missing for the enabled Policy plugin.`,
			source: "policy",
			path: policyPath,
			fixHint: `Restore ${policyPath} or add the policy artifact for this workspace.`
		});
		return {
			policyPath,
			evidence,
			expectedAttestationHash: settings.expectedAttestationHash,
			findings,
			attestedFindings: findings
		};
	}
	const parsedPolicy = parsePolicyFile(policyFile.raw);
	if (!parsedPolicy.ok) {
		findings.push(policyParseFinding(policyFile.displayName, policyFile.ocDocName, parsedPolicy));
		return {
			policyPath,
			evidence,
			expectedAttestationHash: settings.expectedAttestationHash,
			findings,
			attestedFindings: findings
		};
	}
	const policy = parsedPolicy.value;
	const policyHash = policyDocumentHash(policy);
	const expectedHash = settings.expectedHash;
	if (typeof expectedHash === "string" && expectedHash.trim() !== "" && policyHash !== expectedHash.trim()) {
		findings.push({
			checkId: CHECK_IDS.policyHashMismatch,
			severity: "error",
			message: `${policyFile.displayName} does not match the configured policy hash.`,
			source: "policy",
			path: policyFile.displayName,
			target: `oc://${policyFile.ocDocName}`,
			requirement: "oc://openclaw.config/plugins/entries/policy/config/expectedHash",
			fixHint: `Restore the approved policy artifact or update plugins.entries.policy.config.expectedHash after review.`
		});
		return {
			policyPath,
			policy: {
				value: policy,
				hash: policyHash
			},
			evidence,
			expectedAttestationHash: settings.expectedAttestationHash,
			findings,
			attestedFindings: findings
		};
	}
	const metadataRequirementFindings = toolMetadataRequirementFindings(policy, policyFile.displayName, policyFile.ocDocName);
	const authMetadataRequirementFindings = authProfileMetadataRequirementFindings(policy, policyFile.displayName, policyFile.ocDocName);
	const requiredMetadata = metadataRequirementFindings.length === 0 ? requiredToolMetadata(policy) : /* @__PURE__ */ new Set();
	const includeSecrets = policyHasSecretRules(policy);
	const includeAuthProfiles = policyHasAuthProfileRules(policy);
	const includeGatewayExposure = policyHasGatewayRules(policy);
	const includeAgentWorkspace = policyHasAgentWorkspaceRules(policy);
	if (requiredMetadata.size > 0) {
		const toolsFile = await readWorkspaceFile(ctx, "TOOLS.md");
		evidence = await collectPolicyEvidence(ctx.cfg, {
			toolsRaw: toolsFile?.raw ?? "",
			includeGatewayExposure,
			includeAgentWorkspace,
			includeToolPosture: policyHasToolPostureRules(policy),
			includeSecrets,
			includeAuthProfiles
		});
	} else evidence = collectPolicyEvidence(ctx.cfg, {
		includeGatewayExposure,
		includeAgentWorkspace,
		includeToolPosture: policyHasToolPostureRules(policy),
		includeSecrets,
		includeAuthProfiles
	});
	const policyFindings = [
		...policyContainerShapeFindings(policy, policyFile.displayName, policyFile.ocDocName),
		...channelFindings(policy, policyFile.displayName, policyFile.ocDocName, evidence),
		...mcpServerFindings(policy, policyFile.ocDocName, evidence),
		...modelProviderFindings(policy, policyFile.ocDocName, evidence),
		...networkFindings(policy, policyFile.ocDocName, evidence),
		...gatewayExposureFindings(policy, policyFile.ocDocName, evidence),
		...agentWorkspaceFindings(policy, policyFile.displayName, policyFile.ocDocName, evidence),
		...toolPostureFindings(policy, policyFile.displayName, policyFile.ocDocName, evidence),
		...secretAuthProvenanceFindings(policy, policyFile.displayName, policyFile.ocDocName, evidence),
		...authMetadataRequirementFindings,
		...metadataRequirementFindings
	];
	if (requiredMetadata.has("risk")) {
		policyFindings.push(...toolRiskFindings(policyFile.ocDocName, evidence));
		policyFindings.push(...toolUnknownRiskFindings(policyFile.ocDocName, evidence));
	}
	if (requiredMetadata.has("sensitivity")) policyFindings.push(...toolSensitivityFindings(policyFile.ocDocName, evidence));
	if (requiredMetadata.has("owner")) policyFindings.push(...toolOwnerFindings(policyFile.ocDocName, evidence));
	const attestationFindings = policyAttestationFindings(policyFile.displayName, policyHash, evidence, policyFindings, settings);
	if (hasPolicyValidationFinding(policyFindings)) findings.push(...policyFindings);
	else if (attestationFindings.length > 0) findings.push(...attestationFindings);
	else findings.push(...policyFindings);
	return {
		policyPath,
		policy: {
			value: policy,
			hash: policyHash
		},
		evidence,
		expectedAttestationHash: settings.expectedAttestationHash,
		findings,
		attestedFindings: policyFindings
	};
}
function policyParseFinding(policyPath, policyDocName, parseError) {
	return {
		checkId: CHECK_IDS.policyInvalidFile,
		severity: "error",
		message: `${policyPath} could not be parsed: ${parseError.message}`,
		source: "policy",
		path: policyPath,
		target: `oc://${policyDocName}`,
		fixHint: `Fix ${policyPath} so policy conformance checks can run.`
	};
}
function findingsForCheck(evaluation, checkId) {
	return evaluation.findings.filter((finding) => finding.checkId === checkId);
}
function hasPolicyValidationFinding(findings) {
	return findings.some((finding) => finding.checkId === CHECK_IDS.policyInvalidFile);
}
function channelFindings(policy, policyPath, policyDocName, evidence) {
	const invalidRules = invalidChannelDenyRuleFindings(policy, policyPath, policyDocName);
	if (invalidRules.length > 0) return invalidRules;
	const denyRules = readChannelDenyRules(policy, policyDocName);
	if (denyRules.length === 0) return [];
	return evidence.channels.flatMap((channel) => {
		if (channel.enabled === false) return [];
		const rule = denyRules.find((candidate) => candidate.when?.provider === channel.provider);
		if (rule === void 0) return [];
		return [{
			checkId: CHECK_IDS.policyDeniedChannelProvider,
			severity: "error",
			message: `Channel '${channel.id}' uses denied provider '${channel.provider}'.`,
			source: "policy",
			path: "openclaw config",
			ocPath: channel.source,
			target: channel.source,
			requirement: rule.requirement,
			fixHint: rule.reason ?? "Disable this channel, remove it from config, or update the policy deny rule."
		}];
	});
}
function policyAttestationFindings(policyPath, policyHash, evidence, findings, settings) {
	const expected = settings.expectedAttestationHash?.trim();
	if (!expected) return [];
	const current = createPolicyAttestation({
		ok: findings.length === 0,
		checkedAt: (/* @__PURE__ */ new Date(0)).toISOString(),
		policyPath,
		policyHash,
		evidence,
		findings: findings.map(toAttestedFinding)
	});
	if (current.attestationHash === expected) return [];
	return [{
		checkId: CHECK_IDS.policyAttestationMismatch,
		severity: "error",
		message: "The current policy check no longer matches the accepted policy attestation.",
		source: "policy",
		path: "policy attestation",
		target: "oc://policy/attestation/current",
		requirement: "oc://openclaw.config/plugins/entries/policy/config/expectedAttestationHash",
		fixHint: `Run policy check, review attestation ${current.attestationHash}, then update plugins.entries.policy.config.expectedAttestationHash and the supervisor/gateway accepted attestation.`
	}];
}
function toAttestedFinding(finding) {
	return {
		checkId: finding.checkId,
		severity: finding.severity,
		message: finding.message,
		...finding.source !== void 0 ? { source: finding.source } : {},
		...finding.path !== void 0 ? { path: finding.path } : {},
		...finding.line !== void 0 ? { line: finding.line } : {},
		...finding.column !== void 0 ? { column: finding.column } : {},
		...finding.ocPath !== void 0 ? { ocPath: finding.ocPath } : {},
		...finding.target !== void 0 ? { target: finding.target } : {},
		...finding.requirement !== void 0 ? { requirement: finding.requirement } : {},
		...finding.fixHint !== void 0 ? { fixHint: finding.fixHint } : {}
	};
}
function toolMetadataRequirementFindings(policy, policyPath, policyDocName) {
	if (!isRecord(policy) || !isRecord(policy.tools) || policy.tools.requireMetadata === void 0) return [];
	if (!Array.isArray(policy.tools.requireMetadata)) return [{
		checkId: CHECK_IDS.policyInvalidFile,
		severity: "error",
		message: `${policyPath} tools.requireMetadata must be an array of metadata keys.`,
		source: "policy",
		path: policyPath,
		target: `oc://${policyDocName}/tools/requireMetadata`,
		fixHint: `Use supported metadata keys: ${SUPPORTED_TOOL_METADATA.join(", ")}.`
	}];
	const invalidIndex = policy.tools.requireMetadata.findIndex((entry) => typeof entry !== "string" || !SUPPORTED_TOOL_METADATA.includes(entry.trim().toLowerCase()));
	if (invalidIndex < 0) return [];
	return [{
		checkId: CHECK_IDS.policyInvalidFile,
		severity: "error",
		message: `${policyPath} tools.requireMetadata[${invalidIndex}] must be a supported metadata key.`,
		source: "policy",
		path: policyPath,
		target: `oc://${policyDocName}/tools/requireMetadata/#${invalidIndex}`,
		fixHint: `Use supported metadata keys: ${SUPPORTED_TOOL_METADATA.join(", ")}.`
	}];
}
function policyContainerShapeFindings(policy, policyPath, policyDocName) {
	if (!isRecord(policy)) return [policyShapeFinding(policyPath, `oc://${policyDocName}`, `${policyPath} must contain a policy object.`, `Fix ${policyPath} so the top-level policy is an object.`)];
	if (policy.tools !== void 0 && !isRecord(policy.tools)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/tools`, `${policyPath} tools must be an object.`, `Fix ${policyPath} so tools is an object.`)];
	if (isRecord(policy.tools)) {
		if (policy.tools.settings !== void 0 && !isRecord(policy.tools.settings)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/tools/settings`, `${policyPath} tools.settings must be an object.`, `Fix ${policyPath} so tools.settings is an object.`)];
		if (policy.tools.entries !== void 0 && !Array.isArray(policy.tools.entries)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/tools/entries`, `${policyPath} tools.entries must be an array.`, `Fix ${policyPath} so tools.entries is an array.`)];
		const postureFinding = toolPosturePolicyShapeFinding(policy.tools, {
			policyDocName,
			policyPath
		});
		if (postureFinding !== void 0) return [postureFinding];
	}
	if (policy.channels !== void 0 && !isRecord(policy.channels)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/channels`, `${policyPath} channels must be an object.`, `Fix ${policyPath} so channels is an object.`)];
	if (policy.mcp !== void 0 && !isRecord(policy.mcp)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/mcp`, `${policyPath} mcp must be an object.`, `Fix ${policyPath} so mcp is an object.`)];
	if (isRecord(policy.mcp)) {
		const finding = policyStringArrayShapeFinding(policy.mcp.servers, {
			property: "mcp.servers",
			policyDocName,
			policyPath,
			target: "mcp/servers",
			valueName: "MCP server id"
		});
		if (finding !== void 0) return [finding];
	}
	if (policy.models !== void 0 && !isRecord(policy.models)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/models`, `${policyPath} models must be an object.`, `Fix ${policyPath} so models is an object.`)];
	if (isRecord(policy.models)) {
		const finding = policyStringArrayShapeFinding(policy.models.providers, {
			property: "models.providers",
			policyDocName,
			policyPath,
			target: "models/providers",
			valueName: "model provider id"
		});
		if (finding !== void 0) return [finding];
	}
	if (policy.network !== void 0 && !isRecord(policy.network)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/network`, `${policyPath} network must be an object.`, `Fix ${policyPath} so network is an object.`)];
	if (isRecord(policy.network)) {
		if (policy.network.privateNetwork !== void 0 && !isRecord(policy.network.privateNetwork)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/network/privateNetwork`, `${policyPath} network.privateNetwork must be an object.`, `Fix ${policyPath} so network.privateNetwork is an object.`)];
		if (isRecord(policy.network.privateNetwork) && policy.network.privateNetwork.allow !== void 0 && typeof policy.network.privateNetwork.allow !== "boolean") return [policyShapeFinding(policyPath, `oc://${policyDocName}/network/privateNetwork/allow`, `${policyPath} network.privateNetwork.allow must be a boolean.`, `Fix ${policyPath} so network.privateNetwork.allow is true or false.`)];
	}
	if (policy.secrets !== void 0 && !isRecord(policy.secrets)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/secrets`, `${policyPath} secrets must be an object.`, `Fix ${policyPath} so secrets is an object.`)];
	if (policy.auth !== void 0 && !isRecord(policy.auth)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/auth`, `${policyPath} auth must be an object.`, `Fix ${policyPath} so auth is an object.`)];
	if (isRecord(policy.auth) && policy.auth.profiles !== void 0 && !isRecord(policy.auth.profiles)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/auth/profiles`, `${policyPath} auth.profiles must be an object.`, `Fix ${policyPath} so auth.profiles is an object.`)];
	const gatewayFinding = gatewayPolicyShapeFinding(policy.gateway, {
		policyDocName,
		policyPath
	});
	if (gatewayFinding !== void 0) return [gatewayFinding];
	const agentsFinding = agentsPolicyShapeFinding(policy.agents, {
		policyDocName,
		policyPath
	});
	if (agentsFinding !== void 0) return [agentsFinding];
	const scopesFinding = scopedPolicyShapeFinding(policy.scopes, {
		policyDocName,
		policyPath,
		policy
	});
	if (scopesFinding !== void 0) return [scopesFinding];
	return [];
}
function agentsPolicyShapeFinding(value, params) {
	if (value === void 0) return;
	if (!isRecord(value)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/agents`, `${params.policyPath} agents must be an object.`, `Fix ${params.policyPath} so agents is an object.`);
	const workspaceFinding = agentWorkspacePolicyShapeFinding(value.workspace, {
		policyDocName: params.policyDocName,
		policyPath: params.policyPath,
		targetPrefix: "agents/workspace",
		propertyPrefix: "agents.workspace"
	});
	if (workspaceFinding !== void 0) return workspaceFinding;
}
function scopedPolicyShapeFinding(value, params) {
	if (value === void 0) return;
	if (!isRecord(value)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/scopes`, `${params.policyPath} scopes must be an object.`, `Fix ${params.policyPath} so scopes maps scope names to policy overlays with selectors such as agentIds.`);
	for (const [scopeName, overlay] of Object.entries(value)) {
		const targetPrefix = `scopes/${ocPathSegment(scopeName)}`;
		if (!isRecord(overlay)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}`, `${params.policyPath} scopes.${scopeName} must be an object.`, `Fix ${params.policyPath} so the named policy scope is an object.`);
		if (overlay.agentIds === void 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/agentIds`, `${params.policyPath} scopes.${scopeName}.agentIds is required for scoped tools or agent workspace policy.`, `List the runtime agent ids that this named policy scope applies to.`);
		const agentIdsFinding = policyStringArrayPropertyShapeFinding(overlay.agentIds, {
			policyDocName: params.policyDocName,
			policyPath: params.policyPath,
			property: `scopes.${scopeName}.agentIds`,
			target: `${targetPrefix}/agentIds`,
			valueName: "agent id"
		});
		if (agentIdsFinding !== void 0) return agentIdsFinding;
		if (Array.isArray(overlay.agentIds) && overlay.agentIds.length === 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/agentIds`, `${params.policyPath} scopes.${scopeName}.agentIds must include at least one agent id.`, `Add one or more runtime agent ids to ${params.policyPath} scopes.${scopeName}.agentIds.`);
		if (Array.isArray(overlay.agentIds)) {
			const seen = /* @__PURE__ */ new Map();
			for (const [index, agentId] of overlay.agentIds.entries()) {
				if (typeof agentId !== "string") continue;
				const normalized = normalizeAgentId(agentId);
				const previous = seen.get(normalized);
				if (previous !== void 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/agentIds/#${index}`, `${params.policyPath} scopes.${scopeName}.agentIds[${index}] duplicates agentIds[${previous}] after normalization.`, `List each runtime agent id only once per named policy scope.`);
				seen.set(normalized, index);
			}
		}
		const unsupportedKey = Object.keys(overlay).find((key) => key !== "agentIds" && key !== "agents" && key !== "tools");
		if (unsupportedKey !== void 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/${ocPathSegment(unsupportedKey)}`, `${params.policyPath} scopes.${scopeName}.${unsupportedKey} is not supported by the agentIds selector.`, `Use only agentIds with agents.workspace or tools in this policy scope.`);
		if (overlay.agents !== void 0 && !isRecord(overlay.agents)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/agents`, `${params.policyPath} scopes.${scopeName}.agents must be an object.`, `Fix ${params.policyPath} so the scoped agents policy section is an object.`);
		const scopedAgents = isRecord(overlay.agents) ? overlay.agents : {};
		const unsupportedAgentKey = Object.keys(scopedAgents).find((key) => key !== "workspace");
		if (unsupportedAgentKey !== void 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/agents/${ocPathSegment(unsupportedAgentKey)}`, `${params.policyPath} scopes.${scopeName}.agents.${unsupportedAgentKey} is not supported by the agentIds selector.`, `Move the rule under agents.workspace or a supported scoped top-level section.`);
		const workspaceFinding = agentWorkspacePolicyShapeFinding(scopedAgents.workspace, {
			policyDocName: params.policyDocName,
			policyPath: params.policyPath,
			targetPrefix: `${targetPrefix}/agents/workspace`,
			propertyPrefix: `scopes.${scopeName}.agents.workspace`
		});
		if (workspaceFinding !== void 0) return workspaceFinding;
		if (overlay.tools !== void 0 && !isRecord(overlay.tools)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/tools`, `${params.policyPath} scopes.${scopeName}.tools must be an object.`, `Fix ${params.policyPath} so the scoped tools policy overlay is an object.`);
		if (isRecord(overlay.tools)) {
			const toolsFinding = scopedToolsPolicyShapeFinding(overlay.tools, {
				policyDocName: params.policyDocName,
				policyPath: params.policyPath,
				targetPrefix: `${targetPrefix}/tools`,
				propertyPrefix: `scopes.${scopeName}.tools`
			});
			if (toolsFinding !== void 0) return toolsFinding;
		}
	}
	return duplicateScopedAgentFieldFinding(value, {
		policyDocName: params.policyDocName,
		policyPath: params.policyPath,
		policy: params.policy
	});
}
function scopedToolsPolicyShapeFinding(value, params) {
	const allowedTopLevel = new Set([
		"profiles",
		"fs",
		"exec",
		"elevated",
		"alsoAllow",
		"denyTools"
	]);
	const unsupportedTopLevel = Object.keys(value).find((key) => !allowedTopLevel.has(key));
	if (unsupportedTopLevel !== void 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.targetPrefix}/${ocPathSegment(unsupportedTopLevel)}`, `${params.policyPath} ${params.propertyPrefix}.${unsupportedTopLevel} is not supported in agent-scoped tools policy.`, `Move ${params.propertyPrefix}.${unsupportedTopLevel} to top-level tools or use a supported scoped tools posture rule.`);
	for (const [section, allowedKeys] of [
		["profiles", ["allow"]],
		["fs", ["requireWorkspaceOnly"]],
		["exec", [
			"allowSecurity",
			"requireAsk",
			"allowHosts"
		]],
		["elevated", ["allow"]],
		["alsoAllow", ["expected"]]
	]) {
		const sectionValue = value[section];
		if (!isRecord(sectionValue)) continue;
		const allowed = new Set(allowedKeys);
		const unsupportedKey = Object.keys(sectionValue).find((key) => !allowed.has(key));
		if (unsupportedKey !== void 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.targetPrefix}/${section}/${ocPathSegment(unsupportedKey)}`, `${params.policyPath} ${params.propertyPrefix}.${section}.${unsupportedKey} is not supported in agent-scoped tools policy.`, `Move ${params.propertyPrefix}.${section}.${unsupportedKey} to top-level tools or use a supported scoped tools posture rule.`);
	}
	return toolPosturePolicyShapeFinding(value, params);
}
function agentWorkspacePolicyShapeFinding(value, params) {
	if (value === void 0) return;
	if (!isRecord(value)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.targetPrefix}`, `${params.policyPath} ${params.propertyPrefix} must be an object.`, `Fix ${params.policyPath} so ${params.propertyPrefix} is an object.`);
	const allowedAccess = value.allowedAccess;
	if (allowedAccess !== void 0 && !Array.isArray(allowedAccess)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.targetPrefix}/allowedAccess`, `${params.policyPath} ${params.propertyPrefix}.allowedAccess must be an array.`, "Use workspace access values such as [\"none\", \"ro\"].");
	if (Array.isArray(allowedAccess)) {
		const invalidIndex = allowedAccess.findIndex((entry) => entry !== "none" && entry !== "ro" && entry !== "rw");
		if (invalidIndex >= 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.targetPrefix}/allowedAccess/#${invalidIndex}`, `${params.policyPath} ${params.propertyPrefix}.allowedAccess[${invalidIndex}] must be none, ro, or rw.`, "Use workspace access values such as [\"none\", \"ro\"].");
	}
	const denyTools = value.denyTools;
	if (denyTools !== void 0 && !Array.isArray(denyTools)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.targetPrefix}/denyTools`, `${params.policyPath} ${params.propertyPrefix}.denyTools must be an array.`, "Use tool ids such as [\"exec\", \"process\", \"write\", \"edit\", \"apply_patch\"].");
	if (Array.isArray(denyTools)) {
		const invalidIndex = denyTools.findIndex((entry) => typeof entry !== "string" || !SUPPORTED_AGENT_WORKSPACE_DENY_TOOLS.includes(entry.trim()));
		if (invalidIndex >= 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.targetPrefix}/denyTools/#${invalidIndex}`, `${params.policyPath} ${params.propertyPrefix}.denyTools[${invalidIndex}] must be a supported agent workspace tool id.`, `Use supported tool ids: ${SUPPORTED_AGENT_WORKSPACE_DENY_TOOLS.join(", ")}.`);
	}
}
function toolPosturePolicyShapeFinding(tools, params) {
	const targetPrefix = params.targetPrefix ?? "tools";
	const propertyPrefix = params.propertyPrefix ?? "tools";
	for (const section of [
		"profiles",
		"fs",
		"exec",
		"elevated",
		"alsoAllow"
	]) if (tools[section] !== void 0 && !isRecord(tools[section])) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/${section}`, `${params.policyPath} ${propertyPrefix}.${section} must be an object.`, `Fix ${params.policyPath} so ${propertyPrefix}.${section} is an object.`);
	const profileAllowFinding = policyStringArrayPropertyShapeFinding((isRecord(tools.profiles) ? tools.profiles : {}).allow, {
		allowed: SUPPORTED_TOOL_PROFILES,
		policyDocName: params.policyDocName,
		policyPath: params.policyPath,
		property: `${propertyPrefix}.profiles.allow`,
		target: `${targetPrefix}/profiles/allow`,
		valueName: "tool profile id"
	});
	if (profileAllowFinding !== void 0) return profileAllowFinding;
	const fs = isRecord(tools.fs) ? tools.fs : {};
	if (fs.requireWorkspaceOnly !== void 0 && typeof fs.requireWorkspaceOnly !== "boolean") return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/fs/requireWorkspaceOnly`, `${params.policyPath} ${propertyPrefix}.fs.requireWorkspaceOnly must be a boolean.`, `Set ${propertyPrefix}.fs.requireWorkspaceOnly to true or false.`);
	const exec = isRecord(tools.exec) ? tools.exec : {};
	const execLists = [
		[
			"allowSecurity",
			SUPPORTED_TOOL_EXEC_SECURITY,
			"exec security mode"
		],
		[
			"requireAsk",
			SUPPORTED_TOOL_EXEC_ASK,
			"exec ask mode"
		],
		[
			"allowHosts",
			SUPPORTED_TOOL_EXEC_HOST,
			"exec host"
		]
	];
	for (const [key, supported, valueName] of execLists) {
		const finding = policyStringArrayPropertyShapeFinding(exec[key], {
			allowed: supported,
			policyDocName: params.policyDocName,
			policyPath: params.policyPath,
			property: `${propertyPrefix}.exec.${key}`,
			target: `${targetPrefix}/exec/${key}`,
			valueName
		});
		if (finding !== void 0) return finding;
	}
	const elevated = isRecord(tools.elevated) ? tools.elevated : {};
	if (elevated.allow !== void 0 && typeof elevated.allow !== "boolean") return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${targetPrefix}/elevated/allow`, `${params.policyPath} ${propertyPrefix}.elevated.allow must be a boolean.`, `Set ${propertyPrefix}.elevated.allow to true or false.`);
	const alsoAllowExpectedFinding = policyStringArrayPropertyShapeFinding((isRecord(tools.alsoAllow) ? tools.alsoAllow : {}).expected, {
		policyDocName: params.policyDocName,
		policyPath: params.policyPath,
		property: `${propertyPrefix}.alsoAllow.expected`,
		target: `${targetPrefix}/alsoAllow/expected`,
		valueName: "tool id"
	});
	if (alsoAllowExpectedFinding !== void 0) return alsoAllowExpectedFinding;
	return policyStringArrayPropertyShapeFinding(tools.denyTools, {
		policyDocName: params.policyDocName,
		policyPath: params.policyPath,
		property: `${propertyPrefix}.denyTools`,
		target: `${targetPrefix}/denyTools`,
		valueName: "tool id or group"
	});
}
function gatewayPolicyShapeFinding(value, params) {
	if (value === void 0) return;
	if (!isRecord(value)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/gateway`, `${params.policyPath} gateway must be an object.`, `Fix ${params.policyPath} so gateway is an object.`);
	for (const section of [
		"exposure",
		"auth",
		"controlUi",
		"remote",
		"http"
	]) if (value[section] !== void 0 && !isRecord(value[section])) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/gateway/${section}`, `${params.policyPath} gateway.${section} must be an object.`, `Fix ${params.policyPath} so gateway.${section} is an object.`);
	const exposure = isRecord(value.exposure) ? value.exposure : {};
	const auth = isRecord(value.auth) ? value.auth : {};
	const controlUi = isRecord(value.controlUi) ? value.controlUi : {};
	const remote = isRecord(value.remote) ? value.remote : {};
	const http = isRecord(value.http) ? value.http : {};
	const booleanRules = [
		[
			"gateway/exposure/allowNonLoopbackBind",
			"gateway.exposure.allowNonLoopbackBind",
			exposure.allowNonLoopbackBind
		],
		[
			"gateway/exposure/allowTailscaleFunnel",
			"gateway.exposure.allowTailscaleFunnel",
			exposure.allowTailscaleFunnel
		],
		[
			"gateway/auth/requireAuth",
			"gateway.auth.requireAuth",
			auth.requireAuth
		],
		[
			"gateway/auth/requireExplicitRateLimit",
			"gateway.auth.requireExplicitRateLimit",
			auth.requireExplicitRateLimit
		],
		[
			"gateway/controlUi/allowInsecure",
			"gateway.controlUi.allowInsecure",
			controlUi.allowInsecure
		],
		[
			"gateway/remote/allow",
			"gateway.remote.allow",
			remote.allow
		],
		[
			"gateway/http/requireUrlAllowlists",
			"gateway.http.requireUrlAllowlists",
			http.requireUrlAllowlists
		]
	];
	for (const [target, property, ruleValue] of booleanRules) if (ruleValue !== void 0 && typeof ruleValue !== "boolean") return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${target}`, `${params.policyPath} ${property} must be a boolean.`, `Fix ${params.policyPath} so ${property} is true or false.`);
	const denyEndpoints = http.denyEndpoints;
	if (denyEndpoints !== void 0 && !Array.isArray(denyEndpoints)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/gateway/http/denyEndpoints`, `${params.policyPath} gateway.http.denyEndpoints must be an array.`, "Use an array of endpoint ids such as [\"responses\"] or remove gateway.http.denyEndpoints.");
	if (Array.isArray(denyEndpoints)) {
		const invalidIndex = denyEndpoints.findIndex((entry) => typeof entry !== "string" || !SUPPORTED_GATEWAY_HTTP_ENDPOINTS.includes(entry.trim()));
		if (invalidIndex >= 0) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/gateway/http/denyEndpoints/#${invalidIndex}`, `${params.policyPath} gateway.http.denyEndpoints[${invalidIndex}] must be a supported endpoint id.`, `Use supported endpoint ids: ${SUPPORTED_GATEWAY_HTTP_ENDPOINTS.join(", ")}.`);
	}
}
function policyStringArrayShapeFinding(value, params) {
	if (value === void 0) return;
	if (!isRecord(value)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.target}`, `${params.policyPath} ${params.property} must be an object.`, `Fix ${params.policyPath} so ${params.property} is an object.`);
	for (const key of ["allow", "deny"]) {
		const entries = value[key];
		if (entries === void 0) continue;
		const target = `oc://${params.policyDocName}/${params.target}/${key}`;
		if (!Array.isArray(entries)) return policyShapeFinding(params.policyPath, target, `${params.policyPath} ${params.property}.${key} must be an array.`, `Fix ${params.policyPath} so ${params.property}.${key} is an array of ${params.valueName}s.`);
		const invalidIndex = entries.findIndex((entry) => typeof entry !== "string" || entry.trim() === "");
		if (invalidIndex >= 0) return policyShapeFinding(params.policyPath, `${target}/#${invalidIndex}`, `${params.policyPath} ${params.property}.${key}[${invalidIndex}] must be a non-empty string.`, `Fix ${params.policyPath} so each ${params.property}.${key} entry is a ${params.valueName}.`);
	}
}
function policyStringArrayPropertyShapeFinding(value, params) {
	if (value === void 0) return;
	if (!Array.isArray(value)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.target}`, `${params.policyPath} ${params.property} must be an array.`, `Fix ${params.policyPath} so ${params.property} is an array of ${params.valueName}s.`);
	const invalidIndex = value.findIndex((entry) => {
		if (typeof entry !== "string" || entry.trim() === "") return true;
		return params.allowed !== void 0 && !params.allowed.includes(entry.trim());
	});
	if (invalidIndex < 0) return;
	const allowedHint = params.allowed === void 0 ? "" : ` Supported values: ${params.allowed.join(", ")}.`;
	return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${params.target}/#${invalidIndex}`, `${params.policyPath} ${params.property}[${invalidIndex}] must be a supported ${params.valueName}.`, `Use non-empty ${params.valueName} entries.${allowedHint}`);
}
function policyShapeFinding(policyPath, target, message, fixHint) {
	return {
		checkId: CHECK_IDS.policyInvalidFile,
		severity: "error",
		message,
		source: "policy",
		path: policyPath,
		target,
		fixHint
	};
}
function authProfileMetadataRequirementFindings(policy, policyPath, policyDocName) {
	if (!isRecord(policy) || !isRecord(policy.auth) || !isRecord(policy.auth.profiles) || policy.auth.profiles.requireMetadata === void 0) return [];
	if (!Array.isArray(policy.auth.profiles.requireMetadata)) return [{
		checkId: CHECK_IDS.policyInvalidFile,
		severity: "error",
		message: `${policyPath} auth.profiles.requireMetadata must be an array of metadata keys.`,
		source: "policy",
		path: policyPath,
		target: `oc://${policyDocName}/auth/profiles/requireMetadata`,
		fixHint: `Use supported metadata keys: ${SUPPORTED_AUTH_PROFILE_METADATA.join(", ")}.`
	}];
	const invalidIndex = policy.auth.profiles.requireMetadata.findIndex((entry) => typeof entry !== "string" || !SUPPORTED_AUTH_PROFILE_METADATA.includes(entry.trim().toLowerCase()));
	if (invalidIndex < 0) return [];
	return [{
		checkId: CHECK_IDS.policyInvalidFile,
		severity: "error",
		message: `${policyPath} auth.profiles.requireMetadata[${invalidIndex}] must be a supported metadata key.`,
		source: "policy",
		path: policyPath,
		target: `oc://${policyDocName}/auth/profiles/requireMetadata/#${invalidIndex}`,
		fixHint: `Use supported metadata keys: ${SUPPORTED_AUTH_PROFILE_METADATA.join(", ")}.`
	}];
}
function invalidChannelDenyRuleFindings(policy, policyPath, policyDocName) {
	if (!isRecord(policy) || !isRecord(policy.channels) || policy.channels.denyRules === void 0) return [];
	if (!Array.isArray(policy.channels.denyRules)) return [{
		checkId: CHECK_IDS.policyInvalidFile,
		severity: "error",
		message: `${policyPath} channels.denyRules must be an array.`,
		source: "policy",
		path: policyPath,
		target: `oc://${policyDocName}/channels/denyRules`,
		fixHint: `Fix ${policyPath} so channel deny rules are an array.`
	}];
	const invalid = policy.channels.denyRules.findIndex((rule) => !isChannelDenyRule(rule));
	if (invalid < 0) return [];
	return [{
		checkId: CHECK_IDS.policyInvalidFile,
		severity: "error",
		message: `${policyPath} channels.denyRules[${invalid}] must define when.provider as a string.`,
		source: "policy",
		path: policyPath,
		target: `oc://${policyDocName}/channels/denyRules/#${invalid}`,
		fixHint: `Fix ${policyPath} so each channel deny rule has a provider match.`
	}];
}
function mcpServerFindings(policy, policyDocName, evidence) {
	const denied = new Set(readStringList(policy, [
		"mcp",
		"servers",
		"deny"
	], { lowercase: false }));
	const allowed = readStringList(policy, [
		"mcp",
		"servers",
		"allow"
	], { lowercase: false });
	const allowedSet = new Set(allowed);
	const findings = [];
	for (const server of evidence.mcpServers) {
		if (denied.has(server.id)) {
			findings.push({
				checkId: CHECK_IDS.policyDeniedMcpServer,
				severity: "error",
				message: `MCP server '${server.id}' is denied by policy.`,
				source: "policy",
				path: "openclaw config",
				ocPath: server.source,
				target: server.source,
				requirement: `oc://${policyDocName}/mcp/servers/deny`,
				fixHint: "Remove this configured MCP server or update the policy after review."
			});
			continue;
		}
		if (allowedSet.size > 0 && !allowedSet.has(server.id)) findings.push({
			checkId: CHECK_IDS.policyUnapprovedMcpServer,
			severity: "error",
			message: `MCP server '${server.id}' is not in the policy allowlist.`,
			source: "policy",
			path: "openclaw config",
			ocPath: server.source,
			target: server.source,
			requirement: `oc://${policyDocName}/mcp/servers/allow`,
			fixHint: "Use an approved MCP server or update the policy after review."
		});
	}
	return findings;
}
function modelProviderFindings(policy, policyDocName, evidence) {
	const denied = new Set(readModelProviderPolicyList(policy, [
		"models",
		"providers",
		"deny"
	]));
	const allowed = readModelProviderPolicyList(policy, [
		"models",
		"providers",
		"allow"
	]);
	const allowedSet = new Set(allowed);
	const findings = [];
	for (const provider of evidence.modelProviders) findings.push(...modelProviderConformanceFindings(provider, denied, allowedSet, policyDocName));
	for (const modelRef of evidence.modelRefs) findings.push(...modelRefConformanceFindings(modelRef, denied, allowedSet, policyDocName));
	return findings;
}
function readModelProviderPolicyList(policy, path) {
	return readStringList(policy, path).map((provider) => normalizeProviderId(provider));
}
function modelProviderConformanceFindings(provider, denied, allowed, policyDocName) {
	const findings = [];
	if (denied.has(provider.id)) findings.push({
		checkId: CHECK_IDS.policyDeniedModelProvider,
		severity: "error",
		message: `Model provider '${provider.id}' is denied by policy.`,
		source: "policy",
		path: "openclaw config",
		ocPath: provider.source,
		target: provider.source,
		requirement: `oc://${policyDocName}/models/providers/deny`,
		fixHint: "Remove this configured provider or update the policy after review."
	});
	if (!denied.has(provider.id) && allowed.size > 0 && !allowed.has(provider.id)) findings.push({
		checkId: CHECK_IDS.policyUnapprovedModelProvider,
		severity: "error",
		message: `Model provider '${provider.id}' is not in the policy allowlist.`,
		source: "policy",
		path: "openclaw config",
		ocPath: provider.source,
		target: provider.source,
		requirement: `oc://${policyDocName}/models/providers/allow`,
		fixHint: "Use an approved model provider or update the policy after review."
	});
	return findings;
}
function modelRefConformanceFindings(modelRef, denied, allowed, policyDocName) {
	const findings = [];
	if (denied.has(modelRef.provider)) findings.push({
		checkId: CHECK_IDS.policyDeniedModelProvider,
		severity: "error",
		message: `Model ref '${modelRef.ref}' uses denied provider '${modelRef.provider}'.`,
		source: "policy",
		path: "openclaw config",
		ocPath: modelRef.source,
		target: modelRef.source,
		requirement: `oc://${policyDocName}/models/providers/deny`,
		fixHint: "Select an approved model provider or update the policy after review."
	});
	if (!denied.has(modelRef.provider) && allowed.size > 0 && !allowed.has(modelRef.provider)) findings.push({
		checkId: CHECK_IDS.policyUnapprovedModelProvider,
		severity: "error",
		message: `Model ref '${modelRef.ref}' uses unapproved provider '${modelRef.provider}'.`,
		source: "policy",
		path: "openclaw config",
		ocPath: modelRef.source,
		target: modelRef.source,
		requirement: `oc://${policyDocName}/models/providers/allow`,
		fixHint: "Select an approved model provider or update the policy after review."
	});
	return findings;
}
function networkFindings(policy, policyDocName, evidence) {
	if (readPolicyBoolean(policy, [
		"network",
		"privateNetwork",
		"allow"
	]) !== false) return [];
	return evidence.network.filter((setting) => setting.value).map((setting) => {
		return {
			checkId: CHECK_IDS.policyPrivateNetworkAccess,
			severity: "error",
			message: `Network setting '${setting.id}' allows private-network access.`,
			source: "policy",
			path: "openclaw config",
			ocPath: setting.source,
			target: setting.source,
			requirement: `oc://${policyDocName}/network/privateNetwork/allow`,
			fixHint: "Disable this private-network access setting or update policy after review."
		};
	});
}
function gatewayExposureFindings(policy, policyDocName, evidence) {
	return [
		...gatewayNonLoopbackBindFindings(policy, policyDocName, evidence),
		...gatewayAuthFindings(policy, policyDocName, evidence),
		...gatewayControlUiFindings(policy, policyDocName, evidence),
		...gatewayTailscaleFindings(policy, policyDocName, evidence),
		...gatewayRemoteFindings(policy, policyDocName, evidence),
		...gatewayHttpEndpointFindings(policy, policyDocName, evidence),
		...gatewayHttpUrlFetchFindings(policy, policyDocName, evidence)
	];
}
function gatewayNonLoopbackBindFindings(policy, policyDocName, evidence) {
	if (readPolicyBoolean(policy, [
		"gateway",
		"exposure",
		"allowNonLoopbackBind"
	]) !== false) return [];
	return (evidence.gatewayExposure ?? []).filter((entry) => entry.kind === "bind" && entry.nonLoopback === true).map((entry) => {
		return {
			checkId: CHECK_IDS.policyGatewayNonLoopbackBind,
			severity: "error",
			message: entry.explicit === false ? "Gateway bind is omitted while the runtime default can permit non-loopback exposure." : `Gateway bind setting '${entry.id}' permits non-loopback exposure.`,
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/gateway/exposure/allowNonLoopbackBind`,
			fixHint: "Use gateway.bind=loopback or update policy after review."
		};
	});
}
function gatewayAuthFindings(policy, policyDocName, evidence) {
	const findings = [];
	if (readPolicyBoolean(policy, [
		"gateway",
		"auth",
		"requireAuth"
	]) === true) findings.push(...(evidence.gatewayExposure ?? []).filter((entry) => entry.kind === "auth" && entry.value === "none").map((entry) => {
		return {
			checkId: CHECK_IDS.policyGatewayAuthDisabled,
			severity: "error",
			message: "Gateway authentication is disabled.",
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/gateway/auth/requireAuth`,
			fixHint: "Set gateway.auth.mode to token, password, or trusted-proxy."
		};
	}));
	if (readPolicyBoolean(policy, [
		"gateway",
		"auth",
		"requireExplicitRateLimit"
	]) === true) findings.push(...(evidence.gatewayExposure ?? []).filter((entry) => entry.kind === "authRateLimit" && entry.explicit !== true).map((entry) => {
		return {
			checkId: CHECK_IDS.policyGatewayRateLimitMissing,
			severity: "error",
			message: "Gateway authentication rate-limit posture is not explicit.",
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/gateway/auth/requireExplicitRateLimit`,
			fixHint: "Configure gateway.auth.rateLimit or update policy after review."
		};
	}));
	return findings;
}
function gatewayControlUiFindings(policy, policyDocName, evidence) {
	if (readPolicyBoolean(policy, [
		"gateway",
		"controlUi",
		"allowInsecure"
	]) !== false) return [];
	return (evidence.gatewayExposure ?? []).filter((entry) => entry.kind === "controlUi" && entry.value === true && (entry.id === "gateway-control-ui-insecure-auth" || entry.id === "gateway-control-ui-device-auth-disabled" || entry.id === "gateway-control-ui-host-origin-fallback")).map((entry) => {
		return {
			checkId: CHECK_IDS.policyGatewayControlUiInsecure,
			severity: "error",
			message: `Gateway Control UI insecure toggle '${entry.id}' is enabled.`,
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/gateway/controlUi/allowInsecure`,
			fixHint: "Disable the insecure Control UI toggle or update policy after review."
		};
	});
}
function gatewayTailscaleFindings(policy, policyDocName, evidence) {
	if (readPolicyBoolean(policy, [
		"gateway",
		"exposure",
		"allowTailscaleFunnel"
	]) !== false) return [];
	return (evidence.gatewayExposure ?? []).filter((entry) => entry.kind === "tailscale" && entry.value === "funnel").map((entry) => {
		return {
			checkId: CHECK_IDS.policyGatewayTailscaleFunnel,
			severity: "error",
			message: "Gateway Tailscale Funnel exposure is enabled.",
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/gateway/exposure/allowTailscaleFunnel`,
			fixHint: "Use tailscale serve/off or update policy after review."
		};
	});
}
function gatewayRemoteFindings(policy, policyDocName, evidence) {
	if (readPolicyBoolean(policy, [
		"gateway",
		"remote",
		"allow"
	]) !== false) return [];
	return (evidence.gatewayExposure ?? []).filter((entry) => entry.kind === "remote").map((entry) => {
		return {
			checkId: CHECK_IDS.policyGatewayRemoteEnabled,
			severity: "error",
			message: `Gateway remote posture '${entry.id}' is enabled.`,
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/gateway/remote/allow`,
			fixHint: "Disable remote gateway mode/config or update policy after review."
		};
	});
}
function gatewayHttpEndpointFindings(policy, policyDocName, evidence) {
	const denied = new Set(readStringList(policy, [
		"gateway",
		"http",
		"denyEndpoints"
	]).map((endpoint) => endpoint.toLowerCase()));
	if (denied.size === 0) return [];
	return (evidence.gatewayExposure ?? []).filter((entry) => entry.kind === "httpEndpoint" && entry.endpoint !== void 0 && denied.has(entry.endpoint.toLowerCase())).map((entry) => {
		return {
			checkId: CHECK_IDS.policyGatewayHttpEndpointEnabled,
			severity: "error",
			message: `Gateway HTTP endpoint '${entry.endpoint ?? entry.id}' is denied by policy.`,
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/gateway/http/denyEndpoints`,
			fixHint: "Disable the HTTP endpoint or update policy after review."
		};
	});
}
function gatewayHttpUrlFetchFindings(policy, policyDocName, evidence) {
	if (readPolicyBoolean(policy, [
		"gateway",
		"http",
		"requireUrlAllowlists"
	]) !== true) return [];
	return (evidence.gatewayExposure ?? []).filter((entry) => entry.kind === "httpUrlFetch" && entry.hasAllowlist !== true).map((entry) => {
		return {
			checkId: CHECK_IDS.policyGatewayHttpUrlFetchUnrestricted,
			severity: "error",
			message: `Gateway HTTP URL-fetch input '${entry.id}' has no URL allowlist.`,
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/gateway/http/requireUrlAllowlists`,
			fixHint: "Add a urlAllowlist for this URL-fetch input or update policy after review."
		};
	});
}
function agentWorkspaceFindings(policy, policyPath, policyDocName, evidence) {
	if (agentsPolicyShapeFinding(isRecord(policy) ? policy.agents : void 0, {
		policyDocName,
		policyPath
	}) !== void 0) return [];
	return [
		...agentWorkspaceAccessFindings(policy, [
			"agents",
			"workspace",
			"allowedAccess"
		], policyDocName, "agents/workspace/allowedAccess", evidence, () => true),
		...agentWorkspaceToolDenyFindings(policy, [
			"agents",
			"workspace",
			"denyTools"
		], policyDocName, "agents/workspace/denyTools", evidence, () => true),
		...agentScopedWorkspaceFindings(policy, policyPath, policyDocName, evidence)
	];
}
function agentWorkspaceAccessFindings(policy, policyPath, policyDocName, requirementPath, evidence, evidenceFilter) {
	const allowed = new Set(readStringList(policy, policyPath));
	if (allowed.size === 0) return [];
	return (evidence.agentWorkspace ?? []).filter(evidenceFilter).filter((entry) => entry.kind === "workspaceAccess" && entry.value !== void 0 && (entry.sandboxEnabled !== true || !allowed.has(entry.value))).map((entry) => {
		const label = entry.agentId === void 0 ? "agents.defaults" : `agent '${entry.agentId}'`;
		const sandboxDisabled = entry.sandboxEnabled !== true;
		const observed = sandboxDisabled ? `sandbox mode '${entry.sandboxMode ?? "off"}'` : `sandbox workspaceAccess '${entry.value ?? ""}'`;
		const ocPath = sandboxDisabled ? entry.sandboxModeSource ?? entry.source : entry.source;
		return {
			checkId: CHECK_IDS.policyAgentsWorkspaceAccessDenied,
			severity: "error",
			message: `${label} ${observed} is not allowed by policy.`,
			source: "policy",
			path: "openclaw config",
			ocPath,
			target: ocPath,
			requirement: `oc://${policyDocName}/${requirementPath}`,
			fixHint: "Enable sandbox mode with workspaceAccess none/ro or update policy after review."
		};
	});
}
function agentWorkspaceToolDenyFindings(policy, policyPath, policyDocName, requirementPath, evidence, evidenceFilter) {
	const requiredDeniedTools = new Set(readStringList(policy, policyPath));
	if (requiredDeniedTools.size === 0) return [];
	return (evidence.agentWorkspace ?? []).filter(evidenceFilter).filter((entry) => entry.kind === "toolDeny" && entry.tool !== void 0 && requiredDeniedTools.has(entry.tool) && entry.denied !== true).map((entry) => {
		const label = entry.agentId === void 0 ? "agents.defaults" : `agent '${entry.agentId}'`;
		return {
			checkId: CHECK_IDS.policyAgentsToolNotDenied,
			severity: "error",
			message: `${label} does not deny required tool '${entry.tool ?? ""}'.`,
			source: "policy",
			path: "openclaw config",
			ocPath: entry.source,
			target: entry.source,
			requirement: `oc://${policyDocName}/${requirementPath}`,
			fixHint: "Add the tool to tools.deny or agents.list[].tools.deny, or update policy after review."
		};
	});
}
function agentScopedWorkspaceFindings(policy, policyPath, policyDocName, evidence) {
	if (!hasValidScopedPolicy(policy, policyPath, policyDocName)) return [];
	const findings = [];
	for (const target of agentScopedPolicyTargets(policy)) {
		const scopedAgents = isRecord(target.overlay.agents) ? target.overlay.agents : {};
		const workspace = isRecord(scopedAgents.workspace) ? scopedAgents.workspace : {};
		const requirementBase = `scopes/${ocPathSegment(target.scopeName)}/agents/workspace`;
		const evidenceFilter = (entry) => scopedWorkspaceAgentMatches(entry, target.agentId, evidence.agentWorkspace ?? []);
		findings.push(...agentWorkspaceAccessFindings({ workspace }, ["workspace", "allowedAccess"], policyDocName, `${requirementBase}/allowedAccess`, evidence, evidenceFilter), ...agentWorkspaceToolDenyFindings({ workspace }, ["workspace", "denyTools"], policyDocName, `${requirementBase}/denyTools`, evidence, evidenceFilter));
	}
	return findings;
}
function toolPostureFindings(policy, policyPath, policyDocName, evidence) {
	const findings = [];
	if (isRecord(policy) && isRecord(policy.tools) && toolPosturePolicyShapeFinding(policy.tools, {
		policyDocName,
		policyPath
	}) === void 0) findings.push(...toolPostureFindingsForRule(policy.tools, policyDocName, "tools", evidence, () => true));
	if (!hasValidScopedPolicy(policy, policyPath, policyDocName)) return findings;
	for (const target of agentScopedPolicyTargets(policy)) {
		if (!isRecord(target.overlay.tools)) continue;
		const requirementBase = `scopes/${ocPathSegment(target.scopeName)}/tools`;
		if (toolPosturePolicyShapeFinding(target.overlay.tools, {
			policyDocName,
			policyPath,
			targetPrefix: requirementBase,
			propertyPrefix: `scopes.${target.scopeName}.tools`
		}) !== void 0) continue;
		findings.push(...toolPostureFindingsForRule(target.overlay.tools, policyDocName, requirementBase, evidence, (entry) => scopedToolAgentMatches(entry, target.agentId, evidence.toolPosture ?? [])));
	}
	return findings;
}
function hasValidScopedPolicy(policy, policyPath, policyDocName) {
	return isRecord(policy) && scopedPolicyShapeFinding(policy.scopes, {
		policyDocName,
		policyPath,
		policy
	}) === void 0;
}
function scopedWorkspaceAgentMatches(entry, policyAgentId, entries) {
	if (scopedAgentIdMatches(entry.agentId, policyAgentId)) return true;
	return entry.scope === "defaults" && !hasScopedAgentEvidence(entries, entry.kind, policyAgentId);
}
function scopedToolAgentMatches(entry, policyAgentId, entries) {
	if (scopedAgentIdMatches(entry.agentId, policyAgentId)) return true;
	return entry.scope === "global" && !hasScopedToolEvidence(entries, entry.kind, policyAgentId);
}
function hasScopedAgentEvidence(entries, kind, policyAgentId) {
	return entries.some((candidate) => candidate.scope === "agent" && candidate.kind === kind && scopedAgentIdMatches(candidate.agentId, policyAgentId));
}
function hasScopedToolEvidence(entries, kind, policyAgentId) {
	return entries.some((candidate) => candidate.scope === "agent" && candidate.kind === kind && scopedAgentIdMatches(candidate.agentId, policyAgentId));
}
function scopedAgentIdMatches(evidenceAgentId, policyAgentId) {
	return evidenceAgentId !== void 0 && normalizeAgentId(evidenceAgentId) === normalizeAgentId(policyAgentId);
}
function toolPostureFindingsForRule(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter) {
	return [
		...toolProfileFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter),
		...toolFsWorkspaceOnlyFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter),
		...toolExecPostureFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter),
		...toolElevatedFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter),
		...toolAlsoAllowExpectedFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter),
		...toolRequiredDenyFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter)
	];
}
function toolProfileFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter) {
	const allowed = new Set(readStringList(toolsPolicy, ["profiles", "allow"]));
	if (allowed.size === 0) return [];
	return toolPostureEntries(evidence, "profile").filter(evidenceFilter).filter((entry) => typeof entry.value === "string" && !allowed.has(entry.value.toLowerCase())).map((entry) => {
		return toolPostureFinding(entry, {
			checkId: CHECK_IDS.policyToolsProfileUnapproved,
			message: `${toolPostureLabel(entry)} uses unapproved tool profile '${entry.value ?? ""}'.`,
			requirement: `oc://${policyDocName}/${requirementBase}/profiles/allow`,
			fixHint: "Use an approved tools.profile value or update policy after review."
		});
	});
}
function toolFsWorkspaceOnlyFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter) {
	if (readPolicyBoolean(toolsPolicy, ["fs", "requireWorkspaceOnly"]) !== true) return [];
	return toolPostureEntries(evidence, "fsWorkspaceOnly").filter(evidenceFilter).filter((entry) => entry.value !== true).map((entry) => {
		return toolPostureFinding(entry, {
			checkId: CHECK_IDS.policyToolsFsWorkspaceOnlyRequired,
			message: `${toolPostureLabel(entry)} does not require workspace-only filesystem tools.`,
			requirement: `oc://${policyDocName}/${requirementBase}/fs/requireWorkspaceOnly`,
			fixHint: "Set tools.fs.workspaceOnly=true or update policy after review."
		});
	});
}
function toolExecPostureFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter) {
	return [
		...toolStringPostureAllowFindings(toolsPolicy, policyDocName, requirementBase, evidence, {
			checkId: CHECK_IDS.policyToolsExecSecurityUnapproved,
			kind: "execSecurity",
			policyPath: ["exec", "allowSecurity"],
			requirementPath: "exec/allowSecurity",
			settingLabel: "exec security",
			evidenceFilter
		}),
		...toolStringPostureAllowFindings(toolsPolicy, policyDocName, requirementBase, evidence, {
			checkId: CHECK_IDS.policyToolsExecAskUnapproved,
			kind: "execAsk",
			policyPath: ["exec", "requireAsk"],
			requirementPath: "exec/requireAsk",
			settingLabel: "exec ask",
			evidenceFilter
		}),
		...toolStringPostureAllowFindings(toolsPolicy, policyDocName, requirementBase, evidence, {
			checkId: CHECK_IDS.policyToolsExecHostUnapproved,
			kind: "execHost",
			policyPath: ["exec", "allowHosts"],
			requirementPath: "exec/allowHosts",
			settingLabel: "exec host",
			evidenceFilter
		})
	];
}
function toolStringPostureAllowFindings(toolsPolicy, policyDocName, requirementBase, evidence, params) {
	const allowed = new Set(readStringList(toolsPolicy, params.policyPath));
	if (allowed.size === 0) return [];
	return toolPostureEntries(evidence, params.kind).filter(params.evidenceFilter).filter((entry) => typeof entry.value === "string" && !allowed.has(entry.value.toLowerCase())).map((entry) => {
		return toolPostureFinding(entry, {
			checkId: params.checkId,
			message: `${toolPostureLabel(entry)} uses unapproved ${params.settingLabel} '${entry.value ?? ""}'.`,
			requirement: `oc://${policyDocName}/${requirementBase}/${params.requirementPath}`,
			fixHint: "Adjust the configured tool posture or update policy after review."
		});
	});
}
function toolElevatedFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter) {
	if (readPolicyBoolean(toolsPolicy, ["elevated", "allow"]) !== false) return [];
	return toolPostureEntries(evidence, "elevatedEnabled").filter(evidenceFilter).filter((entry) => entry.value !== false).map((entry) => {
		return toolPostureFinding(entry, {
			checkId: CHECK_IDS.policyToolsElevatedEnabled,
			message: `${toolPostureLabel(entry)} permits elevated tool mode.`,
			requirement: `oc://${policyDocName}/${requirementBase}/elevated/allow`,
			fixHint: "Set tools.elevated.enabled=false or update policy after review."
		});
	});
}
function toolAlsoAllowExpectedFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter) {
	if ((isRecord(toolsPolicy.alsoAllow) ? toolsPolicy.alsoAllow : {}).expected === void 0) return [];
	const expected = normalizedStringSet(readStringList(toolsPolicy, ["alsoAllow", "expected"]));
	const findings = [];
	for (const entry of toolPostureEntries(evidence, "alsoAllow").filter(evidenceFilter)) {
		const actual = normalizedStringSet(entry.entries ?? []);
		for (const expectedTool of expected) {
			if (actual.has(expectedTool)) continue;
			findings.push(toolPostureFinding(entry, {
				checkId: CHECK_IDS.policyToolsAlsoAllowMissing,
				message: `${toolPostureLabel(entry)} is missing expected tools.alsoAllow entry '${expectedTool}'.`,
				requirement: `oc://${policyDocName}/${requirementBase}/alsoAllow/expected`,
				fixHint: "Add the expected tools.alsoAllow entry or update policy after review."
			}));
		}
		for (const actualTool of actual) {
			if (expected.has(actualTool)) continue;
			findings.push(toolPostureFinding(entry, {
				checkId: CHECK_IDS.policyToolsAlsoAllowUnexpected,
				message: `${toolPostureLabel(entry)} has unexpected tools.alsoAllow entry '${actualTool}'.`,
				requirement: `oc://${policyDocName}/${requirementBase}/alsoAllow/expected`,
				fixHint: "Remove the unexpected tools.alsoAllow entry or update policy after review."
			}));
		}
	}
	return findings;
}
function normalizedStringSet(entries) {
	return new Set(entries.map((entry) => entry.trim().toLowerCase()).filter(Boolean).toSorted());
}
function toolRequiredDenyFindings(toolsPolicy, policyDocName, requirementBase, evidence, evidenceFilter) {
	const required = readStringList(toolsPolicy, ["denyTools"]);
	if (required.length === 0) return [];
	const requiredTools = uniqueStrings(required.flatMap(expandPolicyToolRequirement));
	const findings = [];
	for (const entry of toolPostureEntries(evidence, "deny").filter(evidenceFilter)) for (const tool of requiredTools) {
		if (toolListCoversTool(entry.entries ?? [], tool)) continue;
		findings.push(toolPostureFinding(entry, {
			checkId: CHECK_IDS.policyToolsRequiredDenyMissing,
			message: `${toolPostureLabel(entry)} does not deny required tool '${tool}'.`,
			requirement: `oc://${policyDocName}/${requirementBase}/denyTools`,
			fixHint: "Add the tool or group to tools.deny/agents.list[].tools.deny, or update policy after review."
		}));
	}
	return findings;
}
function toolPostureEntries(evidence, kind) {
	return (evidence.toolPosture ?? []).filter((entry) => entry.kind === kind);
}
function toolPostureFinding(entry, params) {
	return {
		checkId: params.checkId,
		severity: "error",
		message: params.message,
		source: "policy",
		path: "openclaw config",
		ocPath: entry.source,
		target: entry.source,
		requirement: params.requirement,
		fixHint: params.fixHint
	};
}
function toolPostureLabel(entry) {
	return entry.agentId === void 0 ? "global tools config" : `agent '${entry.agentId}'`;
}
function secretAuthProvenanceFindings(policy, policyPath, policyDocName, evidence) {
	const secretShapeFindings = secretPolicyShapeFindings(policy, policyPath, policyDocName);
	const authShapeFindings = authProfileAllowModesShapeFindings(policy, policyPath, policyDocName);
	return [...secretShapeFindings.length > 0 ? secretShapeFindings : [
		...secretManagedProviderFindings(policy, policyDocName, evidence),
		...secretDeniedSourceFindings(policy, policyDocName, evidence),
		...secretInsecureProviderFindings(policy, policyDocName, evidence)
	], ...authShapeFindings.length > 0 ? authShapeFindings : [...authProfileMetadataFindings(policy, policyDocName, evidence), ...authProfileModeFindings(policy, policyDocName, evidence)]];
}
function policyHasSecretRules(policy) {
	if (!isRecord(policy) || !isRecord(policy.secrets)) return false;
	return policy.secrets.requireManagedProviders !== void 0 || policy.secrets.denySources !== void 0 || policy.secrets.allowInsecureProviders !== void 0;
}
function policyHasAuthProfileRules(policy) {
	return isRecord(policy) && isRecord(policy.auth) && isRecord(policy.auth.profiles) && (policy.auth.profiles.requireMetadata !== void 0 || policy.auth.profiles.allowModes !== void 0);
}
function policyHasGatewayRules(policy) {
	if (!isRecord(policy) || !isRecord(policy.gateway)) return false;
	const gateway = policy.gateway;
	return isRecord(gateway.exposure) && (gateway.exposure.allowNonLoopbackBind !== void 0 || gateway.exposure.allowTailscaleFunnel !== void 0) || isRecord(gateway.auth) && (gateway.auth.requireAuth !== void 0 || gateway.auth.requireExplicitRateLimit !== void 0) || isRecord(gateway.controlUi) && gateway.controlUi.allowInsecure !== void 0 || isRecord(gateway.remote) && gateway.remote.allow !== void 0 || isRecord(gateway.http) && (gateway.http.denyEndpoints !== void 0 || gateway.http.requireUrlAllowlists !== void 0);
}
function policyHasAgentWorkspaceRules(policy) {
	if (!isRecord(policy)) return false;
	if (isRecord(policy.agents) && workspacePolicyHasRules(policy.agents.workspace)) return true;
	return agentScopedPolicyOverlays(policy).some(([, overlay]) => {
		return workspacePolicyHasRules((isRecord(overlay.agents) ? overlay.agents : {}).workspace);
	});
}
function policyHasToolPostureRules(policy) {
	if (!isRecord(policy)) return false;
	if (toolPosturePolicyHasRules(policy.tools)) return true;
	return agentScopedPolicyOverlays(policy).some(([, overlay]) => toolPosturePolicyHasRules(overlay.tools));
}
function workspacePolicyHasRules(value) {
	return isRecord(value) && (value.allowedAccess !== void 0 || value.denyTools !== void 0);
}
function toolPosturePolicyHasRules(value) {
	if (!isRecord(value)) return false;
	const tools = value;
	return isRecord(tools.profiles) && tools.profiles.allow !== void 0 || isRecord(tools.fs) && tools.fs.requireWorkspaceOnly !== void 0 || isRecord(tools.exec) && (tools.exec.allowSecurity !== void 0 || tools.exec.requireAsk !== void 0 || tools.exec.allowHosts !== void 0) || isRecord(tools.elevated) && tools.elevated.allow !== void 0 || isRecord(tools.alsoAllow) && tools.alsoAllow.expected !== void 0 || tools.denyTools !== void 0;
}
function agentScopedPolicyOverlays(policy) {
	if (!isRecord(policy) || !isRecord(policy.scopes)) return [];
	return Object.entries(policy.scopes).filter((entry) => isRecord(entry[1]));
}
function agentScopedPolicyTargets(policy) {
	const targets = [];
	for (const [scopeName, overlay] of agentScopedPolicyOverlays(policy)) {
		if (!Array.isArray(overlay.agentIds)) continue;
		for (const rawAgentId of overlay.agentIds) {
			if (typeof rawAgentId !== "string" || rawAgentId.trim() === "") continue;
			targets.push({
				scopeName,
				agentId: normalizeAgentId(rawAgentId),
				overlay
			});
		}
	}
	return targets;
}
function duplicateScopedAgentFieldFinding(scopedAgents, params) {
	const seen = /* @__PURE__ */ new Map();
	for (const [scopeName, overlay] of Object.entries(scopedAgents)) {
		if (!isRecord(overlay) || !Array.isArray(overlay.agentIds)) continue;
		const fields = scopedAgentPolicyFields(scopeName, overlay);
		for (const rawAgentId of overlay.agentIds) {
			if (typeof rawAgentId !== "string" || rawAgentId.trim() === "") continue;
			const agentId = normalizeAgentId(rawAgentId);
			for (const field of fields) {
				const topLevelValue = getPolicyPath(params.policy, field.metadata.policyPath);
				if (topLevelValue !== void 0 && !isPolicyValueAtLeastAsStrict(field.metadata, field.value, topLevelValue)) return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${field.targetPath}`, `${params.policyPath} scopes.${scopeName}.${field.propertyPath} is weaker than the top-level ${field.propertyPath} policy.`, `Use an equally or more restrictive scoped value, or remove the scoped override.`);
				const key = `${agentId}\0${field.fieldPath}`;
				const previous = seen.get(key);
				if (previous !== void 0) {
					if (isPolicyValueAtLeastAsStrict(field.metadata, field.value, previous.field.value)) {
						seen.set(key, {
							scopeName,
							propertyPath: `scopes.${scopeName}.${field.propertyPath}`,
							field
						});
						continue;
					}
					return policyShapeFinding(params.policyPath, `oc://${params.policyDocName}/${field.targetPath}`, `${params.policyPath} scopes.${scopeName}.${field.propertyPath} is not an equally or more restrictive override of ${previous.propertyPath} for agent '${agentId}'.`, `Use one effective scoped value per agent, or make later scoped values stricter according to policy metadata.`);
				}
				seen.set(key, {
					scopeName,
					propertyPath: `scopes.${scopeName}.${field.propertyPath}`,
					field
				});
			}
		}
	}
}
function scopedAgentPolicyFields(scopeName, overlay) {
	const prefix = `scopes/${ocPathSegment(scopeName)}`;
	return POLICY_RULE_METADATA.filter((rule) => rule.scopeSelectors?.includes("agentIds")).map((rule) => ({
		rule,
		value: scopedPolicyValue(overlay, rule.policyPath)
	})).filter((entry) => entry.value !== void 0).map(({ rule, value }) => ({
		fieldPath: rule.policyPath.join("."),
		propertyPath: rule.policyPath.join("."),
		targetPath: `${prefix}/${rule.policyPath.map(ocPathSegment).join("/")}`,
		metadata: rule,
		value
	}));
}
function isPolicyValueAtLeastAsStrict(metadata, candidate, baseline) {
	switch (metadata.strictness) {
		case "allowlist-subset": return isPolicyAllowlistSubset(metadata, candidate, baseline);
		case "denylist-superset": return isPolicyDenylistSuperset(metadata, candidate, baseline);
		case "requires-true": return baseline !== true || candidate === true;
		case "requires-false": return baseline !== false || candidate === false;
		case "exact-list": return samePolicyStringList(candidate, baseline, metadata);
	}
	return false;
}
function isPolicyAllowlistSubset(metadata, candidate, baseline) {
	const candidateList = policyStringList(candidate, metadata);
	const baselineList = policyStringList(baseline, metadata);
	if (candidateList === void 0 || baselineList === void 0) return false;
	if (metadata.emptyList === "disabled" && baselineList.length === 0) return true;
	if (metadata.emptyList === "disabled" && baselineList.length > 0 && candidateList.length === 0) return false;
	const allowed = new Set(baselineList);
	return candidateList.every((entry) => allowed.has(entry));
}
function isPolicyDenylistSuperset(metadata, candidate, baseline) {
	const candidateList = policyStringList(candidate, metadata);
	const baselineList = policyStringList(baseline, metadata);
	if (candidateList === void 0 || baselineList === void 0) return false;
	if (metadata.policyPath.join(".") === "tools.denyTools") return baselineList.flatMap(expandPolicyToolRequirement).every((tool) => toolListCoversTool(candidateList, tool));
	const denied = new Set(candidateList);
	return baselineList.every((entry) => denied.has(entry));
}
function samePolicyStringList(candidate, baseline, metadata) {
	const candidateList = policyStringList(candidate, metadata);
	const baselineList = policyStringList(baseline, metadata);
	if (candidateList === void 0 || baselineList === void 0) return false;
	const candidateSorted = candidateList.toSorted();
	const baselineSorted = baselineList.toSorted();
	return candidateSorted.length === baselineSorted.length && candidateSorted.every((entry, index) => entry === baselineSorted[index]);
}
function policyStringList(value, metadata) {
	if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) return;
	return value.map((entry) => entry.trim()).filter(Boolean).map((entry) => metadata.caseSensitive === true ? entry : entry.toLowerCase());
}
function scopedPolicyValue(overlay, path) {
	const scopedRoot = path[0] === "agents" ? overlay.agents : overlay[path[0]];
	if (path[0] === "agents") return getPolicyPath(scopedRoot, path.slice(1));
	return getPolicyPath(scopedRoot, path.slice(1));
}
function getPolicyPath(value, path) {
	let current = value;
	for (const part of path) {
		if (!isRecord(current)) return;
		current = current[part];
	}
	return current;
}
function secretPolicyShapeFindings(policy, policyPath, policyDocName) {
	if (!isRecord(policy) || !isRecord(policy.secrets)) return [];
	const findings = [];
	for (const key of ["requireManagedProviders", "allowInsecureProviders"]) if (policy.secrets[key] !== void 0 && typeof policy.secrets[key] !== "boolean") findings.push(policyShapeFinding(policyPath, `oc://${policyDocName}/secrets/${key}`, `${policyPath} secrets.${key} must be a boolean.`, `Set secrets.${key} to true or false.`));
	if (policy.secrets.denySources !== void 0 && !Array.isArray(policy.secrets.denySources)) findings.push(policyShapeFinding(policyPath, `oc://${policyDocName}/secrets/denySources`, `${policyPath} secrets.denySources must be an array of source names.`, "Use an array such as [\"exec\"] or remove secrets.denySources."));
	else if (Array.isArray(policy.secrets.denySources)) {
		const invalidIndex = policy.secrets.denySources.findIndex((entry) => typeof entry !== "string" || entry.trim() === "");
		if (invalidIndex >= 0) findings.push(policyShapeFinding(policyPath, `oc://${policyDocName}/secrets/denySources/#${invalidIndex}`, `${policyPath} secrets.denySources[${invalidIndex}] must be a non-empty source name.`, "Use non-empty source names such as env, file, exec, or openclaw."));
	}
	return findings;
}
function authProfileAllowModesShapeFindings(policy, policyPath, policyDocName) {
	if (!isRecord(policy) || !isRecord(policy.auth) || !isRecord(policy.auth.profiles) || policy.auth.profiles.allowModes === void 0) return [];
	if (!Array.isArray(policy.auth.profiles.allowModes)) return [policyShapeFinding(policyPath, `oc://${policyDocName}/auth/profiles/allowModes`, `${policyPath} auth.profiles.allowModes must be an array of auth modes.`, `Use supported auth modes: ${SUPPORTED_AUTH_PROFILE_MODES.join(", ")}.`)];
	const invalidIndex = policy.auth.profiles.allowModes.findIndex((entry) => typeof entry !== "string" || !SUPPORTED_AUTH_PROFILE_MODES.includes(entry.trim().toLowerCase()));
	if (invalidIndex < 0) return [];
	return [policyShapeFinding(policyPath, `oc://${policyDocName}/auth/profiles/allowModes/#${invalidIndex}`, `${policyPath} auth.profiles.allowModes[${invalidIndex}] must be a supported auth mode.`, `Use supported auth modes: ${SUPPORTED_AUTH_PROFILE_MODES.join(", ")}.`)];
}
function secretManagedProviderFindings(policy, policyDocName, evidence) {
	if (readPolicyBoolean(policy, ["secrets", "requireManagedProviders"]) !== true) return [];
	const secrets = evidence.secrets ?? [];
	const providerKeys = new Set(secrets.filter((secret) => secret.kind === "provider" && secret.providerSource !== void 0).map((secret) => `${secret.providerSource}:${secret.id}`));
	return secrets.filter((secret) => secret.kind === "input" && secret.provenance === "secretRef" && (secret.refProvider === void 0 || secret.refSource === void 0 || !providerKeys.has(`${secret.refSource}:${secret.refProvider}`))).map((secret) => {
		return {
			checkId: CHECK_IDS.policySecretsUnmanagedProvider,
			severity: "error",
			message: `SecretRef uses unmanaged provider '${secret.refProvider ?? "default"}'.`,
			source: "policy",
			path: "openclaw config",
			ocPath: secret.source,
			target: secret.source,
			requirement: `oc://${policyDocName}/secrets/requireManagedProviders`,
			fixHint: "Declare the referenced provider under secrets.providers or update policy after review."
		};
	});
}
function secretDeniedSourceFindings(policy, policyDocName, evidence) {
	const deniedSources = new Set(readStringList(policy, ["secrets", "denySources"]));
	if (deniedSources.size === 0) return [];
	return (evidence.secrets ?? []).filter((secret) => {
		const source = secret.kind === "provider" ? secret.providerSource : secret.refSource;
		return source !== void 0 && deniedSources.has(source);
	}).map((secret) => {
		const source = secret.kind === "provider" ? secret.providerSource : secret.refSource;
		return {
			checkId: CHECK_IDS.policySecretsDeniedProviderSource,
			severity: "error",
			message: `Secret ${secret.kind} '${secret.id}' uses denied source '${source}'.`,
			source: "policy",
			path: "openclaw config",
			ocPath: secret.source,
			target: secret.source,
			requirement: `oc://${policyDocName}/secrets/denySources`,
			fixHint: "Move this secret to an approved source or update policy after review."
		};
	});
}
function secretInsecureProviderFindings(policy, policyDocName, evidence) {
	if (readPolicyBoolean(policy, ["secrets", "allowInsecureProviders"]) !== false) return [];
	return (evidence.secrets ?? []).filter((secret) => secret.kind === "provider" && (secret.insecure?.length ?? 0) > 0).map((secret) => {
		return {
			checkId: CHECK_IDS.policySecretsInsecureProvider,
			severity: "error",
			message: `Secret provider '${secret.id}' enables insecure posture: ${(secret.insecure ?? []).join(", ")}.`,
			source: "policy",
			path: "openclaw config",
			ocPath: secret.source,
			target: secret.source,
			requirement: `oc://${policyDocName}/secrets/allowInsecureProviders`,
			fixHint: "Remove insecure provider overrides or update policy after review."
		};
	});
}
function authProfileMetadataFindings(policy, policyDocName, evidence) {
	const requiredMetadata = requiredAuthProfileMetadata(policy);
	if (requiredMetadata.size === 0) return [];
	return (evidence.authProfiles ?? []).flatMap((profile) => {
		const missing = [...requiredMetadata].filter((metadata) => !authProfileHasMetadata(profile, metadata));
		if (missing.length === 0) return [];
		return [{
			checkId: CHECK_IDS.policyAuthProfileInvalidMetadata,
			severity: "error",
			message: `Auth profile '${profile.id}' is missing required metadata: ${missing.join(", ")}.`,
			source: "policy",
			path: "openclaw config",
			ocPath: profile.source,
			target: profile.source,
			requirement: `oc://${policyDocName}/auth/profiles/requireMetadata`,
			fixHint: "Set auth.profiles.<id>.provider and a supported auth profile mode."
		}];
	});
}
function authProfileModeFindings(policy, policyDocName, evidence) {
	const allowedModes = new Set(readStringList(policy, [
		"auth",
		"profiles",
		"allowModes"
	]));
	if (allowedModes.size === 0) return [];
	return (evidence.authProfiles ?? []).filter((profile) => profile.mode !== void 0 && !allowedModes.has(profile.mode)).map((profile) => {
		return {
			checkId: CHECK_IDS.policyAuthProfileUnapprovedMode,
			severity: "error",
			message: `Auth profile '${profile.id}' uses mode '${profile.mode}' outside the policy allowlist.`,
			source: "policy",
			path: "openclaw config",
			ocPath: profile.source,
			target: profile.source,
			requirement: `oc://${policyDocName}/auth/profiles/allowModes`,
			fixHint: "Change the auth profile mode or update policy after review."
		};
	});
}
function toolRiskFindings(policyDocName, evidence) {
	return (evidence.tools ?? []).filter((tool) => tool.risk === void 0).map((tool) => {
		return {
			checkId: CHECK_IDS.policyMissingToolRisk,
			severity: "error",
			message: `TOOLS.md tool '${tool.id}' has no explicit risk classification.`,
			source: "policy",
			path: "TOOLS.md",
			line: tool.line,
			ocPath: tool.source,
			target: tool.source,
			requirement: `oc://${policyDocName}/tools/requireMetadata`,
			fixHint: "Declare risk:low, risk:medium, risk:high, risk:critical, or an R0-R5 review alias."
		};
	});
}
function toolUnknownRiskFindings(policyDocName, evidence) {
	return (evidence.tools ?? []).filter((tool) => tool.risk !== void 0 && !KNOWN_RISK_LEVELS.includes(tool.risk)).map((tool) => {
		return {
			checkId: CHECK_IDS.policyUnknownToolRisk,
			severity: "error",
			message: `TOOLS.md tool '${tool.id}' declares unknown risk '${tool.risk}'.`,
			source: "policy",
			path: "TOOLS.md",
			line: tool.line,
			ocPath: tool.source,
			target: tool.source,
			requirement: `oc://${policyDocName}/tools/requireMetadata`,
			fixHint: `Use one of: ${KNOWN_RISK_LEVELS.join(", ")}.`
		};
	});
}
function toolSensitivityFindings(policyDocName, evidence) {
	return (evidence.tools ?? []).flatMap((tool) => {
		if (tool.sensitivity === void 0) return [{
			checkId: CHECK_IDS.policyMissingToolSensitivity,
			severity: "error",
			message: `TOOLS.md tool '${tool.id}' has no declared artifact sensitivity.`,
			source: "policy",
			path: "TOOLS.md",
			line: tool.line,
			ocPath: tool.source,
			target: tool.source,
			requirement: `oc://${policyDocName}/tools/requireMetadata`,
			fixHint: `Declare sensitivity as one of: ${KNOWN_SENSITIVITY_LEVELS.join(", ")}.`
		}];
		if (KNOWN_SENSITIVITY_LEVELS.includes(tool.sensitivity)) return [];
		return [{
			checkId: CHECK_IDS.policyUnknownToolSensitivity,
			severity: "error",
			message: `TOOLS.md tool '${tool.id}' declares unknown sensitivity '${tool.sensitivity}'.`,
			source: "policy",
			path: "TOOLS.md",
			line: tool.line,
			ocPath: tool.source,
			target: tool.source,
			requirement: `oc://${policyDocName}/tools/requireMetadata`,
			fixHint: `Use one of: ${KNOWN_SENSITIVITY_LEVELS.join(", ")}.`
		}];
	});
}
function toolOwnerFindings(policyDocName, evidence) {
	return (evidence.tools ?? []).filter((tool) => tool.owner === void 0).map((tool) => {
		return {
			checkId: CHECK_IDS.policyMissingToolOwner,
			severity: "error",
			message: `TOOLS.md tool '${tool.id}' has no declared owner.`,
			source: "policy",
			path: "TOOLS.md",
			line: tool.line,
			ocPath: tool.source,
			target: tool.source,
			requirement: `oc://${policyDocName}/tools/requireMetadata`,
			fixHint: "Declare owner:<team-or-person> for this tool."
		};
	});
}
async function readPolicyFile(ctx) {
	const displayName = policyDisplayName(ctx);
	const path = resolveWorkspacePath(ctx, policyPathSetting(ctx));
	try {
		return {
			raw: await (await import("node:fs/promises")).readFile(path, "utf-8"),
			path,
			displayName,
			ocDocName: basename(displayName)
		};
	} catch (err) {
		if (isNotFound(err)) return null;
		throw err;
	}
}
async function readWorkspaceFile(ctx, fileName) {
	const path = resolveWorkspacePath(ctx, fileName);
	try {
		return {
			raw: await (await import("node:fs/promises")).readFile(path, "utf-8"),
			path
		};
	} catch (err) {
		if (isNotFound(err)) return null;
		throw err;
	}
}
function resolveWorkspacePath(ctx, fileName) {
	if (isAbsolute(fileName)) return fileName;
	return resolve(ctx.cwd ?? process.cwd(), fileName);
}
function isNotFound(err) {
	return typeof err === "object" && err !== null && "code" in err && err.code === "ENOENT";
}
function parsePolicyFile(raw) {
	try {
		return {
			ok: true,
			value: JSON5.parse(raw)
		};
	} catch (err) {
		return {
			ok: false,
			message: err instanceof Error ? err.message : String(err)
		};
	}
}
function workspaceRepairsEnabled(ctx) {
	return policySettings(ctx).workspaceRepairs === true;
}
function workspaceRepairsDisabledResult(fileName) {
	return {
		status: "skipped",
		reason: "workspace repairs are disabled",
		changes: [],
		warnings: [`Skipped ${fileName} repair. Enable plugins.entries.policy.config.workspaceRepairs to let doctor --fix edit workspace files.`]
	};
}
function readChannelDenyRules(policy, policyDocName) {
	if (!isRecord(policy) || !isRecord(policy.channels) || !Array.isArray(policy.channels.denyRules)) return [];
	return policy.channels.denyRules.map((rule, index) => ({
		rule,
		index
	})).filter((entry) => isChannelDenyRule(entry.rule)).map(({ rule, index }) => {
		const next = {
			when: rule.when,
			requirement: `oc://${policyDocName}/channels/denyRules/#${index}`
		};
		if (rule.id !== void 0) next.id = rule.id;
		if (rule.reason !== void 0) next.reason = rule.reason;
		return next;
	});
}
function isChannelDenyRule(value) {
	return isRecord(value) && (value.id === void 0 || typeof value.id === "string") && (value.reason === void 0 || typeof value.reason === "string") && isRecord(value.when) && typeof value.when.provider === "string";
}
function channelIdsFromFindings(findings) {
	return [...new Set(findings.filter((finding) => finding.checkId === CHECK_IDS.policyDeniedChannelProvider).map((finding) => finding.ocPath?.match(/^oc:\/\/openclaw\.config\/channels\/(.+)$/)?.[1]).filter((id) => id !== void 0 && id !== ""))];
}
function disableChannels(cfg, channelIds) {
	if (!isRecord(cfg.channels)) return {
		config: cfg,
		changed: []
	};
	const channels = { ...cfg.channels };
	const changed = [];
	for (const id of channelIds) {
		const current = channels[id];
		if (!isRecord(current) || current.enabled === false) continue;
		channels[id] = {
			...current,
			enabled: false
		};
		changed.push(id);
	}
	if (changed.length === 0) return {
		config: cfg,
		changed
	};
	return {
		config: {
			...cfg,
			channels
		},
		changed
	};
}
function policySettings(ctx) {
	const pluginConfig = ctx.cfg.plugins?.entries?.["policy"]?.config;
	if (!isRecord(pluginConfig)) return {};
	return pluginConfig;
}
function policyChecksEnabled(ctx, settings) {
	const entry = ctx.cfg.plugins?.entries?.["policy"];
	if (!isRecord(entry) || entry.enabled === false) return false;
	return settings.enabled !== false;
}
function requiredToolMetadata(policy) {
	return new Set(readPolicyStringArray(policy, ["tools", "requireMetadata"]) ?? []);
}
function requiredAuthProfileMetadata(policy) {
	const entries = readPolicyStringArray(policy, [
		"auth",
		"profiles",
		"requireMetadata"
	]) ?? [];
	return new Set(entries.filter((entry) => SUPPORTED_AUTH_PROFILE_METADATA.includes(entry)));
}
function authProfileHasMetadata(profile, metadata) {
	if (metadata === "provider") return profile.provider !== void 0 && profile.provider.trim() !== "";
	return SUPPORTED_AUTH_PROFILE_MODES.includes(profile.mode);
}
function readPolicyStringArray(policy, path, options = {}) {
	let current = policy;
	for (const part of path) {
		if (!isRecord(current)) return;
		current = current[part];
	}
	if (!Array.isArray(current) || !current.every((entry) => typeof entry === "string")) return;
	const lowercase = options.lowercase ?? true;
	return current.map((entry) => {
		const trimmed = entry.trim();
		return lowercase ? trimmed.toLowerCase() : trimmed;
	}).filter(Boolean);
}
function readStringList(policy, path, options) {
	return readPolicyStringArray(policy, path, options) ?? [];
}
function ocPathSegment(value) {
	if (/^(?:[A-Za-z0-9_-]+|#\d+)$/.test(value)) return value;
	return JSON.stringify(value);
}
function readPolicyBoolean(policy, path) {
	let current = policy;
	for (const part of path) {
		if (!isRecord(current)) return;
		current = current[part];
	}
	return typeof current === "boolean" ? current : void 0;
}
function policyToolGlobMatches(tool, pattern) {
	const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	return new RegExp(`^${escaped.replaceAll("\\*", ".*")}$`).test(tool);
}
function toolListCoversTool(list, tool) {
	for (const entry of list) {
		const normalized = normalizePolicyToolName(entry);
		if (normalized === "*" || normalized === tool) return true;
		if (POLICY_TOOL_GROUPS[normalized]?.includes(tool)) return true;
		if (normalized.includes("*") && policyToolGlobMatches(tool, normalized)) return true;
	}
	return false;
}
function expandPolicyToolRequirement(value) {
	const normalized = normalizePolicyToolName(value);
	return POLICY_TOOL_GROUPS[normalized] ?? [normalized];
}
function normalizePolicyToolName(value) {
	const normalized = value.trim().toLowerCase();
	if (normalized === "bash") return "exec";
	if (normalized === "apply-patch") return "apply_patch";
	return normalized;
}
function policyPathSetting(ctx) {
	const configured = policySettings(ctx).path;
	return typeof configured === "string" && configured.trim() !== "" ? configured.trim() : "policy.jsonc";
}
function policyDisplayName(ctx) {
	const configured = policyPathSetting(ctx);
	return isAbsolute(configured) ? basename(configured) : configured;
}
//#endregion
export { createPolicyAttestation as i, evaluatePolicy as n, registerPolicyDoctorChecks as r, POLICY_CHECK_IDS as t };
