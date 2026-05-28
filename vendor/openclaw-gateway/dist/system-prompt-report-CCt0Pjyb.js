import "./agent-scope-CudANNo3.js";
import { r as resolveAgentConfig } from "./agent-scope-config-BfxErZq2.js";
import { r as buildBootstrapInjectionStats } from "./bootstrap-budget-CLqQUFdu.js";
import { createHash } from "node:crypto";
//#region src/agents/system-prompt-override.ts
function trimNonEmpty(value) {
	if (typeof value !== "string") return;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : void 0;
}
function resolveSystemPromptOverride(params) {
	const config = params.config;
	if (!config) return;
	const agentOverride = trimNonEmpty(params.agentId ? resolveAgentConfig(config, params.agentId)?.systemPromptOverride : void 0);
	if (agentOverride) return agentOverride;
	return trimNonEmpty(config.agents?.defaults?.systemPromptOverride);
}
//#endregion
//#region src/agents/system-prompt-report.ts
const toolReportEntryCache = /* @__PURE__ */ new WeakMap();
const toolSchemaStatsCache = /* @__PURE__ */ new WeakMap();
function sha256(value) {
	return createHash("sha256").update(value).digest("hex");
}
function normalizeForStableHash(value, seen = /* @__PURE__ */ new WeakSet()) {
	if (typeof value === "bigint") return `${value.toString()}n`;
	if (value && typeof value === "object") {
		if (seen.has(value)) return "[Circular]";
		seen.add(value);
		if (Array.isArray(value)) {
			const normalized = value.map((entry) => normalizeForStableHash(entry, seen));
			seen.delete(value);
			return normalized;
		}
		const record = value;
		const normalized = Object.fromEntries(Object.keys(record).toSorted((left, right) => left.localeCompare(right)).map((key) => [key, normalizeForStableHash(record[key], seen)]));
		seen.delete(value);
		return normalized;
	}
	return value;
}
function stableJsonHash(value) {
	try {
		return sha256(JSON.stringify(normalizeForStableHash(value)) ?? "null");
	} catch {
		return sha256("[unserializable]");
	}
}
function extractBetween(input, startMarker, endMarker) {
	const start = input.indexOf(startMarker);
	if (start === -1) return "";
	const end = input.indexOf(endMarker, start + startMarker.length);
	return end === -1 ? input.slice(start) : input.slice(start, end);
}
function parseSkillBlocks(skillsPrompt) {
	const prompt = skillsPrompt.trim();
	if (!prompt) return [];
	return Array.from(prompt.matchAll(/<skill>[\s\S]*?<\/skill>/gi)).map((match) => match[0] ?? "").map((block) => {
		return {
			name: block.match(/<name>\s*([^<]+?)\s*<\/name>/i)?.[1]?.trim() || "(unknown)",
			blockChars: block.length
		};
	}).filter((b) => b.blockChars > 0);
}
function buildToolSchemaStats(parameters) {
	if (!parameters || typeof parameters !== "object") return {
		schemaChars: 0,
		schemaHash: stableJsonHash(null),
		propertiesCount: null
	};
	const cached = toolSchemaStatsCache.get(parameters);
	if (cached) return cached;
	const stats = {
		schemaChars: (() => {
			try {
				return JSON.stringify(parameters).length;
			} catch {
				return 0;
			}
		})(),
		schemaHash: stableJsonHash(parameters),
		propertiesCount: (() => {
			const schema = parameters;
			const props = typeof schema.properties === "object" ? schema.properties : null;
			if (!props || typeof props !== "object") return null;
			return Object.keys(props).length;
		})()
	};
	toolSchemaStatsCache.set(parameters, stats);
	return stats;
}
function buildToolsEntries(tools) {
	return tools.map((tool) => {
		const cached = toolReportEntryCache.get(tool);
		if (cached) return cached;
		const name = tool.name;
		const summary = tool.description?.trim() || tool.label?.trim() || "";
		const summaryChars = summary.length;
		const schemaStats = buildToolSchemaStats(tool.parameters);
		const entry = {
			name,
			summaryChars,
			summaryHash: sha256(summary),
			...schemaStats
		};
		toolReportEntryCache.set(tool, entry);
		return entry;
	});
}
function measureRenderedProjectContextChars(systemPrompt) {
	return extractBetween(systemPrompt, "\n# Project Context\n", "\n## Silent Replies\n").length;
}
function buildSystemPromptReport(params) {
	const systemPromptChars = params.systemPrompt.length;
	const projectContextChars = measureRenderedProjectContextChars(params.systemPrompt);
	const toolsEntries = buildToolsEntries(params.tools);
	const toolsSchemaChars = toolsEntries.reduce((sum, t) => sum + (t.schemaChars ?? 0), 0);
	const skillsEntries = parseSkillBlocks(params.skillsPrompt);
	return {
		source: params.source,
		generatedAt: params.generatedAt,
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		provider: params.provider,
		model: params.model,
		workspaceDir: params.workspaceDir,
		bootstrapMaxChars: params.bootstrapMaxChars,
		bootstrapTotalMaxChars: params.bootstrapTotalMaxChars,
		...params.bootstrapTruncation ? { bootstrapTruncation: params.bootstrapTruncation } : {},
		sandbox: params.sandbox,
		systemPrompt: {
			chars: systemPromptChars,
			projectContextChars,
			nonProjectContextChars: Math.max(0, systemPromptChars - projectContextChars),
			hash: sha256(params.systemPrompt)
		},
		...params.currentTurn ? { currentTurn: params.currentTurn } : {},
		injectedWorkspaceFiles: buildBootstrapInjectionStats({
			bootstrapFiles: params.bootstrapFiles,
			injectedFiles: params.injectedFiles
		}),
		skills: {
			promptChars: params.skillsPrompt.length,
			hash: sha256(params.skillsPrompt),
			entries: skillsEntries
		},
		tools: {
			listChars: 0,
			schemaChars: toolsSchemaChars,
			entries: toolsEntries
		}
	};
}
//#endregion
export { resolveSystemPromptOverride as n, buildSystemPromptReport as t };
