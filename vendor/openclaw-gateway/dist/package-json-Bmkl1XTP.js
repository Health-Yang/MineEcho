import { o as normalizeNullableString } from "./string-coerce-DKw2K5wM.js";
import { o as tryReadJson } from "./json-files-za1pmDfK.js";
import path from "node:path";
//#region src/infra/package-json.ts
async function readPackageJson(root) {
	const parsed = await tryReadJson(path.join(root, "package.json"));
	return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
}
async function readPackageVersion(root) {
	return normalizeNullableString((await readPackageJson(root))?.version);
}
async function readPackageName(root) {
	return normalizeNullableString((await readPackageJson(root))?.name);
}
async function readPackageManagerSpec(root) {
	return normalizeNullableString((await readPackageJson(root))?.packageManager);
}
//#endregion
export { readPackageName as n, readPackageVersion as r, readPackageManagerSpec as t };
