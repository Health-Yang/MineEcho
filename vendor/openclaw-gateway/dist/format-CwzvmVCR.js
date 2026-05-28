import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { l as normalizeE164 } from "./utils-B5r0V84N.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { i as markdownToIR } from "./tables-CSTxKJa3.js";
import { t as resolveApprovalApprovers } from "./approval-approvers-DngDfOqq.js";
import { t as createResolvedApproverActionAuthAdapter } from "./approval-auth-helpers-C820KMAF.js";
import { r as renderMarkdownIRChunksWithinLimit } from "./chunk-items-CFv2WPIb.js";
import "./text-chunking-CWOBXxG4.js";
import "./text-utility-runtime-Da3iUwdt.js";
import { i as resolveSignalAccount } from "./accounts-CiPyF2G3.js";
import { d as normalizeSignalMessagingTarget, l as looksLikeUuid } from "./identity-DoC1DJz7.js";
//#region extensions/signal/src/approval-auth.ts
function normalizeSignalApproverId(value) {
	const normalized = normalizeSignalMessagingTarget(String(value));
	if (!normalized || normalized.startsWith("group:") || normalized.startsWith("username:")) return;
	if (looksLikeUuid(normalized)) return `uuid:${normalized}`;
	const e164 = normalizeE164(normalized);
	return e164.length > 1 ? e164 : void 0;
}
function getSignalApprovalApprovers(params) {
	const account = resolveSignalAccount(params).config;
	return resolveApprovalApprovers({
		allowFrom: account.allowFrom,
		defaultTo: account.defaultTo,
		normalizeApprover: normalizeSignalApproverId
	});
}
const signalApprovalAuth = createResolvedApproverActionAuthAdapter({
	channelLabel: "Signal",
	resolveApprovers: getSignalApprovalApprovers,
	normalizeSenderId: (value) => normalizeSignalApproverId(value)
});
//#endregion
//#region extensions/signal/src/format.ts
function normalizeUrlForComparison(url) {
	let normalized = normalizeLowercaseStringOrEmpty(url);
	normalized = normalized.replace(/^https?:\/\//, "");
	normalized = normalized.replace(/^www\./, "");
	normalized = normalized.replace(/\/+$/, "");
	return normalized;
}
function mapStyle(style) {
	switch (style) {
		case "bold": return "BOLD";
		case "italic": return "ITALIC";
		case "strikethrough": return "STRIKETHROUGH";
		case "code":
		case "code_block": return "MONOSPACE";
		case "spoiler": return "SPOILER";
		default: return null;
	}
}
function mergeStyles(styles) {
	const sorted = [...styles].toSorted((a, b) => {
		if (a.start !== b.start) return a.start - b.start;
		if (a.length !== b.length) return a.length - b.length;
		return a.style.localeCompare(b.style);
	});
	const merged = [];
	for (const style of sorted) {
		const prev = merged[merged.length - 1];
		if (prev && prev.style === style.style && style.start <= prev.start + prev.length) {
			const prevEnd = prev.start + prev.length;
			prev.length = Math.max(prevEnd, style.start + style.length) - prev.start;
			continue;
		}
		merged.push({ ...style });
	}
	return merged;
}
function clampStyles(styles, maxLength) {
	const clamped = [];
	for (const style of styles) {
		const start = Math.max(0, Math.min(style.start, maxLength));
		const length = Math.min(style.start + style.length, maxLength) - start;
		if (length > 0) clamped.push({
			start,
			length,
			style: style.style
		});
	}
	return clamped;
}
function applyInsertionsToStyles(spans, insertions) {
	if (insertions.length === 0) return spans;
	const sortedInsertions = [...insertions].toSorted((a, b) => a.pos - b.pos);
	let updated = spans;
	let cumulativeShift = 0;
	for (const insertion of sortedInsertions) {
		const insertionPos = insertion.pos + cumulativeShift;
		const next = [];
		for (const span of updated) {
			if (span.end <= insertionPos) {
				next.push(span);
				continue;
			}
			if (span.start >= insertionPos) {
				next.push({
					start: span.start + insertion.length,
					end: span.end + insertion.length,
					style: span.style
				});
				continue;
			}
			if (span.start < insertionPos && span.end > insertionPos) {
				if (insertionPos > span.start) next.push({
					start: span.start,
					end: insertionPos,
					style: span.style
				});
				const shiftedStart = insertionPos + insertion.length;
				const shiftedEnd = span.end + insertion.length;
				if (shiftedEnd > shiftedStart) next.push({
					start: shiftedStart,
					end: shiftedEnd,
					style: span.style
				});
			}
		}
		updated = next;
		cumulativeShift += insertion.length;
	}
	return updated;
}
function renderSignalText(ir) {
	const text = ir.text ?? "";
	if (!text) return {
		text: "",
		styles: []
	};
	const sortedLinks = [...ir.links].toSorted((a, b) => a.start - b.start);
	let out = "";
	let cursor = 0;
	const insertions = [];
	for (const link of sortedLinks) {
		if (link.start < cursor) continue;
		out += text.slice(cursor, link.end);
		const href = link.href.trim();
		const trimmedLabel = text.slice(link.start, link.end).trim();
		if (href) if (!trimmedLabel) {
			out += href;
			insertions.push({
				pos: link.end,
				length: href.length
			});
		} else {
			const normalizedLabel = normalizeUrlForComparison(trimmedLabel);
			let comparableHref = href;
			if (href.startsWith("mailto:")) comparableHref = href.slice(7);
			if (normalizedLabel !== normalizeUrlForComparison(comparableHref)) {
				const addition = ` (${href})`;
				out += addition;
				insertions.push({
					pos: link.end,
					length: addition.length
				});
			}
		}
		cursor = link.end;
	}
	out += text.slice(cursor);
	const adjusted = applyInsertionsToStyles(ir.styles.map((span) => {
		const mapped = mapStyle(span.style);
		if (!mapped) return null;
		return {
			start: span.start,
			end: span.end,
			style: mapped
		};
	}).filter((span) => span !== null), insertions);
	const trimmedText = out.trimEnd();
	const trimmedLength = trimmedText.length;
	return {
		text: trimmedText,
		styles: mergeStyles(clampStyles(adjusted.map((span) => ({
			start: span.start,
			length: span.end - span.start,
			style: span.style
		})), trimmedLength))
	};
}
function markdownToSignalText(markdown, options = {}) {
	return renderSignalText(markdownToIR(markdown ?? "", {
		linkify: true,
		enableSpoilers: true,
		headingStyle: "bold",
		blockquotePrefix: "> ",
		tableMode: options.tableMode
	}));
}
function markdownToSignalTextChunks(markdown, limit, options = {}) {
	return renderMarkdownIRChunksWithinLimit({
		ir: markdownToIR(markdown ?? "", {
			linkify: true,
			enableSpoilers: true,
			headingStyle: "bold",
			blockquotePrefix: "> ",
			tableMode: options.tableMode
		}),
		limit,
		renderChunk: renderSignalText,
		measureRendered: (rendered) => rendered.text.length
	}).map(({ rendered }) => rendered);
}
//#endregion
export { signalApprovalAuth as i, markdownToSignalTextChunks as n, getSignalApprovalApprovers as r, markdownToSignalText as t };
