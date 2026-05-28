import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { l as MemoryPluginPublicArtifact } from "./memory-state-vGJaIOb6.js";
//#region src/plugin-sdk/memory-host-core.d.ts
declare function listMemoryWorkspacePublicArtifacts(params: {
  workspaceDir: string;
  agentIds: string[];
}): Promise<MemoryPluginPublicArtifact[]>;
declare function listMemoryHostPublicArtifacts(params: {
  cfg: OpenClawConfig;
}): Promise<MemoryPluginPublicArtifact[]>;
//#endregion
export { listMemoryWorkspacePublicArtifacts as n, listMemoryHostPublicArtifacts as t };