import { V as formatMemoryDreamingDay } from "./dreaming-DT202ka-.js";
import "./memory-core-host-status-CZR2A80t.js";
import { n as appendMemoryHostEvent } from "./events-CF3L1QFD.js";
import "./memory-host-events-DX6lDtXv.js";
import { n as withTrailingNewline, t as replaceManagedMarkdownBlock } from "./memory-host-markdown-BiLGKFxW.js";
import path from "node:path";
import fs from "node:fs/promises";
//#region extensions/memory-core/src/dreaming-markdown.ts
const DAILY_PHASE_HEADINGS = {
	light: "## Light Sleep",
	rem: "## REM Sleep"
};
const DAILY_PHASE_LABELS = {
	light: "light",
	rem: "rem"
};
function resolvePhaseMarkers(phase) {
	const label = DAILY_PHASE_LABELS[phase];
	return {
		start: `<!-- openclaw:dreaming:${label}:start -->`,
		end: `<!-- openclaw:dreaming:${label}:end -->`
	};
}
function resolveDailyMemoryPath(workspaceDir, epochMs, timezone) {
	const isoDay = formatMemoryDreamingDay(epochMs, timezone);
	return path.join(workspaceDir, "memory", `${isoDay}.md`);
}
function resolveSeparateReportPath(workspaceDir, phase, epochMs, timezone) {
	const isoDay = formatMemoryDreamingDay(epochMs, timezone);
	return path.join(workspaceDir, "memory", "dreaming", phase, `${isoDay}.md`);
}
function shouldWriteInline(storage) {
	return storage.mode === "inline" || storage.mode === "both";
}
function shouldWriteSeparate(storage) {
	return storage.mode === "separate" || storage.mode === "both" || storage.separateReports;
}
async function writeDailyDreamingPhaseBlock(params) {
	const nowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
	const body = params.bodyLines.length > 0 ? params.bodyLines.join("\n") : "- No notable updates.";
	let inlinePath;
	let reportPath;
	if (shouldWriteInline(params.storage)) {
		inlinePath = resolveDailyMemoryPath(params.workspaceDir, nowMs, params.timezone);
		await fs.mkdir(path.dirname(inlinePath), { recursive: true });
		const original = await fs.readFile(inlinePath, "utf-8").catch((err) => {
			if (err?.code === "ENOENT") return "";
			throw err;
		});
		const markers = resolvePhaseMarkers(params.phase);
		const updated = replaceManagedMarkdownBlock({
			original,
			heading: DAILY_PHASE_HEADINGS[params.phase],
			startMarker: markers.start,
			endMarker: markers.end,
			body
		});
		await fs.writeFile(inlinePath, withTrailingNewline(updated), "utf-8");
	}
	if (shouldWriteSeparate(params.storage)) {
		reportPath = resolveSeparateReportPath(params.workspaceDir, params.phase, nowMs, params.timezone);
		await fs.mkdir(path.dirname(reportPath), { recursive: true });
		const report = [
			`# ${params.phase === "light" ? "Light Sleep" : "REM Sleep"}`,
			"",
			body,
			""
		].join("\n");
		await fs.writeFile(reportPath, report, "utf-8");
	}
	await appendMemoryHostEvent(params.workspaceDir, {
		type: "memory.dream.completed",
		timestamp: new Date(nowMs).toISOString(),
		phase: params.phase,
		...inlinePath ? { inlinePath } : {},
		...reportPath ? { reportPath } : {},
		lineCount: params.bodyLines.length,
		storageMode: params.storage.mode
	});
	return {
		...inlinePath ? { inlinePath } : {},
		...reportPath ? { reportPath } : {}
	};
}
async function writeDeepDreamingReport(params) {
	if (!shouldWriteSeparate(params.storage)) return;
	const nowMs = Number.isFinite(params.nowMs) ? params.nowMs : Date.now();
	const reportPath = resolveSeparateReportPath(params.workspaceDir, "deep", nowMs, params.timezone);
	await fs.mkdir(path.dirname(reportPath), { recursive: true });
	const body = params.bodyLines.length > 0 ? params.bodyLines.join("\n") : "- No durable changes.";
	await fs.writeFile(reportPath, `# Deep Sleep\n\n${body}\n`, "utf-8");
	await appendMemoryHostEvent(params.workspaceDir, {
		type: "memory.dream.completed",
		timestamp: new Date(nowMs).toISOString(),
		phase: "deep",
		reportPath,
		lineCount: params.bodyLines.length,
		storageMode: params.storage.mode
	});
	return reportPath;
}
//#endregion
export { writeDeepDreamingReport as n, writeDailyDreamingPhaseBlock as t };
