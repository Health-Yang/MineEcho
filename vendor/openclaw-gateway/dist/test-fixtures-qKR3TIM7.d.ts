import { a as SandboxSshConfig, i as SandboxPruneConfig, t as SandboxBrowserConfig } from "./types-ACakgnSA.js";
//#region src/plugin-sdk/test-helpers/sandbox-fixtures.d.ts
declare function createSandboxBrowserConfig(overrides?: Partial<SandboxBrowserConfig>): SandboxBrowserConfig;
declare function createSandboxPruneConfig(overrides?: Partial<SandboxPruneConfig>): SandboxPruneConfig;
declare function createSandboxSshConfig(workspaceRoot: string, overrides?: Partial<SandboxSshConfig>): SandboxSshConfig;
//#endregion
//#region src/plugin-sdk/test-helpers/bundled-plugin-paths.d.ts
declare const BUNDLED_PLUGIN_ROOT_DIR = "extensions";
declare const BUNDLED_PLUGIN_PATH_PREFIX = "extensions/";
declare const BUNDLED_PLUGIN_TEST_GLOB = "extensions/**/*.test.ts";
declare function bundledPluginRoot(pluginId: string): string;
declare function bundledPluginFile(pluginId: string, relativePath: string): string;
declare function bundledPluginDirPrefix(pluginId: string, relativeDir: string): string;
declare function bundledPluginRootAt(baseDir: string, pluginId: string): string;
declare function bundledPluginFileAt(baseDir: string, pluginId: string, relativePath: string): string;
declare function bundledDistPluginRoot(pluginId: string): string;
declare function bundledDistPluginFile(pluginId: string, relativePath: string): string;
declare function bundledDistPluginRootAt(baseDir: string, pluginId: string): string;
declare function bundledDistPluginFileAt(baseDir: string, pluginId: string, relativePath: string): string;
declare function installedPluginRoot(baseDir: string, pluginId: string): string;
declare function repoInstallSpec(pluginId: string): string;
//#endregion
//#region src/plugin-sdk/test-helpers/import-fresh.d.ts
declare function importFreshModule<TModule>(from: string, specifier: string): Promise<TModule>;
//#endregion
//#region src/plugin-sdk/test-helpers/image-fixtures.d.ts
type Rgba = {
  r: number;
  g: number;
  b: number;
  a?: number;
};
declare function createSolidPngBuffer(width: number, height: number, color: Rgba): Buffer;
declare function createNoisyPngBuffer(width: number, height: number): Buffer;
declare function createGrayscaleAlphaPngBuffer(width: number, height: number): Buffer;
declare function createNoisyRgbaBuffer(width: number, height: number): Buffer;
//#endregion
export { createSandboxSshConfig as S, bundledPluginRootAt as _, importFreshModule as a, createSandboxBrowserConfig as b, BUNDLED_PLUGIN_TEST_GLOB as c, bundledDistPluginRoot as d, bundledDistPluginRootAt as f, bundledPluginRoot as g, bundledPluginFileAt as h, createSolidPngBuffer as i, bundledDistPluginFile as l, bundledPluginFile as m, createNoisyPngBuffer as n, BUNDLED_PLUGIN_PATH_PREFIX as o, bundledPluginDirPrefix as p, createNoisyRgbaBuffer as r, BUNDLED_PLUGIN_ROOT_DIR as s, createGrayscaleAlphaPngBuffer as t, bundledDistPluginFileAt as u, installedPluginRoot as v, createSandboxPruneConfig as x, repoInstallSpec as y };