import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { i as listBundledChannelCatalogEntries, r as normalizeChatChannelId, t as CHANNEL_IDS } from "./ids-OP3BJTaQ.js";
import { t as getChatChannelMeta } from "./chat-meta-DIhiKDzc.js";
import { i as listRegisteredChannelPluginIds, r as getRegisteredChannelPluginMeta } from "./registry-49GbU2k5.js";
import { c as normalizeGatewayClientName, i as GATEWAY_CLIENT_NAMES, r as GATEWAY_CLIENT_MODES, s as normalizeGatewayClientMode } from "./client-info-BxgIUTRt.js";
import { i as INTERNAL_MESSAGE_CHANNEL, n as normalizeMessageChannel$1 } from "./message-channel-core-NW6lw3Ys.js";
//#region src/utils/message-channel-normalize.ts
function normalizeMessageChannel(raw) {
	return normalizeMessageChannel$1(raw);
}
const listPluginChannelIds = () => {
	return listRegisteredChannelPluginIds();
};
const listDeliverableMessageChannels = () => uniqueStrings([...CHANNEL_IDS, ...listPluginChannelIds()]);
const listGatewayMessageChannels = () => [...listDeliverableMessageChannels(), INTERNAL_MESSAGE_CHANNEL];
function isGatewayMessageChannel(value) {
	return listGatewayMessageChannels().includes(value);
}
function isDeliverableMessageChannel(value) {
	return listDeliverableMessageChannels().includes(value);
}
function resolveGatewayMessageChannel(raw) {
	const normalized = normalizeMessageChannel(raw);
	if (!normalized) return;
	return isGatewayMessageChannel(normalized) ? normalized : void 0;
}
function resolveMessageChannel(primary, fallback) {
	return normalizeMessageChannel(primary) ?? normalizeMessageChannel(fallback);
}
//#endregion
//#region src/utils/message-channel.ts
function isGatewayCliClient(client) {
	return normalizeGatewayClientMode(client?.mode) === GATEWAY_CLIENT_MODES.CLI;
}
function isOperatorUiClient(client) {
	const clientId = normalizeGatewayClientName(client?.id);
	return clientId === GATEWAY_CLIENT_NAMES.CONTROL_UI || clientId === GATEWAY_CLIENT_NAMES.TUI;
}
function isBrowserOperatorUiClient(client) {
	return normalizeGatewayClientName(client?.id) === GATEWAY_CLIENT_NAMES.CONTROL_UI;
}
function isInternalMessageChannel(raw) {
	return normalizeMessageChannel(raw) === INTERNAL_MESSAGE_CHANNEL;
}
function isWebchatClient(client) {
	if (normalizeGatewayClientMode(client?.mode) === GATEWAY_CLIENT_MODES.WEBCHAT) return true;
	return normalizeGatewayClientName(client?.id) === GATEWAY_CLIENT_NAMES.WEBCHAT_UI;
}
function isMarkdownCapableMessageChannel(raw) {
	const channel = normalizeMessageChannel(raw);
	if (!channel) return false;
	if (channel === "webchat" || channel === "tui") return true;
	const builtInChannel = normalizeChatChannelId(channel);
	if (builtInChannel) {
		const builtInMeta = getChatChannelMeta(builtInChannel);
		if (builtInMeta) return builtInMeta.markdownCapable === true;
		const catalogMeta = listBundledChannelCatalogEntries().find((entry) => entry.id === builtInChannel);
		if (catalogMeta) return catalogMeta.channel.markdownCapable === true;
	}
	return getRegisteredChannelPluginMeta(channel)?.markdownCapable === true;
}
//#endregion
export { isOperatorUiClient as a, isGatewayMessageChannel as c, resolveGatewayMessageChannel as d, resolveMessageChannel as f, isMarkdownCapableMessageChannel as i, listDeliverableMessageChannels as l, isGatewayCliClient as n, isWebchatClient as o, isInternalMessageChannel as r, isDeliverableMessageChannel as s, isBrowserOperatorUiClient as t, normalizeMessageChannel as u };
