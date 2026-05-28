import { Bn as ProviderTransportTurnState, Hn as ProviderWebSocketSessionPolicy, Nn as ProviderResolveWebSocketSessionPolicyContext, jn as ProviderResolveTransportTurnStateContext } from "../../types-qwKXExVW.js";
//#region extensions/openai/transport-policy.d.ts
declare function resolveOpenAITransportTurnState(ctx: ProviderResolveTransportTurnStateContext): ProviderTransportTurnState | undefined;
declare function resolveOpenAIWebSocketSessionPolicy(ctx: ProviderResolveWebSocketSessionPolicyContext): ProviderWebSocketSessionPolicy | undefined;
//#endregion
export { resolveOpenAITransportTurnState, resolveOpenAIWebSocketSessionPolicy };