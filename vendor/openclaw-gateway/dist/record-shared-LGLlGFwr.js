//#region src/gateway/server-methods/record-shared.ts
function normalizeTrimmedString(value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : void 0;
}
//#endregion
export { normalizeTrimmedString as t };
