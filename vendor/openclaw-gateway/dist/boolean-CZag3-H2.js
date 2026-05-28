import { s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
//#region src/utils/boolean.ts
const DEFAULT_TRUTHY = [
	"true",
	"1",
	"yes",
	"on"
];
const DEFAULT_FALSY = [
	"false",
	"0",
	"no",
	"off"
];
const DEFAULT_TRUTHY_SET = new Set(DEFAULT_TRUTHY);
const DEFAULT_FALSY_SET = new Set(DEFAULT_FALSY);
function asBoolean(value) {
	return typeof value === "boolean" ? value : void 0;
}
function parseBooleanValue(value, options = {}) {
	const booleanValue = asBoolean(value);
	if (booleanValue !== void 0) return booleanValue;
	if (typeof value !== "string") return;
	const normalized = normalizeOptionalLowercaseString(value);
	if (!normalized) return;
	const truthy = options.truthy ?? DEFAULT_TRUTHY;
	const falsy = options.falsy ?? DEFAULT_FALSY;
	const truthySet = truthy === DEFAULT_TRUTHY ? DEFAULT_TRUTHY_SET : new Set(truthy);
	const falsySet = falsy === DEFAULT_FALSY ? DEFAULT_FALSY_SET : new Set(falsy);
	if (truthySet.has(normalized)) return true;
	if (falsySet.has(normalized)) return false;
}
//#endregion
export { parseBooleanValue as n, asBoolean as t };
