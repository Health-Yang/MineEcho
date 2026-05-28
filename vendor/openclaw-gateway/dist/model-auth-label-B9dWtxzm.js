import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { F as readClaudeCliCredentialsCached, I as readCodexCliCredentialsCached, l as loadAuthProfileStoreWithoutExternalProfiles, n as ensureAuthProfileStore } from "./store-lFmS2pvu.js";
import "./model-selection-DF4MbMUd.js";
import { t as resolveEnvApiKey } from "./model-auth-env-Yj6OHlxK.js";
import { i as resolveAuthProfileDisplayLabel } from "./auth-profiles-BqdzLfrX.js";
import { r as externalCliDiscoveryForProviderAuth } from "./external-cli-discovery-CeB9kE8m.js";
import { i as resolveAuthProfileOrder, n as isStoredCredentialCompatibleWithAuthProvider } from "./order-Df4RKtkA.js";
import { f as resolveUsableCustomProviderApiKey } from "./model-auth-DEXDfJh7.js";
//#region src/agents/model-auth-label.ts
function resolveModelAuthLabel(params) {
	const resolvedProvider = params.provider?.trim();
	if (!resolvedProvider) return;
	const providerKey = normalizeProviderId(resolvedProvider);
	const store = params.includeExternalProfiles === false ? loadAuthProfileStoreWithoutExternalProfiles(params.agentDir) : ensureAuthProfileStore(params.agentDir, { externalCli: externalCliDiscoveryForProviderAuth({
		cfg: params.cfg,
		provider: providerKey,
		preferredProfile: params.sessionEntry?.authProfileOverride
	}) });
	const profileOverride = params.sessionEntry?.authProfileOverride?.trim();
	const acceptedProviderKeys = uniqueStrings([...(params.acceptedProviderIds ?? []).map(normalizeProviderId), providerKey].filter(Boolean));
	const candidates = [profileOverride, ...uniqueStrings(acceptedProviderKeys.flatMap((acceptedProvider) => resolveAuthProfileOrder({
		cfg: params.cfg,
		store,
		provider: acceptedProvider,
		preferredProfile: profileOverride
	})))].filter(Boolean);
	for (const profileId of candidates) {
		const profile = store.profiles[profileId];
		if (!profile || !acceptedProviderKeys.some((acceptedProvider) => isStoredCredentialCompatibleWithAuthProvider({
			cfg: params.cfg,
			provider: acceptedProvider,
			credential: profile
		}))) continue;
		const label = resolveAuthProfileDisplayLabel({
			cfg: params.cfg,
			store,
			profileId
		});
		if (profile.type === "oauth") return `oauth${label ? ` (${label})` : ""}`;
		if (profile.type === "token") return `token${label ? ` (${label})` : ""}`;
		return `api-key${label ? ` (${label})` : ""}`;
	}
	const envKey = resolveEnvApiKey(providerKey, process.env, {
		config: params.cfg,
		workspaceDir: params.workspaceDir
	});
	if (envKey?.apiKey) {
		if (envKey.source.includes("OAUTH_TOKEN")) return `oauth (${envKey.source})`;
		return `api-key (${envKey.source})`;
	}
	if (providerKey === "codex" && readCodexCliCredentialsCached({
		ttlMs: 5e3,
		allowKeychainPrompt: false
	})) return "oauth (codex-cli)";
	if (providerKey === "claude-cli" && readClaudeCliCredentialsCached({
		ttlMs: 5e3,
		allowKeychainPrompt: false
	})) return "oauth (claude-cli)";
	if (resolveUsableCustomProviderApiKey({
		cfg: params.cfg,
		provider: providerKey
	})) return `api-key (models.json)`;
	return "unknown";
}
//#endregion
export { resolveModelAuthLabel as t };
