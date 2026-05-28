import { c as normalizeOptionalString, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { i as asOptionalRecord } from "./record-coerce-Btbek4uV.js";
import { _ as uniqueStrings, l as normalizeStringEntries } from "./string-normalization-B8G0vlWE.js";
import { i as isCronSessionKey, r as isCronRunSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { n as normalizeAccountId } from "./account-id-B0YIFDpA.js";
import { d as resolveAgentIdFromSessionKey, u as normalizeMainKey } from "./session-key-yaI3D3Bl.js";
import { n as defaultRuntime } from "./runtime-yzlkhCoS.js";
import { i as getRuntimeConfig } from "./io-BlARNTf3.js";
import "./config-BtNBbhZb.js";
import "./message-channel-core-NW6lw3Ys.js";
import { c as isGatewayMessageChannel, r as isInternalMessageChannel, s as isDeliverableMessageChannel, u as normalizeMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { l as shouldPreserveUserFacingSessionStateForInputProvenance, o as isAgentMediatedCompletionSourceTool } from "./input-provenance-D_ZjwTES.js";
import "./call-D_O83KsN.js";
import { t as getGlobalHookRunner } from "./hook-runner-global-CjzahG2G.js";
import { i as resolveMainSessionKey } from "./main-session-896o98eb.js";
import { h as stringifyRouteThreadId } from "./channel-route-Dvehdg4D.js";
import { i as mergeDeliveryContext, o as normalizeDeliveryContext } from "./delivery-context.shared-B9zntlj0.js";
import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { t as loadSessionStore } from "./store-load-Di_AfnVx.js";
import { t as getLoadedChannelPluginForRead } from "./registry-loaded-read-neKhpFRr.js";
import "./sessions-Ct4mpWsk.js";
import { t as deriveSessionChatTypeFromKey } from "./session-chat-type-shared-CloMfBfk.js";
import { t as completionRequiresMessageToolDelivery } from "./completion-delivery-policy-Jiwb2Yqc.js";
import { n as INTERNAL_RUNTIME_CONTEXT_END, s as escapeInternalRuntimeContextDelimiters, t as INTERNAL_RUNTIME_CONTEXT_BEGIN } from "./internal-runtime-context-DftY0OXU.js";
import { d as queueEmbeddedPiMessageWithOutcomeAsync, i as formatEmbeddedPiQueueFailureSummary, m as resolveActiveEmbeddedRunSessionId, o as isEmbeddedPiRunActive } from "./runs-p1TN18LG.js";
import { r as isSilentReplyPayloadText } from "./tokens-BpOBzvOi.js";
import { n as normalizeConversationRef } from "./session-binding-normalization-CP9fBmeY.js";
import { n as getSessionBindingService } from "./session-binding-service-C_ndVxi-.js";
import { s as getSubagentDepthFromSessionStore } from "./subagent-capabilities-CeOcBGcI.js";
import { t as basenameFromAnyPath } from "./file-name-r4prf02z.js";
import "./delivery-context-DMGHXaoo.js";
import { n as wrapPromptDataBlock } from "./sanitize-for-prompt-ByaJGDhT.js";
import { n as routeFromConversationRef, r as routeToDeliveryFields } from "./route-projection-BNbzCtDQ.js";
import { r as dispatchGatewayMethodInProcess } from "./server-plugins-BniQMVzq.js";
import { t as resolveQueueSettings } from "./queue-BguXrIlu.js";
import { t as resolveExternalBestEffortDeliveryTarget } from "./best-effort-delivery-D44NhGom.js";
import { t as sendMessage } from "./message-B3jIARHA.js";
import { t as resolveConversationIdFromTargets } from "./conversation-id-CzrxbaE6.js";
//#region src/agents/accepted-session-spawn.ts
function normalizeAcceptedSessionSpawnResult(result) {
	const details = asOptionalRecord(asOptionalRecord(result)?.details);
	if (!details || details.status !== "accepted") return null;
	const runId = normalizeOptionalString(details.runId);
	const childSessionKey = normalizeOptionalString(details.childSessionKey);
	if (!runId || !childSessionKey) return null;
	return {
		runId,
		childSessionKey
	};
}
function hasAcceptedSessionSpawn(acceptedSessionSpawns) {
	return (acceptedSessionSpawns ?? []).some((spawn) => {
		const record = asOptionalRecord(spawn);
		if (!record) return false;
		return Boolean(normalizeOptionalString(record.runId) && normalizeOptionalString(record.childSessionKey));
	});
}
//#endregion
//#region src/agents/generated-attachments.ts
function generatedAttachmentReference(attachment) {
	return normalizeOptionalString(attachment.path ?? attachment.url ?? attachment.mediaUrl ?? attachment.filePath);
}
function mediaUrlsFromGeneratedAttachments(attachments) {
	return uniqueStrings(attachments?.flatMap((attachment) => generatedAttachmentReference(attachment) ?? []) ?? []);
}
function nameFromGeneratedAttachment(attachment) {
	return normalizeOptionalString(attachment.name) ?? basenameFromAnyPath(generatedAttachmentReference(attachment) ?? "");
}
function formatGeneratedAttachmentLines(attachments) {
	if (!attachments?.length) return [];
	const lines = ["Attachments:"];
	for (const [index, attachment] of attachments.entries()) {
		const parts = [`${index + 1}.`];
		const type = normalizeOptionalString(attachment.type);
		const name = nameFromGeneratedAttachment(attachment);
		const mimeType = normalizeOptionalString(attachment.mimeType);
		const path = normalizeOptionalString(attachment.path ?? attachment.filePath);
		const url = normalizeOptionalString(attachment.url ?? attachment.mediaUrl);
		if (type) parts.push(`type=${type}`);
		if (name) parts.push(`name=${JSON.stringify(name)}`);
		if (mimeType) parts.push(`mimeType=${mimeType}`);
		if (path) parts.push(`path=${JSON.stringify(path)}`);
		else if (url) parts.push(`mediaUrl=${JSON.stringify(url)}`);
		lines.push(parts.join(" "));
	}
	return lines;
}
//#endregion
//#region src/agents/pi-embedded-runner/delivery-evidence.ts
function hasNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}
function hasNonEmptyArray(value) {
	return Array.isArray(value) && value.length > 0;
}
function hasNonEmptyStringArray(value) {
	return Array.isArray(value) && value.some(hasNonEmptyString);
}
function collectStringValues(value, output) {
	if (typeof value === "string" && value.trim()) {
		output.add(value.trim());
		return;
	}
	if (!Array.isArray(value)) return;
	for (const entry of value) if (typeof entry === "string" && entry.trim()) output.add(entry.trim());
}
function collectMediaUrlsFromRecord(record, output) {
	collectStringValues(record.mediaUrl, output);
	collectStringValues(record.mediaUrls, output);
	collectStringValues(record.path, output);
	collectStringValues(record.url, output);
	collectStringValues(record.filePath, output);
	const attachments = record.attachments;
	if (Array.isArray(attachments)) {
		for (const attachment of attachments) if (attachment && typeof attachment === "object" && !Array.isArray(attachment)) collectMediaUrlsFromRecord(attachment, output);
	}
}
function collectDeliveredMediaUrls(result) {
	const urls = /* @__PURE__ */ new Set();
	if (Array.isArray(result.payloads)) {
		for (const payload of result.payloads) if (payload && typeof payload === "object" && !Array.isArray(payload)) collectMediaUrlsFromRecord(payload, urls);
	}
	for (const url of collectMessagingToolDeliveredMediaUrls(result)) urls.add(url);
	return Array.from(urls);
}
function collectMessagingToolDeliveredMediaUrls(result) {
	const urls = /* @__PURE__ */ new Set();
	collectStringValues(result.messagingToolSentMediaUrls, urls);
	if (Array.isArray(result.messagingToolSentTargets)) {
		for (const target of result.messagingToolSentTargets) if (target && typeof target === "object" && !Array.isArray(target)) collectMediaUrlsFromRecord(target, urls);
	}
	return Array.from(urls);
}
function hasDeliveredExpectedMedia(result, expectedMediaUrls) {
	const expected = uniqueStrings(normalizeStringEntries(expectedMediaUrls));
	if (expected.length === 0) return true;
	const delivered = new Set(collectDeliveredMediaUrls(result));
	return expected.every((url) => delivered.has(url));
}
function hasPositiveNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function getGatewayAgentResult(response) {
	if (!response || typeof response !== "object") return null;
	const candidate = hasAgentDeliveryEvidenceShape(response) ? response : response.result;
	if (!candidate || typeof candidate !== "object" || !hasAgentDeliveryEvidenceShape(candidate)) return null;
	return candidate;
}
function hasAgentDeliveryEvidenceShape(value) {
	return "payloads" in value || "deliveryStatus" in value || "didSendViaMessagingTool" in value || "messagingToolSentTexts" in value || "messagingToolSentMediaUrls" in value || "messagingToolSentTargets" in value || "acceptedSessionSpawns" in value || "successfulCronAdds" in value || "meta" in value;
}
function hasVisibleAgentPayload(result, options = {}) {
	const payloads = result.payloads;
	if (!Array.isArray(payloads)) return false;
	return payloads.some((payload) => {
		if (!payload || typeof payload !== "object") return false;
		const record = payload;
		if (options.includeErrorPayloads === false && record.isError === true) return false;
		if (options.includeReasoningPayloads === false && record.isReasoning === true) return false;
		return Boolean(hasNonEmptyString(record.text) || hasNonEmptyString(record.mediaUrl) || hasNonEmptyStringArray(record.mediaUrls) || record.presentation || record.interactive || record.channelData);
	});
}
function hasMessagingToolDeliveryEvidence(result) {
	return result.didSendViaMessagingTool === true || hasCommittedMessagingToolDeliveryEvidence(result);
}
function hasCommittedMessagingToolDeliveryEvidence(result) {
	return hasNonEmptyStringArray(result.messagingToolSentTexts) || hasNonEmptyStringArray(result.messagingToolSentMediaUrls) || hasNonEmptyArray(result.messagingToolSentTargets);
}
function hasOutboundDeliveryEvidence(result) {
	return hasMessagingToolDeliveryEvidence(result) || Array.isArray(result.acceptedSessionSpawns) && hasAcceptedSessionSpawn(result.acceptedSessionSpawns) || hasPositiveNumber(result.successfulCronAdds) || hasPositiveNumber(result.meta?.toolSummary?.calls);
}
function getAgentCommandDeliveryFailure(result) {
	const status = result.deliveryStatus?.status;
	if (status !== "failed" && status !== "partial_failed") return;
	const message = result.deliveryStatus?.errorMessage;
	if (hasNonEmptyString(message)) return message;
	return status === "partial_failed" ? "agent delivery partially failed" : "agent delivery failed";
}
//#endregion
//#region src/agents/internal-events.ts
function sanitizeSingleLineField(value, fallback) {
	return escapeInternalRuntimeContextDelimiters(value).replace(/\r?\n+/g, " ").trim() || fallback;
}
function sanitizeMultilineField(value, fallback) {
	return escapeInternalRuntimeContextDelimiters(value).replace(/\r\n/g, "\n").trim() || fallback;
}
function formatChildResultDataBlock(value) {
	return wrapPromptDataBlock({
		label: "Child result",
		text: value
	}) || "Child result: (no output)";
}
function formatTaskCompletionEvent(event) {
	const sessionKey = sanitizeSingleLineField(event.childSessionKey, "unknown");
	const sessionId = sanitizeSingleLineField(event.childSessionId ?? "unknown", "unknown");
	const announceType = sanitizeSingleLineField(event.announceType, "unknown");
	const taskLabel = sanitizeSingleLineField(event.taskLabel, "unnamed task");
	const statusLabel = sanitizeSingleLineField(event.statusLabel, event.status);
	const result = formatChildResultDataBlock(event.result);
	const attachmentLines = formatGeneratedAttachmentLines(event.attachments);
	const lines = [
		"[Internal task completion event]",
		`source: ${event.source}`,
		`session_key: ${sessionKey}`,
		`session_id: ${sessionId}`,
		`type: ${announceType}`,
		`task: ${taskLabel}`,
		`status: ${statusLabel}`,
		"",
		result
	];
	if (attachmentLines.length > 0) lines.push("", ...attachmentLines);
	if (event.statsLine?.trim()) lines.push("", sanitizeMultilineField(event.statsLine, ""));
	lines.push("", "Action:", sanitizeMultilineField(event.replyInstruction, ""));
	return lines.join("\n");
}
function formatTaskCompletionEventForPlainPrompt(event) {
	const sessionKey = sanitizeSingleLineField(event.childSessionKey, "unknown");
	const sessionId = sanitizeSingleLineField(event.childSessionId ?? "unknown", "unknown");
	const announceType = sanitizeSingleLineField(event.announceType, "unknown");
	const taskLabel = sanitizeSingleLineField(event.taskLabel, "unnamed task");
	const statusLabel = sanitizeSingleLineField(event.statusLabel, event.status);
	const result = formatChildResultDataBlock(event.result);
	const attachmentLines = formatGeneratedAttachmentLines(event.attachments);
	const lines = [
		"A background task completed. Use this result to reply to the user in your normal assistant voice.",
		"",
		`source: ${event.source}`,
		`session_key: ${sessionKey}`,
		`session_id: ${sessionId}`,
		`type: ${announceType}`,
		`task: ${taskLabel}`,
		`status: ${statusLabel}`,
		"",
		result
	];
	if (attachmentLines.length > 0) lines.push("", ...attachmentLines);
	if (event.statsLine?.trim()) lines.push("", sanitizeMultilineField(event.statsLine, ""));
	lines.push("", "Instruction:", sanitizeMultilineField(event.replyInstruction, ""));
	return lines.join("\n");
}
function formatAgentInternalEventsForPrompt(events) {
	if (!events || events.length === 0) return "";
	const blocks = events.map((event) => {
		if (event.type === "task_completion") return formatTaskCompletionEvent(event);
		return "";
	}).filter((value) => value.trim().length > 0);
	if (blocks.length === 0) return "";
	return [
		INTERNAL_RUNTIME_CONTEXT_BEGIN,
		"OpenClaw runtime context (internal):",
		"This context is runtime-generated, not user-authored. Keep internal details private.",
		"",
		blocks.join("\n\n---\n\n"),
		INTERNAL_RUNTIME_CONTEXT_END
	].join("\n");
}
function formatAgentInternalEventsForPlainPrompt(events) {
	if (!events || events.length === 0) return "";
	return events.map((event) => {
		if (event.type === "task_completion") return formatTaskCompletionEventForPlainPrompt(event);
		return "";
	}).filter((value) => value.trim().length > 0).join("\n\n---\n\n");
}
//#endregion
//#region src/shared/agent-run-status.ts
const NON_TERMINAL_AGENT_RUN_STATUSES = new Set([
	"accepted",
	"started",
	"in_flight"
]);
function isNonTerminalAgentRunStatus(status) {
	return typeof status === "string" && NON_TERMINAL_AGENT_RUN_STATUSES.has(status);
}
//#endregion
//#region src/infra/outbound/bound-delivery-router.ts
function isActiveBinding(record) {
	return record.status === "active";
}
function resolveBindingForRequester(requester, bindings) {
	const matchingChannelAccount = bindings.filter((entry) => {
		const conversation = normalizeConversationRef(entry.conversation);
		return conversation.channel === requester.channel && conversation.accountId === requester.accountId;
	});
	if (matchingChannelAccount.length === 0) return null;
	const exactConversation = matchingChannelAccount.find((entry) => normalizeConversationRef(entry.conversation).conversationId === requester.conversationId);
	if (exactConversation) return exactConversation;
	if (matchingChannelAccount.length === 1) return matchingChannelAccount[0] ?? null;
	return null;
}
function createBoundDeliveryRouter(service = getSessionBindingService()) {
	return { resolveDestination: (input) => {
		const targetSessionKey = input.targetSessionKey.trim();
		if (!targetSessionKey) return {
			binding: null,
			mode: "fallback",
			reason: "missing-target-session"
		};
		const activeBindings = service.listBySession(targetSessionKey).filter(isActiveBinding);
		if (activeBindings.length === 0) return {
			binding: null,
			mode: "fallback",
			reason: "no-active-binding"
		};
		if (!input.requester) {
			if (input.failClosed) return {
				binding: null,
				mode: "fallback",
				reason: "missing-requester"
			};
			if (activeBindings.length === 1) return {
				binding: activeBindings[0] ?? null,
				mode: "bound",
				reason: "single-active-binding"
			};
			return {
				binding: null,
				mode: "fallback",
				reason: "ambiguous-without-requester"
			};
		}
		const requester = normalizeConversationRef(input.requester);
		if (!requester.channel || !requester.conversationId) return {
			binding: null,
			mode: "fallback",
			reason: "invalid-requester"
		};
		const fromRequester = resolveBindingForRequester(requester, activeBindings);
		if (fromRequester) return {
			binding: fromRequester,
			mode: "bound",
			reason: "requester-match"
		};
		if (activeBindings.length === 1 && !input.failClosed) return {
			binding: activeBindings[0] ?? null,
			mode: "bound",
			reason: "single-active-binding-fallback"
		};
		return {
			binding: null,
			mode: "fallback",
			reason: "no-requester-match"
		};
	} };
}
//#endregion
//#region src/agents/subagent-announce-dispatch.ts
function mapSteerOutcomeToDeliveryResult(outcome) {
	if (outcome.status === "steered") return {
		delivered: true,
		path: "steered",
		deliveredAt: outcome.deliveredAt,
		enqueuedAt: outcome.enqueuedAt
	};
	return {
		delivered: false,
		path: "none"
	};
}
async function runSubagentAnnounceDispatch(params) {
	const phases = [];
	const appendPhase = (phase, result) => {
		phases.push({
			phase,
			delivered: result.delivered,
			path: result.path,
			deliveredAt: result.deliveredAt,
			enqueuedAt: result.enqueuedAt,
			error: result.error
		});
	};
	const withPhases = (result) => ({
		...result,
		phases
	});
	if (params.signal?.aborted) return withPhases({
		delivered: false,
		path: "none"
	});
	if (!params.expectsCompletionMessage) {
		const primarySteerOutcome = await params.steer();
		const primarySteer = mapSteerOutcomeToDeliveryResult(primarySteerOutcome);
		appendPhase("steer-primary", primarySteer);
		if (primarySteer.delivered) return withPhases(primarySteer);
		if (primarySteerOutcome.status === "dropped") return withPhases(primarySteer);
		const primaryDirect = await params.direct();
		appendPhase("direct-primary", primaryDirect);
		return withPhases(primaryDirect);
	}
	const primaryDirect = await params.direct();
	appendPhase("direct-primary", primaryDirect);
	if (primaryDirect.delivered) return withPhases(primaryDirect);
	if (params.signal?.aborted) return withPhases(primaryDirect);
	const fallbackSteer = mapSteerOutcomeToDeliveryResult(await params.steer());
	appendPhase("steer-fallback", fallbackSteer);
	if (fallbackSteer.delivered) return withPhases(fallbackSteer);
	return withPhases(primaryDirect);
}
//#endregion
//#region src/agents/subagent-requester-store-key.ts
function resolveRequesterStoreKey(cfg, requesterSessionKey) {
	const raw = (requesterSessionKey ?? "").trim();
	if (!raw) return raw;
	if (raw === "global" || raw === "unknown") return raw;
	if (raw.startsWith("agent:")) return raw;
	const mainKey = normalizeMainKey(cfg?.session?.mainKey);
	if (raw === "main" || raw === mainKey) return resolveMainSessionKey(cfg);
	return `agent:${resolveAgentIdFromSessionKey(raw)}:${raw}`;
}
//#endregion
//#region src/agents/subagent-announce-delivery.ts
const DEFAULT_SUBAGENT_ANNOUNCE_TIMEOUT_MS = 12e4;
const MAX_TIMER_SAFE_TIMEOUT_MS = 2147e6;
let subagentAnnounceDeliveryDeps = {
	dispatchGatewayMethodInProcess,
	getRuntimeConfig,
	getRequesterSessionActivity: (requesterSessionKey) => {
		const sessionId = resolveActiveEmbeddedRunSessionId(requesterSessionKey) ?? loadRequesterSessionEntry(requesterSessionKey).entry?.sessionId;
		return {
			sessionId,
			isActive: Boolean(sessionId && isEmbeddedPiRunActive(sessionId))
		};
	},
	queueEmbeddedPiMessageWithOutcome: queueEmbeddedPiMessageWithOutcomeAsync,
	sendMessage
};
async function resolveQueueEmbeddedPiMessageOutcome(sessionId, text, options) {
	return await subagentAnnounceDeliveryDeps.queueEmbeddedPiMessageWithOutcome(sessionId, text, options);
}
async function runAnnounceAgentCall(params) {
	return await subagentAnnounceDeliveryDeps.dispatchGatewayMethodInProcess("agent", params.agentParams, {
		expectFinal: params.expectFinal,
		forceSyntheticClient: shouldPreserveUserFacingSessionStateForInputProvenance(params.agentParams.inputProvenance),
		timeoutMs: params.timeoutMs
	});
}
function formatQueueWakeFailureError(fallback, outcome) {
	const summary = formatEmbeddedPiQueueFailureSummary(outcome);
	return summary ? `${fallback}: ${summary}` : fallback;
}
function resolveBoundConversationOrigin(params) {
	const conversation = params.bindingConversation;
	const conversationId = conversation.conversationId?.trim() ?? "";
	const parentConversationId = conversation.parentConversationId?.trim() ?? "";
	const requesterConversationId = params.requesterConversation?.conversationId?.trim() ?? "";
	const requesterTo = params.requesterOrigin?.to?.trim();
	if (conversation.channel === "matrix" && parentConversationId && requesterConversationId && parentConversationId === requesterConversationId && requesterTo) return {
		channel: conversation.channel,
		accountId: conversation.accountId,
		to: requesterTo,
		...conversationId ? { threadId: conversationId } : {}
	};
	const boundTarget = routeToDeliveryFields(routeFromConversationRef(conversation));
	const inferredThreadId = boundTarget.threadId ?? (parentConversationId && parentConversationId !== conversationId ? conversationId : void 0) ?? (params.requesterOrigin?.threadId != null && params.requesterOrigin.threadId !== "" ? stringifyRouteThreadId(params.requesterOrigin.threadId) : void 0);
	if (requesterTo && conversationId && requesterConversationId && conversationId.toLowerCase() === requesterConversationId.toLowerCase()) return {
		channel: conversation.channel,
		accountId: conversation.accountId,
		to: requesterTo,
		threadId: inferredThreadId
	};
	return {
		channel: conversation.channel,
		accountId: conversation.accountId,
		to: boundTarget.to,
		threadId: inferredThreadId
	};
}
function resolveRequesterSessionActivity(requesterSessionKey) {
	const activity = subagentAnnounceDeliveryDeps.getRequesterSessionActivity(requesterSessionKey);
	if (activity.sessionId || activity.isActive) return activity;
	const { entry } = loadRequesterSessionEntry(requesterSessionKey);
	const sessionId = entry?.sessionId;
	return {
		sessionId,
		isActive: Boolean(sessionId && isEmbeddedPiRunActive(sessionId))
	};
}
function resolveDirectAnnounceTransientRetryDelaysMs() {
	return process.env.OPENCLAW_TEST_FAST === "1" ? [
		8,
		16,
		32
	] : [
		5e3,
		1e4,
		2e4
	];
}
function resolveCompactionSteerRetryDelaysMs() {
	return process.env.OPENCLAW_TEST_FAST === "1" ? [
		8,
		16,
		32,
		64
	] : [
		1e3,
		2e3,
		4e3,
		8e3
	];
}
async function resolveActiveWakeWithRetries(sessionId, message, wakeOptions, signal) {
	const compactionDeadlineMs = typeof wakeOptions.deliveryTimeoutMs === "number" && wakeOptions.deliveryTimeoutMs > 0 ? Date.now() + wakeOptions.deliveryTimeoutMs : void 0;
	let currentOptions = wakeOptions;
	const resolveRetryOptions = () => {
		if (compactionDeadlineMs === void 0) return currentOptions;
		const remainingDeliveryTimeoutMs = compactionDeadlineMs - Date.now();
		if (remainingDeliveryTimeoutMs <= 0) return;
		return {
			...currentOptions,
			deliveryTimeoutMs: remainingDeliveryTimeoutMs
		};
	};
	let outcome = await resolveQueueEmbeddedPiMessageOutcome(sessionId, message, currentOptions);
	const compactionRetryDelaysMs = resolveCompactionSteerRetryDelaysMs();
	let compactionRetryIndex = 0;
	for (;;) {
		if (outcome.queued || signal?.aborted) break;
		if (outcome.reason === "transcript_commit_wait_unsupported" && currentOptions.waitForTranscriptCommit === true) {
			const bestEffortOptions = { ...currentOptions };
			delete bestEffortOptions.waitForTranscriptCommit;
			currentOptions = bestEffortOptions;
			outcome = await resolveQueueEmbeddedPiMessageOutcome(sessionId, message, currentOptions);
			continue;
		}
		if (outcome.reason === "compacting") {
			const remainingDeliveryTimeoutMs = compactionDeadlineMs === void 0 ? void 0 : compactionDeadlineMs - Date.now();
			if (!(remainingDeliveryTimeoutMs === void 0 ? compactionRetryIndex < compactionRetryDelaysMs.length : remainingDeliveryTimeoutMs > 0)) break;
			const scheduledDelayMs = compactionRetryDelaysMs[Math.min(compactionRetryIndex, compactionRetryDelaysMs.length - 1)] ?? 0;
			const delayMs = remainingDeliveryTimeoutMs === void 0 ? scheduledDelayMs : Math.min(scheduledDelayMs, remainingDeliveryTimeoutMs);
			if (delayMs <= 0 && remainingDeliveryTimeoutMs !== void 0) break;
			await waitForAnnounceRetryDelay(delayMs, signal);
			if (signal?.aborted) break;
			compactionRetryIndex += 1;
			const retryOptions = resolveRetryOptions();
			if (!retryOptions) break;
			outcome = await resolveQueueEmbeddedPiMessageOutcome(sessionId, message, retryOptions);
			continue;
		}
		break;
	}
	return outcome;
}
function resolveSubagentAnnounceTimeoutMs(cfg) {
	const configured = cfg.agents?.defaults?.subagents?.announceTimeoutMs;
	if (typeof configured !== "number" || !Number.isFinite(configured)) return DEFAULT_SUBAGENT_ANNOUNCE_TIMEOUT_MS;
	return Math.min(Math.max(1, Math.floor(configured)), MAX_TIMER_SAFE_TIMEOUT_MS);
}
function isInternalAnnounceRequesterSession(sessionKey) {
	return getSubagentDepthFromSessionStore(sessionKey) >= 1 || isCronSessionKey(sessionKey);
}
function summarizeDeliveryError(error) {
	if (error instanceof Error) return error.message || "error";
	if (typeof error === "string") return error;
	if (error === void 0 || error === null) return "unknown error";
	try {
		return JSON.stringify(error);
	} catch {
		return "error";
	}
}
const TRANSIENT_ANNOUNCE_DELIVERY_ERROR_PATTERNS = [
	/\berrorcode=unavailable\b/i,
	/\bstatus\s*[:=]\s*"?unavailable\b/i,
	/\bUNAVAILABLE\b/,
	/no active .* listener/i,
	/gateway not connected/i,
	/gateway closed \(1006/i,
	/gateway timeout/i,
	/\ball models failed\b/i,
	/\ball profiles unavailable\b/i,
	/\boverloaded\b/i,
	/\b(econnreset|econnrefused|etimedout|enotfound|ehostunreach|network error)\b/i
];
const PERMANENT_ANNOUNCE_DELIVERY_ERROR_PATTERNS = [
	/unsupported channel/i,
	/unknown channel/i,
	/chat not found/i,
	/user not found/i,
	/bot.*not.*member/i,
	/bot was blocked by the user/i,
	/forbidden: bot was kicked/i,
	/recipient is not a valid/i,
	/outbound not configured for channel/i
];
function isTransientAnnounceDeliveryError(error) {
	const message = summarizeDeliveryError(error);
	if (!message) return false;
	if (PERMANENT_ANNOUNCE_DELIVERY_ERROR_PATTERNS.some((re) => re.test(message))) return false;
	return TRANSIENT_ANNOUNCE_DELIVERY_ERROR_PATTERNS.some((re) => re.test(message));
}
function isPermanentAnnounceDeliveryError(error) {
	const message = summarizeDeliveryError(error);
	return Boolean(message && PERMANENT_ANNOUNCE_DELIVERY_ERROR_PATTERNS.some((re) => re.test(message)));
}
function isIncompleteAnnounceAgentResultError(error) {
	const message = summarizeDeliveryError(error);
	return /(?:incomplete terminal response|code=incomplete_result)\b/i.test(message);
}
async function waitForAnnounceRetryDelay(ms, signal) {
	if (ms <= 0) return;
	if (!signal) {
		await new Promise((resolve) => setTimeout(resolve, ms));
		return;
	}
	if (signal.aborted) return;
	await new Promise((resolve) => {
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			signal.removeEventListener("abort", onAbort);
			resolve();
		};
		signal.addEventListener("abort", onAbort, { once: true });
	});
}
async function runAnnounceDeliveryWithRetry(params) {
	const retryDelaysMs = resolveDirectAnnounceTransientRetryDelaysMs();
	let retryIndex = 0;
	for (;;) {
		if (params.signal?.aborted) throw new Error("announce delivery aborted");
		try {
			return await params.run();
		} catch (err) {
			const delayMs = retryDelaysMs[retryIndex];
			if (delayMs == null || !isTransientAnnounceDeliveryError(err) || params.signal?.aborted) throw err;
			const nextAttempt = retryIndex + 2;
			const maxAttempts = retryDelaysMs.length + 1;
			defaultRuntime.log(`[warn] Subagent announce ${params.operation} transient failure, retrying ${nextAttempt}/${maxAttempts} in ${Math.round(delayMs / 1e3)}s: ${summarizeDeliveryError(err)}`);
			retryIndex += 1;
			await waitForAnnounceRetryDelay(delayMs, params.signal);
		}
	}
}
async function resolveSubagentCompletionOrigin(params) {
	const requesterOrigin = normalizeDeliveryContext(params.requesterOrigin);
	const channel = normalizeOptionalLowercaseString(requesterOrigin?.channel);
	const to = requesterOrigin?.to?.trim();
	const accountId = normalizeAccountId(requesterOrigin?.accountId);
	const conversationId = stringifyRouteThreadId(requesterOrigin?.threadId != null && requesterOrigin.threadId !== "" ? requesterOrigin.threadId : void 0) || resolveConversationIdFromTargets({ targets: [to] }) || "";
	const requesterConversation = channel && conversationId ? {
		channel,
		accountId,
		conversationId
	} : void 0;
	const router = createBoundDeliveryRouter();
	const requesterRoute = router.resolveDestination({
		eventKind: "task_completion",
		targetSessionKey: params.requesterSessionKey,
		requester: requesterConversation,
		failClosed: true
	});
	if (requesterRoute.mode === "bound" && requesterRoute.binding) return mergeDeliveryContext(resolveBoundConversationOrigin({
		bindingConversation: requesterRoute.binding.conversation,
		requesterConversation,
		requesterOrigin
	}), requesterOrigin);
	const childRoute = router.resolveDestination({
		eventKind: "task_completion",
		targetSessionKey: params.childSessionKey,
		requester: requesterConversation,
		failClosed: true
	});
	if (childRoute.mode === "bound" && childRoute.binding) return mergeDeliveryContext(resolveBoundConversationOrigin({
		bindingConversation: childRoute.binding.conversation,
		requesterConversation,
		requesterOrigin
	}), requesterOrigin);
	const hookRunner = getGlobalHookRunner();
	if (!hookRunner?.hasHooks("subagent_delivery_target")) return requesterOrigin;
	try {
		const hookOrigin = normalizeDeliveryContext((await hookRunner.runSubagentDeliveryTarget({
			childSessionKey: params.childSessionKey,
			requesterSessionKey: params.requesterSessionKey,
			requesterOrigin,
			childRunId: params.childRunId,
			spawnMode: params.spawnMode,
			expectsCompletionMessage: params.expectsCompletionMessage
		}, {
			runId: params.childRunId,
			childSessionKey: params.childSessionKey,
			requesterSessionKey: params.requesterSessionKey
		}))?.origin);
		if (!hookOrigin) return requesterOrigin;
		if (hookOrigin.channel && isInternalMessageChannel(hookOrigin.channel)) return requesterOrigin;
		return mergeDeliveryContext(hookOrigin, requesterOrigin);
	} catch {
		return requesterOrigin;
	}
}
function loadRequesterSessionEntry(requesterSessionKey) {
	const cfg = subagentAnnounceDeliveryDeps.getRuntimeConfig();
	const canonicalKey = resolveRequesterStoreKey(cfg, requesterSessionKey);
	const agentId = resolveAgentIdFromSessionKey(canonicalKey);
	return {
		cfg,
		entry: loadSessionStore(resolveStorePath(cfg.session?.store, { agentId }))[canonicalKey],
		canonicalKey
	};
}
function loadSessionEntryByKey(sessionKey) {
	const cfg = subagentAnnounceDeliveryDeps.getRuntimeConfig();
	const agentId = resolveAgentIdFromSessionKey(sessionKey);
	return loadSessionStore(resolveStorePath(cfg.session?.store, { agentId }))[sessionKey];
}
async function maybeSteerSubagentAnnounce(params) {
	if (params.signal?.aborted) return { status: "none" };
	const { cfg, entry } = loadRequesterSessionEntry(params.requesterSessionKey);
	const canonicalKey = resolveRequesterStoreKey(cfg, params.requesterSessionKey);
	const { sessionId, isActive } = resolveRequesterSessionActivity(canonicalKey);
	if (!sessionId || !isActive) return { status: "none" };
	const queueSettings = resolveQueueSettings({
		cfg,
		channel: entry?.channel ?? entry?.lastChannel ?? entry?.origin?.provider,
		sessionEntry: entry
	});
	const queueOptions = {
		deliveryTimeoutMs: params.deliveryTimeoutMs,
		steeringMode: "all",
		...queueSettings.debounceMs !== void 0 ? { debounceMs: queueSettings.debounceMs } : {},
		waitForTranscriptCommit: true
	};
	const queueOutcome = await resolveActiveWakeWithRetries(sessionId, params.steerMessage, queueOptions, params.signal);
	if (queueOutcome.queued) return {
		status: "steered",
		deliveredAt: queueOutcome.deliveredAtMs,
		enqueuedAt: queueOutcome.enqueuedAtMs
	};
	return { status: resolveRequesterSessionActivity(canonicalKey).isActive ? "dropped" : "none" };
}
function hasVisibleGatewayAgentPayload(response) {
	const result = getGatewayAgentResult(response);
	return Boolean(result && (hasVisibleAgentPayload(result) || hasMessagingToolDeliveryEvidence(result)));
}
function hasGatewayAgentMessagingToolDeliveryEvidence(response) {
	const result = getGatewayAgentResult(response);
	return Boolean(result && hasMessagingToolDeliveryEvidence(result));
}
function hasIntentionalSilentGatewayAgentPayload(response) {
	const result = getGatewayAgentResult(response);
	if (!result || !Array.isArray(result.payloads)) return false;
	return result.payloads.some((payload) => {
		if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
		const record = payload;
		if (typeof record.text !== "string" || !isSilentReplyPayloadText(record.text, "NO_REPLY")) return false;
		return !(record.mediaUrl || Array.isArray(record.mediaUrls) && record.mediaUrls.length > 0 || record.presentation || record.interactive || record.channelData);
	});
}
function requiresAgentMediatedCompletionDelivery(params) {
	return params.expectsCompletionMessage && isAgentMediatedCompletionSourceTool(params.sourceTool);
}
function collectExpectedMediaFromInternalEvents(events) {
	if (!events?.length) return [];
	const mediaUrls = [];
	const seen = /* @__PURE__ */ new Set();
	for (const event of events) {
		const values = [...Array.isArray(event.mediaUrls) ? event.mediaUrls : [], ...mediaUrlsFromGeneratedAttachments(event.attachments)];
		for (const value of values) {
			const normalized = typeof value === "string" ? value.trim() : "";
			if (!normalized || seen.has(normalized)) continue;
			seen.add(normalized);
			mediaUrls.push(normalized);
		}
	}
	return mediaUrls;
}
function hasGatewayAgentDeliveredExpectedMedia(response, expectedMediaUrls) {
	const result = getGatewayAgentResult(response);
	return Boolean(result && hasDeliveredExpectedMedia(result, expectedMediaUrls));
}
function hasGatewayAgentMessagingToolDeliveredExpectedMedia(response, expectedMediaUrls) {
	const expected = uniqueStrings(normalizeStringEntries(expectedMediaUrls));
	if (expected.length === 0) return true;
	const result = getGatewayAgentResult(response);
	if (!result) return false;
	const delivered = new Set(collectMessagingToolDeliveredMediaUrls(result));
	return expected.every((url) => delivered.has(url));
}
function getGatewayAgentCommandDeliveryFailure(response) {
	const result = getGatewayAgentResult(response);
	return result ? getAgentCommandDeliveryFailure(result) : void 0;
}
function isGatewayAgentRunPending(response) {
	if (!response || typeof response !== "object") return false;
	const status = response.status;
	return isNonTerminalAgentRunStatus(status);
}
function resolveGeneratedMediaCompletionLabel(params) {
	const sourceTool = params.sourceTool?.trim();
	if (sourceTool === "image_generate") return "image";
	if (sourceTool === "music_generate") return "music";
	if (sourceTool === "video_generate") return "video";
	const announceType = params.internalEvents?.find((event) => event.type === "task_completion")?.announceType?.trim().toLowerCase();
	if (announceType?.includes("image")) return "image";
	if (announceType?.includes("music") || announceType?.includes("audio")) return "music";
	if (announceType?.includes("video")) return "video";
	return "media";
}
async function deliverGeneratedMediaCompletionDirect(params) {
	if (!params.deliveryTarget.deliver || !params.deliveryTarget.channel || !params.deliveryTarget.to || params.mediaUrls.length === 0) return;
	const mediaLabel = resolveGeneratedMediaCompletionLabel({
		sourceTool: params.sourceTool,
		internalEvents: params.internalEvents
	});
	const agentId = resolveAgentIdFromSessionKey(params.requesterSessionKey);
	const idempotencyKey = `${params.directIdempotencyKey}:generated-media-direct`;
	try {
		await subagentAnnounceDeliveryDeps.sendMessage({
			cfg: params.cfg,
			channel: params.deliveryTarget.channel,
			to: params.deliveryTarget.to,
			accountId: params.deliveryTarget.accountId,
			threadId: params.deliveryTarget.threadId,
			requesterSessionKey: params.requesterSessionKey,
			agentId,
			content: `The generated ${mediaLabel} is ready.`,
			mediaUrls: Array.from(params.mediaUrls),
			idempotencyKey,
			mirror: {
				sessionKey: params.requesterSessionKey,
				agentId,
				idempotencyKey
			}
		});
		return {
			delivered: true,
			path: "direct"
		};
	} catch (err) {
		return {
			delivered: false,
			path: "direct",
			error: `generated media direct delivery failed: ${summarizeDeliveryError(err)}`
		};
	}
}
function inferDeliveryTargetChatType(target) {
	const normalizedTo = normalizeOptionalLowercaseString(target.to);
	if (!normalizedTo) return;
	if (normalizedTo.startsWith("dm:") || normalizedTo.startsWith("direct:") || normalizedTo.startsWith("user:") || normalizedTo.includes(":dm:") || normalizedTo.includes(":direct:")) return "direct";
	if (normalizedTo.startsWith("channel:") || normalizedTo.startsWith("thread:")) return "channel";
	if (normalizedTo.startsWith("group:")) return "group";
	const channel = normalizeMessageChannel(target.channel);
	return channel ? getLoadedChannelPluginForRead(channel)?.messaging?.inferTargetChatType?.({ to: target.to ?? "" }) : void 0;
}
function isDirectMessageDeliveryTarget(target, requesterSessionKey) {
	if (target.threadId) return false;
	const targetChatType = inferDeliveryTargetChatType(target);
	if (targetChatType) return targetChatType === "direct";
	return deriveSessionChatTypeFromKey(requesterSessionKey) === "direct";
}
function resolveTextCompletionDirectFallback(events) {
	for (let index = (events?.length ?? 0) - 1; index >= 0; index -= 1) {
		const event = events?.[index];
		if (event?.type !== "task_completion" || event.source !== "subagent") continue;
		if (event.status !== "ok") continue;
		const result = typeof event.result === "string" ? event.result.trim() : "";
		if (result && result !== "(no output)") return result;
	}
}
function hasFailedSubagentNoOutputCompletion(events) {
	return events?.some((event) => event.type === "task_completion" && event.source === "subagent" && event.status !== "ok" && event.result.trim() === "(no output)") === true;
}
async function deliverTextCompletionDirect(params) {
	const content = resolveTextCompletionDirectFallback(params.internalEvents);
	if (!content || !params.deliveryTarget.deliver || !params.deliveryTarget.channel || !params.deliveryTarget.to || !isDirectMessageDeliveryTarget(params.deliveryTarget, params.requesterSessionKey)) return;
	const agentId = resolveAgentIdFromSessionKey(params.requesterSessionKey);
	const idempotencyKey = `${params.directIdempotencyKey}:text-direct`;
	try {
		await subagentAnnounceDeliveryDeps.sendMessage({
			cfg: params.cfg,
			channel: params.deliveryTarget.channel,
			to: params.deliveryTarget.to,
			accountId: params.deliveryTarget.accountId,
			threadId: params.deliveryTarget.threadId,
			requesterSessionKey: params.requesterSessionKey,
			agentId,
			content,
			idempotencyKey,
			mirror: {
				sessionKey: params.requesterSessionKey,
				agentId,
				idempotencyKey
			}
		});
		return {
			delivered: true,
			path: "direct"
		};
	} catch (err) {
		return {
			delivered: false,
			path: "direct",
			error: `text completion direct delivery failed: ${summarizeDeliveryError(err)}`
		};
	}
}
function resolveGeneratedMediaDirectFallbackUrls(params) {
	const expected = uniqueStrings(normalizeStringEntries(params.expectedMediaUrls));
	const result = getGatewayAgentResult(params.announceResponse);
	if (!result) return expected;
	const delivered = new Set(collectMessagingToolDeliveredMediaUrls(result));
	return expected.filter((url) => !delivered.has(url));
}
function stripNonDeliverableChannelForCompletionOrigin(context) {
	const normalized = normalizeDeliveryContext(context);
	if (!normalized?.channel) return normalized;
	const channel = normalizeMessageChannel(normalized.channel);
	if (!channel || isDeliverableMessageChannel(channel)) return normalized;
	const { channel: _channel, ...rest } = normalized;
	return normalizeDeliveryContext(rest);
}
async function sendSubagentAnnounceDirectly(params) {
	if (params.signal?.aborted) return {
		delivered: false,
		path: "none"
	};
	const cfg = subagentAnnounceDeliveryDeps.getRuntimeConfig();
	const announceTimeoutMs = resolveSubagentAnnounceTimeoutMs(cfg);
	const canonicalRequesterSessionKey = resolveRequesterStoreKey(cfg, params.targetRequesterSessionKey);
	try {
		const completionDirectOrigin = normalizeDeliveryContext(params.completionDirectOrigin);
		const directOrigin = normalizeDeliveryContext(params.directOrigin);
		const requesterSessionOrigin = normalizeDeliveryContext(params.requesterSessionOrigin);
		const externalCompletionDirectOrigin = stripNonDeliverableChannelForCompletionOrigin(completionDirectOrigin);
		const completionExternalFallbackOrigin = mergeDeliveryContext(directOrigin, requesterSessionOrigin);
		const effectiveDirectOrigin = params.expectsCompletionMessage ? mergeDeliveryContext(externalCompletionDirectOrigin, completionExternalFallbackOrigin) : directOrigin;
		const sessionOnlyOrigin = effectiveDirectOrigin?.channel ? effectiveDirectOrigin : requesterSessionOrigin;
		const requesterEntry = loadRequesterSessionEntry(params.targetRequesterSessionKey).entry;
		const deliveryTarget = !params.requesterIsSubagent ? resolveExternalBestEffortDeliveryTarget({
			channel: effectiveDirectOrigin?.channel,
			to: effectiveDirectOrigin?.to,
			accountId: effectiveDirectOrigin?.accountId,
			threadId: effectiveDirectOrigin?.threadId
		}) : { deliver: false };
		const normalizedSessionOnlyOriginChannel = !params.requesterIsSubagent ? normalizeMessageChannel(sessionOnlyOrigin?.channel) : void 0;
		const sessionOnlyOriginChannel = normalizedSessionOnlyOriginChannel && isGatewayMessageChannel(normalizedSessionOnlyOriginChannel) ? normalizedSessionOnlyOriginChannel : void 0;
		const sourceToolId = normalizeOptionalLowercaseString(params.sourceTool) ?? (params.expectsCompletionMessage ? "subagent_announce" : "");
		const isSubagentCompletion = sourceToolId === "subagent_announce";
		const agentMediatedCompletion = requiresAgentMediatedCompletionDelivery({
			expectsCompletionMessage: params.expectsCompletionMessage,
			sourceTool: sourceToolId
		});
		const expectedMediaUrls = collectExpectedMediaFromInternalEvents(params.internalEvents);
		const requiresMessageToolDelivery = params.expectsCompletionMessage && completionRequiresMessageToolDelivery({
			cfg,
			requesterSessionKey: params.requesterSessionKey,
			targetRequesterSessionKey: canonicalRequesterSessionKey,
			requesterEntry,
			directOrigin: effectiveDirectOrigin,
			requesterSessionOrigin
		}) || agentMediatedCompletion && expectedMediaUrls.length > 0;
		const requesterActivity = resolveRequesterSessionActivity(canonicalRequesterSessionKey);
		let activeRequesterWakeFailed = false;
		const tryGeneratedMediaDirectDelivery = async (announceResponse) => {
			if (requesterActivity.isActive && !activeRequesterWakeFailed) return;
			const missingMediaUrls = resolveGeneratedMediaDirectFallbackUrls({
				expectedMediaUrls,
				announceResponse
			});
			return await deliverGeneratedMediaCompletionDirect({
				cfg,
				requesterSessionKey: canonicalRequesterSessionKey,
				directIdempotencyKey: params.directIdempotencyKey,
				deliveryTarget,
				mediaUrls: missingMediaUrls,
				internalEvents: params.internalEvents,
				sourceTool: params.sourceTool
			});
		};
		const completionSourceReplyDeliveryMode = requiresMessageToolDelivery ? "message_tool_only" : void 0;
		const shouldDeliverAgentFinal = deliveryTarget.deliver && !requiresMessageToolDelivery;
		const requesterQueueSettings = resolveQueueSettings({
			cfg,
			channel: requesterEntry?.channel ?? requesterEntry?.lastChannel ?? requesterEntry?.origin?.provider ?? requesterSessionOrigin?.channel ?? directOrigin?.channel,
			sessionEntry: requesterEntry
		});
		if (params.expectsCompletionMessage && requesterActivity.sessionId && requesterActivity.isActive) {
			const wakeOptions = {
				deliveryTimeoutMs: announceTimeoutMs,
				steeringMode: "all",
				...completionSourceReplyDeliveryMode ? { sourceReplyDeliveryMode: completionSourceReplyDeliveryMode } : {},
				...requesterQueueSettings.debounceMs !== void 0 ? { debounceMs: requesterQueueSettings.debounceMs } : {},
				waitForTranscriptCommit: true
			};
			const wakeOutcome = await resolveActiveWakeWithRetries(requesterActivity.sessionId, params.triggerMessage, wakeOptions, params.signal);
			if (wakeOutcome.queued) return {
				delivered: true,
				deliveredAt: wakeOutcome.deliveredAtMs,
				enqueuedAt: wakeOutcome.enqueuedAtMs,
				path: "steered"
			};
			activeRequesterWakeFailed = true;
			defaultRuntime.log(`[warn] Active requester session could not be woken for subagent completion; falling back to requester-agent handoff: ${formatQueueWakeFailureError("active requester session could not be woken", wakeOutcome)}`);
		}
		if (params.expectsCompletionMessage && isCronRunSessionKey(canonicalRequesterSessionKey) && !resolveRequesterSessionActivity(canonicalRequesterSessionKey).isActive) {
			const generatedMediaDelivery = await tryGeneratedMediaDirectDelivery();
			if (generatedMediaDelivery) return generatedMediaDelivery;
			if (!agentMediatedCompletion) return {
				delivered: true,
				path: "none"
			};
		}
		if (params.signal?.aborted) return {
			delivered: false,
			path: "none"
		};
		const directAgentThreadId = shouldDeliverAgentFinal ? stringifyRouteThreadId(deliveryTarget.threadId) : sessionOnlyOriginChannel ? stringifyRouteThreadId(sessionOnlyOrigin?.threadId) : void 0;
		const directAgentParams = {
			sessionKey: canonicalRequesterSessionKey,
			message: params.triggerMessage,
			deliver: shouldDeliverAgentFinal,
			bestEffortDeliver: params.bestEffortDeliver,
			internalEvents: params.internalEvents,
			channel: shouldDeliverAgentFinal ? deliveryTarget.channel : sessionOnlyOriginChannel,
			accountId: shouldDeliverAgentFinal ? deliveryTarget.accountId : sessionOnlyOriginChannel ? sessionOnlyOrigin?.accountId : void 0,
			to: shouldDeliverAgentFinal ? deliveryTarget.to : sessionOnlyOriginChannel ? sessionOnlyOrigin?.to : void 0,
			threadId: directAgentThreadId,
			inputProvenance: {
				kind: "inter_session",
				sourceSessionKey: params.sourceSessionKey,
				sourceChannel: params.sourceChannel ?? "webchat",
				sourceTool: params.sourceTool ?? "subagent_announce"
			},
			...completionSourceReplyDeliveryMode ? { sourceReplyDeliveryMode: completionSourceReplyDeliveryMode } : {},
			idempotencyKey: params.directIdempotencyKey
		};
		let directAnnounceResponse;
		try {
			directAnnounceResponse = await runAnnounceDeliveryWithRetry({
				operation: params.expectsCompletionMessage ? "completion direct announce agent call" : "direct announce agent call",
				signal: params.signal,
				run: async () => await runAnnounceAgentCall({
					agentParams: directAgentParams,
					expectFinal: true,
					timeoutMs: announceTimeoutMs
				})
			});
		} catch (err) {
			if (isPermanentAnnounceDeliveryError(err)) throw err;
			if (params.expectsCompletionMessage && shouldDeliverAgentFinal && isSubagentCompletion && isIncompleteAnnounceAgentResultError(err)) {
				const textDelivery = await deliverTextCompletionDirect({
					cfg,
					requesterSessionKey: canonicalRequesterSessionKey,
					directIdempotencyKey: params.directIdempotencyKey,
					deliveryTarget,
					internalEvents: params.internalEvents
				});
				if (textDelivery) return textDelivery;
			}
			throw err;
		}
		if (isGatewayAgentRunPending(directAnnounceResponse)) {
			if (params.expectsCompletionMessage && expectedMediaUrls.length === 0 && !requiresMessageToolDelivery) return {
				delivered: false,
				path: "direct",
				error: "completion agent handoff is still pending"
			};
			return {
				delivered: true,
				path: "direct"
			};
		}
		if (agentMediatedCompletion && expectedMediaUrls.length > 0 && !(requiresMessageToolDelivery ? hasGatewayAgentMessagingToolDeliveredExpectedMedia(directAnnounceResponse, expectedMediaUrls) : hasGatewayAgentDeliveredExpectedMedia(directAnnounceResponse, expectedMediaUrls))) {
			const generatedMediaDelivery = await tryGeneratedMediaDirectDelivery(directAnnounceResponse);
			if (generatedMediaDelivery) return generatedMediaDelivery;
			return {
				delivered: false,
				path: "direct",
				error: "completion agent did not deliver generated media"
			};
		}
		const directDeliveryFailure = shouldDeliverAgentFinal ? getGatewayAgentCommandDeliveryFailure(directAnnounceResponse) : void 0;
		if (directDeliveryFailure) return {
			delivered: false,
			path: "direct",
			error: directDeliveryFailure
		};
		if (params.expectsCompletionMessage && shouldDeliverAgentFinal && isSubagentCompletion && !hasVisibleGatewayAgentPayload(directAnnounceResponse) && !hasGatewayAgentMessagingToolDeliveryEvidence(directAnnounceResponse) && !hasIntentionalSilentGatewayAgentPayload(directAnnounceResponse)) {
			const textDelivery = await deliverTextCompletionDirect({
				cfg,
				requesterSessionKey: canonicalRequesterSessionKey,
				directIdempotencyKey: params.directIdempotencyKey,
				deliveryTarget,
				internalEvents: params.internalEvents
			});
			if (textDelivery) return textDelivery;
			if (hasFailedSubagentNoOutputCompletion(params.internalEvents)) return {
				delivered: false,
				path: "direct",
				error: "completion agent did not produce a visible reply"
			};
		}
		if (params.expectsCompletionMessage && requiresMessageToolDelivery && !hasGatewayAgentMessagingToolDeliveryEvidence(directAnnounceResponse) && !hasIntentionalSilentGatewayAgentPayload(directAnnounceResponse)) return {
			delivered: false,
			path: "direct",
			error: "completion agent did not use the message tool for message-tool-only delivery"
		};
		if (params.expectsCompletionMessage && shouldDeliverAgentFinal && !isSubagentCompletion && !hasVisibleGatewayAgentPayload(directAnnounceResponse)) return {
			delivered: false,
			path: "direct",
			error: "completion agent did not produce a visible reply"
		};
		return {
			delivered: true,
			path: "direct"
		};
	} catch (err) {
		return {
			delivered: false,
			path: "direct",
			error: summarizeDeliveryError(err)
		};
	}
}
async function deliverSubagentAnnouncement(params) {
	return await runSubagentAnnounceDispatch({
		expectsCompletionMessage: params.expectsCompletionMessage,
		signal: params.signal,
		steer: async () => await maybeSteerSubagentAnnounce({
			deliveryTimeoutMs: resolveSubagentAnnounceTimeoutMs(subagentAnnounceDeliveryDeps.getRuntimeConfig()),
			requesterSessionKey: params.requesterSessionKey,
			steerMessage: params.steerMessage,
			signal: params.signal
		}),
		direct: async () => await sendSubagentAnnounceDirectly({
			requesterSessionKey: params.requesterSessionKey,
			targetRequesterSessionKey: params.targetRequesterSessionKey,
			triggerMessage: params.triggerMessage,
			internalEvents: params.internalEvents,
			directIdempotencyKey: params.directIdempotencyKey,
			completionDirectOrigin: params.completionDirectOrigin,
			directOrigin: params.directOrigin,
			requesterSessionOrigin: params.requesterSessionOrigin,
			sourceSessionKey: params.sourceSessionKey,
			sourceChannel: params.sourceChannel,
			sourceTool: params.sourceTool,
			requesterIsSubagent: params.requesterIsSubagent,
			expectsCompletionMessage: params.expectsCompletionMessage,
			signal: params.signal,
			bestEffortDeliver: params.bestEffortDeliver
		})
	});
}
//#endregion
export { hasAcceptedSessionSpawn as _, resolveSubagentAnnounceTimeoutMs as a, isNonTerminalAgentRunStatus as c, hasCommittedMessagingToolDeliveryEvidence as d, hasMessagingToolDeliveryEvidence as f, mediaUrlsFromGeneratedAttachments as g, formatGeneratedAttachmentLines as h, loadSessionEntryByKey as i, formatAgentInternalEventsForPlainPrompt as l, hasVisibleAgentPayload as m, isInternalAnnounceRequesterSession as n, resolveSubagentCompletionOrigin as o, hasOutboundDeliveryEvidence as p, loadRequesterSessionEntry as r, runAnnounceDeliveryWithRetry as s, deliverSubagentAnnouncement as t, formatAgentInternalEventsForPrompt as u, normalizeAcceptedSessionSpawnResult as v };
