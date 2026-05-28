type ServiceRuntimeLike = {
    status?: string;
    state?: string;
    subState?: string;
    pid?: number;
    lastExitStatus?: number;
    lastExitReason?: string;
    lastRunResult?: string;
    lastRunTime?: string;
    detail?: string;
    systemd?: {
        killMode?: string;
        tasksCurrent?: number;
        memoryCurrent?: number;
    };
};
export declare function formatRuntimeStatus(runtime: ServiceRuntimeLike | undefined): string | null;
export {};
