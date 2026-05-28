import { s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { c as isRecord } from "./utils-B5r0V84N.js";
import { n as listBundledChannelIdsForPackageState, t as hasBundledChannelPackageState } from "./package-state-probes-ByDYV4gl.js";
import { r as listBundledChannelIds } from "./bootstrap-registry-BYZ3siDZ.js";
import { i as hasNonEmptyString } from "./channel-target-Dh0pGV0I.js";
import fs from "node:fs";
import os from "node:os";
//#region src/channels/plugins/persisted-auth-state.ts
function listBundledChannelIdsWithPersistedAuthState(discovery) {
	return listBundledChannelIdsForPackageState("persistedAuthState", discovery);
}
function hasBundledChannelPersistedAuthState(params) {
	return hasBundledChannelPackageState({
		metadataKey: "persistedAuthState",
		channelId: params.channelId,
		cfg: params.cfg,
		env: params.env,
		discovery: params.discovery
	});
}
//#endregion
//#region src/channels/config-presence.ts
const IGNORED_CHANNEL_CONFIG_KEYS = new Set(["defaults", "modelByChannel"]);
function hasMeaningfulChannelConfig(value) {
	if (!isRecord(value)) return false;
	return Object.keys(value).some((key) => key !== "enabled");
}
function listExplicitlyDisabledChannelIdsForConfig(cfg) {
	const channels = isRecord(cfg.channels) ? cfg.channels : null;
	if (!channels) return [];
	return Object.entries(channels).filter(([, value]) => isRecord(value) && value.enabled === false).map(([channelId]) => normalizeOptionalLowercaseString(channelId)).filter((channelId) => Boolean(channelId));
}
function listChannelEnvPrefixes(channelIds) {
	return channelIds.map((channelId) => [`${channelId.replace(/[^a-z0-9]+/gi, "_").toUpperCase()}_`, channelId]);
}
function hasPersistedChannelState(env) {
	return fs.existsSync(resolveStateDir(env, os.homedir));
}
let persistedAuthStateChannelIds = null;
function listPersistedAuthStateChannelIds(options) {
	const override = options.persistedAuthStateProbe?.listChannelIds();
	if (override) return override;
	if (options.discovery) return listBundledChannelIdsWithPersistedAuthState(options.discovery);
	if (persistedAuthStateChannelIds) return persistedAuthStateChannelIds;
	persistedAuthStateChannelIds = listBundledChannelIdsWithPersistedAuthState();
	return persistedAuthStateChannelIds;
}
function hasPersistedAuthState(params) {
	const override = params.options.persistedAuthStateProbe;
	if (override) return override.hasState(params);
	return hasBundledChannelPersistedAuthState({
		channelId: params.channelId,
		cfg: params.cfg,
		env: params.env,
		discovery: params.options.discovery
	});
}
function listPotentialConfiguredChannelIds(cfg, env = process.env, options = {}) {
	return uniqueStrings(listPotentialConfiguredChannelPresenceSignals(cfg, env, options).map((signal) => signal.channelId));
}
function listPotentialConfiguredChannelPresenceSignals(cfg, env = process.env, options = {}) {
	const signals = [];
	const seenSignals = /* @__PURE__ */ new Set();
	const addSignal = (channelId, source) => {
		const key = `${source}:${channelId}`;
		if (seenSignals.has(key)) return;
		seenSignals.add(key);
		signals.push({
			channelId,
			source
		});
	};
	const configuredChannelIds = /* @__PURE__ */ new Set();
	const channelEnvPrefixes = listChannelEnvPrefixes(options.channelIds ?? listBundledChannelIds(env, options.discovery));
	const channels = isRecord(cfg.channels) ? cfg.channels : null;
	if (channels) for (const [key, value] of Object.entries(channels)) {
		if (IGNORED_CHANNEL_CONFIG_KEYS.has(key)) continue;
		if (hasMeaningfulChannelConfig(value)) {
			configuredChannelIds.add(key);
			addSignal(key, "config");
		}
	}
	for (const [key, value] of Object.entries(env)) {
		if (!hasNonEmptyString(value)) continue;
		for (const [prefix, channelId] of channelEnvPrefixes) if (key.startsWith(prefix)) {
			configuredChannelIds.add(channelId);
			addSignal(channelId, "env");
		}
	}
	if (options.includePersistedAuthState !== false && hasPersistedChannelState(env)) {
		for (const channelId of listPersistedAuthStateChannelIds(options)) if (hasPersistedAuthState({
			channelId,
			cfg,
			env,
			options
		})) {
			configuredChannelIds.add(channelId);
			addSignal(channelId, "persisted-auth");
		}
	}
	return signals.filter((signal) => configuredChannelIds.has(signal.channelId));
}
//#endregion
export { listPotentialConfiguredChannelPresenceSignals as i, listExplicitlyDisabledChannelIdsForConfig as n, listPotentialConfiguredChannelIds as r, hasMeaningfulChannelConfig as t };
