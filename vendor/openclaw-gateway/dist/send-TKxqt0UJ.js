import { c as normalizeOptionalString, p as readStringValue, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { a as normalizeOptionalTrimmedStringList } from "./string-normalization-B8G0vlWE.js";
import { _ as resolveSessionAgentId } from "./agent-scope-CudANNo3.js";
import { u as parseThreadSessionSuffix } from "./session-key-utils-AmKO9Roj.js";
import { Ii as ErrorCodes, Li as errorShape, Ot as validatePollParams, Pt as validateSendParams, it as validateMessageActionParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import "./operator-scopes-DGvgHuOd.js";
import { a as normalizeChannelId, t as getChannelPlugin } from "./registry-Be8exPcf.js";
import "./plugins-BGmuVWWz.js";
import "./sessions-Ct4mpWsk.js";
import { t as appendAssistantMessageToSessionTranscript } from "./transcript-DxGLLD67.js";
import { t as extractToolPayload } from "./tool-payload-BwXNuCsb.js";
import { s as projectOutboundPayloadPlanForMirror, t as createOutboundPayloadPlan } from "./payloads-BSIGv16L.js";
import { r as getAgentScopedMediaLocalRoots } from "./local-roots-D6qfvE07.js";
import { t as buildOutboundSessionContext } from "./session-context-BklLDvOT.js";
import { r as resolveOutboundChannelPlugin } from "./channel-resolution-DAbY66ca.js";
import { t as sendDurableMessageBatch } from "./send-y6Pn3hrc.js";
import "./runtime-CzzF-KF1.js";
import { n as normalizePollInput } from "./polls-C-v11_tu.js";
import { n as resolveMessageChannelSelection } from "./channel-selection-BbtweWak.js";
import { n as resolveOutboundSessionRoute, t as ensureOutboundSessionEntry } from "./outbound-session-DPM4FIwc.js";
import { a as maybeResolveIdLikeTarget } from "./target-resolver-B7hXUFIt.js";
import { i as resolveOutboundTarget } from "./targets-CviNlU8H.js";
import { t as dispatchChannelMessageAction } from "./message-action-dispatch-Bv_aC0Im.js";
import { t as formatForLog } from "./ws-log-Fic6EinB.js";
import { n as createOutboundSendDeps } from "./deps-2n_htaMu.js";
import { t as resolveGatewayPluginConfig } from "./runtime-plugin-config-OAv1SCAo.js";
//#region src/infra/outbound/source-reply-mirror.ts
function readStringArray(value) {
	return normalizeOptionalTrimmedStringList(value);
}
function readFirstString(params, keys) {
	for (const key of keys) {
		const value = normalizeOptionalString(params[key]);
		if (value) return value;
	}
}
function resolveSourceReplyTarget(params) {
	return readFirstString(params, [
		"target",
		"to",
		"channelId",
		"chatId"
	]);
}
function resolveSourceReplyThreadId(params) {
	return readFirstString(params.actionParams, ["threadId", "messageThreadId"]);
}
function resolveThreadedSourceTarget(params, requestedTarget) {
	const threadId = resolveSourceReplyThreadId(params);
	if (!threadId) return requestedTarget;
	return normalizeOptionalString(getChannelPlugin(params.channel)?.threading?.resolveCurrentChannelId?.({
		to: requestedTarget,
		threadId
	})) ?? requestedTarget;
}
function hasExplicitDeliveryFailure(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
	const record = payload;
	if (record.ok === false) return true;
	const status = normalizeOptionalLowercaseString(record.status);
	if (status === "failed" || status === "error") return true;
	const deliveryStatus = normalizeOptionalLowercaseString(record.deliveryStatus);
	return deliveryStatus === "failed" || deliveryStatus === "error";
}
function isCurrentSourceConversation(params) {
	if (params.action !== "send") return false;
	if (!params.sessionKey?.trim()) return false;
	const currentChannel = normalizeOptionalLowercaseString(params.toolContext?.currentChannelProvider);
	if (!currentChannel || currentChannel !== normalizeOptionalLowercaseString(params.channel)) return false;
	const currentTarget = normalizeOptionalString(params.toolContext?.currentChannelId);
	if (!currentTarget) return false;
	const requestedTarget = resolveSourceReplyTarget(params.actionParams);
	if (!requestedTarget) return false;
	return requestedTarget === currentTarget || resolveThreadedSourceTarget(params, requestedTarget) === currentTarget;
}
async function mirrorDeliveredSourceReplyToTranscript(params) {
	if (hasExplicitDeliveryFailure(params.deliveredPayload)) return false;
	if (!isCurrentSourceConversation(params)) return false;
	const mirror = projectOutboundPayloadPlanForMirror(createOutboundPayloadPlan([{
		text: readFirstString(params.actionParams, [
			"message",
			"content",
			"text",
			"caption"
		]) ?? "",
		mediaUrl: readFirstString(params.actionParams, [
			"mediaUrl",
			"media",
			"path",
			"filePath",
			"fileUrl"
		]),
		mediaUrls: readStringArray(params.actionParams.mediaUrls),
		presentation: params.actionParams.presentation,
		interactive: params.actionParams.interactive,
		channelData: params.actionParams.channelData
	}]));
	if (!mirror.text && mirror.mediaUrls.length === 0) return false;
	await appendAssistantMessageToSessionTranscript({
		agentId: params.agentId,
		sessionKey: params.sessionKey,
		text: mirror.text,
		mediaUrls: mirror.mediaUrls.length ? mirror.mediaUrls : void 0,
		idempotencyKey: params.idempotencyKey,
		config: params.cfg
	});
	return true;
}
//#endregion
//#region src/gateway/server-methods/send.ts
const inflightByContext = /* @__PURE__ */ new WeakMap();
const getInflightMap = (context) => {
	let inflight = inflightByContext.get(context);
	if (!inflight) {
		inflight = /* @__PURE__ */ new Map();
		inflightByContext.set(context, inflight);
	}
	return inflight;
};
function resolveGatewayInflightMap(params) {
	const cached = params.context.dedupe.get(params.dedupeKey);
	if (cached) return {
		kind: "cached",
		cached
	};
	const inflightMap = getInflightMap(params.context);
	const inflight = inflightMap.get(params.dedupeKey);
	if (inflight) return {
		kind: "inflight",
		inflight
	};
	return {
		kind: "ready",
		inflightMap
	};
}
async function runGatewayInflightWork(params) {
	params.inflightMap.set(params.dedupeKey, params.work);
	try {
		const result = await params.work;
		params.respond(result.ok, result.payload, result.error, result.meta);
	} finally {
		params.inflightMap.delete(params.dedupeKey);
	}
}
async function resolveRequestedChannel(params) {
	const channelInput = readStringValue(params.requestChannel);
	const normalizedChannel = channelInput ? normalizeChannelId(channelInput) : null;
	if (channelInput && !normalizedChannel) {
		const normalizedInput = normalizeOptionalLowercaseString(channelInput) ?? "";
		if (params.rejectWebchatAsInternalOnly && normalizedInput === "webchat") return { error: errorShape(ErrorCodes.INVALID_REQUEST, "unsupported channel: webchat (internal-only). Use `chat.send` for WebChat UI messages or choose a deliverable channel.") };
		return { error: errorShape(ErrorCodes.INVALID_REQUEST, params.unsupportedMessage(channelInput)) };
	}
	const cfg = resolveGatewayPluginConfig({
		config: params.context.getRuntimeConfig(),
		env: process.env
	});
	let channel = normalizedChannel;
	if (!channel) try {
		channel = (await resolveMessageChannelSelection({ cfg })).channel;
	} catch (err) {
		return { error: errorShape(ErrorCodes.INVALID_REQUEST, String(err)) };
	}
	return {
		cfg,
		channel
	};
}
function resolveGatewayOutboundTarget(params) {
	const resolved = resolveOutboundTarget({
		channel: params.channel,
		to: params.to,
		cfg: params.cfg,
		accountId: params.accountId,
		mode: "explicit"
	});
	if (!resolved.ok) return {
		ok: false,
		error: errorShape(ErrorCodes.INVALID_REQUEST, String(resolved.error))
	};
	return {
		ok: true,
		to: resolved.to
	};
}
function buildGatewayDeliveryPayload(params) {
	const payload = {
		runId: params.runId,
		messageId: params.result.messageId,
		channel: params.channel
	};
	if ("chatId" in params.result) payload.chatId = params.result.chatId;
	if ("channelId" in params.result) payload.channelId = params.result.channelId;
	if ("toJid" in params.result) payload.toJid = params.result.toJid;
	if ("conversationId" in params.result) payload.conversationId = params.result.conversationId;
	if ("pollId" in params.result) payload.pollId = params.result.pollId;
	return payload;
}
function cacheGatewayDedupeSuccess(params) {
	params.context.dedupe.set(params.dedupeKey, {
		ts: Date.now(),
		ok: true,
		payload: params.payload
	});
}
function cacheGatewayDedupeFailure(params) {
	params.context.dedupe.set(params.dedupeKey, {
		ts: Date.now(),
		ok: false,
		error: params.error
	});
}
function createGatewayInflightSuccess(params) {
	cacheGatewayDedupeSuccess({
		context: params.context,
		dedupeKey: params.dedupeKey,
		payload: params.payload
	});
	return {
		ok: true,
		payload: params.payload,
		meta: { channel: params.channel }
	};
}
function createGatewayInflightUnavailableFailure(params) {
	const error = errorShape(ErrorCodes.UNAVAILABLE, String(params.err));
	cacheGatewayDedupeFailure({
		context: params.context,
		dedupeKey: params.dedupeKey,
		error
	});
	return {
		ok: false,
		error,
		meta: {
			channel: params.channel,
			error: formatForLog(params.err)
		}
	};
}
async function mirrorDeliveredSourceReplyToTranscriptBestEffort(params) {
	try {
		await mirrorDeliveredSourceReplyToTranscript(params.mirror);
	} catch (err) {
		params.context.logGateway?.warn?.("Source reply transcript mirror failed after delivery.", {
			error: formatForLog(err),
			channel: params.mirror.channel,
			sessionKey: params.mirror.sessionKey
		});
	}
}
const sourceReplyTranscriptMirrorQueues = /* @__PURE__ */ new Map();
function resolveSourceReplyTranscriptMirrorQueueKey(mirror) {
	return mirror.sessionKey?.trim() || "__global__";
}
function scheduleDeliveredSourceReplyTranscriptMirror(params) {
	const queueKey = resolveSourceReplyTranscriptMirrorQueueKey(params.mirror);
	const previous = sourceReplyTranscriptMirrorQueues.get(queueKey);
	const queued = (async () => {
		await previous?.catch(() => void 0);
		await mirrorDeliveredSourceReplyToTranscriptBestEffort(params);
	})();
	sourceReplyTranscriptMirrorQueues.set(queueKey, queued);
	queued.finally(() => {
		if (sourceReplyTranscriptMirrorQueues.get(queueKey) === queued) sourceReplyTranscriptMirrorQueues.delete(queueKey);
	}).catch(() => void 0);
	return queued;
}
const sendHandlers = {
	"message.action": async ({ params, respond, context, client }) => {
		const p = params;
		if (!validateMessageActionParams(p)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid message.action params: ${formatValidationErrors(validateMessageActionParams.errors)}`));
			return;
		}
		const request = p;
		const dedupeKey = `message.action:${request.idempotencyKey}`;
		const inflight = resolveGatewayInflightMap({
			context,
			dedupeKey
		});
		if (inflight.kind === "cached") {
			respond(inflight.cached.ok, inflight.cached.payload, inflight.cached.error, { cached: true });
			return;
		}
		if (inflight.kind === "inflight") {
			const result = await inflight.inflight;
			const meta = result.meta ? {
				...result.meta,
				cached: true
			} : { cached: true };
			respond(result.ok, result.payload, result.error, meta);
			return;
		}
		if (inflight.kind !== "ready") return;
		const inflightMap = inflight.inflightMap;
		await runGatewayInflightWork({
			inflightMap,
			dedupeKey,
			work: (async () => {
				const resolvedChannel = await resolveRequestedChannel({
					requestChannel: request.channel,
					unsupportedMessage: (input) => `unsupported channel: ${input}`,
					context,
					rejectWebchatAsInternalOnly: true
				});
				if ("error" in resolvedChannel) return {
					ok: false,
					error: resolvedChannel.error
				};
				const { cfg, channel } = resolvedChannel;
				if (!resolveOutboundChannelPlugin({
					channel,
					cfg
				})?.actions?.handleAction) return {
					ok: false,
					error: errorShape(ErrorCodes.INVALID_REQUEST, `Channel ${channel} does not support action ${request.action}.`)
				};
				try {
					const gatewayClientScopes = client?.connect?.scopes ?? [];
					const handled = await dispatchChannelMessageAction({
						channel,
						action: request.action,
						cfg,
						params: request.params,
						accountId: normalizeOptionalString(request.accountId) ?? void 0,
						requesterSenderId: normalizeOptionalString(request.requesterSenderId) ?? void 0,
						senderIsOwner: gatewayClientScopes.includes("operator.admin") ? request.senderIsOwner === true : false,
						sessionKey: normalizeOptionalString(request.sessionKey) ?? void 0,
						sessionId: normalizeOptionalString(request.sessionId) ?? void 0,
						inboundEventKind: request.inboundTurnKind,
						agentId: normalizeOptionalString(request.agentId) ?? void 0,
						mediaLocalRoots: getAgentScopedMediaLocalRoots(cfg, normalizeOptionalString(request.agentId) ?? void 0),
						toolContext: request.toolContext,
						dryRun: false,
						gatewayClientScopes
					});
					if (!handled) {
						const error = errorShape(ErrorCodes.INVALID_REQUEST, `Message action ${request.action} not supported for channel ${channel}.`);
						cacheGatewayDedupeFailure({
							context,
							dedupeKey,
							error
						});
						return {
							ok: false,
							error,
							meta: { channel }
						};
					}
					const payload = extractToolPayload(handled);
					const sessionKey = normalizeOptionalString(request.sessionKey) ?? void 0;
					const agentId = normalizeOptionalString(request.agentId) ?? (sessionKey ? resolveSessionAgentId({
						sessionKey,
						config: cfg
					}) : void 0);
					await scheduleDeliveredSourceReplyTranscriptMirror({
						context,
						mirror: {
							action: request.action,
							channel,
							actionParams: request.params,
							cfg,
							sessionKey,
							agentId,
							toolContext: request.toolContext,
							idempotencyKey: request.idempotencyKey,
							deliveredPayload: payload
						}
					});
					return createGatewayInflightSuccess({
						context,
						dedupeKey,
						payload,
						channel
					});
				} catch (err) {
					return createGatewayInflightUnavailableFailure({
						context,
						dedupeKey,
						channel,
						err
					});
				}
			})(),
			respond
		});
	},
	send: async ({ params, respond, context, client }) => {
		const p = params;
		if (!validateSendParams(p)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid send params: ${formatValidationErrors(validateSendParams.errors)}`));
			return;
		}
		const request = p;
		const idem = request.idempotencyKey;
		const dedupeKey = `send:${idem}`;
		const inflight = resolveGatewayInflightMap({
			context,
			dedupeKey
		});
		if (inflight.kind === "cached") {
			respond(inflight.cached.ok, inflight.cached.payload, inflight.cached.error, { cached: true });
			return;
		}
		if (inflight.kind === "inflight") {
			const result = await inflight.inflight;
			const meta = result.meta ? {
				...result.meta,
				cached: true
			} : { cached: true };
			respond(result.ok, result.payload, result.error, meta);
			return;
		}
		const inflightMap = inflight.inflightMap;
		const to = normalizeOptionalString(request.to) ?? "";
		const message = normalizeOptionalString(request.message) ?? "";
		const mediaUrl = normalizeOptionalString(request.mediaUrl);
		const mediaUrls = Array.isArray(request.mediaUrls) ? request.mediaUrls.map((entry) => normalizeOptionalString(entry)).filter((entry) => Boolean(entry)) : void 0;
		if (!message && !mediaUrl && (mediaUrls?.length ?? 0) === 0) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid send params: text or media is required"));
			return;
		}
		const accountId = normalizeOptionalString(request.accountId);
		const replyToId = normalizeOptionalString(request.replyToId);
		const threadId = normalizeOptionalString(request.threadId);
		await runGatewayInflightWork({
			inflightMap,
			dedupeKey,
			work: (async () => {
				const resolvedChannel = await resolveRequestedChannel({
					requestChannel: request.channel,
					unsupportedMessage: (input) => `unsupported channel: ${input}`,
					context,
					rejectWebchatAsInternalOnly: true
				});
				if ("error" in resolvedChannel) return {
					ok: false,
					error: resolvedChannel.error
				};
				const { cfg, channel } = resolvedChannel;
				const outboundChannel = channel;
				if (!resolveOutboundChannelPlugin({
					channel,
					cfg
				})) return {
					ok: false,
					error: errorShape(ErrorCodes.INVALID_REQUEST, `unsupported channel: ${channel}`)
				};
				try {
					const resolvedTarget = resolveGatewayOutboundTarget({
						channel: outboundChannel,
						to,
						cfg,
						accountId
					});
					if (!resolvedTarget.ok) return {
						ok: false,
						error: resolvedTarget.error,
						meta: { channel }
					};
					const idLikeTarget = await maybeResolveIdLikeTarget({
						cfg,
						channel,
						input: resolvedTarget.to,
						accountId
					});
					const deliveryTarget = idLikeTarget?.to ?? resolvedTarget.to;
					const outboundDeps = context.deps ? createOutboundSendDeps(context.deps) : void 0;
					const outboundPayloads = [{
						text: message,
						mediaUrl,
						mediaUrls,
						...request.asVoice === true ? { audioAsVoice: true } : {}
					}];
					const mirrorProjection = projectOutboundPayloadPlanForMirror(createOutboundPayloadPlan(outboundPayloads));
					const mirrorText = mirrorProjection.text;
					const mirrorMediaUrls = mirrorProjection.mediaUrls;
					const providedSessionKey = normalizeOptionalLowercaseString(request.sessionKey);
					const explicitAgentId = normalizeOptionalString(request.agentId);
					const sessionAgentId = providedSessionKey ? resolveSessionAgentId({
						sessionKey: providedSessionKey,
						config: cfg
					}) : void 0;
					const defaultAgentId = resolveSessionAgentId({ config: cfg });
					const effectiveAgentId = explicitAgentId ?? sessionAgentId ?? defaultAgentId;
					const derivedRoute = await resolveOutboundSessionRoute({
						cfg,
						channel,
						agentId: effectiveAgentId,
						accountId,
						target: deliveryTarget,
						currentSessionKey: providedSessionKey,
						resolvedTarget: idLikeTarget,
						replyToId,
						threadId
					});
					const providedSessionBaseKey = parseThreadSessionSuffix(providedSessionKey).baseSessionKey ?? providedSessionKey;
					const shouldUseDerivedThreadSessionKey = channel === "slack" && !!providedSessionKey && !!normalizeOptionalString(derivedRoute?.threadId) && normalizeOptionalLowercaseString(derivedRoute?.baseSessionKey) === normalizeOptionalLowercaseString(providedSessionBaseKey) && normalizeOptionalLowercaseString(derivedRoute?.sessionKey) !== providedSessionKey;
					const outboundRoute = derivedRoute ? providedSessionKey ? shouldUseDerivedThreadSessionKey ? {
						...derivedRoute,
						baseSessionKey: derivedRoute.baseSessionKey ?? providedSessionKey
					} : {
						...derivedRoute,
						sessionKey: providedSessionKey,
						baseSessionKey: providedSessionKey
					} : derivedRoute : null;
					if (outboundRoute) await ensureOutboundSessionEntry({
						cfg,
						channel,
						accountId,
						route: outboundRoute
					});
					const outboundSessionKey = outboundRoute?.sessionKey ?? providedSessionKey;
					const outboundSession = buildOutboundSessionContext({
						cfg,
						agentId: effectiveAgentId,
						sessionKey: outboundSessionKey,
						conversationType: outboundRoute?.chatType
					});
					const send = await sendDurableMessageBatch({
						cfg,
						channel: outboundChannel,
						to: deliveryTarget,
						accountId,
						payloads: outboundPayloads,
						replyToId: replyToId ?? null,
						session: outboundSession,
						gifPlayback: request.gifPlayback,
						forceDocument: request.forceDocument,
						threadId: outboundRoute?.threadId ?? threadId ?? null,
						deps: outboundDeps,
						gatewayClientScopes: client?.connect?.scopes ?? [],
						silent: request.silent,
						formatting: request.parseMode ? { parseMode: request.parseMode } : void 0,
						mirror: outboundSessionKey ? {
							sessionKey: outboundSessionKey,
							agentId: effectiveAgentId,
							text: mirrorText || message,
							mediaUrls: mirrorMediaUrls.length > 0 ? mirrorMediaUrls : void 0,
							idempotencyKey: idem
						} : void 0
					});
					if (send.status === "failed" || send.status === "partial_failed") throw send.error;
					const result = (send.status === "sent" ? send.results : []).at(-1);
					if (!result) throw new Error("No delivery result");
					return createGatewayInflightSuccess({
						context,
						dedupeKey,
						payload: buildGatewayDeliveryPayload({
							runId: idem,
							channel,
							result
						}),
						channel
					});
				} catch (err) {
					return createGatewayInflightUnavailableFailure({
						context,
						dedupeKey,
						channel,
						err
					});
				}
			})(),
			respond
		});
	},
	poll: async ({ params, respond, context, client }) => {
		const p = params;
		if (!validatePollParams(p)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid poll params: ${formatValidationErrors(validatePollParams.errors)}`));
			return;
		}
		const request = p;
		const idem = request.idempotencyKey;
		const dedupeKey = `poll:${idem}`;
		const inflight = resolveGatewayInflightMap({
			context,
			dedupeKey
		});
		if (inflight.kind === "cached") {
			respond(inflight.cached.ok, inflight.cached.payload, inflight.cached.error, { cached: true });
			return;
		}
		if (inflight.kind === "inflight") {
			const result = await inflight.inflight;
			const meta = result.meta ? {
				...result.meta,
				cached: true
			} : { cached: true };
			respond(result.ok, result.payload, result.error, meta);
			return;
		}
		if (inflight.kind !== "ready") return;
		const inflightMap = inflight.inflightMap;
		await runGatewayInflightWork({
			inflightMap,
			dedupeKey,
			work: (async () => {
				const resolvedChannel = await resolveRequestedChannel({
					requestChannel: request.channel,
					unsupportedMessage: (input) => `unsupported poll channel: ${input}`,
					context
				});
				if ("error" in resolvedChannel) return {
					ok: false,
					error: resolvedChannel.error
				};
				const { cfg, channel } = resolvedChannel;
				const outbound = resolveOutboundChannelPlugin({
					channel,
					cfg
				})?.outbound;
				if (typeof request.durationSeconds === "number" && outbound?.supportsPollDurationSeconds !== true) return {
					ok: false,
					error: errorShape(ErrorCodes.INVALID_REQUEST, `durationSeconds is not supported for ${channel} polls`)
				};
				if (typeof request.isAnonymous === "boolean" && outbound?.supportsAnonymousPolls !== true) return {
					ok: false,
					error: errorShape(ErrorCodes.INVALID_REQUEST, `isAnonymous is not supported for ${channel} polls`)
				};
				const poll = {
					question: request.question,
					options: request.options,
					maxSelections: request.maxSelections,
					durationSeconds: request.durationSeconds,
					durationHours: request.durationHours
				};
				const threadId = normalizeOptionalString(request.threadId);
				const accountId = normalizeOptionalString(request.accountId);
				try {
					if (!outbound?.sendPoll) return {
						ok: false,
						error: errorShape(ErrorCodes.INVALID_REQUEST, `unsupported poll channel: ${channel}`)
					};
					const resolvedTarget = resolveGatewayOutboundTarget({
						channel,
						to: request.to.trim(),
						cfg,
						accountId
					});
					if (!resolvedTarget.ok) return {
						ok: false,
						error: resolvedTarget.error
					};
					const normalized = outbound.pollMaxOptions ? normalizePollInput(poll, { maxOptions: outbound.pollMaxOptions }) : normalizePollInput(poll);
					const payload = buildGatewayDeliveryPayload({
						runId: idem,
						channel,
						result: await outbound.sendPoll({
							cfg,
							to: resolvedTarget.to,
							poll: normalized,
							accountId,
							threadId,
							silent: request.silent,
							isAnonymous: request.isAnonymous,
							gatewayClientScopes: client?.connect?.scopes ?? []
						})
					});
					cacheGatewayDedupeSuccess({
						context,
						dedupeKey,
						payload
					});
					return {
						ok: true,
						payload,
						meta: { channel }
					};
				} catch (err) {
					const error = errorShape(ErrorCodes.UNAVAILABLE, String(err));
					cacheGatewayDedupeFailure({
						context,
						dedupeKey,
						error
					});
					return {
						ok: false,
						error,
						meta: {
							channel,
							error: formatForLog(err)
						}
					};
				}
			})(),
			respond
		});
	}
};
//#endregion
export { sendHandlers };
