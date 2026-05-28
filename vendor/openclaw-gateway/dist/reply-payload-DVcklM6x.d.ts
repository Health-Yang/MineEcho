//#region src/interactive/payload.d.ts
type InteractiveButtonStyle = "primary" | "secondary" | "success" | "danger";
/** Visual tone for a portable message presentation. */
type MessagePresentationTone = "info" | "success" | "warning" | "danger" | "neutral";
/** Button style hint for renderers that support styled actions. */
type MessagePresentationButtonStyle = InteractiveButtonStyle;
/** Portable action control rendered as a button or link by channel adapters. */
type MessagePresentationButton = {
  /** User-visible button label. */label: string; /** Callback command or opaque value sent when the button is pressed. */
  value?: string; /** External URL opened by the button instead of sending a callback value. */
  url?: string; /** Telegram-style web app launch target. */
  webApp?: {
    url: string;
  };
  /**
   * @deprecated Use webApp. The snake_case alias is accepted for legacy JSON payloads only.
   */
  web_app?: {
    url: string;
  }; /** Higher-priority buttons are kept first when channel limits require truncation. */
  priority?: number; /** Disable the button when the target channel supports disabled controls. */
  disabled?: boolean; /** Keep this action available after a successful interaction when the target channel supports it. */
  reusable?: boolean; /** Optional visual style hint; unsupported channels ignore or normalize it. */
  style?: InteractiveButtonStyle;
};
/** Portable select/menu option. */
type MessagePresentationOption = {
  /** User-visible option label. */label: string; /** Callback command or opaque value sent when the option is selected. */
  value: string;
};
/**
 * @deprecated Use MessagePresentationButton.
 */
type InteractiveReplyButton = MessagePresentationButton;
/**
 * @deprecated Use MessagePresentationOption.
 */
type InteractiveReplyOption = MessagePresentationOption;
/**
 * @deprecated Use MessagePresentationTextBlock.
 */
type InteractiveReplyTextBlock = {
  type: "text";
  text: string;
};
/**
 * @deprecated Use MessagePresentationButtonsBlock.
 */
type InteractiveReplyButtonsBlock = {
  type: "buttons";
  buttons: InteractiveReplyButton[];
};
/**
 * @deprecated Use MessagePresentationSelectBlock.
 */
type InteractiveReplySelectBlock = {
  type: "select";
  placeholder?: string;
  options: InteractiveReplyOption[];
};
/**
 * @deprecated Use MessagePresentationBlock.
 */
type InteractiveReplyBlock = InteractiveReplyTextBlock | InteractiveReplyButtonsBlock | InteractiveReplySelectBlock;
/**
 * @deprecated Use MessagePresentation.
 */
type InteractiveReply = {
  blocks: InteractiveReplyBlock[];
};
type MessagePresentationTextBlock = {
  type: "text"; /** Primary markdown-ish text rendered in the message body. */
  text: string;
};
type MessagePresentationContextBlock = {
  type: "context"; /** Lower-emphasis contextual text, or normal text on channels without context support. */
  text: string;
};
type MessagePresentationDividerBlock = {
  type: "divider";
};
type MessagePresentationButtonsBlock = {
  type: "buttons"; /** Button row candidates; core may split or truncate them for channel limits. */
  buttons: MessagePresentationButton[];
};
type MessagePresentationSelectBlock = {
  type: "select"; /** Optional prompt shown above or inside the select control. */
  placeholder?: string; /** Menu options; core may truncate them for channel limits. */
  options: MessagePresentationOption[];
};
type MessagePresentationInteractiveBlock = MessagePresentationButtonsBlock | MessagePresentationSelectBlock;
type MessagePresentationBlock = MessagePresentationTextBlock | MessagePresentationContextBlock | MessagePresentationDividerBlock | MessagePresentationButtonsBlock | MessagePresentationSelectBlock;
type MessagePresentation = {
  /** Optional short heading rendered before blocks when the channel supports it. */title?: string; /** Optional severity/status tone for renderers that support toned presentations. */
  tone?: MessagePresentationTone; /** Ordered portable blocks rendered or downgraded by the target channel adapter. */
  blocks: MessagePresentationBlock[];
};
type ReplyPayloadDeliveryPin = {
  enabled: boolean;
  notify?: boolean;
  required?: boolean;
};
type ReplyPayloadDelivery = {
  pin?: boolean | ReplyPayloadDeliveryPin;
};
/**
 * @deprecated Use normalizeMessagePresentation.
 */
