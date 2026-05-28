//#region src/infra/parse-finite-number.ts
function normalizeNumericString(value) {
	const trimmed = value.trim();
	return trimmed ? trimmed : void 0;
}
function parseFiniteNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const parsed = Number.parseFloat(value);
		if (Number.isFinite(parsed)) return parsed;
	}
}
function parseStrictInteger(value) {
	if (typeof value === "number") return Number.isSafeInteger(value) ? value : void 0;
	if (typeof value !== "string") return;
	const normalized = normalizeNumericString(value);
	if (!normalized || !/^[+-]?\d+$/.test(normalized)) return;
	const parsed = Number(normalized);
	return Number.isSafeInteger(parsed) ? parsed : void 0;
}
function parseStrictFiniteNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : void 0;
	if (typeof value !== "string") return;
	const normalized = normalizeNumericString(value);
	if (!normalized || !/^[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(normalized)) return;
	const parsed = Number(normalized);
	return Number.isFinite(parsed) ? parsed : void 0;
}
function parseStrictPositiveInteger(value) {
	const parsed = parseStrictInteger(value);
	return parsed !== void 0 && parsed > 0 ? parsed : void 0;
}
function parseStrictNonNegativeInteger(value) {
	const parsed = parseStrictInteger(value);
	return parsed !== void 0 && parsed >= 0 ? parsed : void 0;
}
//#endregion
export { parseStrictPositiveInteger as a, parseStrictNonNegativeInteger as i, parseStrictFiniteNumber as n, parseStrictInteger as r, parseFiniteNumber as t };
