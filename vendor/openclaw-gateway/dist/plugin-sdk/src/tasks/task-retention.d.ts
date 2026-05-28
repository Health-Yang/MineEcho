import type { TaskRecord, TaskStatus } from "./task-registry.types.js";
export declare const DEFAULT_TASK_RETENTION_MS: number;
export declare const LOST_TASK_RETENTION_MS: number;
export declare function resolveTaskRetentionMs(status: TaskStatus): number;
export declare function resolveTaskCleanupAfter(task: Pick<TaskRecord, "status" | "endedAt" | "lastEventAt" | "createdAt">): number;
export declare function resolveEffectiveTaskCleanupAfter(task: Pick<TaskRecord, "status" | "endedAt" | "lastEventAt" | "createdAt" | "cleanupAfter">): number;
