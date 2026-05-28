import { r as describeImagesWithModel, t as describeImageWithModel } from "./image-runtime-DJQhxkgx.js";
import { t as transcribeOpenAiCompatibleAudio } from "./media-understanding-Dy8I26Ln.js";
import { t as DEEPINFRA_BASE_URL } from "./provider-models-BJjZmbD6.js";
import { i as DEEPINFRA_STT_FALLBACK_MODELS, l as DEEPINFRA_VLM_FALLBACK_MODELS } from "./media-models-esM5_HbQ.js";
//#region extensions/deepinfra/media-understanding-provider.ts
function resolveDefault(surfaceModels, fallback) {
	return surfaceModels?.[0]?.id ?? fallback[0] ?? "";
}
async function transcribeDeepInfraAudio(params) {
	return await transcribeOpenAiCompatibleAudio({
		...params,
		provider: "deepinfra",
		defaultBaseUrl: DEEPINFRA_BASE_URL,
		defaultModel: resolveDefault(void 0, DEEPINFRA_STT_FALLBACK_MODELS)
	});
}
function buildDeepInfraMediaUnderstandingProvider(options) {
	return {
		id: "deepinfra",
		capabilities: ["image", "audio"],
		defaultModels: {
			image: resolveDefault(options?.vlmModels, DEEPINFRA_VLM_FALLBACK_MODELS),
			audio: resolveDefault(options?.sttModels, DEEPINFRA_STT_FALLBACK_MODELS)
		},
		autoPriority: {
			image: 45,
			audio: 45
		},
		transcribeAudio: transcribeDeepInfraAudio,
		describeImage: describeImageWithModel,
		describeImages: describeImagesWithModel
	};
}
const deepinfraMediaUnderstandingProvider = buildDeepInfraMediaUnderstandingProvider();
//#endregion
export { deepinfraMediaUnderstandingProvider as n, transcribeDeepInfraAudio as r, buildDeepInfraMediaUnderstandingProvider as t };
