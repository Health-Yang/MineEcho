import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { c as parseAgentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { Ii as ErrorCodes, Li as errorShape, Ln as validateTasksCancelParams, Rn as validateTasksGetParams, t as formatValidationErrors, zn as validateTasksListParams } from "./protocol-BkfNT2Bp.js";
import { f as listTaskRecords, s as getTaskById } from "./task-registry-B2oVolww.js";
import { a as sanitizeTaskStatusText, r as formatTaskStatusTitle } from "./task-status-2wJnWxyF.js";
import "./runtime-internal-DvzGU0Fr.js";
import { t as cancelDetachedTaskRunById } from "./detached-task-runtime-BOScrQoy.js";
//#region src/gateway/server-methods/tasks.ts
const DEFAULT_TASKS_LIST_LIMIT = 100;
const MAX_TASKS_LIST_LIMIT = 500;
const TASK_STATUS_TO_LEDGER_STATUS = {
	queued: "queued",
	running: "running",
	succeeded: "completed",
	failed: "failed",
	timed_out: "timed_out",
	cancelled: "cancelled",
	lost: "failed"
};
const LEDGER_STATUS_TO_TASK_STATUSES = {
	queued: ["queued"],
	running: ["running"],
	completed: ["succeeded"],
	failed: ["failed", "lost"],
	timed_out: ["timed_out"],
	cancelled: ["cancelled"]
};
function taskUpdatedAt(task) {
	return task.lastEventAt ?? task.endedAt ?? task.startedAt ?? task.createdAt;
}
function sanitizeOptionalTaskText(value, opts) {
	return sanitizeTaskStatusText(value, {
		errorContext: opts?.errorContext,
		maxChars: 120
	}) || void 0;
}
function mapTaskSummary(task) {
	const progressSummary = sanitizeOptionalTaskText(task.progressSummary);
	const terminalSummary = sanitizeOptionalTaskText(task.terminalSummary, { errorContext: true });
	const error = sanitizeOptionalTaskText(task.error, { errorContext: true });
	return {
		id: task.taskId,
		taskId: task.taskId,
		kind: task.taskKind ?? task.runtime,
		runtime: task.runtime,
		status: TASK_STATUS_TO_LEDGER_STATUS[task.status],
		title: formatTaskStatusTitle(task),
		...task.agentId ? { agentId: task.agentId } : {},
		sessionKey: task.requesterSessionKey,
		...task.childSessionKey ? { childSessionKey: task.childSessionKey } : {},
		ownerKey: task.ownerKey,
		...task.runId ? { runId: task.runId } : {},
		...task.parentFlowId ? { flowId: task.parentFlowId } : {},
		...task.parentTaskId ? { parentTaskId: task.parentTaskId } : {},
		...task.sourceId ? { sourceId: task.sourceId } : {},
		createdAt: task.createdAt,
		updatedAt: taskUpdatedAt(task),
		...task.startedAt !== void 0 ? { startedAt: task.startedAt } : {},
		...task.endedAt !== void 0 ? { endedAt: task.endedAt } : {},
		...progressSummary ? { progressSummary } : {},
		...terminalSummary ? { terminalSummary } : {},
		...error ? { error } : {}
	};
}
function normalizeTaskStatusFilter(status) {
	if (!status) return null;
	return new Set((Array.isArray(status) ? status : [status]).flatMap((value) => LEDGER_STATUS_TO_TASK_STATUSES[value] ?? []));
}
function taskMatchesSession(task, sessionKey) {
	const normalized = normalizeOptionalString(sessionKey);
	if (!normalized) return true;
	return [
		task.requesterSessionKey,
		task.childSessionKey,
		task.ownerKey
	].some((candidate) => normalizeOptionalString(candidate) === normalized);
}
function taskMatchesAgent(task, agentId) {
	const normalized = normalizeOptionalString(agentId);
	if (!normalized) return true;
	if (normalizeOptionalString(task.agentId) === normalized) return true;
	return [
		task.requesterSessionKey,
		task.childSessionKey,
		task.ownerKey
	].some((candidate) => parseAgentSessionKey(candidate)?.agentId === normalized);
}
function parseCursor(cursor) {
	if (!cursor) return 0;
	if (!/^\d+$/.test(cursor.trim())) return null;
	const parsed = Number(cursor);
	return Number.isSafeInteger(parsed) ? parsed : null;
}
const tasksHandlers = {
	"tasks.list": ({ params, respond }) => {
		if (!validateTasksListParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid tasks.list params: ${formatValidationErrors(validateTasksListParams.errors)}`));
			return;
		}
		const cursor = parseCursor(params.cursor);
		if (cursor === null) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid tasks.list cursor"));
			return;
		}
		const statusFilter = normalizeTaskStatusFilter(params.status);
		const limit = Math.min(params.limit ?? DEFAULT_TASKS_LIST_LIMIT, MAX_TASKS_LIST_LIMIT);
		const filtered = listTaskRecords().filter((task) => {
			if (statusFilter && !statusFilter.has(task.status)) return false;
			return taskMatchesAgent(task, params.agentId) && taskMatchesSession(task, params.sessionKey);
		});
		const page = filtered.slice(cursor, cursor + limit);
		const nextOffset = cursor + page.length;
		respond(true, {
			tasks: page.map((task) => mapTaskSummary(task)),
			...nextOffset < filtered.length ? { nextCursor: String(nextOffset) } : {}
		});
	},
	"tasks.get": ({ params, respond }) => {
		if (!validateTasksGetParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid tasks.get params: ${formatValidationErrors(validateTasksGetParams.errors)}`));
			return;
		}
		const taskId = params.taskId;
		const task = getTaskById(taskId);
		if (!task) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `task not found: ${taskId}`));
			return;
		}
		respond(true, { task: mapTaskSummary(task) });
	},
	"tasks.cancel": async ({ params, respond, context }) => {
		if (!validateTasksCancelParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid tasks.cancel params: ${formatValidationErrors(validateTasksCancelParams.errors)}`));
			return;
		}
		const taskId = params.taskId;
		const reason = normalizeOptionalString(params.reason);
		const result = await cancelDetachedTaskRunById({
			cfg: context.getRuntimeConfig(),
			taskId,
			...reason ? { reason } : {}
		});
		respond(true, {
			found: result.found,
			cancelled: result.cancelled,
			...result.reason ? { reason: result.reason } : {},
			...result.task ? { task: mapTaskSummary(result.task) } : {}
		});
	}
};
const testApi = { mapTaskSummary };
//#endregion
export { testApi as __test, testApi, tasksHandlers };
