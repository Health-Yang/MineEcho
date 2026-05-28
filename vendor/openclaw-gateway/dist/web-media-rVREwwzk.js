import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { v as uniqueValues } from "./string-normalization-B8G0vlWE.js";
import { m as FsSafeError } from "./path-BlG8lhgR.js";
import { b as assertNoWindowsNetworkPath, w as safeFileURLToPath } from "./fs-safe-JUdtLZkh.js";
import { i as readLocalFileSafely } from "./secure-temp-dir-XAWcZnE2.js";
import { p as resolveUserPath } from "./utils-B5r0V84N.js";
import { a as shouldLogVerbose, r as logVerbose } from "./globals-DZ-ifL5z.js";
import { a as getActivePluginRegistry } from "./runtime-B5Ug58ea.js";
import "./local-file-access-CBe_wA_B.js";
import { c as kindFromMime, g as maxBytesForKind, i as getFileExtension, l as mimeTypeFromFilePath, n as detectMime, r as extensionForMime, u as normalizeMimeType } from "./mime-DppuT-pZ.js";
import { c as createImageProcessor, h as readImageProbeFromHeader, m as readImageMetadataFromHeader } from "./media-services-rb2QLp-y.js";
import { n as extnameFromAnyPath, t as basenameFromAnyPath } from "./file-name-r4prf02z.js";
import { i as resolveInboundMediaReference, t as MediaReferenceError } from "./media-reference-CWwsLZO_.js";
import { i as readRemoteMediaBuffer } from "./fetch-C_mdbFEd.js";
import { n as assertLocalMediaAllowed, t as LocalMediaAccessError } from "./local-media-access-BLpt3hx9.js";
import path from "node:path";
//#region src/media/web-media.ts
async function resolveMediaStoreUriToPath(mediaUrl) {
	if (!/^media:\/\//i.test(mediaUrl)) return null;
	try {
		return (await resolveInboundMediaReference(mediaUrl))?.physicalPath ?? null;
	} catch (err) {
		if (err instanceof MediaReferenceError) throw new LocalMediaAccessError(err.code, err.message, { cause: err });
		throw err;
	}
}
async function resolveHostedPluginMediaUrl(mediaUrl) {
	const registry = getActivePluginRegistry();
	for (const entry of registry?.hostedMediaResolvers ?? []) try {
		const resolved = await entry.resolver(mediaUrl);
		if (typeof resolved === "string" && resolved.trim()) return resolved;
	} catch (err) {
		if (shouldLogVerbose()) logVerbose(`Hosted media resolver failed (${entry.pluginId ?? "unknown"}): ${formatErrorMessage(err)}`);
	}
	return null;
}
function resolveWebMediaOptions(params) {
	if (typeof params.maxBytesOrOptions === "number" || params.maxBytesOrOptions === void 0) return {
		maxBytes: params.maxBytesOrOptions,
		optimizeImages: params.optimizeImages,
		ssrfPolicy: params.options?.ssrfPolicy,
		localRoots: params.options?.localRoots
	};
	return {
		...params.maxBytesOrOptions,
		optimizeImages: params.optimizeImages ? params.maxBytesOrOptions.optimizeImages ?? true : false
	};
}
const HEIC_MIME_RE = /^image\/hei[cf]$/i;
const HEIC_EXT_RE = /\.(heic|heif)$/i;
const WINDOWS_DRIVE_RE = /^[A-Za-z]:[\\/]/;
const HOST_READ_ALLOWED_DOCUMENT_MIMES = new Set([
	"application/msword",
	"application/pdf",
	"application/vnd.ms-excel",
	"application/vnd.ms-powerpoint",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/gzip",
	"application/x-7z-compressed",
	"application/x-tar",
	"application/zip",
	"text/csv",
	"text/markdown"
]);
const HOST_READ_TEXT_PLAIN_ALIASES = new Set(["text/csv", "text/markdown"]);
const HOST_READ_DECLARED_TEXT_MIMES = new Set([...HOST_READ_TEXT_PLAIN_ALIASES, "text/html"]);
const MB = 1024 * 1024;
function getTextStats(text) {
	if (!text) return { printableRatio: 0 };
	let printable = 0;
	let control = 0;
	for (const char of text) {
		const code = char.codePointAt(0) ?? 0;
		if (code === 9 || code === 10 || code === 13 || code === 32) {
			printable += 1;
			continue;
		}
		if (code < 32 || code >= 127 && code <= 159) {
			control += 1;
			continue;
		}
		printable += 1;
	}
	const total = printable + control;
	if (total === 0) return { printableRatio: 0 };
	return { printableRatio: printable / total };
}
function hasSingleByteTextShape(buffer) {
	if (buffer.length === 0) return true;
	let asciiText = 0;
	let control = 0;
	for (const byte of buffer) {
		if (byte === 9 || byte === 10 || byte === 13 || byte >= 32 && byte <= 126) {
			asciiText += 1;
			continue;
		}
		if (byte < 32 || byte === 127) control += 1;
	}
	const total = buffer.length;
	const highBytes = total - asciiText - control;
	return control === 0 && asciiText / total >= .7 && highBytes / total <= .3;
}
function decodeHostReadText(buffer) {
	if (buffer.length === 0) return "";
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
	} catch {
		if (!hasSingleByteTextShape(buffer)) return;
		return new TextDecoder("latin1").decode(buffer);
	}
}
function isValidatedHostReadText(buffer) {
	if (!buffer) return false;
	if (buffer.length === 0) return true;
	const text = decodeHostReadText(buffer);
	if (text === void 0) return false;
	const { printableRatio } = getTextStats(text);
	return printableRatio > .95;
}
function formatMb(bytes, digits = 2) {
	return (bytes / MB).toFixed(digits);
}
function formatCapLimit(label, cap, size) {
	return `${label} exceeds ${formatMb(cap, 0)}MB limit (got ${formatMb(size)}MB)`;
}
function formatCapReduce(label, cap, size) {
	return `${label} could not be reduced below ${formatMb(cap, 0)}MB (got ${formatMb(size)}MB)`;
}
function isHeicSource(opts) {
	if (opts.contentType && HEIC_MIME_RE.test(opts.contentType.trim())) return true;
	if (opts.fileName && HEIC_EXT_RE.test(opts.fileName.trim())) return true;
	return false;
}
function assertHostReadMediaAllowed(params) {
	const declaredMime = normalizeMimeType(mimeTypeFromFilePath(params.filePath));
	const normalizedMime = normalizeMimeType(params.contentType);
	if (declaredMime && HOST_READ_DECLARED_TEXT_MIMES.has(declaredMime)) {
		if (HOST_READ_TEXT_PLAIN_ALIASES.has(declaredMime) && !params.sniffedContentType && params.buffer && isValidatedHostReadText(params.buffer)) return;
		throw new LocalMediaAccessError("path-not-allowed", "hostReadCapability permits only validated plain-text CSV/Markdown documents for local reads");
	}
	const sniffedKind = kindFromMime(params.sniffedContentType);
	if (sniffedKind === "image" || sniffedKind === "audio" || sniffedKind === "video") return;
	const sniffedMime = normalizeMimeType(params.sniffedContentType);
	if (sniffedKind === "document" && sniffedMime && HOST_READ_ALLOWED_DOCUMENT_MIMES.has(sniffedMime)) return;
	if (sniffedMime === "application/x-cfb" && [
		".doc",
		".ppt",
		".xls"
	].includes(getFileExtension(params.filePath) ?? "")) return;
	if (!sniffedMime && normalizedMime && HOST_READ_TEXT_PLAIN_ALIASES.has(normalizedMime) && params.buffer && isValidatedHostReadText(params.buffer)) return;
	if (params.kind === "document" && normalizedMime && HOST_READ_ALLOWED_DOCUMENT_MIMES.has(normalizedMime)) throw new LocalMediaAccessError("path-not-allowed", `Host-local media sends require buffer-verified media/document types (got fallback ${normalizedMime}).`);
	throw new LocalMediaAccessError("path-not-allowed", `Host-local media sends only allow buffer-verified images, audio, video, PDF, Office documents, archives, CSV, and Markdown (got ${sniffedMime ?? normalizedMime ?? "unknown"}).`);
}
function toJpegFileName(fileName) {
	if (!fileName) return;
	const trimmed = basenameFromAnyPath(fileName.trim());
	if (!trimmed) return fileName;
	const parsed = path.parse(trimmed);
	if (!parsed.ext || HEIC_EXT_RE.test(parsed.ext)) return path.format({
		dir: parsed.dir,
		name: parsed.name || trimmed,
		ext: ".jpg"
	});
	return path.format({
		dir: parsed.dir,
		name: parsed.name,
		ext: ".jpg"
	});
}
const DEFAULT_JPEG_SIDES = [
	2048,
	1536,
	1280,
	1024,
	800
];
const DEFAULT_JPEG_QUALITIES = [
	80,
	70,
	60,
	50,
	40
];
const DEFAULT_VISION_MAX_SIDE = 2048;
const LOW_IMAGE_SIDE_FALLBACKS = [
	640,
	512,
	384,
	256,
	192,
	128
];
function normalizeImageQualityPreference(value) {
	switch (value) {
		case "efficient":
		case "balanced":
		case "high": return value;
		default: return "auto";
	}
}
function squareLongSideForPixelBudget(pixelBudget) {
	return Math.floor(Math.sqrt(pixelBudget));
}
function positiveInteger(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : void 0;
}
function effectiveImageQualityPreference(policy) {
	const preference = normalizeImageQualityPreference(policy?.quality);
	if (preference !== "auto") return preference;
	if (Math.max(1, Math.floor(policy?.imageCount ?? 1)) >= 6) return "efficient";
	return "balanced";
}
function maxSideForModel(model) {
	const maxSide = positiveInteger(model?.maxSidePx);
	const maxPixels = positiveInteger(model?.maxPixels);
	const hardLimits = [maxSide, maxPixels ? squareLongSideForPixelBudget(maxPixels) : void 0].filter((value) => value !== void 0);
	if (hardLimits.length > 0) return Math.min(...hardLimits);
	return positiveInteger(model?.preferredSidePx) ?? DEFAULT_VISION_MAX_SIDE;
}
function preferredSideForModel(model) {
	return positiveInteger(model?.preferredSidePx) ?? Math.min(maxSideForModel(model), DEFAULT_VISION_MAX_SIDE);
}
function policyModelSides(policy) {
	const models = policy?.models?.length ? policy.models : [void 0];
	const maxSide = Math.min(...models.map((model) => maxSideForModel(model)));
	const preferredSide = Math.min(...models.map((model) => preferredSideForModel(model)));
	return {
		maxSide,
		preferredSide: Math.min(preferredSide, maxSide)
	};
}
function sideForPreference(preference, policy) {
	const { maxSide, preferredSide } = policyModelSides(policy);
	switch (preference) {
		case "efficient": return Math.min(preferredSide, maxSide, 1280);
		case "balanced": return Math.min(preferredSide, maxSide);
		case "high": return maxSide;
	}
	return Math.min(preferredSide, maxSide);
}
function imageMaxBytesForPolicy(policy) {
	const maxBytes = policy?.models?.map((model) => positiveInteger(model.maxBytes)).filter((value) => value !== void 0);
	return maxBytes?.length ? Math.min(...maxBytes) : void 0;
}
function imageSatisfiesHardDimensionPolicy(buffer, policy) {
	const models = policy?.models ?? [];
	const hardMaxSides = models.map((model) => positiveInteger(model.maxSidePx)).filter((value) => value !== void 0);
	const hardMaxPixels = models.map((model) => positiveInteger(model.maxPixels)).filter((value) => value !== void 0);
	if (hardMaxSides.length === 0 && hardMaxPixels.length === 0) return true;
	const meta = readImageMetadataFromHeader(buffer);
	if (!meta) return false;
	const maxSide = Math.max(meta.width, meta.height);
	const pixels = meta.width * meta.height;
	return (hardMaxSides.length === 0 || maxSide <= Math.min(...hardMaxSides)) && (hardMaxPixels.length === 0 || pixels <= Math.min(...hardMaxPixels));
}
function assertImageSatisfiesHardDimensionPolicy(buffer, policy) {
	if (imageSatisfiesHardDimensionPolicy(buffer, policy)) return;
	const meta = readImageMetadataFromHeader(buffer);
	const detail = meta ? `: ${meta.width}x${meta.height}` : "";
	throw new Error(`Image dimensions exceed model image limits${detail}`);
}
function resolvePreservableOriginalImageContentType(params) {
	if (params.buffer.length > params.cap) return null;
	const declaredContentType = normalizeMimeType(params.contentType);
	const actualContentType = detectPreservableImageMime(params.buffer);
	if (!actualContentType) return null;
	const declaredPreservableContentType = isPreservableImageMime(declaredContentType) ? declaredContentType : void 0;
	if (declaredPreservableContentType && declaredPreservableContentType !== actualContentType) return null;
	if (declaredContentType?.startsWith("image/") && !declaredPreservableContentType) return null;
	const resolvedContentType = declaredPreservableContentType ?? actualContentType;
	if (isHeicSource({
		contentType: resolvedContentType,
		fileName: params.fileName
	})) return null;
	const meta = readImageMetadataFromHeader(params.buffer);
	if (!meta) return null;
	const preferredSide = resolveImageCompressionGrid(params.policy).sides[0] ?? DEFAULT_VISION_MAX_SIDE;
	if (Math.max(meta.width, meta.height) > preferredSide || !imageSatisfiesHardDimensionPolicy(params.buffer, params.policy)) return null;
	return resolvedContentType;
}
function detectPreservableImageMime(buffer) {
	const format = readImageProbeFromHeader(buffer)?.format;
	return format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : null;
}
function isPreservableImageMime(contentType) {
	return contentType === "image/png" || contentType === "image/jpeg" || contentType === "image/webp";
}
function effectiveImageBytesCap(baseCap, policy) {
	const policyCap = imageMaxBytesForPolicy(policy);
	if (baseCap === void 0) return policyCap;
	return policyCap === void 0 ? baseCap : Math.min(baseCap, policyCap);
}
function buildDescendingLadder(maxSide, values) {
	const normalizedMax = Math.max(1, Math.floor(maxSide));
	const ladder = uniqueValues([
		normalizedMax,
		...values,
		...LOW_IMAGE_SIDE_FALLBACKS
	].map((value) => Math.min(normalizedMax, value)).filter((value) => value > 0)).toSorted((a, b) => b - a);
	if (ladder.length > 1 || normalizedMax <= 1) return ladder;
	return uniqueValues([
		normalizedMax,
		Math.floor(normalizedMax * .75),
		Math.floor(normalizedMax * .5),
		Math.floor(normalizedMax * .25)
	].filter((value) => value > 0)).toSorted((a, b) => b - a);
}
function resolveImageCompressionGrid(policy) {
	const preference = effectiveImageQualityPreference(policy);
	const side = sideForPreference(preference, policy);
	switch (preference) {
		case "efficient": return {
			sides: buildDescendingLadder(side, [1024, 800]),
			qualities: [
				70,
				60,
				50,
				40
			]
		};
		case "high": return {
			sides: buildDescendingLadder(side, [
				3072,
				2576,
				2048,
				1800,
				1536,
				1280,
				1024,
				800
			]),
			qualities: [
				92,
				85,
				78,
				70,
				62,
				52,
				42
			]
		};
		case "balanced": return {
			sides: buildDescendingLadder(side, [...DEFAULT_JPEG_SIDES]),
			qualities: [...DEFAULT_JPEG_QUALITIES]
		};
	}
	return {
		sides: buildDescendingLadder(side, [...DEFAULT_JPEG_SIDES]),
		qualities: [...DEFAULT_JPEG_QUALITIES]
	};
}
function logOptimizedImage(params) {
	if (!shouldLogVerbose()) return;
	if (params.optimized.optimizedSize >= params.originalSize) return;
	if (params.optimized.format === "png") {
		logVerbose(`Optimized PNG (preserving alpha) from ${formatMb(params.originalSize)}MB to ${formatMb(params.optimized.optimizedSize)}MB (side<=${params.optimized.resizeSide}px)`);
		return;
	}
	logVerbose(`Optimized media from ${formatMb(params.originalSize)}MB to ${formatMb(params.optimized.optimizedSize)}MB (side<=${params.optimized.resizeSide}px, q=${params.optimized.quality})`);
}
async function optimizeImageWithFallback(params) {
	const { buffer, cap } = params;
	const grid = resolveImageCompressionGrid(params.imageCompression);
	const optimized = await createImageProcessor().encode(buffer, {
		format: "auto",
		maxBytes: cap,
		opaque: { format: "jpeg" },
		transparent: { format: "png" },
		search: {
			maxSide: grid.sides,
			quality: grid.qualities
		},
		transparency: "auto"
	});
	if (optimized.chosen.transparency === "flattened" && shouldLogVerbose()) logVerbose(`Image transparency flattened to fit ${formatMb(cap, 0)}MB optimization budget`);
	return {
		buffer: optimized.data,
		optimizedSize: optimized.bytes,
		resizeSide: optimized.chosen.maxSide ?? Math.max(optimized.width, optimized.height),
		format: optimized.format,
		mimeType: optimized.mimeType,
		...optimized.chosen.quality === void 0 ? {} : { quality: optimized.chosen.quality },
		...optimized.chosen.compressionLevel === void 0 ? {} : { compressionLevel: optimized.chosen.compressionLevel }
	};
}
async function optimizeImageBufferForWebMedia(params) {
	const baseCap = params.maxBytes ?? maxBytesForKind("image");
	const cap = effectiveImageBytesCap(baseCap, params.imageCompression) ?? baseCap;
	if (params.contentType === "image/gif") {
		if (params.buffer.length > cap) throw new Error(formatCapLimit("GIF", cap, params.buffer.length));
		assertImageSatisfiesHardDimensionPolicy(params.buffer, params.imageCompression);
		return {
			buffer: params.buffer,
			contentType: params.contentType,
			kind: "image",
			fileName: params.fileName
		};
	}
	const meta = {
		contentType: params.contentType,
		fileName: params.fileName
	};
	const originalContentType = resolvePreservableOriginalImageContentType({
		buffer: params.buffer,
		cap,
		contentType: params.contentType,
		fileName: params.fileName,
		policy: params.imageCompression
	});
	if (originalContentType) return {
		buffer: params.buffer,
		contentType: originalContentType,
		kind: "image",
		fileName: params.fileName
	};
	const optimized = await optimizeImageWithFallback({
		buffer: params.buffer,
		cap,
		meta,
		imageCompression: params.imageCompression
	});
	logOptimizedImage({
		originalSize: params.buffer.length,
		optimized
	});
	if (optimized.buffer.length > cap) throw new Error(formatCapReduce("Media", cap, optimized.buffer.length));
	return {
		buffer: optimized.buffer,
		contentType: optimized.mimeType,
		kind: "image",
		fileName: optimized.format === "jpeg" && isHeicSource(params) ? toJpegFileName(params.fileName) : params.fileName
	};
}
async function loadWebMediaInternal(mediaUrl, options = {}) {
	const { maxBytes, optimizeImages = true, ssrfPolicy, proxyUrl, fetchImpl, requestInit, readIdleTimeoutMs, trustExplicitProxyDns, workspaceDir, localRoots, inboundRoots, sandboxValidated = false, readFile: readFileOverride, hostReadCapability = false, imageCompression } = options;
	if (!/^\s*media:\/\//i.test(mediaUrl)) mediaUrl = mediaUrl.replace(/^\s*MEDIA\s*:\s*/i, "");
	mediaUrl = await resolveMediaStoreUriToPath(mediaUrl) ?? mediaUrl;
	if (mediaUrl.startsWith("file://")) try {
		mediaUrl = safeFileURLToPath(mediaUrl);
	} catch (err) {
		throw new LocalMediaAccessError("invalid-file-url", err.message, { cause: err });
	}
	mediaUrl = await resolveHostedPluginMediaUrl(mediaUrl) ?? mediaUrl;
	const optimizeAndClampImage = async (buffer, cap, meta) => {
		const originalSize = buffer.length;
		const optimized = await optimizeImageWithFallback({
			buffer,
			cap,
			meta,
			...imageCompression ? { imageCompression } : {}
		});
		logOptimizedImage({
			originalSize,
			optimized
		});
		if (optimized.buffer.length > cap) throw new Error(formatCapReduce("Media", cap, optimized.buffer.length));
		const fileName = optimized.format === "jpeg" && meta && isHeicSource(meta) ? toJpegFileName(meta.fileName) : meta?.fileName;
		return {
			buffer: optimized.buffer,
			contentType: optimized.mimeType,
			kind: "image",
			fileName
		};
	};
	const clampAndFinalize = async (params) => {
		const cap = maxBytes !== void 0 ? maxBytes : maxBytesForKind(params.kind ?? "document");
		if (params.kind === "image") {
			const imageCap = effectiveImageBytesCap(cap, imageCompression) ?? cap;
			const isGif = params.contentType === "image/gif";
			if (isGif || !optimizeImages) {
				if (params.buffer.length > imageCap) throw new Error(formatCapLimit(isGif ? "GIF" : "Media", imageCap, params.buffer.length));
				assertImageSatisfiesHardDimensionPolicy(params.buffer, imageCompression);
				return {
					buffer: params.buffer,
					contentType: params.contentType,
					kind: params.kind,
					fileName: params.fileName
				};
			}
			const originalContentType = resolvePreservableOriginalImageContentType({
				buffer: params.buffer,
				cap: imageCap,
				contentType: params.contentType,
				fileName: params.fileName,
				policy: imageCompression
			});
			if (originalContentType) return {
				buffer: params.buffer,
				contentType: originalContentType,
				kind: params.kind,
				fileName: params.fileName
			};
			return { ...await optimizeAndClampImage(params.buffer, imageCap, {
				contentType: params.contentType,
				fileName: params.fileName
			}) };
		}
		if (params.buffer.length > cap) throw new Error(formatCapLimit("Media", cap, params.buffer.length));
		return {
			buffer: params.buffer,
			contentType: params.contentType ?? void 0,
			kind: params.kind,
			fileName: params.fileName
		};
	};
	if (/^https?:\/\//i.test(mediaUrl)) {
		const defaultFetchCap = maxBytesForKind("document");
		const { buffer, contentType, fileName } = await readRemoteMediaBuffer({
			url: mediaUrl,
			fetchImpl,
			requestInit,
			readIdleTimeoutMs,
			maxBytes: maxBytes === void 0 ? defaultFetchCap : optimizeImages ? Math.max(maxBytes, defaultFetchCap) : maxBytes,
			ssrfPolicy,
			dispatcherPolicy: proxyUrl ? {
				mode: "explicit-proxy",
				proxyUrl,
				allowPrivateProxy: true
			} : void 0,
			trustExplicitProxyDns
		});
		return await clampAndFinalize({
			buffer,
			contentType,
			kind: kindFromMime(contentType),
			fileName
		});
	}
	if (mediaUrl.startsWith("~")) mediaUrl = resolveUserPath(mediaUrl);
	if (workspaceDir && !path.isAbsolute(mediaUrl) && !WINDOWS_DRIVE_RE.test(mediaUrl)) mediaUrl = path.resolve(workspaceDir, mediaUrl);
	try {
		assertNoWindowsNetworkPath(mediaUrl, "Local media path");
	} catch (err) {
		throw new LocalMediaAccessError("network-path-not-allowed", err.message, { cause: err });
	}
	if ((sandboxValidated || localRoots === "any") && !readFileOverride) throw new LocalMediaAccessError("unsafe-bypass", "Refusing localRoots bypass without readFile override. Use sandboxValidated with readFile, or pass explicit localRoots.");
	if (!(sandboxValidated || localRoots === "any")) await assertLocalMediaAllowed(mediaUrl, localRoots, { inboundRoots });
	let data;
	if (readFileOverride) data = await readFileOverride(mediaUrl);
	else try {
		data = (await readLocalFileSafely({ filePath: mediaUrl })).buffer;
	} catch (err) {
		if (err instanceof FsSafeError) {
			if (err.code === "not-found") throw new LocalMediaAccessError("not-found", `Local media file not found: ${mediaUrl}`, { cause: err });
			if (err.code === "not-file") throw new LocalMediaAccessError("not-file", `Local media path is not a file: ${mediaUrl}`, { cause: err });
			throw new LocalMediaAccessError("invalid-path", `Local media path is not safe to read: ${mediaUrl}`, { cause: err });
		}
		throw err;
	}
	const sniffedMime = await detectMime({ buffer: data });
	const mime = await detectMime({
		buffer: data,
		filePath: mediaUrl
	});
	const kind = kindFromMime(mime);
	if (hostReadCapability) assertHostReadMediaAllowed({
		sniffedContentType: sniffedMime,
		contentType: mime,
		filePath: mediaUrl,
		kind,
		buffer: data
	});
	let fileName = basenameFromAnyPath(mediaUrl) || void 0;
	if (fileName && !extnameFromAnyPath(fileName) && mime) {
		const ext = extensionForMime(mime);
		if (ext) fileName = `${fileName}${ext}`;
	}
	return await clampAndFinalize({
		buffer: data,
		contentType: mime,
		kind,
		fileName
	});
}
async function loadWebMedia(mediaUrl, maxBytesOrOptions, options) {
	return await loadWebMediaInternal(mediaUrl, resolveWebMediaOptions({
		maxBytesOrOptions,
		options,
		optimizeImages: true
	}));
}
async function loadWebMediaRaw(mediaUrl, maxBytesOrOptions, options) {
	return await loadWebMediaInternal(mediaUrl, resolveWebMediaOptions({
		maxBytesOrOptions,
		options,
		optimizeImages: false
	}));
}
async function optimizeImageToJpeg(buffer, maxBytes, opts = {}) {
	const { sides, qualities } = resolveImageCompressionGrid(opts.imageCompression);
	const optimized = await createImageProcessor().encode(buffer, {
		format: "auto",
		maxBytes,
		opaque: { format: "jpeg" },
		search: {
			maxSide: sides,
			quality: qualities
		},
		transparency: "flatten"
	});
	return {
		buffer: optimized.data,
		optimizedSize: optimized.bytes,
		resizeSide: optimized.chosen.maxSide ?? Math.max(optimized.width, optimized.height),
		quality: optimized.chosen.quality ?? qualities.at(-1) ?? 85
	};
}
//#endregion
export { optimizeImageToJpeg as a, optimizeImageBufferForWebMedia as i, loadWebMedia as n, resolveImageCompressionGrid as o, loadWebMediaRaw as r, effectiveImageBytesCap as t };
