//#region packages/memory-host-sdk/src/host/string-utils.ts
function normalizeNullableString(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}
function normalizeOptionalString(value) {
	return normalizeNullableString(value) ?? void 0;
}
function normalizeOptionalLowercaseString(value) {
	return normalizeOptionalString(value)?.toLowerCase();
}
function normalizeLowercaseStringOrEmpty(value) {
	return normalizeOptionalLowercaseString(value) ?? "";
}
function normalizeStringEntries(values) {
	return values.map((value) => normalizeOptionalString(String(value)) ?? "").filter(Boolean);
}
function uniqueStrings(values) {
	return [...new Set(values)];
}
//#endregion
export { uniqueStrings as a, normalizeStringEntries as i, normalizeOptionalLowercaseString as n, normalizeOptionalString as r, normalizeLowercaseStringOrEmpty as t };
