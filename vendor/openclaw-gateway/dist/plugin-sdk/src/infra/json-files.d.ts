import "./fs-safe-defaults.js";
export { JsonFileReadError, readJsonSync, readRootJsonObjectSync, readRootJsonSync, readRootStructuredFileSync, tryReadJsonSync, tryReadJsonSync as readJsonFileSync, writeJson, writeJson as writeJsonAtomic, writeJsonSync, } from "@openclaw/fs-safe/json";
export declare function readJson<T>(filePath: string): Promise<T>;
export declare function readJsonFileStrict<T>(filePath: string): Promise<T>;
export declare function readJsonIfExists<T>(filePath: string): Promise<T | null>;
export declare function readDurableJsonFile<T>(filePath: string): Promise<T | null>;
/**
 * tryReadJson delegates to readJsonIfExists instead of the internal
 * tryReadJsonImpl from @openclaw/fs-safe. The fs-safe implementation retries
 * race conditions before propagating errors; this wrapper keeps the historical
 * null-on-error contract for callers that intentionally treat reads as optional.
 */
export declare function tryReadJson<T>(filePath: string): Promise<T | null>;
export declare function readJsonFile<T>(filePath: string): Promise<T | null>;
export { createAsyncLock } from "@openclaw/fs-safe/advanced";
export type WriteTextAtomicOptions = {
    mode?: number;
    dirMode?: number;
    trailingNewline?: boolean;
    durable?: boolean;
    /**
     * Prefix for the staged `<prefix>.<pid>.<uuid>.tmp` file. Defaults to the
     * generic `.fs-safe-replace`; pass a target-specific prefix so an orphaned
     * temp (from a crash between write and rename) is identifiable and reclaimable.
     */
    tempPrefix?: string;
};
export declare function writeTextAtomic(filePath: string, content: string, options?: WriteTextAtomicOptions): Promise<void>;
