import type { ReplyPayload as InternalReplyPayload } from "../../auto-reply/reply-payload.js";
export type OutboundReplyPayload = {
    text?: string;
    mediaUrls?: string[];
    mediaUrl?: string;
    presentation?: InternalReplyPayload["presentation"];
    /**
     * @deprecated Use presentation. Runtime support remains for legacy producers.
     */
    interactive?: InternalReplyPayload["interactive"];
    channelData?: InternalReplyPayload["channelData"];
    sensitiveMedia?: boolean;
    replyToId?: string;
};
/** Extract the supported outbound reply fields from loose tool or agent payload objects. */
export declare function normalizeOutboundReplyPayload(payload: Record<string, unknown>): OutboundReplyPayload;
