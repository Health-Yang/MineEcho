//#region src/plugins/sdk-alias.d.ts
type PluginSdkAliasCandidateKind = "dist" | "src";
type PluginSdkResolutionPreference = "auto" | "dist" | "src";
type LoaderModuleResolveParams = {
  modulePath?: string;
  argv1?: string;
  cwd?: string;
  moduleUrl?: string;
  pluginSdkResolution?: PluginSdkResolutionPreference;
};
type PluginRuntimeModuleResolution = {
  modulePath?: string;
  packageRoot: string | null;
  candidates: string[];
  resolvedPath: string | null;
  error?: string;
};
declare function normalizeJitiAliasTargetPath(targetPath: string): string;
declare function resolveLoaderPackageRoot(params: LoaderModuleResolveParams & {
  modulePath: string;
}): string | null;
declare function resolvePluginSdkAliasCandidateOrder(params: {
  modulePath: string;
  isProduction: boolean;
  pluginSdkResolution?: PluginSdkResolutionPreference;
}): PluginSdkAliasCandidateKind[];
declare function listPluginSdkAliasCandidates(params: {
  srcFile: string;
  distFile: string;
  modulePath: string;
  argv1?: string;
  cwd?: string;
  moduleUrl?: string;
  pluginSdkResolution?: PluginSdkResolutionPreference;
}): string[];
declare function resolvePluginSdkAliasFile(params: {
  srcFile: string;
  distFile: string;
  modulePath?: string;
  argv1?: string;
  cwd?: string;
  moduleUrl?: string;
  pluginSdkResolution?: PluginSdkResolutionPreference;
}): string | null;
declare function listPluginSdkExportedSubpaths(params?: {
  modulePath?: string;
  argv1?: string;
  moduleUrl?: string;
  pluginSdkResolution?: PluginSdkResolutionPreference;
}): string[];
declare function resolvePluginSdkScopedAliasMap(params?: {
  modulePath?: string;
  argv1?: string;
  moduleUrl?: string;
  pluginSdkResolution?: PluginSdkResolutionPreference;
}): Record<string, string>;
declare function resolveExtensionApiAlias(params?: LoaderModuleResolveParams): string | null;
declare function buildPluginLoaderAliasMap(modulePath: string, argv1?: string | undefined, moduleUrl?: string, pluginSdkResolution?: PluginSdkResolutionPreference): Record<string, string>;
declare function resolvePluginRuntimeModulePath(params?: LoaderModuleResolveParams): string | null;
declare function resolvePluginRuntimeModulePathWithDiagnostics(params?: LoaderModuleResolveParams): PluginRuntimeModuleResolution;
declare function buildPluginLoaderJitiOptions(aliasMap: Record<string, string>): {
  alias?: Record<string, string> | undefined;
  interopDefault: boolean;
  tryNative: boolean;
  extensions: string[];
};
declare function shouldPreferNativeModuleLoad(modulePath: string): boolean;
declare function resolvePluginLoaderTryNative(modulePath: string, options?: {
  preferBuiltDist?: boolean;
}): boolean;
declare function createPluginLoaderModuleCacheKey(params: {
  tryNative: boolean;
  aliasMap: Record<string, string>;
}): string;
declare function resolvePluginLoaderModuleConfig(params: {
  modulePath: string;
  argv1?: string;
  moduleUrl: string;
  preferBuiltDist?: boolean;
  pluginSdkResolution?: PluginSdkResolutionPreference;
}): {
  tryNative: boolean;
  aliasMap: Record<string, string>;
  cacheKey: string;
};
declare function isBundledPluginExtensionPath(params: {
  modulePath: string;
  openClawPackageRoot: string;
  bundledPluginsDir?: string;
}): boolean;
//#endregion
export { resolvePluginSdkAliasCandidateOrder as _, buildPluginLoaderJitiOptions as a, shouldPreferNativeModuleLoad as b, listPluginSdkAliasCandidates as c, resolveExtensionApiAlias as d, resolveLoaderPackageRoot as f, resolvePluginRuntimeModulePathWithDiagnostics as g, resolvePluginRuntimeModulePath as h, buildPluginLoaderAliasMap as i, listPluginSdkExportedSubpaths as l, resolvePluginLoaderTryNative as m, PluginRuntimeModuleResolution as n, createPluginLoaderModuleCacheKey as o, resolvePluginLoaderModuleConfig as p, PluginSdkResolutionPreference as r, isBundledPluginExtensionPath as s, LoaderModuleResolveParams as t, normalizeJitiAliasTargetPath as u, resolvePluginSdkAliasFile as v, resolvePluginSdkScopedAliasMap as y };