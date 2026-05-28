import { n as resolvePluginCapabilityProvider, r as resolvePluginCapabilityProviders } from "./capability-provider-runtime-icyhwXhC.js";
import { n as normalizeCapabilityProviderId, t as buildCapabilityProviderMaps } from "./provider-registry-shared-_hohhuIp.js";
//#region src/transcripts/provider-registry.ts
function normalizeTranscriptSourceProviderId(providerId) {
	return normalizeCapabilityProviderId(providerId);
}
function resolveTranscriptsSourceProviderEntries(cfg) {
	return resolvePluginCapabilityProviders({
		key: "transcriptSourceProviders",
		cfg
	});
}
function buildProviderMaps(cfg) {
	return buildCapabilityProviderMaps(resolveTranscriptsSourceProviderEntries(cfg));
}
function listTranscriptSourceProviders(cfg) {
	return [...buildProviderMaps(cfg).canonical.values()];
}
function getTranscriptSourceProvider(providerId, cfg) {
	const normalized = normalizeTranscriptSourceProviderId(providerId);
	if (!normalized) return;
	const directProvider = resolvePluginCapabilityProvider({
		key: "transcriptSourceProviders",
		providerId: normalized,
		cfg
	});
	if (directProvider) return directProvider;
	return buildProviderMaps(cfg).aliases.get(normalized);
}
//#endregion
export { listTranscriptSourceProviders as n, normalizeTranscriptSourceProviderId as r, getTranscriptSourceProvider as t };
