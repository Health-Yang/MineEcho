import { n as mergePluginTextTransforms } from "./plugin-text-transforms-BpWFUQhi.js";
import { t as getActiveRuntimePluginRegistry } from "./active-runtime-registry-B4V2YD1G.js";
//#region src/plugins/text-transforms.runtime.ts
function resolveRuntimeTextTransforms() {
	const registry = getActiveRuntimePluginRegistry();
	return mergePluginTextTransforms(...Array.isArray(registry?.textTransforms) ? registry.textTransforms.map((entry) => entry.transforms) : []);
}
//#endregion
export { resolveRuntimeTextTransforms as t };
