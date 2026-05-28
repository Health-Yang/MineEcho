import { t as formatCliCommand } from "./command-format-CItqrBX6.js";
import { t as formatDocsLink } from "./links-CM5vg8_V.js";
import { n as isRich, r as theme } from "./theme-D58JpUfy.js";
import { n as defaultRuntime } from "./runtime-yzlkhCoS.js";
import { n as runCommandWithRuntime } from "./cli-utils-CE0a8Qvx.js";
//#region src/commands/docs.ts
const SEARCH_API = "https://docs.openclaw.ai/api/search";
const SEARCH_TIMEOUT_MS = 3e4;
function escapeMarkdown(text) {
	return text.replace(/[()[\]]/g, "\\$&");
}
function buildMarkdown(query, results) {
	const lines = [`# Docs search: ${escapeMarkdown(query)}`, ""];
	if (results.length === 0) {
		lines.push("_No results._");
		return lines.join("\n");
	}
	for (const item of results) {
		const title = escapeMarkdown(item.title);
		const snippet = item.snippet ? escapeMarkdown(item.snippet) : "";
		const suffix = snippet ? ` - ${snippet}` : "";
		lines.push(`- [${title}](${item.link})${suffix}`);
	}
	return lines.join("\n");
}
function formatLinkLabel(link) {
	return link.replace(/^https?:\/\//i, "");
}
function renderRichResults(query, results, runtime) {
	runtime.log(`${theme.heading("Docs search:")} ${theme.info(query)}`);
	if (results.length === 0) {
		runtime.log(theme.muted("No results."));
		return;
	}
	for (const item of results) {
		const linkLabel = formatLinkLabel(item.link);
		const link = formatDocsLink(item.link, linkLabel);
		runtime.log(`${theme.muted("-")} ${theme.command(item.title)} ${theme.muted("(")}${link}${theme.muted(")")}`);
		if (item.snippet) runtime.log(`  ${theme.muted(item.snippet)}`);
	}
}
async function renderMarkdown(markdown, runtime) {
	runtime.log(markdown.trimEnd());
}
async function fetchDocsSearch(query) {
	const url = new URL(SEARCH_API);
	url.searchParams.set("q", query);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
	try {
		const response = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: controller.signal
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return parseDocsSearchResults((await response.json()).results);
	} finally {
		clearTimeout(timeout);
	}
}
function parseDocsSearchResults(raw) {
	if (!Array.isArray(raw)) return [];
	const results = [];
	for (const item of raw) {
		if (!item || typeof item !== "object") continue;
		const entry = item;
		if (typeof entry.title !== "string" || typeof entry.link !== "string") continue;
		results.push({
			title: entry.title,
			link: entry.link,
			snippet: typeof entry.snippet === "string" && entry.snippet.trim() ? entry.snippet : void 0
		});
	}
	return results;
}
async function docsSearchCommand(queryParts, runtime) {
	const query = queryParts.join(" ").trim();
	if (!query) {
		const docs = formatDocsLink("/", "docs.openclaw.ai");
		if (isRich()) {
			runtime.log(`${theme.muted("Docs:")} ${docs}`);
			runtime.log(`${theme.muted("Search:")} ${formatCliCommand("openclaw docs \"your query\"")}`);
		} else {
			runtime.log("Docs: https://docs.openclaw.ai/");
			runtime.log(`Search: ${formatCliCommand("openclaw docs \"your query\"")}`);
		}
		return;
	}
	let results;
	try {
		results = await fetchDocsSearch(query);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		runtime.error(`Docs search failed: ${message}`);
		runtime.exit(1);
		return;
	}
	if (isRich()) {
		renderRichResults(query, results, runtime);
		return;
	}
	await renderMarkdown(buildMarkdown(query, results), runtime);
}
//#endregion
//#region src/cli/docs-cli.ts
function registerDocsCli(program) {
	program.command("docs").description("Search the live OpenClaw docs").argument("[query...]", "Search query").addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/docs", "docs.openclaw.ai/cli/docs")}\n`).action(async (queryParts) => {
		await runCommandWithRuntime(defaultRuntime, async () => {
			await docsSearchCommand(queryParts, defaultRuntime);
		});
	});
}
//#endregion
export { registerDocsCli };
