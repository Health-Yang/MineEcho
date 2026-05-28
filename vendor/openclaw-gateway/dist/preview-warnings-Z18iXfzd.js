import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { o as isRecord } from "./record-coerce-Btbek4uV.js";
import { t as createLazyImportLoader } from "./lazy-promise-Djskx0qC.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { i as resolveAgentModelPrimaryValue } from "./model-input-C697EEaR.js";
import { n as normalizeAccountId, t as DEFAULT_ACCOUNT_ID } from "./account-id-B0YIFDpA.js";
import { l as normalizeAgentId } from "./session-key-yaI3D3Bl.js";
import { r as resolveAgentConfig } from "./agent-scope-config-BfxErZq2.js";
import { r as normalizeChatChannelId } from "./ids-OP3BJTaQ.js";
import "./defaults-mDjiWzE5.js";
import { i as parseModelRef } from "./model-selection-normalize-l_jinpMc.js";
import { n as pickSandboxToolPolicy } from "./sandbox-tool-policy-CAhGEmA6.js";
import { h as resolveToolProfilePolicy, l as mergeAlsoAllowPolicy } from "./tool-policy-CY4w5sXw.js";
import { n as isToolAllowedByPolicyName, t as isToolAllowedByPolicies } from "./tool-policy-match-F9QA397_.js";
import { i as listRouteBindings } from "./bindings-D1F1bOgs.js";
import { i as resolveAgentRoute } from "./resolve-route-uLXK2QLU.js";
//#region src/routing/channel-route-targets.ts
const CHANNELS_CONFIG_META_KEYS = new Set(["defaults", "modelByChannel"]);
function normalizeConfiguredChannelKey(raw) {
	return normalizeChatChannelId(raw) ?? normalizeLowercaseStringOrEmpty(raw);
}
function normalizeRouteBindingChannelKey(raw) {
	return normalizeLowercaseStringOrEmpty(raw);
}
function listConfiguredChannelIds(cfg) {
	if (!isRecord(cfg.channels)) return [];
	return Object.entries(cfg.channels).filter(([id, value]) => {
		if (CHANNELS_CONFIG_META_KEYS.has(id)) return false;
		return !(isRecord(value) && value.enabled === false);
	}).map(([id]) => normalizeConfiguredChannelKey(id)).filter(Boolean).toSorted();
}
function listConfiguredChannelAccountIds(cfg, channelId) {
	if (!isRecord(cfg.channels)) return [];
	const channel = Object.entries(cfg.channels).find(([id]) => normalizeConfiguredChannelKey(id) === channelId)?.[1];
	if (!isRecord(channel) || !isRecord(channel.accounts)) return [];
	return Object.entries(channel.accounts).filter(([, value]) => !(isRecord(value) && value.enabled === false)).map(([accountId]) => normalizeAccountId(accountId)).filter(Boolean).toSorted();
}
function addTarget(byAgent, agentId, channel) {
	const normalizedAgentId = normalizeAgentId(agentId);
	const trimmedChannel = channel.trim();
	if (!normalizedAgentId || !trimmedChannel) return;
	const channels = byAgent.get(normalizedAgentId) ?? /* @__PURE__ */ new Set();
	channels.add(trimmedChannel);
	byAgent.set(normalizedAgentId, channels);
}
function collectChannelRouteTargets(cfg) {
	const byAgent = /* @__PURE__ */ new Map();
	for (const binding of listRouteBindings(cfg)) addTarget(byAgent, binding.agentId, normalizeRouteBindingChannelKey(binding.match.channel));
	for (const channel of listConfiguredChannelIds(cfg)) {
		const accountIds = listConfiguredChannelAccountIds(cfg, channel);
		const sampledAccountIds = accountIds.length > 0 ? accountIds : [DEFAULT_ACCOUNT_ID];
		for (const accountId of sampledAccountIds) addTarget(byAgent, resolveAgentRoute({
			cfg,
			channel,
			accountId
		}).agentId, channel);
	}
	return Array.from(byAgent.entries()).map(([agentId, channels]) => ({
		agentId,
		channels: Array.from(channels).toSorted()
	})).filter((target) => target.channels.length > 0).toSorted((a, b) => a.agentId.localeCompare(b.agentId));
}
//#endregion
//#region src/commands/doctor/shared/preview-warnings.ts
const channelDoctorModuleLoader = createLazyImportLoader(() => import("./channel-doctor-rWbYQ87-.js"));
function loadChannelDoctorModule() {
	return channelDoctorModuleLoader.load();
}
function listAgentRecords(cfg) {
	return Array.isArray(cfg.agents?.list) ? cfg.agents.list.filter(isRecord) : [];
}
function hasChannels(cfg) {
	return isRecord(cfg.channels);
}
function hasPlugins(cfg) {
	return isRecord(cfg.plugins);
}
function hasPluginLoadPaths(cfg) {
	const plugins = cfg.plugins;
	if (!isRecord(plugins)) return false;
	const load = plugins.load;
	return isRecord(load) && Array.isArray(load.paths) && load.paths.length > 0;
}
function hasSubagentAllowlistConfig(cfg) {
	if (Array.isArray(cfg.agents?.defaults?.subagents?.allowAgents)) return true;
	return listAgentRecords(cfg).some((agent) => {
		const subagents = isRecord(agent.subagents) ? agent.subagents : void 0;
		return Array.isArray(subagents?.allowAgents);
	});
}
function hasExplicitChannelPluginBlockerConfig(cfg) {
	if (cfg.plugins?.enabled === false) return true;
	const entries = cfg.plugins?.entries;
	if (!isRecord(entries)) return false;
	return Object.values(entries).some((entry) => isRecord(entry) && "enabled" in entry && entry.enabled === false);
}
function hasToolsBySenderKey(value) {
	if (Array.isArray(value)) return value.some(hasToolsBySenderKey);
	if (!isRecord(value)) return false;
	if (isRecord(value.toolsBySender)) return true;
	return Object.entries(value).some(([key, nested]) => key !== "toolsBySender" && hasToolsBySenderKey(nested));
}
function hasConfiguredSafeBins(cfg) {
	const globalExec = cfg.tools?.exec;
	if (isRecord(globalExec) && Array.isArray(globalExec.safeBins) && globalExec.safeBins.length > 0) return true;
	return listAgentRecords(cfg).some((agent) => {
		const agentExec = isRecord(agent) && isRecord(agent.tools) ? agent.tools.exec : void 0;
		return isRecord(agentExec) && Array.isArray(agentExec.safeBins) && agentExec.safeBins.length > 0;
	});
}
function normalizeProviderPolicyKey(value) {
	const normalized = normalizeLowercaseStringOrEmpty(value);
	const slashIndex = normalized.indexOf("/");
	if (slashIndex <= 0) return normalizeProviderId(normalized);
	const provider = normalizeProviderId(normalized.slice(0, slashIndex));
	const modelId = normalized.slice(slashIndex + 1);
	return modelId ? `${provider}/${modelId}` : provider;
}
function isCanonicalProviderPolicyKey(value) {
	return normalizeLowercaseStringOrEmpty(value) === normalizeProviderPolicyKey(value);
}
function resolveProviderToolPolicy(params) {
	if (!params.byProvider) return;
	const lookup = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(params.byProvider)) {
		const normalized = normalizeProviderPolicyKey(key);
		if (!normalized) continue;
		const canonical = isCanonicalProviderPolicyKey(key);
		const existing = lookup.get(normalized);
		if (!existing || canonical && !existing.canonical) lookup.set(normalized, {
			canonical,
			value
		});
	}
	const provider = normalizeProviderPolicyKey(params.modelProvider);
	const modelId = normalizeLowercaseStringOrEmpty(params.modelId);
	const fullModelId = modelId ? `${provider}/${modelId}` : void 0;
	return (fullModelId ? lookup.get(fullModelId)?.value : void 0) ?? lookup.get(provider)?.value;
}
function resolveMessageToolAvailability(params) {
	const agentConfig = params.agentId ? resolveAgentConfig(params.cfg, params.agentId) : void 0;
	const modelRef = resolvePrimaryModelRef(params.cfg, agentConfig?.model);
	const providerPolicy = resolveProviderToolPolicy({
		byProvider: params.globalTools?.byProvider,
		modelProvider: modelRef.provider,
		modelId: modelRef.model
	});
	const agentProviderPolicy = resolveProviderToolPolicy({
		byProvider: params.agentTools?.byProvider,
		modelProvider: modelRef.provider,
		modelId: modelRef.model
	});
	const profile = params.agentTools?.profile ?? params.globalTools?.profile;
	const configuredAlsoAllow = Array.isArray(params.agentTools?.alsoAllow) ? params.agentTools.alsoAllow : Array.isArray(params.globalTools?.alsoAllow) ? params.globalTools.alsoAllow : [];
	const providerAlsoAllow = Array.isArray(agentProviderPolicy?.alsoAllow) ? agentProviderPolicy.alsoAllow : Array.isArray(providerPolicy?.alsoAllow) ? providerPolicy.alsoAllow : [];
	const profileAlsoAllow = [...configuredAlsoAllow, ...params.runtimeAlsoAllow ?? []];
	const providerProfileAlsoAllow = [...providerAlsoAllow, ...params.runtimeAlsoAllow ?? []];
	return isToolAllowedByPolicies("message", [
		mergeAlsoAllowPolicy(resolveToolProfilePolicy(profile), profileAlsoAllow),
		mergeAlsoAllowPolicy(resolveToolProfilePolicy(agentProviderPolicy?.profile ?? providerPolicy?.profile), providerProfileAlsoAllow),
		pickSandboxToolPolicy(providerPolicy),
		pickSandboxToolPolicy(agentProviderPolicy),
		pickSandboxToolPolicy(params.globalTools),
		pickSandboxToolPolicy(params.agentTools)
	]);
}
const SOURCE_REPLY_RUNTIME_MESSAGE_ALLOW = ["message"];
function resolvePrimaryModelRef(cfg, agentModel) {
	return parseModelRef(resolveAgentModelPrimaryValue(agentModel) ?? resolveAgentModelPrimaryValue(cfg.agents?.defaults?.model) ?? "gpt-5.5", "openai", { allowPluginNormalization: false }) ?? {
		provider: "openai",
		model: "gpt-5.5"
	};
}
function resolveSourceReplyMessageToolAvailability(params) {
	return resolveMessageToolAvailability({
		...params,
		runtimeAlsoAllow: SOURCE_REPLY_RUNTIME_MESSAGE_ALLOW
	});
}
function sourceReplyRuntimeMayAllowMessageTool(cfg) {
	if (resolveGroupVisibleReplyProvenance(cfg).value === "message_tool") return true;
	if (cfg.messages?.visibleReplies === "message_tool") return true;
	return false;
}
function collectMessageToolUnavailableTargets(cfg, options = {}) {
	const agents = listAgentRecords(cfg);
	if (agents.length === 0) return (options.sourceReplyRuntimeGrant ? resolveSourceReplyMessageToolAvailability({
		cfg,
		globalTools: cfg.tools
	}) : resolveMessageToolAvailability({
		cfg,
		globalTools: cfg.tools
	})) ? [] : ["default tool policy"];
	return agents.flatMap((agent) => {
		const agentId = typeof agent.id === "string" ? agent.id : "unknown";
		return (options.sourceReplyRuntimeGrant ? resolveSourceReplyMessageToolAvailability({
			cfg,
			agentId,
			globalTools: cfg.tools,
			agentTools: agent.tools
		}) : resolveMessageToolAvailability({
			cfg,
			agentId,
			globalTools: cfg.tools,
			agentTools: agent.tools
		})) ? [] : [`agent "${agentId}"`];
	});
}
function resolveGroupVisibleReplyProvenance(cfg) {
	const groupVisibleReplies = cfg.messages?.groupChat?.visibleReplies;
	if (groupVisibleReplies) return {
		path: "messages.groupChat.visibleReplies",
		provenance: "group-explicit",
		value: groupVisibleReplies
	};
	const globalVisibleReplies = cfg.messages?.visibleReplies;
	if (globalVisibleReplies) return {
		path: "messages.visibleReplies",
		provenance: "global-explicit",
		value: globalVisibleReplies
	};
	return {
		path: "messages.groupChat.visibleReplies",
		provenance: "default",
		value: "automatic"
	};
}
function formatTargets(targets) {
	if (targets.length <= 2) return targets.join(" and ");
	return `${targets.slice(0, 2).join(", ")}, and ${targets.length - 2} more`;
}
function collectVisibleReplyToolPolicyWarnings(cfg) {
	const groupPolicy = resolveGroupVisibleReplyProvenance(cfg);
	const warnings = [];
	if (groupPolicy.value === "message_tool") {
		const targets = collectMessageToolUnavailableTargets(cfg, { sourceReplyRuntimeGrant: true });
		if (targets.length === 0) return warnings;
		warnings.push(`- ${groupPolicy.path} is set to "message_tool", but the message tool is unavailable for ${formatTargets(targets)}; OpenClaw falls back to automatic visible replies, so normal replies may post to the source chat. Enable the message tool or set ${groupPolicy.path} to "automatic".`);
	}
	if (cfg.messages?.visibleReplies === "message_tool" && groupPolicy.path !== "messages.visibleReplies") {
		const targets = collectMessageToolUnavailableTargets(cfg, { sourceReplyRuntimeGrant: true });
		if (targets.length === 0) return warnings;
		warnings.push(`- messages.visibleReplies is set to "message_tool", but the message tool is unavailable for ${formatTargets(targets)}; OpenClaw falls back to automatic direct-chat replies, so normal replies may post to the source chat. Enable the message tool or set messages.visibleReplies to "automatic".`);
	}
	return warnings;
}
function formatChannelList(channels) {
	if (channels.length <= 2) return channels.map((channel) => `"${channel}"`).join(" and ");
	return `${channels.slice(0, 2).map((channel) => `"${channel}"`).join(", ")}, and ${channels.length - 2} more`;
}
function collectChannelBoundMessageToolPolicyWarnings(cfg) {
	return collectChannelRouteTargets(cfg).flatMap((target) => {
		const agentTools = resolveAgentConfig(cfg, target.agentId)?.tools;
		if (sourceReplyRuntimeMayAllowMessageTool(cfg) ? resolveSourceReplyMessageToolAvailability({
			cfg,
			agentId: target.agentId,
			globalTools: cfg.tools,
			agentTools
		}) : resolveMessageToolAvailability({
			cfg,
			agentId: target.agentId,
			globalTools: cfg.tools,
			agentTools
		})) return [];
		return [`- Agent "${target.agentId}" is routed from channel ${formatChannelList(target.channels)}, but the message tool is unavailable for that agent; explicit channel actions such as sendAttachment, upload-file, thread-reply, or reply can fail. Add "message" to the agent tool allowlist, add "group:messaging", or switch the agent to a profile that includes messaging tools.`];
	});
}
const PROFILE_CONFIGURED_TOOL_SECTIONS = [{
	key: "exec",
	label: "tools.exec",
	grants: ["exec", "process"]
}, {
	key: "fs",
	label: "tools.fs",
	grants: [
		"read",
		"write",
		"edit"
	]
}];
function collectConfiguredToolSectionGrantEntries(params) {
	const entries = [];
	for (const section of PROFILE_CONFIGURED_TOOL_SECTIONS) if (isRecord(params.tools?.[section.key])) entries.push({
		label: `${params.pathLabel}.${section.key}`,
		grants: [...section.grants]
	});
	return entries;
}
function formatQuotedList(values) {
	return values.map((value) => `"${value}"`).join(", ");
}
function hasNonEmptyStringList(value) {
	return Array.isArray(value) && value.some((entry) => typeof entry === "string");
}
function readPreviewStringList(value) {
	return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : void 0;
}
function formatProfileConfiguredSectionGrantAdvice(params) {
	const providerSuffix = params.provider ? " for that provider" : "";
	if (params.hasAllow) return `Add these grants to ${params.pathLabel}.allow and set ${params.pathLabel}.profile to "full" if these tools should be available${providerSuffix}.`;
	return `Add ${params.pathLabel}.alsoAllow: [${formatQuotedList(params.grants)}] if these tools should be available${providerSuffix}.`;
}
function collectProfileConfiguredToolSectionScopeWarnings(params) {
	const tools = params.tools;
	const profile = (typeof tools?.profile === "string" ? tools.profile : void 0) ?? params.inheritedProfile;
	if (!profile) return [];
	const configuredEntries = [...params.includeInheritedSections && params.inheritedTools && params.inheritedPathLabel ? collectConfiguredToolSectionGrantEntries({
		tools: params.inheritedTools,
		pathLabel: params.inheritedPathLabel
	}) : [], ...collectConfiguredToolSectionGrantEntries({
		tools,
		pathLabel: params.pathLabel
	})];
	if (configuredEntries.length === 0) return [];
	const alsoAllow = Array.isArray(tools?.alsoAllow) ? tools.alsoAllow.filter((entry) => typeof entry === "string") : params.inheritedAlsoAllow;
	const profilePolicy = mergeAlsoAllowPolicy(resolveToolProfilePolicy(profile), alsoAllow);
	const uncoveredEntries = configuredEntries.map((entry) => {
		return {
			grants: entry.grants.filter((toolName) => !isToolAllowedByPolicyName(toolName, profilePolicy)),
			label: entry.label
		};
	}).filter((entry) => entry.grants.length > 0);
	if (uncoveredEntries.length === 0) return [];
	const uncoveredGrants = [...new Set(uncoveredEntries.flatMap((entry) => entry.grants))];
	const advice = formatProfileConfiguredSectionGrantAdvice({
		pathLabel: params.pathLabel,
		grants: uncoveredGrants,
		hasAllow: hasNonEmptyStringList(tools?.allow)
	});
	return [`- ${params.pathLabel}.profile is "${profile}" and ${uncoveredEntries.map((entry) => entry.label).join(" / ")} is configured, but configured sections no longer widen the active profile. ${advice}`];
}
function collectByProviderConfiguredToolSectionWarnings(params) {
	const byProvider = isRecord(params.tools?.byProvider) ? params.tools.byProvider : void 0;
	if (!byProvider || params.configuredEntries.length === 0) return [];
	const inheritedByProvider = isRecord(params.inheritedTools?.byProvider) ? params.inheritedTools.byProvider : void 0;
	return Object.entries(byProvider).flatMap(([providerKey, policyValue]) => {
		const policy = isRecord(policyValue) ? policyValue : void 0;
		if (!policy) return [];
		const profile = typeof policy.profile === "string" ? policy.profile : void 0;
		if (!profile) return [];
		const inheritedPolicy = resolveInheritedProviderPolicyForPreview(inheritedByProvider, providerKey);
		const alsoAllow = readPreviewStringList(policy.alsoAllow) ?? readPreviewStringList(inheritedPolicy?.alsoAllow);
		const profilePolicy = mergeAlsoAllowPolicy(resolveToolProfilePolicy(profile), alsoAllow);
		const uncoveredEntries = params.configuredEntries.map((entry) => ({
			...entry,
			grants: entry.grants.filter((toolName) => !isToolAllowedByPolicyName(toolName, profilePolicy))
		})).filter((entry) => entry.grants.length > 0);
		if (uncoveredEntries.length === 0) return [];
		const providerPath = `${params.pathLabel}.byProvider.${providerKey}`;
		const advice = formatProfileConfiguredSectionGrantAdvice({
			pathLabel: providerPath,
			grants: [...new Set(uncoveredEntries.flatMap((entry) => entry.grants))],
			hasAllow: hasNonEmptyStringList(policy.allow),
			provider: true
		});
		return [`- ${providerPath}.profile is "${profile}" and ${uncoveredEntries.map((entry) => entry.label).join(" / ")} is configured, but configured sections no longer widen the provider profile. ${advice}`];
	});
}
function resolveInheritedProviderPolicyForPreview(inheritedByProvider, providerKey) {
	if (!inheritedByProvider) return;
	const normalized = normalizeProviderPolicyKey(providerKey);
	const slashIndex = normalized.indexOf("/");
	const policy = resolveProviderToolPolicy({
		byProvider: inheritedByProvider,
		modelProvider: slashIndex > 0 ? normalized.slice(0, slashIndex) : normalized,
		modelId: slashIndex > 0 ? normalized.slice(slashIndex + 1) : ""
	});
	return policy && isRecord(policy) ? policy : void 0;
}
function resolveProviderPolicyEntryForPreview(params) {
	if (!params.byProvider || !params.modelProvider) return;
	const lookup = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(params.byProvider)) {
		const policy = isRecord(value) ? value : void 0;
		if (!policy) continue;
		const normalized = normalizeProviderPolicyKey(key);
		if (!normalized) continue;
		const canonical = isCanonicalProviderPolicyKey(key);
		const existing = lookup.get(normalized);
		if (!existing || canonical && !existing.canonical) lookup.set(normalized, {
			key,
			policy,
			canonical
		});
	}
	const provider = normalizeProviderPolicyKey(params.modelProvider);
	const modelId = normalizeLowercaseStringOrEmpty(params.modelId);
	const candidates = [...modelId ? [`${provider}/${modelId}`] : [], provider];
	for (const candidate of candidates) {
		const match = lookup.get(candidate);
		if (match) return {
			key: match.key,
			policy: match.policy
		};
	}
}
function collectInheritedByProviderConfiguredToolSectionWarnings(params) {
	const inheritedByProvider = isRecord(params.inheritedTools?.byProvider) ? params.inheritedTools.byProvider : void 0;
	if (!inheritedByProvider || params.configuredEntries.length === 0) return [];
	const overridingByProvider = isRecord(params.overridingTools?.byProvider) ? params.overridingTools.byProvider : void 0;
	const inheritedEntryForModel = resolveProviderPolicyEntryForPreview({
		byProvider: inheritedByProvider,
		modelProvider: params.modelProvider,
		modelId: params.modelId
	});
	return Object.entries(inheritedByProvider).flatMap(([providerKey, policyValue]) => {
		if (params.modelProvider && inheritedEntryForModel?.key !== providerKey) return [];
		const inheritedPolicy = isRecord(policyValue) ? policyValue : void 0;
		if (!inheritedPolicy) return [];
		const profile = typeof inheritedPolicy.profile === "string" ? inheritedPolicy.profile : void 0;
		if (!profile) return [];
		const overridingEntry = resolveProviderPolicyEntryForPreview({
			byProvider: overridingByProvider,
			modelProvider: params.modelProvider,
			modelId: params.modelId
		}) ?? (isRecord(overridingByProvider?.[providerKey]) ? {
			key: providerKey,
			policy: overridingByProvider[providerKey]
		} : void 0);
		const overridingPolicy = overridingEntry?.policy;
		if (typeof overridingPolicy?.profile === "string") return [];
		const alsoAllow = readPreviewStringList(overridingPolicy?.alsoAllow) ?? readPreviewStringList(inheritedPolicy.alsoAllow);
		const profilePolicy = mergeAlsoAllowPolicy(resolveToolProfilePolicy(profile), alsoAllow);
		const uncoveredEntries = params.configuredEntries.map((entry) => ({
			...entry,
			grants: entry.grants.filter((toolName) => !isToolAllowedByPolicyName(toolName, profilePolicy))
		})).filter((entry) => entry.grants.length > 0);
		if (uncoveredEntries.length === 0) return [];
		const overridePath = `${params.overridingPathLabel}.byProvider.${overridingEntry?.key ?? providerKey}`;
		const inheritedPath = `${params.inheritedPathLabel}.byProvider.${providerKey}`;
		const advice = formatProfileConfiguredSectionGrantAdvice({
			pathLabel: overridePath,
			grants: [...new Set(uncoveredEntries.flatMap((entry) => entry.grants))],
			hasAllow: hasNonEmptyStringList(overridingPolicy?.allow),
			provider: true
		});
		return [`- ${inheritedPath}.profile is "${profile}" and ${uncoveredEntries.map((entry) => entry.label).join(" / ")} is configured, but configured sections no longer widen the inherited provider profile. ${advice}`];
	});
}
function collectProfileConfiguredToolSectionWarnings(cfg) {
	const warnings = [];
	const globalTools = isRecord(cfg.tools) ? cfg.tools : void 0;
	const globalAlsoAllow = Array.isArray(globalTools?.alsoAllow) ? globalTools.alsoAllow.filter((entry) => typeof entry === "string") : void 0;
	const globalProfile = typeof globalTools?.profile === "string" ? globalTools.profile : void 0;
	const globalConfiguredEntries = collectConfiguredToolSectionGrantEntries({
		tools: globalTools,
		pathLabel: "tools"
	});
	warnings.push(...collectProfileConfiguredToolSectionScopeWarnings({
		tools: globalTools,
		pathLabel: "tools"
	}), ...collectByProviderConfiguredToolSectionWarnings({
		tools: globalTools,
		pathLabel: "tools",
		configuredEntries: globalConfiguredEntries
	}));
	listAgentRecords(cfg).forEach((agent, index) => {
		const agentTools = isRecord(agent.tools) ? agent.tools : void 0;
		const agentId = typeof agent.id === "string" ? agent.id : void 0;
		const modelRef = resolvePrimaryModelRef(cfg, (agentId ? resolveAgentConfig(cfg, agentId) : void 0)?.model);
		const agentPath = `agents.list[${index}].tools`;
		const includeInheritedSections = agentTools !== void 0 && typeof agentTools.profile !== "string";
		const ownAgentConfiguredEntries = collectConfiguredToolSectionGrantEntries({
			tools: agentTools,
			pathLabel: agentPath
		});
		const agentConfiguredEntries = [...globalConfiguredEntries, ...ownAgentConfiguredEntries];
		warnings.push(...collectProfileConfiguredToolSectionScopeWarnings({
			tools: agentTools,
			inheritedTools: globalTools,
			pathLabel: agentPath,
			inheritedPathLabel: "tools",
			includeInheritedSections,
			inheritedProfile: globalProfile,
			inheritedAlsoAllow: globalAlsoAllow
		}), ...collectByProviderConfiguredToolSectionWarnings({
			tools: agentTools,
			inheritedTools: globalTools,
			pathLabel: agentPath,
			configuredEntries: agentConfiguredEntries
		}), ...collectInheritedByProviderConfiguredToolSectionWarnings({
			inheritedTools: globalTools,
			inheritedPathLabel: "tools",
			overridingTools: agentTools,
			overridingPathLabel: agentPath,
			configuredEntries: ownAgentConfiguredEntries,
			modelProvider: modelRef.provider,
			modelId: modelRef.model
		}));
	});
	return warnings;
}
async function collectDoctorPreviewNotes(params) {
	const infoNotes = [];
	const warnings = [];
	const env = params.env ?? process.env;
	const hasChannelConfig = hasChannels(params.cfg);
	const hasPluginConfig = hasPlugins(params.cfg);
	warnings.push(...collectVisibleReplyToolPolicyWarnings(params.cfg));
	warnings.push(...collectChannelBoundMessageToolPolicyWarnings(params.cfg));
	warnings.push(...collectProfileConfiguredToolSectionWarnings(params.cfg));
	const { collectActiveToolSchemaProjectionWarnings } = await import("./active-tool-schema-warnings-CRKoeXRp.js");
	warnings.push(...collectActiveToolSchemaProjectionWarnings({
		cfg: params.cfg,
		env
	}));
	const channelPluginRuntime = hasChannelConfig && hasExplicitChannelPluginBlockerConfig(params.cfg) ? await import("./channel-plugin-blockers-Ch9GU2uh.js") : void 0;
	const channelPluginBlockerHits = channelPluginRuntime?.scanConfiguredChannelPluginBlockers(params.cfg, env) ?? [];
	if (channelPluginRuntime && channelPluginBlockerHits.length > 0) warnings.push(channelPluginRuntime.collectConfiguredChannelPluginBlockerWarnings(channelPluginBlockerHits).join("\n"));
	if (hasChannelConfig) {
		const { collectChannelDoctorPreviewWarnings } = await loadChannelDoctorModule();
		const channelDoctorWarnings = await collectChannelDoctorPreviewWarnings({
			cfg: params.cfg,
			doctorFixCommand: params.doctorFixCommand,
			env
		});
		if (channelDoctorWarnings.length > 0) warnings.push(...channelDoctorWarnings);
		const { collectOpenPolicyAllowFromWarnings, maybeRepairOpenPolicyAllowFrom } = await import("./open-policy-allowfrom-DoVaTmay.js");
		const allowFromScan = maybeRepairOpenPolicyAllowFrom(params.cfg);
		if (allowFromScan.changes.length > 0) warnings.push(collectOpenPolicyAllowFromWarnings({
			changes: allowFromScan.changes,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
	}
	if ((hasPluginConfig || hasChannelConfig) && params.cfg.plugins?.enabled !== false) {
		const { collectStalePluginConfigWarnings, isStalePluginAutoRepairBlocked, scanStalePluginConfig } = await import("./stale-plugin-config-Cpj3SpRW.js");
		const stalePluginHits = scanStalePluginConfig(params.cfg, env);
		if (stalePluginHits.length > 0) warnings.push(collectStalePluginConfigWarnings({
			hits: stalePluginHits,
			doctorFixCommand: params.doctorFixCommand,
			autoRepairBlocked: isStalePluginAutoRepairBlocked(params.cfg, env)
		}).join("\n"));
	}
	if (hasPluginConfig) {
		const { collectCodexRouteWarnings } = await import("./codex-route-warnings-Boai5SpI.js");
		warnings.push(...collectCodexRouteWarnings({
			cfg: params.cfg,
			env
		}));
		const { collectContextEngineHostCompatibilityWarnings } = await import("./context-engine-host-compat-DaGniRSA.js");
		warnings.push(...await collectContextEngineHostCompatibilityWarnings({
			cfg: params.cfg,
			doctorFixCommand: params.doctorFixCommand,
			env
		}));
	}
	if (hasSubagentAllowlistConfig(params.cfg)) {
		const { collectStaleSubagentAllowlistWarnings, scanStaleSubagentAllowlistReferences } = await import("./stale-subagent-allowlist-pL3h8F7h.js");
		const staleSubagentAllowlistHits = scanStaleSubagentAllowlistReferences(params.cfg);
		if (staleSubagentAllowlistHits.length > 0) warnings.push(collectStaleSubagentAllowlistWarnings({
			hits: staleSubagentAllowlistHits,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
	}
	const { collectCodexNativeAssetInfoNotes } = await import("./codex-native-assets-BMarVVfq.js");
	infoNotes.push(...await collectCodexNativeAssetInfoNotes({
		cfg: params.cfg,
		env
	}));
	if (hasPluginLoadPaths(params.cfg)) {
		const { collectBundledPluginLoadPathWarnings, scanBundledPluginLoadPathMigrations } = await import("./bundled-plugin-load-paths-BXWi0LNj.js");
		const bundledPluginLoadPathHits = scanBundledPluginLoadPathMigrations(params.cfg, env);
		if (bundledPluginLoadPathHits.length > 0) warnings.push(collectBundledPluginLoadPathWarnings({
			hits: bundledPluginLoadPathHits,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
	}
	if (hasChannelConfig) {
		const { createChannelDoctorEmptyAllowlistPolicyHooks } = await loadChannelDoctorModule();
		const { scanEmptyAllowlistPolicyWarnings } = await import("./empty-allowlist-scan-B_BeDrLb.js");
		const emptyAllowlistHooks = createChannelDoctorEmptyAllowlistPolicyHooks({
			cfg: params.cfg,
			env
		});
		const emptyAllowlistWarnings = scanEmptyAllowlistPolicyWarnings(params.cfg, {
			doctorFixCommand: params.doctorFixCommand,
			extraWarningsForAccount: emptyAllowlistHooks.extraWarningsForAccount,
			shouldSkipDefaultEmptyGroupAllowlistWarning: emptyAllowlistHooks.shouldSkipDefaultEmptyGroupAllowlistWarning
		}).filter((warning) => !(channelPluginRuntime?.isWarningBlockedByChannelPlugin(warning, channelPluginBlockerHits) ?? false));
		if (emptyAllowlistWarnings.length > 0) {
			const { sanitizeForLog } = await import("./ansi-Dqc09Z5d.js");
			warnings.push(emptyAllowlistWarnings.map((line) => sanitizeForLog(line)).join("\n"));
		}
	}
	if (hasToolsBySenderKey(params.cfg)) {
		const { collectLegacyToolsBySenderWarnings, scanLegacyToolsBySenderKeys } = await import("./legacy-tools-by-sender-CC2dqfGd.js");
		const toolsBySenderHits = scanLegacyToolsBySenderKeys(params.cfg);
		if (toolsBySenderHits.length > 0) warnings.push(collectLegacyToolsBySenderWarnings({
			hits: toolsBySenderHits,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
	}
	if (hasConfiguredSafeBins(params.cfg)) {
		const { collectExecSafeBinCoverageWarnings, collectExecSafeBinTrustedDirHintWarnings, scanExecSafeBinCoverage, scanExecSafeBinTrustedDirHints } = await import("./exec-safe-bins-DBS5eAlE.js");
		const safeBinCoverage = scanExecSafeBinCoverage(params.cfg);
		if (safeBinCoverage.length > 0) warnings.push(collectExecSafeBinCoverageWarnings({
			hits: safeBinCoverage,
			doctorFixCommand: params.doctorFixCommand
		}).join("\n"));
		const safeBinTrustedDirHints = scanExecSafeBinTrustedDirHints(params.cfg);
		if (safeBinTrustedDirHints.length > 0) warnings.push(collectExecSafeBinTrustedDirHintWarnings(safeBinTrustedDirHints).join("\n"));
	}
	const { collectStaleOAuthProfileShadowWarnings, scanStaleOAuthProfileShadows } = await import("./stale-oauth-profile-shadows-BbudG7Tn.js");
	const staleOAuthProfileShadows = await scanStaleOAuthProfileShadows({
		cfg: params.cfg,
		env
	});
	if (staleOAuthProfileShadows.length > 0) warnings.push(collectStaleOAuthProfileShadowWarnings({
		hits: staleOAuthProfileShadows,
		doctorFixCommand: params.doctorFixCommand
	}).join("\n"));
	return {
		infoNotes,
		warningNotes: warnings
	};
}
//#endregion
export { collectDoctorPreviewNotes };
