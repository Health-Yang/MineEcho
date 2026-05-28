import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { l as normalizeStringEntries } from "./string-normalization-B8G0vlWE.js";
import { s as statRegularFileSync } from "./regular-file-BFvcwX3y.js";
import { c as isRecord } from "./utils-B5r0V84N.js";
import { p as resolvePayloadMediaUrls, v as sendPayloadMediaSequenceAndFinalize, x as sendTextMediaPayload } from "./reply-payload-swpu2tGD.js";
import { c as normalizeInteractiveReply, f as renderMessagePresentationFallbackText, l as normalizeMessagePresentation, o as interactiveReplyToPresentation, p as resolveInteractiveTextFallback } from "./payload-Cpx3heIy.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { t as chunkTextForOutbound } from "./text-chunking-CWOBXxG4.js";
import "./security-runtime-SX8TzrnK.js";
import { i as createAttachedChannelResultAdapter, t as attachChannelToResult } from "./channel-send-result-swFdRKhg.js";
import { l as resolveFeishuRuntimeAccount, s as resolveFeishuAccount, x as parseFeishuCommentTarget } from "./accounts-DFpq_zoM.js";
import { i as listFeishuDirectoryPeers, n as buildFeishuPresentationCardElements, r as listFeishuDirectoryGroups } from "./presentation-card-bE7q6h_W.js";
import { r as createFeishuClient } from "./client-D-7Cq9bW.js";
import { c as getChatInfo, l as getChatMembers, r as cleanupAmbientCommentTypingReaction, t as deliverCommentThreadText, u as getFeishuMemberInfo } from "./drive-CpPhdBue.js";
import "./runtime-api-Bn99tck9.js";
import { a as sendCardFeishu, c as sendStructuredCardFeishu, g as shouldSuppressFeishuTextForVoiceMedia, h as sendMediaFeishu, i as resolveFeishuCardTemplate, n as getMessageFeishu, o as sendMarkdownCardFeishu, s as sendMessageFeishu, t as editMessageFeishu } from "./send-BB9NHzC6.js";
import { n as probeFeishu } from "./probe-BN2P9HS3.js";
import path from "node:path";
//#region extensions/feishu/src/directory.ts
async function listFeishuDirectoryPeersLive(params) {
	const account = resolveFeishuAccount({
		cfg: params.cfg,
		accountId: params.accountId
	});
	if (!account.configured) return listFeishuDirectoryPeers(params);
	try {
		const client = createFeishuClient(account);
		const peers = [];
		const limit = params.limit ?? 50;
		const response = await client.contact.user.list({ params: { page_size: Math.min(limit, 50) } });
		if (response.code !== 0) throw new Error(response.msg || `code ${response.code}`);
		const q = normalizeLowercaseStringOrEmpty(params.query);
		for (const user of response.data?.items ?? []) {
			if (user.open_id) {
				const name = user.name || "";
				if (!q || normalizeLowercaseStringOrEmpty(user.open_id).includes(q) || normalizeLowercaseStringOrEmpty(name).includes(q)) peers.push({
					kind: "user",
					id: user.open_id,
					name: name || void 0
				});
			}
			if (peers.length >= limit) break;
		}
		return peers;
	} catch (err) {
		if (params.fallbackToStatic === false) throw err instanceof Error ? err : /* @__PURE__ */ new Error("Feishu live peer lookup failed");
		return listFeishuDirectoryPeers(params);
	}
}
async function listFeishuDirectoryGroupsLive(params) {
	const account = resolveFeishuAccount({
		cfg: params.cfg,
		accountId: params.accountId
	});
	if (!account.configured) return listFeishuDirectoryGroups(params);
	try {
		const client = createFeishuClient(account);
		const groups = [];
		const limit = params.limit ?? 50;
		const response = await client.im.chat.list({ params: { page_size: Math.min(limit, 100) } });
		if (response.code !== 0) throw new Error(response.msg || `code ${response.code}`);
		const q = normalizeLowercaseStringOrEmpty(params.query);
		for (const chat of response.data?.items ?? []) {
			if (chat.chat_id) {
				const name = chat.name || "";
				if (!q || normalizeLowercaseStringOrEmpty(chat.chat_id).includes(q) || normalizeLowercaseStringOrEmpty(name).includes(q)) groups.push({
					kind: "group",
					id: chat.chat_id,
					name: name || void 0
				});
			}
			if (groups.length >= limit) break;
		}
		return groups;
	} catch (err) {
		if (params.fallbackToStatic === false) throw err instanceof Error ? err : /* @__PURE__ */ new Error("Feishu live group lookup failed");
		return listFeishuDirectoryGroups(params);
	}
}
//#endregion
//#region extensions/feishu/src/outbound.ts
const RENDERED_FEISHU_CARD = Symbol("openclaw.renderedFeishuCard");
function normalizePossibleLocalImagePath(text) {
	const raw = text?.trim();
	if (!raw) return null;
	if (/\s/.test(raw)) return null;
	if (/^(https?:\/\/|data:|file:\/\/)/i.test(raw)) return null;
	const ext = normalizeLowercaseStringOrEmpty(path.extname(raw));
	if (![
		".jpg",
		".jpeg",
		".png",
		".gif",
		".webp",
		".bmp",
		".ico",
		".tiff"
	].includes(ext)) return null;
	if (!path.isAbsolute(raw)) return null;
	try {
		if (statRegularFileSync(raw).missing) return null;
	} catch {
		return null;
	}
	return raw;
}
function shouldUseCard(text) {
	return /```[\s\S]*?```/.test(text) || /\|.+\|[\r\n]+\|[-:| ]+\|/.test(text);
}
function markRenderedFeishuCard(card) {
	Object.defineProperty(card, RENDERED_FEISHU_CARD, {
		value: true,
		enumerable: false
	});
	return card;
}
function escapeFeishuCardMarkdownText(text) {
	return text.replace(/[&<>]/g, (char) => {
		switch (char) {
			case "&": return "&amp;";
			case "<": return "&lt;";
			case ">": return "&gt;";
			default: return char;
		}
	});
}
function resolveSafeFeishuButtonUrl(url) {
	const trimmed = typeof url === "string" ? url.trim() : "";
	if (!trimmed) return;
	try {
		const parsed = new URL(trimmed);
		return parsed.protocol === "https:" || parsed.protocol === "http:" ? trimmed : void 0;
	} catch {
		return;
	}
}
function sanitizeNativeFeishuButtonBehavior(behavior) {
	if (!isRecord(behavior)) return;
	if (behavior.type === "open_url") {
		const safeUrl = resolveSafeFeishuButtonUrl(behavior.default_url) ?? resolveSafeFeishuButtonUrl(behavior.url);
		return safeUrl ? {
			type: "open_url",
			default_url: safeUrl
		} : void 0;
	}
	if (behavior.type === "callback" && isRecord(behavior.value) && behavior.value.oc === "ocf1") return {
		type: "callback",
		value: behavior.value
	};
}
function sanitizeNativeFeishuCardButton(button) {
	if (!isRecord(button)) return;
	const text = isRecord(button.text) && typeof button.text.content === "string" ? button.text.content : void 0;
	if (!text?.trim()) return;
	const style = button.type === "danger" ? "danger" : button.type === "primary" || button.type === "success" ? "primary" : void 0;
	const behaviors = Array.isArray(button.behaviors) ? button.behaviors.map((behavior) => sanitizeNativeFeishuButtonBehavior(behavior)).filter((behavior) => Boolean(behavior)) : [];
	const rootSafeUrl = resolveSafeFeishuButtonUrl(button.url);
	if (rootSafeUrl) behaviors.push({
		type: "open_url",
		default_url: rootSafeUrl
	});
	if (isRecord(button.value) && button.value.oc === "ocf1") behaviors.push({
		type: "callback",
		value: button.value
	});
	if (behaviors.length === 0) return;
	return {
		tag: "button",
		text: {
			tag: "plain_text",
			content: text
		},
		type: style === "danger" ? "danger" : style === "primary" || style === "success" ? "primary" : "default",
		behaviors
	};
}
function sanitizeNativeFeishuCardElements(element) {
	if (!isRecord(element) || typeof element.tag !== "string") return [];
	if (element.tag === "hr") return [{ tag: "hr" }];
	if (element.tag === "markdown" && typeof element.content === "string") return [{
		tag: "markdown",
		content: escapeFeishuCardMarkdownText(element.content)
	}];
	if (element.tag === "button") {
		const button = sanitizeNativeFeishuCardButton(element);
		return button ? [button] : [];
	}
	if (element.tag === "action" && Array.isArray(element.actions)) return element.actions.map((action) => sanitizeNativeFeishuCardButton(action)).filter((action) => Boolean(action));
	return [];
}
function sanitizeNativeFeishuCard(card) {
	const body = isRecord(card.body) ? card.body : void 0;
	const elements = (Array.isArray(body?.elements) ? body.elements : []).flatMap((element) => sanitizeNativeFeishuCardElements(element)).filter((element) => Boolean(element));
	if (elements.length === 0) return;
	const header = isRecord(card.header) ? card.header : void 0;
	const title = isRecord(header?.title) && typeof header.title.content === "string" ? header.title.content : void 0;
	return markRenderedFeishuCard({
		schema: "2.0",
		config: { width_mode: "fill" },
		...title?.trim() ? { header: {
			title: {
				tag: "plain_text",
				content: title
			},
			template: resolveFeishuCardTemplate(typeof header?.template === "string" ? header.template : void 0) ?? "blue"
		} } : {},
		body: { elements }
	});
}
function readNativeFeishuCard(payload) {
	const feishuData = payload.channelData?.feishu;
	if (!isRecord(feishuData)) return;
	const card = feishuData.card ?? feishuData.interactiveCard;
	if (!isRecord(card)) return;
	if (card[RENDERED_FEISHU_CARD] === true) return card;
	return sanitizeNativeFeishuCard(card);
}
function buildFeishuPayloadCard(params) {
	const nativeCard = readNativeFeishuCard(params.payload);
	if (nativeCard) return nativeCard;
	const interactive = normalizeInteractiveReply(params.payload.interactive);
	const presentation = normalizeMessagePresentation(params.payload.presentation) ?? (interactive ? interactiveReplyToPresentation(interactive) : void 0);
	if (!presentation && !interactive) return;
	const text = resolveInteractiveTextFallback({
		text: params.text ?? params.payload.text,
		interactive
	});
	const elements = presentation ? buildFeishuPresentationCardElements({
		presentation,
		fallbackText: text
	}) : [{
		tag: "markdown",
		content: renderMessagePresentationFallbackText({
			text,
			presentation
		})
	}];
	const identityTitle = params.identity ? params.identity.emoji ? `${params.identity.emoji} ${params.identity.name ?? ""}`.trim() : params.identity.name ?? "" : "";
	const title = presentation?.title ?? identityTitle;
	const template = resolveFeishuCardTemplate(presentation?.tone === "danger" ? "red" : presentation?.tone === "warning" ? "orange" : presentation?.tone === "success" ? "green" : "blue");
	return markRenderedFeishuCard({
		schema: "2.0",
		config: { width_mode: "fill" },
		...title ? { header: {
			title: {
				tag: "plain_text",
				content: title
			},
			template: template ?? "blue"
		} } : {},
		body: { elements }
	});
}
function renderFeishuPresentationPayload({ payload, presentation, ctx }) {
	const card = buildFeishuPayloadCard({
		payload,
		text: payload.text,
		identity: ctx.identity
	});
	if (!card) return null;
	const existingFeishuData = isRecord(payload.channelData?.feishu) ? payload.channelData.feishu : void 0;
	return {
		...payload,
		text: renderMessagePresentationFallbackText({
			text: payload.text,
			presentation
		}),
		channelData: {
			...payload.channelData,
			feishu: {
				...existingFeishuData,
				card
			}
		}
	};
}
function resolveReplyToMessageId(params) {
	const replyToId = params.replyToId?.trim();
	if (replyToId) return replyToId;
	if (params.threadId == null) return;
	return String(params.threadId).trim() || void 0;
}
function resolveFeishuMediaReplyMode(params) {
	const trimmedReplyToId = params.replyToId?.trim() || void 0;
	return {
		replyToMessageId: resolveReplyToMessageId(params),
		replyInThread: params.threadId != null && !trimmedReplyToId
	};
}
async function sendCommentThreadReply(params) {
	const target = parseFeishuCommentTarget(params.to);
	if (!target) return null;
	const client = createFeishuClient(resolveFeishuAccount({
		cfg: params.cfg,
		accountId: params.accountId
	}));
	const replyId = params.replyId?.trim();
	try {
		const result = await deliverCommentThreadText(client, {
			file_token: target.fileToken,
			file_type: target.fileType,
			comment_id: target.commentId,
			content: params.text
		});
		return {
			messageId: typeof result.reply_id === "string" && result.reply_id || typeof result.comment_id === "string" && result.comment_id || "",
			chatId: target.commentId,
			result
		};
	} finally {
		if (replyId) cleanupAmbientCommentTypingReaction({
			client,
			deliveryContext: {
				channel: "feishu",
				to: params.to,
				threadId: replyId
			}
		});
	}
}
async function sendOutboundText(params) {
	const { cfg, to, text, accountId, replyToMessageId, replyInThread } = params;
	const commentResult = await sendCommentThreadReply({
		cfg,
		to,
		text,
		replyId: replyToMessageId,
		accountId
	});
	if (commentResult) return commentResult;
	const renderMode = resolveFeishuAccount({
		cfg,
		accountId
	}).config?.renderMode ?? "auto";
	if (renderMode === "card" || renderMode === "auto" && shouldUseCard(text)) return sendMarkdownCardFeishu({
		cfg,
		to,
		text,
		accountId,
		replyToMessageId,
		replyInThread
	});
	return sendMessageFeishu({
		cfg,
		to,
		text,
		accountId,
		replyToMessageId,
		replyInThread
	});
}
const feishuOutbound = {
	deliveryMode: "direct",
	chunker: chunkTextForOutbound,
	chunkerMode: "markdown",
	textChunkLimit: 4e3,
	presentationCapabilities: {
		supported: true,
		buttons: true,
		selects: false,
		context: true,
		divider: true,
		limits: {
			actions: {
				maxActions: 20,
				maxActionsPerRow: 5,
				maxLabelLength: 40,
				maxValueBytes: 1024
			},
			text: {
				maxLength: 4e3,
				encoding: "characters",
				markdownDialect: "markdown"
			}
		}
	},
	renderPresentation: renderFeishuPresentationPayload,
	sendPayload: async (ctx) => {
		const card = buildFeishuPayloadCard({
			payload: ctx.payload,
			text: ctx.text,
			identity: ctx.identity
		});
		if (!card) return await sendTextMediaPayload({
			channel: "feishu",
			ctx,
			adapter: feishuOutbound
		});
		const replyToMessageId = resolveReplyToMessageId({
			replyToId: ctx.replyToId,
			threadId: ctx.threadId
		});
		if (parseFeishuCommentTarget(ctx.to)) return await sendTextMediaPayload({
			channel: "feishu",
			ctx: {
				...ctx,
				payload: {
					...ctx.payload,
					text: renderMessagePresentationFallbackText({
						text: ctx.payload.text,
						presentation: normalizeMessagePresentation(ctx.payload.presentation) ?? (() => {
							const interactive = normalizeInteractiveReply(ctx.payload.interactive);
							return interactive ? interactiveReplyToPresentation(interactive) : void 0;
						})()
					}),
					interactive: void 0,
					presentation: void 0,
					channelData: void 0
				}
			},
			adapter: feishuOutbound
		});
		const mediaUrls = normalizeStringEntries(resolvePayloadMediaUrls(ctx.payload));
		return attachChannelToResult("feishu", await sendPayloadMediaSequenceAndFinalize({
			text: ctx.payload.text ?? "",
			mediaUrls,
			send: async ({ mediaUrl }) => await sendMediaFeishu({
				cfg: ctx.cfg,
				to: ctx.to,
				mediaUrl,
				accountId: ctx.accountId ?? void 0,
				mediaLocalRoots: ctx.mediaLocalRoots,
				replyToMessageId,
				...ctx.payload.audioAsVoice === true || ctx.audioAsVoice === true ? { audioAsVoice: true } : {}
			}),
			finalize: async () => await sendCardFeishu({
				cfg: ctx.cfg,
				to: ctx.to,
				card,
				replyToMessageId,
				replyInThread: ctx.threadId != null && !ctx.replyToId,
				accountId: ctx.accountId ?? void 0
			})
		}));
	},
	...createAttachedChannelResultAdapter({
		channel: "feishu",
		sendText: async ({ cfg, to, text, accountId, replyToId, threadId, mediaLocalRoots, identity }) => {
			const { replyToMessageId, replyInThread } = resolveFeishuMediaReplyMode({
				replyToId,
				threadId
			});
			const localImagePath = normalizePossibleLocalImagePath(text);
			if (localImagePath) try {
				return await sendMediaFeishu({
					cfg,
					to,
					mediaUrl: localImagePath,
					accountId: accountId ?? void 0,
					replyToMessageId,
					replyInThread,
					mediaLocalRoots
				});
			} catch (err) {
				console.error(`[feishu] local image path auto-send failed:`, err);
			}
			if (parseFeishuCommentTarget(to)) return await sendOutboundText({
				cfg,
				to,
				text,
				accountId: accountId ?? void 0,
				replyToMessageId,
				replyInThread
			});
			const renderMode = resolveFeishuAccount({
				cfg,
				accountId: accountId ?? void 0
			}).config?.renderMode ?? "auto";
			if (renderMode === "card" || renderMode === "auto" && shouldUseCard(text)) {
				const header = identity ? {
					title: identity.emoji ? `${identity.emoji} ${identity.name ?? ""}`.trim() : identity.name ?? "",
					template: "blue"
				} : void 0;
				return await sendStructuredCardFeishu({
					cfg,
					to,
					text,
					replyToMessageId,
					replyInThread,
					accountId: accountId ?? void 0,
					header: header?.title ? header : void 0
				});
			}
			return await sendOutboundText({
				cfg,
				to,
				text,
				accountId: accountId ?? void 0,
				replyToMessageId,
				replyInThread
			});
		},
		sendMedia: async ({ cfg, to, text, mediaUrl, audioAsVoice, accountId, mediaLocalRoots, replyToId, threadId }) => {
			const { replyToMessageId, replyInThread } = resolveFeishuMediaReplyMode({
				replyToId,
				threadId
			});
			if (parseFeishuCommentTarget(to)) return await sendOutboundText({
				cfg,
				to,
				text: [text?.trim(), mediaUrl?.trim()].filter(Boolean).join("\n\n") || mediaUrl || text || "",
				accountId: accountId ?? void 0,
				replyToMessageId,
				replyInThread
			});
			const suppressTextForVoiceMedia = mediaUrl !== void 0 && shouldSuppressFeishuTextForVoiceMedia({
				mediaUrl,
				audioAsVoice
			});
			if (text?.trim() && !suppressTextForVoiceMedia) await sendOutboundText({
				cfg,
				to,
				text,
				accountId: accountId ?? void 0,
				replyToMessageId,
				replyInThread
			});
			if (mediaUrl) try {
				const result = await sendMediaFeishu({
					cfg,
					to,
					mediaUrl,
					accountId: accountId ?? void 0,
					mediaLocalRoots,
					replyToMessageId,
					replyInThread,
					...audioAsVoice === true ? { audioAsVoice: true } : {}
				});
				if (result.voiceIntentDegradedToFile && text?.trim()) await sendOutboundText({
					cfg,
					to,
					text,
					accountId: accountId ?? void 0,
					replyToMessageId,
					replyInThread
				});
				return result;
			} catch (err) {
				console.error(`[feishu] sendMediaFeishu failed:`, err);
				return await sendOutboundText({
					cfg,
					to,
					text: [text?.trim(), `📎 ${mediaUrl}`].filter(Boolean).join("\n\n"),
					accountId: accountId ?? void 0,
					replyToMessageId,
					replyInThread
				});
			}
			return await sendOutboundText({
				cfg,
				to,
				text: text ?? "",
				accountId: accountId ?? void 0,
				replyToMessageId,
				replyInThread
			});
		}
	})
};
//#endregion
//#region extensions/feishu/src/pins.ts
function assertFeishuPinApiSuccess(response, action) {
	if (response.code !== 0) throw new Error(`Feishu ${action} failed: ${response.msg || `code ${response.code}`}`);
}
function normalizePin(pin) {
	return {
		messageId: pin.message_id,
		chatId: pin.chat_id,
		operatorId: pin.operator_id,
		operatorIdType: pin.operator_id_type,
		createTime: pin.create_time
	};
}
async function createPinFeishu(params) {
	const account = resolveFeishuRuntimeAccount({
		cfg: params.cfg,
		accountId: params.accountId
	});
	if (!account.configured) throw new Error(`Feishu account "${account.accountId}" not configured`);
	const response = await createFeishuClient(account).im.pin.create({ data: { message_id: params.messageId } });
	assertFeishuPinApiSuccess(response, "pin create");
	return response.data?.pin ? normalizePin(response.data.pin) : null;
}
async function removePinFeishu(params) {
	const account = resolveFeishuRuntimeAccount({
		cfg: params.cfg,
		accountId: params.accountId
	});
	if (!account.configured) throw new Error(`Feishu account "${account.accountId}" not configured`);
	assertFeishuPinApiSuccess(await createFeishuClient(account).im.pin.delete({ path: { message_id: params.messageId } }), "pin delete");
}
async function listPinsFeishu(params) {
	const account = resolveFeishuRuntimeAccount({
		cfg: params.cfg,
		accountId: params.accountId
	});
	if (!account.configured) throw new Error(`Feishu account "${account.accountId}" not configured`);
	const response = await createFeishuClient(account).im.pin.list({ params: {
		chat_id: params.chatId,
		...params.startTime ? { start_time: params.startTime } : {},
		...params.endTime ? { end_time: params.endTime } : {},
		...typeof params.pageSize === "number" ? { page_size: Math.max(1, Math.min(100, Math.floor(params.pageSize))) } : {},
		...params.pageToken ? { page_token: params.pageToken } : {}
	} });
	assertFeishuPinApiSuccess(response, "pin list");
	return {
		chatId: params.chatId,
		pins: (response.data?.items ?? []).map(normalizePin),
		hasMore: response.data?.has_more === true,
		pageToken: response.data?.page_token
	};
}
//#endregion
//#region extensions/feishu/src/reactions.ts
function resolveConfiguredFeishuClient(params) {
	const account = resolveFeishuRuntimeAccount(params);
	if (!account.configured) throw new Error(`Feishu account "${account.accountId}" not configured`);
	return createFeishuClient(account);
}
function assertFeishuReactionApiSuccess(response, action) {
	if (response.code !== 0) throw new Error(`Feishu ${action} failed: ${response.msg || `code ${response.code}`}`);
}
/**
* Add a reaction (emoji) to a message.
* @param emojiType - Feishu emoji type, e.g., "SMILE", "THUMBSUP", "HEART"
* @see https://open.feishu.cn/document/server-docs/im-v1/message-reaction/emojis-introduce
*/
async function addReactionFeishu(params) {
	const { cfg, messageId, emojiType, accountId } = params;
	const response = await resolveConfiguredFeishuClient({
		cfg,
		accountId
	}).im.messageReaction.create({
		path: { message_id: messageId },
		data: { reaction_type: { emoji_type: emojiType } }
	});
	assertFeishuReactionApiSuccess(response, "add reaction");
	const reactionId = response.data?.reaction_id;
	if (!reactionId) throw new Error("Feishu add reaction failed: no reaction_id returned");
	return { reactionId };
}
/**
* Remove a reaction from a message.
*/
async function removeReactionFeishu(params) {
	const { cfg, messageId, reactionId, accountId } = params;
	assertFeishuReactionApiSuccess(await resolveConfiguredFeishuClient({
		cfg,
		accountId
	}).im.messageReaction.delete({ path: {
		message_id: messageId,
		reaction_id: reactionId
	} }), "remove reaction");
}
/**
* List all reactions for a message.
*/
async function listReactionsFeishu(params) {
	const { cfg, messageId, emojiType, accountId } = params;
	const response = await resolveConfiguredFeishuClient({
		cfg,
		accountId
	}).im.messageReaction.list({
		path: { message_id: messageId },
		params: emojiType ? { reaction_type: emojiType } : void 0
	});
	assertFeishuReactionApiSuccess(response, "list reactions");
	return (response.data?.items ?? []).map((item) => ({
		reactionId: item.reaction_id ?? "",
		emojiType: item.reaction_type?.emoji_type ?? "",
		operatorType: item.operator_type === "app" ? "app" : "user",
		operatorId: item.operator_id?.open_id ?? item.operator_id?.user_id ?? item.operator_id?.union_id ?? ""
	}));
}
//#endregion
//#region extensions/feishu/src/channel.runtime.ts
const feishuChannelRuntime = {
	listFeishuDirectoryGroupsLive,
	listFeishuDirectoryPeersLive,
	feishuOutbound: { ...feishuOutbound },
	createPinFeishu,
	listPinsFeishu,
	removePinFeishu,
	probeFeishu,
	addReactionFeishu,
	listReactionsFeishu,
	removeReactionFeishu,
	getChatInfo,
	getChatMembers,
	getFeishuMemberInfo,
	editMessageFeishu,
	getMessageFeishu,
	sendCardFeishu,
	sendMessageFeishu
};
//#endregion
export { feishuChannelRuntime };
