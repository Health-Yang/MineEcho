import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import "./agent-scope-CudANNo3.js";
import { c as parseAgentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { l as normalizeAgentId } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-BfxErZq2.js";
import { t as runTasksWithConcurrency } from "./run-with-concurrency-5cC57eDC.js";
import { Ii as ErrorCodes, Li as errorShape, en as validateSessionsUsageParams, t as formatValidationErrors } from "./protocol-BkfNT2Bp.js";
import { a as resolveStoredSessionKeyForAgentStore, r as resolveSessionStoreAgentId } from "./session-store-key-Bm8fGm9t.js";
import { a as resolveSessionFilePathOptions, i as resolveSessionFilePath } from "./paths-DZXdqwOo.js";
import { t as loadCombinedSessionStoreForGateway } from "./combined-store-gateway-v8_BZzBh.js";
import { c as loadSessionEntry, i as listAgentsForGateway } from "./session-utils-CmwnszsS.js";
import { t as resolvePreferredSessionKeyForSessionIdMatches } from "./session-id-resolution-o9Vdnlwd.js";
import "./provider-usage-SZRZ9SnK.js";
import { t as loadProviderUsageSummary } from "./provider-usage.load-BkFKp7GX.js";
import { a as loadSessionCostSummaryFromCache, c as resolveExistingUsageSessionFile, o as loadSessionLogs, r as loadCostUsageSummaryFromCache, s as loadSessionUsageTimeSeries, t as discoverAllSessions } from "./session-cost-usage-7DA3wtDY.js";
import fs from "node:fs";
//#region src/shared/usage-aggregates.ts
function mergeUsageLatency(totals, latency) {
	if (!latency || latency.count <= 0) return;
	totals.count += latency.count;
	totals.sum += latency.avgMs * latency.count;
	totals.min = Math.min(totals.min, latency.minMs);
	totals.max = Math.max(totals.max, latency.maxMs);
	totals.p95Max = Math.max(totals.p95Max, latency.p95Ms);
}
function mergeUsageDailyLatency(dailyLatencyMap, dailyLatency) {
	for (const day of dailyLatency ?? []) {
		const existing = dailyLatencyMap.get(day.date) ?? {
			date: day.date,
			count: 0,
			sum: 0,
			min: Number.POSITIVE_INFINITY,
			max: 0,
			p95Max: 0
		};
		existing.count += day.count;
		existing.sum += day.avgMs * day.count;
		existing.min = Math.min(existing.min, day.minMs);
		existing.max = Math.max(existing.max, day.maxMs);
		existing.p95Max = Math.max(existing.p95Max, day.p95Ms);
		dailyLatencyMap.set(day.date, existing);
	}
}
function buildUsageAggregateTail(params) {
	return {
		byChannel: Array.from(params.byChannelMap.entries()).map(([channel, totals]) => ({
			channel,
			totals
		})).toSorted((a, b) => b.totals.totalCost - a.totals.totalCost),
		latency: params.latencyTotals.count > 0 ? {
			count: params.latencyTotals.count,
			avgMs: params.latencyTotals.sum / params.latencyTotals.count,
			minMs: params.latencyTotals.min === Number.POSITIVE_INFINITY ? 0 : params.latencyTotals.min,
			maxMs: params.latencyTotals.max,
			p95Ms: params.latencyTotals.p95Max
		} : void 0,
		dailyLatency: Array.from(params.dailyLatencyMap.values()).map((entry) => ({
			date: entry.date,
			count: entry.count,
			avgMs: entry.count ? entry.sum / entry.count : 0,
			minMs: entry.min === Number.POSITIVE_INFINITY ? 0 : entry.min,
			maxMs: entry.max,
			p95Ms: entry.p95Max
		})).toSorted((a, b) => a.date.localeCompare(b.date)),
		modelDaily: Array.from(params.modelDailyMap.values()).toSorted((a, b) => a.date.localeCompare(b.date) || b.cost - a.cost),
		daily: Array.from(params.dailyMap.values()).toSorted((a, b) => a.date.localeCompare(b.date))
	};
}
//#endregion
//#region src/gateway/server-methods/usage.ts
const COST_USAGE_CACHE_TTL_MS = 3e4;
const COST_USAGE_CACHE_MAX = 256;
const SESSIONS_USAGE_CACHE_READ_CONCURRENCY = 12;
const DAY_MS = 1440 * 60 * 1e3;
const costUsageCache = /* @__PURE__ */ new Map();
function findCostUsageCacheEvictionKey() {
	for (const [key, entry] of costUsageCache) if (!entry.inFlight) return key;
	return costUsageCache.keys().next().value;
}
function setCostUsageCache(cacheKey, entry) {
	if (!costUsageCache.has(cacheKey) && costUsageCache.size >= COST_USAGE_CACHE_MAX) {
		const evictKey = findCostUsageCacheEvictionKey();
		if (evictKey !== void 0) costUsageCache.delete(evictKey);
	}
	costUsageCache.set(cacheKey, entry);
}
function resolveSessionUsageFileOrRespond(key, respond, config) {
	const { entry, storePath } = loadSessionEntry(key);
	const parsed = parseAgentSessionKey(key);
	const agentId = parsed?.agentId;
	const rawSessionId = parsed?.rest ?? key;
	const sessionId = entry?.sessionId ?? rawSessionId;
	let sessionFile;
	try {
		sessionFile = resolveSessionFilePath(sessionId, entry, resolveSessionFilePathOptions({
			storePath,
			agentId
		}));
	} catch {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `Invalid session key: ${key}`));
		return null;
	}
	return {
		config,
		entry,
		agentId,
		sessionId,
		sessionFile
	};
}
const parseDateParts = (raw) => {
	if (typeof raw !== "string" || !raw.trim()) return;
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
	if (!match) return;
	const [, yearStr, monthStr, dayStr] = match;
	const year = Number(yearStr);
	const monthIndex = Number(monthStr) - 1;
	const day = Number(dayStr);
	if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return;
	return {
		year,
		monthIndex,
		day
	};
};
/**
* Parse a UTC offset string in the format UTC+H, UTC-H, UTC+HH, UTC-HH, UTC+H:MM, UTC-HH:MM.
* Returns the UTC offset in minutes (east-positive), or undefined if invalid.
*/
const parseUtcOffsetToMinutes = (raw) => {
	if (typeof raw !== "string" || !raw.trim()) return;
	const match = /^UTC([+-])(\d{1,2})(?::([0-5]\d))?$/.exec(raw.trim());
	if (!match) return;
	const sign = match[1] === "+" ? 1 : -1;
	const hours = Number(match[2]);
	const minutes = Number(match[3] ?? "0");
	if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return;
	if (hours > 14 || hours === 14 && minutes !== 0) return;
	const totalMinutes = sign * (hours * 60 + minutes);
	if (totalMinutes < -720 || totalMinutes > 840) return;
	return totalMinutes;
};
const resolveDateInterpretation = (params) => {
	if (params.mode === "gateway") return { mode: "gateway" };
	if (params.mode === "specific") {
		const utcOffsetMinutes = parseUtcOffsetToMinutes(params.utcOffset);
		if (utcOffsetMinutes !== void 0) return {
			mode: "specific",
			utcOffsetMinutes
		};
	}
	return { mode: "utc" };
};
/**
* Parse a date string (YYYY-MM-DD) to start-of-day timestamp based on interpretation mode.
* Returns undefined if invalid.
*/
const parseDateToMs = (raw, interpretation = { mode: "utc" }) => {
	const parts = parseDateParts(raw);
	if (!parts) return;
	const { year, monthIndex, day } = parts;
	if (interpretation.mode === "gateway") {
		const ms = new Date(year, monthIndex, day).getTime();
		return Number.isNaN(ms) ? void 0 : ms;
	}
	if (interpretation.mode === "specific") {
		const ms = Date.UTC(year, monthIndex, day) - interpretation.utcOffsetMinutes * 60 * 1e3;
		return Number.isNaN(ms) ? void 0 : ms;
	}
	const ms = Date.UTC(year, monthIndex, day);
	return Number.isNaN(ms) ? void 0 : ms;
};
const getTodayStartMs = (now, interpretation) => {
	if (interpretation.mode === "gateway") return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
	if (interpretation.mode === "specific") {
		const shifted = new Date(now.getTime() + interpretation.utcOffsetMinutes * 60 * 1e3);
		return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - interpretation.utcOffsetMinutes * 60 * 1e3;
	}
	return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};
