import "./payloads-BSIGv16L.js";
import "./streaming-Bpx5ncw8.js";
import "./session-context-BklLDvOT.js";
import "./sanitize-text-CyYXgWu1.js";
import { t as createMessageReceiptFromOutboundResults } from "./receipt-KEYzve-j.js";
import "./reply-pipeline-C3CPjsQr.js";
import "./draft-stream-controls-BQxtd4iQ.js";
import "./identity-CuUPFHIR.js";
//#region src/channels/message/adapter.ts
const defaultManualReceiveAdapter$1 = {
	defaultAckPolicy: "manual",
	supportedAckPolicies: ["manual"]
};
function defineChannelMessageAdapter(adapter) {
	return {
		...adapter,
		receive: adapter.receive ?? defaultManualReceiveAdapter$1
	};
}
//#endregion
//#region src/channels/message/outbound-bridge.ts
const defaultManualReceiveAdapter = {
	defaultAckPolicy: "manual",
	supportedAckPolicies: ["manual"]
};
function resolveResultMessageId(result) {
	return result.messageId ?? result.receipt?.primaryPlatformMessageId ?? result.receipt?.platformMessageIds[0] ?? result.chatId ?? result.channelId ?? result.roomId ?? result.conversationId ?? result.toJid ?? result.pollId;
}
function toMessageSendResult(result, params) {
	const receipt = result.receipt ? params.normalizeReceiptKind ? {
		...result.receipt,
		parts: result.receipt.parts.map((part) => ({
			...part,
			kind: params.kind
		}))
	} : result.receipt : createMessageReceiptFromOutboundResults({
		results: [result],
		kind: params.kind,
		threadId: params.threadId == null ? void 0 : String(params.threadId),
		replyToId: params.replyToId ?? void 0
	});
	return {
		receipt,
		...resolveResultMessageId({
			...result,
			receipt
		}) ? { messageId: resolveResultMessageId({
			...result,
			receipt
		}) } : {}
	};
}
function resolvePayloadReceiptKind(ctx) {
	if (ctx.payload.audioAsVoice && (ctx.mediaUrl || ctx.payload.mediaUrl || ctx.payload.mediaUrls?.length)) return "voice";
	if (ctx.mediaUrl || ctx.payload.mediaUrl || ctx.payload.mediaUrls?.length) return "media";
	if (ctx.payload.text?.trim() || ctx.text.trim()) return "text";
	if (ctx.payload.presentation?.blocks?.length || ctx.payload.interactive) return "card";
	return "unknown";
}
function createChannelMessageAdapterFromOutbound(params) {
	const send = {};
	if (params.outbound.sendText) send.text = async (ctx) => toMessageSendResult(await params.outbound.sendText(ctx), {
		kind: "text",
		threadId: ctx.threadId,
		replyToId: ctx.replyToId
	});
	if (params.outbound.sendMedia) send.media = async (ctx) => toMessageSendResult(await params.outbound.sendMedia(ctx), {
		kind: ctx.audioAsVoice ? "voice" : "media",
		threadId: ctx.threadId,
		replyToId: ctx.replyToId
	});
	if (params.outbound.sendPayload) send.payload = async (ctx) => toMessageSendResult(await params.outbound.sendPayload(ctx), {
		kind: resolvePayloadReceiptKind(ctx),
		threadId: ctx.threadId,
		replyToId: ctx.replyToId
	});
	if (params.outbound.sendPoll) send.poll = async (ctx) => toMessageSendResult(await params.outbound.sendPoll(ctx), {
		kind: "poll",
		normalizeReceiptKind: true,
		threadId: ctx.threadId,
		replyToId: ctx.replyToId
	});
	return {
		...params.id ? { id: params.id } : {},
		durableFinal: { capabilities: params.capabilities ?? params.outbound.deliveryCapabilities?.durableFinal },
		send,
		...params.live ? { live: params.live } : {},
		receive: params.receive ?? defaultManualReceiveAdapter
	};
}
//#endregion
//#region src/channels/message/durable-receive.ts
function normalizeDurableInboundReceiveId(id) {
	const normalized = id.trim();
	if (!normalized) throw new Error("Durable inbound receive id cannot be empty");
	return normalized;
}
function sortPendingRecords(records) {
	return records.toSorted((a, b) => a.receivedAt - b.receivedAt || a.id.localeCompare(b.id));
}
function createDurableInboundReceiveJournal(options) {
	const now = options.now ?? Date.now;
	const accept = async (id, payload, acceptOptions) => {
		const key = normalizeDurableInboundReceiveId(id);
		const completed = await options.completedStore.lookup(key);
		if (completed) return {
			kind: "completed",
			duplicate: true,
			record: completed
		};
		const receivedAt = acceptOptions?.receivedAt ?? now();
		const record = {
			id: key,
			payload,
			receivedAt,
			updatedAt: receivedAt,
			attempts: 0
		};
		if (acceptOptions?.metadata !== void 0) record.metadata = acceptOptions.metadata;
		const acceptInsertedRecord = async () => {
			const completedAfterInsertRace = await options.completedStore.lookup(key);
			if (completedAfterInsertRace) {
				await options.pendingStore.delete(key);
				return {
					kind: "completed",
					duplicate: true,
					record: completedAfterInsertRace
				};
			}
			return {
				kind: "accepted",
				duplicate: false,
				record
			};
		};
		if (await options.pendingStore.registerIfAbsent(key, record, { ttlMs: options.pendingTtlMs })) return acceptInsertedRecord();
		const pending = await options.pendingStore.lookup(key);
		if (pending) return {
			kind: "pending",
			duplicate: true,
			record: pending
		};
		const completedAfterPendingRace = await options.completedStore.lookup(key);
		if (completedAfterPendingRace) return {
			kind: "completed",
			duplicate: true,
			record: completedAfterPendingRace
		};
		if (await options.pendingStore.registerIfAbsent(key, record, { ttlMs: options.pendingTtlMs })) return acceptInsertedRecord();
		return {
			kind: "pending",
			duplicate: true,
			record: await options.pendingStore.lookup(key) ?? record
		};
	};
	const pending = async () => {
		const entries = await options.pendingStore.entries();
		const records = [];
		for (const entry of entries) {
			if (await options.completedStore.lookup(entry.key)) {
				await options.pendingStore.delete(entry.key);
				continue;
			}
			records.push(entry.value);
		}
		return sortPendingRecords(records);
	};
	const complete = async (id, completeOptions) => {
		const key = normalizeDurableInboundReceiveId(id);
		const record = {
			id: key,
			completedAt: completeOptions?.completedAt ?? now()
		};
		if (completeOptions?.metadata !== void 0) record.metadata = completeOptions.metadata;
		await options.completedStore.register(key, record, { ttlMs: options.completedTtlMs });
		await options.pendingStore.delete(key);
	};
	const release = async (id, releaseOptions) => {
		const key = normalizeDurableInboundReceiveId(id);
		const record = await options.pendingStore.lookup(key);
		if (!record) return false;
		const releasedAt = releaseOptions?.releasedAt ?? now();
		const updated = {
			...record,
			updatedAt: releasedAt,
			attempts: record.attempts + 1,
			lastAttemptAt: releasedAt
		};
		if (releaseOptions?.lastError !== void 0) updated.lastError = releaseOptions.lastError;
		await options.pendingStore.register(key, updated, { ttlMs: options.pendingTtlMs });
		return true;
	};
	return {
		accept,
		pending,
		complete,
		release,
		deletePending: (id) => options.pendingStore.delete(normalizeDurableInboundReceiveId(id))
	};
}
//#endregion
//#region src/channels/message/types.ts
const durableFinalDeliveryCapabilities = [
	"text",
	"media",
	"poll",
	"payload",
	"silent",
	"replyTo",
	"thread",
	"nativeQuote",
	"messageSendingHooks",
	"batch",
	"reconcileUnknownSend",
	"afterSendSuccess",
	"afterCommit"
];
const channelMessageLiveCapabilities = [
	"draftPreview",
	"previewFinalization",
	"progressUpdates",
	"nativeStreaming",
	"quietFinalization"
];
const livePreviewFinalizerCapabilities = [
	"finalEdit",
	"normalFallback",
	"discardPending",
	"previewReceipt",
	"retainOnAmbiguousFailure"
];
const channelMessageReceiveAckPolicies = [
	"after_receive_record",
	"after_agent_dispatch",
	"after_durable_send",
	"manual"
];
//#endregion
//#region src/channels/message/contracts.ts
function listDeclaredDurableFinalCapabilities(capabilities) {
	return durableFinalDeliveryCapabilities.filter((capability) => capabilities?.[capability] === true);
}
function listDeclaredLivePreviewFinalizerCapabilities(capabilities) {
	return livePreviewFinalizerCapabilities.filter((capability) => capabilities?.[capability] === true);
}
function listDeclaredChannelMessageLiveCapabilities(capabilities) {
	return channelMessageLiveCapabilities.filter((capability) => capabilities?.[capability] === true);
}
function listDeclaredReceiveAckPolicies(receive) {
	const declared = receive?.supportedAckPolicies?.length ? receive.supportedAckPolicies : receive?.defaultAckPolicy ? [receive.defaultAckPolicy] : [];
	return channelMessageReceiveAckPolicies.filter((policy) => declared.includes(policy));
}
async function verifyDurableFinalCapabilityProofs(params) {
	const results = [];
	for (const capability of durableFinalDeliveryCapabilities) {
		if (params.capabilities?.[capability] !== true) {
			results.push({
				capability,
				status: "not_declared"
			});
			continue;
		}
		const proof = params.proofs[capability];
		if (!proof) throw new Error(`${params.adapterName} declares durable final capability "${capability}" without a contract proof`);
		await proof();
		results.push({
			capability,
			status: "verified"
		});
	}
	return results;
}
async function verifyLivePreviewFinalizerCapabilityProofs(params) {
	const results = [];
	for (const capability of livePreviewFinalizerCapabilities) {
		if (params.capabilities?.[capability] !== true) {
			results.push({
				capability,
				status: "not_declared"
			});
			continue;
		}
		const proof = params.proofs[capability];
		if (!proof) throw new Error(`${params.adapterName} declares live preview finalizer capability "${capability}" without a contract proof`);
		await proof();
		results.push({
			capability,
			status: "verified"
		});
	}
	return results;
}
async function verifyChannelMessageLiveCapabilityProofs(params) {
	const results = [];
	for (const capability of channelMessageLiveCapabilities) {
		if (params.capabilities?.[capability] !== true) {
			results.push({
				capability,
				status: "not_declared"
			});
			continue;
		}
		const proof = params.proofs[capability];
		if (!proof) throw new Error(`${params.adapterName} declares live capability "${capability}" without a contract proof`);
		await proof();
		results.push({
			capability,
			status: "verified"
		});
	}
	return results;
}
async function verifyChannelMessageReceiveAckPolicyProofs(params) {
	const declared = new Set(listDeclaredReceiveAckPolicies(params.receive));
	const results = [];
	for (const policy of channelMessageReceiveAckPolicies) {
		if (!declared.has(policy)) {
			results.push({
				policy,
				status: "not_declared"
			});
			continue;
		}
		const proof = params.proofs[policy];
		if (!proof) throw new Error(`${params.adapterName} declares receive ack policy "${policy}" without a contract proof`);
		await proof();
		results.push({
			policy,
			status: "verified"
		});
	}
	return results;
}
async function verifyChannelMessageAdapterCapabilityProofs(params) {
	return await verifyDurableFinalCapabilityProofs({
		adapterName: params.adapterName,
		capabilities: params.adapter.durableFinal?.capabilities,
		proofs: params.proofs
	});
}
async function verifyChannelMessageReceiveAckPolicyAdapterProofs(params) {
	return await verifyChannelMessageReceiveAckPolicyProofs({
		adapterName: params.adapterName,
		receive: params.adapter.receive,
		proofs: params.proofs
	});
}
async function verifyChannelMessageLiveFinalizerProofs(params) {
	return await verifyLivePreviewFinalizerCapabilityProofs({
		adapterName: params.adapterName,
		capabilities: params.adapter.live?.finalizer?.capabilities,
		proofs: params.proofs
	});
}
async function verifyChannelMessageLiveCapabilityAdapterProofs(params) {
	return await verifyChannelMessageLiveCapabilityProofs({
		adapterName: params.adapterName,
		capabilities: params.adapter.live?.capabilities,
		proofs: params.proofs
	});
}
//#endregion
//#region src/channels/message/receive.ts
const neverAbortedSignal = new AbortController().signal;
function shouldAckMessageAfterStage(policy, stage) {
	switch (policy) {
		case "after_receive_record": return stage === "receive_record";
		case "after_agent_dispatch": return stage === "agent_dispatch";
		case "after_durable_send": return stage === "durable_send";
		case "manual": return false;
	}
	return false;
}
function normalizeAckErrorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
function createMessageReceiveContext(params) {
	const ctx = {
		id: params.id,
		channel: params.channel,
		...params.accountId ? { accountId: params.accountId } : {},
		message: params.message,
		ackPolicy: params.ackPolicy ?? "after_receive_record",
		ackState: "pending",
		receivedAt: params.receivedAt ?? Date.now(),
		signal: params.signal ?? neverAbortedSignal,
		shouldAckAfter: (stage) => shouldAckMessageAfterStage(ctx.ackPolicy, stage),
		ack: async () => {
			if (ctx.ackState === "acked") return;
			await params.onAck?.();
			ctx.ackState = "acked";
			ctx.ackedAt = Date.now();
			delete ctx.nackErrorMessage;
		},
		nack: async (error) => {
			await params.onNack?.(error);
			ctx.ackState = "nacked";
			ctx.nackErrorMessage = normalizeAckErrorMessage(error);
		}
	};
	return ctx;
}
//#endregion
//#region src/channels/message/state.ts
function createDurableMessageStateRecord(params) {
	return {
		intent: params.intent,
		state: params.state ?? (params.receipt ? "sent" : "pending"),
		...params.receipt ? { receipt: params.receipt } : {},
		updatedAt: params.updatedAt ?? Date.now(),
		...params.error === void 0 ? {} : { errorMessage: normalizeErrorMessage(params.error) }
	};
}
function classifyDurableSendRecoveryState(params) {
	if (params.failed) return "failed";
	if (params.suppressed) return "suppressed";
	if (params.hasReceipt) return "sent";
	if (params.hasIntent && params.platformSendMayHaveStarted) return "unknown_after_send";
	return "pending";
}
function normalizeErrorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
//#endregion
//#region src/plugin-sdk/channel-outbound.ts
const deliverInboundReplyWithMessageSendContext = async (...args) => {
	return await (await import("./kernel-CoZVHQJx.js")).deliverInboundReplyWithMessageSendContext(...args);
};
async function sendDurableMessageBatch(params) {
	return await (await import("./runtime-DMKRRIvB.js")).sendDurableMessageBatch(params);
}
async function withDurableMessageSendContext(params, run) {
	return await (await import("./runtime-DMKRRIvB.js")).withDurableMessageSendContext(params, run);
}
//#endregion
export { defineChannelMessageAdapter as S, verifyChannelMessageReceiveAckPolicyProofs as _, createDurableMessageStateRecord as a, createDurableInboundReceiveJournal as b, listDeclaredChannelMessageLiveCapabilities as c, listDeclaredReceiveAckPolicies as d, verifyChannelMessageAdapterCapabilityProofs as f, verifyChannelMessageReceiveAckPolicyAdapterProofs as g, verifyChannelMessageLiveFinalizerProofs as h, classifyDurableSendRecoveryState as i, listDeclaredDurableFinalCapabilities as l, verifyChannelMessageLiveCapabilityProofs as m, sendDurableMessageBatch as n, createMessageReceiveContext as o, verifyChannelMessageLiveCapabilityAdapterProofs as p, withDurableMessageSendContext as r, shouldAckMessageAfterStage as s, deliverInboundReplyWithMessageSendContext as t, listDeclaredLivePreviewFinalizerCapabilities as u, verifyDurableFinalCapabilityProofs as v, createChannelMessageAdapterFromOutbound as x, verifyLivePreviewFinalizerCapabilityProofs as y };
