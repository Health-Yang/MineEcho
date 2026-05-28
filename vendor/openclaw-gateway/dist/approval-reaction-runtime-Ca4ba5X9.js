import { t as sanitizeForPromptLiteral } from "./sanitize-for-prompt-ByaJGDhT.js";
import { t as formatApprovalDisplayPath } from "./approval-display-paths-BqRczx-P.js";
import { c as buildExecApprovalPendingReplyPayload, d as formatExecApprovalExpiresIn } from "./exec-approval-reply-CvpRi92u.js";
import { n as buildPendingApprovalView } from "./approval-view-model-CkRFCrsp.js";
import "./approval-native-helpers-DorIyB3D.js";
import { r as buildPluginApprovalPendingReplyPayload, t as buildApprovalPendingReplyPayload } from "./approval-renderers-MGVAWGjJ.js";
//#region src/plugin-sdk/approval-reaction-runtime.ts
const APPROVAL_REACTION_BINDINGS = [
	{
		decision: "allow-once",
		emoji: "👍",
		label: "Allow Once"
	},
	{
		decision: "allow-always",
		emoji: "♾️",
		label: "Allow Always"
	},
	{
		decision: "deny",
		emoji: "👎",
		label: "Deny"
	}
];
const APPROVAL_REACTION_ORDER = APPROVAL_REACTION_BINDINGS.map((binding) => binding.decision);
const VARIATION_SELECTOR_RE = /[\uFE0E\uFE0F]/gu;
const FITZPATRICK_MODIFIER_RE = /[\u{1F3FB}-\u{1F3FF}]/gu;
function normalizeDecisionList(allowedDecisions) {
	const allowed = new Set(allowedDecisions);
	return APPROVAL_REACTION_ORDER.filter((decision) => allowed.has(decision));
}
function listApprovalReactionBindings(params) {
	const allowed = new Set(normalizeDecisionList(params.allowedDecisions));
	return APPROVAL_REACTION_BINDINGS.filter((binding) => allowed.has(binding.decision)).map((binding) => ({
		decision: binding.decision,
		emoji: binding.emoji,
		label: binding.label
	}));
}
function buildApprovalReactionHint(params) {
	const bindings = listApprovalReactionBindings(params);
	if (bindings.length === 0) return null;
	return `React with:\n\n${bindings.map((binding) => `${binding.emoji} ${binding.label}`).join("\n")}`;
}
function normalizeApprovalReactionEmoji(reactionKey) {
	const normalized = reactionKey.trim().replace(VARIATION_SELECTOR_RE, "").replace(FITZPATRICK_MODIFIER_RE, "");
	if (normalized === "♾") return "♾️";
	return normalized;
}
function resolveApprovalReactionDecision(params) {
	const normalizedEmoji = normalizeApprovalReactionEmoji(params.reactionKey);
	if (!normalizedEmoji) return null;
	for (const binding of listApprovalReactionBindings(params)) if (binding.emoji === normalizedEmoji) return {
		decision: binding.decision,
		normalizedEmoji
	};
	return null;
}
function resolveApprovalReactionTarget(params) {
	const target = params.target;
	if (!target) return null;
	const decision = resolveApprovalReactionDecision({
		reactionKey: params.reactionKey,
		allowedDecisions: target.allowedDecisions
	});
	if (!decision) return null;
	const approvalId = target.approvalId.trim();
	if (!approvalId) return null;
	return {
		approvalId,
		approvalKind: target.approvalKind ?? (approvalId.startsWith("plugin:") ? "plugin" : "exec"),
		decision: decision.decision,
		normalizedEmoji: decision.normalizedEmoji,
		...target.route === void 0 ? {} : { route: target.route }
	};
}
function buildFence(text, language) {
	let fence = "```";
	while (text.includes(fence)) fence += "`";
	return `${fence}${language ?? ""}\n${text}\n${fence}`;
}
function formatSeverity(value) {
	return value === "critical" ? "Critical" : value === "info" ? "Info" : "Warning";
}
function buildDecisionText(allowedDecisions) {
	return allowedDecisions.join("|");
}
function buildManualInstructionSection(params) {
	const lines = [];
	if (!params.allowedDecisions.includes("allow-always")) lines.push("Allow Always is unavailable because the effective policy requires approval every time.");
	if (params.allowedDecisions.length > 0) lines.push(`Reply with: /approve ${params.approvalId} ${buildDecisionText(params.allowedDecisions)}`);
	return lines;
}
function buildCommandActionInstructionSection(actions) {
	return actions.flatMap((action) => action.kind === "command" && action.command.trim() ? [`${action.label}: ${action.command}`] : []);
}
function listDecisionActions(actions) {
	return normalizeDecisionList(actions.flatMap((action) => action.kind === "decision" ? [action.decision] : []));
}
function buildApprovalReactionPromptText(params) {
	const { view } = params;
	const allowedDecisions = listDecisionActions(view.actions);
	const sections = [];
	if (view.approvalKind === "exec") {
		const header = ["Exec approval required", `ID: ${view.approvalId}`];
		sections.push(header.join("\n"));
		const warningText = view.warningText?.trim();
		if (warningText) sections.push(warningText);
		const warningLines = view.commandAnalysis?.warningLines?.map((line) => line.trim()).filter(Boolean).slice(0, 5);
		if (warningLines?.length) sections.push(["Command analysis:", ...warningLines.map((line) => `- ${line}`)].join("\n"));
		sections.push(["Pending command:", buildFence(view.commandText, "sh")].join("\n"));
		const info = [];
		if (view.cwd) info.push(`CWD: ${formatApprovalDisplayPath(sanitizeForPromptLiteral(view.cwd))}`);
		if (view.host) info.push(`Host: ${view.host}`);
		if (view.nodeId) info.push(`Node: ${view.nodeId}`);
		if (view.agentId) info.push(`Agent: ${view.agentId}`);
		if (view.ask) info.push(`Ask: ${view.ask}`);
		info.push(`Expires in: ${formatExecApprovalExpiresIn(view.expiresAtMs, params.nowMs)}`);
		info.push(`Full id: \`${view.approvalId}\``);
		sections.push(info.join("\n"));
	} else {
		const header = ["Plugin approval required", `ID: ${view.approvalId}`];
		sections.push(header.join("\n"));
		const details = [`Title: ${view.title}`];
		if (view.description) details.push(`Description: ${view.description}`);
		details.push(`Severity: ${formatSeverity(view.severity)}`);
		if (view.toolName) details.push(`Tool: ${view.toolName}`);
		if (view.pluginId) details.push(`Plugin: ${view.pluginId}`);
		if (view.agentId) details.push(`Agent: ${view.agentId}`);
		details.push(`Expires in: ${formatExecApprovalExpiresIn(view.expiresAtMs, params.nowMs)}`);
		details.push(`Full id: \`${view.approvalId}\``);
		sections.push(details.join("\n"));
	}
	if (params.reactionHint) sections.push(params.reactionHint);
	const commandInstructions = buildCommandActionInstructionSection(view.actions);
	if (commandInstructions.length > 0) sections.push(commandInstructions.join("\n"));
	const manualInstructions = buildManualInstructionSection({
		approvalId: view.approvalId,
		allowedDecisions
	});
	if (manualInstructions.length > 0) sections.push(manualInstructions.join("\n"));
	return sections.filter(Boolean).join("\n\n");
}
function withoutPresentation(payload) {
	const { presentation: _presentation, interactive: _interactive, ...rest } = payload;
	return rest;
}
function buildMetadataPayload(params) {
	const sessionKey = params.request.request && "sessionKey" in params.request.request ? params.request.request.sessionKey : null;
	return withoutPresentation(buildApprovalPendingReplyPayload({
		approvalKind: params.view.approvalKind,
		approvalId: params.view.approvalId,
		approvalSlug: params.view.approvalId.slice(0, 8),
		text: params.text,
		agentId: params.view.agentId ?? null,
		allowedDecisions: params.allowedDecisions,
		sessionKey
	}));
}
function buildApprovalPendingPromptPayload(params) {
	const allowedDecisions = listDecisionActions(params.view.actions);
	const reactionBindings = listApprovalReactionBindings({ allowedDecisions });
	const text = buildApprovalReactionPromptText({
		view: params.view,
		nowMs: params.nowMs,
		reactionHint: buildApprovalReactionHint({ allowedDecisions })
	});
	return {
		...buildMetadataPayload({
			request: params.request,
			view: params.view,
			text,
			allowedDecisions
		}),
		allowedDecisions,
		reactionBindings
	};
}
function buildApprovalReactionPromptPayloadForRequest(params) {
	return buildApprovalPendingPromptPayload({
		request: params.request,
		view: buildPendingApprovalView(params.request),
		nowMs: params.nowMs
	});
}
function replaceApprovalIdPlaceholder(text, approvalId) {
	return (text ?? "").replace(/\/approve\s+<id>/g, `/approve ${approvalId}`);
}
function buildApprovalReactionPendingContent(params) {
	const reactionPayload = buildApprovalPendingPromptPayload(params);
	return {
		reactionPayload,
		manualFallbackPayload: params.view.approvalKind === "plugin" ? (() => {
			const payload = buildPluginApprovalPendingReplyPayload({
				request: params.request,
				nowMs: params.nowMs,
				allowedDecisions: reactionPayload.allowedDecisions
			});
			return withoutPresentation({
				...payload,
				text: replaceApprovalIdPlaceholder(payload.text, params.request.id)
			});
		})() : withoutPresentation(buildExecApprovalPendingReplyPayload({
			approvalId: params.request.id,
			approvalSlug: params.request.id.slice(0, 8),
			approvalCommandId: params.request.id,
			warningText: params.view.warningText ?? void 0,
			ask: params.view.ask ?? null,
			agentId: params.view.agentId ?? null,
			allowedDecisions: reactionPayload.allowedDecisions,
			command: params.view.commandText,
			cwd: params.view.cwd ?? void 0,
			host: params.view.host === "node" ? "node" : "gateway",
			nodeId: params.view.nodeId ?? void 0,
			sessionKey: params.view.sessionKey ?? null,
			expiresAtMs: params.request.expiresAtMs,
			nowMs: params.nowMs
		}))
	};
}
function buildApprovalReactionPendingContentForRequest(params) {
	return buildApprovalReactionPendingContent({
		request: params.request,
		view: buildPendingApprovalView(params.request),
		nowMs: params.nowMs
	});
}
function createApprovalReactionTargetStore(params) {
	const nowMs = params.nowMs ?? Date.now;
	const memory = /* @__PURE__ */ new Map();
	let persistentStore;
	let persistentStoreDisabled = false;
	const disablePersistentStore = (error) => {
		persistentStoreDisabled = true;
		persistentStore = void 0;
		params.logPersistentError?.(error);
	};
	const getPersistentStore = () => {
		if (persistentStoreDisabled || !params.openStore) return;
		if (persistentStore) return persistentStore;
		try {
			persistentStore = params.openStore({
				namespace: params.namespace,
				maxEntries: params.maxEntries,
				defaultTtlMs: params.defaultTtlMs
			});
			return persistentStore;
		} catch (error) {
			disablePersistentStore(error);
			return;
		}
	};
	const pruneMemory = () => {
		const now = nowMs();
		for (const [key, entry] of memory) if (entry.expiresAtMs <= now) memory.delete(key);
		while (memory.size > params.maxEntries) {
			const oldestKey = memory.keys().next().value;
			if (!oldestKey) return;
			memory.delete(oldestKey);
		}
	};
	return {
		register(key, target, opts) {
			const normalizedKey = key.trim();
			if (!normalizedKey) return;
			const ttlMs = Math.max(1, opts?.ttlMs ?? params.defaultTtlMs);
			memory.set(normalizedKey, {
				target,
				expiresAtMs: nowMs() + ttlMs
			});
			pruneMemory();
			const store = getPersistentStore();
			if (!store) return;
			store.register(normalizedKey, {
				version: 1,
				target
			}, { ttlMs }).catch(disablePersistentStore);
		},
		async lookup(key) {
			const normalizedKey = key.trim();
			if (!normalizedKey) return null;
			pruneMemory();
			const entry = memory.get(normalizedKey);
			if (entry) return entry.target;
			const store = getPersistentStore();
			if (!store) return null;
			try {
				const persisted = await store.lookup(normalizedKey);
				if (persisted?.version !== 1) return null;
				return params.readPersistedTarget ? params.readPersistedTarget(persisted.target) : persisted.target;
			} catch (error) {
				disablePersistentStore(error);
				return null;
			}
		},
		delete(key) {
			const normalizedKey = key.trim();
			if (!normalizedKey) return;
			memory.delete(normalizedKey);
			const store = getPersistentStore();
			if (!store) return;
			store.delete(normalizedKey).catch(disablePersistentStore);
		},
		clearForTest() {
			memory.clear();
			persistentStore = void 0;
			persistentStoreDisabled = false;
		}
	};
}
//#endregion
export { buildApprovalReactionPendingContentForRequest as a, listApprovalReactionBindings as c, resolveApprovalReactionTarget as d, buildApprovalReactionPendingContent as i, normalizeApprovalReactionEmoji as l, buildApprovalPendingPromptPayload as n, buildApprovalReactionPromptPayloadForRequest as o, buildApprovalReactionHint as r, createApprovalReactionTargetStore as s, APPROVAL_REACTION_BINDINGS as t, resolveApprovalReactionDecision as u };
