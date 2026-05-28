import { y as getCurrentPluginMetadataSnapshot } from "./plugin-registry-BALJ9TgI.js";
import { t as applyPluginAutoEnable } from "./plugin-auto-enable-CWrd66LC.js";
//#region src/gateway/runtime-plugin-config.ts
const gatewayPluginConfigCache = /* @__PURE__ */ new WeakMap();
function resolveGatewayPluginConfig(params) {
	const env = params.env ?? process.env;
	const currentSnapshot = getCurrentPluginMetadataSnapshot({
		config: params.config,
		env,
		allowWorkspaceScopedSnapshot: true
	});
	if (!currentSnapshot) return applyPluginAutoEnable({
		config: params.config,
		env
	}).config;
	const cached = gatewayPluginConfigCache.get(params.config);
	if (cached?.snapshot === currentSnapshot && cached.env === env) return cached.config;
	const config = applyPluginAutoEnable({
		config: params.config,
		env,
		manifestRegistry: currentSnapshot.manifestRegistry,
		discovery: currentSnapshot.discovery
	}).config;
	gatewayPluginConfigCache.set(params.config, {
		env,
		snapshot: currentSnapshot,
		config
	});
	return config;
}
//#endregion
export { resolveGatewayPluginConfig as t };
