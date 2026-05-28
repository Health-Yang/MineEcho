export type BundledPluginLoadPathAliasKind = "current" | "legacy";
export type BundledPluginLoadPathAlias = {
    kind: BundledPluginLoadPathAliasKind;
    path: string;
};
export type PackagedBundledPluginPath = {
    packageRoot: string;
    bundledRoot: string;
    bundledLeaf: string;
};
export type LegacyBundledPluginPath = {
    packageRoot: string;
    legacyRoot: string;
    bundledLeaf: string;
};
export declare function normalizeBundledLookupPath(targetPath: string): string;
export declare function parsePackagedBundledPluginPath(localPath: string): PackagedBundledPluginPath | null;
export declare function buildLegacyBundledPath(localPath: string): string | null;
export declare function buildLegacyBundledRootPath(localPath: string): string | null;
export declare function parseLegacyBundledPluginPath(localPath: string): LegacyBundledPluginPath | null;
export declare function buildBundledPluginLoadPathAliases(localPath: string): BundledPluginLoadPathAlias[];
export declare function resolvePackagedBundledLoadPathAlias(params: {
    bundledRoot?: string;
    loadPath: string;
}): BundledPluginLoadPathAlias | null;
