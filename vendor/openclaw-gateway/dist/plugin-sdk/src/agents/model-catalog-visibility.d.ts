import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { ModelCatalogEntry } from "./model-catalog.js";
type ModelCatalogVisibilityView = "default" | "configured" | "all";
type ProviderAuthChecker = (provider: string) => boolean | Promise<boolean>;
export declare function resolveVisibleModelCatalog(params: {
    cfg: OpenClawConfig;
    catalog: ModelCatalogEntry[];
    defaultProvider: string;
    defaultModel?: string;
    agentId?: string;
    workspaceDir?: string;
    env?: NodeJS.ProcessEnv;
    view?: ModelCatalogVisibilityView;
    runtimeAuthDiscovery?: boolean;
    providerAuthChecker?: ProviderAuthChecker;
}): Promise<ModelCatalogEntry[]>;
export {};
