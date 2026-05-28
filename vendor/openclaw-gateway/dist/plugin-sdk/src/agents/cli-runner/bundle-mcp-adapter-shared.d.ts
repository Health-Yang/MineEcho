import type { BundleMcpServerConfig } from "../../plugins/bundle-mcp.js";
export { isRecord } from "../../shared/record-coerce.js";
export declare function normalizeStringRecord(value: unknown): Record<string, string> | undefined;
export declare function decodeHeaderEnvPlaceholder(value: string): {
    envVar: string;
    bearer: boolean;
} | null;
export declare function applyCommonServerConfig(next: Record<string, unknown>, server: BundleMcpServerConfig): void;
