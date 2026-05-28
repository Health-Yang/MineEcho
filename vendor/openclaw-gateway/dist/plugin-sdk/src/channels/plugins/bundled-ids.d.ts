import type { PluginDiscoveryResult } from "../../plugins/discovery.js";
export declare function listBundledChannelPluginIdsForRoot(_packageRoot: string, env?: NodeJS.ProcessEnv, discovery?: PluginDiscoveryResult): string[];
export declare function listBundledChannelIdsForRoot(_packageRoot: string, env?: NodeJS.ProcessEnv, discovery?: PluginDiscoveryResult): string[];
export declare function listBundledChannelPluginIds(env?: NodeJS.ProcessEnv, discovery?: PluginDiscoveryResult): string[];
export declare function listBundledChannelIds(env?: NodeJS.ProcessEnv, discovery?: PluginDiscoveryResult): string[];
