import { s as ModelDefinitionConfig } from "./types.models-CH300rpt.js";
//#region extensions/deepinfra/provider-models.d.ts
declare const DEEPINFRA_BASE_URL: string;
declare const DEEPINFRA_MODELS_URL: string;
declare const DEEPINFRA_DEFAULT_MODEL_ID = "deepseek-ai/DeepSeek-V4-Flash";
declare const DEEPINFRA_DEFAULT_MODEL_REF = "deepinfra/deepseek-ai/DeepSeek-V4-Flash";
declare const DEEPINFRA_MODEL_CATALOG: ModelDefinitionConfig[];
type DeepInfraAuthConfig = {
  secrets?: {
    defaults?: {
      env?: string;
      file?: string;
      exec?: string;
    };
  };
  models?: {
    providers?: Record<string, {
      apiKey?: unknown;
    } | undefined>;
  };
};
interface DeepInfraAgentModelPricing {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  per_image_unit?: number;
  output_seconds?: number;
  input_characters?: number;
  input_seconds?: number;
}
type DeepInfraSurface = "chat" | "vlm" | "embed" | "image-gen" | "video-gen" | "tts" | "stt";
interface DeepInfraSurfaceModel {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  contextWindow?: number;
  maxTokens?: number;
  pricing: DeepInfraAgentModelPricing;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultIterations?: number;
}
interface DeepInfraDiscoveredCatalog {
  chat: DeepInfraSurfaceModel[];
  vlm: DeepInfraSurfaceModel[];
  embed: DeepInfraSurfaceModel[];
  imageGen: DeepInfraSurfaceModel[];
  videoGen: DeepInfraSurfaceModel[];
  tts: DeepInfraSurfaceModel[];
  stt: DeepInfraSurfaceModel[];
  /** True iff served from a successful live fetch; false for the static fallback. */
  live: boolean;
}
declare function resetDeepInfraModelCacheForTest(): void;
declare function getDeepInfraSurfaceFallbackCatalog(): DeepInfraDiscoveredCatalog;
declare function buildDeepInfraModelDefinition(model: ModelDefinitionConfig): ModelDefinitionConfig;
declare function hasDeepInfraApiKey(options?: {
  env?: NodeJS.ProcessEnv;
  agentDir?: string;
  config?: DeepInfraAuthConfig;
}): boolean;
declare function discoverDeepInfraSurfaces(options?: {
  hasApiKey?: boolean;
  env?: NodeJS.ProcessEnv;
  agentDir?: string;
}): Promise<DeepInfraDiscoveredCatalog>;
declare function discoverDeepInfraModels(options?: {
  hasApiKey?: boolean;
  env?: NodeJS.ProcessEnv;
  agentDir?: string;
}): Promise<ModelDefinitionConfig[]>;
//#endregion
export { DEEPINFRA_MODEL_CATALOG as a, DeepInfraSurfaceModel as c, discoverDeepInfraSurfaces as d, getDeepInfraSurfaceFallbackCatalog as f, DEEPINFRA_MODELS_URL as i, buildDeepInfraModelDefinition as l, resetDeepInfraModelCacheForTest as m, DEEPINFRA_DEFAULT_MODEL_ID as n, DeepInfraDiscoveredCatalog as o, hasDeepInfraApiKey as p, DEEPINFRA_DEFAULT_MODEL_REF as r, DeepInfraSurface as s, DEEPINFRA_BASE_URL as t, discoverDeepInfraModels as u };