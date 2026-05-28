import { a as isPathInsideWithRealpath, i as isPathInside } from "./path-BlG8lhgR.js";
import { E as pathExists } from "./fs-safe-JUdtLZkh.js";
import { s as resolveArchiveKind } from "./archive-CdsVsET0.js";
import { n as readJson } from "./json-files-za1pmDfK.js";
import { c as validateRegistryNpmSpec } from "./npm-registry-spec-EtjA4w_n.js";
import "./scan-paths-BJFKmVji.js";
import "./archive-CBe_wA_B.js";
import { i as resolveArchiveSourcePath } from "./install-source-utils-KysVueYJ.js";
import { i as withExtractedArchiveRoot, n as installPackageDirWithManifestDeps, r as resolveExistingInstallPath, t as installPackageDir } from "./install-package-dir-ofViWHxA.js";
import { a as finalizeNpmSpecArchiveInstall, i as resolveTimedInstallModeOptions, n as resolveCanonicalInstallTarget, o as installFromNpmSpecArchiveWithInstaller, r as resolveInstallModeOptions, t as ensureInstallTargetAvailable } from "./install-target-CdNLLTpq.js";
//#region src/infra/install-from-npm-spec.ts
async function installFromValidatedNpmSpecArchive(params) {
	const spec = params.spec.trim();
	const specError = validateRegistryNpmSpec(spec);
	if (specError) return {
		ok: false,
		error: specError
	};
	return finalizeNpmSpecArchiveInstall(await installFromNpmSpecArchiveWithInstaller({
		tempDirPrefix: params.tempDirPrefix,
		spec,
		timeoutMs: params.timeoutMs,
		expectedIntegrity: params.expectedIntegrity,
		onIntegrityDrift: params.onIntegrityDrift,
		warn: params.warn,
		installFromArchive: params.installFromArchive,
		archiveInstallParams: params.archiveInstallParams
	}));
}
//#endregion
export { ensureInstallTargetAvailable, pathExists as fileExists, installFromValidatedNpmSpecArchive, installPackageDir, installPackageDirWithManifestDeps, isPathInside, isPathInsideWithRealpath, readJson as readJsonFile, resolveArchiveKind, resolveArchiveSourcePath, resolveCanonicalInstallTarget, resolveExistingInstallPath, resolveInstallModeOptions, resolveTimedInstallModeOptions, withExtractedArchiveRoot };
