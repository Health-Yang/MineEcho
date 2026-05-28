import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { s as statRegularFileSync } from "./regular-file-BFvcwX3y.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { n as readJsonFileWithFallback } from "./json-store-DXH8dkSO.js";
import { u as resolveChannelAllowFromPath } from "./pairing-store-BHCtszQV.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./state-paths-CdKTFFfY.js";
import "./security-runtime-SX8TzrnK.js";
import "./channel-pairing-BQ_p8VVd.js";
import "./session-store-runtime-w-H-NASb.js";
import { n as resolveDefaultTelegramAccountId, t as listTelegramAccountIds } from "./account-selection-CTbKywpe.js";
import { c as resolveTelegramMessageCachePersistentScopeKey, n as TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE, o as listTelegramLegacyMessageCacheEntries, s as resolveTelegramMessageCachePath, t as TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES } from "./message-cache-CwsZzz1b.js";
import { t as normalizeTelegramBotInfo } from "./bot-info-Bv59m7ss.js";
import { n as getTelegramRuntime } from "./runtime-CySuXZyV.js";
import { t as fingerprintTelegramBotToken } from "./token-fingerprint-5R81vEJi.js";
import { a as resolveTopicNameCachePath, i as resolveTopicNameCacheNamespace, o as resolveTopicNameCacheScope, r as listTelegramLegacyTopicNameCacheEntries, t as TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES } from "./topic-name-cache-BwE_w-au.js";
import path from "node:path";
import os from "node:os";
//#region extensions/telegram/src/bot-info-cache.ts
const LEGACY_STORE_VERSION = 1;
const TELEGRAM_BOT_INFO_CACHE_NAMESPACE = "telegram.bot-info-cache";
function normalizeAccountId(accountId) {
	const trimmed = accountId?.trim();
	if (!trimmed) return "default";
	return trimmed.replace(/[^a-z0-9._-]+/gi, "_");
}
function fingerprintFromToken(botToken) {
	const trimmed = botToken?.trim();
	if (!trimmed) return null;
	return fingerprintTelegramBotToken(trimmed);
}
function resolveTelegramBotInfoCachePath(accountId, env = process.env) {
	const stateDir = resolveStateDir(env, os.homedir);
	return path.join(stateDir, "telegram", `bot-info-${normalizeAccountId(accountId)}.json`);
}
function openBotInfoCacheStore() {
	return getTelegramRuntime().state.openKeyedStore({
		namespace: "telegram.bot-info-cache",
		maxEntries: 128,
		defaultTtlMs: 864e5
	});
}
function parseCachedTelegramBotInfo(value) {
	if (!value || typeof value !== "object") return null;
	const state = value;
	if (typeof state.tokenFingerprint !== "string" || typeof state.fetchedAt !== "string" || Number.isNaN(Date.parse(state.fetchedAt))) return null;
	const botInfo = normalizeTelegramBotInfo(state.botInfo);
	if (!botInfo) return null;
	return {
		tokenFingerprint: state.tokenFingerprint,
		fetchedAt: state.fetchedAt,
		botInfo
	};
}
function parseLegacyCachedTelegramBotInfo(value) {
	if (!value || typeof value !== "object") return null;
	if (value.version !== LEGACY_STORE_VERSION) return null;
	return parseCachedTelegramBotInfo(value);
}
async function readCachedTelegramBotInfo(params) {
	const tokenFingerprint = fingerprintFromToken(params.botToken);
	if (!tokenFingerprint) return null;
	const parsed = parseCachedTelegramBotInfo(await openBotInfoCacheStore().lookup(normalizeAccountId(params.accountId)));
	if (!parsed || parsed.tokenFingerprint !== tokenFingerprint) return null;
	const fetchedAtMs = Date.parse(parsed.fetchedAt);
	if ((params.now?.getTime() ?? Date.now()) - fetchedAtMs > 864e5) return null;
	return {
		botInfo: parsed.botInfo,
		fetchedAt: parsed.fetchedAt
	};
}
async function writeCachedTelegramBotInfo(params) {
	const tokenFingerprint = fingerprintFromToken(params.botToken);
	if (!tokenFingerprint) return;
	const botInfo = normalizeTelegramBotInfo(params.botInfo);
	if (!botInfo) return;
	await openBotInfoCacheStore().register(normalizeAccountId(params.accountId), {
		tokenFingerprint,
		fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
		botInfo
	});
}
async function deleteCachedTelegramBotInfo(params) {
	await openBotInfoCacheStore().delete(normalizeAccountId(params.accountId));
}
async function listTelegramLegacyBotInfoCacheEntries(params) {
	const { value } = await readJsonFileWithFallback(params.persistedPath, null);
	const parsed = parseLegacyCachedTelegramBotInfo(value);
	if (!parsed) return [];
	return [{
		key: normalizeAccountId(params.accountId),
		value: parsed
	}];
}
//#endregion
//#region extensions/telegram/src/state-migrations.ts
function fileExists(pathValue) {
	try {
		return !statRegularFileSync(pathValue).missing;
	} catch {
		return false;
	}
}
function resolveLegacySessionStorePath(params) {
	const stateDir = params.stateDir ?? path.dirname(path.dirname(path.dirname(path.dirname(resolveStorePath(void 0, { env: params.env })))));
	return path.join(stateDir, "sessions", "sessions.json");
}
function detectTelegramMessageCacheLegacyStateMigration(params) {
	const runtimePersistedPath = resolveTelegramMessageCachePath(resolveStorePath(params.cfg.session?.store, { env: params.env }));
	const legacyPersistedPath = resolveTelegramMessageCachePath(resolveLegacySessionStorePath(params));
	const scopeKey = resolveTelegramMessageCachePersistentScopeKey(runtimePersistedPath);
	return uniqueStrings([runtimePersistedPath, legacyPersistedPath]).flatMap((persistedPath) => {
		if (!fileExists(persistedPath)) return [];
		return {
			kind: "plugin-state-import",
			label: "Telegram prompt-context message cache",
			sourcePath: persistedPath,
			targetPath: `plugin state:${TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE}`,
			pluginId: "telegram",
			namespace: TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE,
			maxEntries: TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES,
			scopeKey,
			cleanupSource: "rename",
			preview: `- Telegram prompt-context message cache: ${persistedPath} → plugin state (${TELEGRAM_MESSAGE_CACHE_PERSISTENT_NAMESPACE})`,
			readEntries: () => {
				return listTelegramLegacyMessageCacheEntries({
					persistedPath,
					maxMessages: TELEGRAM_MESSAGE_CACHE_PERSISTENT_MAX_MESSAGES
				});
			}
		};
	});
}
function detectTelegramBotInfoCacheLegacyStateMigration(params) {
	return listTelegramAccountIds(params.cfg).flatMap((accountId) => {
		const persistedPath = resolveTelegramBotInfoCachePath(accountId, params.env);
		if (!fileExists(persistedPath)) return [];
		return {
			kind: "plugin-state-import",
			label: "Telegram startup bot info cache",
			sourcePath: persistedPath,
			targetPath: `plugin state:${TELEGRAM_BOT_INFO_CACHE_NAMESPACE}`,
			pluginId: "telegram",
			namespace: TELEGRAM_BOT_INFO_CACHE_NAMESPACE,
			maxEntries: 128,
			scopeKey: "",
			cleanupSource: "rename",
			preview: `- Telegram startup bot info cache: ${persistedPath} → plugin state (${TELEGRAM_BOT_INFO_CACHE_NAMESPACE})`,
			readEntries: () => {
				return listTelegramLegacyBotInfoCacheEntries({
					accountId,
					persistedPath
				});
			}
		};
	});
}
function topicNameCacheImportSource(params) {
	const scope = resolveTopicNameCacheScope(params.targetStorePath ?? params.sourceStorePath);
	return {
		sourcePath: resolveTopicNameCachePath(params.sourceStorePath),
		namespace: resolveTopicNameCacheNamespace(scope)
	};
}
function detectTelegramTopicNameCacheLegacyStateMigration(params) {
	const accountSources = listTelegramAccountIds(params.cfg).map((accountId) => {
		return topicNameCacheImportSource({ sourceStorePath: resolveStorePath(params.cfg.session?.store, {
			env: params.env,
			agentId: accountId
		}) });
	});
	const defaultStorePath = resolveStorePath(params.cfg.session?.store, { env: params.env });
	const defaultAccountStorePath = resolveStorePath(params.cfg.session?.store, {
		env: params.env,
		agentId: resolveDefaultTelegramAccountId(params.cfg)
	});
	const legacyStorePath = resolveLegacySessionStorePath(params);
	return [...new Map([
		...accountSources,
		topicNameCacheImportSource({ sourceStorePath: defaultStorePath }),
		topicNameCacheImportSource({
			sourceStorePath: legacyStorePath,
			targetStorePath: defaultAccountStorePath
		})
	].map((source) => [`${source.sourcePath}\0${source.namespace}`, source])).values()].flatMap((source) => {
		if (!fileExists(source.sourcePath)) return [];
		return {
			kind: "plugin-state-import",
			label: "Telegram forum topic-name cache",
			sourcePath: source.sourcePath,
			targetPath: `plugin state:${source.namespace}`,
			pluginId: "telegram",
			namespace: source.namespace,
			maxEntries: TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES,
			scopeKey: "",
			cleanupSource: "rename",
			preview: `- Telegram forum topic-name cache: ${source.sourcePath} → plugin state (${source.namespace})`,
			readEntries: () => {
				return listTelegramLegacyTopicNameCacheEntries({
					persistedPath: source.sourcePath,
					maxEntries: TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES
				});
			}
		};
	});
}
async function detectTelegramLegacyStateMigrations(params) {
	const plans = [];
	const legacyPath = resolveChannelAllowFromPath("telegram", params.env);
	if (fileExists(legacyPath)) {
		const accountId = resolveDefaultTelegramAccountId(params.cfg);
		const targetPath = resolveChannelAllowFromPath("telegram", params.env, accountId);
		if (!fileExists(targetPath)) plans.push({
			kind: "copy",
			label: "Telegram pairing allowFrom",
			sourcePath: legacyPath,
			targetPath
		});
	}
	plans.push(...detectTelegramBotInfoCacheLegacyStateMigration(params));
	plans.push(...detectTelegramMessageCacheLegacyStateMigration(params));
	plans.push(...detectTelegramTopicNameCacheLegacyStateMigration(params));
	return plans;
}
//#endregion
export { writeCachedTelegramBotInfo as i, deleteCachedTelegramBotInfo as n, readCachedTelegramBotInfo as r, detectTelegramLegacyStateMigrations as t };
