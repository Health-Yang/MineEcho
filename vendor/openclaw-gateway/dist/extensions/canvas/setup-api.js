import { i as asOptionalRecord } from "../../record-coerce-Btbek4uV.js";
import "../../string-coerce-runtime-qOd7_06l.js";
import { t as definePluginEntry } from "../../plugin-entry-BiutI5rd.js";
//#region extensions/canvas/src/config-migration.ts
function mergeHostConfig(params) {
	return Object.assign({}, params.legacyHost, params.existingHost);
}
function migrateLegacyCanvasHostConfig(config) {
	const legacyHost = asOptionalRecord(config.canvasHost);
	if (!legacyHost) return null;
	const plugins = structuredClone(asOptionalRecord(config.plugins) ?? {});
	const entries = asOptionalRecord(plugins.entries) ?? {};
	const canvasEntry = asOptionalRecord(entries.canvas) ?? {};
	const canvasConfig = asOptionalRecord(canvasEntry.config) ?? {};
	const existingHost = asOptionalRecord(canvasConfig.host);
	entries.canvas = {
		...canvasEntry,
		config: {
			...canvasConfig,
			host: mergeHostConfig({
				legacyHost,
				existingHost
			})
		}
	};
	plugins.entries = entries;
	const next = {
		...config,
		plugins
	};
	delete next.canvasHost;
	return {
		config: next,
		changes: ["migrated canvasHost to plugins.entries.canvas.config.host"]
	};
}
//#endregion
//#region extensions/canvas/setup-api.ts
var setup_api_default = definePluginEntry({
	id: "canvas",
	name: "Canvas Setup",
	description: "Lightweight Canvas setup hooks",
	register(api) {
		api.registerConfigMigration((config) => migrateLegacyCanvasHostConfig(config));
	}
});
//#endregion
export { setup_api_default as default };
