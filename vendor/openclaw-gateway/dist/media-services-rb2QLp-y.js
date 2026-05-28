import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { r as writeExternalFileWithinRoot } from "./fs-safe-JUdtLZkh.js";
import { n as resolvePreferredOpenClawTmpDir } from "./tmp-openclaw-dir-C60hWKdY.js";
import { n as tempWorkspaceSync, r as withTempWorkspace } from "./private-temp-workspace-BzJHrK4c.js";
import { t as resolveSystemBin } from "./resolve-system-bin-Bag9s6mC.js";
import { t as basenameFromAnyPath } from "./file-name-r4prf02z.js";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { RastermillError, RastermillUnavailableError, createRastermill, isRastermillUnavailableError, readImageMetadataFromHeader, readImageProbeFromHeader } from "rastermill";
//#region src/media/ffmpeg-limits.ts
const MEDIA_FFMPEG_MAX_BUFFER_BYTES = 10 * 1024 * 1024;
const MEDIA_FFPROBE_TIMEOUT_MS = 1e4;
const MEDIA_FFMPEG_TIMEOUT_MS = 45e3;
const MEDIA_FFMPEG_MAX_AUDIO_DURATION_SECS = 1200;
//#endregion
//#region src/media/ffmpeg-exec.ts
const execFileAsync = promisify(execFile);
function resolveExecOptions(defaultTimeoutMs, options) {
	return {
		timeout: options?.timeoutMs ?? defaultTimeoutMs,
		maxBuffer: options?.maxBufferBytes ?? 10485760
	};
}
function requireSystemBin(name) {
	const resolved = resolveSystemBin(name, { trust: "standard" });
	if (!resolved) {
		const hint = process.platform === "darwin" ? "e.g. brew install ffmpeg" : "e.g. apt install ffmpeg / dnf install ffmpeg";
		throw new Error(`${name} not found in trusted system directories. Install it via your system package manager (${hint}).`);
	}
	return resolved;
}
function resolveFfmpegBin() {
	return requireSystemBin("ffmpeg");
}
function isBrokenPipeError(error) {
	return error.code === "EPIPE";
}
async function runFfprobe(args, options) {
	const execOptions = resolveExecOptions(MEDIA_FFPROBE_TIMEOUT_MS, options);
	if (options?.input == null) {
		const { stdout } = await execFileAsync(requireSystemBin("ffprobe"), args, execOptions);
		return stdout.toString();
	}
	return await new Promise((resolve, reject) => {
		let stdinWriteError;
		const proc = execFile(requireSystemBin("ffprobe"), args, execOptions, (err, stdout) => {
			if (err) {
				reject(err);
				return;
			}
			if (stdinWriteError && !isBrokenPipeError(stdinWriteError)) {
				reject(stdinWriteError);
				return;
			}
			resolve(stdout.toString());
		});
		proc.stdin?.once("error", (err) => {
			stdinWriteError = err;
		});
		proc.stdin?.end(options.input);
	});
}
async function runFfmpeg(args, options) {
	const { stdout } = await execFileAsync(resolveFfmpegBin(), args, resolveExecOptions(MEDIA_FFMPEG_TIMEOUT_MS, options));
	return stdout.toString();
}
function parseFfprobeCsvFields(stdout, maxFields) {
	return stdout.trim().split(/[,\r\n]+/, maxFields).map((field) => normalizeLowercaseStringOrEmpty(field));
}
function parseFfprobeCodecAndSampleRate(stdout) {
	const [codecRaw, sampleRateRaw] = parseFfprobeCsvFields(stdout, 2);
	const codec = codecRaw ? codecRaw : null;
	const sampleRate = sampleRateRaw ? Number.parseInt(sampleRateRaw, 10) : NaN;
	return {
		codec,
		sampleRateHz: Number.isFinite(sampleRate) ? sampleRate : null
	};
}
//#endregion
//#region src/media/audio-transcode.ts
const DEFAULT_OPUS_SAMPLE_RATE_HZ = 48e3;
const DEFAULT_OPUS_BITRATE = "64k";
const DEFAULT_OPUS_CHANNELS = 1;
const DEFAULT_TEMP_PREFIX = "audio-opus-";
const DEFAULT_OUTPUT_FILE_NAME = "voice.opus";
function normalizeAudioExtension(params) {
	const fromExtension = params.inputExtension?.trim();
	const normalized = (fromExtension ? fromExtension.startsWith(".") ? fromExtension : `.${fromExtension}` : path.extname(params.inputFileName ?? "")).toLowerCase();
	return /^\.[a-z0-9]{1,12}$/.test(normalized) ? normalized : ".audio";
}
function normalizeTempPrefix(value) {
	const sanitized = value?.trim().replace(/[^a-zA-Z0-9._-]/g, "-");
	if (!sanitized || sanitized === "." || sanitized === "..") return DEFAULT_TEMP_PREFIX;
	return sanitized.endsWith("-") ? sanitized : `${sanitized}-`;
}
function normalizeOutputFileName(value) {
	const baseName = basenameFromAnyPath(value?.trim() || DEFAULT_OUTPUT_FILE_NAME);
	if (/^[a-zA-Z0-9._-]{1,80}$/.test(baseName) && baseName !== "." && baseName !== "..") return baseName;
	return DEFAULT_OUTPUT_FILE_NAME;
}
async function transcodeAudioBufferToOpus(params) {
	return await withTempWorkspace({
		rootDir: resolvePreferredOpenClawTmpDir(),
		prefix: normalizeTempPrefix(params.tempPrefix)
	}, async (workspace) => {
		const inputPath = await workspace.write(`input${normalizeAudioExtension(params)}`, params.audioBuffer);
		const outputFileName = normalizeOutputFileName(params.outputFileName);
		await writeExternalFileWithinRoot({
			rootDir: workspace.dir,
			path: outputFileName,
			write: async (outputPath) => {
				await runFfmpeg([
					"-hide_banner",
					"-loglevel",
					"error",
					"-y",
					"-i",
					inputPath,
					"-vn",
					"-sn",
					"-dn",
					"-c:a",
					"libopus",
					"-b:a",
					params.bitrate ?? DEFAULT_OPUS_BITRATE,
					"-ar",
					String(params.sampleRateHz ?? DEFAULT_OPUS_SAMPLE_RATE_HZ),
					"-ac",
					String(params.channels ?? DEFAULT_OPUS_CHANNELS),
					"-f",
					"opus",
					outputPath
				], { timeoutMs: params.timeoutMs });
			}
		});
		return await workspace.read(outputFileName);
	});
}
async function transcodeAudioBuffer(params) {
	const source = normalizeContainerExt(params.sourceExtension);
	const target = normalizeContainerExt(params.targetExtension);
	if (!source || !target) return {
		ok: false,
		reason: "invalid-extension"
	};
	if (source === target) return {
		ok: false,
		reason: "noop-same-container"
	};
	const recipe = pickAfconvertRecipe(source, target);
	if (!recipe) return {
		ok: false,
		reason: "no-recipe"
	};
	if (process.platform !== "darwin") return {
		ok: false,
		reason: "platform-unsupported"
	};
	const tmp = tempWorkspaceSync({
		rootDir: resolvePreferredOpenClawTmpDir(),
		prefix: "tts-transcode-"
	});
	const inPath = tmp.write(`in.${source}`, params.audioBuffer);
	const outPath = tmp.path(`out.${target}`);
	try {
		const result = await runAfconvert({
			args: [
				...recipe,
				inPath,
				outPath
			],
			timeoutMs: params.timeoutMs ?? 5e3
		});
		if (!result.ok) return {
			ok: false,
			reason: "transcoder-failed",
			detail: result.detail
		};
		return {
			ok: true,
			buffer: tmp.read(`out.${target}`)
		};
	} catch (err) {
		return {
			ok: false,
			reason: "transcoder-failed",
			detail: err.message
		};
	} finally {
		tmp.cleanup();
	}
}
function normalizeContainerExt(ext) {
	const trimmed = ext.trim().toLowerCase().replace(/^\./, "");
	return /^[a-z0-9]{1,12}$/.test(trimmed) ? trimmed : void 0;
}
function pickAfconvertRecipe(_source, target) {
	if (target === "caf") return [
		"-f",
		"caff",
		"-d",
		"opus@24000",
		"-c",
		"1"
	];
}
function runAfconvert(params) {
	return new Promise((resolve) => {
		const child = spawn("/usr/bin/afconvert", params.args, { stdio: "ignore" });
		const timer = setTimeout(() => {
			child.kill("SIGKILL");
			resolve({
				ok: false,
				detail: `timeout-${params.timeoutMs}ms`
			});
		}, params.timeoutMs);
		child.once("error", (err) => {
			clearTimeout(timer);
			resolve({
				ok: false,
				detail: err.message
			});
		});
		child.once("exit", (code) => {
			clearTimeout(timer);
			resolve(code === 0 ? { ok: true } : {
				ok: false,
				detail: `exit-${code ?? "unknown"}`
			});
		});
	});
}
//#endregion
//#region src/media/image-ops.ts
var ImageProcessorUnavailableError = class extends Error {
	constructor(operation, message, causes = []) {
		super(message ?? `Image processor unavailable for ${operation}`, { cause: causes.find((cause) => cause instanceof Error) });
		this.code = "IMAGE_PROCESSOR_UNAVAILABLE";
		this.name = "ImageProcessorUnavailableError";
		this.operation = operation;
		this.causes = causes;
	}
};
const IMAGE_REDUCE_QUALITY_STEPS = [
	85,
	75,
	65,
	55,
	45,
	35
];
const MAX_IMAGE_INPUT_PIXELS = 25e6;
function createImageProcessor() {
	return createRastermill({
		execution: "auto",
		limits: {
			inputPixels: MAX_IMAGE_INPUT_PIXELS,
			outputPixels: MAX_IMAGE_INPUT_PIXELS
		},
		temp: {
			rootDir: resolvePreferredOpenClawTmpDir(),
			prefix: "openclaw-img-"
		},
		commandResolver: (command) => resolveSystemBin(command, { trust: command === "powershell" ? "strict" : "standard" })
	});
}
function isImageProcessorUnavailableError(err) {
	return err instanceof ImageProcessorUnavailableError || isRastermillUnavailableError(err);
}
function buildImageResizeSideGrid(maxSide, sideStart) {
	return [
		sideStart,
		1800,
		1600,
		1400,
		1200,
		1e3,
		800
	].map((value) => Math.min(maxSide, value)).filter((value, idx, arr) => value > 0 && arr.indexOf(value) === idx).toSorted((a, b) => b - a);
}
function readImageMetadataFromHeader$1(buffer) {
	return readImageMetadataFromHeader(buffer);
}
function readImageProbeFromHeader$1(buffer) {
	return readImageProbeFromHeader(buffer);
}
function wrapRastermillUnavailable(operation, error) {
	if (error instanceof RastermillUnavailableError) throw new ImageProcessorUnavailableError(operation, error.message, error.causes);
	throw error;
}
async function getImageMetadata(buffer) {
	const info = await createImageProcessor().probe(buffer);
	return info ? {
		width: info.width,
		height: info.height
	} : null;
}
async function normalizeExifOrientation(buffer) {
	try {
		const rastermill = createImageProcessor();
		const info = await rastermill.probe(buffer);
		if (!info) return (await rastermill.encode(buffer, {
			format: "jpeg",
			autoOrient: true
		})).data;
		if (!info?.orientation || info.orientation === 1) return buffer;
		return (await rastermill.encode(buffer, {
			format: "jpeg",
			autoOrient: true
		})).data;
	} catch (error) {
		if (isImageProcessorUnavailableError(error)) return buffer;
		throw error;
	}
}
async function resizeToJpeg(params) {
	try {
		return (await createImageProcessor().encode(params.buffer, {
			format: "jpeg",
			resize: {
				maxSide: params.maxSide,
				enlarge: params.withoutEnlargement === false
			},
			quality: params.quality
		})).data;
	} catch (error) {
		return wrapRastermillUnavailable("resizeToJpeg", error);
	}
}
async function convertHeicToJpeg(buffer) {
	try {
		return (await createImageProcessor().encode(buffer, { format: "jpeg" })).data;
	} catch (error) {
		return wrapRastermillUnavailable("convertHeicToJpeg", error);
	}
}
async function hasAlphaChannel(buffer) {
	try {
		return (await createImageProcessor().transparency(buffer)).hasAlphaChannel;
	} catch (error) {
		const headerHasAlpha = readImageProbeFromHeader(buffer)?.hasAlpha === true;
		if (isRastermillUnavailableError(error)) return headerHasAlpha;
		if (error instanceof RastermillError && error.code === "RASTERMILL_UNDECODABLE" && readImageProbeFromHeader(buffer)) return headerHasAlpha;
		throw error;
	}
}
async function resizeToPng(params) {
	try {
		return (await createImageProcessor().encode(params.buffer, {
			format: "png",
			resize: {
				maxSide: params.maxSide,
				enlarge: params.withoutEnlargement === false
			},
			...params.compressionLevel === void 0 ? {} : { compressionLevel: params.compressionLevel }
		})).data;
	} catch (error) {
		return wrapRastermillUnavailable("resizeToPng", error);
	}
}
async function optimizeImageToPng(buffer, maxBytes, options) {
	let out;
	try {
		out = await createImageProcessor().encode(buffer, {
			format: "png",
			maxBytes,
			search: options?.sides === void 0 ? {} : { maxSide: options.sides }
		});
	} catch (error) {
		wrapRastermillUnavailable("optimizeImageToPng", error);
	}
	return {
		buffer: out.data,
		optimizedSize: out.bytes,
		resizeSide: out.chosen.maxSide ?? out.width,
		compressionLevel: out.chosen.compressionLevel ?? 6
	};
}
//#endregion
//#region src/media/video-dimensions.ts
function parsePositiveDimension(value) {
	if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return;
	return value;
}
function parseFfprobeVideoDimensions(stdout) {
	const stream = JSON.parse(stdout).streams?.[0];
	const width = parsePositiveDimension(stream?.width);
	const height = parsePositiveDimension(stream?.height);
	return width && height ? {
		width,
		height
	} : void 0;
}
async function probeVideoDimensions(buffer) {
	try {
		return parseFfprobeVideoDimensions(await runFfprobe([
			"-v",
			"error",
			"-select_streams",
			"v:0",
			"-show_entries",
			"stream=width,height",
			"-of",
			"json",
			"pipe:0"
		], { input: buffer }));
	} catch {
		return;
	}
}
//#endregion
export { runFfmpeg as C, MEDIA_FFMPEG_TIMEOUT_MS as D, MEDIA_FFMPEG_MAX_BUFFER_BYTES as E, MEDIA_FFPROBE_TIMEOUT_MS as O, resolveFfmpegBin as S, MEDIA_FFMPEG_MAX_AUDIO_DURATION_SECS as T, resizeToPng as _, MAX_IMAGE_INPUT_PIXELS as a, parseFfprobeCodecAndSampleRate as b, createImageProcessor as c, isImageProcessorUnavailableError as d, normalizeExifOrientation as f, resizeToJpeg as g, readImageProbeFromHeader$1 as h, ImageProcessorUnavailableError as i, getImageMetadata as l, readImageMetadataFromHeader$1 as m, probeVideoDimensions as n, buildImageResizeSideGrid as o, optimizeImageToPng as p, IMAGE_REDUCE_QUALITY_STEPS as r, convertHeicToJpeg as s, parseFfprobeVideoDimensions as t, hasAlphaChannel as u, transcodeAudioBuffer as v, runFfprobe as w, parseFfprobeCsvFields as x, transcodeAudioBufferToOpus as y };
