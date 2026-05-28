import { o as isRecord } from "./record-coerce-Btbek4uV.js";
//#region src/config/plugin-web-search-config.ts
function resolvePluginWebSearchConfig(config, pluginId) {
	const pluginConfig = config?.plugins?.entries?.[pluginId]?.config;
	if (!isRecord(pluginConfig)) return;
	return isRecord(pluginConfig.webSearch) ? pluginConfig.webSearch : void 0;
}
//#endregion
export { resolvePluginWebSearchConfig as t };
