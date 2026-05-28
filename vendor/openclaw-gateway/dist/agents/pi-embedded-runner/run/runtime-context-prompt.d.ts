import { c as OPENCLAW_RUNTIME_CONTEXT_CUSTOM_TYPE, t as CurrentInboundPromptContext } from "../../../params-Dt3_O5uS.js";

//#region src/agents/pi-embedded-runner/run/runtime-context-prompt.d.ts
type RuntimeContextPromptParts = {
  prompt: string;
  runtimeContext?: string;
  runtimeOnly?: boolean;
  runtimeSystemContext?: string;
};
type RuntimeContextCustomMessage = {
  role: "custom";
  customType: string;
  content: string;
  display: false;
  details: {
    source: "openclaw-runtime-context";
  };
  timestamp: number;
};
type EmptyTranscriptMode = "model-prompt" | "runtime-event";
declare function buildCurrentInboundPromptContextPrefix(context: CurrentInboundPromptContext | undefined): string;
declare function buildCurrentInboundPrompt(params: {
  context: CurrentInboundPromptContext | undefined;
  prompt: string;
}): string;
declare function resolveRuntimeContextPromptParts(params: {
  effectivePrompt: string;
  transcriptPrompt?: string;
  emptyTranscriptMode?: EmptyTranscriptMode;
}): RuntimeContextPromptParts;
declare function buildRuntimeContextSystemContext(runtimeContext: string): string;
declare function buildRuntimeEventSystemContext(runtimeContext: string): string;
declare function buildRuntimeContextCustomMessage(runtimeContext: string | undefined): RuntimeContextCustomMessage | undefined;
//#endregion
export { OPENCLAW_RUNTIME_CONTEXT_CUSTOM_TYPE, RuntimeContextCustomMessage, buildCurrentInboundPrompt, buildCurrentInboundPromptContextPrefix, buildRuntimeContextCustomMessage, buildRuntimeContextSystemContext, buildRuntimeEventSystemContext, resolveRuntimeContextPromptParts };