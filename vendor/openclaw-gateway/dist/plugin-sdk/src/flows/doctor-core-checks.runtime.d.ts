import { type SkillStatusEntry } from "../agents/skills-status.js";
import type { OpenClawConfig } from "../config/types.openclaw.js";
import type { HealthFinding } from "./health-checks.js";
export declare function detectUnavailableSkills(cfg: OpenClawConfig): SkillStatusEntry[];
export declare function collectRuntimeToolSchemaFindings(cfg: OpenClawConfig): Promise<readonly HealthFinding[]>;
