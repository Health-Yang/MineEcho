import { f as renderMessagePresentationFallbackText } from "./payload-Cpx3heIy.js";
import "./directory-runtime-CDbnl1Qr.js";
import { l as listDirectoryUserEntriesFromAllowFromAndMapKeys, s as listDirectoryGroupEntriesFromMapKeysAndAllowFrom } from "./directory-config-helpers-LyIq_y1r.js";
import { r as normalizeFeishuTarget } from "./targets-CgTiDHPN.js";
import { s as resolveFeishuAccount } from "./accounts-DFpq_zoM.js";
import { s as createFeishuCardInteractionEnvelope } from "./send-result-D_dvCL26.js";
//#region extensions/feishu/src/directory.static.ts
function toFeishuDirectoryPeers(ids) {
	return ids.map((id) => ({
		kind: "user",
		id
	}));
}
function toFeishuDirectoryGroups(ids) {
	return ids.map((id) => ({
		kind: "group",
		id
	}));
}
async function listFeishuDirectoryPeers(params) {
	const account = resolveFeishuAccount({
		cfg: params.cfg,
		accountId: params.accountId
	});
	return toFeishuDirectoryPeers(listDirectoryUserEntriesFromAllowFromAndMapKeys({
		allowFrom: account.config.allowFrom,
		map: account.config.dms,
		query: params.query,
		limit: params.limit,
		normalizeAllowFromId: (entry) => normalizeFeishuTarget(entry) ?? entry,
		normalizeMapKeyId: (entry) => normalizeFeishuTarget(entry) ?? entry
	}).map((entry) => entry.id));
}
async function listFeishuDirectoryGroups(params) {
	const account = resolveFeishuAccount({
		cfg: params.cfg,
		accountId: params.accountId
	});
	return toFeishuDirectoryGroups(listDirectoryGroupEntriesFromMapKeysAndAllowFrom({
		groups: account.config.groups,
		allowFrom: account.config.groupAllowFrom,
		query: params.query,
		limit: params.limit
	}).map((entry) => entry.id));
}
//#endregion
//#region extensions/feishu/src/presentation-card.ts
function escapeFeishuCardMarkdownText(text) {
	return text.replace(/[&<>]/g, (char) => {
		switch (char) {
			case "&": return "&amp;";
			case "<": return "&lt;";
			case ">": return "&gt;";
			default: return char;
		}
	});
}
function resolveSafeFeishuButtonUrl(url) {
	const trimmed = url?.trim();
	if (!trimmed) return;
	try {
		const parsed = new URL(trimmed);
		return parsed.protocol === "https:" || parsed.protocol === "http:" ? trimmed : void 0;
	} catch {
		return;
	}
}
function resolveFeishuButtonUrl(button) {
	return button.url ?? button.webApp?.url ?? button.web_app?.url;
}
function mapFeishuButtonType(style) {
	if (style === "primary" || style === "success") return "primary";
	if (style === "danger") return "danger";
	return "default";
}
function buildFeishuPayloadButton(button) {
	const behaviors = [];
	const rendered = {
		tag: "button",
		text: {
			tag: "plain_text",
			content: button.label
		},
		type: mapFeishuButtonType(button.style)
	};
	const url = resolveFeishuButtonUrl(button);
	if (url) {
		const safeUrl = resolveSafeFeishuButtonUrl(url);
		if (safeUrl) behaviors.push({
			type: "open_url",
			default_url: safeUrl
		});
	}
	if (button.value) behaviors.push({
		type: "callback",
		value: createFeishuCardInteractionEnvelope({
			k: "quick",
			a: "feishu.payload.button",
			q: button.value
		})
	});
	if (behaviors.length === 0) return;
	rendered.behaviors = behaviors;
	return rendered;
}
function buildFeishuCardElementsForBlock(block) {
	if (block.type === "text") return [{
		tag: "markdown",
		content: escapeFeishuCardMarkdownText(block.text)
	}];
	if (block.type === "context") return [{
		tag: "markdown",
		content: `<font color='grey'>${escapeFeishuCardMarkdownText(block.text)}</font>`
	}];
	if (block.type === "divider") return [{ tag: "hr" }];
	if (block.type === "buttons") return block.buttons.map((button) => buildFeishuPayloadButton(button)).filter((button) => Boolean(button));
	const labels = block.options.map((option) => `- ${option.label}`).join("\n");
	return [{
		tag: "markdown",
		content: `${escapeFeishuCardMarkdownText(block.placeholder?.trim() || "Options")}:\n${escapeFeishuCardMarkdownText(labels)}`
	}];
}
function resolvePresentationHeaderTemplate(tone) {
	if (tone === "danger") return "red";
	if (tone === "warning") return "orange";
	if (tone === "success") return "green";
	return "blue";
}
function buildFeishuPresentationCardElements(params) {
	const elements = [];
	const fallbackText = params.fallbackText?.trim();
	if (fallbackText) elements.push({
		tag: "markdown",
		content: escapeFeishuCardMarkdownText(fallbackText)
	});
	for (const block of params.presentation.blocks) for (const element of buildFeishuCardElementsForBlock(block)) elements.push(element);
	if (elements.length > 0) return elements;
	return [{
		tag: "markdown",
		content: renderMessagePresentationFallbackText({
			text: params.fallbackText,
			presentation: params.presentation.title ? {
				...params.presentation.tone ? { tone: params.presentation.tone } : {},
				blocks: params.presentation.blocks
			} : params.presentation
		})
	}];
}
function buildFeishuPresentationCard(params) {
	return {
		schema: "2.0",
		config: { width_mode: "fill" },
		...params.presentation.title ? { header: {
			title: {
				tag: "plain_text",
				content: params.presentation.title
			},
			template: resolvePresentationHeaderTemplate(params.presentation.tone)
		} } : {},
		body: { elements: buildFeishuPresentationCardElements(params) }
	};
}
//#endregion
export { listFeishuDirectoryPeers as i, buildFeishuPresentationCardElements as n, listFeishuDirectoryGroups as r, buildFeishuPresentationCard as t };
