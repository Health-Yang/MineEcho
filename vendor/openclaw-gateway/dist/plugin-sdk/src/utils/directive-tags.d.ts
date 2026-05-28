export type InlineDirectiveParseResult = {
    text: string;
    audioAsVoice: boolean;
    replyToId?: string;
    replyToExplicitId?: string;
    replyToCurrent: boolean;
    hasAudioTag: boolean;
    hasReplyTag: boolean;
};
type InlineDirectiveParseOptions = {
    currentMessageId?: string;
    stripAudioTag?: boolean;
    stripReplyTags?: boolean;
};
type StripInlineDirectiveTagsResult = {
    text: string;
    changed: boolean;
};
export type DisplayMessageWithContent = {
    content?: unknown;
} & Record<string, unknown>;
export declare function stripInlineDirectiveTagsForDisplay(text: string): StripInlineDirectiveTagsResult;
export declare function sanitizeReplyDirectiveId(rawReplyToId?: string): string | undefined;
export declare function stripInlineDirectiveTagsForDelivery(text: string): StripInlineDirectiveTagsResult;
/**
 * Strips inline directive tags from text content while preserving message shape.
 * Empty post-strip text stays empty-string to preserve caller semantics.
 * Returns the input message reference (including the original content array) when
 * no text part changed, and reuses unchanged text-part references in mixed content,
 * so identity-equality consumers avoid spurious churn.
 */
export declare function stripInlineDirectiveTagsFromMessageForDisplay(message: DisplayMessageWithContent | undefined): DisplayMessageWithContent | undefined;
export declare function parseInlineDirectives(text?: string, options?: InlineDirectiveParseOptions): InlineDirectiveParseResult;
export {};
