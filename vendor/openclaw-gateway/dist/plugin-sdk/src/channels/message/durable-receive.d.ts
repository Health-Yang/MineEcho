import type { PluginStateKeyedStore } from "../../plugin-state/plugin-state-store.types.js";
export type DurableInboundReceivePendingRecord<TPayload, TMetadata = unknown> = {
    id: string;
    payload: TPayload;
    metadata?: TMetadata;
    receivedAt: number;
    updatedAt: number;
    attempts: number;
    lastAttemptAt?: number;
    lastError?: string;
};
export type DurableInboundReceiveCompletedRecord<TMetadata = unknown> = {
    id: string;
    completedAt: number;
    metadata?: TMetadata;
};
export type DurableInboundReceiveAcceptResult<TPayload, TMetadata, TCompletedMetadata> = {
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
export type DurableInboundReceiveJournalOptions<TPayload, TMetadata, TCompletedMetadata> = {
    pendingStore: PluginStateKeyedStore<DurableInboundReceivePendingRecord<TPayload, TMetadata>>;
    completedStore: PluginStateKeyedStore<DurableInboundReceiveCompletedRecord<TCompletedMetadata>>;
    now?: () => number;
    pendingTtlMs?: number;
    completedTtlMs?: number;
};
export type DurableInboundReceiveAcceptOptions<TMetadata> = {
    metadata?: TMetadata;
    receivedAt?: number;
};
export type DurableInboundReceiveCompleteOptions<TCompletedMetadata> = {
    metadata?: TCompletedMetadata;
    completedAt?: number;
};
export type DurableInboundReceiveReleaseOptions = {
    lastError?: string;
    releasedAt?: number;
};
export type DurableInboundReceiveJournal<TPayload, TMetadata, TCompletedMetadata> = {
    accept(id: string, payload: TPayload, options?: DurableInboundReceiveAcceptOptions<TMetadata>): Promise<DurableInboundReceiveAcceptResult<TPayload, TMetadata, TCompletedMetadata>>;
    pending(): Promise<Array<DurableInboundReceivePendingRecord<TPayload, TMetadata>>>;
    complete(id: string, options?: DurableInboundReceiveCompleteOptions<TCompletedMetadata>): Promise<void>;
    release(id: string, options?: DurableInboundReceiveReleaseOptions): Promise<boolean>;
    deletePending(id: string): Promise<boolean>;
};
export declare function createDurableInboundReceiveJournal<TPayload, TMetadata = unknown, TCompletedMetadata = unknown>(options: DurableInboundReceiveJournalOptions<TPayload, TMetadata, TCompletedMetadata>): DurableInboundReceiveJournal<TPayload, TMetadata, TCompletedMetadata>;
