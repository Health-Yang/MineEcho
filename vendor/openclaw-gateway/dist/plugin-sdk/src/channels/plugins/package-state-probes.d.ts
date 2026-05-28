import type { OpenClawConfig } from "../../config/types.openclaw.js";
import type { PluginDiscoveryResult } from "../../plugins/discovery.js";
export type ChannelPackageStateMetadataKey = "configuredState" | "persistedAuthState";
export declare function listBundledChannelIdsForPackageState(metadataKey: ChannelPackageStateMetadataKey, discovery?: PluginDiscoveryResult): string[];
export declare function hasBundledChannelPackageState(params: {
    metadataKey: ChannelPackageStateMetadataKey;
    channelId: string;
    cfg: OpenClawConfig;
    env?: NodeJS.ProcessEnv;
    discovery?: PluginDiscoveryResult;
}): boolean;
