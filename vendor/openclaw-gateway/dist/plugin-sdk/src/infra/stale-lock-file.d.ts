export type LockFileOwnerPayload = {
    pid?: number;
    createdAt?: string;
    starttime?: number;
};
export declare function readLockFileOwnerPayload(payload: Record<string, unknown> | null): LockFileOwnerPayload | null;
export declare function shouldRemoveDeadOwnerOrExpiredLock(params: {
    payload: Record<string, unknown> | null;
    staleMs: number;
    nowMs?: number;
    isPidDefinitelyDead?: (pid: number) => boolean;
    getProcessStartTime?: (pid: number) => number | null;
}): boolean;
