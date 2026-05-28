import { t as resolveOpenClawPackageRoot } from "./openclaw-root-CNp1Ofdk.js";
import { n as resolveCliName } from "./cli-name-C-K1n6ar.js";
import { t as note } from "./note-C22zwxbl.js";
import { a as installCompletion, c as resolveCompletionCachePath, d as usesSlowDynamicCompletion, i as formatCompletionReloadCommand, l as resolveCompletionProfilePath, o as isCompletionInstalled, r as completionCacheExists, u as resolveShellFromEnv } from "./completion-runtime-CLs4Bs9X.js";
import path from "node:path";
import { spawnSync } from "node:child_process";
//#region src/commands/doctor-completion.ts
const COMPLETION_CACHE_WRITE_TIMEOUT_MS = 3e4;
function resolveCompletionReloadPath(shell) {
	if (shell === "powershell") return resolveCompletionProfilePath("powershell");
	return `~/.${shell === "zsh" ? "zshrc" : shell === "bash" ? "bashrc" : "config/fish/config.fish"}`;
}
function formatCompletionReloadNote(shell, action) {
	return `Shell completion ${action}. Restart your shell or run: ${formatCompletionReloadCommand(shell, resolveCompletionReloadPath(shell))}`;
}
/** Generate the completion cache by spawning the CLI. */
async function generateCompletionCache() {
	const root = await resolveOpenClawPackageRoot({
		moduleUrl: import.meta.url,
		argv1: process.argv[1],
		cwd: process.cwd()
	});
	if (!root) return false;
	const binPath = path.join(root, "openclaw.mjs");
	return spawnSync(process.execPath, [
		binPath,
		"completion",
		"--write-state"
	], {
		cwd: root,
		env: process.env,
		encoding: "utf-8",
		timeout: COMPLETION_CACHE_WRITE_TIMEOUT_MS
	}).status === 0;
}
/** Check the status of shell completion for the current shell. */
async function checkShellCompletionStatus(binName = "openclaw") {
	const shell = resolveShellFromEnv();
	return {
		shell,
		profileInstalled: await isCompletionInstalled(shell, binName),
		cacheExists: await completionCacheExists(shell, binName),
		cachePath: resolveCompletionCachePath(shell, binName),
		usesSlowPattern: await usesSlowDynamicCompletion(shell, binName)
	};
}
function shellCompletionStatusToHealthFindings(status) {
	const checkId = "core/doctor/shell-completion";
	const path = `shellCompletion.${status.shell}`;
	if (status.usesSlowPattern) return [{
		checkId,
		severity: "info",
		message: `Your ${status.shell} profile uses slow dynamic completion (source <(...)).`,
		path,
		fixHint: "Run `openclaw doctor --fix` to upgrade to cached completion."
	}];
	if (status.profileInstalled && !status.cacheExists) return [{
		checkId,
		severity: "info",
		message: `Shell completion is configured in your ${status.shell} profile but the cache is missing.`,
		path,
		fixHint: `Run \`openclaw completion --write-state\` or \`openclaw doctor --fix\` to regenerate ${status.cachePath}.`
	}];
	return [];
}
function shellCompletionStatusToRepairEffects(status) {
	const effects = [];
	if (status.usesSlowPattern && !status.cacheExists) effects.push({
		kind: "state",
		action: "would-generate-completion-cache",
		target: status.cachePath,
		dryRunSafe: true
	});
	if (status.usesSlowPattern) effects.push({
		kind: "file",
		action: "would-upgrade-shell-profile-completion",
		target: status.shell,
		dryRunSafe: false
	});
	else if (status.profileInstalled && !status.cacheExists) effects.push({
		kind: "state",
		action: "would-regenerate-completion-cache",
		target: status.cachePath,
		dryRunSafe: true
	});
	return effects;
}
/**
* Doctor check for shell completion.
* - If profile uses slow dynamic pattern: upgrade to cached version
* - If profile has completion but no cache: auto-generate cache and upgrade profile
* - If no completion at all: prompt to install (with user confirmation)
*/
async function doctorShellCompletion(_runtime, prompter, options = {}) {
	const cliName = resolveCliName();
	const status = await checkShellCompletionStatus(cliName);
	if (status.usesSlowPattern) {
		note(`Your ${status.shell} profile uses slow dynamic completion (source <(...)).\nUpgrading to cached completion for faster shell startup...`, "Shell completion");
		if (!status.cacheExists) {
			if (!await generateCompletionCache()) {
				note(`Failed to generate completion cache. Run \`${cliName} completion --write-state\` manually.`, "Shell completion");
				return;
			}
		}
		await installCompletion(status.shell, true, cliName);
		note(formatCompletionReloadNote(status.shell, "upgraded"), "Shell completion");
		return;
	}
	if (status.profileInstalled && !status.cacheExists) {
		note(`Shell completion is configured in your ${status.shell} profile but the cache is missing.\nRegenerating cache...`, "Shell completion");
		if (await generateCompletionCache()) note(`Completion cache regenerated at ${status.cachePath}`, "Shell completion");
		else note(`Failed to regenerate completion cache. Run \`${cliName} completion --write-state\` manually.`, "Shell completion");
		return;
	}
	if (!status.profileInstalled) {
		if (options.nonInteractive) return;
		if (await prompter.confirm({
			message: `Enable ${status.shell} shell completion for ${cliName}?`,
			initialValue: true
		})) {
			if (!await generateCompletionCache()) {
				note(`Failed to generate completion cache. Run \`${cliName} completion --write-state\` manually.`, "Shell completion");
				return;
			}
			await installCompletion(status.shell, true, cliName);
			note(formatCompletionReloadNote(status.shell, "installed"), "Shell completion");
		}
	}
}
/**
* Ensure completion cache exists. Used during setup/update to fix
* cases where profile has completion but no cache.
* This is a silent fix - no prompts.
*/
async function ensureCompletionCacheExists(binName = "openclaw") {
	if (await completionCacheExists(resolveShellFromEnv(), binName)) return true;
	return generateCompletionCache();
}
//#endregion
export { shellCompletionStatusToRepairEffects as a, shellCompletionStatusToHealthFindings as i, doctorShellCompletion as n, ensureCompletionCacheExists as r, checkShellCompletionStatus as t };
