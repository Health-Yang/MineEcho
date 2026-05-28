import { t as DEEPINFRA_BASE_URL } from "../../provider-models--rKimEI6.js";

//#region extensions/deepinfra/media-models.d.ts
declare const DEEPINFRA_NATIVE_BASE_URL = "https://api.deepinfra.com/v1/inference";
declare const DEFAULT_DEEPINFRA_IMAGE_SIZE = "1024x1024";
declare const DEFAULT_DEEPINFRA_TTS_VOICE = "af_bella";
declare const DEEPINFRA_VIDEO_ASPECT_RATIOS: readonly ["16:9", "4:3", "1:1", "3:4", "9:16"];
declare const DEEPINFRA_VIDEO_DURATIONS: readonly [5, 8];
declare const DEEPINFRA_IMAGE_FALLBACK_MODELS: readonly ["black-forest-labs/FLUX-1-schnell", "run-diffusion/Juggernaut-Lightning-Flux", "black-forest-labs/FLUX-1-dev", "Qwen/Qwen-Image-Max", "stabilityai/sdxl-turbo"];
declare const DEEPINFRA_TTS_FALLBACK_MODELS: readonly ["hexgrad/Kokoro-82M", "Qwen/Qwen3-TTS", "ResembleAI/chatterbox-turbo", "sesame/csm-1b"];
declare const DEEPINFRA_VIDEO_FALLBACK_MODELS: readonly ["Pixverse/Pixverse-T2V", "Pixverse/Pixverse-T2V-HD", "Wan-AI/Wan2.6-T2V", "google/veo-3.1-fast"];
declare const DEEPINFRA_STT_FALLBACK_MODELS: readonly ["openai/whisper-large-v3-turbo", "openai/whisper-large-v3"];
declare const DEEPINFRA_EMBED_FALLBACK_MODELS: readonly ["BAAI/bge-m3"];
declare const DEEPINFRA_VLM_FALLBACK_MODELS: readonly ["moonshotai/Kimi-K2.5"];
declare function normalizeDeepInfraModelRef(model: string | undefined, fallback: string): string;
declare function normalizeDeepInfraBaseUrl(value: unknown, fallback?: string): string;
//#endregion
export { DEEPINFRA_BASE_URL, DEEPINFRA_EMBED_FALLBACK_MODELS, DEEPINFRA_IMAGE_FALLBACK_MODELS, DEEPINFRA_NATIVE_BASE_URL, DEEPINFRA_STT_FALLBACK_MODELS, DEEPINFRA_TTS_FALLBACK_MODELS, DEEPINFRA_VIDEO_ASPECT_RATIOS, DEEPINFRA_VIDEO_DURATIONS, DEEPINFRA_VIDEO_FALLBACK_MODELS, DEEPINFRA_VLM_FALLBACK_MODELS, DEFAULT_DEEPINFRA_IMAGE_SIZE, DEFAULT_DEEPINFRA_TTS_VOICE, normalizeDeepInfraBaseUrl, normalizeDeepInfraModelRef };