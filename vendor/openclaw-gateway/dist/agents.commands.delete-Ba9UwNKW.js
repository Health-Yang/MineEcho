import { t as formatCliCommand } from "./command-format-CItqrBX6.js";
import "./agent-scope-CudANNo3.js";
import { l as normalizeAgentId, t as DEFAULT_AGENT_ID } from "./session-key-yaI3D3Bl.js";
import { a as resolveAgentDir, o as resolveAgentWorkspaceDir, t as listAgentEntries } from "./agent-scope-config-BfxErZq2.js";
import { n as defaultRuntime, r as writeRuntimeJson } from "./runtime-yzlkhCoS.js";
import { i as replaceConfigFile } from "./mutate-CxD4vMnm.js";
import "./config-BtNBbhZb.js";
import { i as GATEWAY_CLIENT_NAMES, r as GATEWAY_CLIENT_MODES } from "./client-info-BxgIUTRt.js";
import "./message-channel-CD8Rw4Ab.js";
import { l as isGatewayTransportError, r as callGateway } from "./call-D_O83KsN.js";
import { l as resolveSessionTranscriptsDirForAgent } from "./paths-DZXdqwOo.js";
import { t as purgeAgentSessionStoreEntries } from "./sessions-Ct4mpWsk.js";
import { t as createClackPrompter } from "./clack-prompter-CadwG3yA.js";
import { r as logConfigUpdated } from "./logging-MS6xnFJj.js";
import { s as moveToTrash } from "./onboard-helpers-CIDKr3aI.js";
import { r as requireValidConfigFileSnapshot, t as createQuietRuntime } from "./agents.command-shared-B_vku1Cw.js";
import { a as pruneAgentConfig, r as findAgentEntryIndex } from "./agents.config-DuGhb0p2.js";
import { t as findOverlappingWorkspaceAgentIds } from "./agent-delete-safety-BITqjEp6.js";
//#region src/commands/agents.commands.delete.ts
async function maybeDeleteAgentThroughGateway(params) {
	try {
		return await callGateway({
			method: "agents.delete",
			params: {
				agentId: params.agentId,
				deleteFiles: params.deleteFiles
			},
			mode: GATEWAY_CLIENT_MODES.CLI,
			clientName: GATEWAY_CLIENT_NAMES.CLI,
			requiredMethods: ["agents.delete"]
		});
	} catch (error) {
		if (isGatewayTransportError(error)) return null;
		throw error;
	}
}
async function agentsDeleteCommand(opts, runtime = defaultRuntime) {
	const configSnapshot = await requireValidConfigFileSnapshot(runtime);
	if (!configSnapshot) return;
	const cfg = configSnapshot.sourceConfig ?? configSnapshot.config;
	const baseHash = configSnapshot.hash;
	const input = opts.id?.trim();
	if (!input) {
		runtime.error(`Agent id is required. Run ${formatCliCommand("openclaw agents list")} to choose one.`);
		runtime.exit(1);
		return;
	}
	const agentId = normalizeAgentId(input);
	if (agentId !== input) runtime.log(`Normalized agent id to "${agentId}".`);
	if (agentId === "main") {
		runtime.error(`"${DEFAULT_AGENT_ID}" cannot be deleted.`);
		runtime.exit(1);
		return;
	}
	if (findAgentEntryIndex(listAgentEntries(cfg), agentId) < 0) {
		runtime.error(`Agent "${agentId}" not found. Run ${formatCliCommand("openclaw agents list")} to see configured agents.`);
		runtime.exit(1);
		return;
	}
	if (!opts.force) {
		if (!process.stdin.isTTY) {
			runtime.error("Non-interactive session. Re-run with --force.");
			runtime.exit(1);
			return;
		}
		if (!await createClackPrompter().confirm({
			message: `Delete agent "${agentId}" and prune workspace/state?`,
			initialValue: false
		})) {
			runtime.log("Cancelled.");
			return;
		}
	}
	const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
	const agentDir = resolveAgentDir(cfg, agentId);
	const sessionsDir = resolveSessionTranscriptsDirForAgent(agentId);
	const result = pruneAgentConfig(cfg, agentId);
	const gatewayResult = await maybeDeleteAgentThroughGateway({
		agentId,
		deleteFiles: true
	});
	if (gatewayResult) {
		const workspaceSharedWith = findOverlappingWorkspaceAgentIds(cfg, agentId, workspaceDir);
		const workspaceRetained = workspaceSharedWith.length > 0;
		if (opts.json) writeRuntimeJson(runtime, {
			agentId,
			workspace: workspaceDir,
			workspaceRetained: workspaceRetained || void 0,
			workspaceRetainedReason: workspaceRetained ? "shared" : void 0,
			workspaceSharedWith: workspaceRetained ? workspaceSharedWith : void 0,
			agentDir,
			sessionsDir,
			removedBindings: gatewayResult.removedBindings,
			removedAllow: result.removedAllow,
			transport: "gateway"
		});
		else runtime.log(`Deleted agent: ${agentId}`);
		return;
	}
	await replaceConfigFile({
		nextConfig: result.config,
		...baseHash !== void 0 ? { baseHash } : {},
		writeOptions: opts.json ? { skipOutputLogs: true } : void 0
	});
	if (!opts.json) logConfigUpdated(runtime);
	await purgeAgentSessionStoreEntries(cfg, agentId);
	const quietRuntime = opts.json ? createQuietRuntime(runtime) : runtime;
	const workspaceSharedWith = findOverlappingWorkspaceAgentIds(cfg, agentId, workspaceDir);
	const workspaceRetained = workspaceSharedWith.length > 0;
	if (workspaceRetained) quietRuntime.log(`Skipped workspace removal (shared with other agents: ${workspaceSharedWith.join(", ")}): ${workspaceDir}`);
	else await moveToTrash(workspaceDir, quietRuntime);
	await moveToTrash(agentDir, quietRuntime);
	await moveToTrash(sessionsDir, quietRuntime);
	if (opts.json) writeRuntimeJson(runtime, {
		agentId,
		workspace: workspaceDir,
		workspaceRetained: workspaceRetained || void 0,
		workspaceRetainedReason: workspaceRetained ? "shared" : void 0,
		workspaceSharedWith: workspaceRetained ? workspaceSharedWith : void 0,
		agentDir,
		sessionsDir,
		removedBindings: result.removedBindings,
		removedAllow: result.removedAllow
	});
	else runtime.log(`Deleted agent: ${agentId}`);
}
//#endregion
export { agentsDeleteCommand };
