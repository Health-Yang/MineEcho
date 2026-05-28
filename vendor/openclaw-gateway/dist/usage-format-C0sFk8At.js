import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { s as resolveDefaultAgentDir } from "./agent-scope-config-BfxErZq2.js";
import { p as tryReadJsonSync } from "./json-files-za1pmDfK.js";
import { n as modelKey, r as normalizeModelRef } from "./model-selection-normalize-l_jinpMc.js";
import "./model-selection-DF4MbMUd.js";
import { i as getGatewayModelPricingCacheFingerprint, r as getCachedGatewayModelPricing } from "./model-pricing-cache-state-CYVO4GmW.js";
import "./model-pricing-cache-DRKeL3B6.js";
import path from "node:path";
//#region src/utils/usage-format.ts
const EMPTY_PROVIDER_COST_INDEX = /* @__PURE__ */ new Map();
const MODEL_KEY_CACHE_LIMIT = 4096;
let modelsJsonCostCache = null;
let providerCostIndexByConfig = /* @__PURE__ */ new WeakMap();
let modelKeyCache = /* @__PURE__ */ new Map();
let sortedPricingTiersByInput = /* @__PURE__ */ new WeakMap();
function formatTokenCount(value) {
	if (value === void 0 || !Number.isFinite(value)) return "0";
	const safe = Math.max(0, value);
	if (safe >= 1e6) return `${(safe / 1e6).toFixed(1)}m`;
	if (safe >= 1e3) {
		const precision = safe >= 1e4 ? 0 : 1;
		const formattedThousands = (safe / 1e3).toFixed(precision);
		if (Number(formattedThousands) >= 1e3) return `${(safe / 1e6).toFixed(1)}m`;
		return `${formattedThousands}k`;
	}
	return String(Math.round(safe));
}
function formatUsd(value) {
	if (value === void 0 || !Number.isFinite(value)) return;
	if (value >= 1) return `$${value.toFixed(2)}`;
	if (value >= .01) return `$${value.toFixed(2)}`;
	return `$${value.toFixed(4)}`;
}
function toResolvedModelKey(params) {
	const cacheKey = [
		"resolved",
		params.allowPluginNormalization === false ? "raw" : "default",
		params.provider ?? "",
		params.model ?? ""
	].join("\0");
	if (modelKeyCache.has(cacheKey)) return modelKeyCache.get(cacheKey) ?? null;
	const provider = normalizeOptionalString(params.provider);
	const model = normalizeOptionalString(params.model);
	if (!provider || !model) {
		cacheModelKey(cacheKey, null);
		return null;
	}
	const normalized = normalizeModelRef(provider, model, {
		allowManifestNormalization: params.allowPluginNormalization === false ? false : void 0,
		allowPluginNormalization: params.allowPluginNormalization
	});
	const key = modelKey(normalized.provider, normalized.model);
	cacheModelKey(cacheKey, key);
	return key;
}
function toDirectModelKey(params) {
	const cacheKey = [
		"direct",
		params.provider ?? "",
		params.model ?? ""
	].join("\0");
	if (modelKeyCache.has(cacheKey)) return modelKeyCache.get(cacheKey) ?? null;
	const provider = normalizeProviderId(normalizeOptionalString(params.provider) ?? "");
	const model = normalizeOptionalString(params.model);
	if (!provider || !model) {
		cacheModelKey(cacheKey, null);
		return null;
	}
	const key = modelKey(provider, model);
	cacheModelKey(cacheKey, key);
	return key;
}
function cacheModelKey(cacheKey, key) {
	if (modelKeyCache.size >= MODEL_KEY_CACHE_LIMIT) modelKeyCache.clear();
	modelKeyCache.set(cacheKey, key);
}
function shouldUseNormalizedCostLookup(params) {
	const provider = normalizeProviderId(normalizeOptionalString(params.provider) ?? "");
	const model = normalizeOptionalString(params.model) ?? "";
	if (!provider || !model) return false;
	return provider === "anthropic" || provider === "openrouter" || provider === "vercel-ai-gateway";
}
/**
* Normalize a raw tieredPricing array from models.json / config.
* Supports open-ended ranges such as `[128000]` or `[128000, -1]`,
* which are converted to `[128000, Infinity]`.
*/
function normalizeTieredPricing(raw) {
	if (!raw || raw.length === 0) return;
	const result = [];
	for (const tier of raw) {
		const range = tier.range;
		if (!Array.isArray(range) || range.length < 1) continue;
		const start = typeof range[0] === "number" ? range[0] : NaN;
		if (!Number.isFinite(start)) continue;
		const rawEnd = range.length >= 2 ? range[1] : null;
		const end = typeof rawEnd === "number" && Number.isFinite(rawEnd) && rawEnd > start ? rawEnd : Infinity;
		if (!Number.isFinite(tier.input) || !Number.isFinite(tier.output) || !Number.isFinite(tier.cacheRead) || !Number.isFinite(tier.cacheWrite)) continue;
		result.push({
			input: tier.input,
			output: tier.output,
			cacheRead: tier.cacheRead,
			cacheWrite: tier.cacheWrite,
			range: [start, end]
		});
	}
	return result.length > 0 ? result.toSorted((a, b) => a.range[0] - b.range[0]) : void 0;
}
function normalizeModelCostConfig(cost) {
	const normalizedTiers = normalizeTieredPricing(cost.tieredPricing);
	return {
		input: cost.input,
		output: cost.output,
		cacheRead: cost.cacheRead,
		cacheWrite: cost.cacheWrite,
		...normalizedTiers ? { tieredPricing: normalizedTiers } : {}
	};
}
function isRawModelCostConfig(value) {
	return value !== null && typeof value === "object";
}
function buildProviderCostStructureFingerprint(providers) {
	if (!providers) return "";
	return Object.entries(providers).toSorted(([a], [b]) => a.localeCompare(b)).flatMap(([providerKey, providerConfig]) => (providerConfig?.models ?? []).map((model) => `${providerKey}\0${model.id}\0${isRawModelCostConfig(model.cost) ? "cost" : "metadata"}`)).join("\0");
}
function buildProviderCostIndexBundle(providers, options) {
	const entries = /* @__PURE__ */ new Map();
	const sources = /* @__PURE__ */ new Map();
	const structureFingerprint = buildProviderCostStructureFingerprint(providers);
	if (!providers) return {
		entries,
		sources,
		structureFingerprint
	};
	for (const [providerKey, providerConfig] of Object.entries(providers)) {
		const normalizedProvider = normalizeProviderId(providerKey);
		for (const model of providerConfig?.models ?? []) {
			const normalized = normalizeModelRef(normalizedProvider, model.id, {
				allowManifestNormalization: options?.allowManifestNormalization ?? (options?.allowPluginNormalization === false ? false : void 0),
				allowPluginNormalization: options?.allowPluginNormalization
			});
			const key = modelKey(normalized.provider, normalized.model);
			if (!isRawModelCostConfig(model.cost)) continue;
			const rawCost = model.cost;
			entries.set(key, normalizeModelCostConfig(rawCost));
			sources.set(key, {
				fingerprint: buildModelCostFingerprint(rawCost),
				model,
				providerKey,
				rawCost
			});
		}
	}
	return {
		entries,
		sources,
		structureFingerprint
	};
}
function buildProviderCostIndex(providers, options) {
	return buildProviderCostIndexBundle(providers, options).entries;
}
function getProviderCostIndex(providers, options) {
	if (!providers) return EMPTY_PROVIDER_COST_INDEX;
	const isRawLookup = options?.allowPluginNormalization === false && (options.allowManifestNormalization === false || options.allowManifestNormalization === void 0);
	const isDefaultNormalizedLookup = options?.allowPluginNormalization !== false && options?.allowManifestNormalization === void 0;
	if (!isRawLookup && !isDefaultNormalizedLookup) return buildProviderCostIndex(providers, options);
	let cache = providerCostIndexByConfig.get(providers);
	if (!cache) {
		cache = {};
		providerCostIndexByConfig.set(providers, cache);
	}
	if (isRawLookup) {
		cache.rawEntries ??= buildProviderCostIndexBundle(providers, {
			allowManifestNormalization: false,
			allowPluginNormalization: false
		});
		const rawOptions = {
			allowManifestNormalization: false,
			allowPluginNormalization: false
		};
		if (refreshProviderCostIndexMutations(cache.rawEntries, providers, rawOptions) === "rebuild") cache.rawEntries = buildProviderCostIndexBundle(providers, rawOptions);
		if (cache.rawEntries.structureFingerprint !== buildProviderCostStructureFingerprint(providers)) cache.rawEntries = buildProviderCostIndexBundle(providers, rawOptions);
		return cache.rawEntries.entries;
	}
	cache.normalizedEntries ??= buildProviderCostIndexBundle(providers);
	if (refreshProviderCostIndexMutations(cache.normalizedEntries, providers) === "rebuild") cache.normalizedEntries = buildProviderCostIndexBundle(providers);
	if (cache.normalizedEntries.structureFingerprint !== buildProviderCostStructureFingerprint(providers)) cache.normalizedEntries = buildProviderCostIndexBundle(providers);
	return cache.normalizedEntries.entries;
}
function loadModelsJsonCostIndex(options) {
	const useRawEntries = options?.allowPluginNormalization === false;
	const modelsPath = path.join(resolveDefaultAgentDir({}), "models.json");
	try {
		if (!modelsJsonCostCache || modelsJsonCostCache.path !== modelsPath) {
			const parsed = tryReadJsonSync(modelsPath);
			if (!parsed) return EMPTY_PROVIDER_COST_INDEX;
			modelsJsonCostCache = {
				path: modelsPath,
				providers: parsed?.providers,
				normalizedEntries: null,
				rawEntries: null
			};
		}
		if (useRawEntries) {
			modelsJsonCostCache.rawEntries ??= getProviderCostIndex(modelsJsonCostCache.providers, { allowPluginNormalization: false });
			return modelsJsonCostCache.rawEntries;
		}
		modelsJsonCostCache.normalizedEntries ??= getProviderCostIndex(modelsJsonCostCache.providers);
		return modelsJsonCostCache.normalizedEntries;
	} catch {
		return EMPTY_PROVIDER_COST_INDEX;
	}
}
function findConfiguredProviderCost(params) {
	const key = toResolvedModelKey(params);
	if (!key) return;
	return getProviderCostFromIndex(params.config?.models?.providers, key, { allowPluginNormalization: params.allowPluginNormalization });
}
function stableCostFingerprintValue(value) {
	if (typeof value === "number") return Number.isFinite(value) ? JSON.stringify(value) : JSON.stringify(String(value));
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map((entry) => stableCostFingerprintValue(entry)).join(",")}]`;
	const record = value;
	return `{${Object.keys(record).filter((key) => record[key] !== void 0).toSorted().map((key) => `${JSON.stringify(key)}:${stableCostFingerprintValue(record[key])}`).join(",")}}`;
}
function buildModelCostFingerprint(cost) {
	const tierFingerprint = Array.isArray(cost.tieredPricing) ? cost.tieredPricing.flatMap((tier) => {
		const range = Array.isArray(tier.range) ? tier.range : [];
		return [
			tier.input,
			tier.output,
			tier.cacheRead,
			tier.cacheWrite,
			...range
		];
	}) : [];
	return [
		cost.input,
		cost.output,
		cost.cacheRead,
		cost.cacheWrite,
		...tierFingerprint
	].join("|");
}
function isProviderCostSourceCurrent(providers, source, key, options) {
	if (!providers[source.providerKey]?.models?.includes(source.model)) return false;
	const normalized = normalizeModelRef(normalizeProviderId(source.providerKey), source.model.id, {
		allowManifestNormalization: options?.allowManifestNormalization ?? (options?.allowPluginNormalization === false ? false : void 0),
		allowPluginNormalization: options?.allowPluginNormalization
	});
	return modelKey(normalized.provider, normalized.model) === key;
}
function refreshProviderCostIndexEntry(index, key, providers, options) {
	const source = index.sources.get(key);
	if (!source) return "current";
	if (providers && !isProviderCostSourceCurrent(providers, source, key, options)) return "rebuild";
	if (!isRawModelCostConfig(source.model.cost)) return "rebuild";
	if (source.model.cost !== source.rawCost) source.rawCost = source.model.cost;
	const fingerprint = buildModelCostFingerprint(source.rawCost);
	if (source.fingerprint === fingerprint) return "current";
	source.fingerprint = fingerprint;
	index.entries.set(key, normalizeModelCostConfig(source.rawCost));
	return "current";
}
function refreshProviderCostIndexMutations(index, providers, options) {
	for (const key of index.sources.keys()) if (refreshProviderCostIndexEntry(index, key, providers, options) === "rebuild") return "rebuild";
	return "current";
}
function hasProviderCostSourceForKey(providers, key, options) {
	for (const [providerKey, providerConfig] of Object.entries(providers)) {
		const normalizedProvider = normalizeProviderId(providerKey);
		for (const model of providerConfig?.models ?? []) {
			if (!isRawModelCostConfig(model.cost)) continue;
			const normalized = normalizeModelRef(normalizedProvider, model.id, {
				allowManifestNormalization: options?.allowManifestNormalization ?? (options?.allowPluginNormalization === false ? false : void 0),
				allowPluginNormalization: options?.allowPluginNormalization
			});
			if (modelKey(normalized.provider, normalized.model) === key) return true;
		}
	}
	return false;
}
function getProviderCostFromIndex(providers, key, options) {
	if (!providers) return;
	const isRawLookup = options?.allowPluginNormalization === false && (options.allowManifestNormalization === false || options.allowManifestNormalization === void 0);
	const isDefaultNormalizedLookup = options?.allowPluginNormalization !== false && options?.allowManifestNormalization === void 0;
	if (!isRawLookup && !isDefaultNormalizedLookup) return buildProviderCostIndex(providers, options).get(key);
	let cache = providerCostIndexByConfig.get(providers);
	if (!cache) {
		cache = {};
		providerCostIndexByConfig.set(providers, cache);
	}
	const index = isRawLookup ? cache.rawEntries ??= buildProviderCostIndexBundle(providers, {
		allowManifestNormalization: false,
		allowPluginNormalization: false
	}) : cache.normalizedEntries ??= buildProviderCostIndexBundle(providers);
	const sourceMissingWithStructuralChange = !index.sources.has(key) && index.structureFingerprint !== buildProviderCostStructureFingerprint(providers);
	const sourceMissingWithNewCost = !index.sources.has(key) && hasProviderCostSourceForKey(providers, key, options);
	if (refreshProviderCostIndexEntry(index, key, providers, options) === "rebuild" || sourceMissingWithStructuralChange || sourceMissingWithNewCost) {
		const rebuilt = buildProviderCostIndexBundle(providers, isRawLookup ? {
			allowManifestNormalization: false,
			allowPluginNormalization: false
		} : void 0);
		if (isRawLookup) cache.rawEntries = rebuilt;
		else cache.normalizedEntries = rebuilt;
		return rebuilt.entries.get(key);
	}
	return index.entries.get(key);
}
function serializeCostIndex(entries) {
	return Array.from(entries.entries()).toSorted(([a], [b]) => a.localeCompare(b));
}
function resolveModelCostConfigFingerprint(config) {
	return stableCostFingerprintValue({
		configuredRaw: serializeCostIndex(getProviderCostIndex(config?.models?.providers, { allowPluginNormalization: false })),
		configuredNormalized: serializeCostIndex(getProviderCostIndex(config?.models?.providers)),
		modelsJsonRaw: serializeCostIndex(loadModelsJsonCostIndex({ allowPluginNormalization: false })),
		modelsJsonNormalized: serializeCostIndex(loadModelsJsonCostIndex()),
		gatewayPricing: getGatewayModelPricingCacheFingerprint()
	});
}
function resolveModelCostConfig(params) {
	const rawKey = toDirectModelKey(params);
	if (!rawKey) return;
	const rawModelsJsonCost = loadModelsJsonCostIndex({ allowPluginNormalization: false }).get(rawKey);
	if (rawModelsJsonCost) return rawModelsJsonCost;
	const rawConfiguredCost = findConfiguredProviderCost({
		...params,
		allowPluginNormalization: false
	});
	if (rawConfiguredCost) return rawConfiguredCost;
	if (params.allowPluginNormalization === false) return;
	if (shouldUseNormalizedCostLookup(params)) {
		const key = toResolvedModelKey(params);
		if (key && key !== rawKey) {
			const modelsJsonCost = loadModelsJsonCostIndex().get(key);
			if (modelsJsonCost) return modelsJsonCost;
			const configuredCost = findConfiguredProviderCost(params);
			if (configuredCost) return configuredCost;
		}
	}
	return getCachedGatewayModelPricing(params);
}
const toNumber = (value) => typeof value === "number" && Number.isFinite(value) ? value : 0;
function selectPricingTier(tiers, input) {
	const sortedTiers = getSortedPricingTiers(tiers);
	if (sortedTiers.length === 0) return;
	if (input <= 0) return sortedTiers[0];
	for (const tier of sortedTiers) {
		const [start, end] = tier.range;
		if (input >= start && input < end) return tier;
	}
	for (let index = sortedTiers.length - 1; index >= 0; index -= 1) {
		const tier = sortedTiers[index];
		if (input >= tier.range[0]) return tier;
	}
	return sortedTiers[0];
}
function getSortedPricingTiers(tiers) {
	const cached = sortedPricingTiersByInput.get(tiers);
	if (cached) return cached;
	const sorted = tiers.toSorted((a, b) => a.range[0] - b.range[0]);
	sortedPricingTiersByInput.set(tiers, sorted);
	return sorted;
}
function computeTieredCost(tiers, input, output, cacheRead, cacheWrite) {
	const tier = selectPricingTier(tiers, input);
	if (!tier) return 0;
	return input * tier.input + output * tier.output + cacheRead * tier.cacheRead + cacheWrite * tier.cacheWrite;
}
function estimateUsageCost(params) {
	const usage = params.usage;
	const cost = params.cost;
	if (!usage || !cost) return;
	const input = toNumber(usage.input);
	const output = toNumber(usage.output);
	const cacheRead = toNumber(usage.cacheRead);
	const cacheWrite = toNumber(usage.cacheWrite);
	let total;
	if (cost.tieredPricing && cost.tieredPricing.length > 0) total = computeTieredCost(cost.tieredPricing, input, output, cacheRead, cacheWrite);
	else total = input * cost.input + output * cost.output + cacheRead * cost.cacheRead + cacheWrite * cost.cacheWrite;
	if (!Number.isFinite(total)) return;
	return total / 1e6;
}
function resetUsageFormatCachesForTest() {
	modelsJsonCostCache = null;
	providerCostIndexByConfig = /* @__PURE__ */ new WeakMap();
	modelKeyCache = /* @__PURE__ */ new Map();
	sortedPricingTiersByInput = /* @__PURE__ */ new WeakMap();
}
//#endregion
export { resolveModelCostConfig as a, resetUsageFormatCachesForTest as i, formatTokenCount as n, resolveModelCostConfigFingerprint as o, formatUsd as r, estimateUsageCost as t };
