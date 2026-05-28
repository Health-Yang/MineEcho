import { c as normalizeOptionalString, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { a as normalizeAnyChannelId } from "./registry-49GbU2k5.js";
import { t as getLoadedChannelPluginForRead } from "./registry-loaded-read-neKhpFRr.js";
import { a as stripTargetTopicSuffix, i as stripTargetProviderPrefix, r as stripTargetKindPrefix } from "./target-parsing-loaded-BPWzTLZz.js";
//#region src/auto-reply/reply/group-id-simple.ts
function extractSimpleExplicitGroupId(raw) {
	const trimmed = normalizeOptionalString(raw) ?? "";
	if (!trimmed) return;
	const parts = trimmed.split(":").filter(Boolean);
	if (parts.length >= 3 && (parts[1] === "group" || parts[1] === "channel")) return parts.slice(2).join(":").replace(/:topic:.*$/, "") || void 0;
	if (parts.length >= 2 && (parts[0] === "group" || parts[0] === "channel")) return parts.slice(1).join(":").replace(/:topic:.*$/, "") || void 0;
}
//#endregion
//#region src/auto-reply/reply/group-id.ts
function extractInferredGroupTargetId(params) {
	const normalized = params.messaging?.normalizeTarget?.(params.raw);
	const candidates = uniqueStrings([normalized, params.raw].filter((candidate) => Boolean(candidate)));
	for (const candidate of candidates) {
		const chatType = params.messaging?.inferTargetChatType?.({ to: candidate });
		if (chatType === "direct" || chatType == null) continue;
		const target = stripTargetTopicSuffix(stripTargetKindPrefix(stripTargetProviderPrefix(candidate, params.channelId), [
			"group",
			"channel",
			"conversation",
			"room",
			"thread"
		]), { allowNumericShorthand: params.channelId === "telegram" });
		if (target) return target;
	}
}
function extractLegacyParsedGroupTargetId(params) {
	const parsed = params.messaging?.parseExplicitTarget?.({ raw: params.raw });
	if (parsed?.chatType === "direct" || parsed?.chatType == null) return;
	return stripTargetTopicSuffix(stripTargetKindPrefix(stripTargetProviderPrefix(parsed.to, params.channelId), [
		"group",
		"channel",
		"conversation",
		"room",
		"thread"
	]), { allowNumericShorthand: params.channelId === "telegram" }) || void 0;
}
function extractExplicitGroupId(raw) {
	const trimmed = normalizeOptionalString(raw) ?? "";
	if (!trimmed) return;
	const simple = extractSimpleExplicitGroupId(trimmed);
	if (simple) return simple;
	const firstPart = trimmed.split(":").find(Boolean);
	const channelId = normalizeAnyChannelId(firstPart ?? "") ?? normalizeOptionalLowercaseString(firstPart);
	const messaging = channelId ? getLoadedChannelPluginForRead(channelId)?.messaging : void 0;
	if (!channelId) return;
	return extractInferredGroupTargetId({
		raw: trimmed,
		channelId,
		messaging
	}) ?? extractLegacyParsedGroupTargetId({
		raw: trimmed,
		channelId,
		messaging
	});
}
//#endregion
export { extractExplicitGroupId as t };
