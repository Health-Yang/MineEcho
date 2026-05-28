import type { OpenClawConfig } from "../config/types.openclaw.js";
export declare function collectEnabledInsecureOrDangerousFlags(cfg: OpenClawConfig, options?: {
    preferCurrentPluginMetadataSnapshot?: boolean;
}): string[];
