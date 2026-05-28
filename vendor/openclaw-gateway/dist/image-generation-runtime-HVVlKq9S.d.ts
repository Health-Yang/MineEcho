import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { X as GenerateImageParams, Z as GenerateImageRuntimeResult } from "./types-core-CiUqduCn.js";
import { l as ImageGenerationProvider } from "./types-CrZyCaVl.js";
import { t as SubsystemLogger } from "./subsystem-Ce5qcC5n.js";
import { n as getProviderEnvVars } from "./provider-env-vars-v0WbYfyp.js";
import { n as listImageGenerationProviders, t as getImageGenerationProvider } from "./provider-registry-DXHWMM0P.js";

//#region src/image-generation/runtime.d.ts
declare const log: SubsystemLogger;
type ImageGenerationRuntimeDeps = {
  getProvider?: typeof getImageGenerationProvider;
  listProviders?: typeof listImageGenerationProviders;
  getProviderEnvVars?: typeof getProviderEnvVars;
  log?: Pick<typeof log, "warn">;
};
declare function listRuntimeImageGenerationProviders(params?: {
  config?: OpenClawConfig;
}, deps?: ImageGenerationRuntimeDeps): ImageGenerationProvider[];
declare function generateImage(params: GenerateImageParams, deps?: ImageGenerationRuntimeDeps): Promise<GenerateImageRuntimeResult>;
//#endregion
export { listRuntimeImageGenerationProviders as n, generateImage as t };