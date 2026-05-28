import type { ChannelId } from "../../channels/plugins/types.public.js";
import type { OpenClawConfig } from "../../config/types.openclaw.js";
import { type OutboundSessionRoute } from "../../infra/outbound/outbound-session.js";
import { type ResolvedMessagingTarget } from "../../infra/outbound/target-resolver.js";
export { getLoadedChannelPluginForRead } from "../../channels/plugins/registry-loaded-read.js";
export { mapAllowFromEntries } from "../../plugin-sdk/channel-config-helpers.js";
export { resolveFirstBoundAccountId } from "../../routing/bound-account-read.js";
export declare function resolveChannelTargetForDelivery(params: {
    cfg: OpenClawConfig;
    channel: ChannelId;
    input: string;
    accountId?: string | null;
}): Promise<{
    ok: true;
    target: ResolvedMessagingTarget;
} | {
    ok: false;
    error: Error;
}>;
export declare function resolveOutboundSessionRouteForDelivery(params: {
    cfg: OpenClawConfig;
    channel: ChannelId;
    agentId: string;
    accountId?: string | null;
    target: string;
    resolvedTarget?: ResolvedMessagingTarget;
    threadId?: string | number | null;
    currentSessionKey?: string;
}): Promise<OutboundSessionRoute | null>;
export declare function channelCanResolveOutboundSessionRoute(params: {
    cfg: OpenClawConfig;
    channel: ChannelId;
}): boolean;
