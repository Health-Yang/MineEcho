import type { HealthCheckInput, RegisteredHealthCheck } from "./health-check-runner-types.js";
import type { HealthCheck } from "./health-checks.js";
export declare function defineSplitHealthCheck(check: HealthCheck): RegisteredHealthCheck;
export declare function normalizeHealthCheck(check: HealthCheckInput): RegisteredHealthCheck;
