import { T as ReplyToMode } from "./types.base-DFyTixvq.js";
import { t as ReplyPayload } from "./reply-payload-DVcklM6x.js";
import { n as PluginStateKeyedStore } from "./plugin-state-store.types-D0kZmy8x.js";
import { A as LiveMessageState, C as DeriveDurableFinalDeliveryRequirementsParams, E as DurableFinalDeliveryRequirementMap, I as MessageReceiptPartKind, L as MessageReceiptSourceResult, M as LivePreviewFinalizerCapabilityMap, N as MessageDurabilityPolicy, O as DurableMessageSendIntent, P as MessageReceipt, R as MessageSendContext, _ as ChannelMessageSendPollContext, a as ChannelMessageLiveCapability, b as ChannelMessageSendTextContext, c as ChannelMessageReceiveAdapterShape, g as ChannelMessageSendPayloadContext, h as ChannelMessageSendMediaContext, i as ChannelMessageLiveAdapterShape, j as LivePreviewFinalizerCapability, n as ChannelMessageAdapterShape, s as ChannelMessageReceiveAckPolicy, t as ChannelMessageAdapter, w as DurableFinalDeliveryCapability, z as RenderedMessageBatch } from "./types-CxYxc234.js";
import { b as OutboundDeliveryResult } from "./outbound.types-BgikmK_M.js";
import { i as OutboundDeliveryIntent, t as DeliverOutboundPayloadsParams } from "./deliver-D7CBLySq.js";
import { n as kernel_d_exports } from "./kernel-Cr2adFnD.js";
//#region src/channels/message/send.d.ts
type DurableMessageBatchSendParams = Omit<DeliverOutboundPayloadsParams, "abortSignal" | "onDeliveryIntent" | "payloads" | "queuePolicy"> & {
  payloads: ReplyPayload[];
  attempt?: number;
  signal?: AbortSignal; /** @deprecated Use `signal`. */
  abortSignal?: AbortSignal;
  previousReceipt?: MessageReceipt;
};
type DurableMessageSuppressionReason = "cancelled_by_message_sending_hook" | "empty_after_message_sending_hook" | "no_visible_payload" | "adapter_returned_no_identity" | "no_visible_result";
type DurableMessageFailureStage = "platform_send" | "queue" | "unknown";
type DurableMessagePayloadDeliveryOutcome = {
  index: number;
  status: "sent";
  results: OutboundDeliveryResult[];
} | {
  index: number;
  status: "suppressed";
  reason: DurableMessageSuppressionReason;
  hookEffect?: {
    cancelReason?: string;
    metadata?: Record<string, unknown>;
  };
} | {
  index: number;
  status: "failed";
  error: unknown;
  sentBeforeError: boolean;
  stage: DurableMessageFailureStage;
};
type DurableMessageBatchSendResult = {
  status: "sent";
  results: OutboundDeliveryResult[];
  receipt: MessageReceipt;
  deliveryIntent?: OutboundDeliveryIntent;
  payloadOutcomes?: DurableMessagePayloadDeliveryOutcome[];
} | {
  status: "suppressed";
  results: [];
  receipt: MessageReceipt;
  deliveryIntent?: OutboundDeliveryIntent;
  reason: DurableMessageSuppressionReason;
  payloadOutcomes?: DurableMessagePayloadDeliveryOutcome[];
} | {
  status: "partial_failed";
  results: OutboundDeliveryResult[];
  receipt: MessageReceipt;
  error: unknown;
  sentBeforeError: true;
  deliveryIntent?: OutboundDeliveryIntent;
  payloadOutcomes?: DurableMessagePayloadDeliveryOutcome[];
} | {
  status: "failed";
  error: unknown;
  stage?: DurableMessageFailureStage;
  payloadOutcomes?: DurableMessagePayloadDeliveryOutcome[];
};
type DurableMessageSendContextParams = DurableMessageBatchSendParams & {
  durability?: Exclude<MessageDurabilityPolicy, "disabled">;
  preview?: LiveMessageState<ReplyPayload>;
  onPreviewUpdate?: (rendered: RenderedMessageBatch<ReplyPayload>, state: LiveMessageState<ReplyPayload>) => Promise<LiveMessageState<ReplyPayload>> | LiveMessageState<ReplyPayload>;
  onEditReceipt?: (receipt: MessageReceipt, rendered: RenderedMessageBatch<ReplyPayload>) => Promise<MessageReceipt> | MessageReceipt;
  onDeleteReceipt?: (receipt: MessageReceipt) => Promise<void> | void;
  onCommitReceipt?: (receipt: MessageReceipt) => Promise<void> | void;
  onSendFailure?: (error: unknown) => Promise<void> | void;
};
type DurableMessageSendContext = MessageSendContext<ReplyPayload, DurableMessageBatchSendResult>;
//#endregion
//#region src/channels/message/capabilities.d.ts
declare function deriveDurableFinalDeliveryRequirements(params: DeriveDurableFinalDeliveryRequirementsParams): DurableFinalDeliveryRequirementMap;
//#endregion
//#region src/channels/message/adapter.d.ts
declare const defaultManualReceiveAdapter: {
  readonly defaultAckPolicy: "manual";
  readonly supportedAckPolicies: readonly ["manual"];
};
type ChannelMessageAdapterWithDefaultReceive<TAdapter extends ChannelMessageAdapterShape> = TAdapter & {
  receive: TAdapter["receive"] extends undefined ? typeof defaultManualReceiveAdapter : NonNullable<TAdapter["receive"]>;
};
declare function defineChannelMessageAdapter<const TAdapter extends ChannelMessageAdapterShape>(adapter: TAdapter): ChannelMessageAdapter<ChannelMessageAdapterWithDefaultReceive<TAdapter>>;
//#endregion
//#region src/channels/message/outbound-bridge.d.ts
type ChannelMessageOutboundBridgeResult = MessageReceiptSourceResult & {
  receipt?: MessageReceipt;
  messageId?: string;
};
type ChannelMessageOutboundBridgeAdapter<TConfig = unknown> = {
  deliveryCapabilities?: {
    durableFinal?: DurableFinalDeliveryRequirementMap;
  };
  sendText?: (ctx: ChannelMessageSendTextContext<TConfig>) => Promise<ChannelMessageOutboundBridgeResult>;
  sendMedia?: (ctx: ChannelMessageSendMediaContext<TConfig>) => Promise<ChannelMessageOutboundBridgeResult>;
  sendPayload?: (ctx: ChannelMessageSendPayloadContext<TConfig>) => Promise<ChannelMessageOutboundBridgeResult>;
  sendPoll?: (ctx: ChannelMessageSendPollContext<TConfig>) => Promise<ChannelMessageOutboundBridgeResult>;
};
type CreateChannelMessageAdapterFromOutboundParams<TConfig = unknown> = {
  id?: string;
  outbound: ChannelMessageOutboundBridgeAdapter<TConfig>;
  capabilities?: DurableFinalDeliveryRequirementMap;
  live?: ChannelMessageLiveAdapterShape;
  receive?: ChannelMessageReceiveAdapterShape;
};
declare function createChannelMessageAdapterFromOutbound<TConfig = unknown>(params: CreateChannelMessageAdapterFromOutboundParams<TConfig>): ChannelMessageAdapterShape<TConfig>;
//#endregion
//#region src/channels/message/durable-receive.d.ts
type DurableInboundReceivePendingRecord<TPayload, TMetadata = unknown> = {
  id: string;
  payload: TPayload;
  metadata?: TMetadata;
  receivedAt: number;
  updatedAt: number;
  attempts: number;
  lastAttemptAt?: number;
  lastError?: string;
};
type DurableInboundReceiveCompletedRecord<TMetadata = unknown> = {
  id: string;
  completedAt: number;
  metadata?: TMetadata;
};
type DurableInboundReceiveAcceptResult<TPayload, TMetadata, TCompletedMetadata> = {
  kind: "accepted";
  duplicate: false;
  record: DurableInboundReceivePendingRecord<TPayload, TMetadata>;
} | {
  kind: "pending";
  duplicate: true;
  record: DurableInboundReceivePendingRecord<TPayload, TMetadata>;
} | {
  kind: "completed";
  duplicate: true;
  record: DurableInboundReceiveCompletedRecord<TCompletedMetadata>;
};
type DurableInboundReceiveJournalOptions<TPayload, TMetadata, TCompletedMetadata> = {
  pendingStore: PluginStateKeyedStore<DurableInboundReceivePendingRecord<TPayload, TMetadata>>;
  completedStore: PluginStateKeyedStore<DurableInboundReceiveCompletedRecord<TCompletedMetadata>>;
  now?: () => number;
  pendingTtlMs?: number;
  completedTtlMs?: number;
};
type DurableInboundReceiveAcceptOptions<TMetadata> = {
  metadata?: TMetadata;
  receivedAt?: number;
};
type DurableInboundReceiveCompleteOptions<TCompletedMetadata> = {
  metadata?: TCompletedMetadata;
  completedAt?: number;
};
type DurableInboundReceiveReleaseOptions = {
  lastError?: string;
  releasedAt?: number;
};
type DurableInboundReceiveJournal<TPayload, TMetadata, TCompletedMetadata> = {
  accept(id: string, payload: TPayload, options?: DurableInboundReceiveAcceptOptions<TMetadata>): Promise<DurableInboundReceiveAcceptResult<TPayload, TMetadata, TCompletedMetadata>>;
  pending(): Promise<Array<DurableInboundReceivePendingRecord<TPayload, TMetadata>>>;
  complete(id: string, options?: DurableInboundReceiveCompleteOptions<TCompletedMetadata>): Promise<void>;
  release(id: string, options?: DurableInboundReceiveReleaseOptions): Promise<boolean>;
  deletePending(id: string): Promise<boolean>;
};
declare function createDurableInboundReceiveJournal<TPayload, TMetadata = unknown, TCompletedMetadata = unknown>(options: DurableInboundReceiveJournalOptions<TPayload, TMetadata, TCompletedMetadata>): DurableInboundReceiveJournal<TPayload, TMetadata, TCompletedMetadata>;
//#endregion
//#region src/channels/message/contracts.d.ts
type DurableFinalCapabilityProof = () => Promise<void> | void;
type DurableFinalCapabilityProofMap = Partial<Record<DurableFinalDeliveryCapability, DurableFinalCapabilityProof>>;
type DurableFinalCapabilityProofResult = {
  capability: DurableFinalDeliveryCapability;
  status: "verified" | "not_declared";
};
type LivePreviewFinalizerCapabilityProof = () => Promise<void> | void;
type ChannelMessageLiveCapabilityProof = () => Promise<void> | void;
type ChannelMessageReceiveAckPolicyProof = () => Promise<void> | void;
type LivePreviewFinalizerCapabilityProofMap = Partial<Record<LivePreviewFinalizerCapability, LivePreviewFinalizerCapabilityProof>>;
type ChannelMessageLiveCapabilityProofMap = Partial<Record<ChannelMessageLiveCapability, ChannelMessageLiveCapabilityProof>>;
type ChannelMessageReceiveAckPolicyProofMap = Partial<Record<ChannelMessageReceiveAckPolicy, ChannelMessageReceiveAckPolicyProof>>;
type LivePreviewFinalizerCapabilityProofResult = {
  capability: LivePreviewFinalizerCapability;
  status: "verified" | "not_declared";
};
type ChannelMessageLiveCapabilityProofResult = {
  capability: ChannelMessageLiveCapability;
  status: "verified" | "not_declared";
};
type ChannelMessageReceiveAckPolicyProofResult = {
  policy: ChannelMessageReceiveAckPolicy;
  status: "verified" | "not_declared";
};
declare function listDeclaredDurableFinalCapabilities(capabilities: DurableFinalDeliveryRequirementMap | undefined): DurableFinalDeliveryCapability[];
declare function listDeclaredLivePreviewFinalizerCapabilities(capabilities: LivePreviewFinalizerCapabilityMap | undefined): LivePreviewFinalizerCapability[];
declare function listDeclaredChannelMessageLiveCapabilities(capabilities: Partial<Record<ChannelMessageLiveCapability, boolean>> | undefined): ChannelMessageLiveCapability[];
declare function listDeclaredReceiveAckPolicies(receive: ChannelMessageAdapterShape["receive"] | undefined): ChannelMessageReceiveAckPolicy[];
declare function verifyDurableFinalCapabilityProofs(params: {
  adapterName: string;
  capabilities?: DurableFinalDeliveryRequirementMap;
  proofs: DurableFinalCapabilityProofMap;
}): Promise<DurableFinalCapabilityProofResult[]>;
declare function verifyLivePreviewFinalizerCapabilityProofs(params: {
  adapterName: string;
  capabilities?: LivePreviewFinalizerCapabilityMap;
  proofs: LivePreviewFinalizerCapabilityProofMap;
}): Promise<LivePreviewFinalizerCapabilityProofResult[]>;
declare function verifyChannelMessageLiveCapabilityProofs(params: {
  adapterName: string;
  capabilities?: Partial<Record<ChannelMessageLiveCapability, boolean>>;
  proofs: ChannelMessageLiveCapabilityProofMap;
}): Promise<ChannelMessageLiveCapabilityProofResult[]>;
declare function verifyChannelMessageReceiveAckPolicyProofs(params: {
  adapterName: string;
  receive?: ChannelMessageAdapterShape["receive"];
  proofs: ChannelMessageReceiveAckPolicyProofMap;
}): Promise<ChannelMessageReceiveAckPolicyProofResult[]>;
declare function verifyChannelMessageAdapterCapabilityProofs(params: {
  adapterName: string;
  adapter: Pick<ChannelMessageAdapterShape, "durableFinal">;
  proofs: DurableFinalCapabilityProofMap;
}): Promise<DurableFinalCapabilityProofResult[]>;
declare function verifyChannelMessageReceiveAckPolicyAdapterProofs(params: {
  adapterName: string;
  adapter: Pick<ChannelMessageAdapterShape, "receive">;
  proofs: ChannelMessageReceiveAckPolicyProofMap;
}): Promise<ChannelMessageReceiveAckPolicyProofResult[]>;
declare function verifyChannelMessageLiveFinalizerProofs(params: {
  adapterName: string;
  adapter: Pick<ChannelMessageAdapterShape, "live">;
  proofs: LivePreviewFinalizerCapabilityProofMap;
}): Promise<LivePreviewFinalizerCapabilityProofResult[]>;
declare function verifyChannelMessageLiveCapabilityAdapterProofs(params: {
  adapterName: string;
  adapter: Pick<ChannelMessageAdapterShape, "live">;
  proofs: ChannelMessageLiveCapabilityProofMap;
}): Promise<ChannelMessageLiveCapabilityProofResult[]>;
//#endregion
//#region src/channels/message/receipt.d.ts
type MessageReceiptInputResult = MessageReceiptSourceResult & {
  receipt?: MessageReceipt;
};
declare function createMessageReceiptFromOutboundResults(params: {
  results: readonly MessageReceiptInputResult[];
  kind?: MessageReceiptPartKind;
  threadId?: string;
  replyToId?: string;
  sentAt?: number;
}): MessageReceipt;
declare function listMessageReceiptPlatformIds(receipt: MessageReceipt): string[];
declare function resolveMessageReceiptPrimaryId(receipt: MessageReceipt): string | undefined;
//#endregion
//#region src/channels/message/receive.d.ts
type MessageAckPolicy = ChannelMessageReceiveAckPolicy;
type MessageAckStage = "receive_record" | "agent_dispatch" | "durable_send" | "manual";
type MessageAckState = "pending" | "acked" | "nacked";
type MessageReceiveContext<TMessage = unknown> = {
  id: string;
  channel: string;
  accountId?: string;
  message: TMessage;
  ackPolicy: MessageAckPolicy;
  ackState: MessageAckState;
  ackedAt?: number;
  nackErrorMessage?: string;
  receivedAt: number;
  signal: AbortSignal;
  shouldAckAfter(stage: MessageAckStage): boolean;
  ack(): Promise<void>;
  nack(error: unknown): Promise<void>;
};
declare function shouldAckMessageAfterStage(policy: MessageAckPolicy, stage: MessageAckStage): boolean;
declare function createMessageReceiveContext<TMessage>(params: {
  id: string;
  channel: string;
  accountId?: string;
  message: TMessage;
  ackPolicy?: MessageAckPolicy;
  receivedAt?: number;
  signal?: AbortSignal;
  onAck?: () => Promise<void> | void;
  onNack?: (error: unknown) => Promise<void> | void;
}): MessageReceiveContext<TMessage>;
//#endregion
//#region src/channels/message/state.d.ts
type DurableMessageSendState = "pending" | "sent" | "suppressed" | "failed" | "unknown_after_send";
type DurableMessageStateRecord = {
  intent: DurableMessageSendIntent;
  state: DurableMessageSendState;
  receipt?: MessageReceipt;
  updatedAt: number;
  errorMessage?: string;
};
declare function createDurableMessageStateRecord(params: {
  intent: DurableMessageSendIntent;
  state?: DurableMessageSendState;
  receipt?: MessageReceipt;
  updatedAt?: number;
  error?: unknown;
}): DurableMessageStateRecord;
declare function classifyDurableSendRecoveryState(params: {
  hasIntent: boolean;
  hasReceipt: boolean;
  platformSendMayHaveStarted: boolean;
  failed?: boolean;
  suppressed?: boolean;
}): DurableMessageSendState;
//#endregion
//#region src/infra/outbound/reply-policy.d.ts
type ReplyToResolution = {
  replyToId?: string;
  source?: "explicit" | "implicit";
};
declare function createReplyToFanout(params: {
  replyToId?: string | null;
  replyToMode?: ReplyToMode;
  replyToIdSource?: ReplyToResolution["source"];
}): () => string | undefined;
//#endregion
//#region src/plugin-sdk/channel-outbound.d.ts
type ChannelInboundKernelModule = typeof kernel_d_exports;
declare const deliverInboundReplyWithMessageSendContext: ChannelInboundKernelModule["deliverInboundReplyWithMessageSendContext"];
declare function sendDurableMessageBatch(params: DurableMessageSendContextParams): Promise<DurableMessageBatchSendResult>;
declare function withDurableMessageSendContext<T>(params: DurableMessageSendContextParams, run: (ctx: DurableMessageSendContext) => Promise<T>): Promise<T>;
//#endregion
export { ChannelMessageOutboundBridgeResult as $, LivePreviewFinalizerCapabilityProofResult as A, verifyChannelMessageReceiveAckPolicyProofs as B, ChannelMessageReceiveAckPolicyProofMap as C, DurableFinalCapabilityProofResult as D, DurableFinalCapabilityProofMap as E, verifyChannelMessageAdapterCapabilityProofs as F, DurableInboundReceiveCompleteOptions as G, verifyLivePreviewFinalizerCapabilityProofs as H, verifyChannelMessageLiveCapabilityAdapterProofs as I, DurableInboundReceiveJournalOptions as J, DurableInboundReceiveCompletedRecord as K, verifyChannelMessageLiveCapabilityProofs as L, listDeclaredDurableFinalCapabilities as M, listDeclaredLivePreviewFinalizerCapabilities as N, LivePreviewFinalizerCapabilityProof as O, listDeclaredReceiveAckPolicies as P, ChannelMessageOutboundBridgeAdapter as Q, verifyChannelMessageLiveFinalizerProofs as R, ChannelMessageReceiveAckPolicyProof as S, DurableFinalCapabilityProof as T, DurableInboundReceiveAcceptOptions as U, verifyDurableFinalCapabilityProofs as V, DurableInboundReceiveAcceptResult as W, DurableInboundReceiveReleaseOptions as X, DurableInboundReceivePendingRecord as Y, createDurableInboundReceiveJournal as Z, listMessageReceiptPlatformIds as _, createReplyToFanout as a, DurableMessageBatchSendResult as at, ChannelMessageLiveCapabilityProofMap as b, classifyDurableSendRecoveryState as c, MessageAckStage as d, CreateChannelMessageAdapterFromOutboundParams as et, MessageAckState as f, createMessageReceiptFromOutboundResults as g, shouldAckMessageAfterStage as h, ReplyToResolution as i, DurableMessageBatchSendParams as it, listDeclaredChannelMessageLiveCapabilities as j, LivePreviewFinalizerCapabilityProofMap as k, createDurableMessageStateRecord as l, createMessageReceiveContext as m, sendDurableMessageBatch as n, defineChannelMessageAdapter as nt, DurableMessageSendState as o, DurableMessageSendContext as ot, MessageReceiveContext as p, DurableInboundReceiveJournal as q, withDurableMessageSendContext as r, deriveDurableFinalDeliveryRequirements as rt, DurableMessageStateRecord as s, DurableMessageSendContextParams as st, deliverInboundReplyWithMessageSendContext as t, createChannelMessageAdapterFromOutbound as tt, MessageAckPolicy as u, resolveMessageReceiptPrimaryId as v, ChannelMessageReceiveAckPolicyProofResult as w, ChannelMessageLiveCapabilityProofResult as x, ChannelMessageLiveCapabilityProof as y, verifyChannelMessageReceiveAckPolicyAdapterProofs as z };