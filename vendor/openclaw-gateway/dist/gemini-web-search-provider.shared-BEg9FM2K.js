import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { c as isRecord } from "./utils-B5r0V84N.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { r as normalizeGoogleApiBaseUrl } from "./provider-policy-BxyJw06c.js";
//#region extensions/google/src/gemini-web-search-provider.shared.ts
const DEFAULT_GEMINI_WEB_SEARCH_MODEL = "gemini-2.5-flash";
function resolveGeminiConfig(searchConfig) {
	const gemini = searchConfig?.gemini;
	return isRecord(gemini) ? gemini : {};
}
function resolveGeminiModel(gemini) {
	return normalizeOptionalString(gemini?.model) ?? DEFAULT_GEMINI_WEB_SEARCH_MODEL;
}
function resolveGeminiBaseUrl(gemini) {
	return normalizeGoogleApiBaseUrl(normalizeOptionalString(gemini?.baseUrl) ?? normalizeOptionalString(gemini?.providerBaseUrl));
}
//#endregion
export { resolveGeminiConfig as n, resolveGeminiModel as r, resolveGeminiBaseUrl as t };
