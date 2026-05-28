import { a as normalizeLowercaseStringOrEmpty, p as readStringValue } from "./string-coerce-DKw2K5wM.js";
import { r as resolveProviderRequestCapabilities } from "./provider-attribution-CG-kSTIB.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./provider-http-CDs6F6rL.js";
import { n as MISTRAL_MODEL_TRANSPORT_PATCH } from "./api-BPoOt3QH.js";
//#region extensions/mistral/provider-compat.ts
const MISTRAL_MODEL_HINTS = [
	"mistral",
	"mistralai",
	"mixtral",
	"codestral",
	"pixtral",
	"devstral",
	"ministral"
];
function isMistralModelHint(modelId) {
	const normalized = normalizeLowercaseStringOrEmpty(modelId);
	return MISTRAL_MODEL_HINTS.some((hint) => normalized === hint || normalized.startsWith(`${hint}/`) || normalized.startsWith(`${hint}-`) || normalized.startsWith(`${hint}:`));
}
function shouldContributeMistralCompat(params) {
	if (params.model.api !== "openai-completions") return false;
	const capabilities = resolveProviderRequestCapabilities({
		provider: readStringValue(params.model.provider),
		api: "openai-completions",
		baseUrl: readStringValue(params.model.baseUrl),
		capability: "llm",
		transport: "stream",
		modelId: params.modelId,
		compat: params.model.compat && typeof params.model.compat === "object" ? params.model.compat : void 0
	});
	return capabilities.knownProviderFamily === "mistral" || capabilities.endpointClass === "mistral-public" || isMistralModelHint(params.modelId);
}
function contributeMistralResolvedModelCompat(params) {
	return shouldContributeMistralCompat(params) ? MISTRAL_MODEL_TRANSPORT_PATCH : void 0;
}
//#endregion
export { contributeMistralResolvedModelCompat as t };
