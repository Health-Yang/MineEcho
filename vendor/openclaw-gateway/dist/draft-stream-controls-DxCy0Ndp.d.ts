import { A as LiveMessageState, P as MessageReceipt, z as RenderedMessageBatch } from "./types-CxYxc234.js";

//#region src/channels/message/live.d.ts
type LivePreviewFinalizerDraft<TId> = {
  flush: () => Promise<void>;
  id: () => TId | undefined;
  seal?: () => Promise<void>;
  discardPending?: () => Promise<void>;
  clear: () => Promise<void>;
};
type LivePreviewFinalizerResultKind = "normal-delivered" | "normal-skipped" | "preview-finalized" | "preview-retained";
type LivePreviewFinalizerResult<TPayload> = {
  kind: LivePreviewFinalizerResultKind;
  liveState?: LiveMessageState<TPayload>;
};
type FinalizableLivePreviewAdapter<TPayload, TId, TEdit> = {
  draft?: LivePreviewFinalizerDraft<TId>;
  buildFinalEdit: (payload: TPayload) => TEdit | undefined;
  editFinal: (id: TId, edit: TEdit) => Promise<void>;
  resolveFinalizedId?: (id: TId, edit: TEdit) => TId | undefined;
  createPreviewReceipt?: (id: TId, edit: TEdit) => MessageReceipt;
  onPreviewFinalized?: (id: TId, receipt: MessageReceipt, liveState: LiveMessageState<TPayload>) => Promise<void> | void;
  buildSupplementalPayload?: (payload: TPayload) => TPayload | undefined;
  deliverSupplemental?: (payload: TPayload) => Promise<boolean | void>;
  handlePreviewEditError?: (params: {
    error: unknown;
    id: TId;
    edit: TEdit;
    payload: TPayload;
    liveState: LiveMessageState<TPayload>;
  }) => "fallback" | "retain" | Promise<"fallback" | "retain">;
  logPreviewEditFailure?: (error: unknown) => void;
};
declare function defineFinalizableLivePreviewAdapter<TPayload, TId, TEdit>(adapter: FinalizableLivePreviewAdapter<TPayload, TId, TEdit>): FinalizableLivePreviewAdapter<TPayload, TId, TEdit>;
declare function createLiveMessageState<TPayload = unknown>(params?: {
  receipt?: MessageReceipt;
  lastRendered?: RenderedMessageBatch<TPayload>;
  canFinalizeInPlace?: boolean;
}): LiveMessageState<TPayload>;
declare function markLiveMessageFinalized<TPayload>(state: LiveMessageState<TPayload>, receipt: MessageReceipt): LiveMessageState<TPayload>;
declare function createPreviewMessageReceipt(params: {
  id: unknown;
  threadId?: string;
  replyToId?: string;
  sentAt?: number;
  raw?: unknown;
}): MessageReceipt;
declare function deliverFinalizableLivePreview<TPayload, TId, TEdit>(params: {
  kind: "tool" | "block" | "final";
  payload: TPayload;
  liveState?: LiveMessageState<TPayload>;
  draft?: LivePreviewFinalizerDraft<TId>;
  buildFinalEdit: (payload: TPayload) => TEdit | undefined;
  editFinal: (id: TId, edit: TEdit) => Promise<void>;
  resolveFinalizedId?: (id: TId, edit: TEdit) => TId | undefined;
  deliverNormally: (payload: TPayload) => Promise<boolean | void>;
  createPreviewReceipt?: (id: TId, edit: TEdit) => MessageReceipt;
  onPreviewFinalized?: (id: TId, receipt: MessageReceipt, liveState: LiveMessageState<TPayload>) => Promise<void> | void;
  buildSupplementalPayload?: (payload: TPayload) => TPayload | undefined;
  deliverSupplemental?: (payload: TPayload) => Promise<boolean | void>;
  handlePreviewEditError?: (params: {
    error: unknown;
    id: TId;
    edit: TEdit;
    payload: TPayload;
    liveState: LiveMessageState<TPayload>;
  }) => "fallback" | "retain" | Promise<"fallback" | "retain">;
  onNormalDelivered?: () => Promise<void> | void;
  logPreviewEditFailure?: (error: unknown) => void;
}): Promise<LivePreviewFinalizerResult<TPayload>>;
declare function deliverWithFinalizableLivePreviewAdapter<TPayload, TId, TEdit>(params: {
  kind: "tool" | "block" | "final";
  payload: TPayload;
  liveState?: LiveMessageState<TPayload>;
  adapter?: FinalizableLivePreviewAdapter<TPayload, TId, TEdit>;
  deliverNormally: (payload: TPayload) => Promise<boolean | void>;
  onNormalDelivered?: () => Promise<void> | void;
}): Promise<LivePreviewFinalizerResult<TPayload>>;
declare function markLiveMessagePreviewUpdated<TPayload>(state: LiveMessageState<TPayload>, rendered: RenderedMessageBatch<TPayload>): LiveMessageState<TPayload>;
declare function markLiveMessageCancelled<TPayload>(state: LiveMessageState<TPayload>): LiveMessageState<TPayload>;
//#endregion
//#region src/channels/draft-stream-loop.d.ts
type DraftStreamLoop = {
  update: (text: string) => void;
  flush: () => Promise<void>;
  stop: () => void;
  resetPending: () => void;
  resetThrottleWindow: () => void;
  waitForInFlight: () => Promise<void>;
};
declare function createDraftStreamLoop(params: {
  throttleMs: number;
  isStopped: () => boolean;
  sendOrEditStreamMessage: (text: string) => Promise<void | boolean>;
  onBackgroundFlushError?: (err: unknown) => void;
}): DraftStreamLoop;
//#endregion
//#region src/channels/draft-stream-controls.d.ts
type FinalizableDraftStreamState = {
  stopped: boolean;
  final: boolean;
};
type StopAndClearMessageIdParams<T> = {
  stopForClear: () => Promise<void>;
  readMessageId: () => T | undefined;
  clearMessageId: () => void;
};
type ClearFinalizableDraftMessageParams<T> = StopAndClearMessageIdParams<T> & {
  isValidMessageId: (value: unknown) => value is T;
  deleteMessage: (messageId: T) => Promise<void>;
  onDeleteSuccess?: (messageId: T) => void;
  warn?: (message: string) => void;
  warnPrefix: string;
};
type FinalizableDraftLifecycleParams<T> = Omit<ClearFinalizableDraftMessageParams<T>, "stopForClear"> & {
  throttleMs: number;
  state: FinalizableDraftStreamState;
  sendOrEditStreamMessage: (text: string) => Promise<boolean>;
};
declare function createFinalizableDraftStreamControls(params: {
  throttleMs: number;
  isStopped: () => boolean;
  isFinal: () => boolean;
  markStopped: () => void;
  markFinal: () => void;
  sendOrEditStreamMessage: (text: string) => Promise<boolean>;
}): {
  loop: DraftStreamLoop;
  update: (text: string) => void;
  stop: () => Promise<void>;
  seal: () => Promise<void>;
  discardPending: () => Promise<void>;
  stopForClear: () => Promise<void>;
};
declare function createFinalizableDraftStreamControlsForState(params: {
  throttleMs: number;
  state: FinalizableDraftStreamState;
  sendOrEditStreamMessage: (text: string) => Promise<boolean>;
}): {
  loop: DraftStreamLoop;
  update: (text: string) => void;
  stop: () => Promise<void>;
  seal: () => Promise<void>;
  discardPending: () => Promise<void>;
  stopForClear: () => Promise<void>;
};
declare function takeMessageIdAfterStop<T>(params: StopAndClearMessageIdParams<T>): Promise<T | undefined>;
declare function clearFinalizableDraftMessage<T>(params: ClearFinalizableDraftMessageParams<T>): Promise<void>;
declare function createFinalizableDraftLifecycle<T>(params: FinalizableDraftLifecycleParams<T>): {
  clear: () => Promise<void>;
  loop: DraftStreamLoop;
  update: (text: string) => void;
  stop: () => Promise<void>;
  seal: () => Promise<void>;
  discardPending: () => Promise<void>;
  stopForClear: () => Promise<void>;
};
//#endregion
export { deliverWithFinalizableLivePreviewAdapter as _, createFinalizableDraftStreamControlsForState as a, markLiveMessagePreviewUpdated as b, createDraftStreamLoop as c, LivePreviewFinalizerResult as d, LivePreviewFinalizerResultKind as f, deliverFinalizableLivePreview as g, defineFinalizableLivePreviewAdapter as h, createFinalizableDraftStreamControls as i, FinalizableLivePreviewAdapter as l, createPreviewMessageReceipt as m, clearFinalizableDraftMessage as n, takeMessageIdAfterStop as o, createLiveMessageState as p, createFinalizableDraftLifecycle as r, DraftStreamLoop as s, FinalizableDraftStreamState as t, LivePreviewFinalizerDraft as u, markLiveMessageCancelled as v, markLiveMessageFinalized as y };