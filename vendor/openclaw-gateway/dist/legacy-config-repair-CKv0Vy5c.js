import { c as isRecord } from "./utils-B5r0V84N.js";
import { E as validateConfigObjectWithPlugins, u as readConfigFileSnapshot } from "./io-BlARNTf3.js";
import "./includes-DwAz1VP4.js";
import { i as replaceConfigFile } from "./mutate-CxD4vMnm.js";
import "./config-BtNBbhZb.js";
import { t as migrateLegacyConfig } from "./legacy-config-migrate-BR29OBuW.js";
//#region src/commands/doctor/legacy-config-repair.ts
function containsAuthoredInclude(value) {
	if (!isRecord(value)) return false;
	if (Object.prototype.hasOwnProperty.call(value, "$include")) return true;
	return Object.values(value).some((entry) => containsAuthoredInclude(entry));
}
async function repairLegacyConfigForUpdateChannel(params) {
	if (containsAuthoredInclude(params.configSnapshot.parsed)) return {
		snapshot: params.configSnapshot,
		repaired: false
	};
	const migrated = migrateLegacyConfig(params.configSnapshot.parsed);
	if (!migrated.config) return {
		snapshot: params.configSnapshot,
		repaired: false
	};
	const validated = validateConfigObjectWithPlugins(migrated.config);
	if (!validated.ok) return {
		snapshot: params.configSnapshot,
		repaired: false
	};
	await replaceConfigFile({
		nextConfig: validated.config,
		baseHash: params.configSnapshot.hash,
		writeOptions: {
			allowConfigSizeDrop: true,
			skipOutputLogs: params.jsonMode
		}
	});
	const snapshot = await readConfigFileSnapshot();
	return {
		snapshot,
		repaired: snapshot.valid
	};
}
//#endregion
export { repairLegacyConfigForUpdateChannel };
