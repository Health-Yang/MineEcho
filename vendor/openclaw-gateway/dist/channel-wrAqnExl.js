import { a as normalizeLowercaseStringOrEmpty, c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { c as parseAgentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { n as normalizeAccountId, t as DEFAULT_ACCOUNT_ID } from "./account-id-B0YIFDpA.js";
import { o as channelRouteTargetsMatchExact } from "./channel-route-Dvehdg4D.js";
import { r as createLazyRuntimeModule } from "./lazy-runtime-D-7_JraP.js";
import { D as resolveExecApprovalRequestAllowedDecisions } from "./exec-approvals-oH5G9_TS.js";
import { t as sanitizeForPlainText } from "./sanitize-text-CyYXgWu1.js";
import { t as createMessageReceiptFromOutboundResults } from "./receipt-KEYzve-j.js";
import { p as formatTrimmedAllowFromEntries, s as createScopedChannelConfigAdapter, t as adaptScopedAccountAccessor } from "./channel-config-helpers-h3merl20.js";
import { t as buildOutboundBaseSessionKey } from "./base-session-key-DR3_ol9s.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { n as describeAccountSnapshot } from "./account-helpers-BSPsbBAx.js";
import { c as getChatChannelMeta, i as createChatChannelPlugin, r as createChannelPluginBase } from "./core-CcqJUBno.js";
import "./channel-core-LlziNmjH.js";
import "./routing-BEOAuKfu.js";
import { r as createRestrictSendersChannelSecurity } from "./channel-policy-DUgslXLg.js";
import { t as matchesApprovalRequestFilters } from "./approval-request-filters-VKwGhlg-.js";
import { c as buildExecApprovalPendingReplyPayload, p as getExecApprovalReplyMetadata } from "./exec-approval-reply-CvpRi92u.js";
import "./approval-client-runtime-DwawpTKX.js";
import { i as splitChannelApprovalCapability, r as createChannelApprovalCapability } from "./approval-delivery-helpers-0rGWr8Ti.js";
import "./approval-delivery-runtime-BCHo9nhy.js";
import { n as createLazyChannelApprovalNativeRuntimeAdapter } from "./approval-handler-adapter-runtime-uo1rB4v-.js";
import { t as resolveExecApprovalCommandDisplay } from "./exec-approval-command-display-Cs9jISl9.js";
import { a as doesApprovalRequestMatchChannelAccount, r as resolveApprovalRequestSessionTarget } from "./exec-approval-session-target-CXv85GEO.js";
import { a as shouldSuppressLocalNativeExecApprovalPrompt, n as createChannelNativeOriginTargetResolver, t as createChannelApproverDmTargetResolver } from "./approval-native-helpers-DorIyB3D.js";
import "./approval-native-runtime-0Hr9Qyul.js";
import { r as buildPluginApprovalPendingReplyPayload } from "./approval-renderers-MGVAWGjJ.js";
import "./approval-runtime-DVCqoMA9.js";
import { S as defineChannelMessageAdapter } from "./channel-outbound-DuRkxH3q.js";
import { t as chunkTextForOutbound } from "./text-chunking-CWOBXxG4.js";
import { n as buildDmGroupAccountAllowlistAdapter } from "./allowlist-config-edit-DMfk12eD.js";
import { c as collectStatusIssuesFromLastError, d as createDefaultChannelRuntimeState, u as createComputedAccountStatusAdapter } from "./status-helpers-BrYXq8bp.js";
import { n as buildPassiveProbedChannelStatusSummary } from "./extension-shared-E8u-aPa3.js";
import { a as resolveIMessageAccount, i as resolveDefaultIMessageAccountId, r as listIMessageAccountIds, t as collectIMessageDuplicateAccountSourceWarnings } from "./accounts-BET9ibA4.js";
import { a as looksLikeIMessageExplicitTargetId, c as parseIMessageTarget, n as inferIMessageTargetChatType, o as normalizeIMessageHandle } from "./targets-BQLF_yw-.js";
import { n as resolveIMessageGroupToolPolicy, r as imessageMessageActions, t as resolveIMessageGroupRequireMention } from "./group-policy-CjFAiqSF.js";
import { h as imessageApprovalAuth, m as getIMessageApprovalApprovers, n as normalizeIMessageMessagingTarget, r as addIMessageApprovalReactionHintToText } from "./normalize-C6-Ial3a.js";
import { a as resolveIMessageConversationIdFromTarget, i as normalizeIMessageAcpConversationId, r as matchIMessageAcpConversation, t as sanitizeOutboundText } from "./sanitize-outbound-BAErCM6J.js";
import { t as createIMessageConversationBindingManager } from "./conversation-bindings-B6qQqT9y.js";
import { a as imessageSetupAdapter, n as createIMessageSetupWizardProxy } from "./setup-core-CKX6Vr0A.js";
import { t as IMessageChannelConfigSchema } from "./config-schema-BqqynCPY.js";
import { n as resolveIMessageAttachmentRoots, r as resolveIMessageRemoteAttachmentRoots } from "./media-contract-aU5qhVI7.js";
//#region extensions/imessage/src/approval-text.ts
function replaceApprovalIdPlaceholder(text, approvalId) {
	const safeApprovalId = approvalId.replace(/\$/g, "$$$$");
	return (text ?? "").replace(/\/approve\s+<id>/g, `/approve ${safeApprovalId}`);
}
//#endregion
//#region extensions/imessage/src/approval-native.ts
const DEFAULT_APPROVAL_FORWARDING_MODE = "session";
const DEFAULT_PLUGIN_APPROVAL_DECISIONS = [
	"allow-once",
	"allow-always",
	"deny"
];
function isIMessageApprovalTransportEnabled(params) {
	return resolveIMessageAccount({
		cfg: params.cfg,
		accountId: params.accountId
	}).enabled;
}
function resolveApprovalKind(request, approvalKind) {
	if (approvalKind) return approvalKind;
	return "command" in request.request ? "exec" : "plugin";
}
function resolveApprovalForwardingConfig(params) {
	return params.approvalKind === "plugin" ? params.cfg.approvals?.plugin : params.cfg.approvals?.exec;
}
function normalizeApprovalForwardingMode(mode) {
	return mode ?? DEFAULT_APPROVAL_FORWARDING_MODE;
}
function approvalModeIncludesSession(mode) {
	return mode === "session" || mode === "both";
}
function approvalModeIncludesTargets(mode) {
	return mode === "targets" || mode === "both";
}
function matchesForwardingFilters(params) {
	return matchesApprovalRequestFilters({
		request: params.request.request,
		agentFilter: params.config.agentFilter,
		sessionFilter: params.config.sessionFilter,
		fallbackAgentIdFromSessionKey: true
	});
}
function targetAccountMatchesIMessageAccount(params) {
	const targetAccountId = normalizeOptionalString(params.targetAccountId);
	const accountId = normalizeOptionalString(params.accountId);
	if (targetAccountId) return !accountId || normalizeAccountId(targetAccountId) === normalizeAccountId(accountId);
	if (!accountId) return true;
	const normalizedAccountId = normalizeAccountId(accountId);
	if (normalizedAccountId === normalizeAccountId(resolveDefaultIMessageAccountId(params.cfg))) return true;
	const enabledAccountIds = listIMessageAccountIds(params.cfg).filter((candidateAccountId) => isIMessageApprovalTransportEnabled({
		cfg: params.cfg,
		accountId: candidateAccountId
	})).map((candidateAccountId) => normalizeAccountId(candidateAccountId));
	return enabledAccountIds.length === 1 && enabledAccountIds[0] === normalizedAccountId;
}
function normalizeIMessageForwardTarget(target) {
	if (normalizeLowercaseStringOrEmpty(target.channel) !== "imessage") return null;
	const to = normalizeIMessageMessagingTarget(target.to);
	if (!to) return null;
	return {
		to,
		accountId: normalizeOptionalString(target.accountId),
		threadId: target.threadId ?? null
	};
}
function nativeApprovalTargetsMatch(params) {
	return channelRouteTargetsMatchExact({
		left: {
			channel: "imessage",
			to: params.left.to,
			accountId: params.left.accountId,
			threadId: params.left.threadId
		},
		right: {
			channel: "imessage",
			to: params.right.to,
			accountId: params.right.accountId,
			threadId: params.right.threadId
		}
	});
}
function hasMatchingIMessageTarget(params) {
	const candidateTarget = params.target ? normalizeIMessageForwardTarget(params.target) : null;
	return (params.config.targets ?? []).some((target) => {
		const configuredTarget = normalizeIMessageForwardTarget(target);
		if (!configuredTarget) return false;
		if (!targetAccountMatchesIMessageAccount({
			cfg: params.cfg,
			targetAccountId: configuredTarget.accountId,
			accountId: params.accountId
		})) return false;
		if (!candidateTarget) return true;
		return nativeApprovalTargetsMatch({
			left: configuredTarget,
			right: candidateTarget
		});
	});
}
function hasIMessageOriginOrSessionTarget(params) {
	if (resolveTurnSourceIMessageOriginTarget(params.request)) return true;
	const sessionTarget = resolveApprovalRequestSessionTarget({
		cfg: params.cfg,
		request: params.request
	});
	return normalizeLowercaseStringOrEmpty(sessionTarget?.channel) === "imessage" && targetAccountMatchesIMessageAccount({
		cfg: params.cfg,
		targetAccountId: sessionTarget?.accountId,
		accountId: params.accountId
	});
}
function canApprovalPotentiallyRouteToIMessage(params) {
	if (!isIMessageApprovalTransportEnabled(params)) return false;
	const config = resolveApprovalForwardingConfig(params);
	if (!config?.enabled) return false;
	const mode = normalizeApprovalForwardingMode(config.mode);
	if (approvalModeIncludesSession(mode)) return true;
	if (params.nativeSessionOnly) return false;
	return approvalModeIncludesTargets(mode) && hasMatchingIMessageTarget({
		cfg: params.cfg,
		config,
		accountId: params.accountId
	});
}
function canAnyApprovalPotentiallyRouteToIMessage(params) {
	return canApprovalPotentiallyRouteToIMessage({
		...params,
		approvalKind: "exec"
	}) || canApprovalPotentiallyRouteToIMessage({
		...params,
		approvalKind: "plugin"
	});
}
function isIMessageSessionApprovalEligible(params) {
	if (!isIMessageApprovalTransportEnabled(params)) return false;
	const config = resolveApprovalForwardingConfig(params);
	if (!config?.enabled) return false;
	if (!approvalModeIncludesSession(normalizeApprovalForwardingMode(config.mode))) return false;
	if (!matchesForwardingFilters({
		config,
		request: params.request
	})) return false;
	if (!doesApprovalRequestMatchChannelAccount({
		cfg: params.cfg,
		request: params.request,
		channel: "imessage",
		accountId: params.accountId
	})) return false;
	return hasIMessageOriginOrSessionTarget({
		cfg: params.cfg,
		accountId: params.accountId,
		request: params.request
	});
}
function isIMessageExplicitTargetEligible(params) {
	if (!isIMessageApprovalTransportEnabled(params)) return false;
	const config = resolveApprovalForwardingConfig(params);
	if (!config?.enabled) return false;
	if (!approvalModeIncludesTargets(normalizeApprovalForwardingMode(config.mode))) return false;
	if (!matchesForwardingFilters({
		config,
		request: params.request
	})) return false;
	return hasMatchingIMessageTarget({
		cfg: params.cfg,
		config,
		accountId: params.accountId,
		target: params.target
	});
}
function resolveTurnSourceIMessageOriginTarget(request) {
	if (normalizeLowercaseStringOrEmpty(request.request.turnSourceChannel) !== "imessage") return null;
	const to = normalizeIMessageMessagingTarget(request.request.turnSourceTo ?? "");
	if (!to) return null;
	return {
		to,
		accountId: normalizeOptionalString(request.request.turnSourceAccountId)
	};
}
function resolveSessionIMessageOriginTarget(sessionTarget) {
	const to = normalizeIMessageMessagingTarget(sessionTarget.to);
	return to ? {
		to,
		accountId: normalizeOptionalString(sessionTarget.accountId)
	} : null;
}
function resolveIMessageSessionTargetFromSessionKey(sessionKey) {
	const rest = parseAgentSessionKey(sessionKey)?.rest ?? normalizeOptionalString(sessionKey);
	if (!rest || !normalizeLowercaseStringOrEmpty(rest).startsWith("imessage:")) return null;
	const route = rest.slice(9).trim();
	const routeLower = normalizeLowercaseStringOrEmpty(route);
	if (!route || routeLower.startsWith("group:") || routeLower.startsWith("channel:") || routeLower.startsWith("chat:")) return null;
	if (routeLower.startsWith("direct:")) {
		const to = normalizeIMessageMessagingTarget(route.slice(7));
		return to ? { to } : null;
	}
	const accountScopedDirect = /^([^:]+):direct:(.+)$/i.exec(route);
	if (accountScopedDirect) {
		const to = normalizeIMessageMessagingTarget(accountScopedDirect[2] ?? "");
		return to ? {
			to,
			accountId: normalizeAccountId(accountScopedDirect[1] ?? "")
		} : null;
	}
	const to = normalizeIMessageMessagingTarget(route);
	if (!to || inferIMessageTargetChatType(to) !== "direct") return null;
	return { to };
}
function shouldSuppressLocalIMessageExecApprovalPrompt(params) {
	if (shouldSuppressLocalNativeExecApprovalPrompt({
		...params,
		isTransportEnabled: isIMessageApprovalTransportEnabled,
		isSessionRouteEligible: ({ cfg, accountId, metadata }) => {
			if (getIMessageApprovalApprovers({
				cfg,
				accountId
			}).length > 0) return true;
			const sessionTarget = resolveIMessageSessionTargetFromSessionKey(metadata.sessionKey);
			if (!sessionTarget || inferIMessageTargetChatType(sessionTarget.to) !== "direct") return false;
			const targetAccountId = normalizeOptionalString(sessionTarget.accountId);
			return !targetAccountId || !accountId || normalizeAccountId(targetAccountId) === normalizeAccountId(accountId);
		}
	})) return true;
	const metadata = getExecApprovalReplyMetadata(params.payload);
	if (params.hint?.kind !== "approval-pending" || params.hint.approvalKind !== "exec" || params.hint.nativeRouteActive !== true || metadata?.approvalKind !== "exec") return false;
	if (metadata.agentId || metadata.sessionKey) return false;
	if (getIMessageApprovalApprovers({
		cfg: params.cfg,
		accountId: params.accountId
	}).length === 0) return false;
	return canApprovalPotentiallyRouteToIMessage({
		...params,
		approvalKind: "exec",
		nativeSessionOnly: true
	});
}
function shouldHandleIMessageApprovalRequest(params) {
	return isIMessageSessionApprovalEligible({
		...params,
		approvalKind: resolveApprovalKind(params.request, params.approvalKind)
	});
}
const resolveIMessageOriginTargetBase = createChannelNativeOriginTargetResolver({
	channel: "imessage",
	shouldHandleRequest: shouldHandleIMessageApprovalRequest,
	resolveTurnSourceTarget: resolveTurnSourceIMessageOriginTarget,
	resolveSessionTarget: resolveSessionIMessageOriginTarget,
	normalizeTarget: (target) => {
		const to = normalizeIMessageMessagingTarget(target.to);
		return to ? {
			...target,
			to
		} : null;
	}
});
function resolveIMessageOriginTarget(params) {
	const target = resolveIMessageOriginTargetBase(params);
	if (!target) return null;
	if (inferIMessageTargetChatType(target.to) === "group" && getIMessageApprovalApprovers({
		cfg: params.cfg,
		accountId: params.accountId
	}).length === 0) return null;
	return target;
}
const resolveIMessageApproverDmTargets = createChannelApproverDmTargetResolver({
	shouldHandleRequest: shouldHandleIMessageApprovalRequest,
	resolveApprovers: getIMessageApprovalApprovers,
	mapApprover: (approver, params) => {
		const to = normalizeIMessageMessagingTarget(approver);
		if (!to) return null;
		return {
			to,
			accountId: normalizeOptionalString(params.accountId)
		};
	}
});
function appendIMessageReactionHint(params) {
	return addIMessageApprovalReactionHintToText({
		text: params.text ?? "",
		allowedDecisions: params.allowedDecisions
	});
}
function buildIMessageExecPendingPayload(params) {
	const allowedDecisions = resolveExecApprovalRequestAllowedDecisions(params.request.request);
	const command = resolveExecApprovalCommandDisplay(params.request.request).commandText;
	const payload = buildExecApprovalPendingReplyPayload({
		approvalId: params.request.id,
		approvalSlug: params.request.id.slice(0, 8),
		approvalCommandId: params.request.id,
		warningText: params.request.request.warningText ?? void 0,
		ask: params.request.request.ask ?? null,
		agentId: params.request.request.agentId ?? null,
		allowedDecisions,
		command,
		cwd: params.request.request.cwd ?? void 0,
		host: params.request.request.host === "node" ? "node" : "gateway",
		nodeId: params.request.request.nodeId ?? void 0,
		sessionKey: params.request.request.sessionKey ?? null,
		expiresAtMs: params.request.expiresAtMs,
		nowMs: params.nowMs
	});
	return {
		...payload,
		text: appendIMessageReactionHint({
			text: replaceApprovalIdPlaceholder(payload.text, params.request.id),
			allowedDecisions
		})
	};
}
function buildIMessagePluginPendingPayload(params) {
	const configuredDecisions = params.request.request.allowedDecisions;
	const allowedDecisions = configuredDecisions && configuredDecisions.length > 0 ? configuredDecisions : DEFAULT_PLUGIN_APPROVAL_DECISIONS;
	const payload = buildPluginApprovalPendingReplyPayload({
		request: params.request,
		nowMs: params.nowMs,
		allowedDecisions
	});
	return {
		...payload,
		text: appendIMessageReactionHint({
			text: replaceApprovalIdPlaceholder(payload.text, params.request.id),
			allowedDecisions
		})
	};
}
const imessageApprovalCapability = createChannelApprovalCapability({
	...imessageApprovalAuth,
	getActionAvailabilityState: ({ cfg, accountId, approvalKind }) => (approvalKind ? canApprovalPotentiallyRouteToIMessage({
		cfg,
		accountId,
		approvalKind
	}) : canAnyApprovalPotentiallyRouteToIMessage({
		cfg,
		accountId
	})) ? { kind: "enabled" } : { kind: "disabled" },
	getExecInitiatingSurfaceState: ({ cfg, accountId }) => canApprovalPotentiallyRouteToIMessage({
		cfg,
		accountId,
		approvalKind: "exec"
	}) ? { kind: "enabled" } : { kind: "disabled" },
	describeExecApprovalSetup: ({ accountId }) => {
		return `iMessage supports native exec approvals for this account when \`approvals.exec.enabled\` is true and the route allows iMessage. Keep the macOS imsg bridge running and configure \`${accountId && accountId !== "default" ? `channels.imessage.accounts.${accountId}` : "channels.imessage"}.allowFrom\` to restrict approvers.`;
	},
	delivery: {
		hasConfiguredDmRoute: ({ cfg }) => listIMessageAccountIds(cfg).some((accountId) => {
			if (!canAnyApprovalPotentiallyRouteToIMessage({
				cfg,
				accountId,
				nativeSessionOnly: true
			})) return false;
			return getIMessageApprovalApprovers({
				cfg,
				accountId
			}).length > 0;
		}),
		shouldSuppressForwardingFallback: ({ cfg, approvalKind, target, request }) => {
			const forwardingTarget = normalizeIMessageForwardTarget(target);
			if (!forwardingTarget) return false;
			const accountId = forwardingTarget.accountId ?? normalizeOptionalString(request.request.turnSourceAccountId);
			const forwardingTargetForMatch = {
				...forwardingTarget,
				accountId
			};
			const kind = resolveApprovalKind(request, approvalKind);
			if (!(target.source === "target" ? isIMessageExplicitTargetEligible({
				cfg,
				accountId,
				approvalKind: kind,
				request,
				target
			}) : isIMessageSessionApprovalEligible({
				cfg,
				accountId,
				approvalKind: kind,
				request
			}))) return false;
			const originTarget = resolveIMessageOriginTarget({
				cfg,
				accountId,
				approvalKind: kind,
				request
			});
			if (originTarget && nativeApprovalTargetsMatch({
				left: forwardingTargetForMatch,
				right: originTarget
			})) return true;
			return resolveIMessageApproverDmTargets({
				cfg,
				accountId,
				approvalKind: kind,
				request
			}).some((approverTarget) => nativeApprovalTargetsMatch({
				left: forwardingTargetForMatch,
				right: approverTarget
			}));
		}
	},
	render: {
		exec: { buildPendingPayload: ({ request, nowMs }) => buildIMessageExecPendingPayload({
			request,
			nowMs
		}) },
		plugin: { buildPendingPayload: ({ request, nowMs }) => buildIMessagePluginPendingPayload({
			request,
			nowMs
		}) }
	},
	native: {
		describeDeliveryCapabilities: ({ cfg, accountId, approvalKind, request }) => {
			const originTarget = resolveIMessageOriginTarget({
				cfg,
				accountId,
				approvalKind,
				request
			});
			const approverTargets = resolveIMessageApproverDmTargets({
				cfg,
				accountId,
				approvalKind,
				request
			});
			return {
				enabled: Boolean(originTarget) || approverTargets.length > 0,
				preferredSurface: originTarget ? "origin" : "approver-dm",
				supportsOriginSurface: Boolean(originTarget),
				supportsApproverDmSurface: approverTargets.length > 0,
				notifyOriginWhenDmOnly: true
			};
		},
		resolveOriginTarget: resolveIMessageOriginTarget,
		resolveApproverDmTargets: resolveIMessageApproverDmTargets
	},
	nativeRuntime: createLazyChannelApprovalNativeRuntimeAdapter({
		eventKinds: ["exec", "plugin"],
		isConfigured: ({ cfg, accountId, context }) => Boolean(context) && canAnyApprovalPotentiallyRouteToIMessage({
			cfg,
			accountId,
			nativeSessionOnly: true
		}),
		shouldHandle: ({ cfg, accountId, context, request }) => Boolean(context) && shouldHandleIMessageApprovalRequest({
			cfg,
			accountId,
			request
		}),
		load: async () => (await import("./approval-handler.runtime-CedRHlnj.js")).imessageApprovalNativeRuntime
	})
});
splitChannelApprovalCapability(imessageApprovalCapability);
//#endregion
//#region extensions/imessage/src/doctor.ts
const imessageDoctor = {
	groupAllowFromFallbackToAllowFrom: false,
	collectPreviewWarnings: ({ cfg }) => collectIMessageDuplicateAccountSourceWarnings({ cfg })
};
//#endregion
//#region extensions/imessage/src/shared.ts
const IMESSAGE_CHANNEL = "imessage";
async function loadIMessageChannelRuntime$1() {
	return await import("./channel.runtime-DcIXQJVi.js");
}
const imessageSetupWizard = createIMessageSetupWizardProxy(async () => (await loadIMessageChannelRuntime$1()).imessageSetupWizard);
const imessageConfigAdapter = createScopedChannelConfigAdapter({
	sectionKey: IMESSAGE_CHANNEL,
	listAccountIds: listIMessageAccountIds,
	resolveAccount: adaptScopedAccountAccessor(resolveIMessageAccount),
	defaultAccountId: resolveDefaultIMessageAccountId,
	clearBaseFields: [
		"cliPath",
		"dbPath",
		"service",
		"region",
		"name"
	],
	resolveAllowFrom: (account) => account.config.allowFrom,
	formatAllowFrom: (allowFrom) => formatTrimmedAllowFromEntries(allowFrom),
	resolveDefaultTo: (account) => account.config.defaultTo
});
const imessageSecurityAdapter = createRestrictSendersChannelSecurity({
	channelKey: IMESSAGE_CHANNEL,
	resolveDmPolicy: (account) => account.config.dmPolicy,
	resolveDmAllowFrom: (account) => account.config.allowFrom,
	resolveGroupPolicy: (account) => account.config.groupPolicy,
	surface: "iMessage groups",
	openScope: "any member",
	groupPolicyPath: "channels.imessage.groupPolicy",
	groupAllowFromPath: "channels.imessage.groupAllowFrom",
	mentionGated: false,
	policyPathSuffix: "dmPolicy"
});
function createIMessagePluginBase(params) {
	return {
		...createChannelPluginBase({
			id: IMESSAGE_CHANNEL,
			meta: {
				...getChatChannelMeta(IMESSAGE_CHANNEL),
				aliases: ["imsg"],
				showConfigured: false
			},
			setupWizard: params.setupWizard,
			capabilities: {
				chatTypes: ["direct", "group"],
				media: true,
				reactions: true,
				edit: true,
				unsend: true,
				reply: true,
				effects: true,
				groupManagement: true
			},
			reload: { configPrefixes: ["channels.imessage"] },
			configSchema: IMessageChannelConfigSchema,
			config: {
				...imessageConfigAdapter,
				isConfigured: (account) => account.configured,
				describeAccount: (account) => describeAccountSnapshot({
					account,
					configured: account.configured
				})
			},
			security: imessageSecurityAdapter,
			setup: params.setup
		}),
		messaging: {
			resolveInboundAttachmentRoots: (params) => resolveIMessageAttachmentRoots({
				accountId: params.accountId,
				cfg: params.cfg
			}),
			resolveRemoteInboundAttachmentRoots: (params) => resolveIMessageRemoteAttachmentRoots({
				accountId: params.accountId,
				cfg: params.cfg
			})
		}
	};
}
//#endregion
//#region extensions/imessage/src/status-core.ts
async function probeIMessageStatusAccount(params) {
	return await params.probeIMessageAccount({
		timeoutMs: params.timeoutMs,
		cliPath: params.account.config.cliPath,
		dbPath: params.account.config.dbPath
	});
}
//#endregion
//#region extensions/imessage/src/channel.ts
const loadIMessageChannelRuntime = createLazyRuntimeModule(() => import("./channel.runtime-DcIXQJVi.js"));
function toIMessageMessageSendResult(result, kind, replyToId) {
	const receipt = result.receipt ?? createMessageReceiptFromOutboundResults({
		results: result.messageId ? [{
			channel: "imessage",
			messageId: result.messageId
		}] : [],
		kind,
		...replyToId ? { replyToId } : {}
	});
	return {
		messageId: result.messageId || receipt.primaryPlatformMessageId,
		receipt
	};
}
const imessageMessageAdapter = defineChannelMessageAdapter({
	id: "imessage",
	durableFinal: { capabilities: {
		text: true,
		media: true,
		replyTo: true,
		messageSendingHooks: true
	} },
	send: {
		text: async (ctx) => {
			return toIMessageMessageSendResult(await (await loadIMessageChannelRuntime()).sendIMessageOutbound({
				cfg: ctx.cfg,
				to: ctx.to,
				text: ctx.text,
				accountId: ctx.accountId ?? void 0,
				deps: ctx.deps,
				replyToId: ctx.replyToId ?? void 0
			}), "text", ctx.replyToId);
		},
		media: async (ctx) => {
			return toIMessageMessageSendResult(await (await loadIMessageChannelRuntime()).sendIMessageOutbound({
				cfg: ctx.cfg,
				to: ctx.to,
				text: ctx.text,
				mediaUrl: ctx.mediaUrl,
				mediaLocalRoots: ctx.mediaLocalRoots,
				accountId: ctx.accountId ?? void 0,
				deps: ctx.deps,
				replyToId: ctx.replyToId ?? void 0
			}), "media", ctx.replyToId);
		}
	}
});
function buildIMessageBaseSessionKey(params) {
	return buildOutboundBaseSessionKey({
		...params,
		channel: "imessage"
	});
}
function resolveIMessageOutboundSessionRoute(params) {
	const parsed = parseIMessageTarget(params.target);
	if (parsed.kind === "handle") {
		const handle = normalizeIMessageHandle(parsed.to);
		if (!handle) return null;
		const peer = {
			kind: "direct",
			id: handle
		};
		const baseSessionKey = buildIMessageBaseSessionKey({
			cfg: params.cfg,
			agentId: params.agentId,
			accountId: params.accountId,
			peer
		});
		return {
			sessionKey: baseSessionKey,
			baseSessionKey,
			peer,
			chatType: "direct",
			from: `imessage:${handle}`,
			to: `imessage:${handle}`
		};
	}
	const peerId = parsed.kind === "chat_id" ? String(parsed.chatId) : parsed.kind === "chat_guid" ? parsed.chatGuid : parsed.chatIdentifier;
	if (!peerId) return null;
	const peer = {
		kind: "group",
		id: peerId
	};
	const baseSessionKey = buildIMessageBaseSessionKey({
		cfg: params.cfg,
		agentId: params.agentId,
		accountId: params.accountId,
		peer
	});
	const toPrefix = parsed.kind === "chat_id" ? "chat_id" : parsed.kind === "chat_guid" ? "chat_guid" : "chat_identifier";
	return {
		sessionKey: baseSessionKey,
		baseSessionKey,
		peer,
		chatType: "group",
		from: `imessage:group:${peerId}`,
		to: `${toPrefix}:${peerId}`
	};
}
const imessagePlugin = createChatChannelPlugin({
	base: {
		...createIMessagePluginBase({
			setupWizard: imessageSetupWizard,
			setup: imessageSetupAdapter
		}),
		allowlist: buildDmGroupAccountAllowlistAdapter({
			channelId: "imessage",
			resolveAccount: resolveIMessageAccount,
			normalize: ({ values }) => formatTrimmedAllowFromEntries(values),
			resolveDmAllowFrom: (account) => account.config.allowFrom,
			resolveGroupAllowFrom: (account) => account.config.groupAllowFrom,
			resolveDmPolicy: (account) => account.config.dmPolicy,
			resolveGroupPolicy: (account) => account.config.groupPolicy
		}),
		groups: {
			resolveRequireMention: resolveIMessageGroupRequireMention,
			resolveToolPolicy: resolveIMessageGroupToolPolicy
		},
		doctor: imessageDoctor,
		conversationBindings: {
			supportsCurrentConversationBinding: true,
			createManager: ({ cfg, accountId }) => createIMessageConversationBindingManager({
				cfg,
				accountId: accountId ?? void 0
			})
		},
		bindings: {
			compileConfiguredBinding: ({ conversationId }) => normalizeIMessageAcpConversationId(conversationId),
			matchInboundConversation: ({ compiledBinding, conversationId }) => matchIMessageAcpConversation({
				bindingConversationId: compiledBinding.conversationId,
				conversationId
			}),
			resolveCommandConversation: ({ originatingTo, commandTo, fallbackTo }) => {
				const conversationId = resolveIMessageConversationIdFromTarget(originatingTo ?? "") ?? resolveIMessageConversationIdFromTarget(commandTo ?? "") ?? resolveIMessageConversationIdFromTarget(fallbackTo ?? "");
				return conversationId ? { conversationId } : null;
			}
		},
		messaging: {
			normalizeTarget: normalizeIMessageMessagingTarget,
			inferTargetChatType: ({ to }) => inferIMessageTargetChatType(to),
			resolveOutboundSessionRoute: (params) => resolveIMessageOutboundSessionRoute(params),
			targetResolver: {
				looksLikeId: looksLikeIMessageExplicitTargetId,
				hint: "<handle|chat_id:ID>",
				resolveTarget: async ({ normalized }) => {
					const to = normalized?.trim();
					if (!to) return null;
					const chatType = inferIMessageTargetChatType(to);
					if (!chatType) return null;
					return {
						to,
						kind: chatType === "direct" ? "user" : "group",
						source: "normalized"
					};
				}
			}
		},
		status: createComputedAccountStatusAdapter({
			defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID, {
				cliPath: null,
				dbPath: null
			}),
			collectStatusIssues: (accounts) => collectStatusIssuesFromLastError("imessage", accounts),
			buildChannelSummary: ({ snapshot }) => buildPassiveProbedChannelStatusSummary(snapshot, {
				cliPath: snapshot.cliPath ?? null,
				dbPath: snapshot.dbPath ?? null
			}),
			probeAccount: async ({ account, timeoutMs }) => await probeIMessageStatusAccount({
				account,
				timeoutMs,
				probeIMessageAccount: async (params) => await (await loadIMessageChannelRuntime()).probeIMessageAccount(params)
			}),
			resolveAccountSnapshot: ({ account, runtime }) => ({
				accountId: account.accountId,
				name: account.name,
				enabled: account.enabled,
				configured: account.configured,
				extra: {
					cliPath: runtime?.cliPath ?? account.config.cliPath ?? null,
					dbPath: runtime?.dbPath ?? account.config.dbPath ?? null
				}
			}),
			resolveAccountState: ({ enabled }) => enabled ? "enabled" : "disabled"
		}),
		gateway: { startAccount: async (ctx) => {
			const conversationBindings = createIMessageConversationBindingManager({
				cfg: ctx.cfg,
				accountId: ctx.accountId
			});
			try {
				return await (await loadIMessageChannelRuntime()).startIMessageGatewayAccount(ctx);
			} finally {
				conversationBindings.stop();
			}
		} },
		message: imessageMessageAdapter,
		actions: imessageMessageActions,
		approvalCapability: imessageApprovalCapability
	},
	pairing: { text: {
		idLabel: "imessageSenderId",
		message: "OpenClaw: your access has been approved.",
		notify: async ({ id, cfg }) => await (await loadIMessageChannelRuntime()).notifyIMessageApproval({
			id,
			cfg
		})
	} },
	security: imessageSecurityAdapter,
	outbound: {
		base: {
			deliveryMode: "direct",
			chunker: chunkTextForOutbound,
			chunkerMode: "text",
			textChunkLimit: 4e3,
			sanitizeText: ({ text }) => sanitizeForPlainText(sanitizeOutboundText(text)),
			shouldSuppressLocalPayloadPrompt: ({ cfg, accountId, payload, hint }) => shouldSuppressLocalIMessageExecApprovalPrompt({
				cfg,
				accountId,
				payload,
				hint
			}),
			deliveryCapabilities: { durableFinal: {
				text: true,
				media: true,
				replyTo: true,
				messageSendingHooks: true
			} }
		},
		attachedResults: {
			channel: "imessage",
			sendText: async ({ cfg, to, text, accountId, deps, replyToId }) => await (await loadIMessageChannelRuntime()).sendIMessageOutbound({
				cfg,
				to,
				text,
				accountId: accountId ?? void 0,
				deps,
				replyToId: replyToId ?? void 0
			}),
			sendMedia: async ({ cfg, to, text, mediaUrl, mediaLocalRoots, accountId, deps, replyToId }) => await (await loadIMessageChannelRuntime()).sendIMessageOutbound({
				cfg,
				to,
				text,
				mediaUrl,
				mediaLocalRoots,
				accountId: accountId ?? void 0,
				deps,
				replyToId: replyToId ?? void 0
			})
		}
	}
});
//#endregion
export { createIMessagePluginBase as n, imessageSetupWizard as r, imessagePlugin as t };
