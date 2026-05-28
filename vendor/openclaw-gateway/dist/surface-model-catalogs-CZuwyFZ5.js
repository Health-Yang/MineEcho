import { c as discoverDeepInfraSurfaces } from "./provider-models-BJjZmbD6.js";
import { o as DEEPINFRA_VIDEO_ASPECT_RATIOS, s as DEEPINFRA_VIDEO_DURATIONS } from "./media-models-esM5_HbQ.js";
//#region extensions/deepinfra/surface-model-catalogs.ts
const PROVIDER_ID = "deepinfra";
function surfaceModelToImageGenEntry(model) {
	return {
		kind: "image_generation",
		provider: PROVIDER_ID,
		model: model.id,
		source: "live",
		...model.name ? { label: model.name } : {}
	};
}
function surfaceModelToVideoGenEntry(model) {
	return {
		kind: "video_generation",
		provider: PROVIDER_ID,
		model: model.id,
		source: "live",
		...model.name ? { label: model.name } : {},
		capabilities: buildDeepInfraVideoModelCapabilities()
	};
}
function buildDeepInfraVideoModelCapabilities() {
	return {
		providerOptions: {
			seed: "number",
			negative_prompt: "string",
			negativePrompt: "string",
			style: "string",
			guidance_scale: "number",
			guidanceScale: "number"
		},
		generate: {
			maxVideos: 1,
			maxDurationSeconds: 8,
			supportedDurationSeconds: [...DEEPINFRA_VIDEO_DURATIONS],
			supportsAspectRatio: true,
			aspectRatios: [...DEEPINFRA_VIDEO_ASPECT_RATIOS]
		},
		imageToVideo: { enabled: false },
		videoToVideo: { enabled: false }
	};
}
async function listDeepInfraImageGenCatalog(ctx) {
	const { discoveryApiKey } = ctx.resolveProviderApiKey(PROVIDER_ID);
	if (!discoveryApiKey) return null;
	const catalog = await discoverDeepInfraSurfaces({
		hasApiKey: true,
		env: ctx.env
	});
	if (!catalog.live || catalog.imageGen.length === 0) return null;
	return catalog.imageGen.map(surfaceModelToImageGenEntry);
}
async function listDeepInfraVideoGenCatalog(ctx) {
	const { discoveryApiKey } = ctx.resolveProviderApiKey(PROVIDER_ID);
	if (!discoveryApiKey) return null;
	const catalog = await discoverDeepInfraSurfaces({
		hasApiKey: true,
		env: ctx.env
	});
	if (!catalog.live || catalog.videoGen.length === 0) return null;
	return catalog.videoGen.map(surfaceModelToVideoGenEntry);
}
async function resolveDeepInfraVideoModelCapabilities(ctx) {
	const rawId = typeof ctx.model === "string" ? ctx.model : "";
	const normalized = rawId.startsWith(`${PROVIDER_ID}/`) ? rawId.slice(10) : rawId;
	const catalog = await discoverDeepInfraSurfaces({ env: process.env });
	return catalog.videoGen.find((m) => m.id === normalized) ?? catalog.videoGen.find((m) => m.id === rawId) ? buildDeepInfraVideoModelCapabilities() : void 0;
}
//#endregion
export { listDeepInfraVideoGenCatalog as n, resolveDeepInfraVideoModelCapabilities as r, listDeepInfraImageGenCatalog as t };
