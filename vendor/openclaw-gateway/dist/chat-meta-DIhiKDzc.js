import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as listBundledChannelCatalogEntries, n as CHAT_CHANNEL_ORDER } from "./ids-OP3BJTaQ.js";
import { t as buildManifestChannelMeta } from "./channel-meta-COEgfCjE.js";
//#region src/channels/chat-meta-shared.ts
const CHAT_CHANNEL_ID_SET = new Set(CHAT_CHANNEL_ORDER);
function toChatChannelMeta(params) {
	const label = normalizeOptionalString(params.channel.label);
	if (!label) throw new Error(`Missing label for bundled chat channel "${params.id}"`);
	return buildManifestChannelMeta({
		id: params.id,
		channel: params.channel,
		label,
		selectionLabel: normalizeOptionalString(params.channel.selectionLabel) || label,
		docsPath: normalizeOptionalString(params.channel.docsPath) || `/channels/${params.id}`,
		docsLabel: normalizeOptionalString(params.channel.docsLabel),
		blurb: normalizeOptionalString(params.channel.blurb) || "",
		detailLabel: normalizeOptionalString(params.channel.detailLabel),
		systemImage: normalizeOptionalString(params.channel.systemImage),
		arrayFieldMode: "non-empty",
		selectionDocsPrefixMode: "defined"
	});
}
function buildChatChannelMetaById() {
	const entries = /* @__PURE__ */ new Map();
	for (const entry of listBundledChannelCatalogEntries()) {
		const rawId = normalizeOptionalString(entry.id);
		if (!rawId || !CHAT_CHANNEL_ID_SET.has(rawId)) continue;
		const id = rawId;
		entries.set(id, toChatChannelMeta({
			id,
			channel: entry.channel
		}));
	}
	return Object.freeze(Object.fromEntries(entries));
}
//#endregion
//#region src/channels/chat-meta.ts
let chatChannelMetaCache = null;
function getChatChannelMetaById() {
	chatChannelMetaCache ??= buildChatChannelMetaById();
	return chatChannelMetaCache;
}
function listChatChannels() {
	const metaById = getChatChannelMetaById();
	return CHAT_CHANNEL_ORDER.map((id) => metaById[id]).filter((meta) => Boolean(meta));
}
function getChatChannelMeta(id) {
	return getChatChannelMetaById()[id];
}
//#endregion
export { listChatChannels as n, buildChatChannelMetaById as r, getChatChannelMeta as t };
