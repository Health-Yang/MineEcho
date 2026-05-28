import type { CronConfig } from "./types.cron.js";
export declare const DEFAULT_CRON_MAX_CONCURRENT_RUNS = 8;
export declare function resolveCronMaxConcurrentRuns(cronConfig?: Pick<CronConfig, "maxConcurrentRuns">): number;
