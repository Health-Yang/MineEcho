//#region src/shared/number-coercion.ts
function asFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function parseFiniteNumber(value) {
	const parsed = typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : void 0;
	return Number.isFinite(parsed) ? parsed : void 0;
}
function asPositiveSafeInteger(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : void 0;
}
//#endregion
export { asPositiveSafeInteger as n, parseFiniteNumber as r, asFiniteNumber as t };
