import { l as loadAuthProfileStoreWithoutExternalProfiles, p as updateAuthProfileStoreWithLock } from "./store-lFmS2pvu.js";
import { t as buildOauthProviderAuthResult } from "./provider-auth-result-8qg_ZVzB.js";
import "./provider-auth-CCtAcb6r.js";
import "./agent-runtime-BrG2cky1.js";
import { d as markMigrationItemSkipped, l as markMigrationItemConflict, o as createMigrationItem, u as markMigrationItemError } from "./migration-CzHQEI8U.js";
import { n as hasAuthProfileConfigConflict, r as hasCurrentAuthProfileConfigConflict, t as applyAuthProfileConfigWithConflictCheck } from "./auth-config-BG1pDxEP.js";
import { a as isRecord, c as readString, u as readText } from "./helpers-CHKHhoOo.js";
import { c as HERMES_REASON_SECRET_NO_LONGER_PRESENT, i as HERMES_REASON_CONFIG_RUNTIME_UNAVAILABLE, n as HERMES_REASON_AUTH_PROFILE_EXISTS, o as HERMES_REASON_INCLUDE_SECRETS, r as HERMES_REASON_AUTH_PROFILE_WRITE_FAILED, s as HERMES_REASON_MISSING_SECRET_METADATA } from "./items-BNYu-Ah0.js";
import { createHash } from "node:crypto";
//#region extensions/migrate-hermes/auth.ts
const OPENAI_CODEX_PROVIDER_ID = "openai-codex";
const OPENAI_CODEX_DEFAULT_MODEL = "openai/gpt-5.5";
const HERMES_AUTH_DISPLAY_NAME = "Hermes import";
function readTimestamp(value) {
	if (typeof value !== "string" || !value.trim()) return;
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : void 0;
}
function decodeJwtPayload(token) {
	const payload = token.split(".")[1];
	if (!payload) return;
	try {
		const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
		return isRecord(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function resolveCodexIdentity(access, accountId) {
	const payload = decodeJwtPayload(access);
	const auth = isRecord(payload?.["https://api.openai.com/auth"]) ? payload["https://api.openai.com/auth"] : {};
	const email = readString((isRecord(payload?.["https://api.openai.com/profile"]) ? payload["https://api.openai.com/profile"] : {}).email);
	const resolvedAccountId = accountId ?? readString(auth.chatgpt_account_id);
	const chatgptPlanType = readString(auth.chatgpt_plan_type);
	if (email) return {
		...resolvedAccountId ? { accountId: resolvedAccountId } : {},
		...chatgptPlanType ? { chatgptPlanType } : {},
		email,
		profileName: email
	};
	const stableSubject = readString(auth.chatgpt_account_user_id) ?? readString(auth.chatgpt_user_id) ?? readString(auth.user_id) ?? readString(payload?.sub) ?? resolvedAccountId;
	return {
		...resolvedAccountId ? { accountId: resolvedAccountId } : {},
		...chatgptPlanType ? { chatgptPlanType } : {},
		...stableSubject ? { profileName: `id-${Buffer.from(stableSubject).toString("base64url")}` } : {}
	};
}
function resolveAccessTokenExpiry(access) {
	const exp = decodeJwtPayload(access)?.exp;
	if (typeof exp === "number" && Number.isFinite(exp) && exp > 0) return Math.trunc(exp) * 1e3;
	if (typeof exp === "string" && /^\d+$/u.test(exp.trim())) return Number.parseInt(exp.trim(), 10) * 1e3;
}
function sourceCredentialFingerprint(candidate) {
	const hash = createHash("sha256");
	for (const part of [
		candidate.sourceKind,
		candidate.accountId ?? "",
		candidate.access,
		candidate.refresh
	]) {
		hash.update(part);
		hash.update("\0");
	}
	return hash.digest("hex");
}
function readProviderTokens(auth, sourcePath) {
	const providers = isRecord(auth.providers) ? auth.providers : {};
	const provider = isRecord(providers[OPENAI_CODEX_PROVIDER_ID]) ? providers[OPENAI_CODEX_PROVIDER_ID] : void 0;
	const tokens = isRecord(provider?.tokens) ? provider.tokens : void 0;
	const access = readString(tokens?.access_token);
	const refresh = readString(tokens?.refresh_token);
	if (!access || !refresh) return;
	return {
		access,
		refresh,
		sourceKind: "hermes-auth-json",
		sourceLabel: "Hermes active OpenAI Codex provider",
		sourcePath,
		updatedAt: readTimestamp(provider?.last_refresh)
	};
}
function readPoolTokens(auth, sourcePath) {
	const pool = isRecord(auth.credential_pool) ? auth.credential_pool : {};
	const entries = Array.isArray(pool[OPENAI_CODEX_PROVIDER_ID]) ? pool[OPENAI_CODEX_PROVIDER_ID] : [];
	const candidates = [];
	for (const entry of entries) {
		if (!isRecord(entry)) continue;
		const access = readString(entry.access_token);
		const refresh = readString(entry.refresh_token);
		if (!access || !refresh) continue;
		const label = readString(entry.label) ?? "Hermes OpenAI Codex credential pool";
		candidates.push({
			access,
			refresh,
			sourceKind: "hermes-auth-json",
			sourceLabel: label,
			sourcePath,
			updatedAt: readTimestamp(entry.last_refresh) ?? readTimestamp(entry.last_status_at)
		});
	}
	return candidates;
}
async function readHermesCodexAuthCandidates(authPath) {
	const raw = await readText(authPath);
	if (!raw || !authPath) return [];
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}
	if (!isRecord(parsed)) return [];
	const candidates = [readProviderTokens(parsed, authPath), ...readPoolTokens(parsed, authPath)].filter((candidate) => candidate !== void 0).toSorted((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
	candidates.forEach((candidate, index) => {
		candidate.sourceCredentialIndex = index;
	});
	return candidates;
}
async function readOpenCodeOpenAICandidates(authPath) {
	const raw = await readText(authPath);
	if (!raw || !authPath) return [];
	let parsed;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}
	if (!isRecord(parsed)) return [];
	const openai = isRecord(parsed.openai) ? parsed.openai : void 0;
	const access = readString(openai?.access);
	const accountId = readString(openai?.accountId);
	const refresh = readString(openai?.refresh);
	if (!access || !refresh) return [];
	return [{
		access,
		...accountId ? { accountId } : {},
		refresh,
		sourceKind: "opencode-auth-json",
		sourceCredentialIndex: 0,
		sourceLabel: "OpenCode OpenAI OAuth credential",
		sourcePath: authPath
	}];
}
function credentialExtra(identity) {
	const extra = {
		...identity.accountId ? { accountId: identity.accountId } : {},
		...identity.chatgptPlanType ? { chatgptPlanType: identity.chatgptPlanType } : {}
	};
	return Object.keys(extra).length > 0 ? extra : void 0;
}
function importProfileName(identity, fallback) {
	if (identity.accountId) return `account-${identity.accountId.replaceAll(/[^A-Za-z0-9._-]+/gu, "-")}`;
	if (identity.profileName?.startsWith("id-")) return identity.profileName;
	return fallback;
}
function buildAuthResult(candidate, fallbackProfileName = "hermes-import") {
	const identity = resolveCodexIdentity(candidate.access, candidate.accountId);
	return buildOauthProviderAuthResult({
		providerId: OPENAI_CODEX_PROVIDER_ID,
		defaultModel: OPENAI_CODEX_DEFAULT_MODEL,
		access: candidate.access,
		refresh: candidate.refresh,
		expires: resolveAccessTokenExpiry(candidate.access),
		email: identity.email,
		profileName: importProfileName(identity, fallbackProfileName),
		displayName: HERMES_AUTH_DISPLAY_NAME,
		credentialExtra: credentialExtra(identity)
	});
}
function readProviderAuthModelConfigs(result) {
	const models = result.configPatch?.agents?.defaults?.models;
	if (isRecord(models)) return { ...models };
	return { [readString(result.defaultModel) ?? OPENAI_CODEX_DEFAULT_MODEL]: {} };
}
function mergeModelConfigEntry(existing, patch) {
	if (existing && isRecord(existing) && isRecord(patch)) return {
		...existing,
		...patch
	};
	return existing ?? patch;
}
function applyOAuthModelConfigsToConfig(cfg, result) {
	const patchModels = readProviderAuthModelConfigs(result);
	const existingModels = cfg.agents?.defaults?.models ?? {};
	const models = result.replaceDefaultModels ? { ...patchModels } : { ...existingModels };
	if (!result.replaceDefaultModels) for (const [modelRef, modelConfig] of Object.entries(patchModels)) models[modelRef] = mergeModelConfigEntry(models[modelRef], modelConfig);
	return {
		...cfg,
		agents: {
			...cfg.agents,
			defaults: {
				...cfg.agents?.defaults,
				models
			}
		}
	};
}
function authProfileDedupeKey(profile) {
	if (profile.credential.accountId) return `${profile.credential.provider}:account:${profile.credential.accountId}`;
	if (profile.credential.email) return `${profile.credential.provider}:email:${profile.credential.email}`;
	return `${profile.credential.provider}:profile:${profile.sourceProfileId}`;
}
async function readCodexAuthProfilesFromSource(source) {
	const candidates = [...await readHermesCodexAuthCandidates(source.authPath), ...await readOpenCodeOpenAICandidates(source.opencodeAuthPath)].toSorted((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
	const profiles = [];
	const seen = /* @__PURE__ */ new Set();
	for (const [index, candidate] of candidates.entries()) {
		const result = buildAuthResult(candidate, candidates.length === 1 ? "hermes-import" : `hermes-import-${index + 1}`);
		const profile = result.profiles[0];
		if (!profile || profile.credential.type !== "oauth") continue;
		const entry = {
			candidate,
			credential: profile.credential,
			result,
			sourceProfileId: profile.profileId
		};
		const dedupeKey = authProfileDedupeKey(entry);
		if (seen.has(dedupeKey)) continue;
		seen.add(dedupeKey);
		profiles.push(entry);
	}
	return profiles;
}
async function readCodexAuthProfilesFromPath(params) {
	if (params.sourceKind === "opencode-auth-json") return await readCodexAuthProfilesFromSource({
		root: "",
		archivePaths: [],
		...params.sourcePath ? { opencodeAuthPath: params.sourcePath } : {}
	});
	return await readCodexAuthProfilesFromSource({
		root: "",
		archivePaths: [],
		...params.sourcePath ? { authPath: params.sourcePath } : {}
	});
}
function findMatchingProfile(store, credential) {
	for (const [profileId, existing] of Object.entries(store.profiles)) {
		if (existing.type !== "oauth" || existing.provider !== credential.provider) continue;
		if (credential.accountId && existing.accountId === credential.accountId) return profileId;
		if ((!credential.accountId || !existing.accountId) && credential.email && existing.email === credential.email) return profileId;
	}
}
function oauthAuthProfileConfig(profileId, credential) {
	return {
		profileId,
		provider: credential.provider,
		mode: "oauth",
		...credential.email ? { email: credential.email } : {},
		...credential.displayName ? { displayName: credential.displayName } : {}
	};
}
function matchesSourceCredentialFingerprint(profile, fingerprint) {
	return sourceCredentialFingerprint(profile.candidate) === fingerprint;
}
function findPlannedAuthProfile(params) {
	const bySourceProfileId = params.profiles.find((entry) => entry.sourceProfileId === params.sourceProfileId);
	const fingerprint = params.sourceCredentialFingerprint;
	if (!fingerprint) return bySourceProfileId;
	if (bySourceProfileId && matchesSourceCredentialFingerprint(bySourceProfileId, fingerprint)) return bySourceProfileId;
	const byIndex = params.sourceCredentialIndex === void 0 ? void 0 : params.profiles.find((entry) => entry.candidate.sourceCredentialIndex === params.sourceCredentialIndex);
	if (byIndex && matchesSourceCredentialFingerprint(byIndex, fingerprint)) return byIndex;
	return params.profiles.find((entry) => matchesSourceCredentialFingerprint(entry, fingerprint));
}
async function buildAuthItems(params) {
	const profiles = await readCodexAuthProfilesFromSource(params.source);
	if (profiles.length === 0) return [];
	const store = loadAuthProfileStoreWithoutExternalProfiles(params.targets.agentDir);
	return profiles.map((profile) => {
		const matchedProfileId = findMatchingProfile(store, profile.credential);
		const profileId = matchedProfileId ?? profile.sourceProfileId;
		const targetExists = Boolean(store.profiles[profileId]);
		const skipped = !params.ctx.includeSecrets;
		const configConflict = hasAuthProfileConfigConflict(params.ctx.config, oauthAuthProfileConfig(profileId, profile.credential), Boolean(params.ctx.overwrite));
		const conflict = (targetExists && !matchedProfileId && !params.ctx.overwrite || configConflict) && !skipped;
		return createMigrationItem({
			id: profiles.length === 1 ? `auth:${OPENAI_CODEX_PROVIDER_ID}` : `auth:${OPENAI_CODEX_PROVIDER_ID}:${profile.sourceProfileId}`,
			kind: "auth",
			action: skipped ? "skip" : "create",
			source: profile.candidate.sourcePath,
			target: `${params.targets.agentDir}/auth-profiles.json#${profileId}`,
			status: skipped ? "skipped" : conflict ? "conflict" : "planned",
			sensitive: true,
			reason: skipped ? HERMES_REASON_INCLUDE_SECRETS : conflict ? HERMES_REASON_AUTH_PROFILE_EXISTS : void 0,
			message: skipped ? "OpenAI Codex OAuth credentials detected in Hermes." : "Import Hermes OpenAI Codex OAuth credentials and configure OpenAI Codex models.",
			details: {
				provider: OPENAI_CODEX_PROVIDER_ID,
				profileId,
				...typeof profile.candidate.sourceCredentialIndex === "number" ? { sourceCredentialIndex: profile.candidate.sourceCredentialIndex } : {},
				sourceCredentialFingerprint: sourceCredentialFingerprint(profile.candidate),
				sourceProfileId: profile.sourceProfileId,
				sourceKind: profile.candidate.sourceKind,
				sourceLabel: profile.candidate.sourceLabel
			}
		});
	});
}
async function applyAuthItem(ctx, item, targets) {
	if (item.status !== "planned") return item;
	const source = item.source;
	const profileId = typeof item.details?.profileId === "string" ? item.details.profileId : "";
	const sourceProfileId = typeof item.details?.sourceProfileId === "string" ? item.details.sourceProfileId : profileId;
	const sourceCredentialIndex = typeof item.details?.sourceCredentialIndex === "number" ? item.details.sourceCredentialIndex : void 0;
	const sourceCredentialFingerprint = typeof item.details?.sourceCredentialFingerprint === "string" ? item.details.sourceCredentialFingerprint : void 0;
	if (!source || !profileId) return markMigrationItemError(item, HERMES_REASON_MISSING_SECRET_METADATA);
	const profile = findPlannedAuthProfile({
		profiles: await readCodexAuthProfilesFromPath({
			sourcePath: source,
			sourceKind: item.details?.sourceKind
		}),
		sourceProfileId,
		...sourceCredentialIndex === void 0 ? {} : { sourceCredentialIndex },
		...sourceCredentialFingerprint ? { sourceCredentialFingerprint } : {}
	});
	if (!profile) return markMigrationItemSkipped(item, HERMES_REASON_SECRET_NO_LONGER_PRESENT);
	let conflicted = false;
	let wrote = false;
	const credential = {
		...profile.credential,
		displayName: "displayName" in profile.credential && profile.credential.displayName ? profile.credential.displayName : HERMES_AUTH_DISPLAY_NAME
	};
	const configProfile = oauthAuthProfileConfig(profileId, credential);
	if (hasCurrentAuthProfileConfigConflict(ctx, configProfile)) return markMigrationItemConflict(item, HERMES_REASON_AUTH_PROFILE_EXISTS);
	const store = await updateAuthProfileStoreWithLock({
		agentDir: targets.agentDir,
		updater: (freshStore) => {
			const existing = freshStore.profiles[profileId];
			if (!ctx.overwrite && existing) {
				if (findMatchingProfile(freshStore, credential) !== profileId) {
					conflicted = true;
					return false;
				}
				return false;
			}
			freshStore.profiles[profileId] = credential;
			wrote = true;
			return true;
		}
	});
	if (conflicted) return markMigrationItemConflict(item, HERMES_REASON_AUTH_PROFILE_EXISTS);
	if (!store?.profiles[profileId]) return markMigrationItemError(item, HERMES_REASON_AUTH_PROFILE_WRITE_FAILED);
	const configResult = await applyAuthProfileConfigWithConflictCheck({
		ctx,
		profile: configProfile,
		applyConfigPatch(config) {
			return applyOAuthModelConfigsToConfig(config, profile.result);
		}
	});
	if (configResult === "conflict") return markMigrationItemConflict(item, HERMES_REASON_AUTH_PROFILE_EXISTS);
	return {
		...item,
		status: "migrated",
		message: configResult === "configured" ? item.message : `${item.message ?? "Imported auth profile."} ${HERMES_REASON_CONFIG_RUNTIME_UNAVAILABLE}.`,
		details: {
			...item.details,
			wroteAuthProfile: wrote,
			configUpdated: configResult === "configured"
		}
	};
}
//#endregion
export { buildAuthItems as n, applyAuthItem as t };
