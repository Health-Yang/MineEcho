import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { t as readCliStartupMetadata } from "./startup-metadata-CCK-kryO.js";
//#region src/cli/channel-options.ts
function dedupe(values) {
	return uniqueStrings(values.filter(Boolean));
}
let precomputedChannelOptions;
function loadPrecomputedChannelOptions() {
	if (precomputedChannelOptions !== void 0) return precomputedChannelOptions;
	try {
		const parsed = readCliStartupMetadata(import.meta.url);
		if (parsed && Array.isArray(parsed.channelOptions)) {
			precomputedChannelOptions = dedupe(parsed.channelOptions.filter((value) => typeof value === "string"));
			return precomputedChannelOptions;
		}
	} catch {}
	precomputedChannelOptions = null;
	return null;
}
function resolveCliChannelOptions() {
	return loadPrecomputedChannelOptions() ?? [];
}
function formatCliChannelOptions(extra = []) {
	const options = [...extra, ...resolveCliChannelOptions()];
	return options.length > 0 ? options.join("|") : "channel";
}
//#endregion
export { resolveCliChannelOptions as n, formatCliChannelOptions as t };
