import { p as scheduleGatewaySigusr1Restart } from "./restart-BMCHYmJL.js";
import { s as getActiveEmbeddedRunCount } from "./run-state-Du9_ntOI.js";
import { l as getTotalQueueSize } from "./command-queue-fCeWoVd6.js";
import { n as getInspectableActiveTaskRestartBlockers } from "./task-registry.maintenance-BrckPBoY.js";
import { t as getTotalPendingReplies } from "./dispatcher-registry-CaTZukRA.js";
//#region src/infra/restart-coordinator.ts
const defaultInspectors = {
	getQueueSize: getTotalQueueSize,
	getPendingReplies: getTotalPendingReplies,
	getEmbeddedRuns: getActiveEmbeddedRunCount,
	getActiveTasks: () => getInspectableActiveTaskRestartBlockers().length,
	getTaskBlockers: getInspectableActiveTaskRestartBlockers
};
function normalizeCount(value) {
	return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}
function formatTaskBlocker(task) {
	return [
		`taskId=${task.taskId}`,
		task.runId ? `runId=${task.runId}` : null,
		`status=${task.status}`,
		`runtime=${task.runtime}`,
		task.label ? `label=${task.label}` : null,
		task.title ? `title=${task.title.slice(0, 80)}` : null
	].filter((value) => Boolean(value)).join(" ");
}
function createFallbackTaskBlocker(count) {
	return {
		kind: "task",
		count,
		message: `${count} active background task run(s)`
	};
}
function createSafeGatewayRestartPreflight(inspectors = {}) {
	const resolved = {
		...defaultInspectors,
		...inspectors
	};
	const counts = {
		queueSize: normalizeCount(resolved.getQueueSize()),
		pendingReplies: normalizeCount(resolved.getPendingReplies()),
		embeddedRuns: normalizeCount(resolved.getEmbeddedRuns()),
		activeTasks: normalizeCount(resolved.getActiveTasks()),
		totalActive: 0
	};
	counts.totalActive = counts.queueSize + counts.pendingReplies + counts.embeddedRuns + counts.activeTasks;
	const blockers = [];
	if (counts.queueSize > 0) blockers.push({
		kind: "queue",
		count: counts.queueSize,
		message: `${counts.queueSize} queued or active operation(s)`
	});
	if (counts.pendingReplies > 0) blockers.push({
		kind: "reply",
		count: counts.pendingReplies,
		message: `${counts.pendingReplies} pending reply delivery operation(s)`
	});
	if (counts.embeddedRuns > 0) blockers.push({
		kind: "embedded-run",
		count: counts.embeddedRuns,
		message: `${counts.embeddedRuns} active embedded run(s)`
	});
	if (counts.activeTasks > 0) {
		const taskBlockers = resolved.getTaskBlockers();
		if (taskBlockers.length === 0) blockers.push(createFallbackTaskBlocker(counts.activeTasks));
		else {
			for (const task of taskBlockers.slice(0, 8)) blockers.push({
				kind: "task",
				count: 1,
				message: formatTaskBlocker(task),
				task
			});
			const omitted = counts.activeTasks - taskBlockers.length;
			if (omitted > 0) blockers.push(createFallbackTaskBlocker(omitted));
		}
	}
	const summary = blockers.length === 0 ? "safe to restart now" : `restart deferred: ${blockers.map((blocker) => blocker.message).join("; ")}`;
	return {
		safe: counts.totalActive === 0,
		counts,
		blockers,
		summary
	};
}
function requestSafeGatewayRestart(opts = {}) {
	const preflight = createSafeGatewayRestartPreflight(opts.inspect);
	const skipDeferral = opts.skipDeferral === true;
	const restart = scheduleGatewaySigusr1Restart({
		delayMs: opts.delayMs ?? 0,
		reason: opts.reason ?? "gateway.restart.safe",
		...skipDeferral ? { skipDeferral: true } : {}
	});
	return {
		ok: true,
		status: restart.coalesced ? "coalesced" : skipDeferral || preflight.safe ? "scheduled" : "deferred",
		preflight,
		restart
	};
}
//#endregion
//#region src/gateway/server-methods/restart.ts
function normalizeReason(value) {
	return typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : void 0;
}
function normalizeSkipDeferral(value) {
	return value === true;
}
const restartHandlers = {
	"gateway.restart.request": async ({ respond, params }) => {
		respond(true, requestSafeGatewayRestart({
			reason: normalizeReason(params.reason),
			delayMs: 0,
			skipDeferral: normalizeSkipDeferral(params.skipDeferral)
		}));
	},
	"gateway.restart.preflight": async ({ respond }) => {
		respond(true, createSafeGatewayRestartPreflight());
	}
};
//#endregion
export { restartHandlers };
