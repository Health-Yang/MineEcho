import { Kn as SpeechProviderPlugin } from "./types-qwKXExVW.js";
import { c as DeepInfraSurfaceModel } from "./provider-models--rKimEI6.js";
//#region extensions/deepinfra/speech-provider.d.ts
declare function buildDeepInfraSpeechProvider(options?: {
  ttsModels?: readonly DeepInfraSurfaceModel[];
}): SpeechProviderPlugin;
//#endregion
export { buildDeepInfraSpeechProvider as t };