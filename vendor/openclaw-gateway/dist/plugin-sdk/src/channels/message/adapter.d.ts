import type { ChannelMessageAdapter, ChannelMessageAdapterShape } from "./types.js";
declare const defaultManualReceiveAdapter: {
    readonly defaultAckPolicy: "manual";
    readonly supportedAckPolicies: readonly ["manual"];
};
type ChannelMessageAdapterWithDefaultReceive<TAdapter extends ChannelMessageAdapterShape> = TAdapter & {
    receive: TAdapter["receive"] extends undefined ? typeof defaultManualReceiveAdapter : NonNullable<TAdapter["receive"]>;
};
export declare function defineChannelMessageAdapter<const TAdapter extends ChannelMessageAdapterShape>(adapter: TAdapter): ChannelMessageAdapter<ChannelMessageAdapterWithDefaultReceive<TAdapter>>;
export {};
