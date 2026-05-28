import type { OpenClawConfig } from "../../config/types.openclaw.js";
import type { PluginDiscoveryResult } from "../../plugins/discovery.js";
export declare function listBundledChannelIdsWithConfiguredState(discovery?: PluginDiscoveryResult): string[];
export declare function hasBundledChannelConfiguredState(params: {
    channelId: string;
    cfg: OpenClawConfig;
    env?: NodeJS.ProcessEnv;
    discovery?: PluginDiscoveryResult;
}): boolean;
