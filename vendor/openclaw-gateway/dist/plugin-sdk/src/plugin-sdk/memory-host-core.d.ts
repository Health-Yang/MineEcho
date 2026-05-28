import type { OpenClawConfig } from "../config/config.js";
import type { MemoryPluginPublicArtifact } from "../plugins/memory-state.js";
export * from "./memory-core-host-runtime-core.js";
export declare function listMemoryWorkspacePublicArtifacts(params: {
    workspaceDir: string;
    agentIds: string[];
}): Promise<MemoryPluginPublicArtifact[]>;
export declare function listMemoryHostPublicArtifacts(params: {
    cfg: OpenClawConfig;
}): Promise<MemoryPluginPublicArtifact[]>;
