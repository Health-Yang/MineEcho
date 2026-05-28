import { t as asObject } from "./provider-http-errors-B2G_gKJv.js";
import { t as createOpenAiCompatibleSpeechProvider } from "./speech-Cgmis2hc.js";
import { t as DEEPINFRA_BASE_URL } from "./provider-models-BJjZmbD6.js";
import { a as DEEPINFRA_TTS_FALLBACK_MODELS, d as DEFAULT_DEEPINFRA_TTS_VOICE, p as normalizeDeepInfraModelRef } from "./media-models-esM5_HbQ.js";
//#region extensions/deepinfra/speech-provider.ts
const DEEPINFRA_TTS_RESPONSE_FORMATS = [
	"mp3",
	"opus",
	"flac",
	"wav",
	"pcm"
];
function buildDeepInfraSpeechProvider(options) {
	const ids = options?.ttsModels && options.ttsModels.length > 0 ? options.ttsModels.map((model) => model.id) : [...DEEPINFRA_TTS_FALLBACK_MODELS];
	const defaultModel = ids[0] ?? DEEPINFRA_TTS_FALLBACK_MODELS[0];
	return createOpenAiCompatibleSpeechProvider({
		id: "deepinfra",
		label: "DeepInfra",
		autoSelectOrder: 45,
		models: ids,
		voices: [DEFAULT_DEEPINFRA_TTS_VOICE],
		defaultModel,
		defaultVoice: DEFAULT_DEEPINFRA_TTS_VOICE,
		defaultBaseUrl: DEEPINFRA_BASE_URL,
		envKey: "DEEPINFRA_API_KEY",
		responseFormats: DEEPINFRA_TTS_RESPONSE_FORMATS,
		defaultResponseFormat: "mp3",
		voiceCompatibleResponseFormats: ["mp3", "opus"],
		baseUrlPolicy: { kind: "trim-trailing-slash" },
		normalizeModel: normalizeDeepInfraModelRef,
		apiErrorLabel: "DeepInfra TTS API error",
		missingApiKeyError: "DeepInfra API key missing",
		readExtraConfig: (raw) => ({ extraBody: asObject(raw?.extraBody) }),
		extraJsonBodyFields: [{
			configKey: "extraBody",
			requestKey: "extra_body"
		}]
	});
}
//#endregion
export { buildDeepInfraSpeechProvider as t };
