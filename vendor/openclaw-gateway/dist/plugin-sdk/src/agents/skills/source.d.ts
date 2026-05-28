import type { Skill } from "./skill-contract.js";
import type { SkillTelemetrySource } from "./types.js";
export declare function resolveSkillSource(skill: Skill): string;
export declare function resolveSkillTelemetrySourceValue(value: unknown): SkillTelemetrySource;
export declare function resolveSkillTelemetrySource(skill: Skill): SkillTelemetrySource;
