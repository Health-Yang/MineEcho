import { Sn as ProviderReplayPolicyContext, xn as ProviderReplayPolicy } from "../../types-qwKXExVW.js";
//#region extensions/openai/replay-policy.d.ts
/**
 * Returns the provider-owned replay policy for OpenAI-family transports.
 */
declare function buildOpenAIReplayPolicy(ctx: ProviderReplayPolicyContext): ProviderReplayPolicy;
//#endregion
export { buildOpenAIReplayPolicy };