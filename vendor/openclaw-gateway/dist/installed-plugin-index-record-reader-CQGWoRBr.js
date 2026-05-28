import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { o as isRecord } from "./record-coerce-Btbek4uV.js";
import { o as tryReadJson, p as tryReadJsonSync } from "./json-files-za1pmDfK.js";
import { a as resolveDefaultPluginNpmDir, c as validatePluginId } from "./install-paths-HdtNIDW3.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
//#region src/plugins/installed-plugin-index-store-path.ts
const INSTALLED_PLUGIN_INDEX_STORE_PATH = path.join("plugins", "installs.json");
function resolveInstalledPluginIndexStorePath(options = {}) {
	if (options.filePath) return options.filePath;
	const env = options.env ?? process.env;
	const stateDir = options.stateDir ?? resolveStateDir(env);
	return path.join(stateDir, INSTALLED_PLUGIN_INDEX_STORE_PATH);
}
//#endregion
//#region src/plugins/installed-plugin-index-record-reader.ts
function cloneInstallRecords(records) {
	return readRecordMap(records) ?? {};
}
const BLOCKED_RECORD_KEYS = new Set([
	"__proto__",
	"constructor",
	"prototype"
]);
function isSafeRecordKey(key) {
	return !BLOCKED_RECORD_KEYS.has(key);
}
function readRecordMap(value) {
	if (!isRecord(value)) return null;
	const records = {};
	for (const [pluginId, record] of Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right))) {
		if (!isSafeRecordKey(pluginId)) continue;
		if (isRecord(record) && typeof record.source === "string") records[pluginId] = structuredClone(record);
	}
	return records;
}
function readJsonObjectFileSync(filePath) {
	const parsed = tryReadJsonSync(filePath);
	return isRecord(parsed) ? parsed : null;
}
function readStringRecord(value) {
	if (!isRecord(value)) return {};
	const record = {};
	for (const [key, raw] of Object.entries(value).toSorted(([left], [right]) => left.localeCompare(right))) {
		if (!isSafeRecordKey(key)) continue;
		if (typeof raw === "string" && raw.trim()) record[key] = raw.trim();
	}
	return record;
}
function hasPackagePluginMetadata(manifest) {
	const openclaw = manifest.openclaw;
	if (!isRecord(openclaw)) return false;
	const extensions = openclaw.extensions;
	return Array.isArray(extensions) && extensions.some((entry) => typeof entry === "string");
}
function readManifestPluginId(packageDir) {
	const manifest = readJsonObjectFileSync(path.join(packageDir, "openclaw.plugin.json"));
	return (typeof manifest?.id === "string" ? manifest.id.trim() : "") || void 0;
}
function resolveRecoveredManagedNpmRoot(options = {}) {
	return path.resolve(options.stateDir ? path.join(options.stateDir, "npm") : resolveDefaultPluginNpmDir(options.env));
}
function resolveRecoveredManagedNpmPluginId(params) {
	const packageManifest = readJsonObjectFileSync(path.join(params.packageDir, "package.json"));
	if (!packageManifest || !hasPackagePluginMetadata(packageManifest)) return;
	const packageName = typeof packageManifest.name === "string" && packageManifest.name.trim() ? packageManifest.name.trim() : params.packageName;
	const pluginId = readManifestPluginId(params.packageDir) ?? packageName;
	return validatePluginId(pluginId) ? void 0 : pluginId;
}
function buildRecoveredManagedNpmInstallRecords(options = {}) {
	const npmRoot = resolveRecoveredManagedNpmRoot(options);
	const dependencies = readStringRecord(readJsonObjectFileSync(path.join(npmRoot, "package.json"))?.dependencies);
	const records = {};
	for (const [packageName, dependencySpec] of Object.entries(dependencies)) {
		const packageDir = path.join(npmRoot, "node_modules", packageName);
		let stat;
		try {
			stat = fs.statSync(packageDir);
		} catch {
			continue;
		}
		if (!stat.isDirectory()) continue;
		const pluginId = resolveRecoveredManagedNpmPluginId({
			packageName,
			packageDir
		});
		if (!pluginId) continue;
		const packageManifest = readJsonObjectFileSync(path.join(packageDir, "package.json"));
		const version = typeof packageManifest?.version === "string" && packageManifest.version.trim() ? packageManifest.version.trim() : void 0;
		records[pluginId] = {
			source: "npm",
			spec: `${packageName}@${dependencySpec}`,
			installPath: packageDir,
			...version ? {
				version,
				resolvedName: packageName,
				resolvedVersion: version
			} : {},
			...version ? { resolvedSpec: `${packageName}@${version}` } : {}
		};
	}
	return records;
}
function recordsShareInstallPath(left, right) {
	if (!left?.installPath || !right.installPath) return false;
	return path.resolve(left.installPath) === path.resolve(right.installPath);
}
function readInstallRecordVersion(record) {
	return record?.resolvedVersion ?? record?.version;
}
function mergeRecoveredManagedNpmRecord(params) {
	const persistedVersion = readInstallRecordVersion(params.persisted);
	const recoveredVersion = readInstallRecordVersion(params.recovered);
	if (params.persisted?.source === "npm" && recordsShareInstallPath(params.persisted, params.recovered) && recoveredVersion && persistedVersion !== recoveredVersion) {
		const next = {
			...params.persisted,
			...params.recovered
		};
		delete next.integrity;
		delete next.shasum;
		delete next.resolvedAt;
		delete next.installedAt;
		return next;
	}
	return params.persisted ?? params.recovered;
}
function mergeRecoveredManagedNpmInstallRecords(persisted, options) {
	const recovered = buildRecoveredManagedNpmInstallRecords(options);
	const merged = { ...persisted };
	for (const [pluginId, record] of Object.entries(recovered)) merged[pluginId] = mergeRecoveredManagedNpmRecord({
		persisted: merged[pluginId],
		recovered: record
	});
	return merged;
}
function extractPluginInstallRecordsFromPersistedInstalledPluginIndex(index) {
	if (!isRecord(index)) return null;
	if (Object.prototype.hasOwnProperty.call(index, "installRecords")) return readRecordMap(index.installRecords) ?? {};
	if (!Array.isArray(index.plugins)) return null;
	const records = {};
	for (const entry of index.plugins) {
		if (!isRecord(entry) || typeof entry.pluginId !== "string" || !isRecord(entry.installRecord)) continue;
		if (!isSafeRecordKey(entry.pluginId)) continue;
		records[entry.pluginId] = structuredClone(entry.installRecord);
	}
	return records;
}
async function readPersistedInstalledPluginIndexInstallRecords(options = {}) {
	return extractPluginInstallRecordsFromPersistedInstalledPluginIndex(await tryReadJson(resolveInstalledPluginIndexStorePath(options)));
}
function readPersistedInstalledPluginIndexInstallRecordsSync(options = {}) {
	return extractPluginInstallRecordsFromPersistedInstalledPluginIndex(tryReadJsonSync(resolveInstalledPluginIndexStorePath(options)));
}
const installRecordsCache = /* @__PURE__ */ new Map();
function readFileSignature(filePath) {
	try {
		const stat = fs.statSync(filePath, { bigint: true });
		const hash = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("base64url");
		return `${stat.mtimeNs}:${stat.ctimeNs}:${stat.size}:${hash}`;
	} catch {
		return "missing";
	}
}
function resolveInstallRecordsCacheKey(options) {
	return [path.resolve(resolveInstalledPluginIndexStorePath(options)), resolveRecoveredManagedNpmRoot(options)].join("\0");
}
function resolveManagedNpmInstallSignature(options) {
	const npmRoot = resolveRecoveredManagedNpmRoot(options);
	const rootManifestPath = path.join(npmRoot, "package.json");
	const dependencies = readStringRecord(readJsonObjectFileSync(rootManifestPath)?.dependencies);
	const packageSignatures = Object.keys(dependencies).map((packageName) => {
		const packageDir = path.join(npmRoot, "node_modules", packageName);
		return [
			packageName,
			readFileSignature(path.join(packageDir, "package.json")),
			readFileSignature(path.join(packageDir, "openclaw.plugin.json"))
		].join(":");
	});
	return [readFileSignature(rootManifestPath), ...packageSignatures].join("\0");
}
function resolveInstallRecordsCacheSignature(options) {
	return [readFileSignature(path.resolve(resolveInstalledPluginIndexStorePath(options))), resolveManagedNpmInstallSignature(options)].join("\0");
}
function clearLoadInstalledPluginIndexInstallRecordsCache() {
	installRecordsCache.clear();
}
async function loadInstalledPluginIndexInstallRecords(params = {}) {
	const cacheKey = resolveInstallRecordsCacheKey(params);
	const signature = resolveInstallRecordsCacheSignature(params);
	const cached = installRecordsCache.get(cacheKey);
	if (cached?.signature === signature) return cloneInstallRecords(cached.records);
	const records = cloneInstallRecords(mergeRecoveredManagedNpmInstallRecords(await readPersistedInstalledPluginIndexInstallRecords(params), params));
	installRecordsCache.set(cacheKey, {
		records,
		signature
	});
	return cloneInstallRecords(records);
}
function loadInstalledPluginIndexInstallRecordsSync(params = {}) {
	const cacheKey = resolveInstallRecordsCacheKey(params);
	const signature = resolveInstallRecordsCacheSignature(params);
	const cached = installRecordsCache.get(cacheKey);
	if (cached?.signature === signature) return cloneInstallRecords(cached.records);
	const records = cloneInstallRecords(mergeRecoveredManagedNpmInstallRecords(readPersistedInstalledPluginIndexInstallRecordsSync(params), params));
	installRecordsCache.set(cacheKey, {
		records,
		signature
	});
	return cloneInstallRecords(records);
}
//#endregion
export { readPersistedInstalledPluginIndexInstallRecordsSync as a, readPersistedInstalledPluginIndexInstallRecords as i, loadInstalledPluginIndexInstallRecords as n, resolveInstalledPluginIndexStorePath as o, loadInstalledPluginIndexInstallRecordsSync as r, clearLoadInstalledPluginIndexInstallRecordsCache as t };
