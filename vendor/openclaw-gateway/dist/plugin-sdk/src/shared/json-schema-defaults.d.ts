import type { JsonSchemaObject } from "./json-schema.types.js";
type JsonSchemaValue = JsonSchemaObject | boolean;
export declare function normalizeJsonSchemaForTypeBox(schema: JsonSchemaValue): JsonSchemaValue;
export declare function findJsonSchemaShapeError(schema: JsonSchemaValue): string | undefined;
export declare function applyJsonSchemaDefaults<T>(schema: JsonSchemaValue, value: T): T;
export {};
