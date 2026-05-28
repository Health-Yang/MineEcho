import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { l as normalizeE164 } from "./utils-B5r0V84N.js";
import { n as normalizeAccountId } from "./account-id-B0YIFDpA.js";
import { c as kindFromMime } from "./mime-DppuT-pZ.js";
import { t as createMessageReceiptFromOutboundResults } from "./receipt-KEYzve-j.js";
import { t as resolveOutboundAttachmentFromUrl } from "./outbound-attachment-Cwl5taSm.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./routing-BEOAuKfu.js";
import { t as resolveMarkdownTableMode } from "./markdown-tables-B8E9CbD4.js";
import { t as createPluginRuntimeStore } from "./runtime-store-Cezm5nT2.js";
import { t as matchesApprovalRequestFilters } from "./approval-request-filters-VKwGhlg-.js";
import "./approval-client-runtime-DwawpTKX.js";
import { c as listApprovalReactionBindings, d as resolveApprovalReactionTarget, r as buildApprovalReactionHint, s as createApprovalReactionTargetStore } from "./approval-reaction-runtime-Ca4ba5X9.js";
import { t as requireRuntimeConfig } from "./plugin-config-runtime-CbVZSjfC.js";
import "./channel-outbound-DuRkxH3q.js";
import "./media-runtime-BndVydhQ.js";
import "./markdown-table-runtime-D0twI-Sd.js";
import "./text-utility-runtime-Da3iUwdt.js";
import { i as resolveSignalAccount } from "./accounts-CiPyF2G3.js";
import { d as normalizeSignalMessagingTarget, l as looksLikeUuid } from "./identity-DoC1DJz7.js";
import { i as signalApprovalAuth, r as getSignalApprovalApprovers, t as markdownToSignalText } from "./format-CwzvmVCR.js";
import { n as signalRpcRequest } from "./client-adapter-C5X63Mud.js";
import { t as resolveSignalRpcContext } from "./rpc-context-Bs916k8f.js";
//#region extensions/signal/src/runtime.ts
const { setRuntime: setSignalRuntime, getRuntime: getSignalRuntime, tryGetRuntime: getOptionalSignalRuntime, clearRuntime: clearSignalRuntime } = createPluginRuntimeStore({
	pluginId: "signal",
	errorMessage: "Signal runtime not initialized"
});
//#endregion
//#region extensions/signal/src/approval-reactions.ts
const PERSISTENT_NAMESPACE = "signal.approval-reactions";
const PERSISTENT_MAX_ENTRIES = 1e3;
const DEFAULT_REACTION_TARGET_TTL_MS = 1440 * 60 * 1e3;
let resolverRuntimePromise;
const signalApprovalReactionTargets = createApprovalReactionTargetStore({
	namespace: PERSISTENT_NAMESPACE,
	maxEntries: PERSISTENT_MAX_ENTRIES,
	defaultTtlMs: DEFAULT_REACTION_TARGET_TTL_MS,
	openStore: (storeParams) => getOptionalSignalRuntime()?.state.openKeyedStore(storeParams),
	logPersistentError: reportPersistentApprovalReactionError,
	readPersistedTarget
});
function loadApprovalResolver() {
	resolverRuntimePromise ??= import("./approval-resolver-Cu-7le3e.js");
	return resolverRuntimePromise;
}
function resolveApprovalKindFromId(approvalId) {
	return approvalId.startsWith("plugin:") ? "plugin" : "exec";
}
function resolveApprovalForwardingConfig(params) {
	return params.approvalKind === "plugin" ? params.cfg.approvals?.plugin : params.cfg.approvals?.exec;
}
function normalizeApprovalForwardingMode(mode) {
	return mode ?? "session";
}
function approvalModeIncludesSession(mode) {
	return mode === "session" || mode === "both";
}
function approvalModeIncludesTargets(mode) {
	return mode === "targets" || mode === "both";
}
function matchesSignalApprovalReactionFilters(params) {
	return matchesApprovalRequestFilters({
		request: {
			agentId: params.route.agentId,
			sessionKey: params.route.sessionKey
		},
		agentFilter: params.config.agentFilter,
		sessionFilter: params.config.sessionFilter,
		fallbackAgentIdFromSessionKey: true
	});
}
function targetAccountMatches(params) {
	const configuredAccountId = normalizeOptionalString(params.configuredAccountId);
	if (!configuredAccountId) return true;
	const routeAccountId = normalizeOptionalString(params.routeAccountId);
	return Boolean(routeAccountId && normalizeAccountId(routeAccountId) === normalizeAccountId(configuredAccountId));
}
function hasMatchingSignalApprovalReactionTarget(params) {
	return (params.config.targets ?? []).some((target) => {
		if (normalizeLowercaseStringOrEmpty(target.channel) !== "signal") return false;
		const configuredTo = normalizeSignalMessagingTarget(target.to);
		if (!configuredTo || configuredTo !== params.route.to) return false;
		return targetAccountMatches({
			routeAccountId: params.route.accountId,
			configuredAccountId: target.accountId
		});
	});
}
function isSignalApprovalReactionRouteStillEnabled(params) {
	const config = resolveApprovalForwardingConfig({
		cfg: params.cfg,
		approvalKind: params.target.approvalKind
	});
	if (!config?.enabled) return false;
	const mode = normalizeApprovalForwardingMode(config.mode);
	if (params.target.route.deliveryMode === "target") return approvalModeIncludesTargets(mode) && matchesSignalApprovalReactionFilters({
		config,
		route: params.target.route
	}) && hasMatchingSignalApprovalReactionTarget({
		config,
		route: params.target.route
	});
	if (!approvalModeIncludesSession(mode)) return false;
	return matchesSignalApprovalReactionFilters({
		config,
		route: params.target.route
	});
}
function resolveSignalApprovalConversationKey(to) {
	return normalizeSignalMessagingTarget(to) ?? null;
}
function normalizeSignalApprovalTargetAuthorKey(value) {
	const normalized = normalizeOptionalString(value);
	if (!normalized) return null;
	const withoutSignalPrefix = normalized.replace(/^signal:/i, "").trim();
	if (normalizeLowercaseStringOrEmpty(withoutSignalPrefix).startsWith("uuid:")) {
		const uuid = withoutSignalPrefix.slice(5).trim().toLowerCase();
		return uuid ? `uuid:${uuid}` : null;
	}
	if (looksLikeUuid(withoutSignalPrefix)) return `uuid:${withoutSignalPrefix.toLowerCase()}`;
	return normalizeE164(withoutSignalPrefix);
}
function resolveSignalApprovalTargetAuthorKeys(params) {
	const targetAuthorUuid = normalizeOptionalString(params.targetAuthorUuid);
	const keys = [targetAuthorUuid ? `uuid:${targetAuthorUuid.replace(/^uuid:/i, "").trim().toLowerCase()}` : null, params.targetAuthor ? normalizeSignalApprovalTargetAuthorKey(params.targetAuthor) : null].filter((key) => Boolean(key));
	return Array.from(new Set(keys));
}
function buildReactionTargetKey(params) {
	const accountId = params.accountId.trim();
	const conversationKey = params.conversationKey.trim();
	const messageId = params.messageId.trim();
	if (!accountId || !conversationKey || !messageId || messageId === "unknown") return null;
	return `${accountId}:${conversationKey}:${messageId}`;
}
function reportPersistentApprovalReactionError(error) {
	try {
		getOptionalSignalRuntime()?.logging.getChildLogger({
			plugin: "signal",
			feature: "approval-reaction-state"
		}).warn("Signal persistent approval reaction state failed", { error: String(error) });
	} catch {}
}
function readPersistedTarget(target) {
	const value = target;
	if (!value || typeof value.approvalId !== "string" || value.approvalKind !== "exec" && value.approvalKind !== "plugin" || !value.route || value.route.deliveryMode !== "session" && value.route.deliveryMode !== "target" || !Array.isArray(value.targetAuthorKeys) || !Array.isArray(value.allowedDecisions)) return null;
	const targetRouteTo = value.route.deliveryMode === "target" && typeof value.route.to === "string" ? normalizeSignalMessagingTarget(value.route.to) : null;
	if (value.route.deliveryMode === "target" && !targetRouteTo) return null;
	const route = value.route.deliveryMode === "target" ? {
		deliveryMode: "target",
		to: targetRouteTo,
		...typeof value.route.accountId === "string" ? { accountId: value.route.accountId } : {},
		...typeof value.route.agentId === "string" ? { agentId: value.route.agentId } : {},
		...typeof value.route.sessionKey === "string" ? { sessionKey: value.route.sessionKey } : {}
	} : {
		deliveryMode: "session",
		...typeof value.route.agentId === "string" ? { agentId: value.route.agentId } : {},
		...typeof value.route.sessionKey === "string" ? { sessionKey: value.route.sessionKey } : {}
	};
	return {
		approvalId: value.approvalId,
		approvalKind: value.approvalKind,
		allowedDecisions: value.allowedDecisions,
		targetAuthorKeys: value.targetAuthorKeys,
		route
	};
}
function listSignalApprovalReactionBindings(allowedDecisions) {
	return listApprovalReactionBindings({ allowedDecisions });
}
function buildSignalApprovalReactionHint(allowedDecisions) {
	return buildApprovalReactionHint({ allowedDecisions });
}
function insertSignalApprovalReactionHintNearHeader(params) {
	const lines = params.text.split(/\r?\n/);
	const idLineIndex = lines.findIndex((line) => /^ID:\s*\S+/.test(line.trim()));
	if (idLineIndex >= 0) {
		const before = lines.slice(0, idLineIndex + 1).join("\n");
		const after = lines.slice(idLineIndex + 1).join("\n").replace(/^\n+/, "");
		return after ? `${before}\n\n${params.hint}\n\n${after}` : `${before}\n\n${params.hint}`;
	}
	return `${params.hint}\n\n${params.text}`;
}
function addSignalApprovalReactionHintToText(params) {
	if (/(^|\n)React with:\s*(\n|$)/i.test(params.text)) return params.text;
	const hint = buildSignalApprovalReactionHint(params.allowedDecisions);
	return hint ? insertSignalApprovalReactionHintNearHeader({
		text: params.text,
		hint
	}) : params.text;
}
function normalizeApprovalDecision(value) {
	const normalized = value.trim().toLowerCase();
	if (normalized === "always") return "allow-always";
	if (normalized === "allow-once" || normalized === "allow-always" || normalized === "deny") return normalized;
	return null;
}
function extractSignalApprovalPromptBinding(text) {
	const allowedDecisions = [];
	let approvalId = "";
	for (const line of text.split(/\r?\n/)) {
		const match = line.match(/\/approve(?:@[^\s]+)?\s+([A-Za-z0-9][A-Za-z0-9._:-]*)\s+(.+)$/i);
		if (!match) continue;
		if (approvalId && match[1] !== approvalId) continue;
		approvalId ||= match[1];
		for (const decisionText of match[2].split(/[\s|,]+/)) {
			const decision = normalizeApprovalDecision(decisionText);
			if (decision && !allowedDecisions.includes(decision)) allowedDecisions.push(decision);
		}
	}
	return approvalId && allowedDecisions.length > 0 ? {
		approvalId,
		allowedDecisions
	} : null;
}
function buildTargetRoute(params) {
	const to = normalizeSignalMessagingTarget(params.to);
	if (!to) return null;
	const route = {
		deliveryMode: "target",
		to,
		...normalizeOptionalString(params.accountId) ? { accountId: normalizeOptionalString(params.accountId) } : {},
		...normalizeOptionalString(params.agentId) ? { agentId: normalizeOptionalString(params.agentId) } : {},
		...normalizeOptionalString(params.sessionKey) ? { sessionKey: normalizeOptionalString(params.sessionKey) } : {}
	};
	return isSignalApprovalReactionRouteStillEnabled({
		cfg: params.cfg,
		target: {
			approvalKind: resolveApprovalKindFromId(params.approvalId),
			route
		}
	}) ? route : null;
}
function shouldAppendSignalApprovalReactionHintForOutboundMessage(params) {
	const binding = extractSignalApprovalPromptBinding(params.text);
	if (!binding) return false;
	if (resolveSignalApprovalTargetAuthorKeys(params).length === 0) return false;
	if (!hasSignalApprovalReactionApprovers({
		cfg: params.cfg,
		accountId: params.accountId
	})) return false;
	return Boolean(buildTargetRoute({
		cfg: params.cfg,
		accountId: params.accountId,
		to: params.to,
		approvalId: binding.approvalId,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	}));
}
function appendSignalApprovalReactionHintForOutboundMessage(params) {
	const binding = extractSignalApprovalPromptBinding(params.text);
	if (!binding || !shouldAppendSignalApprovalReactionHintForOutboundMessage({
		...params,
		text: params.text
	})) return params.text;
	return addSignalApprovalReactionHintToText({
		text: params.text,
		allowedDecisions: binding.allowedDecisions
	});
}
function hasSignalApprovalReactionApprovers(params) {
	return getSignalApprovalApprovers(params).length > 0;
}
function registerSignalApprovalReactionTarget(params) {
	const key = buildReactionTargetKey(params);
	const approvalId = params.approvalId.trim();
	const targetAuthorKeys = Array.from(new Set(params.targetAuthorKeys.map((entry) => normalizeSignalApprovalTargetAuthorKey(entry)).filter((entry) => Boolean(entry))));
	const allowedDecisions = listSignalApprovalReactionBindings(params.allowedDecisions).map((binding) => binding.decision);
	if (!params.routeAllowed || !key || !approvalId || allowedDecisions.length === 0) return null;
	if (targetAuthorKeys.length === 0) return null;
	const route = params.route.deliveryMode === "target" ? {
		deliveryMode: "target",
		to: params.route.to,
		...normalizeOptionalString(params.route.accountId) ? { accountId: normalizeOptionalString(params.route.accountId) } : {},
		...normalizeOptionalString(params.route.agentId) ? { agentId: normalizeOptionalString(params.route.agentId) } : {},
		...normalizeOptionalString(params.route.sessionKey) ? { sessionKey: normalizeOptionalString(params.route.sessionKey) } : {}
	} : {
		deliveryMode: "session",
		...normalizeOptionalString(params.route.agentId) ? { agentId: normalizeOptionalString(params.route.agentId) } : {},
		...normalizeOptionalString(params.route.sessionKey) ? { sessionKey: normalizeOptionalString(params.route.sessionKey) } : {}
	};
	const target = {
		approvalId,
		approvalKind: resolveApprovalKindFromId(approvalId),
		allowedDecisions,
		targetAuthorKeys,
		route
	};
	signalApprovalReactionTargets.register(key, target, { ttlMs: params.ttlMs });
	return target;
}
function registerSignalApprovalReactionTargetForOutboundMessage(params) {
	const binding = extractSignalApprovalPromptBinding(params.text);
	if (!binding) return false;
	const conversationKey = resolveSignalApprovalConversationKey(params.to);
	if (!conversationKey) return false;
	const route = buildTargetRoute({
		cfg: params.cfg,
		accountId: params.accountId,
		to: params.to,
		approvalId: binding.approvalId,
		agentId: params.agentId,
		sessionKey: params.sessionKey
	});
	if (!route) return false;
	return Boolean(registerSignalApprovalReactionTarget({
		accountId: params.accountId,
		conversationKey,
		messageId: params.messageId,
		approvalId: binding.approvalId,
		allowedDecisions: binding.allowedDecisions,
		targetAuthorKeys: resolveSignalApprovalTargetAuthorKeys(params),
		route,
		routeAllowed: true,
		ttlMs: params.ttlMs
	}));
}
function unregisterSignalApprovalReactionTarget(params) {
	const key = buildReactionTargetKey(params);
	if (!key) return;
	signalApprovalReactionTargets.delete(key);
}
function resolveTarget(params) {
	const target = params.target;
	if (!target) return null;
	if (params.targetAuthorKeys.length === 0 || !params.targetAuthorKeys.some((key) => target.targetAuthorKeys.includes(key))) return null;
	const resolved = resolveApprovalReactionTarget({
		target,
		reactionKey: params.reactionKey
	});
	if (!resolved?.route) return null;
	return {
		approvalId: resolved.approvalId,
		approvalKind: resolved.approvalKind,
		decision: resolved.decision,
		route: resolved.route
	};
}
async function resolveSignalApprovalReactionTargetWithPersistence(params) {
	const key = buildReactionTargetKey(params);
	if (!key) return null;
	const targetAuthorKeys = resolveSignalApprovalTargetAuthorKeys(params);
	if (targetAuthorKeys.length === 0) return null;
	return resolveTarget({
		target: await signalApprovalReactionTargets.lookup(key),
		reactionKey: params.reactionKey,
		targetAuthorKeys
	});
}
async function maybeResolveSignalApprovalReaction(params) {
	const target = await resolveSignalApprovalReactionTargetWithPersistence({
		accountId: params.accountId,
		conversationKey: params.conversationKey,
		messageId: params.messageId,
		reactionKey: params.reactionKey,
		targetAuthor: params.targetAuthor,
		targetAuthorUuid: params.targetAuthorUuid
	});
	if (!target) return false;
	if (!isSignalApprovalReactionRouteStillEnabled({
		cfg: params.cfg,
		target
	})) {
		params.logVerboseMessage?.(`signal: approval reaction denied id=${target.approvalId}; approval route is no longer enabled`);
		return true;
	}
	const actorId = params.actorId?.trim();
	if (!actorId) {
		params.logVerboseMessage?.(`signal: approval reaction ignored for ${target.approvalId}; missing actor identity`);
		return true;
	}
	if (getSignalApprovalApprovers({
		cfg: params.cfg,
		accountId: params.accountId
	}).length === 0) {
		params.logVerboseMessage?.(`signal: approval reaction denied id=${target.approvalId}; reactions require explicit approvers`);
		return true;
	}
	if (!signalApprovalAuth.authorizeActorAction({
		cfg: params.cfg,
		accountId: params.accountId,
		senderId: actorId,
		action: "approve",
		approvalKind: target.approvalKind
	}).authorized) {
		params.logVerboseMessage?.(`signal: approval reaction denied id=${target.approvalId} sender=${actorId}`);
		return true;
	}
	const { isApprovalNotFoundError, resolveSignalApproval } = await loadApprovalResolver();
	try {
		await resolveSignalApproval({
			cfg: params.cfg,
			approvalId: target.approvalId,
			decision: target.decision,
			senderId: actorId,
			gatewayUrl: params.gatewayUrl
		});
		params.logVerboseMessage?.(`signal: approval reaction resolved id=${target.approvalId} sender=${actorId} decision=${target.decision}`);
		return true;
	} catch (error) {
		if (isApprovalNotFoundError(error)) {
			unregisterSignalApprovalReactionTarget({
				accountId: params.accountId,
				conversationKey: params.conversationKey,
				messageId: params.messageId
			});
			params.logVerboseMessage?.(`signal: approval reaction ignored for expired approval id=${target.approvalId} sender=${actorId}`);
			return true;
		}
		params.logVerboseMessage?.(`signal: approval reaction failed id=${target.approvalId} sender=${actorId}: ${String(error)}`);
		return true;
	}
}
//#endregion
//#region extensions/signal/src/send.ts
async function resolveSignalRpcAccountInfo(opts) {
	if (opts.baseUrl?.trim() && opts.account?.trim()) return;
	if (!opts.cfg) throw new Error("Signal RPC account resolution requires a resolved runtime config. Load and resolve config at the command or gateway boundary, then pass cfg through the runtime path.");
	return resolveSignalAccount({
		cfg: requireRuntimeConfig(opts.cfg, "Signal RPC account resolution"),
		accountId: opts.accountId
	});
}
function parseTarget(raw) {
	let value = raw.trim();
	if (!value) throw new Error("Signal recipient is required");
	if (normalizeLowercaseStringOrEmpty(value).startsWith("signal:")) value = value.slice(7).trim();
	const normalized = normalizeLowercaseStringOrEmpty(value);
	if (normalized.startsWith("group:")) return {
		type: "group",
		groupId: value.slice(6).trim()
	};
	if (normalized.startsWith("username:")) return {
		type: "username",
		username: value.slice(9).trim()
	};
	if (normalized.startsWith("u:")) return {
		type: "username",
		username: value.trim()
	};
	return {
		type: "recipient",
		recipient: value
	};
}
function buildTargetParams(target, allow) {
	if (target.type === "recipient") {
		if (!allow.recipient) return null;
		return { recipient: [target.recipient] };
	}
	if (target.type === "group") {
		if (!allow.group) return null;
		return { groupId: target.groupId };
	}
	if (target.type === "username") {
		if (!allow.username) return null;
		return { username: [target.username] };
	}
	return null;
}
function createSignalSendReceipt(params) {
	const messageId = params.messageId.trim();
	const results = messageId && messageId !== "unknown" ? [{
		channel: "signal",
		messageId,
		meta: { targetType: params.target.type }
	}] : [];
	if (results[0]) {
		if (params.timestamp != null) results[0].timestamp = params.timestamp;
		if (params.target.type === "group") results[0].chatId = params.target.groupId;
		else if (params.target.type === "recipient") results[0].toJid = params.target.recipient;
		else results[0].toJid = params.target.username;
	}
	return createMessageReceiptFromOutboundResults({
		results,
		kind: params.kind
	});
}
async function sendMessageSignal(to, text, opts) {
	const cfg = requireRuntimeConfig(opts.cfg, "Signal send");
	const apiMode = cfg.channels?.signal?.apiMode;
	const accountInfo = resolveSignalAccount({
		cfg,
		accountId: opts.accountId
	});
	const { baseUrl, account } = resolveSignalRpcContext(opts, accountInfo);
	const target = parseTarget(to);
	const outboundText = appendSignalApprovalReactionHintForOutboundMessage({
		cfg,
		accountId: accountInfo.accountId,
		to,
		text: text ?? "",
		targetAuthor: account
	});
	let message = outboundText;
	let messageFromPlaceholder = false;
	let textStyles = [];
	const textMode = opts.textMode ?? "markdown";
	const maxBytes = (() => {
		if (typeof opts.maxBytes === "number") return opts.maxBytes;
		if (typeof accountInfo.config.mediaMaxMb === "number") return accountInfo.config.mediaMaxMb * 1024 * 1024;
		if (typeof cfg.agents?.defaults?.mediaMaxMb === "number") return cfg.agents.defaults.mediaMaxMb * 1024 * 1024;
		return 8 * 1024 * 1024;
	})();
	let attachments;
	if (opts.mediaUrl?.trim()) {
		const resolved = await resolveOutboundAttachmentFromUrl(opts.mediaUrl.trim(), maxBytes, {
			mediaAccess: opts.mediaAccess,
			localRoots: opts.mediaLocalRoots,
			readFile: opts.mediaReadFile
		});
		attachments = [resolved.path];
		const kind = kindFromMime(resolved.contentType ?? void 0);
		if (!message && kind) {
			message = kind === "image" ? "<media:image>" : `<media:${kind}>`;
			messageFromPlaceholder = true;
		}
	}
	if (message.trim() && !messageFromPlaceholder) if (textMode === "plain") textStyles = opts.textStyles ?? [];
	else {
		const tableMode = resolveMarkdownTableMode({
			cfg,
			channel: "signal",
			accountId: accountInfo.accountId
		});
		const formatted = markdownToSignalText(message, { tableMode });
		message = formatted.text;
		textStyles = formatted.styles;
	}
	if (!message.trim() && (!attachments || attachments.length === 0)) throw new Error("Signal send requires text or media");
	const params = { message };
	if (textStyles.length > 0) params["text-style"] = textStyles.map((style) => `${style.start}:${style.length}:${style.style}`);
	if (account) params.account = account;
	if (attachments && attachments.length > 0) params.attachments = attachments;
	const targetParams = buildTargetParams(target, {
		recipient: true,
		group: true,
		username: true
	});
	if (!targetParams) throw new Error("Signal recipient is required");
	Object.assign(params, targetParams);
	const timestamp = (await signalRpcRequest("send", params, {
		baseUrl,
		timeoutMs: opts.timeoutMs,
		apiMode
	}))?.timestamp;
	const messageId = timestamp ? String(timestamp) : "unknown";
	registerSignalApprovalReactionTargetForOutboundMessage({
		cfg,
		accountId: accountInfo.accountId,
		to,
		messageId,
		text: outboundText,
		targetAuthor: account
	});
	return {
		messageId,
		timestamp,
		receipt: createSignalSendReceipt({
			messageId,
			target,
			kind: attachments && attachments.length > 0 ? "media" : "text",
			...timestamp != null ? { timestamp } : {}
		})
	};
}
async function sendTypingSignal(to, opts) {
	const accountInfo = await resolveSignalRpcAccountInfo(opts);
	const cfg = requireRuntimeConfig(opts.cfg, "Signal typing");
	const { baseUrl, account } = resolveSignalRpcContext(opts, accountInfo);
	const targetParams = buildTargetParams(parseTarget(to), {
		recipient: true,
		group: true
	});
	if (!targetParams) return false;
	const params = { ...targetParams };
	if (account) params.account = account;
	if (opts.stop) params.stop = true;
	await signalRpcRequest("sendTyping", params, {
		baseUrl,
		timeoutMs: opts.timeoutMs,
		apiMode: cfg.channels?.signal?.apiMode
	});
	return true;
}
async function sendReadReceiptSignal(to, targetTimestamp, opts) {
	if (!Number.isFinite(targetTimestamp) || targetTimestamp <= 0) return false;
	const accountInfo = await resolveSignalRpcAccountInfo(opts);
	const cfg = requireRuntimeConfig(opts.cfg, "Signal read receipt");
	const { baseUrl, account } = resolveSignalRpcContext(opts, accountInfo);
	const targetParams = buildTargetParams(parseTarget(to), { recipient: true });
	if (!targetParams) return false;
	const params = {
		...targetParams,
		targetTimestamp,
		type: opts.type ?? "read"
	};
	if (account) params.account = account;
	await signalRpcRequest("sendReceipt", params, {
		baseUrl,
		timeoutMs: opts.timeoutMs,
		apiMode: cfg.channels?.signal?.apiMode
	});
	return true;
}
//#endregion
export { maybeResolveSignalApprovalReaction as a, resolveSignalApprovalTargetAuthorKeys as c, hasSignalApprovalReactionApprovers as i, unregisterSignalApprovalReactionTarget as l, sendReadReceiptSignal as n, registerSignalApprovalReactionTarget as o, sendTypingSignal as r, resolveSignalApprovalConversationKey as s, sendMessageSignal as t, setSignalRuntime as u };
