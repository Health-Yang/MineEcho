import { p as normalizeUniqueStringEntries } from "./string-normalization-B8G0vlWE.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { s as normalizePluginsConfig } from "./config-state-CzzsKZJi.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import { a as resolveProviderAuthEnvVarCandidates } from "./provider-env-vars-CteAyjcQ.js";
import "./config-BtNBbhZb.js";
import { s as loadManifestMetadataSnapshot } from "./manifest-contract-eligibility-BhX2UsCC.js";
import { i as passesManifestOwnerBasePolicy, n as isActivatedManifestOwner } from "./manifest-owner-policy-BKVRFeLo.js";
import { L as resolveProviderUsageAuthWithPlugin, R as resolveProviderUsageSnapshotWithPlugin } from "./provider-runtime-CGENk1Ok.js";
import { i as ensureAuthProfileStoreWithoutExternalProfiles, n as ensureAuthProfileStore } from "./store-lFmS2pvu.js";
import { t as hasAnyAuthProfileStoreSource } from "./source-check-D-qOGbI1.js";
import { u as isNonSecretApiKeyMarker } from "./model-auth-markers-BxvoYSZo.js";
import "./model-selection-DF4MbMUd.js";
import { n as normalizeSecretInput } from "./normalize-secret-input-CsdRhsMj.js";
import { t as resolveEnvApiKey } from "./model-auth-env-Yj6OHlxK.js";
import "./auth-profiles-BqdzLfrX.js";
import { n as resolveApiKeyForProfile } from "./oauth-BjbnMzpU.js";
import { n as listProfilesForProvider, t as dedupeProfileIds } from "./profile-list-CYDPCn6S.js";
import { i as resolveAuthProfileOrder } from "./order-Df4RKtkA.js";
import { f as resolveUsableCustomProviderApiKey } from "./model-auth-DEXDfJh7.js";
import { t as resolveFetch } from "./fetch-c0PcnxVA.js";
import { a as resolveLegacyPiAgentAccessToken, c as withTimeout, i as ignoredErrors, n as PROVIDER_LABELS, s as usageProviders } from "./provider-usage.shared-CbVyc11B.js";
//#region src/infra/provider-usage.auth.ts
function resolveUsageAuthStore(state) {
	state.store ??= ensureAuthProfileStore(state.agentDir, { allowKeychainPrompt: false });
	return state.store;
}
function resolveProviderApiKeyFromConfig(params) {
	const envDirect = params.envDirect?.map(normalizeSecretInput).find(Boolean);
	if (envDirect) return envDirect;
	for (const providerId of params.providerIds) {
		const envKey = resolveEnvApiKey(providerId, params.state.env)?.apiKey;
		if (envKey) return envKey;
		const key = resolveUsableCustomProviderApiKey({
			cfg: params.state.cfg,
			provider: providerId,
			env: params.state.env
		})?.apiKey;
		if (key) return key;
	}
}
function hasProviderAuthEnvCredentialSource(params) {
	const candidates = resolveProviderAuthEnvVarCandidates({
		config: params.state.cfg,
		env: {
			...process.env.VITEST ? process.env : {},
			...params.state.env
		}
	});
	for (const providerId of normalizeProviderIds(params.providerIds)) {
		const envVars = Object.hasOwn(candidates, providerId) ? candidates[providerId] : void 0;
		if (!envVars) continue;
		if (envVars.some((envVar) => Boolean(normalizeSecretInput(params.state.env[envVar])))) return true;
	}
	return false;
}
function resolveProviderApiKeyFromConfigAndStore(params) {
	const configKey = resolveProviderApiKeyFromConfig(params);
	if (configKey || !params.state.allowAuthProfileStore) return configKey;
	const cred = [...new Set(normalizeUniqueStringEntries(params.providerIds.map((providerId) => normalizeProviderId(providerId))))].flatMap((providerId) => listProfilesForProvider(resolveUsageAuthStore(params.state), providerId)).map((id) => resolveUsageAuthStore(params.state).profiles[id]).find((profile) => profile?.type === "api_key" || profile?.type === "token");
	if (!cred) return;
	if (cred.type === "api_key") {
		const key = normalizeSecretInput(cred.key);
		if (key && !isNonSecretApiKeyMarker(key)) return key;
		return;
	}
	const token = normalizeSecretInput(cred.token);
	if (token && !isNonSecretApiKeyMarker(token)) return token;
}
function normalizeProviderIds(providerIds) {
	return [...new Set([...providerIds].map((providerId) => providerId ? normalizeProviderId(providerId) : void 0).filter((providerId) => Boolean(providerId)))];
}
function isUsageProviderManifestEligible(params) {
	const normalizedConfig = normalizePluginsConfig(params.state.cfg.plugins);
	if (!passesManifestOwnerBasePolicy({
		plugin: params.plugin,
		normalizedConfig
	})) return false;
	if (params.plugin.origin !== "workspace") return true;
	return isActivatedManifestOwner({
		plugin: params.plugin,
		normalizedConfig,
		rootConfig: params.state.cfg
	});
}
function resolveUsageCredentialProviderIds(params) {
	const providerIds = new Set(normalizeProviderIds([params.provider]));
	const providerIdSet = new Set(providerIds);
	try {
		const snapshot = loadManifestMetadataSnapshot({
			config: params.state.cfg,
			env: params.state.env
		});
		for (const plugin of snapshot.plugins) {
			const pluginProviderIds = normalizeProviderIds(plugin.providers);
			if (!pluginProviderIds.some((providerId) => providerIdSet.has(providerId))) continue;
			if (!isUsageProviderManifestEligible({
				plugin,
				state: params.state
			})) continue;
			for (const providerId of pluginProviderIds) providerIds.add(providerId);
		}
	} catch {}
	return [...providerIds];
}
async function resolveOAuthToken(params) {
	if (!params.state.allowAuthProfileStore) return null;
	const store = resolveUsageAuthStore(params.state);
	const deduped = dedupeProfileIds(resolveAuthProfileOrder({
		cfg: params.state.cfg,
		store,
		provider: params.provider
	}));
	for (const profileId of deduped) {
		const cred = store.profiles[profileId];
		if (!cred || cred.type !== "oauth" && cred.type !== "token") continue;
		try {
			const resolved = await resolveApiKeyForProfile({
				cfg: params.state.cfg,
				store,
				profileId,
				agentDir: params.state.agentDir
			});
			if (!resolved) continue;
			return {
				provider: params.provider,
				token: resolved.apiKey,
				accountId: cred.type === "oauth" && "accountId" in cred ? cred.accountId : void 0
			};
		} catch {}
	}
	return null;
}
async function resolveProviderUsageAuthViaPlugin(params) {
	const resolved = await resolveProviderUsageAuthWithPlugin({
		provider: params.provider,
		config: params.state.cfg,
		env: params.state.env,
		context: {
			config: params.state.cfg,
			agentDir: params.state.agentDir,
			env: params.state.env,
			provider: params.provider,
			resolveApiKeyFromConfigAndStore: (options) => resolveProviderApiKeyFromConfigAndStore({
				state: params.state,
				providerIds: options?.providerIds ?? [params.provider],
				envDirect: options?.envDirect
			}),
			resolveOAuthToken: async (options) => {
				const auth = await resolveOAuthToken({
					state: params.state,
					provider: options?.provider ?? params.provider
				});
				return auth ? {
					token: auth.token,
					...auth.accountId ? { accountId: auth.accountId } : {}
				} : null;
			}
		}
	});
	if (!resolved?.token) return null;
	return {
		provider: params.provider,
		token: resolved.token,
		...resolved.accountId ? { accountId: resolved.accountId } : {}
	};
}
async function resolveProviderUsageAuthFallback(params) {
	const oauthToken = await resolveOAuthToken({
		state: params.state,
		provider: params.provider
	});
	if (oauthToken) return oauthToken;
	const apiKey = resolveProviderApiKeyFromConfigAndStore({
		state: params.state,
		providerIds: [params.provider]
	});
	if (apiKey) return {
		provider: params.provider,
		token: apiKey
	};
	return null;
}
function hasAuthProfileCredentialSource(params) {
	const store = ensureAuthProfileStoreWithoutExternalProfiles(params.state.agentDir, { allowKeychainPrompt: false });
	for (const provider of params.providerIds) if (dedupeProfileIds(resolveAuthProfileOrder({
		cfg: params.state.cfg,
		store,
		provider
	})).some((profileId) => {
		const cred = store.profiles[profileId];
		return cred?.type === "api_key" || cred?.type === "oauth" || cred?.type === "token";
	})) return true;
	return false;
}
function resolveLegacyPiAgentProviderIds(provider) {
	return provider === "zai" ? ["z-ai", "zai"] : [provider];
}
async function resolveProviderAuths(params) {
	if (params.auth) return params.auth;
	const stateBase = {
		cfg: params.config ?? getRuntimeConfig(),
		env: params.env ?? process.env,
		agentDir: params.agentDir
	};
	const authProfileSourceState = {
		...stateBase,
		allowAuthProfileStore: true
	};
	const hasAuthProfileStoreSource = params.skipPluginAuthWithoutCredentialSource ? hasAnyAuthProfileStoreSource(params.agentDir) : false;
	const auths = [];
	for (const provider of params.providers) {
		if (!params.skipPluginAuthWithoutCredentialSource) {
			const pluginAuth = await resolveProviderUsageAuthViaPlugin({
				state: authProfileSourceState,
				provider
			});
			if (pluginAuth) {
				auths.push(pluginAuth);
				continue;
			}
			const fallbackAuth = await resolveProviderUsageAuthFallback({
				state: authProfileSourceState,
				provider
			});
			if (fallbackAuth) auths.push(fallbackAuth);
			continue;
		}
		const directCredentialState = {
			...stateBase,
			allowAuthProfileStore: false
		};
		const credentialProviderIds = resolveUsageCredentialProviderIds({
			state: directCredentialState,
			provider
		});
		const hasDirectCredentialSource = Boolean(resolveProviderApiKeyFromConfig({
			state: directCredentialState,
			providerIds: credentialProviderIds
		})) || hasProviderAuthEnvCredentialSource({
			state: directCredentialState,
			providerIds: credentialProviderIds
		});
		const allowAuthProfileStore = hasDirectCredentialSource || hasAuthProfileStoreSource && hasAuthProfileCredentialSource({
			state: authProfileSourceState,
			providerIds: credentialProviderIds
		});
		const state = {
			...stateBase,
			allowAuthProfileStore
		};
		const hasLegacyPiAgentCredentialSource = Boolean(resolveLegacyPiAgentAccessToken(stateBase.env, resolveLegacyPiAgentProviderIds(provider)));
		if (hasDirectCredentialSource || allowAuthProfileStore || hasLegacyPiAgentCredentialSource) {
			const pluginAuth = await resolveProviderUsageAuthViaPlugin({
				state,
				provider
			});
			if (pluginAuth) {
				auths.push(pluginAuth);
				continue;
			}
		}
		const fallbackAuth = await resolveProviderUsageAuthFallback({
			state,
			provider
		});
		if (fallbackAuth) auths.push(fallbackAuth);
	}
	return auths;
}
//#endregion
//#region src/infra/provider-usage.load.ts
async function fetchProviderUsageSnapshotFallback(params) {
	params.timeoutMs;
	params.fetchFn;
	return {
		provider: params.auth.provider,
		displayName: PROVIDER_LABELS[params.auth.provider] ?? params.auth.provider,
		windows: [],
		error: "Unsupported provider"
	};
}
async function fetchProviderUsageSnapshot(params) {
	const pluginSnapshot = await resolveProviderUsageSnapshotWithPlugin({
		provider: params.auth.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		context: {
			config: params.config,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			env: params.env,
			provider: params.auth.provider,
			token: params.auth.token,
			accountId: params.auth.accountId,
			timeoutMs: params.timeoutMs,
			fetchFn: params.fetchFn
		}
	});
	if (pluginSnapshot) return pluginSnapshot;
	return await fetchProviderUsageSnapshotFallback({
		auth: params.auth,
		timeoutMs: params.timeoutMs,
		fetchFn: params.fetchFn
	});
}
async function loadProviderUsageSummary(opts = {}) {
	const now = opts.now ?? Date.now();
	const timeoutMs = opts.timeoutMs ?? 5e3;
	const config = opts.config ?? getRuntimeConfig();
	const env = opts.env ?? process.env;
	const fetchFn = resolveFetch(opts.fetch);
	if (!fetchFn) throw new Error("fetch is not available");
	const auths = await resolveProviderAuths({
		providers: opts.providers ?? usageProviders,
		auth: opts.auth,
		agentDir: opts.agentDir,
		config,
		env,
		skipPluginAuthWithoutCredentialSource: opts.skipPluginAuthWithoutCredentialSource
	});
	if (auths.length === 0) return {
		updatedAt: now,
		providers: []
	};
	const tasks = auths.map((auth) => {
		const failureSnapshot = (error) => ({
			provider: auth.provider,
			displayName: PROVIDER_LABELS[auth.provider] ?? auth.provider,
			windows: [],
			error
		});
		return withTimeout(fetchProviderUsageSnapshot({
			auth,
			config,
			env,
			agentDir: opts.agentDir,
			workspaceDir: opts.workspaceDir,
			timeoutMs,
			fetchFn
		}), timeoutMs + 1e3, {
			provider: auth.provider,
			displayName: PROVIDER_LABELS[auth.provider],
			windows: [],
			error: "Timeout"
		}).catch((error) => {
			return failureSnapshot((error instanceof Error ? error.message : String(error)).trim() || "Fetch failed");
		});
	});
	return {
		updatedAt: now,
		providers: (await Promise.all(tasks)).filter((entry) => {
			if (entry.windows.length > 0) return true;
			if (!entry.error) return true;
			return !ignoredErrors.has(entry.error);
		})
	};
}
//#endregion
export { loadProviderUsageSummary as t };
