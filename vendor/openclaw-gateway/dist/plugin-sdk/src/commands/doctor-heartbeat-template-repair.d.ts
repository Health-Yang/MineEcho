import type { OpenClawConfig } from "../config/types.openclaw.js";
export type HeartbeatTemplateRepairAnalysis = {
    status: "clean";
} | {
    status: "dirty-template";
} | {
    status: "dirty-template-with-custom-content";
    customLines: string[];
};
export declare function analyzeHeartbeatTemplateForRepair(content: string): HeartbeatTemplateRepairAnalysis;
export declare function maybeRepairHeartbeatTemplate(params: {
    cfg: OpenClawConfig;
    shouldRepair: boolean;
}): Promise<void>;
