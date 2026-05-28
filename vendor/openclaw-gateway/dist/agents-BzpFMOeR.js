import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { m as FsSafeError } from "./path-BlG8lhgR.js";
import { d as movePathToTrash } from "./fs-safe-JUdtLZkh.js";
import { a as root } from "./secure-temp-dir-XAWcZnE2.js";
import { p as resolveUserPath } from "./utils-B5r0V84N.js";
import "./agent-scope-CudANNo3.js";
import { l as normalizeAgentId, t as DEFAULT_AGENT_ID } from "./session-key-yaI3D3Bl.js";
import { a as resolveAgentDir, n as listAgentIds, o as resolveAgentWorkspaceDir, t as listAgentEntries } from "./agent-scope-config-BfxErZq2.js";
import { r as mutateConfigFileWithRetry } from "./mutate-CxD4vMnm.js";
import "./config-BtNBbhZb.js";
import { Ii as ErrorCodes, Li as errorShape, a as validateAgentsCreateParams, c as validateAgentsFilesListParams, d as validateAgentsUpdateParams, l as validateAgentsFilesSetParams, o as validateAgentsDeleteParams, s as validateAgentsFilesGetParams, t as formatValidationErrors, u as validateAgentsListParams } from "./protocol-BkfNT2Bp.js";
import { l as resolveSessionTranscriptsDirForAgent } from "./paths-DZXdqwOo.js";
import { t as purgeAgentSessionStoreEntries } from "./sessions-Ct4mpWsk.js";
import { i as listAgentsForGateway } from "./session-utils-CmwnszsS.js";
import { a as DEFAULT_MEMORY_FILENAME, c as DEFAULT_USER_FILENAME, f as isWorkspaceSetupCompleted, i as DEFAULT_IDENTITY_FILENAME, l as ensureAgentWorkspace, n as DEFAULT_BOOTSTRAP_FILENAME, o as DEFAULT_SOUL_FILENAME, r as DEFAULT_HEARTBEAT_FILENAME, s as DEFAULT_TOOLS_FILENAME, t as DEFAULT_AGENTS_FILENAME } from "./workspace-BxBAoMrZ.js";
import { n as resolveAgentIdentity } from "./identity-BFeakJ9C.js";
import "./browser-maintenance-rYcusjRF.js";
import { r as mergeIdentityMarkdownContent } from "./identity-file-CUbUqWnp.js";
import { a as pruneAgentConfig, r as findAgentEntryIndex, t as applyAgentConfig } from "./agents.config-DuGhb0p2.js";
import { t as findOverlappingWorkspaceAgentIds } from "./agent-delete-safety-BITqjEp6.js";
import path from "node:path";
import fs from "node:fs/promises";
//#region src/gateway/server-methods/agents-config-mutations.ts
var AgentConfigPreconditionError = class extends Error {
	constructor(kind, agentId) {
		super(kind === "already-exists" ? `agent "${agentId}" already exists` : `agent "${agentId}" not found`);
		this.kind = kind;
		this.agentId = agentId;
		this.name = "AgentConfigPreconditionError";
	}
};
function isConfiguredAgent(cfg, agentId) {
	return findAgentEntryIndex(listAgentEntries(cfg), agentId) >= 0;
}
async function createAgentConfigEntry(params) {
	await mutateConfigFileWithRetry({
		afterWrite: { mode: "auto" },
		mutate: (draft) => {
			if (isConfiguredAgent(draft, params.agentId)) throw new AgentConfigPreconditionError("already-exists", params.agentId);
			const latestNextConfig = applyAgentConfig(draft, {
				agentId: params.agentId,
				name: params.name,
				workspace: params.workspace,
				model: params.model,
				identity: params.identity,
				agentDir: params.agentDir
			});
			Object.assign(draft, latestNextConfig);
		}
	});
}
async function updateAgentConfigEntry(params) {
	await mutateConfigFileWithRetry({
		afterWrite: { mode: "auto" },
		mutate: (draft) => {
			if (!isConfiguredAgent(draft, params.agentId)) throw new AgentConfigPreconditionError("not-found", params.agentId);
			const latestNextConfig = applyAgentConfig(draft, {
				agentId: params.agentId,
				...params.name ? { name: params.name } : {},
				...params.workspace ? { workspace: params.workspace } : {},
				...params.model ? { model: params.model } : {},
				...params.identity ? { identity: params.identity } : {}
			});
			Object.assign(draft, latestNextConfig);
		}
	});
}
async function deleteAgentConfigEntry(params) {
	const committed = await mutateConfigFileWithRetry({
		afterWrite: { mode: "auto" },
		mutate: (draft) => {
			if (!isConfiguredAgent(draft, params.agentId)) throw new AgentConfigPreconditionError("not-found", params.agentId);
			const workspaceDir = resolveAgentWorkspaceDir(draft, params.agentId);
			const agentDir = resolveAgentDir(draft, params.agentId);
			const sessionsDir = resolveSessionTranscriptsDirForAgent(params.agentId);
			const result = pruneAgentConfig(draft, params.agentId);
			Object.assign(draft, result.config);
			return {
				workspaceDir,
				agentDir,
				sessionsDir,
				removedBindings: result.removedBindings
			};
		}
	});
	return {
		nextConfig: committed.nextConfig,
		result: committed.result
	};
}
//#endregion
//#region src/gateway/server-methods/agents.ts
const BOOTSTRAP_FILE_NAMES = [
	DEFAULT_AGENTS_FILENAME,
	DEFAULT_SOUL_FILENAME,
	DEFAULT_TOOLS_FILENAME,
	DEFAULT_IDENTITY_FILENAME,
	DEFAULT_USER_FILENAME,
	DEFAULT_HEARTBEAT_FILENAME,
	DEFAULT_BOOTSTRAP_FILENAME
];
const BOOTSTRAP_FILE_NAMES_POST_ONBOARDING = BOOTSTRAP_FILE_NAMES.filter((name) => name !== DEFAULT_BOOTSTRAP_FILENAME);
const agentsHandlerDeps = {
	root,
	isWorkspaceSetupCompleted
};
const testing = {
	setDepsForTests(overrides) {
		if (overrides.isWorkspaceSetupCompleted) agentsHandlerDeps.isWorkspaceSetupCompleted = overrides.isWorkspaceSetupCompleted;
		if (overrides.root) agentsHandlerDeps.root = overrides.root;
	},
	resetDepsForTests() {
		agentsHandlerDeps.root = root;
		agentsHandlerDeps.isWorkspaceSetupCompleted = isWorkspaceSetupCompleted;
	}
};
const MEMORY_FILE_NAMES = [DEFAULT_MEMORY_FILENAME];
const ALLOWED_FILE_NAMES = new Set([...BOOTSTRAP_FILE_NAMES, ...MEMORY_FILE_NAMES]);
function resolveAgentWorkspaceFileOrRespondError(params, respond, cfg) {
	const rawAgentId = params.agentId;
	const agentId = resolveAgentIdOrError(typeof rawAgentId === "string" || typeof rawAgentId === "number" ? String(rawAgentId) : "", cfg);
	if (!agentId) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown agent id"));
		return null;
	}
	const rawName = params.name;
	const name = (typeof rawName === "string" || typeof rawName === "number" ? String(rawName) : "").trim();
	if (!ALLOWED_FILE_NAMES.has(name)) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unsupported file "${name}"`));
		return null;
	}
	return {
		cfg,
		agentId,
		workspaceDir: resolveAgentWorkspaceDir(cfg, agentId),
		name
	};
}
function isRegularWorkspaceFileStat(stat) {
	const isFile = typeof stat.isFile === "function" ? stat.isFile() : stat.isFile;
	const isSymbolicLink = typeof stat.isSymbolicLink === "function" ? stat.isSymbolicLink() : stat.isSymbolicLink;
	return isFile && !isSymbolicLink && stat.nlink <= 1;
}
async function statWorkspaceFileSafely(workspaceRoot, workspaceDir, name) {
	try {
		const stat = workspaceRoot ? await workspaceRoot.stat(name) : await fs.lstat(path.join(workspaceDir, name));
		if (!isRegularWorkspaceFileStat(stat)) return null;
		return {
			size: stat.size,
			updatedAtMs: Math.floor(stat.mtimeMs)
		};
	} catch {
		if (!workspaceRoot) return null;
		try {
			const stat = await fs.lstat(path.join(workspaceDir, name));
			if (!isRegularWorkspaceFileStat(stat)) return null;
			return {
				size: stat.size,
				updatedAtMs: Math.floor(stat.mtimeMs)
			};
		} catch {
			return null;
		}
	}
}
async function openWorkspaceRootSafely(workspaceDir) {
	try {
		return await agentsHandlerDeps.root(workspaceDir);
	} catch {
		return null;
	}
}
async function listAgentFiles(workspaceDir, options) {
	const files = [];
	const workspaceRoot = await openWorkspaceRootSafely(workspaceDir);
	if (!workspaceRoot) return [...options?.hideBootstrap ? BOOTSTRAP_FILE_NAMES_POST_ONBOARDING : BOOTSTRAP_FILE_NAMES, DEFAULT_MEMORY_FILENAME].map((name) => ({
		name,
		path: path.join(workspaceDir, name),
		missing: true
	}));
	const bootstrapFileNames = options?.hideBootstrap ? BOOTSTRAP_FILE_NAMES_POST_ONBOARDING : BOOTSTRAP_FILE_NAMES;
	for (const name of bootstrapFileNames) {
		const filePath = path.join(workspaceDir, name);
		const meta = await statWorkspaceFileSafely(workspaceRoot, workspaceDir, name);
		if (meta) files.push({
			name,
			path: filePath,
			missing: false,
			size: meta.size,
			updatedAtMs: meta.updatedAtMs
		});
		else files.push({
			name,
			path: filePath,
			missing: true
		});
	}
	const primaryMeta = await statWorkspaceFileSafely(workspaceRoot, workspaceDir, DEFAULT_MEMORY_FILENAME);
	if (primaryMeta) files.push({
		name: DEFAULT_MEMORY_FILENAME,
		path: path.join(workspaceDir, DEFAULT_MEMORY_FILENAME),
		missing: false,
		size: primaryMeta.size,
		updatedAtMs: primaryMeta.updatedAtMs
	});
	else files.push({
		name: DEFAULT_MEMORY_FILENAME,
		path: path.join(workspaceDir, DEFAULT_MEMORY_FILENAME),
		missing: true
	});
	return files;
}
function resolveAgentIdOrError(agentIdRaw, cfg) {
	const agentId = normalizeAgentId(agentIdRaw);
	if (!new Set(listAgentIds(cfg)).has(agentId)) return null;
	return agentId;
}
function sanitizeIdentityLine(value) {
	return value.replace(/\s+/g, " ").trim();
}
function respondInvalidMethodParams(respond, method, errors) {
	respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid ${method} params: ${formatValidationErrors(errors)}`));
}
function respondAgentNotFound(respond, agentId) {
	respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `agent "${agentId}" not found`));
}
function respondAgentConfigPreconditionError(respond, error) {
	if (error.kind === "not-found") {
		respondAgentNotFound(respond, error.agentId);
		return;
	}
	respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `agent "${error.agentId}" already exists`));
}
async function moveToTrashBestEffort(pathname) {
	if (!pathname) return;
	try {
		await fs.access(pathname);
	} catch {
		return;
	}
	try {
		await movePathToTrash(pathname);
	} catch {}
}
function respondWorkspaceFileUnsafe(respond, name) {
	respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unsafe workspace file "${name}"`));
}
function respondWorkspaceFileMissing(params) {
	params.respond(true, {
		agentId: params.agentId,
		workspace: params.workspaceDir,
		file: {
			name: params.name,
			path: params.filePath,
			missing: true
		}
	}, void 0);
}
async function writeWorkspaceFileOrRespond(params) {
	await fs.mkdir(params.workspaceDir, { recursive: true });
	try {
		await (await agentsHandlerDeps.root(params.workspaceDir)).write(params.name, params.content, { encoding: "utf8" });
	} catch (err) {
		if (err instanceof FsSafeError) {
			respondWorkspaceFileUnsafe(params.respond, params.name);
			return false;
		}
		throw err;
	}
	return true;
}
function normalizeIdentityForFile(identity) {
	if (!identity) return;
	const resolved = {
		name: identity.name?.trim() || void 0,
		theme: identity.theme?.trim() || void 0,
		emoji: identity.emoji?.trim() || void 0,
		avatar: identity.avatar?.trim() || void 0
	};
	if (!resolved.name && !resolved.theme && !resolved.emoji && !resolved.avatar) return;
	return resolved;
}
async function readWorkspaceFileContent(workspaceDir, name) {
	try {
		return (await (await agentsHandlerDeps.root(workspaceDir)).read(name, {
			hardlinks: "reject",
			nonBlockingRead: true
		})).buffer.toString("utf-8");
	} catch (err) {
		if (err instanceof FsSafeError && err.code === "not-found") return;
		throw err;
	}
}
async function buildIdentityMarkdownForWrite(params) {
	let baseContent;
	if (params.preferFallbackWorkspaceContent && params.fallbackWorkspaceDir) {
		baseContent = await readWorkspaceFileContent(params.fallbackWorkspaceDir, DEFAULT_IDENTITY_FILENAME);
		if (baseContent === void 0) baseContent = await readWorkspaceFileContent(params.workspaceDir, DEFAULT_IDENTITY_FILENAME);
	} else {
		baseContent = await readWorkspaceFileContent(params.workspaceDir, DEFAULT_IDENTITY_FILENAME);
		if (baseContent === void 0 && params.fallbackWorkspaceDir) baseContent = await readWorkspaceFileContent(params.fallbackWorkspaceDir, DEFAULT_IDENTITY_FILENAME);
	}
	return mergeIdentityMarkdownContent(baseContent, params.identity);
}
async function buildIdentityMarkdownOrRespondUnsafe(params) {
	try {
		return await buildIdentityMarkdownForWrite(params);
	} catch (err) {
		if (err instanceof FsSafeError) {
			respondWorkspaceFileUnsafe(params.respond, DEFAULT_IDENTITY_FILENAME);
			return null;
		}
		throw err;
	}
}
const agentsHandlers = {
	"agents.list": ({ params, respond, context }) => {
		if (!validateAgentsListParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agents.list params: ${formatValidationErrors(validateAgentsListParams.errors)}`));
			return;
		}
		respond(true, listAgentsForGateway(context.getRuntimeConfig()), void 0);
	},
	"agents.create": async ({ params, respond, context }) => {
		if (!validateAgentsCreateParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agents.create params: ${formatValidationErrors(validateAgentsCreateParams.errors)}`));
			return;
		}
		const cfg = context.getRuntimeConfig();
		const rawName = params.name.trim();
		const agentId = normalizeAgentId(rawName);
		if (agentId === "main") {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `"${DEFAULT_AGENT_ID}" is reserved`));
			return;
		}
		if (isConfiguredAgent(cfg, agentId)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `agent "${agentId}" already exists`));
			return;
		}
		const workspaceDir = resolveUserPath(params.workspace.trim());
		const safeName = sanitizeIdentityLine(rawName);
		const model = normalizeOptionalString(params.model);
		const emoji = normalizeOptionalString(params.emoji);
		const avatar = normalizeOptionalString(params.avatar);
		const identity = {
			name: safeName,
			...emoji ? { emoji: sanitizeIdentityLine(emoji) } : {},
			...avatar ? { avatar: sanitizeIdentityLine(avatar) } : {}
		};
		let nextConfig = applyAgentConfig(cfg, {
			agentId,
			name: safeName,
			workspace: workspaceDir,
			model,
			identity
		});
		const agentDir = resolveAgentDir(nextConfig, agentId);
		nextConfig = applyAgentConfig(nextConfig, {
			agentId,
			agentDir
		});
		await ensureAgentWorkspace({
			dir: workspaceDir,
			ensureBootstrapFiles: !Boolean(nextConfig.agents?.defaults?.skipBootstrap),
			skipOptionalBootstrapFiles: nextConfig.agents?.defaults?.skipOptionalBootstrapFiles
		});
		await fs.mkdir(resolveSessionTranscriptsDirForAgent(agentId), { recursive: true });
		const persistedIdentity = normalizeIdentityForFile(resolveAgentIdentity(nextConfig, agentId));
		if (persistedIdentity) {
			const identityContent = await buildIdentityMarkdownOrRespondUnsafe({
				respond,
				workspaceDir,
				identity: persistedIdentity
			});
			if (identityContent === null) return;
			if (!await writeWorkspaceFileOrRespond({
				respond,
				workspaceDir,
				name: "IDENTITY.md",
				content: identityContent
			})) return;
		}
		try {
			await createAgentConfigEntry({
				agentId,
				name: safeName,
				workspace: workspaceDir,
				model,
				identity,
				agentDir
			});
		} catch (error) {
			if (error instanceof AgentConfigPreconditionError) {
				respondAgentConfigPreconditionError(respond, error);
				return;
			}
			throw error;
		}
		respond(true, {
			ok: true,
			agentId,
			name: safeName,
			workspace: workspaceDir,
			model
		}, void 0);
	},
	"agents.update": async ({ params, respond, context }) => {
		if (!validateAgentsUpdateParams(params)) {
			respondInvalidMethodParams(respond, "agents.update", validateAgentsUpdateParams.errors);
			return;
		}
		const cfg = context.getRuntimeConfig();
		const agentId = normalizeAgentId(params.agentId);
		if (!isConfiguredAgent(cfg, agentId)) {
			respondAgentNotFound(respond, agentId);
			return;
		}
		const workspaceDir = typeof params.workspace === "string" && params.workspace.trim() ? resolveUserPath(params.workspace.trim()) : void 0;
		const model = normalizeOptionalString(params.model);
		const emoji = normalizeOptionalString(params.emoji);
		const avatar = normalizeOptionalString(params.avatar);
		const safeName = typeof params.name === "string" && params.name.trim() ? sanitizeIdentityLine(params.name.trim()) : void 0;
		const hasIdentityFields = Boolean(safeName || emoji || avatar);
		const identity = hasIdentityFields ? {
			...safeName ? { name: safeName } : {},
			...emoji ? { emoji: sanitizeIdentityLine(emoji) } : {},
			...avatar ? { avatar: sanitizeIdentityLine(avatar) } : {}
		} : void 0;
		const nextConfig = applyAgentConfig(cfg, {
			agentId,
			...safeName ? { name: safeName } : {},
			...workspaceDir ? { workspace: workspaceDir } : {},
			...model ? { model } : {},
			...identity ? { identity } : {}
		});
		let ensuredWorkspace;
		if (workspaceDir) ensuredWorkspace = await ensureAgentWorkspace({
			dir: workspaceDir,
			ensureBootstrapFiles: !Boolean(nextConfig.agents?.defaults?.skipBootstrap),
			skipOptionalBootstrapFiles: nextConfig.agents?.defaults?.skipOptionalBootstrapFiles
		});
		const persistedIdentity = normalizeIdentityForFile(resolveAgentIdentity(nextConfig, agentId));
		if (persistedIdentity && (workspaceDir || hasIdentityFields)) {
			const identityWorkspaceDir = resolveAgentWorkspaceDir(nextConfig, agentId);
			const previousWorkspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
			const fallbackWorkspaceDir = workspaceDir && identityWorkspaceDir !== previousWorkspaceDir ? previousWorkspaceDir : void 0;
			const identityContent = await buildIdentityMarkdownOrRespondUnsafe({
				respond,
				workspaceDir: identityWorkspaceDir,
				identity: persistedIdentity,
				fallbackWorkspaceDir,
				preferFallbackWorkspaceContent: Boolean(fallbackWorkspaceDir) && ensuredWorkspace?.identityPathCreated === true
			});
			if (identityContent === null) return;
			if (!await writeWorkspaceFileOrRespond({
				respond,
				workspaceDir: identityWorkspaceDir,
				name: "IDENTITY.md",
				content: identityContent
			})) return;
		}
		try {
			await updateAgentConfigEntry({
				agentId,
				...safeName ? { name: safeName } : {},
				...workspaceDir ? { workspace: workspaceDir } : {},
				...model ? { model } : {},
				...identity ? { identity } : {}
			});
		} catch (error) {
			if (error instanceof AgentConfigPreconditionError) {
				respondAgentConfigPreconditionError(respond, error);
				return;
			}
			throw error;
		}
		respond(true, {
			ok: true,
			agentId
		}, void 0);
	},
	"agents.delete": async ({ params, respond, context }) => {
		if (!validateAgentsDeleteParams(params)) {
			respondInvalidMethodParams(respond, "agents.delete", validateAgentsDeleteParams.errors);
			return;
		}
		const cfg = context.getRuntimeConfig();
		const agentId = normalizeAgentId(params.agentId);
		if (agentId === "main") {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `"${DEFAULT_AGENT_ID}" cannot be deleted`));
			return;
		}
		if (!isConfiguredAgent(cfg, agentId)) {
			respondAgentNotFound(respond, agentId);
			return;
		}
		const deleteFiles = typeof params.deleteFiles === "boolean" ? params.deleteFiles : true;
		let committed;
		try {
			committed = await deleteAgentConfigEntry({ agentId });
		} catch (error) {
			if (error instanceof AgentConfigPreconditionError) {
				respondAgentConfigPreconditionError(respond, error);
				return;
			}
			throw error;
		}
		const deleteResult = committed.result;
		if (!deleteResult) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, "agent delete did not commit"));
			return;
		}
		await purgeAgentSessionStoreEntries(cfg, agentId);
		if (deleteFiles) {
			const deleteWorkspace = findOverlappingWorkspaceAgentIds(committed.nextConfig, agentId, deleteResult.workspaceDir).length === 0;
			await Promise.all([
				...deleteWorkspace ? [moveToTrashBestEffort(deleteResult.workspaceDir)] : [],
				moveToTrashBestEffort(deleteResult.agentDir),
				moveToTrashBestEffort(deleteResult.sessionsDir)
			]);
		}
		respond(true, {
			ok: true,
			agentId,
			removedBindings: deleteResult.removedBindings
		}, void 0);
	},
	"agents.files.list": async ({ params, respond, context }) => {
		if (!validateAgentsFilesListParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid agents.files.list params: ${formatValidationErrors(validateAgentsFilesListParams.errors)}`));
			return;
		}
		const cfg = context.getRuntimeConfig();
		const agentId = resolveAgentIdOrError(params.agentId, cfg);
		if (!agentId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "unknown agent id"));
			return;
		}
		const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
		let hideBootstrap = false;
		try {
			hideBootstrap = await agentsHandlerDeps.isWorkspaceSetupCompleted(workspaceDir);
		} catch {}
		respond(true, {
			agentId,
			workspace: workspaceDir,
			files: await listAgentFiles(workspaceDir, { hideBootstrap })
		}, void 0);
	},
	"agents.files.get": async ({ params, respond, context }) => {
		if (!validateAgentsFilesGetParams(params)) {
			respondInvalidMethodParams(respond, "agents.files.get", validateAgentsFilesGetParams.errors);
			return;
		}
		const resolved = resolveAgentWorkspaceFileOrRespondError(params, respond, context.getRuntimeConfig());
		if (!resolved) return;
		const { agentId, workspaceDir, name } = resolved;
		const filePath = path.join(workspaceDir, name);
		let safeRead;
		try {
			safeRead = await (await agentsHandlerDeps.root(workspaceDir)).read(name, {
				hardlinks: "reject",
				nonBlockingRead: true
			});
		} catch (err) {
			if (err instanceof FsSafeError && err.code === "not-found") {
				respondWorkspaceFileMissing({
					respond,
					agentId,
					workspaceDir,
					name,
					filePath
				});
				return;
			}
			if (err instanceof FsSafeError) {
				respondWorkspaceFileUnsafe(respond, name);
				return;
			}
			throw err;
		}
		respond(true, {
			agentId,
			workspace: workspaceDir,
			file: {
				name,
				path: filePath,
				missing: false,
				size: safeRead.stat.size,
				updatedAtMs: Math.floor(safeRead.stat.mtimeMs),
				content: safeRead.buffer.toString("utf-8")
			}
		}, void 0);
	},
	"agents.files.set": async ({ params, respond, context }) => {
		if (!validateAgentsFilesSetParams(params)) {
			respondInvalidMethodParams(respond, "agents.files.set", validateAgentsFilesSetParams.errors);
			return;
		}
		const resolved = resolveAgentWorkspaceFileOrRespondError(params, respond, context.getRuntimeConfig());
		if (!resolved) return;
		const { agentId, workspaceDir, name } = resolved;
		await fs.mkdir(workspaceDir, { recursive: true });
		const filePath = path.join(workspaceDir, name);
		const content = params.content;
		let workspaceRoot;
		try {
			workspaceRoot = await agentsHandlerDeps.root(workspaceDir);
			await workspaceRoot.write(name, content, { encoding: "utf8" });
		} catch (err) {
			if (!(err instanceof FsSafeError)) throw err;
			respondWorkspaceFileUnsafe(respond, name);
			return;
		}
		const meta = await statWorkspaceFileSafely(workspaceRoot, workspaceDir, name);
		respond(true, {
			ok: true,
			agentId,
			workspace: workspaceDir,
			file: {
				name,
				path: filePath,
				missing: false,
				size: meta?.size,
				updatedAtMs: meta?.updatedAtMs,
				content
			}
		}, void 0);
	}
};
//#endregion
export { testing as __testing, testing, agentsHandlers };
