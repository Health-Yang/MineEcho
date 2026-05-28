import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { a as SourceReplyDeliveryMode } from "./get-reply-options.types-tz7CitlR.js";
import { t as ReplyPayload } from "./reply-payload-DVcklM6x.js";
import { t as InboundEventKind } from "./kind-CFh9tvAP.js";
import { i as CommandTurnContext } from "./templating-5iVgSDdS.js";
import { n as CreateTypingCallbacksParams, r as TypingCallbacks } from "./response-prefix-template-CYdaTWLL.js";
import { i as createReplyPrefixOptions, n as ReplyPrefixOptions, t as ReplyPrefixContextBundle } from "./reply-prefix-CjXfrjnK.js";

//#region src/auto-reply/reply/source-reply-delivery-mode.d.ts
type SourceReplyDeliveryModeContext = {
  ChatType?: string;
  InboundEventKind?: InboundEventKind;
  Provider?: string;
  Surface?: string;
  ExplicitDeliverRoute?: boolean;
  CommandAuthorized?: boolean;
  CommandBody?: string;
  CommandSource?: "text" | "native";
  CommandTurn?: CommandTurnContext;
  BotUsername?: string;
};
//#endregion
//#region src/channels/message/reply-pipeline.d.ts
type ReplyPrefixContext = ReplyPrefixContextBundle["prefixContext"];
declare function resolveChannelSourceReplyDeliveryMode(params: {
  cfg: OpenClawConfig;
  ctx: SourceReplyDeliveryModeContext;
  requested?: SourceReplyDeliveryMode;
  messageToolAvailable?: boolean;
}): SourceReplyDeliveryMode;
type ChannelReplyPipeline = ReplyPrefixOptions & {
  typingCallbacks?: TypingCallbacks;
  transformReplyPayload?: (payload: ReplyPayload) => ReplyPayload | null;
};
type CreateChannelReplyPipelineParams = {
  cfg: Parameters<typeof createReplyPrefixOptions>[0]["cfg"];
  agentId: string;
  channel?: string;
  accountId?: string;
  typing?: CreateTypingCallbacksParams;
  typingCallbacks?: TypingCallbacks;
  transformReplyPayload?: (payload: ReplyPayload) => ReplyPayload | null;
};
declare function createChannelReplyPipeline(params: CreateChannelReplyPipelineParams): ChannelReplyPipeline;
//#endregion
export { resolveChannelSourceReplyDeliveryMode as a, createChannelReplyPipeline as i, CreateChannelReplyPipelineParams as n, ReplyPrefixContext as r, ChannelReplyPipeline as t };