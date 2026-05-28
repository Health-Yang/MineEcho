import { n as readJsonFileWithFallback } from "./json-store-DXH8dkSO.js";
import { n as getTelegramRuntime } from "./runtime-CySuXZyV.js";
import { createHash } from "node:crypto";
//#region extensions/telegram/src/topic-name-cache.ts
const TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES = 2048;
const STORE_NAMESPACE_PREFIX = "telegram.topic-name-cache";
const TOPIC_NAME_CACHE_STATE_KEY = Symbol.for("openclaw.telegramTopicNameCacheState");
const DEFAULT_TOPIC_NAME_CACHE_SCOPE = "default";
function createTopicNameStore() {
	return /* @__PURE__ */ new Map();
}
function createTopicNameStoreState(namespace) {
	return {
		lastUpdatedAt: 0,
		store: createTopicNameStore(),
		hydrated: false,
		persistentStore: openTopicNamePersistentStore(namespace)
	};
}
function getTopicNameCacheState() {
	const globalStore = globalThis;
	const existing = globalStore[TOPIC_NAME_CACHE_STATE_KEY];
	if (existing) return existing;
	const state = { stores: /* @__PURE__ */ new Map() };
	globalStore[TOPIC_NAME_CACHE_STATE_KEY] = state;
	return state;
}
function cacheKey(chatId, threadId) {
	return `${chatId}:${threadId}`;
}
function namespaceForScope(scope) {
	return `${STORE_NAMESPACE_PREFIX}.${createHash("sha256").update(scope).digest("hex").slice(0, 16)}`;
}
function resolveTopicNameCachePath(storePath) {
	return `${storePath}.telegram-topic-names.json`;
}
function resolveTopicNameCacheScope(storePath) {
	return storePath;
}
function resolveTopicNameCacheNamespace(scope) {
	return namespaceForScope(scope);
}
function openTopicNamePersistentStore(namespace) {
	return getTelegramRuntime().state.openKeyedStore({
		namespace,
		maxEntries: 2048
	});
}
function evictOldest(store) {
	if (store.size <= 2048) return;
	let oldestKey;
	let oldestTime = Infinity;
	for (const [key, entry] of store) if (entry.updatedAt < oldestTime) {
		oldestTime = entry.updatedAt;
		oldestKey = key;
	}
	if (oldestKey) store.delete(oldestKey);
	return oldestKey;
}
function isTopicEntry(value) {
	if (!value || typeof value !== "object") return false;
	const entry = value;
	return typeof entry.name === "string" && entry.name.length > 0 && typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt);
}
function getTopicStoreState(scope) {
	const state = getTopicNameCacheState();
	const stateKey = scope ?? DEFAULT_TOPIC_NAME_CACHE_SCOPE;
	const existing = state.stores.get(stateKey);
	if (existing) return existing;
	const next = createTopicNameStoreState(namespaceForScope(stateKey));
	state.stores.set(stateKey, next);
	return next;
}
async function hydrateTopicStoreState(state) {
	if (state.hydrated) return;
	if (state.hydratePromise) {
		await state.hydratePromise;
		return;
	}
	state.hydratePromise = (async () => {
		const entries = await state.persistentStore.entries();
		for (const { key, value } of entries) if (isTopicEntry(value)) state.store.set(key, value);
		state.lastUpdatedAt = Math.max(0, ...Array.from(state.store.values(), (entry) => entry.updatedAt));
		state.hydrated = true;
	})().finally(() => {
		state.hydratePromise = void 0;
	});
	await state.hydratePromise;
}
function nextUpdatedAt(scope) {
	const state = getTopicStoreState(scope);
	const now = Date.now();
	state.lastUpdatedAt = now > state.lastUpdatedAt ? now : state.lastUpdatedAt + 1;
	return state.lastUpdatedAt;
}
async function updateTopicName(chatId, threadId, patch, scope) {
	const state = getTopicStoreState(scope);
	await hydrateTopicStoreState(state);
	const key = cacheKey(chatId, threadId);
	const existing = state.store.get(key);
	const iconColor = patch.iconColor ?? existing?.iconColor;
	const iconCustomEmojiId = patch.iconCustomEmojiId ?? existing?.iconCustomEmojiId;
	const closed = patch.closed ?? existing?.closed;
	const merged = {
		name: patch.name ?? existing?.name ?? "",
		updatedAt: nextUpdatedAt(scope),
		...iconColor !== void 0 ? { iconColor } : {},
		...iconCustomEmojiId !== void 0 ? { iconCustomEmojiId } : {},
		...closed !== void 0 ? { closed } : {}
	};
	if (!merged.name) return;
	state.store.set(key, merged);
	await state.persistentStore.register(key, merged);
	const evictedKey = evictOldest(state.store);
	if (evictedKey) await state.persistentStore.delete(evictedKey);
}
async function getTopicName(chatId, threadId, scope) {
	const state = getTopicStoreState(scope);
	await hydrateTopicStoreState(state);
	const key = cacheKey(chatId, threadId);
	const entry = state.store.get(key);
	if (entry) {
		entry.updatedAt = nextUpdatedAt(scope);
		await state.persistentStore.register(key, entry);
	}
	return entry?.name;
}
async function listTelegramLegacyTopicNameCacheEntries(params) {
	const { value } = await readJsonFileWithFallback(params.persistedPath, {});
	return Object.entries(value).filter((entry) => isTopicEntry(entry[1])).toSorted(([, left], [, right]) => right.updatedAt - left.updatedAt).slice(0, params.maxEntries ?? 2048).map(([key, entry]) => ({
		key,
		value: entry
	}));
}
//#endregion
export { resolveTopicNameCachePath as a, resolveTopicNameCacheNamespace as i, getTopicName as n, resolveTopicNameCacheScope as o, listTelegramLegacyTopicNameCacheEntries as r, updateTopicName as s, TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES as t };
