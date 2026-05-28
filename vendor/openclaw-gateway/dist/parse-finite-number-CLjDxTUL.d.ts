//#region src/infra/parse-finite-number.d.ts
declare function parseFiniteNumber(value: unknown): number | undefined;
declare function parseStrictInteger(value: unknown): number | undefined;
declare function parseStrictFiniteNumber(value: unknown): number | undefined;
declare function parseStrictPositiveInteger(value: unknown): number | undefined;
declare function parseStrictNonNegativeInteger(value: unknown): number | undefined;
//#endregion
export { parseStrictPositiveInteger as a, parseStrictNonNegativeInteger as i, parseStrictFiniteNumber as n, parseStrictInteger as r, parseFiniteNumber as t };