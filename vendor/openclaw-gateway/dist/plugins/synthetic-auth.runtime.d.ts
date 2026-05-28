import { n as PluginRegistrySnapshot, t as LoadPluginRegistryParams } from "../plugin-registry-snapshot-MxswNX9K.js";

//#region src/plugins/synthetic-auth.runtime.d.ts
type SyntheticAuthProviderRefParams = LoadPluginRegistryParams & {
  index?: PluginRegistrySnapshot;
  registryDiagnostics?: readonly unknown[];
};
declare function resolveRuntimeSyntheticAuthProviderRefs(params?: SyntheticAuthProviderRefParams): string[];
declare function resolveRuntimeSyntheticAuthProviderRefState(params?: SyntheticAuthProviderRefParams): {
  refs: string[];
  complete: boolean;
};
declare function resolveRuntimeExternalAuthProviderRefs(params?: SyntheticAuthProviderRefParams): string[];
//#endregion
export { resolveRuntimeExternalAuthProviderRefs, resolveRuntimeSyntheticAuthProviderRefState, resolveRuntimeSyntheticAuthProviderRefs };