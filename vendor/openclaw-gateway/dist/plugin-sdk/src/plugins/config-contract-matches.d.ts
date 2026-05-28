export type PluginConfigContractMatch = {
    path: string;
    value: unknown;
};
export declare function collectPluginConfigContractMatches(params: {
    root: unknown;
    pathPattern: string;
}): PluginConfigContractMatch[];
