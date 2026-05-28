import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { f as InteractiveReplyButton } from "./reply-payload-DVcklM6x.js";
import { l as ExecApprovalResolved, o as ExecApprovalDecision, s as ExecApprovalRequest, ut as CommandExplanationSummary } from "./exec-approvals-B9y4j5Wc.js";
import { _ as PluginApprovalRequest, y as PluginApprovalResolved } from "./plugin-approvals-DN5EVMBt.js";
import { i as GatewayReconnectPausedInfo } from "./client-B8QjRe_m.js";

//#region src/infra/approval-types.d.ts
type ChannelApprovalKind = "exec" | "plugin";
//#endregion
//#region src/channels/plugins/approval-native.types.d.ts
type ChannelApprovalNativeSurface = "origin" | "approver-dm";
type ChannelApprovalNativeTarget = {
  to: string;
  threadId?: string | number | null;
};
type ChannelApprovalNativeDeliveryPreference = ChannelApprovalNativeSurface | "both";
type ChannelApprovalNativeRequest = ExecApprovalRequest | PluginApprovalRequest;
type ChannelApprovalNativeDeliveryCapabilities = {
  enabled: boolean;
  preferredSurface: ChannelApprovalNativeDeliveryPreference;
  supportsOriginSurface: boolean;
  supportsApproverDmSurface: boolean;
  notifyOriginWhenDmOnly?: boolean;
};
type ChannelApprovalNativeAdapter = {
  describeDeliveryCapabilities: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    approvalKind: ChannelApprovalKind;
    request: ChannelApprovalNativeRequest;
  }) => ChannelApprovalNativeDeliveryCapabilities;
  resolveOriginTarget?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    approvalKind: ChannelApprovalKind;
    request: ChannelApprovalNativeRequest;
  }) => ChannelApprovalNativeTarget | null | Promise<ChannelApprovalNativeTarget | null>;
  resolveApproverDmTargets?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    approvalKind: ChannelApprovalKind;
    request: ChannelApprovalNativeRequest;
  }) => ChannelApprovalNativeTarget[] | Promise<ChannelApprovalNativeTarget[]>;
};
//#endregion
//#region src/infra/approval-native-delivery.d.ts
type ApprovalRequest$3 = ExecApprovalRequest | PluginApprovalRequest;
type ChannelApprovalNativePlannedTarget = {
  surface: ChannelApprovalNativeSurface;
  target: ChannelApprovalNativeTarget;
  reason: "preferred" | "fallback";
};
type ChannelApprovalNativeDeliveryPlan = {
  targets: ChannelApprovalNativePlannedTarget[];
  originTarget: ChannelApprovalNativeTarget | null;
  notifyOriginWhenDmOnly: boolean;
};
declare function resolveChannelNativeApprovalDeliveryPlan(params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
  approvalKind: ChannelApprovalKind;
  request: ApprovalRequest$3;
  adapter?: ChannelApprovalNativeAdapter | null;
}): Promise<ChannelApprovalNativeDeliveryPlan>;
//#endregion
//#region src/infra/approval-native-runtime-types.d.ts
type PreparedChannelNativeApprovalTarget<TPreparedTarget> = {
  dedupeKey: string;
  target: TPreparedTarget;
};
type ChannelNativeApprovalTransportSpec<TPendingEntry, TPreparedTarget, TPendingContent, TRequest> = {
  prepareTarget: (params: {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    request: TRequest;
    approvalKind: ChannelApprovalKind;
    pendingContent: TPendingContent;
  }) => PreparedChannelNativeApprovalTarget<TPreparedTarget> | null | Promise<PreparedChannelNativeApprovalTarget<TPreparedTarget> | null>;
  deliverTarget: (params: {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: TPreparedTarget;
    request: TRequest;
    approvalKind: ChannelApprovalKind;
    pendingContent: TPendingContent;
  }) => TPendingEntry | null | Promise<TPendingEntry | null>;
};
type ChannelNativeApprovalDeliveryCallbacks<TPendingEntry, TPreparedTarget, TPendingContent, TRequest> = {
  onDeliveryError?: (params: {
    error: unknown;
    plannedTarget: ChannelApprovalNativePlannedTarget;
    request: TRequest;
    approvalKind: ChannelApprovalKind;
    pendingContent: TPendingContent;
  }) => void;
  onDuplicateSkipped?: (params: {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: PreparedChannelNativeApprovalTarget<TPreparedTarget>;
    request: TRequest;
    approvalKind: ChannelApprovalKind;
    pendingContent: TPendingContent;
  }) => void;
  onDelivered?: (params: {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: PreparedChannelNativeApprovalTarget<TPreparedTarget>;
    request: TRequest;
    approvalKind: ChannelApprovalKind;
    pendingContent: TPendingContent;
    entry: TPendingEntry;
  }) => void;
};
//#endregion
//#region src/infra/exec-approval-channel-runtime.types.d.ts
type ApprovalRequestEvent$1 = ExecApprovalRequest | PluginApprovalRequest;
type ApprovalResolvedEvent$1 = ExecApprovalResolved | PluginApprovalResolved;
type ExecApprovalChannelRuntimeEventKind = "exec" | "plugin";
type ExecApprovalChannelRuntimeAdapter<TPending, TRequest extends ApprovalRequestEvent$1 = ExecApprovalRequest, TResolved extends ApprovalResolvedEvent$1 = ExecApprovalResolved> = {
  label: string;
  clientDisplayName: string;
  cfg: OpenClawConfig;
  gatewayUrl?: string;
  eventKinds?: readonly ExecApprovalChannelRuntimeEventKind[];
  isConfigured: () => boolean;
  shouldHandle: (request: TRequest) => boolean;
  deliverRequested: (request: TRequest) => Promise<TPending[]>;
  beforeGatewayClientStart?: () => Promise<void> | void;
  finalizeResolved: (params: {
    request: TRequest;
    resolved: TResolved;
    entries: TPending[];
  }) => Promise<void>;
  finalizeExpired?: (params: {
    request: TRequest;
    entries: TPending[];
  }) => Promise<void>;
  onStopped?: () => Promise<void> | void;
  nowMs?: () => number;
};
type ExecApprovalChannelRuntime<TRequest extends ApprovalRequestEvent$1 = ExecApprovalRequest, TResolved extends ApprovalResolvedEvent$1 = ExecApprovalResolved> = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  handleRequested: (request: TRequest) => Promise<void>;
  handleResolved: (resolved: TResolved) => Promise<void>;
  handleExpired: (approvalId: string) => Promise<void>;
  request: <T = unknown>(method: string, params: Record<string, unknown>) => Promise<T>;
};
//#endregion
//#region src/infra/exec-approval-channel-runtime.d.ts
type ApprovalRequestEvent = ExecApprovalRequest | PluginApprovalRequest;
type ApprovalResolvedEvent = ExecApprovalResolved | PluginApprovalResolved;
declare class ExecApprovalChannelRuntimeTerminalStartError extends Error {
  readonly detailCode: string | null;
  constructor(info: GatewayReconnectPausedInfo, cause?: unknown);
}
declare function isExecApprovalChannelRuntimeTerminalStartError(error: unknown): error is ExecApprovalChannelRuntimeTerminalStartError;
declare function createExecApprovalChannelRuntime<TPending, TRequest extends ApprovalRequestEvent = ExecApprovalRequest, TResolved extends ApprovalResolvedEvent = ExecApprovalResolved>(adapter: ExecApprovalChannelRuntimeAdapter<TPending, TRequest, TResolved>): ExecApprovalChannelRuntime<TRequest, TResolved>;
//#endregion
//#region src/infra/approval-native-runtime.d.ts
type ApprovalRequest$2 = ExecApprovalRequest | PluginApprovalRequest;
type ApprovalResolved$1 = ExecApprovalResolved | PluginApprovalResolved;
type ChannelNativeApprovalPlanDeliveryResult<TPendingEntry> = {
  entries: TPendingEntry[];
  deliveryPlan: ChannelApprovalNativeDeliveryPlan;
  deliveredTargets: ChannelApprovalNativePlannedTarget[];
};
declare function deliverApprovalRequestViaChannelNativePlan<TPreparedTarget, TPendingEntry, TRequest extends ApprovalRequest$2 = ApprovalRequest$2>(params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
  approvalKind: ChannelApprovalKind;
  request: TRequest;
  adapter?: ChannelApprovalNativeAdapter | null;
  prepareTarget: (params: {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    request: TRequest;
  }) => PreparedChannelNativeApprovalTarget<TPreparedTarget> | null | Promise<PreparedChannelNativeApprovalTarget<TPreparedTarget> | null>;
  deliverTarget: (params: {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: TPreparedTarget;
    request: TRequest;
  }) => TPendingEntry | null | Promise<TPendingEntry | null>;
  onDeliveryError?: (params: {
    error: unknown;
    plannedTarget: ChannelApprovalNativePlannedTarget;
    request: TRequest;
  }) => void;
  onDuplicateSkipped?: (params: {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: PreparedChannelNativeApprovalTarget<TPreparedTarget>;
    request: TRequest;
  }) => void;
  onDelivered?: (params: {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: PreparedChannelNativeApprovalTarget<TPreparedTarget>;
    request: TRequest;
    entry: TPendingEntry;
  }) => void;
}): Promise<ChannelNativeApprovalPlanDeliveryResult<TPendingEntry>>;
type ChannelNativeApprovalRuntimeAdapter<TPendingEntry, TPreparedTarget, TPendingContent, TRequest extends ApprovalRequest$2 = ApprovalRequest$2, TResolved extends ApprovalResolved$1 = ApprovalResolved$1> = Omit<ExecApprovalChannelRuntimeAdapter<TPendingEntry, TRequest, TResolved>, "deliverRequested"> & ChannelNativeApprovalTransportSpec<TPendingEntry, TPreparedTarget, TPendingContent, TRequest> & ChannelNativeApprovalDeliveryCallbacks<TPendingEntry, TPreparedTarget, TPendingContent, TRequest> & {
  channel?: string;
  channelLabel?: string;
  accountId?: string | null;
  nativeAdapter?: ChannelApprovalNativeAdapter | null;
  resolveApprovalKind?: (request: TRequest) => ChannelApprovalKind;
  buildPendingContent: (params: {
    request: TRequest;
    approvalKind: ChannelApprovalKind;
    nowMs: number;
  }) => TPendingContent | Promise<TPendingContent>;
  onStopped?: () => Promise<void> | void;
};
declare function createChannelNativeApprovalRuntime<TPendingEntry, TPreparedTarget, TPendingContent, TRequest extends ApprovalRequest$2 = ApprovalRequest$2, TResolved extends ApprovalResolved$1 = ApprovalResolved$1>(adapter: ChannelNativeApprovalRuntimeAdapter<TPendingEntry, TPreparedTarget, TPendingContent, TRequest, TResolved>): ExecApprovalChannelRuntime<TRequest, TResolved>;
//#endregion
//#region src/infra/approval-view-model.types.d.ts
type ApprovalPhase = "pending" | "resolved" | "expired";
type ApprovalDecisionActionView = {
  kind: "decision";
  decision: ExecApprovalDecision;
  label: string;
  style: NonNullable<InteractiveReplyButton["style"]>;
  command: string;
};
type ApprovalCommandActionView = {
  kind: "command";
  label: string;
  style: NonNullable<InteractiveReplyButton["style"]>;
  command: string;
};
type ApprovalActionView = ApprovalDecisionActionView | ApprovalCommandActionView;
type ApprovalMetadataView = {
  label: string;
  value: string;
};
type ApprovalViewBase = {
  approvalId: string;
  approvalKind: ChannelApprovalKind;
  phase: ApprovalPhase;
  title: string;
  description?: string | null;
  metadata: ApprovalMetadataView[];
};
type ExecApprovalViewBase = ApprovalViewBase & {
  approvalKind: "exec";
  ask?: string | null;
  agentId?: string | null;
  warningText?: string | null;
  commandAnalysis?: CommandExplanationSummary | null;
  commandText: string;
  commandPreview?: string | null;
  cwd?: string | null;
  envKeys?: readonly string[];
  host?: string | null;
  nodeId?: string | null;
  sessionKey?: string | null;
};
type ExecApprovalPendingView = ExecApprovalViewBase & {
  phase: "pending";
  actions: ApprovalActionView[];
  expiresAtMs: number;
};
type ExecApprovalResolvedView = ExecApprovalViewBase & {
  phase: "resolved";
  decision: ExecApprovalDecision;
  resolvedBy?: string | null;
};
type ExecApprovalExpiredView = ExecApprovalViewBase & {
  phase: "expired";
};
type PluginApprovalViewBase = ApprovalViewBase & {
  approvalKind: "plugin";
  agentId?: string | null;
  pluginId?: string | null;
  toolName?: string | null;
  severity: "info" | "warning" | "critical";
};
type PluginApprovalPendingView = PluginApprovalViewBase & {
  phase: "pending";
  actions: ApprovalActionView[];
  expiresAtMs: number;
};
type PluginApprovalResolvedView = PluginApprovalViewBase & {
  phase: "resolved";
  decision: ExecApprovalDecision;
  resolvedBy?: string | null;
};
type PluginApprovalExpiredView = PluginApprovalViewBase & {
  phase: "expired";
};
type PendingApprovalView = ExecApprovalPendingView | PluginApprovalPendingView;
type ResolvedApprovalView = ExecApprovalResolvedView | PluginApprovalResolvedView;
type ExpiredApprovalView = ExecApprovalExpiredView | PluginApprovalExpiredView;
type ApprovalViewModel = PendingApprovalView | ResolvedApprovalView | ExpiredApprovalView;
type ApprovalRequest$1 = ExecApprovalRequest | PluginApprovalRequest;
//#endregion
//#region src/infra/approval-handler-runtime-types.d.ts
type ApprovalRequest = ExecApprovalRequest | PluginApprovalRequest;
type ApprovalResolved = ExecApprovalResolved | PluginApprovalResolved;
type ChannelApprovalCapabilityHandlerContext = {
  cfg: OpenClawConfig;
  accountId?: string | null;
  gatewayUrl?: string;
  context?: unknown;
};
type ChannelApprovalNativeFinalAction<TPayload> = {
  kind: "update";
  payload: TPayload;
} | {
  kind: "delete";
} | {
  kind: "clear-actions";
} | {
  kind: "leave";
};
type ChannelApprovalNativeAvailabilityAdapter = {
  isConfigured: (params: ChannelApprovalCapabilityHandlerContext) => boolean;
  shouldHandle: (params: ChannelApprovalCapabilityHandlerContext & {
    request: ApprovalRequest;
  }) => boolean;
};
type ChannelApprovalNativePresentationAdapter<TPendingPayload = unknown, TFinalPayload = unknown> = {
  buildPendingPayload: (params: ChannelApprovalCapabilityHandlerContext & {
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
    nowMs: number;
    view: PendingApprovalView;
  }) => TPendingPayload | Promise<TPendingPayload>;
  buildResolvedResult: (params: ChannelApprovalCapabilityHandlerContext & {
    request: ApprovalRequest;
    resolved: ApprovalResolved;
    view: ResolvedApprovalView;
    entry: unknown;
  }) => ChannelApprovalNativeFinalAction<TFinalPayload> | Promise<ChannelApprovalNativeFinalAction<TFinalPayload>>;
  buildExpiredResult: (params: ChannelApprovalCapabilityHandlerContext & {
    request: ApprovalRequest;
    view: ExpiredApprovalView;
    entry: unknown;
  }) => ChannelApprovalNativeFinalAction<TFinalPayload> | Promise<ChannelApprovalNativeFinalAction<TFinalPayload>>;
};
type ChannelApprovalNativeTransportAdapterForView<TPreparedTarget = unknown, TPendingEntry = unknown, TPendingPayload = unknown, TFinalPayload = unknown, TPendingView extends PendingApprovalView = PendingApprovalView> = {
  prepareTarget: (params: ChannelApprovalCapabilityHandlerContext & {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
    view: TPendingView;
    pendingPayload: TPendingPayload;
  }) => PreparedChannelNativeApprovalTarget<TPreparedTarget> | null | Promise<PreparedChannelNativeApprovalTarget<TPreparedTarget> | null>;
  deliverPending: (params: ChannelApprovalCapabilityHandlerContext & {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: TPreparedTarget;
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
    view: TPendingView;
    pendingPayload: TPendingPayload;
  }) => TPendingEntry | null | Promise<TPendingEntry | null>;
  updateEntry?: (params: ChannelApprovalCapabilityHandlerContext & {
    entry: TPendingEntry;
    payload: TFinalPayload;
    phase: "resolved" | "expired";
  }) => Promise<void>;
  deleteEntry?: (params: ChannelApprovalCapabilityHandlerContext & {
    entry: TPendingEntry;
    phase: "resolved" | "expired";
  }) => Promise<void>;
};
type ChannelApprovalNativeTransportAdapter<TPreparedTarget = unknown, TPendingEntry = unknown, TPendingPayload = unknown, TFinalPayload = unknown> = ChannelApprovalNativeTransportAdapterForView<TPreparedTarget, TPendingEntry, TPendingPayload, TFinalPayload>;
type ChannelApprovalNativeInteractionAdapterForView<TPendingEntry = unknown, TBinding = unknown, TPendingPayload = unknown, TPendingView extends PendingApprovalView = PendingApprovalView> = {
  bindPending?: (params: ChannelApprovalCapabilityHandlerContext & {
    entry: TPendingEntry;
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
    view: TPendingView;
    pendingPayload: TPendingPayload;
  }) => TBinding | null | Promise<TBinding | null>;
  unbindPending?: (params: ChannelApprovalCapabilityHandlerContext & {
    entry: TPendingEntry;
    binding: TBinding;
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
  }) => Promise<void> | void;
  clearPendingActions?: (params: ChannelApprovalCapabilityHandlerContext & {
    entry: TPendingEntry;
    phase: "resolved" | "expired";
  }) => Promise<void>;
  cancelDelivered?: (params: ChannelApprovalCapabilityHandlerContext & {
    entry: TPendingEntry;
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
  }) => Promise<void> | void;
};
type ChannelApprovalNativeInteractionAdapter<TPendingEntry = unknown, TBinding = unknown> = ChannelApprovalNativeInteractionAdapterForView<TPendingEntry, TBinding>;
type ChannelApprovalNativeObserveAdapterForView<TPreparedTarget = unknown, TPendingPayload = unknown, TPendingEntry = unknown, TPendingView extends PendingApprovalView = PendingApprovalView> = {
  onDeliveryError?: (params: ChannelApprovalCapabilityHandlerContext & {
    error: unknown;
    plannedTarget: ChannelApprovalNativePlannedTarget;
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
    view: TPendingView;
    pendingPayload: TPendingPayload;
  }) => void;
  onDuplicateSkipped?: (params: ChannelApprovalCapabilityHandlerContext & {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: PreparedChannelNativeApprovalTarget<TPreparedTarget>;
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
    view: TPendingView;
    pendingPayload: TPendingPayload;
  }) => void;
  onDelivered?: (params: ChannelApprovalCapabilityHandlerContext & {
    plannedTarget: ChannelApprovalNativePlannedTarget;
    preparedTarget: PreparedChannelNativeApprovalTarget<TPreparedTarget>;
    request: ApprovalRequest;
    approvalKind: ChannelApprovalKind;
    view: TPendingView;
    pendingPayload: TPendingPayload;
    entry: TPendingEntry;
  }) => void;
};
type ChannelApprovalNativeObserveAdapter<TPreparedTarget = unknown, TPendingPayload = unknown, TPendingEntry = unknown> = ChannelApprovalNativeObserveAdapterForView<TPreparedTarget, TPendingPayload, TPendingEntry>;
type ChannelApprovalNativeRuntimeAdapter<TPendingPayload = unknown, TPreparedTarget = unknown, TPendingEntry = unknown, TBinding = unknown, TFinalPayload = unknown> = {
  eventKinds?: readonly ExecApprovalChannelRuntimeEventKind[];
  resolveApprovalKind?: (request: ApprovalRequest) => ChannelApprovalKind;
  availability: ChannelApprovalNativeAvailabilityAdapter;
  presentation: ChannelApprovalNativePresentationAdapter<TPendingPayload, TFinalPayload>;
  transport: ChannelApprovalNativeTransportAdapter<TPreparedTarget, TPendingEntry, TPendingPayload, TFinalPayload>;
  interactions?: ChannelApprovalNativeInteractionAdapter<TPendingEntry, TBinding>;
  observe?: ChannelApprovalNativeObserveAdapter;
};
type ChannelApprovalNativeRuntimeSpec<TPendingPayload, TPreparedTarget, TPendingEntry, TBinding = unknown, TFinalPayload = unknown, TPendingView extends PendingApprovalView = PendingApprovalView, TResolvedView extends ResolvedApprovalView = ResolvedApprovalView, TExpiredView extends ExpiredApprovalView = ExpiredApprovalView> = {
  eventKinds?: readonly ExecApprovalChannelRuntimeEventKind[];
  resolveApprovalKind?: (request: ApprovalRequest) => ChannelApprovalKind;
  availability: ChannelApprovalNativeAvailabilityAdapter;
  presentation: {
    buildPendingPayload: (params: ChannelApprovalCapabilityHandlerContext & {
      request: ApprovalRequest;
      approvalKind: ChannelApprovalKind;
      nowMs: number;
      view: TPendingView;
    }) => TPendingPayload | Promise<TPendingPayload>;
    buildResolvedResult: (params: ChannelApprovalCapabilityHandlerContext & {
      request: ApprovalRequest;
      resolved: ApprovalResolved;
      view: TResolvedView;
      entry: TPendingEntry;
    }) => ChannelApprovalNativeFinalAction<TFinalPayload> | Promise<ChannelApprovalNativeFinalAction<TFinalPayload>>;
    buildExpiredResult: (params: ChannelApprovalCapabilityHandlerContext & {
      request: ApprovalRequest;
      view: TExpiredView;
      entry: TPendingEntry;
    }) => ChannelApprovalNativeFinalAction<TFinalPayload> | Promise<ChannelApprovalNativeFinalAction<TFinalPayload>>;
  };
  transport: ChannelApprovalNativeTransportAdapterForView<TPreparedTarget, TPendingEntry, TPendingPayload, TFinalPayload, TPendingView>;
  interactions?: ChannelApprovalNativeInteractionAdapterForView<TPendingEntry, TBinding, TPendingPayload, TPendingView>;
  observe?: ChannelApprovalNativeObserveAdapterForView<TPreparedTarget, TPendingPayload, TPendingEntry, TPendingView>;
};
//#endregion
export { ExecApprovalChannelRuntime as A, ChannelApprovalNativeDeliveryCapabilities as B, PluginApprovalResolvedView as C, ExecApprovalChannelRuntimeTerminalStartError as D, deliverApprovalRequestViaChannelNativePlan as E, PreparedChannelNativeApprovalTarget as F, ChannelApprovalKind as G, ChannelApprovalNativeRequest as H, ChannelApprovalNativeDeliveryPlan as I, ChannelApprovalNativePlannedTarget as L, ExecApprovalChannelRuntimeEventKind as M, ChannelNativeApprovalDeliveryCallbacks as N, createExecApprovalChannelRuntime as O, ChannelNativeApprovalTransportSpec as P, resolveChannelNativeApprovalDeliveryPlan as R, PluginApprovalPendingView as S, createChannelNativeApprovalRuntime as T, ChannelApprovalNativeSurface as U, ChannelApprovalNativeDeliveryPreference as V, ChannelApprovalNativeTarget as W, ExecApprovalPendingView as _, ChannelApprovalNativeFinalAction as a, PendingApprovalView as b, ChannelApprovalNativePresentationAdapter as c, ChannelApprovalNativeTransportAdapter as d, ApprovalActionView as f, ExecApprovalExpiredView as g, ApprovalViewModel as h, ChannelApprovalNativeAvailabilityAdapter as i, ExecApprovalChannelRuntimeAdapter as j, isExecApprovalChannelRuntimeTerminalStartError as k, ChannelApprovalNativeRuntimeAdapter as l, ApprovalRequest$1 as m, ApprovalResolved as n, ChannelApprovalNativeInteractionAdapter as o, ApprovalMetadataView as p, ChannelApprovalCapabilityHandlerContext as r, ChannelApprovalNativeObserveAdapter as s, ApprovalRequest as t, ChannelApprovalNativeRuntimeSpec as u, ExecApprovalResolvedView as v, ResolvedApprovalView as w, PluginApprovalExpiredView as x, ExpiredApprovalView as y, ChannelApprovalNativeAdapter as z };