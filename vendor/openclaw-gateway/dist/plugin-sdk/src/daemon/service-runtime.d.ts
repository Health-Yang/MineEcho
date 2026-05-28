export type GatewayServiceSystemdRuntime = {
    unit?: string;
    killMode?: string;
    tasksCurrent?: number;
    memoryCurrent?: number;
};
export type GatewayServiceRuntime = {
    status?: string;
    state?: string;
    subState?: string;
    pid?: number;
    lastExitStatus?: number;
    lastExitReason?: string;
    lastRunResult?: string;
    lastRunTime?: string;
    detail?: string;
    cachedLabel?: boolean;
    missingUnit?: boolean;
    missingSupervision?: boolean;
    systemd?: GatewayServiceSystemdRuntime;
};
export declare const SYSTEMD_TASKS_CURRENT_WARNING_THRESHOLD = 200;
export declare const SYSTEMD_MEMORY_CURRENT_WARNING_BYTES: number;
export declare function isRiskySystemdKillMode(value: string | undefined): boolean;
export declare function getSystemdCgroupHygieneSummary(runtime?: GatewayServiceSystemdRuntime): string | null;
export declare function isSystemdCgroupHygieneRisk(runtime?: GatewayServiceSystemdRuntime): boolean;
