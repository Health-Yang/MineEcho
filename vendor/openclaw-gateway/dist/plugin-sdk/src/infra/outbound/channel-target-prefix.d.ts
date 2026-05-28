export declare function stripTargetProviderPrefix(raw: string, ...providers: string[]): string;
export declare function stripTargetKindPrefix(raw: string, kinds?: readonly string[]): string;
export declare function stripTargetTopicSuffix(raw: string, options?: {
    allowNumericShorthand?: boolean;
}): string;
export type ChannelTargetProviderPrefix = {
    prefix: string;
    channel: string;
};
export declare function resolveTargetPrefixedChannel(raw?: string | null): string | undefined;
export declare function validateTargetProviderPrefix(params: {
    channel: string;
    to?: string | null;
}): Error | undefined;
