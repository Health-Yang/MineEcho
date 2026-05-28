import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { Dn as ProviderResolveAuthProfileIdContext, Jt as ProviderExtraParamsForTransportResult, Qt as ProviderFollowupFallbackRouteResult, Un as ProviderWrapStreamFnContext, Zt as ProviderFollowupFallbackRouteContext, cn as ProviderPlugin, gn as ProviderPrepareExtraParamsContext, qt as ProviderExtraParamsForTransportContext } from "./types-qwKXExVW.js";
import { AssistantMessage } from "@earendil-works/pi-ai";
import { AgentMessage } from "@earendil-works/pi-agent-core";

//#region src/plugins/provider-hook-runtime.d.ts
type ProviderRuntimePluginLookupParams = {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  applyAutoEnable?: boolean;
  bundledProviderAllowlistCompat?: boolean;
  bundledProviderVitestCompat?: boolean;
};
type ProviderRuntimePluginHandle = ProviderRuntimePluginLookupParams & {
  plugin?: ProviderPlugin;
};
declare function clearProviderRuntimePluginCacheForTest(): void;
declare function resolveProviderRuntimePlugin(params: ProviderRuntimePluginLookupParams): ProviderPlugin | undefined;
declare function prepareProviderExtraParams(params: {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  runtimeHandle?: ProviderRuntimePluginHandle;
  context: ProviderPrepareExtraParamsContext;
}): Record<string, unknown> | undefined;
declare function resolveProviderExtraParamsForTransport(params: {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  runtimeHandle?: ProviderRuntimePluginHandle;
  context: ProviderExtraParamsForTransportContext;
}): ProviderExtraParamsForTransportResult | undefined;
declare function resolveProviderAuthProfileId(params: {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  runtimeHandle?: ProviderRuntimePluginHandle;
  context: ProviderResolveAuthProfileIdContext;
}): string | undefined;
declare function resolveProviderFollowupFallbackRoute(params: {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  runtimeHandle?: ProviderRuntimePluginHandle;
  context: ProviderFollowupFallbackRouteContext;
}): ProviderFollowupFallbackRouteResult | undefined;
declare function wrapProviderStreamFn(params: {
  provider: string;
  config?: OpenClawConfig;
  workspaceDir?: string;
  env?: NodeJS.ProcessEnv;
  runtimeHandle?: ProviderRuntimePluginHandle;
  context: ProviderWrapStreamFnContext;
}): import("@earendil-works/pi-agent-core").StreamFn | undefined;
//#endregion
export { resolveProviderExtraParamsForTransport as a, wrapProviderStreamFn as c, resolveProviderAuthProfileId as i, clearProviderRuntimePluginCacheForTest as n, resolveProviderFollowupFallbackRoute as o, prepareProviderExtraParams as r, resolveProviderRuntimePlugin as s, ProviderRuntimePluginHandle as t };