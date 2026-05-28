import { n as CreateChannelReplyPipelineParams, t as ChannelReplyPipeline } from "./reply-pipeline-DUNi9mTh.js";
import { l as deliverInboundReplyWithMessageSendContext } from "./kernel-Cr2adFnD.js";
//#region src/plugin-sdk/channel-message.d.ts
/** @deprecated Use `createChannelMessageReplyPipeline(...)` from `openclaw/plugin-sdk/channel-outbound`. */
declare function createChannelTurnReplyPipeline(params: CreateChannelReplyPipelineParams): ChannelReplyPipeline;
/** @deprecated Use `deliverInboundReplyWithMessageSendContext(...)` from `openclaw/plugin-sdk/channel-outbound`. */
declare const deliverDurableInboundReplyPayload: typeof deliverInboundReplyWithMessageSendContext;
//#endregion
export { deliverDurableInboundReplyPayload as n, createChannelTurnReplyPipeline as t };