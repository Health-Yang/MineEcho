import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { r as RunEmbeddedPiAgentParams } from "./params-Dt3_O5uS.js";
import { o as PluginRuntimeCore, s as RuntimeLogger } from "./types-core-CiUqduCn.js";
import { $r as RealtimeVoiceToolCallEvent, Gn as RealtimeVoiceProviderPlugin, Gr as RealtimeVoiceCloseReason, Hr as RealtimeVoiceBridgeEvent, Lr as RealtimeVoiceAudioFormat, Qr as RealtimeVoiceTool, Rr as RealtimeVoiceBargeInOptions, Yr as RealtimeVoiceProviderId, Zr as RealtimeVoiceRole, ei as RealtimeVoiceToolResultOptions, qr as RealtimeVoiceProviderConfig, zr as RealtimeVoiceBridge } from "./types-qwKXExVW.js";
import { Ft as TalkEvent, It as TalkEventContext, Lt as TalkEventInput, Rt as TalkEventSequencer, r as DiagnosticEventInput } from "./diagnostic-events-CqEGq09I.js";
import { t as EmbeddedPiQueueMessageOutcome } from "./runs-CCY1rsv0.js";
import { randomUUID } from "node:crypto";

//#region src/talk/diagnostics.d.ts
type TalkDiagnosticEventInput = Extract<DiagnosticEventInput, {
  type: "talk.event";
}>;
declare function createTalkDiagnosticEvent(event: TalkEvent): TalkDiagnosticEventInput;
declare function recordTalkDiagnosticEvent(event: TalkEvent): void;
//#endregion
//#region src/talk/logging.d.ts
type TalkLogLevel = "info" | "warn";
type TalkLogRecord = {
  level: TalkLogLevel;
  message: string;
  attributes: Record<string, string | number | boolean>;
};
declare function createTalkLogRecord(event: TalkEvent): TalkLogRecord | undefined;
declare function recordTalkLogEvent(event: TalkEvent): void;
//#endregion
//#region src/talk/observability.d.ts
declare function recordTalkObservabilityEvent(event: TalkEvent): void;
//#endregion
//#region src/talk/talk-session-controller.d.ts
type TalkTurnFailureReason = "no_active_turn" | "stale_turn";
type TalkTurnSuccess = {
  event: TalkEvent;
  ok: true;
  turnId: string;
};
type TalkTurnFailure = {
  ok: false;
  reason: TalkTurnFailureReason;
};
type TalkTurnResult = TalkTurnSuccess | TalkTurnFailure;
type TalkEnsureTurnResult = {
  event?: TalkEvent;
  turnId: string;
};
type TalkSessionController = {
  readonly activeTurnId: string | undefined;
  readonly context: TalkEventContext;
  readonly outputAudioActive: boolean;
  readonly recentEvents: readonly TalkEvent[];
  clearActiveTurn(): void;
  emit<TPayload>(input: TalkEventInput<TPayload>): TalkEvent<TPayload>;
  ensureTurn(params?: {
    payload?: unknown;
    turnId?: string;
  }): TalkEnsureTurnResult;
  startTurn(params?: {
    payload?: unknown;
    turnId?: string;
  }): TalkEnsureTurnResult;
  endTurn(params?: {
    payload?: unknown;
    turnId?: string;
  }): TalkTurnResult;
  cancelTurn(params?: {
    payload?: unknown;
    turnId?: string;
  }): TalkTurnResult;
  finishOutputAudio(params?: {
    payload?: unknown;
    turnId?: string;
  }): TalkEvent | undefined;
  startOutputAudio(params?: {
    payload?: unknown;
    turnId?: string;
  }): TalkEnsureTurnResult;
};
type TalkSessionControllerParams = TalkEventContext & {
  maxRecentEvents?: number;
  turnIdPrefix?: string;
};
type TalkSessionControllerOptions = {
  now?: () => Date | string;
  onEvent?: (event: TalkEvent) => void;
  sequencer?: TalkEventSequencer;
};
declare function createTalkSessionController(params: TalkSessionControllerParams, options?: TalkSessionControllerOptions): TalkSessionController;
declare function normalizeTalkTransport(value: string | undefined): string | undefined;
//#endregion
//#region src/talk/activation-name.d.ts
declare const REALTIME_VOICE_ACTIVATION_NAME_MAX_WORDS = 2;
type RealtimeVoiceActivationNameEdge = "leading" | "trailing";
type RealtimeVoiceActivationNameMatchKind = "exact" | "fuzzy";
type RealtimeVoiceActivationNameTranscriptResult = {
  allowed: true;
  text: string;
  activationName: string;
  heardName: string;
  match: RealtimeVoiceActivationNameMatchKind;
  edge: RealtimeVoiceActivationNameEdge;
} | {
  allowed: false;
  text: string;
};
declare function realtimeVoiceActivationNameWordCount(value: string): number;
declare function normalizeRealtimeVoiceActivationName(value: string): string | undefined;
declare function normalizeRealtimeVoiceActivationNamePrefix(value: string, maxWords?: number): string | undefined;
declare function isSupportedRealtimeVoiceActivationName(value: string, maxWords?: number): boolean;
declare function normalizeSupportedRealtimeVoiceActivationName(value: string | undefined, maxWords?: number): string | undefined;
declare function sortRealtimeVoiceActivationNames(names: string[]): string[];
declare function matchRealtimeVoiceActivationName(text: string, activationNames: string[], maxWords?: number): Extract<RealtimeVoiceActivationNameTranscriptResult, {
  allowed: true;
}> | undefined;
//#endregion
//#region src/talk/consult-transcript.d.ts
type SkippableRealtimeVoiceConsultTranscriptReason = "empty" | "incomplete-transcript" | "trailing-fragment" | "non-actionable-closing";
declare function classifySkippableRealtimeVoiceConsultTranscript(text: string): SkippableRealtimeVoiceConsultTranscriptReason | undefined;
//#endregion
//#region src/talk/consult-question.d.ts
type RealtimeVoiceConsultQuestionMatchOptions = {
  minTokenOverlapRatio?: number;
  minTokenOverlapCount?: number;
};
type RealtimeVoiceSpeakableToolResultOptions = {
  keys?: readonly string[];
  maxChars?: number;
  stringResult?: boolean;
};
declare function readRealtimeVoiceConsultQuestion(args: unknown, keys?: readonly string[]): string | undefined;
declare function normalizeRealtimeVoiceConsultQuestion(value: string | undefined): string | undefined;
declare function matchRealtimeVoiceConsultQuestions(left: string | undefined, right: string | undefined, options?: RealtimeVoiceConsultQuestionMatchOptions): boolean;
declare function readSpeakableRealtimeVoiceToolResult(result: unknown, options?: RealtimeVoiceSpeakableToolResultOptions): string | undefined;
//#endregion
//#region src/talk/forced-consult-coordinator.d.ts
type RealtimeVoiceForcedConsultTimer = {
  clear(): void;
};
type RealtimeVoiceForcedConsultCoordinatorOptions = {
  limit?: number;
  nativeDedupeMs?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => RealtimeVoiceForcedConsultTimer;
  questionsMatch?: (left: string | undefined, right: string | undefined) => boolean;
};
type RealtimeVoiceForcedConsultHandle<TContext = unknown> = {
  id: string;
  question: string;
  context?: TContext;
};
type RealtimeVoiceForcedConsultNativeMatch<TContext = unknown> = {
  kind: "none";
  question?: string;
} | {
  kind: "pending";
  question?: string;
  handle: RealtimeVoiceForcedConsultHandle<TContext>;
} | {
  kind: "in_flight";
  question?: string;
  handle: RealtimeVoiceForcedConsultHandle<TContext>;
} | {
  kind: "already_delivered";
  question?: string;
  handle: RealtimeVoiceForcedConsultHandle<TContext>;
};
type RealtimeVoiceForcedConsultNativeRecentOptions = {
  allowUnknownQuestion?: boolean;
};
type RealtimeVoiceForcedConsultCoordinator<TContext = unknown> = {
  prepare(question: string, options?: {
    context?: TContext;
    id?: string;
  }): RealtimeVoiceForcedConsultHandle<TContext> | undefined;
  schedule(handle: RealtimeVoiceForcedConsultHandle<TContext>, delayMs: number, run: (handle: RealtimeVoiceForcedConsultHandle<TContext>) => void): void;
  clearPending(): void;
  consumePending(question?: string): RealtimeVoiceForcedConsultHandle<TContext> | undefined;
  cancelPending(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
  recordNativeConsult(args: unknown, nativeCallId?: string): RealtimeVoiceForcedConsultNativeMatch<TContext>;
  markStarted(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
  markDelivered(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
  markCancelled(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
  isCancelled(handle: RealtimeVoiceForcedConsultHandle<TContext>): boolean;
  nativeCallIds(handle: RealtimeVoiceForcedConsultHandle<TContext>): readonly string[];
  handles(): readonly RealtimeVoiceForcedConsultHandle<TContext>[];
  rememberQuestion(handle: RealtimeVoiceForcedConsultHandle<TContext>, question: string): void;
  findRecent(question: string): RealtimeVoiceForcedConsultHandle<TContext> | undefined;
  hasRecent(question: string): boolean;
  hasRecentNativeConsult(question: string, options?: RealtimeVoiceForcedConsultNativeRecentOptions): boolean;
  remove(handle: RealtimeVoiceForcedConsultHandle<TContext>): void;
  clear(): void;
};
declare function createRealtimeVoiceForcedConsultCoordinator<TContext = unknown>(options?: RealtimeVoiceForcedConsultCoordinatorOptions): RealtimeVoiceForcedConsultCoordinator<TContext>;
//#endregion
//#region src/talk/turn-context-tracker.d.ts
type RealtimeVoiceTurnContextTrackerOptions = {
  limit?: number;
  ignoredContextTtlMs?: number;
  now?: () => number;
  deferUntilAudio?: boolean;
};
type RealtimeVoiceTurnContextHandle<TContext, TExtra extends object = Record<never, never>> = TExtra & {
  id: string;
  context: TContext;
  hasAudio: boolean;
  closed: boolean;
  startedAt: number;
  lastAudioAt?: number;
};
type RealtimeVoiceTurnContextOpenArgs<TExtra extends object> = keyof TExtra extends never ? [extra?: TExtra] : [extra: TExtra];
type RealtimeVoiceTurnContextTracker<TContext, TExtra extends object = Record<never, never>> = {
  open(context: TContext, ...extra: RealtimeVoiceTurnContextOpenArgs<TExtra>): RealtimeVoiceTurnContextHandle<TContext, TExtra>;
  markAudio(handle: RealtimeVoiceTurnContextHandle<TContext, TExtra>): void;
  close(handle: RealtimeVoiceTurnContextHandle<TContext, TExtra>): void;
  consumeAudioContext(): TContext | undefined;
  peekAudioTurn(): RealtimeVoiceTurnContextHandle<TContext, TExtra> | undefined;
  hasAudioContext(): boolean;
  rememberIgnoredContext(context: TContext | undefined): void;
  consumeIgnoredContext(): TContext | undefined;
  size(): number;
  clear(): void;
};
declare function createRealtimeVoiceTurnContextTracker<TContext, TExtra extends object = Record<never, never>>(options?: RealtimeVoiceTurnContextTrackerOptions): RealtimeVoiceTurnContextTracker<TContext, TExtra>;
//#endregion
//#region src/talk/output-activity-tracker.d.ts
type RealtimeVoiceOutputActivityTrackerOptions = {
  now?: () => number;
};
type RealtimeVoiceOutputActivityDelta = {
  audioMs?: number;
  sourceAudioBytes?: number;
  sinkAudioBytes?: number;
};
type RealtimeVoiceOutputActivitySnapshot = {
  audioMs: number;
  chunks: number;
  sourceAudioBytes: number;
  sinkAudioBytes: number;
  playbackStarted: boolean;
  streamEnding: boolean;
  lastAudioAt?: number;
  playbackStartedAt?: number;
};
type RealtimeVoiceOutputActivityTracker = {
  markStreamOpened(): void;
  markStreamEnding(): void;
  markPlaybackStarted(): void;
  markAudio(delta: RealtimeVoiceOutputActivityDelta): void;
  reset(): void;
  isActive(sinkActive?: boolean): boolean;
  isInterruptible(sinkActive?: boolean): boolean;
  elapsedPlaybackMs(): number;
  playbackWatchdogDelayMs(options: {
    marginMs: number;
    minMs?: number;
  }): number | undefined;
  snapshot(): RealtimeVoiceOutputActivitySnapshot;
};
declare function createRealtimeVoiceOutputActivityTracker(options?: RealtimeVoiceOutputActivityTrackerOptions): RealtimeVoiceOutputActivityTracker;
//#endregion
//#region src/talk/agent-consult-tool.d.ts
declare const REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME = "openclaw_agent_consult";
declare const REALTIME_VOICE_AGENT_CONSULT_TOOL_POLICIES: readonly ["safe-read-only", "owner", "none"];
type RealtimeVoiceAgentConsultToolPolicy = (typeof REALTIME_VOICE_AGENT_CONSULT_TOOL_POLICIES)[number];
type RealtimeVoiceAgentConsultArgs = {
  question: string;
  context?: string;
  responseStyle?: string;
};
type RealtimeVoiceAgentConsultTranscriptEntry = {
  role: "user" | "assistant";
  text: string;
};
declare const REALTIME_VOICE_AGENT_CONSULT_TOOL: RealtimeVoiceTool;
declare function buildRealtimeVoiceAgentConsultWorkingResponse(audienceLabel?: string): Record<string, unknown>;
declare function isRealtimeVoiceAgentConsultToolPolicy(value: unknown): value is RealtimeVoiceAgentConsultToolPolicy;
declare function resolveRealtimeVoiceAgentConsultToolPolicy(value: unknown, fallback: RealtimeVoiceAgentConsultToolPolicy): RealtimeVoiceAgentConsultToolPolicy;
declare function resolveRealtimeVoiceAgentConsultTools(policy: RealtimeVoiceAgentConsultToolPolicy, customTools?: RealtimeVoiceTool[]): RealtimeVoiceTool[];
declare function resolveRealtimeVoiceAgentConsultToolsAllow(policy: RealtimeVoiceAgentConsultToolPolicy): string[] | undefined;
declare function buildRealtimeVoiceAgentConsultPolicyInstructions(config: {
  toolPolicy: RealtimeVoiceAgentConsultToolPolicy;
  consultPolicy?: "auto" | "substantive" | "always";
}): string | undefined;
declare function parseRealtimeVoiceAgentConsultArgs(args: unknown): RealtimeVoiceAgentConsultArgs;
declare function buildRealtimeVoiceAgentConsultChatMessage(args: unknown): string;
declare function buildRealtimeVoiceAgentConsultPrompt(params: {
  args: unknown;
  transcript: RealtimeVoiceAgentConsultTranscriptEntry[];
  surface: string;
  userLabel: string;
  assistantLabel?: string;
  questionSourceLabel?: string;
}): string;
declare function collectRealtimeVoiceAgentConsultVisibleText(payloads: Array<{
  text?: unknown;
  isError?: boolean;
  isReasoning?: boolean;
}>): string | null;
//#endregion
//#region src/talk/agent-consult-runtime.d.ts
type RealtimeVoiceAgentConsultRuntime = PluginRuntimeCore["agent"];
type RealtimeVoiceAgentConsultResult = {
  text: string;
};
type RealtimeVoiceAgentConsultContextMode = "isolated" | "fork";
declare function consultRealtimeVoiceAgent(params: {
  cfg: OpenClawConfig;
  agentRuntime: RealtimeVoiceAgentConsultRuntime;
  logger: Pick<RuntimeLogger, "warn">;
  sessionKey: string;
  messageProvider: string;
  lane: string;
  runIdPrefix: string;
  args: unknown;
  transcript: RealtimeVoiceAgentConsultTranscriptEntry[];
  surface: string;
  userLabel: string;
  assistantLabel?: string;
  questionSourceLabel?: string;
  agentId?: string;
  spawnedBy?: string | null;
  contextMode?: RealtimeVoiceAgentConsultContextMode;
  provider?: RunEmbeddedPiAgentParams["provider"];
  model?: RunEmbeddedPiAgentParams["model"];
  thinkLevel?: RunEmbeddedPiAgentParams["thinkLevel"];
  fastMode?: RunEmbeddedPiAgentParams["fastMode"];
  timeoutMs?: number;
  toolsAllow?: string[];
  extraSystemPrompt?: string;
  fallbackText?: string;
}): Promise<RealtimeVoiceAgentConsultResult>;
//#endregion
//#region src/talk/agent-talkback-runtime.d.ts
type RealtimeVoiceAgentTalkbackResult = {
  text: string;
};
type RealtimeVoiceAgentTalkbackQueue = {
  close(): void;
  enqueue(question: string, metadata?: unknown): void;
};
type RealtimeVoiceAgentTalkbackQueueParams = {
  debounceMs: number;
  isStopped: () => boolean;
  logger: Pick<RuntimeLogger, "info" | "warn">;
  logPrefix: string;
  responseStyle: string;
  fallbackText: string;
  consult: (args: {
    question: string;
    metadata?: unknown;
    responseStyle: string;
    signal: AbortSignal;
  }) => Promise<RealtimeVoiceAgentTalkbackResult>;
  deliver: (text: string) => void;
};
declare function createRealtimeVoiceAgentTalkbackQueue(params: RealtimeVoiceAgentTalkbackQueueParams): RealtimeVoiceAgentTalkbackQueue;
//#endregion
//#region src/talk/agent-run-control-shared.d.ts
declare const REALTIME_VOICE_AGENT_CONTROL_MODES: readonly ["status", "steer", "cancel", "followup"];
type RealtimeVoiceAgentControlMode = (typeof REALTIME_VOICE_AGENT_CONTROL_MODES)[number];
type RealtimeVoiceAgentControlProviderResult = {
  status: "cancelled";
  message: string;
};
declare const REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME = "openclaw_agent_control";
declare const REALTIME_VOICE_AGENT_CONTROL_TOOL: RealtimeVoiceTool;
type RealtimeVoiceAgentControlIntent = {
  mode: RealtimeVoiceAgentControlMode;
  confidence: "high" | "medium" | "low";
  reason: "explicit_mode" | "cancel_safety" | "status_query" | "followup_marker" | "steer_command" | "safe_default";
  shouldAutoControl: boolean;
};
type RealtimeVoiceAgentRunActivity = {
  activeWorkKind?: "tool_call" | "model_call" | "embedded_run";
  hasActiveEmbeddedRun?: boolean;
  activeToolName?: string;
  activeToolCallId?: string;
  activeToolAgeMs?: number;
  lastProgressAgeMs?: number;
  lastProgressReason?: string;
};
type RealtimeVoiceAgentControlResult = {
  ok: boolean;
  mode: RealtimeVoiceAgentControlMode;
  sessionKey: string;
  sessionId?: string;
  active: boolean;
  queued?: boolean;
  aborted?: boolean;
  target?: "embedded_run" | "reply_run";
  reason?: string;
  message: string;
  speak: boolean;
  show: boolean;
  suppress: boolean;
  providerResult?: RealtimeVoiceAgentControlProviderResult;
  enqueuedAtMs?: number;
  deliveredAtMs?: number;
};
declare function normalizeRealtimeVoiceAgentControlMode(value: unknown): RealtimeVoiceAgentControlMode | undefined;
declare function resolveRealtimeVoiceAgentControlIntent(params: {
  text: string;
  mode?: unknown;
}): RealtimeVoiceAgentControlIntent;
declare function classifyRealtimeVoiceAgentControlText(text: string): RealtimeVoiceAgentControlMode;
declare function shouldAutoControlRealtimeVoiceAgentText(text: string): boolean;
declare function parseRealtimeVoiceAgentControlToolArgs(args: unknown): {
  text: string;
  mode: RealtimeVoiceAgentControlMode;
};
declare function buildRealtimeVoiceAgentControlSpeechMessage(text: string): string;
declare function buildRealtimeVoiceAgentCancelProviderResult(message?: string): RealtimeVoiceAgentControlProviderResult;
//#endregion
//#region src/talk/agent-run-control.d.ts
type RealtimeVoiceAgentControlDeps = {
  abortEmbeddedPiRun: (sessionId: string) => boolean;
  queueEmbeddedPiMessageWithOutcomeAsync: (sessionId: string, text: string, options?: {
    steeringMode?: "all";
    debounceMs?: number;
  }) => Promise<EmbeddedPiQueueMessageOutcome>;
  getDiagnosticSessionActivitySnapshot: (params: {
    sessionId?: string;
    sessionKey?: string;
  }) => RealtimeVoiceAgentRunActivity;
  resolveActiveEmbeddedRunSessionId: (sessionKey: string) => string | undefined;
};
declare function controlRealtimeVoiceAgentRun(params: {
  sessionKey: string;
  text: string;
  mode?: unknown;
  recentEvents?: readonly TalkEvent[];
}, deps?: RealtimeVoiceAgentControlDeps): Promise<RealtimeVoiceAgentControlResult>;
//#endregion
//#region src/talk/fast-context-runtime.d.ts
type Logger = {
  debug?: (message: string) => void;
};
type RealtimeVoiceFastContextConfig = {
  enabled: boolean;
  maxResults: number;
  sources: Array<"memory" | "sessions">;
  timeoutMs: number;
  fallbackToConsult: boolean;
};
type RealtimeVoiceFastContextLabels = {
  audienceLabel: string;
  contextName: string;
};
type RealtimeVoiceFastContextConsultResult = {
  handled: false;
} | {
  handled: true;
  result: RealtimeVoiceAgentConsultResult;
};
declare function resolveRealtimeVoiceFastContextConsult(params: {
  cfg: OpenClawConfig;
  agentId: string;
  sessionKey: string;
  config: RealtimeVoiceFastContextConfig;
  args: unknown;
  logger: Logger;
  labels?: Partial<RealtimeVoiceFastContextLabels>;
}): Promise<RealtimeVoiceFastContextConsultResult>;
//#endregion
//#region src/talk/provider-registry.d.ts
declare function normalizeRealtimeVoiceProviderId(providerId: string | undefined): RealtimeVoiceProviderId | undefined;
declare function listRealtimeVoiceProviders(cfg?: OpenClawConfig): RealtimeVoiceProviderPlugin[];
declare function getRealtimeVoiceProvider(providerId: string | undefined, cfg?: OpenClawConfig): RealtimeVoiceProviderPlugin | undefined;
declare function canonicalizeRealtimeVoiceProviderId(providerId: string | undefined, cfg?: OpenClawConfig): RealtimeVoiceProviderId | undefined;
//#endregion
//#region src/talk/provider-resolver.d.ts
type ResolvedRealtimeVoiceProvider = {
  provider: RealtimeVoiceProviderPlugin;
  providerConfig: RealtimeVoiceProviderConfig;
};
type ResolveConfiguredRealtimeVoiceProviderParams = {
  configuredProviderId?: string;
  providerConfigs?: Record<string, Record<string, unknown> | undefined>;
  providerConfigOverrides?: Record<string, unknown>;
  cfg?: OpenClawConfig;
  cfgForResolve?: OpenClawConfig;
  providers?: RealtimeVoiceProviderPlugin[];
  defaultModel?: string;
  noRegisteredProviderMessage?: string;
};
declare function resolveConfiguredRealtimeVoiceProvider(params: ResolveConfiguredRealtimeVoiceProviderParams): ResolvedRealtimeVoiceProvider;
//#endregion
//#region src/talk/session-runtime.d.ts
type RealtimeVoiceAudioSink = {
  isOpen?: () => boolean;
  sendAudio: (audio: Buffer) => void;
  clearAudio?: () => void;
  sendMark?: (markName: string) => void;
};
type RealtimeVoiceMarkStrategy = "transport" | "ack-immediately" | "ignore";
type RealtimeVoiceBridgeSession = {
  bridge: RealtimeVoiceBridge;
  acknowledgeMark(): void;
  close(): void;
  connect(): Promise<void>;
  sendAudio(audio: Buffer): void;
  sendUserMessage(text: string): void;
  handleBargeIn(options?: RealtimeVoiceBargeInOptions): void;
  setMediaTimestamp(ts: number): void;
  submitToolResult(callId: string, result: unknown, options?: RealtimeVoiceToolResultOptions): void;
  triggerGreeting(instructions?: string): void;
};
type RealtimeVoiceBridgeSessionParams = {
  provider: RealtimeVoiceProviderPlugin;
  cfg?: OpenClawConfig;
  providerConfig: RealtimeVoiceProviderConfig;
  audioFormat?: RealtimeVoiceAudioFormat;
  audioSink: RealtimeVoiceAudioSink;
  instructions?: string;
  initialGreetingInstructions?: string;
  autoRespondToAudio?: boolean;
  interruptResponseOnInputAudio?: boolean;
  markStrategy?: RealtimeVoiceMarkStrategy;
  triggerGreetingOnReady?: boolean;
  tools?: RealtimeVoiceTool[];
  onTranscript?: (role: RealtimeVoiceRole, text: string, isFinal: boolean) => void;
  onEvent?: (event: RealtimeVoiceBridgeEvent) => void;
  onToolCall?: (event: RealtimeVoiceToolCallEvent, session: RealtimeVoiceBridgeSession) => void;
  onReady?: (session: RealtimeVoiceBridgeSession) => void;
  onError?: (error: Error) => void;
  onClose?: (reason: RealtimeVoiceCloseReason) => void;
};
declare function createRealtimeVoiceBridgeSession(params: RealtimeVoiceBridgeSessionParams): RealtimeVoiceBridgeSession;
//#endregion
//#region src/talk/session-log-runtime.d.ts
type RealtimeVoiceTranscriptEntry = {
  at: string;
  role: RealtimeVoiceRole;
  text: string;
};
type RealtimeVoiceTranscriptHealth = {
  realtimeTranscriptLines: number;
  lastRealtimeTranscriptAt?: string;
  lastRealtimeTranscriptRole?: RealtimeVoiceRole;
  lastRealtimeTranscriptText?: string;
  recentRealtimeTranscript: RealtimeVoiceTranscriptEntry[];
};
type RealtimeVoiceBridgeEventLogEntry = RealtimeVoiceBridgeEvent & {
  at: string;
};
type RealtimeVoiceBridgeEventHealth = {
  lastRealtimeEventAt?: string;
  lastRealtimeEventType?: string;
  lastRealtimeEventDetail?: string;
  recentRealtimeEvents: RealtimeVoiceBridgeEventLogEntry[];
};
declare function recordRealtimeVoiceTranscript(transcript: RealtimeVoiceTranscriptEntry[], role: RealtimeVoiceRole, text: string, maxEntries?: number): RealtimeVoiceTranscriptEntry;
declare function getRealtimeVoiceTranscriptHealth(transcript: RealtimeVoiceTranscriptEntry[]): RealtimeVoiceTranscriptHealth;
declare function recordRealtimeVoiceBridgeEvent(events: RealtimeVoiceBridgeEventLogEntry[], event: RealtimeVoiceBridgeEvent, maxEntries?: number): void;
declare function getRealtimeVoiceBridgeEventHealth(events: RealtimeVoiceBridgeEventLogEntry[]): RealtimeVoiceBridgeEventHealth;
declare function isLikelyRealtimeVoiceAssistantEchoTranscript(params: {
  transcript: RealtimeVoiceTranscriptEntry[];
  text: string;
  lookbackMs: number;
  nowMs?: number;
}): boolean;
declare function extendRealtimeVoiceOutputEchoSuppression(params: {
  audio: Buffer;
  bytesPerMs: number;
  tailMs: number;
  nowMs: number;
  lastOutputPlayableUntilMs: number;
  suppressInputUntilMs: number;
}): {
  lastOutputPlayableUntilMs: number;
  suppressInputUntilMs: number;
  durationMs: number;
};
//#endregion
//#region src/talk/audio-codec.d.ts
declare function resamplePcm(input: Buffer, inputSampleRate: number, outputSampleRate: number): Buffer;
declare function resamplePcmTo8k(input: Buffer, inputSampleRate: number): Buffer;
declare function pcmToMulaw(pcm: Buffer): Buffer;
declare function mulawToPcm(mulaw: Buffer): Buffer;
declare function convertPcmToMulaw8k(pcm: Buffer, inputSampleRate: number): Buffer;
//#endregion
export { consultRealtimeVoiceAgent as $, TalkSessionControllerOptions as $t, RealtimeVoiceFastContextLabels as A, RealtimeVoiceForcedConsultTimer as At, buildRealtimeVoiceAgentCancelProviderResult as B, REALTIME_VOICE_ACTIVATION_NAME_MAX_WORDS as Bt, resolveConfiguredRealtimeVoiceProvider as C, RealtimeVoiceTurnContextTrackerOptions as Ct, normalizeRealtimeVoiceProviderId as D, RealtimeVoiceForcedConsultHandle as Dt, listRealtimeVoiceProviders as E, RealtimeVoiceForcedConsultCoordinatorOptions as Et, REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME as F, normalizeRealtimeVoiceConsultQuestion as Ft, resolveRealtimeVoiceAgentControlIntent as G, matchRealtimeVoiceActivationName as Gt, classifyRealtimeVoiceAgentControlText as H, RealtimeVoiceActivationNameMatchKind as Ht, RealtimeVoiceAgentControlIntent as I, readRealtimeVoiceConsultQuestion as It, RealtimeVoiceAgentTalkbackQueueParams as J, normalizeSupportedRealtimeVoiceActivationName as Jt, shouldAutoControlRealtimeVoiceAgentText as K, normalizeRealtimeVoiceActivationName as Kt, RealtimeVoiceAgentControlMode as L, readSpeakableRealtimeVoiceToolResult as Lt, controlRealtimeVoiceAgentRun as M, RealtimeVoiceConsultQuestionMatchOptions as Mt, REALTIME_VOICE_AGENT_CONTROL_MODES as N, RealtimeVoiceSpeakableToolResultOptions as Nt, RealtimeVoiceFastContextConfig as O, RealtimeVoiceForcedConsultNativeMatch as Ot, REALTIME_VOICE_AGENT_CONTROL_TOOL as P, matchRealtimeVoiceConsultQuestions as Pt, RealtimeVoiceAgentConsultRuntime as Q, TalkSessionController as Qt, RealtimeVoiceAgentControlProviderResult as R, SkippableRealtimeVoiceConsultTranscriptReason as Rt, ResolvedRealtimeVoiceProvider as S, RealtimeVoiceTurnContextTracker as St, getRealtimeVoiceProvider as T, RealtimeVoiceForcedConsultCoordinator as Tt, normalizeRealtimeVoiceAgentControlMode as U, RealtimeVoiceActivationNameTranscriptResult as Ut, buildRealtimeVoiceAgentControlSpeechMessage as V, RealtimeVoiceActivationNameEdge as Vt, parseRealtimeVoiceAgentControlToolArgs as W, isSupportedRealtimeVoiceActivationName as Wt, createRealtimeVoiceAgentTalkbackQueue as X, sortRealtimeVoiceActivationNames as Xt, RealtimeVoiceAgentTalkbackResult as Y, realtimeVoiceActivationNameWordCount as Yt, RealtimeVoiceAgentConsultResult as Z, TalkEnsureTurnResult as Zt, RealtimeVoiceBridgeSession as _, RealtimeVoiceOutputActivitySnapshot as _t, resamplePcmTo8k as a, createTalkSessionController as an, RealtimeVoiceAgentConsultTranscriptEntry as at, createRealtimeVoiceBridgeSession as b, createRealtimeVoiceOutputActivityTracker as bt, RealtimeVoiceTranscriptEntry as c, createTalkLogRecord as cn, buildRealtimeVoiceAgentConsultPrompt as ct, getRealtimeVoiceBridgeEventHealth as d, recordTalkDiagnosticEvent as dn, isRealtimeVoiceAgentConsultToolPolicy as dt, TalkSessionControllerParams as en, REALTIME_VOICE_AGENT_CONSULT_TOOL as et, getRealtimeVoiceTranscriptHealth as f, parseRealtimeVoiceAgentConsultArgs as ft, RealtimeVoiceAudioSink as g, RealtimeVoiceOutputActivityDelta as gt, recordRealtimeVoiceTranscript as h, resolveRealtimeVoiceAgentConsultToolsAllow as ht, resamplePcm as i, TalkTurnSuccess as in, RealtimeVoiceAgentConsultToolPolicy as it, resolveRealtimeVoiceFastContextConsult as j, createRealtimeVoiceForcedConsultCoordinator as jt, RealtimeVoiceFastContextConsultResult as k, RealtimeVoiceForcedConsultNativeRecentOptions as kt, RealtimeVoiceTranscriptHealth as l, recordTalkLogEvent as ln, buildRealtimeVoiceAgentConsultWorkingResponse as lt, recordRealtimeVoiceBridgeEvent as m, resolveRealtimeVoiceAgentConsultTools as mt, mulawToPcm as n, TalkTurnFailureReason as nn, REALTIME_VOICE_AGENT_CONSULT_TOOL_POLICIES as nt, RealtimeVoiceBridgeEventHealth as o, normalizeTalkTransport as on, buildRealtimeVoiceAgentConsultChatMessage as ot, isLikelyRealtimeVoiceAssistantEchoTranscript as p, resolveRealtimeVoiceAgentConsultToolPolicy as pt, RealtimeVoiceAgentTalkbackQueue as q, normalizeRealtimeVoiceActivationNamePrefix as qt, pcmToMulaw as r, TalkTurnResult as rn, RealtimeVoiceAgentConsultArgs as rt, RealtimeVoiceBridgeEventLogEntry as s, recordTalkObservabilityEvent as sn, buildRealtimeVoiceAgentConsultPolicyInstructions as st, convertPcmToMulaw8k as t, TalkTurnFailure as tn, REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME as tt, extendRealtimeVoiceOutputEchoSuppression as u, createTalkDiagnosticEvent as un, collectRealtimeVoiceAgentConsultVisibleText as ut, RealtimeVoiceBridgeSessionParams as v, RealtimeVoiceOutputActivityTracker as vt, canonicalizeRealtimeVoiceProviderId as w, createRealtimeVoiceTurnContextTracker as wt, ResolveConfiguredRealtimeVoiceProviderParams as x, RealtimeVoiceTurnContextHandle as xt, RealtimeVoiceMarkStrategy as y, RealtimeVoiceOutputActivityTrackerOptions as yt, RealtimeVoiceAgentControlResult as z, classifySkippableRealtimeVoiceConsultTranscript as zt };