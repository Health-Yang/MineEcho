import { g as sortUniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { i as loadPluginMetadataSnapshot } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { r as listAvailableManifestContractPlugins, t as hasManifestContractValue } from "./manifest-contract-eligibility-BhX2UsCC.js";
//#region src/plugins/manifest-contract-runtime.ts
const DEMAND_ONLY_CONTRACT_LOOKUP_OPTIONS = { preferPersisted: false };
function resolveManifestContractRuntimePluginResolution(params) {
	const snapshot = loadPluginMetadataSnapshot({
		config: params.cfg ?? {},
		env: process.env,
		...DEMAND_ONLY_CONTRACT_LOOKUP_OPTIONS
	});
	const allContractPlugins = snapshot.plugins.filter((plugin) => hasManifestContractValue({
		plugin,
		contract: params.contract,
		value: params.value
	}));
	const bundledCompatPluginIds = allContractPlugins.filter((plugin) => plugin.origin === "bundled").map((plugin) => plugin.id);
	return {
		pluginIds: sortUniqueStrings(listAvailableManifestContractPlugins({
			snapshot: {
				index: snapshot.index,
				plugins: allContractPlugins
			},
			contract: params.contract,
			value: params.value,
			config: params.cfg
		}).map((plugin) => plugin.id)),
		bundledCompatPluginIds: sortUniqueStrings(bundledCompatPluginIds)
	};
}
//#endregion
export { resolveManifestContractRuntimePluginResolution as t };
