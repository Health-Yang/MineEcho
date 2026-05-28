import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { r as isInternalMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { i as mergeDeliveryContext, n as deliveryContextFromSession, o as normalizeDeliveryContext } from "./delivery-context.shared-B9zntlj0.js";
import { t as getLoadedChannelPluginForRead } from "./registry-loaded-read-neKhpFRr.js";
import { a as stripTargetTopicSuffix, i as stripTargetProviderPrefix, r as stripTargetKindPrefix } from "./target-parsing-loaded-BPWzTLZz.js";
//#region src/agents/subagent-announce-origin.ts
function normalizeAnnounceRouteTarget(context) {
	const rawTo = normalizeOptionalString(context?.to);
	if (!rawTo) return;
	const channel = normalizeOptionalString(context?.channel);
	const messaging = channel ? getLoadedChannelPluginForRead(channel)?.messaging : void 0;
	const route = stripTargetTopicSuffix(stripTargetKindPrefix(stripTargetProviderPrefix(rawTo, channel ?? ""), ["group", "channel"]));
	return (messaging?.normalizeTarget?.(route) ?? route) || void 0;
}
function shouldStripThreadFromAnnounceEntry(normalizedRequester, normalizedEntry) {
	if (!normalizedRequester?.to || normalizedRequester.threadId != null || normalizedEntry?.threadId == null) return false;
	const requesterTarget = normalizeAnnounceRouteTarget(normalizedRequester);
	const entryTarget = normalizeAnnounceRouteTarget(normalizedEntry);
	if (requesterTarget && entryTarget) return requesterTarget !== entryTarget;
	return false;
}
function resolveAnnounceOrigin(entry, requesterOrigin) {
	const normalizedRequester = normalizeDeliveryContext(requesterOrigin);
	const normalizedEntry = deliveryContextFromSession(entry);
	if (normalizedRequester?.channel && isInternalMessageChannel(normalizedRequester.channel)) return mergeDeliveryContext({
		accountId: normalizedRequester.accountId,
		threadId: normalizedRequester.threadId
	}, normalizedEntry);
	return mergeDeliveryContext(normalizedRequester, normalizedEntry && shouldStripThreadFromAnnounceEntry(normalizedRequester, normalizedEntry) ? (() => {
		const { threadId: _ignore, ...rest } = normalizedEntry;
		return rest;
	})() : normalizedEntry);
}
//#endregion
export { resolveAnnounceOrigin as t };
