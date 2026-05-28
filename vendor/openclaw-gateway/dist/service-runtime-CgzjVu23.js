import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
//#region src/infra/runtime-status.ts
function formatRuntimeStatusWithDetails({ status, pid, state, details = [] }) {
	const runtimeStatus = status?.trim() || "unknown";
	const fullDetails = [];
	if (pid) fullDetails.push(`pid ${pid}`);
	const normalizedState = state?.trim();
	if (normalizedState && normalizeLowercaseStringOrEmpty(normalizedState) !== normalizeLowercaseStringOrEmpty(runtimeStatus)) fullDetails.push(`state ${normalizedState}`);
	for (const detail of details) {
		const normalizedDetail = detail.trim();
		if (normalizedDetail) fullDetails.push(normalizedDetail);
	}
	return fullDetails.length > 0 ? `${runtimeStatus} (${fullDetails.join(", ")})` : runtimeStatus;
}
function isRiskySystemdKillMode(value) {
	const normalized = normalizeLowercaseStringOrEmpty(value);
	return normalized === "process" || normalized === "none";
}
function formatBytesAsGiB(value) {
	const gib = value / 1024 / 1024 / 1024;
	const formatted = gib >= 1 ? gib.toFixed(1).replace(/\.0$/, "") : `${value}B`;
	return gib >= 1 ? `${formatted}GiB` : formatted;
}
function describeSystemdCgroupLoadWarnings(runtime) {
	if (!runtime) return [];
	const killMode = runtime?.killMode;
	if (!isRiskySystemdKillMode(killMode)) return [];
	const details = [];
	if (runtime.tasksCurrent !== void 0 && Number.isSafeInteger(runtime.tasksCurrent) && runtime.tasksCurrent >= 200) details.push(`tasks=${runtime.tasksCurrent}`);
	if (runtime.memoryCurrent !== void 0 && Number.isSafeInteger(runtime.memoryCurrent) && runtime.memoryCurrent >= 2147483648) details.push(`memory=${formatBytesAsGiB(runtime.memoryCurrent)}`);
	return details;
}
function getSystemdCgroupHygieneSummary(runtime) {
	if (!runtime || !runtime.killMode) return null;
	const details = describeSystemdCgroupLoadWarnings(runtime);
	if (details.length === 0) return null;
	return `cgroup hygiene: KillMode=${runtime.killMode}, ${details.join(", ")}`;
}
function isSystemdCgroupHygieneRisk(runtime) {
	return getSystemdCgroupHygieneSummary(runtime) !== null;
}
//#endregion
export { isSystemdCgroupHygieneRisk as n, formatRuntimeStatusWithDetails as r, getSystemdCgroupHygieneSummary as t };
