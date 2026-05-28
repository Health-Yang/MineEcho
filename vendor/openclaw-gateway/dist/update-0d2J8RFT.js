import { t as resolveOpenClawPackageRoot } from "./openclaw-root-CNp1Ofdk.js";
import { n as isRestartEnabled } from "./commands.flags-Jvw1brW1.js";
import { Un as validateUpdateRunParams, Wn as validateUpdateStatusParams } from "./protocol-BkfNT2Bp.js";
import { p as scheduleGatewaySigusr1Restart } from "./restart-BMCHYmJL.js";
import { t as extractDeliveryInfo } from "./delivery-info-xWCUU9hC.js";
import "./sessions-Ct4mpWsk.js";
import { n as detectRespawnSupervisor, t as SUPERVISOR_HINT_ENV_VARS } from "./supervisor-markers-DieC9r_6.js";
import { c as resolveRestartSentinelPath, d as writeRestartSentinel } from "./restart-sentinel-DePW2OSL.js";
import { s as normalizeUpdateChannel } from "./update-channels-nKAynEOl.js";
import { r as readPackageVersion } from "./package-json-Bmkl1XTP.js";
import { n as runGatewayUpdate, t as resolveUpdateInstallSurface } from "./update-runner-n4Zaugtt.js";
import { l as buildUpdateRestartSentinelPayload, r as CONTROL_PLANE_UPDATE_SENTINEL_META_ENV, t as CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON } from "./update-control-plane-sentinel-DgekYLmM.js";
import { t as MANAGED_SERVICE_UPDATE_HANDOFF_TEMP_PREFIX } from "./update-managed-service-handoff-cleanup-BKQxjJf5.js";
import { n as resolveControlPlaneActor, t as formatControlPlaneActor } from "./control-plane-audit-Ckq5Tcro.js";
import { t as assertValidParams } from "./validation-DVnDjOVK.js";
import { t as parseRestartRequestParams } from "./restart-request-BX718FK5.js";
import { n as recordLatestUpdateRestartSentinel, t as getLatestUpdateRestartSentinel } from "./server-restart-sentinel-rPilxjqy.js";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
//#region src/gateway/server-methods/update-managed-service-handoff.ts
const PARENT_EXIT_GRACE_MS = 6e4;
const SYSTEMD_RUN_CANDIDATE_PATHS = ["/usr/bin/systemd-run", "/bin/systemd-run"];
const SERVICE_IDENTITY_ENV_VARS = new Set([
	"OPENCLAW_LAUNCHD_LABEL",
	"OPENCLAW_SYSTEMD_UNIT",
	"OPENCLAW_WINDOWS_TASK_NAME"
]);
const HANDOFF_SCRIPT = String.raw`
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const params = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));

function appendLog(line) {
  try {
    fs.mkdirSync(path.dirname(params.logPath), { recursive: true, mode: 0o700 });
    fs.appendFileSync(params.logPath, "[" + new Date().toISOString() + "] " + line + "\n", {
      mode: 0o600,
    });
  } catch {
    // Best effort only.
  }
}

function isPidAlive(pid) {
  if (!pid || typeof pid !== "number") {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err && err.code === "EPERM";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanupSensitiveFiles() {
  for (const filePath of params.sensitivePaths || []) {
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // Best effort only.
    }
  }
}

function resolveExistingDirectory(candidates) {
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") {
      continue;
    }
    try {
      const stat = fs.statSync(candidate);
      if (stat.isDirectory()) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }
  return undefined;
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function writeJsonFile(filePath, value) {
  const dir = path.dirname(filePath);
  const tempPath = path.join(
    dir,
    "." + path.basename(filePath) + "." + process.pid + "." + Date.now() + ".tmp",
  );
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(tempPath, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    appendLog("failed to write update sentinel failure: " + (err && err.stack ? err.stack : String(err)));
    try {
      fs.rmSync(tempPath, { force: true });
    } catch {
      // Best effort only.
    }
  }
}

function isPendingUpdatePayload(payload) {
  const reason = payload && payload.stats && payload.stats.reason;
  return (
    payload &&
    payload.kind === "update" &&
    payload.status === "skipped" &&
    (reason === "managed-service-handoff-started" || reason === "restart-health-pending")
  );
}

function buildFallbackFailurePayload(reason) {
  const metaFile = params.metaPath ? readJsonFile(params.metaPath) : null;
  const meta = metaFile && metaFile.version === 1 && metaFile.meta ? metaFile.meta : {};
  const payload = {
    kind: "update",
    status: "error",
    ts: Date.now(),
    message: typeof meta.note === "string" ? meta.note : null,
    stats: {
      mode: "unknown",
      ...(typeof meta.handoffId === "string" && meta.handoffId.trim()
        ? { handoffId: meta.handoffId }
        : {}),
      reason,
      steps: [],
      durationMs: 0,
    },
  };
  if (typeof meta.sessionKey === "string" && meta.sessionKey.trim()) {
    payload.sessionKey = meta.sessionKey;
  }
  if (meta.deliveryContext && typeof meta.deliveryContext === "object") {
    payload.deliveryContext = meta.deliveryContext;
  }
  if (typeof meta.threadId === "string" && meta.threadId.trim()) {
    payload.threadId = meta.threadId;
  }
  return payload;
}

function markUpdateSentinelFailureIfPending(reason) {
  if (!params.sentinelPath) {
    return;
  }
  const current = readJsonFile(params.sentinelPath);
  let payload = current && current.version === 1 ? current.payload : null;
  if (payload && (payload.kind !== "update" || !isPendingUpdatePayload(payload))) {
    return;
  }
  const handoffId = typeof params.handoffId === "string" ? params.handoffId.trim() : "";
  if (payload && handoffId && (!payload.stats || payload.stats.handoffId !== handoffId)) {
    return;
  }
  if (payload) {
    payload = { ...payload, status: "error" };
    delete payload.continuation;
    payload.stats = { ...(payload.stats || {}), reason };
  } else {
    payload = buildFallbackFailurePayload(reason);
  }
  writeJsonFile(params.sentinelPath, { version: 1, payload });
}

(async () => {
  const deadline = Date.now() + params.parentExitTimeoutMs;
  while (isPidAlive(params.parentPid) && Date.now() < deadline) {
    await sleep(250);
  }
  if (isPidAlive(params.parentPid)) {
    appendLog("gateway parent pid " + params.parentPid + " did not exit before handoff timeout");
    markUpdateSentinelFailureIfPending("managed-service-handoff-parent-timeout");
    cleanupSensitiveFiles();
    process.exitCode = 1;
    return;
  }

  appendLog("starting managed update command: " + params.commandLabel);
  let outputFd;
  try {
    outputFd = fs.openSync(params.logPath, "a", 0o600);
    const commandCwd =
      resolveExistingDirectory([
        params.cwd,
        os.homedir(),
        os.tmpdir(),
        path.parse(process.execPath).root,
      ]) || params.cwd;
    if (commandCwd !== params.cwd) {
      appendLog("managed update command cwd fallback: " + params.cwd + " -> " + commandCwd);
    }
    const child = spawn(params.commandArgv[0], params.commandArgv.slice(1), {
      cwd: commandCwd,
      env: process.env,
      detached: true,
      stdio: ["ignore", outputFd, outputFd],
    });
    appendLog("managed update command pid=" + (child.pid || "unknown"));
    const exit = await new Promise((resolve) => {
      child.once("error", (err) => resolve({ error: err }));
      child.once("exit", (code, signal) => resolve({ code, signal }));
    });
    if (exit && exit.error) {
      appendLog("managed update command failed to start: " + (exit.error && exit.error.stack ? exit.error.stack : String(exit.error)));
      markUpdateSentinelFailureIfPending("managed-service-handoff-spawn-failed");
      process.exitCode = 1;
      return;
    }
    appendLog(
      "managed update command exited code=" +
        (exit && exit.code !== null && exit.code !== undefined ? exit.code : "null") +
        " signal=" +
        (exit && exit.signal ? exit.signal : "null"),
    );
    if (exit && typeof exit.code === "number" && exit.code !== 0) {
      markUpdateSentinelFailureIfPending("managed-service-handoff-failed");
      process.exitCode = exit.code;
    } else if (exit && exit.signal) {
      markUpdateSentinelFailureIfPending("managed-service-handoff-failed");
      process.exitCode = 1;
    }
  } finally {
    if (outputFd !== undefined) {
      try {
        fs.closeSync(outputFd);
      } catch {
        // Ignore close failures.
      }
    }
    cleanupSensitiveFiles();
  }
})().catch((err) => {
  appendLog("handoff failed: " + (err && err.stack ? err.stack : String(err)));
  markUpdateSentinelFailureIfPending("managed-service-handoff-helper-failed");
  cleanupSensitiveFiles();
  process.exitCode = 1;
});
`;
function isNodeLikeRuntime(execPath) {
	if (!execPath?.trim()) return false;
	const base = path.basename(execPath).toLowerCase();
	return base === "node" || base === "node.exe" || base === "bun" || base === "bun.exe";
}
function resolveUpdateCliArgv(params) {
	const updateArgs = [
		"update",
		"--yes",
		"--json"
	];
	if (typeof params.timeoutMs === "number" && Number.isFinite(params.timeoutMs)) updateArgs.push("--timeout", String(Math.max(1, Math.ceil(params.timeoutMs / 1e3))));
	const execPath = params.execPath?.trim();
	const argv1 = params.argv1?.trim();
	if (execPath && argv1) return [
		execPath,
		argv1,
		...updateArgs
	];
	if (execPath && !isNodeLikeRuntime(execPath)) return [execPath, ...updateArgs];
	return ["openclaw", ...updateArgs];
}
function formatManagedServiceUpdateCommand(timeoutMs) {
	const args = [
		"openclaw",
		"update",
		"--yes"
	];
	if (typeof timeoutMs === "number" && Number.isFinite(timeoutMs)) args.push("--timeout", String(Math.max(1, Math.ceil(timeoutMs / 1e3))));
	return args.join(" ");
}
function stripSupervisorHintEnv(env) {
	const next = { ...env };
	for (const key of SUPERVISOR_HINT_ENV_VARS) {
		if (SERVICE_IDENTITY_ENV_VARS.has(key)) continue;
		delete next[key];
	}
	return next;
}
async function resolveManagedServiceHandoffCwd(root) {
	const candidates = [
		os.homedir(),
		os.tmpdir(),
		path.dirname(process.execPath),
		root
	];
	for (const candidate of candidates) {
		if (!candidate.trim()) continue;
		try {
			if ((await fs.stat(candidate)).isDirectory()) return candidate;
		} catch {}
	}
	return root;
}
async function resolveExecutableOnPath(name, env, fallbackPaths) {
	const candidates = /* @__PURE__ */ new Set();
	const pathValue = env.PATH?.trim();
	if (pathValue) {
		for (const dir of pathValue.split(path.delimiter)) if (dir.trim()) candidates.add(path.join(dir, name));
	}
	for (const candidate of fallbackPaths) candidates.add(candidate);
	for (const candidate of candidates) try {
		await fs.access(candidate, fs.constants.X_OK);
		return candidate;
	} catch {}
	return null;
}
function sanitizeSystemdUnitFragment(value) {
	return (value?.trim().replace(/[^A-Za-z0-9_.:@-]+/gu, "-") ?? "").replace(/^-+|-+$/gu, "").slice(0, 80);
}
function buildSystemdHandoffUnitName(handoffId) {
	return `openclaw-update-${sanitizeSystemdUnitFragment(handoffId) || sanitizeSystemdUnitFragment(`${process.pid}-${Date.now()}`) || "handoff"}.scope`;
}
async function resolveHandoffSpawn(params) {
	if (params.supervisor !== "systemd") return {
		command: params.execPath,
		args: [params.scriptPath, params.paramsPath]
	};
	const systemdRunPath = await resolveExecutableOnPath("systemd-run", params.env, SYSTEMD_RUN_CANDIDATE_PATHS);
	if (!systemdRunPath) throw new Error("systemd-run is required to start the managed update handoff outside openclaw-gateway.service");
	return {
		command: systemdRunPath,
		args: [
			"--user",
			"--scope",
			"--collect",
			`--unit=${buildSystemdHandoffUnitName(params.handoffId)}`,
			params.execPath,
			params.scriptPath,
			params.paramsPath
		]
	};
}
async function startManagedServiceUpdateHandoff(params) {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), MANAGED_SERVICE_UPDATE_HANDOFF_TEMP_PREFIX));
	const scriptPath = path.join(dir, "handoff.cjs");
	const paramsPath = path.join(dir, "handoff.json");
	const metaPath = path.join(dir, "sentinel-meta.json");
	const logPath = path.join(dir, "handoff.log");
	const commandArgv = resolveUpdateCliArgv({
		timeoutMs: params.timeoutMs,
		execPath: params.execPath ?? process.execPath,
		argv1: params.argv1 ?? process.argv[1]
	});
	const commandLabel = formatManagedServiceUpdateCommand(params.timeoutMs);
	const handoffCwd = await resolveManagedServiceHandoffCwd(params.root);
	const metaFile = {
		version: 1,
		meta: params.meta
	};
	const helperParams = {
		parentPid: params.parentPid ?? process.pid,
		parentExitTimeoutMs: Math.max(0, params.restartDelayMs ?? 0) + PARENT_EXIT_GRACE_MS,
		cwd: handoffCwd,
		commandArgv,
		commandLabel,
		handoffId: params.handoffId,
		logPath,
		metaPath,
		sentinelPath: resolveRestartSentinelPath(),
		sensitivePaths: [
			scriptPath,
			paramsPath,
			metaPath
		]
	};
	await fs.writeFile(scriptPath, `${HANDOFF_SCRIPT}\n`, { mode: 448 });
	await fs.writeFile(paramsPath, `${JSON.stringify(helperParams, null, 2)}\n`, { mode: 384 });
	await fs.writeFile(metaPath, `${JSON.stringify(metaFile, null, 2)}\n`, { mode: 384 });
	const env = {
		...stripSupervisorHintEnv(params.env ?? process.env),
		[CONTROL_PLANE_UPDATE_SENTINEL_META_ENV]: metaPath,
		OPENCLAW_UPDATE_RUN_HANDOFF: "1"
	};
	const spawnTarget = await resolveHandoffSpawn({
		supervisor: params.supervisor,
		env,
		execPath: params.execPath ?? process.execPath,
		scriptPath,
		paramsPath,
		handoffId: params.handoffId
	});
	const child = spawn(spawnTarget.command, spawnTarget.args, {
		cwd: handoffCwd,
		env,
		detached: true,
		stdio: "ignore"
	});
	child.unref();
	return {
		status: "started",
		...child.pid ? { pid: child.pid } : {},
		command: commandLabel,
		logPath
	};
}
function buildManagedServiceHandoffUnavailableMessage(command) {
	return ["Package updates cannot safely run inside the live gateway process.", `Run \`${command}\` from a shell outside the gateway service, or restart/update from the host control plane.`].join("\n");
}
//#endregion
//#region src/gateway/server-methods/update.ts
const SYSTEMD_HANDOFF_RESTART_GRACE_MS = 2e3;
function formatUpdateRunErrorMessage(err) {
	if (err instanceof Error) return err.message || err.name;
	return String(err);
}
function tryResolveProcessCwd() {
	try {
		return process.cwd();
	} catch {
		return;
	}
}
function resolveManagedServiceHandoffRestartDelayMs(restartDelayMs, supervisor) {
	if (supervisor !== "systemd") return restartDelayMs;
	return Math.max(restartDelayMs ?? SYSTEMD_HANDOFF_RESTART_GRACE_MS, SYSTEMD_HANDOFF_RESTART_GRACE_MS);
}
const updateHandlers = {
	"update.status": async ({ params, respond }) => {
		if (!assertValidParams(params, validateUpdateStatusParams, "update.status", respond)) return;
		respond(true, { sentinel: getLatestUpdateRestartSentinel() });
	},
	"update.run": async ({ params, respond, client, context }) => {
		if (!assertValidParams(params, validateUpdateRunParams, "update.run", respond)) return;
		const actor = resolveControlPlaneActor(client);
		const { sessionKey, deliveryContext: requestedDeliveryContext, threadId: requestedThreadId, note, continuationMessage, restartDelayMs } = parseRestartRequestParams(params);
		const { deliveryContext: sessionDeliveryContext, threadId: sessionThreadId } = extractDeliveryInfo(sessionKey);
		const deliveryContext = requestedDeliveryContext ?? sessionDeliveryContext;
		const threadId = requestedThreadId ?? sessionThreadId;
		const timeoutMsRaw = params.timeoutMs;
		const timeoutMs = typeof timeoutMsRaw === "number" && Number.isFinite(timeoutMsRaw) ? Math.max(1e3, Math.floor(timeoutMsRaw)) : void 0;
		let result;
		let handoff = null;
		const sentinelMeta = {
			...sessionKey ? { sessionKey } : {},
			...deliveryContext ? { deliveryContext } : {},
			...threadId ? { threadId } : {},
			...note !== void 0 ? { note } : {},
			...continuationMessage !== void 0 ? { continuationMessage } : {}
		};
		let supervisor = null;
		try {
			const config = context.getRuntimeConfig();
			const configChannel = normalizeUpdateChannel(config.update?.channel);
			const invocationCwd = tryResolveProcessCwd();
			const root = await resolveOpenClawPackageRoot({
				moduleUrl: import.meta.url,
				argv1: process.argv[1],
				...invocationCwd ? { cwd: invocationCwd } : {}
			}) ?? invocationCwd ?? os.homedir();
			const installSurface = await resolveUpdateInstallSurface({
				timeoutMs,
				cwd: root,
				argv1: process.argv[1]
			});
			supervisor = detectRespawnSupervisor(process.env, process.platform);
			if (!isRestartEnabled(config) && !supervisor) {
				const beforeVersion = installSurface.root ? await readPackageVersion(installSurface.root) : null;
				result = {
					status: "skipped",
					mode: installSurface.mode,
					...installSurface.root ? { root: installSurface.root } : {},
					reason: installSurface.kind === "global" ? "restart-unavailable" : "restart-disabled",
					...beforeVersion ? { before: { version: beforeVersion } } : {},
					steps: [],
					durationMs: 0
				};
			} else if (installSurface.kind === "global") {
				const command = formatManagedServiceUpdateCommand(timeoutMs);
				if (supervisor) try {
					const startedAt = Date.now();
					const handoffId = randomUUID();
					sentinelMeta.handoffId = handoffId;
					const started = await startManagedServiceUpdateHandoff({
						root,
						timeoutMs,
						restartDelayMs,
						meta: sentinelMeta,
						handoffId,
						supervisor
					});
					handoff = {
						status: "started",
						...started.pid ? { pid: started.pid } : {},
						command: started.command
					};
					const beforeVersion = installSurface.root ? await readPackageVersion(installSurface.root) : null;
					result = {
						status: "skipped",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: CONTROL_PLANE_UPDATE_HANDOFF_STARTED_REASON,
						...beforeVersion ? { before: { version: beforeVersion } } : {},
						steps: [{
							name: "managed-service update handoff",
							command: started.command,
							cwd: root,
							durationMs: Date.now() - startedAt,
							exitCode: null
						}],
						durationMs: Date.now() - startedAt
					};
				} catch (err) {
					context?.logGateway?.warn(`update.run managed-service handoff failed ${formatControlPlaneActor(actor)} error=${formatUpdateRunErrorMessage(err)}`);
					result = {
						status: "error",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: "managed-service-handoff-failed",
						steps: [],
						durationMs: 0
					};
				}
				else {
					const beforeVersion = installSurface.root ? await readPackageVersion(installSurface.root) : null;
					handoff = {
						status: "unavailable",
						command,
						message: buildManagedServiceHandoffUnavailableMessage(command)
					};
					result = {
						status: "skipped",
						mode: installSurface.mode,
						root: installSurface.root,
						reason: "managed-service-handoff-unavailable",
						...beforeVersion ? { before: { version: beforeVersion } } : {},
						steps: [],
						durationMs: 0
					};
				}
			} else result = await runGatewayUpdate({
				timeoutMs,
				cwd: root,
				argv1: process.argv[1],
				channel: configChannel ?? void 0
			});
		} catch {
			result = {
				status: "error",
				mode: "unknown",
				reason: "unexpected-error",
				steps: [],
				durationMs: 0
			};
		}
		const payload = buildUpdateRestartSentinelPayload({
			result,
			meta: sentinelMeta
		});
		let sentinelPath = null;
		try {
			sentinelPath = await writeRestartSentinel(payload);
			recordLatestUpdateRestartSentinel(payload);
		} catch {
			sentinelPath = null;
		}
		const updateWasPackageSwap = result.status === "ok" && result.mode !== "git";
		const restart = handoff?.status === "started" || result.status === "ok" ? scheduleGatewaySigusr1Restart({
			delayMs: handoff?.status === "started" ? resolveManagedServiceHandoffRestartDelayMs(restartDelayMs, supervisor) : updateWasPackageSwap ? 0 : restartDelayMs,
			reason: "update.run",
			skipDeferral: updateWasPackageSwap || handoff?.status === "started",
			skipCooldown: updateWasPackageSwap || handoff?.status === "started",
			audit: {
				actor: actor.actor,
				deviceId: actor.deviceId,
				clientIp: actor.clientIp,
				changedPaths: []
			}
		}) : null;
		context?.logGateway?.info(`update.run completed ${formatControlPlaneActor(actor)} changedPaths=<n/a> restartReason=update.run status=${result.status}`);
		if (restart?.coalesced) context?.logGateway?.warn(`update.run restart coalesced ${formatControlPlaneActor(actor)} delayMs=${restart.delayMs}`);
		respond(true, {
			ok: result.status === "ok" || handoff?.status === "started",
			result,
			...handoff ? { handoff } : {},
			restart,
			sentinel: {
				path: sentinelPath,
				payload
			}
		}, void 0);
	}
};
//#endregion
export { updateHandlers };
