import type { AnyAgentTool } from "./tools/common.js";
export type RuntimeToolInputSchemaJson = null | boolean | number | string | RuntimeToolInputSchemaJson[] | {
    [key: string]: RuntimeToolInputSchemaJson;
};
export type RuntimeToolInputSchemaProjection = {
    readonly schema: RuntimeToolInputSchemaJson;
    readonly violations: readonly string[];
};
export type RuntimeToolSchemaDiagnostic = {
    readonly toolName: string;
    readonly toolIndex: number;
    readonly violations: readonly string[];
};
export type RuntimeToolSchemaInspection<TTool extends Pick<AnyAgentTool, "name" | "parameters">> = {
    readonly tools: readonly TTool[];
    readonly diagnostics: readonly RuntimeToolSchemaDiagnostic[];
};
export declare function projectRuntimeToolInputSchema(schema: unknown, path?: string): RuntimeToolInputSchemaProjection;
export declare function inspectRuntimeToolInputSchemas(tools: readonly Pick<AnyAgentTool, "name" | "parameters">[]): RuntimeToolSchemaDiagnostic[];
export declare function filterRuntimeCompatibleTools<TTool extends Pick<AnyAgentTool, "name" | "parameters">>(tools: readonly TTool[]): RuntimeToolSchemaInspection<TTool>;
