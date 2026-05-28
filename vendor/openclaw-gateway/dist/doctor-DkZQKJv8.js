import { i as asOptionalRecord } from "./record-coerce-Btbek4uV.js";
import "./agent-scope-CudANNo3.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { G as resolveMemoryDreamingConfig, H as isSameMemoryDreamingDay, J as resolveMemoryDreamingWorkspaces, K as resolveMemoryDreamingPluginConfig, W as resolveMemoryDeepDreamingConfig, X as resolveMemoryRemDreamingConfig, Y as resolveMemoryLightDreamingConfig } from "./dreaming-DT202ka-.js";
import { r as getActiveMemorySearchManager } from "./memory-runtime-CI_B_YP5.js";
import { c as repairDreamingArtifacts, i as previewRemHarness, l as writeBackfillDiaryEntries, n as dedupeDreamDiaryEntries, o as removeBackfillDiaryEntries, r as previewGroundedRemMarkdown, s as removeGroundedShortTermCandidates } from "./memory-core-bundled-runtime-BIfjwldf.js";
import { t as formatError } from "./server-utils-nQL603BR.js";
import { t as normalizeTrimmedString } from "./record-shared-LGLlGFwr.js";
import path from "node:path";
import fs from "node:fs/promises";
//#region src/gateway/server-methods/doctor.ts
const SHORT_TERM_STORE_RELATIVE_PATH = path.join("memory", ".dreams", "short-term-recall.json");
const SHORT_TERM_PHASE_SIGNAL_RELATIVE_PATH = path.join("memory", ".dreams", "phase-signals.json");
const MANAGED_DEEP_SLEEP_CRON_NAME = "Memory Dreaming Promotion";
const MANAGED_DEEP_SLEEP_CRON_TAG = "[managed-by=memory-core.short-term-promotion]";
const DEEP_SLEEP_SYSTEM_EVENT_TEXT = "__openclaw_memory_core_short_term_promotion_dream__";
const DREAM_DIARY_FILE_NAMES = ["DREAMS.md", "dreams.md"];
const REM_HARNESS_DEFAULT_CANDIDATE_LIMIT = 25;
const REM_HARNESS_MAX_CANDIDATE_LIMIT = 100;
const REM_HARNESS_MAX_GROUNDED_FILES = 10;
const REM_HARNESS_MAX_REM_PREVIEW_LIMIT = 50;
function extractIsoDayFromPath(filePath) {
	return filePath.replaceAll("\\", "/").match(/(\d{4}-\d{2}-\d{2})(?:-[^/]+)?\.md$/i)?.[1] ?? null;
}
function groundedMarkdownToDiaryLines(markdown) {
	return markdown.split("\n").map((line) => line.replace(/^##\s+/, "").trimEnd()).filter((line, index, lines) => line.length > 0 || index > 0 && lines[index - 1]?.length > 0);
}
async function listWorkspaceDailyFiles(memoryDir) {
	let entries = [];
	try {
		entries = await fs.readdir(memoryDir);
	} catch (err) {
		if (err?.code === "ENOENT") return [];
		throw err;
	}
	return entries.filter((name) => /^\d{4}-\d{2}-\d{2}(?:-[^/]+)?\.md$/i.test(name)).map((name) => path.join(memoryDir, name)).toSorted((left, right) => left.localeCompare(right));
}
function resolveDreamingConfig(cfg) {
	const resolved = resolveMemoryDreamingConfig({
		pluginConfig: resolveMemoryDreamingPluginConfig(cfg),
		cfg
	});
	const light = resolveMemoryLightDreamingConfig({
		pluginConfig: resolveMemoryDreamingPluginConfig(cfg),
		cfg
	});
	const deep = resolveMemoryDeepDreamingConfig({
		pluginConfig: resolveMemoryDreamingPluginConfig(cfg),
		cfg
	});
	const rem = resolveMemoryRemDreamingConfig({
		pluginConfig: resolveMemoryDreamingPluginConfig(cfg),
		cfg
	});
	return {
		enabled: resolved.enabled,
		...resolved.timezone ? { timezone: resolved.timezone } : {},
		verboseLogging: resolved.verboseLogging,
		storageMode: resolved.storage.mode,
		separateReports: resolved.storage.separateReports,
		shortTermEntries: [],
		signalEntries: [],
		promotedEntries: [],
		phases: {
			light: {
				enabled: light.enabled,
				cron: light.cron,
				lookbackDays: light.lookbackDays,
				limit: light.limit,
				managedCronPresent: false
			},
			deep: {
				enabled: deep.enabled,
				cron: deep.cron,
				limit: deep.limit,
				minScore: deep.minScore,
				minRecallCount: deep.minRecallCount,
				minUniqueQueries: deep.minUniqueQueries,
				recencyHalfLifeDays: deep.recencyHalfLifeDays,
				managedCronPresent: false,
				...typeof deep.maxAgeDays === "number" ? { maxAgeDays: deep.maxAgeDays } : {}
			},
			rem: {
				enabled: rem.enabled,
				cron: rem.cron,
				lookbackDays: rem.lookbackDays,
				limit: rem.limit,
				minPatternStrength: rem.minPatternStrength,
				managedCronPresent: false
			}
		}
	};
}
function normalizeMemoryPath(rawPath) {
	return rawPath.replaceAll("\\", "/").replace(/^\.\//, "");
}
function normalizeMemoryPathForWorkspace(workspaceDir, rawPath) {
	const normalized = normalizeMemoryPath(rawPath);
	const workspaceNormalized = normalizeMemoryPath(workspaceDir);
	if (path.isAbsolute(rawPath) && normalized.startsWith(`${workspaceNormalized}/`)) return normalized.slice(workspaceNormalized.length + 1);
	return normalized;
}
function isShortTermMemoryPath(filePath) {
	const normalized = normalizeMemoryPath(filePath);
	if (/(?:^|\/)memory\/(\d{4})-(\d{2})-(\d{2})\.md$/.test(normalized)) return true;
	if (/(?:^|\/)memory\/\.dreams\/session-corpus\/(\d{4})-(\d{2})-(\d{2})\.(?:md|txt)$/.test(normalized)) return true;
	return /^(\d{4})-(\d{2})-(\d{2})\.md$/.test(normalized);
}
const DREAMING_ENTRY_LIST_LIMIT = 8;
function toNonNegativeInt(value) {
	const num = Number(value);
	if (!Number.isFinite(num)) return 0;
	return Math.max(0, Math.floor(num));
}
function parseEntryRangeFromKey(key, fallbackStartLine, fallbackEndLine) {
	const startLine = toNonNegativeInt(fallbackStartLine);
	const endLine = toNonNegativeInt(fallbackEndLine);
	if (startLine > 0 && endLine > 0) return {
		startLine,
		endLine
	};
	const match = key.match(/:(\d+):(\d+)$/);
	if (match) return {
		startLine: Math.max(1, toNonNegativeInt(match[1])),
		endLine: Math.max(1, toNonNegativeInt(match[2]))
	};
	return {
		startLine: 1,
		endLine: 1
	};
}
function compareDreamingEntryByRecency(a, b) {
	const aMs = a.lastRecalledAt ? Date.parse(a.lastRecalledAt) : Number.NEGATIVE_INFINITY;
	const bMs = b.lastRecalledAt ? Date.parse(b.lastRecalledAt) : Number.NEGATIVE_INFINITY;
	if (Number.isFinite(aMs) || Number.isFinite(bMs)) {
		if (bMs !== aMs) return bMs - aMs;
	}
	if (b.totalSignalCount !== a.totalSignalCount) return b.totalSignalCount - a.totalSignalCount;
	return a.path.localeCompare(b.path);
}
function compareDreamingEntryBySignals(a, b) {
	if (b.totalSignalCount !== a.totalSignalCount) return b.totalSignalCount - a.totalSignalCount;
	if (b.phaseHitCount !== a.phaseHitCount) return b.phaseHitCount - a.phaseHitCount;
	return compareDreamingEntryByRecency(a, b);
}
function compareDreamingEntryByPromotion(a, b) {
	const aMs = a.promotedAt ? Date.parse(a.promotedAt) : Number.NEGATIVE_INFINITY;
	const bMs = b.promotedAt ? Date.parse(b.promotedAt) : Number.NEGATIVE_INFINITY;
	if (Number.isFinite(aMs) || Number.isFinite(bMs)) {
		if (bMs !== aMs) return bMs - aMs;
	}
	return compareDreamingEntryBySignals(a, b);
}
function trimDreamingEntries(entries, compare) {
	const selected = [];
	for (const entry of entries) {
		let insertAt = selected.length;
		for (let index = 0; index < selected.length; index += 1) if (compare(entry, selected[index]) < 0) {
			insertAt = index;
			break;
		}
		if (insertAt < DREAMING_ENTRY_LIST_LIMIT) {
			selected.splice(insertAt, 0, entry);
			if (selected.length > DREAMING_ENTRY_LIST_LIMIT) selected.pop();
		} else if (selected.length < DREAMING_ENTRY_LIST_LIMIT) selected.push(entry);
	}
	return selected;
}
async function loadDreamingStoreStats(workspaceDir, nowMs, timezone) {
	const storePath = path.join(workspaceDir, SHORT_TERM_STORE_RELATIVE_PATH);
	const phaseSignalPath = path.join(workspaceDir, SHORT_TERM_PHASE_SIGNAL_RELATIVE_PATH);
	try {
		const raw = await fs.readFile(storePath, "utf-8");
		const entries = asOptionalRecord(asOptionalRecord(JSON.parse(raw))?.entries) ?? {};
		let shortTermCount = 0;
		let recallSignalCount = 0;
		let dailySignalCount = 0;
		let groundedSignalCount = 0;
		let totalSignalCount = 0;
		let phaseSignalCount = 0;
		let lightPhaseHitCount = 0;
		let remPhaseHitCount = 0;
		let promotedTotal = 0;
		let promotedToday = 0;
		let latestPromotedAtMs = Number.NEGATIVE_INFINITY;
		let latestPromotedAt;
		const activeKeys = /* @__PURE__ */ new Set();
		const activeEntries = /* @__PURE__ */ new Map();
		const shortTermEntries = [];
		const promotedEntries = [];
		for (const [entryKey, value] of Object.entries(entries)) {
			const entry = asOptionalRecord(value);
			if (!entry) continue;
			const source = normalizeTrimmedString(entry.source);
			const entryPath = normalizeTrimmedString(entry.path);
			if (source !== "memory" || !entryPath || !isShortTermMemoryPath(entryPath)) continue;
			const range = parseEntryRangeFromKey(entryKey, entry.startLine, entry.endLine);
			const recallCount = toNonNegativeInt(entry.recallCount);
			const dailyCount = toNonNegativeInt(entry.dailyCount);
			const groundedCount = toNonNegativeInt(entry.groundedCount);
			const totalEntrySignalCount = recallCount + dailyCount + groundedCount;
			const normalizedEntryPath = normalizeMemoryPathForWorkspace(workspaceDir, entryPath);
			const snippet = normalizeTrimmedString(entry.snippet) ?? normalizeTrimmedString(entry.summary) ?? normalizedEntryPath;
			const lastRecalledAt = normalizeTrimmedString(entry.lastRecalledAt);
			const detail = {
				key: entryKey,
				path: normalizedEntryPath,
				startLine: range.startLine,
				endLine: Math.max(range.startLine, range.endLine),
				snippet,
				recallCount,
				dailyCount,
				groundedCount,
				totalSignalCount: totalEntrySignalCount,
				lightHits: 0,
				remHits: 0,
				phaseHitCount: 0,
				...lastRecalledAt ? { lastRecalledAt } : {}
			};
			const promotedAt = normalizeTrimmedString(entry.promotedAt);
			if (!promotedAt) {
				shortTermCount += 1;
				activeKeys.add(entryKey);
				recallSignalCount += recallCount;
				dailySignalCount += dailyCount;
				groundedSignalCount += groundedCount;
				totalSignalCount += totalEntrySignalCount;
				shortTermEntries.push(detail);
				activeEntries.set(entryKey, detail);
				continue;
			}
			promotedTotal += 1;
			promotedEntries.push({
				...detail,
				promotedAt
			});
			const promotedAtMs = Date.parse(promotedAt);
			if (Number.isFinite(promotedAtMs) && isSameMemoryDreamingDay(promotedAtMs, nowMs, timezone)) promotedToday += 1;
			if (Number.isFinite(promotedAtMs) && promotedAtMs > latestPromotedAtMs) {
				latestPromotedAtMs = promotedAtMs;
				latestPromotedAt = promotedAt;
			}
		}
		let phaseSignalError;
		try {
			const phaseRaw = await fs.readFile(phaseSignalPath, "utf-8");
			const phaseEntries = asOptionalRecord(asOptionalRecord(JSON.parse(phaseRaw))?.entries) ?? {};
			for (const [key, value] of Object.entries(phaseEntries)) {
				if (!activeKeys.has(key)) continue;
				const phaseEntry = asOptionalRecord(value);
				const lightHits = toNonNegativeInt(phaseEntry?.lightHits);
				const remHits = toNonNegativeInt(phaseEntry?.remHits);
				lightPhaseHitCount += lightHits;
				remPhaseHitCount += remHits;
				phaseSignalCount += lightHits + remHits;
				const detail = activeEntries.get(key);
				if (detail) {
					detail.lightHits = lightHits;
					detail.remHits = remHits;
					detail.phaseHitCount = lightHits + remHits;
				}
			}
		} catch (err) {
			if (err?.code !== "ENOENT") phaseSignalError = formatError(err);
		}
		return {
			shortTermCount,
			recallSignalCount,
			dailySignalCount,
			groundedSignalCount,
			totalSignalCount,
			phaseSignalCount,
			lightPhaseHitCount,
			remPhaseHitCount,
			promotedTotal,
			promotedToday,
			storePath,
			phaseSignalPath,
			shortTermEntries: trimDreamingEntries(shortTermEntries, compareDreamingEntryByRecency),
			signalEntries: trimDreamingEntries(shortTermEntries, compareDreamingEntryBySignals),
			promotedEntries: trimDreamingEntries(promotedEntries, compareDreamingEntryByPromotion),
			...latestPromotedAt ? { lastPromotedAt: latestPromotedAt } : {},
			...phaseSignalError ? { phaseSignalError } : {}
		};
	} catch (err) {
		if (err?.code === "ENOENT") return {
			shortTermCount: 0,
			recallSignalCount: 0,
			dailySignalCount: 0,
			groundedSignalCount: 0,
			totalSignalCount: 0,
			phaseSignalCount: 0,
			lightPhaseHitCount: 0,
			remPhaseHitCount: 0,
			promotedTotal: 0,
			promotedToday: 0,
			storePath,
			phaseSignalPath,
			shortTermEntries: [],
			signalEntries: [],
			promotedEntries: []
		};
		return {
			shortTermCount: 0,
			recallSignalCount: 0,
			dailySignalCount: 0,
			groundedSignalCount: 0,
			totalSignalCount: 0,
			phaseSignalCount: 0,
			lightPhaseHitCount: 0,
			remPhaseHitCount: 0,
			promotedTotal: 0,
			promotedToday: 0,
			storePath,
			phaseSignalPath,
			shortTermEntries: [],
			signalEntries: [],
			promotedEntries: [],
			storeError: formatError(err)
		};
	}
}
function mergeDreamingStoreStats(stats) {
	let shortTermCount = 0;
	let recallSignalCount = 0;
	let dailySignalCount = 0;
	let groundedSignalCount = 0;
	let totalSignalCount = 0;
	let phaseSignalCount = 0;
	let lightPhaseHitCount = 0;
	let remPhaseHitCount = 0;
	let promotedTotal = 0;
	let promotedToday = 0;
	let latestPromotedAtMs = Number.NEGATIVE_INFINITY;
	let lastPromotedAt;
	const storePaths = /* @__PURE__ */ new Set();
	const phaseSignalPaths = /* @__PURE__ */ new Set();
	const storeErrors = [];
	const phaseSignalErrors = [];
	const shortTermEntries = [];
	const signalEntries = [];
	const promotedEntries = [];
	for (const stat of stats) {
		shortTermCount += stat.shortTermCount;
		recallSignalCount += stat.recallSignalCount;
		dailySignalCount += stat.dailySignalCount;
		groundedSignalCount += stat.groundedSignalCount;
		totalSignalCount += stat.totalSignalCount;
		phaseSignalCount += stat.phaseSignalCount;
		lightPhaseHitCount += stat.lightPhaseHitCount;
		remPhaseHitCount += stat.remPhaseHitCount;
		promotedTotal += stat.promotedTotal;
		promotedToday += stat.promotedToday;
		if (stat.storePath) storePaths.add(stat.storePath);
		if (stat.phaseSignalPath) phaseSignalPaths.add(stat.phaseSignalPath);
		if (stat.storeError) storeErrors.push(stat.storeError);
		if (stat.phaseSignalError) phaseSignalErrors.push(stat.phaseSignalError);
		shortTermEntries.push(...stat.shortTermEntries);
		signalEntries.push(...stat.signalEntries);
		promotedEntries.push(...stat.promotedEntries);
		const promotedAtMs = stat.lastPromotedAt ? Date.parse(stat.lastPromotedAt) : NaN;
		if (Number.isFinite(promotedAtMs) && promotedAtMs > latestPromotedAtMs) {
			latestPromotedAtMs = promotedAtMs;
			lastPromotedAt = stat.lastPromotedAt;
		}
	}
	return {
		shortTermCount,
		recallSignalCount,
		dailySignalCount,
		groundedSignalCount,
		totalSignalCount,
		phaseSignalCount,
		lightPhaseHitCount,
		remPhaseHitCount,
		promotedTotal,
		promotedToday,
		shortTermEntries: trimDreamingEntries(shortTermEntries, compareDreamingEntryByRecency),
		signalEntries: trimDreamingEntries(signalEntries, compareDreamingEntryBySignals),
		promotedEntries: trimDreamingEntries(promotedEntries, compareDreamingEntryByPromotion),
		...storePaths.size === 1 ? { storePath: [...storePaths][0] } : {},
		...phaseSignalPaths.size === 1 ? { phaseSignalPath: [...phaseSignalPaths][0] } : {},
		...lastPromotedAt ? { lastPromotedAt } : {},
		...storeErrors.length === 1 ? { storeError: storeErrors[0] } : storeErrors.length > 1 ? { storeError: `${storeErrors.length} dreaming stores had read errors.` } : {},
		...phaseSignalErrors.length === 1 ? { phaseSignalError: phaseSignalErrors[0] } : phaseSignalErrors.length > 1 ? { phaseSignalError: `${phaseSignalErrors.length} phase signal stores had read errors.` } : {}
	};
}
function isManagedDreamingJob(job, params) {
	if (normalizeTrimmedString(job.description)?.includes(params.tag)) return true;
	const name = normalizeTrimmedString(job.name);
	const payloadKind = normalizeTrimmedString(job.payload?.kind)?.toLowerCase();
	const payloadText = normalizeTrimmedString(job.payload?.text);
	return name === params.name && payloadKind === "systemevent" && payloadText === params.payloadText;
}
async function resolveManagedDreamingCronStatus(params) {
	if (!params.context.cron || typeof params.context.cron.list !== "function") return { managedCronPresent: false };
	try {
		const managed = (await params.context.cron.list({ includeDisabled: true })).filter((job) => typeof job === "object" && job !== null).filter((job) => isManagedDreamingJob(job, params.match));
		let nextRunAtMs;
		for (const job of managed) {
			if (job.enabled !== true) continue;
			const candidate = job.state?.nextRunAtMs;
			if (typeof candidate !== "number" || !Number.isFinite(candidate)) continue;
			if (nextRunAtMs === void 0 || candidate < nextRunAtMs) nextRunAtMs = candidate;
		}
		return {
			managedCronPresent: managed.length > 0,
			...nextRunAtMs !== void 0 ? { nextRunAtMs } : {}
		};
	} catch {
		return { managedCronPresent: false };
	}
}
async function resolveAllManagedDreamingCronStatuses(context) {
	const sweepStatus = await resolveManagedDreamingCronStatus({
		context,
		match: {
			name: MANAGED_DEEP_SLEEP_CRON_NAME,
			tag: MANAGED_DEEP_SLEEP_CRON_TAG,
			payloadText: DEEP_SLEEP_SYSTEM_EVENT_TEXT
		}
	});
	return {
		light: sweepStatus,
		deep: sweepStatus,
		rem: sweepStatus
	};
}
async function readDreamDiary(workspaceDir) {
	for (const name of DREAM_DIARY_FILE_NAMES) {
		const filePath = path.join(workspaceDir, name);
		let stat;
		try {
			stat = await fs.lstat(filePath);
		} catch (err) {
			if (err?.code === "ENOENT") continue;
			return {
				found: false,
				path: name
			};
		}
		if (stat.isSymbolicLink() || !stat.isFile()) continue;
		try {
			return {
				found: true,
				path: name,
				content: await fs.readFile(filePath, "utf-8"),
				updatedAtMs: Math.floor(stat.mtimeMs)
			};
		} catch {
			return {
				found: false,
				path: name
			};
		}
	}
	return {
		found: false,
		path: DREAM_DIARY_FILE_NAMES[0]
	};
}
function shouldProbeMemoryEmbeddings(params) {
	if (!params || typeof params !== "object") return false;
	const record = params;
	return record.probe === true || record.deep === true;
}
const SKIPPED_MEMORY_EMBEDDING_PROBE = {
	ok: false,
	checked: false,
	error: "memory embedding readiness not checked; run `openclaw memory status --deep` to probe"
};
const doctorHandlers = {
	"doctor.memory.status": async ({ respond, context, params }) => {
		const cfg = context.getRuntimeConfig();
		const agentId = resolveDefaultAgentId(cfg);
		const { manager, error } = await getActiveMemorySearchManager({
			cfg,
			agentId,
			purpose: "status"
		});
		if (!manager) {
			respond(true, {
				agentId,
				embedding: {
					ok: false,
					error: error ?? "memory search unavailable"
				}
			}, void 0);
			return;
		}
		try {
			const status = manager.status();
			let embedding = shouldProbeMemoryEmbeddings(params) ? await manager.probeEmbeddingAvailability() : manager.getCachedEmbeddingAvailability?.() ?? SKIPPED_MEMORY_EMBEDDING_PROBE;
			if (!embedding.ok && !embedding.error) embedding = {
				ok: false,
				error: "memory embeddings unavailable"
			};
			const nowMs = Date.now();
			const dreamingConfig = resolveDreamingConfig(cfg);
			const workspaceDir = normalizeTrimmedString(status.workspaceDir);
			const configuredWorkspaces = resolveMemoryDreamingWorkspaces(cfg, {
				primaryWorkspaceDir: workspaceDir,
				primaryAgentId: resolveDefaultAgentId(cfg)
			}).map((entry) => entry.workspaceDir);
			const allWorkspaces = configuredWorkspaces.length > 0 ? configuredWorkspaces : workspaceDir ? [workspaceDir] : [];
			const storeStats = allWorkspaces.length > 0 ? mergeDreamingStoreStats(await Promise.all(allWorkspaces.map((entry) => loadDreamingStoreStats(entry, nowMs, dreamingConfig.timezone)))) : {
				shortTermCount: 0,
				recallSignalCount: 0,
				dailySignalCount: 0,
				groundedSignalCount: 0,
				totalSignalCount: 0,
				phaseSignalCount: 0,
				lightPhaseHitCount: 0,
				remPhaseHitCount: 0,
				promotedTotal: 0,
				promotedToday: 0
			};
			const cronStatuses = await resolveAllManagedDreamingCronStatuses(context);
			respond(true, {
				agentId,
				provider: status.provider,
				embedding,
				dreaming: {
					...dreamingConfig,
					...storeStats,
					phases: {
						light: {
							...dreamingConfig.phases.light,
							...cronStatuses.light
						},
						deep: {
							...dreamingConfig.phases.deep,
							...cronStatuses.deep
						},
						rem: {
							...dreamingConfig.phases.rem,
							...cronStatuses.rem
						}
					}
				}
			}, void 0);
		} catch (err) {
			respond(true, {
				agentId,
				embedding: {
					ok: false,
					error: `gateway memory probe failed: ${formatError(err)}`
				}
			}, void 0);
		} finally {
			await manager.close?.().catch(() => {});
		}
	},
	"doctor.memory.dreamDiary": async ({ respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const agentId = resolveDefaultAgentId(cfg);
		respond(true, {
			agentId,
			...await readDreamDiary(resolveAgentWorkspaceDir(cfg, agentId))
		}, void 0);
	},
	"doctor.memory.backfillDreamDiary": async ({ respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const agentId = resolveDefaultAgentId(cfg);
		const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
		const sourceFiles = await listWorkspaceDailyFiles(path.join(workspaceDir, "memory"));
		if (sourceFiles.length === 0) {
			const dreamDiary = await readDreamDiary(workspaceDir);
			respond(true, {
				agentId,
				path: dreamDiary.path,
				action: "backfill",
				found: dreamDiary.found,
				scannedFiles: 0,
				written: 0,
				replaced: 0
			}, void 0);
			return;
		}
		const grounded = await previewGroundedRemMarkdown({
			workspaceDir,
			inputPaths: sourceFiles
		});
		const remConfig = resolveMemoryRemDreamingConfig({
			pluginConfig: resolveMemoryDreamingPluginConfig(cfg),
			cfg
		});
		const written = await writeBackfillDiaryEntries({
			workspaceDir,
			entries: grounded.files.map((file) => {
				const isoDay = extractIsoDayFromPath(file.path);
				if (!isoDay) return null;
				return {
					isoDay,
					sourcePath: file.path,
					bodyLines: groundedMarkdownToDiaryLines(file.renderedMarkdown)
				};
			}).filter((entry) => entry !== null),
			timezone: remConfig.timezone
		});
		const dreamDiary = await readDreamDiary(workspaceDir);
		respond(true, {
			agentId,
			path: dreamDiary.path,
			action: "backfill",
			found: dreamDiary.found,
			scannedFiles: grounded.scannedFiles,
			written: written.written,
			replaced: written.replaced
		}, void 0);
	},
	"doctor.memory.resetDreamDiary": async ({ respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const agentId = resolveDefaultAgentId(cfg);
		const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
		const removed = await removeBackfillDiaryEntries({ workspaceDir });
		const dreamDiary = await readDreamDiary(workspaceDir);
		respond(true, {
			agentId,
			path: dreamDiary.path,
			action: "reset",
			found: dreamDiary.found,
			removedEntries: removed.removed
		}, void 0);
	},
	"doctor.memory.resetGroundedShortTerm": async ({ respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const agentId = resolveDefaultAgentId(cfg);
		respond(true, {
			agentId,
			action: "resetGroundedShortTerm",
			removedShortTermEntries: (await removeGroundedShortTermCandidates({ workspaceDir: resolveAgentWorkspaceDir(cfg, agentId) })).removed
		}, void 0);
	},
	"doctor.memory.repairDreamingArtifacts": async ({ respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const agentId = resolveDefaultAgentId(cfg);
		const repair = await repairDreamingArtifacts({ workspaceDir: resolveAgentWorkspaceDir(cfg, agentId) });
		respond(true, {
			agentId,
			action: "repairDreamingArtifacts",
			changed: repair.changed,
			archiveDir: repair.archiveDir,
			archivedDreamsDiary: repair.archivedDreamsDiary,
			archivedSessionCorpus: repair.archivedSessionCorpus,
			archivedSessionIngestion: repair.archivedSessionIngestion,
			warnings: repair.warnings
		}, void 0);
	},
	"doctor.memory.dedupeDreamDiary": async ({ respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const agentId = resolveDefaultAgentId(cfg);
		const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
		const dedupe = await dedupeDreamDiaryEntries({ workspaceDir });
		const dreamDiary = await readDreamDiary(workspaceDir);
		respond(true, {
			agentId,
			action: "dedupeDreamDiary",
			path: dreamDiary.path,
			found: dreamDiary.found,
			removedEntries: dedupe.removed,
			dedupedEntries: dedupe.removed,
			keptEntries: dedupe.kept
		}, void 0);
	},
	"doctor.memory.remHarness": async ({ params, respond, context }) => {
		const cfg = context.getRuntimeConfig();
		const agentId = resolveDefaultAgentId(cfg);
		const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
		const req = asOptionalRecord(params);
		const grounded = Boolean(req?.grounded);
		const includePromoted = Boolean(req?.includePromoted);
		const requestedLimit = typeof req?.limit === "number" && Number.isFinite(req.limit) ? Math.floor(req.limit) : REM_HARNESS_DEFAULT_CANDIDATE_LIMIT;
		const candidateLimit = Math.max(1, Math.min(REM_HARNESS_MAX_CANDIDATE_LIMIT, requestedLimit));
		try {
			const preview = await previewRemHarness({
				workspaceDir,
				cfg,
				pluginConfig: resolveMemoryDreamingPluginConfig(cfg),
				grounded,
				includePromoted,
				candidateLimit,
				groundedFileLimit: REM_HARNESS_MAX_GROUNDED_FILES,
				remPreviewLimit: REM_HARNESS_MAX_REM_PREVIEW_LIMIT
			});
			const groundedPayload = preview.grounded ? {
				scannedFiles: preview.grounded.scannedFiles,
				files: preview.grounded.files.map((file) => ({
					path: file.path,
					renderedMarkdown: file.renderedMarkdown
				}))
			} : grounded ? {
				scannedFiles: 0,
				files: []
			} : null;
			respond(true, {
				ok: true,
				agentId,
				workspaceDir,
				remConfig: {
					enabled: preview.remConfig.enabled,
					lookbackDays: preview.remConfig.lookbackDays,
					limit: preview.remConfig.limit,
					minPatternStrength: preview.remConfig.minPatternStrength
				},
				deepConfig: {
					minScore: preview.deepConfig.minScore,
					minRecallCount: preview.deepConfig.minRecallCount,
					minUniqueQueries: preview.deepConfig.minUniqueQueries,
					recencyHalfLifeDays: preview.deepConfig.recencyHalfLifeDays,
					maxAgeDays: typeof preview.deepConfig.maxAgeDays === "number" ? preview.deepConfig.maxAgeDays : null
				},
				rem: {
					skipped: preview.remSkipped,
					sourceEntryCount: preview.rem.sourceEntryCount,
					reflections: [...preview.rem.reflections],
					candidateTruths: preview.rem.candidateTruths.map((truth) => ({
						snippet: truth.snippet,
						confidence: truth.confidence
					})),
					bodyLines: [...preview.rem.bodyLines]
				},
				grounded: groundedPayload,
				deep: {
					candidateLimit,
					truncated: preview.deep.truncated,
					candidates: preview.deep.candidates.map((candidate) => {
						const promoted = typeof candidate.promotedAt === "string" && candidate.promotedAt.length > 0;
						const payload = {
							key: candidate.key,
							path: candidate.path,
							startLine: candidate.startLine,
							endLine: candidate.endLine,
							snippet: candidate.snippet,
							recallCount: candidate.recallCount,
							uniqueQueries: candidate.uniqueQueries,
							avgScore: candidate.avgScore,
							maxScore: candidate.maxScore,
							ageDays: candidate.ageDays,
							firstRecalledAt: candidate.firstRecalledAt,
							lastRecalledAt: candidate.lastRecalledAt,
							promoted
						};
						if (promoted) payload.promotedAt = candidate.promotedAt;
						return payload;
					})
				}
			}, void 0);
		} catch (err) {
			respond(true, {
				ok: false,
				agentId,
				workspaceDir,
				error: `gateway rem-harness probe failed: ${formatError(err)}`
			}, void 0);
		}
	}
};
//#endregion
export { doctorHandlers };
