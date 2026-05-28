import { p as readStringValue } from "../../string-coerce-DKw2K5wM.js";
import "../../string-coerce-runtime-qOd7_06l.js";
import { r as runFirecrawlScrape } from "../../firecrawl-client-BXk5yi5w.js";
//#region extensions/firecrawl/api.ts
async function fetchFirecrawlContent(params) {
	const result = await runFirecrawlScrape({
		cfg: { plugins: { entries: { firecrawl: {
			enabled: true,
			config: { webFetch: {
				apiKey: params.apiKey,
				baseUrl: params.baseUrl,
				onlyMainContent: params.onlyMainContent,
				maxAgeMs: params.maxAgeMs,
				timeoutSeconds: params.timeoutSeconds
			} }
		} } } },
		url: params.url,
		extractMode: params.extractMode,
		maxChars: params.maxChars,
		proxy: params.proxy,
		storeInCache: params.storeInCache,
		onlyMainContent: params.onlyMainContent,
		maxAgeMs: params.maxAgeMs,
		timeoutSeconds: params.timeoutSeconds
	});
	return {
		text: typeof result.text === "string" ? result.text : "",
		title: readStringValue(result.title),
		finalUrl: readStringValue(result.finalUrl),
		status: typeof result.status === "number" ? result.status : void 0,
		warning: readStringValue(result.warning)
	};
}
//#endregion
export { fetchFirecrawlContent };
