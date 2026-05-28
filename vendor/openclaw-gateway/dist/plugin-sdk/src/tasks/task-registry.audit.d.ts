import { createEmptyTaskAuditSummary, type TaskAuditCode, type TaskAuditFinding, type TaskAuditSeverity, type TaskAuditSummary } from "./task-registry.audit.shared.js";
import type { TaskRecord } from "./task-registry.types.js";
export type TaskAuditOptions = {
    now?: number;
    tasks?: TaskRecord[];
    staleQueuedMs?: number;
    staleRunningMs?: number;
};
export type RetainedLostTaskAuditSummary = {
    count: number;
    nextCleanupAfter?: number;
};
export { createEmptyTaskAuditSummary };
export type { TaskAuditCode, TaskAuditFinding, TaskAuditSeverity, TaskAuditSummary };
export declare function configureTaskAuditTaskProvider(provider: () => TaskRecord[]): void;
export declare function listTaskAuditFindings(options?: TaskAuditOptions): TaskAuditFinding[];
export declare function isRetainedLostTaskAuditFinding(finding: TaskAuditFinding, now?: number): boolean;
export declare function summarizeTaskAuditFindings(findings: Iterable<TaskAuditFinding>): TaskAuditSummary;
export declare function summarizeActionableTaskAuditFindings(findings: Iterable<TaskAuditFinding>, options?: {
    now?: number;
}): TaskAuditSummary;
export declare function summarizeRetainedLostTaskAuditFindings(findings: Iterable<TaskAuditFinding>, options?: {
    now?: number;
}): RetainedLostTaskAuditSummary;
