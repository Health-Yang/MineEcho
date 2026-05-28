import type { OpenClawConfig } from "../config/types.openclaw.js";
import { type PluginDiscoveryResult } from "./discovery.js";
import type { PluginManifestConfigContracts } from "./manifest.js";
import type { PluginOrigin } from "./plugin-origin.types.js";
export { collectPluginConfigContractMatches, type PluginConfigContractMatch, } from "./config-contract-matches.js";
export type PluginConfigContractMetadata = {
    origin: PluginOrigin;
    configContracts: PluginManifestConfigContracts;
};
export declare function resolvePluginConfigContractsById(params: {
    config?: OpenClawConfig;
    workspaceDir?: string;
    env?: NodeJS.ProcessEnv;
    fallbackToBundledMetadata?: boolean;
    fallbackToBundledMetadataForResolvedBundled?: boolean;
    fallbackBundledPluginIds?: readonly string[];
    pluginIds: readonly string[];
    discovery?: PluginDiscoveryResult;
}): ReadonlyMap<string, PluginConfigContractMetadata>;
