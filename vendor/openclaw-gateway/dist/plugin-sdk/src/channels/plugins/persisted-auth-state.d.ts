import type { OpenClawConfig } from "../../config/types.openclaw.js";
import type { PluginDiscoveryResult } from "../../plugins/discovery.js";
export declare function listBundledChannelIdsWithPersistedAuthState(discovery?: PluginDiscoveryResult): string[];
export declare function hasBundledChannelPersistedAuthState(params: {
    channelId: string;
    cfg: OpenClawConfig;
    env?: NodeJS.ProcessEnv;
    discovery?: PluginDiscoveryResult;
}): boolean;
