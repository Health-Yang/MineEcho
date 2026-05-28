import { i as normalizeLegacyChannelAliases, n as hasLegacyAccountStreamingAliases, r as hasLegacyStreamingAliases, t as asObjectRecord } from "./runtime-doctor-Hv1sNFCG.js";
import { t as resolveTelegramPreviewStreamMode } from "./preview-streaming-D1RUVVIT.js";
//#region extensions/telegram/src/doctor-contract.ts
function hasLegacyTelegramStreamingAliases(value) {
	return hasLegacyStreamingAliases(value, { includePreviewChunk: true });
}
function hasRetiredTelegramDmConfig(value) {
	const entry = asObjectRecord(value);
	if (!entry) return false;
	if (asObjectRecord(entry.dm)) return true;
	return Object.values(asObjectRecord(entry.direct) ?? {}).some((direct) => asObjectRecord(direct)?.threadReplies !== void 0);
}
function hasRetiredTelegramAccountDmConfig(value) {
	const accounts = asObjectRecord(value);
	if (!accounts) return false;
	return Object.values(accounts).some((account) => hasRetiredTelegramDmConfig(account));
}
function removeRetiredTelegramDmConfig(params) {
	let updated = params.entry;
	let changed = false;
	const dm = asObjectRecord(updated.dm);
	if (dm) {
		const { dm: _ignored, ...rest } = updated;
		updated = rest;
		params.changes.push(dm.threadReplies === void 0 ? `Removed ${params.pathPrefix}.dm.` : `Removed ${params.pathPrefix}.dm.threadReplies; DM topic sessions now follow Telegram getMe.has_topics_enabled.`);
		changed = true;
	}
	const direct = asObjectRecord(updated.direct);
	if (direct) {
		let directChanged = false;
		const nextDirect = { ...direct };
		for (const [chatId, rawDirectConfig] of Object.entries(direct)) {
			const directConfig = asObjectRecord(rawDirectConfig);
			if (!directConfig || directConfig.threadReplies === void 0) continue;
			const nextDirectConfig = { ...directConfig };
			delete nextDirectConfig.threadReplies;
			nextDirect[chatId] = nextDirectConfig;
			params.changes.push(`Removed ${params.pathPrefix}.direct.${chatId}.threadReplies; DM topic sessions now follow Telegram getMe.has_topics_enabled.`);
			directChanged = true;
		}
		if (directChanged) {
			updated = {
				...updated,
				direct: nextDirect
			};
			changed = true;
		}
	}
	return {
		entry: updated,
		changed
	};
}
function resolveCompatibleDefaultGroupEntry(section) {
	const existingGroups = section.groups;
	if (existingGroups !== void 0 && !asObjectRecord(existingGroups)) return null;
	const groups = asObjectRecord(existingGroups) ?? {};
	const existingEntry = groups["*"];
	if (existingEntry !== void 0 && !asObjectRecord(existingEntry)) return null;
	return {
		groups,
		entry: asObjectRecord(existingEntry) ?? {}
	};
}
const legacyConfigRules = [
	{
		path: [
			"channels",
			"telegram",
			"groupMentionsOnly"
		],
		message: "channels.telegram.groupMentionsOnly was removed; use channels.telegram.groups.\"*\".requireMention instead. Run \"openclaw doctor --fix\"."
	},
	{
		path: ["channels", "telegram"],
		message: "channels.telegram.dm and direct.<chatId>.threadReplies were removed; DM topic sessions now follow Telegram getMe.has_topics_enabled, so topics-enabled bots may use thread-scoped DM sessions. Run \"openclaw doctor --fix\".",
		match: hasRetiredTelegramDmConfig
	},
	{
		path: [
			"channels",
			"telegram",
			"accounts"
		],
		message: "channels.telegram.accounts.<id>.dm and direct.<chatId>.threadReplies were removed; DM topic sessions now follow Telegram getMe.has_topics_enabled, so topics-enabled bots may use thread-scoped DM sessions. Run \"openclaw doctor --fix\".",
		match: hasRetiredTelegramAccountDmConfig
	},
	{
		path: ["channels", "telegram"],
		message: "channels.telegram.streamMode, channels.telegram.streaming (scalar), chunkMode, blockStreaming, draftChunk, and blockStreamingCoalesce are legacy; use channels.telegram.streaming.{mode,chunkMode,preview.chunk,block.enabled,block.coalesce}.",
		match: hasLegacyTelegramStreamingAliases
	},
	{
		path: [
			"channels",
			"telegram",
			"accounts"
		],
		message: "channels.telegram.accounts.<id>.streamMode, streaming (scalar), chunkMode, blockStreaming, draftChunk, and blockStreamingCoalesce are legacy; use channels.telegram.accounts.<id>.streaming.{mode,chunkMode,preview.chunk,block.enabled,block.coalesce}.",
		match: (value) => hasLegacyAccountStreamingAliases(value, hasLegacyTelegramStreamingAliases)
	}
];
function normalizeCompatibilityConfig({ cfg }) {
	const rawEntry = asObjectRecord(cfg.channels?.telegram);
	if (!rawEntry) return {
		config: cfg,
		changes: []
	};
	const changes = [];
	let updated = rawEntry;
	let changed = false;
	const removedThreadReplies = removeRetiredTelegramDmConfig({
		entry: updated,
		pathPrefix: "channels.telegram",
		changes
	});
	updated = removedThreadReplies.entry;
	changed = changed || removedThreadReplies.changed;
	if (updated.groupMentionsOnly !== void 0) {
		const defaultGroupEntry = resolveCompatibleDefaultGroupEntry(updated);
		if (!defaultGroupEntry) changes.push("Skipped channels.telegram.groupMentionsOnly migration because channels.telegram.groups already has an incompatible shape; fix remaining issues manually.");
		else {
			const { groups, entry } = defaultGroupEntry;
			if (entry.requireMention === void 0) {
				entry.requireMention = updated.groupMentionsOnly;
				groups["*"] = entry;
				updated = {
					...updated,
					groups
				};
				changes.push("Moved channels.telegram.groupMentionsOnly → channels.telegram.groups.\"*\".requireMention.");
			} else changes.push("Removed channels.telegram.groupMentionsOnly (channels.telegram.groups.\"*\" already set).");
			const { groupMentionsOnly: _ignored, ...rest } = updated;
			updated = rest;
			changed = true;
		}
	}
	const aliases = normalizeLegacyChannelAliases({
		entry: updated,
		pathPrefix: "channels.telegram",
		changes,
		resolveStreamingOptions: (entry) => ({
			includePreviewChunk: true,
			resolvedMode: resolveTelegramPreviewStreamMode(entry)
		})
	});
	updated = aliases.entry;
	changed = changed || aliases.changed;
	const accounts = asObjectRecord(updated.accounts);
	if (accounts) {
		let accountsChanged = false;
		const nextAccounts = { ...accounts };
		for (const [accountId, rawAccount] of Object.entries(accounts)) {
			const account = asObjectRecord(rawAccount);
			if (!account) continue;
			const accountRemovedThreadReplies = removeRetiredTelegramDmConfig({
				entry: account,
				pathPrefix: `channels.telegram.accounts.${accountId}`,
				changes
			});
			if (accountRemovedThreadReplies.changed) {
				nextAccounts[accountId] = accountRemovedThreadReplies.entry;
				accountsChanged = true;
			}
		}
		if (accountsChanged) {
			updated = {
				...updated,
				accounts: nextAccounts
			};
			changed = true;
		}
	}
	if (!changed && changes.length === 0) return {
		config: cfg,
		changes: []
	};
	return {
		config: {
			...cfg,
			channels: {
				...cfg.channels,
				telegram: updated
			}
		},
		changes
	};
}
//#endregion
export { normalizeCompatibilityConfig as n, legacyConfigRules as t };
