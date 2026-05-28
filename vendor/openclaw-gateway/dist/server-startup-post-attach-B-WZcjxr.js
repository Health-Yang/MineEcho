import { t as isTruthyEnvValue } from "./env-DmmbBEHd.js";
import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { i as getPluginModuleLoaderStats } from "./plugin-module-loader-cache-OiY7Cg2j.js";
import { t as STARTUP_UNAVAILABLE_GATEWAY_METHODS } from "./core-descriptors-BUnLwpF8.js";
import { t as GATEWAY_EVENT_UPDATE_AVAILABLE } from "./events-Bqs2BNth.js";
import { t as hasConfiguredInternalHooks } from "./configured-DmQDjcF5.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { setTimeout as setTimeout$1 } from "node:timers/promises";
//#region src/gateway/server-startup-post-attach.ts
const ACP_BACKEND_READY_TIMEOUT_MS = 5e3;
const ACP_BACKEND_READY_POLL_MS = 50;
const PROVIDER_AUTH_PREWARM_START_DELAY_MS = 1e3;
const PROVIDER_AUTH_REWARM_DELAY_MS = 1e3;
const DEFERRED_SIDECAR_START_DELAY_MS = 100;
const QMD_STARTUP_IDLE_DELAY_MS = 12e4;
const RESTART_SENTINEL_FILENAME = "restart-sentinel.json";
function stopPostReadySidecarsAfterCloseStarted(params) {
	if (!params.closeStarted) return;
	for (const postReadySidecar of params.postReadySidecars) postReadySidecar.stop();
}
async function measureStartup(startupTrace, name, run) {
	return startupTrace ? startupTrace.measure(name, run) : await run();
}
async function measureProviderAuthWarm(run) {
	const eventLoopDelay = monitorEventLoopDelay({ resolution: 10 });
	eventLoopDelay.enable();
	const startMs = performance.now();
	try {
		await run();
	} finally {
		eventLoopDelay.disable();
	}
	return {
		elapsedMs: performance.now() - startMs,
		eventLoopMaxMs: eventLoopDelay.max / 1e6
	};
}
function formatProviderAuthWarmMetrics(metrics) {
	return `in ${metrics.elapsedMs.toFixed(0)}ms eventLoopMax=${metrics.eventLoopMaxMs.toFixed(1)}ms`;
}
function shouldCheckRestartSentinel(env = process.env) {
	return !env.VITEST && env.NODE_ENV !== "test";
}
function resolveGatewayMemoryStartupPolicy(cfg) {
	if (cfg.memory?.backend !== "qmd") return { mode: "off" };
	if (cfg.memory.qmd?.update?.onBoot === false) return { mode: "off" };
	const startup = cfg.memory.qmd?.update?.startup;
	if (startup === "immediate") return { mode: "immediate" };
	if (startup === "idle") {
		const rawDelayMs = cfg.memory.qmd?.update?.startupDelayMs;
		return {
			mode: "idle",
			delayMs: typeof rawDelayMs === "number" && Number.isFinite(rawDelayMs) && rawDelayMs >= 0 ? Math.floor(rawDelayMs) : QMD_STARTUP_IDLE_DELAY_MS
		};
	}
	return { mode: "off" };
}
function scheduleGatewayMemoryBackend(params) {
	if (params.policy.mode === "off") return;
	const start = () => {
		import("./server-startup-memory-CTi8vh_e.js").then(({ startGatewayMemoryBackend }) => startGatewayMemoryBackend({
			cfg: params.cfg,
			log: params.log
		})).catch((err) => {
			params.log.warn(`qmd memory startup initialization failed: ${String(err)}`);
		});
	};
	if (params.policy.mode === "immediate") {
		setImmediate(start);
		return;
	}
	setTimeout(start, params.policy.delayMs).unref?.();
}
function schedulePostAttachUpdateSentinelRefresh(params) {
	setImmediate(() => {
		measureStartup(params.startupTrace, "post-attach.update-sentinel", async () => {
			try {
				await params.refreshLatestUpdateRestartSentinel();
			} catch (err) {
				params.log.warn(`restart sentinel refresh failed: ${String(err)}`);
			}
		}).catch((err) => {
			params.log.warn(`restart sentinel refresh failed: ${String(err)}`);
		});
	}).unref?.();
}
function scheduleProviderAuthStatePrewarm(params) {
	let stopped = false;
	let startupTimer;
	let rewarmTimer;
	let rewarmInFlight = false;
	let pendingRewarmReason;
	const isStopped = () => stopped;
	const delayMs = params.delayMs ?? PROVIDER_AUTH_PREWARM_START_DELAY_MS;
	(async () => {
		const { clearCurrentProviderAuthState, warmCurrentProviderAuthState } = await import("./model-provider-auth-oh_-aFZ7.js");
		const { setAuthProfileFailureHook } = await import("./auth-profiles-BhQ3UdnH.js");
		const runRewarm = async (reason) => {
			if (isStopped()) return;
			const cfg = params.getConfig();
			rewarmInFlight = true;
			try {
				const metrics = await measureProviderAuthWarm(() => warmCurrentProviderAuthState(cfg, { isCancelled: isStopped }));
				if (isStopped()) return;
				params.log.info(`provider auth state re-warmed (${reason}) ${formatProviderAuthWarmMetrics(metrics)}`);
			} catch (err) {
				params.log.warn(`provider auth state rewarm failed: ${String(err)}`);
			} finally {
				rewarmInFlight = false;
				const nextReason = pendingRewarmReason;
				pendingRewarmReason = void 0;
				if (nextReason && !isStopped()) scheduleAuthMapRewarm(nextReason);
			}
		};
		const scheduleAuthMapRewarm = (reason) => {
			if (isStopped()) return;
			pendingRewarmReason = reason;
			if (rewarmTimer || rewarmInFlight) return;
			rewarmTimer = setTimeout(() => {
				rewarmTimer = void 0;
				const nextReason = pendingRewarmReason ?? reason;
				pendingRewarmReason = void 0;
				runRewarm(nextReason);
			}, PROVIDER_AUTH_REWARM_DELAY_MS);
			rewarmTimer.unref?.();
		};
		if (isStopped()) return;
		setAuthProfileFailureHook(() => {
			if (isStopped()) return;
			clearCurrentProviderAuthState();
			scheduleAuthMapRewarm("auth-profile-failure");
		});
		startupTimer = setTimeout(() => {
			(async () => {
				if (isStopped()) return;
				const cfg = params.getConfig();
				const metrics = await measureProviderAuthWarm(() => warmCurrentProviderAuthState(cfg, { isCancelled: isStopped }));
				if (isStopped()) return;
				params.log.info(`provider auth state pre-warmed ${formatProviderAuthWarmMetrics(metrics)}`);
			})().catch((err) => {
				params.log.warn(`provider auth state pre-warm failed: ${String(err)}`);
			});
		}, Math.max(0, delayMs));
		startupTimer.unref?.();
	})().catch((err) => {
		params.log.warn(`provider auth state pre-warm setup failed: ${String(err)}`);
	});
	return { stop: () => {
		stopped = true;
		if (startupTimer) {
			clearTimeout(startupTimer);
			startupTimer = void 0;
		}
		if (rewarmTimer) {
			clearTimeout(rewarmTimer);
			rewarmTimer = void 0;
		}
	} };
}
function schedulePostReadySidecarTask(params) {
	let stopped = false;
	const abortController = new AbortController();
	const isStopped = () => stopped;
	const handle = setImmediate(() => {
		if (isStopped()) return;
		measureStartup(params.startupTrace, params.name, () => params.run(isStopped, abortController.signal)).catch((err) => {
			params.log.warn(`${params.name} failed after gateway ready: ${String(err)}`);
		});
	});
	handle.unref?.();
	return { stop: async () => {
		stopped = true;
		abortController.abort();
		clearImmediate(handle);
		await params.stop?.();
	} };
}
function scheduleTranscriptsAutoStartSidecar(params) {
	let stopTranscriptsAutoStart;
	return schedulePostReadySidecarTask({
		startupTrace: params.startupTrace,
		name: "sidecars.transcripts-auto-start",
		log: params.log,
		run: async (isStopped) => {
			const { createTranscriptsAutoStartService } = await import("./transcripts-tool-BkXLqYA1.js");
			if (isStopped()) return;
			const service = createTranscriptsAutoStartService({
				config: params.cfg,
				stateDir: resolveStateDir(),
				logger: params.log
			});
			stopTranscriptsAutoStart = () => service.stop();
			service.start();
		},
		stop: async () => {
			await stopTranscriptsAutoStart?.();
		}
	});
}
async function pathExists(filePath) {
	try {
		await fs.promises.access(filePath);
		return true;
	} catch {
		return false;
	}
}
async function resolveRestartSentinelPathFast(env = process.env) {
	const normalizePathEnv = (value) => {
		const trimmed = value?.trim();
		return trimmed && trimmed !== "undefined" && trimmed !== "null" ? trimmed : void 0;
	};
	const resolveRawOsHome = () => normalizePathEnv(env.HOME) ?? normalizePathEnv(env.USERPROFILE);
	const expandHomePrefix = (input, home) => input.replace(/^~(?=$|[\\/])/, home);
	const resolveHome = () => {
		const explicitHome = normalizePathEnv(env.OPENCLAW_HOME);
		if (explicitHome) {
			const osHome = resolveRawOsHome() ?? os.homedir();
			return path.resolve(expandHomePrefix(explicitHome, osHome));
		}
		return path.resolve(resolveRawOsHome() ?? os.homedir());
	};
	const resolveUserPath = (input) => {
		const trimmed = input.trim();
		if (trimmed.startsWith("~")) return path.resolve(expandHomePrefix(trimmed, resolveHome()));
		return path.resolve(trimmed);
	};
	const override = normalizePathEnv(env.OPENCLAW_STATE_DIR);
	if (override) return path.join(resolveUserPath(override), RESTART_SENTINEL_FILENAME);
	const home = resolveHome();
	const newStateDir = path.join(home, ".openclaw");
	if (env.OPENCLAW_TEST_FAST === "1" || await pathExists(newStateDir)) return path.join(newStateDir, RESTART_SENTINEL_FILENAME);
	const legacyStateDir = path.join(home, ".clawdbot");
	if (await pathExists(legacyStateDir)) return path.join(legacyStateDir, RESTART_SENTINEL_FILENAME);
	return path.join(newStateDir, RESTART_SENTINEL_FILENAME);
}
async function hasRestartSentinelFileFast(env = process.env) {
	try {
		return await pathExists(await resolveRestartSentinelPathFast(env));
	} catch {
		return false;
	}
}
async function refreshLatestUpdateRestartSentinelIfPresent() {
	if (!await hasRestartSentinelFileFast()) return null;
	return await (await import("./server-restart-sentinel-b1tSg1Xi.js")).refreshLatestUpdateRestartSentinel();
}
function hasGatewayStartHooks(pluginRegistry) {
	return pluginRegistry.typedHooks.some((hook) => hook.hookName === "gateway_start");
}
async function hasGatewayStartupInternalHookListeners() {
	const { hasInternalHookListeners } = await import("./internal-hooks-Dj53ac-A.js");
	return hasInternalHookListeners("gateway", "startup");
}
async function waitForAcpRuntimeBackendReady(params) {
	const { getAcpRuntimeBackend } = await import("./registry-F2v5tNED.js");
	const timeoutMs = params.timeoutMs ?? ACP_BACKEND_READY_TIMEOUT_MS;
	const pollMs = params.pollMs ?? ACP_BACKEND_READY_POLL_MS;
	const deadline = Date.now() + timeoutMs;
	do {
		const backend = getAcpRuntimeBackend(params.backendId);
		if (backend) try {
			if (!backend.healthy || backend.healthy()) return true;
		} catch {}
		await setTimeout$1(pollMs, void 0, { ref: false });
	} while (Date.now() < deadline);
	return false;
}
async function startGatewaySidecars(params) {
	const postReadySidecars = [];
	const internalHooksConfigured = hasConfiguredInternalHooks(params.cfg);
	await measureStartup(params.startupTrace, "sidecars.internal-hooks", async () => {
		try {
			if (internalHooksConfigured) {
				const [{ setInternalHooksEnabled }, { loadInternalHooks }] = await Promise.all([import("./internal-hooks-Dj53ac-A.js"), import("./loader-BdJIue2a.js")]);
				setInternalHooksEnabled(params.cfg.hooks?.internal?.enabled !== false);
				const loadedCount = await loadInternalHooks(params.cfg, params.defaultWorkspaceDir);
				if (loadedCount > 0) params.logHooks.info(`loaded ${loadedCount} internal hook handler${loadedCount > 1 ? "s" : ""}`);
			}
		} catch (err) {
			params.logHooks.error(`failed to load hooks: ${String(err)}`);
		}
	});
	const skipChannels = isTruthyEnvValue(process.env.OPENCLAW_SKIP_CHANNELS) || isTruthyEnvValue(process.env.OPENCLAW_SKIP_PROVIDERS);
	await measureStartup(params.startupTrace, "sidecars.channels", async () => {
		if (!skipChannels) try {
			await measureStartup(params.startupTrace, "sidecars.channel-start", () => params.startChannels());
		} catch (err) {
			params.logChannels.error(`channel startup failed: ${String(err)}`);
		}
		else await measureStartup(params.startupTrace, "sidecars.channel-skip", () => params.logChannels.info("skipping channel start (OPENCLAW_SKIP_CHANNELS=1 or OPENCLAW_SKIP_PROVIDERS=1)"));
	});
	await params.onChannelsStarted?.();
	let pluginServices = params.shouldStartPluginServices?.() === false ? null : await measureStartup(params.startupTrace, "sidecars.plugin-services", async () => {
		try {
			const { startPluginServices } = await import("./services-Ci6twmx8.js");
			return await startPluginServices({
				registry: params.pluginRegistry,
				config: params.cfg,
				workspaceDir: params.defaultWorkspaceDir,
				startupTrace: params.startupTrace
			});
		} catch (err) {
			params.log.warn(`plugin services failed to start: ${String(err)}`);
			return null;
		}
	});
	if (pluginServices && params.shouldStartPluginServices?.() === false) {
		await pluginServices.stop().catch((err) => {
			params.log.warn(`plugin services stop after close failed: ${String(err)}`);
		});
		pluginServices = null;
	}
	params.onPluginServices?.(pluginServices);
	if (internalHooksConfigured || await hasGatewayStartupInternalHookListeners()) setTimeout(() => {
		import("./internal-hooks-Dj53ac-A.js").then(({ createInternalHookEvent, triggerInternalHook }) => {
			triggerInternalHook(createInternalHookEvent("gateway", "startup", "gateway:startup", {
				cfg: params.cfg,
				deps: params.deps,
				workspaceDir: params.defaultWorkspaceDir
			}));
		});
	}, 250);
	if (params.cfg.acp?.enabled) (async () => {
		const ready = await measureStartup(params.startupTrace, "sidecars.acp.runtime-ready", () => waitForAcpRuntimeBackendReady({ backendId: params.cfg.acp?.backend }));
		params.startupTrace?.detail("sidecars.acp.runtime-ready", [["readyCount", ready ? 1 : 0], ["backend", params.cfg.acp?.backend ?? "default"]]);
		await measureStartup(params.startupTrace, "sidecars.acp.identity-reconcile", async () => {
			const [{ getAcpSessionManager }, { ACP_SESSION_IDENTITY_RENDERER_VERSION }] = await Promise.all([import("./acp/control-plane/manager.js"), import("./session-identifiers-DoZlH9hS.js")]);
			const result = await getAcpSessionManager().reconcilePendingSessionIdentities({ cfg: params.cfg });
			if (result.checked === 0) return;
			params.log.warn(`acp startup identity reconcile (renderer=${ACP_SESSION_IDENTITY_RENDERER_VERSION}): checked=${result.checked} resolved=${result.resolved} failed=${result.failed}`);
		});
	})().catch((err) => {
		params.log.warn(`acp startup identity reconcile failed: ${String(err)}`);
	});
	await measureStartup(params.startupTrace, "sidecars.memory", async () => {
		const policy = resolveGatewayMemoryStartupPolicy(params.cfg);
		if (policy.mode === "off") return;
		scheduleGatewayMemoryBackend({
			cfg: params.cfg,
			log: params.log,
			policy
		});
	});
	schedulePostReadySidecarTask({
		startupTrace: params.startupTrace,
		name: "sidecars.session-locks",
		log: params.log,
		run: async () => {
			try {
				const [{ resolveStateDir }, { resolveAgentSessionDirs }, { cleanStaleLockFiles }] = await Promise.all([
					import("./paths-Se2CGrok.js"),
					import("./session-dirs-CRXMbzDV.js"),
					import("./session-write-lock-KCAKrIMO.js")
				]);
				const sessionDirs = await resolveAgentSessionDirs(resolveStateDir(process.env));
				for (const sessionsDir of sessionDirs) {
					const result = await cleanStaleLockFiles({
						sessionsDir,
						config: params.cfg,
						removeStale: true,
						log: { warn: (message) => params.log.warn(message) }
					});
					if (result.cleaned.length > 0) {
						const { markRestartAbortedMainSessionsFromLocks } = await import("./main-session-restart-recovery-C8VBLfVk.js");
						await markRestartAbortedMainSessionsFromLocks({
							sessionsDir,
							cleanedLocks: result.cleaned
						});
					}
				}
			} catch (err) {
				params.log.warn(`session lock cleanup failed on startup: ${String(err)}`);
			}
		}
	});
	schedulePostReadySidecarTask({
		startupTrace: params.startupTrace,
		name: "sidecars.restart-sentinel",
		log: params.log,
		run: async () => {
			if (!shouldCheckRestartSentinel()) return;
			if (!await hasRestartSentinelFileFast()) return;
			setTimeout(() => {
				import("./server-restart-sentinel-b1tSg1Xi.js").then(({ scheduleRestartSentinelWake }) => scheduleRestartSentinelWake({ deps: params.deps })).catch((err) => {
					params.log.warn(`restart sentinel wake failed to schedule: ${String(err)}`);
				});
			}, 750);
		}
	});
	schedulePostReadySidecarTask({
		startupTrace: params.startupTrace,
		name: "sidecars.subagent-recovery",
		log: params.log,
		run: async () => {
			const { scheduleSubagentOrphanRecovery } = await import("./subagent-registry-CJbn1mQZ.js");
			scheduleSubagentOrphanRecovery();
		}
	});
	schedulePostReadySidecarTask({
		startupTrace: params.startupTrace,
		name: "sidecars.main-session-recovery",
		log: params.log,
		run: async () => {
			const { scheduleRestartAbortedMainSessionRecovery } = await import("./main-session-restart-recovery-C8VBLfVk.js");
			scheduleRestartAbortedMainSessionRecovery({ cfg: params.cfg });
		}
	});
	if (params.cfg.hooks?.enabled && params.cfg.hooks.gmail?.account) postReadySidecars.push(schedulePostReadySidecarTask({
		startupTrace: params.startupTrace,
		name: "sidecars.gmail-watch",
		log: params.log,
		run: async (isStopped, signal) => {
			const { startGmailWatcherWithLogs } = await import("./gmail-watcher-lifecycle-BJJG0m1i.js");
			if (isStopped()) return;
			await startGmailWatcherWithLogs({
				cfg: params.cfg,
				log: params.logHooks,
				isCancelled: isStopped,
				signal
			});
		}
	}));
	if (params.cfg.hooks?.gmail?.model) postReadySidecars.push(schedulePostReadySidecarTask({
		startupTrace: params.startupTrace,
		name: "sidecars.gmail-model",
		log: params.log,
		run: async (isStopped) => {
			const [{ DEFAULT_MODEL, DEFAULT_PROVIDER }, { loadModelCatalog }, { getModelRefStatus, resolveConfiguredModelRef, resolveHooksGmailModel }] = await Promise.all([
				import("./defaults-RurGC76M.js"),
				import("./model-catalog-BG4aGsfT.js"),
				import("./model-selection-B5nPU-92.js")
			]);
			if (isStopped()) return;
			const hooksModelRef = resolveHooksGmailModel({
				cfg: params.cfg,
				defaultProvider: DEFAULT_PROVIDER
			});
			if (hooksModelRef) {
				const { provider: resolvedDefaultProvider, model: defaultModel } = resolveConfiguredModelRef({
					cfg: params.cfg,
					defaultProvider: DEFAULT_PROVIDER,
					defaultModel: DEFAULT_MODEL
				});
				const catalog = await loadModelCatalog({ config: params.cfg });
				const status = getModelRefStatus({
					cfg: params.cfg,
					catalog,
					ref: hooksModelRef,
					defaultProvider: resolvedDefaultProvider,
					defaultModel
				});
				if (!status.allowed) params.logHooks.warn(`hooks.gmail.model "${status.key}" not in agents.defaults.models allowlist (will use primary instead)`);
				if (!status.inCatalog) params.logHooks.warn(`hooks.gmail.model "${status.key}" not in the model catalog (may fail at runtime)`);
			}
		}
	}));
	return {
		pluginServices,
		postReadySidecars
	};
}
const defaultGatewayPostAttachRuntimeDeps = {
	getGlobalHookRunner: async () => (await import("./plugins/hook-runner-global.js")).getGlobalHookRunner(),
	logGatewayStartup: async (params) => (await import("./server-startup-log-C942aQPe.js")).logGatewayStartup(params),
	refreshLatestUpdateRestartSentinel: refreshLatestUpdateRestartSentinelIfPresent,
	scheduleGatewayUpdateCheck: async (...args) => (await import("./update-startup-BY6qlRPe.js")).scheduleGatewayUpdateCheck(...args),
	startGatewaySidecars,
	startGatewayTailscaleExposure: async (...args) => (await import("./server-tailscale-CAQ0OUK7.js")).startGatewayTailscaleExposure(...args)
};
function createDeferredGatewayUpdateCheck(params) {
	let started = false;
	let stopped = false;
	let stopUpdateCheck = null;
	const stop = () => {
		stopped = true;
		stopUpdateCheck?.();
		stopUpdateCheck = null;
	};
	const start = () => {
		if (started || stopped) return;
		started = true;
		setImmediate(() => {
			if (stopped) return;
			measureStartup(params.startupTrace, "post-attach.update-check", () => params.runtimeDeps.scheduleGatewayUpdateCheck({
				cfg: params.cfg,
				log: params.log,
				isNixMode: params.isNixMode,
				onUpdateAvailableChange: (updateAvailable) => {
					const payload = { updateAvailable };
					params.broadcast(GATEWAY_EVENT_UPDATE_AVAILABLE, payload, { dropIfSlow: true });
				}
			})).then((nextStop) => {
				if (stopped) {
					nextStop();
					return;
				}
				stopUpdateCheck = nextStop;
			}).catch((err) => {
				if (stopped) return;
				params.log.warn(`gateway update check failed to start: ${String(err)}`);
			});
		});
	};
	return {
		start,
		stop
	};
}
async function startGatewayPostAttachRuntime(params, runtimeDeps = defaultGatewayPostAttachRuntimeDeps) {
	let pluginRegistry = params.pluginRegistry;
	let startupPluginsLoaded = false;
	let startupPluginsLoadPromise = null;
	const loadStartupPluginsIfNeeded = async () => {
		if (params.minimalTestGateway || !params.loadStartupPlugins) return {
			pluginRegistry,
			gatewayMethods: []
		};
		if (startupPluginsLoaded) return {
			pluginRegistry,
			gatewayMethods: []
		};
		startupPluginsLoadPromise ??= (async () => {
			params.onStartupPluginsLoading?.();
			const loaded = await measureStartup(params.startupTrace, "plugins.runtime-post-bind", () => params.loadStartupPlugins());
			pluginRegistry = loaded.pluginRegistry;
			startupPluginsLoaded = true;
			params.startupTrace?.detail("plugins.runtime-post-bind", [["loadedPluginCount", pluginRegistry.plugins.filter((plugin) => plugin.status === "loaded").length], ["gatewayMethodCount", loaded.gatewayMethods.length]]);
			await params.onStartupPluginsLoaded?.(loaded);
			return loaded;
		})();
		return await startupPluginsLoadPromise;
	};
	await loadStartupPluginsIfNeeded();
	const startupLogPromise = measureStartup(params.startupTrace, "post-attach.log", () => runtimeDeps.logGatewayStartup({
		cfg: params.cfgAtStart,
		bindHost: params.bindHost,
		bindHosts: params.bindHosts,
		port: params.port,
		tlsEnabled: params.tlsEnabled,
		loadedPluginIds: pluginRegistry.plugins.filter((plugin) => plugin.status === "loaded").map((plugin) => plugin.id),
		log: params.log,
		isNixMode: params.isNixMode,
		startupStartedAt: params.startupStartedAt
	}));
	const updateCheck = params.minimalTestGateway ? {
		start: () => {},
		stop: () => {}
	} : createDeferredGatewayUpdateCheck({
		startupTrace: params.startupTrace,
		runtimeDeps,
		cfg: params.cfgAtStart,
		log: params.log,
		isNixMode: params.isNixMode,
		broadcast: params.broadcast
	});
	const tailscaleCleanupPromise = params.minimalTestGateway ? Promise.resolve(null) : params.tailscaleMode === "off" && !params.resetOnExit ? Promise.resolve(null) : measureStartup(params.startupTrace, "post-attach.tailscale", () => runtimeDeps.startGatewayTailscaleExposure({
		tailscaleMode: params.tailscaleMode,
		resetOnExit: params.resetOnExit,
		preserveFunnel: params.preserveFunnel,
		port: params.port,
		controlUiBasePath: params.controlUiBasePath,
		logTailscale: params.logTailscale
	}));
	let pluginServicesReported = false;
	let reportedPluginServices = null;
	const reportPluginServices = (pluginServices) => {
		pluginServicesReported = true;
		reportedPluginServices = pluginServices;
		params.onPluginServices?.(pluginServices);
	};
	const waitForSidecarStartTurn = () => new Promise((resolve) => {
		if (params.deferSidecars === true) {
			setTimeout(resolve, DEFERRED_SIDECAR_START_DELAY_MS).unref?.();
			return;
		}
		setImmediate(resolve);
	});
	const sidecarsPromise = params.minimalTestGateway ? Promise.resolve({
		pluginServices: null,
		pluginRegistry,
		postReadySidecars: []
	}) : waitForSidecarStartTurn().then(async () => {
		await loadStartupPluginsIfNeeded();
		params.log.info("starting channels and sidecars...");
		const loaderStatsBefore = getPluginModuleLoaderStats();
		const result = await measureStartup(params.startupTrace, "sidecars.total", () => runtimeDeps.startGatewaySidecars({
			cfg: params.gatewayPluginConfigAtStart,
			pluginRegistry,
			defaultWorkspaceDir: params.defaultWorkspaceDir,
			deps: params.deps,
			startChannels: params.startChannels,
			log: params.log,
			logHooks: params.logHooks,
			logChannels: params.logChannels,
			startupTrace: params.startupTrace,
			onChannelsStarted: params.onChannelsStarted,
			onPluginServices: reportPluginServices,
			shouldStartPluginServices: () => params.isClosing?.() !== true
		}));
		const loaderStatsAfter = getPluginModuleLoaderStats();
		params.startupTrace?.detail("sidecars.plugin-loader", [
			["callsCount", loaderStatsAfter.calls - loaderStatsBefore.calls],
			["nativeHitsCount", loaderStatsAfter.nativeHits - loaderStatsBefore.nativeHits],
			["nativeMissesCount", loaderStatsAfter.nativeMisses - loaderStatsBefore.nativeMisses],
			["sourceTransformForcedCount", loaderStatsAfter.sourceTransformForced - loaderStatsBefore.sourceTransformForced],
			["sourceTransformFallbacksCount", loaderStatsAfter.sourceTransformFallbacks - loaderStatsBefore.sourceTransformFallbacks]
		]);
		for (const method of STARTUP_UNAVAILABLE_GATEWAY_METHODS) params.unavailableGatewayMethods.delete(method);
		if (!pluginServicesReported) reportPluginServices(result.pluginServices);
		const postReadySidecars = [...result.postReadySidecars];
		const gatewayLifetimeSidecars = [];
		if (params.providerAuthPrewarm?.enabled !== false) gatewayLifetimeSidecars.push(scheduleProviderAuthStatePrewarm({
			getConfig: params.providerAuthPrewarm?.getConfig ?? (() => params.cfgAtStart),
			log: params.log,
			delayMs: params.providerAuthPrewarm?.delayMs
		}));
		if (params.gatewayPluginConfigAtStart.transcripts?.autoStart?.length) gatewayLifetimeSidecars.push(scheduleTranscriptsAutoStartSidecar({
			cfg: params.gatewayPluginConfigAtStart,
			startupTrace: params.startupTrace,
			log: params.log
		}));
		params.onPostReadySidecars?.(postReadySidecars);
		params.onGatewayLifetimeSidecars?.(gatewayLifetimeSidecars);
		params.onSidecarsReady?.();
		params.startupTrace?.detail("sidecars.ready", [["loadedPluginCount", pluginRegistry.plugins.filter((plugin) => plugin.status === "loaded").length], ["postReadySidecarCount", postReadySidecars.length + gatewayLifetimeSidecars.length]]);
		params.startupTrace?.mark("sidecars.ready");
		if (params.logReadyOnSidecars !== false) params.log.info("gateway ready");
		return {
			...result,
			postReadySidecars,
			gatewayLifetimeSidecars,
			pluginRegistry
		};
	});
	sidecarsPromise.then(async (sidecarsResult) => {
		if (params.minimalTestGateway) return;
		schedulePostAttachUpdateSentinelRefresh({
			startupTrace: params.startupTrace,
			log: params.log,
			refreshLatestUpdateRestartSentinel: runtimeDeps.refreshLatestUpdateRestartSentinel
		});
		if (!hasGatewayStartHooks(sidecarsResult.pluginRegistry)) return;
		await new Promise((resolve) => setImmediate(resolve));
		const hookRunner = await runtimeDeps.getGlobalHookRunner();
		if (hookRunner?.hasHooks("gateway_start")) {
			const { withPluginHttpRouteRegistry } = await import("./http-registry-BNMEqh9n.js");
			withPluginHttpRouteRegistry(sidecarsResult.pluginRegistry, () => hookRunner.runGatewayStart({ port: params.port }, {
				port: params.port,
				config: params.gatewayPluginConfigAtStart,
				workspaceDir: params.defaultWorkspaceDir,
				getCron: () => params.getCronService?.() ?? params.deps.cron
			})).catch((err) => {
				params.log.warn(`gateway_start hook failed: ${String(err)}`);
			});
		}
	}).catch((err) => {
		params.log.warn(`gateway sidecars failed to start: ${String(err)}`);
	});
	if (params.deferSidecars !== true) {
		const [, tailscaleCleanup, sidecarsResult] = await Promise.all([
			startupLogPromise,
			tailscaleCleanupPromise,
			sidecarsPromise
		]);
		updateCheck.start();
		return {
			stopGatewayUpdateCheck: updateCheck.stop,
			tailscaleCleanup,
			pluginServices: sidecarsResult.pluginServices
		};
	}
	const [, tailscaleCleanup] = await Promise.all([startupLogPromise, tailscaleCleanupPromise]);
	updateCheck.start();
	return {
		stopGatewayUpdateCheck: updateCheck.stop,
		tailscaleCleanup,
		pluginServices: reportedPluginServices
	};
}
const testing = {
	hasRestartSentinelFileFast,
	refreshLatestUpdateRestartSentinelIfPresent,
	resolveGatewayMemoryStartupPolicy,
	scheduleProviderAuthStatePrewarm,
	stopPostReadySidecarsAfterCloseStarted
};
//#endregion
export { testing as __testing, testing, startGatewayPostAttachRuntime, startGatewaySidecars, stopPostReadySidecarsAfterCloseStarted };
