import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { t as ReplyPayload } from "./reply-payload-DVcklM6x.js";
import { ImageContent } from "@earendil-works/pi-ai";
import { AgentMessage } from "@earendil-works/pi-agent-core";

//#region src/media/prompt-image-order.d.ts
type PromptImageOrderEntry = "inline" | "offloaded";
//#endregion
//#region src/config/sessions/transcript-append.d.ts
type AppendSessionTranscriptMessageParams<TMessage = unknown> = {
  transcriptPath: string;
  message: TMessage;
  now?: number;
  sessionId?: string;
  cwd?: string;
  useRawWhenLinear?: boolean; /** Opt into transcript idempotency lookup; default append stays O(1) for fresh keyed messages. */
  idempotencyLookup?: "scan" | "caller-checked"; /** Runs under the transcript write lock after idempotency replay checks and before append. */
  prepareMessageAfterIdempotencyCheck?: (message: TMessage) => TMessage | undefined;
  config?: OpenClawConfig;
};
type AppendSessionTranscriptMessageResult<TMessage> = {
  messageId: string;
  message: TMessage;
  appended: boolean;
};
declare function appendSessionTranscriptMessage<TMessage>(params: AppendSessionTranscriptMessageParams<TMessage> & {
  prepareMessageAfterIdempotencyCheck: (message: TMessage) => TMessage | undefined;
}): Promise<AppendSessionTranscriptMessageResult<TMessage> | undefined>;
declare function appendSessionTranscriptMessage<TMessage>(params: AppendSessionTranscriptMessageParams<TMessage>): Promise<AppendSessionTranscriptMessageResult<TMessage>>;
//#endregion
//#region src/sessions/input-provenance.d.ts
declare const INPUT_PROVENANCE_KIND_VALUES: readonly ["external_user", "inter_session", "internal_system"];
type InputProvenanceKind = (typeof INPUT_PROVENANCE_KIND_VALUES)[number];
type InputProvenance = {
  kind: InputProvenanceKind;
  originSessionId?: string;
  sourceSessionKey?: string;
  sourceChannel?: string;
  sourceTool?: string;
};
//#endregion
//#region src/sessions/user-turn-transcript.d.ts
type TranscriptAppendConfig = Parameters<typeof appendSessionTranscriptMessage>[0]["config"];
type UserTurnSessionEntry = {
  sessionId: string;
  updatedAt: number;
  sessionFile?: string;
  threadId?: string | number;
} & Record<string, unknown>;
type PersistedUserTurnMediaInput = {
  path?: string | null;
  url?: string | null;
  contentType?: string | null;
  kind?: string | null;
};
type PersistedUserTurnMessage = Extract<AgentMessage, {
  role: "user";
}>;
type UserTurnInput = {
  text?: string | null;
  media?: readonly PersistedUserTurnMediaInput[] | null;
  timestamp?: number;
  idempotencyKey?: string;
  provenance?: InputProvenance;
  mediaOnlyText?: string;
};
type UserTurnTranscriptUpdateMode = "inline" | "none";
type UserTurnBeforeMessageWrite = (params: {
  message: PersistedUserTurnMessage;
  agentId?: string;
  sessionKey?: string;
}) => AgentMessage | null;
type PersistUserTurnTranscriptParams = {
  input?: UserTurnInput;
  message?: PersistedUserTurnMessage;
  sessionId: string;
  sessionKey: string;
  sessionEntry: UserTurnSessionEntry | undefined;
  sessionStore?: Record<string, UserTurnSessionEntry>;
  storePath?: string;
  agentId: string;
  threadId?: string | number;
  cwd?: string;
  config?: TranscriptAppendConfig;
  updateMode?: UserTurnTranscriptUpdateMode;
  beforeMessageWrite?: UserTurnBeforeMessageWrite;
};
type UserTurnTranscriptPersistenceTarget = Omit<PersistUserTurnTranscriptParams, "input" | "message" | "updateMode">;
type UserTurnTranscriptFileTarget = {
  transcriptPath: string;
  sessionId?: string;
  agentId?: string;
  sessionKey?: string;
  cwd?: string;
  config?: TranscriptAppendConfig;
};
type UserTurnTranscriptTarget = UserTurnTranscriptPersistenceTarget | UserTurnTranscriptFileTarget;
type UserTurnTranscriptPersistResult = {
  sessionFile: string;
  sessionEntry: UserTurnSessionEntry | undefined;
  messageId: string;
  message: PersistedUserTurnMessage;
};
type UserTurnTranscriptTargetResolver = UserTurnTranscriptTarget | (() => UserTurnTranscriptTarget | undefined | Promise<UserTurnTranscriptTarget | undefined>);
type UserTurnTranscriptRecorder = {
  readonly message: PersistedUserTurnMessage | undefined;
  resolveMessage: () => Promise<PersistedUserTurnMessage | undefined>;
  markRuntimePersistencePending: (pending: Promise<void>) => void;
  markRuntimePersisted: (message?: PersistedUserTurnMessage) => void;
  markBlocked: () => void;
  hasPersisted: () => boolean;
  isBlocked: () => boolean;
  hasRuntimePersistencePending: () => boolean;
  waitForRuntimePersistence: () => Promise<void>;
  persistApproved: (params?: {
    target?: UserTurnTranscriptTargetResolver;
    updateMode?: UserTurnTranscriptUpdateMode;
  }) => Promise<UserTurnTranscriptPersistResult | undefined>;
  persistFallback: (params?: {
    target?: UserTurnTranscriptTargetResolver;
    updateMode?: UserTurnTranscriptUpdateMode;
  }) => Promise<UserTurnTranscriptPersistResult | undefined>;
};
//#endregion
//#region src/auto-reply/reply/typing.d.ts
type TypingController = {
  onReplyStart: () => Promise<void>;
  startTypingLoop: () => Promise<void>;
  startTypingOnText: (text?: string) => Promise<void>;
  refreshTypingTtl: () => void;
  isActive: () => boolean;
  markRunComplete: () => void;
  markDispatchIdle: () => void;
  cleanup: () => void;
};
//#endregion
//#region src/auto-reply/get-reply-options.types.d.ts
type BlockReplyContext = {
  abortSignal?: AbortSignal;
  timeoutMs?: number; /** Source assistant message index from the upstream stream, when available. */
  assistantMessageIndex?: number;
};
/** Context passed to onModelSelected callback with actual model used. */
type ModelSelectedContext = {
  provider: string;
  model: string;
  thinkLevel: string | undefined;
};
type TypingPolicy = "auto" | "user_message" | "system_event" | "internal_webchat" | "heartbeat";
type ReplyThreadingPolicy = {
  /** Override implicit reply-to-current behavior for the current turn. */implicitCurrentMessage?: "default" | "allow" | "deny";
};
type SourceReplyDeliveryMode = "automatic" | "message_tool_only";
type QueuedReplyDeliveryCorrelation = {
  begin: () => (() => void) | void;
};
type QueuedReplyLifecycle = {
  onEnqueued?: () => void;
  onComplete?: () => void;
};
type PartialReplyPayload = Pick<ReplyPayload, "text" | "mediaUrls"> & {
  delta?: string;
  replace?: true;
};
type GetReplyOptions = {
  /** Override run id for agent events (defaults to random UUID). */runId?: string; /** Abort signal for the underlying agent run. */
  abortSignal?: AbortSignal; /** Optional inbound images (used for webchat attachments). */
  images?: ImageContent[]; /** Original inline/offloaded attachment order for inbound images. */
  imageOrder?: PromptImageOrderEntry[]; /** Notifies when an agent run actually starts (useful for webchat command handling). */
  onAgentRunStart?: (runId: string) => void; /** Shared lifecycle owner for the current user-turn transcript append. */
  userTurnTranscriptRecorder?: UserTurnTranscriptRecorder;
  onReplyStart?: () => Promise<void> | void; /** Called when the typing controller cleans up (e.g., run ended with NO_REPLY). */
  onTypingCleanup?: () => void;
  onTypingController?: (typing: TypingController) => void;
  isHeartbeat?: boolean; /** Policy-level typing control for run classes (user/system/internal/heartbeat). */
  typingPolicy?: TypingPolicy; /** Force-disable typing indicators for this run (system/internal/cross-channel routes). */
  suppressTyping?: boolean; /** Resolved heartbeat model override (provider/model string from merged per-agent config). */
  heartbeatModelOverride?: string; /** One-shot thinking level override for this run; does not persist to the session. */
  thinkingLevelOverride?: string; /** One-shot fast-mode override for this run; does not persist to the session. */
  fastModeOverride?: boolean; /** Controls bootstrap workspace context injection (default: full). */
  bootstrapContextMode?: "full" | "lightweight"; /** If true, suppress tool error warning payloads for this run. */
  suppressToolErrorWarnings?: boolean; /** Dynamic form used when verbose progress visibility can change mid-run. */
  shouldSuppressToolErrorWarnings?: () => boolean | undefined; /** If true, run the model without OpenClaw tools for this turn. */
  disableTools?: boolean; /** If true, include the heartbeat response tool for structured heartbeat outcomes. */
  enableHeartbeatTool?: boolean; /** If true, keep the heartbeat response tool available even under narrow tool profiles. */
  forceHeartbeatTool?: boolean;
  /**
   * If true, dispatch skips default tool/progress text messages and expects the
   * channel to surface progress via its own streaming/edit UX.
   */
  suppressDefaultToolProgressMessages?: boolean;
  onPartialReply?: (payload: PartialReplyPayload) => Promise<void> | void;
  onReasoningStream?: (payload: ReplyPayload) => Promise<void> | void; /** Called when a thinking/reasoning block ends. */
  onReasoningEnd?: () => Promise<void> | void; /** Called when a new assistant message starts (e.g., after tool call or thinking block). */
  onAssistantMessageStart?: () => Promise<void> | void;
  /** Called synchronously when a block reply is logically emitted, before async
   * delivery drains. Useful for channels that need to rotate preview state at
   * block boundaries without waiting for transport acks. */
  onBlockReplyQueued?: (payload: ReplyPayload, context?: BlockReplyContext) => Promise<void> | void;
  onBlockReply?: (payload: ReplyPayload, context?: BlockReplyContext) => Promise<void> | void;
  onToolResult?: (payload: ReplyPayload) => Promise<void> | void; /** Called when a tool phase starts/updates, before summary payloads are emitted. */
  onToolStart?: (payload: {
    name?: string;
    phase?: string;
    args?: Record<string, unknown>;
    detailMode?: "explain" | "raw";
  }) => Promise<void> | void; /** Called when a concrete work item starts, updates, or completes. */
  onItemEvent?: (payload: {
    itemId?: string;
    kind?: string;
    title?: string;
    name?: string;
    phase?: string;
    status?: string;
    summary?: string;
    progressText?: string;
    meta?: string;
    approvalId?: string;
    approvalSlug?: string;
  }) => Promise<void> | void; /** Called when the agent emits a structured plan update. */
  onPlanUpdate?: (payload: {
    phase?: string;
    title?: string;
    explanation?: string;
    steps?: string[];
    source?: string;
  }) => Promise<void> | void; /** Called when an approval becomes pending or resolves. */
  onApprovalEvent?: (payload: {
    phase?: string;
    kind?: string;
    status?: string;
    title?: string;
    itemId?: string;
    toolCallId?: string;
    approvalId?: string;
    approvalSlug?: string;
    command?: string;
    host?: string;
    reason?: string;
    scope?: "turn" | "session";
    message?: string;
  }) => Promise<void> | void; /** Called when command output streams or completes. */
  onCommandOutput?: (payload: {
    itemId?: string;
    phase?: string;
    title?: string;
    toolCallId?: string;
    name?: string;
    output?: string;
    status?: string;
    exitCode?: number | null;
    durationMs?: number;
    cwd?: string;
  }) => Promise<void> | void; /** Called when a patch completes with a file summary. */
  onPatchSummary?: (payload: {
    itemId?: string;
    phase?: string;
    title?: string;
    toolCallId?: string;
    name?: string;
    added?: string[];
    modified?: string[];
    deleted?: string[];
    summary?: string;
  }) => Promise<void> | void; /** Called when context auto-compaction starts (allows UX feedback during the pause). */
  onCompactionStart?: () => Promise<void> | void; /** Called when context auto-compaction completes. */
  onCompactionEnd?: () => Promise<void> | void;
  /** Called when the actual model is selected (including after fallback).
   * Use this to get model/provider/thinkLevel for responsePrefix template interpolation. */
  onModelSelected?: (ctx: ModelSelectedContext) => void;
  /**
   * Controls whether normal assistant replies are automatically delivered to
   * the source conversation. `message_tool_only` prefers message-tool visible
   * delivery and keeps normal final text, block output, and preview output
   * private unless dispatch explicitly marks a source reply as deliverable.
   */
  sourceReplyDeliveryMode?: SourceReplyDeliveryMode; /** Starts delivery tracking when this turn later drains as a queued followup. */
  queuedDeliveryCorrelations?: QueuedReplyDeliveryCorrelation[]; /** Tracks ownership transfer when this turn later drains as a queued followup. */
  queuedFollowupLifecycle?: QueuedReplyLifecycle; /** Allow channel-owned progress UI while final/source reply delivery remains message-tool-only. */
  allowProgressCallbacksWhenSourceDeliverySuppressed?: boolean;
  disableBlockStreaming?: boolean; /** Timeout for block reply delivery (ms). */
  blockReplyTimeoutMs?: number; /** If provided, only load these skills for this session (empty = no skills). */
  skillFilter?: string[]; /** Mutable ref to track if a reply was sent (for Slack "first" threading mode). */
  hasRepliedRef?: {
    value: boolean;
  }; /** Override agent timeout in seconds (0 = no timeout). Threads through to resolveAgentTimeoutMs. */
  timeoutOverrideSeconds?: number;
};
//#endregion
export { SourceReplyDeliveryMode as a, InputProvenance as c, ReplyThreadingPolicy as i, appendSessionTranscriptMessage as l, GetReplyOptions as n, TypingController as o, PartialReplyPayload as r, UserTurnTranscriptRecorder as s, BlockReplyContext as t, PromptImageOrderEntry as u };