declare function normalizeInteractiveReply(raw: unknown): InteractiveReply | undefined;
declare function normalizeMessagePresentation(raw: unknown): MessagePresentation | undefined;
/**
 * @deprecated Use hasMessagePresentationBlocks.
 */
declare function hasInteractiveReplyBlocks(value: unknown): value is InteractiveReply;
declare function hasMessagePresentationBlocks(value: unknown): value is MessagePresentation;
/**
 * @deprecated Avoid producing InteractiveReply payloads; send MessagePresentation directly.
 */
declare function presentationToInteractiveReply(presentation: MessagePresentation): InteractiveReply | undefined;
declare function isMessagePresentationInteractiveBlock(block: MessagePresentationBlock): block is MessagePresentationInteractiveBlock;
/**
 * @deprecated Avoid producing InteractiveReply payloads; send MessagePresentation directly.
 */
declare function presentationToInteractiveControlsReply(presentation: MessagePresentation): InteractiveReply | undefined;
/**
 * @deprecated Legacy bridge for old InteractiveReply payloads. New producers should send MessagePresentation.
 */
declare function interactiveReplyToPresentation(interactive: InteractiveReply): MessagePresentation | undefined;
declare function renderMessagePresentationFallbackText(params: {
  presentation?: MessagePresentation;
  emptyFallback?: string | null;
  text?: string | null;
}): string;
declare function hasReplyChannelData(value: unknown): value is Record<string, unknown>;
declare function hasReplyContent(params: {
  text?: string | null;
  mediaUrl?: string | null;
  mediaUrls?: ReadonlyArray<string | null | undefined>;
  interactive?: unknown;
  presentation?: unknown;
  hasChannelData?: boolean;
  extraContent?: boolean;
}): boolean;
/**
 * @deprecated Use renderMessagePresentationFallbackText with MessagePresentation.
 */
