import { t as isTruthyEnvValue } from "./env-DmmbBEHd.js";
import { p as resolveIsNixMode } from "./paths-CQv1_CDw.js";
import { o as isRecord } from "./record-coerce-Btbek4uV.js";
import { n as appendRegularFileSync } from "./regular-file-BFvcwX3y.js";
import { p as resolveUserPath } from "./utils-B5r0V84N.js";
import { o as resolveCompatibilityHostVersion } from "./version-BjFOZC7j.js";
import { t as isDiagnosticFlagEnabled } from "./diagnostic-flags-D9qBi7Px.js";
import "./regular-file-CBe_wA_B.js";
import { n as registerPluginMetadataProcessMemoLifecycleClear } from "./plugin-metadata-lifecycle-BqWfg4Sp.js";
import { g as hashJson, m as resolveInstalledPluginIndexPolicyHash } from "./installed-plugin-index-store-Db9FQc7C.js";
import { a as resolveDefaultPluginNpmDir } from "./install-paths-HdtNIDW3.js";
import { o as resolveInstalledPluginIndexStorePath } from "./installed-plugin-index-record-reader-CQGWoRBr.js";
import { t as loadPluginManifestRegistry } from "./manifest-registry-DYz4Sf21.js";
import { n as resolveInstalledManifestRegistryIndexFingerprint, t as loadPluginManifestRegistryForInstalledIndex } from "./manifest-registry-installed-DKunDhdX.js";
import { g as createPluginRegistryIdNormalizer, m as loadPluginRegistrySnapshotWithMetadata, w as resolvePluginControlPlaneFingerprint, y as getCurrentPluginMetadataSnapshot } from "./plugin-registry-BALJ9TgI.js";
import fs, { mkdirSync } from "node:fs";
import path, { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { performance as performance$1 } from "node:perf_hooks";
//#region src/infra/diagnostics-timeline.ts
const OPENCLAW_DIAGNOSTICS_TIMELINE_SCHEMA_VERSION = "openclaw.diagnostics.v1";
let warnedAboutTimelineWrite = false;
const createdTimelineDirs = /* @__PURE__ */ new Set();
const activeDiagnosticsTimelineSpan = new AsyncLocalStorage();
function resolveDiagnosticsTimelineOptions(options = {}) {
	return {
		env: options.env ?? process.env,
		...options.config ? { config: options.config } : {}
	};
}
function isDiagnosticsTimelineEnabled(options = {}) {
	const { config, env } = resolveDiagnosticsTimelineOptions(options);
	return (isDiagnosticFlagEnabled("timeline", config, env) || isDiagnosticFlagEnabled("diagnostics.timeline", config, env) || isTruthyEnvValue(env.OPENCLAW_DIAGNOSTICS)) && typeof env.OPENCLAW_DIAGNOSTICS_TIMELINE_PATH === "string" && env.OPENCLAW_DIAGNOSTICS_TIMELINE_PATH.trim().length > 0;
}
function normalizeNumber(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return;
	return Math.max(0, Math.round(value * 1e3) / 1e3);
}
function normalizeAttributes(attributes) {
	if (!attributes) return;
	const normalized = {};
	for (const [key, value] of Object.entries(attributes)) {
		if (typeof value === "number") {
			if (Number.isFinite(value)) normalized[key] = normalizeNumber(value) ?? 0;
			continue;
		}
		if (typeof value === "string" || typeof value === "boolean" || value === null) normalized[key] = value;
	}
	return Object.keys(normalized).length > 0 ? normalized : void 0;
}
function serializeTimelineEvent(event, env) {
	const normalized = {
		schemaVersion: OPENCLAW_DIAGNOSTICS_TIMELINE_SCHEMA_VERSION,
		type: event.type,
		timestamp: event.timestamp ?? (/* @__PURE__ */ new Date()).toISOString(),
		name: event.name,
		...env.OPENCLAW_DIAGNOSTICS_RUN_ID ? { runId: env.OPENCLAW_DIAGNOSTICS_RUN_ID } : {},
		...env.OPENCLAW_DIAGNOSTICS_ENV ? { envName: env.OPENCLAW_DIAGNOSTICS_ENV } : {},
		pid: process.pid,
		...event.runId ? { runId: event.runId } : {},
		...event.envName ? { envName: event.envName } : {},
		...typeof event.pid === "number" ? { pid: event.pid } : {},
		...event.phase ? { phase: event.phase } : {},
		...event.spanId ? { spanId: event.spanId } : {},
		...event.parentSpanId ? { parentSpanId: event.parentSpanId } : {},
		...typeof event.durationMs === "number" ? { durationMs: normalizeNumber(event.durationMs) } : {},
		...event.errorName ? { errorName: event.errorName } : {},
		...event.errorMessage ? { errorMessage: event.errorMessage } : {},
		...typeof event.p50Ms === "number" ? { p50Ms: normalizeNumber(event.p50Ms) } : {},
		...typeof event.p95Ms === "number" ? { p95Ms: normalizeNumber(event.p95Ms) } : {},
		...typeof event.p99Ms === "number" ? { p99Ms: normalizeNumber(event.p99Ms) } : {},
		...typeof event.maxMs === "number" ? { maxMs: normalizeNumber(event.maxMs) } : {},
		...event.activeSpanName ? { activeSpanName: event.activeSpanName } : {},
		...event.provider ? { provider: event.provider } : {},
		...event.operation ? { operation: event.operation } : {},
		...typeof event.ok === "boolean" ? { ok: event.ok } : {},
		...event.command ? { command: event.command } : {},
		...event.exitCode !== void 0 ? { exitCode: event.exitCode } : {},
		...event.signal !== void 0 ? { signal: event.signal } : {},
		...normalizeAttributes(event.attributes) ? { attributes: normalizeAttributes(event.attributes) } : {}
	};
	return `${JSON.stringify(normalized)}\n`;
}
function emitDiagnosticsTimelineEvent(event, options = {}) {
	const { env } = resolveDiagnosticsTimelineOptions(options);
	if (!isDiagnosticsTimelineEnabled(options)) return;
	const path = env.OPENCLAW_DIAGNOSTICS_TIMELINE_PATH?.trim();
	if (!path) return;
	const line = serializeTimelineEvent(event, env);
	try {
		const dir = dirname(path);
		if (!createdTimelineDirs.has(dir)) {
			mkdirSync(dir, { recursive: true });
			createdTimelineDirs.add(dir);
		}
		appendRegularFileSync({
			filePath: path,
			content: line
		});
	} catch (error) {
		if (!warnedAboutTimelineWrite) {
			warnedAboutTimelineWrite = true;
			process.stderr.write(`[diagnostics] failed to write timeline event: ${String(error)}\n`);
		}
	}
}
function getActiveDiagnosticsTimelineSpan() {
	return activeDiagnosticsTimelineSpan.getStore();
}
async function measureDiagnosticsTimelineSpan(name, run, options = {}) {
	const env = options.env ?? process.env;
	if (!isDiagnosticsTimelineEnabled({
		config: options.config,
		env
	})) return await run();
	const activeSpan = getActiveDiagnosticsTimelineSpan();
	const spanId = randomUUID();
	const phase = options.phase ?? activeSpan?.phase;
	const parentSpanId = options.parentSpanId ?? activeSpan?.spanId;
	const startedAt = performance$1.now();
	emitDiagnosticsTimelineEvent({
		type: "span.start",
		name,
		phase,
		spanId,
		parentSpanId,
		attributes: options.attributes
	}, {
		config: options.config,
		env
	});
	try {
		const result = await activeDiagnosticsTimelineSpan.run({
			name,
			...phase ? { phase } : {},
			spanId,
			...parentSpanId ? { parentSpanId } : {},
			...options.attributes ? { attributes: options.attributes } : {}
		}, () => run());
		emitDiagnosticsTimelineEvent({
			type: "span.end",
			name,
			phase,
			spanId,
			parentSpanId,
			durationMs: performance$1.now() - startedAt,
			attributes: options.attributes
		}, {
			config: options.config,
			env
		});
		return result;
	} catch (error) {
		emitDiagnosticsTimelineEvent({
			type: "span.error",
			name,
			phase,
			spanId,
			parentSpanId,
			durationMs: performance$1.now() - startedAt,
			attributes: options.attributes,
			errorName: error instanceof Error ? error.name : typeof error,
			...options.omitErrorMessage ? {} : { errorMessage: error instanceof Error ? error.message : String(error) }
		}, {
			config: options.config,
			env
		});
		throw error;
	}
}
function measureDiagnosticsTimelineSpanSync(name, run, options = {}) {
	const env = options.env ?? process.env;
	if (!isDiagnosticsTimelineEnabled({
		config: options.config,
		env
	})) return run();
	const activeSpan = getActiveDiagnosticsTimelineSpan();
	const spanId = randomUUID();
	const phase = options.phase ?? activeSpan?.phase;
	const parentSpanId = options.parentSpanId ?? activeSpan?.spanId;
	const startedAt = performance$1.now();
	emitDiagnosticsTimelineEvent({
		type: "span.start",
		name,
		phase,
		spanId,
		parentSpanId,
		attributes: options.attributes
	}, {
		config: options.config,
		env
	});
	try {
		const result = activeDiagnosticsTimelineSpan.run({
			name,
			...phase ? { phase } : {},
			spanId,
			...parentSpanId ? { parentSpanId } : {},
			...options.attributes ? { attributes: options.attributes } : {}
		}, run);
		emitDiagnosticsTimelineEvent({
			type: "span.end",
			name,
			phase,
			spanId,
			parentSpanId,
			durationMs: performance$1.now() - startedAt,
			attributes: options.attributes
		}, {
			config: options.config,
			env
		});
		return result;
	} catch (error) {
		emitDiagnosticsTimelineEvent({
			type: "span.error",
			name,
			phase,
			spanId,
			parentSpanId,
			durationMs: performance$1.now() - startedAt,
			attributes: options.attributes,
			errorName: error instanceof Error ? error.name : typeof error,
			...options.omitErrorMessage ? {} : { errorMessage: error instanceof Error ? error.message : String(error) }
		}, {
			config: options.config,
			env
		});
		throw error;
	}
}
//#endregion
//#region src/plugins/plugin-metadata-snapshot.ts
const MAX_PLUGIN_METADATA_SNAPSHOT_MEMOS = 8;
let pluginMetadataSnapshotMemos = [];
function clearLoadPluginMetadataSnapshotMemo() {
	pluginMetadataSnapshotMemos = [];
}
registerPluginMetadataProcessMemoLifecycleClear(clearLoadPluginMetadataSnapshotMemo);
const MEMO_RELEVANT_ENV_KEYS = [
	"APPDATA",
	"HOME",
	"OPENCLAW_BUNDLED_PLUGINS_DIR",
	"OPENCLAW_COMPATIBILITY_HOST_VERSION",
	"OPENCLAW_CONFIG_PATH",
	"OPENCLAW_DISABLE_BUNDLED_PLUGINS",
	"OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS",
	"OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY",
	"OPENCLAW_HOME",
	"OPENCLAW_NIX_MODE",
	"OPENCLAW_STATE_DIR",
	"USERPROFILE",
	"XDG_CONFIG_HOME"
];
function fileFingerprint(filePath) {
	try {
		const stat = fs.statSync(filePath, { bigint: true });
		return [
			filePath,
			stat.isFile() ? "file" : stat.isDirectory() ? "dir" : "other",
			stat.size.toString(),
			stat.mtimeNs.toString(),
			stat.ctimeNs.toString()
		];
	} catch {
		return [filePath, "missing"];
	}
}
function readJsonObject(filePath) {
	try {
		const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
		return isRecord(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
function stableMemoValue(value) {
	if (Array.isArray(value)) return value.map(stableMemoValue);
	if (!isRecord(value)) return value;
	return Object.fromEntries(Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, stableMemoValue(entry)]));
}
function pickMemoRelevantEnv(env) {
	return Object.fromEntries(MEMO_RELEVANT_ENV_KEYS.flatMap((key) => {
		const value = env[key];
		return value === void 0 ? [] : [[key, value]];
	}));
}
function throwReadonlyPluginMetadataMutation() {
	throw new TypeError("Plugin metadata snapshots are immutable");
}
function freezeSnapshotValue(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (!value || typeof value !== "object") return value;
	if (seen.has(value)) return value;
	seen.add(value);
	if (value instanceof Map) {
		for (const [key, entry] of value) {
			freezeSnapshotValue(key, seen);
			freezeSnapshotValue(entry, seen);
		}
		Object.defineProperties(value, {
			clear: { value: throwReadonlyPluginMetadataMutation },
			delete: { value: throwReadonlyPluginMetadataMutation },
			set: { value: throwReadonlyPluginMetadataMutation }
		});
		return Object.freeze(value);
	}
	if (value instanceof Set) {
		for (const entry of value) freezeSnapshotValue(entry, seen);
		Object.defineProperties(value, {
			add: { value: throwReadonlyPluginMetadataMutation },
			clear: { value: throwReadonlyPluginMetadataMutation },
			delete: { value: throwReadonlyPluginMetadataMutation }
		});
		return Object.freeze(value);
	}
	for (const entry of Object.values(value)) freezeSnapshotValue(entry, seen);
	return Object.freeze(value);
}
function freezePluginMetadataSnapshot(snapshot) {
	return freezeSnapshotValue(snapshot);
}
function resolvePersistedRegistryFastMemoFingerprint(params) {
	const disabledByEnv = params.env.OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY?.trim().toLowerCase();
	if (params.preferPersisted === false || Boolean(disabledByEnv) && disabledByEnv !== "0" && disabledByEnv !== "false" && disabledByEnv !== "no") return { disabled: true };
	const indexPath = resolveInstalledPluginIndexStorePath({
		env: params.env,
		...params.stateDir ? { stateDir: params.stateDir } : {}
	});
	const npmRoot = params.stateDir ? path.join(params.stateDir, "npm") : resolveDefaultPluginNpmDir(params.env);
	return {
		index: fileFingerprint(indexPath),
		npmPackageJson: fileFingerprint(path.join(npmRoot, "package.json"))
	};
}
function resolvePersistedRegistryMemoContextHash(params) {
	return hashJson({
		env: pickMemoRelevantEnv(params.env),
		fastFingerprint: params.fastFingerprint,
		preferPersisted: params.preferPersisted ?? null,
		stateDir: params.stateDir ?? null
	});
}
function resolvePersistedRegistryMemoState(params) {
	const fastFingerprint = resolvePersistedRegistryFastMemoFingerprint(params);
	const fastHash = hashJson(fastFingerprint);
	const contextHash = resolvePersistedRegistryMemoContextHash({
		...params,
		fastFingerprint
	});
	if (isRecord(fastFingerprint) && fastFingerprint.disabled === true) return {
		contextHash,
		fastHash,
		fingerprint: fastFingerprint
	};
	const indexPath = resolveInstalledPluginIndexStorePath({
		env: params.env,
		...params.stateDir ? { stateDir: params.stateDir } : {}
	});
	const index = params.index ?? readJsonObject(indexPath);
	return {
		contextHash,
		fastHash,
		fingerprint: {
			...fastFingerprint,
			indexHash: hashJson(stableMemoValue(index) ?? null)
		}
	};
}
function resolvePersistedRegistryMemoStateForLookup(params, memos) {
	const fastFingerprint = resolvePersistedRegistryFastMemoFingerprint(params);
	const fastHash = hashJson(fastFingerprint);
	const contextHash = resolvePersistedRegistryMemoContextHash({
		...params,
		fastFingerprint
	});
	for (const memo of memos) {
		const registryState = memo.registryState;
		if (registryState && registryState.contextHash === contextHash && registryState.fastHash === fastHash) return registryState;
	}
	return resolvePersistedRegistryMemoState(params);
}
function resolveProvidedIndexMemoState(index) {
	const fingerprint = { providedIndex: resolveInstalledManifestRegistryIndexFingerprint(index) };
	const fingerprintHash = hashJson(fingerprint);
	return {
		contextHash: fingerprintHash,
		fastHash: fingerprintHash,
		fingerprint
	};
}
function findPluginMetadataSnapshotMemo(key) {
	const index = pluginMetadataSnapshotMemos.findIndex((memo) => memo.key === key);
	if (index === -1) return;
	const [memo] = pluginMetadataSnapshotMemos.splice(index, 1);
	if (!memo) return;
	pluginMetadataSnapshotMemos.unshift(memo);
	return memo;
}
function rememberPluginMetadataSnapshotMemo(memo) {
	pluginMetadataSnapshotMemos = [memo, ...pluginMetadataSnapshotMemos.filter((existing) => existing.key !== memo.key)].slice(0, MAX_PLUGIN_METADATA_SNAPSHOT_MEMOS);
}
function computePluginMetadataSnapshotMemoKey(params) {
	const { params: snapshotParams, registryState } = params;
	const env = snapshotParams.env ?? process.env;
	const indexFingerprint = snapshotParams.index ? resolveInstalledManifestRegistryIndexFingerprint(snapshotParams.index) : void 0;
	return hashJson({
		controlPlane: resolvePluginControlPlaneFingerprint({
			config: snapshotParams.config,
			env,
			workspaceDir: snapshotParams.workspaceDir,
			policyHash: resolveInstalledPluginIndexPolicyHash(snapshotParams.config),
			...indexFingerprint ? { inventoryFingerprint: indexFingerprint } : {}
		}),
		cwd: process.cwd(),
		env: pickMemoRelevantEnv(env),
		index: indexFingerprint ?? null,
		pathPolicy: {
			compatibilityHostVersion: resolveCompatibilityHostVersion(env),
			nixMode: resolveIsNixMode(env)
		},
		preferPersisted: snapshotParams.preferPersisted ?? null,
		registry: registryState.fingerprint,
		stateDir: snapshotParams.stateDir ? resolveUserPath(snapshotParams.stateDir, env) : null,
		workspaceDir: snapshotParams.workspaceDir ?? null
	});
}
function resolvePluginMetadataControlPlaneFingerprint(params) {
	return resolvePluginControlPlaneFingerprint(params);
}
function indexesMatch(left, right) {
	if (!left || !right) return true;
	return resolveInstalledManifestRegistryIndexFingerprint(left) === resolveInstalledManifestRegistryIndexFingerprint(right);
}
function cloneSnapshotInput(value) {
	return value && typeof value === "object" ? structuredClone(value) : value;
}
function normalizeInstalledPluginIndex(index) {
	return {
		version: index.version ?? 1,
		hostContractVersion: index.hostContractVersion ?? "",
		compatRegistryVersion: index.compatRegistryVersion ?? "",
		migrationVersion: index.migrationVersion ?? 1,
		policyHash: index.policyHash ?? "",
		generatedAtMs: index.generatedAtMs ?? 0,
		installRecords: cloneSnapshotInput(index.installRecords ?? {}),
		plugins: (index.plugins ?? []).map(cloneSnapshotInput),
		diagnostics: (index.diagnostics ?? []).map(cloneSnapshotInput),
		...index.warning ? { warning: index.warning } : {},
		...index.refreshReason ? { refreshReason: index.refreshReason } : {}
	};
}
function isPluginMetadataSnapshotCompatible(params) {
	const env = params.env ?? process.env;
	return params.snapshot.policyHash === resolveInstalledPluginIndexPolicyHash(params.config) && (!params.snapshot.configFingerprint || params.snapshot.configFingerprint === resolvePluginMetadataControlPlaneFingerprint({
		config: params.config,
		env,
		index: params.index ?? params.snapshot.index,
		policyHash: params.snapshot.policyHash,
		workspaceDir: params.workspaceDir
	})) && (params.snapshot.workspaceDir ?? "") === (params.workspaceDir ?? "") && indexesMatch(params.snapshot.index, params.index);
}
function appendOwner(owners, ownedId, pluginId) {
	const existing = owners.get(ownedId);
	if (existing) {
		existing.push(pluginId);
		return;
	}
	owners.set(ownedId, [pluginId]);
}
function freezeOwnerMap(owners) {
	return new Map([...owners.entries()].map(([ownedId, pluginIds]) => [ownedId, Object.freeze([...pluginIds])]));
}
function buildPluginMetadataOwnerMaps(plugins) {
	const channels = /* @__PURE__ */ new Map();
	const channelConfigs = /* @__PURE__ */ new Map();
	const providers = /* @__PURE__ */ new Map();
	const modelCatalogProviders = /* @__PURE__ */ new Map();
	const cliBackends = /* @__PURE__ */ new Map();
	const setupProviders = /* @__PURE__ */ new Map();
	const commandAliases = /* @__PURE__ */ new Map();
	const contracts = /* @__PURE__ */ new Map();
	for (const plugin of plugins) {
		for (const channelId of plugin.channels ?? []) appendOwner(channels, channelId, plugin.id);
		for (const channelId of Object.keys(plugin.channelConfigs ?? {})) appendOwner(channelConfigs, channelId, plugin.id);
		for (const providerId of plugin.providers ?? []) appendOwner(providers, providerId, plugin.id);
		for (const providerId of Object.keys(plugin.modelCatalog?.providers ?? {})) appendOwner(modelCatalogProviders, providerId, plugin.id);
		for (const providerId of Object.keys(plugin.modelCatalog?.aliases ?? {})) appendOwner(modelCatalogProviders, providerId, plugin.id);
		for (const cliBackendId of plugin.cliBackends ?? []) appendOwner(cliBackends, cliBackendId, plugin.id);
		for (const cliBackendId of plugin.setup?.cliBackends ?? []) appendOwner(cliBackends, cliBackendId, plugin.id);
		for (const setupProvider of plugin.setup?.providers ?? []) appendOwner(setupProviders, setupProvider.id, plugin.id);
		for (const commandAlias of plugin.commandAliases ?? []) appendOwner(commandAliases, commandAlias.name, plugin.id);
		for (const [contract, values] of Object.entries(plugin.contracts ?? {})) if (Array.isArray(values) && values.length > 0) appendOwner(contracts, contract, plugin.id);
	}
	return {
		channels: freezeOwnerMap(channels),
		channelConfigs: freezeOwnerMap(channelConfigs),
		providers: freezeOwnerMap(providers),
		modelCatalogProviders: freezeOwnerMap(modelCatalogProviders),
		cliBackends: freezeOwnerMap(cliBackends),
		setupProviders: freezeOwnerMap(setupProviders),
		commandAliases: freezeOwnerMap(commandAliases),
		contracts: freezeOwnerMap(contracts)
	};
}
function listPluginOriginsFromMetadataSnapshot(snapshot) {
	return new Map(snapshot.plugins.map((record) => [record.id, record.origin]));
}
function loadPluginMetadataSnapshot(params) {
	const activeTimelineSpan = getActiveDiagnosticsTimelineSpan();
	const env = params.env ?? process.env;
	const registryState = params.index ? resolveProvidedIndexMemoState(params.index) : resolvePersistedRegistryMemoStateForLookup({
		env,
		...params.stateDir ? { stateDir: resolveUserPath(params.stateDir, env) } : {},
		...params.preferPersisted !== void 0 ? { preferPersisted: params.preferPersisted } : {}
	}, pluginMetadataSnapshotMemos);
	const memoKey = computePluginMetadataSnapshotMemoKey({
		params,
		registryState
	});
	const memo = findPluginMetadataSnapshotMemo(memoKey);
	if (memo?.key === memoKey) return measureDiagnosticsTimelineSpanSync("plugins.metadata.scan", () => memo.snapshot, {
		phase: activeTimelineSpan?.phase ?? "startup",
		config: params.config,
		env: params.env,
		attributes: {
			cacheHit: true,
			hasWorkspaceDir: params.workspaceDir !== void 0,
			hasInstalledIndex: params.index !== void 0
		}
	});
	const result = measureDiagnosticsTimelineSpanSync("plugins.metadata.scan", () => loadPluginMetadataSnapshotImpl(params), {
		phase: activeTimelineSpan?.phase ?? "startup",
		config: params.config,
		env: params.env,
		attributes: {
			hasWorkspaceDir: params.workspaceDir !== void 0,
			hasInstalledIndex: params.index !== void 0
		}
	});
	const snapshot = freezePluginMetadataSnapshot(result.snapshot);
	if (canMemoizePluginMetadataSnapshotResult(result)) {
		const cachedRegistryState = result.registrySource === "derived" ? resolvePersistedRegistryMemoState({
			env,
			index: snapshot.index,
			...params.stateDir ? { stateDir: resolveUserPath(params.stateDir, env) } : {},
			...params.preferPersisted !== void 0 ? { preferPersisted: params.preferPersisted } : {}
		}) : registryState;
		rememberPluginMetadataSnapshotMemo({
			key: computePluginMetadataSnapshotMemoKey({
				params,
				registryState: cachedRegistryState
			}),
			registryState: cachedRegistryState,
			snapshot
		});
	}
	return snapshot;
}
function canMemoizePluginMetadataSnapshotResult(result) {
	const snapshot = result.snapshot;
	const hasCompleteSnapshotShape = Array.isArray(snapshot.plugins) && Array.isArray(snapshot.diagnostics) && Array.isArray(snapshot.registryDiagnostics) && Array.isArray(snapshot.manifestRegistry.plugins) && Array.isArray(snapshot.manifestRegistry.diagnostics) && Array.isArray(snapshot.index.plugins) && Array.isArray(snapshot.index.diagnostics);
	const hasPluginMetadata = snapshot.plugins.length > 0 || snapshot.index.plugins.length > 0;
	return hasCompleteSnapshotShape && hasPluginMetadata;
}
function resolvePluginMetadataSnapshot(params) {
	if (params.allowCurrent !== false && params.stateDir === void 0 && params.preferPersisted !== false) {
		const current = getCurrentPluginMetadataSnapshot({
			config: params.config,
			env: params.env,
			...params.workspaceDir !== void 0 ? { workspaceDir: params.workspaceDir } : {},
			...params.allowWorkspaceScopedCurrent === true ? { allowWorkspaceScopedSnapshot: true } : {}
		});
		if (!current) return loadPluginMetadataSnapshot(params);
		if (!params.index) return current;
		if (isPluginMetadataSnapshotCompatible({
			snapshot: current,
			config: params.config,
			env: params.env,
			workspaceDir: params.workspaceDir ?? (params.allowWorkspaceScopedCurrent === true ? current.workspaceDir : void 0),
			index: params.index
		})) return current;
	}
	return loadPluginMetadataSnapshot(params);
}
function loadPluginMetadataSnapshotImpl(params) {
	const totalStartedAt = performance.now();
	const registryStartedAt = performance.now();
	const registryResult = loadPluginRegistrySnapshotWithMetadata({
		config: params.config,
		workspaceDir: params.workspaceDir,
		...params.stateDir ? { stateDir: params.stateDir } : {},
		env: params.env,
		...params.preferPersisted !== void 0 ? { preferPersisted: params.preferPersisted } : {},
		...params.index ? { index: params.index } : {}
	}) ?? {
		source: "derived",
		snapshot: { plugins: [] },
		diagnostics: []
	};
	const registrySnapshotMs = performance.now() - registryStartedAt;
	const index = normalizeInstalledPluginIndex(registryResult.snapshot);
	const manifestStartedAt = performance.now();
	const manifestRegistry = index.plugins.length === 0 ? loadPluginManifestRegistry({
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		diagnostics: [...index.diagnostics],
		installRecords: index.installRecords
	}) : loadPluginManifestRegistryForInstalledIndex({
		index,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		includeDisabled: true
	});
	const manifestRegistryMs = performance.now() - manifestStartedAt;
	const normalizePluginId = createPluginRegistryIdNormalizer(index, { manifestRegistry });
	const byPluginId = new Map(manifestRegistry.plugins.map((plugin) => [plugin.id, plugin]));
	const ownerMapsStartedAt = performance.now();
	const owners = buildPluginMetadataOwnerMaps(manifestRegistry.plugins);
	const ownerMapsMs = performance.now() - ownerMapsStartedAt;
	const totalMs = performance.now() - totalStartedAt;
	return {
		registrySource: registryResult.source,
		snapshot: {
			policyHash: index.policyHash,
			registrySource: registryResult.source,
			configFingerprint: resolvePluginMetadataControlPlaneFingerprint({
				config: params.config,
				env: params.env,
				index,
				policyHash: index.policyHash,
				workspaceDir: params.workspaceDir
			}),
			...params.workspaceDir ? { workspaceDir: params.workspaceDir } : {},
			index,
			registryDiagnostics: registryResult.diagnostics,
			manifestRegistry,
			plugins: manifestRegistry.plugins,
			diagnostics: manifestRegistry.diagnostics,
			byPluginId,
			normalizePluginId,
			owners,
			metrics: {
				registrySnapshotMs,
				manifestRegistryMs,
				ownerMapsMs,
				totalMs,
				indexPluginCount: index.plugins.length,
				manifestPluginCount: manifestRegistry.plugins.length
			},
			discovery: registryResult.discovery
		}
	};
}
//#endregion
export { resolvePluginMetadataSnapshot as a, measureDiagnosticsTimelineSpan as c, loadPluginMetadataSnapshot as i, measureDiagnosticsTimelineSpanSync as l, isPluginMetadataSnapshotCompatible as n, emitDiagnosticsTimelineEvent as o, listPluginOriginsFromMetadataSnapshot as r, isDiagnosticsTimelineEnabled as s, clearLoadPluginMetadataSnapshotMemo as t };
