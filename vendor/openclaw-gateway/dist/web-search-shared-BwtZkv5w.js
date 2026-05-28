import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { c as isRecord$1 } from "./utils-B5r0V84N.js";
import { f as readProviderJsonObjectResponse } from "./provider-http-errors-B2G_gKJv.js";
import { a as wrapWebContent } from "./external-content-DjKXXY5B.js";
import { u as postTrustedWebToolsJson } from "./web-search-provider-common-DIMW2VWH.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./provider-http-CDs6F6rL.js";
import "./provider-web-search-CFuAcpHg.js";
import { t as normalizeXaiModelId } from "./model-id-BRM_wbb3.js";
import "./tool-config-shared-B6pi9es5.js";
//#region extensions/xai/src/responses-tool-shared.ts
function isRecord(value) {
	return value !== null && typeof value === "object";
}
function extractUrlCitations(annotations) {
	if (!Array.isArray(annotations)) return [];
	return annotations.filter((annotation) => isRecord(annotation) && annotation.type === "url_citation" && typeof annotation.url === "string").map((annotation) => annotation.url);
}
const XAI_RESPONSES_BASE_URL = "https://api.x.ai/v1";
const XAI_RESPONSES_ENDPOINT = `${XAI_RESPONSES_BASE_URL}/responses`;
function resolveXaiResponsesEndpoint(baseUrl) {
	return `${(normalizeOptionalString(baseUrl) ?? XAI_RESPONSES_BASE_URL).replace(/\/+$/, "")}/responses`;
}
function buildXaiResponsesToolBody(params) {
	return {
		model: params.model,
		input: [{
			role: "user",
			content: params.inputText
		}],
		tools: params.tools,
		...params.maxTurns ? { max_turns: params.maxTurns } : {}
	};
}
function extractXaiWebSearchContent(data) {
	for (const output of data.output ?? []) {
		if (!isRecord(output)) continue;
		if (output.type === "message") {
			const content = Array.isArray(output.content) ? output.content : [];
			for (const block of content) {
				if (!isRecord(block)) continue;
				if (block.type === "output_text" && typeof block.text === "string" && block.text) {
					const urls = extractUrlCitations(block.annotations);
					return {
						text: block.text,
						annotationCitations: uniqueStrings(urls)
					};
				}
			}
		}
		if (output.type === "output_text" && typeof output.text === "string" && output.text) {
			const urls = extractUrlCitations(output.annotations);
			return {
				text: output.text,
				annotationCitations: uniqueStrings(urls)
			};
		}
	}
	return {
		text: typeof data.output_text === "string" ? data.output_text : void 0,
		annotationCitations: []
	};
}
function requireXaiResponseTextAndCitations(data, label) {
	const { text, annotationCitations } = extractXaiWebSearchContent(data);
	if (!text) throw new Error(`${label}: malformed JSON response`);
	return {
		content: text,
		citations: Array.isArray(data.citations) && data.citations.length > 0 ? data.citations : annotationCitations
	};
}
function requireXaiResponseTextCitationsAndInline(data, label, inlineCitationsEnabled) {
	const { content, citations } = requireXaiResponseTextAndCitations(data, label);
	return {
		content,
		citations,
		inlineCitations: inlineCitationsEnabled && Array.isArray(data.inline_citations) ? data.inline_citations : void 0
	};
}
//#endregion
//#region extensions/xai/src/web-search-shared.ts
const XAI_DEFAULT_WEB_SEARCH_MODEL = "grok-4-1-fast";
function buildXaiWebSearchPayload(params) {
	return {
		query: params.query,
		provider: params.provider,
		model: params.model,
		tookMs: params.tookMs,
		externalContent: {
			untrusted: true,
			source: "web_search",
			provider: params.provider,
			wrapped: true
		},
		content: wrapWebContent(params.content, "web_search"),
		citations: params.citations,
		...params.inlineCitations ? { inlineCitations: params.inlineCitations } : {}
	};
}
function resolveXaiSearchConfig(searchConfig) {
	return (isRecord$1(searchConfig?.grok) ? searchConfig.grok : void 0) ?? {};
}
function resolveXaiWebSearchModel(searchConfig) {
	const config = resolveXaiSearchConfig(searchConfig);
	return typeof config.model === "string" && config.model.trim() ? normalizeXaiModelId(config.model.trim()) : XAI_DEFAULT_WEB_SEARCH_MODEL;
}
function resolveXaiWebSearchEndpoint(searchConfig) {
	return resolveXaiResponsesEndpoint(resolveXaiSearchConfig(searchConfig).baseUrl);
}
function resolveXaiInlineCitations(searchConfig) {
	return resolveXaiSearchConfig(searchConfig).inlineCitations === true;
}
function isAbortError(error) {
	return error instanceof Error && (error.name === "AbortError" || error.message === "This operation was aborted");
}
function wrapXaiWebSearchError(error, timeoutSeconds) {
	if (isAbortError(error)) throw new Error(`xAI web search timed out after ${timeoutSeconds}s. Increase tools.web.search.timeoutSeconds if queries are complex.`, { cause: error });
	throw error;
}
async function requestXaiWebSearch(params) {
	return await postTrustedWebToolsJson({
		url: params.endpoint,
		timeoutSeconds: params.timeoutSeconds,
		apiKey: params.apiKey,
		body: buildXaiResponsesToolBody({
			model: params.model,
			inputText: params.query,
			tools: [{ type: "web_search" }]
		}),
		errorLabel: "xAI"
	}, async (response) => {
		return requireXaiResponseTextCitationsAndInline(await readProviderJsonObjectResponse(response, "xAI web search failed"), "xAI web search failed", params.inlineCitations);
	}).catch((error) => wrapXaiWebSearchError(error, params.timeoutSeconds));
}
//#endregion
export { resolveXaiWebSearchModel as a, extractXaiWebSearchContent as c, resolveXaiResponsesEndpoint as d, resolveXaiWebSearchEndpoint as i, requireXaiResponseTextAndCitations as l, requestXaiWebSearch as n, XAI_RESPONSES_ENDPOINT as o, resolveXaiInlineCitations as r, buildXaiResponsesToolBody as s, buildXaiWebSearchPayload as t, requireXaiResponseTextCitationsAndInline as u };
