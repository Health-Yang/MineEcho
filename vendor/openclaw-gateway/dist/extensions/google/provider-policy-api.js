import { a as normalizeGoogleProviderConfig, c as resolveGoogleThinkingProfile } from "../../provider-policy-BxyJw06c.js";
//#region extensions/google/provider-policy-api.ts
function normalizeConfig(params) {
	return normalizeGoogleProviderConfig(params.provider, params.providerConfig);
}
function resolveThinkingProfile(context) {
	return resolveGoogleThinkingProfile(context);
}
//#endregion
export { normalizeConfig, resolveThinkingProfile };
