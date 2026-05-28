import type { SandboxConfig } from "./sandbox/types.js";
import { type ToolPolicyLike } from "./tool-policy.js";
export declare function auditToolPolicyFilter(params: {
    stepLabel: string;
    policy: ToolPolicyLike;
    before: readonly {
        name: string;
    }[];
    after: readonly {
        name: string;
    }[];
}): void;
export declare function auditSandboxToolPolicyBlock(params: {
    toolName: string;
    ruleType: "allow" | "deny";
    ruleSource: "agent" | "global" | "default";
    configKey: string;
    policy?: ToolPolicyLike;
    mode: SandboxConfig["mode"];
}): void;
