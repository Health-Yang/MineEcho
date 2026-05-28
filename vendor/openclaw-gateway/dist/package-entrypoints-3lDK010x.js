import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import path from "node:path";
//#region src/plugins/package-entrypoints.ts
function isTypeScriptPackageEntry(entryPath) {
	return [
		".ts",
		".mts",
		".cts"
	].includes(path.extname(entryPath).toLowerCase());
}
function listBuiltRuntimeEntryCandidates(entryPath) {
	if (!isTypeScriptPackageEntry(entryPath)) return [];
	const normalized = entryPath.replace(/\\/g, "/");
	const withoutExtension = normalized.replace(/\.[^.]+$/u, "");
	const normalizedRelative = normalized.replace(/^\.\//u, "");
	const distWithoutExtension = normalizedRelative.startsWith("src/") ? `./dist/${normalizedRelative.slice(4).replace(/\.[^.]+$/u, "")}` : `./dist/${withoutExtension.replace(/^\.\//u, "")}`;
	const withJavaScriptExtensions = (basePath) => [
		`${basePath}.js`,
		`${basePath}.mjs`,
		`${basePath}.cjs`
	];
	return uniqueStrings([...withJavaScriptExtensions(distWithoutExtension), ...withJavaScriptExtensions(withoutExtension)]).filter((candidate) => candidate !== normalized);
}
//#endregion
export { listBuiltRuntimeEntryCandidates as n, isTypeScriptPackageEntry as t };
