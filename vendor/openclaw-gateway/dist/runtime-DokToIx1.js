import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { p as resolveUserPath } from "./utils-B5r0V84N.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { c as loadAuthProfileStoreForSecretsRuntime, l as loadAuthProfileStoreWithoutExternalProfiles, t as clearRuntimeAuthProfileStoreSnapshots } from "./store-lFmS2pvu.js";
import "./auth-profiles-BqdzLfrX.js";
import { n as getActiveRuntimeWebToolsMetadata$1 } from "./runtime-web-tools-state-BgXXPpNN.js";
import { a as getActiveSecretsRuntimeSnapshot$1, c as registerSecretsRuntimeStateClearHook, i as getActiveSecretsRuntimeRefreshContext, l as setPreparedSecretsRuntimeSnapshotRefreshContext, n as clearSecretsRuntimeSnapshot$1, o as getLiveSecretsRuntimeAuthStores, r as getActiveSecretsRuntimeEnv$1, s as getPreparedSecretsRuntimeSnapshotRefreshContext, t as activateSecretsRuntimeSnapshotState } from "./runtime-state-CCyqNOzR.js";
import { i as mergeSecretsRuntimeEnv, n as collectCandidateAgentDirs, o as resolveRefreshAgentDirs, r as createEmptyRuntimeWebToolsMetadata, t as canUseSecretsRuntimeFastPath } from "./runtime-fast-path-DW5cIGn-.js";
import { isDeepStrictEqual } from "node:util";
//#region src/secrets/runtime.ts
registerSecretsRuntimeStateClearHook(clearRuntimeAuthProfileStoreSnapshots);
let runtimeManifestPromise = null;
let runtimePreparePromise = null;
function loadRuntimeManifestHelpers() {
	runtimeManifestPromise ??= import("./runtime-manifest.runtime.js");
	return runtimeManifestPromise;
}
function loadRuntimePrepareHelpers() {
	runtimePreparePromise ??= import("./runtime-prepare.runtime.js");
	return runtimePreparePromise;
}
async function resolveLoadablePluginOrigins(params) {
	const workspaceDir = resolveAgentWorkspaceDir(params.config, resolveDefaultAgentId(params.config));
	const { listPluginOriginsFromMetadataSnapshot, loadPluginMetadataSnapshot } = await loadRuntimeManifestHelpers();
	return listPluginOriginsFromMetadataSnapshot(loadPluginMetadataSnapshot({
		config: params.config,
		workspaceDir,
		env: params.env
	}));
}
function hasConfiguredPluginEntries(config) {
	const entries = config.plugins?.entries;
	return !!entries && typeof entries === "object" && !Array.isArray(entries) && Object.keys(entries).length > 0;
}
function hasConfiguredChannelEntries(config) {
	const channels = config.channels;
	return !!channels && typeof channels === "object" && !Array.isArray(channels) && Object.keys(channels).some((channelId) => channelId !== "defaults");
}
async function prepareSecretsRuntimeSnapshot(params) {
	const runtimeEnv = mergeSecretsRuntimeEnv(params.env);
	const sourceConfig = structuredClone(params.config);
	const resolvedConfig = structuredClone(params.config);
	const includeAuthStoreRefs = params.includeAuthStoreRefs ?? true;
	let authStores = [];
	const fastPathLoadAuthStore = params.loadAuthStore ?? loadAuthProfileStoreWithoutExternalProfiles;
	const candidateDirs = params.agentDirs?.length ? uniqueStrings(params.agentDirs.map((entry) => resolveUserPath(entry, runtimeEnv))) : collectCandidateAgentDirs(resolvedConfig, runtimeEnv);
	if (includeAuthStoreRefs) for (const agentDir of candidateDirs) authStores.push({
		agentDir,
		store: structuredClone(fastPathLoadAuthStore(agentDir))
	});
	if (canUseSecretsRuntimeFastPath({
		sourceConfig,
		authStores
	})) {
		const snapshot = {
			sourceConfig,
			config: resolvedConfig,
			authStores,
			warnings: [],
			webTools: createEmptyRuntimeWebToolsMetadata()
		};
		setPreparedSecretsRuntimeSnapshotRefreshContext(snapshot, {
			env: runtimeEnv,
			explicitAgentDirs: params.agentDirs?.length ? [...candidateDirs] : null,
			includeAuthStoreRefs,
			loadAuthStore: fastPathLoadAuthStore,
			loadablePluginOrigins: params.loadablePluginOrigins ?? /* @__PURE__ */ new Map()
		});
		return snapshot;
	}
	const { applyResolvedAssignments, collectAuthStoreAssignments, collectConfigAssignments, createResolverContext, resolveRuntimeWebTools, resolveSecretRefValues } = await loadRuntimePrepareHelpers();
	const loadablePluginOrigins = params.loadablePluginOrigins ?? (hasConfiguredPluginEntries(sourceConfig) || hasConfiguredChannelEntries(sourceConfig) ? await resolveLoadablePluginOrigins({
		config: sourceConfig,
		env: runtimeEnv
	}) : /* @__PURE__ */ new Map());
	const context = createResolverContext({
		sourceConfig,
		env: runtimeEnv
	});
	collectConfigAssignments({
		config: resolvedConfig,
		context,
		loadablePluginOrigins
	});
	if (includeAuthStoreRefs) {
		const loadAuthStore = params.loadAuthStore ?? loadAuthProfileStoreForSecretsRuntime;
		if (!params.loadAuthStore) authStores = candidateDirs.map((agentDir) => ({
			agentDir,
			store: structuredClone(loadAuthStore(agentDir))
		}));
		for (const entry of authStores) collectAuthStoreAssignments({
			store: entry.store,
			context,
			agentDir: entry.agentDir
		});
	}
	if (context.assignments.length > 0) {
		const resolved = await resolveSecretRefValues(context.assignments.map((assignment) => assignment.ref), {
			config: sourceConfig,
			env: context.env,
			cache: context.cache
		});
		applyResolvedAssignments({
			assignments: context.assignments,
			resolved
		});
	}
	const snapshot = {
		sourceConfig,
		config: resolvedConfig,
		authStores,
		warnings: context.warnings,
		webTools: await resolveRuntimeWebTools({
			sourceConfig,
			resolvedConfig,
			context
		})
	};
	setPreparedSecretsRuntimeSnapshotRefreshContext(snapshot, {
		env: runtimeEnv,
		explicitAgentDirs: params.agentDirs?.length ? [...candidateDirs] : null,
		includeAuthStoreRefs,
		loadAuthStore: params.loadAuthStore ?? loadAuthProfileStoreForSecretsRuntime,
		loadablePluginOrigins
	});
	return snapshot;
}
function activateSecretsRuntimeSnapshot(snapshot) {
	const refreshContext = getPreparedSecretsRuntimeSnapshotRefreshContext(snapshot) ?? getActiveSecretsRuntimeRefreshContext() ?? {
		env: { ...process.env },
		explicitAgentDirs: null,
		includeAuthStoreRefs: snapshot.authStores.length > 0,
		loadAuthStore: loadAuthProfileStoreForSecretsRuntime,
		loadablePluginOrigins: /* @__PURE__ */ new Map()
	};
	const coercePreflightSnapshot = (value, sourceConfig) => {
		if (!value || typeof value !== "object") return null;
		const candidate = value;
		return isDeepStrictEqual(candidate.sourceConfig, sourceConfig) ? candidate : null;
	};
	activateSecretsRuntimeSnapshotState({
		snapshot,
		refreshContext,
		refreshHandler: {
			preflight: async ({ sourceConfig, includeAuthStoreRefs }) => {
				const activeRefreshContext = getActiveSecretsRuntimeRefreshContext();
				if (!getActiveSecretsRuntimeSnapshot$1() || !activeRefreshContext) return false;
				return await prepareSecretsRuntimeSnapshot({
					config: sourceConfig,
					env: activeRefreshContext.env,
					agentDirs: resolveRefreshAgentDirs(sourceConfig, activeRefreshContext),
					includeAuthStoreRefs: includeAuthStoreRefs ?? activeRefreshContext.includeAuthStoreRefs,
					loadablePluginOrigins: activeRefreshContext.loadablePluginOrigins,
					...activeRefreshContext.loadAuthStore ? { loadAuthStore: activeRefreshContext.loadAuthStore } : {}
				});
			},
			refresh: async ({ sourceConfig, includeAuthStoreRefs, preflightResult }) => {
				const activeRefreshContext = getActiveSecretsRuntimeRefreshContext();
				if (!getActiveSecretsRuntimeSnapshot$1() || !activeRefreshContext) return false;
				const oneShotSkipAuthStoreRefs = includeAuthStoreRefs === false && activeRefreshContext.includeAuthStoreRefs;
				const refreshed = coercePreflightSnapshot(preflightResult, sourceConfig) ?? await prepareSecretsRuntimeSnapshot({
					config: sourceConfig,
					env: activeRefreshContext.env,
					agentDirs: resolveRefreshAgentDirs(sourceConfig, activeRefreshContext),
					includeAuthStoreRefs: includeAuthStoreRefs ?? activeRefreshContext.includeAuthStoreRefs,
					loadablePluginOrigins: activeRefreshContext.loadablePluginOrigins,
					...activeRefreshContext.loadAuthStore ? { loadAuthStore: activeRefreshContext.loadAuthStore } : {}
				});
				if (oneShotSkipAuthStoreRefs) {
					refreshed.authStores = getLiveSecretsRuntimeAuthStores();
					setPreparedSecretsRuntimeSnapshotRefreshContext(refreshed, activeRefreshContext);
				}
				activateSecretsRuntimeSnapshot(refreshed);
				return true;
			}
		}
	});
}
async function refreshActiveSecretsRuntimeSnapshot() {
	const activeSnapshot = getActiveSecretsRuntimeSnapshot$1();
	const activeRefreshContext = getActiveSecretsRuntimeRefreshContext();
	if (!activeSnapshot || !activeRefreshContext) return false;
	activateSecretsRuntimeSnapshot(await prepareSecretsRuntimeSnapshot({
		config: activeSnapshot.sourceConfig,
		env: activeRefreshContext.env,
		agentDirs: resolveRefreshAgentDirs(activeSnapshot.sourceConfig, activeRefreshContext),
		includeAuthStoreRefs: activeRefreshContext.includeAuthStoreRefs,
		loadablePluginOrigins: activeRefreshContext.loadablePluginOrigins,
		...activeRefreshContext.loadAuthStore ? { loadAuthStore: activeRefreshContext.loadAuthStore } : {}
	}));
	return true;
}
function getActiveSecretsRuntimeSnapshot() {
	return getActiveSecretsRuntimeSnapshot$1();
}
function getActiveSecretsRuntimeEnv() {
	return getActiveSecretsRuntimeEnv$1();
}
function getActiveRuntimeWebToolsMetadata() {
	return getActiveRuntimeWebToolsMetadata$1();
}
function clearSecretsRuntimeSnapshot() {
	clearSecretsRuntimeSnapshot$1();
}
//#endregion
export { getActiveSecretsRuntimeSnapshot as a, getActiveSecretsRuntimeEnv as i, clearSecretsRuntimeSnapshot as n, prepareSecretsRuntimeSnapshot as o, getActiveRuntimeWebToolsMetadata as r, refreshActiveSecretsRuntimeSnapshot as s, activateSecretsRuntimeSnapshot as t };
