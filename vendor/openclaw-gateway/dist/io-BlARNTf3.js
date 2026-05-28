import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { t as isTruthyEnvValue } from "./env-DmmbBEHd.js";
import { o as resolveRequiredHomeDir } from "./home-dir-B1vnNUyG.js";
import { f as resolveIncludeRoots, s as resolveConfigPath, y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { o as isRecord } from "./record-coerce-Btbek4uV.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { o as sanitizeHostExecEnv } from "./host-env-security-B90drdeB.js";
import { i as isPathInside } from "./path-BlG8lhgR.js";
import { b as isPlainObject, c as isRecord$1, p as resolveUserPath } from "./utils-B5r0V84N.js";
import { n as containsEnvVarReference, r as resolveConfigEnvVars } from "./env-substitution-DbLVJ2ZZ.js";
import { i as applyConfigEnvVars } from "./state-dir-dotenv-BrGdeAwo.js";
import { o as coerceSecretRef } from "./types.secrets-CtRQ27Ls.js";
import { n as VERSION } from "./version-BjFOZC7j.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { n as normalizeAgentModelRefForConfig, t as normalizeAgentModelMapForConfig } from "./model-input-C697EEaR.js";
import "./agent-scope-CudANNo3.js";
import "./path-guards-CBe_wA_B.js";
import { t as isBlockedObjectKey } from "./prototype-keys-gIgii6VQ.js";
import { l as normalizeAgentId } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { a as resolvePluginMetadataSnapshot } from "./plugin-metadata-snapshot-Bb8bov-r.js";
import { a as GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA } from "./ids-OP3BJTaQ.js";
import { i as replaceFileAtomicSync, n as replaceFileAtomic } from "./replace-file-C7_Inj8B.js";
import { r as hasKind } from "./slots-DT22cOei.js";
import { d as resolveMemorySlotDecision, l as resolveEffectivePluginActivationState, o as normalizePluginId, s as normalizePluginsConfig } from "./config-state-CzzsKZJi.js";
import { r as loadInstalledPluginIndexInstallRecordsSync } from "./installed-plugin-index-record-reader-CQGWoRBr.js";
import { r as planManifestModelCatalogSuppressions } from "./model-catalog-DPeyJVEH.js";
import { n as resolveManifestCommandAliasOwnerInRegistry } from "./manifest-command-aliases-B_sF2bki.js";
import { c as resolveOfficialExternalPluginInstall, t as getOfficialExternalPluginCatalogEntry } from "./official-external-plugin-catalog-sotRjC8t.js";
import { t as isVerbose } from "./global-state-BAD7XgmL.js";
import { f as isLoopbackIpAddress, i as isCanonicalDottedDecimalIPv4 } from "./ip-Y63B6JB6.js";
import { n as isUnsafeGatewayTailscaleNoAuth, t as formatUnsafeGatewayTailscaleNoAuthMessage } from "./gateway-tailscale-auth-policy-B9w7c-E0.js";
import { t as loadDotEnv } from "./dotenv-DwbL--_S.js";
import { c as writePersistedInstalledPluginIndexInstallRecordsSync, i as resolveInstalledPluginIndexRecordsStorePath } from "./installed-plugin-index-records-BV-e8pNZ.js";
import { t as sanitizeTerminalText } from "./safe-text-J_0sTthZ.js";
import { a as resolveConfigIncludes, i as readConfigIncludeFileWithGuards, n as ConfigIncludeError } from "./includes-DwAz1VP4.js";
import { a as formatConfigOverwriteLogMessage, i as finalizeConfigWriteAuditRecord, n as appendConfigAuditRecordSync, r as createConfigWriteAuditRecordBase, s as snapshotConfigAuditProcessInfo, t as appendConfigAuditRecord } from "./io.audit-4IDK7e4_.js";
import { r as formatConfigIssueSummary } from "./issue-format-c8ezaSew.js";
import { i as shouldAttemptLastKnownGoodRecovery, t as isPluginLocalInvalidConfigSnapshot } from "./recovery-policy-CKSxWKv4.js";
import { r as normalizeConfiguredProviderCatalogModelId } from "./model-ref-shared-CwD1xLDF.js";
import { t as applyMergePatch } from "./merge-patch-BKbUL9Ms.js";
import { t as DEFAULT_CONTEXT_TOKENS } from "./defaults-mDjiWzE5.js";
import { v as resolveBundledProviderPolicySurface } from "./thinking-DKulK0JL.js";
import { n as normalizeTalkConfig } from "./talk-Cxq1Zt-L.js";
import { i as normalizeTrustedSafeBinDirs, k as normalizeSafeBinProfileFixtures } from "./exec-safe-bin-trust-DV6oZsbJ.js";
import { n as assertConfigWriteAllowedInCurrentMode } from "./nix-mode-write-guard-DmQkBgmS.js";
import { n as stripShippedPluginInstallConfigRecords, t as extractShippedPluginInstallConfigRecords } from "./plugin-install-config-migration-CAae0Ia-.js";
import { i as unsetConfigValueAtPath, n as parseConfigPath, r as setConfigValueAtPath } from "./config-paths-CgZRB14o.js";
import { d as preflightRuntimeSnapshotWrite, f as registerRuntimeConfigWriteListener, i as getRuntimeConfigSnapshot, l as loadPinnedRuntimeConfig, n as createRuntimeConfigWriteNotification, o as getRuntimeConfigSnapshotRefreshHandler, r as finalizeRuntimeSnapshotWrite, s as getRuntimeConfigSourceSnapshot, u as notifyRuntimeConfigWriteListeners } from "./runtime-snapshot-D93_HOsR.js";
import { n as listKnownChannelEnvVarNames } from "./channel-env-vars-DKqSpYS8.js";
import { n as listKnownProviderAuthEnvVarNames } from "./provider-env-vars-CteAyjcQ.js";
import { t as withBundledPluginAllowlistCompat } from "./bundled-compat-BEMJyVTl.js";
import { n as appendAllowedValuesHint, r as summarizeAllowedValues, t as validateJsonSchemaValue } from "./schema-validator-ocH5WSQX.js";
import { t as resolveWebSearchInstallCatalogEntries } from "./web-search-install-catalog-CQ80xPT3.js";
import { c as isWindowsAbsolutePath, i as isAvatarHttpUrl, n as hasAvatarUriScheme, o as isPathWithinRoot, r as isAvatarDataUrl } from "./avatar-policy-BPKiTIGP.js";
import { n as collectConfiguredModelRefs } from "./model-refs-DEKLQX6s.js";
import { I as isBuiltInModelProviderOverlayId } from "./zod-schema.core-BPJs63Rs.js";
import { t as OpenClawSchema } from "./zod-schema-D8m4E-Vd.js";
import { r as shouldWarnOnTouchedVersion } from "./version-CAjjTWnS.js";
import fs from "node:fs";
import JSON5 from "json5";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";
//#region src/agents/owner-display.ts
/**
* Resolve owner display settings for prompt rendering.
* Keep auth secrets decoupled from owner hash secrets.
*/
function resolveOwnerDisplaySetting(config) {
	const ownerDisplay = config?.commands?.ownerDisplay;
	if (ownerDisplay !== "hash") return {
		ownerDisplay,
		ownerDisplaySecret: void 0
	};
	return {
		ownerDisplay: "hash",
		ownerDisplaySecret: normalizeOptionalString(config?.commands?.ownerDisplaySecret)
	};
}
/**
* Ensure hash mode has a dedicated secret.
* Returns updated config and generated secret when autofill was needed.
*/
function ensureOwnerDisplaySecret(config, generateSecret = () => crypto.randomBytes(32).toString("hex")) {
	const settings = resolveOwnerDisplaySetting(config);
	if (settings.ownerDisplay !== "hash" || settings.ownerDisplaySecret) return { config };
	const generatedSecret = generateSecret();
	return {
		config: {
			...config,
			commands: {
				...config.commands,
				ownerDisplay: "hash",
				ownerDisplaySecret: generatedSecret
			}
		},
		generatedSecret
	};
}
//#endregion
//#region src/infra/shell-env.ts
const DEFAULT_TIMEOUT_MS = 15e3;
const DEFAULT_MAX_BUFFER_BYTES = 2 * 1024 * 1024;
const DEFAULT_SHELL = "/bin/sh";
let lastAppliedKeys = [];
let cachedShellPath;
let cachedEtcShells;
let nextExecCacheId = 1;
const loginShellEnvProbeCache = /* @__PURE__ */ new Map();
const execCacheIds = /* @__PURE__ */ new WeakMap();
function resolveShellExecEnv(env) {
	const execEnv = sanitizeHostExecEnv({ baseEnv: env });
	const home = os.homedir().trim();
	if (home) execEnv.HOME = home;
	else delete execEnv.HOME;
	delete execEnv.ZDOTDIR;
	return execEnv;
}
function resolveTimeoutMs(timeoutMs) {
	if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs)) return DEFAULT_TIMEOUT_MS;
	return Math.max(0, timeoutMs);
}
function readEtcShells() {
	if (cachedEtcShells !== void 0) return cachedEtcShells;
	try {
		const entries = fs.readFileSync("/etc/shells", "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0 && !line.startsWith("#") && path.isAbsolute(line));
		cachedEtcShells = new Set(entries);
	} catch {
		cachedEtcShells = null;
	}
	return cachedEtcShells;
}
function isTrustedShellPath(shell) {
	if (!path.isAbsolute(shell)) return false;
	if (path.normalize(shell) !== shell) return false;
	return readEtcShells()?.has(shell) === true;
}
function resolveShell(env) {
	const shell = env.SHELL?.trim();
	if (shell && isTrustedShellPath(shell)) return shell;
	return DEFAULT_SHELL;
}
function execLoginShellEnvZero(params) {
	return params.exec(params.shell, [
		"-l",
		"-c",
		"env -0"
	], {
		encoding: "buffer",
		timeout: params.timeoutMs,
		maxBuffer: DEFAULT_MAX_BUFFER_BYTES,
		env: params.env,
		windowsHide: true,
		stdio: [
			"ignore",
			"pipe",
			"pipe"
		]
	});
}
function parseShellEnv(stdout) {
	const shellEnv = /* @__PURE__ */ new Map();
	const parts = stdout.toString("utf8").split("\0");
	for (const part of parts) {
		if (!part) continue;
		const eq = part.indexOf("=");
		if (eq <= 0) continue;
		const key = part.slice(0, eq);
		const value = part.slice(eq + 1);
		if (!key) continue;
		shellEnv.set(key, value);
	}
	return shellEnv;
}
function resolveExecCacheId(exec) {
	if (!exec) return "default";
	const key = exec;
	let id = execCacheIds.get(key);
	if (!id) {
		id = nextExecCacheId;
		nextExecCacheId += 1;
		execCacheIds.set(key, id);
	}
	return `exec:${id}`;
}
function createLoginShellEnvCacheKey(params) {
	const startupEnvEntries = Object.entries(params.execEnv).filter(([key]) => {
		if (key === "HOME" || key === "PATH" || key === "TERM" || key === "LANG" || key === "LC_ALL" || key === "LC_CTYPE" || key === "USER" || key === "LOGNAME" || key === "TMPDIR") return true;
		return key.startsWith("XDG_") || key.startsWith("OPENCLAW_");
	}).toSorted(([left], [right]) => left.localeCompare(right));
	return JSON.stringify([
		params.shell,
		params.timeoutMs,
		resolveExecCacheId(params.exec),
		startupEnvEntries
	]);
}
function probeLoginShellEnv(params) {
	if ((params.platform ?? process.platform) === "win32") return {
		ok: true,
		shellEnv: /* @__PURE__ */ new Map()
	};
	const exec = params.exec ?? execFileSync;
	const timeoutMs = resolveTimeoutMs(params.timeoutMs);
	const shell = resolveShell(params.env);
	const execEnv = resolveShellExecEnv(params.env);
	const cacheKey = createLoginShellEnvCacheKey({
		shell,
		timeoutMs,
		exec: params.exec,
		execEnv
	});
	const cached = loginShellEnvProbeCache.get(cacheKey);
	if (cached) return cached.ok ? {
		ok: true,
		shellEnv: new Map(cached.entries)
	} : cached;
	try {
		const shellEnv = parseShellEnv(execLoginShellEnvZero({
			shell,
			env: execEnv,
			exec,
			timeoutMs
		}));
		loginShellEnvProbeCache.set(cacheKey, {
			ok: true,
			entries: [...shellEnv.entries()]
		});
		return {
			ok: true,
			shellEnv
		};
	} catch (err) {
		const result = {
			ok: false,
			error: formatErrorMessage(err)
		};
		loginShellEnvProbeCache.set(cacheKey, result);
		return result;
	}
}
function hasExplicitEnvBinding(env, key) {
	return Object.prototype.hasOwnProperty.call(env, key);
}
function loadShellEnvFallback(opts) {
	const logger = opts.logger ?? console;
	if (!opts.enabled) {
		lastAppliedKeys = [];
		return {
			ok: true,
			applied: [],
			skippedReason: "disabled"
		};
	}
	const missingExpectedKeys = opts.expectedKeys.filter((key) => !hasExplicitEnvBinding(opts.env, key));
	if (missingExpectedKeys.length === 0) {
		lastAppliedKeys = [];
		return {
			ok: true,
			applied: [],
			skippedReason: "already-has-keys"
		};
	}
	const probe = probeLoginShellEnv({
		env: opts.env,
		timeoutMs: opts.timeoutMs,
		exec: opts.exec,
		platform: opts.platform
	});
	if (!probe.ok) {
		logger.warn(`[openclaw] shell env fallback failed: ${probe.error}`);
		lastAppliedKeys = [];
		return {
			ok: false,
			error: probe.error,
			applied: []
		};
	}
	const applied = [];
	for (const key of missingExpectedKeys) {
		const value = probe.shellEnv.get(key);
		if (!value?.trim()) continue;
		opts.env[key] = value;
		applied.push(key);
	}
	lastAppliedKeys = applied;
	return {
		ok: true,
		applied
	};
}
function shouldEnableShellEnvFallback(env) {
	return isTruthyEnvValue(env.OPENCLAW_LOAD_SHELL_ENV);
}
function shouldDeferShellEnvFallback(env) {
	return isTruthyEnvValue(env.OPENCLAW_DEFER_SHELL_ENV_FALLBACK);
}
function resolveShellEnvFallbackTimeoutMs(env) {
	const raw = env.OPENCLAW_SHELL_ENV_TIMEOUT_MS?.trim();
	if (!raw) return DEFAULT_TIMEOUT_MS;
	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed)) return DEFAULT_TIMEOUT_MS;
	return Math.max(0, parsed);
}
function getShellPathFromLoginShell(opts) {
	if (cachedShellPath !== void 0) return cachedShellPath;
	const platform = opts.platform ?? process.platform;
	if (platform === "win32") {
		cachedShellPath = null;
		return cachedShellPath;
	}
	const probe = probeLoginShellEnv({
		env: opts.env,
		timeoutMs: opts.timeoutMs,
		exec: opts.exec,
		platform
	});
	if (!probe.ok) {
		cachedShellPath = null;
		return cachedShellPath;
	}
	const shellPath = probe.shellEnv.get("PATH")?.trim();
	cachedShellPath = shellPath && shellPath.length > 0 ? shellPath : null;
	return cachedShellPath;
}
function getShellEnvAppliedKeys() {
	return [...lastAppliedKeys];
}
//#endregion
//#region src/config/agent-dirs.ts
var DuplicateAgentDirError = class extends Error {
	constructor(duplicates) {
		super(formatDuplicateAgentDirError(duplicates));
		this.name = "DuplicateAgentDirError";
		this.duplicates = duplicates;
	}
};
function canonicalizeAgentDir(agentDir) {
	const resolved = path.resolve(agentDir);
	if (process.platform === "darwin" || process.platform === "win32") return normalizeLowercaseStringOrEmpty(resolved);
	return resolved;
}
function collectReferencedAgentIds(cfg) {
	const ids = /* @__PURE__ */ new Set();
	const agents = Array.isArray(cfg.agents?.list) ? cfg.agents?.list : [];
	const defaultAgentId = agents.find((agent) => agent?.default)?.id ?? agents[0]?.id ?? "main";
	ids.add(normalizeAgentId(defaultAgentId));
	for (const entry of agents) if (entry?.id) ids.add(normalizeAgentId(entry.id));
	const bindings = cfg.bindings;
	if (Array.isArray(bindings)) for (const binding of bindings) {
		const id = binding?.agentId;
		if (typeof id === "string" && id.trim()) ids.add(normalizeAgentId(id));
	}
	return [...ids];
}
function resolveEffectiveAgentDir(cfg, agentId, deps) {
	const id = normalizeAgentId(agentId);
	const trimmed = (Array.isArray(cfg.agents?.list) ? cfg.agents?.list.find((agent) => normalizeAgentId(agent.id) === id)?.agentDir : void 0)?.trim();
	if (trimmed) return resolveUserPath(trimmed);
	const env = deps?.env ?? process.env;
	const root = resolveStateDir(env, deps?.homedir ?? (() => resolveRequiredHomeDir(env, os.homedir)));
	return path.join(root, "agents", id, "agent");
}
function findDuplicateAgentDirs(cfg, deps) {
	const byDir = /* @__PURE__ */ new Map();
	for (const agentId of collectReferencedAgentIds(cfg)) {
		const agentDir = resolveEffectiveAgentDir(cfg, agentId, deps);
		const key = canonicalizeAgentDir(agentDir);
		const entry = byDir.get(key);
		if (entry) entry.agentIds.push(agentId);
		else byDir.set(key, {
			agentDir,
			agentIds: [agentId]
		});
	}
	return [...byDir.values()].filter((v) => v.agentIds.length > 1);
}
function formatDuplicateAgentDirError(dups) {
	return [
		"Duplicate agentDir detected (multi-agent config).",
		"Each agent must have a unique agentDir; sharing it causes auth/session state collisions and token invalidation.",
		"",
		"Conflicts:",
		...dups.map((d) => `- ${d.agentDir}: ${d.agentIds.map((id) => `"${id}"`).join(", ")}`),
		"",
		"Fix: remove the shared agents.list[].agentDir override (or give each agent its own directory).",
		"If you want to share credentials, copy auth-profiles.json instead of sharing the entire agentDir."
	].join("\n");
}
//#endregion
//#region src/config/backup-rotation.ts
const CONFIG_BACKUP_COUNT = 5;
async function rotateConfigBackups(configPath, ioFs) {
	const backupBase = `${configPath}.bak`;
	const maxIndex = CONFIG_BACKUP_COUNT - 1;
	await ioFs.unlink(`${backupBase}.${maxIndex}`).catch(() => {});
	for (let index = maxIndex - 1; index >= 1; index -= 1) await ioFs.rename(`${backupBase}.${index}`, `${backupBase}.${index + 1}`).catch(() => {});
	await ioFs.rename(backupBase, `${backupBase}.1`).catch(() => {});
}
/**
* Harden file permissions on all .bak files in the rotation ring.
* copyFile does not guarantee permission preservation on all platforms
* (e.g. Windows, some NFS mounts), so we explicitly chmod each backup
* to owner-only (0o600) to match the main config file.
*/
async function hardenBackupPermissions(configPath, ioFs) {
	if (!ioFs.chmod) return;
	const backupBase = `${configPath}.bak`;
	await ioFs.chmod(backupBase, 384).catch(() => {});
	for (let i = 1; i < CONFIG_BACKUP_COUNT; i++) await ioFs.chmod(`${backupBase}.${i}`, 384).catch(() => {});
}
/**
* Remove orphan .bak files that fall outside the managed rotation ring.
* These can accumulate from interrupted writes, manual copies, or PID-stamped
* backups (e.g. openclaw.json.bak.1772352289, openclaw.json.bak.before-marketing).
*
* Only files matching `<configBasename>.bak.*` are considered; the primary
* `.bak` and numbered `.bak.1` through `.bak.{N-1}` are preserved.
*/
async function cleanOrphanBackups(configPath, ioFs) {
	if (!ioFs.readdir) return;
	const dir = path.dirname(configPath);
	const bakPrefix = `${path.basename(configPath)}.bak.`;
	const validSuffixes = /* @__PURE__ */ new Set();
	for (let i = 1; i < CONFIG_BACKUP_COUNT; i++) validSuffixes.add(String(i));
	let entries;
	try {
		entries = await ioFs.readdir(dir);
	} catch {
		return;
	}
	for (const entry of entries) {
		if (!entry.startsWith(bakPrefix)) continue;
		const suffix = entry.slice(bakPrefix.length);
		if (validSuffixes.has(suffix)) continue;
		await ioFs.unlink(path.join(dir, entry)).catch(() => {});
	}
}
const preUpdateConfigSnapshotsWritten = /* @__PURE__ */ new Set();
async function createPreUpdateConfigSnapshot(params) {
	if (!params.fs.existsSync(params.configPath)) return;
	const snapshotKey = path.resolve(params.configPath);
	if (preUpdateConfigSnapshotsWritten.has(snapshotKey)) return;
	preUpdateConfigSnapshotsWritten.add(snapshotKey);
	const snapshotPath = `${params.configPath}.pre-update`;
	try {
		const content = await params.fs.readFile(params.configPath, "utf-8");
		await params.fs.writeFile(snapshotPath, content, {
			encoding: "utf-8",
			mode: 384,
			flag: "w"
		});
	} catch {}
}
/**
* Run the full backup maintenance cycle around config writes.
* Order matters: rotate ring -> create new .bak -> harden modes -> prune orphan .bak.* files.
*/
async function maintainConfigBackups(configPath, ioFs) {
	await rotateConfigBackups(configPath, ioFs);
	await ioFs.copyFile(configPath, `${configPath}.bak`).catch(() => {});
	await hardenBackupPermissions(configPath, ioFs);
	await cleanOrphanBackups(configPath, ioFs);
}
//#endregion
//#region src/config/env-preserve.ts
/**
* Preserves `${VAR}` environment variable references during config write-back.
*
* When config is read, `${VAR}` references are resolved to their values.
* When writing back, callers pass the resolved config. This module detects
* values that match what a `${VAR}` reference would resolve to and restores
* the original reference, so env var references survive config round-trips.
*
* A value is restored only if:
* 1. The pre-substitution value contained a `${VAR}` pattern
* 2. Resolving that pattern with current env vars produces the incoming value
*
* If a caller intentionally set a new value (different from what the env var
* resolves to), the new value is kept as-is.
*/
const ENV_VAR_PATTERN = /\$\{[A-Z_][A-Z0-9_]*\}/;
/**
* Check if a string contains any `${VAR}` env var references.
*/
function hasEnvVarRef(value) {
	return ENV_VAR_PATTERN.test(value);
}
/**
* Resolve `${VAR}` references in a single string using the given env.
* Returns null if any referenced var is missing (instead of throwing).
*
* Mirrors the substitution semantics of `substituteString` in env-substitution.ts:
* - `${VAR}` → env value (returns null if missing)
* - `$${VAR}` → literal `${VAR}` (escape sequence)
*/
function tryResolveString(template, env) {
	const ENV_VAR_NAME = /^[A-Z_][A-Z0-9_]*$/;
	const chunks = [];
	for (let i = 0; i < template.length; i++) {
		if (template[i] === "$") {
			if (template[i + 1] === "$" && template[i + 2] === "{") {
				const start = i + 3;
				const end = template.indexOf("}", start);
				if (end !== -1) {
					const name = template.slice(start, end);
					if (ENV_VAR_NAME.test(name)) {
						chunks.push(`\${${name}}`);
						i = end;
						continue;
					}
				}
			}
			if (template[i + 1] === "{") {
				const start = i + 2;
				const end = template.indexOf("}", start);
				if (end !== -1) {
					const name = template.slice(start, end);
					if (ENV_VAR_NAME.test(name)) {
						const val = env[name];
						if (val === void 0 || val === "") return null;
						chunks.push(val);
						i = end;
						continue;
					}
				}
			}
		}
		chunks.push(template[i]);
	}
	return chunks.join("");
}
/**
* Deep-walk the incoming config and restore `${VAR}` references from the
* pre-substitution parsed config wherever the resolved value matches.
*
* @param incoming - The resolved config about to be written
* @param parsed - The pre-substitution parsed config (from the current file on disk)
* @param env - Environment variables for verification
* @returns A new config object with env var references restored where appropriate
*/
function restoreEnvVarRefs(incoming, parsed, env = process.env) {
	if (parsed === null || parsed === void 0) return incoming;
	if (typeof incoming === "string" && typeof parsed === "string") {
		if (hasEnvVarRef(parsed)) {
			if (tryResolveString(parsed, env) === incoming) return parsed;
		}
		return incoming;
	}
	if (Array.isArray(incoming) && Array.isArray(parsed)) return incoming.map((item, i) => i < parsed.length ? restoreEnvVarRefs(item, parsed[i], env) : item);
	if (isPlainObject(incoming) && isPlainObject(parsed)) {
		const result = {};
		for (const [key, value] of Object.entries(incoming)) if (key in parsed) result[key] = restoreEnvVarRefs(value, parsed[key], env);
		else result[key] = value;
		return result;
	}
	return incoming;
}
const CONFIG_CLOBBER_LOCK_STALE_MS = 3e4;
const CONFIG_CLOBBER_LOCK_RETRY_MS = 10;
const CONFIG_CLOBBER_LOCK_TIMEOUT_MS = 2e3;
const clobberCapWarnedPaths = /* @__PURE__ */ new Set();
function formatConfigArtifactTimestamp$1(ts) {
	return ts.replaceAll(":", "-").replaceAll(".", "-");
}
function isFsErrorCode(error, code) {
	return error instanceof Error && "code" in error && typeof error.code === "string" && error.code === code;
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
function resolveClobberPaths(configPath) {
	const dir = path.dirname(configPath);
	const basename = path.basename(configPath);
	return {
		dir,
		prefix: `${basename}.clobbered.`,
		lockPath: path.join(dir, `${basename}.clobber.lock`)
	};
}
function shouldRemoveStaleLock(mtimeMs, nowMs) {
	return typeof mtimeMs === "number" && nowMs - mtimeMs > CONFIG_CLOBBER_LOCK_STALE_MS;
}
async function acquireClobberLock(deps, lockPath) {
	const startedAt = Date.now();
	while (Date.now() - startedAt < CONFIG_CLOBBER_LOCK_TIMEOUT_MS) try {
		await deps.fs.promises.mkdir(lockPath, { mode: 448 });
		return true;
	} catch (error) {
		if (!isFsErrorCode(error, "EEXIST")) return false;
		if (shouldRemoveStaleLock((await deps.fs.promises.stat(lockPath).catch(() => null))?.mtimeMs, Date.now())) {
			await deps.fs.promises.rmdir(lockPath).catch(() => {});
			continue;
		}
		await sleep(CONFIG_CLOBBER_LOCK_RETRY_MS);
	}
	return false;
}
function compareClobberedSiblings(left, right) {
	return left.timestampKey.localeCompare(right.timestampKey) || left.mtimeMs - right.mtimeMs || left.name.localeCompare(right.name);
}
function createClobberedSiblingSnapshot(params) {
	return {
		name: params.entry,
		path: path.join(params.dir, params.entry),
		timestampKey: params.entry.slice(params.prefix.length).replace(/-\d{2}$/, ""),
		mtimeMs: params.mtimeMs
	};
}
async function listClobberedSiblings(deps, dir, prefix) {
	try {
		const entries = await deps.fs.promises.readdir(dir);
		const snapshots = [];
		for (const entry of entries) {
			if (!entry.startsWith(prefix)) continue;
			const stat = await deps.fs.promises.stat(path.join(dir, entry)).catch(() => null);
			snapshots.push(createClobberedSiblingSnapshot({
				dir,
				entry,
				prefix,
				mtimeMs: stat?.mtimeMs ?? 0
			}));
		}
		return snapshots.toSorted(compareClobberedSiblings);
	} catch {
		return [];
	}
}
function warnClobberCapReached(deps, configPath, existing) {
	if (clobberCapWarnedPaths.has(configPath)) return;
	clobberCapWarnedPaths.add(configPath);
	deps.logger.warn(`Config clobber snapshot cap reached for ${configPath}: ${existing} existing .clobbered.* files; rotating oldest snapshots to preserve the latest forensic copy.`);
}
async function rotateOldestClobberedSiblings(deps, snapshots) {
	const deleteCount = Math.max(0, snapshots.length - 32 + 1);
	for (const snapshot of snapshots.slice(0, deleteCount)) try {
		await deps.fs.promises.unlink(snapshot.path);
	} catch (error) {
		if (!isFsErrorCode(error, "ENOENT")) return false;
	}
	return true;
}
function buildClobberedTargetPath(configPath, observedAt, attempt) {
	const basePath = `${configPath}.clobbered.${formatConfigArtifactTimestamp$1(observedAt)}`;
	return attempt === 0 ? basePath : `${basePath}-${String(attempt).padStart(2, "0")}`;
}
async function persistBoundedClobberedConfigSnapshot(params) {
	const paths = resolveClobberPaths(params.configPath);
	if (!await acquireClobberLock(params.deps, paths.lockPath)) return null;
	try {
		const existing = await listClobberedSiblings(params.deps, paths.dir, paths.prefix);
		if (existing.length >= 32) {
			warnClobberCapReached(params.deps, params.configPath, existing.length);
			if (!await rotateOldestClobberedSiblings(params.deps, existing)) return null;
		}
		for (let attempt = 0; attempt < 32; attempt++) {
			const targetPath = buildClobberedTargetPath(params.configPath, params.observedAt, attempt);
			try {
				await params.deps.fs.promises.writeFile(targetPath, params.raw, {
					encoding: "utf-8",
					mode: 384,
					flag: "wx"
				});
				return targetPath;
			} catch (error) {
				if (!isFsErrorCode(error, "EEXIST")) return null;
			}
		}
		return null;
	} finally {
		await params.deps.fs.promises.rmdir(paths.lockPath).catch(() => {});
	}
}
//#endregion
//#region src/config/io.invalid-config.ts
function formatInvalidConfigDetails(issues) {
	return issues.map((issue) => `- ${sanitizeTerminalText(issue.path || "<root>")}: ${sanitizeTerminalText(issue.message)}`).join("\n");
}
function formatInvalidConfigLogMessage(configPath, details) {
	return `Invalid config at ${configPath}:\\n${details}`;
}
function logInvalidConfigOnce(params) {
	if (params.loggedConfigPaths.has(params.configPath)) return;
	params.loggedConfigPaths.add(params.configPath);
	params.logger.error(formatInvalidConfigLogMessage(params.configPath, params.details));
}
function createInvalidConfigError(configPath, details) {
	const error = /* @__PURE__ */ new Error(`Invalid config at ${configPath}:\n${details}`);
	error.code = "INVALID_CONFIG";
	error.details = details;
	return error;
}
function throwInvalidConfig(params) {
	const details = formatInvalidConfigDetails(params.issues);
	logInvalidConfigOnce({
		configPath: params.configPath,
		details,
		logger: params.logger,
		loggedConfigPaths: params.loggedConfigPaths
	});
	throw createInvalidConfigError(params.configPath, details);
}
//#endregion
//#region src/config/io.meta.ts
const AUTO_MANAGED_CONFIG_META_FIELDS = {
	lastTouchedVersion: "lastTouchedVersion",
	lastTouchedAt: "lastTouchedAt"
};
const AUTO_MANAGED_CONFIG_META_PATHS = [["meta", AUTO_MANAGED_CONFIG_META_FIELDS.lastTouchedVersion], ["meta", AUTO_MANAGED_CONFIG_META_FIELDS.lastTouchedAt]];
function stampConfigWriteMetadata(cfg, now = (/* @__PURE__ */ new Date()).toISOString(), version = VERSION) {
	return {
		...cfg,
		meta: {
			...cfg.meta,
			[AUTO_MANAGED_CONFIG_META_FIELDS.lastTouchedVersion]: version,
			[AUTO_MANAGED_CONFIG_META_FIELDS.lastTouchedAt]: now
		}
	};
}
//#endregion
//#region src/config/io.observe-recovery.ts
function createConfigObserveAuditRecord(params) {
	return {
		ts: params.ts,
		source: "config-io",
		event: "config.observe",
		phase: "read",
		configPath: params.configPath,
		...snapshotConfigAuditProcessInfo(),
		exists: true,
		valid: params.valid,
		hash: params.current.hash,
		bytes: params.current.bytes,
		mtimeMs: params.current.mtimeMs,
		ctimeMs: params.current.ctimeMs,
		dev: params.current.dev,
		ino: params.current.ino,
		mode: params.current.mode,
		nlink: params.current.nlink,
		uid: params.current.uid,
		gid: params.current.gid,
		hasMeta: params.current.hasMeta,
		gatewayMode: params.current.gatewayMode,
		suspicious: params.suspicious,
		lastKnownGoodHash: params.lastKnownGood?.hash ?? null,
		lastKnownGoodBytes: params.lastKnownGood?.bytes ?? null,
		lastKnownGoodMtimeMs: params.lastKnownGood?.mtimeMs ?? null,
		lastKnownGoodCtimeMs: params.lastKnownGood?.ctimeMs ?? null,
		lastKnownGoodDev: params.lastKnownGood?.dev ?? null,
		lastKnownGoodIno: params.lastKnownGood?.ino ?? null,
		lastKnownGoodMode: params.lastKnownGood?.mode ?? null,
		lastKnownGoodNlink: params.lastKnownGood?.nlink ?? null,
		lastKnownGoodUid: params.lastKnownGood?.uid ?? null,
		lastKnownGoodGid: params.lastKnownGood?.gid ?? null,
		lastKnownGoodGatewayMode: params.lastKnownGood?.gatewayMode ?? null,
		backupHash: params.backup?.hash ?? null,
		backupBytes: params.backup?.bytes ?? null,
		backupMtimeMs: params.backup?.mtimeMs ?? null,
		backupCtimeMs: params.backup?.ctimeMs ?? null,
		backupDev: params.backup?.dev ?? null,
		backupIno: params.backup?.ino ?? null,
		backupMode: params.backup?.mode ?? null,
		backupNlink: params.backup?.nlink ?? null,
		backupUid: params.backup?.uid ?? null,
		backupGid: params.backup?.gid ?? null,
		backupGatewayMode: params.backup?.gatewayMode ?? null,
		clobberedPath: params.clobberedPath,
		restoredFromBackup: params.restoredFromBackup,
		restoredBackupPath: params.restoredBackupPath,
		restoreErrorCode: params.restoreErrorCode ?? null,
		restoreErrorMessage: params.restoreErrorMessage ?? null
	};
}
function createConfigObserveAuditAppendParams(deps, params) {
	return {
		fs: deps.fs,
		env: deps.env,
		homedir: deps.homedir,
		record: createConfigObserveAuditRecord(params)
	};
}
function hashConfigRaw$1(raw) {
	return crypto.createHash("sha256").update(raw ?? "").digest("hex");
}
function resolveConfigSnapshotHash$1(snapshot) {
	if (typeof snapshot.hash === "string") {
		const trimmed = snapshot.hash.trim();
		if (trimmed) return trimmed;
	}
	if (typeof snapshot.raw !== "string") return null;
	return hashConfigRaw$1(snapshot.raw);
}
function hasConfigMeta$1(value) {
	return isRecord$1(value) && isRecord$1(value.meta) && (typeof value.meta.lastTouchedVersion === "string" || typeof value.meta.lastTouchedAt === "string");
}
function resolveGatewayMode$1(value) {
	if (!isRecord$1(value) || !isRecord$1(value.gateway)) return null;
	return typeof value.gateway.mode === "string" ? value.gateway.mode : null;
}
function resolveConfigStatMetadata$1(stat) {
	if (!stat) return {
		dev: null,
		ino: null,
		mode: null,
		nlink: null,
		uid: null,
		gid: null
	};
	return {
		dev: typeof stat.dev === "number" || typeof stat.dev === "bigint" ? String(stat.dev) : null,
		ino: typeof stat.ino === "number" || typeof stat.ino === "bigint" ? String(stat.ino) : null,
		mode: typeof stat.mode === "number" ? stat.mode : null,
		nlink: typeof stat.nlink === "number" ? stat.nlink : null,
		uid: typeof stat.uid === "number" ? stat.uid : null,
		gid: typeof stat.gid === "number" ? stat.gid : null
	};
}
function createConfigHealthFingerprint(params) {
	return {
		hash: params.hash,
		bytes: Buffer.byteLength(params.raw, "utf-8"),
		mtimeMs: params.stat?.mtimeMs ?? null,
		ctimeMs: params.stat?.ctimeMs ?? null,
		...resolveConfigStatMetadata$1(params.stat),
		hasMeta: hasConfigMeta$1(params.parsed),
		gatewayMode: resolveGatewayMode$1(params.gatewaySource),
		observedAt: params.observedAt
	};
}
function resolveConfigHealthStatePath$1(env, homedir) {
	return path.join(resolveStateDir(env, homedir), "logs", "config-health.json");
}
function formatObserveRecoveryError(error) {
	return error instanceof Error ? error.message : String(error);
}
async function readConfigHealthState$1(deps) {
	try {
		const raw = await deps.fs.promises.readFile(resolveConfigHealthStatePath$1(deps.env, deps.homedir), "utf-8");
		const parsed = deps.json5.parse(raw);
		return isRecord$1(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
async function writeConfigHealthState$1(deps, state) {
	const healthPath = resolveConfigHealthStatePath$1(deps.env, deps.homedir);
	try {
		await deps.fs.promises.mkdir(path.dirname(healthPath), {
			recursive: true,
			mode: 448
		});
		await deps.fs.promises.writeFile(healthPath, `${JSON.stringify(state, null, 2)}\n`, {
			encoding: "utf-8",
			mode: 384
		});
	} catch (err) {
		deps.logger.warn(`Config health-state write failed: ${healthPath}: ${formatObserveRecoveryError(err)}`);
	}
}
function getConfigHealthEntry$1(state, configPath) {
	const entries = state.entries;
	if (!entries || !isRecord$1(entries)) return {};
	const entry = entries[configPath];
	return entry && isRecord$1(entry) ? entry : {};
}
function setConfigHealthEntry$1(state, configPath, entry) {
	return {
		...state,
		entries: {
			...state.entries,
			[configPath]: entry
		}
	};
}
function resolveLastKnownGoodConfigPath(configPath) {
	return `${configPath}.last-good`;
}
function isSensitiveConfigPath(pathLabel) {
	return /(^|\.)(api[-_]?key|auth|bearer|credential|password|private[-_]?key|secret|token)(\.|$)/i.test(pathLabel);
}
function collectPollutedSecretPlaceholders(value, pathLabel = "", output = []) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed === "***" || trimmed === "[redacted]") {
			output.push(pathLabel || "<root>");
			return output;
		}
		if (isSensitiveConfigPath(pathLabel) && (trimmed.includes("...") || trimmed.includes("…"))) output.push(pathLabel || "<root>");
		return output;
	}
	if (Array.isArray(value)) {
		value.forEach((item, index) => collectPollutedSecretPlaceholders(item, `${pathLabel}[${index}]`, output));
		return output;
	}
	if (isRecord$1(value)) for (const [key, child] of Object.entries(value)) collectPollutedSecretPlaceholders(child, pathLabel ? `${pathLabel}.${key}` : key, output);
	return output;
}
async function promoteConfigSnapshotToLastKnownGood$1(params) {
	const { deps, snapshot } = params;
	if (!snapshot.exists || !snapshot.valid || typeof snapshot.raw !== "string") return false;
	const polluted = collectPollutedSecretPlaceholders(snapshot.parsed);
	if (polluted.length > 0) {
		params.logger?.warn(`Config last-known-good promotion skipped: redacted secret placeholder at ${polluted[0]}`);
		return false;
	}
	const stat = await deps.fs.promises.stat(snapshot.path).catch(() => null);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const current = createConfigHealthFingerprint({
		hash: resolveConfigSnapshotHash$1(snapshot) ?? hashConfigRaw$1(snapshot.raw),
		raw: snapshot.raw,
		parsed: snapshot.parsed,
		gatewaySource: snapshot.resolved,
		stat,
		observedAt: now
	});
	const lastGoodPath = resolveLastKnownGoodConfigPath(snapshot.path);
	await deps.fs.promises.writeFile(lastGoodPath, snapshot.raw, {
		encoding: "utf-8",
		mode: 384
	});
	await deps.fs.promises.chmod?.(lastGoodPath, 384).catch(() => {});
	const healthState = await readConfigHealthState$1(deps);
	const entry = getConfigHealthEntry$1(healthState, snapshot.path);
	await writeConfigHealthState$1(deps, setConfigHealthEntry$1(healthState, snapshot.path, {
		...entry,
		lastKnownGood: current,
		lastPromotedGood: current,
		lastObservedSuspiciousSignature: null
	}));
	return true;
}
async function recoverConfigFromLastKnownGood$1(params) {
	const { deps, snapshot } = params;
	if (!snapshot.exists || typeof snapshot.raw !== "string") return false;
	if (!shouldAttemptLastKnownGoodRecovery(snapshot)) {
		if (isPluginLocalInvalidConfigSnapshot(snapshot)) deps.logger.warn(`Config last-known-good recovery skipped: invalidity is scoped to stale plugin config (${params.reason})`);
		return false;
	}
	const healthState = await readConfigHealthState$1(deps);
	const entry = getConfigHealthEntry$1(healthState, snapshot.path);
	const promoted = entry.lastPromotedGood;
	if (!promoted?.hash) return false;
	const lastGoodPath = resolveLastKnownGoodConfigPath(snapshot.path);
	const backupRaw = await deps.fs.promises.readFile(lastGoodPath, "utf-8").catch(() => null);
	if (!backupRaw || hashConfigRaw$1(backupRaw) !== promoted.hash) return false;
	let backupParsed;
	try {
		backupParsed = deps.json5.parse(backupRaw);
	} catch {
		return false;
	}
	const polluted = collectPollutedSecretPlaceholders(backupParsed);
	if (polluted.length > 0) {
		deps.logger.warn(`Config last-known-good recovery skipped: redacted secret placeholder at ${polluted[0]}`);
		return false;
	}
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const stat = await deps.fs.promises.stat(snapshot.path).catch(() => null);
	const current = createConfigHealthFingerprint({
		hash: resolveConfigSnapshotHash$1(snapshot) ?? hashConfigRaw$1(snapshot.raw),
		raw: snapshot.raw,
		parsed: snapshot.parsed,
		gatewaySource: snapshot.resolved,
		stat,
		observedAt: now
	});
	const clobberedPath = await persistBoundedClobberedConfigSnapshot({
		deps,
		configPath: snapshot.path,
		raw: snapshot.raw,
		observedAt: now
	});
	await deps.fs.promises.copyFile(lastGoodPath, snapshot.path);
	await deps.fs.promises.chmod?.(snapshot.path, 384).catch(() => {});
	const issueSummary = formatConfigIssueSummary([...snapshot.issues, ...snapshot.legacyIssues]);
	deps.logger.warn(`Config auto-restored from last-known-good: ${snapshot.path} (${params.reason})${issueSummary ? `; Rejected validation details: ${issueSummary}.` : ""}`);
	await appendConfigAuditRecord(createConfigObserveAuditAppendParams(deps, {
		ts: now,
		configPath: snapshot.path,
		valid: snapshot.valid,
		current,
		suspicious: [params.reason],
		lastKnownGood: promoted,
		backup: promoted,
		clobberedPath,
		restoredFromBackup: true,
		restoredBackupPath: lastGoodPath
	}));
	await writeConfigHealthState$1(deps, setConfigHealthEntry$1(healthState, snapshot.path, {
		...entry,
		lastKnownGood: promoted,
		lastPromotedGood: promoted,
		lastObservedSuspiciousSignature: null
	}));
	return true;
}
//#endregion
//#region src/config/io.owner-display-secret.ts
function retainGeneratedOwnerDisplaySecret(params) {
	const { config, configPath, generatedSecret, state } = params;
	if (!generatedSecret) {
		state.pendingByPath.delete(configPath);
		return config;
	}
	state.pendingByPath.set(configPath, generatedSecret);
	return config;
}
//#endregion
//#region src/config/io.write-prepare.ts
const OPEN_DM_POLICY_ALLOW_FROM_RE = /^(?<policyPath>[a-z0-9_.-]+)\s*=\s*"open"\s+requires\s+(?<allowPath>[a-z0-9_.-]+)(?:\s+\(or\s+[a-z0-9_.-]+\))?\s+to include "\*"$/i;
const MANAGED_CONFIG_UNSET_PATHS = [["plugins", "installs"]];
function cloneUnknown(value) {
	return structuredClone(value);
}
function createMergePatch(base, target) {
	if (!isRecord$1(base) || !isRecord$1(target)) return cloneUnknown(target);
	const patch = {};
	const keys = new Set([...Object.keys(base), ...Object.keys(target)]);
	for (const key of keys) {
		const hasBase = key in base;
		if (!(key in target)) {
			patch[key] = null;
			continue;
		}
		const targetValue = target[key];
		if (!hasBase) {
			patch[key] = cloneUnknown(targetValue);
			continue;
		}
		const baseValue = base[key];
		if (isRecord$1(baseValue) && isRecord$1(targetValue)) {
			const childPatch = createMergePatch(baseValue, targetValue);
			if (isRecord$1(childPatch) && Object.keys(childPatch).length === 0) continue;
			patch[key] = childPatch;
			continue;
		}
		if (!isDeepStrictEqual(baseValue, targetValue)) patch[key] = cloneUnknown(targetValue);
	}
	return patch;
}
function projectSourceOntoRuntimeShape(source, runtime) {
	if (!isRecord$1(source) || !isRecord$1(runtime)) return cloneUnknown(source);
	const next = {};
	for (const [key, sourceValue] of Object.entries(source)) {
		if (!(key in runtime)) {
			next[key] = cloneUnknown(sourceValue);
			continue;
		}
		next[key] = projectSourceOntoRuntimeShape(sourceValue, runtime[key]);
	}
	return next;
}
function hasOwnIncludeKey(value) {
	return isRecord$1(value) && Object.prototype.hasOwnProperty.call(value, "$include");
}
function collectIncludeOwnedPaths(value, path = []) {
	if (!isRecord$1(value)) return [];
	if (hasOwnIncludeKey(value)) return [path];
	return Object.entries(value).flatMap(([key, child]) => collectIncludeOwnedPaths(child, [...path, key]));
}
function patchTouchesPath(patch, path) {
	if (path.length === 0) return isRecord$1(patch) ? Object.keys(patch).length > 0 : true;
	if (!isRecord$1(patch)) return true;
	const [head, ...tail] = path;
	if (!Object.prototype.hasOwnProperty.call(patch, head)) return false;
	return patchTouchesPath(patch[head], tail);
}
function formatConfigPath$1(path) {
	return path.length > 0 ? path.join(".") : "<root>";
}
function getPathValue(value, path) {
	let current = value;
	for (const segment of path) {
		if (Array.isArray(current)) {
			if (!isNumericPathSegment(segment)) return;
			const index = Number.parseInt(segment, 10);
			if (!Number.isFinite(index) || index < 0 || index >= current.length) return;
			current = current[index];
			continue;
		}
		if (!isRecord$1(current)) return;
		current = current[segment];
	}
	return current;
}
function setPathValue(value, path, nextValue) {
	if (path.length === 0) return cloneUnknown(nextValue);
	const [head, ...tail] = path;
	if (Array.isArray(value)) {
		if (!isNumericPathSegment(head)) return value;
		const index = Number.parseInt(head, 10);
		if (!Number.isFinite(index) || index < 0 || index >= value.length) return value;
		const next = [...value];
		next[index] = setPathValue(value[index], tail, nextValue);
		return next;
	}
	if (!isRecord$1(value)) return value;
	return {
		...value,
		[head]: setPathValue(value[head], tail, nextValue)
	};
}
function pathStartsWith(path, prefix) {
	return prefix.length <= path.length && prefix.every((segment, index) => path[index] === segment);
}
function pathOverlapsAny(path, candidates) {
	return Boolean(candidates?.some((candidate) => pathStartsWith(path, candidate) || pathStartsWith(candidate, path)));
}
function isIncludeOwnedPath(rootAuthoredConfig, path) {
	return collectIncludeOwnedPaths(rootAuthoredConfig).some((includePath) => pathStartsWith(path, includePath) || pathStartsWith(includePath, path));
}
function findOverlappingIncludeOwnedPath(rootAuthoredConfig, path) {
	return collectIncludeOwnedPaths(rootAuthoredConfig).find((includePath) => pathStartsWith(path, includePath) || pathStartsWith(includePath, path));
}
function setPathValueCreatingParents(value, path, nextValue) {
	if (path.length === 0) return cloneUnknown(nextValue);
	const [head, ...tail] = path;
	if (Array.isArray(value) || isNumericPathSegment(head)) {
		if (!isNumericPathSegment(head)) return value;
		const index = Number.parseInt(head, 10);
		if (!Number.isFinite(index) || index < 0) return value;
		const next = Array.isArray(value) ? [...value] : [];
		next[index] = setPathValueCreatingParents(next[index], tail, nextValue);
		return next;
	}
	const record = isRecord$1(value) ? value : {};
	return {
		...record,
		[head]: setPathValueCreatingParents(record[head], tail, nextValue)
	};
}
function deletePathValue(value, path) {
	if (path.length === 0 || !isRecord$1(value)) return value;
	const [head, ...tail] = path;
	if (!Object.prototype.hasOwnProperty.call(value, head)) return value;
	const next = { ...value };
	if (tail.length === 0) {
		delete next[head];
		return next;
	}
	next[head] = deletePathValue(value[head], tail);
	return next;
}
function preserveSourceValueAtPath(params) {
	if (pathOverlapsAny(params.path, params.unsetPaths)) return params.persistedCandidate;
	if (isIncludeOwnedPath(params.rootAuthoredConfig, params.path)) return params.persistedCandidate;
	if (getPathValue(params.nextConfig, params.path) !== void 0) return params.persistedCandidate;
	const sourceValue = params.sourceValue ?? getPathValue(params.sourceConfig, params.path);
	if (sourceValue === void 0 || getPathValue(params.persistedCandidate, params.path) !== void 0) return params.persistedCandidate;
	return setPathValueCreatingParents(params.persistedCandidate, params.path, sourceValue);
}
function preserveAuthoredAgentParams(params) {
	const defaults = getPathValue(params.sourceConfig, ["agents", "defaults"]);
	if (!isRecord$1(defaults)) return params.persistedCandidate;
	let next = params.persistedCandidate;
	if (Object.prototype.hasOwnProperty.call(defaults, "params")) next = preserveSourceValueAtPath({
		...params,
		persistedCandidate: next,
		path: [
			"agents",
			"defaults",
			"params"
		],
		sourceValue: defaults.params
	});
	const models = defaults.models;
	if (!isRecord$1(models)) return next;
	for (const [modelId, modelEntry] of Object.entries(models)) {
		if (!isRecord$1(modelEntry) || !Object.prototype.hasOwnProperty.call(modelEntry, "params")) continue;
		const modelPath = [
			"agents",
			"defaults",
			"models",
			normalizeAgentModelRefForConfig(modelId) || modelId
		];
		const paramsPath = [...modelPath, "params"];
		if (modelPath.at(-1) !== modelId) next = deletePathValue(next, [
			"agents",
			"defaults",
			"models",
			modelId
		]);
		if (getPathValue(next, modelPath) === void 0) {
			next = preserveSourceValueAtPath({
				...params,
				persistedCandidate: next,
				path: modelPath,
				sourceValue: modelEntry
			});
			continue;
		}
		next = preserveSourceValueAtPath({
			...params,
			persistedCandidate: next,
			path: paramsPath,
			sourceValue: modelEntry.params
		});
	}
	return next;
}
function normalizeAgentModelConfigForWrite(value) {
	if (typeof value === "string") {
		const normalized = normalizeAgentModelRefForConfig(value);
		return normalized === value ? value : normalized;
	}
	if (!isRecord$1(value)) return value;
	let mutated = false;
	const next = { ...value };
	if (typeof value.primary === "string") {
		const primary = normalizeAgentModelRefForConfig(value.primary);
		if (primary !== value.primary) {
			next.primary = primary;
			mutated = true;
		}
	}
	if (Array.isArray(value.fallbacks)) {
		const fallbacks = value.fallbacks.map((fallback) => typeof fallback === "string" ? normalizeAgentModelRefForConfig(fallback) : fallback);
		if (!isDeepStrictEqual(fallbacks, value.fallbacks)) {
			next.fallbacks = fallbacks;
			mutated = true;
		}
	}
	return mutated ? next : value;
}
const AGENT_MODEL_CONFIG_KEYS = [
	"model",
	"imageModel",
	"imageGenerationModel",
	"videoGenerationModel",
	"musicGenerationModel",
	"pdfModel"
];
function normalizeModelConfigPathForWrite(config, path) {
	const value = getPathValue(config, path);
	if (value === void 0) return config;
	const normalizedModel = normalizeAgentModelConfigForWrite(value);
	return normalizedModel !== value ? setPathValue(config, path, normalizedModel) : config;
}
function normalizeModelStringPathForWrite(config, path) {
	const value = getPathValue(config, path);
	if (typeof value !== "string") return config;
	const normalized = normalizeAgentModelRefForConfig(value);
	return normalized !== value ? setPathValue(config, path, normalized) : config;
}
function normalizeAgentModelRefsAtPathForWrite(config, path) {
	if (!isRecord$1(getPathValue(config, path))) return config;
	let next = config;
	for (const key of AGENT_MODEL_CONFIG_KEYS) next = normalizeModelConfigPathForWrite(next, [...path, key]);
	next = normalizeModelStringPathForWrite(next, [
		...path,
		"heartbeat",
		"model"
	]);
	next = normalizeModelConfigPathForWrite(next, [
		...path,
		"subagents",
		"model"
	]);
	next = normalizeModelStringPathForWrite(next, [
		...path,
		"compaction",
		"model"
	]);
	next = normalizeModelStringPathForWrite(next, [
		...path,
		"compaction",
		"memoryFlush",
		"model"
	]);
	const models = getPathValue(next, [...path, "models"]);
	if (isRecord$1(models)) {
		const normalizedModels = normalizeAgentModelMapForConfig(models);
		if (normalizedModels !== models) next = setPathValue(next, [...path, "models"], normalizedModels);
	}
	return next;
}
function normalizeAgentListModelRefsForWrite(config) {
	const list = getPathValue(config, ["agents", "list"]);
	if (!Array.isArray(list)) return config;
	let mutated = false;
	const nextList = list.map((agent) => {
		if (!isRecord$1(agent)) return agent;
		const normalized = normalizeAgentModelRefsAtPathForWrite({ agent }, ["agent"]);
		if (normalized.agent !== agent) {
			mutated = true;
			return normalized.agent;
		}
		return agent;
	});
	return mutated ? setPathValue(config, ["agents", "list"], nextList) : config;
}
function normalizeToolsModelRefsForWrite(config) {
	return normalizeModelConfigPathForWrite(config, [
		"tools",
		"subagents",
		"model"
	]);
}
function normalizeModelProviderCatalogRefsForWrite(config) {
	const providers = getPathValue(config, ["models", "providers"]);
	if (!isRecord$1(providers)) return config;
	let mutated = false;
	const nextProviders = { ...providers };
	for (const [provider, providerConfig] of Object.entries(providers)) {
		if (!isRecord$1(providerConfig) || !Array.isArray(providerConfig.models)) continue;
		let providerMutated = false;
		const models = providerConfig.models.map((model) => {
			if (!isRecord$1(model) || typeof model.id !== "string") return model;
			const trimmed = model.id.trim();
			if (!trimmed) return model;
			const id = normalizeConfiguredProviderCatalogModelId(provider, trimmed);
			if (id === model.id) return model;
			providerMutated = true;
			return {
				...model,
				id
			};
		});
		if (providerMutated) {
			nextProviders[provider] = {
				...providerConfig,
				models
			};
			mutated = true;
		}
	}
	return mutated ? setPathValue(config, ["models", "providers"], nextProviders) : config;
}
function normalizeModelRefsForWrite(config) {
	return normalizeModelProviderCatalogRefsForWrite(normalizeToolsModelRefsForWrite(normalizeAgentListModelRefsForWrite(normalizeAgentModelRefsAtPathForWrite(config, ["agents", "defaults"]))));
}
function preserveUntouchedIncludes(params) {
	let next = params.persistedCandidate;
	for (const includePath of collectIncludeOwnedPaths(params.rootAuthoredConfig)) {
		if (patchTouchesPath(params.patch, includePath)) throw new Error(`Config write would flatten $include-owned config at ${formatConfigPath$1(includePath)}; edit that include file directly or remove the $include first.`);
		next = setPathValue(next, includePath, getPathValue(params.rootAuthoredConfig, includePath));
	}
	return next;
}
function hasPathValue(value, path) {
	if (path.length === 0) return true;
	const [head, ...tail] = path;
	if (Array.isArray(value)) {
		if (!isNumericPathSegment(head)) return false;
		const index = Number.parseInt(head, 10);
		if (!Number.isFinite(index) || index < 0 || index >= value.length) return false;
		return tail.length === 0 || hasPathValue(value[index], tail);
	}
	if (!isRecord$1(value)) return false;
	if (isBlockedObjectKey(head) || !Object.prototype.hasOwnProperty.call(value, head)) return false;
	return tail.length === 0 || hasPathValue(value[head], tail);
}
function mergeMissingExplicitValues(currentValue, explicitValue) {
	if (!isRecord$1(currentValue) || !isRecord$1(explicitValue)) {
		if (!Array.isArray(currentValue) || !Array.isArray(explicitValue)) return {
			changed: false,
			value: currentValue
		};
		let changed = false;
		const next = [...currentValue];
		for (const [key, childExplicitValue] of Object.entries(explicitValue)) {
			const index = Number.parseInt(key, 10);
			if (!Number.isFinite(index) || index < 0) continue;
			if (index >= next.length || next[index] === void 0) {
				next[index] = cloneUnknown(childExplicitValue);
				changed = true;
				continue;
			}
			const childMerged = mergeMissingExplicitValues(next[index], childExplicitValue);
			if (childMerged.changed) {
				next[index] = childMerged.value;
				changed = true;
			}
		}
		return {
			changed,
			value: changed ? next : currentValue
		};
	}
	let changed = false;
	const next = { ...currentValue };
	for (const [key, childExplicitValue] of Object.entries(explicitValue)) {
		if (isBlockedObjectKey(key)) continue;
		if (!Object.prototype.hasOwnProperty.call(next, key)) {
			next[key] = cloneUnknown(childExplicitValue);
			changed = true;
			continue;
		}
		const childMerged = mergeMissingExplicitValues(next[key], childExplicitValue);
		if (childMerged.changed) {
			next[key] = childMerged.value;
			changed = true;
		}
	}
	return {
		changed,
		value: changed ? next : currentValue
	};
}
function injectExplicitlySetPaths(params) {
	if (!params.explicitSetPaths || params.explicitSetPaths.length === 0) return params.persistedCandidate;
	let next = params.persistedCandidate;
	for (const path of params.explicitSetPaths) {
		if (path.length === 0 || path.some(isBlockedObjectKey)) continue;
		const includeOwnedPath = params.rootAuthoredConfig ? findOverlappingIncludeOwnedPath(params.rootAuthoredConfig, [...path]) : void 0;
		if (includeOwnedPath) throw new Error(`Config write would flatten $include-owned config at ${formatConfigPath$1(includeOwnedPath)}; edit that include file directly or remove the $include first.`);
		const nextValue = getPathValue(params.valueSource, [...path]);
		if (nextValue === void 0) continue;
		if (!hasPathValue(next, path)) {
			next = setPathValueCreatingParents(next, [...path], nextValue);
			continue;
		}
		const merged = mergeMissingExplicitValues(getPathValue(next, [...path]), nextValue);
		if (merged.changed) next = setPathValue(next, [...path], merged.value);
	}
	return next;
}
function resolvePersistCandidateForWrite(params) {
	const patch = createMergePatch(params.runtimeConfig, params.nextConfig);
	const projectedSource = projectSourceOntoRuntimeShape(params.sourceConfig, params.runtimeConfig);
	const rootAuthoredConfig = params.rootAuthoredConfig ?? params.sourceConfig;
	const persistedBase = preserveUntouchedIncludes({
		patch,
		rootAuthoredConfig,
		persistedCandidate: applyMergePatch(projectedSource, patch)
	});
	const persisted = injectExplicitlySetPaths({
		valueSource: params.explicitSetValueSource ?? params.nextConfig,
		persistedCandidate: persistedBase,
		explicitSetPaths: params.explicitSetPaths,
		rootAuthoredConfig
	});
	const withSchema = preserveRootSchemaUri({
		rootAuthoredConfig,
		nextConfig: params.nextConfig,
		persistedCandidate: persisted
	});
	return normalizeModelRefsForWrite(preserveAuthoredAgentParams({
		sourceConfig: params.sourceConfig,
		nextConfig: params.nextConfig,
		rootAuthoredConfig,
		persistedCandidate: withSchema,
		unsetPaths: params.unsetPaths
	}));
}
function readRootSchemaUri(value) {
	if (!isRecord$1(value) || typeof value.$schema !== "string") return;
	return value.$schema;
}
function hasOwnRootSchemaKey(value) {
	return isRecord$1(value) && Object.prototype.hasOwnProperty.call(value, "$schema");
}
function preserveRootSchemaUri(params) {
	if (hasOwnRootSchemaKey(params.nextConfig)) return params.persistedCandidate;
	const sourceSchema = readRootSchemaUri(params.rootAuthoredConfig);
	if (sourceSchema === void 0 || !isRecord$1(params.persistedCandidate)) return params.persistedCandidate;
	return {
		...params.persistedCandidate,
		$schema: sourceSchema
	};
}
function formatConfigValidationFailure(pathLabel, issueMessage) {
	const match = issueMessage.match(OPEN_DM_POLICY_ALLOW_FROM_RE);
	const policyPath = match?.groups?.policyPath?.trim();
	const allowPath = match?.groups?.allowPath?.trim();
	if (!policyPath || !allowPath) return `Config validation failed: ${pathLabel}: ${issueMessage}`;
	return [
		`Config validation failed: ${pathLabel}`,
		"",
		`Configuration mismatch: ${policyPath} is "open", but ${allowPath} does not include "*".`,
		"",
		"Fix with:",
		`  openclaw config set ${allowPath} '["*"]'`,
		"",
		"Or switch policy:",
		`  openclaw config set ${policyPath} "pairing"`
	].join("\n");
}
function isNumericPathSegment(raw) {
	return /^[0-9]+$/.test(raw);
}
function isWritePlainObject(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function hasOwnObjectKey(value, key) {
	return Object.prototype.hasOwnProperty.call(value, key);
}
const WRITE_PRUNED_OBJECT = Symbol("write-pruned-object");
function coerceConfig$1(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	return value;
}
function unsetPathForWriteAt(value, pathSegments, depth) {
	if (depth >= pathSegments.length) return {
		changed: false,
		value
	};
	const segment = pathSegments[depth];
	const isLeaf = depth === pathSegments.length - 1;
	if (Array.isArray(value)) {
		if (!isNumericPathSegment(segment)) return {
			changed: false,
			value
		};
		const index = Number.parseInt(segment, 10);
		if (!Number.isFinite(index) || index < 0 || index >= value.length) return {
			changed: false,
			value
		};
		if (isLeaf) {
			const next = value.slice();
			next.splice(index, 1);
			return {
				changed: true,
				value: next
			};
		}
		const child = unsetPathForWriteAt(value[index], pathSegments, depth + 1);
		if (!child.changed) return {
			changed: false,
			value
		};
		const next = value.slice();
		if (child.value === WRITE_PRUNED_OBJECT) next.splice(index, 1);
		else next[index] = child.value;
		return {
			changed: true,
			value: next
		};
	}
	if (isBlockedObjectKey(segment) || !isWritePlainObject(value) || !hasOwnObjectKey(value, segment)) return {
		changed: false,
		value
	};
	if (isLeaf) {
		const next = { ...value };
		delete next[segment];
		return {
			changed: true,
			value: Object.keys(next).length === 0 ? WRITE_PRUNED_OBJECT : next
		};
	}
	const child = unsetPathForWriteAt(value[segment], pathSegments, depth + 1);
	if (!child.changed) return {
		changed: false,
		value
	};
	const next = { ...value };
	if (child.value === WRITE_PRUNED_OBJECT) delete next[segment];
	else next[segment] = child.value;
	return {
		changed: true,
		value: Object.keys(next).length === 0 ? WRITE_PRUNED_OBJECT : next
	};
}
function unsetPathForWrite(root, pathSegments) {
	if (pathSegments.length === 0) return {
		changed: false,
		next: root
	};
	const result = unsetPathForWriteAt(root, pathSegments, 0);
	if (!result.changed) return {
		changed: false,
		next: root
	};
	if (result.value === WRITE_PRUNED_OBJECT) return {
		changed: true,
		next: {}
	};
	if (isWritePlainObject(result.value)) return {
		changed: true,
		next: coerceConfig$1(result.value)
	};
	return {
		changed: false,
		next: root
	};
}
function applyUnsetPathsForWrite(root, unsetPaths) {
	let next = root;
	for (const unsetPath of unsetPaths ?? []) {
		if (!Array.isArray(unsetPath) || unsetPath.length === 0) continue;
		const unsetResult = unsetPathForWrite(next, unsetPath);
		if (unsetResult.changed) next = unsetResult.next;
	}
	return next;
}
function resolveManagedUnsetPathsForWrite(unsetPaths) {
	const next = [];
	for (const managedPath of MANAGED_CONFIG_UNSET_PATHS) next.push(Array.from(managedPath));
	for (const unsetPath of unsetPaths ?? []) {
		if (!Array.isArray(unsetPath) || unsetPath.length === 0) continue;
		if (next.some((existing) => isDeepStrictEqual(existing, unsetPath))) continue;
		next.push([...unsetPath]);
	}
	return next;
}
function collectChangedPaths(base, target, path, output) {
	if (Array.isArray(base) && Array.isArray(target)) {
		const max = Math.max(base.length, target.length);
		for (let index = 0; index < max; index += 1) {
			const childPath = path ? `${path}[${index}]` : `[${index}]`;
			if (index >= base.length || index >= target.length) {
				output.add(childPath);
				continue;
			}
			collectChangedPaths(base[index], target[index], childPath, output);
		}
		return;
	}
	if (isRecord$1(base) && isRecord$1(target)) {
		const keys = new Set([...Object.keys(base), ...Object.keys(target)]);
		for (const key of keys) {
			const childPath = path ? `${path}.${key}` : key;
			const hasBase = key in base;
			if (!(key in target) || !hasBase) {
				output.add(childPath);
				continue;
			}
			collectChangedPaths(base[key], target[key], childPath, output);
		}
		return;
	}
	if (!isDeepStrictEqual(base, target)) output.add(path);
}
function parentPath(value) {
	if (!value) return "";
	if (value.endsWith("]")) {
		const index = value.lastIndexOf("[");
		return index > 0 ? value.slice(0, index) : "";
	}
	const index = value.lastIndexOf(".");
	return index >= 0 ? value.slice(0, index) : "";
}
function isPathChanged(path, changedPaths) {
	if (changedPaths.has(path)) return true;
	let current = parentPath(path);
	while (current) {
		if (changedPaths.has(current)) return true;
		current = parentPath(current);
	}
	return changedPaths.has("");
}
function restoreEnvRefsFromMap(value, path, envRefMap, changedPaths) {
	if (typeof value === "string") {
		if (!isPathChanged(path, changedPaths)) {
			const original = envRefMap.get(path);
			if (original !== void 0) return original;
		}
		return value;
	}
	if (Array.isArray(value)) {
		let changed = false;
		const next = value.map((item, index) => {
			const updated = restoreEnvRefsFromMap(item, `${path}[${index}]`, envRefMap, changedPaths);
			if (updated !== item) changed = true;
			return updated;
		});
		return changed ? next : value;
	}
	if (isRecord$1(value)) {
		let changed = false;
		const next = {};
		for (const [key, child] of Object.entries(value)) {
			const updated = restoreEnvRefsFromMap(child, path ? `${path}.${key}` : key, envRefMap, changedPaths);
			if (updated !== child) changed = true;
			next[key] = updated;
		}
		return changed ? next : value;
	}
	return value;
}
function resolveWriteEnvSnapshotForPath(params) {
	if (params.expectedConfigPath === void 0 || params.expectedConfigPath === params.actualConfigPath) return params.envSnapshotForRestore;
}
function resolveCronMaxConcurrentRuns(cronConfig) {
	const raw = cronConfig?.maxConcurrentRuns;
	if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
	return 8;
}
//#endregion
//#region src/config/provider-policy.ts
function normalizeProviderConfigForConfigDefaults(params) {
	const normalized = resolveBundledProviderPolicySurface(params.provider, { manifestRegistry: params.manifestRegistry })?.normalizeConfig?.({
		provider: params.provider,
		providerConfig: params.providerConfig
	});
	return normalized && normalized !== params.providerConfig ? normalized : params.providerConfig;
}
function applyProviderConfigDefaultsForConfig(params) {
	return resolveBundledProviderPolicySurface(params.provider, { manifestRegistry: params.manifestRegistry })?.applyConfigDefaults?.({
		provider: params.provider,
		config: params.config,
		env: params.env
	}) ?? params.config;
}
//#endregion
//#region src/config/defaults.ts
let defaultWarnState = { warned: false };
const DEFAULT_MODEL_ALIASES = {
	opus: "anthropic/claude-opus-4-7",
	sonnet: "anthropic/claude-sonnet-4-6",
	gpt: "openai/gpt-5.4",
	"gpt-mini": "openai/gpt-5.4-mini",
	"gpt-nano": "openai/gpt-5.4-nano",
	gemini: "google/gemini-3.1-pro-preview",
	"gemini-flash": "google/gemini-3-flash-preview",
	"gemini-flash-lite": "google/gemini-3.1-flash-lite"
};
const DEFAULT_MODEL_COST = {
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0
};
const DEFAULT_MODEL_INPUT = ["text"];
const DEFAULT_MODEL_MAX_TOKENS = 8192;
const MISTRAL_SAFE_MAX_TOKENS_BY_MODEL = {
	"devstral-medium-latest": 32768,
	"magistral-small": 4e4,
	"mistral-large-latest": 16384,
	"mistral-medium-2508": 8192,
	"mistral-small-latest": 16384,
	"pixtral-large-latest": 32768
};
function isPositiveNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function resolveModelCost(raw) {
	return {
		input: typeof raw?.input === "number" ? raw.input : DEFAULT_MODEL_COST.input,
		output: typeof raw?.output === "number" ? raw.output : DEFAULT_MODEL_COST.output,
		cacheRead: typeof raw?.cacheRead === "number" ? raw.cacheRead : DEFAULT_MODEL_COST.cacheRead,
		cacheWrite: typeof raw?.cacheWrite === "number" ? raw.cacheWrite : DEFAULT_MODEL_COST.cacheWrite,
		...raw?.tieredPricing ? { tieredPricing: raw.tieredPricing } : {}
	};
}
function resolveNormalizedProviderModelMaxTokens(params) {
	const clamped = Math.min(params.rawMaxTokens, params.contextWindow);
	if (normalizeProviderId(params.providerId) !== "mistral" || clamped < params.contextWindow) return clamped;
	const safeMaxTokens = MISTRAL_SAFE_MAX_TOKENS_BY_MODEL[params.modelId] ?? DEFAULT_MODEL_MAX_TOKENS;
	return Math.min(safeMaxTokens, params.contextWindow);
}
function applyMessageDefaults(cfg) {
	const messages = cfg.messages;
	if (messages?.ackReactionScope !== void 0) return cfg;
	const nextMessages = messages ? { ...messages } : {};
	nextMessages.ackReactionScope = "group-mentions";
	return {
		...cfg,
		messages: nextMessages
	};
}
function applySessionDefaults(cfg, options = {}) {
	const session = cfg.session;
	if (!session || session.mainKey === void 0) return cfg;
	const trimmed = session.mainKey.trim();
	const warn = options.warn ?? console.warn;
	const warnState = options.warnState ?? defaultWarnState;
	const next = {
		...cfg,
		session: {
			...session,
			mainKey: "main"
		}
	};
	if (trimmed && trimmed !== "main" && !warnState.warned) {
		warnState.warned = true;
		warn("session.mainKey is ignored; main session is always \"main\".");
	}
	return next;
}
function applyTalkConfigNormalization(config) {
	return normalizeTalkConfig(config);
}
function applyModelDefaults(cfg, options = {}) {
	let mutated = false;
	let nextCfg = cfg;
	const providerConfig = nextCfg.models?.providers;
	if (providerConfig) {
		const nextProviders = { ...providerConfig };
		for (const [providerId, provider] of Object.entries(providerConfig)) {
			const normalizedProvider = normalizeProviderConfigForConfigDefaults({
				provider: providerId,
				providerConfig: provider,
				manifestRegistry: options.manifestRegistry
			});
			const models = normalizedProvider.models;
			if (!Array.isArray(models) || models.length === 0) {
				if (normalizedProvider !== provider) {
					nextProviders[providerId] = normalizedProvider;
					mutated = true;
				}
				continue;
			}
			const providerApi = normalizedProvider.api;
			let nextProvider = normalizedProvider;
			if (nextProvider !== provider) mutated = true;
			let providerMutated = false;
			const nextModels = models.map((model) => {
				const raw = model;
				let modelMutated = false;
				const id = normalizeConfiguredProviderCatalogModelId(providerId, raw.id);
				if (id !== raw.id) modelMutated = true;
				const reasoning = typeof raw.reasoning === "boolean" ? raw.reasoning : false;
				if (raw.reasoning !== reasoning) modelMutated = true;
				const input = raw.input ?? [...DEFAULT_MODEL_INPUT];
				if (raw.input === void 0) modelMutated = true;
				const cost = resolveModelCost(raw.cost);
				if (!raw.cost || raw.cost.input !== cost.input || raw.cost.output !== cost.output || raw.cost.cacheRead !== cost.cacheRead || raw.cost.cacheWrite !== cost.cacheWrite) modelMutated = true;
				const contextWindow = isPositiveNumber(raw.contextWindow) ? raw.contextWindow : DEFAULT_CONTEXT_TOKENS;
				if (raw.contextWindow !== contextWindow) modelMutated = true;
				const defaultMaxTokens = Math.min(DEFAULT_MODEL_MAX_TOKENS, contextWindow);
				const maxTokens = resolveNormalizedProviderModelMaxTokens({
					providerId,
					modelId: id,
					contextWindow,
					rawMaxTokens: isPositiveNumber(raw.maxTokens) ? raw.maxTokens : defaultMaxTokens
				});
				if (raw.maxTokens !== maxTokens) modelMutated = true;
				const api = raw.api ?? providerApi;
				if (raw.api !== api) modelMutated = true;
				if (!modelMutated) return model;
				providerMutated = true;
				return Object.assign({}, raw, {
					id,
					reasoning,
					input,
					cost,
					contextWindow,
					maxTokens,
					api
				});
			});
			if (!providerMutated) {
				if (nextProvider !== provider) nextProviders[providerId] = nextProvider;
				continue;
			}
			nextProviders[providerId] = {
				...nextProvider,
				models: nextModels
			};
			mutated = true;
		}
		if (mutated) nextCfg = {
			...nextCfg,
			models: {
				...nextCfg.models,
				providers: nextProviders
			}
		};
	}
	let nextAgents = nextCfg.agents;
	const rawAgentList = nextAgents?.list;
	if (Array.isArray(rawAgentList)) {
		let listMutated = false;
		const agentList = rawAgentList.map((agent) => {
			if (!isRecord(agent)) return agent;
			let nextAgent = agent;
			if (Object.prototype.hasOwnProperty.call(agent, "model")) {
				const normalizedModel = normalizeAgentModelConfigForDefaults(agent.model);
				if (normalizedModel !== agent.model) {
					nextAgent = {
						...nextAgent,
						model: normalizedModel
					};
					listMutated = true;
				}
			}
			if (isRecord(agent.models)) {
				const normalizedModels = normalizeAgentModelMapForConfig(agent.models);
				if (normalizedModels !== agent.models) {
					nextAgent = {
						...nextAgent,
						models: normalizedModels
					};
					listMutated = true;
				}
			}
			return nextAgent;
		});
		if (listMutated) {
			nextAgents = {
				...nextAgents,
				list: agentList
			};
			mutated = true;
		}
	}
	const existingAgent = nextAgents?.defaults;
	if (!existingAgent) {
		if (!mutated) return cfg;
		return nextAgents === nextCfg.agents ? nextCfg : {
			...nextCfg,
			agents: nextAgents
		};
	}
	let nextAgent = existingAgent;
	const normalizedModel = normalizeAgentModelConfigForDefaults(existingAgent.model);
	if (normalizedModel !== existingAgent.model) {
		nextAgent = {
			...nextAgent,
			model: normalizedModel
		};
		mutated = true;
	}
	const rawExistingModels = existingAgent.models ?? {};
	const existingModels = normalizeAgentModelMapForConfig(rawExistingModels);
	if (existingModels !== rawExistingModels) mutated = true;
	if (Object.keys(existingModels).length === 0) return mutated ? {
		...nextCfg,
		agents: {
			...nextAgents,
			defaults: nextAgent
		}
	} : cfg;
	const nextModels = { ...existingModels };
	for (const [alias, target] of Object.entries(DEFAULT_MODEL_ALIASES)) {
		const entry = nextModels[target];
		if (!entry) continue;
		if (entry.alias !== void 0) continue;
		nextModels[target] = {
			...entry,
			alias
		};
		mutated = true;
	}
	if (!mutated) return cfg;
	return {
		...nextCfg,
		agents: {
			...nextAgents,
			defaults: {
				...nextAgent,
				models: nextModels
			}
		}
	};
}
function normalizeAgentModelConfigForDefaults(value) {
	if (typeof value === "string") {
		const normalized = normalizeAgentModelRefForConfig(value);
		return normalized === value ? value : normalized;
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) return value;
	const raw = value;
	let mutated = false;
	const next = { ...raw };
	if (typeof raw.primary === "string") {
		const primary = normalizeAgentModelRefForConfig(raw.primary);
		if (primary !== raw.primary) {
			next.primary = primary;
			mutated = true;
		}
	}
	if (Array.isArray(raw.fallbacks)) {
		const rawFallbacks = raw.fallbacks;
		const fallbacks = rawFallbacks.map((fallback) => typeof fallback === "string" ? normalizeAgentModelRefForConfig(fallback) : fallback);
		if (fallbacks.some((fallback, index) => fallback !== rawFallbacks[index])) {
			next.fallbacks = fallbacks;
			mutated = true;
		}
	}
	return mutated ? next : value;
}
function applyAgentDefaults(cfg) {
	const agents = cfg.agents;
	const defaults = agents?.defaults;
	const hasMax = typeof defaults?.maxConcurrent === "number" && Number.isFinite(defaults.maxConcurrent);
	const hasSubMax = typeof defaults?.subagents?.maxConcurrent === "number" && Number.isFinite(defaults.subagents.maxConcurrent);
	const hasSubArchive = typeof defaults?.subagents?.archiveAfterMinutes === "number" && Number.isFinite(defaults.subagents.archiveAfterMinutes);
	if (hasMax && hasSubMax && hasSubArchive) return cfg;
	let mutated = false;
	const nextDefaults = defaults ? { ...defaults } : {};
	if (!hasMax) {
		nextDefaults.maxConcurrent = 4;
		mutated = true;
	}
	const nextSubagents = defaults?.subagents ? { ...defaults.subagents } : {};
	if (!hasSubMax) {
		nextSubagents.maxConcurrent = 8;
		mutated = true;
	}
	if (!hasSubArchive) {
		nextSubagents.archiveAfterMinutes = 60;
		mutated = true;
	}
	if (!mutated) return cfg;
	return {
		...cfg,
		agents: {
			...agents,
			defaults: {
				...nextDefaults,
				subagents: nextSubagents
			}
		}
	};
}
function applyCronDefaults(cfg) {
	const raw = cfg.cron?.maxConcurrentRuns;
	if (typeof raw === "number" && Number.isFinite(raw)) return cfg;
	return {
		...cfg,
		cron: {
			...cfg.cron,
			maxConcurrentRuns: 8
		}
	};
}
function applyLoggingDefaults(cfg) {
	const logging = cfg.logging;
	if (!logging) return cfg;
	if (logging.redactSensitive) return cfg;
	return {
		...cfg,
		logging: {
			...logging,
			redactSensitive: "tools"
		}
	};
}
function hasAnthropicDefaultSignal(cfg, env) {
	if (env.ANTHROPIC_API_KEY?.trim() || env.ANTHROPIC_OAUTH_TOKEN?.trim()) return true;
	const profiles = cfg.auth?.profiles;
	if (profiles) for (const profile of Object.values(profiles)) {
		const provider = normalizeProviderId(profile?.provider);
		if (provider === "anthropic" || provider === "claude-cli") return true;
	}
	const order = cfg.auth?.order;
	if (!order) return false;
	return Object.keys(order).some((provider) => {
		const normalizedProvider = normalizeProviderId(provider);
		if (normalizedProvider !== "anthropic" && normalizedProvider !== "claude-cli") return false;
		return order[provider] !== void 0;
	});
}
function applyContextPruningDefaults(cfg, options = {}) {
	if (!cfg.agents?.defaults) return cfg;
	if (!hasAnthropicDefaultSignal(cfg, process.env)) return cfg;
	return applyProviderConfigDefaultsForConfig({
		provider: "anthropic",
		config: cfg,
		env: process.env,
		manifestRegistry: options.manifestRegistry
	}) ?? cfg;
}
function applyCompactionDefaults(cfg) {
	const defaults = cfg.agents?.defaults;
	if (!defaults) return cfg;
	const compaction = defaults?.compaction;
	if (compaction?.mode) return cfg;
	return {
		...cfg,
		agents: {
			...cfg.agents,
			defaults: {
				...defaults,
				compaction: {
					...compaction,
					mode: "safeguard"
				}
			}
		}
	};
}
//#endregion
//#region src/config/normalize-exec-safe-bin.ts
function normalizeExecSafeBinProfilesInConfig(cfg) {
	const normalizeExec = (exec) => {
		if (!exec || typeof exec !== "object" || Array.isArray(exec)) return;
		const typedExec = exec;
		const normalizedProfiles = normalizeSafeBinProfileFixtures(typedExec.safeBinProfiles);
		typedExec.safeBinProfiles = Object.keys(normalizedProfiles).length > 0 ? normalizedProfiles : void 0;
		const normalizedTrustedDirs = normalizeTrustedSafeBinDirs(typedExec.safeBinTrustedDirs);
		typedExec.safeBinTrustedDirs = normalizedTrustedDirs.length > 0 ? normalizedTrustedDirs : void 0;
	};
	normalizeExec(cfg.tools?.exec);
	const agents = Array.isArray(cfg.agents?.list) ? cfg.agents.list : [];
	for (const agent of agents) normalizeExec(agent?.tools?.exec);
}
//#endregion
//#region src/config/normalize-paths.ts
const PATH_VALUE_RE = /^~(?=$|[\\/])/;
const PATH_KEY_RE = /(dir|path|paths|file|root|workspace)$/i;
const PATH_LIST_KEYS = new Set(["paths", "pathPrepend"]);
function normalizeStringValue(key, value) {
	if (!PATH_VALUE_RE.test(value.trim())) return value;
	if (!key) return value;
	if (PATH_KEY_RE.test(key) || PATH_LIST_KEYS.has(key)) return resolveUserPath(value);
	return value;
}
function normalizeAny(key, value) {
	if (typeof value === "string") return normalizeStringValue(key, value);
	if (Array.isArray(value)) {
		const normalizeChildren = Boolean(key && PATH_LIST_KEYS.has(key));
		return value.map((entry) => {
			if (typeof entry === "string") return normalizeChildren ? normalizeStringValue(key, entry) : entry;
			if (Array.isArray(entry)) return normalizeAny(void 0, entry);
			if (isPlainObject(entry)) return normalizeAny(void 0, entry);
			return entry;
		});
	}
	if (!isPlainObject(value)) return value;
	for (const [childKey, childValue] of Object.entries(value)) {
		const next = normalizeAny(childKey, childValue);
		if (next !== childValue) value[childKey] = next;
	}
	return value;
}
/**
* Normalize "~" paths in path-ish config fields.
*
* Goal: accept `~/...` consistently across config file + env overrides, while
* keeping the surface area small and predictable.
*/
function normalizeConfigPaths(cfg) {
	if (!cfg || typeof cfg !== "object") return cfg;
	normalizeAny(void 0, cfg);
	return cfg;
}
//#endregion
//#region src/config/materialize.ts
const MATERIALIZATION_PROFILES = {
	load: {
		includeCompactionDefaults: true,
		includeContextPruningDefaults: true,
		includeLoggingDefaults: true,
		normalizePaths: true
	},
	missing: {
		includeCompactionDefaults: true,
		includeContextPruningDefaults: true,
		includeLoggingDefaults: false,
		normalizePaths: false
	},
	snapshot: {
		includeCompactionDefaults: false,
		includeContextPruningDefaults: false,
		includeLoggingDefaults: true,
		normalizePaths: true
	}
};
function asResolvedSourceConfig(config) {
	return config;
}
function asRuntimeConfig(config) {
	return config;
}
function materializeRuntimeConfig(config, mode, options = {}) {
	const profile = MATERIALIZATION_PROFILES[mode];
	let next = applyMessageDefaults(config);
	if (profile.includeLoggingDefaults) next = applyLoggingDefaults(next);
	next = applySessionDefaults(next);
	next = applyAgentDefaults(next);
	next = applyCronDefaults(next);
	if (profile.includeContextPruningDefaults) next = applyContextPruningDefaults(next, { manifestRegistry: options.manifestRegistry });
	if (profile.includeCompactionDefaults) next = applyCompactionDefaults(next);
	next = applyModelDefaults(next, { manifestRegistry: options.manifestRegistry });
	next = applyTalkConfigNormalization(next);
	if (profile.normalizePaths) normalizeConfigPaths(next);
	normalizeExecSafeBinProfilesInConfig(next);
	return asRuntimeConfig(next);
}
//#endregion
//#region src/config/runtime-overrides.ts
let overrides = {};
function sanitizeOverrideValue(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (Array.isArray(value)) return value.map((entry) => sanitizeOverrideValue(entry, seen));
	if (!isPlainObject(value)) return value;
	if (seen.has(value)) return {};
	seen.add(value);
	const sanitized = {};
	for (const [key, entry] of Object.entries(value)) {
		if (entry === void 0 || isBlockedObjectKey(key)) continue;
		sanitized[key] = sanitizeOverrideValue(entry, seen);
	}
	seen.delete(value);
	return sanitized;
}
function mergeOverrides(base, override) {
	if (!isPlainObject(base) || !isPlainObject(override)) return override;
	const next = { ...base };
	for (const [key, value] of Object.entries(override)) {
		if (value === void 0 || isBlockedObjectKey(key)) continue;
		next[key] = mergeOverrides(base[key], value);
	}
	return next;
}
function getConfigOverrides() {
	return overrides;
}
function resetConfigOverrides() {
	overrides = {};
}
function setConfigOverride(pathRaw, value) {
	const parsed = parseConfigPath(pathRaw);
	if (!parsed.ok || !parsed.path) return {
		ok: false,
		error: parsed.error ?? "Invalid path."
	};
	setConfigValueAtPath(overrides, parsed.path, sanitizeOverrideValue(value));
	return { ok: true };
}
function unsetConfigOverride(pathRaw) {
	const parsed = parseConfigPath(pathRaw);
	if (!parsed.ok || !parsed.path) return {
		ok: false,
		removed: false,
		error: parsed.error ?? "Invalid path."
	};
	return {
		ok: true,
		removed: unsetConfigValueAtPath(overrides, parsed.path)
	};
}
function applyConfigOverrides(cfg) {
	if (!overrides || Object.keys(overrides).length === 0) return cfg;
	return mergeOverrides(cfg, overrides);
}
//#endregion
//#region src/config/shell-env-expected-keys.ts
const CORE_SHELL_ENV_EXPECTED_KEYS = ["OPENCLAW_GATEWAY_TOKEN", "OPENCLAW_GATEWAY_PASSWORD"];
function resolveShellEnvExpectedKeys(env) {
	return uniqueStrings([
		...listKnownProviderAuthEnvVarNames({ env }),
		...listKnownChannelEnvVarNames({ env }),
		...CORE_SHELL_ENV_EXPECTED_KEYS
	]);
}
//#endregion
//#region src/secrets/unsupported-surface-policy.ts
const CORE_UNSUPPORTED_SECRETREF_SURFACE_PATTERNS = [
	"commands.ownerDisplaySecret",
	"hooks.token",
	"hooks.gmail.pushToken",
	"hooks.mappings[].sessionKey",
	"auth-profiles.oauth.*"
];
const CORE_UNSUPPORTED_SECRETREF_CONFIG_CANDIDATE_PATTERNS = [
	"commands.ownerDisplaySecret",
	"hooks.token",
	"hooks.gmail.pushToken",
	"hooks.mappings[].sessionKey"
];
const bundledChannelUnsupportedSecretRefSurfacePatterns = [...new Set(GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA.flatMap((entry) => "unsupportedSecretRefSurfacePatterns" in entry ? entry.unsupportedSecretRefSurfacePatterns ?? [] : []))];
[...CORE_UNSUPPORTED_SECRETREF_SURFACE_PATTERNS, ...bundledChannelUnsupportedSecretRefSurfacePatterns];
const unsupportedSecretRefConfigCandidatePatterns = [...CORE_UNSUPPORTED_SECRETREF_CONFIG_CANDIDATE_PATTERNS, ...bundledChannelUnsupportedSecretRefSurfacePatterns];
const parsedPatternCache = /* @__PURE__ */ new Map();
function parseUnsupportedSecretRefSurfacePattern(pattern) {
	const cached = parsedPatternCache.get(pattern);
	if (cached) return cached;
	const parsed = pattern.split(".").filter((segment) => segment.length > 0).map((segment) => {
		if (segment === "*") return { kind: "wildcard" };
		if (segment.endsWith("[]")) return {
			kind: "array",
			key: segment.slice(0, -2)
		};
		return {
			kind: "key",
			key: segment
		};
	});
	parsedPatternCache.set(pattern, parsed);
	return parsed;
}
function collectPatternCandidates(params) {
	if (params.tokenIndex >= params.tokens.length) {
		params.candidates.push({
			path: params.pathSegments.join("."),
			value: params.current
		});
		return;
	}
	const token = params.tokens[params.tokenIndex];
	if (!token) return;
	if (token.kind === "wildcard") {
		if (Array.isArray(params.current)) {
			for (const [index, value] of params.current.entries()) collectPatternCandidates({
				...params,
				current: value,
				tokenIndex: params.tokenIndex + 1,
				pathSegments: [...params.pathSegments, String(index)]
			});
			return;
		}
		if (!isRecord$1(params.current)) return;
		for (const [key, value] of Object.entries(params.current)) collectPatternCandidates({
			...params,
			current: value,
			tokenIndex: params.tokenIndex + 1,
			pathSegments: [...params.pathSegments, key]
		});
		return;
	}
	if (!isRecord$1(params.current)) return;
	if (token.kind === "array") {
		if (!Object.hasOwn(params.current, token.key)) return;
		const value = params.current[token.key];
		if (!Array.isArray(value)) return;
		for (const [index, entry] of value.entries()) collectPatternCandidates({
			...params,
			current: entry,
			tokenIndex: params.tokenIndex + 1,
			pathSegments: [
				...params.pathSegments,
				token.key,
				String(index)
			]
		});
		return;
	}
	if (!Object.hasOwn(params.current, token.key)) return;
	collectPatternCandidates({
		...params,
		current: params.current[token.key],
		tokenIndex: params.tokenIndex + 1,
		pathSegments: [...params.pathSegments, token.key]
	});
}
function collectUnsupportedSecretRefConfigCandidates(raw) {
	if (!isRecord$1(raw)) return [];
	const candidates = [];
	for (const pattern of unsupportedSecretRefConfigCandidatePatterns) collectPatternCandidates({
		current: raw,
		tokens: parseUnsupportedSecretRefSurfacePattern(pattern),
		tokenIndex: 0,
		pathSegments: [],
		candidates
	});
	return candidates;
}
//#endregion
//#region src/config/channel-config-metadata.ts
const PLUGIN_ORIGIN_RANK = {
	config: 0,
	workspace: 1,
	global: 2,
	bundled: 3
};
function collectPluginSchemaMetadata(registry) {
	const deduped = /* @__PURE__ */ new Map();
	for (const record of registry.plugins) {
		const current = deduped.get(record.id);
		const nextRank = PLUGIN_ORIGIN_RANK[record.origin] ?? Number.MAX_SAFE_INTEGER;
		if (current && current.originRank <= nextRank) continue;
		deduped.set(record.id, {
			id: record.id,
			name: record.name,
			description: record.description,
			configUiHints: record.configUiHints,
			configSchema: record.configSchema,
			originRank: nextRank
		});
	}
	return [...deduped.values()].toSorted((left, right) => left.id.localeCompare(right.id)).map(({ originRank: _originRank, ...record }) => record);
}
function collectChannelSchemaMetadata(registry) {
	const byChannelId = /* @__PURE__ */ new Map();
	for (const record of registry.plugins) {
		const originRank = PLUGIN_ORIGIN_RANK[record.origin] ?? Number.MAX_SAFE_INTEGER;
		const rootLabel = record.channelCatalogMeta?.label;
		const rootDescription = record.channelCatalogMeta?.blurb;
		for (const channelId of record.channels) {
			const current = byChannelId.get(channelId);
			if (!current || originRank <= current.originRank) byChannelId.set(channelId, {
				id: channelId,
				label: rootLabel ?? current?.label,
				description: rootDescription ?? current?.description,
				configSchema: current?.configSchema,
				configUiHints: current?.configUiHints,
				originRank
			});
		}
		for (const [channelId, channelConfig] of Object.entries(record.channelConfigs ?? {})) {
			const current = byChannelId.get(channelId);
			if (current && current.originRank < originRank && (current.configSchema !== void 0 || current.configUiHints !== void 0)) continue;
			byChannelId.set(channelId, {
				id: channelId,
				label: channelConfig.label ?? rootLabel ?? current?.label,
				description: channelConfig.description ?? rootDescription ?? current?.description,
				configSchema: channelConfig.schema,
				configUiHints: channelConfig.uiHints,
				originRank
			});
		}
	}
	return [...byChannelId.values()].toSorted((left, right) => left.id.localeCompare(right.id)).map(({ originRank: _originRank, ...entry }) => entry);
}
//#endregion
//#region src/config/validation.ts
const LEGACY_REMOVED_PLUGIN_IDS = new Set(["google-antigravity-auth", "google-gemini-cli-auth"]);
const BLOCKED_PLUGIN_CANDIDATE_PREFIX = "blocked plugin candidate:";
function stripDeprecatedValidationKeys(raw) {
	if (!isRecord$1(raw) || !isRecord$1(raw.commands) || !Object.hasOwn(raw.commands, "modelsWrite")) return raw;
	const commands = { ...raw.commands };
	delete commands.modelsWrite;
	return {
		...raw,
		commands
	};
}
function materializeBundledModelProviderOverlays(config) {
	const providers = config.models?.providers;
	if (!providers) return config;
	let nextProviders;
	for (const [providerId, providerConfig] of Object.entries(providers)) {
		if (!isBuiltInModelProviderOverlayId(providerId) || providerConfig.baseUrl && Array.isArray(providerConfig.models)) continue;
		nextProviders ??= { ...providers };
		nextProviders[providerId] = {
			...providerConfig,
			baseUrl: providerConfig.baseUrl ?? "",
			models: providerConfig.models ?? []
		};
	}
	if (!nextProviders) return config;
	return {
		...config,
		models: {
			...config.models,
			providers: nextProviders
		}
	};
}
function stripPreservedLegacyRootKeysForValidation(raw, keys) {
	if (!keys || keys.length === 0 || !isRecord$1(raw)) return raw;
	const next = { ...raw };
	for (const key of keys) delete next[key];
	return next;
}
const CUSTOM_EXPECTED_ONE_OF_RE = /expected one of ((?:"[^"]+"(?:\|"?[^"]+"?)*)+)/i;
const SECRETREF_POLICY_DOC_URL = "https://docs.openclaw.ai/reference/secretref-credential-surface";
const bundledChannelSchemaById = new Map(GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA.filter((entry) => entry.configurable !== false).map((entry) => [entry.channelId, entry.schema]));
const bundledChannelIds = Object.freeze(GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA.filter((entry) => entry.configurable !== false).map((entry) => normalizeLowercaseStringOrEmpty(entry.channelId)).filter((channelId) => channelId.length > 0));
const bundledChannelIdSet = new Set(bundledChannelIds);
const bundledChannelAliases = new Map(GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA.filter((entry) => entry.configurable !== false).flatMap((entry) => {
	const channelId = normalizeLowercaseStringOrEmpty(entry.channelId);
	if (!channelId) return [];
	return (entry.aliases ?? []).map((alias) => [normalizeLowercaseStringOrEmpty(alias), channelId]).filter(([alias]) => alias.length > 0);
}));
function normalizeBundledChannelId(raw) {
	const normalized = normalizeLowercaseStringOrEmpty(raw);
	if (!normalized) return null;
	const resolved = bundledChannelAliases.get(normalized) ?? normalized;
	return bundledChannelIdSet.has(resolved) ? resolved : null;
}
function toIssueRecord(value) {
	if (!value || typeof value !== "object") return null;
	return value;
}
function toConfigPathSegments(path) {
	if (!Array.isArray(path)) return [];
	return path.filter((segment) => {
		const segmentType = typeof segment;
		return segmentType === "string" || segmentType === "number";
	});
}
function formatConfigPath(segments) {
	return segments.join(".");
}
function formatMissingOfficialExternalPluginWarning(pluginId, opts) {
	const catalogEntry = getOfficialExternalPluginCatalogEntry(pluginId);
	if (!catalogEntry) return null;
	const install = resolveOfficialExternalPluginInstall(catalogEntry);
	const npmSpec = install?.npmSpec?.trim();
	const clawhubSpec = install?.clawhubSpec?.trim();
	const installSpec = install?.defaultChoice === "clawhub" ? clawhubSpec ?? npmSpec : npmSpec ?? clawhubSpec;
	if (!installSpec) return null;
	if (pluginId === "memory-lancedb" && opts?.selectedMissingMemorySlot) return `plugin not installed: ${pluginId} — gateway will run without persistent memory until installed; install the official external plugin with: openclaw plugins install ${installSpec}`;
	return `plugin not installed: ${pluginId} — install the official external plugin with: openclaw plugins install ${installSpec}`;
}
function asJsonSchemaLike(value) {
	return value && typeof value === "object" ? value : null;
}
function lookupJsonSchemaNode(schema, pathSegments) {
	let current = asJsonSchemaLike(schema);
	for (const segment of pathSegments) {
		if (!current) return null;
		if (typeof segment === "number") {
			const items = current.items;
			if (Array.isArray(items)) {
				current = asJsonSchemaLike(items[segment] ?? items[0]);
				continue;
			}
			current = asJsonSchemaLike(items);
			continue;
		}
		const properties = asJsonSchemaLike(current.properties);
		current = properties && asJsonSchemaLike(properties[segment]) || asJsonSchemaLike(current.additionalProperties);
	}
	return current;
}
function collectAllowedValuesFromJsonSchemaNode(schema) {
	const node = asJsonSchemaLike(schema);
	if (!node) return {
		values: [],
		incomplete: false,
		hasValues: false
	};
	if (Object.prototype.hasOwnProperty.call(node, "const")) return {
		values: [node.const],
		incomplete: false,
		hasValues: true
	};
	if (Array.isArray(node.enum)) return {
		values: node.enum,
		incomplete: false,
		hasValues: node.enum.length > 0
	};
	const type = node.type;
	if (type === "boolean") return {
		values: [true, false],
		incomplete: false,
		hasValues: true
	};
	if (Array.isArray(type) && type.includes("boolean")) return {
		values: [true, false],
		incomplete: false,
		hasValues: true
	};
	const unionBranches = Array.isArray(node.anyOf) ? node.anyOf : Array.isArray(node.oneOf) ? node.oneOf : null;
	if (!unionBranches) return {
		values: [],
		incomplete: false,
		hasValues: false
	};
	const collected = [];
	for (const branch of unionBranches) {
		const branchCollected = collectAllowedValuesFromJsonSchemaNode(branch);
		if (branchCollected.incomplete || !branchCollected.hasValues) return {
			values: [],
			incomplete: true,
			hasValues: false
		};
		collected.push(...branchCollected.values);
	}
	return {
		values: collected,
		incomplete: false,
		hasValues: collected.length > 0
	};
}
function collectAllowedValuesFromBundledChannelSchemaPath(pathSegments) {
	if (pathSegments[0] !== "channels" || typeof pathSegments[1] !== "string") return {
		values: [],
		incomplete: false,
		hasValues: false
	};
	const channelSchema = bundledChannelSchemaById.get(pathSegments[1]);
	if (!channelSchema) return {
		values: [],
		incomplete: false,
		hasValues: false
	};
	const targetNode = lookupJsonSchemaNode(channelSchema, pathSegments.slice(2));
	if (!targetNode) return {
		values: [],
		incomplete: false,
		hasValues: false
	};
	return collectAllowedValuesFromJsonSchemaNode(targetNode);
}
function formatRawChannelConfigIssueMessage(message) {
	return `invalid config: ${message}`;
}
function collectRawBundledChannelConfigIssues(config) {
	if (!config.channels || !isRecord$1(config.channels)) return [];
	const issues = [];
	for (const [channelId, schema] of bundledChannelSchemaById) {
		if (!Object.prototype.hasOwnProperty.call(config.channels, channelId)) continue;
		const result = validateJsonSchemaValue({
			schema,
			cacheKey: `raw-channel:${channelId}`,
			value: config.channels[channelId],
			applyDefaults: false
		});
		if (result.ok) continue;
		for (const error of result.errors) {
			const message = error.additionalProperty ? `${error.message}: "${error.additionalProperty}"` : error.message;
			const path = error.path === "<root>" ? `channels.${channelId}` : `channels.${channelId}.${error.path}`;
			issues.push({
				path,
				message: formatRawChannelConfigIssueMessage(message),
				allowedValues: error.allowedValues,
				allowedValuesHiddenCount: error.allowedValuesHiddenCount
			});
		}
	}
	return issues;
}
function collectAllowedValuesFromCustomIssue(record) {
	const expectedMatch = (typeof record.message === "string" ? record.message : "").match(CUSTOM_EXPECTED_ONE_OF_RE);
	if (expectedMatch?.[1]) {
		const values = [...expectedMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
		return {
			values,
			incomplete: false,
			hasValues: values.length > 0
		};
	}
	return collectAllowedValuesFromBundledChannelSchemaPath(toConfigPathSegments(record.path));
}
function appendNumericBoundHint(message, record) {
	if ((typeof record.origin === "string" ? record.origin : "") !== "number") return message;
	const inclusive = record.inclusive === true;
	if (record.code === "too_big") {
		const maximum = typeof record.maximum === "number" ? record.maximum : void 0;
		if (maximum !== void 0) return inclusive ? `${message} (maximum: ${maximum})` : `${message} (must be less than ${maximum})`;
	}
	if (record.code === "too_small") {
		const minimum = typeof record.minimum === "number" ? record.minimum : void 0;
		if (minimum !== void 0) return inclusive ? `${message} (minimum: ${minimum})` : `${message} (must be greater than ${minimum})`;
	}
	return message;
}
function collectAllowedValuesFromIssue(issue) {
	const record = toIssueRecord(issue);
	if (!record) return {
		values: [],
		incomplete: false,
		hasValues: false
	};
	const code = typeof record.code === "string" ? record.code : "";
	if (code === "invalid_value") {
		const values = record.values;
		if (!Array.isArray(values)) return {
			values: [],
			incomplete: true,
			hasValues: false
		};
		return {
			values,
			incomplete: false,
			hasValues: values.length > 0
		};
	}
	if (code === "invalid_type") {
		if ((typeof record.expected === "string" ? record.expected : "") === "boolean") return {
			values: [true, false],
			incomplete: false,
			hasValues: true
		};
		return {
			values: [],
			incomplete: true,
			hasValues: false
		};
	}
	if (code === "custom") return collectAllowedValuesFromCustomIssue(record);
	if (code !== "invalid_union") return {
		values: [],
		incomplete: false,
		hasValues: false
	};
	const nested = record.errors;
	if (!Array.isArray(nested) || nested.length === 0) return {
		values: [],
		incomplete: true,
		hasValues: false
	};
	const collected = [];
	for (const branch of nested) {
		if (!Array.isArray(branch) || branch.length === 0) return {
			values: [],
			incomplete: true,
			hasValues: false
		};
		const branchCollected = collectAllowedValuesFromIssueList(branch);
		if (branchCollected.incomplete || !branchCollected.hasValues) return {
			values: [],
			incomplete: true,
			hasValues: false
		};
		collected.push(...branchCollected.values);
	}
	return {
		values: collected,
		incomplete: false,
		hasValues: collected.length > 0
	};
}
function collectAllowedValuesFromIssueList(issues) {
	const collected = [];
	let hasValues = false;
	for (const issue of issues) {
		const branch = collectAllowedValuesFromIssue(issue);
		if (branch.incomplete) return {
			values: [],
			incomplete: true,
			hasValues: false
		};
		if (!branch.hasValues) continue;
		hasValues = true;
		collected.push(...branch.values);
	}
	return {
		values: collected,
		incomplete: false,
		hasValues
	};
}
function collectAllowedValuesFromUnknownIssue(issue) {
	const collection = collectAllowedValuesFromIssue(issue);
	if (collection.incomplete || !collection.hasValues) return [];
	return collection.values;
}
function isBindingsIssuePath(pathSegments) {
	return pathSegments[0] === "bindings" && typeof pathSegments[1] === "number";
}
function isRouteTypeMismatchIssue(issue) {
	const issuePath = toConfigPathSegments(issue.path);
	if (issuePath.length !== 1 || issuePath[0] !== "type") return false;
	if (issue.code !== "invalid_value" || !Array.isArray(issue.values)) return false;
	return issue.values.includes("route");
}
function extractBindingsSpecificUnionIssue(record, parentPath) {
	if (!isBindingsIssuePath(toConfigPathSegments(record.path)) || !Array.isArray(record.errors)) return null;
	let matchingBranchIssue = null;
	let matchingBranchIsUnrecognized = false;
	let matchingBranchPathLen = -1;
	let sawRouteTypeMismatch = false;
	for (const errGroup of record.errors) {
		if (!Array.isArray(errGroup)) continue;
		const branch = errGroup.map((issue) => toIssueRecord(issue)).filter(Boolean);
		if (branch.length === 0) continue;
		if (branch.some((issue) => isRouteTypeMismatchIssue(issue))) {
			sawRouteTypeMismatch = true;
			continue;
		}
		let branchBestIssue = null;
		let branchBestIsUnrecognized = false;
		let branchBestPathLen = -1;
		for (const issue of branch) {
			const issueCode = typeof issue.code === "string" ? issue.code : "";
			const issuePathLen = toConfigPathSegments(issue.path).length;
			const issueIsUnrecognized = issueCode === "unrecognized_keys";
			if (issuePathLen > branchBestPathLen ? true : issuePathLen === branchBestPathLen && issueIsUnrecognized && !branchBestIsUnrecognized) {
				branchBestIssue = issue;
				branchBestIsUnrecognized = issueIsUnrecognized;
				branchBestPathLen = issuePathLen;
			}
		}
		if (!branchBestIssue) continue;
		if (matchingBranchIssue) return null;
		matchingBranchIssue = branchBestIssue;
		matchingBranchIsUnrecognized = branchBestIsUnrecognized;
		matchingBranchPathLen = branchBestPathLen;
	}
	if (!sawRouteTypeMismatch || !matchingBranchIssue) return null;
	if (matchingBranchPathLen === 0 && !matchingBranchIsUnrecognized) return null;
	const subPath = formatConfigPath(toConfigPathSegments(matchingBranchIssue.path));
	return {
		path: parentPath && subPath ? `${parentPath}.${subPath}` : parentPath || subPath,
		message: typeof matchingBranchIssue.message === "string" ? matchingBranchIssue.message : "Invalid input"
	};
}
function isObjectSecretRefCandidate(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	return coerceSecretRef(value) !== null;
}
function formatUnsupportedMutableSecretRefMessage(path) {
	return [
		`SecretRef objects are not supported at ${path}.`,
		"This credential is runtime-mutable or runtime-managed and must stay a plain string value.",
		"Use a plain string (env template strings like \"${MY_VAR}\" are allowed).",
		`See ${SECRETREF_POLICY_DOC_URL}.`
	].join(" ");
}
function pushUnsupportedMutableSecretRefIssue(issues, path, value) {
	if (!isObjectSecretRefCandidate(value)) return;
	issues.push({
		path,
		message: formatUnsupportedMutableSecretRefMessage(path)
	});
}
function collectUnsupportedMutableSecretRefIssues(raw) {
	const issues = [];
	for (const candidate of collectUnsupportedSecretRefConfigCandidates(raw)) pushUnsupportedMutableSecretRefIssue(issues, candidate.path, candidate.value);
	return issues;
}
function formatFilteredUnrecognizedKeyMessage(message, keys) {
	const quotedKeys = keys.map((key) => `"${key}"`).join(", ");
	if (/must not have additional properties/i.test(message)) return `must not have additional properties: ${quotedKeys}`;
	return keys.length === 1 ? `Unrecognized key: ${quotedKeys}` : `Unrecognized keys: ${quotedKeys}`;
}
function filterUnsupportedMutableSecretRefSchemaIssue(params) {
	const { issue, policyIssue } = params;
	if (issue.path === policyIssue.path) return /expected string, received object/i.test(issue.message) ? null : issue;
	if (!issue.path || !policyIssue.path || !policyIssue.path.startsWith(`${issue.path}.`)) return issue;
	const childKey = policyIssue.path.slice(issue.path.length + 1).split(".")[0];
	if (!childKey) return issue;
	if (!/Unrecognized key|must not have additional properties/i.test(issue.message)) return issue;
	const unrecognizedKeys = [...issue.message.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
	if (unrecognizedKeys.length === 0) return issue;
	if (!unrecognizedKeys.includes(childKey)) return issue;
	const remainingKeys = unrecognizedKeys.filter((key) => key !== childKey);
	if (remainingKeys.length === 0) return null;
	return {
		...issue,
		message: formatFilteredUnrecognizedKeyMessage(issue.message, remainingKeys)
	};
}
function mergeUnsupportedMutableSecretRefIssues(policyIssues, schemaIssues) {
	if (policyIssues.length === 0) return schemaIssues;
	const filteredSchemaIssues = schemaIssues.flatMap((issue) => {
		let filteredIssue = issue;
		for (const policyIssue of policyIssues) {
			if (!filteredIssue) return [];
			filteredIssue = filterUnsupportedMutableSecretRefSchemaIssue({
				issue: filteredIssue,
				policyIssue
			});
		}
		return filteredIssue ? [filteredIssue] : [];
	});
	return [...policyIssues, ...filteredSchemaIssues];
}
function collectUnsupportedSecretRefPolicyIssues(raw) {
	return collectUnsupportedMutableSecretRefIssues(raw);
}
function mapZodIssueToConfigIssue(issue) {
	const record = toIssueRecord(issue);
	const path = formatConfigPath(toConfigPathSegments(record?.path));
	const message = typeof record?.message === "string" ? record.message : "Invalid input";
	const enrichedMessage = record ? appendNumericBoundHint(message, record) : message;
	const allowedValuesSummary = summarizeAllowedValues(collectAllowedValuesFromUnknownIssue(issue));
	if (record && typeof record.code === "string" && record.code === "invalid_union" && !allowedValuesSummary) {
		const betterIssue = extractBindingsSpecificUnionIssue(record, path);
		if (betterIssue) return betterIssue;
	}
	if (!allowedValuesSummary) return {
		path,
		message: enrichedMessage
	};
	return {
		path,
		message: appendAllowedValuesHint(enrichedMessage, allowedValuesSummary),
		allowedValues: allowedValuesSummary.values,
		allowedValuesHiddenCount: allowedValuesSummary.hiddenCount
	};
}
function collectExplicitPluginReferences(raw) {
	const references = {
		entries: /* @__PURE__ */ new Set(),
		allow: /* @__PURE__ */ new Set(),
		deny: /* @__PURE__ */ new Set(),
		slots: /* @__PURE__ */ new Map()
	};
	if (!isRecord$1(raw) || !isRecord$1(raw.plugins)) return references;
	const { plugins } = raw;
	if (isRecord$1(plugins.entries)) for (const pluginId of Object.keys(plugins.entries)) {
		const normalized = normalizePluginId(pluginId);
		if (normalized) references.entries.add(normalized);
	}
	for (const [key, target] of [["allow", references.allow], ["deny", references.deny]]) {
		const value = plugins[key];
		if (!Array.isArray(value)) continue;
		for (const entry of value) {
			if (typeof entry !== "string") continue;
			const normalized = normalizePluginId(entry);
			if (normalized) target.add(normalized);
		}
	}
	if (isRecord$1(plugins.slots)) for (const [slotId, pluginId] of Object.entries(plugins.slots)) {
		if (typeof pluginId !== "string") continue;
		const normalized = normalizePluginId(pluginId);
		if (normalized && normalized !== "none") references.slots.set(normalized, slotId);
	}
	return references;
}
function resolveExplicitPluginReferencePath(references, pluginId) {
	const normalized = normalizePluginId(pluginId);
	if (!normalized) return;
	if (references.entries.has(normalized)) return `plugins.entries.${normalized}`;
	if (references.allow.has(normalized)) return "plugins.allow";
	if (references.deny.has(normalized)) return "plugins.deny";
	const slotId = references.slots.get(normalized);
	if (slotId) return `plugins.slots.${slotId}`;
}
function isWorkspaceAvatarPath(value, workspaceDir) {
	const workspaceRoot = path.resolve(workspaceDir);
	return isPathWithinRoot(workspaceRoot, path.resolve(workspaceRoot, value));
}
function validateIdentityAvatar(config) {
	const agents = config.agents?.list;
	if (!Array.isArray(agents) || agents.length === 0) return [];
	const issues = [];
	for (const [index, entry] of agents.entries()) {
		if (!entry || typeof entry !== "object") continue;
		const avatarRaw = entry.identity?.avatar;
		if (typeof avatarRaw !== "string") continue;
		const avatar = avatarRaw.trim();
		if (!avatar) continue;
		if (isAvatarDataUrl(avatar) || isAvatarHttpUrl(avatar)) continue;
		if (avatar.startsWith("~")) {
			issues.push({
				path: `agents.list.${index}.identity.avatar`,
				message: "identity.avatar must be a workspace-relative path, http(s) URL, or data URI."
			});
			continue;
		}
		if (hasAvatarUriScheme(avatar) && !isWindowsAbsolutePath(avatar)) {
			issues.push({
				path: `agents.list.${index}.identity.avatar`,
				message: "identity.avatar must be a workspace-relative path, http(s) URL, or data URI."
			});
			continue;
		}
		if (!isWorkspaceAvatarPath(avatar, resolveAgentWorkspaceDir(config, entry.id ?? resolveDefaultAgentId(config)))) issues.push({
			path: `agents.list.${index}.identity.avatar`,
			message: "identity.avatar must stay within the agent workspace."
		});
	}
	return issues;
}
function validateGatewayTailscaleBind(config) {
	const tailscaleMode = config.gateway?.tailscale?.mode ?? "off";
	if (tailscaleMode !== "serve" && tailscaleMode !== "funnel") return [];
	const bindMode = config.gateway?.bind ?? "loopback";
	if (bindMode === "loopback") return [];
	const customBindHost = config.gateway?.customBindHost;
	if (bindMode === "custom" && isCanonicalDottedDecimalIPv4(customBindHost) && isLoopbackIpAddress(customBindHost)) return [];
	return [{
		path: "gateway.bind",
		message: `gateway.bind must resolve to loopback when gateway.tailscale.mode=${tailscaleMode} (use gateway.bind="loopback" or gateway.bind="custom" with gateway.customBindHost="127.0.0.1")`
	}];
}
function validateGatewayTailscaleAuth(config) {
	const tailscaleMode = config.gateway?.tailscale?.mode ?? "off";
	if (!isUnsafeGatewayTailscaleNoAuth({
		authMode: config.gateway?.auth?.mode,
		tailscaleMode
	})) return [];
	return [{
		path: "gateway.auth.mode",
		message: formatUnsafeGatewayTailscaleNoAuthMessage(tailscaleMode)
	}];
}
/**
* Validates config without applying runtime defaults.
* Use this when you need the raw validated config (e.g., for writing back to file).
*/
function validateConfigObjectRaw(raw, opts) {
	const normalizedRaw = stripPreservedLegacyRootKeysForValidation(stripDeprecatedValidationKeys(raw), opts?.preservedLegacyRootKeys);
	const policyIssues = collectUnsupportedSecretRefPolicyIssues(normalizedRaw);
	const validated = OpenClawSchema.safeParse(normalizedRaw);
	if (!validated.success) return {
		ok: false,
		issues: mergeUnsupportedMutableSecretRefIssues(policyIssues, validated.error.issues.map((issue) => mapZodIssueToConfigIssue(issue)))
	};
	const validatedConfig = materializeBundledModelProviderOverlays(validated.data);
	const channelIssues = policyIssues.length > 0 || opts?.validateBundledChannels ? collectRawBundledChannelConfigIssues(validatedConfig) : [];
	if (channelIssues.length > 0) return {
		ok: false,
		issues: mergeUnsupportedMutableSecretRefIssues(policyIssues, channelIssues)
	};
	if (policyIssues.length > 0) return {
		ok: false,
		issues: policyIssues
	};
	const duplicates = findDuplicateAgentDirs(validatedConfig);
	if (duplicates.length > 0) return {
		ok: false,
		issues: [{
			path: "agents.list",
			message: formatDuplicateAgentDirError(duplicates)
		}]
	};
	const avatarIssues = validateIdentityAvatar(validatedConfig);
	if (avatarIssues.length > 0) return {
		ok: false,
		issues: avatarIssues
	};
	const gatewayTailscaleBindIssues = validateGatewayTailscaleBind(validatedConfig);
	if (gatewayTailscaleBindIssues.length > 0) return {
		ok: false,
		issues: gatewayTailscaleBindIssues
	};
	const gatewayTailscaleAuthIssues = validateGatewayTailscaleAuth(validatedConfig);
	if (gatewayTailscaleAuthIssues.length > 0) return {
		ok: false,
		issues: gatewayTailscaleAuthIssues
	};
	return {
		ok: true,
		config: validatedConfig
	};
}
function validateConfigObject(raw, opts) {
	const result = validateConfigObjectRaw(raw, opts);
	if (!result.ok) return result;
	return {
		ok: true,
		config: materializeRuntimeConfig(result.config, "snapshot", { manifestRegistry: opts?.manifestRegistry })
	};
}
function validateConfigObjectWithPlugins(raw, params) {
	return validateConfigObjectWithPluginsBase(raw, {
		applyDefaults: true,
		env: params?.env,
		pluginValidation: params?.pluginValidation ?? "full",
		pluginMetadataSnapshot: params?.pluginMetadataSnapshot,
		loadPluginMetadataSnapshot: params?.loadPluginMetadataSnapshot,
		sourceRaw: params?.sourceRaw,
		preservedLegacyRootKeys: params?.preservedLegacyRootKeys
	});
}
function validateConfigObjectRawWithPlugins(raw, params) {
	return validateConfigObjectWithPluginsBase(raw, {
		applyDefaults: false,
		env: params?.env,
		pluginValidation: params?.pluginValidation ?? "full",
		pluginMetadataSnapshot: params?.pluginMetadataSnapshot,
		loadPluginMetadataSnapshot: params?.loadPluginMetadataSnapshot,
		sourceRaw: params?.sourceRaw,
		preservedLegacyRootKeys: params?.preservedLegacyRootKeys
	});
}
function validateConfigObjectWithPluginsBase(raw, opts) {
	const base = validateConfigObjectRaw(raw, {
		sourceRaw: opts.sourceRaw,
		preservedLegacyRootKeys: opts.preservedLegacyRootKeys
	});
	if (!base.ok) return {
		ok: false,
		issues: base.issues,
		warnings: []
	};
	let registryInfo = opts.pluginMetadataSnapshot ? { registry: opts.pluginMetadataSnapshot.manifestRegistry } : null;
	if (opts.applyDefaults && !registryInfo && opts.pluginValidation !== "skip") {
		const pluginMetadataSnapshot = opts.loadPluginMetadataSnapshot?.(base.config);
		if (pluginMetadataSnapshot) registryInfo = { registry: pluginMetadataSnapshot.manifestRegistry };
	}
	const config = opts.applyDefaults ? materializeRuntimeConfig(base.config, "snapshot", { manifestRegistry: registryInfo?.registry }) : base.config;
	if (opts.pluginValidation === "skip") return {
		ok: true,
		config,
		warnings: []
	};
	const issues = [];
	const warnings = [];
	const hasExplicitPluginsConfig = isRecord$1(raw) && Object.prototype.hasOwnProperty.call(raw, "plugins");
	const explicitPluginReferences = collectExplicitPluginReferences(raw);
	const resolvePluginConfigIssuePath = (pluginId, errorPath) => {
		const base = `plugins.entries.${pluginId}.config`;
		if (!errorPath || errorPath === "<root>") return base;
		return `${base}.${errorPath}`;
	};
	let compatConfig;
	let compatPluginIds = null;
	let compatPluginIdsResolved = false;
	let registryDiagnosticsPushed = false;
	const pushRegistryDiagnostics = (registry) => {
		if (registryDiagnosticsPushed) return;
		registryDiagnosticsPushed = true;
		for (const diag of registry.diagnostics) {
			const explicitPath = diag.pluginId ? resolveExplicitPluginReferencePath(explicitPluginReferences, diag.pluginId) : void 0;
			let path = explicitPath ?? (diag.pluginId ? "plugins" : "plugins");
			if (!diag.pluginId && diag.message.includes("plugin path not found")) path = "plugins.load.paths";
			const message = `${diag.pluginId ? `plugin ${diag.pluginId}` : "plugin"}: ${diag.message}`;
			if (diag.level === "error" && (explicitPath || !diag.pluginId)) issues.push({
				path,
				message
			});
			else warnings.push({
				path,
				message
			});
		}
	};
	const loadValidationRegistry = () => {
		const pluginMetadataSnapshot = opts.loadPluginMetadataSnapshot?.(config);
		if (pluginMetadataSnapshot) {
			registryInfo = { registry: pluginMetadataSnapshot.manifestRegistry };
			return registryInfo;
		}
		registryInfo = { registry: resolvePluginMetadataSnapshot({
			config,
			workspaceDir: resolveAgentWorkspaceDir(config, resolveDefaultAgentId(config)) ?? void 0,
			env: opts.env ?? process.env,
			allowWorkspaceScopedCurrent: true
		}).manifestRegistry };
		return registryInfo;
	};
	const ensureCompatPluginIds = () => {
		if (compatPluginIdsResolved) return compatPluginIds ?? /* @__PURE__ */ new Set();
		compatPluginIdsResolved = true;
		const allow = config.plugins?.allow;
		if (!Array.isArray(allow) || allow.length === 0) {
			compatPluginIds = /* @__PURE__ */ new Set();
			return compatPluginIds;
		}
		const { registry } = registryInfo ?? loadValidationRegistry();
		const overriddenBundledPluginIds = new Set(registry.diagnostics.filter((diag) => diag.message.includes("duplicate plugin id detected")).map((diag) => diag.pluginId).filter((pluginId) => typeof pluginId === "string" && pluginId !== ""));
		compatPluginIds = new Set(registry.plugins.filter((plugin) => plugin.origin === "bundled" && (plugin.contracts?.webSearchProviders?.length ?? 0) > 0 && !overriddenBundledPluginIds.has(plugin.id)).map((plugin) => plugin.id));
		return compatPluginIds;
	};
	const ensureCompatConfig = () => {
		if (compatConfig !== void 0) return compatConfig ?? config;
		const allow = config.plugins?.allow;
		if (!Array.isArray(allow) || allow.length === 0) {
			compatConfig = config;
			return config;
		}
		compatConfig = withBundledPluginAllowlistCompat({
			config,
			pluginIds: [...ensureCompatPluginIds()]
		});
		return compatConfig ?? config;
	};
	const ensureRegistry = () => {
		const info = registryInfo ?? loadValidationRegistry();
		ensureCompatConfig();
		pushRegistryDiagnostics(info.registry);
		return info;
	};
	const ensureKnownIds = () => {
		const info = ensureRegistry();
		if (!info.knownIds) info.knownIds = new Set(info.registry.plugins.map((record) => record.id));
		return info.knownIds;
	};
	const ensureOverriddenPluginIds = () => {
		const info = ensureRegistry();
		if (!info.overriddenPluginIds) info.overriddenPluginIds = new Set(info.registry.diagnostics.filter((diag) => diag.message.includes("duplicate plugin id detected")).map((diag) => diag.pluginId).filter((pluginId) => typeof pluginId === "string" && pluginId !== ""));
		return info.overriddenPluginIds;
	};
	const ensureNormalizedPlugins = () => {
		const info = ensureRegistry();
		if (!info.normalizedPlugins) info.normalizedPlugins = normalizePluginsConfig(ensureCompatConfig().plugins);
		return info.normalizedPlugins;
	};
	const ensureChannelSchemas = () => {
		const info = ensureRegistry();
		if (!info.channelSchemas) {
			info.channelSchemas = new Map(GENERATED_BUNDLED_CHANNEL_CONFIG_METADATA.map((entry) => [entry.channelId, { schema: entry.schema }]));
			for (const entry of collectChannelSchemaMetadata(info.registry)) {
				const current = info.channelSchemas.get(entry.id);
				if (entry.configSchema) {
					info.channelSchemas.set(entry.id, { schema: entry.configSchema });
					continue;
				}
				if (!current) info.channelSchemas.set(entry.id, {});
			}
		}
		return info.channelSchemas;
	};
	let mutatedConfig = config;
	let channelsCloned = false;
	let pluginsCloned = false;
	let pluginEntriesCloned = false;
	let installedPluginRecordIds;
	const ensureInstalledPluginRecordIds = () => {
		if (installedPluginRecordIds) return installedPluginRecordIds;
		try {
			installedPluginRecordIds = new Set(Object.keys(loadInstalledPluginIndexInstallRecordsSync({ env: opts.env })).map(normalizePluginId));
		} catch {
			installedPluginRecordIds = /* @__PURE__ */ new Set();
		}
		return installedPluginRecordIds;
	};
	const hasStalePluginEvidenceForUnknownChannel = (channelId) => {
		const normalizedChannelId = normalizePluginId(channelId);
		if (!normalizedChannelId || ensureKnownIds().has(normalizedChannelId)) return false;
		const pluginConfig = config.plugins;
		if (Array.isArray(pluginConfig?.allow) && pluginConfig.allow.some((pluginId) => normalizePluginId(pluginId) === normalizedChannelId)) return true;
		if (isRecord$1(pluginConfig?.entries) && Object.keys(pluginConfig.entries).some((pluginId) => normalizePluginId(pluginId) === normalizedChannelId)) return true;
		if (isRecord$1(pluginConfig?.installs) && Object.keys(pluginConfig.installs).some((pluginId) => normalizePluginId(pluginId) === normalizedChannelId)) return true;
		return ensureInstalledPluginRecordIds().has(normalizedChannelId);
	};
	const collectActiveWebSearchProviderIds = () => {
		const { registry } = ensureRegistry();
		return [...new Set(registry.plugins.flatMap((record) => record.contracts?.webSearchProviders ?? []).map((providerId) => providerId.trim()).filter((providerId) => providerId.length > 0))].toSorted((left, right) => left.localeCompare(right));
	};
	const collectKnownWebSearchProviderIds = () => {
		return [...new Set([...collectActiveWebSearchProviderIds(), ...resolveWebSearchInstallCatalogEntries().map((entry) => entry.provider.id.trim()).filter((providerId) => providerId.length > 0)])].toSorted((left, right) => left.localeCompare(right));
	};
	const hasPluginEvidenceForWebSearchProvider = (...pluginOrProviderIds) => {
		const candidateIds = new Set(pluginOrProviderIds.map((id) => normalizePluginId(id)).filter((id) => id.length > 0));
		if (candidateIds.size === 0) return false;
		const matches = (pluginId) => candidateIds.has(normalizePluginId(pluginId));
		const pluginConfig = config.plugins;
		if (Array.isArray(pluginConfig?.allow) && pluginConfig.allow.some(matches)) return true;
		if (isRecord$1(pluginConfig?.entries) && Object.keys(pluginConfig.entries).some(matches)) return true;
		if (isRecord$1(pluginConfig?.installs) && Object.keys(pluginConfig.installs).some(matches)) return true;
		for (const pluginId of candidateIds) if (ensureInstalledPluginRecordIds().has(pluginId)) return true;
		return false;
	};
	const hasStalePluginEvidenceForUnknownWebSearchProvider = (providerId) => {
		const normalizedProviderId = normalizePluginId(providerId);
		if (!normalizedProviderId || ensureKnownIds().has(normalizedProviderId)) return false;
		return hasPluginEvidenceForWebSearchProvider(providerId);
	};
	const validateWebSearchProvider = () => {
		const provider = config.tools?.web?.search?.provider;
		if (typeof provider !== "string") return;
		const trimmed = provider.trim();
		const path = "tools.web.search.provider";
		if (!trimmed) {
			issues.push({
				path,
				message: "web_search provider must not be empty"
			});
			return;
		}
		if (collectActiveWebSearchProviderIds().includes(trimmed)) return;
		const installCatalogEntry = resolveWebSearchInstallCatalogEntries().find((entry) => entry.provider.id === trimmed);
		if (installCatalogEntry) {
			const issue = {
				path,
				message: `web_search provider is not available: ${trimmed} (install or enable plugin "${installCatalogEntry.pluginId}", then run openclaw doctor --fix)`,
				allowedValues: collectKnownWebSearchProviderIds()
			};
			if (hasPluginEvidenceForWebSearchProvider(trimmed, installCatalogEntry.pluginId)) {
				warnings.push({
					...issue,
					message: `web_search provider is not available: ${trimmed} (configured plugin "${installCatalogEntry.pluginId}" is unavailable; Gateway will ignore this optional provider until the plugin is installed/enabled or openclaw doctor --fix repairs the config)`
				});
				return;
			}
			issues.push(issue);
			return;
		}
		const allowedValues = collectKnownWebSearchProviderIds();
		if (allowedValues.length === 0) return;
		const issue = {
			path,
			message: `unknown web_search provider: ${trimmed}`,
			allowedValues
		};
		if (hasStalePluginEvidenceForUnknownWebSearchProvider(trimmed)) {
			warnings.push({
				...issue,
				message: `${issue.message} (stale web search plugin config ignored; run openclaw doctor --fix to remove stale config, or install the plugin)`
			});
			return;
		}
		issues.push(issue);
	};
	const parseProviderModelRef = (value) => {
		const slashIndex = value.indexOf("/");
		if (slashIndex <= 0 || slashIndex >= value.length - 1) return null;
		const provider = normalizeLowercaseStringOrEmpty(value.slice(0, slashIndex));
		const model = normalizeLowercaseStringOrEmpty(value.slice(slashIndex + 1));
		return provider && model ? {
			provider,
			model
		} : null;
	};
	const validateConfiguredModelRefs = () => {
		const configuredRefs = collectConfiguredModelRefs(config);
		if (configuredRefs.length === 0) return;
		const { registry } = ensureRegistry();
		const suppressedModels = /* @__PURE__ */ new Map();
		for (const suppression of planManifestModelCatalogSuppressions({ registry }).suppressions) {
			if (suppression.when) continue;
			const key = `${suppression.provider}/${suppression.model}`;
			if (!suppressedModels.has(key)) suppressedModels.set(key, {
				provider: suppression.provider,
				model: suppression.model,
				...suppression.reason ? { reason: suppression.reason } : {}
			});
		}
		if (suppressedModels.size === 0) return;
		const seen = /* @__PURE__ */ new Set();
		for (const ref of configuredRefs) {
			const parsed = parseProviderModelRef(ref.value);
			if (!parsed) continue;
			const suppression = suppressedModels.get(`${parsed.provider}/${parsed.model}`);
			if (!suppression) continue;
			const issueKey = `${ref.path}\0${parsed.provider}/${parsed.model}`;
			if (seen.has(issueKey)) continue;
			seen.add(issueKey);
			const modelRef = `${suppression.provider}/${suppression.model}`;
			issues.push({
				path: ref.path,
				message: suppression.reason ? `Unknown model: ${modelRef}. ${suppression.reason}` : `Unknown model: ${modelRef}.`
			});
		}
	};
	const replaceChannelConfig = (channelId, nextValue) => {
		if (!channelsCloned) {
			mutatedConfig = {
				...mutatedConfig,
				channels: { ...mutatedConfig.channels }
			};
			channelsCloned = true;
		}
		mutatedConfig.channels[channelId] = nextValue;
	};
	const replacePluginEntryConfig = (pluginId, nextValue) => {
		if (!pluginsCloned) {
			mutatedConfig = {
				...mutatedConfig,
				plugins: { ...mutatedConfig.plugins }
			};
			pluginsCloned = true;
		}
		if (!pluginEntriesCloned) {
			mutatedConfig.plugins = {
				...mutatedConfig.plugins,
				entries: { ...mutatedConfig.plugins?.entries }
			};
			pluginEntriesCloned = true;
		}
		const currentEntry = mutatedConfig.plugins?.entries?.[pluginId];
		mutatedConfig.plugins.entries[pluginId] = {
			...currentEntry,
			config: nextValue
		};
	};
	const allowedChannels = new Set([
		"defaults",
		"modelByChannel",
		...bundledChannelIds
	]);
	if (config.channels && isRecord$1(config.channels)) for (const key of Object.keys(config.channels)) {
		const trimmed = key.trim();
		if (!trimmed) continue;
		if (!allowedChannels.has(trimmed)) {
			const { registry } = ensureRegistry();
			for (const record of registry.plugins) for (const channelId of record.channels) allowedChannels.add(channelId);
		}
		if (!allowedChannels.has(trimmed)) {
			const issue = {
				path: `channels.${trimmed}`,
				message: `unknown channel id: ${trimmed}`
			};
			if (hasStalePluginEvidenceForUnknownChannel(trimmed)) warnings.push({
				...issue,
				message: `${issue.message} (stale channel plugin config ignored; run openclaw doctor --fix to remove stale config, or install the plugin)`
			});
			else issues.push(issue);
			continue;
		}
		const channelSchema = ensureChannelSchemas().get(trimmed)?.schema;
		if (!channelSchema) continue;
		const result = validateJsonSchemaValue({
			schema: channelSchema,
			cacheKey: `channel:${trimmed}`,
			value: config.channels[trimmed],
			applyDefaults: true
		});
		if (!result.ok) {
			for (const error of result.errors) {
				const path = error.path === "<root>" ? `channels.${trimmed}` : `channels.${trimmed}.${error.path}`;
				issues.push({
					path,
					message: formatRawChannelConfigIssueMessage(error.message),
					allowedValues: error.allowedValues,
					allowedValuesHiddenCount: error.allowedValuesHiddenCount
				});
			}
			continue;
		}
		replaceChannelConfig(trimmed, result.value);
	}
	const heartbeatChannelIds = /* @__PURE__ */ new Set();
	for (const channelId of bundledChannelIds) heartbeatChannelIds.add(normalizeLowercaseStringOrEmpty(channelId));
	const validateHeartbeatTarget = (target, path) => {
		if (typeof target !== "string") return;
		const trimmed = target.trim();
		if (!trimmed) {
			issues.push({
				path,
				message: "heartbeat target must not be empty"
			});
			return;
		}
		const normalized = normalizeLowercaseStringOrEmpty(trimmed);
		if (normalized === "last" || normalized === "none") return;
		if (normalizeBundledChannelId(trimmed)) return;
		if (!heartbeatChannelIds.has(normalized)) {
			const { registry } = ensureRegistry();
			for (const record of registry.plugins) for (const channelId of record.channels) {
				const pluginChannel = channelId.trim();
				if (pluginChannel) heartbeatChannelIds.add(normalizeLowercaseStringOrEmpty(pluginChannel));
			}
		}
		if (heartbeatChannelIds.has(normalized)) return;
		issues.push({
			path,
			message: `unknown heartbeat target: ${target}`
		});
	};
	validateHeartbeatTarget(config.agents?.defaults?.heartbeat?.target, "agents.defaults.heartbeat.target");
	if (Array.isArray(config.agents?.list)) for (const [index, entry] of config.agents.list.entries()) validateHeartbeatTarget(entry?.heartbeat?.target, `agents.list.${index}.heartbeat.target`);
	validateWebSearchProvider();
	validateConfiguredModelRefs();
	if (!hasExplicitPluginsConfig) {
		if (issues.length > 0) return {
			ok: false,
			issues,
			warnings
		};
		return {
			ok: true,
			config: mutatedConfig,
			warnings
		};
	}
	const { registry } = ensureRegistry();
	const knownIds = ensureKnownIds();
	const normalizedPlugins = ensureNormalizedPlugins();
	const effectiveConfig = ensureCompatConfig();
	const blockedPluginDiagnostics = /* @__PURE__ */ new Map();
	const blockedPluginDiagnosticsWithSource = [];
	const normalizeBlockedDiagnosticPath = (value) => {
		const trimmed = value?.trim();
		if (!trimmed) return "";
		try {
			return path.resolve(resolveUserPath(trimmed, opts.env ?? process.env));
		} catch {
			return path.resolve(trimmed);
		}
	};
	for (const diag of registry.diagnostics) {
		if (!diag.message.startsWith(BLOCKED_PLUGIN_CANDIDATE_PREFIX)) continue;
		if (!diag.pluginId && diag.source) blockedPluginDiagnosticsWithSource.push({
			message: diag.message,
			source: diag.source
		});
		if (diag.pluginId) {
			const normalizedPluginId = normalizePluginId(diag.pluginId);
			for (const key of [diag.pluginId, normalizedPluginId]) {
				if (!key || blockedPluginDiagnostics.has(key)) continue;
				blockedPluginDiagnostics.set(key, {
					message: diag.message,
					...diag.source ? { source: diag.source } : {}
				});
			}
		}
	}
	const blockedDiagnosticSourceMatchesPluginId = (diagnostic, pluginId) => {
		const normalizedPluginId = normalizePluginId(pluginId);
		if (!normalizedPluginId) return false;
		const sourcePath = normalizeBlockedDiagnosticPath(diagnostic.source);
		if (!sourcePath) return false;
		if (normalizePluginId(path.basename(sourcePath)) === normalizedPluginId || normalizePluginId(path.basename(path.dirname(sourcePath))) === normalizedPluginId) return true;
		const loadPaths = config.plugins?.load?.paths;
		if (!Array.isArray(loadPaths)) return false;
		for (const loadPath of loadPaths) {
			if (typeof loadPath !== "string") continue;
			const resolvedLoadPath = normalizeBlockedDiagnosticPath(loadPath);
			if (!resolvedLoadPath) continue;
			if (normalizePluginId(path.basename(resolvedLoadPath)) !== normalizedPluginId) continue;
			if (sourcePath === resolvedLoadPath || isPathInside(resolvedLoadPath, sourcePath) || isPathInside(sourcePath, resolvedLoadPath)) return true;
		}
		return false;
	};
	const findBlockedPluginDiagnostic = (pluginId) => {
		const direct = blockedPluginDiagnostics.get(pluginId) ?? blockedPluginDiagnostics.get(normalizePluginId(pluginId));
		if (direct) return direct;
		return blockedPluginDiagnosticsWithSource.find((diagnostic) => blockedDiagnosticSourceMatchesPluginId(diagnostic, pluginId));
	};
	const missingOfficialPluginWarningIds = /* @__PURE__ */ new Set();
	const pushMissingPluginIssue = (path, pluginId, opts) => {
		if (LEGACY_REMOVED_PLUGIN_IDS.has(pluginId)) {
			warnings.push({
				path,
				message: `plugin removed: ${pluginId} (stale config entry ignored; remove it from plugins config)`
			});
			return;
		}
		const blockedDiagnostic = findBlockedPluginDiagnostic(pluginId);
		if (blockedDiagnostic) {
			const message = `plugin present but blocked: ${pluginId} (see preceding plugin warning${blockedDiagnostic.source ? `; source: ${blockedDiagnostic.source}` : ""}; fix the blocked plugin path instead of removing config)`;
			if (opts?.warnOnly) warnings.push({
				path,
				message
			});
			else issues.push({
				path,
				message
			});
			return;
		}
		if (opts?.warnOnly && opts.officialInstallHint !== false) {
			const externalInstallWarning = opts.missingMessage ?? formatMissingOfficialExternalPluginWarning(pluginId);
			if (externalInstallWarning) {
				const normalizedPluginId = normalizePluginId(pluginId);
				if (!opts.missingMessage && normalizedPluginId) {
					if (missingOfficialPluginWarningIds.has(normalizedPluginId)) return;
					missingOfficialPluginWarningIds.add(normalizedPluginId);
				}
				warnings.push({
					path,
					message: externalInstallWarning
				});
				return;
			}
		}
		if (opts?.warnOnly) {
			warnings.push({
				path,
				message: `plugin not found: ${pluginId} (stale config entry ignored; remove it from plugins config)`
			});
			return;
		}
		issues.push({
			path,
			message: `plugin not found: ${pluginId}`
		});
	};
	const pluginsConfig = config.plugins;
	const entries = pluginsConfig?.entries;
	if (entries && isRecord$1(entries)) {
		for (const pluginId of Object.keys(entries)) if (!knownIds.has(pluginId)) pushMissingPluginIssue(`plugins.entries.${pluginId}`, pluginId, { warnOnly: true });
	}
	const allow = pluginsConfig?.allow ?? [];
	for (const pluginId of allow) {
		if (typeof pluginId !== "string" || !pluginId.trim()) continue;
		if (!knownIds.has(pluginId)) {
			const commandAlias = resolveManifestCommandAliasOwnerInRegistry({
				command: pluginId,
				registry
			});
			if (commandAlias?.pluginId && knownIds.has(commandAlias.pluginId)) warnings.push({
				path: "plugins.allow",
				message: `"${pluginId}" is not a plugin — it is a command provided by the "${commandAlias.pluginId}" plugin. Use "${commandAlias.pluginId}" in plugins.allow instead.`
			});
			else pushMissingPluginIssue("plugins.allow", pluginId, { warnOnly: true });
		}
	}
	const deny = pluginsConfig?.deny ?? [];
	for (const pluginId of deny) {
		if (typeof pluginId !== "string" || !pluginId.trim()) continue;
		if (!knownIds.has(pluginId)) pushMissingPluginIssue("plugins.deny", pluginId, {
			warnOnly: true,
			officialInstallHint: false
		});
	}
	const pluginSlots = pluginsConfig?.slots;
	const hasExplicitMemorySlot = pluginSlots !== void 0 && Object.prototype.hasOwnProperty.call(pluginSlots, "memory");
	const memorySlot = normalizedPlugins.slots.memory;
	if (hasExplicitMemorySlot && typeof memorySlot === "string" && memorySlot.trim() && !knownIds.has(memorySlot)) pushMissingPluginIssue("plugins.slots.memory", memorySlot, {
		warnOnly: memorySlot === "memory-lancedb" && Boolean(formatMissingOfficialExternalPluginWarning(memorySlot, { selectedMissingMemorySlot: true })) && !findBlockedPluginDiagnostic(memorySlot),
		missingMessage: formatMissingOfficialExternalPluginWarning(memorySlot, { selectedMissingMemorySlot: true })
	});
	let selectedMemoryPluginId = null;
	const seenPlugins = /* @__PURE__ */ new Set();
	for (const record of registry.plugins) {
		const pluginId = record.id;
		if (seenPlugins.has(pluginId)) continue;
		seenPlugins.add(pluginId);
		const entry = normalizedPlugins.entries[pluginId];
		const entryHasConfig = Boolean(entry?.config);
		const activationState = resolveEffectivePluginActivationState({
			id: pluginId,
			origin: record.origin,
			config: normalizedPlugins,
			rootConfig: effectiveConfig
		});
		let enabled = activationState.activated;
		let reason = activationState.reason;
		if (enabled) {
			const memoryDecision = resolveMemorySlotDecision({
				id: pluginId,
				kind: record.kind,
				slot: memorySlot,
				selectedId: selectedMemoryPluginId
			});
			if (!memoryDecision.enabled) {
				enabled = false;
				reason = memoryDecision.reason;
			}
			if (memoryDecision.selected && hasKind(record.kind, "memory")) selectedMemoryPluginId = pluginId;
		}
		const shouldReplacePluginConfig = entryHasConfig || opts.applyDefaults && enabled;
		if (enabled || entryHasConfig) if (record.configSchema) {
			const res = validateJsonSchemaValue({
				schema: record.configSchema,
				cacheKey: record.schemaCacheKey ?? record.manifestPath ?? pluginId,
				value: entry?.config ?? {},
				applyDefaults: true
			});
			if (!res.ok) for (const error of res.errors) issues.push({
				path: resolvePluginConfigIssuePath(pluginId, error.path),
				message: `invalid config: ${error.message}`,
				allowedValues: error.allowedValues,
				allowedValuesHiddenCount: error.allowedValuesHiddenCount
			});
			else if (shouldReplacePluginConfig) replacePluginEntryConfig(pluginId, res.value);
		} else if (record.format === "bundle") {} else issues.push({
			path: `plugins.entries.${pluginId}`,
			message: `plugin schema missing for ${pluginId}`
		});
		const suppressDisabledConfigWarning = ensureCompatPluginIds().has(pluginId) && !ensureOverriddenPluginIds().has(pluginId);
		if (!enabled && entryHasConfig && !suppressDisabledConfigWarning) warnings.push({
			path: `plugins.entries.${pluginId}`,
			message: `plugin disabled (${reason ?? "disabled"}) but config is present`
		});
	}
	if (issues.length > 0) return {
		ok: false,
		issues,
		warnings
	};
	return {
		ok: true,
		config: mutatedConfig,
		warnings
	};
}
//#endregion
//#region src/config/io.ts
const CONFIG_HEALTH_STATE_FILENAME = "config-health.json";
const loggedInvalidConfigs = /* @__PURE__ */ new Set();
const warnedFutureTouchedVersions = /* @__PURE__ */ new Set();
const configWritePostCommitRollback = Symbol("configWritePostCommitRollback");
var ConfigRuntimeRefreshError = class extends Error {
	constructor(message, options) {
		super(message, options);
		this.name = "ConfigRuntimeRefreshError";
	}
};
function hashConfigRaw(raw) {
	return crypto.createHash("sha256").update(raw ?? "").digest("hex");
}
async function tightenStateDirPermissionsIfNeeded(params) {
	if (process.platform === "win32") return;
	const stateDir = resolveStateDir(params.env, params.homedir);
	const configDir = path.dirname(params.configPath);
	if (path.resolve(configDir) !== path.resolve(stateDir)) return;
	try {
		if (((await params.fsModule.promises.stat(configDir)).mode & 63) === 0) return;
		await params.fsModule.promises.chmod(configDir, 448);
	} catch {}
}
function resolveConfigSnapshotHash(snapshot) {
	if (typeof snapshot.hash === "string") {
		const trimmed = snapshot.hash.trim();
		if (trimmed) return trimmed;
	}
	if (typeof snapshot.raw !== "string") return null;
	return hashConfigRaw(snapshot.raw);
}
async function rollbackConfigFileWriteIfUnchanged(params) {
	let currentRaw = null;
	try {
		currentRaw = await fs.promises.readFile(params.configPath, "utf-8");
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
	if (hashConfigRaw(currentRaw) !== params.committedHash) return false;
	if (params.previousSnapshot.exists && typeof params.previousSnapshot.raw === "string") {
		await replaceFileAtomic({
			filePath: params.configPath,
			content: params.previousSnapshot.raw,
			dirMode: 448,
			mode: 384,
			tempPrefix: path.basename(params.configPath),
			copyFallbackOnPermissionError: true
		});
		return true;
	}
	if (params.previousSnapshot.exists) return false;
	try {
		await fs.promises.unlink(params.configPath);
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
	return true;
}
function coerceConfig(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	return value;
}
function hasConfigMeta(value) {
	if (!isRecord$1(value)) return false;
	const meta = value.meta;
	return isRecord$1(meta);
}
function resolveGatewayMode(value) {
	if (!isRecord$1(value)) return null;
	const gateway = value.gateway;
	if (!isRecord$1(gateway) || typeof gateway.mode !== "string") return null;
	const trimmed = gateway.mode.trim();
	return trimmed.length > 0 ? trimmed : null;
}
function collectEnvRefPaths(value, path, output) {
	if (typeof value === "string") {
		if (containsEnvVarReference(value)) output.set(path, value);
		return;
	}
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			collectEnvRefPaths(item, `${path}[${index}]`, output);
		});
		return;
	}
	if (isRecord$1(value)) for (const [key, child] of Object.entries(value)) collectEnvRefPaths(child, path ? `${path}.${key}` : key, output);
}
function resolveConfigHealthStatePath(env, homedir) {
	return path.join(resolveStateDir(env, homedir), "logs", CONFIG_HEALTH_STATE_FILENAME);
}
function normalizeStatNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function normalizeStatId(value) {
	if (typeof value === "bigint") return value.toString();
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	return null;
}
function resolveConfigStatMetadata(stat) {
	return {
		dev: normalizeStatId(stat?.dev ?? null),
		ino: normalizeStatId(stat?.ino ?? null),
		mode: normalizeStatNumber(stat ? stat.mode & 511 : null),
		nlink: normalizeStatNumber(stat?.nlink ?? null),
		uid: normalizeStatNumber(stat?.uid ?? null),
		gid: normalizeStatNumber(stat?.gid ?? null)
	};
}
function resolveConfigWriteSuspiciousReasons(params) {
	const reasons = [];
	if (!params.existsBefore) return reasons;
	if (typeof params.previousBytes === "number" && typeof params.nextBytes === "number" && params.previousBytes >= 512 && params.nextBytes < Math.floor(params.previousBytes * .5)) reasons.push(`size-drop:${params.previousBytes}->${params.nextBytes}`);
	if (!params.hasMetaBefore) reasons.push("missing-meta-before-write");
	if (params.gatewayModeBefore && !params.gatewayModeAfter) reasons.push("gateway-mode-removed");
	return reasons;
}
function resolveConfigWriteBlockingReasons(suspicious, options = {}) {
	return suspicious.filter((reason) => reason.startsWith("size-drop:") && options.allowConfigSizeDrop !== true || reason === "gateway-mode-removed");
}
async function readConfigHealthState(deps) {
	try {
		const healthPath = resolveConfigHealthStatePath(deps.env, deps.homedir);
		const raw = await deps.fs.promises.readFile(healthPath, "utf-8");
		const parsed = JSON.parse(raw);
		return isRecord$1(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
function readConfigHealthStateSync(deps) {
	try {
		const healthPath = resolveConfigHealthStatePath(deps.env, deps.homedir);
		const raw = deps.fs.readFileSync(healthPath, "utf-8");
		const parsed = JSON.parse(raw);
		return isRecord$1(parsed) ? parsed : {};
	} catch {
		return {};
	}
}
async function writeConfigHealthState(deps, state) {
	const healthPath = resolveConfigHealthStatePath(deps.env, deps.homedir);
	try {
		await deps.fs.promises.mkdir(path.dirname(healthPath), {
			recursive: true,
			mode: 448
		});
		await deps.fs.promises.writeFile(healthPath, `${JSON.stringify(state, null, 2)}\n`, {
			encoding: "utf-8",
			mode: 384
		});
	} catch (err) {
		deps.logger.warn(`Config health-state write failed: ${healthPath}: ${formatErrorMessage(err)}`);
	}
}
function writeConfigHealthStateSync(deps, state) {
	const healthPath = resolveConfigHealthStatePath(deps.env, deps.homedir);
	try {
		deps.fs.mkdirSync(path.dirname(healthPath), {
			recursive: true,
			mode: 448
		});
		deps.fs.writeFileSync(healthPath, `${JSON.stringify(state, null, 2)}\n`, {
			encoding: "utf-8",
			mode: 384
		});
	} catch (err) {
		deps.logger.warn(`Config health-state write failed: ${healthPath}: ${formatErrorMessage(err)}`);
	}
}
function getConfigHealthEntry(state, configPath) {
	const entries = state.entries;
	if (!entries || !isRecord$1(entries)) return {};
	const entry = entries[configPath];
	return entry && isRecord$1(entry) ? entry : {};
}
function setConfigHealthEntry(state, configPath, entry) {
	return {
		...state,
		entries: {
			...state.entries,
			[configPath]: entry
		}
	};
}
function isUpdateChannelOnlyRoot(value) {
	if (!isRecord$1(value)) return false;
	const keys = Object.keys(value);
	if (keys.length !== 1 || keys[0] !== "update") return false;
	const update = value.update;
	if (!isRecord$1(update)) return false;
	return Object.keys(update).length === 1 && typeof update.channel === "string";
}
function resolveConfigObserveSuspiciousReasons(params) {
	const reasons = [];
	const baseline = params.lastKnownGood;
	if (!baseline) return reasons;
	if (baseline.bytes >= 512 && params.bytes < Math.floor(baseline.bytes * .5)) reasons.push(`size-drop-vs-last-good:${baseline.bytes}->${params.bytes}`);
	if (baseline.hasMeta && !params.hasMeta) reasons.push("missing-meta-vs-last-good");
	if (baseline.gatewayMode && !params.gatewayMode) reasons.push("gateway-mode-missing-vs-last-good");
	if (baseline.gatewayMode && isUpdateChannelOnlyRoot(params.parsed)) reasons.push("update-channel-only-root");
	return reasons;
}
async function readConfigFingerprintForPath(deps, targetPath) {
	try {
		const raw = await deps.fs.promises.readFile(targetPath, "utf-8");
		const stat = await deps.fs.promises.stat(targetPath).catch(() => null);
		const parsedRes = parseConfigJson5(raw, deps.json5);
		const parsed = parsedRes.ok ? parsedRes.parsed : {};
		return {
			hash: hashConfigRaw(raw),
			bytes: Buffer.byteLength(raw, "utf-8"),
			mtimeMs: stat?.mtimeMs ?? null,
			ctimeMs: stat?.ctimeMs ?? null,
			...resolveConfigStatMetadata(stat),
			hasMeta: hasConfigMeta(parsed),
			gatewayMode: resolveGatewayMode(parsed),
			observedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	} catch {
		return null;
	}
}
function readConfigFingerprintForPathSync(deps, targetPath) {
	try {
		const raw = deps.fs.readFileSync(targetPath, "utf-8");
		const stat = deps.fs.statSync(targetPath, { throwIfNoEntry: false }) ?? null;
		const parsedRes = parseConfigJson5(raw, deps.json5);
		const parsed = parsedRes.ok ? parsedRes.parsed : {};
		return {
			hash: hashConfigRaw(raw),
			bytes: Buffer.byteLength(raw, "utf-8"),
			mtimeMs: stat?.mtimeMs ?? null,
			ctimeMs: stat?.ctimeMs ?? null,
			...resolveConfigStatMetadata(stat),
			hasMeta: hasConfigMeta(parsed),
			gatewayMode: resolveGatewayMode(parsed),
			observedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	} catch {
		return null;
	}
}
function formatConfigArtifactTimestamp(ts) {
	return ts.replaceAll(":", "-").replaceAll(".", "-");
}
function sameFingerprint(left, right) {
	if (!left) return false;
	return left.hash === right.hash && left.bytes === right.bytes && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs && left.dev === right.dev && left.ino === right.ino && left.mode === right.mode && left.nlink === right.nlink && left.uid === right.uid && left.gid === right.gid && left.hasMeta === right.hasMeta && left.gatewayMode === right.gatewayMode;
}
async function observeConfigSnapshot(deps, snapshot) {
	if (!snapshot.exists || typeof snapshot.raw !== "string") return;
	const stat = await deps.fs.promises.stat(snapshot.path).catch(() => null);
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const current = {
		hash: resolveConfigSnapshotHash(snapshot) ?? hashConfigRaw(snapshot.raw),
		bytes: Buffer.byteLength(snapshot.raw, "utf-8"),
		mtimeMs: stat?.mtimeMs ?? null,
		ctimeMs: stat?.ctimeMs ?? null,
		...resolveConfigStatMetadata(stat),
		hasMeta: hasConfigMeta(snapshot.parsed),
		gatewayMode: resolveGatewayMode(snapshot.resolved),
		observedAt: now
	};
	let healthState = await readConfigHealthState(deps);
	const entry = getConfigHealthEntry(healthState, snapshot.path);
	const backupBaseline = entry.lastKnownGood ?? await readConfigFingerprintForPath(deps, `${snapshot.path}.bak`) ?? void 0;
	const suspicious = resolveConfigObserveSuspiciousReasons({
		bytes: current.bytes,
		hasMeta: current.hasMeta,
		gatewayMode: current.gatewayMode,
		parsed: snapshot.parsed,
		lastKnownGood: backupBaseline
	});
	if (suspicious.length === 0) {
		if (snapshot.valid) {
			const nextEntry = {
				...entry,
				lastKnownGood: current,
				lastObservedSuspiciousSignature: null
			};
			if (!sameFingerprint(entry.lastKnownGood, current) || entry.lastObservedSuspiciousSignature !== null) {
				healthState = setConfigHealthEntry(healthState, snapshot.path, nextEntry);
				await writeConfigHealthState(deps, healthState);
			}
		}
		return;
	}
	const suspiciousSignature = `${current.hash}:${suspicious.join(",")}`;
	if (entry.lastObservedSuspiciousSignature === suspiciousSignature) return;
	const backup = (backupBaseline?.hash ? backupBaseline : null) ?? await readConfigFingerprintForPath(deps, `${snapshot.path}.bak`);
	deps.logger.warn(`Config observe anomaly: ${snapshot.path} (${suspicious.join(", ")})`);
	await appendConfigAuditRecord({
		fs: deps.fs,
		env: deps.env,
		homedir: deps.homedir,
		record: {
			ts: now,
			source: "config-io",
			event: "config.observe",
			phase: "read",
			configPath: snapshot.path,
			...snapshotConfigAuditProcessInfo(),
			exists: true,
			valid: snapshot.valid,
			hash: current.hash,
			bytes: current.bytes,
			mtimeMs: current.mtimeMs,
			ctimeMs: current.ctimeMs,
			dev: current.dev,
			ino: current.ino,
			mode: current.mode,
			nlink: current.nlink,
			uid: current.uid,
			gid: current.gid,
			hasMeta: current.hasMeta,
			gatewayMode: current.gatewayMode,
			suspicious,
			lastKnownGoodHash: entry.lastKnownGood?.hash ?? null,
			lastKnownGoodBytes: entry.lastKnownGood?.bytes ?? null,
			lastKnownGoodMtimeMs: entry.lastKnownGood?.mtimeMs ?? null,
			lastKnownGoodCtimeMs: entry.lastKnownGood?.ctimeMs ?? null,
			lastKnownGoodDev: entry.lastKnownGood?.dev ?? null,
			lastKnownGoodIno: entry.lastKnownGood?.ino ?? null,
			lastKnownGoodMode: entry.lastKnownGood?.mode ?? null,
			lastKnownGoodNlink: entry.lastKnownGood?.nlink ?? null,
			lastKnownGoodUid: entry.lastKnownGood?.uid ?? null,
			lastKnownGoodGid: entry.lastKnownGood?.gid ?? null,
			lastKnownGoodGatewayMode: entry.lastKnownGood?.gatewayMode ?? null,
			backupHash: backup?.hash ?? null,
			backupBytes: backup?.bytes ?? null,
			backupMtimeMs: backup?.mtimeMs ?? null,
			backupCtimeMs: backup?.ctimeMs ?? null,
			backupDev: backup?.dev ?? null,
			backupIno: backup?.ino ?? null,
			backupMode: backup?.mode ?? null,
			backupNlink: backup?.nlink ?? null,
			backupUid: backup?.uid ?? null,
			backupGid: backup?.gid ?? null,
			backupGatewayMode: backup?.gatewayMode ?? null,
			clobberedPath: null,
			restoredFromBackup: false,
			restoredBackupPath: null,
			restoreErrorCode: null,
			restoreErrorMessage: null
		}
	});
	healthState = setConfigHealthEntry(healthState, snapshot.path, {
		...entry,
		lastObservedSuspiciousSignature: suspiciousSignature
	});
	await writeConfigHealthState(deps, healthState);
}
function observeConfigSnapshotSync(deps, snapshot) {
	if (!snapshot.exists || typeof snapshot.raw !== "string") return;
	const stat = deps.fs.statSync(snapshot.path, { throwIfNoEntry: false }) ?? null;
	const now = (/* @__PURE__ */ new Date()).toISOString();
	const current = {
		hash: resolveConfigSnapshotHash(snapshot) ?? hashConfigRaw(snapshot.raw),
		bytes: Buffer.byteLength(snapshot.raw, "utf-8"),
		mtimeMs: stat?.mtimeMs ?? null,
		ctimeMs: stat?.ctimeMs ?? null,
		...resolveConfigStatMetadata(stat),
		hasMeta: hasConfigMeta(snapshot.parsed),
		gatewayMode: resolveGatewayMode(snapshot.resolved),
		observedAt: now
	};
	let healthState = readConfigHealthStateSync(deps);
	const entry = getConfigHealthEntry(healthState, snapshot.path);
	const backupBaseline = entry.lastKnownGood ?? readConfigFingerprintForPathSync(deps, `${snapshot.path}.bak`) ?? void 0;
	const suspicious = resolveConfigObserveSuspiciousReasons({
		bytes: current.bytes,
		hasMeta: current.hasMeta,
		gatewayMode: current.gatewayMode,
		parsed: snapshot.parsed,
		lastKnownGood: backupBaseline
	});
	if (suspicious.length === 0) {
		if (snapshot.valid) {
			const nextEntry = {
				...entry,
				lastKnownGood: current,
				lastObservedSuspiciousSignature: null
			};
			if (!sameFingerprint(entry.lastKnownGood, current) || entry.lastObservedSuspiciousSignature !== null) {
				healthState = setConfigHealthEntry(healthState, snapshot.path, nextEntry);
				writeConfigHealthStateSync(deps, healthState);
			}
		}
		return;
	}
	const suspiciousSignature = `${current.hash}:${suspicious.join(",")}`;
	if (entry.lastObservedSuspiciousSignature === suspiciousSignature) return;
	const backup = (backupBaseline?.hash ? backupBaseline : null) ?? readConfigFingerprintForPathSync(deps, `${snapshot.path}.bak`);
	deps.logger.warn(`Config observe anomaly: ${snapshot.path} (${suspicious.join(", ")})`);
	appendConfigAuditRecordSync({
		fs: deps.fs,
		env: deps.env,
		homedir: deps.homedir,
		record: {
			ts: now,
			source: "config-io",
			event: "config.observe",
			phase: "read",
			configPath: snapshot.path,
			...snapshotConfigAuditProcessInfo(),
			exists: true,
			valid: snapshot.valid,
			hash: current.hash,
			bytes: current.bytes,
			mtimeMs: current.mtimeMs,
			ctimeMs: current.ctimeMs,
			dev: current.dev,
			ino: current.ino,
			mode: current.mode,
			nlink: current.nlink,
			uid: current.uid,
			gid: current.gid,
			hasMeta: current.hasMeta,
			gatewayMode: current.gatewayMode,
			suspicious,
			lastKnownGoodHash: entry.lastKnownGood?.hash ?? null,
			lastKnownGoodBytes: entry.lastKnownGood?.bytes ?? null,
			lastKnownGoodMtimeMs: entry.lastKnownGood?.mtimeMs ?? null,
			lastKnownGoodCtimeMs: entry.lastKnownGood?.ctimeMs ?? null,
			lastKnownGoodDev: entry.lastKnownGood?.dev ?? null,
			lastKnownGoodIno: entry.lastKnownGood?.ino ?? null,
			lastKnownGoodMode: entry.lastKnownGood?.mode ?? null,
			lastKnownGoodNlink: entry.lastKnownGood?.nlink ?? null,
			lastKnownGoodUid: entry.lastKnownGood?.uid ?? null,
			lastKnownGoodGid: entry.lastKnownGood?.gid ?? null,
			lastKnownGoodGatewayMode: entry.lastKnownGood?.gatewayMode ?? null,
			backupHash: backup?.hash ?? null,
			backupBytes: backup?.bytes ?? null,
			backupMtimeMs: backup?.mtimeMs ?? null,
			backupCtimeMs: backup?.ctimeMs ?? null,
			backupDev: backup?.dev ?? null,
			backupIno: backup?.ino ?? null,
			backupMode: backup?.mode ?? null,
			backupNlink: backup?.nlink ?? null,
			backupUid: backup?.uid ?? null,
			backupGid: backup?.gid ?? null,
			backupGatewayMode: backup?.gatewayMode ?? null,
			clobberedPath: null,
			restoredFromBackup: false,
			restoredBackupPath: null,
			restoreErrorCode: null,
			restoreErrorMessage: null
		}
	});
	healthState = setConfigHealthEntry(healthState, snapshot.path, {
		...entry,
		lastObservedSuspiciousSignature: suspiciousSignature
	});
	writeConfigHealthStateSync(deps, healthState);
}
function warnOnConfigMiskeys(raw, logger) {
	if (!raw || typeof raw !== "object") return;
	const gateway = raw.gateway;
	if (!gateway || typeof gateway !== "object") return;
	if ("token" in gateway) logger.warn("Config uses \"gateway.token\". This key is ignored; use \"gateway.auth.token\" instead.");
}
function stampConfigVersion(cfg, version) {
	return stampConfigWriteMetadata(cfg, (/* @__PURE__ */ new Date()).toISOString(), version);
}
function warnIfConfigFromFuture(cfg, logger) {
	const touched = cfg.meta?.lastTouchedVersion;
	if (!touched) return;
	if (shouldWarnOnTouchedVersion(VERSION, touched)) {
		if (warnedFutureTouchedVersions.has(touched)) return;
		warnedFutureTouchedVersions.add(touched);
		logger.warn([
			`Your OpenClaw config was written by version ${touched}, but this command is running ${VERSION}.`,
			"Check: `openclaw --version`, `which openclaw`, and `openclaw gateway status --deep`.",
			"If unexpected, update PATH so `openclaw` points to the version you want, or reinstall the Gateway service from that same OpenClaw install."
		].join("\n"));
	}
}
function shouldSuppressFutureVersionWarningForEnv(env) {
	return isTruthyEnvValue(env.OPENCLAW_UPDATE_IN_PROGRESS) || isTruthyEnvValue(env.OPENCLAW_UPDATE_POST_CORE);
}
function resolveConfigPathForDeps(deps) {
	if (deps.configPath) return deps.configPath;
	return resolveConfigPath(deps.env, resolveStateDir(deps.env, deps.homedir));
}
function normalizeDeps(overrides = {}) {
	const env = overrides.env ?? process.env;
	return {
		fs: overrides.fs ?? fs,
		json5: overrides.json5 ?? JSON5,
		env,
		homedir: overrides.homedir ?? (() => resolveRequiredHomeDir(env, os.homedir)),
		configPath: overrides.configPath ?? "",
		logger: overrides.logger ?? console,
		measure: overrides.measure ?? (async (_name, run) => await run()),
		suppressFutureVersionWarning: overrides.suppressFutureVersionWarning ?? shouldSuppressFutureVersionWarningForEnv(env),
		observe: overrides.observe ?? true
	};
}
function maybeLoadDotEnvForConfig(env) {
	if (env !== process.env) return;
	loadDotEnv({ quiet: true });
}
function parseConfigJson5(raw, json5 = JSON5) {
	try {
		return {
			ok: true,
			parsed: json5.parse(raw)
		};
	} catch (err) {
		return {
			ok: false,
			error: String(err)
		};
	}
}
function findJsonRootSuffix(raw, json5 = JSON5) {
	if (/^\s*(?:\{|\[)/.test(raw)) return null;
	let offset = 0;
	while (offset < raw.length) {
		const nextNewline = raw.indexOf("\n", offset);
		const lineEnd = nextNewline === -1 ? raw.length : nextNewline + 1;
		const line = raw.slice(offset, lineEnd);
		if (/^\s*(?:\{|\[)/.test(line)) {
			const candidate = raw.slice(offset);
			const parsed = parseConfigJson5(candidate, json5);
			return parsed.ok ? {
				raw: candidate,
				parsed: parsed.parsed
			} : null;
		}
		offset = lineEnd;
	}
	return null;
}
async function persistPrefixedConfigRecovery(params) {
	const observedAt = (/* @__PURE__ */ new Date()).toISOString();
	const clobberedPath = await persistBoundedClobberedConfigSnapshot({
		deps: params.deps,
		configPath: params.configPath,
		raw: params.originalRaw,
		observedAt
	});
	await params.deps.fs.promises.writeFile(params.configPath, params.recoveredRaw, {
		encoding: "utf-8",
		mode: 384
	});
	await params.deps.fs.promises.chmod?.(params.configPath, 384).catch(() => {});
	params.deps.logger.warn(`Config auto-stripped non-JSON prefix: ${params.configPath}` + (clobberedPath ? ` (original saved as ${clobberedPath})` : ""));
}
async function recoverConfigFromJsonRootSuffixWithDeps(params) {
	if (!params.snapshot.exists || params.snapshot.valid || typeof params.snapshot.raw !== "string") return false;
	const suffixRecovery = findJsonRootSuffix(params.snapshot.raw, params.deps.json5);
	if (!suffixRecovery) return false;
	let resolved;
	try {
		resolved = resolveConfigIncludesForRead(suffixRecovery.parsed, params.configPath, params.deps);
	} catch {
		return false;
	}
	if (!validateConfigObjectWithPlugins(stripShippedPluginInstallConfigRecords(resolveConfigForRead(resolved, params.deps.env).resolvedConfigRaw), {
		env: params.deps.env,
		sourceRaw: suffixRecovery.parsed
	}).ok) return false;
	await persistPrefixedConfigRecovery({
		deps: params.deps,
		configPath: params.configPath,
		originalRaw: params.snapshot.raw,
		recoveredRaw: suffixRecovery.raw
	});
	return true;
}
const TILDE_PATH_VALUE_RE = /^~(?=$|[\\/])/;
const PATH_LIKE_CONFIG_KEY_RE = /(dir|path|paths|file|root|workspace)$/i;
const PATH_LIKE_CONFIG_LIST_KEYS = new Set(["paths", "pathPrepend"]);
function isPathLikeConfigKey(key) {
	return Boolean(key && (PATH_LIKE_CONFIG_KEY_RE.test(key) || PATH_LIKE_CONFIG_LIST_KEYS.has(key)));
}
function expandAuthoredTildePath(value, home) {
	const suffix = value.slice(1);
	if (!suffix) return home;
	if (suffix.startsWith("/") || suffix.startsWith("\\")) return path.join(home, suffix.slice(1));
	return value;
}
function restoreAuthoredTildePathsForWrite(next, authored, key, home) {
	if (typeof next === "string" && typeof authored === "string" && isPathLikeConfigKey(key) && TILDE_PATH_VALUE_RE.test(authored.trim()) && path.normalize(next) === path.normalize(expandAuthoredTildePath(authored.trim(), home))) return authored;
	if (Array.isArray(next) && Array.isArray(authored)) {
		const normalizeChildren = isPathLikeConfigKey(key);
		return next.map((entry, index) => restoreAuthoredTildePathsForWrite(entry, authored[index], normalizeChildren ? key : void 0, home));
	}
	if (!isRecord$1(next) || !isRecord$1(authored)) return next;
	const out = { ...next };
	for (const [childKey, childValue] of Object.entries(out)) if (Object.prototype.hasOwnProperty.call(authored, childKey)) out[childKey] = restoreAuthoredTildePathsForWrite(childValue, authored[childKey], childKey, home);
	return out;
}
function resolveConfigIncludesForRead(parsed, configPath, deps) {
	return resolveConfigIncludes(parsed, configPath, {
		readFile: (candidate) => deps.fs.readFileSync(candidate, "utf-8"),
		readFileWithGuards: ({ includePath, resolvedPath, rootRealDir }) => readConfigIncludeFileWithGuards({
			includePath,
			resolvedPath,
			rootRealDir,
			ioFs: deps.fs
		}),
		parseJson: (raw) => deps.json5.parse(raw)
	}, { allowedRoots: resolveIncludeRoots(deps.env, deps.homedir) });
}
function resolveConfigForRead(resolvedIncludes, env) {
	if (resolvedIncludes && typeof resolvedIncludes === "object" && "env" in resolvedIncludes) applyConfigEnvVars(resolvedIncludes, env);
	const envWarnings = [];
	return {
		resolvedConfigRaw: resolveConfigEnvVars(resolvedIncludes, env, { onMissing: (w) => envWarnings.push(w) }),
		envSnapshotForRestore: { ...env },
		envWarnings
	};
}
function snapshotEnv(env) {
	return { ...env };
}
function restoreEnvChangesIfUnchanged(params) {
	const keys = new Set([...Object.keys(params.before), ...Object.keys(params.after)]);
	for (const key of keys) {
		if (params.before[key] === params.after[key] || params.env[key] !== params.after[key]) continue;
		const previous = params.before[key];
		if (previous === void 0) delete params.env[key];
		else params.env[key] = previous;
	}
}
function createConfigFileSnapshot(params) {
	const sourceConfig = asResolvedSourceConfig(params.sourceConfig);
	const runtimeConfig = asRuntimeConfig(params.runtimeConfig);
	return {
		path: params.path,
		exists: params.exists,
		raw: params.raw,
		parsed: params.parsed,
		sourceConfig,
		resolved: sourceConfig,
		valid: params.valid,
		runtimeConfig,
		config: runtimeConfig,
		hash: params.hash,
		issues: params.issues,
		warnings: params.warnings,
		legacyIssues: params.legacyIssues
	};
}
async function finalizeReadConfigSnapshotInternalResult(deps, result) {
	if (deps.observe) await observeConfigSnapshot(deps, result.snapshot);
	return result;
}
async function collectInvalidConfigLegacyIssues(raw, sourceRaw) {
	if (!raw || typeof raw !== "object") return [];
	const { findDoctorLegacyConfigIssues } = await import("./legacy-config-issues-DB9in8pQ.js");
	return findDoctorLegacyConfigIssues(raw, sourceRaw);
}
function createConfigIO(overrides = {}) {
	const deps = normalizeDeps(overrides);
	const configPath = resolveConfigPathForDeps(deps);
	function observeLoadConfigSnapshot(snapshot) {
		observeConfigSnapshotSync(deps, snapshot);
		return snapshot;
	}
	function finalizeLoadedRuntimeConfig(cfg) {
		const duplicates = findDuplicateAgentDirs(cfg, {
			env: deps.env,
			homedir: deps.homedir
		});
		if (duplicates.length > 0) throw new DuplicateAgentDirError(duplicates);
		applyConfigEnvVars(cfg, deps.env);
		if ((shouldEnableShellEnvFallback(deps.env) || cfg.env?.shellEnv?.enabled === true) && !shouldDeferShellEnvFallback(deps.env)) loadShellEnvFallback({
			enabled: true,
			env: deps.env,
			expectedKeys: resolveShellEnvExpectedKeys(deps.env),
			logger: deps.logger,
			timeoutMs: cfg.env?.shellEnv?.timeoutMs ?? resolveShellEnvFallbackTimeoutMs(deps.env)
		});
		const pendingSecret = AUTO_OWNER_DISPLAY_SECRET_BY_PATH.get(configPath);
		const ownerDisplaySecretResolution = ensureOwnerDisplaySecret(cfg, () => pendingSecret ?? crypto.randomBytes(32).toString("hex"));
		return applyConfigOverrides(retainGeneratedOwnerDisplaySecret({
			config: ownerDisplaySecretResolution.config,
			configPath,
			generatedSecret: ownerDisplaySecretResolution.generatedSecret,
			state: { pendingByPath: AUTO_OWNER_DISPLAY_SECRET_BY_PATH }
		}));
	}
	function captureFileSnapshotSync(filePath) {
		return deps.fs.existsSync(filePath) ? {
			existed: true,
			raw: deps.fs.readFileSync(filePath, "utf-8")
		} : { existed: false };
	}
	function restoreFileSnapshotSync(filePath, previousFile) {
		if (previousFile.existed) {
			deps.fs.writeFileSync(filePath, previousFile.raw, {
				encoding: "utf-8",
				mode: 384
			});
			return;
		}
		try {
			deps.fs.unlinkSync(filePath);
		} catch (err) {
			if (err?.code !== "ENOENT") throw err;
		}
	}
	function replaceConfigFileSync(raw) {
		replaceFileAtomicSync({
			filePath: configPath,
			content: raw,
			dirMode: 448,
			mode: 384,
			tempPrefix: path.basename(configPath),
			copyFallbackOnPermissionError: true,
			fileSystem: deps.fs
		});
	}
	function migrateAndStripShippedPluginInstallConfigRecords(configRaw, options = {}) {
		const installRecords = extractShippedPluginInstallConfigRecords(configRaw);
		const stripped = stripShippedPluginInstallConfigRecords(configRaw);
		if (Object.keys(installRecords).length === 0) return { config: stripped };
		if (options.persist === false) return {
			config: configRaw,
			validationConfig: stripped
		};
		try {
			const stateDir = resolveStateDir(deps.env, deps.homedir);
			const filePath = resolveInstalledPluginIndexRecordsStorePath({
				env: deps.env,
				stateDir
			});
			const previousFile = captureFileSnapshotSync(filePath);
			const existingRecords = loadInstalledPluginIndexInstallRecordsSync({
				env: deps.env,
				stateDir
			});
			const nextRecords = {
				...installRecords,
				...existingRecords
			};
			if (Object.keys(installRecords).some((pluginId) => !(pluginId in existingRecords))) writePersistedInstalledPluginIndexInstallRecordsSync(nextRecords, {
				config: coerceConfig(stripped),
				env: deps.env,
				stateDir
			});
			const rootConfigRaw = options.rootConfigRaw;
			if (rootConfigRaw !== void 0 && Object.keys(extractShippedPluginInstallConfigRecords(rootConfigRaw)).length > 0) {
				const persistedRootParsed = stripShippedPluginInstallConfigRecords(rootConfigRaw);
				const persistedRootRaw = JSON.stringify(persistedRootParsed, null, 2).trimEnd().concat("\n");
				try {
					replaceConfigFileSync(persistedRootRaw);
				} catch (err) {
					restoreFileSnapshotSync(filePath, previousFile);
					throw err;
				}
				return {
					config: stripped,
					persistedRootParsed,
					persistedRootRaw
				};
			}
		} catch (err) {
			deps.logger.warn(`Config (${configPath}): could not migrate shipped plugins.installs records into the plugin index: ${formatErrorMessage(err)}`);
			return { config: configRaw };
		}
		return { config: stripped };
	}
	function retainRuntimeOnlyShippedPluginInstallConfigRecords(config, sourceRaw) {
		const installRecords = extractShippedPluginInstallConfigRecords(sourceRaw);
		if (Object.keys(installRecords).length === 0) return config;
		return {
			...config,
			plugins: {
				...config.plugins,
				installs: installRecords
			}
		};
	}
	function resolveRuntimePreflightSourceConfig(candidate) {
		const env = { ...deps.env };
		return coerceConfig(migrateAndStripShippedPluginInstallConfigRecords(resolveConfigForRead(resolveConfigIncludesForRead(candidate, configPath, {
			...deps,
			env
		}), env).resolvedConfigRaw, {
			persist: false,
			rootConfigRaw: candidate
		}).config);
	}
	function ensureShippedPluginInstallConfigRecordsMigratedForWrite(snapshot) {
		const installRecords = {
			...extractShippedPluginInstallConfigRecords(snapshot.sourceConfig),
			...extractShippedPluginInstallConfigRecords(snapshot.parsed)
		};
		if (Object.keys(installRecords).length === 0) return { migrated: false };
		const stateDir = resolveStateDir(deps.env, deps.homedir);
		const filePath = resolveInstalledPluginIndexRecordsStorePath({
			env: deps.env,
			stateDir
		});
		const existingRecords = loadInstalledPluginIndexInstallRecordsSync({
			env: deps.env,
			stateDir
		});
		if (Object.keys(installRecords).every((pluginId) => pluginId in existingRecords)) return { migrated: false };
		const previousFile = deps.fs.existsSync(filePath) ? {
			existed: true,
			raw: deps.fs.readFileSync(filePath, "utf-8")
		} : { existed: false };
		try {
			const writtenPath = writePersistedInstalledPluginIndexInstallRecordsSync({
				...installRecords,
				...existingRecords
			}, {
				config: coerceConfig(stripShippedPluginInstallConfigRecords(snapshot.sourceConfig)),
				env: deps.env,
				stateDir
			});
			return {
				migrated: true,
				filePath: writtenPath,
				writtenHash: hashConfigRaw(deps.fs.existsSync(writtenPath) ? deps.fs.readFileSync(writtenPath, "utf-8") : null),
				previousFile
			};
		} catch (err) {
			throw new Error(`Config write blocked: shipped plugins.installs records in ${configPath} could not be migrated into the plugin index. Fix state directory permissions or run openclaw plugins registry --refresh, then retry. ${formatErrorMessage(err)}`, { cause: err });
		}
	}
	function rollbackShippedPluginInstallConfigWriteMigration(migration) {
		if (!migration.migrated) return false;
		if (hashConfigRaw(deps.fs.existsSync(migration.filePath) ? deps.fs.readFileSync(migration.filePath, "utf-8") : null) !== migration.writtenHash) return false;
		if (migration.previousFile.existed) {
			deps.fs.writeFileSync(migration.filePath, migration.previousFile.raw, {
				encoding: "utf-8",
				mode: 384
			});
			return true;
		}
		try {
			deps.fs.unlinkSync(migration.filePath);
		} catch (err) {
			if (err?.code !== "ENOENT") throw err;
		}
		return true;
	}
	function loadConfig() {
		try {
			maybeLoadDotEnvForConfig(deps.env);
			if (!deps.fs.existsSync(configPath)) {
				if (shouldEnableShellEnvFallback(deps.env) && !shouldDeferShellEnvFallback(deps.env)) loadShellEnvFallback({
					enabled: true,
					env: deps.env,
					expectedKeys: resolveShellEnvExpectedKeys(deps.env),
					logger: deps.logger,
					timeoutMs: resolveShellEnvFallbackTimeoutMs(deps.env)
				});
				return {};
			}
			const raw = deps.fs.readFileSync(configPath, "utf-8");
			const parsed = deps.json5.parse(raw);
			const readResolution = resolveConfigForRead(resolveConfigIncludesForRead(parsed, configPath, deps), deps.env);
			const resolvedConfig = readResolution.resolvedConfigRaw;
			const installMigration = migrateAndStripShippedPluginInstallConfigRecords(resolvedConfig, {
				persist: false,
				rootConfigRaw: parsed
			});
			const effectiveConfigRaw = installMigration.config;
			const validationConfigRaw = installMigration.validationConfig ?? effectiveConfigRaw;
			const snapshotRaw = installMigration.persistedRootRaw ?? raw;
			const snapshotParsed = installMigration.persistedRootParsed ?? parsed;
			const hash = hashConfigRaw(snapshotRaw);
			for (const w of readResolution.envWarnings) deps.logger.warn(`Config (${configPath}): missing env var "${w.varName}" at ${w.configPath} - feature using this value will be unavailable`);
			warnOnConfigMiskeys(validationConfigRaw, deps.logger);
			if (typeof validationConfigRaw !== "object" || validationConfigRaw === null) {
				observeLoadConfigSnapshot({ ...createConfigFileSnapshot({
					path: configPath,
					exists: true,
					raw: snapshotRaw,
					parsed: snapshotParsed,
					sourceConfig: {},
					valid: true,
					runtimeConfig: {},
					hash,
					issues: [],
					warnings: [],
					legacyIssues: []
				}) });
				return {};
			}
			const preValidationDuplicates = findDuplicateAgentDirs(validationConfigRaw, {
				env: deps.env,
				homedir: deps.homedir
			});
			if (preValidationDuplicates.length > 0) throw new DuplicateAgentDirError(preValidationDuplicates);
			let pluginMetadataSnapshot;
			const loadValidationPluginMetadataSnapshot = (config) => {
				if (pluginMetadataSnapshot) return pluginMetadataSnapshot;
				const metadataConfig = retainRuntimeOnlyShippedPluginInstallConfigRecords(config, effectiveConfigRaw);
				pluginMetadataSnapshot = resolvePluginMetadataSnapshot({
					config: metadataConfig,
					workspaceDir: resolveAgentWorkspaceDir(metadataConfig, resolveDefaultAgentId(metadataConfig)),
					env: deps.env,
					allowWorkspaceScopedCurrent: true
				});
				return pluginMetadataSnapshot;
			};
			const validated = validateConfigObjectWithPlugins(validationConfigRaw, {
				env: deps.env,
				pluginValidation: overrides.pluginValidation,
				loadPluginMetadataSnapshot: loadValidationPluginMetadataSnapshot,
				sourceRaw: snapshotParsed,
				preservedLegacyRootKeys: overrides.preservedLegacyRootKeys
			});
			if (!validated.ok) {
				observeLoadConfigSnapshot({ ...createConfigFileSnapshot({
					path: configPath,
					exists: true,
					raw: snapshotRaw,
					parsed: snapshotParsed,
					sourceConfig: coerceConfig(effectiveConfigRaw),
					valid: false,
					runtimeConfig: coerceConfig(effectiveConfigRaw),
					hash,
					issues: validated.issues,
					warnings: validated.warnings,
					legacyIssues: []
				}) });
				throwInvalidConfig({
					configPath,
					issues: validated.issues,
					logger: deps.logger,
					loggedConfigPaths: loggedInvalidConfigs
				});
			}
			if (validated.warnings.length > 0) {
				const details = validated.warnings.map((iss) => `- ${sanitizeTerminalText(iss.path || "<root>")}: ${sanitizeTerminalText(iss.message)}`).join("\n");
				deps.logger.warn(`Config warnings:\n${details}`);
			}
			if (!deps.suppressFutureVersionWarning) warnIfConfigFromFuture(validated.config, deps.logger);
			const cfg = retainRuntimeOnlyShippedPluginInstallConfigRecords(materializeRuntimeConfig(validated.config, "load", { manifestRegistry: pluginMetadataSnapshot?.manifestRegistry }), effectiveConfigRaw);
			observeLoadConfigSnapshot({ ...createConfigFileSnapshot({
				path: configPath,
				exists: true,
				raw: snapshotRaw,
				parsed: snapshotParsed,
				sourceConfig: coerceConfig(effectiveConfigRaw),
				valid: true,
				runtimeConfig: cfg,
				hash,
				issues: [],
				warnings: validated.warnings,
				legacyIssues: []
			}) });
			return finalizeLoadedRuntimeConfig(cfg);
		} catch (err) {
			if (err instanceof DuplicateAgentDirError) {
				deps.logger.error(err.message);
				throw err;
			}
			if (err?.code === "INVALID_CONFIG") throw err;
			deps.logger.error(`Failed to read config at ${configPath}`, err);
			throw err;
		}
	}
	async function readConfigFileSnapshotInternal() {
		maybeLoadDotEnvForConfig(deps.env);
		if (!deps.fs.existsSync(configPath)) return await finalizeReadConfigSnapshotInternalResult(deps, { snapshot: createConfigFileSnapshot({
			path: configPath,
			exists: false,
			raw: null,
			parsed: {},
			sourceConfig: {},
			valid: true,
			runtimeConfig: {},
			hash: hashConfigRaw(null),
			issues: [],
			warnings: [],
			legacyIssues: []
		}) });
		let fallbackRaw = null;
		let fallbackParsed = {};
		let fallbackSourceConfig = {};
		let fallbackHash = hashConfigRaw(null);
		try {
			const raw = await deps.measure("config.snapshot.read.file", () => deps.fs.readFileSync(configPath, "utf-8"));
			const rawHash = await deps.measure("config.snapshot.read.hash", () => hashConfigRaw(raw));
			fallbackRaw = raw;
			fallbackHash = rawHash;
			const parsedRes = await deps.measure("config.snapshot.read.parse", () => parseConfigJson5(raw, deps.json5));
			if (!parsedRes.ok) return await finalizeReadConfigSnapshotInternalResult(deps, { snapshot: createConfigFileSnapshot({
				path: configPath,
				exists: true,
				raw,
				parsed: {},
				sourceConfig: {},
				valid: false,
				runtimeConfig: {},
				hash: rawHash,
				issues: [{
					path: "",
					message: `JSON5 parse failed: ${parsedRes.error}`
				}],
				warnings: [],
				legacyIssues: []
			}) });
			fallbackParsed = parsedRes.parsed;
			fallbackSourceConfig = coerceConfig(parsedRes.parsed);
			const effectiveParsed = parsedRes.parsed;
			const hash = rawHash;
			fallbackRaw = raw;
			fallbackParsed = effectiveParsed;
			fallbackSourceConfig = coerceConfig(effectiveParsed);
			fallbackHash = hash;
			let resolved;
			try {
				resolved = await deps.measure("config.snapshot.read.includes", () => resolveConfigIncludesForRead(effectiveParsed, configPath, deps));
			} catch (err) {
				const message = err instanceof ConfigIncludeError ? err.message : `Include resolution failed: ${String(err)}`;
				return await finalizeReadConfigSnapshotInternalResult(deps, { snapshot: createConfigFileSnapshot({
					path: configPath,
					exists: true,
					raw,
					parsed: effectiveParsed,
					sourceConfig: coerceConfig(effectiveParsed),
					valid: false,
					runtimeConfig: coerceConfig(effectiveParsed),
					hash,
					issues: [{
						path: "",
						message
					}],
					warnings: [],
					legacyIssues: []
				}) });
			}
			const readResolution = await deps.measure("config.snapshot.read.env", () => resolveConfigForRead(resolved, deps.env));
			const envVarWarnings = readResolution.envWarnings.map((w) => ({
				path: w.configPath,
				message: `Missing env var "${w.varName}" - feature using this value will be unavailable`
			}));
			const resolvedConfigRaw = readResolution.resolvedConfigRaw;
			const installMigration = await deps.measure("config.snapshot.read.plugin-install-migration", () => migrateAndStripShippedPluginInstallConfigRecords(resolvedConfigRaw, {
				persist: false,
				rootConfigRaw: effectiveParsed
			}));
			const effectiveConfigRaw = installMigration.config;
			const validationConfigRaw = installMigration.validationConfig ?? effectiveConfigRaw;
			const snapshotRaw = installMigration.persistedRootRaw ?? raw;
			const snapshotParsed = installMigration.persistedRootParsed ?? effectiveParsed;
			const snapshotHash = installMigration.persistedRootRaw ? hashConfigRaw(installMigration.persistedRootRaw) : hash;
			fallbackSourceConfig = coerceConfig(effectiveConfigRaw);
			let pluginMetadataSnapshot;
			const loadValidationPluginMetadataSnapshot = (config) => {
				if (pluginMetadataSnapshot) return pluginMetadataSnapshot;
				const metadataConfig = retainRuntimeOnlyShippedPluginInstallConfigRecords(config, effectiveConfigRaw);
				pluginMetadataSnapshot = resolvePluginMetadataSnapshot({
					config: metadataConfig,
					workspaceDir: resolveAgentWorkspaceDir(metadataConfig, resolveDefaultAgentId(metadataConfig)),
					env: deps.env,
					allowWorkspaceScopedCurrent: true
				});
				return pluginMetadataSnapshot;
			};
			const validated = await deps.measure("config.snapshot.read.validate", () => validateConfigObjectWithPlugins(validationConfigRaw, {
				env: deps.env,
				pluginValidation: overrides.pluginValidation,
				loadPluginMetadataSnapshot: loadValidationPluginMetadataSnapshot,
				sourceRaw: effectiveParsed,
				preservedLegacyRootKeys: overrides.preservedLegacyRootKeys
			}));
			if (!validated.ok) {
				const legacyIssues = await deps.measure("config.snapshot.read.legacy-issues", () => collectInvalidConfigLegacyIssues(effectiveConfigRaw, effectiveParsed));
				return await finalizeReadConfigSnapshotInternalResult(deps, { snapshot: createConfigFileSnapshot({
					path: configPath,
					exists: true,
					raw: snapshotRaw,
					parsed: snapshotParsed,
					sourceConfig: coerceConfig(effectiveConfigRaw),
					valid: false,
					runtimeConfig: coerceConfig(effectiveConfigRaw),
					hash: snapshotHash,
					issues: validated.issues,
					warnings: [...validated.warnings, ...envVarWarnings],
					legacyIssues
				}) });
			}
			if (!deps.suppressFutureVersionWarning) warnIfConfigFromFuture(validated.config, deps.logger);
			const snapshotConfig = await deps.measure("config.snapshot.read.materialize", () => retainRuntimeOnlyShippedPluginInstallConfigRecords(materializeRuntimeConfig(validated.config, "snapshot", { manifestRegistry: pluginMetadataSnapshot?.manifestRegistry }), effectiveConfigRaw));
			return await deps.measure("config.snapshot.read.observe", () => finalizeReadConfigSnapshotInternalResult(deps, {
				snapshot: createConfigFileSnapshot({
					path: configPath,
					exists: true,
					raw: snapshotRaw,
					parsed: snapshotParsed,
					sourceConfig: coerceConfig(effectiveConfigRaw),
					valid: true,
					runtimeConfig: snapshotConfig,
					hash: snapshotHash,
					issues: [],
					warnings: [...validated.warnings, ...envVarWarnings],
					legacyIssues: []
				}),
				envSnapshotForRestore: readResolution.envSnapshotForRestore,
				pluginMetadataSnapshot
			}));
		} catch (err) {
			const nodeErr = err;
			let message;
			if (nodeErr?.code === "EACCES") {
				const uid = process.getuid?.();
				const uidHint = typeof uid === "number" ? String(uid) : "$(id -u)";
				message = [
					`read failed: ${String(err)}`,
					``,
					`Config file is not readable by the current process. If running in a container`,
					`or 1-click deployment, fix ownership with:`,
					`  chown ${uidHint} "${configPath}"`,
					`Then restart the gateway.`
				].join("\n");
				deps.logger.error(message);
			} else message = `read failed: ${String(err)}`;
			return await finalizeReadConfigSnapshotInternalResult(deps, { snapshot: createConfigFileSnapshot({
				path: configPath,
				exists: true,
				raw: fallbackRaw,
				parsed: fallbackParsed,
				sourceConfig: fallbackSourceConfig,
				valid: false,
				runtimeConfig: fallbackSourceConfig,
				hash: fallbackHash,
				issues: [{
					path: "",
					message
				}],
				warnings: [],
				legacyIssues: []
			}) });
		}
	}
	async function readConfigFileSnapshot() {
		return (await readConfigFileSnapshotInternal()).snapshot;
	}
	async function readConfigFileSnapshotWithPluginMetadata() {
		const result = await readConfigFileSnapshotInternal();
		return {
			snapshot: result.snapshot,
			...result.pluginMetadataSnapshot ? { pluginMetadataSnapshot: result.pluginMetadataSnapshot } : {}
		};
	}
	async function promoteConfigSnapshotToLastKnownGood(snapshot) {
		return await promoteConfigSnapshotToLastKnownGood$1({
			deps,
			snapshot,
			logger: deps.logger
		});
	}
	async function recoverConfigFromLastKnownGood(params) {
		return await recoverConfigFromLastKnownGood$1({
			deps,
			snapshot: params.snapshot,
			reason: params.reason
		});
	}
	async function recoverConfigFromJsonRootSuffix(snapshot) {
		return await recoverConfigFromJsonRootSuffixWithDeps({
			deps,
			configPath,
			snapshot
		});
	}
	async function readConfigFileSnapshotForWrite() {
		const result = await readConfigFileSnapshotInternal();
		return {
			snapshot: result.snapshot,
			writeOptions: {
				envSnapshotForRestore: result.envSnapshotForRestore,
				expectedConfigPath: configPath,
				unsetPaths: resolveManagedUnsetPathsForWrite(void 0)
			}
		};
	}
	async function readBestEffortConfig() {
		const result = await readConfigFileSnapshotInternal();
		if (!result.snapshot.valid) return result.snapshot.config;
		return finalizeLoadedRuntimeConfig(materializeRuntimeConfig(result.snapshot.sourceConfig, "load", { manifestRegistry: result.pluginMetadataSnapshot?.manifestRegistry }));
	}
	async function readSourceConfigBestEffort() {
		maybeLoadDotEnvForConfig(deps.env);
		if (!deps.fs.existsSync(configPath)) return {};
		try {
			const parsedRes = parseConfigJson5(deps.fs.readFileSync(configPath, "utf-8"), deps.json5);
			if (!parsedRes.ok) return {};
			let resolved;
			try {
				resolved = resolveConfigIncludesForRead(parsedRes.parsed, configPath, deps);
			} catch {
				return coerceConfig(parsedRes.parsed);
			}
			return coerceConfig(stripShippedPluginInstallConfigRecords(resolveConfigForRead(resolved, deps.env).resolvedConfigRaw));
		} catch {
			return {};
		}
	}
	async function writeConfigFile(cfg, options = {}) {
		assertConfigWriteAllowedInCurrentMode({
			configPath,
			env: deps.env
		});
		const unsetPaths = resolveManagedUnsetPathsForWrite(options.unsetPaths);
		let persistCandidate = cfg;
		const snapshot = options.baseSnapshot ?? (await readConfigFileSnapshotInternal()).snapshot;
		let envRefMap = null;
		let changedPaths = null;
		if (snapshot.valid && snapshot.exists) {
			persistCandidate = resolvePersistCandidateForWrite({
				runtimeConfig: snapshot.config,
				sourceConfig: snapshot.resolved,
				nextConfig: cfg,
				rootAuthoredConfig: snapshot.parsed,
				unsetPaths,
				explicitSetPaths: options.explicitSetPaths,
				explicitSetValueSource: options.explicitSetValueSource
			});
			try {
				const resolvedIncludes = resolveConfigIncludes(snapshot.parsed, configPath, {
					readFile: (candidate) => deps.fs.readFileSync(candidate, "utf-8"),
					readFileWithGuards: ({ includePath, resolvedPath, rootRealDir }) => readConfigIncludeFileWithGuards({
						includePath,
						resolvedPath,
						rootRealDir,
						ioFs: deps.fs
					}),
					parseJson: (raw) => deps.json5.parse(raw)
				}, { allowedRoots: resolveIncludeRoots(deps.env, deps.homedir) });
				const collected = /* @__PURE__ */ new Map();
				collectEnvRefPaths(resolvedIncludes, "", collected);
				if (collected.size > 0) {
					envRefMap = collected;
					changedPaths = /* @__PURE__ */ new Set();
					collectChangedPaths(snapshot.config, cfg, "", changedPaths);
				}
			} catch {
				envRefMap = null;
			}
		}
		persistCandidate = applyUnsetPathsForWrite(persistCandidate, unsetPaths);
		const validated = validateConfigObjectRawWithPlugins(persistCandidate, {
			env: deps.env,
			pluginValidation: options.skipPluginValidation ? "skip" : "full",
			preservedLegacyRootKeys: options.preservedLegacyRootKeys
		});
		if (!validated.ok) {
			const issue = validated.issues[0];
			const pathLabel = issue?.path ? issue.path : "<root>";
			const issueMessage = issue?.message ?? "invalid";
			throw new Error(formatConfigValidationFailure(pathLabel, issueMessage));
		}
		if (validated.warnings.length > 0) {
			const details = validated.warnings.map((warning) => `- ${warning.path}: ${warning.message}`).join("\n");
			deps.logger.warn(`Config warnings:\n${details}`);
		}
		let cfgToWrite = persistCandidate;
		try {
			if (deps.fs.existsSync(configPath)) {
				const parsedRes = parseConfigJson5(await deps.fs.promises.readFile(configPath, "utf-8"), deps.json5);
				if (parsedRes.ok) {
					const envForRestore = options.envSnapshotForRestore ?? deps.env;
					cfgToWrite = restoreEnvVarRefs(cfgToWrite, parsedRes.parsed, envForRestore);
				}
			}
		} catch {}
		const dir = path.dirname(configPath);
		await deps.fs.promises.mkdir(dir, {
			recursive: true,
			mode: 448
		});
		await tightenStateDirPermissionsIfNeeded({
			configPath,
			env: deps.env,
			homedir: deps.homedir,
			fsModule: deps.fs
		});
		const stampedOutputConfig = stampConfigVersion(applyUnsetPathsForWrite(restoreAuthoredTildePathsForWrite(envRefMap && changedPaths ? restoreEnvRefsFromMap(cfgToWrite, "", envRefMap, changedPaths) : cfgToWrite, snapshot.parsed, void 0, deps.homedir()), unsetPaths), options.lastTouchedVersionOverride);
		const json = JSON.stringify(stampedOutputConfig, null, 2).trimEnd().concat("\n");
		const nextHash = hashConfigRaw(json);
		const previousHash = resolveConfigSnapshotHash(snapshot);
		const changedPathCount = changedPaths?.size;
		const previousBytes = typeof snapshot.raw === "string" ? Buffer.byteLength(snapshot.raw, "utf-8") : null;
		const nextBytes = Buffer.byteLength(json, "utf-8");
		const previousStat = snapshot.exists ? await deps.fs.promises.stat(configPath).catch(() => null) : null;
		const hasMetaBefore = hasConfigMeta(snapshot.parsed);
		const hasMetaAfter = hasConfigMeta(stampedOutputConfig);
		const gatewayModeBefore = resolveGatewayMode(snapshot.resolved);
		const gatewayModeAfter = resolveGatewayMode(stampedOutputConfig);
		const suspiciousReasons = resolveConfigWriteSuspiciousReasons({
			existsBefore: snapshot.exists,
			previousBytes,
			nextBytes,
			hasMetaBefore,
			gatewayModeBefore,
			gatewayModeAfter
		});
		const logConfigOverwrite = () => {
			if (!snapshot.exists) return;
			if (options.skipOutputLogs) return;
			const isVitest = deps.env.VITEST === "true";
			const shouldLogInVitest = deps.env.OPENCLAW_TEST_CONFIG_OVERWRITE_LOG === "1";
			if (isVitest && !shouldLogInVitest) return;
			if (!isVerbose() && deps.env.OPENCLAW_CONFIG_OVERWRITE_LOG !== "1" && !shouldLogInVitest) return;
			deps.logger.warn(formatConfigOverwriteLogMessage({
				configPath,
				previousHash: previousHash ?? null,
				nextHash,
				changedPathCount
			}));
		};
		const logConfigWriteAnomalies = () => {
			if (suspiciousReasons.length === 0) return;
			if (options.skipOutputLogs) return;
			const isVitest = deps.env.VITEST === "true";
			const shouldLogInVitest = deps.env.OPENCLAW_TEST_CONFIG_WRITE_ANOMALY_LOG === "1";
			if (isVitest && !shouldLogInVitest) return;
			const visibleReasons = isVerbose() || deps.env.OPENCLAW_CONFIG_WRITE_ANOMALY_LOG === "1" || shouldLogInVitest ? suspiciousReasons : suspiciousReasons.filter((reason) => reason !== "missing-meta-before-write");
			if (visibleReasons.length === 0) return;
			deps.logger.warn(`Config write anomaly: ${configPath} (${visibleReasons.join(", ")})`);
		};
		const previousMetadata = resolveConfigStatMetadata(previousStat);
		const auditRecordBase = createConfigWriteAuditRecordBase({
			configPath,
			env: deps.env,
			existsBefore: snapshot.exists,
			previousHash: previousHash ?? null,
			nextHash,
			previousBytes,
			nextBytes,
			previousMetadata,
			changedPathCount,
			hasMetaBefore,
			hasMetaAfter,
			gatewayModeBefore,
			gatewayModeAfter,
			suspicious: suspiciousReasons
		});
		const appendWriteAudit = async (result, err, nextStat) => {
			await appendConfigAuditRecord({
				fs: deps.fs,
				env: deps.env,
				homedir: deps.homedir,
				record: finalizeConfigWriteAuditRecord({
					base: auditRecordBase,
					result,
					err,
					nextMetadata: resolveConfigStatMetadata(nextStat ?? null)
				})
			});
		};
		const blockingReasons = resolveConfigWriteBlockingReasons(suspiciousReasons, options);
		if (blockingReasons.length > 0 && options.allowDestructiveWrite !== true) {
			const rejectedPath = `${configPath}.rejected.${formatConfigArtifactTimestamp((/* @__PURE__ */ new Date()).toISOString())}`;
			await deps.fs.promises.writeFile(rejectedPath, json, {
				encoding: "utf-8",
				mode: 384,
				flag: "wx"
			}).catch(() => {});
			const message = `Config write rejected: ${configPath} (${blockingReasons.join(", ")}). Rejected payload saved to ${rejectedPath}.`;
			const err = Object.assign(new Error(message), {
				code: "CONFIG_WRITE_REJECTED",
				rejectedPath,
				reasons: blockingReasons
			});
			deps.logger.warn(message);
			await appendWriteAudit("rejected", err);
			throw err;
		}
		await (options.preCommitRuntimePreflight ?? (async (sourceConfig) => {
			await preflightRuntimeSnapshotWrite({
				nextSourceConfig: sourceConfig,
				refreshOptions: options.runtimeRefresh,
				formatRefreshError: (error) => formatErrorMessage(error),
				createRefreshError: (detail, cause) => new ConfigRuntimeRefreshError(`Config write blocked before committing ${configPath}: active SecretRef resolution failed: ${detail}`, { cause })
			});
		}))(resolveRuntimePreflightSourceConfig(stampedOutputConfig));
		const pluginInstallConfigMigration = ensureShippedPluginInstallConfigRecordsMigratedForWrite(snapshot);
		let configCommitted = false;
		try {
			const result = await replaceFileAtomic({
				filePath: configPath,
				content: json,
				dirMode: 448,
				mode: 384,
				tempPrefix: path.basename(configPath),
				copyFallbackOnPermissionError: true,
				fileSystem: deps.fs,
				beforeRename: async () => {
					if (deps.fs.existsSync(configPath)) await maintainConfigBackups(configPath, deps.fs.promises);
				}
			});
			configCommitted = true;
			logConfigOverwrite();
			logConfigWriteAnomalies();
			await appendWriteAudit(result.method, void 0, await deps.fs.promises.stat(configPath).catch(() => null));
			return {
				persistedHash: nextHash,
				persistedConfig: stampedOutputConfig,
				...pluginInstallConfigMigration.migrated ? { [configWritePostCommitRollback]: () => {
					rollbackShippedPluginInstallConfigWriteMigration(pluginInstallConfigMigration);
				} } : {}
			};
		} catch (err) {
			if (!configCommitted) rollbackShippedPluginInstallConfigWriteMigration(pluginInstallConfigMigration);
			await appendWriteAudit("failed", err);
			throw err;
		}
	}
	return {
		configPath,
		env: deps.env,
		loadConfig,
		readBestEffortConfig,
		readSourceConfigBestEffort,
		readConfigFileSnapshot,
		readConfigFileSnapshotWithPluginMetadata,
		readConfigFileSnapshotForWrite,
		promoteConfigSnapshotToLastKnownGood,
		recoverConfigFromLastKnownGood,
		recoverConfigFromJsonRootSuffix,
		writeConfigFile
	};
}
const AUTO_OWNER_DISPLAY_SECRET_BY_PATH = /* @__PURE__ */ new Map();
function clearConfigCache() {}
function registerConfigWriteListener(listener) {
	return registerRuntimeConfigWriteListener(listener);
}
function isCompatibleTopLevelRuntimeProjectionShape(params) {
	const runtime = params.runtimeSnapshot;
	const candidate = params.candidate;
	for (const key of Object.keys(runtime)) {
		if (!Object.hasOwn(candidate, key)) return false;
		const runtimeValue = runtime[key];
		const candidateValue = candidate[key];
		if ((Array.isArray(runtimeValue) ? "array" : runtimeValue === null ? "null" : typeof runtimeValue) !== (Array.isArray(candidateValue) ? "array" : candidateValue === null ? "null" : typeof candidateValue)) return false;
	}
	return true;
}
function projectConfigOntoRuntimeSourceSnapshot(config) {
	const runtimeConfigSnapshot = getRuntimeConfigSnapshot();
	const runtimeConfigSourceSnapshot = getRuntimeConfigSourceSnapshot();
	if (!runtimeConfigSnapshot || !runtimeConfigSourceSnapshot) return config;
	if (config === runtimeConfigSnapshot) return runtimeConfigSourceSnapshot;
	if (!isCompatibleTopLevelRuntimeProjectionShape({
		runtimeSnapshot: runtimeConfigSnapshot,
		candidate: config
	})) return config;
	return coerceConfig(applyMergePatch(coerceConfig(projectSourceOntoRuntimeShape(runtimeConfigSourceSnapshot, runtimeConfigSnapshot)), createMergePatch(runtimeConfigSnapshot, config)));
}
function loadConfig(options) {
	return loadPinnedRuntimeConfig(() => createConfigIO(options?.skipPluginValidation ? { pluginValidation: "skip" } : {}).loadConfig());
}
function getRuntimeConfig(options) {
	return loadConfig(options);
}
async function readBestEffortConfig(options) {
	return await createConfigIO(options?.skipPluginValidation ? { pluginValidation: "skip" } : {}).readBestEffortConfig();
}
async function readSourceConfigBestEffort() {
	return await createConfigIO().readSourceConfigBestEffort();
}
async function readConfigFileSnapshot(options = {}) {
	return await createConfigIO({
		...options.measure ? { measure: options.measure } : {},
		...options.observe === false ? { observe: false } : {},
		...options.skipPluginValidation ? { pluginValidation: "skip" } : {},
		...options.suppressFutureVersionWarning ? { suppressFutureVersionWarning: true } : {},
		...options.preservedLegacyRootKeys ? { preservedLegacyRootKeys: options.preservedLegacyRootKeys } : {}
	}).readConfigFileSnapshot();
}
async function readConfigFileSnapshotWithPluginMetadata(options) {
	return await createConfigIO(options?.measure ? { measure: options.measure } : {}).readConfigFileSnapshotWithPluginMetadata();
}
async function promoteConfigSnapshotToLastKnownGood(snapshot) {
	return await createConfigIO().promoteConfigSnapshotToLastKnownGood(snapshot);
}
async function recoverConfigFromLastKnownGood(params) {
	return await createConfigIO().recoverConfigFromLastKnownGood(params);
}
async function recoverConfigFromJsonRootSuffix(snapshot) {
	return await createConfigIO().recoverConfigFromJsonRootSuffix(snapshot);
}
async function readSourceConfigSnapshot() {
	return await readConfigFileSnapshot();
}
async function readConfigFileSnapshotForWrite(options) {
	return await createConfigIO(options?.skipPluginValidation ? { pluginValidation: "skip" } : {}).readConfigFileSnapshotForWrite();
}
async function readSourceConfigSnapshotForWrite() {
	return await readConfigFileSnapshotForWrite();
}
async function writeConfigFile(cfg, options = {}) {
	const io = createConfigIO({
		...options.skipPluginValidation ? { pluginValidation: "skip" } : {},
		...options.preservedLegacyRootKeys ? { preservedLegacyRootKeys: options.preservedLegacyRootKeys } : {}
	});
	assertConfigWriteAllowedInCurrentMode({ configPath: io.configPath });
	let nextCfg = cfg;
	const runtimeConfigSnapshot = getRuntimeConfigSnapshot();
	const runtimeConfigSourceSnapshot = getRuntimeConfigSourceSnapshot();
	const hadRuntimeSnapshot = Boolean(runtimeConfigSnapshot);
	const hadBothSnapshots = Boolean(runtimeConfigSnapshot && runtimeConfigSourceSnapshot);
	if (hadBothSnapshots) nextCfg = coerceConfig(applyMergePatch(runtimeConfigSourceSnapshot, createMergePatch(runtimeConfigSnapshot, cfg)));
	const baseSnapshot = options.baseSnapshot ?? await io.readConfigFileSnapshot();
	let runtimePreflightResult;
	const writeResult = await io.writeConfigFile(nextCfg, {
		baseSnapshot,
		envSnapshotForRestore: resolveWriteEnvSnapshotForPath({
			actualConfigPath: io.configPath,
			expectedConfigPath: options.expectedConfigPath,
			envSnapshotForRestore: options.envSnapshotForRestore
		}),
		unsetPaths: resolveManagedUnsetPathsForWrite(options.unsetPaths),
		explicitSetPaths: options.explicitSetPaths,
		explicitSetValueSource: options.explicitSetPaths ? options.explicitSetValueSource ?? cfg : void 0,
		afterWrite: options.afterWrite,
		allowDestructiveWrite: options.allowDestructiveWrite,
		allowConfigSizeDrop: options.allowConfigSizeDrop,
		skipRuntimeSnapshotRefresh: options.skipRuntimeSnapshotRefresh,
		skipOutputLogs: options.skipOutputLogs,
		skipPluginValidation: options.skipPluginValidation,
		preservedLegacyRootKeys: options.preservedLegacyRootKeys,
		lastTouchedVersionOverride: options.lastTouchedVersionOverride,
		preCommitRuntimePreflight: async (sourceConfig) => {
			runtimePreflightResult = await preflightRuntimeSnapshotWrite({
				nextSourceConfig: sourceConfig,
				refreshOptions: options.runtimeRefresh,
				formatRefreshError: (error) => formatErrorMessage(error),
				createRefreshError: (detail, cause) => new ConfigRuntimeRefreshError(`Config write blocked before committing ${io.configPath}: active SecretRef resolution failed: ${detail}`, { cause })
			});
		}
	});
	if (options.skipRuntimeSnapshotRefresh && !hadRuntimeSnapshot && !getRuntimeConfigSnapshotRefreshHandler()) return writeResult;
	let canonicalSourceConfig = nextCfg;
	const envBeforeCanonicalRead = snapshotEnv(process.env);
	let envAfterCanonicalRead = envBeforeCanonicalRead;
	try {
		const freshSnapshot = await io.readConfigFileSnapshot();
		if (freshSnapshot.exists && freshSnapshot.valid) canonicalSourceConfig = freshSnapshot.sourceConfig;
	} catch {} finally {
		envAfterCanonicalRead = snapshotEnv(process.env);
	}
	const notifyCommittedWrite = () => {
		const currentRuntimeConfig = getRuntimeConfigSnapshot();
		if (!currentRuntimeConfig) return;
		notifyRuntimeConfigWriteListeners(createRuntimeConfigWriteNotification({
			configPath: io.configPath,
			sourceConfig: canonicalSourceConfig,
			runtimeConfig: currentRuntimeConfig,
			persistedHash: writeResult.persistedHash,
			afterWrite: options.afterWrite
		}));
	};
	try {
		await finalizeRuntimeSnapshotWrite({
			nextSourceConfig: canonicalSourceConfig,
			refreshOptions: options.runtimeRefresh,
			hadRuntimeSnapshot,
			hadBothSnapshots,
			loadFreshConfig: () => io.loadConfig(),
			notifyCommittedWrite,
			formatRefreshError: (error) => formatErrorMessage(error),
			preflightResult: runtimePreflightResult,
			createRefreshError: (detail, cause) => new ConfigRuntimeRefreshError(`Config was written to ${io.configPath}, but runtime snapshot refresh failed: ${detail}`, { cause })
		});
	} catch (error) {
		try {
			if (await rollbackConfigFileWriteIfUnchanged({
				configPath: io.configPath,
				previousSnapshot: baseSnapshot,
				committedHash: writeResult.persistedHash
			})) {
				restoreEnvChangesIfUnchanged({
					env: process.env,
					before: envBeforeCanonicalRead,
					after: envAfterCanonicalRead
				});
				writeResult[configWritePostCommitRollback]?.();
			}
		} catch (rollbackError) {
			throw new ConfigRuntimeRefreshError(`${formatErrorMessage(error)} Rollback failed: ${formatErrorMessage(rollbackError)}`, { cause: error });
		}
		throw error;
	}
	return {
		...writeResult,
		persistedConfig: canonicalSourceConfig
	};
}
//#endregion
export { shouldEnableShellEnvFallback as $, applyConfigOverrides as A, applyUnsetPathsForWrite as B, validateConfigObject as C, collectChannelSchemaMetadata as D, validateConfigObjectWithPlugins as E, asResolvedSourceConfig as F, createInvalidConfigError as G, projectSourceOntoRuntimeShape as H, asRuntimeConfig as I, maintainConfigBackups as J, formatInvalidConfigDetails as K, resolveNormalizedProviderModelMaxTokens as L, resetConfigOverrides as M, setConfigOverride as N, collectPluginSchemaMetadata as O, unsetConfigOverride as P, resolveShellEnvFallbackTimeoutMs as Q, normalizeProviderConfigForConfigDefaults as R, collectUnsupportedSecretRefPolicyIssues as S, validateConfigObjectRawWithPlugins as T, resolveManagedUnsetPathsForWrite as U, createMergePatch as V, AUTO_MANAGED_CONFIG_META_PATHS as W, getShellPathFromLoginShell as X, getShellEnvAppliedKeys as Y, loadShellEnvFallback as Z, recoverConfigFromLastKnownGood as _, loadConfig as a, restoreEnvChangesIfUnchanged as b, promoteConfigSnapshotToLastKnownGood as c, readConfigFileSnapshotForWrite as d, resolveOwnerDisplaySetting as et, readConfigFileSnapshotWithPluginMetadata as f, recoverConfigFromJsonRootSuffix as g, readSourceConfigSnapshotForWrite as h, getRuntimeConfig as i, getConfigOverrides as j, resolveShellEnvExpectedKeys as k, readBestEffortConfig as l, readSourceConfigSnapshot as m, clearConfigCache as n, parseConfigJson5 as o, readSourceConfigBestEffort as p, createPreUpdateConfigSnapshot as q, createConfigIO as r, projectConfigOntoRuntimeSourceSnapshot as s, ConfigRuntimeRefreshError as t, readConfigFileSnapshot as u, registerConfigWriteListener as v, validateConfigObjectRaw as w, writeConfigFile as x, resolveConfigSnapshotHash as y, resolveCronMaxConcurrentRuns as z };
