import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { t as createAsyncLock } from "./async-lock-CaiUOILd.js";
import "./archive-CdsVsET0.js";
import "./agent-scope-CudANNo3.js";
import { l as normalizeAgentId } from "./session-key-yaI3D3Bl.js";
import { c as resolveDefaultAgentId, n as listAgentIds, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import { m as writeJson, t as readDurableJsonFile } from "./json-files-za1pmDfK.js";
import "./archive-CBe_wA_B.js";
import { r as mutateConfigFileWithRetry } from "./mutate-CxD4vMnm.js";
import "./config-BtNBbhZb.js";
import { Ii as ErrorCodes, Li as errorShape, an as validateSkillsStatusParams, cn as validateSkillsUploadChunkParams, in as validateSkillsSearchParams, ln as validateSkillsUploadCommitParams, nn as validateSkillsDetailParams, on as validateSkillsUpdateParams, rn as validateSkillsInstallParams, sn as validateSkillsUploadBeginParams, t as formatValidationErrors, tn as validateSkillsBinsParams } from "./protocol-BkfNT2Bp.js";
import { n as normalizeSecretInput } from "./normalize-secret-input-CsdRhsMj.js";
import { n as redactConfigObject } from "./redact-snapshot-BxUqpm5K.js";
import { o as loadWorkspaceSkillEntries } from "./workspace-C9EyWtKF.js";
import "./skills-AlUGzl4g.js";
import { t as canExecRequestNode } from "./exec-defaults-19HKPhQW.js";
import { t as listAgentWorkspaceDirs } from "./workspace-dirs-CRpv5yS0.js";
import { t as getRemoteSkillEligibility } from "./skills-remote-D26P_2EB.js";
import { t as buildWorkspaceSkillStatus } from "./skills-status-DzhVTDnJ.js";
import { s as fetchClawHubSkillDetail } from "./clawhub-5JCyPoz9.js";
import { a as updateSkillsFromClawHub, c as validateRequestedSkillSlug, r as searchSkillsFromClawHub, s as installSkillArchiveFromPath, t as installSkillFromClawHub } from "./skills-clawhub-XXxn7XGS.js";
import { t as installSkill } from "./skills-install-CIQ-pUJb.js";
import { createReadStream } from "node:fs";
import path from "node:path";
import fs$1 from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
//#region src/gateway/server-methods/skills-config-mutations.ts
async function updateSkillConfigEntry(params) {
	return (await mutateConfigFileWithRetry({
		afterWrite: { mode: "auto" },
		mutate: (draft) => {
			const skills = draft.skills ? { ...draft.skills } : {};
			const entries = skills.entries ? { ...skills.entries } : {};
			const current = entries[params.skillKey] ? { ...entries[params.skillKey] } : {};
			if (typeof params.enabled === "boolean") current.enabled = params.enabled;
			if (typeof params.apiKey === "string") {
				const trimmed = normalizeSecretInput(params.apiKey);
				if (trimmed === "__OPENCLAW_REDACTED__") {} else if (trimmed) current.apiKey = trimmed;
				else delete current.apiKey;
			}
			if (params.env && typeof params.env === "object") {
				const nextEnv = current.env ? { ...current.env } : {};
				for (const [key, value] of Object.entries(params.env)) {
					const trimmedKey = key.trim();
					if (!trimmedKey) continue;
					const trimmedVal = value.trim();
					if (trimmedVal === "__OPENCLAW_REDACTED__") continue;
					if (!trimmedVal) delete nextEnv[trimmedKey];
					else nextEnv[trimmedKey] = trimmedVal;
				}
				current.env = nextEnv;
			}
			entries[params.skillKey] = current;
			skills.entries = entries;
			draft.skills = skills;
			return current;
		}
	})).result ?? {};
}
const MAX_SKILL_UPLOAD_BASE64_LENGTH = Math.ceil(4 * 1024 * 1024 / 3) * 4;
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const UPLOAD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const locks = /* @__PURE__ */ new Map();
var SkillUploadRequestError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "SkillUploadRequestError";
	}
};
async function withLock(key, fn) {
	let entry = locks.get(key);
	if (!entry) {
		entry = {
			lock: createAsyncLock(),
			references: 0
		};
		locks.set(key, entry);
	}
	entry.references += 1;
	try {
		return await entry.lock(fn);
	} finally {
		entry.references -= 1;
		if (entry.references === 0) locks.delete(key);
	}
}
function normalizeSkillUploadSha256(value) {
	if (value === void 0) return;
	const normalized = value.trim().toLowerCase();
	if (!SHA256_PATTERN.test(normalized)) throw new SkillUploadRequestError("invalid sha256");
	return normalized;
}
function validateUploadId(uploadId) {
	const normalized = uploadId.trim();
	if (!UPLOAD_ID_PATTERN.test(normalized)) throw new SkillUploadRequestError("invalid uploadId");
	return normalized;
}
function isUploadId(value) {
	return UPLOAD_ID_PATTERN.test(value);
}
function validateSizeBytes(sizeBytes) {
	if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1) throw new SkillUploadRequestError("invalid sizeBytes");
	if (sizeBytes > 268435456) throw new SkillUploadRequestError("skill archive exceeds maximum upload size");
	return sizeBytes;
}
function validateUploadSlug(slug) {
	try {
		return validateRequestedSkillSlug(slug);
	} catch (err) {
		throw new SkillUploadRequestError(formatErrorMessage(err));
	}
}
function validateOffset(offset) {
	if (!Number.isSafeInteger(offset) || offset < 0) throw new SkillUploadRequestError("invalid offset");
	return offset;
}
function validateIdempotencyKey(value) {
	const normalized = value?.trim();
	if (!normalized) return;
	if (normalized.length > 2048) throw new SkillUploadRequestError("idempotencyKey is too long");
	return normalized;
}
function hashText(value) {
	return createHash("sha256").update(value).digest("hex");
}
function resolveUploadsRoot(rootDir) {
	return path.resolve(rootDir ?? path.join(resolveStateDir(), "tmp", "skill-uploads"));
}
function resolveUploadDir(rootDir, uploadId) {
	return path.join(rootDir, validateUploadId(uploadId));
}
function resolveMetadataPath(rootDir, uploadId) {
	return path.join(resolveUploadDir(rootDir, uploadId), "metadata.json");
}
function resolveArchivePath(rootDir, uploadId) {
	return path.join(resolveUploadDir(rootDir, uploadId), "archive.zip");
}
function resolveIdempotencyPath(rootDir, keyHash) {
	return path.join(rootDir, "idempotency", `${keyHash}.json`);
}
function estimateBase64DecodedBytes(value) {
	const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
	return value.length / 4 * 3 - padding;
}
function decodeBase64Chunk(dataBase64) {
	const normalized = dataBase64.trim();
	if (!normalized || normalized.length % 4 !== 0 || !BASE64_PATTERN.test(normalized)) throw new SkillUploadRequestError("invalid dataBase64");
	if (normalized.length > MAX_SKILL_UPLOAD_BASE64_LENGTH) throw new SkillUploadRequestError("upload chunk exceeds maximum size");
	if (estimateBase64DecodedBytes(normalized) > 4194304) throw new SkillUploadRequestError("upload chunk exceeds maximum size");
	const decoded = Buffer.from(normalized, "base64");
	if (decoded.length < 1) throw new SkillUploadRequestError("empty upload chunk");
	if (decoded.length > 4194304) throw new SkillUploadRequestError("upload chunk exceeds maximum size");
	return decoded;
}
async function assertNotExpired(rootDir, record, now) {
	if (record.expiresAt <= now) {
		await removeRecordFiles(rootDir, record);
		throw new SkillUploadRequestError("upload has expired");
	}
}
async function computeFileSha256(filePath) {
	const digest = createHash("sha256");
	for await (const chunk of createReadStream(filePath)) digest.update(chunk);
	return digest.digest("hex");
}
async function readRecord(rootDir, uploadId) {
	const record = await readDurableJsonFile(resolveMetadataPath(rootDir, uploadId));
	if (!record || record.version !== 1 || record.uploadId !== uploadId) throw new SkillUploadRequestError(`upload not found: ${uploadId}`);
	return {
		...record,
		archivePath: resolveArchivePath(rootDir, uploadId)
	};
}
async function readRecordIfPresent(rootDir, uploadId) {
	const record = await readDurableJsonFile(resolveMetadataPath(rootDir, uploadId));
	if (!record || record.version !== 1 || record.uploadId !== uploadId) return null;
	return {
		...record,
		archivePath: resolveArchivePath(rootDir, uploadId)
	};
}
async function writeRecord(rootDir, record) {
	await writeJson(resolveMetadataPath(rootDir, record.uploadId), record, {
		mode: 384,
		dirMode: 448,
		trailingNewline: true
	});
}
async function removeUploadDir(rootDir, uploadId) {
	await fs$1.rm(resolveUploadDir(rootDir, uploadId), {
		recursive: true,
		force: true
	});
}
async function removeRecordFiles(rootDir, record) {
	await removeUploadDir(rootDir, record.uploadId);
	if (record.idempotencyKeyHash) await fs$1.rm(resolveIdempotencyPath(rootDir, record.idempotencyKeyHash), { force: true });
}
async function listUploadIds(rootDir) {
	return (await fs$1.readdir(rootDir, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isDirectory() && isUploadId(entry.name)).map((entry) => entry.name);
}
async function cleanupExpiredUploads(rootDir, nowMs, excludeUploadId) {
	for (const uploadId of await listUploadIds(rootDir)) {
		if (uploadId === excludeUploadId) continue;
		await withLock(`${rootDir}:upload:${uploadId}`, async () => {
			const record = await readRecordIfPresent(rootDir, uploadId).catch(() => null);
			if (record && record.expiresAt <= nowMs) await removeRecordFiles(rootDir, record);
		});
	}
}
async function countActiveUploads(rootDir, nowMs) {
	let count = 0;
	for (const uploadId of await listUploadIds(rootDir)) {
		const record = await readRecordIfPresent(rootDir, uploadId).catch(() => null);
		if (record && record.expiresAt > nowMs) count += 1;
	}
	return count;
}
async function writeArchiveChunk(params) {
	const handle = await fs$1.open(params.archivePath, "r+");
	try {
		await handle.truncate(params.offset);
		let written = 0;
		while (written < params.decoded.length) {
			const result = await handle.write(params.decoded, written, params.decoded.length - written, params.offset + written);
			if (result.bytesWritten <= 0) throw new Error("failed to write upload chunk");
			written += result.bytesWritten;
		}
		await handle.sync();
		await params.afterSync();
	} finally {
		await handle.close().catch(() => void 0);
	}
}
async function readCommittedRecord(rootDir, uploadId, nowMs) {
	const record = await readRecord(rootDir, uploadId);
	await assertNotExpired(rootDir, record, nowMs);
	if (!record.committed) throw new SkillUploadRequestError("upload is not committed");
	if (!record.actualSha256) throw new SkillUploadRequestError("committed upload is missing sha256");
	const stat = await fs$1.stat(record.archivePath).catch(() => null);
	if (!stat || stat.size !== record.sizeBytes) throw new SkillUploadRequestError("uploaded archive is missing or incomplete");
	return record;
}
function createSkillUploadStore(options) {
	const rootDir = resolveUploadsRoot(options?.rootDir);
	const now = options?.now ?? Date.now;
	const ttlMs = options?.ttlMs ?? 36e5;
	return {
		rootDir,
		async begin(params) {
			return await withLock(`${rootDir}:begin`, async () => {
				await cleanupExpiredUploads(rootDir, now());
				if (params.kind !== "skill-archive") throw new SkillUploadRequestError("unsupported upload kind");
				const slug = validateUploadSlug(params.slug);
				const sizeBytes = validateSizeBytes(params.sizeBytes);
				const sha256 = normalizeSkillUploadSha256(params.sha256);
				const force = params.force === true;
				const idempotencyKey = validateIdempotencyKey(params.idempotencyKey);
				const keyHash = idempotencyKey ? hashText(idempotencyKey) : void 0;
				if (keyHash) {
					const existing = await readDurableJsonFile(resolveIdempotencyPath(rootDir, keyHash));
					if (existing) {
						if (existing.kind !== params.kind || existing.slug !== slug || existing.force !== force || existing.sizeBytes !== sizeBytes || existing.sha256 !== sha256) throw new SkillUploadRequestError("idempotencyKey conflicts with a different upload");
						const existingUploadId = validateUploadId(existing.uploadId);
						const activeExisting = await withLock(`${rootDir}:upload:${existingUploadId}`, async () => {
							const record = await readRecordIfPresent(rootDir, existingUploadId);
							if (record && record.expiresAt > now()) return {
								uploadId: record.uploadId,
								receivedBytes: record.receivedBytes,
								expiresAt: record.expiresAt
							};
							if (record) await removeRecordFiles(rootDir, record);
							else await removeUploadDir(rootDir, existingUploadId);
							return null;
						});
						if (activeExisting) return activeExisting;
					}
				}
				if (await countActiveUploads(rootDir, now()) >= 32) throw new SkillUploadRequestError("too many active skill uploads");
				const uploadId = randomUUID();
				const uploadDir = resolveUploadDir(rootDir, uploadId);
				const archivePath = resolveArchivePath(rootDir, uploadId);
				const createdAt = now();
				const record = {
					version: 1,
					kind: params.kind,
					uploadId,
					slug,
					force,
					sizeBytes,
					...sha256 ? { sha256 } : {},
					receivedBytes: 0,
					archivePath,
					createdAt,
					expiresAt: createdAt + ttlMs,
					committed: false,
					...keyHash ? { idempotencyKeyHash: keyHash } : {}
				};
				await fs$1.mkdir(uploadDir, {
					recursive: true,
					mode: 448
				});
				await fs$1.writeFile(archivePath, Buffer.alloc(0), { mode: 384 });
				await writeRecord(rootDir, record);
				if (keyHash) {
					const idem = {
						version: 1,
						keyHash,
						uploadId,
						kind: params.kind,
						slug,
						force,
						sizeBytes,
						...sha256 ? { sha256 } : {}
					};
					await writeJson(resolveIdempotencyPath(rootDir, keyHash), idem, {
						mode: 384,
						dirMode: 448,
						trailingNewline: true
					});
				}
				return {
					uploadId,
					receivedBytes: 0,
					expiresAt: record.expiresAt
				};
			});
		},
		async chunk(params) {
			const uploadId = validateUploadId(params.uploadId);
			const offset = validateOffset(params.offset);
			const decoded = decodeBase64Chunk(params.dataBase64);
			await cleanupExpiredUploads(rootDir, now(), uploadId);
			return await withLock(`${rootDir}:upload:${uploadId}`, async () => {
				const record = await readRecord(rootDir, uploadId);
				await assertNotExpired(rootDir, record, now());
				if (record.committed) throw new SkillUploadRequestError("upload is already committed");
				if (offset !== record.receivedBytes) throw new SkillUploadRequestError(`upload offset mismatch: expected ${record.receivedBytes}, got ${offset}`);
				const nextSize = record.receivedBytes + decoded.length;
				if (nextSize > record.sizeBytes) throw new SkillUploadRequestError("upload chunk exceeds declared size");
				const nextRecord = {
					...record,
					receivedBytes: nextSize
				};
				await writeArchiveChunk({
					archivePath: record.archivePath,
					offset: record.receivedBytes,
					decoded,
					afterSync: async () => {
						await writeRecord(rootDir, nextRecord);
					}
				});
				return {
					uploadId,
					receivedBytes: nextRecord.receivedBytes,
					expiresAt: nextRecord.expiresAt
				};
			});
		},
		async commit(params) {
			const uploadId = validateUploadId(params.uploadId);
			const requestedSha = normalizeSkillUploadSha256(params.sha256);
			return await withLock(`${rootDir}:upload:${uploadId}`, async () => {
				const record = await readRecord(rootDir, uploadId);
				await assertNotExpired(rootDir, record, now());
				if (record.committed) {
					if (!record.actualSha256) throw new SkillUploadRequestError("committed upload is missing sha256");
					if (requestedSha && requestedSha !== record.actualSha256) throw new SkillUploadRequestError("upload sha256 mismatch");
					return {
						uploadId,
						receivedBytes: record.receivedBytes,
						sha256: record.actualSha256,
						expiresAt: record.expiresAt
					};
				}
				if (record.receivedBytes !== record.sizeBytes) throw new SkillUploadRequestError(`upload size mismatch: expected ${record.sizeBytes}, got ${record.receivedBytes}`);
				const stat = await fs$1.stat(record.archivePath).catch(() => null);
				if (!stat || stat.size !== record.sizeBytes) throw new SkillUploadRequestError("uploaded archive is missing or incomplete");
				if (record.sha256 && requestedSha && record.sha256 !== requestedSha) throw new SkillUploadRequestError("upload sha256 does not match begin sha256");
				const actualSha256 = await computeFileSha256(record.archivePath);
				const expectedSha = requestedSha ?? record.sha256;
				if (expectedSha && expectedSha !== actualSha256) throw new SkillUploadRequestError("upload sha256 mismatch");
				const nextRecord = {
					...record,
					sha256: record.sha256 ?? requestedSha ?? actualSha256,
					actualSha256,
					committed: true,
					committedAt: now()
				};
				await writeRecord(rootDir, nextRecord);
				return {
					uploadId,
					receivedBytes: nextRecord.receivedBytes,
					sha256: actualSha256,
					expiresAt: nextRecord.expiresAt
				};
			});
		},
		async withCommittedUpload(uploadIdRaw, action) {
			const uploadId = validateUploadId(uploadIdRaw);
			return await withLock(`${rootDir}:upload:${uploadId}`, async () => {
				const record = await readCommittedRecord(rootDir, uploadId, now());
				return await action(record, { remove: async () => {
					await removeRecordFiles(rootDir, record);
				} });
			});
		},
		async remove(uploadIdRaw) {
			const uploadId = validateUploadId(uploadIdRaw);
			await withLock(`${rootDir}:upload:${uploadId}`, async () => {
				const record = await readDurableJsonFile(resolveMetadataPath(rootDir, uploadId));
				if (record && record.version === 1 && record.uploadId === uploadId) await removeRecordFiles(rootDir, record);
				else await removeUploadDir(rootDir, uploadId);
			});
		}
	};
}
const defaultSkillUploadStore = createSkillUploadStore();
//#endregion
//#region src/gateway/server-methods/skills-upload.ts
const UPLOADED_SKILL_ARCHIVES_DISABLED_MESSAGE = "Uploaded skill archive installs are disabled by skills.install.allowUploadedArchives";
function areUploadedSkillArchivesEnabled(config) {
	return config.skills?.install?.allowUploadedArchives === true;
}
function uploadErrorShape(prefix, errors) {
	return errorShape(ErrorCodes.INVALID_REQUEST, `${prefix}: ${formatValidationErrors(errors)}`);
}
function mapUploadError(err) {
	if (err instanceof SkillUploadRequestError) return errorShape(ErrorCodes.INVALID_REQUEST, err.message);
	return errorShape(ErrorCodes.UNAVAILABLE, formatErrorMessage(err));
}
function uploadInstallFailureErrorCode(failureKind) {
	return failureKind === "invalid-request" ? ErrorCodes.INVALID_REQUEST : ErrorCodes.UNAVAILABLE;
}
const skillsUploadHandlers = {
	"skills.upload.begin": makeUploadHandler("skills.upload.begin", validateSkillsUploadBeginParams, (params) => defaultSkillUploadStore.begin(params)),
	"skills.upload.chunk": makeUploadHandler("skills.upload.chunk", validateSkillsUploadChunkParams, (params) => defaultSkillUploadStore.chunk(params)),
	"skills.upload.commit": makeUploadHandler("skills.upload.commit", validateSkillsUploadCommitParams, (params) => defaultSkillUploadStore.commit(params))
};
function makeUploadHandler(name, validator, action) {
	return async ({ params, respond, context }) => {
		if (!areUploadedSkillArchivesEnabled(context.getRuntimeConfig())) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, UPLOADED_SKILL_ARCHIVES_DISABLED_MESSAGE));
			return;
		}
		if (!validator(params)) {
			respond(false, void 0, uploadErrorShape(`invalid ${name} params`, validator.errors));
			return;
		}
		try {
			respond(true, await action(params), void 0);
		} catch (err) {
			respond(false, void 0, mapUploadError(err));
		}
	};
}
async function installUploadedSkillArchive(params) {
	const store = params.store ?? defaultSkillUploadStore;
	if (!areUploadedSkillArchivesEnabled(params.context.getRuntimeConfig())) return {
		ok: false,
		error: UPLOADED_SKILL_ARCHIVES_DISABLED_MESSAGE,
		errorCode: ErrorCodes.UNAVAILABLE
	};
	try {
		const requestedSlug = validateRequestedSkillSlug(params.slug);
		const requestedSha = normalizeSkillUploadSha256(params.sha256);
		return await store.withCommittedUpload(params.uploadId, async (record, upload) => {
			const rejectInvalid = async (error) => {
				await upload.remove().catch(() => void 0);
				return {
					ok: false,
					error,
					errorCode: ErrorCodes.INVALID_REQUEST
				};
			};
			if (record.kind !== "skill-archive") return await rejectInvalid("unsupported upload kind");
			if (record.slug !== requestedSlug) return await rejectInvalid("install slug does not match upload slug");
			if (record.force !== params.force) return await rejectInvalid("install force does not match upload force");
			if (requestedSha && requestedSha !== record.actualSha256) return await rejectInvalid("install sha256 does not match uploaded archive");
			if (!record.actualSha256) return await rejectInvalid("committed upload is missing sha256");
			const install = await installSkillArchiveFromPath({
				archivePath: record.archivePath,
				workspaceDir: params.workspaceDir,
				slug: record.slug,
				force: record.force,
				timeoutMs: params.timeoutMs,
				logger: params.context.logGateway,
				scan: {
					installId: "upload",
					origin: "skill-upload"
				}
			});
			if (!install.ok) {
				const errorCode = uploadInstallFailureErrorCode(install.failureKind);
				if (install.failureKind === "invalid-request") await upload.remove().catch(() => void 0);
				return {
					ok: false,
					error: install.error,
					errorCode
				};
			}
			await upload.remove().catch(() => void 0);
			return {
				ok: true,
				message: `Installed ${record.slug}`,
				stdout: "",
				stderr: "",
				code: 0,
				slug: record.slug,
				targetDir: install.targetDir,
				sha256: record.actualSha256
			};
		});
	} catch (err) {
		if (err instanceof SkillUploadRequestError) return {
			ok: false,
			error: err.message,
			errorCode: ErrorCodes.INVALID_REQUEST
		};
		const error = formatErrorMessage(err);
		if (error.startsWith("Invalid skill slug")) return {
			ok: false,
			error,
			errorCode: ErrorCodes.INVALID_REQUEST
		};
		return {
			ok: false,
			error,
			errorCode: ErrorCodes.UNAVAILABLE
		};
	}
}
//#endregion
//#region src/gateway/server-methods/skills.ts
function collectSkillBins(entries) {
	const bins = /* @__PURE__ */ new Set();
	for (const entry of entries) {
		const required = entry.metadata?.requires?.bins ?? [];
		const anyBins = entry.metadata?.requires?.anyBins ?? [];
		const install = entry.metadata?.install ?? [];
		for (const bin of required) {
			const trimmed = bin.trim();
			if (trimmed) bins.add(trimmed);
		}
		for (const bin of anyBins) {
			const trimmed = bin.trim();
			if (trimmed) bins.add(trimmed);
		}
		for (const spec of install) {
			const specBins = spec?.bins ?? [];
			for (const bin of specBins) {
				const trimmed = normalizeOptionalString(bin) ?? "";
				if (trimmed) bins.add(trimmed);
			}
		}
	}
	return [...bins].toSorted();
}
const skillsHandlers = {
	...skillsUploadHandlers,
	"skills.status": ({ params, respond, context }) => {
		if (!validateSkillsStatusParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid skills.status params: ${formatValidationErrors(validateSkillsStatusParams.errors)}`));
			return;
		}
		const cfg = context.getRuntimeConfig();
		const agentIdRaw = normalizeOptionalString(params?.agentId) ?? "";
		const agentId = agentIdRaw ? normalizeAgentId(agentIdRaw) : resolveDefaultAgentId(cfg);
		if (agentIdRaw) {
			if (!listAgentIds(cfg).includes(agentId)) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unknown agent id "${agentIdRaw}"`));
				return;
			}
		}
		respond(true, buildWorkspaceSkillStatus(resolveAgentWorkspaceDir(cfg, agentId), {
			config: cfg,
			eligibility: { remote: getRemoteSkillEligibility({ advertiseExecNode: canExecRequestNode({
				cfg,
				agentId
			}) }) }
		}), void 0);
	},
	"skills.bins": ({ params, respond, context }) => {
		if (!validateSkillsBinsParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid skills.bins params: ${formatValidationErrors(validateSkillsBinsParams.errors)}`));
			return;
		}
		const cfg = context.getRuntimeConfig();
		const workspaceDirs = listAgentWorkspaceDirs(cfg);
		const bins = /* @__PURE__ */ new Set();
		for (const workspaceDir of workspaceDirs) {
			const entries = loadWorkspaceSkillEntries(workspaceDir, { config: cfg });
			for (const bin of collectSkillBins(entries)) bins.add(bin);
		}
		respond(true, { bins: [...bins].toSorted() }, void 0);
	},
	"skills.search": async ({ params, respond }) => {
		if (!validateSkillsSearchParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid skills.search params: ${formatValidationErrors(validateSkillsSearchParams.errors)}`));
			return;
		}
		try {
			respond(true, { results: await searchSkillsFromClawHub({
				query: params.query,
				limit: params.limit
			}) }, void 0);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatErrorMessage(err)));
		}
	},
	"skills.detail": async ({ params, respond }) => {
		if (!validateSkillsDetailParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid skills.detail params: ${formatValidationErrors(validateSkillsDetailParams.errors)}`));
			return;
		}
		try {
			respond(true, await fetchClawHubSkillDetail({ slug: params.slug }), void 0);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, formatErrorMessage(err)));
		}
	},
	"skills.install": async ({ params, respond, context }) => {
		if (!validateSkillsInstallParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid skills.install params: ${formatValidationErrors(validateSkillsInstallParams.errors)}`));
			return;
		}
		const cfg = context.getRuntimeConfig();
		const workspaceDirRaw = resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg));
		if (params && typeof params === "object" && "source" in params && params.source === "clawhub") {
			const p = params;
			const result = await installSkillFromClawHub({
				workspaceDir: workspaceDirRaw,
				slug: p.slug,
				version: p.version,
				force: Boolean(p.force)
			});
			respond(result.ok, result.ok ? {
				ok: true,
				message: `Installed ${result.slug}@${result.version}`,
				stdout: "",
				stderr: "",
				code: 0,
				slug: result.slug,
				version: result.version,
				targetDir: result.targetDir
			} : result, result.ok ? void 0 : errorShape(ErrorCodes.UNAVAILABLE, result.error));
			return;
		}
		if (params && typeof params === "object" && "source" in params && params.source === "upload") {
			const p = params;
			const result = await installUploadedSkillArchive({
				uploadId: p.uploadId,
				slug: p.slug,
				force: Boolean(p.force),
				sha256: p.sha256,
				timeoutMs: p.timeoutMs,
				workspaceDir: workspaceDirRaw,
				context
			});
			respond(result.ok, result, result.ok ? void 0 : errorShape(result.errorCode, result.error));
			return;
		}
		const p = params;
		const result = await installSkill({
			workspaceDir: workspaceDirRaw,
			skillName: p.name,
			installId: p.installId,
			dangerouslyForceUnsafeInstall: p.dangerouslyForceUnsafeInstall,
			timeoutMs: p.timeoutMs,
			config: cfg
		});
		respond(result.ok, result, result.ok ? void 0 : errorShape(ErrorCodes.UNAVAILABLE, result.message));
	},
	"skills.update": async ({ params, respond, context }) => {
		if (!validateSkillsUpdateParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid skills.update params: ${formatValidationErrors(validateSkillsUpdateParams.errors)}`));
			return;
		}
		if (params && typeof params === "object" && "source" in params && params.source === "clawhub") {
			const p = params;
			if (!p.slug && !p.all) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "clawhub skills.update requires \"slug\" or \"all\""));
				return;
			}
			if (p.slug && p.all) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "clawhub skills.update accepts either \"slug\" or \"all\", not both"));
				return;
			}
			const cfg = context.getRuntimeConfig();
			const results = await updateSkillsFromClawHub({
				workspaceDir: resolveAgentWorkspaceDir(cfg, resolveDefaultAgentId(cfg)),
				slug: p.slug
			});
			const errors = results.filter((result) => !result.ok);
			respond(errors.length === 0, {
				ok: errors.length === 0,
				skillKey: p.slug ?? "*",
				config: {
					source: "clawhub",
					results
				}
			}, errors.length === 0 ? void 0 : errorShape(ErrorCodes.UNAVAILABLE, errors.map((result) => result.error).join("; ")));
			return;
		}
		const p = params;
		const updated = await updateSkillConfigEntry(p);
		respond(true, {
			ok: true,
			skillKey: p.skillKey,
			config: redactConfigObject(updated)
		}, void 0);
	}
};
//#endregion
export { skillsHandlers };
