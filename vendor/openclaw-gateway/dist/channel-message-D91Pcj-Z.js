import { t as createChannelReplyPipeline } from "./reply-pipeline-C3CPjsQr.js";
import "./inbound-reply-dispatch-C26pW97Y.js";
import { t as deliverInboundReplyWithMessageSendContext } from "./channel-outbound-DuRkxH3q.js";
//#region src/plugin-sdk/channel-message.ts
/** @deprecated Use `createChannelMessageReplyPipeline(...)` from `openclaw/plugin-sdk/channel-outbound`. */
function createChannelTurnReplyPipeline(params) {
	return createChannelReplyPipeline(params);
}
/** @deprecated Use `deliverInboundReplyWithMessageSendContext(...)` from `openclaw/plugin-sdk/channel-outbound`. */
const deliverDurableInboundReplyPayload = deliverInboundReplyWithMessageSendContext;
//#endregion
export { deliverDurableInboundReplyPayload as n, createChannelTurnReplyPipeline as t };
