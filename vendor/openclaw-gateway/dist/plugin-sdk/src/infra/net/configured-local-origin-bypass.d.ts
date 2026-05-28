export type ConfiguredLocalOriginManagedProxyBypass = {
    kind: "configured-local-origin";
    baseUrl: string;
};
export declare function shouldUseConfiguredLocalOriginManagedProxyBypass(params: {
    url: URL;
    managedProxyBypass: ConfiguredLocalOriginManagedProxyBypass | undefined;
    resolvedAddresses: readonly string[];
}): boolean;
