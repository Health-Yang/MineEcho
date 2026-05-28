import { Sn as ProviderReplayPolicyContext, xn as ProviderReplayPolicy } from "../../types-qwKXExVW.js";
//#region extensions/anthropic/replay-policy.d.ts
declare const buildReplayPolicy: ((ctx: ProviderReplayPolicyContext) => ProviderReplayPolicy | null | undefined) | undefined;
//#endregion
export { buildReplayPolicy as buildAnthropicReplayPolicy };