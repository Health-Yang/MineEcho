import { t as resolveEffectiveTaskCleanupAfter } from "./task-retention-DxawMBrm.js";
import { n as createEmptyTaskAuditSummary, t as compareTaskAuditFindingSortKeys } from "./task-registry.audit.shared-CycXrHpp.js";
//#region src/tasks/task-registry.audit.ts
const DEFAULT_STALE_QUEUED_MS = 10 * 6e4;
const DEFAULT_STALE_RUNNING_MS = 30 * 6e4;
let taskAuditTaskProvider = () => [];
function configureTaskAuditTaskProvider(provider) {
	taskAuditTaskProvider = provider;
}
function createFinding(params) {
	return {
		severity: params.severity,
		code: params.code,
		task: params.task,
		detail: params.detail,
		...typeof params.ageMs === "number" ? { ageMs: params.ageMs } : {}
	};
}
function taskReferenceAt(task) {
	return task.lastEventAt ?? task.startedAt ?? task.createdAt;
}
function findTimestampInconsistency(task) {
	if (task.startedAt && task.startedAt < task.createdAt) return createFinding({
		severity: "warn",
		code: "inconsistent_timestamps",
		task,
		detail: "startedAt is earlier than createdAt"
	});
	if (task.endedAt && task.startedAt && task.endedAt < task.startedAt) return createFinding({
		severity: "warn",
		code: "inconsistent_timestamps",
		task,
		detail: "endedAt is earlier than startedAt"
	});
	if ((task.status === "queued" || task.status === "running") && task.endedAt) return createFinding({
		severity: "warn",
		code: "inconsistent_timestamps",
		task,
		detail: `${task.status} task should not already have endedAt`
	});
	return null;
}
function compareFindings(left, right) {
	return compareTaskAuditFindingSortKeys({
		severity: left.severity,
		ageMs: left.ageMs,
		createdAt: left.task.createdAt
	}, {
		severity: right.severity,
		ageMs: right.ageMs,
		createdAt: right.task.createdAt
	});
}
function listTaskAuditFindings(options = {}) {
	const tasks = options.tasks ?? taskAuditTaskProvider();
	const now = options.now ?? Date.now();
	const staleQueuedMs = options.staleQueuedMs ?? DEFAULT_STALE_QUEUED_MS;
	const staleRunningMs = options.staleRunningMs ?? DEFAULT_STALE_RUNNING_MS;
	const findings = [];
	for (const task of tasks) {
		const referenceAt = taskReferenceAt(task);
		const ageMs = Math.max(0, now - referenceAt);
		if (task.status === "queued" && ageMs >= staleQueuedMs) findings.push(createFinding({
			severity: "warn",
			code: "stale_queued",
			task,
			ageMs,
			detail: "queued task has not advanced recently"
		}));
		if (task.status === "running" && ageMs >= staleRunningMs) findings.push(createFinding({
			severity: "error",
			code: "stale_running",
			task,
			ageMs,
			detail: "running task appears stuck"
		}));
		if (task.status === "lost") {
			const retainedUntilCleanup = typeof task.cleanupAfter === "number" && resolveEffectiveTaskCleanupAfter(task) > now;
			findings.push(createFinding({
				severity: retainedUntilCleanup ? "warn" : "error",
				code: "lost",
				task,
				ageMs,
				detail: retainedUntilCleanup ? task.error?.trim() || "task lost its backing session and is retained until cleanupAfter" : task.error?.trim() || "task lost its backing session"
			}));
		}
		if (task.deliveryStatus === "failed" && task.notifyPolicy !== "silent") findings.push(createFinding({
			severity: "warn",
			code: "delivery_failed",
			task,
			ageMs,
			detail: "terminal update delivery failed"
		}));
		if (task.status !== "lost" && task.status !== "queued" && task.status !== "running" && typeof task.cleanupAfter !== "number") findings.push(createFinding({
			severity: "warn",
			code: "missing_cleanup",
			task,
			ageMs,
			detail: "terminal task is missing cleanupAfter"
		}));
		const inconsistency = findTimestampInconsistency(task);
		if (inconsistency) findings.push(inconsistency);
	}
	return findings.toSorted(compareFindings);
}
function isRetainedLostTaskAuditFinding(finding, now = Date.now()) {
	const cleanupAfter = resolveEffectiveTaskCleanupAfter(finding.task);
	return finding.code === "lost" && finding.task.status === "lost" && typeof finding.task.cleanupAfter === "number" && cleanupAfter > now;
}
function summarizeTaskAuditFindings(findings) {
	const summary = createEmptyTaskAuditSummary();
	for (const finding of findings) {
		summary.total += 1;
		summary.byCode[finding.code] += 1;
		if (finding.severity === "error") summary.errors += 1;
		else summary.warnings += 1;
	}
	return summary;
}
function summarizeActionableTaskAuditFindings(findings, options = {}) {
	const now = options.now ?? Date.now();
	return summarizeTaskAuditFindings(Array.from(findings).filter((finding) => !isRetainedLostTaskAuditFinding(finding, now)));
}
function summarizeRetainedLostTaskAuditFindings(findings, options = {}) {
	const now = options.now ?? Date.now();
	let count = 0;
	let nextCleanupAfter;
	for (const finding of findings) {
		if (!isRetainedLostTaskAuditFinding(finding, now)) continue;
		count += 1;
		const cleanupAfter = resolveEffectiveTaskCleanupAfter(finding.task);
		if (typeof cleanupAfter === "number" && (nextCleanupAfter === void 0 || cleanupAfter < nextCleanupAfter)) nextCleanupAfter = cleanupAfter;
	}
	return {
		count,
		...nextCleanupAfter !== void 0 ? { nextCleanupAfter } : {}
	};
}
//#endregion
export { summarizeTaskAuditFindings as a, summarizeRetainedLostTaskAuditFindings as i, listTaskAuditFindings as n, summarizeActionableTaskAuditFindings as r, configureTaskAuditTaskProvider as t };
