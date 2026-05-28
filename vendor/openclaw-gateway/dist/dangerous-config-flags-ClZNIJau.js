import { c as isRecord } from "./utils-B5r0V84N.js";
import "./agent-scope-CudANNo3.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { t as collectPluginConfigContractMatches } from "./config-contract-matches-iiEX69xg.js";
import { t as resolvePluginConfigContractsById } from "./config-contracts-CMnyexZ7.js";
import { n as collectEnabledInsecureOrDangerousFlagsFromContracts, t as collectEnabledInsecureOrDangerousFlagsFromCurrentSnapshot } from "./dangerous-config-flags-current-D7XM5Ot2.js";
//#region src/security/dangerous-config-flags.ts
function collectEnabledInsecureOrDangerousFlags(cfg, options = {}) {
	const pluginEntries = cfg.plugins?.entries;
	if (!isRecord(pluginEntries)) return collectEnabledInsecureOrDangerousFlagsFromContracts(cfg);
	const pluginIds = Object.keys(pluginEntries);
	if (options.preferCurrentPluginMetadataSnapshot) {
		const currentSnapshotFlags = collectEnabledInsecureOrDangerousFlagsFromCurrentSnapshot(cfg);
		if (currentSnapshotFlags) return currentSnapshotFlags;
	}
	return collectEnabledInsecureOrDangerousFlagsFromContracts(cfg, {
		collectPluginConfigContractMatches,
		configContractsById: resolvePluginConfigContractsById({
			config: cfg,
			workspaceDir: resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg)),
			env: process.env,
			pluginIds
		})
	});
}
//#endregion
export { collectEnabledInsecureOrDangerousFlags as t };
