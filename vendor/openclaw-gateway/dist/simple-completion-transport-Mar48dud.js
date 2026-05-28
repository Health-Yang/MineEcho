import { a as prepareTransportAwareSimpleModel, i as createOpenClawTransportStreamFnForModel, n as buildTransportAwareSimpleStreamFn, o as resolveTransportAwareSimpleApi, s as ensureCustomApiRegistered, t as registerProviderStreamForModel } from "./provider-stream-CIUub-IS.js";
import { t as createAnthropicVertexStreamFnForModel } from "./anthropic-vertex-stream-ClAPQ1nd.js";
import { getApiProvider } from "@earendil-works/pi-ai";
//#region src/agents/simple-completion-transport.ts
function resolveAnthropicVertexSimpleApi(baseUrl) {
	return `openclaw-anthropic-vertex-simple:${baseUrl?.trim() ? encodeURIComponent(baseUrl.trim()) : "default"}`;
}
function normalizeCodexResponsesBaseUrlForOpenAISdk(baseUrl) {
	const normalized = baseUrl?.trim().replace(/\/+$/u, "") || "https://chatgpt.com/backend-api";
	try {
		const parsed = new URL(normalized);
		const path = parsed.pathname.replace(/\/+$/u, "").toLowerCase();
		if (parsed.hostname.toLowerCase() === "chatgpt.com" && [
			"/backend-api",
			"/backend-api/v1",
			"/backend-api/codex",
			"/backend-api/codex/v1",
			"/backend-api/codex/responses"
		].includes(path)) {
			parsed.pathname = "/backend-api/codex";
			parsed.search = "";
			parsed.hash = "";
			return parsed.toString().replace(/\/$/u, "");
		}
	} catch {}
	if (normalized.endsWith("/codex/responses")) return normalized.slice(0, -10);
	if (normalized.endsWith("/codex")) return normalized;
	return `${normalized}/codex`;
}
function prepareCodexSimpleTransportModel(model, cfg) {
	if (model.provider !== "openai-codex" || model.api !== "openai-codex-responses") return;
	const transportModel = {
		...model,
		baseUrl: normalizeCodexResponsesBaseUrlForOpenAISdk(model.baseUrl)
	};
	const api = resolveTransportAwareSimpleApi(model.api);
	const streamFn = createOpenClawTransportStreamFnForModel(transportModel, { cfg });
	if (!api || !streamFn) return;
	ensureCustomApiRegistered(api, streamFn);
	return {
		...transportModel,
		api
	};
}
function prepareModelForSimpleCompletion(params) {
	const { model, cfg } = params;
	if (!getApiProvider(model.api) && registerProviderStreamForModel({
		model,
		cfg
	})) return model;
	const codexTransportModel = prepareCodexSimpleTransportModel(model, cfg);
	if (codexTransportModel) return codexTransportModel;
	const transportAwareModel = prepareTransportAwareSimpleModel(model, { cfg });
	if (transportAwareModel !== model) {
		const streamFn = buildTransportAwareSimpleStreamFn(model, { cfg });
		if (streamFn) {
			ensureCustomApiRegistered(transportAwareModel.api, streamFn);
			return transportAwareModel;
		}
	}
	if (model.provider === "anthropic-vertex") {
		const api = resolveAnthropicVertexSimpleApi(model.baseUrl);
		ensureCustomApiRegistered(api, createAnthropicVertexStreamFnForModel(model));
		return {
			...model,
			api
		};
	}
	return model;
}
//#endregion
export { prepareModelForSimpleCompletion as t };
