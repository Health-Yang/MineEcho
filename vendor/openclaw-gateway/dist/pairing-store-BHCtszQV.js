import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString, f as normalizeStringifiedOptionalString, o as normalizeNullableString } from "./string-coerce-DKw2K5wM.js";
import { o as resolveRequiredHomeDir } from "./home-dir-B1vnNUyG.js";
import { _ as resolveOAuthDir, y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { o as isRecord } from "./record-coerce-Btbek4uV.js";
import { p as normalizeUniqueStringEntries } from "./string-normalization-B8G0vlWE.js";
import "./account-id-B0YIFDpA.js";
import { o as withFileLock$1 } from "./file-lock-C4JGV-yb.js";
import "./file-lock-BDrW-jMX.js";
import { i as listChannelPlugins, t as getChannelPlugin } from "./registry-Be8exPcf.js";
import { i as writeJsonFileAtomically, n as readJsonFileWithFallback } from "./json-store-DXH8dkSO.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
//#region src/channels/plugins/pairing.ts
function listPairingChannels() {
	return listChannelPlugins().filter((plugin) => plugin.pairing).map((plugin) => plugin.id);
}
function getPairingAdapter(channelId) {
	return getChannelPlugin(channelId)?.pairing ?? null;
}
function requirePairingAdapter(channelId) {
	const adapter = getPairingAdapter(channelId);
	if (!adapter) throw new Error(`Channel ${channelId} does not support pairing`);
	return adapter;
}
async function notifyPairingApproved(params) {
	const adapter = params.pairingAdapter ?? requirePairingAdapter(params.channelId);
	if (!adapter.notifyApproval) return;
	await adapter.notifyApproval({
		cfg: params.cfg,
		id: params.id,
		runtime: params.runtime
	});
}
//#endregion
//#region src/pairing/allow-from-store-file.ts
const allowFromReadCache = /* @__PURE__ */ new Map();
function resolvePairingCredentialsDir(env = process.env) {
	return resolveOAuthDir(env, resolveStateDir(env, () => resolveRequiredHomeDir(env, os.homedir)));
}
function describePairingFilenameKeyInput(value) {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed ? `string length ${trimmed.length}` : "empty string";
	}
	if (typeof value === "number" && !Number.isFinite(value)) return "non-finite number";
	return typeof value;
}
function invalidPairingFilenameKeyError(kind, reason, value) {
	return /* @__PURE__ */ new Error(`invalid pairing ${kind}: ${reason}; got ${describePairingFilenameKeyInput(value)}`);
}
function normalizePairingFilenameKey(value, kind) {
	if (typeof value !== "string") throw invalidPairingFilenameKeyError(kind, "expected non-empty string", value);
	const raw = normalizeLowercaseStringOrEmpty(value);
	if (!raw) throw invalidPairingFilenameKeyError(kind, "expected non-empty string", value);
	const safe = raw.replace(/[\\/:*?"<>|]/g, "_").replace(/\.\./g, "_");
	if (!safe || safe === "_") throw invalidPairingFilenameKeyError(kind, "sanitized filename key is empty", value);
	return safe;
}
/** Sanitize channel ID for use in filenames (prevent path traversal). */
function safeChannelKey(channel) {
	return normalizePairingFilenameKey(channel, "channel");
}
function safeAccountKey(accountId) {
	return normalizePairingFilenameKey(accountId, "account id");
}
function resolveOptionalAccountFilenameKey(accountId) {
	if (accountId == null) return null;
	if (typeof accountId !== "string") throw invalidPairingFilenameKeyError("account id", "expected non-empty string", accountId);
	const normalizedAccountId = normalizeOptionalString(accountId) ?? "";
	return normalizedAccountId ? safeAccountKey(normalizedAccountId) : null;
}
function resolveAllowFromFilePath(channel, env = process.env, accountId) {
	const base = safeChannelKey(channel);
	const accountKey = resolveOptionalAccountFilenameKey(accountId);
	if (!accountKey) return path.join(resolvePairingCredentialsDir(env), `${base}-allowFrom.json`);
	return path.join(resolvePairingCredentialsDir(env), `${base}-${accountKey}-allowFrom.json`);
}
function dedupePreserveOrder(entries) {
	return normalizeUniqueStringEntries(entries);
}
function shouldIncludeLegacyAllowFromEntries(normalizedAccountId) {
	return !normalizedAccountId || normalizedAccountId === "default";
}
function resolveAllowFromAccountId(accountId) {
	if (accountId != null && typeof accountId !== "string") throw invalidPairingFilenameKeyError("account id", "expected non-empty string", accountId);
	return normalizeLowercaseStringOrEmpty(accountId) || "default";
}
function cloneAllowFromCacheEntry(entry) {
	return {
		exists: entry.exists,
		mtimeMs: entry.mtimeMs,
		size: entry.size,
		entries: entry.entries.slice()
	};
}
function resolveAllowFromCacheKey(cacheNamespace, filePath) {
	return `${cacheNamespace}\u0000${filePath}`;
}
function setAllowFromFileReadCache(params) {
	allowFromReadCache.set(resolveAllowFromCacheKey(params.cacheNamespace, params.filePath), cloneAllowFromCacheEntry(params.entry));
}
function resolveAllowFromReadCacheHit(params) {
	const cached = allowFromReadCache.get(resolveAllowFromCacheKey(params.cacheNamespace, params.filePath));
	if (!cached) return null;
	if (cached.exists !== params.exists) return null;
	if (!params.exists) return cloneAllowFromCacheEntry(cached);
	if (cached.mtimeMs !== params.mtimeMs || cached.size !== params.size) return null;
	return cloneAllowFromCacheEntry(cached);
}
function resolveAllowFromReadCacheOrMissing(params) {
	const cached = resolveAllowFromReadCacheHit({
		cacheNamespace: params.cacheNamespace,
		filePath: params.filePath,
		exists: Boolean(params.stat),
		mtimeMs: params.stat?.mtimeMs ?? null,
		size: params.stat?.size ?? null
	});
	if (cached) return {
		entries: cached.entries,
		exists: cached.exists
	};
	if (!params.stat) {
		setAllowFromFileReadCache({
			cacheNamespace: params.cacheNamespace,
			filePath: params.filePath,
			entry: {
				exists: false,
				mtimeMs: null,
				size: null,
				entries: []
			}
		});
		return {
			entries: [],
			exists: false
		};
	}
	return null;
}
async function readAllowFromFileWithExists(params) {
	let stat = null;
	try {
		stat = await fs.promises.stat(params.filePath);
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
	const cachedOrMissing = resolveAllowFromReadCacheOrMissing({
		cacheNamespace: params.cacheNamespace,
		filePath: params.filePath,
		stat
	});
	if (cachedOrMissing) return cachedOrMissing;
	if (!stat) return {
		entries: [],
		exists: false
	};
	let raw = "";
	try {
		raw = await fs.promises.readFile(params.filePath, "utf8");
	} catch (err) {
		if (err.code === "ENOENT") return {
			entries: [],
			exists: false
		};
		throw err;
	}
	let entries = [];
	try {
		entries = params.normalizeStore(JSON.parse(raw));
	} catch {
		entries = [];
	}
	setAllowFromFileReadCache({
		cacheNamespace: params.cacheNamespace,
		filePath: params.filePath,
		entry: {
			exists: true,
			mtimeMs: stat.mtimeMs,
			size: stat.size,
			entries
		}
	});
	return {
		entries,
		exists: true
	};
}
function readAllowFromFileSyncWithExists(params) {
	let stat = null;
	try {
		stat = fs.statSync(params.filePath);
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
	const cachedOrMissing = resolveAllowFromReadCacheOrMissing({
		cacheNamespace: params.cacheNamespace,
		filePath: params.filePath,
		stat
	});
	if (cachedOrMissing) return cachedOrMissing;
	if (!stat) return {
		entries: [],
		exists: false
	};
	let raw = "";
	try {
		raw = fs.readFileSync(params.filePath, "utf8");
	} catch (err) {
		if (err.code === "ENOENT") return {
			entries: [],
			exists: false
		};
		throw err;
	}
	try {
		const parsed = JSON.parse(raw);
		const entries = params.normalizeStore(parsed);
		setAllowFromFileReadCache({
			cacheNamespace: params.cacheNamespace,
			filePath: params.filePath,
			entry: {
				exists: true,
				mtimeMs: stat.mtimeMs,
				size: stat.size,
				entries
			}
		});
		return {
			entries,
			exists: true
		};
	} catch {
		setAllowFromFileReadCache({
			cacheNamespace: params.cacheNamespace,
			filePath: params.filePath,
			entry: {
				exists: true,
				mtimeMs: stat.mtimeMs,
				size: stat.size,
				entries: []
			}
		});
		return {
			entries: [],
			exists: true
		};
	}
}
function clearAllowFromFileReadCacheForNamespace(cacheNamespace) {
	for (const key of allowFromReadCache.keys()) if (key.startsWith(`${cacheNamespace}\u0000`)) allowFromReadCache.delete(key);
}
//#endregion
//#region src/pairing/pairing-store.ts
const PAIRING_CODE_LENGTH = 8;
const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAIRING_CODE_MAX_ATTEMPTS = 500;
const PAIRING_PENDING_TTL_MS = 3600 * 1e3;
const PAIRING_PENDING_MAX = 3;
const PAIRING_STORE_LOCK_OPTIONS = {
	retries: {
		retries: 10,
		factor: 2,
		minTimeout: 100,
		maxTimeout: 1e4,
		randomize: true
	},
	stale: 3e4
};
const PAIRING_ALLOW_FROM_CACHE_NAMESPACE = "pairing-store";
function resolvePairingPath(channel, env = process.env) {
	return path.join(resolvePairingCredentialsDir(env), `${safeChannelKey(channel)}-pairing.json`);
}
function resolveChannelAllowFromPath(channel, env = process.env, accountId) {
	return resolveAllowFromFilePath(channel, env, accountId);
}
async function readJsonFile(filePath, fallback) {
	return await readJsonFileWithFallback(filePath, fallback);
}
async function writeJsonFile(filePath, value) {
	await writeJsonFileAtomically(filePath, value);
}
async function readPairingRequests(filePath) {
	const { value } = await readJsonFile(filePath, {
		version: 1,
		requests: []
	});
	if (!Array.isArray(value.requests)) return [];
	return value.requests.flatMap((request) => {
		const normalized = normalizePersistedPairingRequest(request);
		return normalized ? [normalized] : [];
	});
}
async function readPrunedPairingRequests(filePath) {
	return pruneExpiredRequests(await readPairingRequests(filePath), Date.now());
}
async function ensureJsonFile(filePath, fallback) {
	try {
		await fs.promises.access(filePath);
	} catch {
		await writeJsonFile(filePath, fallback);
	}
}
async function withFileLock(filePath, fallback, fn) {
	await ensureJsonFile(filePath, fallback);
	return await withFileLock$1(filePath, PAIRING_STORE_LOCK_OPTIONS, async () => {
		return await fn();
	});
}
function parseTimestamp(value) {
	if (!value) return null;
	const parsed = Date.parse(value);
	if (!Number.isFinite(parsed)) return null;
	return parsed;
}
function normalizePersistedPairingMeta(value) {
	if (!isRecord(value)) return;
	const out = {};
	for (const [key, entry] of Object.entries(value)) {
		const normalized = normalizeOptionalString(entry);
		if (normalized) out[key] = normalized;
	}
	return Object.keys(out).length > 0 ? out : void 0;
}
function normalizePersistedPairingRequest(value) {
	if (!isRecord(value)) return;
	const id = normalizeOptionalString(value.id);
	const code = normalizeOptionalString(value.code);
	const createdAt = normalizeOptionalString(value.createdAt);
	const lastSeenAt = normalizeOptionalString(value.lastSeenAt) ?? createdAt;
	if (!id || !code || !createdAt || !lastSeenAt || parseTimestamp(createdAt) === null || parseTimestamp(lastSeenAt) === null) return;
	const meta = normalizePersistedPairingMeta(value.meta);
	return {
		id,
		code,
		createdAt,
		lastSeenAt,
		...meta ? { meta } : {}
	};
}
function isExpired(entry, nowMs) {
	const createdAt = parseTimestamp(entry.createdAt);
	if (!createdAt) return true;
	return nowMs - createdAt > PAIRING_PENDING_TTL_MS;
}
function pruneExpiredRequests(reqs, nowMs) {
	const kept = [];
	let removed = false;
	for (const req of reqs) {
		if (isExpired(req, nowMs)) {
			removed = true;
			continue;
		}
		kept.push(req);
	}
	return {
		requests: kept,
		removed
	};
}
function resolveLastSeenAt(entry) {
	return parseTimestamp(entry.lastSeenAt) ?? parseTimestamp(entry.createdAt) ?? 0;
}
function resolvePairingRequestAccountId(entry) {
	return normalizePairingAccountId(entry.meta?.accountId) || "default";
}
function pruneExcessRequestsByAccount(reqs, maxPending) {
	if (maxPending <= 0 || reqs.length <= maxPending) return {
		requests: reqs,
		removed: false
	};
	const grouped = /* @__PURE__ */ new Map();
	for (const [index, entry] of reqs.entries()) {
		const accountId = resolvePairingRequestAccountId(entry);
		const current = grouped.get(accountId);
		if (current) {
			current.push(index);
			continue;
		}
		grouped.set(accountId, [index]);
	}
	const droppedIndexes = /* @__PURE__ */ new Set();
	for (const indexes of grouped.values()) {
		if (indexes.length <= maxPending) continue;
		const sortedIndexes = indexes.slice().toSorted((left, right) => resolveLastSeenAt(reqs[left]) - resolveLastSeenAt(reqs[right]));
		for (const index of sortedIndexes.slice(0, sortedIndexes.length - maxPending)) droppedIndexes.add(index);
	}
	if (droppedIndexes.size === 0) return {
		requests: reqs,
		removed: false
	};
	return {
		requests: reqs.filter((_, index) => !droppedIndexes.has(index)),
		removed: true
	};
}
function randomCode() {
	let out = "";
	for (let i = 0; i < PAIRING_CODE_LENGTH; i++) {
		const idx = crypto.randomInt(0, 32);
		out += PAIRING_CODE_ALPHABET[idx];
	}
	return out;
}
function generateUniqueCode(existing) {
	for (let attempt = 0; attempt < PAIRING_CODE_MAX_ATTEMPTS; attempt += 1) {
		const code = randomCode();
		if (!existing.has(code)) return code;
	}
	throw new Error(`failed to generate unique pairing code after ${PAIRING_CODE_MAX_ATTEMPTS} attempts; existing code count: ${existing.size}`);
}
function normalizePairingAccountId(accountId) {
	return normalizeLowercaseStringOrEmpty(accountId);
}
function requestMatchesAccountId(entry, normalizedAccountId) {
	if (!normalizedAccountId) return true;
	return resolvePairingRequestAccountId(entry) === normalizedAccountId;
}
function normalizeId(value) {
	return normalizeStringifiedOptionalString(value) ?? "";
}
function normalizeAllowEntry(channel, entry) {
	const trimmed = entry.trim();
	if (!trimmed) return "";
	if (trimmed === "*") return "";
	const adapter = getPairingAdapter(channel);
	return normalizeOptionalString(adapter?.normalizeAllowEntry ? adapter.normalizeAllowEntry(trimmed) : trimmed) ?? "";
}
function normalizeAllowFromList(channel, store) {
	return dedupePreserveOrder((Array.isArray(store.allowFrom) ? store.allowFrom : []).map((v) => normalizeAllowEntry(channel, v)).filter(Boolean));
}
function normalizeAllowFromInput(channel, entry) {
	return normalizeAllowEntry(channel, normalizeId(entry));
}
async function readAllowFromStateForPath(channel, filePath) {
	return (await readAllowFromStateForPathWithExists(channel, filePath)).entries;
}
async function readAllowFromStateForPathWithExists(channel, filePath) {
	return await readAllowFromFileWithExists({
		cacheNamespace: PAIRING_ALLOW_FROM_CACHE_NAMESPACE,
		filePath,
		normalizeStore: (store) => normalizeAllowFromList(channel, store)
	});
}
function readAllowFromStateForPathSync(channel, filePath) {
	return readAllowFromStateForPathSyncWithExists(channel, filePath).entries;
}
function readAllowFromStateForPathSyncWithExists(channel, filePath) {
	return readAllowFromFileSyncWithExists({
		cacheNamespace: PAIRING_ALLOW_FROM_CACHE_NAMESPACE,
		filePath,
		normalizeStore: (store) => normalizeAllowFromList(channel, store)
	});
}
async function readAllowFromState(params) {
	const { value } = await readJsonFile(params.filePath, {
		version: 1,
		allowFrom: []
	});
	return {
		current: normalizeAllowFromList(params.channel, value),
		normalized: normalizeAllowFromInput(params.channel, params.entry) || null
	};
}
async function writeAllowFromState(filePath, allowFrom) {
	await writeJsonFile(filePath, {
		version: 1,
		allowFrom
	});
	let stat = null;
	try {
		stat = await fs.promises.stat(filePath);
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
	setAllowFromFileReadCache({
		cacheNamespace: PAIRING_ALLOW_FROM_CACHE_NAMESPACE,
		filePath,
		entry: {
			exists: true,
			mtimeMs: stat?.mtimeMs ?? null,
			size: stat?.size ?? null,
			entries: allowFrom.slice()
		}
	});
}
async function readNonDefaultAccountAllowFrom(params) {
	const scopedPath = resolveAllowFromFilePath(params.channel, params.env, params.accountId);
	return await readAllowFromStateForPath(params.channel, scopedPath);
}
function readNonDefaultAccountAllowFromSync(params) {
	const scopedPath = resolveAllowFromFilePath(params.channel, params.env, params.accountId);
	return readAllowFromStateForPathSync(params.channel, scopedPath);
}
async function updateAllowFromStoreEntry(params) {
	const env = params.env ?? process.env;
	const filePath = resolveAllowFromFilePath(params.channel, env, params.accountId);
	return await withFileLock(filePath, {
		version: 1,
		allowFrom: []
	}, async () => {
		const { current, normalized } = await readAllowFromState({
			channel: params.channel,
			entry: params.entry,
			filePath
		});
		if (!normalized) return {
			changed: false,
			allowFrom: current
		};
		const next = params.apply(current, normalized);
		if (!next) return {
			changed: false,
			allowFrom: current
		};
		await writeAllowFromState(filePath, next);
		return {
			changed: true,
			allowFrom: next
		};
	});
}
async function readLegacyChannelAllowFromStore(channel, env = process.env) {
	return await readAllowFromStateForPath(channel, resolveAllowFromFilePath(channel, env));
}
async function readChannelAllowFromStore(channel, env = process.env, accountId) {
	const resolvedAccountId = resolveAllowFromAccountId(accountId);
	if (!shouldIncludeLegacyAllowFromEntries(resolvedAccountId)) return await readNonDefaultAccountAllowFrom({
		channel,
		env,
		accountId: resolvedAccountId
	});
	const scopedEntries = await readAllowFromStateForPath(channel, resolveAllowFromFilePath(channel, env, resolvedAccountId));
	const legacyEntries = await readAllowFromStateForPath(channel, resolveAllowFromFilePath(channel, env));
	return dedupePreserveOrder([...scopedEntries, ...legacyEntries]);
}
function readLegacyChannelAllowFromStoreSync(channel, env = process.env) {
	return readAllowFromStateForPathSync(channel, resolveAllowFromFilePath(channel, env));
}
function readChannelAllowFromStoreSync(channel, env = process.env, accountId) {
	const resolvedAccountId = resolveAllowFromAccountId(accountId);
	if (!shouldIncludeLegacyAllowFromEntries(resolvedAccountId)) return readNonDefaultAccountAllowFromSync({
		channel,
		env,
		accountId: resolvedAccountId
	});
	const scopedEntries = readAllowFromStateForPathSync(channel, resolveAllowFromFilePath(channel, env, resolvedAccountId));
	const legacyEntries = readAllowFromStateForPathSync(channel, resolveAllowFromFilePath(channel, env));
	return dedupePreserveOrder([...scopedEntries, ...legacyEntries]);
}
function clearPairingAllowFromReadCacheForTest() {
	clearAllowFromFileReadCacheForNamespace(PAIRING_ALLOW_FROM_CACHE_NAMESPACE);
}
async function updateChannelAllowFromStore(params) {
	return await updateAllowFromStoreEntry({
		channel: params.channel,
		entry: params.entry,
		accountId: params.accountId,
		env: params.env,
		apply: params.apply
	});
}
async function mutateChannelAllowFromStoreEntry(params, apply) {
	return await updateChannelAllowFromStore({
		...params,
		apply
	});
}
async function addChannelAllowFromStoreEntry(params) {
	return await mutateChannelAllowFromStoreEntry(params, (current, normalized) => {
		if (current.includes(normalized)) return null;
		return [...current, normalized];
	});
}
async function removeChannelAllowFromStoreEntry(params) {
	return await mutateChannelAllowFromStoreEntry(params, (current, normalized) => {
		const next = current.filter((entry) => entry !== normalized);
		if (next.length === current.length) return null;
		return next;
	});
}
async function listChannelPairingRequests(channel, env = process.env, accountId) {
	const filePath = resolvePairingPath(channel, env);
	return await withFileLock(filePath, {
		version: 1,
		requests: []
	}, async () => {
		const { requests: prunedExpired, removed: expiredRemoved } = await readPrunedPairingRequests(filePath);
		const { requests: pruned, removed: cappedRemoved } = pruneExcessRequestsByAccount(prunedExpired, PAIRING_PENDING_MAX);
		if (expiredRemoved || cappedRemoved) await writeJsonFile(filePath, {
			version: 1,
			requests: pruned
		});
		const normalizedAccountId = normalizePairingAccountId(accountId);
		return (normalizedAccountId ? pruned.filter((entry) => requestMatchesAccountId(entry, normalizedAccountId)) : pruned).filter((r) => r && typeof r.id === "string" && typeof r.code === "string" && typeof r.createdAt === "string").slice().toSorted((a, b) => a.createdAt.localeCompare(b.createdAt));
	});
}
async function upsertChannelPairingRequest(params) {
	const env = params.env ?? process.env;
	const filePath = resolvePairingPath(params.channel, env);
	return await withFileLock(filePath, {
		version: 1,
		requests: []
	}, async () => {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const nowMs = Date.now();
		const id = normalizeId(params.id);
		const normalizedAccountId = normalizePairingAccountId(params.accountId) || "default";
		const meta = {
			...params.meta && typeof params.meta === "object" ? Object.fromEntries(Object.entries(params.meta).map(([k, v]) => [k, normalizeOptionalString(v) ?? ""]).filter(([_, v]) => Boolean(v))) : void 0,
			accountId: normalizedAccountId
		};
		let reqs = await readPairingRequests(filePath);
		const { requests: prunedExpired, removed: expiredRemoved } = pruneExpiredRequests(reqs, nowMs);
		reqs = prunedExpired;
		const normalizedMatchingAccountId = normalizedAccountId;
		const existingIdx = reqs.findIndex((r) => {
			if (r.id !== id) return false;
			return requestMatchesAccountId(r, normalizedMatchingAccountId);
		});
		const existingCodes = new Set(reqs.map((req) => (normalizeOptionalString(req.code) ?? "").toUpperCase()));
		if (existingIdx >= 0) {
			const existing = reqs[existingIdx];
			const code = (normalizeOptionalString(existing?.code) ?? "") || generateUniqueCode(existingCodes);
			const next = {
				id,
				code,
				createdAt: existing?.createdAt ?? now,
				lastSeenAt: now,
				meta: meta ?? existing?.meta
			};
			reqs[existingIdx] = next;
			const { requests: capped } = pruneExcessRequestsByAccount(reqs, PAIRING_PENDING_MAX);
			await writeJsonFile(filePath, {
				version: 1,
				requests: capped
			});
			return {
				code,
				created: false
			};
		}
		const { requests: capped, removed: cappedRemoved } = pruneExcessRequestsByAccount(reqs, PAIRING_PENDING_MAX);
		reqs = capped;
		if (reqs.filter((r) => requestMatchesAccountId(r, normalizedMatchingAccountId)).length >= PAIRING_PENDING_MAX) {
			if (expiredRemoved || cappedRemoved) await writeJsonFile(filePath, {
				version: 1,
				requests: reqs
			});
			return {
				code: "",
				created: false
			};
		}
		const code = generateUniqueCode(existingCodes);
		const next = {
			id,
			code,
			createdAt: now,
			lastSeenAt: now,
			...meta ? { meta } : {}
		};
		await writeJsonFile(filePath, {
			version: 1,
			requests: [...reqs, next]
		});
		return {
			code,
			created: true
		};
	});
}
async function approveChannelPairingCode(params) {
	const env = params.env ?? process.env;
	const code = (normalizeNullableString(params.code) ?? "").toUpperCase();
	if (!code) return null;
	const filePath = resolvePairingPath(params.channel, env);
	return await withFileLock(filePath, {
		version: 1,
		requests: []
	}, async () => {
		const { requests: pruned, removed } = await readPrunedPairingRequests(filePath);
		const normalizedAccountId = normalizePairingAccountId(params.accountId);
		const idx = pruned.findIndex((r) => {
			if (r.code.toUpperCase() !== code) return false;
			return requestMatchesAccountId(r, normalizedAccountId);
		});
		if (idx < 0) {
			if (removed) await writeJsonFile(filePath, {
				version: 1,
				requests: pruned
			});
			return null;
		}
		const entry = pruned[idx];
		if (!entry) return null;
		pruned.splice(idx, 1);
		await writeJsonFile(filePath, {
			version: 1,
			requests: pruned
		});
		const entryAccountId = normalizeOptionalString(entry.meta?.accountId);
		await addChannelAllowFromStoreEntry({
			channel: params.channel,
			entry: entry.id,
			accountId: normalizeOptionalString(params.accountId) ?? entryAccountId,
			env
		});
		return {
			id: entry.id,
			entry
		};
	});
}
//#endregion
export { readChannelAllowFromStore as a, readLegacyChannelAllowFromStoreSync as c, upsertChannelPairingRequest as d, getPairingAdapter as f, listChannelPairingRequests as i, removeChannelAllowFromStoreEntry as l, notifyPairingApproved as m, approveChannelPairingCode as n, readChannelAllowFromStoreSync as o, listPairingChannels as p, clearPairingAllowFromReadCacheForTest as r, readLegacyChannelAllowFromStore as s, addChannelAllowFromStoreEntry as t, resolveChannelAllowFromPath as u };
