import { s as normalizeOptionalLowercaseString } from "../string-coerce-DKw2K5wM.js";
import { i as formatErrorMessage } from "../errors-BsfWgA0I.js";
import { t as isContainerEnvironment } from "../container-environment-CNsJSTpY.js";
import { i as getRuntimeConfig } from "../io-BlARNTf3.js";
import "../config-BtNBbhZb.js";
import { a as consumeGatewaySigusr1RestartIntent, c as isGatewaySigusr1RestartExternallyAllowed, d as resetGatewayRestartStateForInProcessRestart, f as resolveGatewayRestartDeferralTimeoutMs, g as triggerOpenClawRestart, i as consumeGatewaySigusr1RestartAuthorization, l as markGatewaySigusr1RestartHandled, n as consumeGatewayRestartIntentPayloadSync, p as scheduleGatewaySigusr1Restart, r as consumeGatewayRestartIntentSync, u as peekGatewaySigusr1RestartReason } from "../restart-BMCHYmJL.js";
import { r as writeGatewayRestartHandoffSync } from "../restart-handoff-C5wAa84u.js";
import { C as reloadTaskRegistryFromStore } from "../task-registry-B2oVolww.js";
import "../runtime-internal-DvzGU0Fr.js";
import { p as writeDiagnosticStabilityBundleForFailureSync } from "../diagnostic-stability-bundle-CMXv-GFR.js";
import { c as listActiveEmbeddedRunSessionIds, l as listActiveEmbeddedRunSessionKeys, s as getActiveEmbeddedRunCount } from "../run-state-Du9_ntOI.js";
import { n as abortEmbeddedPiRun, y as waitForActiveEmbeddedRuns } from "../runs-p1TN18LG.js";
import { t as markRestartAbortedMainSessions } from "../main-session-restart-recovery-Bejz0v3y.js";
import { n as detectRespawnSupervisor } from "../supervisor-markers-DieC9r_6.js";
import { a as markUpdateRestartSentinelFailure } from "../restart-sentinel-DePW2OSL.js";
import { a as getActiveTaskCount, f as markGatewayDraining, g as waitForActiveTasks, p as resetAllLanes } from "../command-queue-fCeWoVd6.js";
import { n as getInspectableActiveTaskRestartBlockers } from "../task-registry.maintenance-BrckPBoY.js";
import { spawn } from "node:child_process";
//#region src/infra/process-respawn.ts
function isTruthy(value) {
	const normalized = normalizeOptionalLowercaseString(value);
	return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
function spawnDetachedGatewayProcess(opts = {}) {
	const args = [...process.execArgv, ...process.argv.slice(1)];
	const child = spawn(process.execPath, args, {
		env: opts.env ? {
			...process.env,
			...opts.env
		} : process.env,
		detached: true,
		stdio: "inherit"
	});
	child.unref();
	return {
		child,
		pid: child.pid ?? void 0
	};
}
/**
* Attempt to restart this process with a fresh PID.
* - supervised environments (launchd/systemd/schtasks): caller should exit and let supervisor restart
* - OPENCLAW_NO_RESPAWN=1: caller should keep in-process restart behavior (tests/dev)
* - unmanaged environments: caller should keep in-process restart behavior so
*   custom supervisors keep tracking the same gateway PID
*/
function restartGatewayProcessWithFreshPid(_opts = {}) {
	if (isTruthy(process.env.OPENCLAW_NO_RESPAWN)) return { mode: "disabled" };
	const supervisor = detectRespawnSupervisor(process.env);
	if (supervisor) {
		if (supervisor === "schtasks") {
			const restart = triggerOpenClawRestart();
			if (!restart.ok) return {
				mode: "failed",
				detail: restart.detail ?? `${restart.method} restart failed`
			};
		}
		return { mode: "supervised" };
	}
	if (process.platform === "win32") return {
		mode: "disabled",
		detail: "win32: detached respawn unsupported without Scheduled Task markers"
	};
	if (isContainerEnvironment()) return {
		mode: "disabled",
		detail: "container: use in-process restart to keep PID 1 alive"
	};
	return {
		mode: "disabled",
		detail: "unmanaged: use in-process restart to keep custom supervisor PID tracking stable"
	};
}
/**
* Update restarts must replace the OS process so the new code runs from a
* fresh module graph after package files have changed on disk.
*
* Unlike the generic restart path, update mode allows detached respawn on
* unmanaged Windows installs because there is no safe in-process fallback once
* the installed package contents have been replaced.
*/
function respawnGatewayProcessForUpdate(opts = {}) {
	if (isTruthy(process.env.OPENCLAW_NO_RESPAWN)) return {
		mode: "disabled",
		detail: "OPENCLAW_NO_RESPAWN"
	};
	const supervisor = detectRespawnSupervisor(process.env);
	if (supervisor) {
		if (supervisor === "schtasks") {
			const restart = triggerOpenClawRestart();
			if (!restart.ok) return {
				mode: "failed",
				detail: restart.detail ?? `${restart.method} restart failed`
			};
		}
		return { mode: "supervised" };
	}
	try {
		const { child, pid } = spawnDetachedGatewayProcess(opts);
		return {
			mode: "spawned",
			pid,
			child
		};
	} catch (err) {
		return {
			mode: "failed",
			detail: formatErrorMessage(err)
		};
	}
}
//#endregion
export { abortEmbeddedPiRun, consumeGatewayRestartIntentPayloadSync, consumeGatewayRestartIntentSync, consumeGatewaySigusr1RestartAuthorization, consumeGatewaySigusr1RestartIntent, detectRespawnSupervisor, getActiveEmbeddedRunCount, getActiveTaskCount, getInspectableActiveTaskRestartBlockers, getRuntimeConfig, isGatewaySigusr1RestartExternallyAllowed, listActiveEmbeddedRunSessionIds, listActiveEmbeddedRunSessionKeys, markGatewayDraining, markGatewaySigusr1RestartHandled, markRestartAbortedMainSessions, markUpdateRestartSentinelFailure, peekGatewaySigusr1RestartReason, reloadTaskRegistryFromStore, resetAllLanes, resetGatewayRestartStateForInProcessRestart, resolveGatewayRestartDeferralTimeoutMs, respawnGatewayProcessForUpdate, restartGatewayProcessWithFreshPid, scheduleGatewaySigusr1Restart, waitForActiveEmbeddedRuns, waitForActiveTasks, writeDiagnosticStabilityBundleForFailureSync, writeGatewayRestartHandoffSync };
