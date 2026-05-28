import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import "./agent-scope-CudANNo3.js";
import { a as resolveAgentDir, c as resolveDefaultAgentId, n as listAgentIds, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { Bn as validateToolsCatalogParams, Ii as ErrorCodes, Li as errorShape, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { a as getActivePluginRegistry } from "./runtime-B5Ug58ea.js";
import { i as listCoreToolSections, n as PROFILE_OPTIONS, o as resolveCoreToolProfiles } from "./tool-catalog-Bxn5jw8h.js";
import { a as resolvePluginTools, i as getPluginToolMeta, r as ensureStandalonePluginToolRegistryLoaded, t as buildPluginToolMetadataKey } from "./tools-Ciw2IILF.js";
import { n as summarizeToolDescriptionText } from "./tool-description-summary-DfZpSQrA.js";
//#region src/gateway/server-methods/tools-catalog.ts
function resolveAgentIdOrRespondError(rawAgentId, respond, cfg) {
	const knownAgents = listAgentIds(cfg);
	const requestedAgentId = normalizeOptionalString(rawAgentId) ?? "";
	const agentId = requestedAgentId || resolveDefaultAgentId(cfg);
	if (requestedAgentId && !knownAgents.includes(agentId)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unknown agent id "${requestedAgentId}"`));
		return null;
	}
	return {
		cfg,
		agentId
	};
}
function buildCoreGroups() {
	return listCoreToolSections().map((section) => ({
		id: section.id,
		label: section.label,
		source: "core",
		tools: section.tools.map((tool) => ({
			id: tool.id,
			label: tool.label,
			description: tool.description,
			source: "core",
			defaultProfiles: resolveCoreToolProfiles(tool.id)
		}))
	}));
}
function buildPluginGroups(params) {
	const workspaceDir = resolveAgentWorkspaceDir(params.cfg, params.agentId);
	const agentDir = resolveAgentDir(params.cfg, params.agentId);
	const toolContext = {
		config: params.cfg,
		workspaceDir,
		agentDir,
		agentId: params.agentId
	};
	ensureStandalonePluginToolRegistryLoaded({
		context: toolContext,
		toolAllowlist: ["group:plugins"],
		allowGatewaySubagentBinding: true
	});
	const pluginTools = resolvePluginTools({
		context: toolContext,
		existingToolNames: params.existingToolNames,
		toolAllowlist: ["group:plugins"],
		suppressNameConflicts: true,
		allowGatewaySubagentBinding: true
	});
	const activeRegistry = getActivePluginRegistry();
	const groups = /* @__PURE__ */ new Map();
	const pluginToolMetadata = new Map((activeRegistry?.toolMetadata ?? []).map((entry) => [buildPluginToolMetadataKey(entry.pluginId, entry.metadata.toolName), entry.metadata]));
	const seenToolIds = /* @__PURE__ */ new Set();
	for (const tool of pluginTools) {
		const meta = getPluginToolMeta(tool);
		const pluginId = meta?.pluginId ?? "plugin";
		const groupId = `plugin:${pluginId}`;
		const existing = groups.get(groupId) ?? {
			id: groupId,
			label: pluginId,
			source: "plugin",
			pluginId,
			tools: []
		};
		const ownedMetadata = meta?.pluginId ? pluginToolMetadata.get(buildPluginToolMetadataKey(meta.pluginId, tool.name)) : void 0;
		existing.tools.push({
			id: tool.name,
			label: normalizeOptionalString(ownedMetadata?.displayName) ?? normalizeOptionalString(tool.label) ?? tool.name,
			description: summarizeToolDescriptionText({
				rawDescription: ownedMetadata?.description ?? (typeof tool.description === "string" ? tool.description : void 0),
				displaySummary: tool.displaySummary
			}),
			source: "plugin",
			pluginId,
			optional: meta?.optional,
			risk: ownedMetadata?.risk,
			tags: ownedMetadata?.tags,
			defaultProfiles: []
		});
		seenToolIds.add(tool.name);
		groups.set(groupId, existing);
	}
	for (const entry of activeRegistry?.tools ?? []) {
		const names = entry.names.length > 0 ? entry.names : entry.declaredNames ?? [];
		for (const name of names) {
			if (seenToolIds.has(name) || params.existingToolNames.has(name)) continue;
			const groupId = `plugin:${entry.pluginId}`;
			const existing = groups.get(groupId) ?? {
				id: groupId,
				label: entry.pluginName ?? entry.pluginId,
				source: "plugin",
				pluginId: entry.pluginId,
				tools: []
			};
			const ownedMetadata = pluginToolMetadata.get(buildPluginToolMetadataKey(entry.pluginId, name));
			existing.tools.push({
				id: name,
				label: normalizeOptionalString(ownedMetadata?.displayName) ?? name,
				description: summarizeToolDescriptionText({ rawDescription: ownedMetadata?.description }) || `Plugin tool from ${entry.pluginName ?? entry.pluginId}`,
				source: "plugin",
				pluginId: entry.pluginId,
				optional: entry.optional,
				risk: ownedMetadata?.risk,
				tags: ownedMetadata?.tags,
				defaultProfiles: []
			});
			seenToolIds.add(name);
			groups.set(groupId, existing);
		}
	}
	return [...groups.values()].map((group) => Object.assign({}, group, { tools: group.tools.toSorted((a, b) => a.id.localeCompare(b.id)) })).toSorted((a, b) => a.label.localeCompare(b.label));
}
function buildToolsCatalogResult(params) {
	const agentId = normalizeOptionalString(params.agentId) || resolveDefaultAgentId(params.cfg);
	const includePlugins = params.includePlugins !== false;
	const groups = buildCoreGroups();
	if (includePlugins) {
		const existingToolNames = new Set(groups.flatMap((group) => group.tools.map((tool) => tool.id)));
		groups.push(...buildPluginGroups({
			cfg: params.cfg,
			agentId,
			existingToolNames
		}));
	}
	return {
		agentId,
		profiles: PROFILE_OPTIONS.map((profile) => ({
			id: profile.id,
			label: profile.label
		})),
		groups
	};
}
const toolsCatalogHandlers = { "tools.catalog": ({ params, respond, context }) => {
	if (!validateToolsCatalogParams(params)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid tools.catalog params: ${formatValidationErrors(validateToolsCatalogParams.errors)}`));
		return;
	}
	const resolved = resolveAgentIdOrRespondError(params.agentId, respond, context.getRuntimeConfig());
	if (!resolved) return;
	respond(true, buildToolsCatalogResult({
		cfg: resolved.cfg,
		agentId: resolved.agentId,
		includePlugins: params.includePlugins
	}), void 0);
} };
//#endregion
export { buildToolsCatalogResult, toolsCatalogHandlers };
