import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import "./string-coerce-runtime-qOd7_06l.js";
import { i as CLAUDE_CLI_MODEL_ALIASES } from "./cli-constants-BxhhDXHI.js";
//#region extensions/anthropic/claude-model-refs.ts
const DEFAULT_CLAUDE_MODEL_BY_FAMILY = {
	opus: "claude-opus-4-7",
	sonnet: "claude-sonnet-4-6",
	haiku: "claude-sonnet-4-6"
};
function splitTrailingModelAuthProfile(raw) {
	const trimmed = raw.trim();
	if (!trimmed) return { model: "" };
	const lastSlash = trimmed.lastIndexOf("/");
	let delimiter = trimmed.indexOf("@", lastSlash + 1);
	if (delimiter <= 0) return { model: trimmed };
	if (/^\d{8}(?:@|$)/.test(trimmed.slice(delimiter + 1))) {
		const nextDelimiter = trimmed.indexOf("@", delimiter + 9);
		if (nextDelimiter < 0) return { model: trimmed };
		delimiter = nextDelimiter;
	}
	const model = trimmed.slice(0, delimiter).trim();
	const profile = trimmed.slice(delimiter + 1).trim();
	return model && profile ? {
		model,
		profile
	} : { model: trimmed };
}
function attachModelAuthProfile(model, profile) {
	return profile ? `${model}@${profile}` : model;
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
function parseProviderModelRef(raw, defaultProvider) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const slashIndex = trimmed.indexOf("/");
	if (slashIndex <= 0) return {
		provider: defaultProvider,
		model: trimmed,
		explicitProvider: false
	};
	const provider = trimmed.slice(0, slashIndex).trim();
	const model = trimmed.slice(slashIndex + 1).trim();
	if (!provider || !model) return null;
	return {
		provider: normalizeLowercaseStringOrEmpty(provider),
		model,
		explicitProvider: true
	};
}
function canonicalizeKnownClaudeCliModelId(modelId) {
	const split = splitTrailingModelAuthProfile(modelId);
	const trimmed = split.model.trim();
	const normalized = normalizeLowercaseStringOrEmpty(trimmed);
	if (!normalized) return null;
	const upgraded = upgradeOldClaudeModelId(normalized);
	if (upgraded) return attachModelAuthProfile(upgraded, split.profile);
	if (normalized.startsWith("claude-")) return attachModelAuthProfile(trimmed, split.profile);
	const defaultModel = DEFAULT_CLAUDE_MODEL_BY_FAMILY[normalized];
	if (defaultModel) return attachModelAuthProfile(defaultModel, split.profile);
	const family = CLAUDE_CLI_MODEL_ALIASES[normalized];
	if (!family) return null;
	const version = normalized.slice(`${family}-`.length);
	if (!version || version === normalized) return null;
	return attachModelAuthProfile(`claude-${family}-${version.replaceAll(".", "-")}`, split.profile);
}
function upgradeOldClaudeModelId(normalized) {
	if (normalized.startsWith("claude-opus-4-7") || normalized.startsWith("claude-opus-4.7")) return null;
	if (normalized.startsWith("claude-opus-4-6") || normalized.startsWith("claude-opus-4.6")) return null;
	if (normalized.startsWith("claude-sonnet-4-6") || normalized.startsWith("claude-sonnet-4.6")) return null;
	if (normalized === "claude-opus-4" || hasAnyRetiredVersionPrefix(normalized, [
		"claude-opus-4-5",
		"claude-opus-4.5",
		"claude-opus-4-1",
		"claude-opus-4.1",
		"claude-opus-4-0",
		"claude-opus-4.0"
	]) || /^claude-opus-4-20\d{6}/.test(normalized)) return "claude-opus-4-7";
	if (normalized === "claude-sonnet-4" || hasAnyRetiredVersionPrefix(normalized, [
		"claude-sonnet-4-5",
		"claude-sonnet-4.5",
		"claude-sonnet-4-1",
		"claude-sonnet-4.1",
		"claude-sonnet-4-0",
		"claude-sonnet-4.0",
		"claude-haiku-4-5",
		"claude-haiku-4.5"
	]) || /^claude-sonnet-4-20\d{6}/.test(normalized)) return "claude-sonnet-4-6";
	if (normalized.startsWith("claude-3") && normalized.includes("opus")) return "claude-opus-4-7";
	if (normalized.startsWith("claude-3") && (normalized.includes("sonnet") || normalized.includes("haiku"))) return "claude-sonnet-4-6";
	if (normalized === "opus-4.5" || normalized === "opus-4.1" || normalized === "opus-4" || normalized === "opus-3") return "claude-opus-4-7";
	if (normalized === "sonnet-4.5" || normalized === "sonnet-4.1" || normalized === "sonnet-4.0" || normalized === "sonnet-4" || normalized === "sonnet-3.7" || normalized === "sonnet-3.5" || normalized === "sonnet-3" || normalized === "haiku-4.5" || normalized === "haiku-3.5" || normalized === "haiku-3") return "claude-sonnet-4-6";
	return null;
}
function resolveClaudeCliAnthropicModelRefs(raw) {
	const parsed = parseProviderModelRef(raw, "anthropic");
	if (!parsed) return null;
	if (parsed.provider !== "anthropic" && parsed.provider !== "claude-cli") return null;
	const selectedRef = `anthropic/${parsed.model}`;
	const runtimeRefs = new Set([selectedRef]);
	const canonicalModelId = canonicalizeKnownClaudeCliModelId(parsed.model);
	if (!parsed.explicitProvider && !canonicalModelId) return null;
	const rewriteRef = canonicalModelId || parsed.provider === "claude-cli" ? `anthropic/${canonicalModelId ?? parsed.model}` : void 0;
	if (rewriteRef) runtimeRefs.add(rewriteRef);
	return {
		selectedRef,
		runtimeRefs: [...runtimeRefs],
		...rewriteRef ? { rewriteRef } : {}
	};
}
function resolveKnownAnthropicModelRef(raw) {
	if (!raw) return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;
	return resolveClaudeCliAnthropicModelRefs(trimmed)?.rewriteRef ?? trimmed;
}
//#endregion
export { resolveKnownAnthropicModelRef as n, resolveClaudeCliAnthropicModelRefs as t };
