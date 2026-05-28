import { type PluginLoadOptions } from "./loader.js";
import type { PluginRegistry } from "./registry-types.js";
export type ActiveRuntimePluginRegistrySurface = "active" | "channel" | "http-route";
export declare function getActiveRuntimePluginRegistry(): PluginRegistry | null;
export declare function registryContainsRuntimePluginIds(registry: PluginRegistry, pluginIds: readonly string[] | undefined): boolean;
export declare function getLoadedRuntimePluginRegistry(params?: {
    env?: NodeJS.ProcessEnv;
    loadOptions?: PluginLoadOptions;
    workspaceDir?: string;
    requiredPluginIds?: readonly string[];
    surface?: ActiveRuntimePluginRegistrySurface;
}): PluginRegistry | undefined;
