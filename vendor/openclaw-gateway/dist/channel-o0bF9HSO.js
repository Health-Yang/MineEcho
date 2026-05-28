import { a as normalizeLowercaseStringOrEmpty, d as normalizeStringifiedEntries } from "./string-coerce-DKw2K5wM.js";
import { l as normalizeE164 } from "./utils-B5r0V84N.js";
import { t as DEFAULT_ACCOUNT_ID } from "./account-id-B0YIFDpA.js";
import { a as chunkText, c as resolveTextChunkLimit } from "./chunk-D9iphjyK.js";
import { n as resolveOutboundSendDep } from "./send-deps-B-rmeTVl.js";
import { s as createScopedChannelConfigAdapter, t as adaptScopedAccountAccessor } from "./channel-config-helpers-h3merl20.js";
import { t as buildOutboundBaseSessionKey } from "./base-session-key-DR3_ol9s.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { n as describeAccountSnapshot } from "./account-helpers-BSPsbBAx.js";
import { c as getChatChannelMeta, i as createChatChannelPlugin, r as createChannelPluginBase } from "./core-CcqJUBno.js";
import "./channel-core-LlziNmjH.js";
import "./routing-BEOAuKfu.js";
import { t as resolveMarkdownTableMode } from "./markdown-tables-B8E9CbD4.js";
import { r as createRestrictSendersChannelSecurity } from "./channel-policy-DUgslXLg.js";
import "./reply-chunking-MZjv6icV.js";
import { S as defineChannelMessageAdapter } from "./channel-outbound-DuRkxH3q.js";
import { a as resolveChannelMediaMaxBytes } from "./media-runtime-BndVydhQ.js";
import "./markdown-table-runtime-D0twI-Sd.js";
import { n as buildDmGroupAccountAllowlistAdapter } from "./allowlist-config-edit-DMfk12eD.js";
import { t as PAIRING_APPROVED_MESSAGE } from "./pairing-message-C9w9gv4K.js";
import { c as collectStatusIssuesFromLastError, d as createDefaultChannelRuntimeState, n as buildBaseChannelStatusSummary, u as createComputedAccountStatusAdapter } from "./status-helpers-BrYXq8bp.js";
import "./channel-status-BX1a89bS.js";
import { i as createPairingPrefixStripper } from "./channel-pairing-BQ_p8VVd.js";
import { n as attachChannelToResults, t as attachChannelToResult } from "./channel-send-result-swFdRKhg.js";
import "./text-utility-runtime-Da3iUwdt.js";
import { i as resolveSignalAccount, n as listSignalAccountIds, r as resolveDefaultSignalAccountId } from "./accounts-CiPyF2G3.js";
import { c as resolveSignalSender, d as normalizeSignalMessagingTarget, l as looksLikeUuid, o as resolveSignalPeerId, s as resolveSignalRecipient, u as looksLikeSignalTargetId } from "./identity-DoC1DJz7.js";
import { n as markdownToSignalTextChunks } from "./format-CwzvmVCR.js";
import { n as shouldSuppressLocalSignalExecApprovalPrompt, r as signalApprovalCapability } from "./approval-native-DDO2UQFk.js";
import { n as resolveSignalReactionLevel, t as signalMessageActions } from "./message-actions-BcHNBA90.js";
import { n as createSignalSetupWizardProxy, s as signalSetupAdapter } from "./setup-core-BQWGPMJX.js";
import { t as SignalChannelConfigSchema } from "./config-schema-o5kMCGP_.js";
//#region extensions/signal/src/outbound-session.ts
function resolveSignalOutboundTarget(target) {
	const stripped = target.replace(/^signal:/i, "").trim();
	const lowered = normalizeLowercaseStringOrEmpty(stripped);
	if (lowered.startsWith("group:")) {
		const groupId = stripped.slice(6).trim();
		if (!groupId) return null;
		return {
			peer: {
				kind: "group",
				id: groupId
			},
			chatType: "group",
			from: `group:${groupId}`,
			to: `group:${groupId}`
		};
	}
	let recipient = stripped.trim();
	if (lowered.startsWith("username:")) recipient = stripped.slice(9).trim();
	else if (lowered.startsWith("u:")) recipient = stripped.slice(2).trim();
	if (!recipient) return null;
	const uuidCandidate = normalizeLowercaseStringOrEmpty(recipient).startsWith("uuid:") ? recipient.slice(5) : recipient;
	const sender = resolveSignalSender({
		sourceUuid: looksLikeUuid(uuidCandidate) ? uuidCandidate : null,
		sourceNumber: looksLikeUuid(uuidCandidate) ? null : recipient
	});
	const peerId = sender ? resolveSignalPeerId(sender) : recipient;
	const displayRecipient = sender ? resolveSignalRecipient(sender) : recipient;
	return {
		peer: {
			kind: "direct",
			id: peerId
		},
		chatType: "direct",
		from: `signal:${displayRecipient}`,
		to: `signal:${displayRecipient}`
	};
}
//#endregion
//#region extensions/signal/src/shared.ts
const SIGNAL_CHANNEL = "signal";
async function loadSignalChannelRuntime() {
	return await import("./channel.runtime-C7977EXX.js");
}
const signalSetupWizard = createSignalSetupWizardProxy(async () => (await loadSignalChannelRuntime()).signalSetupWizard);
const signalConfigAdapter = createScopedChannelConfigAdapter({
	sectionKey: SIGNAL_CHANNEL,
	listAccountIds: (cfg) => listSignalAccountIds(cfg),
	resolveAccount: adaptScopedAccountAccessor((params) => resolveSignalAccount(params)),
	defaultAccountId: (cfg) => resolveDefaultSignalAccountId(cfg),
	clearBaseFields: [
		"account",
		"configPath",
		"httpUrl",
		"httpHost",
		"httpPort",
		"cliPath",
		"name"
	],
	resolveAllowFrom: (account) => account.config.allowFrom,
	formatAllowFrom: (allowFrom) => normalizeStringifiedEntries(allowFrom).map((entry) => entry === "*" ? "*" : normalizeE164(entry.replace(/^signal:/i, ""))).filter(Boolean),
	resolveDefaultTo: (account) => account.config.defaultTo
});
const signalSecurityAdapter = createRestrictSendersChannelSecurity({
	channelKey: SIGNAL_CHANNEL,
	resolveDmPolicy: (account) => account.config.dmPolicy,
	resolveDmAllowFrom: (account) => account.config.allowFrom,
	resolveGroupPolicy: (account) => account.config.groupPolicy,
	surface: "Signal groups",
	openScope: "any member",
	groupPolicyPath: "channels.signal.groupPolicy",
	groupAllowFromPath: "channels.signal.groupAllowFrom",
	mentionGated: false,
	policyPathSuffix: "dmPolicy",
	normalizeDmEntry: (raw) => normalizeE164(raw.replace(/^signal:/i, "").trim())
});
function createSignalPluginBase(params) {
	return {
		...createChannelPluginBase({
			id: SIGNAL_CHANNEL,
			meta: { ...getChatChannelMeta(SIGNAL_CHANNEL) },
			setupWizard: params.setupWizard,
			capabilities: {
				chatTypes: ["direct", "group"],
				media: true,
				reactions: true
			},
			streaming: { blockStreamingCoalesceDefaults: {
				minChars: 1500,
				idleMs: 1e3
			} },
			reload: { configPrefixes: ["channels.signal"] },
			configSchema: SignalChannelConfigSchema,
			config: {
				...signalConfigAdapter,
				isConfigured: (account) => account.configured,
				describeAccount: (account) => describeAccountSnapshot({
					account,
					configured: account.configured,
					extra: { baseUrl: account.baseUrl }
				})
			},
			security: signalSecurityAdapter,
			setup: params.setup
		}),
		messaging: { defaultMarkdownTableMode: "bullets" }
	};
}
//#endregion
//#region extensions/signal/src/channel.ts
let signalMonitorModulePromise = null;
let signalProbeModulePromise = null;
let signalSendRuntimePromise = null;
async function loadSignalMonitorModule() {
	signalMonitorModulePromise ??= import("./monitor-CMnVrlq1.js");
	return await signalMonitorModulePromise;
}
async function loadSignalProbeModule() {
	signalProbeModulePromise ??= import("./probe-Hz8F9OLq.js");
	return await signalProbeModulePromise;
}
async function loadSignalSendRuntime() {
	signalSendRuntimePromise ??= import("./send.runtime.js");
	return await signalSendRuntimePromise;
}
async function resolveSignalSendContext(params) {
	return {
		send: resolveOutboundSendDep(params.deps, "signal") ?? (await loadSignalSendRuntime()).sendMessageSignal,
		maxBytes: resolveChannelMediaMaxBytes({
			cfg: params.cfg,
			resolveChannelLimitMb: ({ cfg, accountId }) => cfg.channels?.signal?.accounts?.[accountId]?.mediaMaxMb ?? cfg.channels?.signal?.mediaMaxMb,
			accountId: params.accountId
		})
	};
}
async function sendSignalOutbound(params) {
	const { send, maxBytes } = await resolveSignalSendContext(params);
	return await send(params.to, params.text, {
		cfg: params.cfg,
		...params.mediaUrl ? { mediaUrl: params.mediaUrl } : {},
		...params.mediaLocalRoots?.length ? { mediaLocalRoots: params.mediaLocalRoots } : {},
		...params.mediaReadFile ? { mediaReadFile: params.mediaReadFile } : {},
		maxBytes,
		accountId: params.accountId ?? void 0
	});
}
const signalMessageAdapter = defineChannelMessageAdapter({
	id: "signal",
	durableFinal: { capabilities: {
		text: true,
		media: true
	} },
	send: {
		text: async (ctx) => await sendSignalOutbound({
			cfg: ctx.cfg,
			to: ctx.to,
			text: ctx.text,
			accountId: ctx.accountId ?? void 0,
			deps: ctx.deps
		}),
		media: async (ctx) => await sendSignalOutbound({
			cfg: ctx.cfg,
			to: ctx.to,
			text: ctx.text,
			mediaUrl: ctx.mediaUrl,
			mediaLocalRoots: ctx.mediaLocalRoots,
			mediaReadFile: ctx.mediaReadFile,
			accountId: ctx.accountId ?? void 0,
			deps: ctx.deps
		})
	}
});
function inferSignalTargetChatType(rawTo) {
	let to = rawTo.trim();
	if (!to) return;
	if (/^signal:/i.test(to)) to = to.replace(/^signal:/i, "").trim();
	if (!to) return;
	const lower = normalizeLowercaseStringOrEmpty(to);
	if (lower.startsWith("group:")) return "group";
	if (lower.startsWith("username:") || lower.startsWith("u:")) return "direct";
	return "direct";
}
function buildSignalBaseSessionKey(params) {
	return buildOutboundBaseSessionKey({
		...params,
		channel: "signal"
	});
}
function resolveSignalOutboundSessionRoute(params) {
	const resolved = resolveSignalOutboundTarget(params.target);
	if (!resolved) return null;
	const baseSessionKey = buildSignalBaseSessionKey({
		cfg: params.cfg,
		agentId: params.agentId,
		accountId: params.accountId,
		peer: resolved.peer
	});
	return {
		sessionKey: baseSessionKey,
		baseSessionKey,
		...resolved
	};
}
async function sendFormattedSignalText(ctx) {
	const { send, maxBytes } = await resolveSignalSendContext({
		cfg: ctx.cfg,
		accountId: ctx.accountId ?? void 0,
		deps: ctx.deps
	});
	const limit = resolveTextChunkLimit(ctx.cfg, "signal", ctx.accountId ?? void 0, { fallbackLimit: 4e3 });
	const tableMode = resolveMarkdownTableMode({
		cfg: ctx.cfg,
		channel: "signal",
		accountId: ctx.accountId ?? void 0
	});
	let chunks = limit === void 0 ? markdownToSignalTextChunks(ctx.text, Number.POSITIVE_INFINITY, { tableMode }) : markdownToSignalTextChunks(ctx.text, limit, { tableMode });
	if (chunks.length === 0 && ctx.text) chunks = [{
		text: ctx.text,
		styles: []
	}];
	const results = [];
	for (const chunk of chunks) {
		ctx.abortSignal?.throwIfAborted();
		const result = await send(ctx.to, chunk.text, {
			cfg: ctx.cfg,
			maxBytes,
			accountId: ctx.accountId ?? void 0,
			textMode: "plain",
			textStyles: chunk.styles
		});
		results.push(result);
	}
	return attachChannelToResults("signal", results);
}
async function sendFormattedSignalMedia(ctx) {
	ctx.abortSignal?.throwIfAborted();
	const { send, maxBytes } = await resolveSignalSendContext({
		cfg: ctx.cfg,
		accountId: ctx.accountId ?? void 0,
		deps: ctx.deps
	});
	const tableMode = resolveMarkdownTableMode({
		cfg: ctx.cfg,
		channel: "signal",
		accountId: ctx.accountId ?? void 0
	});
	const formatted = markdownToSignalTextChunks(ctx.text, Number.POSITIVE_INFINITY, { tableMode })[0] ?? {
		text: ctx.text,
		styles: []
	};
	return attachChannelToResult("signal", await send(ctx.to, formatted.text, {
		cfg: ctx.cfg,
		mediaUrl: ctx.mediaUrl,
		mediaLocalRoots: ctx.mediaLocalRoots,
		...ctx.mediaReadFile ? { mediaReadFile: ctx.mediaReadFile } : {},
		maxBytes,
		accountId: ctx.accountId ?? void 0,
		textMode: "plain",
		textStyles: formatted.styles
	}));
}
const signalPlugin = createChatChannelPlugin({
	base: {
		...createSignalPluginBase({
			setupWizard: signalSetupWizard,
			setup: signalSetupAdapter
		}),
		actions: signalMessageActions,
		approvalCapability: signalApprovalCapability,
		allowlist: buildDmGroupAccountAllowlistAdapter({
			channelId: "signal",
			resolveAccount: resolveSignalAccount,
			normalize: ({ cfg, accountId, values }) => signalConfigAdapter.formatAllowFrom({
				cfg,
				accountId,
				allowFrom: values
			}),
			resolveDmAllowFrom: (account) => account.config.allowFrom,
			resolveGroupAllowFrom: (account) => account.config.groupAllowFrom,
			resolveDmPolicy: (account) => account.config.dmPolicy,
			resolveGroupPolicy: (account) => account.config.groupPolicy
		}),
		agentPrompt: { reactionGuidance: ({ cfg, accountId }) => {
			const level = resolveSignalReactionLevel({
				cfg,
				accountId: accountId ?? void 0
			}).agentReactionGuidance;
			return level ? {
				level,
				channelLabel: "Signal"
			} : void 0;
		} },
		messaging: {
			targetPrefixes: ["signal"],
			normalizeTarget: normalizeSignalMessagingTarget,
			inferTargetChatType: ({ to }) => inferSignalTargetChatType(to),
			resolveOutboundSessionRoute: (params) => resolveSignalOutboundSessionRoute(params),
			targetResolver: {
				looksLikeId: looksLikeSignalTargetId,
				hint: "<E.164|uuid:ID|group:ID|signal:group:ID|signal:+E.164>"
			}
		},
		heartbeat: {
			sendTyping: async ({ cfg, to, accountId }) => {
				await (await loadSignalSendRuntime()).sendTypingSignal(to, {
					cfg,
					...accountId ? { accountId } : {}
				});
			},
			clearTyping: async ({ cfg, to, accountId }) => {
				await (await loadSignalSendRuntime()).sendTypingSignal(to, {
					cfg,
					...accountId ? { accountId } : {},
					stop: true
				});
			}
		},
		status: createComputedAccountStatusAdapter({
			defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
			collectStatusIssues: (accounts) => collectStatusIssuesFromLastError("signal", accounts),
			buildChannelSummary: ({ snapshot }) => buildBaseChannelStatusSummary(snapshot, {
				baseUrl: snapshot.baseUrl ?? null,
				probe: snapshot.probe,
				lastProbeAt: snapshot.lastProbeAt ?? null
			}),
			probeAccount: async ({ account, timeoutMs }) => {
				const baseUrl = account.baseUrl;
				const { probeSignal } = await loadSignalProbeModule();
				return await probeSignal(baseUrl, timeoutMs, { apiMode: account.config?.apiMode ?? "auto" });
			},
			formatCapabilitiesProbe: ({ probe }) => probe?.version ? [{ text: `Signal daemon: ${probe.version}` }] : [],
			resolveAccountSnapshot: ({ account }) => ({
				accountId: account.accountId,
				name: account.name,
				enabled: account.enabled,
				configured: account.configured,
				extra: { baseUrl: account.baseUrl }
			})
		}),
		gateway: { startAccount: async (ctx) => {
			const account = ctx.account;
			ctx.setStatus({
				accountId: account.accountId,
				baseUrl: account.baseUrl
			});
			ctx.log?.info(`[${account.accountId}] starting provider (${account.baseUrl})`);
			const { monitorSignalProvider } = await loadSignalMonitorModule();
			return await monitorSignalProvider({
				accountId: account.accountId,
				config: ctx.cfg,
				runtime: ctx.runtime,
				channelRuntime: ctx.channelRuntime,
				abortSignal: ctx.abortSignal,
				mediaMaxMb: account.config.mediaMaxMb
			});
		} },
		message: signalMessageAdapter
	},
	pairing: { text: {
		idLabel: "signalNumber",
		message: PAIRING_APPROVED_MESSAGE,
		normalizeAllowEntry: createPairingPrefixStripper(/^signal:/i),
		notify: async ({ cfg, id, message }) => {
			await (await loadSignalSendRuntime()).sendMessageSignal(id, message, { cfg });
		}
	} },
	security: signalSecurityAdapter,
	outbound: {
		base: {
			deliveryMode: "direct",
			chunker: chunkText,
			chunkerMode: "text",
			textChunkLimit: 4e3,
			shouldSuppressLocalPayloadPrompt: ({ cfg, accountId, payload, hint }) => shouldSuppressLocalSignalExecApprovalPrompt({
				cfg,
				accountId,
				payload,
				hint
			}),
			sendFormattedText: async ({ cfg, to, text, accountId, deps, abortSignal }) => await sendFormattedSignalText({
				cfg,
				to,
				text,
				accountId,
				deps,
				abortSignal
			}),
			sendFormattedMedia: async ({ cfg, to, text, mediaUrl, mediaLocalRoots, mediaReadFile, accountId, deps, abortSignal }) => await sendFormattedSignalMedia({
				cfg,
				to,
				text,
				mediaUrl,
				mediaLocalRoots,
				mediaReadFile,
				accountId,
				deps,
				abortSignal
			})
		},
		attachedResults: {
			channel: "signal",
			sendText: async ({ cfg, to, text, accountId, deps }) => await sendSignalOutbound({
				cfg,
				to,
				text,
				accountId: accountId ?? void 0,
				deps
			}),
			sendMedia: async ({ cfg, to, text, mediaUrl, mediaLocalRoots, mediaReadFile, accountId, deps }) => await sendSignalOutbound({
				cfg,
				to,
				text,
				mediaUrl,
				mediaLocalRoots,
				mediaReadFile,
				accountId: accountId ?? void 0,
				deps
			})
		}
	}
});
//#endregion
export { resolveSignalOutboundTarget as i, createSignalPluginBase as n, signalSetupWizard as r, signalPlugin as t };
