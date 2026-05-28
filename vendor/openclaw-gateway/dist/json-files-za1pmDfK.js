import "./fs-safe-defaults-B7hUN42l.js";
import { m as FsSafeError } from "./path-BlG8lhgR.js";
import { t as stringifyJsonDocument } from "./json-stringify-DYDqVIo7.js";
import { i as openRootFileSync } from "./root-file-jRMCpJW4.js";
import { i as readRegularFileSync, o as statRegularFile, r as readRegularFile } from "./regular-file-BFvcwX3y.js";
import { n as replaceFileAtomic$1, r as replaceFileAtomic } from "./replace-file-C7_Inj8B.js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
//#region node_modules/@openclaw/fs-safe/dist/text-atomic.js
async function writeTextAtomic$1(filePath, content, options) {
	const payload = options?.trailingNewline && !content.endsWith("\n") ? `${content}\n` : content;
	const durable = options?.durable ?? true;
	await replaceFileAtomic({
		filePath,
		content: payload,
		mode: options?.mode ?? 384,
		dirMode: options?.dirMode ?? 511 & ~process.umask(),
		copyFallbackOnPermissionError: true,
		syncTempFile: durable,
		syncParentDir: durable
	});
}
//#endregion
//#region node_modules/@openclaw/fs-safe/dist/json.js
const READ_RETRY_MAX_ATTEMPTS = 5;
const READ_RETRY_BASE_DELAY_MS = 50;
function isRetryableReadError(err, options) {
	if (err instanceof FsSafeError && err.code === "path-mismatch") return true;
	if (options.retryOpenRaceErrors !== true) return false;
	const code = getErrorCode(err);
	return code === "ENOENT" || code === "EPERM";
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
async function readRegularFileWithRetry(filePath, options = {}) {
	let lastErr;
	for (let attempt = 0; attempt < READ_RETRY_MAX_ATTEMPTS; attempt++) try {
		return (await readRegularFile({ filePath })).buffer;
	} catch (err) {
		lastErr = err;
		if (!isRetryableReadError(err, options) || attempt === READ_RETRY_MAX_ATTEMPTS - 1) throw err;
		await sleep(READ_RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
	}
	throw lastErr;
}
async function readRegularFileIfExistsWithRetry(filePath) {
	if ((await statRegularFile(filePath)).missing) return null;
	return await readRegularFileWithRetry(filePath, { retryOpenRaceErrors: true });
}
const JSON_FILE_MODE = 384;
const JSON_DIR_MODE = 448;
const SUPPORTS_SYNC_NOFOLLOW = process.platform !== "win32" && "O_NOFOLLOW" in fs.constants;
function getErrorCode(err) {
	return err instanceof Error ? err.code : void 0;
}
function trySetSecureMode(pathname) {
	let fd;
	try {
		fd = fs.openSync(pathname, fs.constants.O_RDONLY | (SUPPORTS_SYNC_NOFOLLOW ? fs.constants.O_NOFOLLOW : 0));
		fs.fchmodSync(fd, JSON_FILE_MODE);
	} catch {} finally {
		if (fd !== void 0) try {
			fs.closeSync(fd);
		} catch {}
	}
}
function trySyncDirectory(pathname) {
	let fd;
	try {
		fd = fs.openSync(path.dirname(pathname), "r");
		fs.fsyncSync(fd);
	} catch {} finally {
		if (fd !== void 0) try {
			fs.closeSync(fd);
		} catch {}
	}
}
function renameJsonFileWithFallback(tmpPath, pathname) {
	try {
		fs.renameSync(tmpPath, pathname);
		return;
	} catch (error) {
		const code = error.code;
		if (code === "EPERM" || code === "EEXIST") {
			if ((() => {
				try {
					return fs.lstatSync(pathname);
				} catch (lstatError) {
					if (lstatError.code === "ENOENT") return null;
					throw lstatError;
				}
			})()?.isSymbolicLink()) {
				fs.rmSync(pathname, { force: true });
				fs.renameSync(tmpPath, pathname);
				return;
			}
			fs.rmSync(pathname, { force: true });
			fs.renameSync(tmpPath, pathname);
			return;
		}
		throw error;
	}
}
function writeTempJsonFile(pathname, payload) {
	const fd = fs.openSync(pathname, "wx", JSON_FILE_MODE);
	try {
		fs.writeFileSync(fd, payload, "utf8");
		fs.fsyncSync(fd);
	} finally {
		fs.closeSync(fd);
	}
}
function tryReadJsonSync(pathname) {
	try {
		const raw = readRegularFileSync({ filePath: pathname }).buffer.toString("utf8");
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function writeJsonSync(pathname, data) {
	const targetPath = pathname;
	const tmpPath = `${targetPath}.${randomUUID()}.tmp`;
	const payload = `${stringifyJsonDocument(data, null, 2)}\n`;
	fs.mkdirSync(path.dirname(targetPath), {
		recursive: true,
		mode: JSON_DIR_MODE
	});
	try {
		writeTempJsonFile(tmpPath, payload);
		trySetSecureMode(tmpPath);
		renameJsonFileWithFallback(tmpPath, targetPath);
		trySetSecureMode(targetPath);
		trySyncDirectory(targetPath);
	} finally {
		try {
			fs.rmSync(tmpPath, { force: true });
		} catch {}
	}
}
var JsonFileReadError = class extends Error {
	filePath;
	reason;
	constructor(filePath, reason, cause) {
		super(`Failed to ${reason} JSON file: ${filePath}`, { cause });
		this.name = "JsonFileReadError";
		this.filePath = filePath;
		this.reason = reason;
	}
};
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function resolveInvalidMessage(invalidMessage, relativePath) {
	if (typeof invalidMessage === "function") return invalidMessage(relativePath);
	return invalidMessage ?? `${relativePath} has an unexpected shape`;
}
function readRootStructuredFileSync(options) {
	const opened = openRootFileSync({
		absolutePath: path.resolve(options.rootDir, options.relativePath),
		rootPath: options.rootDir,
		...options.rootRealPath !== void 0 ? { rootRealPath: options.rootRealPath } : {},
		boundaryLabel: options.boundaryLabel,
		rejectHardlinks: options.rejectHardlinks,
		maxBytes: options.maxBytes,
		allowedType: "file"
	});
	if (!opened.ok) return {
		ok: false,
		reason: "open",
		failure: opened
	};
	try {
		const parsed = options.parse(fs.readFileSync(opened.fd, "utf8"));
		if (options.validate && !options.validate(parsed)) return {
			ok: false,
			reason: "invalid",
			error: resolveInvalidMessage(options.invalidMessage, options.relativePath)
		};
		return {
			ok: true,
			value: parsed,
			stat: opened.stat,
			path: opened.path,
			rootRealPath: opened.rootRealPath
		};
	} catch (error) {
		return {
			ok: false,
			reason: "parse",
			error: `failed to parse ${options.relativePath}: ${String(error)}`
		};
	} finally {
		fs.closeSync(opened.fd);
	}
}
function readRootJsonSync(options) {
	return readRootStructuredFileSync({
		...options,
		parse: (raw) => JSON.parse(raw)
	});
}
function readRootJsonObjectSync(options) {
	return readRootStructuredFileSync({
		...options,
		parse: (raw) => JSON.parse(raw),
		validate: isRecord,
		invalidMessage: (relativePath) => `${relativePath} must contain a JSON object`
	});
}
async function readJson$1(filePath) {
	let raw;
	try {
		raw = (await readRegularFileWithRetry(filePath, { retryOpenRaceErrors: true })).toString("utf8");
	} catch (err) {
		throw new JsonFileReadError(filePath, "read", err);
	}
	try {
		return JSON.parse(raw);
	} catch (err) {
		throw new JsonFileReadError(filePath, "parse", err);
	}
}
async function readJsonIfExists$1(filePath) {
	let raw;
	try {
		const buffer = await readRegularFileIfExistsWithRetry(filePath);
		if (buffer === null) return null;
		raw = buffer.toString("utf8");
	} catch (err) {
		if (getErrorCode(err) === "ENOENT") return null;
		throw new JsonFileReadError(filePath, "read", err);
	}
	try {
		return JSON.parse(raw);
	} catch (err) {
		throw new JsonFileReadError(filePath, "parse", err);
	}
}
function readJsonSync(filePath) {
	let raw;
	try {
		raw = readRegularFileSync({ filePath }).buffer.toString("utf8");
	} catch (err) {
		throw new JsonFileReadError(filePath, "read", err);
	}
	try {
		return JSON.parse(raw);
	} catch (err) {
		throw new JsonFileReadError(filePath, "parse", err);
	}
}
async function writeJson(filePath, value, options) {
	await writeTextAtomic$1(filePath, stringifyJsonDocument(value, null, 2), {
		mode: options?.mode,
		dirMode: options?.dirMode,
		trailingNewline: options?.trailingNewline,
		durable: options?.durable
	});
}
//#endregion
//#region src/infra/json-files.ts
async function readJson(filePath) {
	try {
		return await readJson$1(filePath);
	} catch (err) {
		throw err instanceof JsonFileReadError ? err : new JsonFileReadError(filePath, "read", err);
	}
}
async function readJsonFileStrict(filePath) {
	return readJson(filePath);
}
async function readJsonIfExists(filePath) {
	try {
		return await readJsonIfExists$1(filePath);
	} catch (err) {
		if (err instanceof JsonFileReadError) throw err;
		throw new JsonFileReadError(filePath, "read", err);
	}
}
async function readDurableJsonFile(filePath) {
	return readJsonIfExists(filePath);
}
/**
* tryReadJson delegates to readJsonIfExists instead of the internal
* tryReadJsonImpl from @openclaw/fs-safe. The fs-safe implementation retries
* race conditions before propagating errors; this wrapper keeps the historical
* null-on-error contract for callers that intentionally treat reads as optional.
*/
async function tryReadJson(filePath) {
	try {
		return await readJsonIfExists(filePath);
	} catch {
		return null;
	}
}
async function readJsonFile(filePath) {
	return tryReadJson(filePath);
}
async function writeTextAtomic(filePath, content, options) {
	await replaceFileAtomic$1({
		filePath,
		content: options?.trailingNewline && !content.endsWith("\n") ? `${content}\n` : content,
		mode: options?.mode ?? 384,
		dirMode: options?.dirMode ?? 511 & ~process.umask(),
		copyFallbackOnPermissionError: true,
		syncTempFile: options?.durable !== false,
		syncParentDir: options?.durable !== false,
		...options?.tempPrefix ? { tempPrefix: options.tempPrefix } : {}
	});
}
//#endregion
export { readJsonIfExists as a, JsonFileReadError as c, readRootJsonSync as d, readRootStructuredFileSync as f, writeJsonSync as h, readJsonFileStrict as i, readJsonSync as l, writeJson as m, readJson as n, tryReadJson as o, tryReadJsonSync as p, readJsonFile as r, writeTextAtomic as s, readDurableJsonFile as t, readRootJsonObjectSync as u };
