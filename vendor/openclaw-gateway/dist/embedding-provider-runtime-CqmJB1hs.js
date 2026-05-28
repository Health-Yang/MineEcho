import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { A as getRegisteredEmbeddingProvider, j as listRegisteredEmbeddingProviders } from "./loader-ChBMT90m.js";
import { n as resolvePluginCapabilityProvider, r as resolvePluginCapabilityProviders } from "./capability-provider-runtime-icyhwXhC.js";
//#region src/plugins/embedding-provider-runtime.ts
const OPENAI_COMPATIBLE_EMBEDDING_PROVIDER_ID = "openai-compatible";
const OPENAI_COMPATIBLE_MODEL_APIS = new Set(["openai-completions", "openai-responses"]);
function listRegisteredEmbeddingProviderAdapters() {
	return listRegisteredEmbeddingProviders().map((entry) => entry.adapter);
}
function listEmbeddingProviders(cfg) {
	const registered = listRegisteredEmbeddingProviderAdapters();
	const merged = new Map(registered.map((adapter) => [adapter.id, adapter]));
	for (const adapter of resolvePluginCapabilityProviders({
		key: "embeddingProviders",
		cfg
	})) if (!merged.has(adapter.id)) merged.set(adapter.id, adapter);
	return [...merged.values()];
}
function readConfiguredProviderApiId(providerId, cfg) {
	const providers = cfg?.models?.providers;
	if (!providers) return;
	const normalized = normalizeProviderId(providerId);
	const providerConfig = providers[providerId] ?? Object.entries(providers).find(([candidateId]) => normalizeProviderId(candidateId) === normalized)?.[1];
	const api = providerConfig?.api?.trim();
	if (!api && providerConfig?.baseUrl?.trim()) return OPENAI_COMPATIBLE_EMBEDDING_PROVIDER_ID;
	if (!api) return;
	const normalizedApi = normalizeProviderId(api);
	const embeddingProviderId = OPENAI_COMPATIBLE_MODEL_APIS.has(normalizedApi) ? OPENAI_COMPATIBLE_EMBEDDING_PROVIDER_ID : normalizedApi;
	return embeddingProviderId && embeddingProviderId !== normalized ? embeddingProviderId : void 0;
}
function resolveEmbeddingProviderLookupIds(id, cfg) {
	const ids = [id];
	const apiId = readConfiguredProviderApiId(id, cfg);
	if (apiId && !ids.some((candidate) => normalizeProviderId(candidate) === apiId)) ids.push(apiId);
	return ids;
}
function getEmbeddingProvider(id, cfg) {
	const ids = resolveEmbeddingProviderLookupIds(id, cfg);
	for (const candidateId of ids) {
		const registered = getRegisteredEmbeddingProvider(candidateId);
		if (registered) return registered.adapter;
	}
	for (const candidateId of ids) {
		const provider = resolvePluginCapabilityProvider({
			key: "embeddingProviders",
			providerId: candidateId,
			cfg
		});
		if (provider) return provider;
	}
}
//#endregion
export { listEmbeddingProviders as n, getEmbeddingProvider as t };
