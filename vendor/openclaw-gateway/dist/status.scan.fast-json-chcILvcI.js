import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { t as createLazyImportLoader } from "./lazy-promise-Djskx0qC.js";
import { c as isRecord } from "./utils-B5r0V84N.js";
import { a as GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA } from "./ids-OP3BJTaQ.js";
import { t as resolveMemorySearchConfig } from "./memory-search-CsIXN6vZ.js";
import { i as resolveSharedMemoryStatusSnapshot, n as resolveStatusSummaryFromOverview, r as resolveMemoryPluginStatus, t as collectStatusScanOverview } from "./status.scan-overview-DrwYdBlJ.js";
import path from "node:path";
import os from "node:os";
//#region src/commands/status.scan-result.ts
function buildStatusScanResult(params) {
	return {
		cfg: params.cfg,
		sourceConfig: params.sourceConfig,
		secretDiagnostics: params.secretDiagnostics,
		osSummary: params.osSummary,
		tailscaleMode: params.tailscaleMode,
		tailscaleDns: params.tailscaleDns,
		tailscaleHttpsUrl: params.tailscaleHttpsUrl,
		update: params.update,
		gatewayConnection: params.gatewaySnapshot.gatewayConnection,
		remoteUrlMissing: params.gatewaySnapshot.remoteUrlMissing,
		gatewayMode: params.gatewaySnapshot.gatewayMode,
		gatewayProbeAuth: params.gatewaySnapshot.gatewayProbeAuth,
		gatewayProbeAuthWarning: params.gatewaySnapshot.gatewayProbeAuthWarning,
		gatewayProbe: params.gatewaySnapshot.gatewayProbe,
		gatewayReachable: params.gatewaySnapshot.gatewayReachable,
		gatewaySelf: params.gatewaySnapshot.gatewaySelf,
		channelIssues: params.channelIssues,
		agentStatus: params.agentStatus,
		channels: params.channels,
		summary: params.summary,
		memory: params.memory,
		memoryPlugin: params.memoryPlugin,
		pluginCompatibility: params.pluginCompatibility
	};
}
//#endregion
//#region src/commands/status.scan-execute.ts
async function executeStatusScanFromOverview(params) {
	const memoryPlugin = resolveMemoryPluginStatus(params.overview.cfg);
	const [memory, summary] = await Promise.all([params.resolveMemory({
		cfg: params.overview.cfg,
		agentStatus: params.overview.agentStatus,
		memoryPlugin,
		...params.runtime ? { runtime: params.runtime } : {}
	}), resolveStatusSummaryFromOverview({
		overview: params.overview,
		includeChannelSummary: params.summary?.includeChannelSummary
	})]);
	return buildStatusScanResult({
		cfg: params.overview.cfg,
		sourceConfig: params.overview.sourceConfig,
		secretDiagnostics: params.overview.secretDiagnostics,
		osSummary: params.overview.osSummary,
		tailscaleMode: params.overview.tailscaleMode,
		tailscaleDns: params.overview.tailscaleDns,
		tailscaleHttpsUrl: params.overview.tailscaleHttpsUrl,
		update: params.overview.update,
		gatewaySnapshot: params.overview.gatewaySnapshot,
		channelIssues: params.channelIssues,
		agentStatus: params.overview.agentStatus,
		channels: params.channels,
		summary,
		memory,
		memoryPlugin,
		pluginCompatibility: params.pluginCompatibility
	});
}
//#endregion
//#region src/commands/status.scan-memory.ts
const statusScanDepsRuntimeModuleLoader = createLazyImportLoader(() => import("./status.scan.deps.runtime.js"));
function loadStatusScanDepsRuntimeModule() {
	return statusScanDepsRuntimeModuleLoader.load();
}
function resolveDefaultMemoryStorePath(agentId) {
	return path.join(resolveStateDir(process.env, os.homedir), "memory", `${agentId}.sqlite`);
}
async function resolveStatusMemoryStatusSnapshot(params) {
	const { getMemorySearchManager } = await loadStatusScanDepsRuntimeModule();
	return await resolveSharedMemoryStatusSnapshot({
		cfg: params.cfg,
		agentStatus: params.agentStatus,
		memoryPlugin: params.memoryPlugin,
		resolveMemoryConfig: resolveMemorySearchConfig,
		getMemorySearchManager,
		requireDefaultStore: params.requireDefaultStore
	});
}
//#endregion
//#region src/commands/status.scan.fast-json.ts
const IGNORED_CHANNEL_CONFIG_KEYS = new Set(["defaults", "modelByChannel"]);
const STATUS_JSON_CHANNEL_ENV_PREFIXES = GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA.filter((entry) => entry.configurable !== false).map((entry) => `${entry.channelId.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}_`);
const STATUS_JSON_CHANNEL_ENV_VARS = new Set(GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA.filter((entry) => entry.configurable !== false).flatMap((entry) => entry.channelEnvVars ?? []));
function hasMeaningfulStatusJsonChannelConfig(value) {
	if (!isRecord(value)) return false;
	return Object.keys(value).some((key) => key !== "enabled");
}
function hasExplicitStatusJsonChannelConfig(cfg) {
	if (!isRecord(cfg.channels)) return false;
	for (const [key, value] of Object.entries(cfg.channels)) {
		if (IGNORED_CHANNEL_CONFIG_KEYS.has(key)) continue;
		if (hasMeaningfulStatusJsonChannelConfig(value)) return true;
	}
	return false;
}
function hasStatusJsonChannelEnvConfig(env = process.env) {
	for (const [key, value] of Object.entries(env)) {
		if (typeof value !== "string" || value.trim().length === 0) continue;
		if (STATUS_JSON_CHANNEL_ENV_VARS.has(key) || STATUS_JSON_CHANNEL_ENV_PREFIXES.some((prefix) => key.startsWith(prefix))) return true;
	}
	return false;
}
function hasPotentialConfiguredChannelsForStatusJson(cfg) {
	return hasExplicitStatusJsonChannelConfig(cfg) || hasStatusJsonChannelEnvConfig();
}
async function scanStatusJsonWithPolicy(opts, runtime, policy) {
	return await executeStatusScanFromOverview({
		overview: await collectStatusScanOverview({
			commandName: policy.commandName,
			opts,
			showSecrets: false,
			runtime,
			allowMissingConfigFastPath: policy.allowMissingConfigFastPath,
			resolveHasConfiguredChannels: policy.resolveHasConfiguredChannels,
			includeChannelsData: false,
			includeChannelSecretTargets: false,
			skipConfigPluginValidation: true
		}),
		runtime,
		summary: { includeChannelSummary: policy.includeChannelSummary },
		resolveMemory: policy.resolveMemory,
		channelIssues: [],
		channels: {
			rows: [],
			details: []
		},
		pluginCompatibility: []
	});
}
async function scanStatusJsonFast(opts, runtime) {
	return await scanStatusJsonWithPolicy(opts, runtime, {
		commandName: "status --json",
		allowMissingConfigFastPath: true,
		includeChannelSummary: false,
		resolveHasConfiguredChannels: (cfg) => hasPotentialConfiguredChannelsForStatusJson(cfg),
		resolveMemory: async ({ cfg, agentStatus, memoryPlugin }) => opts.all ? await resolveStatusMemoryStatusSnapshot({
			cfg,
			agentStatus,
			memoryPlugin,
			requireDefaultStore: resolveDefaultMemoryStorePath
		}) : null
	});
}
//#endregion
export { executeStatusScanFromOverview as i, scanStatusJsonWithPolicy as n, resolveStatusMemoryStatusSnapshot as r, scanStatusJsonFast as t };
