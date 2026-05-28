import { type CommandTurnContext } from "../../auto-reply/command-turn-context.js";
import { type FinalizeInboundContextOptions } from "../../auto-reply/reply/inbound-context.js";
import type { FinalizedMsgContext } from "../../auto-reply/templating.js";
import type { ContextVisibilityMode } from "../../config/types.base.js";
import type { AccessFacts, CommandFacts, ConversationFacts, InboundMediaFacts, MessageFacts, ReplyPlanFacts, RouteFacts, SenderFacts, SupplementalContextFacts } from "../turn/types.js";
import type { InboundEventKind } from "./kind.js";
type MaybePromise<T> = T | Promise<T>;
type ChannelInboundSupplementalMediaResolver = () => MaybePromise<readonly InboundMediaFacts[] | null | undefined>;
type ChannelInboundSupplementalQuoteFacts = NonNullable<SupplementalContextFacts["quote"]> & {
    isSelf?: boolean;
    media?: readonly InboundMediaFacts[] | ChannelInboundSupplementalMediaResolver;
};
type ChannelInboundSupplementalFacts = Omit<SupplementalContextFacts, "quote"> & {
    quote?: ChannelInboundSupplementalQuoteFacts;
};
/**
 * @deprecated Prefer passing `resolveSupplementalMedia: true` directly to
 * `buildChannelInboundEventContext` without naming this compatibility type.
 */
export type ChannelInboundSupplementalResolutionOptions = {
    resolveSupplementalMedia: true;
    suppressSelfQuoteBody?: boolean;
    suppressSelfQuoteMedia?: boolean;
};
type BuildAccessFacts = Omit<AccessFacts, "commands"> & {
    commands?: Partial<NonNullable<AccessFacts["commands"]>>;
};
export type BuildChannelInboundEventContextParams = {
    channel: string;
    accountId?: string;
    provider?: string;
    surface?: string;
    messageId?: string;
    messageIdFull?: string;
    timestamp?: number;
    from: string;
    sender: SenderFacts;
    conversation: ConversationFacts;
    route: RouteFacts;
    reply: ReplyPlanFacts;
    message: MessageFacts;
    access?: BuildAccessFacts;
    command?: CommandFacts;
    commandTurn?: CommandTurnContext;
    media?: InboundMediaFacts[];
    supplemental?: ChannelInboundSupplementalFacts;
    contextVisibility?: ContextVisibilityMode;
    finalize?: FinalizeInboundContextFn;
    finalizeOptions?: FinalizeInboundContextOptions;
    extra?: Record<string, unknown>;
};
/**
 * @deprecated Prefer `BuildChannelInboundEventContextParams` with
 * `resolveSupplementalMedia: true` at call sites that need lazy quote media.
 */
export type BuildChannelInboundEventContextAsyncParams = BuildChannelInboundEventContextParams & ChannelInboundSupplementalResolutionOptions;
export type BuiltChannelInboundEventContext = FinalizedMsgContext & {
    Body: string;
    BodyForAgent: string;
    BodyForCommands: string;
    ChatType: ConversationFacts["kind"];
    CommandAuthorized: boolean;
    CommandBody: string;
    From: string;
    RawBody: string;
    SessionKey: string;
    To: string;
    InboundEventKind: InboundEventKind;
};
type FinalizeInboundContextFn = (ctx: Record<string, unknown>, opts?: FinalizeInboundContextOptions) => unknown;
/**
 * @deprecated Used by deprecated `finalizeChannelInboundContext`; new channel
 * code should pass facts to `buildChannelInboundEventContext`.
 */
export type FinalizeChannelInboundContextParams<T extends Record<string, unknown>> = {
    context: T;
    supplemental?: SupplementalContextFacts | ChannelInboundSupplementalFacts;
    contextVisibility?: ContextVisibilityMode;
    media?: readonly InboundMediaFacts[];
    finalize?: FinalizeInboundContextFn;
    finalizeOptions?: FinalizeInboundContextOptions;
};
/**
 * @deprecated Prefer `FinalizeChannelInboundContextParams<T>` with
 * `resolveSupplementalMedia: true` when lazy quote media must be resolved.
 */
export type FinalizeChannelInboundContextAsyncParams<T extends Record<string, unknown>> = FinalizeChannelInboundContextParams<T> & {
    resolveSupplementalMedia: true;
} & Pick<ChannelInboundSupplementalResolutionOptions, "suppressSelfQuoteBody" | "suppressSelfQuoteMedia">;
/**
 * @deprecated Result type for deprecated `finalizeChannelInboundContext`.
 */
export type FinalizeChannelInboundContextResult<T extends Record<string, unknown>> = {
    context: T & FinalizedMsgContext;
    supplemental?: SupplementalContextFacts;
    quoteHidden: boolean;
    forwardedHidden: boolean;
    threadHidden: boolean;
};
export declare function filterChannelInboundSupplementalContext(params: {
    supplemental?: SupplementalContextFacts;
    contextVisibility?: ContextVisibilityMode;
}): SupplementalContextFacts | undefined;
export declare function filterChannelInboundQuoteContext(contextVisibility: ContextVisibilityMode | undefined, quote: SupplementalContextFacts["quote"] | undefined): SupplementalContextFacts["quote"] | undefined;
/**
 * @deprecated Prefer `buildChannelInboundEventContext({ resolveSupplementalMedia: true })`
 * for channel inbound payloads.
 */
export declare function resolveChannelInboundSupplementalContext(params: {
    supplemental?: ChannelInboundSupplementalFacts;
    contextVisibility?: ContextVisibilityMode;
    media?: readonly InboundMediaFacts[];
    suppressSelfQuoteBody?: boolean;
    suppressSelfQuoteMedia?: boolean;
}): Promise<{
    supplemental?: SupplementalContextFacts;
    media: InboundMediaFacts[];
    quoteHidden: boolean;
}>;
/**
 * @deprecated Public compatibility for callers that already prepared legacy
 * prompt fields. New channel code should use `buildChannelInboundEventContext`.
 */
export declare function finalizeChannelInboundContext<T extends Record<string, unknown>>(params: FinalizeChannelInboundContextAsyncParams<T>): Promise<FinalizeChannelInboundContextResult<T>>;
export declare function finalizeChannelInboundContext<T extends Record<string, unknown>>(params: FinalizeChannelInboundContextParams<T>): FinalizeChannelInboundContextResult<T>;
export declare function buildChannelInboundEventContext(params: BuildChannelInboundEventContextAsyncParams): Promise<BuiltChannelInboundEventContext>;
export declare function buildChannelInboundEventContext(params: BuildChannelInboundEventContextParams): BuiltChannelInboundEventContext;
export {};
