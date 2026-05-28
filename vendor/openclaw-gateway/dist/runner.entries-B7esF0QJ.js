import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString, o as normalizeNullableString } from "./string-coerce-DKw2K5wM.js";
import { n as isAbortError } from "./unhandled-rejections-uJ1-s-X0.js";
import { l as normalizeStringEntries } from "./string-normalization-B8G0vlWE.js";
import { m as FsSafeError } from "./path-BlG8lhgR.js";
import { E as pathExists, b as assertNoWindowsNetworkPath, r as writeExternalFileWithinRoot, w as safeFileURLToPath } from "./fs-safe-JUdtLZkh.js";
import { r as openLocalFileSafely } from "./secure-temp-dir-XAWcZnE2.js";
import { n as resolvePreferredOpenClawTmpDir } from "./tmp-openclaw-dir-C60hWKdY.js";
import { a as shouldLogVerbose, r as logVerbose } from "./globals-DZ-ifL5z.js";
import { i as runExec } from "./exec-Db1qwHgx.js";
import "./local-file-access-CBe_wA_B.js";
import { c as kindFromMime, i as getFileExtension, n as detectMime, o as isAudioFileName } from "./mime-DppuT-pZ.js";
import { C as runFfmpeg } from "./media-services-rb2QLp-y.js";
import { i as mergeModelProviderRequestOverrides, l as sanitizeConfiguredModelProviderRequest, u as sanitizeConfiguredProviderRequest } from "./provider-request-config-CVigAzJO.js";
import { i as readRemoteMediaBuffer, n as MediaFetchError } from "./fetch-C_mdbFEd.js";
import { r as mergeInboundPathRoots, t as isInboundPathAllowed } from "./inbound-path-policy-DEbcUBWg.js";
import { a as getDefaultMediaLocalRoots } from "./local-roots-D6qfvE07.js";
import { n as normalizeMediaProviderId, t as normalizeMediaExecutionProviderId } from "./provider-id-G438zoYW.js";
import { t as describeImageWithModel } from "./image-runtime-DJQhxkgx.js";
import { c as DEFAULT_VIDEO_MAX_BASE64_BYTES, d as getMediaUnderstandingProvider, l as MIN_AUDIO_FILE_BYTES, n as DEFAULT_MAX_BYTES, s as DEFAULT_TIMEOUT_SECONDS, t as CLI_OUTPUT_MAX_BUFFER } from "./defaults.constants-CQe_3Ls7.js";
import { a as resolvePrompt, n as resolveMaxBytes, r as resolveMaxChars, s as resolveTimeoutMs } from "./resolve-D2ot8x6-.js";
import { n as providerOperationRetryConfig } from "./operation-retry-Cow5KcQT.js";
import { t as applyTemplate } from "./templating-CLmjS51i.js";
import { a as extractImageContentFromSource, s as normalizeMimeType } from "./input-files-DUIGG_x6.js";
import { t as buildRandomTempFilePath } from "./temp-download-Bhn6iuO_.js";
import "./temp-path-CHSPBUGU.js";
import { n as executeWithApiKeyRotation, t as collectProviderApiKeysForExecution } from "./api-key-rotation-CE0gTMdu.js";
import { i as resolveProxyFetchFromEnv } from "./proxy-fetch-DRyJFRgA.js";
import path from "node:path";
import fs from "node:fs/promises";
//#region src/media-understanding/attachments.normalize.ts
function normalizeAttachmentPath(raw) {
	const value = normalizeOptionalString(raw);
	if (!value) return;
	if (value.startsWith("file://")) try {
		return safeFileURLToPath(value);
	} catch {
		return;
	}
	try {
		assertNoWindowsNetworkPath(value, "Attachment path");
	} catch {
		return;
	}
	return value;
}
function normalizeAttachments(ctx) {
	const pathsFromArray = Array.isArray(ctx.MediaPaths) ? ctx.MediaPaths : void 0;
	const urlsFromArray = Array.isArray(ctx.MediaUrls) ? ctx.MediaUrls : void 0;
	const typesFromArray = Array.isArray(ctx.MediaTypes) ? ctx.MediaTypes : void 0;
	const transcribedIndexes = new Set(Array.isArray(ctx.MediaTranscribedIndexes) ? ctx.MediaTranscribedIndexes.filter((index) => Number.isInteger(index) && index >= 0) : []);
	const resolveMime = (count, index) => {
		const typeHint = normalizeOptionalString(typesFromArray?.[index]);
		if (typeHint) return typeHint;
		return count === 1 ? ctx.MediaType : void 0;
	};
	if (pathsFromArray && pathsFromArray.length > 0) {
		const count = pathsFromArray.length;
		const urls = urlsFromArray && urlsFromArray.length > 0 ? urlsFromArray : void 0;
		return pathsFromArray.map((value, index) => ({
			path: normalizeOptionalString(value),
			url: urls?.[index] ?? ctx.MediaUrl,
			mime: resolveMime(count, index),
			index,
			alreadyTranscribed: transcribedIndexes.has(index)
		})).filter((entry) => Boolean(entry.path ?? normalizeOptionalString(entry.url)));
	}
	if (urlsFromArray && urlsFromArray.length > 0) {
		const count = urlsFromArray.length;
		return urlsFromArray.map((value, index) => ({
			path: void 0,
			url: normalizeOptionalString(value),
			mime: resolveMime(count, index),
			index,
			alreadyTranscribed: transcribedIndexes.has(index)
		})).filter((entry) => Boolean(entry.url));
	}
	const pathValue = normalizeOptionalString(ctx.MediaPath);
	const url = normalizeOptionalString(ctx.MediaUrl);
	if (!pathValue && !url) return [];
	return [{
		path: pathValue || void 0,
		url: url || void 0,
		mime: ctx.MediaType,
		index: 0,
		alreadyTranscribed: transcribedIndexes.has(0)
	}];
}
function resolveAttachmentKind(attachment) {
	const kind = kindFromMime(attachment.mime);
	if (kind === "image" || kind === "audio" || kind === "video") return kind;
	const ext = getFileExtension(attachment.path ?? attachment.url);
	if (!ext) return "unknown";
	if ([
		".mp4",
		".mov",
		".mkv",
		".webm",
		".avi",
		".m4v"
	].includes(ext)) return "video";
	if (isAudioFileName(attachment.path ?? attachment.url)) return "audio";
	if ([
		".png",
		".jpg",
		".jpeg",
		".webp",
		".gif",
		".bmp",
		".tiff",
		".tif"
	].includes(ext)) return "image";
	return "unknown";
}
function isVideoAttachment(attachment) {
	return resolveAttachmentKind(attachment) === "video";
}
function isAudioAttachment(attachment) {
	return resolveAttachmentKind(attachment) === "audio";
}
function isImageAttachment(attachment) {
	return resolveAttachmentKind(attachment) === "image";
}
//#endregion
//#region src/media-understanding/attachments.select.ts
const DEFAULT_MAX_ATTACHMENTS = 1;
function orderAttachments(attachments, prefer) {
	const list = Array.isArray(attachments) ? attachments.filter(isAttachmentRecord) : [];
	if (!prefer || prefer === "first") return list;
	if (prefer === "last") return [...list].toReversed();
	if (prefer === "path") {
		const withPath = list.filter((item) => item.path);
		const withoutPath = list.filter((item) => !item.path);
		return [...withPath, ...withoutPath];
	}
	if (prefer === "url") {
		const withUrl = list.filter((item) => item.url);
		const withoutUrl = list.filter((item) => !item.url);
		return [...withUrl, ...withoutUrl];
	}
	return list;
}
function isAttachmentRecord(value) {
	if (!value || typeof value !== "object") return false;
	const entry = value;
	if (typeof entry.index !== "number") return false;
	if (entry.path !== void 0 && typeof entry.path !== "string") return false;
	if (entry.url !== void 0 && typeof entry.url !== "string") return false;
	if (entry.mime !== void 0 && typeof entry.mime !== "string") return false;
	if (entry.alreadyTranscribed !== void 0 && typeof entry.alreadyTranscribed !== "boolean") return false;
	return true;
}
function selectAttachments(params) {
	const { capability, attachments, policy } = params;
	const matches = (Array.isArray(attachments) ? attachments.filter(isAttachmentRecord) : []).filter((item) => {
		if (capability === "audio" && item.alreadyTranscribed) return false;
		if (capability === "image") return isImageAttachment(item);
		if (capability === "audio") return isAudioAttachment(item);
		return isVideoAttachment(item);
	});
	if (matches.length === 0) return [];
	const ordered = orderAttachments(matches, policy?.prefer);
	const mode = policy?.mode ?? "first";
	const maxAttachments = policy?.maxAttachments ?? DEFAULT_MAX_ATTACHMENTS;
	if (mode === "all") return ordered.slice(0, Math.max(1, maxAttachments));
	return ordered.slice(0, 1);
}
//#endregion
//#region src/media-understanding/errors.ts
var MediaUnderstandingSkipError = class extends Error {
	constructor(reason, message) {
		super(message);
		this.reason = reason;
		this.name = "MediaUnderstandingSkipError";
	}
};
function isMediaUnderstandingSkipError(err) {
	return err instanceof MediaUnderstandingSkipError;
}
//#endregion
//#region src/media-understanding/attachments.cache.ts
const REMOTE_MEDIA_FETCH_RETRY = {
	attempts: 3,
	minDelayMs: 500,
	maxDelayMs: 3e3,
	jitter: .2
};
let defaultLocalPathRoots;
function concreteMime(mime) {
	const normalized = mime?.trim();
	if (!normalized || normalized.endsWith("/*")) return;
	return normalized;
}
function getDefaultLocalPathRoots() {
	defaultLocalPathRoots ??= mergeInboundPathRoots(getDefaultMediaLocalRoots());
	return defaultLocalPathRoots;
}
var MediaAttachmentCache = class {
	constructor(attachments, options) {
		this.entries = /* @__PURE__ */ new Map();
		this.attachments = attachments;
		this.ssrfPolicy = options?.ssrfPolicy;
		this.localPathRoots = options?.includeDefaultLocalPathRoots === false ? mergeInboundPathRoots(options.localPathRoots) : mergeInboundPathRoots(options?.localPathRoots, getDefaultLocalPathRoots());
		this.workspaceDir = options?.workspaceDir ? path.resolve(options.workspaceDir) : void 0;
		for (const attachment of attachments) this.entries.set(attachment.index, { attachment });
	}
	async getBuffer(params) {
		const entry = await this.ensureEntry(params.attachmentIndex);
		const url = entry.attachment.url?.trim();
		if (entry.buffer) {
			if (entry.buffer.length > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			return {
				buffer: entry.buffer,
				mime: entry.bufferMime,
				fileName: entry.bufferFileName ?? `media-${params.attachmentIndex + 1}`,
				size: entry.buffer.length
			};
		}
		if (entry.resolvedPath) try {
			const size = await this.ensureLocalStat(entry);
			if (entry.resolvedPath) {
				if (size !== void 0 && size > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
				const { buffer, filePath } = await this.readLocalBuffer({
					attachmentIndex: params.attachmentIndex,
					filePath: entry.resolvedPath,
					maxBytes: params.maxBytes
				});
				entry.resolvedPath = filePath;
				entry.buffer = buffer;
				entry.bufferMime = entry.bufferMime ?? concreteMime(entry.attachment.mime) ?? await detectMime({
					buffer,
					filePath
				});
				entry.bufferFileName = path.basename(filePath) || `media-${params.attachmentIndex + 1}`;
				return {
					buffer,
					mime: entry.bufferMime,
					fileName: entry.bufferFileName,
					size: buffer.length
				};
			}
		} catch (err) {
			if (!(err instanceof MediaUnderstandingSkipError) || !url || err.reason !== "blocked" && err.reason !== "empty") throw err;
		}
		if (!url) throw new MediaUnderstandingSkipError("empty", `Attachment ${params.attachmentIndex + 1} has no path or URL.`);
		try {
			const fetched = await readRemoteMediaBuffer({
				url,
				timeoutMs: params.timeoutMs,
				maxBytes: params.maxBytes,
				ssrfPolicy: this.ssrfPolicy,
				retry: REMOTE_MEDIA_FETCH_RETRY
			});
			entry.buffer = fetched.buffer;
			entry.bufferMime = concreteMime(entry.attachment.mime) ?? fetched.contentType ?? await detectMime({
				buffer: fetched.buffer,
				filePath: fetched.fileName ?? url
			});
			entry.bufferFileName = fetched.fileName ?? `media-${params.attachmentIndex + 1}`;
			return {
				buffer: fetched.buffer,
				mime: entry.bufferMime,
				fileName: entry.bufferFileName,
				size: fetched.buffer.length
			};
		} catch (err) {
			if (err instanceof MediaFetchError && err.code === "max_bytes") throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			if (isAbortError(err)) throw new MediaUnderstandingSkipError("timeout", `Attachment ${params.attachmentIndex + 1} timed out while fetching.`);
			throw err;
		}
	}
	async getPath(params) {
		const entry = await this.ensureEntry(params.attachmentIndex);
		if (entry.resolvedPath) {
			if (params.maxBytes) try {
				const size = await this.ensureLocalStat(entry);
				if (entry.resolvedPath) {
					if (size !== void 0 && size > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
				}
			} catch (err) {
				if (!(err instanceof MediaUnderstandingSkipError) || err.reason !== "blocked" && err.reason !== "empty") throw err;
			}
			if (entry.resolvedPath) return { path: entry.resolvedPath };
		}
		if (entry.tempPath) {
			if (params.maxBytes && entry.buffer && entry.buffer.length > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			return {
				path: entry.tempPath,
				cleanup: entry.tempCleanup
			};
		}
		const maxBytes = params.maxBytes ?? Number.POSITIVE_INFINITY;
		const bufferResult = await this.getBuffer({
			attachmentIndex: params.attachmentIndex,
			maxBytes,
			timeoutMs: params.timeoutMs
		});
		const tmpPath = buildRandomTempFilePath({
			prefix: "openclaw-media",
			extension: path.extname(bufferResult.fileName || "") || ""
		});
		await fs.writeFile(tmpPath, bufferResult.buffer);
		entry.tempPath = tmpPath;
		entry.tempCleanup = async () => {
			await fs.unlink(tmpPath).catch(() => {});
		};
		return {
			path: tmpPath,
			cleanup: entry.tempCleanup
		};
	}
	async cleanup() {
		const cleanups = [];
		for (const entry of this.entries.values()) if (entry.tempCleanup) {
			cleanups.push(entry.tempCleanup());
			entry.tempCleanup = void 0;
		}
		await Promise.all(cleanups);
	}
	async ensureEntry(attachmentIndex) {
		const existing = this.entries.get(attachmentIndex);
		if (existing) {
			if (!existing.resolvedPath) existing.resolvedPath = this.resolveLocalPath(existing.attachment);
			return existing;
		}
		const attachment = this.attachments.find((item) => item.index === attachmentIndex) ?? { index: attachmentIndex };
		const entry = {
			attachment,
			resolvedPath: this.resolveLocalPath(attachment)
		};
		this.entries.set(attachmentIndex, entry);
		return entry;
	}
	resolveLocalPath(attachment) {
		const rawPath = normalizeAttachmentPath(attachment.path);
		if (!rawPath) return;
		return this.workspaceDir ? path.resolve(this.workspaceDir, rawPath) : path.resolve(rawPath);
	}
	async ensureLocalStat(entry) {
		if (!entry.resolvedPath) return;
		if (!isInboundPathAllowed({
			filePath: entry.resolvedPath,
			roots: this.localPathRoots
		})) {
			entry.resolvedPath = void 0;
			if (shouldLogVerbose()) logVerbose(`Blocked attachment path outside allowed roots: ${entry.attachment.path ?? entry.attachment.url ?? "(unknown)"}`);
			throw new MediaUnderstandingSkipError("blocked", `Attachment ${entry.attachment.index + 1} path is outside allowed roots.`);
		}
		if (entry.statSize !== void 0) return entry.statSize;
		try {
			const currentPath = entry.resolvedPath;
			const opened = await openLocalFileSafely({ filePath: currentPath });
			let canonicalRoots;
			try {
				canonicalRoots = await this.getCanonicalLocalPathRoots();
			} finally {
				await opened.handle.close().catch(() => {});
			}
			if (!isInboundPathAllowed({
				filePath: opened.realPath,
				roots: canonicalRoots
			})) {
				entry.resolvedPath = void 0;
				if (shouldLogVerbose()) logVerbose(`Blocked canonicalized attachment path outside allowed roots: ${opened.realPath}`);
				throw new MediaUnderstandingSkipError("blocked", `Attachment ${entry.attachment.index + 1} path is outside allowed roots.`);
			}
			entry.resolvedPath = opened.realPath;
			entry.statSize = opened.stat.size;
			return opened.stat.size;
		} catch (err) {
			if (err instanceof MediaUnderstandingSkipError) throw err;
			if (err instanceof FsSafeError) {
				entry.resolvedPath = void 0;
				if (err.code === "not-file") throw new MediaUnderstandingSkipError("empty", `Attachment ${entry.attachment.index + 1} path is not a regular file.`);
				if (err.code !== "not-found") throw new MediaUnderstandingSkipError("blocked", `Attachment ${entry.attachment.index + 1} path is outside allowed roots.`);
			} else throw new MediaUnderstandingSkipError("blocked", `Attachment ${entry.attachment.index + 1} could not be canonicalized.`);
			entry.resolvedPath = void 0;
			if (shouldLogVerbose()) logVerbose(`Failed to read attachment ${entry.attachment.index + 1}: ${String(err)}`);
			return;
		}
	}
	async getCanonicalLocalPathRoots() {
		if (this.canonicalLocalPathRoots) return await this.canonicalLocalPathRoots;
		this.canonicalLocalPathRoots = (async () => mergeInboundPathRoots(this.localPathRoots, await Promise.all(this.localPathRoots.map(async (root) => {
			if (root.includes("*")) return root;
			return await fs.realpath(root).catch(() => root);
		}))))();
		return await this.canonicalLocalPathRoots;
	}
	async readLocalBuffer(params) {
		let opened;
		try {
			opened = await openLocalFileSafely({ filePath: params.filePath });
			if (opened.stat.size > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			const canonicalRoots = await this.getCanonicalLocalPathRoots();
			if (!isInboundPathAllowed({
				filePath: opened.realPath,
				roots: canonicalRoots
			})) throw new MediaUnderstandingSkipError("blocked", `Attachment ${params.attachmentIndex + 1} path is outside allowed roots.`);
			const buffer = await opened.handle.readFile();
			if (buffer.length > params.maxBytes) throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
			return {
				buffer,
				filePath: opened.realPath
			};
		} catch (err) {
			if (err instanceof FsSafeError) {
				if (err.code === "too-large") throw new MediaUnderstandingSkipError("maxBytes", `Attachment ${params.attachmentIndex + 1} exceeds maxBytes ${params.maxBytes}`);
				if (err.code === "not-file" || err.code === "not-found") throw new MediaUnderstandingSkipError("empty", `Attachment ${params.attachmentIndex + 1} path is not a regular file.`);
				throw new MediaUnderstandingSkipError("blocked", `Attachment ${params.attachmentIndex + 1} path is outside allowed roots.`);
			}
			throw err;
		} finally {
			await opened?.handle.close().catch(() => {});
		}
	}
};
//#endregion
//#region src/media-understanding/fs.ts
async function fileExists(filePath) {
	return filePath ? await pathExists(filePath) : false;
}
//#endregion
//#region src/media-understanding/image-input-normalize.ts
const HEIC_MIME_RE = /^image\/hei[cf]$/i;
const HEIC_EXT_RE = /\.(heic|heif)$/i;
function isHeicInput(params) {
	const mime = normalizeMimeType(params.mime);
	if (mime && HEIC_MIME_RE.test(mime)) return true;
	const fileName = params.fileName?.trim();
	return Boolean(fileName && HEIC_EXT_RE.test(fileName));
}
async function normalizeImageDescriptionInput(params) {
	if (!isHeicInput(params)) return {
		buffer: params.buffer,
		mime: params.mime
	};
	const sourceMime = normalizeMimeType(params.mime) ?? "image/heic";
	const image = await extractImageContentFromSource({
		type: "base64",
		data: params.buffer.toString("base64"),
		mediaType: sourceMime
	}, {
		allowUrl: false,
		allowedMimes: new Set([
			sourceMime.toLowerCase(),
			"image/heic",
			"image/heif",
			"image/jpeg"
		]),
		maxBytes: params.maxBytes ?? DEFAULT_MAX_BYTES.image,
		maxRedirects: 0,
		timeoutMs: 0
	});
	return {
		buffer: Buffer.from(image.data, "base64"),
		mime: image.mimeType
	};
}
//#endregion
//#region src/media-understanding/output-extract.ts
function extractLastJsonObject(raw) {
	const trimmed = raw.trim();
	const start = trimmed.lastIndexOf("{");
	if (start === -1) return null;
	const slice = trimmed.slice(start);
	try {
		return JSON.parse(slice);
	} catch {
		return null;
	}
}
function extractGeminiResponse(raw) {
	const payload = extractLastJsonObject(raw);
	if (!payload || typeof payload !== "object") return null;
	const response = payload.response;
	if (typeof response !== "string") return null;
	return response.trim() || null;
}
//#endregion
//#region src/media-understanding/video.ts
function estimateBase64Size(bytes) {
	return Math.ceil(bytes / 3) * 4;
}
function resolveVideoMaxBase64Bytes(maxBytes) {
	const expanded = Math.floor(maxBytes * (4 / 3));
	return Math.min(expanded, DEFAULT_VIDEO_MAX_BASE64_BYTES);
}
//#endregion
//#region src/media-understanding/runner.entries.ts
let cachedModelAuth = null;
async function loadModelAuth() {
	cachedModelAuth ??= await import("./model-auth-DDQoVBho.js");
	return cachedModelAuth;
}
function resolveLiteralProviderApiKey(params) {
	return normalizeNullableString(params.cfg.models?.providers?.[params.providerId]?.apiKey);
}
function sanitizeProviderHeaders(headers) {
	if (!headers) return;
	const next = {};
	for (const [key, value] of Object.entries(headers)) {
		if (typeof value !== "string") continue;
		next[key] = value;
	}
	return Object.keys(next).length > 0 ? next : void 0;
}
function trimOutput(text, maxChars) {
	const trimmed = text.trim();
	if (!maxChars || trimmed.length <= maxChars) return trimmed;
	return trimmed.slice(0, maxChars).trim();
}
function extractSherpaOnnxText(raw) {
	const noMatch = {
		matched: false,
		text: ""
	};
	const tryParse = (value) => {
		const trimmed = value.trim();
		if (!trimmed) return noMatch;
		const head = trimmed[0];
		if (head !== "{" && head !== "\"") return noMatch;
		try {
			const parsed = JSON.parse(trimmed);
			if (typeof parsed === "string") return tryParse(parsed);
			if (parsed && typeof parsed === "object") {
				const text = parsed.text;
				if (typeof text === "string") return {
					matched: true,
					text: text.trim()
				};
			}
		} catch {}
		return noMatch;
	};
	const direct = tryParse(raw);
	if (direct.matched) return direct;
	const lines = normalizeStringEntries(raw.split("\n"));
	for (let i = lines.length - 1; i >= 0; i -= 1) {
		const parsed = tryParse(lines[i] ?? "");
		if (parsed.matched) return parsed;
	}
	return noMatch;
}
function commandBase(command) {
	return path.parse(command).name;
}
function isAntigravityCliCommand(command) {
	const commandId = commandBase(command);
	return commandId === "agy" || commandId === "antigravity";
}
function findArgValue(args, keys) {
	for (let i = 0; i < args.length; i += 1) if (keys.includes(args[i] ?? "")) {
		const value = args[i + 1];
		if (value) return value;
	}
}
function hasArg(args, keys) {
	return args.some((arg) => keys.includes(arg));
}
function resolveWhisperOutputPath(args, mediaPath) {
	const outputDir = findArgValue(args, ["--output_dir", "-o"]);
	const outputFormat = findArgValue(args, ["--output_format"]);
	if (!outputDir || !outputFormat) return null;
	if (!outputFormat.split(",").map((value) => value.trim()).includes("txt")) return null;
	const base = path.parse(mediaPath).name;
	return path.join(outputDir, `${base}.txt`);
}
function resolveWhisperCppOutputPath(args) {
	if (!hasArg(args, ["-otxt", "--output-txt"])) return null;
	const outputBase = findArgValue(args, ["-of", "--output-file"]);
	if (!outputBase) return null;
	return `${outputBase}.txt`;
}
function resolveParakeetOutputPath(args, mediaPath) {
	const outputDir = findArgValue(args, ["--output-dir"]);
	const outputFormat = findArgValue(args, ["--output-format"]);
	if (!outputDir) return null;
	if (outputFormat && outputFormat !== "txt") return null;
	const base = path.parse(mediaPath).name;
	return path.join(outputDir, `${base}.txt`);
}
async function resolveCliOutput(params) {
	const commandId = commandBase(params.command);
	const fileOutput = commandId === "whisper-cli" ? resolveWhisperCppOutputPath(params.args) : commandId === "whisper" ? resolveWhisperOutputPath(params.args, params.mediaPath) : commandId === "parakeet-mlx" ? resolveParakeetOutputPath(params.args, params.mediaPath) : null;
	if (fileOutput && await fileExists(fileOutput)) try {
		const content = await fs.readFile(fileOutput, "utf8");
		if (content.trim()) return content.trim();
	} catch {}
	if (commandId === "gemini") {
		const response = extractGeminiResponse(params.stdout);
		if (response) return response;
	}
	if (commandId === "sherpa-onnx-offline") {
		const response = extractSherpaOnnxText(params.stdout);
		if (response.matched) return response.text;
	}
	return params.stdout.trim();
}
async function resolveCliMediaPath(params) {
	const commandId = commandBase(params.command);
	if (params.capability !== "audio" || commandId !== "whisper-cli") return params.mediaPath;
	if (normalizeLowercaseStringOrEmpty(path.extname(params.mediaPath)) === ".wav") return params.mediaPath;
	const wavPath = path.join(params.outputDir, `${path.parse(params.mediaPath).name}.wav`);
	await fs.mkdir(params.outputDir, { recursive: true });
	await writeExternalFileWithinRoot({
		rootDir: params.outputDir,
		path: path.basename(wavPath),
		write: async (outputPath) => {
			await runFfmpeg([
				"-y",
				"-i",
				params.mediaPath,
				"-ac",
				"1",
				"-ar",
				"16000",
				"-c:a",
				"pcm_s16le",
				"-f",
				"wav",
				outputPath
			]);
		}
	});
	return wavPath;
}
function normalizeProviderQuery(options) {
	if (!options) return;
	const query = {};
	for (const [key, value] of Object.entries(options)) {
		if (value === void 0) continue;
		query[key] = value;
	}
	return Object.keys(query).length > 0 ? query : void 0;
}
function buildDeepgramCompatQuery(options) {
	if (!options) return;
	const query = {};
	if (typeof options.detectLanguage === "boolean") query.detect_language = options.detectLanguage;
	if (typeof options.punctuate === "boolean") query.punctuate = options.punctuate;
	if (typeof options.smartFormat === "boolean") query.smart_format = options.smartFormat;
	return Object.keys(query).length > 0 ? query : void 0;
}
function normalizeDeepgramQueryKeys(query) {
	const normalized = { ...query };
	if ("detectLanguage" in normalized) {
		normalized.detect_language = normalized.detectLanguage;
		delete normalized.detectLanguage;
	}
	if ("smartFormat" in normalized) {
		normalized.smart_format = normalized.smartFormat;
		delete normalized.smartFormat;
	}
	return normalized;
}
function resolveProviderQuery(params) {
	const { providerId, config, entry } = params;
	const mergedOptions = normalizeProviderQuery({
		...config?.providerOptions?.[providerId],
		...entry.providerOptions?.[providerId]
	});
	if (providerId !== "deepgram") return mergedOptions;
	const query = normalizeDeepgramQueryKeys(mergedOptions ?? {});
	const compat = buildDeepgramCompatQuery({
		...config?.deepgram,
		...entry.deepgram
	});
	for (const [key, value] of Object.entries(compat ?? {})) if (query[key] === void 0) query[key] = value;
	return Object.keys(query).length > 0 ? query : void 0;
}
function buildModelDecision(params) {
	if (params.entryType === "cli") {
		const command = params.entry.command?.trim();
		return {
			type: "cli",
			provider: command ?? "cli",
			model: params.entry.model ?? command,
			outcome: params.outcome,
			reason: params.reason
		};
	}
	const providerIdRaw = params.entry.provider?.trim();
	return {
		type: "provider",
		provider: (providerIdRaw ? normalizeMediaProviderId(providerIdRaw) : void 0) ?? providerIdRaw,
		model: params.entry.model,
		outcome: params.outcome,
		reason: params.reason
	};
}
function resolveEntryRunOptions(params) {
	const { capability, entry, cfg } = params;
	const maxBytes = resolveMaxBytes({
		capability,
		entry,
		cfg,
		config: params.config
	});
	const maxChars = resolveMaxChars({
		capability,
		entry,
		cfg,
		config: params.config
	});
	return {
		maxBytes,
		maxChars,
		timeoutMs: resolveTimeoutMs(entry.timeoutSeconds ?? params.config?.timeoutSeconds ?? cfg.tools?.media?.[capability]?.timeoutSeconds, DEFAULT_TIMEOUT_SECONDS[capability]),
		prompt: resolvePrompt(capability, entry.prompt ?? params.config?.prompt ?? cfg.tools?.media?.[capability]?.prompt, maxChars)
	};
}
function resolveMediaRequestOverrides(config) {
	const overrides = config ?? {};
	return {
		prompt: overrides["_requestPromptOverride"],
		language: overrides["_requestLanguageOverride"]
	};
}
async function resolveProviderExecutionAuth(params) {
	const literalApiKey = resolveLiteralProviderApiKey({
		cfg: params.cfg,
		providerId: params.providerId
	});
	if (literalApiKey) return {
		apiKeys: collectProviderApiKeysForExecution({
			provider: params.providerId,
			primaryApiKey: literalApiKey
		}),
		providerConfig: params.cfg.models?.providers?.[params.providerId]
	};
	const { requireApiKey, resolveApiKeyForProvider } = await loadModelAuth();
	const auth = await resolveApiKeyForProvider({
		provider: params.providerId,
		cfg: params.cfg,
		profileId: params.entry.profile,
		preferredProfile: params.entry.preferredProfile,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	});
	return {
		apiKeys: collectProviderApiKeysForExecution({
			provider: params.providerId,
			primaryApiKey: requireApiKey(auth, params.providerId)
		}),
		providerConfig: params.cfg.models?.providers?.[params.providerId]
	};
}
async function resolveProviderExecutionContext(params) {
	const { apiKeys, providerConfig } = await resolveProviderExecutionAuth({
		providerId: params.providerId,
		cfg: params.cfg,
		entry: params.entry,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	});
	const baseUrl = params.entry.baseUrl ?? params.config?.baseUrl ?? providerConfig?.baseUrl;
	const mergedHeaders = {
		...sanitizeProviderHeaders(providerConfig?.headers),
		...sanitizeProviderHeaders(params.config?.headers),
		...sanitizeProviderHeaders(params.entry.headers)
	};
	return {
		apiKeys,
		baseUrl,
		headers: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : void 0,
		request: mergeModelProviderRequestOverrides(sanitizeConfiguredModelProviderRequest(providerConfig?.request), sanitizeConfiguredProviderRequest(params.config?.request), sanitizeConfiguredProviderRequest(params.entry.request))
	};
}
function formatDecisionSummary(decision) {
	const attachments = Array.isArray(decision.attachments) ? decision.attachments : [];
	const total = attachments.length;
	const success = attachments.filter((entry) => entry?.chosen?.outcome === "success").length;
	const chosen = attachments.find((entry) => entry?.chosen)?.chosen;
	const provider = typeof chosen?.provider === "string" ? chosen.provider.trim() : void 0;
	const model = typeof chosen?.model === "string" ? chosen.model.trim() : void 0;
	const modelLabel = provider ? model ? `${provider}/${model}` : provider : void 0;
	const shortReason = summarizeDecisionReason(findDecisionReason(decision, decision.outcome === "failed" ? "failed" : void 0));
	const countLabel = total > 0 ? ` (${success}/${total})` : "";
	const viaLabel = modelLabel ? ` via ${modelLabel}` : "";
	const reasonLabel = shortReason ? ` reason=${shortReason}` : "";
	return `${decision.capability}: ${decision.outcome}${countLabel}${viaLabel}${reasonLabel}`;
}
function findDecisionReason(decision, outcome) {
	const attachments = Array.isArray(decision.attachments) ? decision.attachments : [];
	for (const attachment of attachments) {
		const attempts = Array.isArray(attachment?.attempts) ? attachment.attempts : [];
		for (const attempt of attempts) {
			if (outcome && attempt.outcome !== outcome) continue;
			if (typeof attempt.reason !== "string" || attempt.reason.trim().length === 0) continue;
			return attempt.reason;
		}
	}
}
function normalizeDecisionReason(reason) {
	const trimmed = typeof reason === "string" ? reason.trim() : "";
	if (!trimmed) return;
	return trimmed.replace(/^Error:\s*/i, "").trim() || void 0;
}
function summarizeDecisionReason(reason) {
	const normalized = normalizeDecisionReason(reason);
	if (!normalized) return;
	return normalized.split(":")[0]?.trim() || void 0;
}
function assertMinAudioSize(params) {
	if (params.size >= 1024) return;
	throw new MediaUnderstandingSkipError("tooSmall", `Audio attachment ${params.attachmentIndex + 1} is too small (${params.size} bytes, minimum ${MIN_AUDIO_FILE_BYTES})`);
}
async function runProviderEntry(params) {
	const { entry, capability, cfg } = params;
	const providerIdRaw = entry.provider?.trim();
	if (!providerIdRaw) throw new Error(`Provider entry missing provider for ${capability}`);
	const providerId = normalizeMediaProviderId(providerIdRaw);
	const requestProviderId = normalizeMediaExecutionProviderId(providerIdRaw);
	const { maxBytes, maxChars, timeoutMs, prompt } = resolveEntryRunOptions({
		capability,
		entry,
		cfg,
		config: params.config
	});
	if (capability === "image") {
		if (!params.agentDir) throw new Error("Image understanding requires agentDir");
		const modelId = entry.model?.trim();
		if (!modelId) throw new Error("Image understanding requires model id");
		const media = await params.cache.getBuffer({
			attachmentIndex: params.attachmentIndex,
			maxBytes,
			timeoutMs
		});
		const normalizedMedia = await normalizeImageDescriptionInput({
			buffer: media.buffer,
			fileName: media.fileName,
			mime: media.mime,
			maxBytes
		});
		const requestOverrides = resolveMediaRequestOverrides(params.config);
		const provider = getMediaUnderstandingProvider(requestProviderId, params.providerRegistry);
		const imageInput = {
			buffer: normalizedMedia.buffer,
			fileName: media.fileName,
			mime: normalizedMedia.mime,
			model: modelId,
			provider: requestProviderId,
			prompt: requestOverrides.prompt ?? prompt,
			timeoutMs,
			profile: entry.profile,
			preferredProfile: entry.preferredProfile,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			cfg: params.cfg
		};
		const result = await (provider?.describeImage ?? describeImageWithModel)(imageInput);
		return {
			kind: "image.description",
			attachmentIndex: params.attachmentIndex,
			text: trimOutput(result.text, maxChars),
			provider: requestProviderId,
			model: result.model ?? modelId
		};
	}
	const provider = getMediaUnderstandingProvider(providerId, params.providerRegistry);
	if (!provider) throw new Error(`Media provider not available: ${providerId}`);
	const fetchFn = resolveProxyFetchFromEnv();
	if (capability === "audio") {
		if (!provider.transcribeAudio) throw new Error(`Audio transcription provider "${providerId}" not available.`);
		const transcribeAudio = provider.transcribeAudio;
		const requestOverrides = resolveMediaRequestOverrides(params.config);
		const media = await params.cache.getBuffer({
			attachmentIndex: params.attachmentIndex,
			maxBytes,
			timeoutMs
		});
		assertMinAudioSize({
			size: media.size,
			attachmentIndex: params.attachmentIndex
		});
		const { apiKeys, baseUrl, headers, request } = await resolveProviderExecutionContext({
			providerId,
			cfg,
			entry,
			config: params.config,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir
		});
		const providerQuery = resolveProviderQuery({
			providerId,
			config: params.config,
			entry
		});
		const model = entry.model?.trim() || (await import("./defaults-BzURb6l7.js")).resolveDefaultMediaModel({
			cfg,
			providerId,
			capability: "audio",
			workspaceDir: params.workspaceDir
		}) || entry.model;
		const result = await executeWithApiKeyRotation({
			provider: providerId,
			apiKeys,
			transientRetry: providerOperationRetryConfig("read"),
			execute: async (apiKey) => transcribeAudio({
				buffer: media.buffer,
				fileName: media.fileName,
				mime: media.mime,
				apiKey,
				baseUrl,
				headers,
				request,
				model,
				language: requestOverrides.language ?? entry.language ?? params.config?.language ?? cfg.tools?.media?.audio?.language,
				prompt: requestOverrides.prompt ?? prompt,
				query: providerQuery,
				timeoutMs,
				fetchFn
			})
		});
		return {
			kind: "audio.transcription",
			attachmentIndex: params.attachmentIndex,
			text: trimOutput(result.text, maxChars),
			provider: providerId,
			model: result.model ?? model
		};
	}
	if (!provider.describeVideo) throw new Error(`Video understanding provider "${providerId}" not available.`);
	const describeVideo = provider.describeVideo;
	const media = await params.cache.getBuffer({
		attachmentIndex: params.attachmentIndex,
		maxBytes,
		timeoutMs
	});
	const estimatedBase64Bytes = estimateBase64Size(media.size);
	const maxBase64Bytes = resolveVideoMaxBase64Bytes(maxBytes);
	if (estimatedBase64Bytes > maxBase64Bytes) throw new MediaUnderstandingSkipError("maxBytes", `Video attachment ${params.attachmentIndex + 1} base64 payload ${estimatedBase64Bytes} exceeds ${maxBase64Bytes}`);
	const { apiKeys, baseUrl, headers, request } = await resolveProviderExecutionContext({
		providerId,
		cfg,
		entry,
		config: params.config,
		agentDir: params.agentDir,
		workspaceDir: params.workspaceDir
	});
	const result = await executeWithApiKeyRotation({
		provider: providerId,
		apiKeys,
		transientRetry: providerOperationRetryConfig("read"),
		execute: (apiKey) => describeVideo({
			buffer: media.buffer,
			fileName: media.fileName,
			mime: media.mime,
			apiKey,
			baseUrl,
			headers,
			request,
			model: entry.model,
			prompt,
			timeoutMs,
			fetchFn
		})
	});
	return {
		kind: "video.description",
		attachmentIndex: params.attachmentIndex,
		text: trimOutput(result.text, maxChars),
		provider: providerId,
		model: result.model ?? entry.model
	};
}
async function runCliEntry(params) {
	const { entry, capability, cfg, ctx } = params;
	const command = entry.command?.trim();
	const args = entry.args ?? [];
	if (!command) throw new Error(`CLI entry missing command for ${capability}`);
	const requestOverrides = resolveMediaRequestOverrides(params.config);
	const { maxBytes, maxChars, timeoutMs, prompt } = resolveEntryRunOptions({
		capability,
		entry,
		cfg,
		config: params.config
	});
	const pathResult = await params.cache.getPath({
		attachmentIndex: params.attachmentIndex,
		maxBytes,
		timeoutMs
	});
	if (capability === "audio") assertMinAudioSize({
		size: (await fs.stat(pathResult.path)).size,
		attachmentIndex: params.attachmentIndex
	});
	const outputDir = await fs.mkdtemp(path.join(resolvePreferredOpenClawTmpDir(), "openclaw-media-cli-"));
	const mediaPath = await resolveCliMediaPath({
		capability,
		command,
		mediaPath: pathResult.path,
		outputDir
	});
	const outputBase = path.join(outputDir, path.parse(mediaPath).name);
	const templCtx = {
		...ctx,
		MediaPath: mediaPath,
		MediaDir: path.dirname(mediaPath),
		OutputDir: outputDir,
		OutputBase: outputBase,
		Prompt: requestOverrides.prompt ?? prompt,
		...requestOverrides.language ? { Language: requestOverrides.language } : {},
		MaxChars: maxChars
	};
	const argv = [command, ...args].map((part, index) => index === 0 ? part : applyTemplate(part, templCtx));
	try {
		if (shouldLogVerbose()) logVerbose(`Media understanding via CLI: ${argv.join(" ")}`);
		const { stdout } = await runExec(argv[0], argv.slice(1), {
			timeoutMs,
			maxBuffer: CLI_OUTPUT_MAX_BUFFER,
			cwd: isAntigravityCliCommand(command) ? path.dirname(mediaPath) : void 0
		});
		const text = trimOutput(await resolveCliOutput({
			command,
			args: argv.slice(1),
			stdout,
			mediaPath
		}), maxChars);
		if (!text) return null;
		return {
			kind: capability === "audio" ? "audio.transcription" : `${capability}.description`,
			attachmentIndex: params.attachmentIndex,
			text,
			provider: "cli",
			model: command
		};
	} finally {
		await fs.rm(outputDir, {
			recursive: true,
			force: true
		}).catch(() => {});
	}
}
//#endregion
export { runCliEntry as a, normalizeImageDescriptionInput as c, isMediaUnderstandingSkipError as d, selectAttachments as f, resolveAttachmentKind as h, normalizeDecisionReason as i, fileExists as l, normalizeAttachments as m, findDecisionReason as n, runProviderEntry as o, isAudioAttachment as p, formatDecisionSummary as r, summarizeDecisionReason as s, buildModelDecision as t, MediaAttachmentCache as u };
