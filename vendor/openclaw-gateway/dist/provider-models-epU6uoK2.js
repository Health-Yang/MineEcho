import { s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { a as normalizeModelCompat } from "./provider-model-compat-M50YUhbu.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./provider-model-shared-Co6lnz7Y.js";
import { t as normalizeXaiModelId } from "./model-id-BRM_wbb3.js";
import { d as resolveXaiCatalogEntry } from "./model-definitions-BkLft5Sb.js";
import { t as applyXaiRuntimeModelCompat } from "./runtime-model-compat-DTkywupu.js";
//#region extensions/xai/provider-models.ts
const XAI_MODERN_MODEL_PREFIXES = [
	"grok-build-0.1",
	"grok-4.3",
	"grok-4.20"
];
function isModernXaiModel(modelId) {
	const lower = normalizeOptionalLowercaseString(normalizeXaiModelId(modelId.trim())) ?? "";
	if (!lower || lower.includes("multi-agent")) return false;
	return XAI_MODERN_MODEL_PREFIXES.some((prefix) => lower.startsWith(prefix));
}
function resolveXaiForwardCompatModel(params) {
	const definition = resolveXaiCatalogEntry(params.ctx.modelId);
	if (!definition) return;
	return applyXaiRuntimeModelCompat(normalizeModelCompat({
		id: definition.id,
		name: definition.name,
		api: params.ctx.providerConfig?.api ?? "openai-responses",
		provider: params.providerId,
		baseUrl: params.ctx.providerConfig?.baseUrl ?? "https://api.x.ai/v1",
		reasoning: definition.reasoning,
		input: definition.input,
		cost: definition.cost,
		contextWindow: definition.contextWindow,
		maxTokens: definition.maxTokens
	}));
}
//#endregion
export { resolveXaiForwardCompatModel as n, isModernXaiModel as t };
