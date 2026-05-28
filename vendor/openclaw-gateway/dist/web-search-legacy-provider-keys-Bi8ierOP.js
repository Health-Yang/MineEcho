//#region src/config/web-search-legacy-provider-keys.ts
const LEGACY_WEB_SEARCH_PROVIDER_CONFIG_KEYS = new Set([
	"brave",
	"duckduckgo",
	"exa",
	"firecrawl",
	"gemini",
	"grok",
	"kimi",
	"minimax",
	"ollama",
	"perplexity",
	"searxng",
	"tavily"
]);
function isLegacyWebSearchProviderConfigKey(key) {
	return LEGACY_WEB_SEARCH_PROVIDER_CONFIG_KEYS.has(key);
}
//#endregion
export { isLegacyWebSearchProviderConfigKey as n, LEGACY_WEB_SEARCH_PROVIDER_CONFIG_KEYS as t };
