import type { PluginHookReplyDispatchEvent } from "../../plugins/hook-types.js";
import type { DispatchFromConfigParams, DispatchFromConfigResult } from "./dispatch-from-config.types.js";
declare function createReplyDispatchEvent(params: Omit<PluginHookReplyDispatchEvent, "shouldSendToolSummaries"> & {
    shouldSendToolSummaries: () => boolean;
}): PluginHookReplyDispatchEvent;
export declare const testing: {
    createReplyDispatchEvent: typeof createReplyDispatchEvent;
};
export type { DispatchFromConfigParams, DispatchFromConfigResult, } from "./dispatch-from-config.types.js";
export declare function dispatchReplyFromConfig(params: DispatchFromConfigParams): Promise<DispatchFromConfigResult>;
