import { i as resolveAutoLiveToolResultMaxChars, n as calculateMaxToolResultCharsWithCap } from "./tool-result-truncation-B6rIoGLw.js";
//#region src/flows/doctor-tool-result-cap-advice.ts
function formatNumber(value) {
	return String(Math.max(0, Math.floor(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function buildToolResultCapDoctorAdvice(params) {
	if (!Number.isFinite(params.contextWindowTokens) || params.contextWindowTokens <= 0) return [];
	const autoCap = resolveAutoLiveToolResultMaxChars(params.contextWindowTokens);
	const runtimeCeiling = calculateMaxToolResultCharsWithCap(params.contextWindowTokens, Number.MAX_SAFE_INTEGER);
	const configuredCap = typeof params.configuredCap === "number" && Number.isFinite(params.configuredCap) ? Math.floor(params.configuredCap) : void 0;
	const configuredSource = configuredCap !== void 0;
	const requestedCap = configuredCap ?? autoCap;
	const effectiveCap = calculateMaxToolResultCharsWithCap(params.contextWindowTokens, requestedCap);
	const autoEffectiveCap = calculateMaxToolResultCharsWithCap(params.contextWindowTokens, autoCap);
	const lines = [];
	const prefix = params.scopeLabel ? `${params.scopeLabel}: ` : "";
	if (params.deep) lines.push(`- ${prefix}primary model "${params.modelKey}" context window ${formatNumber(params.contextWindowTokens)} tokens; live tool-result cap ${formatNumber(effectiveCap)} chars (${configuredSource ? "explicit" : "auto"})`);
	if (configuredCap === void 0) return lines;
	if (configuredCap > runtimeCeiling) {
		lines.push(`- ${prefix}configured toolResultMaxChars is ${formatNumber(configuredCap)} chars, but this model can use at most ${formatNumber(runtimeCeiling)} chars per live tool result; lower it or unset it.`);
		return lines;
	}
	if (effectiveCap < autoEffectiveCap) lines.push(`- ${prefix}configured toolResultMaxChars is ${formatNumber(configuredCap)} chars; unset it to use the ${formatNumber(autoEffectiveCap)} char auto cap for "${params.modelKey}".`);
	return lines;
}
//#endregion
export { buildToolResultCapDoctorAdvice };
