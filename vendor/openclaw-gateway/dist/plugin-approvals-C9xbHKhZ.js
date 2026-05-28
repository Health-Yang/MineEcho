//#region src/infra/plugin-approvals.ts
function isApprovalDecision(value) {
	return value === "allow-once" || value === "allow-always" || value === "deny";
}
function validatePluginApprovalActionTemplates(actions) {
	for (const [index, action] of actions.entries()) {
		const decision = action.decision;
		if (action.kind === "command" && decision !== void 0) return `actions[${index}] command actions must not include decision`;
		if (action.kind === "decision" && !isApprovalDecision(decision)) return `actions[${index}] decision actions must include a valid decision`;
	}
	return null;
}
function normalizePluginApprovalActionTemplate(action) {
	const decision = action.decision;
	if (action.kind === "command" && decision !== void 0) return null;
	if (action.kind === "command") return {
		kind: "command",
		label: action.label,
		style: action.style,
		commandTemplate: action.commandTemplate
	};
	if (action.kind === "decision" && isApprovalDecision(decision)) return {
		kind: "decision",
		label: action.label,
		style: action.style,
		decision,
		commandTemplate: action.commandTemplate
	};
	return null;
}
const DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS = 12e4;
const MAX_PLUGIN_APPROVAL_TIMEOUT_MS = 6e5;
const PLUGIN_APPROVAL_TITLE_MAX_LENGTH = 80;
const PLUGIN_APPROVAL_DESCRIPTION_MAX_LENGTH = 256;
const PLUGIN_APPROVAL_ACTION_LABEL_MAX_LENGTH = 40;
const PLUGIN_APPROVAL_ACTION_COMMAND_TEMPLATE_MAX_LENGTH = 200;
const MAX_PLUGIN_APPROVAL_ACTIONS = 6;
const DEFAULT_PLUGIN_APPROVAL_DECISIONS = [
	"allow-once",
	"allow-always",
	"deny"
];
function approvalDecisionLabel(decision) {
	if (decision === "allow-once") return "allowed once";
	if (decision === "allow-always") return "allowed always";
	return "denied";
}
function resolvePluginApprovalRequestAllowedDecisions(params) {
	const explicit = [];
	if (Array.isArray(params?.allowedDecisions)) {
		for (const decision of params.allowedDecisions) if ((decision === "allow-once" || decision === "allow-always" || decision === "deny") && !explicit.includes(decision)) explicit.push(decision);
	}
	return explicit.length > 0 ? explicit : DEFAULT_PLUGIN_APPROVAL_DECISIONS;
}
function expandPluginApprovalActionTemplates(params) {
	if (!Array.isArray(params.actions) || params.actions.length === 0) return;
	const expanded = [];
	for (const rawAction of params.actions) {
		const action = normalizePluginApprovalActionTemplate(rawAction);
		if (!action) continue;
		const label = action.label.trim();
		const command = action.commandTemplate.replaceAll("{id}", params.approvalId).trim();
		if (!label || !command) continue;
		if (action.kind === "decision") {
			expanded.push({
				kind: "decision",
				label,
				style: action.style,
				decision: action.decision,
				command
			});
			continue;
		}
		expanded.push({
			kind: "command",
			label,
			style: action.style,
			command
		});
	}
	return expanded.length > 0 ? expanded : void 0;
}
function buildPluginApprovalRequestMessage(request, nowMsValue) {
	const lines = [];
	const severity = request.request.severity ?? "warning";
	const icon = severity === "critical" ? "🚨" : severity === "info" ? "ℹ️" : "🛡️";
	lines.push(`${icon} Plugin approval required`);
	lines.push(`Title: ${request.request.title}`);
	lines.push(`Description: ${request.request.description}`);
	if (request.request.toolName) lines.push(`Tool: ${request.request.toolName}`);
	if (request.request.pluginId) lines.push(`Plugin: ${request.request.pluginId}`);
	if (request.request.agentId) lines.push(`Agent: ${request.request.agentId}`);
	lines.push(`ID: ${request.id}`);
	const expiresIn = Math.max(0, Math.round((request.expiresAtMs - nowMsValue) / 1e3));
	lines.push(`Expires in: ${expiresIn}s`);
	const actionCommands = request.request.actions?.map((action) => action.command.trim()).filter((command) => command.length > 0);
	if (actionCommands && actionCommands.length > 0) {
		lines.push("Reply with one of:");
		lines.push(actionCommands.join("\n"));
	} else lines.push(`Reply with: /approve <id> ${resolvePluginApprovalRequestAllowedDecisions(request.request).join("|")}`);
	return lines.join("\n");
}
function buildPluginApprovalResolvedMessage(resolved) {
	return `${`✅ Plugin approval ${approvalDecisionLabel(resolved.decision)}.`}${resolved.resolvedBy ? ` Resolved by ${resolved.resolvedBy}.` : ""} ID: ${resolved.id}`;
}
function buildPluginApprovalExpiredMessage(request) {
	return `⏱️ Plugin approval expired. ID: ${request.id}`;
}
//#endregion
export { PLUGIN_APPROVAL_ACTION_COMMAND_TEMPLATE_MAX_LENGTH as a, PLUGIN_APPROVAL_TITLE_MAX_LENGTH as c, buildPluginApprovalRequestMessage as d, buildPluginApprovalResolvedMessage as f, validatePluginApprovalActionTemplates as h, MAX_PLUGIN_APPROVAL_TIMEOUT_MS as i, approvalDecisionLabel as l, resolvePluginApprovalRequestAllowedDecisions as m, DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS as n, PLUGIN_APPROVAL_ACTION_LABEL_MAX_LENGTH as o, expandPluginApprovalActionTemplates as p, MAX_PLUGIN_APPROVAL_ACTIONS as r, PLUGIN_APPROVAL_DESCRIPTION_MAX_LENGTH as s, DEFAULT_PLUGIN_APPROVAL_DECISIONS as t, buildPluginApprovalExpiredMessage as u };
