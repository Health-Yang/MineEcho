import { r as AnyAgentTool } from "../../common-BDN0bXby.js";
import { $n as ProviderThinkingProfile, In as ProviderSanitizeReplayHistoryContext, Rn as ProviderToolSchemaDiagnostic, Sn as ProviderReplayPolicyContext, Zn as ProviderDefaultThinkingPolicyContext, an as ProviderNormalizeToolSchemasContext, bn as ProviderReasoningOutputModeContext, xn as ProviderReplayPolicy, yn as ProviderReasoningOutputMode } from "../../types-qwKXExVW.js";
import { d as createGoogleThinkingStreamWrapper } from "../../provider-stream-shared-Bk5DrhkD.js";
//#region extensions/google/provider-hooks.d.ts
declare const GOOGLE_GEMINI_PROVIDER_HOOKS: {
  resolveThinkingProfile: (context: ProviderDefaultThinkingPolicyContext) => ProviderThinkingProfile | undefined;
  wrapStreamFn: typeof createGoogleThinkingStreamWrapper;
  normalizeToolSchemas: (ctx: ProviderNormalizeToolSchemasContext) => AnyAgentTool[];
  inspectToolSchemas: (ctx: ProviderNormalizeToolSchemasContext) => ProviderToolSchemaDiagnostic[];
  buildReplayPolicy?: ((ctx: ProviderReplayPolicyContext) => ProviderReplayPolicy | null | undefined) | undefined;
  sanitizeReplayHistory?: ((ctx: ProviderSanitizeReplayHistoryContext) => Promise<import("@earendil-works/pi-agent-core").AgentMessage[] | null | undefined> | import("@earendil-works/pi-agent-core").AgentMessage[] | null | undefined) | undefined;
  resolveReasoningOutputMode?: ((ctx: ProviderReasoningOutputModeContext) => ProviderReasoningOutputMode | null | undefined) | undefined;
};
//#endregion
export { GOOGLE_GEMINI_PROVIDER_HOOKS };