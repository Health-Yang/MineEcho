import { f as resolveMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { h as stringifyRouteThreadId } from "./channel-route-Dvehdg4D.js";
import { c as normalizeAccountId } from "./delivery-context.shared-B9zntlj0.js";
import { u as updateSessionStore } from "./store-B5j4GKkg.js";
import { n as mergeSessionEntry } from "./types-D7s3-R_6.js";
import { c as hasInternalRuntimeContext, u as stripInternalRuntimeContext } from "./internal-runtime-context-DftY0OXU.js";
import { l as formatAgentInternalEventsForPlainPrompt, u as formatAgentInternalEventsForPrompt } from "./subagent-announce-delivery-DK-Ub9gW.js";
//#region src/agents/command/attempt-execution.shared.ts
async function persistSessionEntry(params) {
	const persisted = await updateSessionStore(params.storePath, (store) => {
		const current = store[params.sessionKey];
		if (params.shouldPersist && !params.shouldPersist(current)) return current;
		const merged = mergeSessionEntry(store[params.sessionKey], params.entry);
		for (const field of params.clearedFields ?? []) if (!Object.hasOwn(params.entry, field)) Reflect.deleteProperty(merged, field);
		store[params.sessionKey] = merged;
		return merged;
	}, { takeCacheOwnership: true });
	if (persisted) params.sessionStore[params.sessionKey] = persisted;
	else delete params.sessionStore[params.sessionKey];
	return persisted;
}
function prependInternalEventContext(body, events) {
	if (hasInternalRuntimeContext(body)) return body;
	const renderedEvents = formatAgentInternalEventsForPrompt(events);
	if (!renderedEvents) return body;
	return [renderedEvents, body].filter(Boolean).join("\n\n");
}
function resolvePlainInternalEventBody(body, events) {
	const renderedEvents = formatAgentInternalEventsForPlainPrompt(events);
	if (!renderedEvents) return body;
	return [renderedEvents, stripInternalRuntimeContext(body).trim()].filter(Boolean).join("\n\n") || body;
}
function resolveAcpPromptBody(body, events) {
	return events?.length ? resolvePlainInternalEventBody(body, events) : body;
}
function resolveInternalEventTranscriptBody(body, events) {
	if (!hasInternalRuntimeContext(body)) return body;
	return resolvePlainInternalEventBody(body, events);
}
//#endregion
//#region src/agents/command/run-context.ts
function resolveAgentRunContext(opts) {
	const merged = opts.runContext ? { ...opts.runContext } : {};
	const normalizedChannel = resolveMessageChannel(merged.messageChannel ?? opts.messageChannel, opts.replyChannel ?? opts.channel);
	if (normalizedChannel) merged.messageChannel = normalizedChannel;
	const normalizedAccountId = normalizeAccountId(merged.accountId ?? opts.accountId);
	if (normalizedAccountId) merged.accountId = normalizedAccountId;
	const groupId = (merged.groupId ?? opts.groupId)?.toString().trim();
	if (groupId) merged.groupId = groupId;
	const groupChannel = (merged.groupChannel ?? opts.groupChannel)?.toString().trim();
	if (groupChannel) merged.groupChannel = groupChannel;
	const groupSpace = (merged.groupSpace ?? opts.groupSpace)?.toString().trim();
	if (groupSpace) merged.groupSpace = groupSpace;
	if (merged.currentThreadTs == null && opts.threadId != null && opts.threadId !== "" && opts.threadId !== null) {
		const threadId = stringifyRouteThreadId(opts.threadId);
		if (threadId) merged.currentThreadTs = threadId;
	}
	if (!merged.currentChannelId && opts.to) {
		const trimmedTo = opts.to.trim();
		if (trimmedTo) merged.currentChannelId = trimmedTo;
	}
	return merged;
}
//#endregion
export { resolveInternalEventTranscriptBody as a, resolveAcpPromptBody as i, persistSessionEntry as n, prependInternalEventContext as r, resolveAgentRunContext as t };
