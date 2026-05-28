import { $n as ProviderThinkingProfile, Zn as ProviderDefaultThinkingPolicyContext } from "./types-qwKXExVW.js";
//#region extensions/vllm/thinking-policy.d.ts
type VllmQwenThinkingFormat = "chat-template" | "top-level";
declare function normalizeVllmQwenThinkingFormat(value: unknown): VllmQwenThinkingFormat | undefined;
declare function resolveVllmQwenThinkingFormatFromCompat(compat?: ProviderDefaultThinkingPolicyContext["compat"]): VllmQwenThinkingFormat | undefined;
declare function resolveThinkingProfile(ctx: ProviderDefaultThinkingPolicyContext): ProviderThinkingProfile | null;
//#endregion
export { resolveVllmQwenThinkingFormatFromCompat as i, normalizeVllmQwenThinkingFormat as n, resolveThinkingProfile as r, VllmQwenThinkingFormat as t };