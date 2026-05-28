import { type ChannelRouteParsedTarget } from "../../plugin-sdk/channel-route.js";
export type { ChannelRouteParsedTarget } from "../../plugin-sdk/channel-route.js";
/** @deprecated Use `ChannelRouteParsedTarget`; provider-specific target grammar should live in `messaging.resolveOutboundSessionRoute`. */
export type ParsedChannelExplicitTarget = {
    to: string;
    threadId?: string | number;
    chatType?: "direct" | "group" | "channel";
};
export declare function resolveCompatParsedRouteTarget(params: {
    channel: string;
    rawTarget?: string | null;
    fallbackThreadId?: string | number | null;
    parseTarget: (channel: string, rawTarget: string) => ParsedChannelExplicitTarget | null;
}): ChannelRouteParsedTarget | null;
/** @deprecated Use `ChannelRouteParsedTarget`. */
export type ComparableChannelTarget = ChannelRouteParsedTarget;
/** @deprecated Use `messaging.targetResolver` and `messaging.resolveOutboundSessionRoute`. */
export declare function parseExplicitTargetForLoadedChannel(channel: string, rawTarget: string): ParsedChannelExplicitTarget | null;
/** @deprecated Use `messaging.resolveOutboundSessionRoute` for provider-specific target grammar. */
export declare function resolveRouteTargetForLoadedChannel(params: {
    channel: string;
    rawTarget?: string | null;
    fallbackThreadId?: string | number | null;
}): ChannelRouteParsedTarget | null;
export declare function resolveExplicitDeliveryTargetCompat(params: {
    channel: string;
    rawTarget?: string | null;
    fallbackThreadId?: string | number | null;
}): ChannelRouteParsedTarget | null;
/** @deprecated Use `messaging.resolveOutboundSessionRoute` for provider-specific target grammar. */
export declare function resolveComparableTargetForLoadedChannel(params: {
    channel: string;
    rawTarget?: string | null;
    fallbackThreadId?: string | number | null;
}): ChannelRouteParsedTarget | null;
/** @deprecated Use `channelRouteTargetsMatchExact` from `openclaw/plugin-sdk/channel-route`. */
export declare function comparableChannelTargetsMatch(params: {
    left?: ChannelRouteParsedTarget | null;
    right?: ChannelRouteParsedTarget | null;
}): boolean;
/** @deprecated Use `channelRouteTargetsShareConversation` from `openclaw/plugin-sdk/channel-route`. */
export declare function comparableChannelTargetsShareRoute(params: {
    left?: ChannelRouteParsedTarget | null;
    right?: ChannelRouteParsedTarget | null;
}): boolean;
