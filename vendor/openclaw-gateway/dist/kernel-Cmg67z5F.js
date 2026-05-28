import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { n as createCommandTurnContext, t as commandTurnKindToSource } from "./command-turn-context-Cqhb6nXp.js";
import { t as sanitizeInboundSystemTags } from "./system-tags-Q468PeYF.js";
import { r as resolveOutboundDurableFinalDeliverySupport } from "./deliver-BbjUzZ_K.js";
import { t as buildOutboundSessionContext } from "./session-context-BklLDvOT.js";
import { t as deriveDurableFinalDeliveryRequirements } from "./capabilities-B3ut6ovI.js";
import { t as normalizeDeliverableOutboundChannel } from "./channel-resolution-DAbY66ca.js";
import { n as listMessageReceiptPlatformIds } from "./receipt-KEYzve-j.js";
import { t as sendDurableMessageBatch } from "./send-y6Pn3hrc.js";
import { t as normalizeInboundTextNewlines } from "./inbound-text-NLHyeueP.js";
import { t as finalizeInboundContext } from "./inbound-context-CbkangX1.js";
import { r as shouldIncludeSupplementalContext } from "./context-visibility-C9pX_aod.js";
import { h as recordPendingHistoryEntryWithMedia, u as clearHistoryEntriesIfEnabled } from "./history-hgslOCXm.js";
import { t as createChannelReplyPipeline } from "./reply-pipeline-C3CPjsQr.js";
import { a as resolvePairLoopGuardSettings, r as createPairLoopGuard } from "./pair-loop-guard-runtime-jabAgbOL.js";
import { t as EMPTY_CHANNEL_TURN_DISPATCH_COUNTS } from "./dispatch-result-BM3RYtx4.js";
import "./history-window-DuIwU7h0.js";
//#region src/channels/inbound-event/media.ts
function alignedStrings(values) {
	if (!values.some(Boolean)) return;
	return values.map((value) => value ?? "");
}
function normalizeKind(value) {
	return value ?? void 0;
}
function mediaType(media) {
	return media.contentType ?? media.kind;
}
function toInboundMediaFacts(media, defaults = {}) {
	if (!Array.isArray(media)) return [];
	return media.map((entry, index) => ({
		path: normalizeOptionalString(entry.path),
		url: normalizeOptionalString(entry.url),
		contentType: normalizeOptionalString(entry.contentType),
		kind: normalizeKind(entry.kind) ?? defaults.kind,
		transcribed: entry.transcribed === true || defaults.transcribed?.(entry, index) === true,
		messageId: normalizeOptionalString(entry.messageId) ?? defaults.messageId
	}));
}
function toHistoryMediaEntries(media, defaults = {}) {
	return toInboundMediaFacts(media, defaults).map((entry) => ({
		path: entry.path,
		url: entry.url,
		contentType: entry.contentType,
		kind: entry.kind,
		messageId: entry.messageId
	}));
}
function buildChannelInboundMediaPayload(media) {
	const entries = Array.isArray(media) ? media : [];
	const transcribedIndexes = entries.map((item, index) => item.transcribed ? index : void 0).filter((index) => index !== void 0);
	return {
		MediaPath: entries[0]?.path,
		MediaUrl: entries[0]?.url ?? entries[0]?.path,
		MediaType: entries[0] ? mediaType(entries[0]) : void 0,
		MediaPaths: alignedStrings(entries.map((item) => item.path)),
		MediaUrls: alignedStrings(entries.map((item) => item.url ?? item.path)),
		MediaTypes: alignedStrings(entries.map(mediaType)),
		MediaTranscribedIndexes: transcribedIndexes.length > 0 ? transcribedIndexes : void 0
	};
}
//#endregion
//#region src/channels/inbound-event/context.ts
function keepSupplementalContext(params) {
	if (!params.mode || params.mode === "all") return true;
	if (params.senderAllowed === void 0) return false;
	return shouldIncludeSupplementalContext({
		mode: params.mode,
		kind: params.kind,
		senderAllowed: params.senderAllowed
	});
}
function filterChannelInboundSupplementalContext(params) {
	const supplemental = params.supplemental;
	if (!supplemental) return;
	const quote = keepSupplementalContext({
		mode: params.contextVisibility,
		kind: "quote",
		senderAllowed: supplemental.quote?.senderAllowed
	}) ? supplemental.quote : void 0;
	const forwarded = keepSupplementalContext({
		mode: params.contextVisibility,
		kind: "forwarded",
		senderAllowed: supplemental.forwarded?.senderAllowed
	}) ? supplemental.forwarded : void 0;
	const thread = keepSupplementalContext({
		mode: params.contextVisibility,
		kind: "thread",
		senderAllowed: supplemental.thread?.senderAllowed
	}) ? supplemental.thread : void 0;
	return {
		...supplemental,
		quote,
		forwarded,
		thread
	};
}
function filterChannelInboundQuoteContext(contextVisibility, quote) {
	return filterChannelInboundSupplementalContext({
		contextVisibility,
		supplemental: quote ? { quote } : void 0
	})?.quote;
}
function definedFields(fields) {
	return Object.fromEntries(Object.entries(fields).filter((entry) => entry[1] !== void 0));
}
function isPromiseLike(value) {
	return Boolean(value) && typeof value.then === "function";
}
function stripQuoteRuntimeFields(quote) {
	const { media: _media, isSelf: _isSelf, ...stripped } = quote;
	return stripped;
}
function resolveChannelInboundSupplementalForFinalizer(params) {
	const rawSupplemental = params.supplemental;
	const filtered = filterChannelInboundSupplementalContext({
		supplemental: rawSupplemental,
		contextVisibility: params.contextVisibility
	});
	const media = [...params.media ?? []];
	if (!rawSupplemental?.quote || !filtered?.quote) return {
		rawSupplemental,
		supplemental: filtered,
		media
	};
	const quote = filtered.quote;
	const selfQuote = quote.isSelf === true;
	const suppressSelfQuoteBody = params.suppressSelfQuoteBody ?? true;
	const suppressSelfQuoteMedia = params.suppressSelfQuoteMedia ?? true;
	const finalizeQuote = (quoteMedia) => {
		if (!(selfQuote && suppressSelfQuoteMedia)) media.push(...quoteMedia ?? []);
		const stripped = stripQuoteRuntimeFields(quote);
		const visibleQuote = selfQuote && suppressSelfQuoteBody ? (({ body: _body, ...withoutBody }) => withoutBody)(stripped) : stripped;
		return {
			rawSupplemental,
			supplemental: {
				...filtered,
				quote: visibleQuote
			},
			media
		};
	};
	if (selfQuote && suppressSelfQuoteMedia) return finalizeQuote(void 0);
	if (!params.resolveSupplementalMedia) return finalizeQuote(Array.isArray(quote.media) ? quote.media : void 0);
	if (typeof quote.media !== "function") return finalizeQuote(quote.media);
	const resolved = quote.media();
	return isPromiseLike(resolved) ? resolved.then(finalizeQuote) : finalizeQuote(resolved);
}
/**
* @deprecated Prefer `buildChannelInboundEventContext({ resolveSupplementalMedia: true })`
* for channel inbound payloads.
*/
async function resolveChannelInboundSupplementalContext(params) {
	const resolved = await resolveChannelInboundSupplementalForFinalizer({
		...params,
		resolveSupplementalMedia: true
	});
	return {
		supplemental: resolved.supplemental,
		media: [...resolved.media ?? []],
		quoteHidden: Boolean(resolved.rawSupplemental?.quote && !resolved.supplemental?.quote)
	};
}
function finalizePreparedChannelInboundContext(params) {
	const mediaPayload = params.media ? definedFields(buildChannelInboundMediaPayload([...params.media])) : {};
	const baseContext = {
		...params.originalContext,
		SupplementalContext: params.supplemental,
		...mediaPayload
	};
	const untrustedStructuredContext = resolveUntrustedStructuredContext({
		supplemental: params.supplemental,
		extra: baseContext
	});
	return {
		context: (params.finalize ?? finalizeInboundContext)({
			...baseContext,
			UntrustedStructuredContext: untrustedStructuredContext
		}, params.finalizeOptions),
		supplemental: params.supplemental,
		quoteHidden: Boolean(params.rawSupplemental?.quote && !params.supplemental?.quote),
		forwardedHidden: Boolean(params.rawSupplemental?.forwarded && !params.supplemental?.forwarded),
		threadHidden: Boolean(params.rawSupplemental?.thread && !params.supplemental?.thread)
	};
}
function finalizeChannelInboundContext(params) {
	const contextSupplemental = params.context.SupplementalContext;
	const prepared = resolveChannelInboundSupplementalForFinalizer({
		supplemental: params.supplemental ?? contextSupplemental,
		contextVisibility: params.contextVisibility,
		media: params.media,
		resolveSupplementalMedia: params.resolveSupplementalMedia,
		suppressSelfQuoteBody: params.suppressSelfQuoteBody,
		suppressSelfQuoteMedia: params.suppressSelfQuoteMedia
	});
	const finish = (result) => finalizePreparedChannelInboundContext({
		originalContext: params.context,
		finalize: params.finalize,
		finalizeOptions: params.finalizeOptions,
		...result
	});
	if (params.resolveSupplementalMedia) return Promise.resolve(prepared).then(finish);
	return isPromiseLike(prepared) ? prepared.then(finish) : finish(prepared);
}
function resolveAccessFactsCommandAuthorized(access) {
	const commands = access?.commands;
	return typeof commands?.authorized === "boolean" ? commands.authorized : commands?.authorizers?.some((entry) => entry.allowed);
}
function normalizeUntrustedGroupPrompt(value) {
	if (typeof value !== "string") return;
	const normalized = sanitizeInboundSystemTags(normalizeInboundTextNewlines(value));
	return normalized.trim().length > 0 ? normalized : void 0;
}
function resolveUntrustedStructuredContext(params) {
	const entries = [];
	const extraEntries = params.extra?.UntrustedStructuredContext;
	if (Array.isArray(extraEntries)) entries.push(...extraEntries);
	entries.push(...params.supplemental?.untrustedContext ?? []);
	const groupPrompt = normalizeUntrustedGroupPrompt(params.supplemental?.untrustedGroupSystemPrompt);
	if (groupPrompt) entries.push({
		label: "Group prompt context",
		type: "group_prompt_context",
		payload: { text: groupPrompt }
	});
	return entries.length > 0 ? entries : void 0;
}
function resolveChannelCommandContext(params) {
	if (params.commandTurn) return params.commandTurn;
	const command = params.command;
	if (!command) return;
	const body = command.body ?? params.message.commandBody ?? params.message.rawBody;
	return createCommandTurnContext(commandTurnKindToSource(command.kind), {
		authorized: command.kind === "normal" ? false : command.authorized ?? resolveAccessFactsCommandAuthorized(params.access) === true,
		commandName: command.name,
		body
	});
}
function buildChannelInboundEventContext(params) {
	const body = params.message.body ?? params.message.rawBody;
	const commandTurn = resolveChannelCommandContext({
		command: params.command,
		commandTurn: params.commandTurn,
		message: params.message,
		access: params.access
	});
	const context = {
		Body: body,
		InboundEventKind: params.message.inboundEventKind ?? "user_request",
		BodyForAgent: params.message.bodyForAgent ?? params.message.rawBody,
		InboundHistory: params.message.inboundHistory,
		RawBody: params.message.rawBody,
		CommandBody: params.message.commandBody ?? params.message.rawBody,
		BodyForCommands: params.message.commandBody ?? params.message.rawBody,
		From: params.from,
		To: params.reply.to,
		SessionKey: params.route.dispatchSessionKey ?? params.route.routeSessionKey,
		AccountId: params.route.accountId ?? params.accountId,
		ParentSessionKey: params.route.parentSessionKey,
		ModelParentSessionKey: params.route.modelParentSessionKey,
		MessageSid: params.messageId,
		MessageSidFull: params.messageIdFull,
		ReplyToId: params.reply.replyToId,
		ReplyToIdFull: params.reply.replyToIdFull,
		ChatType: params.conversation.kind,
		ConversationLabel: params.conversation.label,
		GroupSubject: params.conversation.kind !== "direct" ? params.conversation.label : void 0,
		GroupSpace: params.conversation.spaceId,
		SenderName: params.sender.name ?? params.sender.displayLabel,
		SenderId: params.sender.id,
		SenderUsername: params.sender.username,
		SenderTag: params.sender.tag,
		MemberRoleIds: params.sender.roles,
		Timestamp: params.timestamp,
		Provider: params.provider ?? params.channel,
		Surface: params.surface ?? params.provider ?? params.channel,
		WasMentioned: params.access?.mentions?.wasMentioned,
		CommandAuthorized: resolveAccessFactsCommandAuthorized(params.access) === true,
		CommandTurn: commandTurn,
		MessageThreadId: params.reply.messageThreadId ?? params.conversation.threadId,
		NativeChannelId: params.reply.nativeChannelId ?? params.conversation.nativeChannelId,
		OriginatingChannel: params.channel,
		OriginatingTo: params.reply.originatingTo ?? params.reply.to,
		ThreadParentId: params.reply.threadParentId ?? params.conversation.parentId,
		...params.extra
	};
	const finalizeParams = {
		finalize: params.finalize,
		finalizeOptions: params.finalizeOptions,
		supplemental: params.supplemental,
		contextVisibility: params.contextVisibility,
		media: params.media,
		context
	};
	const result = params.resolveSupplementalMedia ? finalizeChannelInboundContext({
		...finalizeParams,
		resolveSupplementalMedia: true,
		suppressSelfQuoteBody: params.suppressSelfQuoteBody,
		suppressSelfQuoteMedia: params.suppressSelfQuoteMedia
	}) : finalizeChannelInboundContext(finalizeParams);
	return isPromiseLike(result) ? result.then((finalized) => finalized.context) : result.context;
}
//#endregion
//#region src/channels/turn/bot-loop-protection.ts
const channelBotPairLoopGuard = createPairLoopGuard({ pruneIntervalMs: 6e4 });
function recordChannelBotPairLoopAndCheckSuppression(params) {
	return channelBotPairLoopGuard.recordAndCheck({
		scopeId: params.scopeId,
		conversationId: params.conversationId,
		senderId: params.senderId,
		receiverId: params.receiverId,
		settings: resolvePairLoopGuardSettings({
			config: params.config,
			defaultsConfig: params.defaultsConfig,
			defaultEnabled: params.defaultEnabled
		}),
		nowMs: params.nowMs
	});
}
//#endregion
//#region src/channels/turn/delivery-result.ts
function createChannelDeliveryResultFromReceipt(params) {
	const messageIds = listMessageReceiptPlatformIds(params.receipt);
	return {
		...messageIds.length > 0 ? { messageIds } : {},
		receipt: params.receipt,
		...params.threadId ? { threadId: params.threadId } : {},
		...params.replyToId ? { replyToId: params.replyToId } : {},
		...params.visibleReplySent === void 0 ? {} : { visibleReplySent: params.visibleReplySent },
		...params.deliveryIntent ? { deliveryIntent: params.deliveryIntent } : {}
	};
}
//#endregion
//#region src/channels/turn/durable-delivery.ts
function resolveDeliveryTarget(params) {
	return normalizeOptionalString(params.to) ?? normalizeOptionalString(params.ctxPayload.OriginatingTo) ?? normalizeOptionalString(params.ctxPayload.To);
}
function resolveDurableInboundReplyToId(params) {
	if (params.replyToId === null || params.payload.replyToId === null) return null;
	return normalizeOptionalString(params.replyToId) ?? normalizeOptionalString(params.payload.replyToId) ?? normalizeOptionalString(params.ctxPayload.ReplyToIdFull) ?? normalizeOptionalString(params.ctxPayload.ReplyToId);
}
function resolveDurableInboundReplyThreadId(params) {
	if ("threadId" in params) return params.threadId;
	return params.ctxPayload.MessageThreadId;
}
function stringifyThreadId(value) {
	return value == null ? void 0 : String(value);
}
function toDeliveryIntent(intent) {
	return {
		id: intent.id,
		kind: "outbound_queue",
		queuePolicy: intent.queuePolicy
	};
}
function isDurableInboundReplyDeliveryHandled(result) {
	return result.status === "handled_visible" || result.status === "handled_no_send";
}
function throwIfDurableInboundReplyDeliveryFailed(result) {
	if (result.status === "failed") throw result.sentBeforeError === true ? markDurableInboundReplyDeliveryErrorVisible(result.error) : result.error;
}
function markDurableInboundReplyDeliveryErrorVisible(error) {
	if (typeof error === "object" && error !== null && Object.isExtensible(error)) {
		Object.assign(error, {
			sentBeforeError: true,
			visibleReplySent: true
		});
		return error;
	}
	const visibleError = new Error("visible durable reply delivery failed", { cause: error });
	Object.assign(visibleError, {
		sentBeforeError: true,
		visibleReplySent: true
	});
	return visibleError;
}
async function deliverInboundReplyWithMessageSendContext(params) {
	if (params.info.kind !== "final") return {
		status: "not_applicable",
		reason: "non_final"
	};
	const channel = normalizeDeliverableOutboundChannel(params.channel);
	const to = resolveDeliveryTarget(params);
	if (!channel) return {
		status: "unsupported",
		reason: "missing_channel"
	};
	if (!to) return {
		status: "unsupported",
		reason: "missing_target"
	};
	const replyToId = resolveDurableInboundReplyToId(params);
	const threadId = resolveDurableInboundReplyThreadId(params);
	const requiredCapabilities = params.requiredCapabilities ?? deriveDurableFinalDeliveryRequirements({
		payload: params.payload,
		replyToId,
		threadId,
		silent: params.silent
	});
	const durability = requiredCapabilities.reconcileUnknownSend === true ? "required" : "best_effort";
	let support;
	try {
		support = await resolveOutboundDurableFinalDeliverySupport({
			cfg: params.cfg,
			channel,
			requirements: requiredCapabilities
		});
	} catch (err) {
		return {
			status: "failed",
			error: err
		};
	}
	if (!support.ok) return {
		status: "unsupported",
		reason: support.reason,
		...support.capability ? { capability: support.capability } : {}
	};
	const session = buildOutboundSessionContext({
		cfg: params.cfg,
		sessionKey: params.ctxPayload.SessionKey,
		policySessionKey: params.ctxPayload.RuntimePolicySessionKey,
		conversationType: params.ctxPayload.ChatType,
		agentId: params.agentId,
		requesterAccountId: params.accountId ?? params.ctxPayload.AccountId,
		requesterSenderId: params.ctxPayload.SenderId ?? params.ctxPayload.From,
		requesterSenderName: params.ctxPayload.SenderName,
		requesterSenderUsername: params.ctxPayload.SenderUsername,
		requesterSenderE164: params.ctxPayload.SenderE164
	});
	const send = await sendDurableMessageBatch({
		cfg: params.cfg,
		channel,
		to,
		accountId: params.accountId,
		payloads: [params.payload],
		threadId,
		replyToId,
		replyToMode: params.replyToMode,
		formatting: params.formatting,
		identity: params.identity,
		deps: params.deps,
		mediaAccess: params.mediaAccess,
		silent: params.silent,
		durability,
		session,
		gatewayClientScopes: params.ctxPayload.GatewayClientScopes
	});
	if (send.status === "failed") return {
		status: "failed",
		error: send.error
	};
	if (send.status === "partial_failed") return {
		status: "failed",
		error: markDurableInboundReplyDeliveryErrorVisible(send.error),
		sentBeforeError: true
	};
	const delivery = createChannelDeliveryResultFromReceipt({
		receipt: send.receipt,
		threadId: stringifyThreadId(threadId),
		...replyToId ? { replyToId } : {},
		visibleReplySent: send.status === "sent",
		...send.deliveryIntent ? { deliveryIntent: toDeliveryIntent(send.deliveryIntent) } : {}
	});
	if (send.status === "suppressed") return {
		status: "handled_no_send",
		reason: "no_visible_result",
		delivery
	};
	return {
		status: "handled_visible",
		delivery
	};
}
//#endregion
//#region src/channels/turn/kernel.ts
const DEFAULT_EVENT_CLASS = {
	kind: "message",
	canStartAgentTurn: true
};
function isAdmission(value) {
	if (!value || typeof value !== "object") return false;
	const kind = value.kind;
	return kind === "dispatch" || kind === "observeOnly" || kind === "handled" || kind === "drop";
}
function normalizePreflight(value) {
	if (!value) return {};
	if (isAdmission(value)) return { admission: value };
	return value;
}
function emit(params) {
	params.log?.({
		channel: params.channel,
		accountId: params.accountId,
		...params.event
	});
}
function createNoopChannelEventDeliveryAdapter() {
	return { deliver: async () => ({ visibleReplySent: false }) };
}
function clearPendingHistoryAfterTurn(params) {
	if (!params?.isGroup || !params.historyKey || !params.historyMap || params.limit === void 0) return;
	clearHistoryEntriesIfEnabled({
		historyMap: params.historyMap,
		historyKey: params.historyKey,
		limit: params.limit
	});
}
function resolveDroppedHistorySender(input, preflight) {
	return preflight.message?.senderLabel ?? preflight.message?.envelopeFrom ?? (typeof input.raw === "object" && input.raw && "sender" in input.raw && typeof input.raw.sender === "string" ? input.raw.sender : void 0) ?? "unknown";
}
function resolveDroppedHistoryBody(input, preflight) {
	return preflight.message?.bodyForAgent ?? preflight.message?.body ?? preflight.message?.rawBody ?? input.textForAgent ?? input.rawText;
}
async function recordDroppedChannelTurnHistory(params) {
	const admission = params.admission ?? params.preflight.admission;
	if (admission?.kind !== "drop") return;
	const history = params.preflight.history;
	if (!history || history.limit <= 0 || !(history.recordOnDrop || admission.recordHistory)) return;
	const body = resolveDroppedHistoryBody(params.input, params.preflight);
	const entry = body.trim().length > 0 ? {
		sender: resolveDroppedHistorySender(params.input, params.preflight),
		body,
		timestamp: params.input.timestamp,
		messageId: params.input.id
	} : null;
	const media = params.preflight.media;
	await recordPendingHistoryEntryWithMedia({
		historyMap: history.historyMap,
		historyKey: history.key,
		limit: history.limit,
		entry,
		mediaLimit: history.mediaLimit,
		messageId: params.input.id,
		shouldRecord: history.shouldRecord,
		media: typeof media === "function" ? async () => toHistoryMediaEntries(await media(), { messageId: params.input.id }) : toHistoryMediaEntries(media, { messageId: params.input.id })
	});
}
const recordDroppedChannelInboundHistory = recordDroppedChannelTurnHistory;
function resolveAssembledReplyPipeline(params) {
	if (!params.replyPipeline) return {
		dispatcherOptions: params.dispatcherOptions,
		replyOptions: params.replyOptions
	};
	const { onModelSelected, ...replyPipeline } = createChannelReplyPipeline({
		cfg: params.cfg,
		agentId: params.agentId,
		channel: params.channel,
		accountId: params.accountId,
		...params.replyPipeline
	});
	return {
		dispatcherOptions: {
			...replyPipeline,
			...params.dispatcherOptions
		},
		replyOptions: {
			onModelSelected,
			...params.replyOptions
		}
	};
}
function resolveObserveOnlyDispatchResult(params) {
	return params.observeOnlyDispatchResult ?? {
		queuedFinal: false,
		counts: EMPTY_CHANNEL_TURN_DISPATCH_COUNTS
	};
}
function isExplicitlyNonVisibleChannelDelivery(result) {
	return typeof result === "object" && result !== null && !Array.isArray(result) && result.visibleReplySent === false;
}
function markChannelDeliveryErrorVisible(error) {
	if (typeof error === "object" && error !== null && !Array.isArray(error)) try {
		Object.assign(error, {
			sentBeforeError: true,
			visibleReplySent: true
		});
		return error;
	} catch {}
	const visibleError = new Error("visible channel reply delivery failed", { cause: error });
	Object.assign(visibleError, {
		sentBeforeError: true,
		visibleReplySent: true
	});
	return visibleError;
}
async function runChannelDeliveryObserver(params) {
	if (!params.onDelivered) return;
	try {
		await params.onDelivered(params.payload, params.info, params.result);
	} catch (error) {
		throw isExplicitlyNonVisibleChannelDelivery(params.result) ? error : markChannelDeliveryErrorVisible(error);
	}
}
function resolveBotLoopProtectionDrop(params) {
	if (!params.botLoopProtection) return;
	if (!recordChannelBotPairLoopAndCheckSuppression(params.botLoopProtection).suppressed) return;
	const admission = {
		kind: "drop",
		reason: "bot-loop-protection"
	};
	emit({
		...params,
		event: {
			stage: "authorize",
			event: "drop",
			messageId: params.messageId,
			sessionKey: params.ctxPayload.SessionKey ?? params.routeSessionKey,
			admission: admission.kind,
			reason: admission.reason
		}
	});
	return {
		admission,
		dispatched: false,
		ctxPayload: params.ctxPayload,
		routeSessionKey: params.routeSessionKey
	};
}
async function dispatchAssembledChannelTurn(params) {
	const replyPipeline = resolveAssembledReplyPipeline(params);
	return await runPreparedChannelTurnCore({
		channel: params.channel,
		accountId: params.accountId,
		routeSessionKey: params.routeSessionKey,
		storePath: params.storePath,
		ctxPayload: params.ctxPayload,
		recordInboundSession: params.recordInboundSession,
		record: params.record,
		history: params.history,
		admission: params.admission,
		botLoopProtection: params.botLoopProtection,
		log: params.log,
		messageId: params.messageId,
		runDispatch: async () => await params.dispatchReplyWithBufferedBlockDispatcher({
			ctx: params.ctxPayload,
			cfg: params.cfg,
			dispatcherOptions: {
				...replyPipeline.dispatcherOptions,
				deliver: async (payload, info) => {
					const preparedPayload = params.delivery.preparePayload ? await params.delivery.preparePayload(payload, info) : payload;
					const durableOptions = typeof params.delivery.durable === "function" ? await params.delivery.durable(preparedPayload, info) : params.delivery.durable;
					if (durableOptions) {
						const durable = await deliverInboundReplyWithMessageSendContext({
							cfg: params.cfg,
							channel: params.channel,
							accountId: params.accountId,
							agentId: params.agentId,
							ctxPayload: params.ctxPayload,
							payload: preparedPayload,
							info,
							...durableOptions
						});
						throwIfDurableInboundReplyDeliveryFailed(durable);
						if (isDurableInboundReplyDeliveryHandled(durable)) {
							await runChannelDeliveryObserver({
								onDelivered: params.delivery.onDelivered,
								payload: preparedPayload,
								info,
								result: durable.delivery
							});
							return durable.delivery;
						}
					}
					const result = await params.delivery.deliver(preparedPayload, info);
					await runChannelDeliveryObserver({
						onDelivered: params.delivery.onDelivered,
						payload: preparedPayload,
						info,
						result
					});
					return result;
				},
				onError: params.delivery.onError
			},
			replyOptions: replyPipeline.replyOptions,
			replyResolver: params.replyResolver
		})
	}, { suppressObserveOnlyDispatch: false });
}
const dispatchChannelInboundReply = dispatchAssembledChannelTurn;
function isPreparedChannelTurn(value) {
	return "runDispatch" in value;
}
async function dispatchResolvedChannelTurn(params) {
	if (isPreparedChannelTurn(params)) return await runPreparedChannelTurn(params);
	return await dispatchAssembledChannelTurn(params);
}
async function runPreparedChannelTurnCore(params, options) {
	const admission = params.admission ?? { kind: "dispatch" };
	const botLoopDrop = resolveBotLoopProtectionDrop(params);
	if (botLoopDrop) {
		clearPendingHistoryAfterTurn(params.history);
		return botLoopDrop;
	}
	emit({
		...params,
		event: {
			stage: "record",
			event: "start",
			messageId: params.messageId,
			sessionKey: params.ctxPayload.SessionKey ?? params.routeSessionKey,
			admission: admission.kind
		}
	});
	try {
		await params.recordInboundSession({
			storePath: params.storePath,
			sessionKey: params.ctxPayload.SessionKey ?? params.routeSessionKey,
			ctx: params.ctxPayload,
			groupResolution: params.record?.groupResolution,
			createIfMissing: params.record?.createIfMissing,
			updateLastRoute: params.record?.updateLastRoute,
			onRecordError: params.record?.onRecordError ?? (() => void 0),
			trackSessionMetaTask: params.record?.trackSessionMetaTask
		});
		emit({
			...params,
			event: {
				stage: "record",
				event: "done",
				messageId: params.messageId,
				sessionKey: params.ctxPayload.SessionKey ?? params.routeSessionKey,
				admission: admission.kind
			}
		});
	} catch (err) {
		emit({
			...params,
			event: {
				stage: "record",
				event: "error",
				messageId: params.messageId,
				sessionKey: params.ctxPayload.SessionKey ?? params.routeSessionKey,
				admission: admission.kind,
				error: err
			}
		});
		try {
			await params.onPreDispatchFailure?.(err);
		} catch {}
		throw err;
	}
	emit({
		...params,
		event: {
			stage: "dispatch",
			event: "start",
			messageId: params.messageId,
			sessionKey: params.ctxPayload.SessionKey ?? params.routeSessionKey,
			admission: admission.kind
		}
	});
	let dispatchResult;
	try {
		dispatchResult = options.suppressObserveOnlyDispatch && admission.kind === "observeOnly" ? resolveObserveOnlyDispatchResult(params) : await params.runDispatch();
	} catch (err) {
		emit({
			...params,
			event: {
				stage: "dispatch",
				event: "error",
				messageId: params.messageId,
				sessionKey: params.ctxPayload.SessionKey ?? params.routeSessionKey,
				admission: admission.kind,
				error: err
			}
		});
		throw err;
	}
	emit({
		...params,
		event: {
			stage: "dispatch",
			event: "done",
			messageId: params.messageId,
			sessionKey: params.ctxPayload.SessionKey ?? params.routeSessionKey,
			admission: admission.kind
		}
	});
	clearPendingHistoryAfterTurn(params.history);
	return {
		admission,
		dispatched: true,
		ctxPayload: params.ctxPayload,
		routeSessionKey: params.routeSessionKey,
		dispatchResult
	};
}
async function runPreparedChannelTurn(params) {
	return await runPreparedChannelTurnCore(params, { suppressObserveOnlyDispatch: true });
}
const runPreparedInboundReply = runPreparedChannelTurn;
async function runChannelTurn(params) {
	emit({
		...params,
		event: {
			stage: "ingest",
			event: "start"
		}
	});
	const input = await params.adapter.ingest(params.raw);
	if (!input) {
		const admission = {
			kind: "drop",
			reason: "ingest-null"
		};
		emit({
			...params,
			event: {
				stage: "ingest",
				event: "drop",
				admission: admission.kind,
				reason: admission.reason
			}
		});
		return {
			admission,
			dispatched: false
		};
	}
	emit({
		...params,
		event: {
			stage: "ingest",
			event: "done",
			messageId: input.id
		}
	});
	const eventClass = await params.adapter.classify?.(input) ?? DEFAULT_EVENT_CLASS;
	if (!eventClass.canStartAgentTurn) {
		const admission = {
			kind: "handled",
			reason: `event:${eventClass.kind}`
		};
		emit({
			...params,
			event: {
				stage: "classify",
				event: "handled",
				messageId: input.id,
				admission: admission.kind,
				reason: admission.reason
			}
		});
		return {
			admission,
			dispatched: false
		};
	}
	const preflight = normalizePreflight(await params.adapter.preflight?.(input, eventClass));
	const preflightAdmission = preflight.admission;
	if (preflightAdmission && preflightAdmission.kind !== "dispatch" && preflightAdmission.kind !== "observeOnly") {
		await recordDroppedChannelTurnHistory({
			input,
			preflight,
			admission: preflightAdmission
		});
		emit({
			...params,
			event: {
				stage: "preflight",
				event: preflightAdmission.kind === "handled" ? "handled" : "drop",
				messageId: input.id,
				admission: preflightAdmission.kind,
				reason: preflightAdmission.reason
			}
		});
		return {
			admission: preflightAdmission,
			dispatched: false
		};
	}
	const resolved = await params.adapter.resolveTurn(input, eventClass, preflight);
	emit({
		...params,
		accountId: resolved.accountId ?? params.accountId,
		event: {
			stage: "assemble",
			event: "done",
			messageId: input.id,
			sessionKey: resolved.routeSessionKey,
			admission: resolved.admission?.kind ?? "dispatch"
		}
	});
	const admission = resolved.admission ?? preflightAdmission ?? { kind: "dispatch" };
	let result;
	try {
		const dispatchResult = await dispatchResolvedChannelTurn(admission.kind === "observeOnly" ? {
			...resolved,
			delivery: createNoopChannelEventDeliveryAdapter(),
			admission,
			log: params.log,
			messageId: input.id
		} : {
			...resolved,
			admission,
			log: params.log,
			messageId: input.id
		});
		result = dispatchResult.dispatched ? {
			...dispatchResult,
			admission
		} : dispatchResult;
	} catch (err) {
		const failedResult = {
			admission,
			dispatched: false,
			ctxPayload: resolved.ctxPayload,
			routeSessionKey: resolved.routeSessionKey
		};
		try {
			await params.adapter.onFinalize?.(failedResult);
		} catch {}
		emit({
			...params,
			accountId: resolved.accountId ?? params.accountId,
			event: {
				stage: "finalize",
				event: "done",
				messageId: input.id,
				sessionKey: resolved.routeSessionKey,
				admission: admission.kind
			}
		});
		throw err;
	}
	try {
		await params.adapter.onFinalize?.(result);
		emit({
			...params,
			accountId: resolved.accountId ?? params.accountId,
			event: {
				stage: "finalize",
				event: "done",
				messageId: input.id,
				sessionKey: resolved.routeSessionKey,
				admission: admission.kind
			}
		});
	} catch (err) {
		emit({
			...params,
			accountId: resolved.accountId ?? params.accountId,
			event: {
				stage: "finalize",
				event: "error",
				messageId: input.id,
				sessionKey: resolved.routeSessionKey,
				admission: admission.kind,
				error: err
			}
		});
		throw err;
	}
	return result;
}
const runChannelInboundEvent = runChannelTurn;
//#endregion
export { toInboundMediaFacts as S, filterChannelInboundSupplementalContext as _, recordDroppedChannelTurnHistory as a, buildChannelInboundMediaPayload as b, runPreparedChannelTurn as c, isDurableInboundReplyDeliveryHandled as d, throwIfDurableInboundReplyDeliveryFailed as f, filterChannelInboundQuoteContext as g, buildChannelInboundEventContext as h, recordDroppedChannelInboundHistory as i, runPreparedInboundReply as l, recordChannelBotPairLoopAndCheckSuppression as m, dispatchAssembledChannelTurn as n, runChannelInboundEvent as o, createChannelDeliveryResultFromReceipt as p, dispatchChannelInboundReply as r, runChannelTurn as s, createNoopChannelEventDeliveryAdapter as t, deliverInboundReplyWithMessageSendContext as u, finalizeChannelInboundContext as v, toHistoryMediaEntries as x, resolveChannelInboundSupplementalContext as y };
