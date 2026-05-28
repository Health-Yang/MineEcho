import { buildChannelInboundEventContext, finalizeChannelInboundContext, filterChannelInboundQuoteContext, filterChannelInboundSupplementalContext, resolveChannelInboundSupplementalContext, type BuildChannelInboundEventContextAsyncParams, type BuildChannelInboundEventContextParams, type BuiltChannelInboundEventContext, type ChannelInboundSupplementalResolutionOptions, type FinalizeChannelInboundContextAsyncParams, type FinalizeChannelInboundContextParams, type FinalizeChannelInboundContextResult } from "../channels/inbound-event/context.js";
import type { InboundEventKind } from "../channels/inbound-event/kind.js";
export { createInboundDebouncer, resolveInboundDebounceMs, } from "../auto-reply/inbound-debounce.js";
export { createDirectDmPreCryptoGuardPolicy, createPreCryptoDirectDmAuthorizer, dispatchInboundDirectDmWithRuntime, resolveInboundDirectDmAccessWithRuntime, type AccessGroupMembershipResolver, type DirectDmCommandAuthorizationRuntime, type DirectDmPreCryptoGuardPolicy, type DirectDmPreCryptoGuardPolicyOverrides, type ResolvedInboundDirectDmAccess, } from "../channels/direct-dm.js";
export { formatInboundEnvelope, formatInboundFromLabel, resolveEnvelopeFormatOptions, } from "../auto-reply/envelope.js";
export type { EnvelopeFormatOptions } from "../auto-reply/envelope.js";
export { buildMentionRegexes, matchesMentionPatterns, matchesMentionWithExplicit, normalizeMentionText, } from "../auto-reply/reply/mentions.js";
export { createChannelInboundDebouncer, shouldDebounceTextInbound, } from "../channels/inbound-debounce-policy.js";
export type { InboundMentionFacts, InboundMentionPolicy, InboundImplicitMentionKind, InboundMentionDecision, MentionGateParams, MentionGateResult, MentionGateWithBypassParams, MentionGateWithBypassResult, ResolveInboundMentionDecisionFlatParams, ResolveInboundMentionDecisionNestedParams, ResolveInboundMentionDecisionParams, } from "../channels/mention-gating.js";
export { implicitMentionKindWhen, resolveInboundMentionDecision, resolveMentionGating, resolveMentionGatingWithBypass, } from "../channels/mention-gating.js";
export type { LocationSource, NormalizedLocation } from "../channels/location.js";
export { formatLocationText, toLocationContext } from "../channels/location.js";
export type { LogFn } from "../channels/logging.js";
export { logInboundDrop } from "../channels/logging.js";
export { resolveInboundSessionEnvelopeContext } from "../channels/session-envelope.js";
export { classifyChannelInboundEvent, resolveUnmentionedGroupInboundPolicy, } from "../channels/inbound-event/classification.js";
export type { ClassifyChannelInboundEventParams } from "../channels/inbound-event/classification.js";
export { buildChannelInboundEventContext, finalizeChannelInboundContext, filterChannelInboundQuoteContext, filterChannelInboundSupplementalContext, resolveChannelInboundSupplementalContext, };
export type { BuildChannelInboundEventContextAsyncParams, BuildChannelInboundEventContextParams, BuiltChannelInboundEventContext, ChannelInboundSupplementalResolutionOptions, FinalizeChannelInboundContextAsyncParams, FinalizeChannelInboundContextParams, FinalizeChannelInboundContextResult, };
/** @deprecated Use `BuildChannelInboundEventContextParams`. */
export type BuildChannelTurnContextParams = Omit<BuildChannelInboundEventContextParams, "message"> & {
    message: BuildChannelInboundEventContextParams["message"] & {
        inboundTurnKind?: InboundEventKind;
    };
};
/** @deprecated Use `BuiltChannelInboundEventContext`. */
export type BuiltChannelTurnContext = BuiltChannelInboundEventContext & {
    InboundTurnKind: InboundEventKind;
};
/** @deprecated Use `buildChannelInboundEventContext`. */
export declare function buildChannelTurnContext(params: BuildChannelTurnContextParams): BuiltChannelTurnContext;
/** @deprecated Use `filterChannelInboundSupplementalContext`. */
export declare const filterChannelTurnSupplementalContext: typeof filterChannelInboundSupplementalContext;
export { runChannelInboundEvent, runPreparedInboundReply, dispatchChannelInboundReply, recordDroppedChannelInboundHistory, dispatchReplyFromConfigWithSettledDispatcher, hasFinalInboundReplyDispatch, hasVisibleInboundReplyDispatch, recordChannelBotPairLoopAndCheckSuppression, resolveInboundReplyDispatchCounts, } from "../channels/message/inbound-reply-dispatch.js";
export type { AssembledInboundReply, ChannelBotLoopProtectionFacts, ChannelInboundEventRunnerParams, ChannelInboundDroppedHistoryOptions, PreparedInboundReply, InboundReplyDispatchResult, InboundReplyRecordOptions, } from "../channels/message/inbound-reply-dispatch.js";
export { toHistoryMediaEntries, toInboundMediaFacts, buildChannelInboundMediaPayload, buildChannelInboundMediaPayload as buildChannelTurnMediaPayload, } from "../channels/inbound-event/media.js";
export type { ChannelInboundMediaInput, ChannelInboundMediaInput as ChannelTurnMediaInput, ChannelInboundMediaPayload, ChannelInboundMediaPayload as ChannelTurnMediaPayload, } from "../channels/inbound-event/media.js";
export type { CommandFacts, InboundMediaFacts, SupplementalContextFacts, } from "../channels/turn/types.js";
export type { InboundEventKind } from "../channels/inbound-event/kind.js";
export type { InboundEventKind as InboundTurnKind } from "../channels/inbound-event/kind.js";
export { createCommandTurnContext, isAuthorizedTextSlashCommandTurn, isExplicitCommandTurn, isNativeCommandTurn, isTextSlashCommandTurn, } from "../auto-reply/command-turn-context.js";
export type { CommandTurnContext } from "../auto-reply/command-turn-context.js";
export { mergeInboundPathRoots } from "../media/inbound-path-policy.js";