const parseDays = (raw) => {
	if (typeof raw === "number" && Number.isFinite(raw)) return Math.floor(raw);
	if (typeof raw === "string" && raw.trim() !== "") {
		const parsed = Number(raw);
		if (Number.isFinite(parsed)) return Math.floor(parsed);
	}
};
const resolveRangeDays = (raw) => {
	if (raw === "all") return "all";
	if (raw === "7d") return 7;
	if (raw === "30d") return 30;
	if (raw === "90d") return 90;
	if (raw === "1y") return 365;
};
/**
* Get date range from params (startDate/endDate or days).
* Falls back to last 30 days if not provided.
*/
const parseDateRange = (params) => {
	const now = /* @__PURE__ */ new Date();
	const interpretation = resolveDateInterpretation(params);
	const todayStartMs = getTodayStartMs(now, interpretation);
	const todayEndMs = todayStartMs + DAY_MS - 1;
	const startMs = parseDateToMs(params.startDate, interpretation);
	const endMs = parseDateToMs(params.endDate, interpretation);
	if (startMs !== void 0 && endMs !== void 0) return {
		startMs,
		endMs: endMs + DAY_MS - 1
	};
	const rangeDays = resolveRangeDays(params.range);
	if (rangeDays === "all") return {
		startMs: 0,
		endMs: todayEndMs
	};
	if (rangeDays !== void 0) return {
		startMs: todayStartMs - (rangeDays - 1) * DAY_MS,
		endMs: todayEndMs
	};
	const days = parseDays(params.days);
	if (days !== void 0) return {
		startMs: todayStartMs - (Math.max(1, days) - 1) * DAY_MS,
		endMs: todayEndMs
	};
	return {
		startMs: todayStartMs - 29 * DAY_MS,
		endMs: todayEndMs
	};
};
function buildStoreBySessionId(store) {
	const matchesBySessionId = /* @__PURE__ */ new Map();
	for (const [key, entry] of Object.entries(store)) {
		if (!entry?.sessionId) continue;
		const matches = matchesBySessionId.get(entry.sessionId) ?? [];
		matches.push([key, entry]);
		matchesBySessionId.set(entry.sessionId, matches);
	}
	const storeBySessionId = /* @__PURE__ */ new Map();
	for (const [sessionId, matches] of matchesBySessionId) {
		const preferredKey = resolvePreferredSessionKeyForSessionIdMatches(matches, sessionId);
		if (!preferredKey) continue;
		const preferredEntry = store[preferredKey];
		if (preferredEntry) storeBySessionId.set(sessionId, {
			key: preferredKey,
			entry: preferredEntry
		});
	}
	return storeBySessionId;
}
function filterSessionStoreByAgent(params) {
	const scopedAgentId = normalizeAgentId(params.agentId);
	const scopedStore = {};
	for (const [key, entry] of Object.entries(params.store)) {
		if (params.config.session?.scope === "global" && key.trim().toLowerCase() === "global") {
			scopedStore[key] = entry;
			continue;
		}
		if (resolveSessionStoreAgentId(params.config, key) === scopedAgentId) scopedStore[key] = entry;
	}
	return scopedStore;
}
async function discoverAllSessionsForUsage(params) {
	const requestedAgentId = normalizeOptionalString(params.agentId);
	const agents = requestedAgentId ? [{ id: normalizeAgentId(requestedAgentId) }] : listAgentsForGateway(params.config).agents;
	return (await Promise.all(agents.map(async (agent) => {
		const agentId = normalizeAgentId(agent.id);
		return (await discoverAllSessions({
			agentId,
			startMs: params.startMs,
			endMs: params.endMs,
			includeFirstUserMessage: false
		})).map((session) => Object.assign({}, session, { agentId }));
	}))).flat().toSorted((a, b) => b.mtime - a.mtime);
}
function addUniqueSessionIds(target, ids) {
	const seen = new Set(target);
	for (const id of ids) {
		const normalized = normalizeOptionalString(id);
		if (normalized && !seen.has(normalized)) {
			seen.add(normalized);
			target.push(normalized);
		}
	}
	return target;
}
function resolveUsageFamilySessionIds(entry, currentSessionId) {
	return addUniqueSessionIds([], [currentSessionId, ...entry?.usageFamilySessionIds ?? []]);
}
function resolveUsageFamilyKey(params) {
	return params.entry?.usageFamilyKey ?? params.key ?? params.sessionId;
}
function maybeMergeFamilyEntry(params) {
	if (params.groupingMode !== "family") {
		params.mergedEntries.push(params.base);
		return;
	}
	const includedSessionIds = resolveUsageFamilySessionIds(params.base.storeEntry, params.base.sessionId);
	const sessionFamilyKey = resolveUsageFamilyKey({
		key: params.base.key,
		entry: params.base.storeEntry,
		sessionId: params.base.sessionId
	});
	params.mergedEntries.push({
		...params.base,
		scope: "family",
		sessionFamilyKey,
		currentSessionId: params.base.sessionId,
		includedSessionIds
	});
}
function createEmptySessionCostSummary() {
	return {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		totalTokens: 0,
		totalCost: 0,
		inputCost: 0,
		outputCost: 0,
		cacheReadCost: 0,
		cacheWriteCost: 0,
		missingCostEntries: 0
	};
}
function mergeSessionUsageInto(target, source) {
	target.input += source.input;
	target.output += source.output;
	target.cacheRead += source.cacheRead;
	target.cacheWrite += source.cacheWrite;
	target.totalTokens += source.totalTokens;
	target.totalCost += source.totalCost;
	target.inputCost += source.inputCost;
	target.outputCost += source.outputCost;
	target.cacheReadCost += source.cacheReadCost;
	target.cacheWriteCost += source.cacheWriteCost;
	target.missingCostEntries += source.missingCostEntries;
	target.firstActivity = target.firstActivity === void 0 ? source.firstActivity : source.firstActivity === void 0 ? target.firstActivity : Math.min(target.firstActivity, source.firstActivity);
	target.lastActivity = target.lastActivity === void 0 ? source.lastActivity : source.lastActivity === void 0 ? target.lastActivity : Math.max(target.lastActivity, source.lastActivity);
	if (target.firstActivity !== void 0 && target.lastActivity !== void 0) target.durationMs = Math.max(0, target.lastActivity - target.firstActivity);
	const activityDates = new Set([...target.activityDates ?? [], ...source.activityDates ?? []]);
	if (activityDates.size > 0) target.activityDates = Array.from(activityDates).toSorted();
	target.dailyBreakdown = mergeDailyRows(target.dailyBreakdown, source.dailyBreakdown, ["tokens", "cost"]);
	target.dailyMessageCounts = mergeDailyRows(target.dailyMessageCounts, source.dailyMessageCounts, [
		"total",
		"user",
		"assistant",
		"toolCalls",
		"toolResults",
		"errors"
	]);
	target.utcQuarterHourMessageCounts = mergeQuarterRows(target.utcQuarterHourMessageCounts, source.utcQuarterHourMessageCounts, [
		"total",
		"user",
		"assistant",
		"toolCalls",
		"toolResults",
		"errors"
	]);
	target.utcQuarterHourTokenUsage = mergeQuarterRows(target.utcQuarterHourTokenUsage, source.utcQuarterHourTokenUsage, [
		"input",
		"output",
		"cacheRead",
		"cacheWrite",
		"totalTokens",
		"totalCost"
	]);
	target.dailyLatency = mergeDailyLatencyRows(target.dailyLatency, source.dailyLatency);
	target.dailyModelUsage = mergeDailyModelRows(target.dailyModelUsage, source.dailyModelUsage);
	target.messageCounts = mergeMessageCounts(target.messageCounts, source.messageCounts);
	target.toolUsage = mergeToolUsage(target.toolUsage, source.toolUsage);
	target.modelUsage = mergeModelUsage(target.modelUsage, source.modelUsage);
	target.latency = mergeLatency(target.latency, source.latency);
}
function mergeDailyRows(left, right, fields) {
	const map = /* @__PURE__ */ new Map();
	for (const row of [...left ?? [], ...right ?? []]) {
		const existing = map.get(row.date);
		if (!existing) {
			map.set(row.date, { ...row });
			continue;
		}
		for (const field of fields) existing[field] = (existing[field] ?? 0) + (row[field] ?? 0);
	}
	return map.size > 0 ? Array.from(map.values()).toSorted((a, b) => a.date.localeCompare(b.date)) : void 0;
}
function mergeQuarterRows(left, right, fields) {
	const map = /* @__PURE__ */ new Map();
	for (const row of [...left ?? [], ...right ?? []]) {
		const key = `${row.date}:${row.quarterIndex}`;
		const existing = map.get(key);
		if (!existing) {
			map.set(key, { ...row });
			continue;
		}
		for (const field of fields) existing[field] = (existing[field] ?? 0) + (row[field] ?? 0);
	}
	return map.size > 0 ? Array.from(map.values()).toSorted((a, b) => a.date.localeCompare(b.date) || a.quarterIndex - b.quarterIndex) : void 0;
}
function mergeMessageCounts(left, right) {
	if (!left && !right) return;
	return {
		total: (left?.total ?? 0) + (right?.total ?? 0),
		user: (left?.user ?? 0) + (right?.user ?? 0),
		assistant: (left?.assistant ?? 0) + (right?.assistant ?? 0),
		toolCalls: (left?.toolCalls ?? 0) + (right?.toolCalls ?? 0),
		toolResults: (left?.toolResults ?? 0) + (right?.toolResults ?? 0),
		errors: (left?.errors ?? 0) + (right?.errors ?? 0)
	};
}
function mergeToolUsage(left, right) {
	const map = /* @__PURE__ */ new Map();
	for (const tool of [...left?.tools ?? [], ...right?.tools ?? []]) map.set(tool.name, (map.get(tool.name) ?? 0) + tool.count);
	return map.size > 0 ? {
		totalCalls: Array.from(map.values()).reduce((sum, count) => sum + count, 0),
		uniqueTools: map.size,
		tools: Array.from(map.entries()).map(([name, count]) => ({
			name,
			count
		})).toSorted((a, b) => b.count - a.count)
	} : void 0;
}
function mergeModelUsage(left, right) {
	const map = /* @__PURE__ */ new Map();
	const mergeTotals = (target, source) => {
		target.input += source.input;
		target.output += source.output;
		target.cacheRead += source.cacheRead;
		target.cacheWrite += source.cacheWrite;
		target.totalTokens += source.totalTokens;
		target.totalCost += source.totalCost;
		target.inputCost += source.inputCost;
		target.outputCost += source.outputCost;
		target.cacheReadCost += source.cacheReadCost;
		target.cacheWriteCost += source.cacheWriteCost;
		target.missingCostEntries += source.missingCostEntries;
	};
	for (const entry of [...left ?? [], ...right ?? []]) {
		const key = `${entry.provider ?? "unknown"}::${entry.model ?? "unknown"}`;
		const existing = map.get(key) ?? {
			provider: entry.provider,
			model: entry.model,
			count: 0,
			totals: createEmptySessionCostSummary()
		};
		existing.count += entry.count;
		mergeTotals(existing.totals, entry.totals);
		map.set(key, existing);
	}
	return map.size > 0 ? Array.from(map.values()) : void 0;
}
function mergeLatency(left, right) {
	if (!left && !right) return;
	const leftCount = left?.count ?? 0;
	const rightCount = right?.count ?? 0;
	const count = leftCount + rightCount;
	return {
		count,
		avgMs: count > 0 ? ((left?.avgMs ?? 0) * leftCount + (right?.avgMs ?? 0) * rightCount) / count : 0,
		p95Ms: Math.max(left?.p95Ms ?? 0, right?.p95Ms ?? 0),
		minMs: Math.min(left?.minMs ?? Number.POSITIVE_INFINITY, right?.minMs ?? Number.POSITIVE_INFINITY),
		maxMs: Math.max(left?.maxMs ?? 0, right?.maxMs ?? 0)
	};
}
function mergeDailyLatencyRows(left, right) {
	const map = /* @__PURE__ */ new Map();
	for (const row of [...left ?? [], ...right ?? []]) {
		const existing = map.get(row.date);
		if (!existing) {
			map.set(row.date, { ...row });
			continue;
		}
		const count = existing.count + row.count;
		existing.avgMs = count > 0 ? (existing.avgMs * existing.count + row.avgMs * row.count) / count : 0;
		existing.count = count;
		existing.p95Ms = Math.max(existing.p95Ms, row.p95Ms);
		existing.minMs = Math.min(existing.minMs, row.minMs);
		existing.maxMs = Math.max(existing.maxMs, row.maxMs);
	}
	return map.size > 0 ? Array.from(map.values()).toSorted((a, b) => a.date.localeCompare(b.date)) : void 0;
}
function mergeDailyModelRows(left, right) {
	const map = /* @__PURE__ */ new Map();
	for (const row of [...left ?? [], ...right ?? []]) {
		const key = `${row.date}:${row.provider ?? "unknown"}:${row.model ?? "unknown"}`;
		const existing = map.get(key);
		if (!existing) {
			map.set(key, { ...row });
			continue;
		}
		existing.tokens += row.tokens;
		existing.cost += row.cost;
		existing.count += row.count;
	}
	return map.size > 0 ? Array.from(map.values()).toSorted((a, b) => a.date.localeCompare(b.date)) : void 0;
}
async function loadCostUsageSummaryCached(params) {
	const cacheKey = `${params.startMs}-${params.endMs}`;
	const now = Date.now();
	const cached = costUsageCache.get(cacheKey);
	if (cached?.summary && cached.updatedAt && now - cached.updatedAt < COST_USAGE_CACHE_TTL_MS && cached.summary.cacheStatus?.status !== "refreshing") return cached.summary;
	if (cached?.inFlight) {
		if (cached.summary) return cached.summary;
		return await cached.inFlight;
	}
	const entry = cached ?? {};
	const inFlight = loadCostUsageSummaryFromCache({
		startMs: params.startMs,
		endMs: params.endMs,
		config: params.config,
		requestRefresh: true,
		refreshMode: "background"
	}).then((summary) => {
		setCostUsageCache(cacheKey, {
			summary,
			updatedAt: summary.cacheStatus?.status === "refreshing" ? void 0 : Date.now()
		});
		return summary;
	}).catch((err) => {
		if (entry.summary) return entry.summary;
		throw err;
	}).finally(() => {
		const current = costUsageCache.get(cacheKey);
		if (current?.inFlight === inFlight) {
			current.inFlight = void 0;
			setCostUsageCache(cacheKey, current);
		}
	});
	entry.inFlight = inFlight;
	setCostUsageCache(cacheKey, entry);
	if (entry.summary) return entry.summary;
	return await inFlight;
}
function mergeUsageCacheStatus(target, source) {
	if (!target) return { ...source };
	const statusRank = {
		fresh: 0,
		partial: 1,
		stale: 2,
		refreshing: 3
	};
	return {
		status: statusRank[source.status] > statusRank[target.status] ? source.status : target.status,
		cachedFiles: target.cachedFiles + source.cachedFiles,
		pendingFiles: target.pendingFiles + source.pendingFiles,
		staleFiles: target.staleFiles + source.staleFiles,
		refreshedAt: target.refreshedAt === void 0 ? source.refreshedAt : source.refreshedAt === void 0 ? target.refreshedAt : Math.max(target.refreshedAt, source.refreshedAt)
	};
}
const testApi = {
	parseDateParts,
	parseUtcOffsetToMinutes,
	resolveDateInterpretation,
	parseDateToMs,
	getTodayStartMs,
	parseDays,
	parseDateRange,
	discoverAllSessionsForUsage,
	loadCostUsageSummaryCached,
	costUsageCache
};
const usageHandlers = {
	"usage.status": async ({ respond }) => {
		respond(true, await loadProviderUsageSummary(), void 0);
	},
	"usage.cost": async ({ respond, params, context }) => {
		const config = context.getRuntimeConfig();
		const { startMs, endMs } = parseDateRange({
			startDate: params?.startDate,
			endDate: params?.endDate,
			days: params?.days,
			range: params?.range,
			mode: params?.mode,
			utcOffset: params?.utcOffset
		});
		respond(true, await loadCostUsageSummaryCached({
			startMs,
			endMs,
			config
		}), void 0);
	},
	"sessions.usage": async ({ respond, params, context }) => {
		if (!validateSessionsUsageParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid sessions.usage params: ${formatValidationErrors(validateSessionsUsageParams.errors)}`));
			return;
		}
		const p = params;
		const config = context.getRuntimeConfig();
		const { startMs, endMs } = parseDateRange({
			startDate: p.startDate,
			endDate: p.endDate,
			range: p.range,
			mode: p.mode,
			utcOffset: p.utcOffset
		});
		const limit = typeof p.limit === "number" && Number.isFinite(p.limit) ? p.limit : 50;
		const includeContextWeight = p.includeContextWeight ?? false;
		const specificKey = normalizeOptionalString(p.key) ?? null;
		const requestedAgentId = normalizeOptionalString(p.agentId);
		const specificKeyAgentId = specificKey ? parseAgentSessionKey(specificKey)?.agentId : void 0;
		if (requestedAgentId && specificKeyAgentId && normalizeAgentId(requestedAgentId) !== specificKeyAgentId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "session key agent does not match agentId"));
			return;
		}
		const effectiveAgentId = normalizeAgentId(requestedAgentId ?? specificKeyAgentId ?? resolveDefaultAgentId(config));
		const groupingMode = p.groupBy === "family" || p.includeHistorical === true ? "family" : "instance";
		const { storePath, store } = loadCombinedSessionStoreForGateway(config, { agentId: effectiveAgentId });
		const scopedStore = filterSessionStoreByAgent({
			config,
			store,
			agentId: effectiveAgentId
		});
		const now = Date.now();
		const mergedEntries = [];
		if (specificKey) {
			const scopedSpecificKey = resolveStoredSessionKeyForAgentStore({
				cfg: config,
				agentId: effectiveAgentId,
				sessionKey: specificKey
			});
			const scopedParsed = parseAgentSessionKey(scopedSpecificKey);
			const agentIdFromKey = scopedParsed?.agentId ?? effectiveAgentId;
			const keyRest = scopedParsed?.rest ?? specificKey;
			const storeBySessionId = buildStoreBySessionId(scopedStore);
			const storeMatch = scopedStore[scopedSpecificKey] ? {
				key: scopedSpecificKey,
				entry: scopedStore[scopedSpecificKey]
			} : scopedStore[specificKey] ? {
				key: specificKey,
				entry: scopedStore[specificKey]
			} : null;
			const storeByIdMatch = storeBySessionId.get(keyRest) ?? (keyRest !== specificKey ? storeBySessionId.get(specificKey) : void 0) ?? null;
			const resolvedStoreKey = storeMatch?.key ?? storeByIdMatch?.key ?? scopedSpecificKey;
			const storeEntry = storeMatch?.entry ?? storeByIdMatch?.entry;
			const sessionId = storeEntry?.sessionId ?? keyRest;
			let sessionFile;
			try {
				sessionFile = resolveExistingUsageSessionFile({
					sessionId,
					sessionEntry: storeEntry,
					sessionFile: resolveSessionFilePath(sessionId, storeEntry, resolveSessionFilePathOptions({
						storePath: storePath !== "(multiple)" ? storePath : void 0,
						agentId: agentIdFromKey
					})),
					agentId: agentIdFromKey
				});
			} catch {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `Invalid session reference: ${specificKey}`));
				return;
			}
			if (sessionFile) try {
				const stats = fs.statSync(sessionFile);
				if (stats.isFile()) maybeMergeFamilyEntry({
					mergedEntries,
					groupingMode,
					base: {
						key: resolvedStoreKey,
						agentId: agentIdFromKey,
						sessionId,
						sessionFile,
						label: storeEntry?.label,
						updatedAt: storeEntry?.updatedAt ?? stats.mtimeMs,
						storeEntry
					}
				});
			} catch {}
		} else {
			const discoveredSessions = await discoverAllSessionsForUsage({
				config,
				agentId: effectiveAgentId,
				startMs,
				endMs
			});
			const storeBySessionId = buildStoreBySessionId(scopedStore);
			const storeFamilySessionIds = /* @__PURE__ */ new Set();
			if (groupingMode === "family") for (const entry of Object.values(scopedStore)) for (const sessionId of entry?.usageFamilySessionIds ?? []) storeFamilySessionIds.add(sessionId);
			for (const discovered of discoveredSessions) {
				const storeMatch = storeBySessionId.get(discovered.sessionId);
				if (storeMatch) maybeMergeFamilyEntry({
					mergedEntries,
					groupingMode,
					base: {
						key: storeMatch.key,
						agentId: discovered.agentId,
						sessionId: discovered.sessionId,
						sessionFile: discovered.sessionFile,
						label: storeMatch.entry.label,
						updatedAt: storeMatch.entry.updatedAt ?? discovered.mtime,
						storeEntry: storeMatch.entry
					}
				});
				else {
					if (groupingMode === "family" && storeFamilySessionIds.has(discovered.sessionId)) continue;
					mergedEntries.push({
						key: `agent:${discovered.agentId}:${discovered.sessionId}`,
						agentId: discovered.agentId,
						sessionId: discovered.sessionId,
						sessionFile: discovered.sessionFile,
						label: void 0,
						updatedAt: discovered.mtime,
						scope: "instance"
					});
				}
			}
		}
		mergedEntries.sort((a, b) => b.updatedAt - a.updatedAt);
		const limitedEntries = mergedEntries.slice(0, limit);
		const sessions = [];
		const aggregateTotals = {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			totalCost: 0,
			inputCost: 0,
			outputCost: 0,
			cacheReadCost: 0,
			cacheWriteCost: 0,
			missingCostEntries: 0
		};
		const aggregateMessages = {
			total: 0,
			user: 0,
			assistant: 0,
			toolCalls: 0,
			toolResults: 0,
			errors: 0
		};
		const toolAggregateMap = /* @__PURE__ */ new Map();
		const byModelMap = /* @__PURE__ */ new Map();
		const byProviderMap = /* @__PURE__ */ new Map();
		const byAgentMap = /* @__PURE__ */ new Map();
		const byChannelMap = /* @__PURE__ */ new Map();
		const dailyAggregateMap = /* @__PURE__ */ new Map();
		const latencyTotals = {
			count: 0,
			sum: 0,
			min: Number.POSITIVE_INFINITY,
			max: 0,
			p95Max: 0
		};
		const dailyLatencyMap = /* @__PURE__ */ new Map();
		const modelDailyMap = /* @__PURE__ */ new Map();
		let cacheStatus;
		const emptyTotals = () => ({
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			totalCost: 0,
			inputCost: 0,
			outputCost: 0,
			cacheReadCost: 0,
			cacheWriteCost: 0,
			missingCostEntries: 0
		});
		const mergeTotals = (target, source) => {
			target.input += source.input;
			target.output += source.output;
			target.cacheRead += source.cacheRead;
			target.cacheWrite += source.cacheWrite;
			target.totalTokens += source.totalTokens;
			target.totalCost += source.totalCost;
			target.inputCost += source.inputCost;
			target.outputCost += source.outputCost;
			target.cacheReadCost += source.cacheReadCost;
			target.cacheWriteCost += source.cacheWriteCost;
			target.missingCostEntries += source.missingCostEntries;
		};
		const usageByEntryIndex = Array.from({ length: limitedEntries.length }, () => null);
		const usageLoadTasks = [];
		for (const [entryIndex, merged] of limitedEntries.entries()) {
			const includedSessionIds = merged.includedSessionIds ?? [merged.sessionId];
			for (const includedSessionId of includedSessionIds) {
				const isCurrentSession = includedSessionId === merged.sessionId;
				const includedSessionFile = isCurrentSession ? merged.sessionFile : resolveExistingUsageSessionFile({
					sessionId: includedSessionId,
					agentId: merged.agentId
				});
				if (!includedSessionFile) continue;
				usageLoadTasks.push(async () => {
					const cachedUsage = await loadSessionCostSummaryFromCache({
						sessionId: includedSessionId,
						sessionEntry: isCurrentSession ? merged.storeEntry : void 0,
						sessionFile: includedSessionFile,
						config,
						agentId: merged.agentId,
						startMs,
						endMs,
						refreshMode: "background"
					});
					return {
						entryIndex,
						cacheStatus: cachedUsage.cacheStatus,
						summary: cachedUsage.summary
					};
				});
			}
		}
		const usageLoadResult = await runTasksWithConcurrency({
			tasks: usageLoadTasks,
			limit: SESSIONS_USAGE_CACHE_READ_CONCURRENCY,
			errorMode: "stop"
		});
		if (usageLoadResult.hasError) throw usageLoadResult.firstError;
		for (const loaded of usageLoadResult.results) {
			cacheStatus = mergeUsageCacheStatus(cacheStatus, loaded.cacheStatus);
			if (!loaded.summary) continue;
			const merged = limitedEntries[loaded.entryIndex];
			const usage = usageByEntryIndex[loaded.entryIndex] ?? createEmptySessionCostSummary();
			usage.sessionId = merged.sessionId;
			usage.sessionFile = merged.sessionFile;
			mergeSessionUsageInto(usage, loaded.summary);
			usageByEntryIndex[loaded.entryIndex] = usage;
		}
		for (const [entryIndex, merged] of limitedEntries.entries()) {
			const agentId = merged.agentId;
			const usage = usageByEntryIndex[entryIndex];
			if (usage) {
				aggregateTotals.input += usage.input;
				aggregateTotals.output += usage.output;
				aggregateTotals.cacheRead += usage.cacheRead;
				aggregateTotals.cacheWrite += usage.cacheWrite;
				aggregateTotals.totalTokens += usage.totalTokens;
				aggregateTotals.totalCost += usage.totalCost;
				aggregateTotals.inputCost += usage.inputCost;
				aggregateTotals.outputCost += usage.outputCost;
				aggregateTotals.cacheReadCost += usage.cacheReadCost;
				aggregateTotals.cacheWriteCost += usage.cacheWriteCost;
				aggregateTotals.missingCostEntries += usage.missingCostEntries;
			}
			const channel = merged.storeEntry?.channel ?? merged.storeEntry?.origin?.provider;
			const chatType = merged.storeEntry?.chatType ?? merged.storeEntry?.origin?.chatType;
			if (usage) {
				if (usage.messageCounts) {
					aggregateMessages.total += usage.messageCounts.total;
					aggregateMessages.user += usage.messageCounts.user;
					aggregateMessages.assistant += usage.messageCounts.assistant;
					aggregateMessages.toolCalls += usage.messageCounts.toolCalls;
					aggregateMessages.toolResults += usage.messageCounts.toolResults;
					aggregateMessages.errors += usage.messageCounts.errors;
				}
				if (usage.toolUsage) for (const tool of usage.toolUsage.tools) toolAggregateMap.set(tool.name, (toolAggregateMap.get(tool.name) ?? 0) + tool.count);
				if (usage.modelUsage) for (const entry of usage.modelUsage) {
					const modelKey = `${entry.provider ?? "unknown"}::${entry.model ?? "unknown"}`;
					const modelExisting = byModelMap.get(modelKey) ?? {
						provider: entry.provider,
						model: entry.model,
						count: 0,
						totals: emptyTotals()
					};
					modelExisting.count += entry.count;
					mergeTotals(modelExisting.totals, entry.totals);
					byModelMap.set(modelKey, modelExisting);
					const providerKey = entry.provider ?? "unknown";
					const providerExisting = byProviderMap.get(providerKey) ?? {
						provider: entry.provider,
						model: void 0,
						count: 0,
						totals: emptyTotals()
					};
					providerExisting.count += entry.count;
					mergeTotals(providerExisting.totals, entry.totals);
					byProviderMap.set(providerKey, providerExisting);
				}
				mergeUsageLatency(latencyTotals, usage.latency);
				mergeUsageDailyLatency(dailyLatencyMap, usage.dailyLatency);
				if (usage.dailyModelUsage) for (const entry of usage.dailyModelUsage) {
					const key = `${entry.date}::${entry.provider ?? "unknown"}::${entry.model ?? "unknown"}`;
					const existing = modelDailyMap.get(key) ?? {
						date: entry.date,
						provider: entry.provider,
						model: entry.model,
						tokens: 0,
						cost: 0,
						count: 0
					};
					existing.tokens += entry.tokens;
					existing.cost += entry.cost;
					existing.count += entry.count;
					modelDailyMap.set(key, existing);
				}
				if (agentId) {
					const agentTotals = byAgentMap.get(agentId) ?? emptyTotals();
					mergeTotals(agentTotals, usage);
					byAgentMap.set(agentId, agentTotals);
				}
				if (channel) {
					const channelTotals = byChannelMap.get(channel) ?? emptyTotals();
					mergeTotals(channelTotals, usage);
					byChannelMap.set(channel, channelTotals);
				}
				if (usage.dailyBreakdown) for (const day of usage.dailyBreakdown) {
					const daily = dailyAggregateMap.get(day.date) ?? {
						date: day.date,
						tokens: 0,
						cost: 0,
						messages: 0,
						toolCalls: 0,
						errors: 0
					};
					daily.tokens += day.tokens;
					daily.cost += day.cost;
					dailyAggregateMap.set(day.date, daily);
				}
				if (usage.dailyMessageCounts) for (const day of usage.dailyMessageCounts) {
					const daily = dailyAggregateMap.get(day.date) ?? {
						date: day.date,
						tokens: 0,
						cost: 0,
						messages: 0,
						toolCalls: 0,
						errors: 0
					};
					daily.messages += day.total;
					daily.toolCalls += day.toolCalls;
					daily.errors += day.errors;
					dailyAggregateMap.set(day.date, daily);
				}
			}
			sessions.push({
				key: merged.key,
				label: merged.label,
				sessionId: merged.sessionId,
				scope: merged.scope ?? "instance",
				sessionFamilyKey: merged.sessionFamilyKey,
				currentSessionId: merged.currentSessionId,
				includedSessionIds: merged.includedSessionIds,
				historicalInstanceCount: merged.includedSessionIds?.length,
				updatedAt: merged.updatedAt,
				agentId,
				channel,
				chatType,
				origin: merged.storeEntry?.origin,
				modelOverride: merged.storeEntry?.modelOverride,
				providerOverride: merged.storeEntry?.providerOverride,
				modelProvider: merged.storeEntry?.modelProvider,
				model: merged.storeEntry?.model,
				usage,
				contextWeight: includeContextWeight ? merged.storeEntry?.systemPromptReport ?? null : void 0
			});
		}
		const formatDateStr = (ms) => {
			const d = new Date(ms);
			return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
		};
		const tail = buildUsageAggregateTail({
			byChannelMap,
			latencyTotals,
			dailyLatencyMap,
			modelDailyMap,
			dailyMap: dailyAggregateMap
		});
		const aggregates = {
			messages: aggregateMessages,
			tools: {
				totalCalls: Array.from(toolAggregateMap.values()).reduce((sum, count) => sum + count, 0),
				uniqueTools: toolAggregateMap.size,
				tools: Array.from(toolAggregateMap.entries()).map(([name, count]) => ({
					name,
					count
				})).toSorted((a, b) => b.count - a.count)
			},
			byModel: Array.from(byModelMap.values()).toSorted((a, b) => {
				const costDiff = (b.totals?.totalCost ?? 0) - (a.totals?.totalCost ?? 0);
				if (costDiff !== 0) return costDiff;
				return (b.totals?.totalTokens ?? 0) - (a.totals?.totalTokens ?? 0);
			}),
			byProvider: Array.from(byProviderMap.values()).toSorted((a, b) => {
				const costDiff = (b.totals?.totalCost ?? 0) - (a.totals?.totalCost ?? 0);
				if (costDiff !== 0) return costDiff;
				return (b.totals?.totalTokens ?? 0) - (a.totals?.totalTokens ?? 0);
			}),
			byAgent: Array.from(byAgentMap.entries()).map(([id, totals]) => ({
				agentId: id,
				totals
			})).toSorted((a, b) => (b.totals?.totalCost ?? 0) - (a.totals?.totalCost ?? 0)),
			...tail
		};
		respond(true, {
			updatedAt: now,
			startDate: formatDateStr(startMs),
			endDate: formatDateStr(endMs),
			sessions,
			totals: aggregateTotals,
			aggregates,
			cacheStatus
		}, void 0);
	},
	"sessions.usage.timeseries": async ({ respond, params, context }) => {
		const key = normalizeOptionalString(params?.key) ?? null;
		if (!key) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "key is required for timeseries"));
			return;
		}
		const resolved = resolveSessionUsageFileOrRespond(key, respond, context.getRuntimeConfig());
		if (!resolved) return;
		const { config, entry, agentId, sessionId, sessionFile } = resolved;
		const timeseries = await loadSessionUsageTimeSeries({
			sessionId,
			sessionEntry: entry,
			sessionFile,
			config,
			agentId,
			maxPoints: 200
		});
		if (!timeseries) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `No transcript found for session: ${key}`));
			return;
		}
		respond(true, timeseries, void 0);
	},
	"sessions.usage.logs": async ({ respond, params, context }) => {
		const key = normalizeOptionalString(params?.key) ?? null;
		if (!key) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "key is required for logs"));
			return;
		}
		const limit = typeof params?.limit === "number" && Number.isFinite(params.limit) ? Math.min(params.limit, 1e3) : 200;
		const resolved = resolveSessionUsageFileOrRespond(key, respond, context.getRuntimeConfig());
		if (!resolved) return;
		const { config, entry, agentId, sessionId, sessionFile } = resolved;
		respond(true, { logs: await loadSessionLogs({
			sessionId,
			sessionEntry: entry,
			sessionFile,
			config,
			agentId,
			limit
		}) ?? [] }, void 0);
	}
};
//#endregion
export { testApi as __test, testApi, usageHandlers };
