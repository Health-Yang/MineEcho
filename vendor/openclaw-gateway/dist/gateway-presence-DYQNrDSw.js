import { p as readStringValue } from "./string-coerce-DKw2K5wM.js";
//#region src/commands/gateway-presence.ts
function pickGatewaySelfPresence(presence) {
	if (!Array.isArray(presence)) return null;
	const entries = presence;
	const self = entries.find((e) => e.mode === "gateway" && e.reason === "self") ?? entries.find((e) => typeof e.text === "string" && e.text.startsWith("Gateway:")) ?? null;
	if (!self) return null;
	return {
		host: readStringValue(self.host),
		ip: readStringValue(self.ip),
		version: readStringValue(self.version),
		platform: readStringValue(self.platform)
	};
}
//#endregion
export { pickGatewaySelfPresence as t };
