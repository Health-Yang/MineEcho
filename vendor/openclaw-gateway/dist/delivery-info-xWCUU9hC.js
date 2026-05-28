import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import { i as resolveSessionStoreKey, r as resolveSessionStoreAgentId } from "./session-store-key-Bm8fGm9t.js";
import { n as deliveryContextFromSession } from "./delivery-context.shared-B9zntlj0.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { E as parseSessionThreadInfo, N as normalizeStoreSessionKey, a as readSessionStoreSnapshot } from "./store-load-Di_AfnVx.js";
import "./store-B5j4GKkg.js";
import { i as resolveAllAgentSessionStoreTargetsSync } from "./targets-Drw2Jswe.js";
//#region src/config/sessions/delivery-info.ts
function hasRoutableDeliveryContext(context) {
	return Boolean(context?.channel && context?.to);
}
function extractDeliveryInfo(sessionKey, options) {
	const { baseSessionKey, threadId } = parseSessionThreadInfo(sessionKey);
	if (!sessionKey || !baseSessionKey) return {
		deliveryContext: void 0,
		threadId
	};
	let deliveryContext;
	try {
		const lookup = loadDeliverySessionEntry({
			cfg: options?.cfg ?? getRuntimeConfig(),
			sessionKey,
			baseSessionKey
		});
		let entry = lookup.entry;
		let storedDeliveryContext = deliveryContextFromSession(entry);
		if (!hasRoutableDeliveryContext(storedDeliveryContext) && baseSessionKey !== sessionKey) {
			entry = lookup.baseEntry;
			storedDeliveryContext = deliveryContextFromSession(entry);
		}
		if (hasRoutableDeliveryContext(storedDeliveryContext)) deliveryContext = {
			channel: storedDeliveryContext.channel,
			to: storedDeliveryContext.to,
			accountId: storedDeliveryContext.accountId,
			threadId: storedDeliveryContext.threadId
		};
	} catch {}
	return {
		deliveryContext,
		threadId
	};
}
function resolveDeliveryStorePaths(cfg, agentId) {
	const paths = /* @__PURE__ */ new Set();
	paths.add(resolveStorePath(cfg.session?.store, { agentId }));
	for (const target of resolveAllAgentSessionStoreTargetsSync(cfg)) if (target.agentId === agentId) paths.add(target.storePath);
	return [...paths];
}
function asSessionEntry(entry) {
	return entry;
}
function findSessionEntryInStore(store, keys) {
	let normalizedIndex;
	let bestEntry;
	let bestUpdatedAt = 0;
	let bestRoutable = false;
	const acceptCandidate = (candidate) => {
		if (!candidate) return;
		const entry = candidate;
		const candidateRoutable = hasRoutableDeliveryContext(deliveryContextFromSession(entry));
		const candidateUpdatedAt = entry.updatedAt ?? 0;
		if (!bestEntry || candidateRoutable && !bestRoutable || candidateRoutable === bestRoutable && candidateUpdatedAt > bestUpdatedAt) {
			bestEntry = entry;
			bestUpdatedAt = candidateUpdatedAt;
			bestRoutable = candidateRoutable;
		}
	};
	for (const key of keys) {
		const trimmed = key.trim();
		const normalized = normalizeStoreSessionKey(key);
		const foldedLegacyKey = normalizeLowercaseStringOrEmpty(normalized);
		let foundRoutableCandidate = false;
		if (Object.prototype.hasOwnProperty.call(store, normalized)) {
			foundRoutableCandidate ||= hasRoutableDeliveryContext(deliveryContextFromSession(asSessionEntry(store[normalized])));
			acceptCandidate(store[normalized]);
		}
		if (foldedLegacyKey !== normalized && Object.prototype.hasOwnProperty.call(store, foldedLegacyKey)) {
			foundRoutableCandidate ||= hasRoutableDeliveryContext(deliveryContextFromSession(asSessionEntry(store[foldedLegacyKey])));
			acceptCandidate(store[foldedLegacyKey]);
		}
		if (trimmed !== normalized && Object.prototype.hasOwnProperty.call(store, trimmed)) {
			foundRoutableCandidate ||= hasRoutableDeliveryContext(deliveryContextFromSession(asSessionEntry(store[trimmed])));
			acceptCandidate(store[trimmed]);
		}
		if (trimmed !== normalized || !foundRoutableCandidate) {
			normalizedIndex ??= buildFreshestSessionEntryIndex(store);
			acceptCandidate(normalizedIndex.get(normalized));
			if (foldedLegacyKey !== normalized) acceptCandidate(normalizedIndex.get(foldedLegacyKey));
		}
	}
	return bestEntry;
}
function buildFreshestSessionEntryIndex(store) {
	const index = /* @__PURE__ */ new Map();
	for (const [key, candidate] of Object.entries(store)) {
		const entry = asSessionEntry(candidate);
		if (!entry) continue;
		const normalized = normalizeStoreSessionKey(key);
		const existing = index.get(normalized);
		const entryRoutable = hasRoutableDeliveryContext(deliveryContextFromSession(entry));
		const existingRoutable = hasRoutableDeliveryContext(deliveryContextFromSession(existing));
		if (!existing || entryRoutable && !existingRoutable || entryRoutable === existingRoutable && (entry.updatedAt ?? 0) > (existing.updatedAt ?? 0)) index.set(normalized, entry);
		const foldedLegacyKey = normalizeLowercaseStringOrEmpty(normalized);
		if (foldedLegacyKey === normalized) continue;
		const foldedExisting = index.get(foldedLegacyKey);
		const foldedExistingRoutable = hasRoutableDeliveryContext(deliveryContextFromSession(foldedExisting));
		if (!foldedExisting || entryRoutable && !foldedExistingRoutable || entryRoutable === foldedExistingRoutable && (entry.updatedAt ?? 0) > (foldedExisting.updatedAt ?? 0)) index.set(foldedLegacyKey, entry);
	}
	return index;
}
function loadDeliverySessionEntry(params) {
	const canonicalKey = resolveSessionStoreKey({
		cfg: params.cfg,
		sessionKey: params.sessionKey
	});
	const canonicalBaseKey = resolveSessionStoreKey({
		cfg: params.cfg,
		sessionKey: params.baseSessionKey
	});
	const agentId = resolveSessionStoreAgentId(params.cfg, canonicalKey);
	const sessionKeys = [params.sessionKey, canonicalKey];
	const baseKeys = [params.baseSessionKey, canonicalBaseKey];
	let fallback;
	for (const storePath of resolveDeliveryStorePaths(params.cfg, agentId)) {
		const store = readSessionStoreSnapshot(storePath);
		const entry = findSessionEntryInStore(store, sessionKeys);
		const baseEntry = findSessionEntryInStore(store, baseKeys);
		if (!entry && !baseEntry) continue;
		fallback ??= {
			entry,
			baseEntry
		};
		if (hasRoutableDeliveryContext(deliveryContextFromSession(entry)) || hasRoutableDeliveryContext(deliveryContextFromSession(baseEntry))) return {
			entry,
			baseEntry
		};
	}
	return fallback ?? {
		entry: void 0,
		baseEntry: void 0
	};
}
//#endregion
export { extractDeliveryInfo as t };
