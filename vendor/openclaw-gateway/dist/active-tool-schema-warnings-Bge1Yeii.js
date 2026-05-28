import { t as sanitizeForLog } from "./ansi-4r6vVvJt.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { i as resolveAgentModelPrimaryValue } from "./model-input-C697EEaR.js";
import "./agent-scope-CudANNo3.js";
import { a as resolveAgentDir, n as listAgentIds, o as resolveAgentWorkspaceDir, r as resolveAgentConfig } from "./agent-scope-config-BfxErZq2.js";
import "./defaults-mDjiWzE5.js";
import { i as parseModelRef } from "./model-selection-normalize-l_jinpMc.js";
import { i as getPluginToolMeta } from "./tools-Ciw2IILF.js";
import { t as createOpenClawCodingTools } from "./pi-tools-B2ovZXCA.js";
import { t as filterRuntimeCompatibleTools } from "./tool-schema-projection-BBX8a1zU.js";
//#region src/commands/doctor/shared/active-tool-schema-warnings.ts
function resolvePrimaryModelRef(cfg, agentModel) {
	return parseModelRef(resolveAgentModelPrimaryValue(agentModel) ?? resolveAgentModelPrimaryValue(cfg.agents?.defaults?.model) ?? "gpt-5.5", "openai", { allowPluginNormalization: false }) ?? {
		provider: "openai",
		model: "gpt-5.5"
	};
}
function formatDiagnostic(params) {
	const plugin = params.pluginId ? ` from plugin "${params.pluginId}"` : "";
	return sanitizeForLog(`- agents.${params.agentId}: active tool "${params.diagnostic.toolName}"${plugin} has unsupported runtime input schema (${params.diagnostic.violations.join(", ")}). OpenClaw will quarantine this tool at runtime; fix or disable the plugin, or remove the tool from active allowlists.`);
}
function collectActiveToolSchemaProjectionWarnings(params) {
	if (params.cfg.plugins?.enabled === false) return [];
	const env = params.env ?? process.env;
	const warnings = [];
	for (const agentId of listAgentIds(params.cfg)) {
		const agentConfig = resolveAgentConfig(params.cfg, agentId);
		const modelRef = resolvePrimaryModelRef(params.cfg, agentConfig?.model);
		let tools;
		try {
			tools = createOpenClawCodingTools({
				agentId,
				agentDir: resolveAgentDir(params.cfg, agentId, env),
				workspaceDir: resolveAgentWorkspaceDir(params.cfg, agentId, env),
				config: params.cfg,
				modelProvider: modelRef.provider,
				modelId: modelRef.model,
				allowGatewaySubagentBinding: true
			});
		} catch (error) {
			warnings.push(sanitizeForLog(`- agents.${agentId}: active tool schema validation could not load the runtime tool set (${formatErrorMessage(error)}). Fix plugin loading errors before relying on assistant tool startup.`));
			continue;
		}
		const projection = filterRuntimeCompatibleTools(tools);
		for (const diagnostic of projection.diagnostics) {
			const tool = tools[diagnostic.toolIndex];
			warnings.push(formatDiagnostic({
				agentId,
				diagnostic,
				...tool ? { pluginId: getPluginToolMeta(tool)?.pluginId } : {}
			}));
		}
	}
	return warnings;
}
//#endregion
export { collectActiveToolSchemaProjectionWarnings as t };
