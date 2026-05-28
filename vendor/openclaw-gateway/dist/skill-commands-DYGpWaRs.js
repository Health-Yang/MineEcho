import { a as normalizeLowercaseStringOrEmpty, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { f as resolveAgentSkillsFilter } from "./agent-scope-CudANNo3.js";
import { n as listAgentIds, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { r as logVerbose } from "./globals-DZ-ifL5z.js";
import { n as buildWorkspaceSkillCommandSpecs } from "./skills-AlUGzl4g.js";
import { t as listReservedChatSlashCommandNames } from "./skill-commands-base-CM3yKutB.js";
import { t as canExecRequestNode } from "./exec-defaults-19HKPhQW.js";
import { t as getRemoteSkillEligibility } from "./skills-remote-D26P_2EB.js";
import fs from "node:fs";
//#region src/auto-reply/skill-commands.ts
function listSkillCommandsForWorkspace(params) {
	return buildWorkspaceSkillCommandSpecs(params.workspaceDir, {
		config: params.cfg,
		agentId: params.agentId,
		skillFilter: params.skillFilter,
		eligibility: { remote: getRemoteSkillEligibility({ advertiseExecNode: canExecRequestNode({
			cfg: params.cfg,
			agentId: params.agentId
		}) }) },
		reservedNames: listReservedChatSlashCommandNames()
	});
}
function dedupeBySkillName(commands) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
	for (const cmd of commands) {
		const key = normalizeOptionalLowercaseString(cmd.skillName);
		if (key && seen.has(key)) continue;
		if (key) seen.add(key);
		out.push(cmd);
	}
	return out;
}
function listSkillCommandsForAgents(params) {
	const mergeSkillFilters = (existing, incoming) => {
		if (existing === void 0 || incoming === void 0) return;
		if (existing.length === 0) return uniqueStrings(incoming);
		if (incoming.length === 0) return uniqueStrings(existing);
		return uniqueStrings([...existing, ...incoming]);
	};
	const agentIds = params.agentIds ?? listAgentIds(params.cfg);
	const used = listReservedChatSlashCommandNames();
	const entries = [];
	const workspaceFilters = /* @__PURE__ */ new Map();
	for (const agentId of agentIds) {
		const workspaceDir = resolveAgentWorkspaceDir(params.cfg, agentId);
		if (!fs.existsSync(workspaceDir)) {
			logVerbose(`Skipping agent "${agentId}": workspace does not exist: ${workspaceDir}`);
			continue;
		}
		let canonicalDir;
		try {
			canonicalDir = fs.realpathSync(workspaceDir);
		} catch {
			logVerbose(`Skipping agent "${agentId}": cannot resolve workspace: ${workspaceDir}`);
			continue;
		}
		const skillFilter = resolveAgentSkillsFilter(params.cfg, agentId);
		const existing = workspaceFilters.get(canonicalDir);
		if (existing) {
			existing.skillFilter = mergeSkillFilters(existing.skillFilter, skillFilter);
			continue;
		}
		workspaceFilters.set(canonicalDir, {
			workspaceDir,
			skillFilter
		});
	}
	for (const { workspaceDir, skillFilter } of workspaceFilters.values()) {
		const commands = buildWorkspaceSkillCommandSpecs(workspaceDir, {
			config: params.cfg,
			skillFilter,
			eligibility: { remote: getRemoteSkillEligibility({ advertiseExecNode: canExecRequestNode({ cfg: params.cfg }) }) },
			reservedNames: used
		});
		for (const command of commands) {
			used.add(normalizeLowercaseStringOrEmpty(command.name));
			entries.push(command);
		}
	}
	return dedupeBySkillName(entries);
}
//#endregion
export { listSkillCommandsForWorkspace as n, listSkillCommandsForAgents as t };
