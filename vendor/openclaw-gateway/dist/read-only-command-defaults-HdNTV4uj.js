import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { t as isBlockedObjectKey } from "./prototype-keys-gIgii6VQ.js";
import { a as resolvePluginMetadataSnapshot } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { c as isInstalledPluginEnabled } from "./installed-plugin-index-store-Db9FQc7C.js";
//#region src/channels/plugins/read-only-command-defaults.ts
const SAFE_MANIFEST_CHANNEL_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
function isSafeManifestChannelId(channelId) {
	return SAFE_MANIFEST_CHANNEL_ID_PATTERN.test(channelId) && !isBlockedObjectKey(channelId);
}
function readOwnRecordValue(record, key) {
	if (isBlockedObjectKey(key) || !Object.prototype.hasOwnProperty.call(record, key)) return;
	return record[key];
}
function normalizeChannelCommandDefaults(value) {
	if (!value) return;
	const nativeCommandsAutoEnabled = typeof value.nativeCommandsAutoEnabled === "boolean" ? value.nativeCommandsAutoEnabled : void 0;
	const nativeSkillsAutoEnabled = typeof value.nativeSkillsAutoEnabled === "boolean" ? value.nativeSkillsAutoEnabled : void 0;
	if (nativeCommandsAutoEnabled === void 0 && nativeSkillsAutoEnabled === void 0) return;
	const defaults = {};
	if (nativeCommandsAutoEnabled !== void 0) defaults.nativeCommandsAutoEnabled = nativeCommandsAutoEnabled;
	if (nativeSkillsAutoEnabled !== void 0) defaults.nativeSkillsAutoEnabled = nativeSkillsAutoEnabled;
	return defaults;
}
function resolveReadOnlyChannelCommandDefaults(channelId, options) {
	const normalizedChannelId = normalizeOptionalString(channelId) ?? "";
	if (!normalizedChannelId || !isSafeManifestChannelId(normalizedChannelId)) return;
	const env = options.env ?? process.env;
	const resolvedSnapshot = resolvePluginMetadataSnapshot({
		config: options.config,
		stateDir: options.stateDir,
		workspaceDir: options.workspaceDir,
		env,
		allowWorkspaceScopedCurrent: true
	});
	for (const record of resolvedSnapshot.plugins) {
		if (!record.channels.includes(normalizedChannelId)) continue;
		if (!isInstalledPluginEnabled(resolvedSnapshot.index, record.id, options.config)) continue;
		const channelConfigValue = record.channelConfigs ? readOwnRecordValue(record.channelConfigs, normalizedChannelId) : void 0;
		const channelConfig = channelConfigValue && typeof channelConfigValue === "object" && !Array.isArray(channelConfigValue) ? channelConfigValue : void 0;
		const catalogCommands = record.channelCatalogMeta?.id === normalizedChannelId ? record.channelCatalogMeta.commands : void 0;
		const commands = normalizeChannelCommandDefaults(channelConfig?.commands ?? catalogCommands);
		if (commands) return commands;
	}
}
//#endregion
export { resolveReadOnlyChannelCommandDefaults as i, normalizeChannelCommandDefaults as n, readOwnRecordValue as r, isSafeManifestChannelId as t };
