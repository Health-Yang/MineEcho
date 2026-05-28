import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { n as GetReplyOptions } from "./get-reply-options.types-tz7CitlR.js";
import { t as ReplyPayload } from "./reply-payload-DVcklM6x.js";
import { n as MsgContext } from "./templating-5iVgSDdS.js";

//#region src/auto-reply/reply/get-reply.d.ts
declare function getReplyFromConfig(ctx: MsgContext, opts?: GetReplyOptions, configOverride?: OpenClawConfig): Promise<ReplyPayload | ReplyPayload[] | undefined>;
//#endregion
export { getReplyFromConfig as t };