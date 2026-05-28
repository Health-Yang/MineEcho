export declare function normalizeImageDescriptionInput(params: {
    buffer: Buffer;
    fileName?: string;
    mime?: string;
    maxBytes?: number;
}): Promise<{
    buffer: Buffer;
    mime?: string;
}>;