declare function resolveInteractiveTextFallback(params: {
  text?: string;
  interactive?: InteractiveReply;
}): string | undefined;
//#endregion
//#region src/auto-reply/reply-payload.d.ts
type ReplyPayload = {
  text?: string;
  mediaUrl?: string;
  mediaUrls?: string[]; /** Internal-only trust signal for gateway webchat local media embedding. */
  trustedLocalMedia?: boolean; /** Treat media as live-only content and avoid persisting the underlying media reference. */
  sensitiveMedia?: boolean; /** Channel-agnostic rich presentation. Core degrades or asks the channel renderer to map it. */
  presentation?: MessagePresentation; /** Channel-agnostic delivery preferences, e.g. pin the sent message when supported. */
  delivery?: ReplyPayloadDelivery;
  /**
   * @deprecated Use presentation.
   *
   * Internal legacy representation used by existing approval/reply helpers during migration.
   */
  interactive?: InteractiveReply;
  btw?: {
    question: string;
  };
  replyToId?: string;
  replyToTag?: boolean; /** True when [[reply_to_current]] was present but not yet mapped to a message id. */
  replyToCurrent?: boolean; /** Send audio as voice message (bubble) instead of audio file. Defaults to false. */
  audioAsVoice?: boolean;
  /**
   * Text synthesized into an audio-only TTS payload. Exposed to hooks for
   * archival/search use when no visible channel text is sent.
   */
  spokenText?: string;
  /**
   * Marks a TTS media payload as supplemental audio for assistant text that is
   * already visible through streaming or transcript projection.
   */
  ttsSupplement?: ReplyPayloadTtsSupplement;
  isError?: boolean;
  /** Marks this payload as a reasoning/thinking block. Channels that do not
   *  have a dedicated reasoning lane (e.g. WhatsApp, web) should suppress it. */
  isReasoning?: boolean;
  /** Marks this payload as a compaction status notice (start/end).
   *  Should be excluded from TTS transcript accumulation so compaction
   *  status lines are not synthesised into the spoken assistant reply. */
  isCompactionNotice?: boolean; /** Marks this payload as a model-fallback transition/recovery notice. */
  isFallbackNotice?: boolean; /** Marks this payload as transient status, not assistant answer content. */
  isStatusNotice?: boolean; /** Channel-specific payload data (per-channel envelope). */
  channelData?: Record<string, unknown>;
};
type ReplyPayloadTtsSupplement = {
  spokenText: string;
  visibleTextAlreadyDelivered?: boolean;
};
declare function getReplyPayloadTtsSupplement(payload: Pick<ReplyPayload, "mediaUrl" | "mediaUrls" | "ttsSupplement">): ReplyPayloadTtsSupplement | undefined;
declare function isReplyPayloadTtsSupplement(payload: Pick<ReplyPayload, "mediaUrl" | "mediaUrls" | "ttsSupplement">): boolean;
declare function markReplyPayloadAsTtsSupplement<T extends ReplyPayload>(payload: T, spokenText?: string, options?: {
  visibleTextAlreadyDelivered?: boolean;
}): T;
declare function buildTtsSupplementMediaPayload(payload: ReplyPayload): ReplyPayload;
type ReplyPayloadMetadata = {
  assistantMessageIndex?: number;
  /**
   * Internal OpenClaw notices generated after a runtime/provider failure are
   * not assistant source replies. Dispatch may deliver them even when normal
   * assistant source replies are message-tool-only; sendPolicy deny still wins.
   */
  deliverDespiteSourceReplySuppression?: boolean;
  /**
   * A message-tool reply to the active internal UI source. The final payload is
   * still the live delivery vehicle; this mirror makes the reply durable for
   * chat.history and page reloads without turning the internal UI into an
   * outbound channel.
   */
  sourceReplyTranscriptMirror?: {
    sessionKey: string;
    agentId?: string;
    text?: string;
    mediaUrls?: string[];
    idempotencyKey?: string;
  };
  beforeAgentRunBlocked?: boolean; /** Warning synthesized from an observed tool error after the run produced assistant output. */
  nonTerminalToolErrorWarning?: boolean;
};
declare function setReplyPayloadMetadata<T extends object>(payload: T, metadata: ReplyPayloadMetadata): T;
declare function isReplyPayloadNonTerminalToolErrorWarning(payload: object): boolean;
//#endregion
export { hasInteractiveReplyBlocks as A, renderMessagePresentationFallbackText as B, MessagePresentationInteractiveBlock as C, MessagePresentationTone as D, MessagePresentationTextBlock as E, isMessagePresentationInteractiveBlock as F, normalizeInteractiveReply as I, normalizeMessagePresentation as L, hasReplyChannelData as M, hasReplyContent as N, ReplyPayloadDelivery as O, interactiveReplyToPresentation as P, presentationToInteractiveControlsReply as R, MessagePresentationDividerBlock as S, MessagePresentationSelectBlock as T, resolveInteractiveTextFallback as V, MessagePresentationBlock as _, isReplyPayloadNonTerminalToolErrorWarning as a, MessagePresentationButtonsBlock as b, setReplyPayloadMetadata as c, InteractiveReplyBlock as d, InteractiveReplyButton as f, MessagePresentation as g, InteractiveReplyTextBlock as h, getReplyPayloadTtsSupplement as i, hasMessagePresentationBlocks as j, ReplyPayloadDeliveryPin as k, InteractiveButtonStyle as l, InteractiveReplySelectBlock as m, ReplyPayloadTtsSupplement as n, isReplyPayloadTtsSupplement as o, InteractiveReplyOption as p, buildTtsSupplementMediaPayload as r, markReplyPayloadAsTtsSupplement as s, ReplyPayload as t, InteractiveReply as u, MessagePresentationButton as v, MessagePresentationOption as w, MessagePresentationContextBlock as x, MessagePresentationButtonStyle as y, presentationToInteractiveReply as z };