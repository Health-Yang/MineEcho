import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { l as normalizeStringEntries } from "./string-normalization-B8G0vlWE.js";
import "./host-env-security-B90drdeB.js";
import { a as isSubagentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { n as emitDiagnosticEvent } from "./diagnostic-events-CNGydBWO.js";
import { i as createWindowsOutputDecoder, r as spawnWithFallback, t as resolveWindowsCommandShim } from "./windows-command-SbCMKxJh.js";
import { a as logWarn } from "./logger-Bcz1IQSW.js";
import { n as signalProcessTree } from "./kill-tree-DC9P7Y59.js";
import { o as normalizeDeliveryContext } from "./delivery-context.shared-B9zntlj0.js";
import { o as requestHeartbeat } from "./heartbeat-wake-D8JKi1wr.js";
import { a as enqueueSystemEvent } from "./system-events-BbV9wJlR.js";
import { d as markExited, n as appendOutput, p as tail, r as createSessionSlug, t as addSession } from "./bash-process-registry-DU_0t2zf.js";
import { c as readEnvInt, i as clampWithDefault, r as chunkString, t as buildDockerExecArgs } from "./bash-tools.shared-CWGWJRLL.js";
import { t as prepareOomScoreAdjustedSpawn } from "./linux-oom-score-eO5nXmjv.js";
import { i as scopedHeartbeatWakeOptionsForPolicy, t as resolveEventSessionKeyForPolicy } from "./event-session-routing-BV_pYWUi.js";
import { E as resolveExecApprovalAllowedDecisions, r as DEFAULT_EXEC_APPROVAL_TIMEOUT_MS } from "./exec-approvals-oH5G9_TS.js";
import "./bash-tools.schemas-BdCFQYWN.js";
import { n as getShellConfig, r as sanitizeBinaryOutput } from "./shell-utils-BDYMhC5E.js";
import { a as removePathPrepend, n as findPathKey, r as mergePathPrepend } from "./path-prepend-C1I3sJQT.js";
import path from "node:path";
import crypto from "node:crypto";
//#region src/process/supervisor/adapters/env.ts
function toStringEnv(env) {
	if (!env) return {};
	const out = {};
	for (const [key, value] of Object.entries(env)) {
		if (value === void 0) continue;
		out[key] = value;
	}
	return out;
}
//#endregion
//#region src/process/supervisor/adapters/child.ts
const FORCE_KILL_WAIT_FALLBACK_MS$1 = 4e3;
const WINDOWS_CLOSE_STATE_SETTLE_TIMEOUT_MS = 250;
function resolveCommand(command) {
	return resolveWindowsCommandShim({
		command,
		cmdCommands: [
			"npm",
			"pnpm",
			"yarn",
			"npx"
		]
	});
}
function isServiceManagedRuntime() {
	return Boolean(process.env.OPENCLAW_SERVICE_MARKER?.trim());
}
async function createChildAdapter(params) {
	const resolvedArgv = [...params.argv];
	resolvedArgv[0] = resolveCommand(resolvedArgv[0] ?? "");
	const baseEnv = params.env ? toStringEnv(params.env) : void 0;
	const preparedSpawn = prepareOomScoreAdjustedSpawn(resolvedArgv[0] ?? "", resolvedArgv.slice(1), { env: baseEnv });
	const stdinMode = params.stdinMode ?? (params.input !== void 0 ? "pipe-closed" : "inherit");
	const useDetached = process.platform !== "win32" && !isServiceManagedRuntime();
	const options = {
		cwd: params.cwd,
		env: preparedSpawn.env,
		stdio: [
			"pipe",
			"pipe",
			"pipe"
		],
		detached: useDetached,
		windowsHide: true,
		windowsVerbatimArguments: params.windowsVerbatimArguments
	};
	if (stdinMode === "inherit") options.stdio = [
		"inherit",
		"pipe",
		"pipe"
	];
	else options.stdio = [
		"pipe",
		"pipe",
		"pipe"
	];
	const spawned = await spawnWithFallback({
		argv: [preparedSpawn.command, ...preparedSpawn.args],
		options,
		fallbacks: useDetached ? [{
			label: "no-detach",
			options: { detached: false }
		}] : []
	});
	const child = spawned.child;
	const childStdin = spawned.child.stdin;
	let stdinDestroyed = childStdin?.destroyed ?? false;
	let stdinEnded = childStdin?.writableEnded === true || childStdin?.writableFinished === true;
	if (childStdin) {
		childStdin.once("finish", () => {
			stdinEnded = true;
		});
		childStdin.once("close", () => {
			stdinEnded = true;
			stdinDestroyed = true;
		});
		childStdin.once("error", () => {
			stdinDestroyed = true;
		});
		if (params.input !== void 0) {
			childStdin.write(params.input);
			stdinEnded = true;
			childStdin.end();
		} else if (stdinMode === "pipe-closed") {
			stdinEnded = true;
			childStdin.end();
		}
	}
	const stdin = childStdin ? {
		get destroyed() {
			return stdinDestroyed || childStdin.destroyed;
		},
		get writable() {
			return !stdinDestroyed && !stdinEnded && childStdin.writable;
		},
		get writableEnded() {
			return stdinEnded || childStdin.writableEnded;
		},
		get writableFinished() {
			return childStdin.writableFinished;
		},
		write: (data, cb) => {
			if (stdinDestroyed || stdinEnded || !childStdin.writable) {
				cb?.(/* @__PURE__ */ new Error("stdin is not writable"));
				return;
			}
			try {
				childStdin.write(data, cb);
			} catch (err) {
				cb?.(err);
			}
		},
		end: () => {
			try {
				stdinEnded = true;
				childStdin.end();
			} catch {}
		},
		destroy: () => {
			try {
				stdinDestroyed = true;
				stdinEnded = true;
				childStdin.destroy();
			} catch {}
		}
	} : void 0;
	const onStdout = (listener) => {
		const stdoutDecoder = createWindowsOutputDecoder();
		let flushed = false;
		const flush = () => {
			if (flushed) return;
			flushed = true;
			const tail = stdoutDecoder.flush();
			if (tail) listener(tail);
		};
		child.stdout.on("data", (chunk) => {
			const text = stdoutDecoder.decode(chunk);
			if (text) listener(text);
		});
		child.stdout.once("end", flush);
		child.stdout.once("close", flush);
	};
	const onStderr = (listener) => {
		const stderrDecoder = createWindowsOutputDecoder();
		let flushed = false;
		const flush = () => {
			if (flushed) return;
			flushed = true;
			const tail = stderrDecoder.flush();
			if (tail) listener(tail);
		};
		child.stderr.on("data", (chunk) => {
			const text = stderrDecoder.decode(chunk);
			if (text) listener(text);
		});
		child.stderr.once("end", flush);
		child.stderr.once("close", flush);
	};
	let waitResult = null;
	let waitError;
	let resolveWait = null;
	let rejectWait = null;
	let waitPromise = null;
	let forceKillWaitFallbackTimer = null;
	let childExitState = null;
	let windowsCloseFallbackTimer = null;
	let stdoutDrained = child.stdout == null;
	let stderrDrained = child.stderr == null;
	const clearForceKillWaitFallback = () => {
		if (!forceKillWaitFallbackTimer) return;
		clearTimeout(forceKillWaitFallbackTimer);
		forceKillWaitFallbackTimer = null;
	};
	const clearWindowsCloseFallbackTimer = () => {
		if (!windowsCloseFallbackTimer) return;
		clearTimeout(windowsCloseFallbackTimer);
		windowsCloseFallbackTimer = null;
	};
	const settleWait = (value) => {
		if (waitResult || waitError !== void 0) return;
		clearForceKillWaitFallback();
		clearWindowsCloseFallbackTimer();
		waitResult = value;
		if (resolveWait) {
			const resolve = resolveWait;
			resolveWait = null;
			rejectWait = null;
			resolve(value);
		}
	};
	const rejectPendingWait = (error) => {
		if (waitResult || waitError !== void 0) return;
		clearForceKillWaitFallback();
		clearWindowsCloseFallbackTimer();
		waitError = error;
		if (rejectWait) {
			const reject = rejectWait;
			resolveWait = null;
			rejectWait = null;
			reject(error);
		}
	};
	const scheduleForceKillWaitFallback = (signal) => {
		clearForceKillWaitFallback();
		forceKillWaitFallbackTimer = setTimeout(() => {
			settleWait({
				code: null,
				signal
			});
		}, FORCE_KILL_WAIT_FALLBACK_MS$1);
		forceKillWaitFallbackTimer.unref?.();
	};
	const resolveObservedExitState = (fallback) => {
		if (childExitState != null) return childExitState;
		return {
			code: child.exitCode ?? fallback.code,
			signal: child.signalCode ?? fallback.signal
		};
	};
	const maybeSettleAfterWindowsExit = () => {
		if (process.platform !== "win32" || childExitState == null || !stdoutDrained || !stderrDrained) return;
		settleWait(resolveObservedExitState(childExitState));
	};
	const scheduleWindowsCloseFallback = () => {
		if (process.platform !== "win32") return;
		clearWindowsCloseFallbackTimer();
		windowsCloseFallbackTimer = setTimeout(() => {
			maybeSettleAfterWindowsExit();
		}, WINDOWS_CLOSE_STATE_SETTLE_TIMEOUT_MS);
		windowsCloseFallbackTimer.unref?.();
	};
	child.stdout?.once("end", () => {
		stdoutDrained = true;
		maybeSettleAfterWindowsExit();
	});
	child.stdout?.once("close", () => {
		stdoutDrained = true;
		maybeSettleAfterWindowsExit();
	});
	child.stderr?.once("end", () => {
		stderrDrained = true;
		maybeSettleAfterWindowsExit();
	});
	child.stderr?.once("close", () => {
		stderrDrained = true;
		maybeSettleAfterWindowsExit();
	});
	child.once("error", (error) => {
		rejectPendingWait(error);
	});
	child.once("exit", (code, signal) => {
		childExitState = {
			code,
			signal
		};
		scheduleWindowsCloseFallback();
	});
	child.once("close", (code, signal) => {
		settleWait(resolveObservedExitState({
			code,
			signal
		}));
	});
	const wait = async () => {
		if (waitResult) return waitResult;
		if (waitError !== void 0) throw waitError;
		if (!waitPromise) waitPromise = new Promise((resolve, reject) => {
			resolveWait = resolve;
			rejectWait = reject;
			if (waitResult) {
				const settled = waitResult;
				resolveWait = null;
				rejectWait = null;
				resolve(settled);
				return;
			}
			if (waitError !== void 0) {
				const error = waitError;
				resolveWait = null;
				rejectWait = null;
				reject(error);
			}
		});
		return waitPromise;
	};
	const childIsDetached = useDetached && !spawned.usedFallback;
	const signalProcessTreeForChild = (pid, signal) => {
		signalProcessTree(pid, signal, { detached: childIsDetached });
	};
	const kill = (signal) => {
		const pid = child.pid ?? void 0;
		if (signal === void 0 || signal === "SIGKILL") {
			if (pid) signalProcessTreeForChild(pid, "SIGKILL");
			try {
				child.kill("SIGKILL");
			} catch {}
			scheduleForceKillWaitFallback("SIGKILL");
			return;
		}
		if (signal === "SIGTERM" && pid) {
			signalProcessTreeForChild(pid, "SIGTERM");
			return;
		}
		try {
			child.kill(signal);
		} catch {}
	};
	const dispose = () => {
		clearForceKillWaitFallback();
		clearWindowsCloseFallbackTimer();
		child.removeAllListeners();
	};
	return {
		pid: child.pid ?? void 0,
		stdin,
		onStdout,
		onStderr,
		wait,
		kill,
		dispose
	};
}
//#endregion
//#region src/process/supervisor/adapters/pty.ts
const FORCE_KILL_WAIT_FALLBACK_MS = 4e3;
let ptyModulePromise = null;
async function loadPtyModule() {
	ptyModulePromise ??= import("@lydell/node-pty");
	return ptyModulePromise;
}
async function createPtyAdapter(params) {
	const module = await loadPtyModule();
	const spawn = module.spawn ?? module.default?.spawn;
	if (!spawn) throw new Error("PTY support is unavailable (node-pty spawn not found).");
	const baseEnv = params.env ? toStringEnv(params.env) : void 0;
	const preparedSpawn = prepareOomScoreAdjustedSpawn(params.shell, params.args, { env: baseEnv });
	const pty = spawn(preparedSpawn.command, preparedSpawn.args, {
		cwd: params.cwd,
		env: preparedSpawn.env ? toStringEnv(preparedSpawn.env) : void 0,
		name: params.name ?? process.env.TERM ?? "xterm-256color",
		cols: params.cols ?? 120,
		rows: params.rows ?? 30
	});
	let dataListener = null;
	let exitListener = null;
	let waitResult = null;
	let resolveWait = null;
	let waitPromise = null;
	let forceKillWaitFallbackTimer = null;
	let stdinDestroyed = false;
	let stdinEnded = false;
	const clearForceKillWaitFallback = () => {
		if (!forceKillWaitFallbackTimer) return;
		clearTimeout(forceKillWaitFallbackTimer);
		forceKillWaitFallbackTimer = null;
	};
	const settleWait = (value) => {
		if (waitResult) return;
		clearForceKillWaitFallback();
		stdinDestroyed = true;
		stdinEnded = true;
		waitResult = value;
		if (resolveWait) {
			const resolve = resolveWait;
			resolveWait = null;
			resolve(value);
		}
	};
	const scheduleForceKillWaitFallback = (signal) => {
		clearForceKillWaitFallback();
		forceKillWaitFallbackTimer = setTimeout(() => {
			settleWait({
				code: null,
				signal
			});
		}, FORCE_KILL_WAIT_FALLBACK_MS);
		forceKillWaitFallbackTimer.unref();
	};
	exitListener = pty.onExit((event) => {
		const signal = event.signal && event.signal !== 0 ? event.signal : null;
		settleWait({
			code: event.exitCode ?? null,
			signal
		});
	}) ?? null;
	const stdin = {
		get destroyed() {
			return stdinDestroyed;
		},
		get writable() {
			return !stdinDestroyed && !stdinEnded;
		},
		get writableEnded() {
			return stdinEnded;
		},
		get writableFinished() {
			return stdinEnded;
		},
		write: (data, cb) => {
			try {
				pty.write(data);
				cb?.(null);
			} catch (err) {
				cb?.(err);
			}
		},
		end: () => {
			try {
				stdinEnded = true;
				const eof = process.platform === "win32" ? "" : "";
				pty.write(eof);
			} catch {}
		},
		destroy: () => {
			stdinDestroyed = true;
			stdinEnded = true;
		}
	};
	const onStdout = (listener) => {
		dataListener = pty.onData((chunk) => {
			listener(chunk);
		}) ?? null;
	};
	const onStderr = (_listener) => {};
	const wait = async () => {
		if (waitResult) return waitResult;
		if (!waitPromise) waitPromise = new Promise((resolve) => {
			resolveWait = resolve;
			if (waitResult) {
				const settled = waitResult;
				resolveWait = null;
				resolve(settled);
			}
		});
		return waitPromise;
	};
	const kill = (signal = "SIGKILL") => {
		try {
			if ((signal === "SIGKILL" || signal === "SIGTERM") && typeof pty.pid === "number" && pty.pid > 0) signalProcessTree(pty.pid, signal);
			else if (process.platform === "win32") pty.kill();
			else pty.kill(signal);
		} catch {}
		if (signal === "SIGKILL") scheduleForceKillWaitFallback(signal);
	};
	const dispose = () => {
		stdinDestroyed = true;
		stdinEnded = true;
		try {
			dataListener?.dispose();
		} catch {}
		try {
			exitListener?.dispose();
		} catch {}
		clearForceKillWaitFallback();
		dataListener = null;
		exitListener = null;
		settleWait({
			code: null,
			signal: null
		});
	};
	return {
		pid: pty.pid || void 0,
		stdin,
		onStdout,
		onStderr,
		wait,
		kill,
		dispose
	};
}
//#endregion
//#region src/process/supervisor/registry.ts
function nowMs() {
	return Date.now();
}
const DEFAULT_MAX_EXITED_RECORDS = 2e3;
function resolveMaxExitedRecords(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 1) return DEFAULT_MAX_EXITED_RECORDS;
	return Math.max(1, Math.floor(value));
}
function createRunRegistry(options) {
	const records = /* @__PURE__ */ new Map();
	const maxExitedRecords = resolveMaxExitedRecords(options?.maxExitedRecords);
	const pruneExitedRecords = () => {
		if (!records.size) return;
		let exited = 0;
		for (const record of records.values()) if (record.state === "exited") exited += 1;
		if (exited <= maxExitedRecords) return;
		let remove = exited - maxExitedRecords;
		for (const [runId, record] of records.entries()) {
			if (remove <= 0) break;
			if (record.state !== "exited") continue;
			records.delete(runId);
			remove -= 1;
		}
	};
	const add = (record) => {
		records.set(record.runId, { ...record });
	};
	const get = (runId) => {
		const record = records.get(runId);
		return record ? { ...record } : void 0;
	};
	const list = () => {
		return Array.from(records.values()).map((record) => Object.assign({}, record));
	};
	const listByScope = (scopeKey) => {
		if (!scopeKey.trim()) return [];
		return Array.from(records.values()).filter((record) => record.scopeKey === scopeKey).map((record) => Object.assign({}, record));
	};
	const updateState = (runId, state, patch) => {
		const current = records.get(runId);
		if (!current) return;
		const updatedAtMs = nowMs();
		const next = {
			...current,
			...patch,
			state,
			updatedAtMs,
			lastOutputAtMs: current.lastOutputAtMs
		};
		records.set(runId, next);
		return { ...next };
	};
	const touchOutput = (runId) => {
		const current = records.get(runId);
		if (!current) return;
		const ts = nowMs();
		records.set(runId, {
			...current,
			lastOutputAtMs: ts,
			updatedAtMs: ts
		});
	};
	const finalize = (runId, exit) => {
		const current = records.get(runId);
		if (!current) return null;
		const firstFinalize = current.state !== "exited";
		const ts = nowMs();
		const next = {
			...current,
			state: "exited",
			terminationReason: current.terminationReason ?? exit.reason,
			exitCode: current.exitCode !== void 0 ? current.exitCode : exit.exitCode,
			exitSignal: current.exitSignal !== void 0 ? current.exitSignal : exit.exitSignal,
			updatedAtMs: ts
		};
		records.set(runId, next);
		pruneExitedRecords();
		return {
			record: { ...next },
			firstFinalize
		};
	};
	const del = (runId) => {
		records.delete(runId);
	};
	return {
		add,
		get,
		list,
		listByScope,
		updateState,
		touchOutput,
		finalize,
		delete: del
	};
}
//#endregion
//#region src/process/supervisor/supervisor.ts
const GRACEFUL_CANCEL_TIMEOUT_MS = 5e3;
let supervisorLogRuntimePromise;
function loadSupervisorLogRuntime() {
	supervisorLogRuntimePromise ??= import("./supervisor-log.runtime.js");
	return supervisorLogRuntimePromise;
}
function clampTimeout(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
	return Math.max(1, Math.floor(value));
}
function isTimeoutReason(reason) {
	return reason === "overall-timeout" || reason === "no-output-timeout";
}
function createProcessSupervisor() {
	const registry = createRunRegistry();
	const active = /* @__PURE__ */ new Map();
	const cancel = (runId, reason = "manual-cancel") => {
		const current = active.get(runId);
		if (!current) return;
		registry.updateState(runId, "exiting", { terminationReason: reason });
		current.run.cancel(reason);
	};
	const cancelScope = (scopeKey, reason = "manual-cancel") => {
		if (!scopeKey.trim()) return;
		for (const [runId, run] of active.entries()) {
			if (run.scopeKey !== scopeKey) continue;
			cancel(runId, reason);
		}
	};
	const spawn = async (input) => {
		const runId = normalizeOptionalString(input.runId) ?? crypto.randomUUID();
		const scopeKey = normalizeOptionalString(input.scopeKey);
		if (input.replaceExistingScope && scopeKey) cancelScope(scopeKey, "manual-cancel");
		const startedAtMs = Date.now();
		const record = {
			runId,
			sessionId: input.sessionId,
			backendId: input.backendId,
			scopeKey,
			state: "starting",
			startedAtMs,
			lastOutputAtMs: startedAtMs,
			createdAtMs: startedAtMs,
			updatedAtMs: startedAtMs
		};
		registry.add(record);
		let forcedReason = null;
		let settled = false;
		let stdout = "";
		let stderr = "";
		let timeoutTimer = null;
		let noOutputTimer = null;
		let forceKillTimer = null;
		const captureOutput = input.captureOutput !== false;
		const overallTimeoutMs = clampTimeout(input.timeoutMs);
		const noOutputTimeoutMs = clampTimeout(input.noOutputTimeoutMs);
		const setForcedReason = (reason) => {
			if (forcedReason) return;
			forcedReason = reason;
			registry.updateState(runId, "exiting", { terminationReason: reason });
		};
		let cancelAdapter = null;
		const requestCancel = (reason) => {
			setForcedReason(reason);
			cancelAdapter?.(reason);
		};
		const touchOutput = () => {
			registry.touchOutput(runId);
			if (!noOutputTimeoutMs || settled) return;
			if (noOutputTimer) clearTimeout(noOutputTimer);
			noOutputTimer = setTimeout(() => {
				requestCancel("no-output-timeout");
			}, noOutputTimeoutMs);
		};
		try {
			if (input.mode === "child" && input.argv.length === 0) throw new Error("spawn argv cannot be empty");
			const adapter = input.mode === "pty" ? await (async () => {
				const { shell, args: shellArgs } = getShellConfig();
				const ptyCommand = input.ptyCommand.trim();
				if (!ptyCommand) throw new Error("PTY command cannot be empty");
				return await createPtyAdapter({
					shell,
					args: [...shellArgs, ptyCommand],
					cwd: input.cwd,
					env: input.env
				});
			})() : await createChildAdapter({
				argv: input.argv,
				cwd: input.cwd,
				env: input.env,
				windowsVerbatimArguments: input.windowsVerbatimArguments,
				input: input.input,
				stdinMode: input.stdinMode
			});
			registry.updateState(runId, "running", { pid: adapter.pid });
			const clearTimers = () => {
				if (timeoutTimer) {
					clearTimeout(timeoutTimer);
					timeoutTimer = null;
				}
				if (noOutputTimer) {
					clearTimeout(noOutputTimer);
					noOutputTimer = null;
				}
				if (forceKillTimer) {
					clearTimeout(forceKillTimer);
					forceKillTimer = null;
				}
			};
			cancelAdapter = (_reason) => {
				if (settled || forceKillTimer) return;
				adapter.kill("SIGTERM");
				forceKillTimer = setTimeout(() => {
					if (!settled) adapter.kill("SIGKILL");
				}, GRACEFUL_CANCEL_TIMEOUT_MS);
				forceKillTimer.unref?.();
			};
			if (overallTimeoutMs) timeoutTimer = setTimeout(() => {
				requestCancel("overall-timeout");
			}, overallTimeoutMs);
			if (noOutputTimeoutMs) noOutputTimer = setTimeout(() => {
				requestCancel("no-output-timeout");
			}, noOutputTimeoutMs);
			adapter.onStdout((chunk) => {
				if (captureOutput) stdout += chunk;
				input.onStdout?.(chunk);
				touchOutput();
			});
			adapter.onStderr((chunk) => {
				if (captureOutput) stderr += chunk;
				input.onStderr?.(chunk);
				touchOutput();
			});
			const waitPromise = (async () => {
				const result = await adapter.wait();
				if (settled) return {
					reason: forcedReason ?? "exit",
					exitCode: result.code,
					exitSignal: result.signal,
					durationMs: Date.now() - startedAtMs,
					stdout,
					stderr,
					timedOut: isTimeoutReason(forcedReason ?? "exit"),
					noOutputTimedOut: forcedReason === "no-output-timeout"
				};
				settled = true;
				clearTimers();
				adapter.dispose();
				active.delete(runId);
				const reason = forcedReason ?? (result.signal != null ? "signal" : "exit");
				const exit = {
					reason,
					exitCode: result.code,
					exitSignal: result.signal,
					durationMs: Date.now() - startedAtMs,
					stdout,
					stderr,
					timedOut: isTimeoutReason(forcedReason ?? reason),
					noOutputTimedOut: forcedReason === "no-output-timeout"
				};
				registry.finalize(runId, {
					reason: exit.reason,
					exitCode: exit.exitCode,
					exitSignal: exit.exitSignal
				});
				return exit;
			})().catch((err) => {
				if (!settled) {
					settled = true;
					clearTimers();
					active.delete(runId);
					adapter.dispose();
					registry.finalize(runId, {
						reason: "spawn-error",
						exitCode: null,
						exitSignal: null
					});
				}
				throw err;
			});
			const managedRun = {
				runId,
				pid: adapter.pid,
				startedAtMs,
				stdin: adapter.stdin,
				wait: async () => await waitPromise,
				cancel: (reason = "manual-cancel") => {
					requestCancel(reason);
				}
			};
			active.set(runId, {
				run: managedRun,
				scopeKey
			});
			return managedRun;
		} catch (err) {
			registry.finalize(runId, {
				reason: "spawn-error",
				exitCode: null,
				exitSignal: null
			});
			const { warnProcessSupervisorSpawnFailure } = await loadSupervisorLogRuntime();
			warnProcessSupervisorSpawnFailure(`spawn failed: runId=${runId} reason=${String(err)}`);
			throw err;
		}
	};
	return {
		spawn,
		cancel,
		cancelScope,
		reconcileOrphans: async () => {},
		getRecord: (runId) => registry.get(runId)
	};
}
//#endregion
//#region src/process/supervisor/index.ts
let singleton = null;
function getProcessSupervisor() {
	if (singleton) return singleton;
	singleton = createProcessSupervisor();
	return singleton;
}
//#endregion
//#region src/agents/bash-tools.exec-output.ts
const EXEC_NO_OUTPUT_PLACEHOLDER = "(no output)";
function renderExecOutputText(value) {
	return value || EXEC_NO_OUTPUT_PLACEHOLDER;
}
function renderExecUpdateText(params) {
	return (params.warnings.length ? `${params.warnings.join("\n")}\n\n` : "") + renderExecOutputText(params.tailText);
}
//#endregion
//#region src/agents/pty-dsr.ts
const DSR_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[\\??6n`, "g");
function stripDsrRequests(input) {
	let requests = 0;
	return {
		cleaned: input.replace(DSR_PATTERN, () => {
			requests += 1;
			return "";
		}),
		requests
	};
}
function buildCursorPositionResponse(row = 1, col = 1) {
	return `\x1b[${row};${col}R`;
}
//#endregion
//#region src/agents/bash-tools.exec-runtime.ts
const SMKX = "\x1B[?1h";
const RMKX = "\x1B[?1l";
/**
* Detect cursor key mode from PTY output chunk.
* Uses lastIndexOf to find the *last* toggle in the chunk.
* Returns "application" if smkx is the last toggle, "normal" if rmkx is last,
* or null if no toggle is found.
*/
function detectCursorKeyMode(raw) {
	const lastSmkx = raw.lastIndexOf(SMKX);
	const lastRmkx = raw.lastIndexOf(RMKX);
	if (lastSmkx === -1 && lastRmkx === -1) return null;
	return lastSmkx > lastRmkx ? "application" : "normal";
}
const DEFAULT_MAX_OUTPUT = clampWithDefault(readEnvInt("PI_BASH_MAX_OUTPUT_CHARS"), 2e5, 1e3, 2e5);
const DEFAULT_PENDING_MAX_OUTPUT = clampWithDefault(readEnvInt("OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS"), 3e4, 1e3, 2e5);
const DEFAULT_PATH = process.env.PATH ?? "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";
const DEFAULT_NOTIFY_SNIPPET_CHARS = 180;
const DEFAULT_APPROVAL_TIMEOUT_MS = DEFAULT_EXEC_APPROVAL_TIMEOUT_MS;
const DEFAULT_APPROVAL_REQUEST_TIMEOUT_MS = DEFAULT_APPROVAL_TIMEOUT_MS + 1e4;
const DEFAULT_APPROVAL_RUNNING_NOTICE_MS = 1e4;
const APPROVAL_SLUG_LENGTH = 8;
function normalizeExecExitSignal(signal) {
	if (signal === null) return;
	return String(signal);
}
function emitExecProcessCompleted(params) {
	const exitSignal = normalizeExecExitSignal(params.outcome.exitSignal);
	emitDiagnosticEvent({
		type: "exec.process.completed",
		target: params.target,
		mode: params.mode,
		outcome: params.outcome.status,
		durationMs: params.outcome.durationMs,
		commandLength: params.command.length,
		...params.sessionKey?.trim() ? { sessionKey: params.sessionKey.trim() } : {},
		...typeof params.outcome.exitCode === "number" ? { exitCode: params.outcome.exitCode } : {},
		...exitSignal ? { exitSignal } : {},
		...params.outcome.status === "failed" ? {
			timedOut: params.outcome.timedOut,
			failureKind: params.outcome.failureKind
		} : {}
	});
}
function renderExecHostLabel(host) {
	return host === "sandbox" ? "sandbox" : host === "gateway" ? "gateway" : "node";
}
function renderExecTargetLabel(target) {
	return target === "auto" ? "auto" : renderExecHostLabel(target);
}
function isRequestedExecTargetAllowed(params) {
	if (params.requestedTarget === params.configuredTarget) return true;
	if (params.configuredTarget === "auto") {
		if (params.sandboxAvailable && (params.requestedTarget === "gateway" || params.requestedTarget === "node")) return false;
		return true;
	}
	return false;
}
function resolveExecTarget(params) {
	const configuredTarget = params.configuredTarget ?? "auto";
	const requestedTarget = params.requestedTarget ?? null;
	if (requestedTarget && !isRequestedExecTargetAllowed({
		configuredTarget,
		requestedTarget,
		sandboxAvailable: params.sandboxAvailable
	})) {
		const allowedConfig = Array.from(new Set(configuredTarget === "auto" && params.sandboxAvailable && (requestedTarget === "gateway" || requestedTarget === "node") ? [renderExecTargetLabel(requestedTarget)] : requestedTarget === "gateway" && !params.sandboxAvailable ? ["gateway", "auto"] : [renderExecTargetLabel(requestedTarget), "auto"])).join(" or ");
		throw new Error(`exec host not allowed (requested ${renderExecTargetLabel(requestedTarget)}; configured host is ${renderExecTargetLabel(configuredTarget)}; set tools.exec.host=${allowedConfig} to allow this override).`);
	}
	const selectedTarget = requestedTarget ?? configuredTarget;
	const resolvedTarget = params.elevatedRequested ? selectedTarget === "node" ? "node" : "gateway" : selectedTarget;
	return {
		configuredTarget,
		requestedTarget,
		selectedTarget: resolvedTarget,
		effectiveHost: resolvedTarget === "auto" ? params.sandboxAvailable ? "sandbox" : "gateway" : resolvedTarget
	};
}
function normalizeNotifyOutput(value) {
	return value.replace(/\s+/g, " ").trim();
}
function compactNotifyOutput(value, maxChars = DEFAULT_NOTIFY_SNIPPET_CHARS) {
	const normalized = normalizeNotifyOutput(value);
	if (!normalized) return "";
	if (normalized.length <= maxChars) return normalized;
	const safe = Math.max(1, maxChars - 1);
	return `${normalized.slice(0, safe)}…`;
}
function applyShellPath(env, shellPath) {
	if (!shellPath) return;
	const entries = normalizeStringEntries(shellPath.split(path.delimiter));
	if (entries.length === 0) return;
	const pathKey = findPathKey(env);
	const merged = mergePathPrepend(env[pathKey], entries);
	if (merged) env[pathKey] = merged;
}
function maybeNotifyOnExit(session, status) {
	if (!session.backgrounded || !session.notifyOnExit || session.exitNotified) return;
	const sessionKey = session.sessionKey?.trim();
	if (!sessionKey) return;
	session.exitNotified = true;
	const exitLabel = session.exitSignal ? `signal ${session.exitSignal}` : `code ${session.exitCode ?? 0}`;
	const output = compactNotifyOutput(tail(session.tail || session.aggregated || "", 400));
	if (status === "failed" && session.exitReason === "manual-cancel" && !output) return;
	if (status === "completed" && !output && session.notifyOnExitEmptySuccess !== true) return;
	const summary = output ? `Exec ${status} (${session.id.slice(0, 8)}, ${exitLabel}) :: ${output}` : `Exec ${status} (${session.id.slice(0, 8)}, ${exitLabel})`;
	const eventRouting = session.eventRouting ?? {
		mainKey: session.mainKey,
		sessionScope: session.sessionScope
	};
	enqueueSystemEvent(summary, {
		sessionKey: resolveEventSessionKeyForPolicy(sessionKey, eventRouting),
		deliveryContext: session.notifyDeliveryContext
	});
	if (!isSubagentSessionKey(sessionKey)) requestHeartbeat(scopedHeartbeatWakeOptionsForPolicy(sessionKey, {
		source: "exec-event",
		intent: "event",
		reason: "exec-event",
		coalesceMs: 0
	}, eventRouting));
}
function createApprovalSlug(id) {
	return id.slice(0, APPROVAL_SLUG_LENGTH);
}
function buildApprovalPendingMessage(params) {
	let fence = "```";
	while (params.command.includes(fence)) fence += "`";
	const commandBlock = `${fence}sh\n${params.command}\n${fence}`;
	const lines = [];
	const allowedDecisions = params.allowedDecisions ?? resolveExecApprovalAllowedDecisions();
	const decisionText = allowedDecisions.join("|");
	const warningText = params.warningText?.trim();
	if (warningText) lines.push(warningText, "");
	lines.push(`Approval required (id ${params.approvalSlug}, full ${params.approvalId}).`);
	lines.push(`Host: ${params.host}`);
	if (params.nodeId) lines.push(`Node: ${params.nodeId}`);
	lines.push(`CWD: ${params.cwd ?? "(node default)"}`);
	lines.push("Command:");
	lines.push(commandBlock);
	lines.push("Mode: foreground (interactive approvals available).");
	lines.push(allowedDecisions.includes("allow-always") ? "Background mode requires pre-approved policy (allow-always or ask=off)." : "Background mode requires an effective policy that allows pre-approval (for example ask=off).");
	lines.push(`Reply with: /approve ${params.approvalSlug} ${decisionText}`);
	if (!allowedDecisions.includes("allow-always")) lines.push("The effective approval policy requires approval every time, so Allow Always is unavailable.");
	lines.push("If the short code is ambiguous, use the full id in /approve.");
	return lines.join("\n");
}
function resolveApprovalRunningNoticeMs(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_APPROVAL_RUNNING_NOTICE_MS;
	if (value <= 0) return 0;
	return Math.floor(value);
}
function joinExecFailureOutput(aggregated, reason) {
	return aggregated ? `${aggregated}\n\n${reason}` : reason;
}
function classifyExecFailureKind(params) {
	if (params.isShellFailure) return params.exitCode === 127 ? "shell-command-not-found" : "shell-not-executable";
	if (params.exitReason === "overall-timeout") return "overall-timeout";
	if (params.exitReason === "no-output-timeout") return "no-output-timeout";
	if (params.exitSignal != null) return "signal";
	return "aborted";
}
function formatExecFailureReason(params) {
	switch (params.failureKind) {
		case "shell-command-not-found": return "Command not found";
		case "shell-not-executable": return "Command not executable (permission denied)";
		case "overall-timeout": return typeof params.timeoutSec === "number" && params.timeoutSec > 0 ? `Command timed out after ${params.timeoutSec} seconds. If this command is expected to take longer, re-run with a higher timeout (e.g., exec timeout=300). If it should keep running, start it with exec background=true or yieldMs so OpenClaw can register a pollable process session. Do not rely on shell backgrounding with a trailing &.` : "Command timed out. If this command is expected to take longer, re-run with a higher timeout (e.g., exec timeout=300). If it should keep running, start it with exec background=true or yieldMs so OpenClaw can register a pollable process session. Do not rely on shell backgrounding with a trailing &.";
		case "no-output-timeout": return "Command timed out waiting for output";
		case "signal": return `Command aborted by signal ${params.exitSignal}`;
		case "aborted": return "Command aborted before exit code was captured";
	}
	throw new Error("Unsupported exec failure kind");
}
function buildExecExitOutcome(params) {
	const exitCode = params.exit.exitCode ?? 0;
	const isNormalExit = params.exit.reason === "exit";
	const isShellFailure = exitCode === 126 || exitCode === 127;
	if ((isNormalExit && !isShellFailure ? "completed" : "failed") === "completed") {
		const exitMsg = exitCode !== 0 ? `\n\n(Command exited with code ${exitCode})` : "";
		return {
			status: "completed",
			exitCode,
			exitSignal: params.exit.exitSignal,
			durationMs: params.durationMs,
			aggregated: params.aggregated + exitMsg,
			timedOut: false
		};
	}
	const failureKind = classifyExecFailureKind({
		exitReason: params.exit.reason,
		exitCode,
		isShellFailure,
		exitSignal: params.exit.exitSignal
	});
	const reason = formatExecFailureReason({
		failureKind,
		exitSignal: params.exit.exitSignal,
		timeoutSec: params.timeoutSec
	});
	return {
		status: "failed",
		exitCode: params.exit.exitCode,
		exitSignal: params.exit.exitSignal,
		durationMs: params.durationMs,
		aggregated: params.aggregated,
		timedOut: params.exit.timedOut,
		failureKind,
		reason: joinExecFailureOutput(params.aggregated, reason)
	};
}
function buildExecRuntimeErrorOutcome(params) {
	return {
		status: "failed",
		exitCode: null,
		exitSignal: null,
		durationMs: params.durationMs,
		aggregated: params.aggregated,
		timedOut: false,
		failureKind: "runtime-error",
		reason: joinExecFailureOutput(params.aggregated, String(params.error))
	};
}
/**
* Apply PATH prepends inside the shell command.
* This ensures our paths take precedence even if user RC files (e.g. ~/.zshenv)
* prepend their own entries to PATH during shell startup.
*/
function wrapPosixCommandWithPathPrepend(command, env, pathPrepend) {
	if (process.platform === "win32") return command;
	if (!pathPrepend || pathPrepend.length === 0) return command;
	const pathKey = findPathKey(env);
	const currentPath = env[pathKey];
	if (currentPath) {
		const newPath = removePathPrepend(currentPath, pathPrepend);
		if (newPath !== void 0) env[pathKey] = newPath;
	}
	env.OPENCLAW_PREPEND_PATH = pathPrepend.join(path.delimiter);
	return `export PATH="\${OPENCLAW_PREPEND_PATH}\${PATH:+:$PATH}"; unset OPENCLAW_PREPEND_PATH; ${command}`;
}
async function runExecProcess(opts) {
	const startedAt = Date.now();
	const sessionId = createSessionSlug();
	const execCommand = opts.execCommand ?? opts.command;
	const diagnosticTarget = opts.sandbox ? "sandbox" : "host";
	const supervisor = getProcessSupervisor();
	const shellRuntimeEnv = {
		...opts.env,
		OPENCLAW_SHELL: "exec"
	};
	const session = {
		id: sessionId,
		command: opts.command,
		scopeKey: opts.scopeKey,
		sessionKey: opts.sessionKey,
		mainKey: opts.mainKey,
		sessionScope: opts.sessionScope,
		eventRouting: opts.eventRouting,
		notifyDeliveryContext: normalizeDeliveryContext(opts.notifyDeliveryContext),
		notifyOnExit: opts.notifyOnExit,
		notifyOnExitEmptySuccess: opts.notifyOnExitEmptySuccess === true,
		exitNotified: false,
		child: void 0,
		stdin: void 0,
		pid: void 0,
		startedAt,
		cwd: opts.workdir,
		maxOutputChars: opts.maxOutput,
		pendingMaxOutputChars: opts.pendingMaxOutput,
		totalOutputChars: 0,
		pendingStdout: [],
		pendingStderr: [],
		pendingStdoutChars: 0,
		pendingStderrChars: 0,
		aggregated: "",
		tail: "",
		exited: false,
		exitCode: void 0,
		exitSignal: void 0,
		truncated: false,
		backgrounded: false,
		cursorKeyMode: opts.usePty ? "unknown" : "normal"
	};
	addSession(session);
	let updatesDisabled = false;
	const emitUpdate = () => {
		if (!opts.onUpdate) return;
		if (session.backgrounded || session.exited || updatesDisabled) return;
		const tailText = session.tail || session.aggregated;
		opts.onUpdate({
			content: [{
				type: "text",
				text: renderExecUpdateText({
					tailText,
					warnings: opts.warnings
				})
			}],
			details: {
				status: "running",
				sessionId,
				pid: session.pid ?? void 0,
				startedAt,
				cwd: session.cwd,
				tail: session.tail
			}
		});
	};
	const handleStdout = (data) => {
		const raw = data;
		const mode = detectCursorKeyMode(raw);
		if (mode) session.cursorKeyMode = mode;
		const str = sanitizeBinaryOutput(raw);
		for (const chunk of chunkString(str)) {
			appendOutput(session, "stdout", chunk);
			emitUpdate();
		}
	};
	const handleStderr = (data) => {
		const str = sanitizeBinaryOutput(data);
		for (const chunk of chunkString(str)) {
			appendOutput(session, "stderr", chunk);
			emitUpdate();
		}
	};
	const timeoutMs = typeof opts.timeoutSec === "number" && opts.timeoutSec > 0 ? Math.floor(opts.timeoutSec * 1e3) : void 0;
	let sandboxFinalizeToken;
	const spawnSpec = await (async () => {
		if (opts.sandbox) {
			const backendExecSpec = await opts.sandbox.buildExecSpec?.({
				command: execCommand,
				workdir: opts.containerWorkdir ?? opts.sandbox.containerWorkdir,
				env: shellRuntimeEnv,
				usePty: opts.usePty
			});
			sandboxFinalizeToken = backendExecSpec?.finalizeToken;
			return {
				mode: "child",
				argv: backendExecSpec?.argv ?? ["docker", ...buildDockerExecArgs({
					containerName: opts.sandbox.containerName,
					command: execCommand,
					workdir: opts.containerWorkdir ?? opts.sandbox.containerWorkdir,
					env: shellRuntimeEnv,
					tty: opts.usePty
				})],
				env: backendExecSpec?.env ?? process.env,
				stdinMode: backendExecSpec?.stdinMode ?? (opts.usePty ? "pipe-open" : "pipe-closed")
			};
		}
		const { shell, args: shellArgs } = getShellConfig();
		const commandWithPathPrepend = wrapPosixCommandWithPathPrepend(execCommand, shellRuntimeEnv, opts.pathPrepend);
		const childArgv = [
			shell,
			...shellArgs,
			commandWithPathPrepend
		];
		if (opts.usePty) return {
			mode: "pty",
			ptyCommand: commandWithPathPrepend,
			childFallbackArgv: childArgv,
			env: shellRuntimeEnv,
			stdinMode: "pipe-open"
		};
		return {
			mode: "child",
			argv: childArgv,
			env: shellRuntimeEnv,
			stdinMode: "pipe-closed"
		};
	})();
	let managedRun = null;
	let usingPty = spawnSpec.mode === "pty";
	const cursorResponse = buildCursorPositionResponse();
	const onSupervisorStdout = (chunk) => {
		if (usingPty) {
			const { cleaned, requests } = stripDsrRequests(chunk);
			if (requests > 0 && managedRun?.stdin) for (let i = 0; i < requests; i += 1) managedRun.stdin.write(cursorResponse);
			handleStdout(cleaned);
			return;
		}
		handleStdout(chunk);
	};
	try {
		const spawnBase = {
			runId: sessionId,
			sessionId: opts.sessionKey?.trim() || sessionId,
			backendId: opts.sandbox ? "exec-sandbox" : "exec-host",
			scopeKey: opts.scopeKey,
			cwd: opts.workdir,
			env: spawnSpec.env,
			timeoutMs,
			captureOutput: false,
			onStdout: onSupervisorStdout,
			onStderr: handleStderr
		};
		managedRun = spawnSpec.mode === "pty" ? await supervisor.spawn({
			...spawnBase,
			mode: "pty",
			ptyCommand: spawnSpec.ptyCommand
		}) : await supervisor.spawn({
			...spawnBase,
			mode: "child",
			argv: spawnSpec.argv,
			stdinMode: spawnSpec.stdinMode
		});
	} catch (err) {
		if (spawnSpec.mode === "pty") {
			const warning = `Warning: PTY spawn failed (${String(err)}); retrying without PTY for \`${opts.command}\`.`;
			logWarn(`exec: PTY spawn failed (${String(err)}); retrying without PTY for "${opts.command}".`);
			opts.warnings.push(warning);
			usingPty = false;
			try {
				managedRun = await supervisor.spawn({
					runId: sessionId,
					sessionId: opts.sessionKey?.trim() || sessionId,
					backendId: "exec-host",
					scopeKey: opts.scopeKey,
					mode: "child",
					argv: spawnSpec.childFallbackArgv,
					cwd: opts.workdir,
					env: spawnSpec.env,
					stdinMode: "pipe-open",
					timeoutMs,
					captureOutput: false,
					onStdout: handleStdout,
					onStderr: handleStderr
				});
			} catch (retryErr) {
				markExited(session, null, null, "failed");
				maybeNotifyOnExit(session, "failed");
				emitExecProcessCompleted({
					command: opts.command,
					mode: "child",
					outcome: buildExecRuntimeErrorOutcome({
						error: retryErr,
						aggregated: session.aggregated.trim(),
						durationMs: Date.now() - startedAt
					}),
					sessionKey: opts.sessionKey,
					target: diagnosticTarget
				});
				throw retryErr;
			}
		} else {
			markExited(session, null, null, "failed");
			maybeNotifyOnExit(session, "failed");
			emitExecProcessCompleted({
				command: opts.command,
				mode: spawnSpec.mode,
				outcome: buildExecRuntimeErrorOutcome({
					error: err,
					aggregated: session.aggregated.trim(),
					durationMs: Date.now() - startedAt
				}),
				sessionKey: opts.sessionKey,
				target: diagnosticTarget
			});
			throw err;
		}
	}
	session.stdin = managedRun.stdin;
	session.pid = managedRun.pid;
	const promise = managedRun.wait().then(async (exit) => {
		updatesDisabled = true;
		const durationMs = Date.now() - startedAt;
		const outcome = buildExecExitOutcome({
			exit,
			aggregated: session.aggregated.trim(),
			durationMs,
			timeoutSec: opts.timeoutSec
		});
		markExited(session, exit.exitCode, exit.exitSignal, outcome.status, exit.reason);
		maybeNotifyOnExit(session, outcome.status);
		if (!session.child && session.stdin) session.stdin.destroyed = true;
		if (opts.sandbox?.finalizeExec) await opts.sandbox.finalizeExec({
			status: outcome.status,
			exitCode: exit.exitCode ?? null,
			timedOut: exit.timedOut,
			token: sandboxFinalizeToken
		});
		emitExecProcessCompleted({
			command: opts.command,
			mode: usingPty ? "pty" : "child",
			outcome,
			sessionKey: opts.sessionKey,
			target: diagnosticTarget
		});
		return outcome;
	}).catch((err) => {
		updatesDisabled = true;
		markExited(session, null, null, "failed");
		maybeNotifyOnExit(session, "failed");
		const outcome = buildExecRuntimeErrorOutcome({
			error: err,
			aggregated: session.aggregated.trim(),
			durationMs: Date.now() - startedAt
		});
		emitExecProcessCompleted({
			command: opts.command,
			mode: usingPty ? "pty" : "child",
			outcome,
			sessionKey: opts.sessionKey,
			target: diagnosticTarget
		});
		return outcome;
	});
	return {
		session,
		startedAt,
		pid: session.pid ?? void 0,
		promise,
		kill: () => {
			managedRun?.cancel("manual-cancel");
		},
		disableUpdates: () => {
			updatesDisabled = true;
		}
	};
}
//#endregion
export { DEFAULT_PENDING_MAX_OUTPUT as a, createApprovalSlug as c, renderExecTargetLabel as d, resolveApprovalRunningNoticeMs as f, getProcessSupervisor as g, renderExecOutputText as h, DEFAULT_PATH as i, isRequestedExecTargetAllowed as l, runExecProcess as m, DEFAULT_APPROVAL_TIMEOUT_MS as n, applyShellPath as o, resolveExecTarget as p, DEFAULT_MAX_OUTPUT as r, buildApprovalPendingMessage as s, DEFAULT_APPROVAL_REQUEST_TIMEOUT_MS as t, normalizeNotifyOutput as u };
