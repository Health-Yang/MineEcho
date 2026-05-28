//#region src/config/recovery-policy.ts
const PLUGIN_ENTRY_PATH_PREFIX = "plugins.entries.";
const PLUGIN_POLICY_PATHS = new Set(["plugins.allow", "plugins.deny"]);
const COMPILED_RUNTIME_OUTPUT_DIAGNOSTIC = "compiled runtime output";
const PLUGIN_DIAGNOSTIC_PREFIX_PATTERN = /^plugin\s+([^:\s]+):\s/u;
const PLUGIN_NOT_FOUND_PATTERN = /^plugin not found:\s*([^\s(]+)/u;
function isPluginsPath(path) {
	return path === "plugins" || path.startsWith("plugins.");
}
function isPluginEntryIssue(issue) {
	const path = issue.path.trim();
	if (!path.startsWith(PLUGIN_ENTRY_PATH_PREFIX)) return false;
	return path.slice(16).trim().length > 0;
}
function isPluginPolicyIssue(issue) {
	return PLUGIN_POLICY_PATHS.has(issue.path.trim()) && issue.message.trim().startsWith("plugin not found:");
}
function isPluginPackagingRuntimeOutputIssue(issue) {
	const path = issue.path.trim();
	const message = issue.message.trim().toLowerCase();
	return isPluginsPath(path) && message.includes(COMPILED_RUNTIME_OUTPUT_DIAGNOSTIC);
}
function isPluginPackagingFalloutIssue(issue) {
	const path = issue.path.trim();
	const message = issue.message.trim();
	return isPluginsPath(path) && message.startsWith("plugin not found:");
}
function normalizePluginIssueId(value) {
	const normalized = value?.trim().toLowerCase();
	return normalized ? normalized : null;
}
function extractPluginPackagingRuntimeOutputPluginId(issue) {
	if (!isPluginPackagingRuntimeOutputIssue(issue)) return null;
	return normalizePluginIssueId(PLUGIN_DIAGNOSTIC_PREFIX_PATTERN.exec(issue.message.trim())?.[1]);
}
function extractPluginNotFoundIssuePluginId(issue) {
	if (!isPluginPackagingFalloutIssue(issue)) return null;
	return normalizePluginIssueId(PLUGIN_NOT_FOUND_PATTERN.exec(issue.message.trim())?.[1]);
}
/**
* Returns true when an invalid config snapshot is blocked by an installed plugin
* package that shipped TypeScript source without compiled JavaScript output.
*/
function isPluginPackagingRuntimeOutputInvalidConfigSnapshot(snapshot) {
	if (snapshot.valid || (snapshot.legacyIssues?.length ?? 0) > 0 || snapshot.issues.length === 0) return false;
	const packagingIssues = [...snapshot.issues, ...snapshot.warnings ?? []].filter(isPluginPackagingRuntimeOutputIssue);
	const packagingPluginIds = new Set(packagingIssues.map((issue) => extractPluginPackagingRuntimeOutputPluginId(issue)).filter((pluginId) => pluginId !== null));
	return packagingIssues.length > 0 && snapshot.issues.every((issue) => {
		if (isPluginPackagingRuntimeOutputIssue(issue)) return true;
		const pluginId = extractPluginNotFoundIssuePluginId(issue);
		return pluginId !== null && packagingPluginIds.has(pluginId);
	});
}
/**
* Returns true when an invalid config snapshot is scoped entirely to stale plugin refs.
*/
function isPluginLocalInvalidConfigSnapshot(snapshot) {
	if (snapshot.valid || snapshot.legacyIssues.length > 0 || snapshot.issues.length === 0) return false;
	return snapshot.issues.every((issue) => isPluginEntryIssue(issue) || isPluginPolicyIssue(issue));
}
/**
* Decides whether whole-file last-known-good recovery is safe for a snapshot.
*/
function shouldAttemptLastKnownGoodRecovery(snapshot) {
	if (snapshot.valid) return false;
	return !isPluginLocalInvalidConfigSnapshot(snapshot);
}
//#endregion
export { shouldAttemptLastKnownGoodRecovery as i, isPluginPackagingRuntimeOutputInvalidConfigSnapshot as n, isPluginPackagingRuntimeOutputIssue as r, isPluginLocalInvalidConfigSnapshot as t };
