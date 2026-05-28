import { r as createLegacyPrivateNetworkDoctorContract } from "./ssrf-policy-BJ6AORAh.js";
import "./ssrf-runtime-C8F9j9mo.js";
//#region extensions/tlon/src/doctor-contract.ts
const contract = createLegacyPrivateNetworkDoctorContract({ channelKey: "tlon" });
const legacyConfigRules = contract.legacyConfigRules;
const normalizeCompatibilityConfig = contract.normalizeCompatibilityConfig;
//#endregion
export { normalizeCompatibilityConfig as n, legacyConfigRules as t };
