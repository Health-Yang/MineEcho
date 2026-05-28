import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { o as imageSourceUploadFileName, t as createOpenAiCompatibleImageGenerationProvider } from "./image-generation-BuB9pxrY.js";
import { t as DEEPINFRA_BASE_URL } from "./provider-models-BJjZmbD6.js";
import { f as normalizeDeepInfraBaseUrl, n as DEEPINFRA_IMAGE_FALLBACK_MODELS, p as normalizeDeepInfraModelRef } from "./media-models-esM5_HbQ.js";
//#region extensions/deepinfra/image-generation-provider.ts
const DEEPINFRA_IMAGE_SIZES = [
	"512x512",
	"1024x1024",
	"1024x1792",
	"1792x1024"
];
const MAX_DEEPINFRA_INPUT_IMAGES = 1;
function buildDeepInfraImageGenerationProvider(options) {
	const ids = options?.imageGenModels && options.imageGenModels.length > 0 ? options.imageGenModels.map((model) => model.id) : [...DEEPINFRA_IMAGE_FALLBACK_MODELS];
	return createOpenAiCompatibleImageGenerationProvider({
		id: "deepinfra",
		label: "DeepInfra",
		defaultModel: ids[0] ?? DEEPINFRA_IMAGE_FALLBACK_MODELS[0],
		models: ids,
		capabilities: {
			generate: {
				maxCount: 4,
				supportsSize: true,
				supportsAspectRatio: false,
				supportsResolution: false
			},
			edit: {
				enabled: true,
				maxCount: 1,
				maxInputImages: MAX_DEEPINFRA_INPUT_IMAGES,
				supportsSize: true,
				supportsAspectRatio: false,
				supportsResolution: false
			},
			geometry: { sizes: [...DEEPINFRA_IMAGE_SIZES] }
		},
		defaultBaseUrl: DEEPINFRA_BASE_URL,
		normalizeModel: normalizeDeepInfraModelRef,
		resolveBaseUrl: ({ providerConfig }) => normalizeDeepInfraBaseUrl(providerConfig?.baseUrl, DEEPINFRA_BASE_URL),
		resolveAllowPrivateNetwork: () => false,
		useConfiguredRequest: true,
		resolveCount: ({ req, mode }) => mode === "edit" ? 1 : req.count ?? 1,
		buildGenerateRequest: ({ req, model, count }) => ({
			kind: "json",
			body: {
				model,
				prompt: req.prompt,
				n: count,
				size: normalizeOptionalString(req.size) ?? "1024x1024",
				response_format: "b64_json"
			}
		}),
		buildEditRequest: ({ req, inputImages, model, count }) => {
			const image = inputImages[0];
			if (!image) throw new Error("DeepInfra image edit missing reference image.");
			const form = new FormData();
			form.set("model", model);
			form.set("prompt", req.prompt);
			form.set("n", String(count));
			form.set("size", normalizeOptionalString(req.size) ?? "1024x1024");
			form.set("response_format", "b64_json");
			const mimeType = normalizeOptionalString(image.mimeType) ?? "image/png";
			form.append("image", new Blob([new Uint8Array(image.buffer)], { type: mimeType }), imageSourceUploadFileName({
				image,
				index: 0
			}));
			return {
				kind: "multipart",
				form
			};
		},
		response: {
			defaultMimeType: "image/jpeg",
			sniffMimeType: true
		},
		tooManyInputImagesError: "DeepInfra image editing supports one reference image.",
		missingApiKeyError: "DeepInfra API key missing",
		emptyResponseError: "DeepInfra image response did not include generated image data",
		failureLabels: {
			generate: "DeepInfra image generation failed",
			edit: "DeepInfra image edit failed"
		}
	});
}
//#endregion
export { buildDeepInfraImageGenerationProvider as t };
