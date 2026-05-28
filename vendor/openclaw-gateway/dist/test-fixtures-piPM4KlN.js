import "./safe-text-J_0sTthZ.js";
import "./system-events-BbV9wJlR.js";
import { n as encodePngRgba, t as encodePngRgb } from "./png-encode-CPyKVqD3.js";
import "./typed-cases-DUmya71h.js";
import { deflateSync } from "node:zlib";
//#region src/plugin-sdk/test-helpers/sandbox-fixtures.ts
function createSandboxBrowserConfig(overrides = {}) {
	return {
		enabled: false,
		image: "openclaw-browser",
		containerPrefix: "openclaw-browser-",
		network: "bridge",
		cdpPort: 9222,
		vncPort: 5900,
		noVncPort: 6080,
		headless: true,
		enableNoVnc: false,
		allowHostControl: false,
		autoStart: false,
		autoStartTimeoutMs: 1e3,
		...overrides
	};
}
function createSandboxPruneConfig(overrides = {}) {
	return {
		idleHours: 24,
		maxAgeDays: 7,
		...overrides
	};
}
function createSandboxSshConfig(workspaceRoot, overrides = {}) {
	return {
		command: "ssh",
		workspaceRoot,
		strictHostKeyChecking: true,
		updateHostKeys: true,
		...overrides
	};
}
//#endregion
//#region src/plugin-sdk/test-helpers/bundled-plugin-paths.ts
const BUNDLED_PLUGIN_ROOT_DIR = "extensions";
const BUNDLED_PLUGIN_PATH_PREFIX = `${BUNDLED_PLUGIN_ROOT_DIR}/`;
const BUNDLED_PLUGIN_TEST_GLOB = `${BUNDLED_PLUGIN_ROOT_DIR}/**/*.test.ts`;
function bundledPluginRoot(pluginId) {
	return `${BUNDLED_PLUGIN_PATH_PREFIX}${pluginId}`;
}
function bundledPluginFile(pluginId, relativePath) {
	return `${bundledPluginRoot(pluginId)}/${relativePath}`;
}
function joinRoot(baseDir, relativePath) {
	return `${baseDir.replace(/\/$/, "")}/${relativePath}`;
}
function bundledPluginDirPrefix(pluginId, relativeDir) {
	return `${bundledPluginRoot(pluginId)}/${relativeDir.replace(/\/$/, "")}/`;
}
function bundledPluginRootAt(baseDir, pluginId) {
	return joinRoot(baseDir, bundledPluginRoot(pluginId));
}
function bundledPluginFileAt(baseDir, pluginId, relativePath) {
	return joinRoot(baseDir, bundledPluginFile(pluginId, relativePath));
}
function bundledDistPluginRoot(pluginId) {
	return `dist/${bundledPluginRoot(pluginId)}`;
}
function bundledDistPluginFile(pluginId, relativePath) {
	return `${bundledDistPluginRoot(pluginId)}/${relativePath}`;
}
function bundledDistPluginRootAt(baseDir, pluginId) {
	return joinRoot(baseDir, bundledDistPluginRoot(pluginId));
}
function bundledDistPluginFileAt(baseDir, pluginId, relativePath) {
	return joinRoot(baseDir, bundledDistPluginFile(pluginId, relativePath));
}
function installedPluginRoot(baseDir, pluginId) {
	return bundledPluginRootAt(baseDir, pluginId);
}
function repoInstallSpec(pluginId) {
	return `./${bundledPluginRoot(pluginId)}`;
}
//#endregion
//#region src/plugin-sdk/test-helpers/import-fresh.ts
async function importFreshModule(from, specifier) {
	return await import(
		/* @vite-ignore */
		new URL(specifier, from).href
);
}
//#endregion
//#region src/plugin-sdk/test-helpers/image-fixtures.ts
const PNG_SIGNATURE = Buffer.from([
	137,
	80,
	78,
	71,
	13,
	10,
	26,
	10
]);
Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EFBQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EFBABAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z", "base64");
const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let index = 0; index < table.length; index += 1) {
		let value = index;
		for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 3988292384 ^ value >>> 1 : value >>> 1;
		table[index] = value >>> 0;
	}
	return table;
})();
function crc32(buffer) {
	let crc = 4294967295;
	for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 255] ^ crc >>> 8;
	return (crc ^ 4294967295) >>> 0;
}
function pngChunk(type, data) {
	const typeBuffer = Buffer.from(type, "ascii");
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length, 0);
	const crc = Buffer.alloc(4);
	crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
	return Buffer.concat([
		length,
		typeBuffer,
		data,
		crc
	]);
}
function fillSolidRgba(width, height, color) {
	const pixels = Buffer.alloc(width * height * 4);
	for (let offset = 0; offset < pixels.length; offset += 4) {
		pixels[offset] = color.r;
		pixels[offset + 1] = color.g;
		pixels[offset + 2] = color.b;
		pixels[offset + 3] = color.a ?? 255;
	}
	return pixels;
}
function fillSolidRgb(width, height, color) {
	const pixels = Buffer.alloc(width * height * 3);
	for (let offset = 0; offset < pixels.length; offset += 3) {
		pixels[offset] = color.r;
		pixels[offset + 1] = color.g;
		pixels[offset + 2] = color.b;
	}
	return pixels;
}
function createSolidPngBuffer(width, height, color) {
	if (color.a === void 0 || color.a === 255) return encodePngRgb(fillSolidRgb(width, height, color), width, height);
	return encodePngRgba(fillSolidRgba(width, height, color), width, height);
}
function createNoisyPngBuffer(width, height) {
	const rgba = createNoisyRgbaBuffer(width, height);
	const rgb = Buffer.alloc(width * height * 3);
	for (let source = 0, target = 0; source < rgba.length; source += 4, target += 3) {
		rgb[target] = rgba[source] ?? 0;
		rgb[target + 1] = rgba[source + 1] ?? 0;
		rgb[target + 2] = rgba[source + 2] ?? 0;
	}
	return encodePngRgb(rgb, width, height);
}
function createGrayscaleAlphaPngBuffer(width, height) {
	const stride = width * 2;
	const raw = Buffer.alloc((stride + 1) * height);
	for (let row = 0; row < height; row += 1) {
		const rawOffset = row * (stride + 1);
		raw[rawOffset] = 0;
		for (let column = 0; column < width; column += 1) {
			const pixel = rawOffset + 1 + column * 2;
			const seed = row * width + column;
			raw[pixel] = seed % 256;
			raw[pixel + 1] = seed % 5 === 0 ? 96 : 255;
		}
	}
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(width, 0);
	ihdr.writeUInt32BE(height, 4);
	ihdr[8] = 8;
	ihdr[9] = 4;
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;
	return Buffer.concat([
		PNG_SIGNATURE,
		pngChunk("IHDR", ihdr),
		pngChunk("IDAT", deflateSync(raw)),
		pngChunk("IEND", Buffer.alloc(0))
	]);
}
function createNoisyRgbaBuffer(width, height) {
	const pixels = Buffer.alloc(width * height * 4);
	for (let offset = 0; offset < pixels.length; offset += 4) {
		const seed = offset / 4;
		pixels[offset] = seed % 251;
		pixels[offset + 1] = seed * 17 % 253;
		pixels[offset + 2] = seed * 29 % 255;
		pixels[offset + 3] = 255;
	}
	return pixels;
}
//#endregion
export { createSandboxSshConfig as S, bundledPluginRootAt as _, importFreshModule as a, createSandboxBrowserConfig as b, BUNDLED_PLUGIN_TEST_GLOB as c, bundledDistPluginRoot as d, bundledDistPluginRootAt as f, bundledPluginRoot as g, bundledPluginFileAt as h, createSolidPngBuffer as i, bundledDistPluginFile as l, bundledPluginFile as m, createNoisyPngBuffer as n, BUNDLED_PLUGIN_PATH_PREFIX as o, bundledPluginDirPrefix as p, createNoisyRgbaBuffer as r, BUNDLED_PLUGIN_ROOT_DIR as s, createGrayscaleAlphaPngBuffer as t, bundledDistPluginFileAt as u, installedPluginRoot as v, createSandboxPruneConfig as x, repoInstallSpec as y };
