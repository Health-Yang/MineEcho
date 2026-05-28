import type { SandboxWorkspaceAccess } from "./types.js";
export declare const SANDBOX_MOUNT_FORMAT_VERSION = 3;
export type ReadOnlyWorkspaceSkillMount = {
    hostPath: string;
    containerPath: string;
};
export declare function isExistingWorkspaceSkillMountSource(params: {
    agentWorkspaceDir: string;
    hostPath: string;
}): boolean;
export declare function resolveReadOnlyWorkspaceSkillMounts(params: {
    workspaceDir: string;
    agentWorkspaceDir: string;
    workdir: string;
    workspaceAccess: SandboxWorkspaceAccess;
}): ReadOnlyWorkspaceSkillMount[];
export declare function formatReadOnlyWorkspaceSkillMountHashState(mounts: readonly ReadOnlyWorkspaceSkillMount[]): string[];
export declare function appendReadOnlyWorkspaceSkillMountArgs(params: {
    args: string[];
    readOnlyWorkspaceSkillMounts: readonly ReadOnlyWorkspaceSkillMount[];
}): void;
export declare function appendWorkspaceMountArgs(params: {
    args: string[];
    workspaceDir: string;
    agentWorkspaceDir: string;
    workdir: string;
    workspaceAccess: SandboxWorkspaceAccess;
    readOnlyWorkspaceSkillMounts?: readonly ReadOnlyWorkspaceSkillMount[];
    includeReadOnlyWorkspaceSkillMounts?: boolean;
}): void;
