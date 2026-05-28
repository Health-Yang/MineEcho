export type DiagnosticModelContentCapturePolicy = {
    inputMessages: boolean;
    outputMessages: boolean;
    toolInputs: boolean;
    toolOutputs: boolean;
    systemPrompt: boolean;
    toolDefinitions: boolean;
    anyModelContent: boolean;
};
export declare function resolveDiagnosticModelContentCapturePolicy(config: unknown): DiagnosticModelContentCapturePolicy;
