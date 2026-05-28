import { r as asOptionalObjectRecord } from "./record-coerce-Btbek4uV.js";
import { s as normalizePluginsConfig } from "./config-state-CzzsKZJi.js";
import { t as loadBundledPluginPublicArtifactModuleSync } from "./public-surface-loader-BtpHXlhR.js";
import { i as passesManifestOwnerBasePolicy } from "./manifest-owner-policy-BKVRFeLo.js";
import { a as registerHealthCheck } from "./health-check-registry-iNxbMjrn.js";
//#region src/flows/bundled-health-checks.ts
function registerBundledHealthChecks(params) {
	if (!shouldRegisterPolicyHealth(params)) return;
	loadBundledPluginPublicArtifactModuleSync({
		dirName: "policy",
		artifactBasename: "api.js"
	}).registerPolicyDoctorChecks?.({ registerHealthCheck });
}
function shouldRegisterPolicyHealth(params) {
	const entry = params.cfg.plugins?.entries?.policy;
	const config = asOptionalObjectRecord(entry?.config) ?? {};
	if (entry === void 0 || entry.enabled === false || config.enabled === false) return false;
	if (!passesManifestOwnerBasePolicy({
		plugin: { id: "policy" },
		normalizedConfig: normalizePluginsConfig(params.cfg.plugins)
	})) return false;
	return entry.enabled === true || config.enabled === true;
}
//#endregion
export { registerBundledHealthChecks as t };
