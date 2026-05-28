import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import "./agent-scope-CudANNo3.js";
import { c as resolveDefaultAgentId, o as resolveAgentWorkspaceDir } from "./agent-scope-config-BfxErZq2.js";
import "./defaults-mDjiWzE5.js";
import { C as findModelInCatalog } from "./model-selection-shared-BuXkxoPc.js";
import { s as resolveDefaultModelForAgent } from "./model-selection-DF4MbMUd.js";
import { n as loadModelCatalog } from "./model-catalog-D4xiPrTf.js";
import { i as getPluginToolMeta } from "./tools-Ciw2IILF.js";
import { t as createOpenClawCodingTools } from "./pi-tools-B2ovZXCA.js";
import { t as supportsModelTools } from "./model-tool-support-D9jCvogW.js";
import { t as createBundleMcpToolRuntime } from "./pi-bundle-mcp-materialize-CJjmpfX1.js";
import "./pi-bundle-mcp-tools-Dx9OBYuL.js";
import { n as normalizeAgentRuntimeTools } from "./tools-C7vgcrF3.js";
import { n as inspectRuntimeToolInputSchemas } from "./tool-schema-projection-BBX8a1zU.js";
import { t as applyFinalEffectiveToolPolicy } from "./effective-tool-policy-B8qKn5SZ.js";
import { a as shouldCreateBundleMcpRuntimeForAttempt } from "./attempt-tool-construction-plan-QmDOQftu.js";
import { t as collectUnavailableAgentSkills } from "./doctor-skills-core-cCtqEFSV.js";
import { t as buildWorkspaceSkillStatus } from "./skills-status-DzhVTDnJ.js";
//#region src/flows/doctor-core-checks.runtime.ts
function detectUnavailableSkills(cfg) {
	const agentId = resolveDefaultAgentId(cfg);
	return collectUnavailableAgentSkills(buildWorkspaceSkillStatus(resolveAgentWorkspaceDir(cfg, agentId), {
		config: cfg,
		agentId
	}));
}
function buildDoctorRuntimeModel(params) {
	const provider = params.provider || "openai";
	const id = params.modelId || "gpt-5.5";
	const api = provider === "openai-codex" ? "openai-codex-responses" : provider === "openai" ? "openai-responses" : void 0;
	const baseUrl = provider === "openai-codex" ? "https://chatgpt.com/backend-api" : provider === "openai" ? "https://api.openai.com/v1" : void 0;
	return {
		...params.entry,
		provider,
		id,
		name: params.entry?.name ?? id,
		...api ? { api } : {},
		...baseUrl ? { baseUrl } : {}
	};
}
function toolSchemaDiagnosticToFinding(params) {
	const tool = params.tools[params.diagnostic.toolIndex];
	const pluginId = tool ? getPluginToolMeta(tool)?.pluginId : void 0;
	const owner = pluginId ? ` from plugin ${pluginId}` : "";
	const path = pluginId === "bundle-mcp" ? "mcp.servers" : pluginId ? `plugins.entries.${pluginId}` : `tools.${params.diagnostic.toolName}`;
	const fixHint = pluginId === "bundle-mcp" ? "Disable or update the offending MCP server/tool so its parameters are a JSON object schema, then rerun doctor." : "Disable or update the offending plugin/tool so its parameters are a JSON object schema, then rerun doctor.";
	return {
		checkId: "core/doctor/runtime-tool-schemas",
		severity: "error",
		message: `Tool ${params.diagnostic.toolName}${owner} has an unsupported input schema for runtime projection.`,
		path,
		target: params.diagnostic.toolName,
		requirement: params.diagnostic.violations.join(", "),
		fixHint
	};
}
function collectToolSchemaFindings(tools) {
	return inspectRuntimeToolInputSchemas(tools).map((diagnostic) => toolSchemaDiagnosticToFinding({
		tools,
		diagnostic
	}));
}
async function collectBundleMcpRuntimeToolSchemaFindings(params) {
	if (!shouldCreateBundleMcpRuntimeForAttempt({ toolsEnabled: true })) return [];
	let bundleRuntime;
	try {
		bundleRuntime = await createBundleMcpToolRuntime({
			workspaceDir: params.workspaceDir,
			cfg: params.cfg
		});
		return collectToolSchemaFindings(normalizeAgentRuntimeTools({
			tools: applyFinalEffectiveToolPolicy({
				bundledTools: bundleRuntime.tools,
				config: params.cfg,
				agentId: params.agentId,
				modelProvider: params.modelRef.provider,
				modelId: params.modelRef.model,
				warn: () => {}
			}),
			provider: params.modelRef.provider,
			config: params.cfg,
			workspaceDir: params.workspaceDir,
			env: process.env,
			modelId: params.modelRef.model,
			modelApi: params.model.api,
			model: params.model
		}));
	} catch (error) {
		return [{
			checkId: "core/doctor/runtime-tool-schemas",
			severity: "error",
			message: "Configured MCP tool schema validation could not load the runtime tool set.",
			path: "mcp.servers",
			requirement: formatErrorMessage(error),
			fixHint: "Fix or disable the offending MCP server, then rerun doctor before relying on assistant tool startup."
		}];
	} finally {
		await bundleRuntime?.dispose();
	}
}
async function collectRuntimeToolSchemaFindings(cfg) {
	const agentId = resolveDefaultAgentId(cfg);
	const workspaceDir = resolveAgentWorkspaceDir(cfg, agentId);
	const modelRef = resolveDefaultModelForAgent({
		cfg,
		agentId,
		allowPluginNormalization: true
	});
	const model = buildDoctorRuntimeModel({
		entry: findModelInCatalog(await loadModelCatalog({ config: cfg }), modelRef.provider, modelRef.model),
		provider: modelRef.provider,
		modelId: modelRef.model
	});
	if (!supportsModelTools(model)) return [];
	return [...collectToolSchemaFindings(normalizeAgentRuntimeTools({
		tools: createOpenClawCodingTools({
			agentId,
			workspaceDir,
			config: cfg,
			modelProvider: modelRef.provider,
			modelId: modelRef.model,
			modelApi: model.api,
			modelCompat: model.compat,
			modelContextWindowTokens: model.contextWindow,
			allowGatewaySubagentBinding: true,
			emitBeforeToolCallDiagnostics: false
		}),
		provider: modelRef.provider,
		config: cfg,
		workspaceDir,
		env: process.env,
		modelId: modelRef.model,
		modelApi: model.api,
		model
	})), ...await collectBundleMcpRuntimeToolSchemaFindings({
		cfg,
		agentId,
		workspaceDir,
		modelRef,
		model
	})];
}
//#endregion
export { collectRuntimeToolSchemaFindings, detectUnavailableSkills };
