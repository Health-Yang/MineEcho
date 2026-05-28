import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { t as asFiniteNumber } from "./number-coercion-CZ-2BQ9V.js";
import { r as extensionForMime } from "./mime-DppuT-pZ.js";
import { t as canonicalizeBase64 } from "./base64-D03BM6T6.js";
import { n as assertOkOrThrowHttpError } from "./provider-http-errors-B2G_gKJv.js";
import { c as postJsonRequest, p as resolveProviderHttpRequestConfig } from "./shared-C0lxZ9gR.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { r as isProviderApiKeyConfigured } from "./provider-auth-CCtAcb6r.js";
import "./media-runtime-BndVydhQ.js";
import "./media-mime-j2Nhr7Df.js";
import { o as resolveApiKeyForProvider } from "./provider-auth-runtime-DypUtByG.js";
import "./provider-http-CDs6F6rL.js";
import { c as DEEPINFRA_VIDEO_FALLBACK_MODELS, f as normalizeDeepInfraBaseUrl, o as DEEPINFRA_VIDEO_ASPECT_RATIOS, p as normalizeDeepInfraModelRef, r as DEEPINFRA_NATIVE_BASE_URL, s as DEEPINFRA_VIDEO_DURATIONS } from "./media-models-esM5_HbQ.js";
import { r as resolveDeepInfraVideoModelCapabilities } from "./surface-model-catalogs-CZuwyFZ5.js";
//#region extensions/deepinfra/video-generation-provider.ts
function encodeDeepInfraModelPath(model) {
	return model.split("/").map(encodeURIComponent).join("/");
}
function resolveDeepInfraNativeBaseUrl(req) {
	const providerConfig = req.cfg?.models?.providers?.deepinfra;
	const nativeBaseUrl = normalizeOptionalString(providerConfig?.nativeBaseUrl);
	if (nativeBaseUrl) return normalizeDeepInfraBaseUrl(nativeBaseUrl, DEEPINFRA_NATIVE_BASE_URL);
	const configuredBaseUrl = normalizeOptionalString(providerConfig?.baseUrl);
	if (configuredBaseUrl?.includes("/v1/inference")) return normalizeDeepInfraBaseUrl(configuredBaseUrl, DEEPINFRA_NATIVE_BASE_URL);
	return DEEPINFRA_NATIVE_BASE_URL;
}
function normalizeDeepInfraVideoUrl(url) {
	if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
	return new URL(url, "https://api.deepinfra.com").href;
}
function parseVideoDataUrl(url) {
	const match = /^data:([^;,]+);base64,(.+)$/u.exec(url);
	if (!match) return;
	const mimeType = match[1] ?? "video/mp4";
	const ext = extensionForMime(mimeType)?.slice(1) ?? "mp4";
	const canonicalBase64 = canonicalizeBase64(match[2] ?? "");
	if (!canonicalBase64) throw new Error("DeepInfra video response returned malformed data URL base64");
	return {
		buffer: Buffer.from(canonicalBase64, "base64"),
		mimeType,
		fileName: `video-1.${ext}`
	};
}
function resolveDurationSeconds(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return;
	return value <= 6.5 ? 5 : 8;
}
function buildDeepInfraVideoBody(req, model) {
	const options = req.providerOptions ?? {};
	const body = { prompt: req.prompt };
	const aspectRatio = normalizeOptionalString(req.aspectRatio);
	if (aspectRatio) body.aspect_ratio = aspectRatio;
	const duration = resolveDurationSeconds(req.durationSeconds);
	if (duration) body.duration = duration;
	const seed = asFiniteNumber(options.seed);
	if (seed != null) body.seed = seed;
	const negativePrompt = normalizeOptionalString(options.negative_prompt) ?? normalizeOptionalString(options.negativePrompt);
	if (negativePrompt) body.negative_prompt = negativePrompt;
	const style = normalizeOptionalString(options.style);
	if (style) body.style = style;
	const guidanceScale = asFiniteNumber(options.guidance_scale) ?? asFiniteNumber(options.guidanceScale);
	if (guidanceScale != null && model.startsWith("Wan-AI/")) body.guidance_scale = guidanceScale;
	return body;
}
function firstDeepInfraVideoUrl(payload) {
	const direct = normalizeOptionalString(payload.video_url) ?? normalizeOptionalString(payload.video);
	if (direct) return direct;
	for (const entry of payload.videos ?? []) {
		const videoUrl = typeof entry === "string" ? normalizeOptionalString(entry) : normalizeOptionalString(entry.url) ?? normalizeOptionalString(entry.video_url);
		if (videoUrl) return videoUrl;
	}
}
function extractDeepInfraVideoAsset(payload) {
	const videoUrl = firstDeepInfraVideoUrl(payload);
	if (!videoUrl) throw new Error("DeepInfra video response missing video URL");
	const normalizedUrl = normalizeDeepInfraVideoUrl(videoUrl);
	const dataAsset = parseVideoDataUrl(normalizedUrl);
	if (dataAsset) return dataAsset;
	return {
		url: normalizedUrl,
		mimeType: "video/mp4",
		fileName: "video-1.mp4"
	};
}
function failureMessage(payload) {
	const status = (normalizeOptionalString(payload.inference_status?.status) ?? normalizeOptionalString(payload.status))?.toLowerCase();
	if (status === "failed" || status === "error") return "DeepInfra video generation failed";
}
function buildDeepInfraVideoGenerationProvider(options) {
	const ids = options?.videoGenModels && options.videoGenModels.length > 0 ? options.videoGenModels.map((model) => model.id) : [...DEEPINFRA_VIDEO_FALLBACK_MODELS];
	const defaultModel = ids[0] ?? DEEPINFRA_VIDEO_FALLBACK_MODELS[0];
	return {
		id: "deepinfra",
		label: "DeepInfra",
		defaultModel,
		models: ids,
		resolveModelCapabilities: resolveDeepInfraVideoModelCapabilities,
		isConfigured: ({ agentDir }) => isProviderApiKeyConfigured({
			provider: "deepinfra",
			agentDir
		}),
		capabilities: {
			generate: {
				maxVideos: 1,
				maxDurationSeconds: 8,
				supportedDurationSeconds: [...DEEPINFRA_VIDEO_DURATIONS],
				supportsAspectRatio: true,
				aspectRatios: [...DEEPINFRA_VIDEO_ASPECT_RATIOS],
				providerOptions: {
					seed: "number",
					negative_prompt: "string",
					negativePrompt: "string",
					style: "string",
					guidance_scale: "number",
					guidanceScale: "number"
				}
			},
			imageToVideo: { enabled: false },
			videoToVideo: { enabled: false }
		},
		async generateVideo(req) {
			if ((req.inputImages?.length ?? 0) > 0) throw new Error("DeepInfra video generation currently supports text-to-video only.");
			if ((req.inputVideos?.length ?? 0) > 0) throw new Error("DeepInfra video generation does not support video reference inputs.");
			const auth = await resolveApiKeyForProvider({
				provider: "deepinfra",
				cfg: req.cfg,
				agentDir: req.agentDir,
				store: req.authStore
			});
			if (!auth.apiKey) throw new Error("DeepInfra API key missing");
			const model = normalizeDeepInfraModelRef(req.model, defaultModel);
			const { baseUrl, allowPrivateNetwork, headers, dispatcherPolicy } = resolveProviderHttpRequestConfig({
				baseUrl: resolveDeepInfraNativeBaseUrl(req),
				defaultBaseUrl: DEEPINFRA_NATIVE_BASE_URL,
				allowPrivateNetwork: false,
				defaultHeaders: {
					Authorization: `Bearer ${auth.apiKey}`,
					"Content-Type": "application/json"
				},
				provider: "deepinfra",
				capability: "video",
				transport: "http"
			});
			const { response, release } = await postJsonRequest({
				url: `${baseUrl}/${encodeDeepInfraModelPath(model)}`,
				headers,
				body: buildDeepInfraVideoBody(req, model),
				timeoutMs: req.timeoutMs,
				fetchFn: fetch,
				allowPrivateNetwork,
				dispatcherPolicy
			});
			try {
				await assertOkOrThrowHttpError(response, "DeepInfra video generation failed");
				let payload;
				try {
					payload = await response.json();
				} catch (cause) {
					throw new Error("DeepInfra video generation failed: malformed JSON response", { cause });
				}
				const failed = failureMessage(payload);
				if (failed) throw new Error(failed);
				return {
					videos: [extractDeepInfraVideoAsset(payload)],
					model,
					metadata: {
						requestId: normalizeOptionalString(payload.request_id),
						seed: payload.seed,
						status: payload.inference_status?.status ?? payload.status
					}
				};
			} finally {
				await release();
			}
		}
	};
}
//#endregion
export { buildDeepInfraVideoGenerationProvider as t };
