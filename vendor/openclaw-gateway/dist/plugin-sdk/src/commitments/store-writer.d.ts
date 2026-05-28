export declare function runExclusiveCommitmentsStoreWrite<T>(storePath: string, fn: () => Promise<T>): Promise<T>;
export declare function clearCommitmentsStoreWriterQueuesForTest(): void;
