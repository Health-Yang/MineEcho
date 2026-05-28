import { n as buildProviderToolCompatFamilyHooks } from "./provider-tools-BUevcQsJ.js";
import { a as createGoogleThinkingStreamWrapper } from "./provider-stream-shared-B1wEfslJ.js";
import { a as buildProviderReplayFamilyHooks } from "./provider-model-shared-Co6lnz7Y.js";
import "./thinking-api-DyY0dXwj.js";
import { c as resolveGoogleThinkingProfile } from "./provider-policy-BxyJw06c.js";
//#region extensions/google/provider-hooks.ts
const GOOGLE_GEMINI_PROVIDER_HOOKS = {
	...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
	...buildProviderToolCompatFamilyHooks("gemini"),
	resolveThinkingProfile: (context) => resolveGoogleThinkingProfile(context),
	wrapStreamFn: createGoogleThinkingStreamWrapper
};
//#endregion
export { GOOGLE_GEMINI_PROVIDER_HOOKS as t };
