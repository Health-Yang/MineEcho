import type { ConfigFileSnapshot, ConfigValidationIssue } from "./types.openclaw.js";
export declare function isPluginPackagingRuntimeOutputIssue(issue: ConfigValidationIssue): boolean;
/**
 * Returns true when an invalid config snapshot is blocked by an installed plugin
 * package that shipped TypeScript source without compiled JavaScript output.
 */
export declare function isPluginPackagingRuntimeOutputInvalidConfigSnapshot(snapshot: Pick<ConfigFileSnapshot, "valid" | "issues" | "legacyIssues"> & Partial<Pick<ConfigFileSnapshot, "warnings">>): boolean;
/**
 * Returns true when an invalid config snapshot is scoped entirely to stale plugin refs.
 */
export declare function isPluginLocalInvalidConfigSnapshot(snapshot: Pick<ConfigFileSnapshot, "valid" | "issues" | "legacyIssues">): boolean;
/**
 * Decides whether whole-file last-known-good recovery is safe for a snapshot.
 */
export declare function shouldAttemptLastKnownGoodRecovery(snapshot: Pick<ConfigFileSnapshot, "valid" | "issues" | "legacyIssues">): boolean;
