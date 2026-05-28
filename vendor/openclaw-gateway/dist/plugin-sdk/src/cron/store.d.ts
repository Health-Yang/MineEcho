import type { CronStoreFile } from "./types.js";
export type PreservedCronConfigJob = {
    index: number;
    job: Record<string, unknown>;
};
export type LoadedCronStore = {
    store: CronStoreFile;
    configJobs: Array<Record<string, unknown>>;
};
export declare function resolveCronStorePath(storePath?: string): string;
export declare function loadCronStoreWithConfigJobs(storePath: string): Promise<LoadedCronStore>;
export declare function loadCronStore(storePath: string): Promise<CronStoreFile>;
export declare function loadCronStoreSync(storePath: string): CronStoreFile;
type SaveCronStoreOptions = {
    skipBackup?: boolean;
    stateOnly?: boolean;
    preservedConfigJobs?: PreservedCronConfigJob[];
};
export declare function saveCronStore(storePath: string, store: CronStoreFile, opts?: SaveCronStoreOptions): Promise<void>;
export {};
