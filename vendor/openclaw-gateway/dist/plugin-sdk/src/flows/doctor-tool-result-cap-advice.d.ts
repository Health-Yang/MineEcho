export type ToolResultCapDoctorAdviceParams = {
    contextWindowTokens: number;
    modelKey: string;
    configuredCap?: number;
    deep?: boolean;
    scopeLabel?: string;
};
export declare function buildToolResultCapDoctorAdvice(params: ToolResultCapDoctorAdviceParams): string[];
