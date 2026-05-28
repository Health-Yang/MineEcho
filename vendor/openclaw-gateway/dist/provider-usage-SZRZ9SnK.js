import { r as clampPercent } from "./provider-usage.shared-CbVyc11B.js";
import "./provider-usage.load-BkFKp7GX.js";
//#region src/infra/provider-usage.format.ts
function formatResetRemaining(targetMs, now) {
	if (!targetMs) return null;
	const diffMs = targetMs - (now ?? Date.now());
	if (diffMs <= 0) return "now";
	const diffMins = Math.floor(diffMs / 6e4);
	if (diffMins < 60) return `${diffMins}m`;
	const hours = Math.floor(diffMins / 60);
	const mins = diffMins % 60;
	if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ${hours % 24}h`;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric"
	}).format(new Date(targetMs));
}
function formatWindowShort(window, now) {
	const remaining = clampPercent(100 - window.usedPercent);
	const reset = formatResetRemaining(window.resetAt, now);
	const resetSuffix = reset ? ` ⏱${reset}` : "";
	return `${remaining.toFixed(0)}% left (${window.label}${resetSuffix})`;
}
function formatUsageWindowSummary(snapshot, opts) {
	if (snapshot.error) return null;
	if (snapshot.windows.length === 0) return null;
	const now = opts?.now ?? Date.now();
	const maxWindows = typeof opts?.maxWindows === "number" && opts.maxWindows > 0 ? Math.min(opts.maxWindows, snapshot.windows.length) : snapshot.windows.length;
	const includeResets = opts?.includeResets ?? false;
	return snapshot.windows.slice(0, maxWindows).map((window) => {
		const remaining = clampPercent(100 - window.usedPercent);
		const reset = includeResets ? formatResetRemaining(window.resetAt, now) : null;
		const resetSuffix = reset ? ` ⏱${reset}` : "";
		return `${window.label} ${remaining.toFixed(0)}% left${resetSuffix}`;
	}).join(" · ");
}
function formatUsageSummaryLine(summary, opts) {
	const providers = summary.providers.filter((entry) => entry.windows.length > 0 && !entry.error).slice(0, opts?.maxProviders ?? summary.providers.length);
	if (providers.length === 0) return null;
	return `📊 Usage: ${providers.map((entry) => {
		const window = entry.windows.reduce((best, next) => next.usedPercent > best.usedPercent ? next : best);
		return `${entry.displayName} ${formatWindowShort(window, opts?.now)}`;
	}).join(" · ")}`;
}
function formatUsageReportLines(summary, opts) {
	if (summary.providers.length === 0) return ["Usage: no provider usage available."];
	const lines = ["Usage:"];
	for (const entry of summary.providers) {
		const planSuffix = entry.plan ? ` (${entry.plan})` : "";
		if (entry.error) {
			lines.push(`  ${entry.displayName}${planSuffix}: ${entry.error}`);
			continue;
		}
		if (entry.windows.length === 0) {
			lines.push(`  ${entry.displayName}${planSuffix}: no data`);
			continue;
		}
		lines.push(`  ${entry.displayName}${planSuffix}`);
		for (const window of entry.windows) {
			const remaining = clampPercent(100 - window.usedPercent);
			const reset = formatResetRemaining(window.resetAt, opts?.now);
			const resetSuffix = reset ? ` · resets ${reset}` : "";
			lines.push(`    ${window.label}: ${remaining.toFixed(0)}% left${resetSuffix}`);
		}
	}
	return lines;
}
//#endregion
export { formatUsageSummaryLine as n, formatUsageWindowSummary as r, formatUsageReportLines as t };
