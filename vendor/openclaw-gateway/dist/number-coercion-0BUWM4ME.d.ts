//#region src/shared/number-coercion.d.ts
declare function asFiniteNumber(value: unknown): number | undefined;
declare function parseFiniteNumber(value: unknown): number | undefined;
declare function asPositiveSafeInteger(value: unknown): number | undefined;
//#endregion
export { asPositiveSafeInteger as n, parseFiniteNumber as r, asFiniteNumber as t };