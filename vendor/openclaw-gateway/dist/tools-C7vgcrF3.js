import { _ as normalizeProviderToolSchemasWithPlugin, f as inspectProviderToolSchemasWithPlugin } from "./provider-runtime-CGENk1Ok.js";
import { t as log } from "./logger-DLLDK9dc.js";
//#region src/agents/pi-embedded-runner/tool-schema-runtime.ts
function buildProviderToolSchemaContext(params, provider) {
	return {
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		provider,
		modelId: params.modelId,
		modelApi: params.modelApi,
		model: params.model,
		tools: params.tools
	};
}
/**
* Runs provider-owned tool-schema normalization without encoding provider
* families in the embedded runner.
*/
function normalizeProviderToolSchemas(params) {
	const provider = params.provider.trim();
	const pluginNormalized = normalizeProviderToolSchemasWithPlugin({
		provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		runtimeHandle: params.runtimeHandle,
		context: buildProviderToolSchemaContext(params, provider)
	});
	return Array.isArray(pluginNormalized) ? pluginNormalized : params.tools;
}
/**
* Logs provider-owned tool-schema diagnostics after normalization.
*/
function logProviderToolSchemaDiagnostics(params) {
	const provider = params.provider.trim();
	const diagnostics = inspectProviderToolSchemasWithPlugin({
		provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env,
		runtimeHandle: params.runtimeHandle,
		context: buildProviderToolSchemaContext(params, provider)
	});
	if (!Array.isArray(diagnostics)) return;
	if (diagnostics.length === 0) return;
	const summary = summarizeProviderToolSchemaDiagnostics(diagnostics);
	log.warn(`provider tool schema diagnostics: ${diagnostics.length} ${diagnostics.length === 1 ? "tool" : "tools"} for ${params.provider}: ${summary}`, {
		provider: params.provider,
		toolCount: params.tools.length,
		diagnosticCount: diagnostics.length,
		tools: params.tools.map((tool, index) => `${index}:${tool.name}`),
		diagnostics: diagnostics.map((diagnostic) => ({
			index: diagnostic.toolIndex,
			tool: diagnostic.toolName,
			violations: diagnostic.violations.slice(0, 12),
			violationCount: diagnostic.violations.length
		}))
	});
}
function summarizeProviderToolSchemaDiagnostics(diagnostics) {
	const visible = diagnostics.slice(0, 6).map((diagnostic) => {
		const violationCount = diagnostic.violations.length;
		return `${diagnostic.toolName || "unknown"} (${violationCount} ${violationCount === 1 ? "violation" : "violations"})`;
	});
	const remaining = diagnostics.length - visible.length;
	return remaining > 0 ? `${visible.join(", ")}, +${remaining} more` : visible.join(", ");
}
//#endregion
//#region src/agents/runtime-plan/tools.ts
function runtimePlanToolContext(params) {
	return {
		workspaceDir: params.workspaceDir,
		modelApi: params.modelApi ?? void 0,
		model: params.model
	};
}
function normalizeAgentRuntimeTools(params) {
	const planContext = runtimePlanToolContext(params);
	return params.runtimePlan?.tools.normalize(params.tools, planContext) ?? normalizeProviderToolSchemas({
		tools: params.tools,
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env,
		modelId: params.modelId,
		modelApi: params.modelApi,
		model: params.model
	});
}
function logAgentRuntimeToolDiagnostics(params) {
	const planContext = runtimePlanToolContext(params);
	if (params.runtimePlan) {
		params.runtimePlan.tools.logDiagnostics(params.tools, planContext);
		return;
	}
	logProviderToolSchemaDiagnostics({
		tools: params.tools,
		provider: params.provider,
		config: params.config,
		workspaceDir: params.workspaceDir,
		env: params.env ?? process.env,
		modelId: params.modelId,
		modelApi: params.modelApi,
		model: params.model
	});
}
//#endregion
export { normalizeProviderToolSchemas as i, normalizeAgentRuntimeTools as n, logProviderToolSchemaDiagnostics as r, logAgentRuntimeToolDiagnostics as t };
