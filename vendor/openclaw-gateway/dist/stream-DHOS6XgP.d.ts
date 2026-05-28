import { Un as ProviderWrapStreamFnContext } from "./types-qwKXExVW.js";
import { t as VllmQwenThinkingFormat } from "./thinking-policy-D-VWElbA.js";
import { StreamFn } from "@earendil-works/pi-agent-core";

//#region extensions/vllm/stream.d.ts
type VllmThinkingLevel = ProviderWrapStreamFnContext["thinkingLevel"];
declare function createVllmQwenThinkingWrapper(params: {
  baseStreamFn: StreamFn | undefined;
  format: VllmQwenThinkingFormat;
  thinkingLevel: VllmThinkingLevel;
}): StreamFn;
declare function createVllmProviderThinkingWrapper(params: {
  baseStreamFn: StreamFn | undefined;
  qwenFormat?: VllmQwenThinkingFormat;
  thinkingLevel: VllmThinkingLevel;
}): StreamFn;
declare function wrapVllmProviderStream(ctx: ProviderWrapStreamFnContext): StreamFn | undefined;
//#endregion
export { createVllmQwenThinkingWrapper as n, wrapVllmProviderStream as r, createVllmProviderThinkingWrapper as t };