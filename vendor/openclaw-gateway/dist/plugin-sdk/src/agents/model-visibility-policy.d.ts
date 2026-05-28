import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { ModelCatalogEntry } from "./model-catalog.types.js";
import type { ModelManifestNormalizationContext } from "./model-selection-normalize.js";
import { type ModelVisibilityPolicy } from "./model-selection-shared.js";
export declare const RUNTIME_MODEL_VISIBILITY_NORMALIZATION: {
    readonly allowManifestNormalization: true;
    readonly allowPluginNormalization: true;
};
export declare function createModelVisibilityPolicy(params: {
    cfg: OpenClawConfig;
    catalog: ModelCatalogEntry[];
    defaultProvider: string;
    defaultModel?: string;
    agentId?: string;
    allowManifestNormalization?: boolean;
    allowPluginNormalization?: boolean;
} & ModelManifestNormalizationContext): ModelVisibilityPolicy;
export type { ModelVisibilityPolicy };
