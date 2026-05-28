import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import "./agent-scope-CudANNo3.js";
import { n as normalizeAccountId } from "./account-id-B0YIFDpA.js";
import { l as normalizeAgentId } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-BfxErZq2.js";
import { r as normalizeChatChannelId } from "./ids-OP3BJTaQ.js";
import { i as listRouteBindings } from "./bindings-D1F1bOgs.js";
//#region src/routing/binding-scope.ts
function normalizeRouteBindingId(value) {
	if (typeof value === "string") return value.trim();
	if (typeof value === "number" || typeof value === "bigint") return String(value).trim();
	return "";
}
function normalizeRouteBindingRoles(value) {
	return Array.isArray(value) && value.length > 0 ? value : null;
}
function normalizeRouteBindingChannelId(raw) {
	const normalized = normalizeChatChannelId(raw);
	if (normalized) return normalized;
	return normalizeLowercaseStringOrEmpty(raw) || null;
}
function resolveNormalizedRouteBindingMatch(binding) {
	if (!binding || typeof binding !== "object") return null;
	const match = binding.match;
	if (!match || typeof match !== "object") return null;
	const channelId = normalizeRouteBindingChannelId(match.channel);
	if (!channelId) return null;
	const accountId = typeof match.accountId === "string" ? match.accountId.trim() : "";
	if (!accountId || accountId === "*") return null;
	return {
		agentId: normalizeAgentId(binding.agentId),
		accountId: normalizeAccountId(accountId),
		channelId
	};
}
function scopeIdMatches(params) {
	if (!params.constraint) return true;
	return params.constraint === params.exact || params.constraint === params.groupSpace;
}
function hasRoleLookup(memberRoleIds) {
	return typeof memberRoleIds.has === "function";
}
function hasAnyRouteBindingRole(roles, memberRoleIds) {
	if (!memberRoleIds) return false;
	if (hasRoleLookup(memberRoleIds)) return roles.some((role) => memberRoleIds.has(role));
	const memberRoleIdSet = new Set(memberRoleIds);
	return roles.some((role) => memberRoleIdSet.has(role));
}
function routeBindingScopeMatches(constraint, scope) {
	const guildId = normalizeRouteBindingId(scope.guildId);
	const teamId = normalizeRouteBindingId(scope.teamId);
	const groupSpace = normalizeRouteBindingId(scope.groupSpace);
	if (!scopeIdMatches({
		constraint: constraint.guildId,
		exact: guildId,
		groupSpace
	})) return false;
	if (!scopeIdMatches({
		constraint: constraint.teamId,
		exact: teamId,
		groupSpace
	})) return false;
	const roles = normalizeRouteBindingRoles(constraint.roles);
	if (!roles) return true;
	return hasAnyRouteBindingRole(roles, scope.memberRoleIds);
}
//#endregion
//#region src/routing/bindings.ts
function listBindings(cfg) {
	return listRouteBindings(cfg);
}
function listBoundAccountIds(cfg, channelId) {
	const normalizedChannel = normalizeRouteBindingChannelId(channelId);
	if (!normalizedChannel) return [];
	const ids = /* @__PURE__ */ new Set();
	for (const binding of listBindings(cfg)) {
		const resolved = resolveNormalizedRouteBindingMatch(binding);
		if (!resolved || resolved.channelId !== normalizedChannel) continue;
		ids.add(resolved.accountId);
	}
	return Array.from(ids).toSorted((a, b) => a.localeCompare(b));
}
function resolveDefaultAgentBoundAccountId(cfg, channelId) {
	const normalizedChannel = normalizeRouteBindingChannelId(channelId);
	if (!normalizedChannel) return null;
	const defaultAgentId = normalizeAgentId(resolveDefaultAgentId(cfg));
	for (const binding of listBindings(cfg)) {
		const resolved = resolveNormalizedRouteBindingMatch(binding);
		if (!resolved || resolved.channelId !== normalizedChannel || resolved.agentId !== defaultAgentId) continue;
		return resolved.accountId;
	}
	return null;
}
function buildChannelAccountBindings(cfg) {
	const map = /* @__PURE__ */ new Map();
	for (const binding of listBindings(cfg)) {
		const resolved = resolveNormalizedRouteBindingMatch(binding);
		if (!resolved) continue;
		const byAgent = map.get(resolved.channelId) ?? /* @__PURE__ */ new Map();
		const list = byAgent.get(resolved.agentId) ?? [];
		if (!list.includes(resolved.accountId)) list.push(resolved.accountId);
		byAgent.set(resolved.agentId, list);
		map.set(resolved.channelId, byAgent);
	}
	return map;
}
function resolvePreferredAccountId(params) {
	if (params.boundAccounts.length > 0) return params.boundAccounts[0];
	return params.defaultAccountId;
}
//#endregion
export { resolvePreferredAccountId as a, normalizeRouteBindingRoles as c, resolveDefaultAgentBoundAccountId as i, resolveNormalizedRouteBindingMatch as l, listBindings as n, normalizeRouteBindingChannelId as o, listBoundAccountIds as r, normalizeRouteBindingId as s, buildChannelAccountBindings as t, routeBindingScopeMatches as u };
