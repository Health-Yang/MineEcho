//#region src/shared/regexp.ts
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
//#endregion
export { escapeRegExp as t };
