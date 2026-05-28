import { p as readStringValue } from "./string-coerce-DKw2K5wM.js";
import { t as isTruthyEnvValue } from "./env-DmmbBEHd.js";
import { c as isRecord } from "./utils-B5r0V84N.js";
import { c as resolveEffectiveEnableState, s as normalizePluginsConfig } from "./config-state-CzzsKZJi.js";
import { t as asBoolean } from "./boolean-CZag3-H2.js";
import "./runtime-env-CcOqZeJj.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { r as resolvePluginConfigObject } from "./plugin-config-runtime-CbVZSjfC.js";
//#region extensions/canvas/src/config.ts
function readPositiveInteger(value) {
	return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : void 0;
}
function parseCanvasHostConfig(value) {
	if (!isRecord(value)) return;
	return {
		...asBoolean(value.enabled) !== void 0 ? { enabled: asBoolean(value.enabled) } : {},
		...readStringValue(value.root) !== void 0 ? { root: readStringValue(value.root) } : {},
		...readPositiveInteger(value.port) !== void 0 ? { port: readPositiveInteger(value.port) } : {},
		...asBoolean(value.liveReload) !== void 0 ? { liveReload: asBoolean(value.liveReload) } : {}
	};
}
function parseCanvasPluginConfig(value) {
	if (!isRecord(value)) return {};
	const host = parseCanvasHostConfig(value.host);
	return host ? { host } : {};
}
function isCanvasPluginEnabled(config) {
	if (!config) return true;
	return resolveEffectiveEnableState({
		id: "canvas",
		origin: "bundled",
		config: normalizePluginsConfig(config.plugins),
		rootConfig: config,
		enabledByDefault: true
	}).enabled;
}
function resolveCanvasHostConfig(params) {
	return parseCanvasPluginConfig(params.pluginConfig ?? resolvePluginConfigObject(params.config, "canvas") ?? {}).host ?? {};
}
function isCanvasHostEnabled(config) {
	if (isTruthyEnvValue(process.env.OPENCLAW_SKIP_CANVAS_HOST)) return false;
	if (!isCanvasPluginEnabled(config)) return false;
	return resolveCanvasHostConfig({ config }).enabled !== false;
}
const canvasConfigSchema = {
	parse: parseCanvasPluginConfig,
	uiHints: {
		host: {
			label: "Canvas Host",
			help: "Serves local Canvas and A2UI files for paired nodes.",
			advanced: true
		},
		"host.enabled": {
			label: "Canvas Host Enabled",
			advanced: true
		},
		"host.root": {
			label: "Canvas Host Root Directory",
			help: "Directory to serve. Defaults to the OpenClaw state canvas directory.",
			advanced: true
		},
		"host.port": {
			label: "Canvas Host Port",
			advanced: true
		},
		"host.liveReload": {
			label: "Canvas Host Live Reload",
			advanced: true
		}
	}
};
//#endregion
export { resolveCanvasHostConfig as a, parseCanvasPluginConfig as i, isCanvasHostEnabled as n, isCanvasPluginEnabled as r, canvasConfigSchema as t };
