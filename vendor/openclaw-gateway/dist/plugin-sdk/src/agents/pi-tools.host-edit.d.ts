import type { AnyAgentTool } from "./pi-tools.types.js";
type EditToolRecoveryOptions = {
    root: string;
    readFile: (absolutePath: string) => Promise<string>;
};
type WriteToolRecoveryOptions = {
    root: string;
    readFile: (absolutePath: string) => Promise<string>;
    statFile?: (absolutePath: string) => Promise<WriteToolFileStat | null>;
};
type WriteToolFileStat = {
    type: "file" | "directory" | "other";
    size: number;
    mtimeMs?: number;
};
/**
 * Recover from two edit-tool failure classes without changing edit semantics:
 * - exact-match mismatch errors become actionable by including current file contents
 * - post-write throws are converted back to success only if the file actually changed
 */
export declare function wrapEditToolWithRecovery(base: AnyAgentTool, options: EditToolRecoveryOptions): AnyAgentTool;
/**
 * Recover write calls that complete the disk write but abort before returning.
 * Readback is the source of truth; argument-derived paths never prove success.
 */
export declare function wrapWriteToolWithRecovery(base: AnyAgentTool, options: WriteToolRecoveryOptions): AnyAgentTool;
export {};
