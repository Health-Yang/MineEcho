export declare const LOCAL_EMBEDDING_WORKER_ERROR_CODES: {
    readonly exited: "LOCAL_EMBEDDING_WORKER_EXITED";
    readonly processError: "LOCAL_EMBEDDING_WORKER_PROCESS_ERROR";
    readonly ipcError: "LOCAL_EMBEDDING_WORKER_IPC_ERROR";
};
export type LocalEmbeddingWorkerFailureCode = (typeof LOCAL_EMBEDDING_WORKER_ERROR_CODES)[keyof typeof LOCAL_EMBEDDING_WORKER_ERROR_CODES];
export type LocalEmbeddingWorkerFailureReason = "exit" | "signal" | "process-error" | "ipc";
export type LocalEmbeddingWorkerFailureError = Error & {
    code: LocalEmbeddingWorkerFailureCode;
    reason: LocalEmbeddingWorkerFailureReason;
    exitCode?: number | null;
    signal?: NodeJS.Signals | null;
};
export declare function createLocalEmbeddingWorkerFailureError(params: {
    message: string;
    code: LocalEmbeddingWorkerFailureCode;
    reason: LocalEmbeddingWorkerFailureReason;
    exitCode?: number | null;
    signal?: NodeJS.Signals | null;
    cause?: unknown;
}): LocalEmbeddingWorkerFailureError;
export declare function isLocalEmbeddingWorkerFailure(err: unknown): err is LocalEmbeddingWorkerFailureError;
