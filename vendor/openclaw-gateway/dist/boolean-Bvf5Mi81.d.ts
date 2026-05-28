//#region src/utils/boolean.d.ts
type BooleanParseOptions = {
  truthy?: string[];
  falsy?: string[];
};
declare function asBoolean(value: unknown): boolean | undefined;
declare function parseBooleanValue(value: unknown, options?: BooleanParseOptions): boolean | undefined;
//#endregion
export { parseBooleanValue as n, asBoolean as t };