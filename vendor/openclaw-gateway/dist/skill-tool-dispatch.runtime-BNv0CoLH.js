import { r as logVerbose } from "./globals-DZ-ifL5z.js";
import { d as resolveGatewayMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { a as collectExplicitDenylist, c as hasRestrictiveAllowPolicy, h as resolveToolProfilePolicy, i as collectExplicitAllowlist, l as mergeAlsoAllowPolicy, u as replaceWithEffectiveToolAllowlist } from "./tool-policy-CY4w5sXw.js";
import { n as resolveSandboxRuntimeStatus } from "./runtime-status-Da0m6i2H.js";
import { t as createOpenClawTools } from "./openclaw-tools-BUQsixTe.js";
import { o as resolveSubagentCapabilityStore, t as isSubagentEnvelopeSession } from "./subagent-capabilities-CeOcBGcI.js";
import { i as resolveInheritedToolPolicyForSession, n as resolveEffectiveToolPolicy, o as resolveSubagentToolPolicyForSession, r as resolveGroupToolPolicy } from "./pi-tools.policy-Y73YR7fr.js";
import { t as resolveSenderToolPolicy } from "./sender-tool-policy-D552nBqx.js";
import { i as getPluginToolMeta } from "./tools-Ciw2IILF.js";
import { n as buildDefaultToolPolicyPipelineSteps, t as applyToolPolicyPipeline } from "./tool-policy-pipeline-p6nhuDnG.js";
import { t as extractExplicitGroupId } from "./group-id-BtVMd22R.js";
//#region src/auto-reply/reply/skill-tool-dispatch.runtime.ts
/**
* Policy-enforcement seam for skill `command-dispatch: tool` invocations.
* Keep this aligned with the normal tool surfaces so GHSA-mhm4-93fw-4qr2
* stays closed across allow/deny, group, sandbox, and subagent policy layers.
*/
function resolveSkillDispatchTools(params) {
	const channel = resolveGatewayMessageChannel(params.ctx.Surface) ?? resolveGatewayMessageChannel(params.ctx.Provider) ?? void 0;
	const { agentId: resolvedAgentId, globalPolicy, globalProviderPolicy, agentPolicy, agentProviderPolicy, profile, providerProfile, profileAlsoAllow, providerProfileAlsoAllow } = resolveEffectiveToolPolicy({
		config: params.cfg,
		sessionKey: params.sessionKey,
		agentId: params.agentId,
		modelProvider: params.provider,
		modelId: params.model
	});
	const profilePolicy = resolveToolProfilePolicy(profile);
	const providerProfilePolicy = resolveToolProfilePolicy(providerProfile);
	const profilePolicyWithAlsoAllow = mergeAlsoAllowPolicy(profilePolicy, profileAlsoAllow);
	const providerProfilePolicyWithAlsoAllow = mergeAlsoAllowPolicy(providerProfilePolicy, providerProfileAlsoAllow);
	const groupId = params.sessionEntry?.groupId ?? extractExplicitGroupId(params.ctx.From);
	const groupPolicy = resolveGroupToolPolicy({
		config: params.cfg,
		sessionKey: params.sessionKey,
		spawnedBy: params.sessionEntry?.spawnedBy,
		messageProvider: channel,
		groupId,
		groupChannel: params.sessionEntry?.groupChannel,
		groupSpace: params.sessionEntry?.space,
		accountId: params.ctx.AccountId,
		senderId: params.ctx.SenderId ?? params.senderId,
		senderName: params.ctx.SenderName,
		senderUsername: params.ctx.SenderUsername,
		senderE164: params.ctx.SenderE164
	});
	const senderPolicy = resolveSenderToolPolicy({
		config: params.cfg,
		agentId: resolvedAgentId,
		messageProvider: channel,
		senderId: params.ctx.SenderId ?? params.senderId,
		senderName: params.ctx.SenderName,
		senderUsername: params.ctx.SenderUsername,
		senderE164: params.ctx.SenderE164
	});
	const sandboxRuntime = resolveSandboxRuntimeStatus({
		cfg: params.cfg,
		sessionKey: params.sessionKey
	});
	const sandboxPolicy = sandboxRuntime.sandboxed ? sandboxRuntime.toolPolicy : void 0;
	const subagentStore = resolveSubagentCapabilityStore(params.sessionKey, { cfg: params.cfg });
	const subagentPolicy = isSubagentEnvelopeSession(params.sessionKey, {
		cfg: params.cfg,
		store: subagentStore
	}) ? resolveSubagentToolPolicyForSession(params.cfg, params.sessionKey, { store: subagentStore }) : void 0;
	const inheritedToolPolicy = resolveInheritedToolPolicyForSession(params.cfg, params.sessionKey, { store: subagentStore });
	const explicitPolicyList = [
		profilePolicy,
		providerProfilePolicy,
		globalPolicy,
		globalProviderPolicy,
		agentPolicy,
		agentProviderPolicy,
		groupPolicy,
		senderPolicy,
		sandboxPolicy,
		subagentPolicy,
		inheritedToolPolicy
	];
	const inheritedToolAllowlist = [];
	const beforeToolCallHookContext = params.skillCommand ? {
		cwd: params.workspaceDir,
		workspaceDir: params.workspaceDir,
		...params.sessionEntry?.skillsSnapshot ? { skillsSnapshot: params.sessionEntry.skillsSnapshot } : {},
		skillCommand: {
			commandName: params.skillCommand.name,
			skillName: params.skillCommand.skillName,
			skillSource: params.skillCommand.skillSource ?? "unknown",
			...params.skillCommand.toolName ? { toolName: params.skillCommand.toolName } : {}
		}
	} : void 0;
	const policyFiltered = applyToolPolicyPipeline({
		tools: createOpenClawTools({
			agentSessionKey: params.sessionKey,
			agentChannel: channel,
			agentAccountId: params.ctx.AccountId,
			agentTo: params.ctx.OriginatingTo ?? params.ctx.To,
			agentThreadId: params.ctx.MessageThreadId ?? void 0,
			agentGroupId: groupId,
			agentGroupChannel: params.sessionEntry?.groupChannel,
			agentGroupSpace: params.sessionEntry?.space,
			agentMemberRoleIds: params.ctx.MemberRoleIds,
			agentDir: params.agentDir,
			workspaceDir: params.workspaceDir,
			config: params.cfg,
			allowGatewaySubagentBinding: true,
			sandboxed: sandboxRuntime.sandboxed,
			requesterAgentIdOverride: params.agentId,
			requesterSenderId: params.senderId,
			sessionId: params.sessionEntry?.sessionId,
			currentChannelId: params.currentChannelId,
			...beforeToolCallHookContext ? { beforeToolCallHookContext } : {},
			modelProvider: params.provider,
			modelId: params.model,
			pluginToolAllowlist: collectExplicitAllowlist(explicitPolicyList),
			pluginToolDenylist: collectExplicitDenylist(explicitPolicyList),
			inheritedToolAllowlist,
			inheritedToolDenylist: collectExplicitDenylist(explicitPolicyList)
		}),
		toolMeta: (tool) => getPluginToolMeta(tool),
		warn: logVerbose,
		steps: [
			...buildDefaultToolPolicyPipelineSteps({
				profilePolicy: profilePolicyWithAlsoAllow,
				profile,
				profileUnavailableCoreWarningAllowlist: profilePolicy?.allow,
				providerProfilePolicy: providerProfilePolicyWithAlsoAllow,
				providerProfile,
				providerProfileUnavailableCoreWarningAllowlist: providerProfilePolicy?.allow,
				globalPolicy,
				globalProviderPolicy,
				agentPolicy,
				agentProviderPolicy,
				groupPolicy,
				senderPolicy,
				agentId: resolvedAgentId
			}),
			{
				policy: sandboxPolicy,
				label: "sandbox tools.allow"
			},
			{
				policy: subagentPolicy,
				label: "subagent tools.allow"
			},
			{
				policy: inheritedToolPolicy,
				label: "inherited tools"
			}
		]
	});
	if (explicitPolicyList.some(hasRestrictiveAllowPolicy)) replaceWithEffectiveToolAllowlist(inheritedToolAllowlist, policyFiltered);
	return policyFiltered;
}
//#endregion
export { resolveSkillDispatchTools };
