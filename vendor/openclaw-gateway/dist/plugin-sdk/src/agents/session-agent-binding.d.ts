import type { OpenClawConfig } from "../config/types.openclaw.js";
/**
 * Resolve the trusted active agent bound to a host-owned session reference.
 */
export declare function resolveBoundAgentIdForSession(params: {
    config?: OpenClawConfig;
    sessionKey?: string;
    agentId?: string;
}): string | undefined;
