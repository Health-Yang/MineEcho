import { a as normalizeLowercaseStringOrEmpty, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { t as expandHomePrefix } from "./home-dir-B1vnNUyG.js";
import { _ as resolveOAuthDir, g as resolveNewStateDir, h as resolveLegacyStateDirs, y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { c as isWithinDir } from "./path-BlG8lhgR.js";
import "./agent-scope-CudANNo3.js";
import { c as parseAgentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { l as normalizeAgentId, n as DEFAULT_MAIN_KEY, r as buildAgentMainSessionKey, t as DEFAULT_AGENT_ID, u as normalizeMainKey } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-BfxErZq2.js";
import "./path-safety-CBe_wA_B.js";
import "./subsystem-1gTaEPwP.js";
import { c as listBundledChannelLegacySessionSurfaces, l as listBundledChannelLegacyStateMigrationDetectors } from "./bundled-CTRQpZ0m.js";
import { i as countPluginStateLiveEntries, n as MAX_PLUGIN_STATE_ENTRIES_PER_PLUGIN, t as createPluginStateKeyedStore } from "./plugin-state-store-BVbTs5d2.js";
import { t as canonicalizeMainSessionAlias } from "./main-session-896o98eb.js";
import { c as saveSessionStore } from "./store-B5j4GKkg.js";
import "./sessions-Ct4mpWsk.js";
import fs from "node:fs";
import JSON5 from "json5";
import path from "node:path";
import os from "node:os";
//#region src/infra/state-migrations.fs.ts
function safeReadDir(dir) {
	try {
		return fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return [];
	}
}
function existsDir(dir) {
	try {
		return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
	} catch {
		return false;
	}
}
function ensureDir(dir) {
	fs.mkdirSync(dir, { recursive: true });
}
function fileExists(p) {
	try {
		return fs.existsSync(p) && fs.statSync(p).isFile();
	} catch {
		return false;
	}
}
function readSessionStoreJson5(storePath) {
	try {
		return parseSessionStoreJson5(fs.readFileSync(storePath, "utf-8"));
	} catch {}
	return {
		store: {},
		ok: false
	};
}
function parseSessionStoreJson5(raw) {
	try {
		const parsed = JSON5.parse(raw);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return {
			store: parsed,
			ok: true
		};
	} catch {}
	return {
		store: {},
		ok: false
	};
}
//#endregion
//#region src/infra/state-migrations.ts
let autoMigrateStateDirChecked = false;
let cachedLegacySessionSurfaces = null;
function getLegacySessionSurfaces() {
	cachedLegacySessionSurfaces ??= [...listBundledChannelLegacySessionSurfaces()];
	return cachedLegacySessionSurfaces;
}
function isSurfaceGroupKey(key) {
	return key.includes(":group:") || key.includes(":channel:");
}
function isLegacyGroupKey(key) {
	const trimmed = key.trim();
	if (!trimmed) return false;
	const lower = normalizeLowercaseStringOrEmpty(trimmed);
	if (lower.startsWith("group:") || lower.startsWith("channel:")) return true;
	for (const surface of getLegacySessionSurfaces()) if (surface.isLegacyGroupSessionKey?.(trimmed)) return true;
	return false;
}
function buildLegacyMigrationPreview(plan) {
	if (plan.kind === "plugin-state-import") return plan.preview ?? `- ${plan.label}: ${plan.sourcePath}`;
	return `- ${plan.label}: ${plan.sourcePath} → ${plan.targetPath}`;
}
function resolvePluginStateImportTargetKey(scopeKey, key) {
	return scopeKey ? `${scopeKey}:${key}` : key;
}
function findMissingKey(expected, actual) {
	for (const key of expected) if (!actual.has(key)) return key;
}
async function withPluginStateImportEnv(plan, run) {
	if (!plan.stateDir) return await run();
	const previous = process.env.OPENCLAW_STATE_DIR;
	process.env.OPENCLAW_STATE_DIR = plan.stateDir;
	try {
		return await run();
	} finally {
		if (previous === void 0) delete process.env.OPENCLAW_STATE_DIR;
		else process.env.OPENCLAW_STATE_DIR = previous;
	}
}
async function runLegacyMigrationPlans(plans) {
	const changes = [];
	const warnings = [];
	for (const plan of plans) {
		if (plan.kind === "plugin-state-import") {
			await withPluginStateImportEnv(plan, async () => {
				let storeEntries = [];
				let pluginEntryCount = 0;
				const store = createPluginStateKeyedStore(plan.pluginId, {
					namespace: plan.namespace,
					maxEntries: plan.maxEntries
				});
				try {
					storeEntries = await store.entries();
					pluginEntryCount = countPluginStateLiveEntries(plan.pluginId);
				} catch (err) {
					warnings.push(`Failed reading ${plan.label} plugin state before migration: ${String(err)}`);
					return;
				}
				const existingKeys = new Set(storeEntries.map(({ key }) => key));
				const existingValuesByKey = new Map(storeEntries.map(({ key, value }) => [key, value]));
				const expectedKeys = new Set(existingKeys);
				let remainingCapacity = Math.max(0, plan.maxEntries - storeEntries.length);
				const entries = await plan.readEntries();
				const missingEntries = entries.filter(({ key }) => !existingKeys.has(resolvePluginStateImportTargetKey(plan.scopeKey, key)));
				const pluginRemainingCapacity = Math.max(0, MAX_PLUGIN_STATE_ENTRIES_PER_PLUGIN - pluginEntryCount);
				if (missingEntries.length > pluginRemainingCapacity) {
					warnings.push(`Skipped migrating ${plan.label} because plugin state has room for ${pluginRemainingCapacity} of ${missingEntries.length} missing entries; left legacy source in place`);
					return;
				}
				let imported = 0;
				const importedKeys = [];
				for (const entry of entries) {
					const targetKey = resolvePluginStateImportTargetKey(plan.scopeKey, entry.key);
					if (existingKeys.has(targetKey)) continue;
					if (remainingCapacity <= 0) break;
					try {
						await store.register(targetKey, entry.value);
						const nextExpectedKeys = new Set(expectedKeys);
						nextExpectedKeys.add(targetKey);
						const missingKey = findMissingKey(nextExpectedKeys, new Set((await store.entries()).map(({ key }) => key)));
						if (missingKey) {
							for (const importedKey of importedKeys.toReversed()) await store.delete(importedKey);
							await store.delete(targetKey);
							if (existingValuesByKey.has(missingKey)) await store.register(missingKey, existingValuesByKey.get(missingKey));
							warnings.push(`Stopped migrating ${plan.label} because plugin state cap evicted ${missingKey}; left legacy source in place`);
							return;
						}
						expectedKeys.add(targetKey);
						existingKeys.add(targetKey);
						importedKeys.push(targetKey);
						remainingCapacity--;
						imported++;
					} catch (err) {
						warnings.push(`Failed migrating ${plan.label} entry ${entry.key}: ${String(err)}`);
					}
				}
				if (imported > 0) changes.push(`Migrated ${imported} ${plan.label} ${imported === 1 ? "entry" : "entries"} → plugin state`);
				let cleanupKeys = existingKeys;
				if (plan.cleanupSource === "rename") cleanupKeys = expectedKeys;
				if (entries.length > 0 && entries.every(({ key }) => cleanupKeys.has(resolvePluginStateImportTargetKey(plan.scopeKey, key))) && plan.cleanupSource === "rename" && fileExists(plan.sourcePath)) {
					const archivedPath = `${plan.sourcePath}.migrated`;
					if (fileExists(archivedPath)) {
						warnings.push(`Left migrated ${plan.label} source in place because ${archivedPath} already exists`);
						return;
					}
					try {
						fs.renameSync(plan.sourcePath, archivedPath);
						changes.push(`Archived ${plan.label} legacy source → ${archivedPath}`);
					} catch (err) {
						warnings.push(`Failed archiving ${plan.label} legacy source: ${String(err)}`);
					}
				}
			});
			continue;
		}
		if (fileExists(plan.targetPath)) continue;
		try {
			ensureDir(path.dirname(plan.targetPath));
			if (plan.kind === "move") {
				fs.renameSync(plan.sourcePath, plan.targetPath);
				changes.push(`Moved ${plan.label} → ${plan.targetPath}`);
			} else {
				fs.copyFileSync(plan.sourcePath, plan.targetPath);
				changes.push(`Copied ${plan.label} → ${plan.targetPath}`);
			}
		} catch (err) {
			warnings.push(`Failed migrating ${plan.label} (${plan.sourcePath}): ${String(err)}`);
		}
	}
	return {
		changes,
		warnings
	};
}
function canonicalizeSessionKeyForAgent(params) {
	const agentId = normalizeAgentId(params.agentId);
	const raw = params.key.trim();
	if (!raw) return raw;
	const rawLower = normalizeLowercaseStringOrEmpty(raw);
	if (rawLower === "global" || rawLower === "unknown") return rawLower;
	if (params.skipCrossAgentRemap) {
		const parsed = parseAgentSessionKey(raw);
		if (parsed && normalizeAgentId(parsed.agentId) !== agentId) return rawLower;
		if (agentId !== "main" && (rawLower === "main" || rawLower === params.mainKey)) return rawLower;
	}
	const canonicalMain = canonicalizeMainSessionAlias({
		cfg: { session: {
			scope: params.scope,
			mainKey: params.mainKey
		} },
		agentId,
		sessionKey: raw
	});
	if (canonicalMain !== raw) return normalizeLowercaseStringOrEmpty(canonicalMain);
	const defaultPrefix = `agent:${DEFAULT_AGENT_ID}:`;
	if (rawLower.startsWith(defaultPrefix) && agentId !== "main" && !params.skipCrossAgentRemap) {
		const rest = rawLower.slice(defaultPrefix.length);
		if (rest === "main" || rest === params.mainKey) {
			const remapped = `agent:${agentId}:${rest}`;
			return normalizeLowercaseStringOrEmpty(canonicalizeMainSessionAlias({
				cfg: { session: {
					scope: params.scope,
					mainKey: params.mainKey
				} },
				agentId,
				sessionKey: remapped
			}));
		}
	}
	if (rawLower.startsWith("agent:")) return rawLower;
	if (rawLower.startsWith("subagent:")) return normalizeLowercaseStringOrEmpty(`agent:${agentId}:subagent:${raw.slice(9)}`);
	for (const surface of getLegacySessionSurfaces()) {
		const canonicalized = surface.canonicalizeLegacySessionKey?.({
			key: raw,
			agentId
		});
		const normalizedCanonicalized = normalizeOptionalLowercaseString(canonicalized);
		if (normalizedCanonicalized) return normalizedCanonicalized;
	}
	if (rawLower.startsWith("group:") || rawLower.startsWith("channel:")) return normalizeLowercaseStringOrEmpty(`agent:${agentId}:unknown:${raw}`);
	if (isSurfaceGroupKey(raw)) return normalizeLowercaseStringOrEmpty(`agent:${agentId}:${raw}`);
	return normalizeLowercaseStringOrEmpty(`agent:${agentId}:${raw}`);
}
function pickLatestLegacyDirectEntry(store) {
	let best = null;
	let bestUpdated = -1;
	for (const [key, entry] of Object.entries(store)) {
		if (!entry || typeof entry !== "object") continue;
		const normalized = key.trim();
		if (!normalized) continue;
		if (normalized === "global") continue;
		if (normalized.startsWith("agent:")) continue;
		if (normalizeLowercaseStringOrEmpty(normalized).startsWith("subagent:")) continue;
		if (isLegacyGroupKey(normalized) || isSurfaceGroupKey(normalized)) continue;
		const updatedAt = typeof entry.updatedAt === "number" ? entry.updatedAt : 0;
		if (updatedAt > bestUpdated) {
			bestUpdated = updatedAt;
			best = entry;
		}
	}
	return best;
}
function normalizeSessionEntry(entry) {
	const sessionId = typeof entry.sessionId === "string" ? entry.sessionId : null;
	if (!sessionId) return null;
	const updatedAt = typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : Date.now();
	const normalized = {
		...entry,
		sessionId,
		updatedAt
	};
	const rec = normalized;
	if (typeof rec.groupChannel !== "string" && typeof rec.room === "string") rec.groupChannel = rec.room;
	delete rec.room;
	return normalized;
}
function resolveUpdatedAt(entry) {
	return typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : 0;
}
function mergeSessionEntry(params) {
	if (!params.existing) return params.incoming;
	const existingUpdated = resolveUpdatedAt(params.existing);
	const incomingUpdated = resolveUpdatedAt(params.incoming);
	if (incomingUpdated > existingUpdated) return params.incoming;
	if (incomingUpdated < existingUpdated) return params.existing;
	return params.preferIncomingOnTie ? params.incoming : params.existing;
}
function canonicalizeSessionStore(params) {
	const canonical = {};
	const meta = /* @__PURE__ */ new Map();
	const legacyKeys = [];
	for (const [key, entry] of Object.entries(params.store)) {
		if (!entry || typeof entry !== "object") continue;
		const canonicalKey = canonicalizeSessionKeyForAgent({
			key,
			agentId: params.agentId,
			mainKey: params.mainKey,
			scope: params.scope,
			skipCrossAgentRemap: params.skipCrossAgentRemap
		});
		const isCanonical = canonicalKey === key;
		if (!isCanonical) legacyKeys.push(key);
		const existing = canonical[canonicalKey];
		if (!existing) {
			canonical[canonicalKey] = entry;
			meta.set(canonicalKey, {
				isCanonical,
				updatedAt: resolveUpdatedAt(entry)
			});
			continue;
		}
		const existingMeta = meta.get(canonicalKey);
		const incomingUpdated = resolveUpdatedAt(entry);
		const existingUpdated = existingMeta?.updatedAt ?? resolveUpdatedAt(existing);
		if (incomingUpdated > existingUpdated) {
			canonical[canonicalKey] = entry;
			meta.set(canonicalKey, {
				isCanonical,
				updatedAt: incomingUpdated
			});
			continue;
		}
		if (incomingUpdated < existingUpdated) continue;
		if (existingMeta?.isCanonical && !isCanonical) continue;
		if (!existingMeta?.isCanonical && isCanonical) {
			canonical[canonicalKey] = entry;
			meta.set(canonicalKey, {
				isCanonical,
				updatedAt: incomingUpdated
			});
			continue;
		}
	}
	return {
		store: canonical,
		legacyKeys
	};
}
function skipJson5Trivia(raw, index) {
	let i = index;
	while (i < raw.length) {
		const ch = raw[i];
		if (ch === " " || ch === "\n" || ch === "\r" || ch === "	") {
			i++;
			continue;
		}
		if (ch === "/" && raw[i + 1] === "/") {
			i += 2;
			while (i < raw.length && raw[i] !== "\n") i++;
			continue;
		}
		if (ch === "/" && raw[i + 1] === "*") {
			i += 2;
			while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) i++;
			return i < raw.length ? i + 2 : i;
		}
		break;
	}
	return i;
}
function readJson5String(raw, index) {
	const quote = raw[index];
	if (quote !== "\"" && quote !== "'") return null;
	let i = index + 1;
	let value = "";
	while (i < raw.length) {
		const ch = raw[i];
		if (ch === quote) return {
			value,
			next: i + 1
		};
		if (ch === "\\") return null;
		value += ch;
		i++;
	}
	return null;
}
function readJson5BareKey(raw, index) {
	let i = index;
	while (i < raw.length) {
		const ch = raw[i];
		if (ch === ":" || ch === " " || ch === "\n" || ch === "\r" || ch === "	" || ch === "," || ch === "}" || ch === "{" || ch === "[" || ch === "]") break;
		i++;
	}
	if (i === index) return null;
	return {
		value: raw.slice(index, i),
		next: i
	};
}
function listTopLevelSessionStoreKeys(raw) {
	let i = skipJson5Trivia(raw, 0);
	if (raw[i] !== "{") return null;
	i++;
	const keys = [];
	let depth = 1;
	let expectingKey = true;
	while (i < raw.length) {
		i = skipJson5Trivia(raw, i);
		const ch = raw[i];
		if (ch === void 0) return null;
		if (depth === 1 && ch === "}") return keys;
		if (depth === 1 && expectingKey) {
			const key = ch === "\"" || ch === "'" ? readJson5String(raw, i) : readJson5BareKey(raw, i);
			if (!key) return null;
			i = skipJson5Trivia(raw, key.next);
			if (raw[i] !== ":") return null;
			keys.push(key.value);
			i++;
			expectingKey = false;
			continue;
		}
		if (ch === "\"" || ch === "'") {
			const str = readJson5String(raw, i);
			if (!str) return null;
			i = str.next;
			continue;
		}
		if (ch === "{" || ch === "[") {
			depth++;
			i++;
			continue;
		}
		if (ch === "}" || ch === "]") {
			depth--;
			i++;
			if (depth < 1) return keys;
			continue;
		}
		if (depth === 1 && ch === ",") {
			expectingKey = true;
			i++;
			continue;
		}
		i++;
	}
	return null;
}
function sessionStoreTextMayNeedCanonicalization(params) {
	const keys = listTopLevelSessionStoreKeys(params.raw);
	if (!keys) return true;
	const storeAgentIds = new Set([...params.storeAgentIds].map((id) => normalizeAgentId(id)));
	const hasNonMainAgent = [...storeAgentIds].some((id) => id !== DEFAULT_AGENT_ID);
	for (const key of keys) {
		const rawKey = key.trim();
		if (rawKey !== key) return true;
		if (!rawKey) continue;
		const lowerKey = normalizeLowercaseStringOrEmpty(rawKey);
		if (lowerKey !== rawKey) return true;
		if (lowerKey === "global" || lowerKey === "unknown") continue;
		if (lowerKey === "main" || lowerKey === params.mainKey) return true;
		if (lowerKey.startsWith("subagent:")) return true;
		if (lowerKey.startsWith("group:") || lowerKey.startsWith("channel:")) return true;
		if (!lowerKey.startsWith("agent:")) return true;
		for (const storeAgentId of storeAgentIds) {
			const agentMainAlias = `agent:${storeAgentId}:${DEFAULT_MAIN_KEY}`;
			const agentMainKey = `agent:${storeAgentId}:${params.mainKey}`;
			if (lowerKey === agentMainAlias && (params.mainKey !== "main" || params.scope === "global")) return true;
			if (lowerKey === agentMainKey && params.scope === "global") return true;
		}
		if (lowerKey === `agent:main:main` && (params.mainKey !== "main" || hasNonMainAgent || params.scope === "global")) return true;
		if (lowerKey === `agent:main:${params.mainKey}` && hasNonMainAgent && !storeAgentIds.has("main")) return true;
	}
	return false;
}
function listLegacySessionKeys(params) {
	const legacy = [];
	for (const key of Object.keys(params.store)) if (canonicalizeSessionKeyForAgent({
		key,
		agentId: params.agentId,
		mainKey: params.mainKey,
		scope: params.scope
	}) !== key) legacy.push(key);
	return legacy;
}
function emptyDirOrMissing(dir) {
	if (!existsDir(dir)) return true;
	return safeReadDir(dir).length === 0;
}
function removeDirIfEmpty(dir) {
	if (!existsDir(dir)) return;
	if (!emptyDirOrMissing(dir)) return;
	try {
		fs.rmdirSync(dir);
	} catch {}
}
function resolveSymlinkTarget(linkPath) {
	try {
		const target = fs.readlinkSync(linkPath);
		return path.resolve(path.dirname(linkPath), target);
	} catch {
		return null;
	}
}
function formatStateDirMigration(legacyDir, targetDir) {
	return `State dir: ${legacyDir} → ${targetDir} (legacy path now symlinked)`;
}
function isDirPath(filePath) {
	try {
		return fs.statSync(filePath).isDirectory();
	} catch {
		return false;
	}
}
function isLegacyTreeSymlinkMirror(currentDir, realTargetDir) {
	let entries;
	try {
		entries = fs.readdirSync(currentDir, { withFileTypes: true });
	} catch {
		return false;
	}
	if (entries.length === 0) return false;
	for (const entry of entries) {
		const entryPath = path.join(currentDir, entry.name);
		let stat;
		try {
			stat = fs.lstatSync(entryPath);
		} catch {
			return false;
		}
		if (stat.isSymbolicLink()) {
			const resolvedTarget = resolveSymlinkTarget(entryPath);
			if (!resolvedTarget) return false;
			let resolvedRealTarget;
			try {
				resolvedRealTarget = fs.realpathSync(resolvedTarget);
			} catch {
				return false;
			}
			if (!isWithinDir(realTargetDir, resolvedRealTarget)) return false;
			continue;
		}
		if (stat.isDirectory()) {
			if (!isLegacyTreeSymlinkMirror(entryPath, realTargetDir)) return false;
			continue;
		}
		return false;
	}
	return true;
}
function isLegacyDirSymlinkMirror(legacyDir, targetDir) {
	let realTargetDir;
	try {
		realTargetDir = fs.realpathSync(targetDir);
	} catch {
		return false;
	}
	return isLegacyTreeSymlinkMirror(legacyDir, realTargetDir);
}
async function autoMigrateLegacyStateDir(params) {
	if (autoMigrateStateDirChecked) return {
		migrated: false,
		skipped: true,
		changes: [],
		warnings: []
	};
	autoMigrateStateDirChecked = true;
	if ((params.env ?? process.env).OPENCLAW_STATE_DIR?.trim()) return {
		migrated: false,
		skipped: true,
		changes: [],
		warnings: []
	};
	const homedir = params.homedir ?? os.homedir;
	const targetDir = resolveNewStateDir(homedir);
	const legacyDirs = resolveLegacyStateDirs(homedir);
	let legacyDir = legacyDirs.find((dir) => {
		try {
			return fs.existsSync(dir);
		} catch {
			return false;
		}
	});
	const warnings = [];
	const changes = [];
	let legacyStat = null;
	try {
		legacyStat = legacyDir ? fs.lstatSync(legacyDir) : null;
	} catch {
		legacyStat = null;
	}
	if (!legacyStat) return {
		migrated: false,
		skipped: false,
		changes,
		warnings
	};
	if (!legacyStat.isDirectory() && !legacyStat.isSymbolicLink()) {
		warnings.push(`Legacy state path is not a directory: ${legacyDir}`);
		return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
	}
	let symlinkDepth = 0;
	while (legacyStat.isSymbolicLink()) {
		const legacyTarget = legacyDir ? resolveSymlinkTarget(legacyDir) : null;
		if (!legacyTarget) {
			warnings.push(`Legacy state dir is a symlink (${legacyDir ?? "unknown"}); could not resolve target.`);
			return {
				migrated: false,
				skipped: false,
				changes,
				warnings
			};
		}
		if (path.resolve(legacyTarget) === path.resolve(targetDir)) return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
		if (legacyDirs.some((dir) => path.resolve(dir) === path.resolve(legacyTarget))) {
			legacyDir = legacyTarget;
			try {
				legacyStat = fs.lstatSync(legacyDir);
			} catch {
				legacyStat = null;
			}
			if (!legacyStat) {
				warnings.push(`Legacy state dir missing after symlink resolution: ${legacyDir}`);
				return {
					migrated: false,
					skipped: false,
					changes,
					warnings
				};
			}
			if (!legacyStat.isDirectory() && !legacyStat.isSymbolicLink()) {
				warnings.push(`Legacy state path is not a directory: ${legacyDir}`);
				return {
					migrated: false,
					skipped: false,
					changes,
					warnings
				};
			}
			symlinkDepth += 1;
			if (symlinkDepth > 2) {
				warnings.push(`Legacy state dir symlink chain too deep: ${legacyDir}`);
				return {
					migrated: false,
					skipped: false,
					changes,
					warnings
				};
			}
			continue;
		}
		warnings.push(`Legacy state dir is a symlink (${legacyDir ?? "unknown"} → ${legacyTarget}); skipping auto-migration.`);
		return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
	}
	if (isDirPath(targetDir)) {
		if (legacyDir && isLegacyDirSymlinkMirror(legacyDir, targetDir)) return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
		warnings.push(`State dir migration skipped: target already exists (${targetDir}). Remove or merge manually.`);
		return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
	}
	try {
		if (!legacyDir) throw new Error("Legacy state dir not found");
		fs.renameSync(legacyDir, targetDir);
	} catch (err) {
		warnings.push(`Failed to move legacy state dir (${legacyDir ?? "unknown"} → ${targetDir}): ${String(err)}`);
		return {
			migrated: false,
			skipped: false,
			changes,
			warnings
		};
	}
	try {
		if (!legacyDir) throw new Error("Legacy state dir not found");
		fs.symlinkSync(targetDir, legacyDir, "dir");
		changes.push(formatStateDirMigration(legacyDir, targetDir));
	} catch (err) {
		try {
			if (process.platform === "win32") {
				if (!legacyDir) throw new Error("Legacy state dir not found", { cause: err });
				fs.symlinkSync(targetDir, legacyDir, "junction");
				changes.push(formatStateDirMigration(legacyDir, targetDir));
			} else throw err;
		} catch (fallbackErr) {
			try {
				if (!legacyDir) throw new Error("Legacy state dir not found", { cause: fallbackErr });
				fs.renameSync(targetDir, legacyDir);
				warnings.push(`State dir migration rolled back (failed to link legacy path): ${String(fallbackErr)}`);
				return {
					migrated: false,
					skipped: false,
					changes: [],
					warnings
				};
			} catch (rollbackErr) {
				warnings.push(`State dir moved but failed to link legacy path (${legacyDir ?? "unknown"} → ${targetDir}): ${String(fallbackErr)}`);
				warnings.push(`Rollback failed; set OPENCLAW_STATE_DIR=${targetDir} to avoid split state: ${String(rollbackErr)}`);
				changes.push(`State dir: ${legacyDir ?? "unknown"} → ${targetDir}`);
			}
		}
	}
	return {
		migrated: changes.length > 0,
		skipped: false,
		changes,
		warnings
	};
}
async function collectChannelLegacyStateMigrationPlans(params) {
	const plans = [];
	const detectors = listBundledChannelLegacyStateMigrationDetectors({ config: params.cfg });
	for (const detectLegacyStateMigrations of detectors) {
		const detected = await detectLegacyStateMigrations({
			cfg: params.cfg,
			env: params.env,
			stateDir: params.stateDir,
			oauthDir: params.oauthDir
		});
		if (detected?.length) for (const detectedPlan of detected) {
			const plan = detectedPlan.kind === "plugin-state-import" && !detectedPlan.stateDir ? {
				...detectedPlan,
				stateDir: params.stateDir
			} : detectedPlan;
			plans.push(plan);
		}
	}
	return plans;
}
async function detectLegacyStateMigrations(params) {
	const env = params.env ?? process.env;
	const stateDir = resolveStateDir(env, params.homedir ?? os.homedir);
	const oauthDir = resolveOAuthDir(env, stateDir);
	const targetAgentId = normalizeAgentId(resolveDefaultAgentId(params.cfg));
	const rawMainKey = params.cfg.session?.mainKey;
	const targetMainKey = typeof rawMainKey === "string" && rawMainKey.trim().length > 0 ? rawMainKey.trim() : DEFAULT_MAIN_KEY;
	const targetScope = params.cfg.session?.scope;
	const sessionsLegacyDir = path.join(stateDir, "sessions");
	const sessionsLegacyStorePath = path.join(sessionsLegacyDir, "sessions.json");
	const sessionsTargetDir = path.join(stateDir, "agents", targetAgentId, "sessions");
	const sessionsTargetStorePath = path.join(sessionsTargetDir, "sessions.json");
	const legacySessionEntries = safeReadDir(sessionsLegacyDir);
	const hasLegacySessions = fileExists(sessionsLegacyStorePath) || legacySessionEntries.some((e) => e.isFile() && e.name.endsWith(".jsonl"));
	const targetSessionParsed = fileExists(sessionsTargetStorePath) ? readSessionStoreJson5(sessionsTargetStorePath) : {
		store: {},
		ok: true
	};
	const legacyKeys = targetSessionParsed.ok ? listLegacySessionKeys({
		store: targetSessionParsed.store,
		agentId: targetAgentId,
		mainKey: targetMainKey,
		scope: targetScope
	}) : [];
	const legacyAgentDir = path.join(stateDir, "agent");
	const targetAgentDir = path.join(stateDir, "agents", targetAgentId, "agent");
	const hasLegacyAgentDir = existsDir(legacyAgentDir);
	const channelPlans = await collectChannelLegacyStateMigrationPlans({
		cfg: params.cfg,
		env,
		stateDir,
		oauthDir
	});
	const preview = [];
	if (hasLegacySessions) preview.push(`- Sessions: ${sessionsLegacyDir} → ${sessionsTargetDir}`);
	if (legacyKeys.length > 0) preview.push(`- Sessions: canonicalize legacy keys in ${sessionsTargetStorePath}`);
	if (hasLegacyAgentDir) preview.push(`- Agent dir: ${legacyAgentDir} → ${targetAgentDir}`);
	if (channelPlans.length > 0) preview.push(...channelPlans.map(buildLegacyMigrationPreview));
	return {
		targetAgentId,
		targetMainKey,
		targetScope,
		stateDir,
		oauthDir,
		sessions: {
			legacyDir: sessionsLegacyDir,
			legacyStorePath: sessionsLegacyStorePath,
			targetDir: sessionsTargetDir,
			targetStorePath: sessionsTargetStorePath,
			hasLegacy: hasLegacySessions || legacyKeys.length > 0,
			legacyKeys
		},
		agentDir: {
			legacyDir: legacyAgentDir,
			targetDir: targetAgentDir,
			hasLegacy: hasLegacyAgentDir
		},
		channelPlans: {
			hasLegacy: channelPlans.length > 0,
			plans: channelPlans
		},
		preview
	};
}
async function migrateLegacySessions(detected, now) {
	const changes = [];
	const warnings = [];
	if (!detected.sessions.hasLegacy) return {
		changes,
		warnings
	};
	ensureDir(detected.sessions.targetDir);
	const legacyParsed = fileExists(detected.sessions.legacyStorePath) ? readSessionStoreJson5(detected.sessions.legacyStorePath) : {
		store: {},
		ok: true
	};
	const targetParsed = fileExists(detected.sessions.targetStorePath) ? readSessionStoreJson5(detected.sessions.targetStorePath) : {
		store: {},
		ok: true
	};
	const legacyStore = legacyParsed.store;
	const targetStore = targetParsed.store;
	const canonicalizedTarget = canonicalizeSessionStore({
		store: targetStore,
		agentId: detected.targetAgentId,
		mainKey: detected.targetMainKey,
		scope: detected.targetScope
	});
	const canonicalizedLegacy = canonicalizeSessionStore({
		store: legacyStore,
		agentId: detected.targetAgentId,
		mainKey: detected.targetMainKey,
		scope: detected.targetScope
	});
	const merged = { ...canonicalizedTarget.store };
	for (const [key, entry] of Object.entries(canonicalizedLegacy.store)) merged[key] = mergeSessionEntry({
		existing: merged[key],
		incoming: entry,
		preferIncomingOnTie: false
	});
	const mainKey = buildAgentMainSessionKey({
		agentId: detected.targetAgentId,
		mainKey: detected.targetMainKey
	});
	if (!merged[mainKey]) {
		const latest = pickLatestLegacyDirectEntry(legacyStore);
		if (latest?.sessionId) {
			merged[mainKey] = latest;
			changes.push(`Migrated latest direct-chat session → ${mainKey}`);
		}
	}
	if (!legacyParsed.ok) warnings.push(`Legacy sessions store unreadable; left in place at ${detected.sessions.legacyStorePath}`);
	if ((legacyParsed.ok || targetParsed.ok) && (Object.keys(legacyStore).length > 0 || Object.keys(targetStore).length > 0)) {
		const normalized = {};
		for (const [key, entry] of Object.entries(merged)) {
			const normalizedEntry = normalizeSessionEntry(entry);
			if (!normalizedEntry) continue;
			normalized[key] = normalizedEntry;
		}
		await saveSessionStore(detected.sessions.targetStorePath, normalized, { skipMaintenance: true });
		changes.push(`Merged sessions store → ${detected.sessions.targetStorePath}`);
		if (canonicalizedTarget.legacyKeys.length > 0) changes.push(`Canonicalized ${canonicalizedTarget.legacyKeys.length} legacy session key(s)`);
	}
	const entries = safeReadDir(detected.sessions.legacyDir);
	for (const entry of entries) {
		if (!entry.isFile()) continue;
		if (entry.name === "sessions.json") continue;
		const from = path.join(detected.sessions.legacyDir, entry.name);
		const to = path.join(detected.sessions.targetDir, entry.name);
		if (fileExists(to)) continue;
		try {
			fs.renameSync(from, to);
			changes.push(`Moved ${entry.name} → agents/${detected.targetAgentId}/sessions`);
		} catch (err) {
			warnings.push(`Failed moving ${from}: ${String(err)}`);
		}
	}
	if (legacyParsed.ok) try {
		if (fileExists(detected.sessions.legacyStorePath)) fs.rmSync(detected.sessions.legacyStorePath, { force: true });
	} catch {}
	removeDirIfEmpty(detected.sessions.legacyDir);
	if (safeReadDir(detected.sessions.legacyDir).filter((e) => e.isFile()).length > 0) {
		const backupDir = `${detected.sessions.legacyDir}.legacy-${now()}`;
		try {
			fs.renameSync(detected.sessions.legacyDir, backupDir);
			warnings.push(`Left legacy sessions at ${backupDir}`);
		} catch {}
	}
	return {
		changes,
		warnings
	};
}
async function migrateLegacyAgentDir(detected, now) {
	const changes = [];
	const warnings = [];
	if (!detected.agentDir.hasLegacy) return {
		changes,
		warnings
	};
	ensureDir(detected.agentDir.targetDir);
	const entries = safeReadDir(detected.agentDir.legacyDir);
	for (const entry of entries) {
		const from = path.join(detected.agentDir.legacyDir, entry.name);
		const to = path.join(detected.agentDir.targetDir, entry.name);
		if (fs.existsSync(to)) continue;
		try {
			fs.renameSync(from, to);
			changes.push(`Moved agent file ${entry.name} → agents/${detected.targetAgentId}/agent`);
		} catch (err) {
			warnings.push(`Failed moving ${from}: ${String(err)}`);
		}
	}
	removeDirIfEmpty(detected.agentDir.legacyDir);
	if (!emptyDirOrMissing(detected.agentDir.legacyDir)) {
		const backupDir = path.join(detected.stateDir, "agents", detected.targetAgentId, `agent.legacy-${now()}`);
		try {
			fs.renameSync(detected.agentDir.legacyDir, backupDir);
			warnings.push(`Left legacy agent dir at ${backupDir}`);
		} catch (err) {
			warnings.push(`Failed relocating legacy agent dir: ${String(err)}`);
		}
	}
	return {
		changes,
		warnings
	};
}
async function runLegacyStateMigrations(params) {
	const now = params.now ?? (() => Date.now());
	const detected = params.detected;
	const preSessionChannelPlans = await runLegacyMigrationPlans(detected.channelPlans.plans.filter((plan) => plan.kind === "plugin-state-import"));
	const sessions = await migrateLegacySessions(detected, now);
	const agentDir = await migrateLegacyAgentDir(detected, now);
	const channelPlans = await runLegacyMigrationPlans(detected.channelPlans.plans.filter((plan) => plan.kind !== "plugin-state-import"));
	return {
		changes: [
			...preSessionChannelPlans.changes,
			...sessions.changes,
			...agentDir.changes,
			...channelPlans.changes
		],
		warnings: [
			...preSessionChannelPlans.warnings,
			...sessions.warnings,
			...agentDir.warnings,
			...channelPlans.warnings
		]
	};
}
/**
* Canonicalize orphaned raw session keys in all known agent session stores.
*
* Keys written by resolveSessionKey() used DEFAULT_AGENT_ID="main" regardless
* of the configured default agent; reads always use resolveSessionStoreKey()
* which canonicalizes via canonicalizeMainSessionAlias. This migration renames
* any orphaned raw keys to their canonical form in-place, merging with any
* existing canonical entry by preferring the most recently updated.
*
* Safe to run multiple times (idempotent). See #29683.
*/
async function migrateOrphanedSessionKeys(params) {
	const changes = [];
	const warnings = [];
	const env = params.env ?? process.env;
	const stateDir = resolveStateDir(env);
	const agentId = normalizeAgentId(resolveDefaultAgentId(params.cfg));
	const mainKey = normalizeMainKey(params.cfg.session?.mainKey);
	const scope = params.cfg.session?.scope;
	const storeConfig = params.cfg.session?.store;
	const storeMap = /* @__PURE__ */ new Map();
	const addToStoreMap = (p, id) => {
		const existing = storeMap.get(p);
		if (existing) existing.add(id);
		else storeMap.set(p, new Set([id]));
	};
	addToStoreMap(storeConfig ? resolveStorePathFromTemplate(storeConfig, agentId, env) : path.join(stateDir, "agents", agentId, "sessions", "sessions.json"), agentId);
	for (const entry of params.cfg.agents?.list ?? []) if (entry?.id) {
		const id = normalizeAgentId(entry.id);
		addToStoreMap(storeConfig ? resolveStorePathFromTemplate(storeConfig, id, env) : path.join(stateDir, "agents", id, "sessions", "sessions.json"), id);
	}
	const agentsDir = path.join(stateDir, "agents");
	if (existsDir(agentsDir)) {
		for (const dirEntry of safeReadDir(agentsDir)) if (dirEntry.isDirectory()) {
			const diskAgentId = normalizeAgentId(dirEntry.name);
			if (diskAgentId) addToStoreMap(path.join(agentsDir, diskAgentId, "sessions", "sessions.json"), diskAgentId);
		}
	}
	for (const [storePath, storeAgentIds] of storeMap) {
		if (!fileExists(storePath)) continue;
		let raw;
		try {
			raw = fs.readFileSync(storePath, "utf-8");
		} catch (err) {
			warnings.push(`Could not read ${storePath}: ${String(err)}`);
			continue;
		}
		if (!sessionStoreTextMayNeedCanonicalization({
			raw,
			storeAgentIds,
			mainKey,
			scope
		})) continue;
		let parsed;
		try {
			parsed = parseSessionStoreJson5(raw);
		} catch (err) {
			warnings.push(`Could not read ${storePath}: ${String(err)}`);
			continue;
		}
		if (!parsed.ok) continue;
		let working = parsed.store;
		let totalLegacy = 0;
		for (const storeAgentId of storeAgentIds) {
			const { store: canonicalized, legacyKeys } = canonicalizeSessionStore({
				store: working,
				agentId: storeAgentId,
				mainKey,
				scope,
				skipCrossAgentRemap: storeAgentIds.size > 1 && storeAgentIds.has("main")
			});
			working = canonicalized;
			totalLegacy += legacyKeys.length;
		}
		if (totalLegacy === 0) continue;
		const normalized = {};
		for (const [key, entry] of Object.entries(working)) {
			const ne = normalizeSessionEntry(entry);
			if (ne) normalized[key] = ne;
		}
		try {
			await saveSessionStore(storePath, normalized, { skipMaintenance: true });
			changes.push(`Canonicalized ${totalLegacy} orphaned session key(s) in ${storePath}`);
		} catch (err) {
			warnings.push(`Failed to write canonicalized store ${storePath}: ${String(err)}`);
		}
	}
	return {
		changes,
		warnings
	};
}
function resolveStorePathFromTemplate(template, agentId, env) {
	const expand = (s) => s.startsWith("~") ? expandHomePrefix(s, {
		env: env ?? process.env,
		homedir: os.homedir
	}) : s;
	if (template.includes("{agentId}")) return path.resolve(expand(template.replaceAll("{agentId}", agentId)));
	return path.resolve(expand(template));
}
//#endregion
export { runLegacyStateMigrations as a, migrateOrphanedSessionKeys as i, detectLegacyStateMigrations as n, migrateLegacyAgentDir as r, autoMigrateLegacyStateDir as t };
