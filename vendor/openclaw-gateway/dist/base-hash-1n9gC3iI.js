//#region src/gateway/server-methods/base-hash.ts
function resolveBaseHashParam(params) {
	const raw = params?.baseHash;
	if (typeof raw !== "string") return null;
	const trimmed = raw.trim();
	return trimmed ? trimmed : null;
}
//#endregion
export { resolveBaseHashParam as t };
