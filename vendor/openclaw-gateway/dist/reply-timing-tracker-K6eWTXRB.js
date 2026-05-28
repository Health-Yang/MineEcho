import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { t as isDiagnosticFlagEnabled } from "./diagnostic-flags-D9qBi7Px.js";
import { r as logVerbose } from "./globals-DZ-ifL5z.js";
import { l as mimeTypeFromFilePath } from "./mime-DppuT-pZ.js";
import { d as classifySilentReplyConversationType, f as resolveSilentReplyPolicyFromPolicies } from "./payloads-BSIGv16L.js";
import { n as resolveAgentTurnAttachments } from "./agent-turn-attachments-CzlU34xK.js";
//#region src/config/silent-reply.ts
function resolveSilentReplyConversationContext(params) {
	const conversationType = classifySilentReplyConversationType({
		sessionKey: params.sessionKey,
		surface: params.surface,
		conversationType: params.conversationType
	});
	const normalizedSurface = normalizeLowercaseStringOrEmpty(params.surface);
	const surface = normalizedSurface ? params.cfg?.surfaces?.[normalizedSurface] : void 0;
	return {
		conversationType,
		defaultPolicy: params.cfg?.agents?.defaults?.silentReply,
		surfacePolicy: surface?.silentReply
	};
}
function resolveSilentReplySettings(params) {
	return { policy: resolveSilentReplyPolicyFromPolicies(resolveSilentReplyConversationContext(params)) };
}
function resolveSilentReplyPolicy(params) {
	return resolveSilentReplySettings(params).policy;
}
//#endregion
//#region src/auto-reply/reply/current-turn-images.ts
function isGenericMediaType(mediaType) {
	if (!mediaType) return true;
	const normalized = mediaType.split(";")[0]?.trim().toLowerCase();
	return normalized === "application/octet-stream" || normalized === "binary/octet-stream";
}
function resolveCurrentImageMediaType(pathValue, mediaType) {
	const mediaPath = normalizeOptionalString(pathValue);
	if (!mediaPath) return;
	const normalizedMediaType = normalizeOptionalString(mediaType);
	if (normalizedMediaType?.startsWith("image/")) return normalizedMediaType;
	if (!isGenericMediaType(normalizedMediaType)) return;
	const inferredType = mimeTypeFromFilePath(mediaPath);
	return inferredType?.startsWith("image/") ? inferredType : void 0;
}
function collectCurrentImageAttachments(ctx) {
	const pathsFromArray = Array.isArray(ctx.MediaPaths) ? ctx.MediaPaths : void 0;
	const paths = pathsFromArray && pathsFromArray.length > 0 ? pathsFromArray : normalizeOptionalString(ctx.MediaPath) ? [ctx.MediaPath] : [];
	if (paths.length === 0) return [];
	const types = Array.isArray(ctx.MediaTypes) && ctx.MediaTypes.length === paths.length ? ctx.MediaTypes : void 0;
	const attachments = [];
	for (const [index, pathValue] of paths.entries()) {
		const mediaPath = normalizeOptionalString(pathValue);
		const mediaType = resolveCurrentImageMediaType(pathValue, types?.[index] ?? ctx.MediaType);
		if (mediaPath && mediaType) attachments.push({
			index,
			path: mediaPath,
			mediaType
		});
	}
	return attachments;
}
function collectDescribedImageAttachmentIndexes(ctx) {
	return new Set(ctx.MediaUnderstanding?.filter((output) => output.kind === "image.description").map((output) => output.attachmentIndex) ?? []);
}
function createUndescribedImageContext(ctx, undescribedAttachments) {
	const first = undescribedAttachments[0];
	return {
		...ctx,
		MediaPath: first?.path,
		MediaType: first?.mediaType,
		MediaPaths: undescribedAttachments.map((attachment) => attachment.path),
		MediaTypes: undescribedAttachments.map((attachment) => attachment.mediaType)
	};
}
async function resolveCurrentTurnImages(params) {
	if (Array.isArray(params.images) && params.images.length > 0) return {
		images: params.images,
		imageOrder: params.imageOrder
	};
	const currentImageAttachments = collectCurrentImageAttachments(params.ctx);
	if (currentImageAttachments.length === 0) return {
		images: params.images,
		imageOrder: params.imageOrder
	};
	const describedImageIndexes = collectDescribedImageAttachmentIndexes(params.ctx);
	const undescribedImageAttachments = currentImageAttachments.filter((attachment) => !describedImageIndexes.has(attachment.index));
	if (undescribedImageAttachments.length === 0) return {
		images: params.images,
		imageOrder: params.imageOrder
	};
	try {
		const images = (await resolveAgentTurnAttachments({
			ctx: createUndescribedImageContext(params.ctx, undescribedImageAttachments),
			cfg: params.cfg,
			includeRecentHistoryImages: false
		})).attachments.map((attachment) => ({
			type: "image",
			data: attachment.data,
			mimeType: attachment.mediaType
		}));
		if (images.length < undescribedImageAttachments.length) {
			logVerbose(`agent-runner: native PI media resolution produced ${images.length}/${undescribedImageAttachments.length} current image attachment(s); falling back to prompt image refs`);
			return {
				images: params.images,
				imageOrder: params.imageOrder
			};
		}
		return images.length > 0 ? {
			images,
			imageOrder: images.map(() => "inline")
		} : {
			images: params.images,
			imageOrder: params.imageOrder
		};
	} catch (error) {
		logVerbose(`agent-runner: media attachment image resolution failed, proceeding without native images: ${formatErrorMessage(error)}`);
		return {
			images: params.images,
			imageOrder: params.imageOrder
		};
	}
}
//#endregion
//#region src/auto-reply/reply/reply-timing-tracker.ts
const DEFAULT_TIMING_WARN_TOTAL_MS = 1e3;
const DEFAULT_TIMING_WARN_STAGE_MS = 500;
function isReplyProfilerEnabled(params) {
	const cfg = params?.config;
	const env = params?.env ?? process.env;
	return isDiagnosticFlagEnabled("profiler", cfg, env) || isDiagnosticFlagEnabled("reply.profiler", cfg, env);
}
function createReplyTimingTracker(params) {
	if (!(params.enabled ?? isReplyProfilerEnabled({
		config: params.config,
		env: params.env
	}))) return {
		async measure(_name, run) {
			return await run();
		},
		measureSync(_name, run) {
			return run();
		},
		logIfSlow() {}
	};
	const startedAt = Date.now();
	const spans = [];
	let didLog = false;
	const totalWarnMs = params.totalWarnMs ?? DEFAULT_TIMING_WARN_TOTAL_MS;
	const stageWarnMs = params.stageWarnMs ?? DEFAULT_TIMING_WARN_STAGE_MS;
	const toMs = (value) => Math.max(0, Math.round(value));
	const record = (name, spanStartedAt) => {
		spans.push({
			name,
			durationMs: toMs(Date.now() - spanStartedAt),
			elapsedMs: toMs(Date.now() - startedAt)
		});
	};
	const snapshot = () => ({
		totalMs: toMs(Date.now() - startedAt),
		spans: spans.slice()
	});
	const shouldLog = (summary) => summary.totalMs >= totalWarnMs || summary.spans.some((span) => span.durationMs >= stageWarnMs);
	const formatSpans = (summary) => summary.spans.length > 0 ? summary.spans.map((span) => `${span.name}:${span.durationMs}ms@${span.elapsedMs}ms`).join(",") : "none";
	return {
		async measure(name, run) {
			const spanStartedAt = Date.now();
			try {
				return await run();
			} finally {
				record(name, spanStartedAt);
			}
		},
		measureSync(name, run) {
			const spanStartedAt = Date.now();
			try {
				return run();
			} finally {
				record(name, spanStartedAt);
			}
		},
		logIfSlow(logParams) {
			if (didLog) return;
			const summary = snapshot();
			if (!shouldLog(summary)) return;
			didLog = true;
			const suffix = [
				`totalMs=${summary.totalMs}`,
				`stages=${formatSpans(summary)}`,
				logParams.outcome ? `outcome=${logParams.outcome}` : void 0,
				logParams.reason ? `reason=${logParams.reason}` : void 0,
				logParams.error ? `error="${logParams.error}"` : void 0
			].filter(Boolean).join(" ");
			params.log.warn(`${logParams.message} ${suffix}`, {
				...logParams.details,
				outcome: logParams.outcome,
				reason: logParams.reason,
				error: logParams.error,
				totalMs: summary.totalMs,
				spans: summary.spans
			});
		}
	};
}
//#endregion
export { resolveSilentReplySettings as a, resolveSilentReplyPolicy as i, isReplyProfilerEnabled as n, resolveCurrentTurnImages as r, createReplyTimingTracker as t };
