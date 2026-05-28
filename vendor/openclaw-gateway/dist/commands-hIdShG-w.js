import { s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import "./agent-scope-CudANNo3.js";
import { c as resolveDefaultAgentId, n as listAgentIds } from "./agent-scope-config-BfxErZq2.js";
import { Ii as ErrorCodes, Li as errorShape, ra as COMMAND_DESCRIPTION_MAX_LENGTH, t as formatValidationErrors, w as validateCommandsListParams } from "./protocol-BkfNT2Bp.js";
import { t as getChannelPlugin } from "./registry-Be8exPcf.js";
import "./plugins-BGmuVWWz.js";
import { r as listChatCommandsForConfig } from "./commands-registry-list-CpV1Ipai.js";
import { t as getPluginCommandSpecs } from "./command-specs-BWetvoLK.js";
import { n as listPluginCommands } from "./commands-Ctnxt50B.js";
import "./commands-registry-Brl2piP4.js";
import { t as listSkillCommandsForAgents } from "./skill-commands-DYGpWaRs.js";
//#region src/gateway/server-methods/commands.ts
function clampString(value, maxLength) {
	return value.length > maxLength ? value.slice(0, maxLength) : value;
}
function trimClampNonEmpty(value, maxLength) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	return clampString(trimmed, maxLength);
}
function clampDescription(value) {
	return clampString(value ?? "", COMMAND_DESCRIPTION_MAX_LENGTH);
}
function resolveAgentIdOrRespondError(rawAgentId, respond, cfg) {
	const knownAgents = listAgentIds(cfg);
	const requestedAgentId = typeof rawAgentId === "string" ? rawAgentId.trim() : "";
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
function resolveNativeName(cmd, provider) {
	const baseName = cmd.nativeName ?? cmd.key;
	if (!provider || !cmd.nativeName) return baseName;
	return getChannelPlugin(provider)?.commands?.resolveNativeCommandName?.({
		commandKey: cmd.key,
		defaultName: cmd.nativeName
	}) ?? baseName;
}
function stripLeadingSlash(value) {
	return value.startsWith("/") ? value.slice(1) : value;
}
function resolveTextAliases(cmd) {
	const seen = /* @__PURE__ */ new Set();
	const aliases = [];
	for (const alias of cmd.textAliases) {
		const trimmed = trimClampNonEmpty(alias, 200);
		if (!trimmed) continue;
		const exactAlias = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
		if (seen.has(exactAlias)) continue;
		seen.add(exactAlias);
		aliases.push(exactAlias);
		if (aliases.length >= 20) break;
	}
	if (aliases.length > 0) return aliases;
	return [`/${clampString(cmd.key, 200)}`];
}
function resolvePrimaryTextName(cmd) {
	return stripLeadingSlash(resolveTextAliases(cmd)[0] ?? `/${cmd.key}`);
}
function serializeArg(arg) {
	const isDynamic = typeof arg.choices === "function";
	const staticChoices = Array.isArray(arg.choices) ? arg.choices.slice(0, 50).map(normalizeChoice) : void 0;
	return {
		name: clampString(arg.name, 200),
		description: clampString(arg.description, 500),
		type: arg.type,
		...arg.required ? { required: true } : {},
		...staticChoices ? { choices: staticChoices } : {},
		...isDynamic ? { dynamic: true } : {}
	};
}
function normalizeChoice(choice) {
	if (typeof choice === "string") return {
		value: clampString(choice, 200),
		label: clampString(choice, 200)
	};
	return {
		value: clampString(choice.value, 200),
		label: clampString(choice.label, 200)
	};
}
function mapCommand(cmd, source, includeArgs, nameSurface, provider) {
	const shouldIncludeArgs = includeArgs && cmd.acceptsArgs && cmd.args?.length;
	const nativeName = cmd.scope === "text" ? void 0 : resolveNativeName(cmd, provider);
	return {
		name: clampString(nameSurface === "text" ? resolvePrimaryTextName(cmd) : nativeName ?? cmd.key, 200),
		...nativeName ? { nativeName: clampString(nativeName, 200) } : {},
		...cmd.scope !== "native" ? { textAliases: resolveTextAliases(cmd) } : {},
		description: clampDescription(cmd.description),
		...cmd.category ? { category: cmd.category } : {},
		source,
		scope: cmd.scope,
		acceptsArgs: Boolean(cmd.acceptsArgs),
		...shouldIncludeArgs ? { args: cmd.args.slice(0, 20).map(serializeArg) } : {}
	};
}
function buildPluginCommandEntries(params) {
	const pluginTextSpecs = listPluginCommands();
	const pluginNativeSpecs = getPluginCommandSpecs(params.provider, { config: params.cfg });
	const entries = [];
	for (const [index, textSpec] of pluginTextSpecs.entries()) {
		const nativeName = pluginNativeSpecs[index]?.name;
		entries.push({
			name: clampString(params.nameSurface === "text" ? textSpec.name : nativeName ?? textSpec.name, 200),
			...nativeName ? { nativeName: clampString(nativeName, 200) } : {},
			textAliases: [`/${clampString(textSpec.name, 200)}`],
			description: clampDescription(textSpec.description),
			source: "plugin",
			scope: "both",
			acceptsArgs: textSpec.acceptsArgs
		});
	}
	if (params.nameSurface === "native") return entries.filter((entry) => entry.nativeName);
	return entries;
}
function buildCommandsListResult(params) {
	const includeArgs = params.includeArgs !== false;
	const scopeFilter = params.scope ?? "both";
	const nameSurface = scopeFilter === "text" ? "text" : "native";
	const provider = normalizeOptionalLowercaseString(params.provider);
	const skillCommands = listSkillCommandsForAgents({
		cfg: params.cfg,
		agentIds: [params.agentId]
	});
	const chatCommands = listChatCommandsForConfig(params.cfg, { skillCommands });
	const skillKeys = new Set(skillCommands.map((sc) => `skill:${sc.skillName}`));
	const commands = [];
	for (const cmd of chatCommands) {
		if (scopeFilter !== "both" && cmd.scope !== "both" && cmd.scope !== scopeFilter) continue;
		commands.push(mapCommand(cmd, skillKeys.has(cmd.key) ? "skill" : "native", includeArgs, nameSurface, provider));
	}
	commands.push(...buildPluginCommandEntries({
		provider,
		nameSurface,
		cfg: params.cfg
	}));
	return { commands: commands.slice(0, 500) };
}
const commandsHandlers = { "commands.list": ({ params, respond, context }) => {
	if (!validateCommandsListParams(params)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid commands.list params: ${formatValidationErrors(validateCommandsListParams.errors)}`));
		return;
	}
	const resolved = resolveAgentIdOrRespondError(params.agentId, respond, context.getRuntimeConfig());
	if (!resolved) return;
	respond(true, buildCommandsListResult({
		cfg: resolved.cfg,
		agentId: resolved.agentId,
		provider: params.provider,
		scope: params.scope,
		includeArgs: params.includeArgs
	}), void 0);
} };
//#endregion
export { buildCommandsListResult, commandsHandlers };
