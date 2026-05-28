import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { t as DEEPINFRA_BASE_URL } from "./provider-models-BJjZmbD6.js";
//#region extensions/deepinfra/media-models.ts
const DEEPINFRA_NATIVE_BASE_URL = "https://api.deepinfra.com/v1/inference";
const DEFAULT_DEEPINFRA_IMAGE_SIZE = "1024x1024";
const DEFAULT_DEEPINFRA_TTS_VOICE = "af_bella";
const DEEPINFRA_VIDEO_ASPECT_RATIOS = [
	"16:9",
	"4:3",
	"1:1",
	"3:4",
	"9:16"
];
const DEEPINFRA_VIDEO_DURATIONS = [5, 8];
const DEEPINFRA_IMAGE_FALLBACK_MODELS = [
	"black-forest-labs/FLUX-1-schnell",
	"run-diffusion/Juggernaut-Lightning-Flux",
	"black-forest-labs/FLUX-1-dev",
	"Qwen/Qwen-Image-Max",
	"stabilityai/sdxl-turbo"
];
const DEEPINFRA_TTS_FALLBACK_MODELS = [
	"hexgrad/Kokoro-82M",
	"Qwen/Qwen3-TTS",
	"ResembleAI/chatterbox-turbo",
	"sesame/csm-1b"
];
const DEEPINFRA_VIDEO_FALLBACK_MODELS = [
	"Pixverse/Pixverse-T2V",
	"Pixverse/Pixverse-T2V-HD",
	"Wan-AI/Wan2.6-T2V",
	"google/veo-3.1-fast"
];
const DEEPINFRA_STT_FALLBACK_MODELS = ["openai/whisper-large-v3-turbo", "openai/whisper-large-v3"];
const DEEPINFRA_EMBED_FALLBACK_MODELS = ["BAAI/bge-m3"];
const DEEPINFRA_VLM_FALLBACK_MODELS = ["moonshotai/Kimi-K2.5"];
function normalizeDeepInfraModelRef(model, fallback) {
	const value = normalizeOptionalString(model) ?? fallback;
	return value.startsWith("deepinfra/") ? value.slice(10) : value;
}
function normalizeDeepInfraBaseUrl(value, fallback = DEEPINFRA_BASE_URL) {
	return (normalizeOptionalString(value) ?? fallback).replace(/\/+$/u, "");
}
//#endregion
export { DEEPINFRA_TTS_FALLBACK_MODELS as a, DEEPINFRA_VIDEO_FALLBACK_MODELS as c, DEFAULT_DEEPINFRA_TTS_VOICE as d, normalizeDeepInfraBaseUrl as f, DEEPINFRA_STT_FALLBACK_MODELS as i, DEEPINFRA_VLM_FALLBACK_MODELS as l, DEEPINFRA_IMAGE_FALLBACK_MODELS as n, DEEPINFRA_VIDEO_ASPECT_RATIOS as o, normalizeDeepInfraModelRef as p, DEEPINFRA_NATIVE_BASE_URL as r, DEEPINFRA_VIDEO_DURATIONS as s, DEEPINFRA_EMBED_FALLBACK_MODELS as t, DEFAULT_DEEPINFRA_IMAGE_SIZE as u };
