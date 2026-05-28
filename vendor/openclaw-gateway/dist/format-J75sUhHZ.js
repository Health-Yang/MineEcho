import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { i as markdownToIR, n as renderMarkdownWithMarkers } from "./tables-CSTxKJa3.js";
import { r as renderMarkdownIRChunksWithinLimit } from "./chunk-items-CFv2WPIb.js";
import { n as isAutoLinkedFileRef, t as FILE_REF_EXTENSIONS_WITH_TLD } from "./auto-linked-file-ref-Uv6kgYfd.js";
import "./text-chunking-CWOBXxG4.js";
//#region extensions/telegram/src/format.ts
function escapeTelegramHtml(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeHtml(text) {
	return escapeTelegramHtml(text);
}
function escapeHtmlAttr(text) {
	return escapeHtml(text).replace(/"/g, "&quot;");
}
/**
* File extensions that share TLDs and commonly appear in code/documentation.
* These are wrapped in <code> tags to prevent Telegram from generating
* spurious domain registrar previews.
*
* Only includes extensions that are:
* 1. Commonly used as file extensions in code/docs
* 2. Rarely used as intentional domain references
*
* Excluded: .ai, .io, .tv, .fm (popular domain TLDs like x.ai, vercel.io, github.io)
*/
function buildTelegramLink(link, text) {
	const href = link.href.trim();
	if (!href) return null;
	if (link.start === link.end) return null;
	if (isAutoLinkedFileRef(href, text.slice(link.start, link.end))) return null;
	const safeHref = escapeHtmlAttr(href);
	return {
		start: link.start,
		end: link.end,
		open: `<a href="${safeHref}">`,
		close: "</a>"
	};
}
function buildTelegramCodeBlockOpen(span) {
	if (!span.language) return "<pre><code>";
	return `<pre><code class="language-${escapeHtmlAttr(span.language)}">`;
}
function renderTelegramHtml(ir) {
	return renderMarkdownWithMarkers(ir, {
		styleMarkers: {
			bold: {
				open: "<b>",
				close: "</b>"
			},
			italic: {
				open: "<i>",
				close: "</i>"
			},
			strikethrough: {
				open: "<s>",
				close: "</s>"
			},
			code: {
				open: "<code>",
				close: "</code>"
			},
			code_block: {
				open: buildTelegramCodeBlockOpen,
				close: "</code></pre>"
			},
			spoiler: {
				open: "<tg-spoiler>",
				close: "</tg-spoiler>"
			},
			blockquote: {
				open: "<blockquote>",
				close: "</blockquote>"
			}
		},
		escapeText: escapeHtml,
		buildLink: buildTelegramLink
	});
}
function leadingWhitespaceLength(line) {
	let length = 0;
	while (line[length] === " " || line[length] === "	") length++;
	return length;
}
function isTelegramBulletLine(line) {
	return /^[ \t]*(?:[•*+-])[ \t]+\S/.test(line);
}
function isTelegramListBoundaryLine(line) {
	return /^[ \t]*(?:\d+\.|#{1,6})[ \t]+\S/.test(line);
}
function isMarkdownIndentedCodeLine(line) {
	return /^(?: {4}|\t)/.test(line);
}
function shouldPreserveTelegramListBoundarySpacing(previous, next) {
	return !isMarkdownIndentedCodeLine(previous) && !isMarkdownIndentedCodeLine(next) && isTelegramBulletLine(previous) && isTelegramListBoundaryLine(next) && leadingWhitespaceLength(next) <= leadingWhitespaceLength(previous);
}
function preserveTelegramListBoundarySpacing(markdown) {
	const lines = markdown.split("\n");
	const out = [];
	let inFence = false;
	let previousLine = "";
	for (const line of lines) {
		const normalizedLine = line.replace(/\r$/, "");
		const isFenceLine = /^[ \t]*(?:```|~~~)/.test(normalizedLine);
		if (!inFence && shouldPreserveTelegramListBoundarySpacing(previousLine, normalizedLine)) out.push("");
		out.push(line);
		if (isFenceLine) inFence = !inFence;
		previousLine = normalizedLine;
	}
	return out.join("\n");
}
function markdownToTelegramHtml(markdown, options = {}) {
	const telegramHtml = preserveSupportedTelegramHtmlTags(renderTelegramHtml(markdownToIR(preserveTelegramListBoundarySpacing(markdown ?? ""), {
		linkify: true,
		enableSpoilers: true,
		headingStyle: "none",
		blockquotePrefix: "",
		tableMode: options.tableMode
	})));
	if (options.wrapFileRefs !== false) return wrapFileReferencesInHtml(telegramHtml);
	return telegramHtml;
}
/**
* Wraps standalone file references (with TLD extensions) in <code> tags.
* This prevents Telegram from treating them as URLs and generating
* irrelevant domain registrar previews.
*
* Runs AFTER markdown→HTML conversion to avoid modifying HTML attributes.
* Skips content inside <code>, <pre>, and <a> tags to avoid nesting issues.
*/
/** Escape regex metacharacters in a string */
function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const AUTO_LINKED_ANCHOR_PATTERN = /<a\s+href="https?:\/\/([^"]+)"[^>]*>\1<\/a>/gi;
const HTML_TAG_PATTERN = /(<\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?>/gi;
const HTML_MODE_TAG_PATTERN = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^<>]*)>$/;
const ESCAPED_HTML_TAG_PATTERN = /&lt;(\/?)([a-zA-Z][a-zA-Z0-9-]*)(.*?)&gt;/g;
const TELEGRAM_HTML_ANCHOR_PATTERN = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi;
const TELEGRAM_HTML_BREAK_PATTERN = /<br\s*\/?>/gi;
const TELEGRAM_HTML_ENTITY_PATTERN = /&(#x[0-9A-Fa-f]+|#\d+|amp|lt|gt|quot|apos);/g;
const TELEGRAM_HTML_TAG_PATTERN = /<[^>]*>/g;
const TELEGRAM_SIMPLE_HTML_TAGS = new Set([
	"b",
	"strong",
	"i",
	"em",
	"u",
	"ins",
	"s",
	"strike",
	"del",
	"code",
	"pre",
	"tg-spoiler",
	"blockquote"
]);
const TELEGRAM_ATTR_HTML_TAG_PATTERNS = new Map([
	["a", /^\s+href="[^"]+"\s*$/],
	["span", /^\s+class="tg-spoiler"\s*$/],
	["tg-emoji", /^\s+emoji-id="[^"]+"\s*$/],
	["tg-time", /^\s+datetime="[^"]+"\s*$/]
]);
const TELEGRAM_CODE_LANGUAGE_ATTR_PATTERN = /^\s+class="language-[^"]+"\s*$/;
let fileReferencePattern;
let orphanedTldPattern;
function popLastTagName(tags, name) {
	for (let index = tags.length - 1; index >= 0; index -= 1) if (tags[index] === name) {
		tags.splice(index, 1);
		return true;
	}
	return false;
}
function isSupportedTelegramHtmlTag(rawTag) {
	const match = HTML_MODE_TAG_PATTERN.exec(rawTag);
	if (!match) return false;
	const closing = match[1] === "/";
	const name = normalizeLowercaseStringOrEmpty(match[2]);
	const attrs = match[3] ?? "";
	if (TELEGRAM_SIMPLE_HTML_TAGS.has(name)) return attrs.trim() === "";
	if (closing) return attrs.trim() === "";
	return TELEGRAM_ATTR_HTML_TAG_PATTERNS.get(name)?.test(attrs) ?? false;
}
function hasOpenTelegramHtmlTag(tags, name) {
	return tags.includes(name);
}
function preserveTelegramHtmlTag(rawTag, openTags, escapeTag) {
	const match = HTML_MODE_TAG_PATTERN.exec(rawTag);
	if (!match) return escapeTag(rawTag);
	const closing = match[1] === "/";
	const tagName = normalizeLowercaseStringOrEmpty(match[2]);
	const attrs = match[3] ?? "";
	if (!closing && tagName === "code" && TELEGRAM_CODE_LANGUAGE_ATTR_PATTERN.test(attrs)) {
		openTags.push(tagName);
		if (hasOpenTelegramHtmlTag(openTags, "pre")) return rawTag;
		return "<code>";
	}
	if (!isSupportedTelegramHtmlTag(rawTag)) return escapeTag(rawTag);
	if (closing) return popLastTagName(openTags, tagName) ? rawTag : escapeTag(rawTag);
	openTags.push(tagName);
	return rawTag;
}
function escapeUnsupportedTelegramHtml(text) {
	let result = "";
	let index = 0;
	const openTags = [];
	while (index < text.length) {
		const char = text[index];
		if (char === "&") {
			const entityEnd = findTelegramHtmlEntityEnd(text, index);
			if (entityEnd !== -1) {
				result += text.slice(index, entityEnd + 1);
				index = entityEnd + 1;
			} else {
				result += "&amp;";
				index += 1;
			}
			continue;
		}
		if (char === "<") {
			const end = text.indexOf(">", index + 1);
			if (end !== -1) {
				const rawTag = text.slice(index, end + 1);
				result += preserveTelegramHtmlTag(rawTag, openTags, escapeHtml);
				index = end + 1;
			} else {
				result += "&lt;";
				index += 1;
			}
			continue;
		}
		if (char === ">") {
			result += "&gt;";
			index += 1;
			continue;
		}
		result += char;
		index += 1;
	}
	return result;
}
function decodeTelegramHtmlEntity(entity, fallback) {
	if (entity.startsWith("#x") || entity.startsWith("#X")) {
		const codePoint = Number.parseInt(entity.slice(2), 16);
		return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 1114111 ? String.fromCodePoint(codePoint) : fallback;
	}
	if (entity.startsWith("#")) {
		const codePoint = Number.parseInt(entity.slice(1), 10);
		return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 1114111 ? String.fromCodePoint(codePoint) : fallback;
	}
	switch (entity) {
		case "amp": return "&";
		case "lt": return "<";
		case "gt": return ">";
		case "quot": return "\"";
		case "apos": return "'";
		default: return fallback;
	}
}
function decodeTelegramHtmlEntities(text) {
	return text.replace(TELEGRAM_HTML_ENTITY_PATTERN, (match, entity) => decodeTelegramHtmlEntity(entity, match));
}
function stripTelegramHtmlForPlainText(html) {
	return decodeTelegramHtmlEntities(html.replace(TELEGRAM_HTML_BREAK_PATTERN, "\n").replace(TELEGRAM_HTML_TAG_PATTERN, ""));
}
function encodePlainTextForTelegramHtmlStrip(text) {
	return text.replace(/[&<>]/g, (char) => {
		switch (char) {
			case "&": return "&amp;";
			case "<": return "&lt;";
			case ">": return "&gt;";
			default: return char;
		}
	});
}
function telegramHtmlToPlainTextFallback(html) {
	TELEGRAM_HTML_ANCHOR_PATTERN.lastIndex = 0;
	return stripTelegramHtmlForPlainText(html.replace(TELEGRAM_HTML_ANCHOR_PATTERN, (_match, doubleQuotedHref, singleQuotedHref, unquotedHref, labelHtml) => {
		const href = decodeTelegramHtmlEntities(doubleQuotedHref ?? singleQuotedHref ?? unquotedHref ?? "").trim();
		const label = stripTelegramHtmlForPlainText(labelHtml).trim();
		if (!href) return encodePlainTextForTelegramHtmlStrip(label);
		return encodePlainTextForTelegramHtmlStrip(!label || label === href ? href : `${label} (${href})`);
	}));
}
function promoteEscapedSupportedTelegramTags(text, openTags) {
	ESCAPED_HTML_TAG_PATTERN.lastIndex = 0;
	return text.replace(ESCAPED_HTML_TAG_PATTERN, (match, closing, name, attrs) => preserveTelegramHtmlTag(`<${closing}${name}${attrs}>`, openTags, () => match));
}
function preserveSupportedTelegramHtmlTags(html) {
	let codeDepth = 0;
	let preDepth = 0;
	let result = "";
	let lastIndex = 0;
	const openEscapedTags = [];
	HTML_TAG_PATTERN.lastIndex = 0;
	let match;
	while ((match = HTML_TAG_PATTERN.exec(html)) !== null) {
		const tagStart = match.index;
		const tagEnd = HTML_TAG_PATTERN.lastIndex;
		const tagName = normalizeLowercaseStringOrEmpty(match[2]);
		const isClosing = match[1] === "</";
		const textBefore = html.slice(lastIndex, tagStart);
		result += codeDepth > 0 || preDepth > 0 ? textBefore : promoteEscapedSupportedTelegramTags(textBefore, openEscapedTags);
		if (tagName === "code") codeDepth = isClosing ? Math.max(0, codeDepth - 1) : codeDepth + 1;
		else if (tagName === "pre") preDepth = isClosing ? Math.max(0, preDepth - 1) : preDepth + 1;
		result += html.slice(tagStart, tagEnd);
		lastIndex = tagEnd;
	}
	const remainingText = html.slice(lastIndex);
	result += codeDepth > 0 || preDepth > 0 ? remainingText : promoteEscapedSupportedTelegramTags(remainingText, openEscapedTags);
	return result;
}
function getFileReferencePattern() {
	if (fileReferencePattern) return fileReferencePattern;
	const fileExtensionsPattern = Array.from(FILE_REF_EXTENSIONS_WITH_TLD).map(escapeRegex).join("|");
	fileReferencePattern = new RegExp(`(^|[^a-zA-Z0-9_\\-/])([a-zA-Z0-9_.\\-./]+\\.(?:${fileExtensionsPattern}))(?=$|[^a-zA-Z0-9_\\-/])`, "gi");
	return fileReferencePattern;
}
function getOrphanedTldPattern() {
	if (orphanedTldPattern) return orphanedTldPattern;
	const fileExtensionsPattern = Array.from(FILE_REF_EXTENSIONS_WITH_TLD).map(escapeRegex).join("|");
	orphanedTldPattern = new RegExp(`([^a-zA-Z0-9]|^)([A-Za-z]\\.(?:${fileExtensionsPattern}))(?=[^a-zA-Z0-9/]|$)`, "g");
	return orphanedTldPattern;
}
function wrapStandaloneFileRef(match, prefix, filename) {
	if (filename.startsWith("//")) return match;
	if (/https?:\/\/$/i.test(prefix)) return match;
	return `${prefix}<code>${escapeHtml(filename)}</code>`;
}
function wrapSegmentFileRefs(text, codeDepth, preDepth, anchorDepth) {
	if (!text || codeDepth > 0 || preDepth > 0 || anchorDepth > 0) return text;
	return text.replace(getFileReferencePattern(), wrapStandaloneFileRef).replace(getOrphanedTldPattern(), (match, prefix, tld) => prefix === ">" ? match : `${prefix}<code>${escapeHtml(tld)}</code>`);
}
function wrapFileReferencesInHtml(html) {
	AUTO_LINKED_ANCHOR_PATTERN.lastIndex = 0;
	const deLinkified = html.replace(AUTO_LINKED_ANCHOR_PATTERN, (_match, label) => {
		if (!isAutoLinkedFileRef(`http://${label}`, label)) return _match;
		return `<code>${escapeHtml(label)}</code>`;
	});
	let codeDepth = 0;
	let preDepth = 0;
	let anchorDepth = 0;
	let result = "";
	let lastIndex = 0;
	HTML_TAG_PATTERN.lastIndex = 0;
	let match;
	while ((match = HTML_TAG_PATTERN.exec(deLinkified)) !== null) {
		const tagStart = match.index;
		const tagEnd = HTML_TAG_PATTERN.lastIndex;
		const isClosing = match[1] === "</";
		const tagName = normalizeLowercaseStringOrEmpty(match[2]);
		const textBefore = deLinkified.slice(lastIndex, tagStart);
		result += wrapSegmentFileRefs(textBefore, codeDepth, preDepth, anchorDepth);
		if (tagName === "code") codeDepth = isClosing ? Math.max(0, codeDepth - 1) : codeDepth + 1;
		else if (tagName === "pre") preDepth = isClosing ? Math.max(0, preDepth - 1) : preDepth + 1;
		else if (tagName === "a") anchorDepth = isClosing ? Math.max(0, anchorDepth - 1) : anchorDepth + 1;
		result += deLinkified.slice(tagStart, tagEnd);
		lastIndex = tagEnd;
	}
	const remainingText = deLinkified.slice(lastIndex);
	result += wrapSegmentFileRefs(remainingText, codeDepth, preDepth, anchorDepth);
	return result;
}
function renderTelegramHtmlText(text, options = {}) {
	if ((options.textMode ?? "markdown") === "html") return escapeUnsupportedTelegramHtml(text);
	return markdownToTelegramHtml(text, { tableMode: options.tableMode });
}
const TELEGRAM_SELF_CLOSING_HTML_TAGS = new Set(["br"]);
function buildTelegramHtmlOpenPrefix(tags) {
	return tags.map((tag) => tag.openTag).join("");
}
function buildTelegramHtmlCloseSuffix(tags) {
	return tags.slice().toReversed().map((tag) => tag.closeTag).join("");
}
function buildTelegramHtmlCloseSuffixLength(tags) {
	return tags.reduce((total, tag) => total + tag.closeTag.length, 0);
}
function findTelegramHtmlEntityEnd(text, start) {
	if (text[start] !== "&") return -1;
	let index = start + 1;
	if (index >= text.length) return -1;
	if (text[index] === "#") {
		index += 1;
		if (index >= text.length) return -1;
		if (text[index] === "x" || text[index] === "X") {
			index += 1;
			const hexStart = index;
			while (/[0-9A-Fa-f]/.test(text[index] ?? "")) index += 1;
			if (index === hexStart) return -1;
		} else {
			const digitStart = index;
			while (/[0-9]/.test(text[index] ?? "")) index += 1;
			if (index === digitStart) return -1;
		}
	} else {
		const nameStart = index;
		while (/[A-Za-z0-9]/.test(text[index] ?? "")) index += 1;
		if (index === nameStart) return -1;
	}
	return text[index] === ";" ? index : -1;
}
function findTelegramHtmlSafeSplitIndex(text, maxLength) {
	if (text.length <= maxLength) return text.length;
	const normalizedMaxLength = Math.max(1, Math.floor(maxLength));
	const lastAmpersand = text.lastIndexOf("&", normalizedMaxLength - 1);
	if (lastAmpersand === -1) return normalizedMaxLength;
	if (lastAmpersand < text.lastIndexOf(";", normalizedMaxLength - 1)) return normalizedMaxLength;
	const entityEnd = findTelegramHtmlEntityEnd(text, lastAmpersand);
	if (entityEnd === -1 || entityEnd < normalizedMaxLength) return normalizedMaxLength;
	return lastAmpersand;
}
function popTelegramHtmlTag(tags, name) {
	for (let index = tags.length - 1; index >= 0; index -= 1) if (tags[index]?.name === name) {
		tags.splice(index, 1);
		return;
	}
}
function splitTelegramHtmlChunks(html, limit) {
	if (!html) return [];
	const normalizedLimit = Math.max(1, Math.floor(limit));
	if (html.length <= normalizedLimit) return [html];
	const chunks = [];
	const openTags = [];
	let current = "";
	let chunkHasPayload = false;
	const resetCurrent = () => {
		current = buildTelegramHtmlOpenPrefix(openTags);
		chunkHasPayload = false;
	};
	const flushCurrent = () => {
		if (!chunkHasPayload) return;
		chunks.push(`${current}${buildTelegramHtmlCloseSuffix(openTags)}`);
		resetCurrent();
	};
	const appendText = (segment) => {
		let remaining = segment;
		while (remaining.length > 0) {
			const available = normalizedLimit - current.length - buildTelegramHtmlCloseSuffixLength(openTags);
			if (available <= 0) {
				if (!chunkHasPayload) throw new Error(`Telegram HTML chunk limit exceeded by tag overhead (limit=${normalizedLimit})`);
				flushCurrent();
				continue;
			}
			if (remaining.length <= available) {
				current += remaining;
				chunkHasPayload = true;
				break;
			}
			const splitAt = findTelegramHtmlSafeSplitIndex(remaining, available);
			if (splitAt <= 0) {
				if (!chunkHasPayload) throw new Error(`Telegram HTML chunk limit exceeded by leading entity (limit=${normalizedLimit})`);
				flushCurrent();
				continue;
			}
			current += remaining.slice(0, splitAt);
			chunkHasPayload = true;
			remaining = remaining.slice(splitAt);
			flushCurrent();
		}
	};
	resetCurrent();
	HTML_TAG_PATTERN.lastIndex = 0;
	let lastIndex = 0;
	let match;
	while ((match = HTML_TAG_PATTERN.exec(html)) !== null) {
		const tagStart = match.index;
		const tagEnd = HTML_TAG_PATTERN.lastIndex;
		appendText(html.slice(lastIndex, tagStart));
		const rawTag = match[0];
		const isClosing = match[1] === "</";
		const tagName = normalizeLowercaseStringOrEmpty(match[2]);
		const isSelfClosing = !isClosing && (TELEGRAM_SELF_CLOSING_HTML_TAGS.has(tagName) || rawTag.trimEnd().endsWith("/>"));
		if (!isClosing) {
			const nextCloseLength = isSelfClosing ? 0 : `</${tagName}>`.length;
			if (chunkHasPayload && current.length + rawTag.length + buildTelegramHtmlCloseSuffixLength(openTags) + nextCloseLength > normalizedLimit) flushCurrent();
		}
		current += rawTag;
		if (isSelfClosing) chunkHasPayload = true;
		if (isClosing) popTelegramHtmlTag(openTags, tagName);
		else if (!isSelfClosing) openTags.push({
			name: tagName,
			openTag: rawTag,
			closeTag: `</${tagName}>`
		});
		lastIndex = tagEnd;
	}
	appendText(html.slice(lastIndex));
	flushCurrent();
	return chunks.length > 0 ? chunks : [html];
}
function renderTelegramChunkHtml(ir) {
	return wrapFileReferencesInHtml(preserveSupportedTelegramHtmlTags(renderTelegramHtml(ir)));
}
function renderTelegramChunksWithinHtmlLimit(ir, limit) {
	return renderMarkdownIRChunksWithinLimit({
		ir,
		limit,
		renderChunk: renderTelegramChunkHtml,
		measureRendered: (html) => html.length
	}).map(({ source, rendered }) => ({
		html: rendered,
		text: source.text
	}));
}
function markdownToTelegramChunks(markdown, limit, options = {}) {
	return renderTelegramChunksWithinHtmlLimit(markdownToIR(preserveTelegramListBoundarySpacing(markdown ?? ""), {
		linkify: true,
		enableSpoilers: true,
		headingStyle: "none",
		blockquotePrefix: "",
		tableMode: options.tableMode
	}), limit);
}
function markdownToTelegramHtmlChunks(markdown, limit, options = {}) {
	return markdownToTelegramChunks(markdown, limit, options).map((chunk) => chunk.html);
}
//#endregion
export { renderTelegramHtmlText as a, wrapFileReferencesInHtml as c, markdownToTelegramHtmlChunks as i, markdownToTelegramChunks as n, splitTelegramHtmlChunks as o, markdownToTelegramHtml as r, telegramHtmlToPlainTextFallback as s, escapeTelegramHtml as t };
