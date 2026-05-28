import { f as UnifiedModelCatalogEntry } from "../../manifest-registry-Brx4o2lo.js";
import { Jn as UnifiedModelCatalogProviderContext } from "../../types-qwKXExVW.js";
import { a as VideoGenerationModelCapabilitiesContext, s as VideoGenerationProviderCapabilities } from "../../video-generation-W5tVE9w5.js";

//#region extensions/deepinfra/surface-model-catalogs.d.ts
declare function listDeepInfraImageGenCatalog(ctx: UnifiedModelCatalogProviderContext): Promise<readonly UnifiedModelCatalogEntry[] | null>;
declare function listDeepInfraVideoGenCatalog(ctx: UnifiedModelCatalogProviderContext): Promise<readonly UnifiedModelCatalogEntry<VideoGenerationProviderCapabilities>[] | null>;
declare function resolveDeepInfraVideoModelCapabilities(ctx: VideoGenerationModelCapabilitiesContext): Promise<VideoGenerationProviderCapabilities | undefined>;
//#endregion
export { listDeepInfraImageGenCatalog, listDeepInfraVideoGenCatalog, resolveDeepInfraVideoModelCapabilities };