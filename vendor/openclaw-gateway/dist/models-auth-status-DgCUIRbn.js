import { c as isSecretRef } from "./types.secrets-CtRQ27Ls.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import "./agent-scope-CudANNo3.js";
import { s as resolveDefaultAgentDir } from "./agent-scope-config-BfxErZq2.js";
import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { r as resolveProviderIdForAuth } from "./provider-auth-aliases-5VCl4fwR.js";
import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { d as resolvePersistedAuthProfileOwnerAgentDir, i as ensureAuthProfileStoreWithoutExternalProfiles, n as ensureAuthProfileStore } from "./store-lFmS2pvu.js";
import "./auth-profiles-BqdzLfrX.js";
import { n as externalCliDiscoveryForConfigStatus } from "./external-cli-discovery-CeB9kE8m.js";
import { n as listProfilesForProvider } from "./profile-list-CYDPCn6S.js";
import { i as removeProviderAuthProfilesWithLock } from "./profiles-7sSr_su8.js";
import { n as abortChatRunsForProvider } from "./chat-abort-BRIlXlGa.js";
import { t as formatForLog } from "./ws-log-Fic6EinB.js";
import { i as warmCurrentProviderAuthState, t as clearCurrentProviderAuthState } from "./model-provider-auth-BdnG0kzt.js";
import { n as PROVIDER_LABELS, o as resolveUsageProviderId } from "./provider-usage.shared-CbVyc11B.js";
import { t as loadProviderUsageSummary } from "./provider-usage.load-BkFKp7GX.js";
import { n as buildAuthHealthSummary, r as formatRemainingShort } from "./auth-health-B5hoZNDq.js";
import { s as refreshActiveSecretsRuntimeSnapshot } from "./runtime-DokToIx1.js";
//#region src/gateway/server-methods/models-auth-status.ts
const log = createSubsystemLogger("models-auth-status");
const CACHE_TTL_MS = 6e4;
let cached = null;
/**
* Invalidate the in-memory cache. Reserved for future gateway-side auth
* mutation handlers (login, logout, token rotation) so the next read returns
* fresh data. Today those mutations happen via the CLI and the 60s TTL plus
* `{refresh: true}` param cover the stale-data window.
*/
function invalidateModelAuthStatusCache() {
	cached = null;
	clearCurrentProviderAuthState();
}
function readProviderParam(params) {
	const raw = params.provider;
	if (typeof raw !== "string") return null;
	return normalizeProviderId(raw) || null;
}
function createAuthLogoutAbortOps(context) {
	return {
		chatAbortControllers: context.chatAbortControllers,
		chatRunBuffers: context.chatRunBuffers,
		chatDeltaSentAt: context.chatDeltaSentAt,
		chatDeltaLastBroadcastLen: context.chatDeltaLastBroadcastLen,
		chatDeltaLastBroadcastText: context.chatDeltaLastBroadcastText,
		agentDeltaSentAt: context.agentDeltaSentAt,
		bufferedAgentEvents: context.bufferedAgentEvents,
		chatAbortedRuns: context.chatAbortedRuns,
		removeChatRun: context.removeChatRun,
		agentRunSeq: context.agentRunSeq,
		broadcast: context.broadcast,
		nodeSendToSession: context.nodeSendToSession
	};
}
async function removeProviderAuthProfilesAcrossOwnerStores(params) {
	const ownerAgentDirs = new Set([params.agentDir]);
	for (const profileId of params.profileIds) ownerAgentDirs.add(resolvePersistedAuthProfileOwnerAgentDir({
		agentDir: params.agentDir,
		profileId
	}));
	for (const ownerAgentDir of ownerAgentDirs) if (!await removeProviderAuthProfilesWithLock({
		provider: params.provider,
		agentDir: ownerAgentDir
	})) return false;
	return true;
}
function buildExpiry(remainingMs, expiresAt) {
	if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt) || typeof remainingMs !== "number") return;
	return {
		at: expiresAt,
		remainingMs,
		label: formatRemainingShort(remainingMs)
	};
}
function providerDisplayName(provider) {
	const usageId = resolveUsageProviderId(provider);
	if (usageId && PROVIDER_LABELS[usageId]) return PROVIDER_LABELS[usageId];
	return provider;
}
/**
* Aggregate provider status from OAuth profiles only. `buildAuthHealthSummary`
* rolls up across both OAuth and token profiles, which mis-reports providers
* where a healthy OAuth sits alongside an expired/missing bearer token.
* For the dashboard's OAuth-health signal, token profiles are a separate
* concern — we want "is OAuth healthy?", not "is every credential healthy?"
* It also consumes the provider's effective profile subset when auth order
* excludes stale inventory from the runtime credential path.
*
* `expectsOAuth` surfaces the configured-OAuth-but-no-oauth-profile case as
* `missing` instead of silently falling back to the provider's rollup (which
* would report `static` if only api_key credentials exist). Without this,
* switching a provider from api_key to oauth in config but forgetting to
* login hides behind the residual api_key profile until runtime fails.
*
* Exported for direct unit testing of the rollup rules.
*/
function aggregateOAuthStatus(prov, now = Date.now(), expectsOAuth = false) {
	const oauth = (prov.effectiveProfiles ?? prov.profiles).filter((p) => p.type === "oauth");
	if (oauth.length === 0) {
		if (expectsOAuth) return { status: "missing" };
		return {
			status: prov.status,
			expiresAt: prov.expiresAt,
			remainingMs: prov.remainingMs
		};
	}
	const statuses = new Set(oauth.map((p) => p.status));
	let status;
	if (statuses.has("expired") || statuses.has("missing")) status = "expired";
	else if (statuses.has("expiring")) status = "expiring";
	else if (statuses.has("ok")) status = "ok";
	else if (statuses.has("static")) status = "static";
	else {
		Array.from(statuses)[0];
		status = "static";
	}
	const expirable = oauth.map((p) => p.expiresAt).filter((v) => typeof v === "number" && Number.isFinite(v));
	const expiresAt = expirable.length > 0 ? Math.min(...expirable) : void 0;
	const remainingMs = expiresAt !== void 0 ? expiresAt - now : void 0;
	return {
		status,
		expiresAt,
		remainingMs
	};
}
function mapProvider(prov, usageByProvider, expectsOAuthSet) {
	const usageKey = resolveUsageProviderId(prov.provider);
	const usage = usageKey ? usageByProvider.get(usageKey) : void 0;
	const rollup = aggregateOAuthStatus(prov, Date.now(), expectsOAuthSet.has(prov.provider));
	return {
		provider: prov.provider,
		displayName: providerDisplayName(prov.provider),
		status: rollup.status,
		expiry: buildExpiry(rollup.remainingMs, rollup.expiresAt),
		profiles: prov.profiles.map((prof) => ({
			profileId: prof.profileId,
			type: prof.type,
			status: prof.status,
			expiry: buildExpiry(prof.remainingMs, prof.expiresAt)
		})),
		usage: usage ? {
			windows: usage.windows,
			plan: usage.plan
		} : void 0
	};
}
/**
* Collect provider IDs with refreshable credentials (OAuth or bearer token)
* so a configured-but-not-logged-in provider surfaces as `missing` rather
* than being silently absent. API-key and AWS-SDK providers are excluded —
* their credentials don't expire on a schedule this endpoint can meaningfully
* monitor, and surfacing them here would flash a red alert on a healthy
* API-key setup.
*
* Providers with `models.providers.<id>.apiKey` set (commonly via a
* SecretRef env binding) are excluded from the "missing" synthesis even
* when their `auth` mode is `oauth` or `token` — an env-backed credential
* is already present, so flagging the dashboard as missing would cry wolf
* for a working auth path. They can still show up with real status if the
* profile store has an entry for them.
*/
function resolveConfiguredProviders(cfg) {
	const out = /* @__PURE__ */ new Set();
	const expectsOAuth = /* @__PURE__ */ new Set();
	const envBacked = /* @__PURE__ */ new Set();
	for (const [id, provider] of Object.entries(cfg.models?.providers ?? {})) {
		const apiKey = provider?.apiKey;
		if (!id || apiKey === void 0 || apiKey === null) continue;
		let resolvable = false;
		if (typeof apiKey === "string" && apiKey.length > 0) resolvable = true;
		else if (isSecretRef(apiKey)) if (apiKey.source === "env") {
			const envValue = process.env[apiKey.id];
			resolvable = typeof envValue === "string" && envValue.length > 0;
		} else resolvable = true;
		if (resolvable) envBacked.add(normalizeProviderId(id));
	}
	for (const [id, provider] of Object.entries(cfg.models?.providers ?? {})) {
		if (!id) continue;
		const mode = provider?.auth;
		if (mode !== "oauth" && mode !== "token") continue;
		if (envBacked.has(normalizeProviderId(id))) continue;
		out.add(id);
		if (mode === "oauth") expectsOAuth.add(normalizeProviderId(id));
	}
	for (const profile of Object.values(cfg.auth?.profiles ?? {})) {
		const provider = profile?.provider;
		const mode = profile?.mode;
		if (typeof provider !== "string" || provider.length === 0 || mode !== "oauth" && mode !== "token") continue;
		if (envBacked.has(normalizeProviderId(provider))) continue;
		out.add(provider);
		if (mode === "oauth") expectsOAuth.add(normalizeProviderId(provider));
	}
	return {
		providers: Array.from(out),
		expectsOAuth
	};
}
const modelsAuthStatusHandlers = {
	"models.authLogout": async ({ params, respond, context }) => {
		const provider = readProviderParam(params);
		if (!provider) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "provider is required"));
			return;
		}
		try {
			const cfg = context.getRuntimeConfig();
			const agentDir = resolveDefaultAgentDir(cfg);
			const authProvider = resolveProviderIdForAuth(provider, { config: cfg });
			const removedProfiles = listProfilesForProvider(ensureAuthProfileStoreWithoutExternalProfiles(agentDir), provider);
			if (!await removeProviderAuthProfilesAcrossOwnerStores({
				provider,
				agentDir,
				profileIds: removedProfiles
			})) {
				respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, `failed to remove saved auth profiles for provider ${provider}`));
				return;
			}
			await refreshActiveSecretsRuntimeSnapshot();
			invalidateModelAuthStatusCache();
			clearCurrentProviderAuthState();
			warmCurrentProviderAuthState(context.getRuntimeConfig()).catch((err) => {
				log.warn(`provider auth state rewarm after logout failed: ${formatForLog(err)}`);
			});
			const { runIds: abortedRunIds } = abortChatRunsForProvider(createAuthLogoutAbortOps(context), {
				providerId: authProvider,
				stopReason: "auth-revoked"
			});
			respond(true, {
				provider,
				removedProfiles,
				abortedRunIds
			}, void 0);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	},
	"models.authStatus": async ({ params, respond, context }) => {
		const now = Date.now();
		if (!Boolean(params?.refresh) && cached && now - cached.ts < CACHE_TTL_MS) {
			respond(true, cached.result, void 0, { cached: true });
			return;
		}
		try {
			const cfg = context.getRuntimeConfig();
			const agentDir = resolveDefaultAgentDir(cfg);
			const store = ensureAuthProfileStore(agentDir, { externalCli: externalCliDiscoveryForConfigStatus({ cfg }) });
			const configured = resolveConfiguredProviders(cfg);
			const authHealth = buildAuthHealthSummary({
				store,
				cfg,
				providers: configured.providers.length > 0 ? configured.providers : void 0
			});
			const usageProviderIds = [...new Set(authHealth.profiles.filter((p) => p.type === "oauth" || p.type === "token").map((p) => resolveUsageProviderId(p.provider)).filter((id) => Boolean(id)))];
			const usageByProvider = /* @__PURE__ */ new Map();
			if (usageProviderIds.length > 0) try {
				const usage = await loadProviderUsageSummary({
					providers: usageProviderIds,
					agentDir,
					timeoutMs: 3500
				});
				for (const snap of usage.providers) usageByProvider.set(snap.provider, {
					windows: snap.windows,
					plan: snap.plan
				});
			} catch (err) {
				log.debug(`usage enrichment failed (auth status still returned): providers=${usageProviderIds.join(",")} error=${formatForLog(err)}`);
			}
			const result = {
				ts: now,
				providers: authHealth.providers.map((prov) => mapProvider(prov, usageByProvider, configured.expectsOAuth))
			};
			cached = {
				ts: now,
				result
			};
			respond(true, result, void 0);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
		}
	}
};
//#endregion
export { aggregateOAuthStatus, invalidateModelAuthStatusCache, modelsAuthStatusHandlers };
