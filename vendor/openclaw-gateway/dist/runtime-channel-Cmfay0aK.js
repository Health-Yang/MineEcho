import { u as resolveStorePath } from "./paths-DZXdqwOo.js";
import { a as readSessionUpdatedAt, l as updateLastRoute, o as recordSessionMetaFromInbound } from "./store-B5j4GKkg.js";
import "./sessions-Ct4mpWsk.js";
import { i as shouldComputeCommandAuthorized, r as isControlCommandMessage, t as hasControlCommand } from "./command-detection-BHZ65i3a.js";
import { a as settleReplyDispatcher, i as dispatchReplyFromConfig, o as withReplyDispatcher } from "./dispatch-BGwFKOyt.js";
import { n as resolveChannelGroupRequireMention, t as resolveChannelGroupPolicy } from "./group-policy-CH35LESg.js";
import { i as resolveAgentRoute, t as buildAgentSessionKey } from "./resolve-route-uLXK2QLU.js";
import { t as resolveCommandAuthorizedFromAuthorizers } from "./command-gating-BZR3snoF.js";
import { a as readChannelAllowFromStore, d as upsertChannelPairingRequest } from "./pairing-store-BHCtszQV.js";
import { n as resolveInboundMentionDecision, t as implicitMentionKindWhen } from "./mention-gating-3P8aSD7o.js";
import { u as saveMediaBuffer } from "./store-CkmEdlzm.js";
import { a as saveRemoteMedia, i as readRemoteMediaBuffer, o as saveResponseMedia, r as fetchRemoteMedia } from "./fetch-C_mdbFEd.js";
import { i as resolveHumanDelayConfig, r as resolveEffectiveMessagesConfig } from "./identity-BFeakJ9C.js";
import { a as chunkText, c as resolveTextChunkLimit, i as chunkMarkdownTextWithMode, o as chunkTextWithMode, r as chunkMarkdownText, s as resolveChunkMode, t as chunkByNewline } from "./chunk-D9iphjyK.js";
import { t as loadChannelOutboundAdapter } from "./load-BzLFoqmN.js";
import { n as shouldHandleTextCommands } from "./commands-text-routing-CEdsdgmK.js";
import "./commands-registry-Brl2piP4.js";
import { i as matchesMentionWithExplicit, n as buildMentionRegexes, r as matchesMentionPatterns } from "./mentions-Dqn1ebZ6.js";
import { n as createReplyDispatcherWithTyping } from "./reply-dispatcher-DmOOpho9.js";
import { t as finalizeInboundContext } from "./inbound-context-CbkangX1.js";
import { t as dispatchReplyWithBufferedBlockDispatcher } from "./provider-dispatcher-BpX0UIHo.js";
import { a as resolveEnvelopeFormatOptions, r as formatInboundEnvelope, t as formatAgentEnvelope } from "./envelope-BhctI43w.js";
import { n as resolveInboundDebounceMs, t as createInboundDebouncer } from "./inbound-debounce-DQpLvByk.js";
import { i as shouldAckReaction, n as removeAckReactionAfterReply, r as removeAckReactionHandleAfterReply, t as createAckReactionHandle } from "./ack-reactions-BceP3SaE.js";
import { h as buildChannelInboundEventContext, l as runPreparedInboundReply, o as runChannelInboundEvent, r as dispatchChannelInboundReply } from "./kernel-Cmg67z5F.js";
import { n as setChannelConversationBindingMaxAgeBySessionKey, t as setChannelConversationBindingIdleTimeoutBySessionKey } from "./conversation-bindings-MKsmhCgI.js";
import { t as recordInboundSession } from "./session-B3CfqbFv.js";
import { t as resolveMarkdownTableMode } from "./markdown-tables-B8E9CbD4.js";
import { n as recordChannelActivity, t as getChannelActivity } from "./channel-activity-eMQlJ3BE.js";
import { t as convertMarkdownTables } from "./tables-CSTxKJa3.js";
import { t as buildPairingReply } from "./pairing-messages-BSLIQ5AX.js";
import { t as createChannelRuntimeContextRegistry } from "./channel-runtime-contexts-oIuwV6zO.js";
//#region src/plugins/runtime/runtime-channel.ts
function createRuntimeChannel() {
	return {
		text: {
			chunkByNewline,
			chunkMarkdownText,
			chunkMarkdownTextWithMode,
			chunkText,
			chunkTextWithMode,
			resolveChunkMode,
			resolveTextChunkLimit,
			hasControlCommand,
			resolveMarkdownTableMode,
			convertMarkdownTables
		},
		reply: {
			dispatchReplyWithBufferedBlockDispatcher,
			createReplyDispatcherWithTyping,
			resolveEffectiveMessagesConfig,
			resolveHumanDelayConfig,
			dispatchReplyFromConfig,
			withReplyDispatcher,
			settleReplyDispatcher,
			finalizeInboundContext,
			formatAgentEnvelope,
			/** @deprecated Prefer `BodyForAgent` + structured user-context blocks (do not build plaintext envelopes for prompts). */
			formatInboundEnvelope,
			resolveEnvelopeFormatOptions
		},
		routing: {
			buildAgentSessionKey,
			resolveAgentRoute
		},
		pairing: {
			buildPairingReply,
			readAllowFromStore: ({ channel, accountId, env }) => readChannelAllowFromStore(channel, env, accountId),
			upsertPairingRequest: ({ channel, id, accountId, meta, env, pairingAdapter }) => upsertChannelPairingRequest({
				channel,
				id,
				accountId,
				meta,
				env,
				pairingAdapter
			})
		},
		media: {
			readRemoteMediaBuffer,
			fetchRemoteMedia,
			saveRemoteMedia,
			saveResponseMedia,
			saveMediaBuffer
		},
		activity: {
			record: recordChannelActivity,
			get: getChannelActivity
		},
		session: {
			resolveStorePath,
			readSessionUpdatedAt,
			recordSessionMetaFromInbound,
			recordInboundSession,
			updateLastRoute
		},
		mentions: {
			buildMentionRegexes,
			matchesMentionPatterns,
			matchesMentionWithExplicit,
			implicitMentionKindWhen,
			resolveInboundMentionDecision
		},
		reactions: {
			createAckReactionHandle,
			shouldAckReaction,
			removeAckReactionAfterReply,
			removeAckReactionHandleAfterReply
		},
		groups: {
			resolveGroupPolicy: resolveChannelGroupPolicy,
			resolveRequireMention: resolveChannelGroupRequireMention
		},
		debounce: {
			createInboundDebouncer,
			resolveInboundDebounceMs
		},
		commands: {
			resolveCommandAuthorizedFromAuthorizers,
			isControlCommandMessage,
			shouldComputeCommandAuthorized,
			shouldHandleTextCommands
		},
		outbound: { loadAdapter: loadChannelOutboundAdapter },
		inbound: {
			buildContext: buildChannelInboundEventContext,
			run: runChannelInboundEvent,
			runPreparedReply: runPreparedInboundReply,
			dispatchReply: dispatchChannelInboundReply
		},
		threadBindings: {
			setIdleTimeoutBySessionKey: ({ channelId, targetSessionKey, accountId, idleTimeoutMs }) => setChannelConversationBindingIdleTimeoutBySessionKey({
				channelId,
				targetSessionKey,
				accountId,
				idleTimeoutMs
			}),
			setMaxAgeBySessionKey: ({ channelId, targetSessionKey, accountId, maxAgeMs }) => setChannelConversationBindingMaxAgeBySessionKey({
				channelId,
				targetSessionKey,
				accountId,
				maxAgeMs
			})
		},
		runtimeContexts: createChannelRuntimeContextRegistry()
	};
}
//#endregion
export { createRuntimeChannel as t };
