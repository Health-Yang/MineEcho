import { i as asOptionalRecord } from "./record-coerce-Btbek4uV.js";
import { t as asFiniteNumber } from "./number-coercion-CZ-2BQ9V.js";
import { r as setSafeTimeout } from "./timer-delay-awNPCchy.js";
import { t as asBoolean } from "./boolean-CZag3-H2.js";
import { c as isNonTerminalAgentRunStatus } from "./subagent-announce-delivery-DK-Ub9gW.js";
import { a as normalizeBlockedLivenessWaitStatus, n as isAbortedAgentStopReason, t as AGENT_RUN_ABORTED_ERROR } from "./run-termination-DzoWxvjU.js";
import { s as normalizeAgentRunTimeoutPhase } from "./run-wait-DO7Iqhxb.js";
//#region src/gateway/server-methods/agent-wait-dedupe.ts
const AGENT_WAITERS_BY_RUN_ID = /* @__PURE__ */ new Map();
function parseRunIdFromDedupeKey(key) {
	if (key.startsWith("agent:")) return key.slice(6) || null;
	if (key.startsWith("chat:")) return key.slice(5) || null;
	return null;
}
function asString(value) {
	return typeof value === "string" && value.trim() ? value : void 0;
}
function removeWaiter(runId, waiter) {
	const waiters = AGENT_WAITERS_BY_RUN_ID.get(runId);
	if (!waiters) return;
	waiters.delete(waiter);
	if (waiters.size === 0) AGENT_WAITERS_BY_RUN_ID.delete(runId);
}
function addWaiter(runId, waiter) {
	const normalizedRunId = runId.trim();
	if (!normalizedRunId) return () => {};
	const existing = AGENT_WAITERS_BY_RUN_ID.get(normalizedRunId);
	if (existing) {
		existing.add(waiter);
		return () => removeWaiter(normalizedRunId, waiter);
	}
	AGENT_WAITERS_BY_RUN_ID.set(normalizedRunId, new Set([waiter]));
	return () => removeWaiter(normalizedRunId, waiter);
}
function notifyWaiters(runId) {
	const normalizedRunId = runId.trim();
	if (!normalizedRunId) return;
	const waiters = AGENT_WAITERS_BY_RUN_ID.get(normalizedRunId);
	if (!waiters || waiters.size === 0) return;
	for (const waiter of waiters) waiter();
}
function readTerminalSnapshotFromDedupeEntry(entry) {
	const payload = entry.payload;
	const status = typeof payload?.status === "string" ? payload.status : void 0;
	if (isNonTerminalAgentRunStatus(status)) return null;
	const startedAt = asFiniteNumber(payload?.startedAt);
	const endedAt = asFiniteNumber(payload?.endedAt) ?? entry.ts;
	const resultMeta = asOptionalRecord(asOptionalRecord(payload?.result)?.meta);
	const stopReason = asString(payload?.stopReason) ?? asString(resultMeta?.stopReason);
	const livenessState = asString(payload?.livenessState) ?? asString(resultMeta?.livenessState);
	const yielded = payload?.yielded === true || resultMeta?.yielded === true;
	const timeoutPhase = normalizeAgentRunTimeoutPhase(payload?.timeoutPhase) ?? normalizeAgentRunTimeoutPhase(resultMeta?.timeoutPhase);
	const providerStarted = asBoolean(payload?.providerStarted) ?? asBoolean(resultMeta?.providerStarted);
	const errorMessage = typeof payload?.error === "string" ? payload.error : typeof payload?.summary === "string" ? payload.summary : entry.error?.message;
	const abortedStopReason = isAbortedAgentStopReason(stopReason);
	const normalizedError = abortedStopReason && !errorMessage ? AGENT_RUN_ABORTED_ERROR : errorMessage;
	if (status === "ok" || status === "timeout") {
		const normalized = normalizeBlockedLivenessWaitStatus({
			status: abortedStopReason ? "error" : status,
			livenessState,
			error: normalizedError
		});
		return {
			status: normalized.status,
			startedAt,
			endedAt,
			error: normalized.status === "error" ? normalized.error : normalized.status === "timeout" ? normalizedError : void 0,
			stopReason,
			livenessState,
			...yielded ? { yielded } : {},
			...timeoutPhase ? { timeoutPhase } : {},
			...providerStarted !== void 0 ? { providerStarted } : {}
		};
	}
	if (status === "error" || !entry.ok) return {
		status: "error",
		startedAt,
		endedAt,
		error: errorMessage,
		stopReason,
		livenessState,
		...yielded ? { yielded } : {},
		...timeoutPhase ? { timeoutPhase } : {},
		...providerStarted !== void 0 ? { providerStarted } : {}
	};
	return null;
}
function readTerminalSnapshotFromGatewayDedupe(params) {
	if (params.ignoreAgentTerminalSnapshot) {
		const chatEntry = params.dedupe.get(`chat:${params.runId}`);
		if (!chatEntry) return null;
		return readTerminalSnapshotFromDedupeEntry(chatEntry);
	}
	const chatEntry = params.dedupe.get(`chat:${params.runId}`);
	const chatSnapshot = chatEntry ? readTerminalSnapshotFromDedupeEntry(chatEntry) : null;
	const agentEntry = params.dedupe.get(`agent:${params.runId}`);
	const agentSnapshot = agentEntry ? readTerminalSnapshotFromDedupeEntry(agentEntry) : null;
	if (agentEntry) {
		if (!agentSnapshot) {
			if (chatSnapshot && chatEntry && chatEntry.ts > agentEntry.ts) return chatSnapshot;
			return null;
		}
	}
	if (agentSnapshot && chatSnapshot && agentEntry && chatEntry) return chatEntry.ts > agentEntry.ts ? chatSnapshot : agentSnapshot;
	return agentSnapshot ?? chatSnapshot;
}
async function waitForTerminalGatewayDedupe(params) {
	const initial = readTerminalSnapshotFromGatewayDedupe(params);
	if (initial) return initial;
	if (params.timeoutMs <= 0 || params.signal?.aborted) return null;
	return await new Promise((resolve) => {
		let settled = false;
		let timeoutHandle;
		let onAbort;
		let removeWaiter;
		const finish = (snapshot) => {
			if (settled) return;
			settled = true;
			if (timeoutHandle) clearTimeout(timeoutHandle);
			if (onAbort) params.signal?.removeEventListener("abort", onAbort);
			removeWaiter?.();
			resolve(snapshot);
		};
		const onWake = () => {
			const snapshot = readTerminalSnapshotFromGatewayDedupe(params);
			if (snapshot) finish(snapshot);
		};
		removeWaiter = addWaiter(params.runId, onWake);
		onWake();
		if (settled) return;
		timeoutHandle = setSafeTimeout(() => finish(null), params.timeoutMs);
		timeoutHandle.unref?.();
		onAbort = () => finish(null);
		params.signal?.addEventListener("abort", onAbort, { once: true });
	});
}
function setGatewayDedupeEntry(params) {
	const existing = params.dedupe.get(params.key);
	const existingSnapshot = existing ? readTerminalSnapshotFromDedupeEntry(existing) : null;
	const incomingSnapshot = readTerminalSnapshotFromDedupeEntry(params.entry);
	if (existingSnapshot?.status === "timeout" && existingSnapshot.stopReason === "rpc") return;
	params.dedupe.set(params.key, params.entry);
	const runId = parseRunIdFromDedupeKey(params.key);
	if (!runId) return;
	if (!incomingSnapshot) return;
	notifyWaiters(runId);
}
//#endregion
export { setGatewayDedupeEntry as n, waitForTerminalGatewayDedupe as r, readTerminalSnapshotFromGatewayDedupe as t };
