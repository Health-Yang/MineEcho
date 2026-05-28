import type { PluginDiscoveryResult } from "../plugins/discovery.js";
import type { PluginManifestRegistry } from "../plugins/manifest-registry.js";
import type { PluginAutoEnableCandidate } from "./plugin-auto-enable.types.js";
import type { OpenClawConfig } from "./types.openclaw.js";
export declare function detectPluginAutoEnableCandidates(params: {
    config?: OpenClawConfig;
    env?: NodeJS.ProcessEnv;
    manifestRegistry?: PluginManifestRegistry;
    discovery?: PluginDiscoveryResult;
}): PluginAutoEnableCandidate[];
