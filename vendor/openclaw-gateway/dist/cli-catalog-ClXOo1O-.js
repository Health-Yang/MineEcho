import { n as CLAUDE_CLI_DEFAULT_ALLOWLIST_REFS, t as CLAUDE_CLI_BACKEND_ID } from "./cli-constants-BxhhDXHI.js";
//#region extensions/anthropic/cli-catalog.ts
const CLAUDE_CLI_DEFAULT_CONTEXT_WINDOW = 2e5;
const CLAUDE_CLI_MODEL_LABELS = {
	"claude-opus-4-7": "Claude Opus 4.7 (Claude CLI)",
	"claude-opus-4-6": "Claude Opus 4.6 (Claude CLI)",
	"claude-sonnet-4-6": "Claude Sonnet 4.6 (Claude CLI)"
};
function resolveClaudeCliImageMediaInput(id) {
	const maxSidePx = id === "claude-opus-4-7" ? 2576 : 1568;
	return { image: {
		maxSidePx,
		preferredSidePx: maxSidePx,
		tokenMode: "provider"
	} };
}
function extractClaudeCliModelIds() {
	const ids = [];
	const seen = /* @__PURE__ */ new Set();
	for (const ref of CLAUDE_CLI_DEFAULT_ALLOWLIST_REFS) {
		if (!ref.startsWith(`claude-cli/`)) continue;
		const id = ref.slice(CLAUDE_CLI_BACKEND_ID.length + 1);
		if (id.length === 0 || seen.has(id)) continue;
		seen.add(id);
		ids.push(id);
	}
	return ids;
}
function buildClaudeCliCatalogEntries() {
	return extractClaudeCliModelIds().map((id) => ({
		id,
		name: CLAUDE_CLI_MODEL_LABELS[id] ?? `${id} (Claude CLI)`,
		provider: CLAUDE_CLI_BACKEND_ID,
		reasoning: true,
		input: ["text", "image"],
		mediaInput: resolveClaudeCliImageMediaInput(id),
		contextWindow: CLAUDE_CLI_DEFAULT_CONTEXT_WINDOW
	}));
}
//#endregion
export { buildClaudeCliCatalogEntries as t };
