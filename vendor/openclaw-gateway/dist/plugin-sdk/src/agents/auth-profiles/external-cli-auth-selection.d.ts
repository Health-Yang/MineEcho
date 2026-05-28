import type { OpenClawConfig } from "../../config/types.openclaw.js";
import type { AuthProfileStore } from "./types.js";
export declare function resolveExternalCliAuthOverlayScopeFromSelection(params: {
    provider: string;
    cfg?: OpenClawConfig;
    agentId?: string;
    modelId?: string;
    workspaceDir?: string;
    store?: AuthProfileStore;
    userLockedAuthProfileId?: string;
}): {
    providerIds?: readonly string[];
    ignoreAutoPreferredProfile: boolean;
};
