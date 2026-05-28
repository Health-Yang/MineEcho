import { m as resolvePluginApprovalRequestAllowedDecisions } from "./plugin-approvals-C9xbHKhZ.js";
import { D as resolveExecApprovalRequestAllowedDecisions } from "./exec-approvals-oH5G9_TS.js";
import { a as buildExecApprovalActionDescriptors } from "./exec-approval-reply-CvpRi92u.js";
import { t as resolveExecApprovalCommandDisplay } from "./exec-approval-command-display-Cs9jISl9.js";
//#region src/infra/approval-view-model.ts
function buildApprovalActionViewsFromDescriptors(actions) {
	const views = [];
	for (const action of actions) {
		if ((action.kind ?? "decision") === "command") {
			views.push({
				kind: "command",
				label: action.label,
				style: action.style,
				command: action.command
			});
			continue;
		}
		if (!action.decision) continue;
		views.push({
			kind: "decision",
			decision: action.decision,
			label: action.label,
			style: action.style,
			command: action.command
		});
	}
	return views;
}
function buildExecMetadata(request) {
	const metadata = [];
	if (request.request.agentId) metadata.push({
		label: "Agent",
		value: request.request.agentId
	});
	if (request.request.cwd) metadata.push({
		label: "CWD",
		value: request.request.cwd
	});
	if (request.request.host) metadata.push({
		label: "Host",
		value: request.request.host
	});
	if (Array.isArray(request.request.envKeys) && request.request.envKeys.length > 0) metadata.push({
		label: "Env Overrides",
		value: request.request.envKeys.join(", ")
	});
	return metadata;
}
function buildPluginMetadata(request) {
	const metadata = [];
	const severity = request.request.severity ?? "warning";
	metadata.push({
		label: "Severity",
		value: severity === "critical" ? "Critical" : severity === "info" ? "Info" : "Warning"
	});
	if (request.request.toolName) metadata.push({
		label: "Tool",
		value: request.request.toolName
	});
	if (request.request.pluginId) metadata.push({
		label: "Plugin",
		value: request.request.pluginId
	});
	if (request.request.agentId) metadata.push({
		label: "Agent",
		value: request.request.agentId
	});
	return metadata;
}
function buildExecViewBase(request, phase) {
	const { commandText, commandPreview } = resolveExecApprovalCommandDisplay(request.request);
	return {
		approvalId: request.id,
		approvalKind: "exec",
		phase,
		title: phase === "pending" ? "Exec Approval Required" : "Exec Approval",
		description: phase === "pending" ? "A command needs your approval." : null,
		metadata: buildExecMetadata(request),
		ask: request.request.ask ?? null,
		agentId: request.request.agentId ?? null,
		warningText: request.request.warningText ?? null,
		commandAnalysis: request.request.commandAnalysis ?? null,
		commandText,
		commandPreview,
		cwd: request.request.cwd ?? null,
		envKeys: request.request.envKeys ?? void 0,
		host: request.request.host ?? null,
		nodeId: request.request.nodeId ?? null,
		sessionKey: request.request.sessionKey ?? null
	};
}
function buildPluginViewBase(request, phase) {
	return {
		approvalId: request.id,
		approvalKind: "plugin",
		phase,
		title: request.request.title,
		description: request.request.description ?? null,
		metadata: buildPluginMetadata(request),
		agentId: request.request.agentId ?? null,
		pluginId: request.request.pluginId ?? null,
		toolName: request.request.toolName ?? null,
		severity: request.request.severity ?? "warning"
	};
}
function buildPluginApprovalActions(request) {
	if (Array.isArray(request.request.actions) && request.request.actions.length > 0) return request.request.actions.map((action) => {
		if (action.kind === "decision") return {
			kind: "decision",
			decision: action.decision,
			label: action.label,
			style: action.style,
			command: action.command
		};
		return {
			kind: "command",
			label: action.label,
			style: action.style,
			command: action.command
		};
	});
	return buildApprovalActionViewsFromDescriptors(buildExecApprovalActionDescriptors({
		approvalCommandId: request.id,
		allowedDecisions: resolvePluginApprovalRequestAllowedDecisions(request.request)
	}));
}
function buildPendingApprovalView(request) {
	if (request.id.startsWith("plugin:")) {
		const pluginRequest = request;
		return {
			...buildPluginViewBase(pluginRequest, "pending"),
			actions: buildPluginApprovalActions(pluginRequest),
			expiresAtMs: pluginRequest.expiresAtMs
		};
	}
	const execRequest = request;
	return {
		...buildExecViewBase(execRequest, "pending"),
		actions: buildApprovalActionViewsFromDescriptors(buildExecApprovalActionDescriptors({
			approvalCommandId: execRequest.id,
			ask: execRequest.request.ask,
			allowedDecisions: resolveExecApprovalRequestAllowedDecisions(execRequest.request)
		})),
		expiresAtMs: execRequest.expiresAtMs
	};
}
function buildResolvedApprovalView(request, resolved) {
	if (request.id.startsWith("plugin:")) return {
		...buildPluginViewBase(request, "resolved"),
		decision: resolved.decision,
		resolvedBy: resolved.resolvedBy
	};
	return {
		...buildExecViewBase(request, "resolved"),
		decision: resolved.decision,
		resolvedBy: resolved.resolvedBy
	};
}
function buildExpiredApprovalView(request) {
	if (request.id.startsWith("plugin:")) return buildPluginViewBase(request, "expired");
	return buildExecViewBase(request, "expired");
}
//#endregion
export { buildPendingApprovalView as n, buildResolvedApprovalView as r, buildExpiredApprovalView as t };
