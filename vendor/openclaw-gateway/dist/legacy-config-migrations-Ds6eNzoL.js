import { s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { n as DEFAULT_GATEWAY_PORT } from "./paths-CQv1_CDw.js";
import { _ as uniqueStrings } from "./string-normalization-B8G0vlWE.js";
import { c as isRecord } from "./utils-B5r0V84N.js";
import { r as normalizeProviderId } from "./provider-id-nh-uBdZ_.js";
import { t as isBlockedObjectKey } from "./prototype-keys-gIgii6VQ.js";
import { r as isModelThinkingFormat } from "./types.models-BaTLvlWH.js";
import { t as loadBundledPluginPublicArtifactModuleSync } from "./public-surface-loader-BtpHXlhR.js";
import { t as isSafeExecutableValue } from "./exec-safety-1iu4aOkR.js";
import { t as splitTrailingAuthProfile } from "./model-ref-profile-L6rqw6O0.js";
import { r as isKnownCoreToolId } from "./tool-catalog-Bxn5jw8h.js";
import { f as expandToolGroups, h as resolveToolProfilePolicy, l as mergeAlsoAllowPolicy } from "./tool-policy-CY4w5sXw.js";
import { n as isToolAllowedByPolicyName } from "./tool-policy-match-F9QA397_.js";
import { s as listLegacyRuntimeModelProviderAliases } from "./model-runtime-aliases-DXHvPXsy.js";
import { i as resolveOpenClawMcpTransportAlias, n as isKnownCliMcpTypeAlias } from "./mcp-config-normalize-DMfG9sUu.js";
import { a as resolveGatewayPortWithDefault, i as isGatewayNonLoopbackBindMode, r as hasConfiguredControlUiAllowedOrigins, t as buildDefaultControlUiAllowedOrigins } from "./gateway-control-ui-origins-DqI76DDQ.js";
import { n as ensureRecord$2, r as hasOwnKey$1, t as cloneRecord$1 } from "./legacy-config-record-shared-DORFNfXX.js";
//#region src/channels/plugins/doctor-contract-api.ts
function loadBundledChannelPublicArtifact(channelId, artifactBasenames) {
	for (const artifactBasename of artifactBasenames) try {
		return loadBundledPluginPublicArtifactModuleSync({
			dirName: channelId,
			artifactBasename
		});
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("Unable to resolve bundled plugin public surface ")) continue;
	}
}
function loadBundledChannelDoctorContractApi(channelId) {
	return loadBundledChannelPublicArtifact(channelId, ["doctor-contract-api.js", "contract-api.js"]);
}
//#endregion
//#region src/config/legacy.shared.ts
const getRecord = (value) => isRecord(value) ? value : null;
const ensureRecord$1 = (root, key) => {
	const existing = root[key];
	if (isRecord(existing)) return existing;
	const next = {};
	root[key] = next;
	return next;
};
const mergeMissing = (target, source) => {
	for (const [key, value] of Object.entries(source)) {
		if (value === void 0 || isBlockedObjectKey(key)) continue;
		const existing = target[key];
		if (existing === void 0) {
			target[key] = value;
			continue;
		}
		if (isRecord(existing) && isRecord(value)) mergeMissing(existing, value);
	}
};
const mapLegacyAudioTranscription = (value) => {
	const transcriber = getRecord(value);
	const command = Array.isArray(transcriber?.command) ? transcriber?.command : null;
	if (!command || command.length === 0) return null;
	if (typeof command[0] !== "string") return null;
	if (!command.every((part) => typeof part === "string")) return null;
	const rawExecutable = command[0].trim();
	if (!rawExecutable) return null;
	if (!isSafeExecutableValue(rawExecutable)) return null;
	const args = command.slice(1).map((part) => part.replace(/\{input\}/g, "{{MediaPath}}"));
	const timeoutSeconds = typeof transcriber?.timeoutSeconds === "number" ? transcriber?.timeoutSeconds : void 0;
	const result = {
		command: rawExecutable,
		type: "cli"
	};
	if (args.length > 0) result.args = args;
	if (timeoutSeconds !== void 0) result.timeoutSeconds = timeoutSeconds;
	return result;
};
const defineLegacyConfigMigration = (migration) => migration;
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.audio.ts
function applyLegacyAudioTranscriptionModel(params) {
	const mapped = mapLegacyAudioTranscription(params.source);
	if (!mapped) {
		params.changes.push(params.invalidMessage);
		return;
	}
	const mediaAudio = ensureRecord$1(ensureRecord$1(ensureRecord$1(params.raw, "tools"), "media"), "audio");
	if ((Array.isArray(mediaAudio.models) ? mediaAudio.models : []).length === 0) {
		mediaAudio.enabled = true;
		mediaAudio.models = [mapped];
		params.changes.push(params.movedMessage);
		return;
	}
	params.changes.push(params.alreadySetMessage);
}
const LEGACY_CONFIG_MIGRATIONS_AUDIO = [defineLegacyConfigMigration({
	id: "audio.transcription-v2",
	describe: "Move audio.transcription to tools.media.audio.models",
	apply: (raw, changes) => {
		const audio = getRecord(raw.audio);
		if (audio?.transcription === void 0) return;
		applyLegacyAudioTranscriptionModel({
			raw,
			source: audio.transcription,
			changes,
			movedMessage: "Moved audio.transcription → tools.media.audio.models.",
			alreadySetMessage: "Removed audio.transcription (tools.media.audio.models already set).",
			invalidMessage: "Removed audio.transcription (invalid or empty command)."
		});
		delete audio.transcription;
		if (Object.keys(audio).length === 0) delete raw.audio;
		else raw.audio = audio;
	}
})];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.channels.ts
function hasOwnKey(target, key) {
	return Object.prototype.hasOwnProperty.call(target, key);
}
function cleanupEmptyRecord(parent, key) {
	const value = getRecord(parent[key]);
	if (value && Object.keys(value).length === 0) delete parent[key];
}
function resolveCompatibleDefaultGroupEntry(section) {
	const existingGroups = section.groups;
	if (existingGroups !== void 0 && !getRecord(existingGroups)) return null;
	const groups = getRecord(existingGroups) ?? {};
	const existingEntry = groups["*"];
	if (existingEntry !== void 0 && !getRecord(existingEntry)) return null;
	return {
		groups,
		entry: getRecord(existingEntry) ?? {}
	};
}
function migrateChannelDefaultRequireMention(params) {
	const defaultGroupEntry = resolveCompatibleDefaultGroupEntry(params.section);
	if (!defaultGroupEntry) {
		params.changes.push(`Removed ${params.legacyPath} (channels.${params.channelId}.groups has an incompatible shape; fix remaining issues manually).`);
		return false;
	}
	const { groups, entry } = defaultGroupEntry;
	if (entry.requireMention === void 0) {
		entry.requireMention = params.requireMention;
		groups["*"] = entry;
		params.section.groups = groups;
		params.changes.push(`Moved ${params.legacyPath} → channels.${params.channelId}.groups."*".requireMention.`);
		return true;
	}
	params.changes.push(`Removed ${params.legacyPath} (channels.${params.channelId}.groups."*" already set).`);
	return false;
}
function migrateRoutingAllowFrom(raw, changes) {
	const routing = getRecord(raw.routing);
	if (!routing || routing.allowFrom === void 0) return;
	const channels = getRecord(raw.channels);
	const whatsapp = getRecord(channels?.whatsapp);
	if (!channels || !whatsapp) {
		delete routing.allowFrom;
		cleanupEmptyRecord(raw, "routing");
		changes.push("Removed routing.allowFrom (channels.whatsapp not configured).");
		return;
	}
	if (whatsapp.allowFrom === void 0) {
		whatsapp.allowFrom = routing.allowFrom;
		changes.push("Moved routing.allowFrom → channels.whatsapp.allowFrom.");
	} else changes.push("Removed routing.allowFrom (channels.whatsapp.allowFrom already set).");
	delete routing.allowFrom;
	channels.whatsapp = whatsapp;
	raw.channels = channels;
	cleanupEmptyRecord(raw, "routing");
}
function migrateRoutingGroupChatMessages(params) {
	const migrateMessageGroupField = (field) => {
		const value = params.groupChat[field];
		if (value === void 0) return;
		const messagesGroup = ensureRecord$1(ensureRecord$1(params.raw, "messages"), "groupChat");
		if (messagesGroup[field] === void 0) {
			messagesGroup[field] = value;
			params.changes.push(`Moved routing.groupChat.${field} → messages.groupChat.${field}.`);
		} else params.changes.push(`Removed routing.groupChat.${field} (messages.groupChat.${field} already set).`);
		delete params.groupChat[field];
	};
	migrateMessageGroupField("historyLimit");
	migrateMessageGroupField("mentionPatterns");
	if (Object.keys(params.groupChat).length === 0) delete params.routing.groupChat;
	else params.routing.groupChat = params.groupChat;
}
function migrateRoutingGroupChatRequireMention(params) {
	const requireMention = params.groupChat.requireMention;
	if (requireMention === void 0) return;
	const channels = getRecord(params.raw.channels);
	let matchedChannel = false;
	if (channels) {
		for (const channelId of [
			"whatsapp",
			"telegram",
			"imessage"
		]) {
			const section = getRecord(channels[channelId]);
			if (!section) continue;
			matchedChannel = true;
			migrateChannelDefaultRequireMention({
				section,
				channelId,
				legacyPath: "routing.groupChat.requireMention",
				requireMention,
				changes: params.changes
			});
			channels[channelId] = section;
		}
		params.raw.channels = channels;
	}
	if (!matchedChannel) params.changes.push("Removed routing.groupChat.requireMention (no configured WhatsApp, Telegram, or iMessage channel found).");
	delete params.groupChat.requireMention;
}
function migrateRoutingGroupChat(raw, changes) {
	const routing = getRecord(raw.routing);
	const groupChat = getRecord(routing?.groupChat);
	if (!routing || !groupChat) return;
	migrateRoutingGroupChatRequireMention({
		raw,
		groupChat,
		changes
	});
	migrateRoutingGroupChatMessages({
		raw,
		routing,
		groupChat,
		changes
	});
	cleanupEmptyRecord(raw, "routing");
}
function migrateTelegramRequireMention(raw, changes) {
	const channels = getRecord(raw.channels);
	const telegram = getRecord(channels?.telegram);
	if (!channels || !telegram || telegram.requireMention === void 0) return;
	migrateChannelDefaultRequireMention({
		section: telegram,
		channelId: "telegram",
		legacyPath: "channels.telegram.requireMention",
		requireMention: telegram.requireMention,
		changes
	});
	delete telegram.requireMention;
	channels.telegram = telegram;
	raw.channels = channels;
}
function hasLegacyFeishuAccountBotName(value) {
	const accounts = getRecord(value);
	if (!accounts) return false;
	return Object.values(accounts).some((entry) => {
		const account = getRecord(entry);
		return Boolean(account && hasOwnKey(account, "botName"));
	});
}
function migrateFeishuAccountBotName(raw, changes) {
	const channels = getRecord(raw.channels);
	const feishu = getRecord(channels?.feishu);
	const accounts = getRecord(feishu?.accounts);
	if (!channels || !feishu || !accounts) return;
	for (const [accountId, accountRaw] of Object.entries(accounts)) {
		const account = getRecord(accountRaw);
		if (!account || !hasOwnKey(account, "botName")) continue;
		const legacyPath = `channels.feishu.accounts.${accountId}.botName`;
		const currentPath = `channels.feishu.accounts.${accountId}.name`;
		if (account.name === void 0) {
			account.name = account.botName;
			changes.push(`Moved ${legacyPath} → ${currentPath}.`);
		} else changes.push(`Removed ${legacyPath} (${currentPath} already set).`);
		delete account.botName;
		accounts[accountId] = account;
	}
	feishu.accounts = accounts;
	channels.feishu = feishu;
	raw.channels = channels;
}
function hasLegacyThreadBindingTtl(value) {
	const threadBindings = getRecord(value);
	return Boolean(threadBindings && hasOwnKey(threadBindings, "ttlHours"));
}
function hasLegacyThreadBindingSpawnSplit(value) {
	const threadBindings = getRecord(value);
	return Boolean(threadBindings && (hasOwnKey(threadBindings, "spawnSubagentSessions") || hasOwnKey(threadBindings, "spawnAcpSessions")));
}
function hasLegacyThreadBindingTtlInAccounts(value) {
	const accounts = getRecord(value);
	if (!accounts) return false;
	return Object.values(accounts).some((entry) => hasLegacyThreadBindingTtl(getRecord(entry)?.threadBindings));
}
function hasLegacyThreadBindingSpawnSplitInAccounts(value) {
	const accounts = getRecord(value);
	if (!accounts) return false;
	return Object.values(accounts).some((entry) => hasLegacyThreadBindingSpawnSplit(getRecord(entry)?.threadBindings));
}
function migrateThreadBindingsTtlHoursForPath(params) {
	const threadBindings = getRecord(params.owner.threadBindings);
	if (!threadBindings || !hasOwnKey(threadBindings, "ttlHours")) return false;
	const hadIdleHours = threadBindings.idleHours !== void 0;
	if (!hadIdleHours) threadBindings.idleHours = threadBindings.ttlHours;
	delete threadBindings.ttlHours;
	params.owner.threadBindings = threadBindings;
	if (hadIdleHours) params.changes.push(`Removed ${params.pathPrefix}.threadBindings.ttlHours (${params.pathPrefix}.threadBindings.idleHours already set).`);
	else params.changes.push(`Moved ${params.pathPrefix}.threadBindings.ttlHours → ${params.pathPrefix}.threadBindings.idleHours.`);
	return true;
}
function resolveMigratedSpawnSessions(threadBindings) {
	const subagent = threadBindings.spawnSubagentSessions;
	const acp = threadBindings.spawnAcpSessions;
	const subagentBool = typeof subagent === "boolean" ? subagent : void 0;
	const acpBool = typeof acp === "boolean" ? acp : void 0;
	if (subagentBool === void 0) return acpBool;
	if (acpBool === void 0) return subagentBool;
	return subagentBool && acpBool;
}
function migrateThreadBindingsSpawnSessionsForPath(params) {
	const threadBindings = getRecord(params.owner.threadBindings);
	if (!threadBindings || !hasLegacyThreadBindingSpawnSplit(threadBindings)) return false;
	const hadSpawnSessions = threadBindings.spawnSessions !== void 0;
	const resolved = resolveMigratedSpawnSessions(threadBindings);
	const oldSubagent = threadBindings.spawnSubagentSessions;
	const oldAcp = threadBindings.spawnAcpSessions;
	delete threadBindings.spawnSubagentSessions;
	delete threadBindings.spawnAcpSessions;
	if (!hadSpawnSessions && resolved !== void 0) threadBindings.spawnSessions = resolved;
	params.owner.threadBindings = threadBindings;
	if (hadSpawnSessions) params.changes.push(`Removed deprecated ${params.pathPrefix}.threadBindings.spawnSubagentSessions/spawnAcpSessions (${params.pathPrefix}.threadBindings.spawnSessions already set).`);
	else if (typeof oldSubagent === "boolean" && typeof oldAcp === "boolean" && oldSubagent !== oldAcp) params.changes.push(`Collapsed conflicting ${params.pathPrefix}.threadBindings.spawnSubagentSessions/spawnAcpSessions → ${params.pathPrefix}.threadBindings.spawnSessions (${String(resolved)}).`);
	else params.changes.push(`Moved ${params.pathPrefix}.threadBindings.spawnSubagentSessions/spawnAcpSessions → ${params.pathPrefix}.threadBindings.spawnSessions (${String(resolved)}).`);
	return true;
}
function hasLegacyThreadBindingTtlInAnyChannel(value) {
	const channels = getRecord(value);
	if (!channels) return false;
	return Object.values(channels).some((entry) => {
		const channel = getRecord(entry);
		if (!channel) return false;
		return hasLegacyThreadBindingTtl(channel.threadBindings) || hasLegacyThreadBindingTtlInAccounts(channel.accounts);
	});
}
function hasLegacyThreadBindingSpawnSplitInAnyChannel(value) {
	const channels = getRecord(value);
	if (!channels) return false;
	return Object.values(channels).some((entry) => {
		const channel = getRecord(entry);
		if (!channel) return false;
		return hasLegacyThreadBindingSpawnSplit(channel.threadBindings) || hasLegacyThreadBindingSpawnSplitInAccounts(channel.accounts);
	});
}
const LEGACY_CONFIG_MIGRATIONS_CHANNELS = [
	defineLegacyConfigMigration({
		id: "legacy-group-routing->channel-groups",
		describe: "Move legacy routing group chat settings to current channel group and messages config",
		legacyRules: [
			{
				path: ["routing", "allowFrom"],
				message: "routing.allowFrom was removed; use channels.whatsapp.allowFrom instead. Run \"openclaw doctor --fix\"."
			},
			{
				path: [
					"routing",
					"groupChat",
					"requireMention"
				],
				message: "routing.groupChat.requireMention was removed; use channels.<channel>.groups.\"*\".requireMention instead. Run \"openclaw doctor --fix\"."
			},
			{
				path: [
					"routing",
					"groupChat",
					"historyLimit"
				],
				message: "routing.groupChat.historyLimit was moved; use messages.groupChat.historyLimit instead. Run \"openclaw doctor --fix\"."
			},
			{
				path: [
					"routing",
					"groupChat",
					"mentionPatterns"
				],
				message: "routing.groupChat.mentionPatterns was moved; use messages.groupChat.mentionPatterns instead. Run \"openclaw doctor --fix\"."
			},
			{
				path: [
					"channels",
					"telegram",
					"requireMention"
				],
				message: "channels.telegram.requireMention was removed; use channels.telegram.groups.\"*\".requireMention instead. Run \"openclaw doctor --fix\"."
			}
		],
		apply: (raw, changes) => {
			migrateRoutingAllowFrom(raw, changes);
			migrateRoutingGroupChat(raw, changes);
			migrateTelegramRequireMention(raw, changes);
		}
	}),
	defineLegacyConfigMigration({
		id: "feishu.accounts.botName->name",
		describe: "Move legacy Feishu account botName config to account name",
		legacyRules: [{
			path: [
				"channels",
				"feishu",
				"accounts"
			],
			message: "channels.feishu.accounts.<id>.botName was renamed to channels.feishu.accounts.<id>.name. Run \"openclaw doctor --fix\".",
			match: (value) => hasLegacyFeishuAccountBotName(value)
		}],
		apply: (raw, changes) => {
			migrateFeishuAccountBotName(raw, changes);
		}
	}),
	defineLegacyConfigMigration({
		id: "thread-bindings.ttlHours->idleHours",
		describe: "Move legacy threadBindings.ttlHours keys to threadBindings.idleHours (session + channel configs)",
		legacyRules: [
			{
				path: ["session", "threadBindings"],
				message: "session.threadBindings.ttlHours was renamed to session.threadBindings.idleHours. Run \"openclaw doctor --fix\".",
				match: (value) => hasLegacyThreadBindingTtl(value)
			},
			{
				path: ["channels"],
				message: "channels.<id>.threadBindings.ttlHours was renamed to channels.<id>.threadBindings.idleHours. Run \"openclaw doctor --fix\".",
				match: (value) => hasLegacyThreadBindingTtlInAnyChannel(value)
			},
			{
				path: ["session", "threadBindings"],
				message: "session.threadBindings.spawnSubagentSessions/spawnAcpSessions were replaced by session.threadBindings.spawnSessions. Run \"openclaw doctor --fix\".",
				match: (value) => hasLegacyThreadBindingSpawnSplit(value)
			},
			{
				path: ["channels"],
				message: "channels.<id>.threadBindings.spawnSubagentSessions/spawnAcpSessions were replaced by channels.<id>.threadBindings.spawnSessions. Run \"openclaw doctor --fix\".",
				match: (value) => hasLegacyThreadBindingSpawnSplitInAnyChannel(value)
			}
		],
		apply: (raw, changes) => {
			const session = getRecord(raw.session);
			if (session) {
				migrateThreadBindingsTtlHoursForPath({
					owner: session,
					pathPrefix: "session",
					changes
				});
				migrateThreadBindingsSpawnSessionsForPath({
					owner: session,
					pathPrefix: "session",
					changes
				});
				raw.session = session;
			}
			const channels = getRecord(raw.channels);
			if (!channels) return;
			for (const [channelId, channelRaw] of Object.entries(channels)) {
				const channel = getRecord(channelRaw);
				if (!channel) continue;
				migrateThreadBindingsTtlHoursForPath({
					owner: channel,
					pathPrefix: `channels.${channelId}`,
					changes
				});
				migrateThreadBindingsSpawnSessionsForPath({
					owner: channel,
					pathPrefix: `channels.${channelId}`,
					changes
				});
				const accounts = getRecord(channel.accounts);
				if (accounts) {
					for (const [accountId, accountRaw] of Object.entries(accounts)) {
						const account = getRecord(accountRaw);
						if (!account) continue;
						migrateThreadBindingsTtlHoursForPath({
							owner: account,
							pathPrefix: `channels.${channelId}.accounts.${accountId}`,
							changes
						});
						migrateThreadBindingsSpawnSessionsForPath({
							owner: account,
							pathPrefix: `channels.${channelId}.accounts.${accountId}`,
							changes
						});
						accounts[accountId] = account;
					}
					channel.accounts = accounts;
				}
				channels[channelId] = channel;
			}
			raw.channels = channels;
		}
	})
];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.queue.ts
const RETIRED_QUEUE_MODES = new Set([
	"queue",
	"steer-backlog",
	"steer+backlog"
]);
function isRetiredQueueMode(value) {
	return typeof value === "string" && RETIRED_QUEUE_MODES.has(value);
}
function hasRetiredQueueModeByChannel(value) {
	const byChannel = getRecord(value);
	return Boolean(byChannel && Object.values(byChannel).some(isRetiredQueueMode));
}
function migrateQueueMode(params) {
	const value = params.owner[params.key];
	if (!isRetiredQueueMode(value)) return false;
	const replacement = value === "queue" ? "steer" : "followup";
	params.owner[params.key] = replacement;
	params.changes.push(`Moved deprecated ${params.path} "${value}" → "${replacement}"; use "steer" for default active-run steering.`);
	return true;
}
const LEGACY_CONFIG_MIGRATIONS_QUEUE = [defineLegacyConfigMigration({
	id: "messages.queue.retired-steering-modes",
	describe: "Move retired messages.queue modes to followup mode",
	legacyRules: [{
		path: [
			"messages",
			"queue",
			"mode"
		],
		message: "messages.queue.mode uses a retired queue mode; use steer, followup, collect, or interrupt. Run \"openclaw doctor --fix\".",
		match: isRetiredQueueMode
	}, {
		path: [
			"messages",
			"queue",
			"byChannel"
		],
		message: "messages.queue.byChannel contains a retired queue mode; use steer, followup, collect, or interrupt. Run \"openclaw doctor --fix\".",
		match: hasRetiredQueueModeByChannel
	}],
	apply: (raw, changes) => {
		const queue = getRecord(getRecord(raw.messages)?.queue);
		if (!queue) return;
		migrateQueueMode({
			owner: queue,
			key: "mode",
			path: "messages.queue.mode",
			changes
		});
		const byChannel = getRecord(queue.byChannel);
		if (byChannel) {
			for (const [channelId, _value] of Object.entries(byChannel)) migrateQueueMode({
				owner: byChannel,
				key: channelId,
				path: `messages.queue.byChannel.${channelId}`,
				changes
			});
			queue.byChannel = byChannel;
		}
	}
})];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.runtime.agents.ts
const AGENT_HEARTBEAT_KEYS = new Set([
	"every",
	"activeHours",
	"model",
	"session",
	"includeReasoning",
	"target",
	"directPolicy",
	"to",
	"accountId",
	"prompt",
	"ackMaxChars",
	"suppressToolErrorWarnings",
	"lightContext",
	"isolatedSession"
]);
const CHANNEL_HEARTBEAT_KEYS = new Set([
	"showOk",
	"showAlerts",
	"useIndicator"
]);
const MEMORY_SEARCH_RULE = {
	path: ["memorySearch"],
	message: "top-level memorySearch was moved; use agents.defaults.memorySearch instead. Run \"openclaw doctor --fix\"."
};
const LEGACY_MEMORY_SEARCH_AUTO_PROVIDER_RULES = [
	{
		path: ["memorySearch", "provider"],
		message: "memorySearch.provider = \"auto\" is legacy; use \"openai\" explicitly. Run \"openclaw doctor --fix\".",
		match: isLegacyMemorySearchAutoProvider
	},
	{
		path: [
			"agents",
			"defaults",
			"memorySearch",
			"provider"
		],
		message: "agents.defaults.memorySearch.provider = \"auto\" is legacy; use \"openai\" explicitly. Run \"openclaw doctor --fix\".",
		match: isLegacyMemorySearchAutoProvider
	},
	{
		path: ["agents", "list"],
		message: "agents.list[].memorySearch.provider = \"auto\" is legacy; use \"openai\" explicitly. Run \"openclaw doctor --fix\".",
		match: hasAgentListLegacyMemorySearchAutoProvider
	}
];
const HEARTBEAT_RULE = {
	path: ["heartbeat"],
	message: "top-level heartbeat is not a valid config path; use agents.defaults.heartbeat (cadence/target/model settings) or channels.defaults.heartbeat (showOk/showAlerts/useIndicator)."
};
const LEGACY_SANDBOX_SCOPE_RULES = [{
	path: [
		"agents",
		"defaults",
		"sandbox"
	],
	message: "agents.defaults.sandbox.perSession is legacy; use agents.defaults.sandbox.scope instead. Run \"openclaw doctor --fix\".",
	match: (value) => hasLegacySandboxPerSession(value)
}, {
	path: ["agents", "list"],
	message: "agents.list[].sandbox.perSession is legacy; use agents.list[].sandbox.scope instead. Run \"openclaw doctor --fix\".",
	match: (value) => hasLegacyAgentListSandboxPerSession(value)
}];
const LEGACY_AGENT_RUNTIME_POLICY_RULES = [
	{
		path: [
			"agents",
			"defaults",
			"agentRuntime",
			"fallback"
		],
		message: "agents.defaults.agentRuntime is ignored; set models.providers.<provider>.agentRuntime or a model-scoped agentRuntime instead. Run \"openclaw doctor --fix\"."
	},
	{
		path: [
			"agents",
			"defaults",
			"embeddedHarness"
		],
		message: "agents.defaults.embeddedHarness is legacy and ignored; set provider/model runtime policy instead. Run \"openclaw doctor --fix\".",
		match: (value) => getRecord(value) !== null
	},
	{
		path: [
			"agents",
			"defaults",
			"agentRuntime"
		],
		message: "agents.defaults.agentRuntime is ignored; set models.providers.<provider>.agentRuntime or a model-scoped agentRuntime instead. Run \"openclaw doctor --fix\".",
		match: (value) => getRecord(value) !== null
	},
	{
		path: ["agents", "list"],
		message: "agents.list[].agentRuntime is ignored; set provider/model runtime policy instead. Run \"openclaw doctor --fix\".",
		match: (value) => hasAgentListRuntimePolicy(value)
	},
	{
		path: ["agents", "list"],
		message: "agents.list[].embeddedHarness is legacy and ignored; set provider/model runtime policy instead. Run \"openclaw doctor --fix\".",
		match: (value) => hasLegacyAgentListEmbeddedHarness(value)
	}
];
const LEGACY_AGENT_LLM_TIMEOUT_RULES = [{
	path: [
		"agents",
		"defaults",
		"llm"
	],
	message: "agents.defaults.llm is legacy; use models.providers.<id>.timeoutSeconds for slow model/provider timeouts. Run \"openclaw doctor --fix\".",
	match: (value) => getRecord(value) !== null
}];
const IGNORED_AGENT_MODEL_TIMEOUT_RULES = [
	{
		path: [
			"agents",
			"defaults",
			"model"
		],
		message: "agents.defaults.model.timeoutMs is ignored; agent model config only selects primary/fallback models. Run \"openclaw doctor --fix\" to remove it.",
		match: (value) => hasOwnTimeoutMs(value)
	},
	{
		path: [
			"agents",
			"defaults",
			"subagents",
			"model"
		],
		message: "agents.defaults.subagents.model.timeoutMs is ignored; subagent model config only selects primary/fallback models. Run \"openclaw doctor --fix\" to remove it.",
		match: (value) => hasOwnTimeoutMs(value)
	},
	{
		path: ["agents", "list"],
		message: "agents.list[].model.timeoutMs and agents.list[].subagents.model.timeoutMs are ignored; agent model config only selects primary/fallback models. Run \"openclaw doctor --fix\" to remove them.",
		match: (value) => hasAgentListModelTimeout(value)
	}
];
const PROFILE_CONFIGURED_TOOL_SECTION_RULES = [{
	path: ["tools"],
	message: "tools.profile filters explicit configured-section tool grants; run \"openclaw doctor --fix\" to rewrite the explicit grants into a valid allowlist.",
	match: (value) => toolProfileConfiguredSectionsNeedExplicitRepair(value)
}, {
	path: ["agents", "list"],
	message: "agents.list[].tools.profile filters explicit configured-section tool grants; run \"openclaw doctor --fix\" to rewrite the explicit grants into a valid allowlist.",
	match: (value, root) => {
		const globalTools = getRecord(root.tools);
		const inheritedProfile = typeof globalTools?.profile === "string" ? globalTools.profile : void 0;
		const inheritedAlsoAllow = readToolPolicyGrantList(globalTools, "alsoAllow");
		return Array.isArray(value) && value.some((agent) => {
			const agentTools = getRecord(getRecord(agent)?.tools);
			return toolProfileConfiguredSectionsNeedExplicitRepair(agentTools, inheritedProfile, inheritedAlsoAllow, collectEffectiveConfiguredToolSectionGrants(globalTools, agentTools), getRecord(globalTools?.byProvider));
		});
	}
}];
const SILENT_REPLY_LEGACY_RULES = [
	{
		path: [
			"agents",
			"defaults",
			"silentReplyRewrite"
		],
		message: "agents.defaults.silentReplyRewrite was removed; exact NO_REPLY is no longer rewritten to visible fallback text. Run \"openclaw doctor --fix\" to remove it."
	},
	{
		path: [
			"agents",
			"defaults",
			"silentReply"
		],
		message: "agents.defaults.silentReply.direct was removed; direct chats never receive NO_REPLY prompt guidance. Run \"openclaw doctor --fix\" to remove it.",
		match: (value) => Object.prototype.hasOwnProperty.call(getRecord(value) ?? {}, "direct")
	},
	{
		path: ["surfaces"],
		message: "surfaces.*.silentReplyRewrite was removed; exact NO_REPLY is no longer rewritten to visible fallback text. Run \"openclaw doctor --fix\" to remove it.",
		match: (value) => hasSurfaceSilentReplyRewrite(value)
	},
	{
		path: ["surfaces"],
		message: "surfaces.*.silentReply.direct was removed; direct chats never receive NO_REPLY prompt guidance. Run \"openclaw doctor --fix\" to remove it.",
		match: (value) => hasSurfaceSilentReplyDirect(value)
	}
];
function sandboxScopeFromPerSession(perSession) {
	return perSession ? "session" : "shared";
}
function splitLegacyHeartbeat(legacyHeartbeat) {
	const agentHeartbeat = {};
	const channelHeartbeat = {};
	for (const [key, value] of Object.entries(legacyHeartbeat)) {
		if (isBlockedObjectKey(key)) continue;
		if (CHANNEL_HEARTBEAT_KEYS.has(key)) {
			channelHeartbeat[key] = value;
			continue;
		}
		if (AGENT_HEARTBEAT_KEYS.has(key)) {
			agentHeartbeat[key] = value;
			continue;
		}
		agentHeartbeat[key] = value;
	}
	return {
		agentHeartbeat: Object.keys(agentHeartbeat).length > 0 ? agentHeartbeat : null,
		channelHeartbeat: Object.keys(channelHeartbeat).length > 0 ? channelHeartbeat : null
	};
}
function mergeLegacyIntoDefaults(params) {
	const root = ensureRecord$1(params.raw, params.rootKey);
	const defaults = ensureRecord$1(root, "defaults");
	const existing = getRecord(defaults[params.fieldKey]);
	if (!existing) {
		defaults[params.fieldKey] = params.legacyValue;
		params.changes.push(params.movedMessage);
	} else {
		const merged = structuredClone(existing);
		mergeMissing(merged, params.legacyValue);
		defaults[params.fieldKey] = merged;
		params.changes.push(params.mergedMessage);
	}
	root.defaults = defaults;
	params.raw[params.rootKey] = root;
}
function hasLegacySandboxPerSession(value) {
	const sandbox = getRecord(value);
	return Boolean(sandbox && Object.prototype.hasOwnProperty.call(sandbox, "perSession"));
}
function hasLegacyAgentListSandboxPerSession(value) {
	if (!Array.isArray(value)) return false;
	return value.some((agent) => hasLegacySandboxPerSession(getRecord(agent)?.sandbox));
}
function hasLegacyAgentListEmbeddedHarness(value) {
	if (!Array.isArray(value)) return false;
	return value.some((agent) => getRecord(getRecord(agent)?.embeddedHarness) !== null);
}
function hasAgentListRuntimePolicy(value) {
	if (!Array.isArray(value)) return false;
	return value.some((agent) => getRecord(getRecord(agent)?.agentRuntime) !== null);
}
function hasOwnTimeoutMs(value) {
	const record = getRecord(value);
	return Boolean(record && Object.prototype.hasOwnProperty.call(record, "timeoutMs"));
}
function hasAgentListModelTimeout(value) {
	if (!Array.isArray(value)) return false;
	return value.some((agent) => {
		const agentRecord = getRecord(agent);
		return hasOwnTimeoutMs(agentRecord?.model) || hasOwnTimeoutMs(getRecord(agentRecord?.subagents)?.model);
	});
}
function isLegacyMemorySearchAutoProvider(value) {
	return typeof value === "string" && value.trim().toLowerCase() === "auto";
}
function hasAgentListLegacyMemorySearchAutoProvider(value) {
	if (!Array.isArray(value)) return false;
	return value.some((agent) => isLegacyMemorySearchAutoProvider(getRecord(getRecord(agent)?.memorySearch)?.provider));
}
function rewriteLegacyMemorySearchAutoProvider(memorySearch, pathLabel, changes) {
	if (!memorySearch || !isLegacyMemorySearchAutoProvider(memorySearch.provider)) return;
	memorySearch.provider = "openai";
	changes.push(`Moved ${pathLabel}.provider from legacy "auto" to "openai".`);
}
function migrateLegacySandboxPerSession(sandbox, pathLabel, changes) {
	if (!Object.prototype.hasOwnProperty.call(sandbox, "perSession")) return;
	const rawPerSession = sandbox.perSession;
	if (typeof rawPerSession !== "boolean") return;
	if (sandbox.scope === void 0) {
		sandbox.scope = sandboxScopeFromPerSession(rawPerSession);
		changes.push(`Moved ${pathLabel}.perSession → ${pathLabel}.scope (${String(sandbox.scope)}).`);
	} else changes.push(`Removed ${pathLabel}.perSession (${pathLabel}.scope already set).`);
	delete sandbox.perSession;
}
function removeLegacyAgentRuntimePolicy(container, pathLabel, changes) {
	if (getRecord(container.embeddedHarness) !== null) {
		delete container.embeddedHarness;
		changes.push(`Removed ${pathLabel}.embeddedHarness; runtime is now provider/model scoped.`);
	}
	if (getRecord(container.agentRuntime) !== null) {
		preserveLegacyWholeAgentRuntimePolicy(container, pathLabel, changes);
		delete container.agentRuntime;
		changes.push(`Removed ${pathLabel}.agentRuntime; runtime is now provider/model scoped.`);
	}
}
function resolveLegacyAgentRuntimeIntent(raw) {
	const record = getRecord(raw);
	if (!record) return;
	const runtime = typeof record.id === "string" ? record.id.trim().toLowerCase() : "";
	if (!runtime || runtime === "auto" || runtime === "pi") return;
	const alias = listLegacyRuntimeModelProviderAliases().find((entry) => entry.cli && normalizeProviderId(entry.runtime) === runtime);
	return alias ? {
		provider: alias.provider,
		runtime: alias.runtime
	} : void 0;
}
function selectedCanonicalModelRefsForRuntimePolicy(rawModel, provider) {
	const refs = [];
	const addRef = (rawRef) => {
		if (typeof rawRef !== "string") return;
		const trimmed = rawRef.trim();
		const slash = trimmed.indexOf("/");
		if (slash <= 0 || slash >= trimmed.length - 1) return;
		if (normalizeProviderId(trimmed.slice(0, slash)) !== normalizeProviderId(provider)) return;
		refs.push(trimmed);
	};
	if (typeof rawModel === "string") {
		addRef(rawModel);
		return refs;
	}
	const model = getRecord(rawModel);
	if (!model) return refs;
	addRef(model.primary);
	if (Array.isArray(model.fallbacks)) for (const fallback of model.fallbacks) addRef(fallback);
	return refs;
}
function modelEntryWithRuntimePolicy(entry, runtime) {
	const base = getRecord(entry) ? { ...entry } : {};
	const currentRuntime = getRecord(base.agentRuntime);
	const currentRuntimeId = typeof currentRuntime?.id === "string" ? currentRuntime.id.trim().toLowerCase() : "";
	if (currentRuntimeId && currentRuntimeId !== "auto") return {
		changed: false,
		entry: base
	};
	base.agentRuntime = {
		...currentRuntime,
		id: runtime
	};
	return {
		changed: true,
		entry: base
	};
}
function preserveLegacyWholeAgentRuntimePolicy(container, pathLabel, changes) {
	const intent = resolveLegacyAgentRuntimeIntent(container.agentRuntime);
	if (!intent) return;
	const selectedRefs = selectedCanonicalModelRefsForRuntimePolicy(container.model, intent.provider);
	if (selectedRefs.length === 0) return;
	const currentModels = getRecord(container.models);
	const nextModels = currentModels ? { ...currentModels } : {};
	let changed = false;
	for (const ref of selectedRefs) {
		const updated = modelEntryWithRuntimePolicy(nextModels[ref], intent.runtime);
		if (!updated.changed) continue;
		nextModels[ref] = updated.entry;
		changed = true;
	}
	if (!changed) return;
	container.models = nextModels;
	changes.push(`Moved ${pathLabel}.agentRuntime.id ${intent.runtime} to matching ${intent.provider} model runtime policy.`);
}
function removeIgnoredAgentModelTimeout(model, pathLabel, changes) {
	const modelRecord = getRecord(model);
	if (!modelRecord || !Object.prototype.hasOwnProperty.call(modelRecord, "timeoutMs")) return;
	delete modelRecord.timeoutMs;
	changes.push(`Removed ${pathLabel}.timeoutMs; agent model config only selects models.`);
}
function hasOwnRecordProperty(value, key) {
	const record = getRecord(value);
	return Boolean(record && Object.prototype.hasOwnProperty.call(record, key));
}
function hasSurfaceSilentReplyRewrite(value) {
	const surfaces = getRecord(value);
	if (!surfaces) return false;
	return Object.entries(surfaces).some(([surfaceId, surface]) => !isBlockedObjectKey(surfaceId) && hasOwnRecordProperty(surface, "silentReplyRewrite"));
}
function hasSurfaceSilentReplyDirect(value) {
	const surfaces = getRecord(value);
	if (!surfaces) return false;
	return Object.values(surfaces).some((surface) => Object.prototype.hasOwnProperty.call(getRecord(getRecord(surface)?.silentReply) ?? {}, "direct"));
}
function removeLegacySilentReplyConfig(raw, changes) {
	const defaults = getRecord(getRecord(raw.agents)?.defaults);
	const defaultSilentReply = getRecord(defaults?.silentReply);
	if (defaultSilentReply && Object.prototype.hasOwnProperty.call(defaultSilentReply, "direct")) {
		delete defaultSilentReply.direct;
		changes.push("Removed agents.defaults.silentReply.direct; direct chats never use NO_REPLY.");
	}
	if (defaults && hasOwnRecordProperty(defaults, "silentReplyRewrite")) {
		delete defaults.silentReplyRewrite;
		changes.push("Removed agents.defaults.silentReplyRewrite.");
	}
	const surfaces = getRecord(raw.surfaces);
	if (!surfaces) return;
	for (const [surfaceId, surfaceValue] of Object.entries(surfaces)) {
		if (isBlockedObjectKey(surfaceId)) continue;
		const surface = getRecord(surfaceValue);
		if (!surface) continue;
		const silentReply = getRecord(surface.silentReply);
		if (silentReply && Object.prototype.hasOwnProperty.call(silentReply, "direct")) {
			delete silentReply.direct;
			changes.push(`Removed surfaces.${surfaceId}.silentReply.direct; direct chats never use NO_REPLY.`);
		}
		if (hasOwnRecordProperty(surface, "silentReplyRewrite")) {
			delete surface.silentReplyRewrite;
			changes.push(`Removed surfaces.${surfaceId}.silentReplyRewrite.`);
		}
	}
}
const CONFIGURED_TOOL_SECTION_GRANTS = [{
	key: "exec",
	grants: ["exec", "process"]
}, {
	key: "fs",
	grants: [
		"read",
		"write",
		"edit"
	]
}];
function readToolPolicyGrantList(value, key) {
	return readOwnToolPolicyGrantList(value, key) ?? [];
}
function readOwnToolPolicyGrantList(value, key) {
	const tools = getRecord(value);
	return Array.isArray(tools?.[key]) ? tools[key].filter((entry) => typeof entry === "string") : void 0;
}
function resolveToolProfileForMigration(tools, inheritedProfile) {
	return typeof tools.profile === "string" ? tools.profile : inheritedProfile;
}
function collectProfileConfiguredSectionRepairGrants(params) {
	const tools = getRecord(params.value);
	if (!tools) return [];
	const profile = resolveToolProfileForMigration(tools, params.inheritedProfile);
	if (!profile || profile === "full") return [];
	const ownAllow = readToolPolicyGrantList(tools, "allow");
	if (ownAllow.length === 0) return [];
	const explicitAlsoAllow = readOwnToolPolicyGrantList(tools, "alsoAllow");
	const explicitPolicy = { allow: uniqueStrings([...ownAllow, ...explicitAlsoAllow ?? []]) };
	const profilePolicy = mergeAlsoAllowPolicy(resolveToolProfilePolicy(profile), explicitAlsoAllow ?? params.inheritedAlsoAllow ?? []);
	return uniqueStrings(params.configuredGrants.filter((toolName) => isToolAllowedByPolicyName(toolName, explicitPolicy) && (!isToolAllowedByPolicyName(toolName, profilePolicy) || (explicitAlsoAllow ? isToolAllowedByPolicyName(toolName, { allow: explicitAlsoAllow }) : false))));
}
function toolProfileConfiguredSectionsNeedExplicitRepair(value, inheritedProfile, inheritedAlsoAllow, configuredGrantsOverride, inheritedByProvider) {
	const tools = getRecord(value);
	if (!tools) return false;
	const configuredGrants = configuredGrantsOverride ?? collectConfiguredToolSectionGrants(tools);
	return scopeToolProfileConfiguredSectionsNeedMigration({
		value,
		inheritedProfile,
		inheritedAlsoAllow,
		configuredGrants
	}) || byProviderToolProfilesNeedConfiguredSectionMigration(tools, configuredGrants, readOwnToolPolicyGrantList(tools, "alsoAllow") ?? inheritedAlsoAllow, inheritedByProvider);
}
function collectConfiguredToolSectionGrants(tools) {
	const grants = [];
	for (const section of CONFIGURED_TOOL_SECTION_GRANTS) if (getRecord(tools[section.key])) grants.push(...section.grants);
	return uniqueStrings(grants);
}
function collectEffectiveConfiguredToolSectionGrants(inheritedTools, tools) {
	return uniqueStrings([...typeof tools?.profile !== "string" && inheritedTools ? collectConfiguredToolSectionGrants(inheritedTools) : [], ...tools ? collectConfiguredToolSectionGrants(tools) : []]);
}
function toolProfileAllowRequiresFull(params) {
	return collectProfileConfiguredSectionRepairGrants(params).length > 0;
}
function resolveProfileBoundAllowGrants(params) {
	const explicitAlsoAllow = readOwnToolPolicyGrantList(params.tools, "alsoAllow");
	const profileAllow = expandToolGroups(mergeAlsoAllowPolicy(resolveToolProfilePolicy(params.profile), explicitAlsoAllow ?? params.inheritedAlsoAllow ?? [])?.allow);
	const coreAllow = profileAllow.includes("*") ? expandToolGroups(params.allow) : profileAllow.filter((toolName) => isToolAllowedByPolicyName(toolName, { allow: params.allow }));
	const pluginAllow = expandToolGroups(params.allow).filter((entry) => {
		if (entry === "*" || isKnownCoreToolId(entry)) return false;
		return !profileAllow.some((toolName) => isToolAllowedByPolicyName(toolName, { allow: [entry] }));
	});
	return uniqueStrings([
		...coreAllow,
		...pluginAllow,
		...params.configuredGrants
	]);
}
function scopeToolProfileConfiguredSectionsNeedMigration(params) {
	return toolProfileAllowRequiresFull(params);
}
function byProviderToolProfilesNeedConfiguredSectionMigration(tools, configuredGrants, inheritedAlsoAllow, inheritedByProvider) {
	const byProvider = getRecord(tools.byProvider);
	if (Boolean(byProvider && Object.entries(byProvider).some(([providerKey, policy]) => {
		const inheritedProviderPolicy = resolveInheritedProviderPolicy(inheritedByProvider, providerKey);
		const inheritedProviderProfile = typeof inheritedProviderPolicy?.profile === "string" ? inheritedProviderPolicy.profile : void 0;
		if (!(typeof getRecord(policy)?.profile === "string" || Boolean(inheritedProviderProfile))) return false;
		return scopeToolProfileConfiguredSectionsNeedMigration({
			value: policy,
			inheritedProfile: inheritedProviderProfile,
			inheritedAlsoAllow: readOwnToolPolicyGrantList(inheritedProviderPolicy, "alsoAllow") ?? inheritedAlsoAllow,
			configuredGrants
		});
	}))) return true;
	const localConfiguredGrants = collectConfiguredToolSectionGrants(tools);
	if (localConfiguredGrants.length === 0) return false;
	const handledProviders = new Set(Object.keys(byProvider ?? {}).map((providerKey) => normalizeToolProviderPolicyKey(providerKey)));
	return listInheritedProviderPoliciesWithProfiles(inheritedByProvider).some((inheritedProvider) => !handledProviders.has(inheritedProvider.normalizedKey) && scopeToolProfileConfiguredSectionsNeedMigration({
		value: {},
		inheritedProfile: inheritedProvider.profile,
		inheritedAlsoAllow: readOwnToolPolicyGrantList(inheritedProvider.policy, "alsoAllow"),
		configuredGrants: localConfiguredGrants
	}));
}
function addProfileConfiguredSectionGrants(value, pathLabel, changes, inheritedProfile, inheritedAlsoAllow, configuredGrantsOverride) {
	const tools = getRecord(value);
	if (!tools) return;
	const profile = resolveToolProfileForMigration(tools, inheritedProfile);
	if (!profile) return;
	const repairGrants = collectProfileConfiguredSectionRepairGrants({
		value: tools,
		inheritedProfile,
		inheritedAlsoAllow,
		configuredGrants: configuredGrantsOverride ?? collectConfiguredToolSectionGrants(tools)
	});
	const allow = readToolPolicyGrantList(tools, "allow");
	if (repairGrants.length === 0 || allow.length === 0 || profile === "full") return;
	const ownAlsoAllow = readOwnToolPolicyGrantList(tools, "alsoAllow");
	tools.allow = resolveProfileBoundAllowGrants({
		tools,
		profile,
		allow: uniqueStrings([...allow, ...ownAlsoAllow ?? []]),
		inheritedAlsoAllow,
		configuredGrants: repairGrants
	});
	changes.push(`Replaced ${pathLabel}.allow entries with profile "${profile}" grants plus explicit configured-section grants.`);
	if (ownAlsoAllow) {
		delete tools.alsoAllow;
		changes.push(`Merged ${pathLabel}.alsoAllow into ${pathLabel}.allow.`);
	}
	tools.profile = "full";
	changes.push(`Set ${pathLabel}.profile to "full" so ${pathLabel}.allow controls explicit configured-section grants directly.`);
}
function addByProviderProfileConfiguredSectionGrants(value, pathLabel, changes, configuredGrantsOverride, inheritedProfile, inheritedByProvider) {
	const tools = getRecord(value);
	if (!tools) return;
	const configuredGrants = configuredGrantsOverride ?? collectConfiguredToolSectionGrants(tools);
	if (configuredGrants.length === 0) return;
	const byProvider = getRecord(tools.byProvider);
	const handledProviders = /* @__PURE__ */ new Set();
	for (const [providerKey, providerPolicy] of Object.entries(byProvider ?? {})) {
		if (isBlockedObjectKey(providerKey)) continue;
		addHandledProviderPolicyKey(handledProviders, providerKey);
		const inheritedProviderPolicy = resolveInheritedProviderPolicy(inheritedByProvider, providerKey);
		const ownsProviderProfile = typeof getRecord(providerPolicy)?.profile === "string";
		const inheritedProviderProfile = typeof inheritedProviderPolicy?.profile === "string" ? inheritedProviderPolicy.profile : void 0;
		const providerInheritedProfile = inheritedProviderProfile ?? inheritedProfile;
		const providerInheritedAlsoAllow = readOwnToolPolicyGrantList(inheritedProviderPolicy, "alsoAllow");
		addProfileConfiguredSectionGrantsWithConfiguredGrants(providerPolicy, `${pathLabel}.byProvider.${providerKey}`, changes, configuredGrants, providerInheritedProfile, providerInheritedAlsoAllow, ownsProviderProfile || Boolean(inheritedProviderProfile));
	}
	const localConfiguredGrants = collectConfiguredToolSectionGrants(tools);
	if (localConfiguredGrants.length === 0) return;
	for (const inheritedProvider of listInheritedProviderPoliciesWithProfiles(inheritedByProvider)) {
		if (handledProviders.has(inheritedProvider.normalizedKey)) continue;
		const providerPolicy = {};
		const changeCount = changes.length;
		addProfileConfiguredSectionGrantsWithConfiguredGrants(providerPolicy, `${pathLabel}.byProvider.${inheritedProvider.key}`, changes, localConfiguredGrants, inheritedProvider.profile, readOwnToolPolicyGrantList(inheritedProvider.policy, "alsoAllow"));
		if (changes.length > changeCount) {
			if (!getRecord(tools.byProvider)) tools.byProvider = {};
			getRecord(tools.byProvider)[inheritedProvider.key] = providerPolicy;
			addHandledProviderPolicyKey(handledProviders, inheritedProvider.normalizedKey);
		}
	}
}
function addHandledProviderPolicyKey(handledProviders, providerKey) {
	handledProviders.add(normalizeToolProviderPolicyKey(providerKey));
}
function normalizeToolProviderPolicyKey(value) {
	const normalized = value.trim().toLowerCase();
	const slashIndex = normalized.indexOf("/");
	if (slashIndex <= 0) return normalizeProviderId(normalized);
	const provider = normalizeProviderId(normalized.slice(0, slashIndex));
	const modelId = normalized.slice(slashIndex + 1);
	return modelId ? `${provider}/${modelId}` : provider;
}
function isCanonicalToolProviderPolicyKey(value) {
	return value.trim().toLowerCase() === normalizeToolProviderPolicyKey(value);
}
function buildInheritedProviderPolicyLookup(inheritedByProvider) {
	const lookup = /* @__PURE__ */ new Map();
	for (const [key, value] of Object.entries(inheritedByProvider ?? {})) {
		if (isBlockedObjectKey(key)) continue;
		const policy = getRecord(value);
		if (!policy) continue;
		const normalized = normalizeToolProviderPolicyKey(key);
		if (!normalized) continue;
		const canonical = isCanonicalToolProviderPolicyKey(key);
		const existing = lookup.get(normalized);
		if (!existing || canonical && !existing.canonical) lookup.set(normalized, {
			key,
			policy,
			canonical
		});
	}
	return lookup;
}
function resolveInheritedProviderPolicy(inheritedByProvider, providerKey) {
	const lookup = buildInheritedProviderPolicyLookup(inheritedByProvider);
	const normalized = normalizeToolProviderPolicyKey(providerKey);
	const slashIndex = normalized.indexOf("/");
	const candidates = slashIndex > 0 ? [normalized, normalized.slice(0, slashIndex)] : [normalized];
	for (const candidate of candidates) {
		const match = lookup.get(candidate);
		if (match) return match.policy;
	}
	return null;
}
function listInheritedProviderPoliciesWithProfiles(inheritedByProvider) {
	const entries = [];
	for (const [normalizedKey, match] of buildInheritedProviderPolicyLookup(inheritedByProvider)) {
		if (typeof match.policy.profile !== "string") continue;
		entries.push({
			key: match.key,
			normalizedKey,
			policy: match.policy,
			profile: match.policy.profile
		});
	}
	return entries;
}
function addProfileConfiguredSectionGrantsWithConfiguredGrants(value, pathLabel, changes, configuredGrants, inheritedProfile, inheritedAlsoAllow, materializeProfile = true) {
	const tools = getRecord(value);
	if (!tools) return;
	const profile = resolveToolProfileForMigration(tools, inheritedProfile);
	if (!profile) return;
	if (!materializeProfile) return;
	const repairGrants = collectProfileConfiguredSectionRepairGrants({
		value: tools,
		inheritedProfile,
		inheritedAlsoAllow,
		configuredGrants
	});
	const allow = readToolPolicyGrantList(tools, "allow");
	if (repairGrants.length === 0 || allow.length === 0 || profile === "full") return;
	const ownAlsoAllow = readOwnToolPolicyGrantList(tools, "alsoAllow");
	tools.allow = resolveProfileBoundAllowGrants({
		tools,
		profile,
		allow: uniqueStrings([...allow, ...ownAlsoAllow ?? []]),
		inheritedAlsoAllow,
		configuredGrants: repairGrants
	});
	changes.push(`Replaced ${pathLabel}.allow entries with profile "${profile}" grants plus explicit configured-section grants.`);
	if (ownAlsoAllow) {
		delete tools.alsoAllow;
		changes.push(`Merged ${pathLabel}.alsoAllow into ${pathLabel}.allow.`);
	}
	if (materializeProfile) {
		tools.profile = "full";
		changes.push(`Set ${pathLabel}.profile to "full" so ${pathLabel}.allow controls explicit configured-section grants directly.`);
	}
}
const LEGACY_CONFIG_MIGRATIONS_RUNTIME_AGENTS = [
	defineLegacyConfigMigration({
		id: "tools.profile-configured-sections-alsoAllow",
		describe: "Repair explicit configured-section tool grants filtered by profiles",
		legacyRules: PROFILE_CONFIGURED_TOOL_SECTION_RULES,
		apply: (raw, changes) => {
			const globalTools = getRecord(raw.tools);
			const inheritedProfile = typeof globalTools?.profile === "string" ? globalTools.profile : void 0;
			const inheritedAlsoAllow = readToolPolicyGrantList(globalTools, "alsoAllow");
			addProfileConfiguredSectionGrants(raw.tools, "tools", changes);
			addByProviderProfileConfiguredSectionGrants(raw.tools, "tools", changes, void 0, inheritedProfile);
			const agents = getRecord(raw.agents);
			if (!Array.isArray(agents?.list)) return;
			for (const [index, agent] of agents.list.entries()) {
				const agentTools = getRecord(getRecord(agent)?.tools);
				const configuredGrants = collectEffectiveConfiguredToolSectionGrants(globalTools, agentTools);
				addProfileConfiguredSectionGrants(agentTools, `agents.list.${index}.tools`, changes, inheritedProfile, inheritedAlsoAllow, configuredGrants);
				addByProviderProfileConfiguredSectionGrants(agentTools, `agents.list.${index}.tools`, changes, configuredGrants, resolveToolProfileForMigration(agentTools ?? {}, inheritedProfile), getRecord(globalTools?.byProvider));
			}
		}
	}),
	defineLegacyConfigMigration({
		id: "silentReplyRewrite-removed",
		describe: "Remove legacy silent reply rewrite and direct-chat silent reply config",
		legacyRules: SILENT_REPLY_LEGACY_RULES,
		apply: removeLegacySilentReplyConfig
	}),
	defineLegacyConfigMigration({
		id: "agents.defaults.llm->models.providers.timeoutSeconds",
		describe: "Remove legacy agents.defaults.llm timeout config",
		legacyRules: LEGACY_AGENT_LLM_TIMEOUT_RULES,
		apply: (raw, changes) => {
			const defaults = getRecord(getRecord(raw.agents)?.defaults);
			if (!defaults || getRecord(defaults.llm) === null) return;
			delete defaults.llm;
			changes.push("Removed agents.defaults.llm; model idle timeout now follows models.providers.<id>.timeoutSeconds within the agent/run timeout ceiling.");
		}
	}),
	defineLegacyConfigMigration({
		id: "agents.model.timeoutMs-ignored",
		describe: "Remove ignored timeoutMs keys from agent model selection config",
		legacyRules: IGNORED_AGENT_MODEL_TIMEOUT_RULES,
		apply: (raw, changes) => {
			const agents = getRecord(raw.agents);
			const defaults = getRecord(agents?.defaults);
			if (defaults) {
				removeIgnoredAgentModelTimeout(defaults.model, "agents.defaults.model", changes);
				removeIgnoredAgentModelTimeout(getRecord(defaults.subagents)?.model, "agents.defaults.subagents.model", changes);
			}
			if (!Array.isArray(agents?.list)) return;
			for (const [index, agent] of agents.list.entries()) {
				const agentRecord = getRecord(agent);
				if (!agentRecord) continue;
				removeIgnoredAgentModelTimeout(agentRecord.model, `agents.list.${index}.model`, changes);
				removeIgnoredAgentModelTimeout(getRecord(agentRecord.subagents)?.model, `agents.list.${index}.subagents.model`, changes);
			}
		}
	}),
	defineLegacyConfigMigration({
		id: "agents.agentRuntime-ignored",
		describe: "Remove ignored agent-wide runtime policy",
		legacyRules: LEGACY_AGENT_RUNTIME_POLICY_RULES,
		apply: (raw, changes) => {
			const agents = getRecord(raw.agents);
			const defaults = getRecord(agents?.defaults);
			if (defaults) removeLegacyAgentRuntimePolicy(defaults, "agents.defaults", changes);
			if (!Array.isArray(agents?.list)) return;
			for (const [index, agent] of agents.list.entries()) {
				const agentRecord = getRecord(agent);
				if (!agentRecord) continue;
				removeLegacyAgentRuntimePolicy(agentRecord, `agents.list.${index}`, changes);
			}
		}
	}),
	defineLegacyConfigMigration({
		id: "agents.sandbox.perSession->scope",
		describe: "Move legacy agent sandbox perSession aliases to sandbox.scope",
		legacyRules: LEGACY_SANDBOX_SCOPE_RULES,
		apply: (raw, changes) => {
			const agents = getRecord(raw.agents);
			const defaultSandbox = getRecord(getRecord(agents?.defaults)?.sandbox);
			if (defaultSandbox) migrateLegacySandboxPerSession(defaultSandbox, "agents.defaults.sandbox", changes);
			if (!Array.isArray(agents?.list)) return;
			for (const [index, agent] of agents.list.entries()) {
				const sandbox = getRecord(getRecord(agent)?.sandbox);
				if (!sandbox) continue;
				migrateLegacySandboxPerSession(sandbox, `agents.list.${index}.sandbox`, changes);
			}
		}
	}),
	defineLegacyConfigMigration({
		id: "memorySearch->agents.defaults.memorySearch",
		describe: "Move top-level memorySearch to agents.defaults.memorySearch",
		legacyRules: [MEMORY_SEARCH_RULE],
		apply: (raw, changes) => {
			const legacyMemorySearch = getRecord(raw.memorySearch);
			if (!legacyMemorySearch) return;
			mergeLegacyIntoDefaults({
				raw,
				rootKey: "agents",
				fieldKey: "memorySearch",
				legacyValue: legacyMemorySearch,
				changes,
				movedMessage: "Moved memorySearch → agents.defaults.memorySearch.",
				mergedMessage: "Merged memorySearch → agents.defaults.memorySearch (filled missing fields from legacy; kept explicit agents.defaults values)."
			});
			delete raw.memorySearch;
		}
	}),
	defineLegacyConfigMigration({
		id: "memorySearch.provider-auto->openai",
		describe: "Rewrite legacy memorySearch provider \"auto\" to \"openai\"",
		legacyRules: LEGACY_MEMORY_SEARCH_AUTO_PROVIDER_RULES,
		apply: (raw, changes) => {
			const agents = getRecord(raw.agents);
			rewriteLegacyMemorySearchAutoProvider(getRecord(getRecord(agents?.defaults)?.memorySearch), "agents.defaults.memorySearch", changes);
			if (!Array.isArray(agents?.list)) return;
			for (const [index, agent] of agents.list.entries()) rewriteLegacyMemorySearchAutoProvider(getRecord(getRecord(agent)?.memorySearch), `agents.list.${index}.memorySearch`, changes);
		}
	}),
	defineLegacyConfigMigration({
		id: "heartbeat->agents.defaults.heartbeat",
		describe: "Move top-level heartbeat to agents.defaults.heartbeat/channels.defaults.heartbeat",
		legacyRules: [HEARTBEAT_RULE],
		apply: (raw, changes) => {
			const legacyHeartbeat = getRecord(raw.heartbeat);
			if (!legacyHeartbeat) return;
			const { agentHeartbeat, channelHeartbeat } = splitLegacyHeartbeat(legacyHeartbeat);
			if (agentHeartbeat) mergeLegacyIntoDefaults({
				raw,
				rootKey: "agents",
				fieldKey: "heartbeat",
				legacyValue: agentHeartbeat,
				changes,
				movedMessage: "Moved heartbeat → agents.defaults.heartbeat.",
				mergedMessage: "Merged heartbeat → agents.defaults.heartbeat (filled missing fields from legacy; kept explicit agents.defaults values)."
			});
			if (channelHeartbeat) mergeLegacyIntoDefaults({
				raw,
				rootKey: "channels",
				fieldKey: "heartbeat",
				legacyValue: channelHeartbeat,
				changes,
				movedMessage: "Moved heartbeat visibility → channels.defaults.heartbeat.",
				mergedMessage: "Merged heartbeat visibility → channels.defaults.heartbeat (filled missing fields from legacy; kept explicit channels.defaults values)."
			});
			if (!agentHeartbeat && !channelHeartbeat) changes.push("Removed empty top-level heartbeat.");
			delete raw.heartbeat;
		}
	})
];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.runtime.diagnostics.ts
function isLegacyMemoryPressureBundleConfig(value) {
	return typeof value === "boolean" || getRecord(value) !== null;
}
const LEGACY_CONFIG_MIGRATIONS_RUNTIME_DIAGNOSTICS = [defineLegacyConfigMigration({
	id: "diagnostics.memoryPressureBundle->memoryPressureSnapshot",
	describe: "Move diagnostics.memoryPressureBundle to diagnostics.memoryPressureSnapshot",
	legacyRules: [{
		path: ["diagnostics", "memoryPressureBundle"],
		message: "diagnostics.memoryPressureBundle was renamed; use diagnostics.memoryPressureSnapshot instead. Run \"openclaw doctor --fix\".",
		match: isLegacyMemoryPressureBundleConfig,
		requireSourceLiteral: true
	}],
	apply: (raw, changes) => {
		const diagnostics = getRecord(raw.diagnostics);
		if (!diagnostics || !isLegacyMemoryPressureBundleConfig(diagnostics.memoryPressureBundle)) return;
		if (Object.prototype.hasOwnProperty.call(diagnostics, "memoryPressureSnapshot")) {
			delete diagnostics.memoryPressureBundle;
			changes.push("Removed diagnostics.memoryPressureBundle (memoryPressureSnapshot already set).");
			return;
		}
		const legacy = getRecord(diagnostics.memoryPressureBundle);
		diagnostics.memoryPressureSnapshot = typeof diagnostics.memoryPressureBundle === "boolean" ? diagnostics.memoryPressureBundle : legacy?.enabled !== false;
		delete diagnostics.memoryPressureBundle;
		changes.push("Moved diagnostics.memoryPressureBundle → memoryPressureSnapshot.");
	}
})];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.runtime.gateway.ts
const GATEWAY_BIND_RULE = {
	path: ["gateway", "bind"],
	message: "gateway.bind host aliases (for example 0.0.0.0/localhost) are legacy; use bind modes (lan/loopback/custom/tailnet/auto) instead. Run \"openclaw doctor --fix\".",
	match: (value) => isLegacyGatewayBindHostAlias(value),
	requireSourceLiteral: true
};
function isLegacyGatewayBindHostAlias(value) {
	return normalizeLegacyGatewayBindHostAlias(value) !== null;
}
function normalizeLegacyGatewayBindHostAlias(value) {
	const normalized = normalizeOptionalLowercaseString(value);
	if (!normalized) return null;
	if (normalized === "auto" || normalized === "loopback" || normalized === "lan" || normalized === "tailnet" || normalized === "custom") return null;
	if (normalized === "0.0.0.0" || normalized === "::" || normalized === "[::]" || normalized === "*") return "lan";
	if (normalized === "127.0.0.1" || normalized === "localhost" || normalized === "::1" || normalized === "[::1]") return "loopback";
	return null;
}
function escapeControlForLog(value) {
	return value.replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t");
}
const LEGACY_CONFIG_MIGRATIONS_RUNTIME_GATEWAY = [defineLegacyConfigMigration({
	id: "gateway.controlUi.allowedOrigins-seed-for-non-loopback",
	describe: "Seed gateway.controlUi.allowedOrigins for existing non-loopback gateway installs",
	apply: (raw, changes) => {
		const gateway = getRecord(raw.gateway);
		if (!gateway) return;
		const bind = normalizeLegacyGatewayBindHostAlias(gateway.bind) ?? gateway.bind;
		if (!isGatewayNonLoopbackBindMode(bind)) return;
		const controlUi = getRecord(gateway.controlUi) ?? {};
		if (hasConfiguredControlUiAllowedOrigins({
			allowedOrigins: controlUi.allowedOrigins,
			dangerouslyAllowHostHeaderOriginFallback: controlUi.dangerouslyAllowHostHeaderOriginFallback
		})) return;
		const origins = buildDefaultControlUiAllowedOrigins({
			port: resolveGatewayPortWithDefault(gateway.port, DEFAULT_GATEWAY_PORT),
			bind,
			customBindHost: typeof gateway.customBindHost === "string" ? gateway.customBindHost : void 0
		});
		gateway.controlUi = {
			...controlUi,
			allowedOrigins: origins
		};
		raw.gateway = gateway;
		changes.push(`Seeded gateway.controlUi.allowedOrigins ${JSON.stringify(origins)} for bind=${bind}. Required since v2026.2.26. Add other machine origins to gateway.controlUi.allowedOrigins if needed.`);
	}
}), defineLegacyConfigMigration({
	id: "gateway.bind.host-alias->bind-mode",
	describe: "Normalize gateway.bind host aliases to supported bind modes",
	legacyRules: [GATEWAY_BIND_RULE],
	apply: (raw, changes) => {
		const gateway = getRecord(raw.gateway);
		if (!gateway) return;
		const bindRaw = gateway.bind;
		if (typeof bindRaw !== "string") return;
		const normalized = normalizeOptionalLowercaseString(bindRaw);
		if (!normalized) return;
		const mapped = normalizeLegacyGatewayBindHostAlias(bindRaw);
		if (!mapped || normalized === mapped) return;
		gateway.bind = mapped;
		raw.gateway = gateway;
		changes.push(`Normalized gateway.bind "${escapeControlForLog(bindRaw)}" → "${mapped}".`);
	}
})];
const LEGACY_CONFIG_MIGRATIONS_RUNTIME_MCP = [defineLegacyConfigMigration({
	id: "mcp.servers.type->transport",
	describe: "Move CLI-native MCP server type aliases to OpenClaw transport",
	legacyRules: [{
		path: ["mcp", "servers"],
		message: "mcp.servers entries use OpenClaw transport names; CLI-native type aliases are legacy here. Run \"openclaw doctor --fix\".",
		match: (value) => isRecord(value) && Object.values(value).some((server) => isRecord(server) && isKnownCliMcpTypeAlias(server.type))
	}],
	apply: (raw, changes) => {
		const mcp = isRecord(raw.mcp) ? raw.mcp : void 0;
		const servers = isRecord(mcp?.servers) ? mcp?.servers : void 0;
		if (!servers) return;
		for (const [serverName, rawServer] of Object.entries(servers)) {
			if (!isRecord(rawServer) || !isKnownCliMcpTypeAlias(rawServer.type)) continue;
			const rawType = typeof rawServer.type === "string" ? rawServer.type : "";
			const alias = resolveOpenClawMcpTransportAlias(rawServer.type);
			if (typeof rawServer.transport !== "string" && alias) {
				rawServer.transport = alias;
				changes.push(`Moved mcp.servers.${serverName}.type "${rawType}" → transport "${alias}".`);
			} else if (typeof rawServer.transport === "string") changes.push(`Removed mcp.servers.${serverName}.type (transport "${rawServer.transport}" already set).`);
			else changes.push(`Removed mcp.servers.${serverName}.type "${rawType}".`);
			delete rawServer.type;
		}
	}
})];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.runtime.models.ts
const STALE_CONTEXT_WINDOW_FIXES = { "deepseek/deepseek-v4-flash": {
	stale: 2e5,
	correct: 1e6
} };
function resolveStaleContextWindowFix(params) {
	if (params.providerId !== "deepseek") return;
	const fix = STALE_CONTEXT_WINDOW_FIXES[params.modelId.includes("/") ? params.modelId : `deepseek/${params.modelId}`];
	return fix && params.contextWindow === fix.stale ? fix : void 0;
}
function hasStaleContextWindowValue(providers) {
	const providersRecord = getRecord(providers);
	if (!providersRecord) return false;
	for (const [providerId, provider] of Object.entries(providersRecord)) {
		const models = getRecord(provider)?.models;
		if (!Array.isArray(models)) continue;
		for (const model of models) {
			const modelRecord = getRecord(model);
			const modelId = typeof modelRecord?.id === "string" ? modelRecord.id : void 0;
			const contextWindow = modelRecord?.contextWindow;
			if (!modelId || typeof contextWindow !== "number" || !Number.isFinite(contextWindow)) continue;
			if (resolveStaleContextWindowFix({
				providerId,
				modelId,
				contextWindow
			})) return true;
		}
	}
	return false;
}
function hasInvalidThinkingFormat(providers) {
	const providersRecord = getRecord(providers);
	if (!providersRecord) return false;
	for (const provider of Object.values(providersRecord)) {
		const models = getRecord(provider)?.models;
		if (!Array.isArray(models)) continue;
		for (const model of models) {
			const thinkingFormat = getRecord(getRecord(model)?.compat)?.thinkingFormat;
			if (typeof thinkingFormat === "string" && !isModelThinkingFormat(thinkingFormat)) return true;
		}
	}
	return false;
}
const LEGACY_VLLM_QWEN_THINKING_FORMAT_KEYS = ["qwenThinkingFormat", "qwen_thinking_format"];
function normalizeLegacyVllmQwenThinkingFormat(value) {
	if (typeof value !== "string") return;
	switch (value.trim().toLowerCase().replace(/[_\s]+/g, "-")) {
		case "chat-template":
		case "chat-template-argument":
		case "chat-template-arguments":
		case "chat-template-kwarg":
		case "chat-template-kwargs":
		case "qwen-chat-template": return "qwen-chat-template";
		case "enable-thinking":
		case "qwen":
		case "request-body":
		case "top-level": return "qwen";
		default: return;
	}
}
function getLegacyVllmQwenThinkingFormat(params) {
	for (const key of LEGACY_VLLM_QWEN_THINKING_FORMAT_KEYS) if (Object.prototype.hasOwnProperty.call(params, key)) return {
		key,
		value: params[key],
		compat: normalizeLegacyVllmQwenThinkingFormat(params[key])
	};
}
function parseVllmAgentModelKey(key) {
	const trimmed = splitTrailingAuthProfile(key).model.trim();
	const slashIndex = trimmed.indexOf("/");
	if (slashIndex <= 0) return;
	if (normalizeProviderId(trimmed.slice(0, slashIndex)) !== "vllm") return;
	const modelId = trimmed.slice(slashIndex + 1).trim();
	return modelId && modelId !== "*" ? modelId : void 0;
}
function hasLegacyVllmQwenThinkingFormat(defaultModels) {
	const models = getRecord(defaultModels);
	if (!models) return false;
	for (const [key, entry] of Object.entries(models)) {
		if (!parseVllmAgentModelKey(key)) continue;
		const params = getRecord(getRecord(entry)?.params);
		if (params && getLegacyVllmQwenThinkingFormat(params)) return true;
	}
	return false;
}
function hasLegacyVllmQwenThinkingProviderParams(provider) {
	const params = getRecord(getRecord(provider)?.params);
	return Boolean(params && getLegacyVllmQwenThinkingFormat(params));
}
function hasLegacyVllmQwenThinkingModelParams(provider) {
	const models = getRecord(provider)?.models;
	if (!Array.isArray(models)) return false;
	return models.some((model) => {
		const params = getRecord(getRecord(model)?.params);
		return Boolean(params && getLegacyVllmQwenThinkingFormat(params));
	});
}
function hasLegacyVllmQwenThinkingParams(params) {
	const record = getRecord(params);
	return Boolean(record && getLegacyVllmQwenThinkingFormat(record));
}
function hasLegacyVllmQwenThinkingAgentParams(agents) {
	const list = getRecord(agents)?.list;
	if (!Array.isArray(list)) return false;
	return list.some((agent) => hasLegacyVllmQwenThinkingParams(getRecord(agent)?.params));
}
function findOrCreateVllmModelEntry(raw, modelId) {
	const modelsRoot = getOrCreateRecord(raw, "models");
	const providers = modelsRoot ? getOrCreateRecord(modelsRoot, "providers") : void 0;
	const vllm = providers ? getOrCreateVllmProvider(providers) : void 0;
	if (!vllm) return;
	if (vllm.models !== void 0 && !Array.isArray(vllm.models)) return;
	const models = Array.isArray(vllm.models) ? vllm.models : [];
	vllm.models = models;
	const providerModelId = `vllm/${modelId}`;
	for (const [index, model] of models.entries()) {
		const record = getRecord(model);
		if (record?.id === modelId || record?.id === providerModelId) return {
			model: record,
			index
		};
	}
	const model = {
		id: modelId,
		name: modelId
	};
	models.push(model);
	return {
		model,
		index: models.length - 1
	};
}
function listExistingVllmModelTargets(raw) {
	const models = findVllmProvider(getRecord(getRecord(raw.models)?.providers))?.models;
	if (!Array.isArray(models)) return [];
	return models.flatMap((model, index) => {
		const record = getRecord(model);
		return record ? [{
			model: record,
			index
		}] : [];
	});
}
function collectVllmModelIdsFromSelection(value) {
	if (typeof value === "string") {
		const modelId = parseVllmAgentModelKey(value);
		return modelId ? [modelId] : [];
	}
	const record = getRecord(value);
	if (!record) return [];
	const ids = [];
	if (typeof record.primary === "string") {
		const primary = parseVllmAgentModelKey(record.primary);
		if (primary) ids.push(primary);
	}
	if (Array.isArray(record.fallbacks)) for (const fallback of record.fallbacks) {
		if (typeof fallback !== "string") continue;
		const modelId = parseVllmAgentModelKey(fallback);
		if (modelId) ids.push(modelId);
	}
	return ids;
}
function collectVllmModelIdsFromAgentModelMap(value) {
	const models = getRecord(value);
	if (!models) return [];
	return Object.keys(models).flatMap((key) => {
		const modelId = parseVllmAgentModelKey(key);
		return modelId ? [modelId] : [];
	});
}
function createVllmModelTargets(raw, modelIds) {
	const targets = [];
	const seen = /* @__PURE__ */ new Set();
	for (const modelId of modelIds) {
		const target = findOrCreateVllmModelEntry(raw, modelId);
		if (!target || seen.has(target.model)) continue;
		seen.add(target.model);
		targets.push(target);
	}
	return targets;
}
function combineVllmModelTargets(...groups) {
	const targets = [];
	const seen = /* @__PURE__ */ new Set();
	for (const group of groups) for (const target of group) {
		if (seen.has(target.model)) continue;
		seen.add(target.model);
		targets.push(target);
	}
	return targets;
}
function collectVllmModelIdsFromAgentList(value) {
	if (!Array.isArray(value)) return [];
	return value.flatMap((agent) => {
		const record = getRecord(agent);
		return record ? [...collectVllmModelIdsFromSelection(record.model), ...collectVllmModelIdsFromAgentModelMap(record.models)] : [];
	});
}
function getOrCreateRecord(root, key) {
	if (root[key] === void 0) {
		const next = {};
		root[key] = next;
		return next;
	}
	return getRecord(root[key]) ?? void 0;
}
function findVllmProvider(providers) {
	if (!providers) return;
	const key = Object.keys(providers).find((entry) => normalizeProviderId(entry) === "vllm");
	return key ? getRecord(providers[key]) ?? void 0 : void 0;
}
function getOrCreateVllmProvider(providers) {
	const key = Object.keys(providers).find((entry) => normalizeProviderId(entry) === "vllm");
	if (key) return getRecord(providers[key]) ?? void 0;
	return getOrCreateRecord(providers, "vllm");
}
function hasLegacyVllmQwenThinkingNormalizedProvider(providers) {
	const providersRecord = getRecord(providers);
	if (!providersRecord || getRecord(providersRecord.vllm)) return false;
	const vllmProvider = findVllmProvider(providersRecord);
	return hasLegacyVllmQwenThinkingProviderParams(vllmProvider) || hasLegacyVllmQwenThinkingModelParams(vllmProvider);
}
function preserveMigratedVllmQwenReasoning(model) {
	if (model.reasoning === void 0) model.reasoning = true;
}
function removeLegacyVllmQwenThinkingParams(params) {
	for (const key of LEGACY_VLLM_QWEN_THINKING_FORMAT_KEYS) delete params[key];
}
function applyLegacyVllmQwenThinkingFormat(params) {
	if (!params.legacyFormat.compat) {
		removeLegacyVllmQwenThinkingParams(params.legacyParams);
		params.changes.push(`Removed ${params.sourcePath}.${params.legacyFormat.key} (unrecognized value ${JSON.stringify(params.legacyFormat.value)}; configure models.providers.vllm.models[].compat.thinkingFormat if needed).`);
		return true;
	}
	preserveMigratedVllmQwenReasoning(params.target.model);
	const compat = ensureRecord$1(params.target.model, "compat");
	const currentThinkingFormat = compat.thinkingFormat;
	if (typeof currentThinkingFormat === "string" && isModelThinkingFormat(currentThinkingFormat)) {
		removeLegacyVllmQwenThinkingParams(params.legacyParams);
		params.changes.push(`Removed ${params.sourcePath}.${params.legacyFormat.key}; models.providers.vllm.models[${params.target.index}].compat.thinkingFormat is already ${JSON.stringify(currentThinkingFormat)}.`);
		return true;
	}
	compat.thinkingFormat = params.legacyFormat.compat;
	removeLegacyVllmQwenThinkingParams(params.legacyParams);
	params.changes.push(`Moved ${params.sourcePath}.${params.legacyFormat.key} to models.providers.vllm.models[${params.target.index}].compat.thinkingFormat (${JSON.stringify(params.legacyFormat.compat)}).`);
	return true;
}
function removeUntargetedLegacyVllmQwenThinkingFormat(params) {
	removeLegacyVllmQwenThinkingParams(params.legacyParams);
	params.changes.push(`Removed ${params.sourcePath}.${params.legacyFormat.key}; no concrete vLLM model row or agent model ref exists, so configure models.providers.vllm.models[].compat.thinkingFormat on each Qwen model that needs it.`);
}
const LEGACY_VLLM_QWEN_AGENT_THINKING_FORMAT_RULE = {
	path: [
		"agents",
		"defaults",
		"models"
	],
	message: "agents.defaults.models.<vllm-model>.params.qwenThinkingFormat is legacy; run \"openclaw doctor --fix\" to move it to models.providers.vllm.models[].compat.thinkingFormat.",
	match: (value) => hasLegacyVllmQwenThinkingFormat(value)
};
const LEGACY_VLLM_QWEN_PROVIDER_THINKING_FORMAT_RULE = {
	path: [
		"models",
		"providers",
		"vllm",
		"params"
	],
	message: "models.providers.vllm.params.qwenThinkingFormat is legacy; run \"openclaw doctor --fix\" to move it to models.providers.vllm.models[].compat.thinkingFormat.",
	match: (value) => hasLegacyVllmQwenThinkingProviderParams({ params: value })
};
const LEGACY_VLLM_QWEN_PROVIDER_MODEL_THINKING_FORMAT_RULE = {
	path: [
		"models",
		"providers",
		"vllm",
		"models"
	],
	message: "models.providers.vllm.models[*].params.qwenThinkingFormat is legacy; run \"openclaw doctor --fix\" to move it to models.providers.vllm.models[].compat.thinkingFormat.",
	match: (value) => hasLegacyVllmQwenThinkingModelParams({ models: value })
};
const LEGACY_VLLM_QWEN_NORMALIZED_PROVIDER_THINKING_FORMAT_RULE = {
	path: ["models", "providers"],
	message: "models.providers.<vllm>.params.qwenThinkingFormat is legacy; run \"openclaw doctor --fix\" to move it to models.providers.<vllm>.models[].compat.thinkingFormat.",
	match: (value) => hasLegacyVllmQwenThinkingNormalizedProvider(value)
};
const LEGACY_VLLM_QWEN_DEFAULT_PARAMS_THINKING_FORMAT_RULE = {
	path: [
		"agents",
		"defaults",
		"params"
	],
	message: "agents.defaults.params.qwenThinkingFormat is legacy; run \"openclaw doctor --fix\" to move it to models.providers.vllm.models[].compat.thinkingFormat.",
	match: (value) => hasLegacyVllmQwenThinkingParams(value)
};
const LEGACY_VLLM_QWEN_AGENT_PARAMS_THINKING_FORMAT_RULE = {
	path: ["agents"],
	message: "agents.list[].params.qwenThinkingFormat is legacy; run \"openclaw doctor --fix\" to move it to models.providers.vllm.models[].compat.thinkingFormat.",
	match: (value) => hasLegacyVllmQwenThinkingAgentParams(value)
};
const INVALID_THINKING_FORMAT_RULE = {
	path: ["models", "providers"],
	message: "models.providers.<id>.models[*].compat.thinkingFormat has an unrecognized value; run \"openclaw doctor --fix\" to remove it and restore the runtime default.",
	match: (value) => hasInvalidThinkingFormat(value)
};
const STALE_CONTEXT_WINDOW_RULE = {
	path: ["models", "providers"],
	message: "models.providers.<id>.models[*].contextWindow has a stale catalog value; run \"openclaw doctor --fix\" to repair it.",
	match: (value) => hasStaleContextWindowValue(value)
};
function normalizeString(value) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}
function preferredClaudeSeparator(provider) {
	return provider === "github-copilot" || provider === "copilot-proxy" ? "." : "-";
}
function claudeTargetModelId(family, separator, provider) {
	const version = family === "opus" && provider !== "venice" && provider !== "vercel-ai-gateway" ? "4.7" : "4.6";
	return `claude-${family}-${separator === "." ? version : version.replace(".", "-")}`;
}
function shouldUpgradeClaudeProvider(provider) {
	return !provider || provider === "anthropic" || provider === "github-copilot" || provider === "copilot-proxy" || provider === "venice" || provider === "vercel-ai-gateway";
}
function upgradeRetiredGroqModelId(model) {
	switch (normalizeString(model)) {
		case "deepseek-r1-distill-llama-70b": return "llama-3.3-70b-versatile";
		case "gemma2-9b-it":
		case "llama3-8b-8192": return "llama-3.1-8b-instant";
		case "llama3-70b-8192": return "llama-3.3-70b-versatile";
		case "meta-llama/llama-4-maverick-17b-128e-instruct":
		case "moonshotai/kimi-k2-instruct":
		case "moonshotai/kimi-k2-instruct-0905": return "openai/gpt-oss-120b";
		case "mistral-saba-24b":
		case "qwen-qwq-32b": return "qwen/qwen3-32b";
		default: return null;
	}
}
function upgradeRetiredXaiModelId(model) {
	switch (normalizeString(model)) {
		case "grok-code-fast":
		case "grok-code-fast-1":
		case "grok-code-fast-1-0825": return "grok-build-0.1";
		case "grok-4-fast-reasoning":
		case "grok-4-1-fast-reasoning": return "grok-4.3";
		default: return null;
	}
}
function upgradeRetiredOpenAiModelId(model, provider) {
	const normalized = normalizeString(model);
	const codexProvider = provider === "openai-codex";
	if (codexProvider && normalized === "gpt-5.2") return "gpt-5.5";
	if (normalized === "gpt-5.2-codex" || normalized === "gpt-5.1-codex" || normalized === "gpt-5-codex") return codexProvider ? "gpt-5.5" : "gpt-5.3-codex";
	if (normalized === "gpt-5-pro" || normalized === "gpt-5.2-pro") return "gpt-5.5-pro";
	if (normalized === "gpt-4.1-nano" || normalized === "gpt-5-nano") {
		if (codexProvider) return "gpt-5.4-mini";
		return "gpt-5.4-nano";
	}
	if (normalized === "gpt-4.1-mini" || normalized === "gpt-4o-mini" || normalized === "gpt-5.1-codex-mini" || normalized === "gpt-5-mini") return "gpt-5.4-mini";
	if (normalized === "gpt-4" || normalized === "gpt-4-turbo" || normalized === "gpt-4.1" || normalized === "gpt-4o" || normalized === "gpt-4o-2024-05-13" || normalized === "gpt-4o-2024-08-06" || normalized === "gpt-4o-2024-11-20" || normalized === "gpt-5" || normalized === "gpt-5-chat-latest" || normalized === "gpt-5.1" || normalized === "gpt-5.1-chat-latest" || normalized === "gpt-5.1-codex-max" || normalized === "gpt-5.2" || normalized === "gpt-5.2-chat-latest") return "gpt-5.5";
	return null;
}
function hasRetiredVersionPrefix(normalized, prefix) {
	if (normalized === prefix) return true;
	if (!normalized.startsWith(prefix)) return false;
	const next = normalized[prefix.length];
	return next === "-" || next === "." || next === ":" || next === "@";
}
function hasAnyRetiredVersionPrefix(normalized, prefixes) {
	return prefixes.some((prefix) => hasRetiredVersionPrefix(normalized, prefix));
}
function upgradeOldClaudeToken(token, separator, provider) {
	const normalized = normalizeString(token);
	if (!normalized) return null;
	const opusTarget = claudeTargetModelId("opus", separator, provider);
	const sonnetTarget = claudeTargetModelId("sonnet", separator, provider);
	if (normalized.startsWith("claude-opus-4-7") || normalized.startsWith("claude-opus-4.7") || normalized.startsWith("claude-opus-4-6") || normalized.startsWith("claude-opus-4.6") || normalized.startsWith("claude-sonnet-4-6") || normalized.startsWith("claude-sonnet-4.6")) return null;
	if (normalized === "claude-opus-4" || hasAnyRetiredVersionPrefix(normalized, [
		"claude-opus-4-5",
		"claude-opus-4.5",
		"claude-opus-4-1",
		"claude-opus-4.1",
		"claude-opus-4-0",
		"claude-opus-4.0"
	]) || /^claude-opus-4-20\d{6}/.test(normalized)) return opusTarget;
	if (normalized === "claude-sonnet-4" || hasAnyRetiredVersionPrefix(normalized, [
		"claude-sonnet-4-5",
		"claude-sonnet-4.5",
		"claude-sonnet-4-1",
		"claude-sonnet-4.1",
		"claude-sonnet-4-0",
		"claude-sonnet-4.0",
		"claude-haiku-4-5",
		"claude-haiku-4.5"
	]) || /^claude-sonnet-4-20\d{6}/.test(normalized)) return sonnetTarget;
	if (normalized.startsWith("claude-3") && normalized.includes("opus")) return opusTarget;
	if (normalized.startsWith("claude-3") && (normalized.includes("sonnet") || normalized.includes("haiku"))) return sonnetTarget;
	if (normalized.startsWith("anthropic.claude-opus-")) {
		if (provider === "amazon-bedrock" || provider === "amazon-bedrock-mantle") return null;
		if (normalized.startsWith("anthropic.claude-opus-4-7") || normalized.startsWith("anthropic.claude-opus-4-6")) return null;
		return `anthropic.${claudeTargetModelId("opus", "-", provider)}`;
	}
	if (normalized.startsWith("anthropic.claude-sonnet-") || normalized.startsWith("anthropic.claude-haiku-")) {
		if (provider === "amazon-bedrock" || provider === "amazon-bedrock-mantle") return null;
		if (normalized.startsWith("anthropic.claude-sonnet-4-6")) return null;
		return `anthropic.${claudeTargetModelId("sonnet", "-", provider)}`;
	}
	if (normalized === "opus-4.5" || normalized === "opus-4.1" || normalized === "opus-4" || normalized === "opus-3") return opusTarget;
	if (normalized === "sonnet-4.5" || normalized === "sonnet-4.1" || normalized === "sonnet-4.0" || normalized === "sonnet-4" || normalized === "sonnet-3.7" || normalized === "sonnet-3.5" || normalized === "sonnet-3" || normalized === "haiku-4.5" || normalized === "haiku-3.5" || normalized === "haiku-3") return sonnetTarget;
	return null;
}
function upgradeOldClaudeModelPart(model, provider) {
	const separator = preferredClaudeSeparator(provider);
	const slashParts = model.split("/");
	const lastPart = slashParts.at(-1);
	if (lastPart) {
		const upgraded = upgradeOldClaudeToken(lastPart, separator, provider);
		if (upgraded) return [...slashParts.slice(0, -1), upgraded].join("/");
	}
	return upgradeOldClaudeToken(model, separator, provider);
}
function upgradeRetiredModelRef(value) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const split = splitTrailingAuthProfile(trimmed);
	const modelRef = split.model;
	const slash = modelRef.indexOf("/");
	const provider = slash > 0 ? modelRef.slice(0, slash).trim() : void 0;
	const model = slash > 0 ? modelRef.slice(slash + 1).trim() : modelRef;
	const normalizedProvider = normalizeString(provider);
	const normalizedModel = normalizeString(model);
	const retiredOwnerModel = normalizedProvider === "groq" ? upgradeRetiredGroqModelId(model) : normalizedProvider === "xai" ? upgradeRetiredXaiModelId(model) : normalizedProvider === "openai" || normalizedProvider === "openai-codex" || normalizedProvider === "github-copilot" ? upgradeRetiredOpenAiModelId(model, normalizedProvider) : void 0;
	if (retiredOwnerModel) return `${provider}/${retiredOwnerModel}${split.profile ? `@${split.profile}` : ""}`;
	if ((normalizedProvider === "github-copilot" || normalizedProvider === "copilot-proxy") && normalizedModel === "grok-code-fast-1") return `${provider}/gpt-5.4-mini${split.profile ? `@${split.profile}` : ""}`;
	if (!shouldUpgradeClaudeProvider(normalizedProvider || void 0)) return null;
	const upgradedModel = upgradeOldClaudeModelPart(model, normalizedProvider || void 0);
	if (!upgradedModel || upgradedModel === model) return null;
	return `${provider ? `${provider}/${upgradedModel}` : upgradedModel}${split.profile ? `@${split.profile}` : ""}`;
}
const MODEL_REF_STRING_KEYS = new Set([
	"model",
	"primary",
	"summaryModel",
	"imageModel",
	"imageGenerationModel",
	"musicGenerationModel",
	"pdfModel",
	"videoGenerationModel"
]);
const MODEL_REF_ARRAY_KEYS = new Set([
	"fallback",
	"fallbacks",
	"allowedModels",
	"modelFallbacks",
	"imageModelFallbacks"
]);
const MODEL_REF_MAP_KEYS = new Set(["models"]);
function pathKey(path) {
	return path.slice(path.lastIndexOf(".") + 1);
}
function isChannelModelOverridePath(path) {
	return path.includes(".modelByChannel.");
}
function scanKnownModelRefs(value, key, path = "") {
	if (typeof value === "string") return Boolean(key && (MODEL_REF_STRING_KEYS.has(key) || isChannelModelOverridePath(path)) && upgradeRetiredModelRef(value));
	if (Array.isArray(value)) return value.some((entry, index) => typeof entry === "string" && key && MODEL_REF_ARRAY_KEYS.has(key) ? Boolean(upgradeRetiredModelRef(entry)) : scanKnownModelRefs(entry, void 0, `${path}.${index}`));
	const record = getRecord(value);
	if (!record) return false;
	if (key && MODEL_REF_MAP_KEYS.has(key)) return Object.keys(record).some((entryKey) => Boolean(upgradeRetiredModelRef(entryKey)));
	return Object.entries(record).some(([childKey, child]) => scanKnownModelRefs(child, childKey, `${path}.${childKey}`));
}
function rewriteModelRefString(value, path, changes) {
	const upgraded = upgradeRetiredModelRef(value);
	if (!upgraded) return value;
	changes.push(`Upgraded ${path} from ${JSON.stringify(value)} to ${JSON.stringify(upgraded)}.`);
	return upgraded;
}
function rewriteModelRefMapKeys(record, path, changes) {
	let changed = false;
	const next = {};
	for (const [key, child] of Object.entries(record)) {
		const upgradedKey = upgradeRetiredModelRef(key);
		const nextKey = upgradedKey ?? key;
		if (upgradedKey) {
			changes.push(`Upgraded ${path} key from ${JSON.stringify(key)} to ${JSON.stringify(upgradedKey)}.`);
			changed = true;
		}
		if (nextKey in next && upgradedKey) continue;
		next[nextKey] = child;
	}
	return {
		value: changed ? next : record,
		changed
	};
}
function rewriteKnownModelRefs(value, path, changes) {
	const key = pathKey(path);
	if (typeof value === "string") {
		if (!MODEL_REF_STRING_KEYS.has(key) && !isChannelModelOverridePath(path)) return {
			value,
			changed: false
		};
		const next = rewriteModelRefString(value, path, changes);
		return {
			value: next,
			changed: next !== value
		};
	}
	if (Array.isArray(value)) {
		let changed = false;
		const next = value.map((entry, index) => {
			if (typeof entry === "string" && MODEL_REF_ARRAY_KEYS.has(key)) {
				const rewritten = rewriteModelRefString(entry, `${path}.${index}`, changes);
				changed ||= rewritten !== entry;
				return rewritten;
			}
			const rewritten = rewriteKnownModelRefs(entry, `${path}.${index}`, changes);
			changed ||= rewritten.changed;
			return rewritten.value;
		});
		return {
			value: changed ? next : value,
			changed
		};
	}
	const record = getRecord(value);
	if (!record) return {
		value,
		changed: false
	};
	let working = record;
	let changed = false;
	if (MODEL_REF_MAP_KEYS.has(key)) {
		const rewrittenKeys = rewriteModelRefMapKeys(record, path, changes);
		working = rewrittenKeys.value;
		changed ||= rewrittenKeys.changed;
	}
	const next = {};
	for (const [childKey, child] of Object.entries(working)) {
		const rewritten = rewriteKnownModelRefs(child, `${path}.${childKey}`, changes);
		changed ||= rewritten.changed;
		next[childKey] = rewritten.value;
	}
	return {
		value: changed ? next : value,
		changed
	};
}
const RETIRED_MODEL_REF_MESSAGE = "Configured retired model refs are no longer in the bundled catalogs; run \"openclaw doctor --fix\" to upgrade them.";
const LEGACY_CONFIG_MIGRATIONS_RUNTIME_MODELS = [
	defineLegacyConfigMigration({
		id: "models.retired-model-refs",
		describe: "Upgrade retired model refs to current catalog entries",
		legacyRules: [
			"agents",
			"plugins",
			"messages",
			"tools",
			"hooks",
			"channels",
			"models"
		].map((section) => ({
			path: [section],
			message: RETIRED_MODEL_REF_MESSAGE,
			match: (value) => scanKnownModelRefs(value)
		})),
		apply: (raw, changes) => {
			const rewritten = rewriteKnownModelRefs(raw, "config", changes);
			if (!rewritten.changed || !getRecord(rewritten.value)) return;
			for (const key of Object.keys(raw)) delete raw[key];
			Object.assign(raw, rewritten.value);
		}
	}),
	defineLegacyConfigMigration({
		id: "agents.defaults.models.vllm.params.qwenThinkingFormat->models.providers.vllm.models.compat.thinkingFormat",
		describe: "Move legacy vLLM Qwen thinking params to model compat metadata",
		legacyRules: [
			LEGACY_VLLM_QWEN_AGENT_THINKING_FORMAT_RULE,
			LEGACY_VLLM_QWEN_PROVIDER_THINKING_FORMAT_RULE,
			LEGACY_VLLM_QWEN_PROVIDER_MODEL_THINKING_FORMAT_RULE,
			LEGACY_VLLM_QWEN_NORMALIZED_PROVIDER_THINKING_FORMAT_RULE,
			LEGACY_VLLM_QWEN_DEFAULT_PARAMS_THINKING_FORMAT_RULE,
			LEGACY_VLLM_QWEN_AGENT_PARAMS_THINKING_FORMAT_RULE
		],
		apply: (raw, changes) => {
			const agentsDefaults = getRecord(getRecord(raw.agents)?.defaults);
			const defaultModels = getRecord(agentsDefaults?.models);
			if (defaultModels) for (const [key, entry] of Object.entries(defaultModels)) {
				const modelId = parseVllmAgentModelKey(key);
				const entryRecord = getRecord(entry);
				const params = getRecord(entryRecord?.params);
				if (!modelId || !entryRecord || !params) continue;
				const legacyFormat = getLegacyVllmQwenThinkingFormat(params);
				if (!legacyFormat) continue;
				const target = legacyFormat.compat ? findOrCreateVllmModelEntry(raw, modelId) : void 0;
				if (legacyFormat.compat && !target) continue;
				applyLegacyVllmQwenThinkingFormat({
					sourcePath: `agents.defaults.models.${JSON.stringify(key)}.params`,
					legacyParams: params,
					target: target ?? {
						model: {},
						index: -1
					},
					legacyFormat,
					changes
				});
				if (Object.keys(params).length === 0) delete entryRecord.params;
			}
			const vllmProvider = findVllmProvider(getRecord(getRecord(raw.models)?.providers));
			const vllmModels = vllmProvider?.models;
			if (Array.isArray(vllmModels)) for (const [index, model] of vllmModels.entries()) {
				const modelRecord = getRecord(model);
				const params = getRecord(modelRecord?.params);
				if (!modelRecord || !params) continue;
				const legacyFormat = getLegacyVllmQwenThinkingFormat(params);
				if (!legacyFormat) continue;
				applyLegacyVllmQwenThinkingFormat({
					sourcePath: `models.providers.vllm.models[${index}].params`,
					legacyParams: params,
					target: {
						model: modelRecord,
						index
					},
					legacyFormat,
					changes
				});
				if (Object.keys(params).length === 0) delete modelRecord.params;
			}
			const providerParams = getRecord(vllmProvider?.params);
			if (providerParams) {
				const providerLegacyFormat = getLegacyVllmQwenThinkingFormat(providerParams);
				if (providerLegacyFormat) {
					const providerModelIds = [
						...collectVllmModelIdsFromSelection(agentsDefaults?.model),
						...collectVllmModelIdsFromAgentModelMap(defaultModels),
						...collectVllmModelIdsFromAgentList(getRecord(raw.agents)?.list)
					];
					const targets = combineVllmModelTargets(listExistingVllmModelTargets(raw), createVllmModelTargets(raw, providerModelIds));
					if (targets.length === 0) removeUntargetedLegacyVllmQwenThinkingFormat({
						sourcePath: "models.providers.vllm.params",
						legacyParams: providerParams,
						legacyFormat: providerLegacyFormat,
						changes
					});
					else for (const target of targets) applyLegacyVllmQwenThinkingFormat({
						sourcePath: "models.providers.vllm.params",
						legacyParams: providerParams,
						target,
						legacyFormat: providerLegacyFormat,
						changes
					});
					if (Object.keys(providerParams).length === 0) delete vllmProvider?.params;
				}
			}
			const defaultParams = getRecord(agentsDefaults?.params);
			if (defaultParams) {
				const defaultLegacyFormat = getLegacyVllmQwenThinkingFormat(defaultParams);
				if (defaultLegacyFormat) {
					const defaultModelIds = [...collectVllmModelIdsFromSelection(agentsDefaults?.model), ...collectVllmModelIdsFromAgentModelMap(defaultModels)];
					const targets = defaultModelIds.length > 0 ? createVllmModelTargets(raw, defaultModelIds) : listExistingVllmModelTargets(raw);
					if (targets.length === 0) removeUntargetedLegacyVllmQwenThinkingFormat({
						sourcePath: "agents.defaults.params",
						legacyParams: defaultParams,
						legacyFormat: defaultLegacyFormat,
						changes
					});
					else for (const target of targets) applyLegacyVllmQwenThinkingFormat({
						sourcePath: "agents.defaults.params",
						legacyParams: defaultParams,
						target,
						legacyFormat: defaultLegacyFormat,
						changes
					});
					if (Object.keys(defaultParams).length === 0) delete agentsDefaults?.params;
				}
			}
			const agentList = getRecord(raw.agents)?.list;
			if (!Array.isArray(agentList)) return;
			for (const [index, agent] of agentList.entries()) {
				const agentRecord = getRecord(agent);
				const agentParams = getRecord(agentRecord?.params);
				const agentLegacyFormat = agentParams ? getLegacyVllmQwenThinkingFormat(agentParams) : void 0;
				if (!agentRecord || !agentParams || !agentLegacyFormat) continue;
				const explicitAgentModelIds = [...collectVllmModelIdsFromSelection(agentRecord.model), ...collectVllmModelIdsFromAgentModelMap(agentRecord.models)];
				const inheritedDefaultModelIds = [...collectVllmModelIdsFromSelection(agentsDefaults?.model), ...collectVllmModelIdsFromAgentModelMap(defaultModels)];
				const agentModelIds = explicitAgentModelIds.length > 0 ? explicitAgentModelIds : inheritedDefaultModelIds;
				const targets = agentModelIds.length > 0 ? createVllmModelTargets(raw, agentModelIds) : listExistingVllmModelTargets(raw);
				if (targets.length === 0) removeUntargetedLegacyVllmQwenThinkingFormat({
					sourcePath: `agents.list[${index}].params`,
					legacyParams: agentParams,
					legacyFormat: agentLegacyFormat,
					changes
				});
				else for (const target of targets) applyLegacyVllmQwenThinkingFormat({
					sourcePath: `agents.list[${index}].params`,
					legacyParams: agentParams,
					target,
					legacyFormat: agentLegacyFormat,
					changes
				});
				if (Object.keys(agentParams).length === 0) delete agentRecord.params;
			}
		}
	}),
	defineLegacyConfigMigration({
		id: "models.providers.*.models.*.compat.thinkingFormat-invalid",
		describe: "Remove unrecognized compat.thinkingFormat values from provider model entries",
		legacyRules: [INVALID_THINKING_FORMAT_RULE],
		apply: (raw, changes) => {
			const providers = getRecord(getRecord(raw.models)?.providers);
			if (!providers) return;
			for (const [providerId, provider] of Object.entries(providers)) {
				const models = getRecord(provider)?.models;
				if (!Array.isArray(models)) continue;
				for (const [index, model] of models.entries()) {
					const compat = getRecord(getRecord(model)?.compat);
					if (!compat) continue;
					const thinkingFormat = compat.thinkingFormat;
					if (typeof thinkingFormat !== "string" || isModelThinkingFormat(thinkingFormat)) continue;
					delete compat.thinkingFormat;
					changes.push(`Removed models.providers.${providerId}.models.${index}.compat.thinkingFormat (unrecognized value ${JSON.stringify(thinkingFormat)}; runtime default applies).`);
				}
			}
		}
	}),
	defineLegacyConfigMigration({
		id: "models.providers.*.models.*.contextWindow-stale",
		describe: "Repair stale contextWindow values to match catalog defaults",
		legacyRules: [STALE_CONTEXT_WINDOW_RULE],
		apply: (raw, changes) => {
			const providers = getRecord(getRecord(raw.models)?.providers);
			if (!providers) return;
			for (const [providerId, provider] of Object.entries(providers)) {
				const models = getRecord(provider)?.models;
				if (!Array.isArray(models)) continue;
				for (const [index, model] of models.entries()) {
					if (!getRecord(model)) continue;
					const modelId = typeof model.id === "string" ? model.id : void 0;
					if (!modelId) continue;
					const contextWindow = model.contextWindow;
					if (typeof contextWindow !== "number" || !Number.isFinite(contextWindow)) continue;
					const fix = resolveStaleContextWindowFix({
						providerId,
						modelId,
						contextWindow
					});
					if (!fix) continue;
					model.contextWindow = fix.correct;
					changes.push(`Repaired models.providers.${providerId}.models[${index}].${modelId}.contextWindow (${contextWindow} → ${fix.correct} to match catalog default).`);
				}
			}
		}
	})
];
//#endregion
//#region src/commands/doctor/shared/legacy-x-search-migrate.ts
const XAI_PLUGIN_ID = "xai";
const X_SEARCH_LEGACY_PATH = "tools.web.x_search";
const XAI_WEB_SEARCH_PLUGIN_KEY_PATH = `plugins.entries.${XAI_PLUGIN_ID}.config.webSearch.apiKey`;
function cloneRecord(value) {
	if (!value) return value;
	return { ...value };
}
function ensureRecord(target, key) {
	const current = target[key];
	if (isRecord(current)) return current;
	const next = {};
	target[key] = next;
	return next;
}
function resolveLegacyXSearchConfig(raw) {
	if (!isRecord(raw)) return;
	const tools = isRecord(raw.tools) ? raw.tools : void 0;
	const web = isRecord(tools?.web) ? tools.web : void 0;
	return isRecord(web?.x_search) ? web.x_search : void 0;
}
function resolveLegacyXSearchAuth(legacy) {
	return legacy.apiKey;
}
function migrateLegacyXSearchConfig(raw) {
	if (!isRecord(raw)) return {
		config: raw,
		changes: []
	};
	const legacy = resolveLegacyXSearchConfig(raw);
	if (!legacy || !Object.prototype.hasOwnProperty.call(legacy, "apiKey")) return {
		config: raw,
		changes: []
	};
	const nextRoot = structuredClone(raw);
	const web = ensureRecord(ensureRecord(nextRoot, "tools"), "web");
	const nextLegacy = cloneRecord(legacy) ?? {};
	delete nextLegacy.apiKey;
	if (Object.keys(nextLegacy).length === 0) delete web.x_search;
	else web.x_search = nextLegacy;
	const entry = ensureRecord(ensureRecord(ensureRecord(nextRoot, "plugins"), "entries"), XAI_PLUGIN_ID);
	const hadEnabled = entry.enabled !== void 0;
	if (!hadEnabled) entry.enabled = true;
	const config = ensureRecord(entry, "config");
	const auth = resolveLegacyXSearchAuth(legacy);
	const changes = [];
	if (auth !== void 0) {
		const existingWebSearch = isRecord(config.webSearch) ? cloneRecord(config.webSearch) : void 0;
		if (!existingWebSearch) {
			config.webSearch = { apiKey: auth };
			changes.push(`Moved ${X_SEARCH_LEGACY_PATH}.apiKey → ${XAI_WEB_SEARCH_PLUGIN_KEY_PATH}.`);
		} else if (!Object.prototype.hasOwnProperty.call(existingWebSearch, "apiKey")) {
			existingWebSearch.apiKey = auth;
			config.webSearch = existingWebSearch;
			changes.push(`Merged ${X_SEARCH_LEGACY_PATH}.apiKey → ${XAI_WEB_SEARCH_PLUGIN_KEY_PATH} (filled missing plugin auth).`);
		} else changes.push(`Removed ${X_SEARCH_LEGACY_PATH}.apiKey (${XAI_WEB_SEARCH_PLUGIN_KEY_PATH} already set).`);
	}
	if (auth !== void 0 && Object.keys(nextLegacy).length === 0 && !hadEnabled) changes.push(`Removed empty ${X_SEARCH_LEGACY_PATH}.`);
	return {
		config: nextRoot,
		changes
	};
}
const LEGACY_CONFIG_MIGRATIONS_RUNTIME_PROVIDERS = [defineLegacyConfigMigration({
	id: "plugins.allow->plugins.bundledDiscovery.compat",
	describe: "Preserve legacy bundled provider discovery for existing restrictive allowlists",
	legacyRules: [{
		path: ["plugins", "allow"],
		message: "plugins.allow now gates bundled provider discovery by default; run \"openclaw doctor --fix\" to preserve legacy bundled provider compatibility as plugins.bundledDiscovery=\"compat\", or set plugins.bundledDiscovery=\"allowlist\" to keep the stricter behavior.",
		requireSourceLiteral: true,
		match: (value, root) => {
			if (!Array.isArray(value) || value.length === 0) return false;
			return (isRecord(root.plugins) ? root.plugins : void 0)?.bundledDiscovery === void 0;
		}
	}],
	apply: (raw, changes) => {
		const plugins = isRecord(raw.plugins) ? raw.plugins : void 0;
		if (!plugins || plugins.bundledDiscovery !== void 0) return;
		const allow = plugins.allow;
		if (!Array.isArray(allow) || allow.length === 0) return;
		plugins.bundledDiscovery = "compat";
		changes.push("Set plugins.bundledDiscovery=\"compat\" to preserve legacy bundled provider discovery for this restrictive plugins.allow config.");
	}
}), defineLegacyConfigMigration({
	id: "tools.web.x_search.apiKey->plugins.entries.xai.config.webSearch.apiKey",
	describe: "Move legacy x_search auth into the xAI plugin webSearch config",
	legacyRules: [{
		path: [
			"tools",
			"web",
			"x_search",
			"apiKey"
		],
		message: "tools.web.x_search.apiKey moved to the xAI plugin; use plugins.entries.xai.config.webSearch.apiKey instead. Run \"openclaw doctor --fix\"."
	}],
	apply: (raw, changes) => {
		const migrated = migrateLegacyXSearchConfig(raw);
		if (!migrated.changes.length) return;
		for (const key of Object.keys(raw)) delete raw[key];
		Object.assign(raw, migrated.config);
		changes.push(...migrated.changes);
	}
})];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.runtime.session.ts
function hasLegacyRotateBytes(value) {
	const maintenance = getRecord(value);
	return Boolean(maintenance && Object.prototype.hasOwnProperty.call(maintenance, "rotateBytes"));
}
function hasLegacyParentForkMaxTokens(value) {
	const session = getRecord(value);
	return Boolean(session && Object.prototype.hasOwnProperty.call(session, "parentForkMaxTokens"));
}
const LEGACY_SESSION_MAINTENANCE_ROTATE_BYTES_RULE = {
	path: ["session", "maintenance"],
	message: "session.maintenance.rotateBytes is deprecated and ignored; run \"openclaw doctor --fix\" to remove it.",
	match: hasLegacyRotateBytes
};
const LEGACY_SESSION_PARENT_FORK_MAX_TOKENS_RULE = {
	path: ["session"],
	message: "session.parentForkMaxTokens was removed; parent fork sizing is automatic. Run \"openclaw doctor --fix\" to remove it.",
	match: hasLegacyParentForkMaxTokens
};
const LEGACY_CONFIG_MIGRATIONS_RUNTIME_SESSION = [defineLegacyConfigMigration({
	id: "session.maintenance.rotateBytes",
	describe: "Remove deprecated session.maintenance.rotateBytes",
	legacyRules: [LEGACY_SESSION_MAINTENANCE_ROTATE_BYTES_RULE],
	apply: (raw, changes) => {
		const maintenance = getRecord(getRecord(raw.session)?.maintenance);
		if (!maintenance || !Object.prototype.hasOwnProperty.call(maintenance, "rotateBytes")) return;
		delete maintenance.rotateBytes;
		changes.push("Removed deprecated session.maintenance.rotateBytes.");
	}
}), defineLegacyConfigMigration({
	id: "session.parentForkMaxTokens",
	describe: "Remove legacy session.parentForkMaxTokens",
	legacyRules: [LEGACY_SESSION_PARENT_FORK_MAX_TOKENS_RULE],
	apply: (raw, changes) => {
		const session = getRecord(raw.session);
		if (!session || !Object.prototype.hasOwnProperty.call(session, "parentForkMaxTokens")) return;
		delete session.parentForkMaxTokens;
		changes.push("Removed session.parentForkMaxTokens; parent fork sizing is automatic.");
	}
})];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.runtime.tts.ts
const LEGACY_TTS_PROVIDER_KEYS = [
	"openai",
	"elevenlabs",
	"microsoft",
	"edge"
];
const LEGACY_TTS_PLUGIN_IDS = new Set(["voice-call"]);
function isLegacyEdgeProviderId(value) {
	return typeof value === "string" && value.trim().toLowerCase() === "edge";
}
function hasLegacyTtsProviderKeys(value) {
	const tts = getRecord(value);
	if (!tts) return false;
	if (isLegacyEdgeProviderId(tts.provider)) return true;
	if (LEGACY_TTS_PROVIDER_KEYS.some((key) => Object.prototype.hasOwnProperty.call(tts, key))) return true;
	const providers = getRecord(tts.providers);
	return Boolean(providers && Object.prototype.hasOwnProperty.call(providers, "edge"));
}
function hasLegacyPluginEntryTtsProviderKeys(value) {
	const entries = getRecord(value);
	if (!entries) return false;
	return Object.entries(entries).some(([pluginId, entryValue]) => {
		if (isBlockedObjectKey(pluginId) || !LEGACY_TTS_PLUGIN_IDS.has(pluginId)) return false;
		return hasLegacyTtsProviderKeys(getRecord(getRecord(entryValue)?.config)?.tts);
	});
}
function hasLegacyTtsEnabled(value) {
	return typeof getRecord(value)?.enabled === "boolean";
}
function hasLegacyTtsEnabledInAgentLocations(value) {
	const agents = getRecord(value);
	if (hasLegacyTtsEnabled(getRecord(getRecord(agents?.defaults)?.tts))) return true;
	return (Array.isArray(agents?.list) ? agents.list : []).some((entry) => hasLegacyTtsEnabled(getRecord(getRecord(entry)?.tts)));
}
function hasLegacyTtsEnabledInChannelLocations(value) {
	const channels = getRecord(value);
	for (const [channelId, channelValue] of Object.entries(channels ?? {})) {
		if (isBlockedObjectKey(channelId)) continue;
		const channel = getRecord(channelValue);
		if (hasLegacyTtsEnabled(getRecord(channel?.tts))) return true;
		const accounts = getRecord(channel?.accounts);
		for (const [accountId, accountValue] of Object.entries(accounts ?? {})) {
			if (isBlockedObjectKey(accountId)) continue;
			if (hasLegacyTtsEnabled(getRecord(getRecord(accountValue)?.tts))) return true;
		}
	}
	return false;
}
function hasLegacyTtsEnabledInPluginLocations(value) {
	const entries = getRecord(value);
	if (!entries) return false;
	return Object.entries(entries).some(([pluginId, entryValue]) => {
		if (isBlockedObjectKey(pluginId) || !LEGACY_TTS_PLUGIN_IDS.has(pluginId)) return false;
		return hasLegacyTtsEnabled(getRecord(getRecord(getRecord(entryValue)?.config)?.tts));
	});
}
function getOrCreateTtsProviders(tts) {
	const providers = getRecord(tts.providers) ?? {};
	tts.providers = providers;
	return providers;
}
function mergeLegacyTtsProviderConfig(tts, legacyKey, providerId) {
	const legacyValue = getRecord(tts[legacyKey]);
	if (!legacyValue) return false;
	const providers = getOrCreateTtsProviders(tts);
	const existing = getRecord(providers[providerId]) ?? {};
	const merged = structuredClone(existing);
	mergeMissing(merged, legacyValue);
	providers[providerId] = merged;
	delete tts[legacyKey];
	return true;
}
function mergeLegacyTtsProviderAliasConfig(tts, aliasKey, providerId) {
	const providers = getRecord(tts.providers);
	const aliasValue = getRecord(providers?.[aliasKey]);
	if (!providers || !aliasValue) return false;
	const existing = getRecord(providers[providerId]) ?? {};
	const merged = structuredClone(existing);
	mergeMissing(merged, aliasValue);
	providers[providerId] = merged;
	delete providers[aliasKey];
	return true;
}
function migrateLegacyTtsConfig(tts, pathLabel, changes) {
	if (!tts) return;
	if (isLegacyEdgeProviderId(tts.provider)) {
		tts.provider = "microsoft";
		changes.push(`Moved ${pathLabel}.provider "edge" → "microsoft".`);
	}
	const movedOpenAI = mergeLegacyTtsProviderConfig(tts, "openai", "openai");
	const movedElevenLabs = mergeLegacyTtsProviderConfig(tts, "elevenlabs", "elevenlabs");
	const movedMicrosoft = mergeLegacyTtsProviderConfig(tts, "microsoft", "microsoft");
	const movedProviderEdge = mergeLegacyTtsProviderAliasConfig(tts, "edge", "microsoft");
	const movedEdge = mergeLegacyTtsProviderConfig(tts, "edge", "microsoft");
	if (movedOpenAI) changes.push(`Moved ${pathLabel}.openai → ${pathLabel}.providers.openai.`);
	if (movedElevenLabs) changes.push(`Moved ${pathLabel}.elevenlabs → ${pathLabel}.providers.elevenlabs.`);
	if (movedMicrosoft) changes.push(`Moved ${pathLabel}.microsoft → ${pathLabel}.providers.microsoft.`);
	if (movedProviderEdge) changes.push(`Moved ${pathLabel}.providers.edge → ${pathLabel}.providers.microsoft.`);
	if (movedEdge) changes.push(`Moved ${pathLabel}.edge → ${pathLabel}.providers.microsoft.`);
}
function migrateLegacyTtsEnabled(tts, pathLabel, changes) {
	if (!tts || typeof tts.enabled !== "boolean") return;
	const nextAuto = tts.enabled ? "always" : "off";
	delete tts.enabled;
	if (typeof tts.auto === "string" && tts.auto.trim()) {
		changes.push(`Removed ${pathLabel}.enabled because ${pathLabel}.auto is already set.`);
		return;
	}
	tts.auto = nextAuto;
	changes.push(`Moved ${pathLabel}.enabled → ${pathLabel}.auto "${nextAuto}".`);
}
function visitKnownTtsConfigLocations(raw, visit) {
	visit(getRecord(getRecord(raw.messages)?.tts), "messages.tts");
	const agents = getRecord(raw.agents);
	visit(getRecord(getRecord(agents?.defaults)?.tts), "agents.defaults.tts");
	(Array.isArray(agents?.list) ? agents.list : []).forEach((entry, index) => {
		visit(getRecord(getRecord(entry)?.tts), `agents.list[${index}].tts`);
	});
	const channels = getRecord(raw.channels);
	for (const [channelId, channelValue] of Object.entries(channels ?? {})) {
		if (isBlockedObjectKey(channelId)) continue;
		const channel = getRecord(channelValue);
		visit(getRecord(channel?.tts), `channels.${channelId}.tts`);
		const accounts = getRecord(channel?.accounts);
		for (const [accountId, accountValue] of Object.entries(accounts ?? {})) {
			if (isBlockedObjectKey(accountId)) continue;
			visit(getRecord(getRecord(accountValue)?.tts), `channels.${channelId}.accounts.${accountId}.tts`);
		}
	}
	const pluginEntries = getRecord(getRecord(raw.plugins)?.entries);
	for (const [pluginId, entryValue] of Object.entries(pluginEntries ?? {})) {
		if (isBlockedObjectKey(pluginId) || !LEGACY_TTS_PLUGIN_IDS.has(pluginId)) continue;
		visit(getRecord(getRecord(getRecord(entryValue)?.config)?.tts), `plugins.entries.${pluginId}.config.tts`);
	}
}
const LEGACY_CONFIG_MIGRATIONS_RUNTIME_TTS = [defineLegacyConfigMigration({
	id: "tts.providers-generic-shape",
	describe: "Move legacy bundled TTS config keys into messages.tts.providers",
	legacyRules: [{
		path: ["messages", "tts"],
		message: "messages.tts legacy provider aliases/keys are legacy; use provider: \"microsoft\" and messages.tts.providers.<provider>. Run \"openclaw doctor --fix\".",
		match: (value) => hasLegacyTtsProviderKeys(value)
	}, {
		path: ["plugins", "entries"],
		message: "plugins.entries.voice-call.config.tts legacy provider aliases/keys are legacy; use provider: \"microsoft\" and plugins.entries.voice-call.config.tts.providers.<provider>. Run \"openclaw doctor --fix\".",
		match: (value) => hasLegacyPluginEntryTtsProviderKeys(value)
	}],
	apply: (raw, changes) => {
		migrateLegacyTtsConfig(getRecord(getRecord(raw.messages)?.tts), "messages.tts", changes);
		const pluginEntries = getRecord(getRecord(raw.plugins)?.entries);
		if (!pluginEntries) return;
		for (const [pluginId, entryValue] of Object.entries(pluginEntries)) {
			if (isBlockedObjectKey(pluginId) || !LEGACY_TTS_PLUGIN_IDS.has(pluginId)) continue;
			migrateLegacyTtsConfig(getRecord(getRecord(getRecord(entryValue)?.config)?.tts), `plugins.entries.${pluginId}.config.tts`, changes);
		}
	}
}), defineLegacyConfigMigration({
	id: "tts.enabled-auto-mode",
	describe: "Move legacy TTS enabled toggles to auto mode",
	legacyRules: [
		{
			path: ["messages", "tts"],
			message: "messages.tts.enabled is legacy; use messages.tts.auto. Run \"openclaw doctor --fix\".",
			match: (value) => hasLegacyTtsEnabled(value)
		},
		{
			path: ["agents"],
			message: "agents.*.tts.enabled is legacy; use agents.*.tts.auto. Run \"openclaw doctor --fix\".",
			match: (value) => hasLegacyTtsEnabledInAgentLocations(value)
		},
		{
			path: ["channels"],
			message: "channels.*.tts.enabled is legacy; use channels.*.tts.auto. Run \"openclaw doctor --fix\".",
			match: (value) => hasLegacyTtsEnabledInChannelLocations(value)
		},
		{
			path: ["plugins", "entries"],
			message: "plugins.entries.voice-call.config.tts.enabled is legacy; use plugins.entries.voice-call.config.tts.auto. Run \"openclaw doctor --fix\".",
			match: (value) => hasLegacyTtsEnabledInPluginLocations(value)
		}
	],
	apply: (raw, changes) => {
		visitKnownTtsConfigLocations(raw, (tts, pathLabel) => migrateLegacyTtsEnabled(tts, pathLabel, changes));
	}
})];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.runtime.ts
const LEGACY_CONFIG_MIGRATIONS_RUNTIME = [
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME_AGENTS,
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME_DIAGNOSTICS,
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME_GATEWAY,
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME_MCP,
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME_MODELS,
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME_PROVIDERS,
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME_SESSION,
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME_TTS
];
//#endregion
//#region src/commands/doctor/shared/legacy-web-search-migrate.ts
const DANGEROUS_RECORD_KEYS = new Set([
	"__proto__",
	"prototype",
	"constructor"
]);
const BUNDLED_LEGACY_WEB_SEARCH_OWNERS = new Map([
	["brave", "brave"],
	["duckduckgo", "duckduckgo"],
	["exa", "exa"],
	["firecrawl", "firecrawl"],
	["gemini", "google"],
	["grok", "xai"],
	["kimi", "moonshot"],
	["minimax", "minimax"],
	["ollama", "ollama"],
	["perplexity", "perplexity"],
	["searxng", "searxng"],
	["tavily", "tavily"]
]);
const NON_MIGRATED_LEGACY_WEB_SEARCH_PROVIDER_IDS = new Set(["tavily"]);
const LEGACY_GLOBAL_WEB_SEARCH_PROVIDER_ID = "brave";
function getBundledLegacyWebSearchOwners() {
	return BUNDLED_LEGACY_WEB_SEARCH_OWNERS;
}
function getLegacyWebSearchProviderIds(owners = getBundledLegacyWebSearchOwners()) {
	return [...owners.keys()].filter((providerId) => !NON_MIGRATED_LEGACY_WEB_SEARCH_PROVIDER_IDS.has(providerId)).toSorted((left, right) => left.localeCompare(right));
}
function getLegacyWebSearchProviderIdSet(owners) {
	return new Set(getLegacyWebSearchProviderIds(owners));
}
function resolveLegacySearchConfig(raw) {
	if (!isRecord(raw)) return;
	const tools = isRecord(raw.tools) ? raw.tools : void 0;
	const web = isRecord(tools?.web) ? tools.web : void 0;
	return isRecord(web?.search) ? web.search : void 0;
}
function copyLegacyProviderConfig(search, providerKey) {
	const current = search[providerKey];
	return isRecord(current) ? cloneRecord$1(current) : void 0;
}
function hasMappedLegacyWebSearchConfig(raw, owners) {
	const search = resolveLegacySearchConfig(raw);
	if (!search) return false;
	if (hasOwnKey$1(search, "apiKey")) return true;
	return getLegacyWebSearchProviderIds(owners).some((providerId) => isRecord(search[providerId]));
}
function resolveLegacyGlobalWebSearchMigration(search, owners) {
	const legacyProviderConfig = copyLegacyProviderConfig(search, LEGACY_GLOBAL_WEB_SEARCH_PROVIDER_ID);
	const payload = legacyProviderConfig ?? {};
	const hasLegacyApiKey = hasOwnKey$1(search, "apiKey");
	if (hasLegacyApiKey) payload.apiKey = search.apiKey;
	if (Object.keys(payload).length === 0) return null;
	const pluginId = owners.get(LEGACY_GLOBAL_WEB_SEARCH_PROVIDER_ID) ?? LEGACY_GLOBAL_WEB_SEARCH_PROVIDER_ID;
	return {
		pluginId,
		payload,
		legacyPath: hasLegacyApiKey ? "tools.web.search.apiKey" : `tools.web.search.${LEGACY_GLOBAL_WEB_SEARCH_PROVIDER_ID}`,
		targetPath: hasLegacyApiKey && !legacyProviderConfig ? `plugins.entries.${pluginId}.config.webSearch.apiKey` : `plugins.entries.${pluginId}.config.webSearch`
	};
}
function migratePluginWebSearchConfig(params) {
	const entry = ensureRecord$2(ensureRecord$2(ensureRecord$2(params.root, "plugins"), "entries"), params.pluginId);
	const config = ensureRecord$2(entry, "config");
	const hadEnabled = entry.enabled !== void 0;
	const existing = isRecord(config.webSearch) ? cloneRecord$1(config.webSearch) : void 0;
	if (!hadEnabled) entry.enabled = true;
	if (!existing) {
		config.webSearch = cloneRecord$1(params.payload);
		params.changes.push(`Moved ${params.legacyPath} → ${params.targetPath}.`);
		return;
	}
	const merged = cloneRecord$1(existing);
	mergeMissing(merged, params.payload);
	const changed = JSON.stringify(merged) !== JSON.stringify(existing) || !hadEnabled;
	config.webSearch = merged;
	if (changed) {
		params.changes.push(`Merged ${params.legacyPath} → ${params.targetPath} (filled missing fields from legacy; kept explicit plugin config values).`);
		return;
	}
	params.changes.push(`Removed ${params.legacyPath} (${params.targetPath} already set).`);
}
function listLegacyWebSearchConfigPaths(raw) {
	const owners = getBundledLegacyWebSearchOwners();
	const search = resolveLegacySearchConfig(raw);
	if (!search) return [];
	const paths = [];
	if ("apiKey" in search) paths.push("tools.web.search.apiKey");
	for (const providerId of getLegacyWebSearchProviderIds(owners)) {
		const scoped = search[providerId];
		if (isRecord(scoped)) for (const key of Object.keys(scoped)) paths.push(`tools.web.search.${providerId}.${key}`);
	}
	return paths;
}
function migrateLegacyWebSearchConfig(raw) {
	if (!isRecord(raw)) return {
		config: raw,
		changes: []
	};
	const owners = getBundledLegacyWebSearchOwners();
	if (!hasMappedLegacyWebSearchConfig(raw, owners)) return {
		config: raw,
		changes: []
	};
	return normalizeLegacyWebSearchConfigRecord(structuredClone(raw), owners);
}
function normalizeLegacyWebSearchConfigRecord(raw, owners) {
	const nextRoot = cloneRecord$1(raw);
	const web = ensureRecord$2(ensureRecord$2(nextRoot, "tools"), "web");
	const search = resolveLegacySearchConfig(nextRoot);
	if (!search) return {
		config: raw,
		changes: []
	};
	const nextSearch = {};
	const changes = [];
	for (const [key, value] of Object.entries(search)) {
		if (key === "apiKey") continue;
		if (getLegacyWebSearchProviderIdSet(owners).has(key) && isRecord(value)) continue;
		if (DANGEROUS_RECORD_KEYS.has(key)) continue;
		nextSearch[key] = value;
	}
	web.search = nextSearch;
	const globalSearchMigration = resolveLegacyGlobalWebSearchMigration(search, owners);
	if (globalSearchMigration) migratePluginWebSearchConfig({
		root: nextRoot,
		legacyPath: globalSearchMigration.legacyPath,
		targetPath: globalSearchMigration.targetPath,
		pluginId: globalSearchMigration.pluginId,
		payload: globalSearchMigration.payload,
		changes
	});
	for (const providerId of getLegacyWebSearchProviderIds(owners)) {
		if (providerId === LEGACY_GLOBAL_WEB_SEARCH_PROVIDER_ID) continue;
		const scoped = copyLegacyProviderConfig(search, providerId);
		if (!scoped || Object.keys(scoped).length === 0) continue;
		const pluginId = owners.get(providerId);
		if (!pluginId) continue;
		migratePluginWebSearchConfig({
			root: nextRoot,
			legacyPath: `tools.web.search.${providerId}`,
			targetPath: `plugins.entries.${pluginId}.config.webSearch`,
			pluginId,
			payload: scoped,
			changes
		});
	}
	return {
		config: nextRoot,
		changes
	};
}
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.web-search.ts
const LEGACY_WEB_SEARCH_RULES = [{
	path: [
		"tools",
		"web",
		"search"
	],
	message: "tools.web.search provider-owned config moved to plugins.entries.<plugin>.config.webSearch. Run \"openclaw doctor --fix\".",
	match: (_value, root) => listLegacyWebSearchConfigPaths(root).length > 0,
	requireSourceLiteral: true
}];
function replaceRootRecord(target, replacement) {
	for (const key of Object.keys(target)) delete target[key];
	Object.assign(target, replacement);
}
const LEGACY_CONFIG_MIGRATIONS_WEB_SEARCH = [defineLegacyConfigMigration({
	id: "tools.web.search-provider-config->plugins.entries",
	describe: "Move legacy tools.web.search provider-owned config into plugins.entries.<plugin>.config.webSearch",
	legacyRules: LEGACY_WEB_SEARCH_RULES,
	apply: (raw, changes) => {
		const migrated = migrateLegacyWebSearchConfig(raw);
		if (migrated.changes.length === 0) return;
		replaceRootRecord(raw, migrated.config);
		changes.push(...migrated.changes);
	}
})];
//#endregion
//#region src/commands/doctor/shared/legacy-config-migrations.ts
const LEGACY_CONFIG_MIGRATION_SPECS = [
	...LEGACY_CONFIG_MIGRATIONS_CHANNELS,
	...LEGACY_CONFIG_MIGRATIONS_AUDIO,
	...LEGACY_CONFIG_MIGRATIONS_QUEUE,
	...LEGACY_CONFIG_MIGRATIONS_RUNTIME,
	...LEGACY_CONFIG_MIGRATIONS_WEB_SEARCH
];
const LEGACY_CONFIG_MIGRATIONS = LEGACY_CONFIG_MIGRATION_SPECS.map(({ legacyRules: _legacyRules, ...migration }) => migration);
const LEGACY_CONFIG_MIGRATION_RULES = LEGACY_CONFIG_MIGRATION_SPECS.flatMap((migration) => migration.legacyRules ?? []);
//#endregion
export { mergeMissing as a, migrateLegacyXSearchConfig as i, LEGACY_CONFIG_MIGRATION_RULES as n, loadBundledChannelDoctorContractApi as o, migrateLegacyWebSearchConfig as r, LEGACY_CONFIG_MIGRATIONS as t };
