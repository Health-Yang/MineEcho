import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { l as normalizeE164 } from "./utils-B5r0V84N.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { t as createPluginRuntimeStore } from "./runtime-store-Cezm5nT2.js";
import { t as resolveApprovalApprovers } from "./approval-approvers-DngDfOqq.js";
import { t as createResolvedApproverActionAuthAdapter } from "./approval-auth-helpers-C820KMAF.js";
import { c as listApprovalReactionBindings, d as resolveApprovalReactionTarget, r as buildApprovalReactionHint, s as createApprovalReactionTargetStore } from "./approval-reaction-runtime-Ca4ba5X9.js";
import "./account-resolution-CBEjwu-y.js";
import { a as resolveIMessageAccount } from "./accounts-BET9ibA4.js";
import { o as normalizeIMessageHandle$1 } from "./targets-BQLF_yw-.js";
//#region extensions/imessage/src/approval-auth.ts
function normalizeIMessageApproverId(value) {
	const raw = String(value).trim();
	if (!raw) return;
	const normalized = normalizeIMessageHandle$1(raw);
	if (!normalized || normalized.startsWith("chat_id:") || normalized.startsWith("chat_guid:") || normalized.startsWith("chat_identifier:")) return;
	return normalized;
}
function normalizeIMessageApproverEntry(value) {
	return String(value).trim() === "*" ? "*" : normalizeIMessageApproverId(value);
}
function getIMessageApprovalApprovers(params) {
	return resolveApprovalApprovers({
		allowFrom: resolveIMessageAccount({
			cfg: params.cfg,
			accountId: params.accountId
		}).config.allowFrom,
		normalizeApprover: normalizeIMessageApproverEntry
	});
}
const imessageResolvedApproverAuth = createResolvedApproverActionAuthAdapter({
	channelLabel: "iMessage",
	resolveApprovers: ({ cfg, accountId }) => getIMessageApprovalApprovers({
		cfg,
		accountId
	}),
	normalizeSenderId: (value) => normalizeIMessageApproverId(value)
});
const imessageApprovalAuth = { authorizeActorAction({ cfg, accountId, senderId, approvalKind }) {
	if (getIMessageApprovalApprovers({
		cfg,
		accountId
	}).includes("*")) return { authorized: true };
	return imessageResolvedApproverAuth.authorizeActorAction({
		cfg,
		accountId,
		senderId,
		action: "approve",
		approvalKind
	});
} };
//#endregion
//#region extensions/imessage/src/monitor/reaction-context.ts
const TAPBACK_TEXT_PATTERNS = [
	{
		prefix: "loved",
		action: "added",
		emoji: "❤️"
	},
	{
		prefix: "liked",
		action: "added",
		emoji: "👍"
	},
	{
		prefix: "disliked",
		action: "added",
		emoji: "👎"
	},
	{
		prefix: "laughed at",
		action: "added",
		emoji: "😂"
	},
	{
		prefix: "emphasized",
		action: "added",
		emoji: "‼️"
	},
	{
		prefix: "questioned",
		action: "added",
		emoji: "❓"
	},
	{
		prefix: "removed a heart from",
		action: "removed",
		emoji: "❤️"
	},
	{
		prefix: "removed a like from",
		action: "removed",
		emoji: "👍"
	},
	{
		prefix: "removed a dislike from",
		action: "removed",
		emoji: "👎"
	},
	{
		prefix: "removed a laugh from",
		action: "removed",
		emoji: "😂"
	},
	{
		prefix: "removed an emphasis from",
		action: "removed",
		emoji: "‼️"
	},
	{
		prefix: "removed a question from",
		action: "removed",
		emoji: "❓"
	}
];
function normalizeReactionValue(value) {
	return typeof value === "string" ? value.trim().replace(/^p:\d+\//iu, "") || void 0 : void 0;
}
function resolveReactionTargetGuidCandidates(...values) {
	const candidates = [];
	for (const value of values) {
		if (typeof value !== "string") continue;
		const raw = value.trim();
		if (!raw) continue;
		const normalized = raw.replace(/^p:\d+\//iu, "");
		for (const candidate of [normalized, raw]) if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
	}
	return candidates;
}
function resolveTapbackTextContext(bodyText) {
	const lower = bodyText.toLowerCase();
	for (const pattern of TAPBACK_TEXT_PATTERNS) {
		if (!lower.startsWith(pattern.prefix)) continue;
		const afterPrefix = bodyText.slice(pattern.prefix.length).trim();
		if (!/^["“]/u.test(afterPrefix)) continue;
		return {
			action: pattern.action,
			emoji: pattern.emoji,
			targetText: afterPrefix.replace(/^["“]/u, "").replace(/["”]$/u, "").trim()
		};
	}
	return null;
}
function resolveIMessageReactionContext(message, bodyText) {
	if (message.is_reaction === true || message.is_tapback === true || typeof message.associated_message_type === "number" && Number.isFinite(message.associated_message_type) && message.associated_message_type >= 2e3 && message.associated_message_type < 4e3) {
		const targetGuids = resolveReactionTargetGuidCandidates(message.reacted_to_guid, message.associated_message_guid);
		return {
			action: message.is_reaction_add === false ? "removed" : "added",
			emoji: normalizeReactionValue(message.reaction_emoji) ?? normalizeReactionValue(message.reaction_type) ?? "reaction",
			targetGuid: targetGuids[0],
			targetGuids
		};
	}
	return resolveTapbackTextContext(bodyText);
}
//#endregion
//#region extensions/imessage/src/runtime.ts
const { setRuntime: setIMessageRuntime, tryGetRuntime: getOptionalIMessageRuntime } = createPluginRuntimeStore({
	pluginId: "imessage",
	errorMessage: "iMessage runtime not initialized"
});
//#endregion
//#region extensions/imessage/src/approval-reactions.ts
const PERSISTENT_NAMESPACE = "imessage.approval-reactions";
const PERSISTENT_MAX_ENTRIES = 1e3;
const DEFAULT_REACTION_TARGET_TTL_MS = 1440 * 60 * 1e3;
let resolverRuntimePromise;
const pendingReactionPollTargets = /* @__PURE__ */ new Map();
function loadApprovalResolver() {
	resolverRuntimePromise ??= import("./approval-resolver-C-Zn7C1T.js");
	return resolverRuntimePromise;
}
function chatIdToKeyValue(chatId) {
	if (chatId == null || chatId === "") return null;
	if (typeof chatId === "number") return Number.isFinite(chatId) && chatId > 0 ? String(chatId) : null;
	return chatId.trim() || null;
}
function enumerateConversationKeyForms(conversation) {
	const forms = [];
	const chatGuid = conversation.chatGuid?.trim();
	if (chatGuid) forms.push(`chat_guid:${chatGuid}`);
	const chatIdentifier = conversation.chatIdentifier?.trim();
	if (chatIdentifier) forms.push(`chat_identifier:${chatIdentifier}`);
	const chatIdValue = chatIdToKeyValue(conversation.chatId);
	if (chatIdValue) forms.push(`chat_id:${chatIdValue}`);
	const handle = conversation.handle?.trim();
	if (handle) forms.push(`handle:${handle}`);
	return forms;
}
function normalizeConversationKey(conversation) {
	return enumerateConversationKeyForms(conversation)[0];
}
function enumerateReactionTargetKeys(params) {
	const accountId = params.accountId.trim();
	const messageId = params.messageId.trim();
	if (!accountId || !messageId) return [];
	return enumerateConversationKeyForms(params.conversation).map((form) => `${accountId}:${form}:${messageId}`);
}
function prunePendingReactionPollTargets(nowMs = Date.now()) {
	for (const [key, target] of pendingReactionPollTargets.entries()) if (target.expiresAtMs <= nowMs) pendingReactionPollTargets.delete(key);
}
function normalizePollTargetMessageId(messageId) {
	return messageId.trim().replace(/^p:\d+\//iu, "");
}
function mergePollTargetConversation(left, right) {
	return {
		chatGuid: left.chatGuid ?? right.chatGuid,
		chatIdentifier: left.chatIdentifier ?? right.chatIdentifier,
		chatId: left.chatId ?? right.chatId,
		handle: left.handle ?? right.handle
	};
}
function listPendingIMessageApprovalReactionPollTargets(params) {
	const accountId = params.accountId.trim();
	if (!accountId) return [];
	prunePendingReactionPollTargets();
	const targetByApprovalAndMessage = /* @__PURE__ */ new Map();
	for (const target of pendingReactionPollTargets.values()) {
		if (target.accountId !== accountId) continue;
		const key = `${target.approvalId}:${normalizePollTargetMessageId(target.messageId)}`;
		const existing = targetByApprovalAndMessage.get(key);
		if (!existing) {
			targetByApprovalAndMessage.set(key, target);
			continue;
		}
		targetByApprovalAndMessage.set(key, {
			...existing,
			conversation: mergePollTargetConversation(existing.conversation, target.conversation),
			expiresAtMs: Math.max(existing.expiresAtMs, target.expiresAtMs)
		});
	}
	return [...targetByApprovalAndMessage.values()];
}
function reportPersistentApprovalReactionError(error) {
	try {
		getOptionalIMessageRuntime()?.logging.getChildLogger({
			plugin: "imessage",
			feature: "approval-reaction-state"
		}).warn("iMessage persistent approval reaction state failed", { error: String(error) });
	} catch {}
}
function readPersistedTarget(value) {
	const target = value;
	if (!target || typeof target.approvalId !== "string" || !Array.isArray(target.allowedDecisions)) return null;
	const allowedDecisions = target.allowedDecisions.map((value) => typeof value === "string" ? normalizeApprovalDecision(value) : null).filter((value) => Boolean(value));
	if (allowedDecisions.length === 0) return null;
	return {
		approvalId: target.approvalId,
		allowedDecisions,
		...target.approvalKind === "exec" || target.approvalKind === "plugin" ? { approvalKind: target.approvalKind } : {}
	};
}
const imessageApprovalReactionTargets = createApprovalReactionTargetStore({
	namespace: PERSISTENT_NAMESPACE,
	maxEntries: PERSISTENT_MAX_ENTRIES,
	defaultTtlMs: DEFAULT_REACTION_TARGET_TTL_MS,
	openStore: (params) => getOptionalIMessageRuntime()?.state.openKeyedStore(params),
	logPersistentError: reportPersistentApprovalReactionError,
	readPersistedTarget
});
function listIMessageApprovalReactionBindings(allowedDecisions) {
	return listApprovalReactionBindings({ allowedDecisions });
}
function buildIMessageApprovalReactionHint(allowedDecisions) {
	return buildApprovalReactionHint({ allowedDecisions });
}
function insertIMessageApprovalReactionHintNearHeader(params) {
	const lines = params.text.split(/\r?\n/);
	const idLineIndex = lines.findIndex((line) => /^ID:\s*\S+/.test(line.trim()));
	if (idLineIndex >= 0) {
		const before = lines.slice(0, idLineIndex + 1).join("\n");
		const after = lines.slice(idLineIndex + 1).join("\n").replace(/^\n+/, "");
		return after ? `${before}\n\n${params.hint}\n\n${after}` : `${before}\n\n${params.hint}`;
	}
	return `${params.hint}\n\n${params.text}`;
}
function addIMessageApprovalReactionHintToText(params) {
	if (/(^|\n)React with:\s*(\n|$)/i.test(params.text)) return params.text;
	const hint = buildIMessageApprovalReactionHint(params.allowedDecisions);
	return hint ? insertIMessageApprovalReactionHintNearHeader({
		text: params.text,
		hint
	}) : params.text;
}
function appendIMessageApprovalReactionHintForOutboundMessage(text) {
	if (/(^|\n)React with:\s*(\n|$)/i.test(text)) return text;
	const binding = extractIMessageApprovalPromptBinding(text);
	if (!binding) return text;
	return addIMessageApprovalReactionHintToText({
		text,
		allowedDecisions: binding.allowedDecisions
	});
}
function normalizeApprovalDecision(value) {
	const normalized = value.trim().toLowerCase();
	if (normalized === "always") return "allow-always";
	if (normalized === "allow-once" || normalized === "allow-always" || normalized === "deny") return normalized;
	return null;
}
const APPROVAL_ID_LINE_RE = /^\s*ID:\s*([A-Za-z0-9][A-Za-z0-9._:-]*)\s*$/i;
const APPROVE_COMMAND_LINE_RE = /\/approve(?:@[^\s]+)?\s+([A-Za-z0-9][A-Za-z0-9._:-]*)\s+(.+)$/i;
function extractIMessageApprovalPromptBinding(text) {
	const lines = text.split(/\r?\n/);
	const idHeaderMatch = lines.map((line) => line.match(APPROVAL_ID_LINE_RE)).find((match) => Boolean(match));
	if (!idHeaderMatch) return null;
	const approvalId = idHeaderMatch[1];
	const allowedDecisions = [];
	for (const line of lines) {
		const match = line.match(APPROVE_COMMAND_LINE_RE);
		if (!match || match[1] !== approvalId) continue;
		const decisions = match[2].split(/[\s|,]+/);
		for (const decisionText of decisions) {
			const decision = normalizeApprovalDecision(decisionText);
			if (decision && !allowedDecisions.includes(decision)) allowedDecisions.push(decision);
		}
	}
	return allowedDecisions.length > 0 ? {
		approvalId,
		allowedDecisions
	} : null;
}
function registerIMessageApprovalReactionTarget(params) {
	const approvalId = params.approvalId.trim();
	const allowedDecisions = listIMessageApprovalReactionBindings(params.allowedDecisions).map((binding) => binding.decision);
	if (!approvalId || allowedDecisions.length === 0) return null;
	const target = {
		approvalId,
		allowedDecisions
	};
	const ttlMs = params.ttlMs == null ? DEFAULT_REACTION_TARGET_TTL_MS : Math.max(1, params.ttlMs);
	const keys = enumerateReactionTargetKeys({
		accountId: params.accountId,
		conversation: params.conversation,
		messageId: params.messageId
	});
	if (keys.length === 0) return null;
	for (const key of keys) {
		imessageApprovalReactionTargets.register(key, target, { ttlMs });
		pendingReactionPollTargets.set(key, {
			accountId: params.accountId,
			conversation: params.conversation,
			messageId: params.messageId,
			approvalId,
			allowedDecisions,
			expiresAtMs: Date.now() + ttlMs
		});
	}
	prunePendingReactionPollTargets();
	return target;
}
function registerIMessageApprovalReactionTargetForOutboundMessage(params) {
	const binding = extractIMessageApprovalPromptBinding(params.text);
	if (!binding) return false;
	return Boolean(registerIMessageApprovalReactionTarget({
		accountId: params.accountId,
		conversation: params.conversation,
		messageId: params.messageId,
		approvalId: binding.approvalId,
		allowedDecisions: binding.allowedDecisions,
		ttlMs: params.ttlMs
	}));
}
function unregisterIMessageApprovalReactionTarget(params) {
	const keys = enumerateReactionTargetKeys(params);
	for (const key of keys) {
		imessageApprovalReactionTargets.delete(key);
		pendingReactionPollTargets.delete(key);
	}
}
function resolveTarget(params) {
	const target = resolveApprovalReactionTarget(params);
	return target ? {
		approvalId: target.approvalId,
		decision: target.decision
	} : null;
}
async function resolveIMessageApprovalReactionTargetWithPersistence(params) {
	const keys = enumerateReactionTargetKeys(params);
	for (const key of keys) {
		const target = resolveTarget({
			target: await imessageApprovalReactionTargets.lookup(key),
			reactionKey: params.reactionKey
		});
		if (target) return target;
	}
	return null;
}
function readApprovalReactionEvent(message, bodyText) {
	const reaction = resolveIMessageReactionContext(message, bodyText);
	if (!reaction) return null;
	const reactionKey = reaction.emoji.trim();
	const candidates = (reaction.targetGuids ?? []).map((value) => value.trim()).filter((value) => value.length > 0);
	const primary = reaction.targetGuid?.trim() || candidates[0] || "";
	const messageIdCandidates = candidates.length > 0 ? candidates : primary ? [primary] : [];
	const actorHandle = normalizeIMessageHandle$1((message.sender ?? "").trim());
	if (!reactionKey || !primary || !actorHandle) return null;
	const conversation = {
		...message.chat_guid?.trim() ? { chatGuid: message.chat_guid.trim() } : {},
		...message.chat_identifier?.trim() ? { chatIdentifier: message.chat_identifier.trim() } : {},
		...chatIdToKeyValue(message.chat_id ?? void 0) ? { chatId: message.chat_id } : {},
		...message.is_group ? {} : { handle: actorHandle }
	};
	if (!normalizeConversationKey(conversation)) return null;
	return {
		conversation,
		messageId: primary,
		messageIdCandidates,
		actorHandle,
		reactionKey,
		action: reaction.action
	};
}
async function handleIMessageApprovalReaction(params) {
	const event = readApprovalReactionEvent(params.message, params.bodyText);
	if (!event) return {
		handled: false,
		stopPolling: false
	};
	if (event.action === "removed") return {
		handled: false,
		stopPolling: false
	};
	let target = null;
	let matchedMessageId = null;
	for (const candidate of event.messageIdCandidates) {
		target = await resolveIMessageApprovalReactionTargetWithPersistence({
			accountId: params.accountId,
			conversation: event.conversation,
			messageId: candidate,
			reactionKey: event.reactionKey
		});
		if (target) {
			matchedMessageId = candidate;
			break;
		}
	}
	if (!target) return {
		handled: false,
		stopPolling: false
	};
	const approvalKind = target.approvalId.startsWith("plugin:") ? "plugin" : "exec";
	if (getIMessageApprovalApprovers({
		cfg: params.cfg,
		accountId: params.accountId
	}).length === 0) {
		params.logVerboseMessage?.(`imessage: approval reaction denied id=${target.approvalId}; reactions require explicit approvers`);
		return {
			handled: true,
			stopPolling: false
		};
	}
	if (!imessageApprovalAuth.authorizeActorAction({
		cfg: params.cfg,
		accountId: params.accountId,
		senderId: event.actorHandle,
		action: "approve",
		approvalKind
	}).authorized) {
		params.logVerboseMessage?.(`imessage: approval reaction denied id=${target.approvalId} sender=${event.actorHandle}`);
		return {
			handled: true,
			stopPolling: false
		};
	}
	const { isApprovalNotFoundError, resolveIMessageApproval } = await loadApprovalResolver();
	try {
		await resolveIMessageApproval({
			cfg: params.cfg,
			approvalId: target.approvalId,
			decision: target.decision,
			senderId: event.actorHandle,
			gatewayUrl: params.gatewayUrl
		});
		for (const candidate of event.messageIdCandidates) unregisterIMessageApprovalReactionTarget({
			accountId: params.accountId,
			conversation: event.conversation,
			messageId: candidate
		});
		params.logVerboseMessage?.(`imessage: approval reaction resolved id=${target.approvalId} sender=${event.actorHandle} decision=${target.decision} via messageId=${matchedMessageId ?? event.messageId}`);
		return {
			handled: true,
			stopPolling: true
		};
	} catch (error) {
		if (isApprovalNotFoundError(error)) {
			for (const candidate of event.messageIdCandidates) unregisterIMessageApprovalReactionTarget({
				accountId: params.accountId,
				conversation: event.conversation,
				messageId: candidate
			});
			params.logVerboseMessage?.(`imessage: approval reaction ignored for expired approval id=${target.approvalId} sender=${event.actorHandle}`);
			return {
				handled: true,
				stopPolling: true
			};
		}
		try {
			getOptionalIMessageRuntime()?.logging.getChildLogger({
				plugin: "imessage",
				feature: "approval-reactions"
			}).warn("approval reaction failed", {
				approvalId: target.approvalId,
				senderId: event.actorHandle,
				error: String(error)
			});
		} catch {}
		params.logVerboseMessage?.(`imessage: approval reaction failed id=${target.approvalId} sender=${event.actorHandle}: ${String(error)}`);
		return {
			handled: true,
			stopPolling: true
		};
	}
}
async function maybeResolveIMessageApprovalReaction(params) {
	return (await handleIMessageApprovalReaction(params)).handled;
}
//#endregion
//#region extensions/imessage/src/normalize.ts
const SERVICE_PREFIXES = [
	"imessage:",
	"sms:",
	"auto:"
];
const CHAT_TARGET_PREFIX_RE = /^(chat_id:|chatid:|chat:|chat_guid:|chatguid:|guid:|chat_identifier:|chatidentifier:|chatident:)/i;
function looksLikeHandleOrPhoneTarget(params) {
	const trimmed = params.raw.trim();
	if (!trimmed) return false;
	if (params.prefixPattern.test(trimmed)) return true;
	if (trimmed.includes("@")) return true;
	return (params.phonePattern ?? /^\+?\d{3,}$/).test(trimmed);
}
function normalizeIMessageHandle(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return "";
	const lowered = normalizeLowercaseStringOrEmpty(trimmed);
	if (lowered.startsWith("imessage:")) return normalizeIMessageHandle(trimmed.slice(9));
	if (lowered.startsWith("sms:")) return normalizeIMessageHandle(trimmed.slice(4));
	if (lowered.startsWith("auto:")) return normalizeIMessageHandle(trimmed.slice(5));
	if (CHAT_TARGET_PREFIX_RE.test(trimmed)) {
		const prefix = trimmed.match(CHAT_TARGET_PREFIX_RE)?.[0];
		if (!prefix) return "";
		const value = trimmed.slice(prefix.length).trim();
		return `${normalizeLowercaseStringOrEmpty(prefix)}${value}`;
	}
	if (trimmed.includes("@")) return normalizeLowercaseStringOrEmpty(trimmed);
	const normalized = normalizeE164(trimmed);
	if (normalized) return normalized;
	return trimmed.replace(/\s+/g, "");
}
function normalizeIMessageMessagingTarget(raw) {
	const trimmed = normalizeOptionalString(raw);
	if (!trimmed) return;
	const lower = normalizeLowercaseStringOrEmpty(trimmed);
	for (const prefix of SERVICE_PREFIXES) if (lower.startsWith(prefix)) {
		const normalizedHandle = normalizeIMessageHandle(trimmed.slice(prefix.length).trim());
		if (!normalizedHandle) return;
		if (CHAT_TARGET_PREFIX_RE.test(normalizedHandle)) return normalizedHandle;
		return `${prefix}${normalizedHandle}`;
	}
	return normalizeIMessageHandle(trimmed) || void 0;
}
function looksLikeIMessageTargetId(raw) {
	const trimmed = normalizeOptionalString(raw);
	if (!trimmed) return false;
	if (CHAT_TARGET_PREFIX_RE.test(trimmed)) return true;
	return looksLikeHandleOrPhoneTarget({
		raw: trimmed,
		prefixPattern: /^(imessage:|sms:|auto:)/i
	});
}
//#endregion
export { extractIMessageApprovalPromptBinding as a, maybeResolveIMessageApprovalReaction as c, unregisterIMessageApprovalReactionTarget as d, setIMessageRuntime as f, imessageApprovalAuth as h, appendIMessageApprovalReactionHintForOutboundMessage as i, registerIMessageApprovalReactionTarget as l, getIMessageApprovalApprovers as m, normalizeIMessageMessagingTarget as n, handleIMessageApprovalReaction as o, resolveIMessageReactionContext as p, addIMessageApprovalReactionHintToText as r, listPendingIMessageApprovalReactionPollTargets as s, looksLikeIMessageTargetId as t, registerIMessageApprovalReactionTargetForOutboundMessage as u };
