import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { d as sanitizeUserFacingText } from "./sanitize-user-facing-text-BHbpuv3O.js";
import { a as isSilentReplyText, c as stripSilentToken, o as startsWithSilentToken, r as isSilentReplyPayloadText, s as stripLeadingSilentToken } from "./tokens-BpOBzvOi.js";
import { r as copyReplyPayloadMetadata } from "./reply-payload-DM17pxMC.js";
import { a as hasReplyPayloadContent } from "./payload-Cpx3heIy.js";
import { d as stripHeartbeatToken } from "./heartbeat-CFoWrjC8.js";
import { n as resolveResponsePrefixTemplate } from "./response-prefix-template-DY4_Dmj1.js";
//#region src/auto-reply/reply/normalize-reply.ts
function normalizeReplyPayload(payload, opts = {}) {
	const applyChannelTransforms = opts.applyChannelTransforms ?? true;
	const hasContent = (text) => hasReplyPayloadContent({
		...payload,
		text
	}, { trimText: true });
	const trimmed = normalizeOptionalString(payload.text) ?? "";
	if (!hasContent(trimmed)) {
		opts.onSkip?.("empty");
		return null;
	}
	const silentToken = opts.silentToken ?? "NO_REPLY";
	let text = payload.text ?? void 0;
	if (text && isSilentReplyPayloadText(text, silentToken)) {
		if (!hasContent("")) {
			opts.onSkip?.("silent");
			return null;
		}
		text = "";
	}
	if (text && !isSilentReplyText(text, silentToken)) {
		const hasLeadingSilentToken = startsWithSilentToken(text, silentToken);
		if (hasLeadingSilentToken) text = stripLeadingSilentToken(text, silentToken);
		if (hasLeadingSilentToken || text.toLowerCase().includes(silentToken.toLowerCase())) {
			text = stripSilentToken(text, silentToken);
			if (!hasContent(text)) {
				opts.onSkip?.("silent");
				return null;
			}
		}
	}
	if (text && !trimmed) text = "";
	if ((opts.stripHeartbeat ?? true) && text?.includes("HEARTBEAT_OK")) {
		const stripped = stripHeartbeatToken(text, { mode: "message" });
		if (stripped.didStrip) opts.onHeartbeatStrip?.();
		if (stripped.shouldSkip && !hasContent(stripped.text)) {
			opts.onSkip?.("heartbeat");
			return null;
		}
		text = stripped.text;
	}
	if (text) text = sanitizeUserFacingText(text, { errorContext: Boolean(payload.isError) });
	if (!hasContent(text)) {
		opts.onSkip?.("empty");
		return null;
	}
	let enrichedPayload = copyReplyPayloadMetadata(payload, {
		...payload,
		text
	});
	if (applyChannelTransforms && opts.transformReplyPayload) {
		const transformedPayload = opts.transformReplyPayload(enrichedPayload);
		if (transformedPayload === null) return null;
		enrichedPayload = transformedPayload ? copyReplyPayloadMetadata(enrichedPayload, transformedPayload) : enrichedPayload;
		text = enrichedPayload.text;
	}
	const effectivePrefix = opts.responsePrefixContext ? resolveResponsePrefixTemplate(opts.responsePrefix, opts.responsePrefixContext) : opts.responsePrefix;
	if (effectivePrefix && text && text.trim() !== "HEARTBEAT_OK" && !text.startsWith(effectivePrefix)) text = `${effectivePrefix} ${text}`;
	enrichedPayload = copyReplyPayloadMetadata(enrichedPayload, {
		...enrichedPayload,
		text
	});
	return enrichedPayload;
}
//#endregion
export { normalizeReplyPayload as t };
