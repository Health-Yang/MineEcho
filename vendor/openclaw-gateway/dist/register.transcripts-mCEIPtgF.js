import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import path from "node:path";
import fs from "node:fs/promises";
//#region src/cli/program/register.transcripts.ts
const TRANSCRIPTS_STATE_SUBDIR = "transcripts";
function safeSegment(value) {
	return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "session";
}
function stateRootDir() {
	return path.join(resolveStateDir(), TRANSCRIPTS_STATE_SUBDIR);
}
function dateFromSessionId(sessionId) {
	return sessionId.match(/^transcript-(\d{4})-(\d{2})-(\d{2})T/)?.slice(1, 4).join("-");
}
function sessionDir(date, sessionId) {
	return path.join(stateRootDir(), date, safeSegment(sessionId));
}
function readDateFromSessionDir(sessionDir) {
	const candidate = path.basename(path.dirname(sessionDir));
	if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) throw new Error(`invalid transcripts date directory: ${candidate}`);
	return candidate;
}
function formatSelector(entry) {
	return `${entry.date}/${entry.session.sessionId}`;
}
function parseQualifiedSelector(selector) {
	const match = selector.match(/^(\d{4}-\d{2}-\d{2})\/(.+)$/);
	if (!match?.[1] || !match[2]) return null;
	return {
		date: match[1],
		sessionId: match[2]
	};
}
function writeLine(value) {
	process.stdout.write(`${value}\n`);
}
function writeJson(value) {
	writeLine(JSON.stringify(value, null, 2));
}
function isNodeError(err, code) {
	return Boolean(err && typeof err === "object" && "code" in err && err.code === code);
}
async function pathExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch (err) {
		if (isNodeError(err, "ENOENT")) return false;
		throw err;
	}
}
async function readJsonFile(filePath) {
	return JSON.parse(await fs.readFile(filePath, "utf8"));
}
function formatErrorMessage(err) {
	return err instanceof Error ? err.message : String(err);
}
async function readStoredSession(sessionDir, options = {}) {
	const metadataPath = path.join(sessionDir, "metadata.json");
	try {
		const session = await readJsonFile(metadataPath);
		const summaryPath = path.join(sessionDir, "summary.md");
		return {
			session,
			sessionDir,
			date: readDateFromSessionDir(sessionDir),
			summaryPath,
			hasSummary: await pathExists(summaryPath)
		};
	} catch (err) {
		if (isNodeError(err, "ENOENT")) return null;
		if (options.ignoreInvalid) return null;
		throw new Error(`invalid transcripts metadata at ${metadataPath}: ${formatErrorMessage(err)}`, { cause: err });
	}
}
async function listStoredSessionDirs() {
	let entries;
	try {
		entries = await fs.readdir(stateRootDir(), { withFileTypes: true });
	} catch (err) {
		if (isNodeError(err, "ENOENT")) return [];
		throw err;
	}
	const dirs = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const firstLevelDir = path.join(stateRootDir(), entry.name);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.name)) continue;
		const nestedEntries = await fs.readdir(firstLevelDir, { withFileTypes: true });
		dirs.push(...nestedEntries.filter((nestedEntry) => nestedEntry.isDirectory()).map((nestedEntry) => path.join(firstLevelDir, nestedEntry.name)));
	}
	return dirs;
}
function assertRequestedSession(entry, sessionId) {
	if (entry.session.sessionId !== sessionId) throw new Error(`transcripts metadata mismatch for ${sessionId}: found ${entry.session.sessionId}`);
	return entry;
}
async function requireStoredSession(selector) {
	const qualified = parseQualifiedSelector(selector);
	if (qualified) {
		const session = await readStoredSession(sessionDir(qualified.date, qualified.sessionId));
		if (!session) throw new Error(`transcripts session not found: ${selector}`);
		return assertRequestedSession(session, qualified.sessionId);
	}
	const idDate = dateFromSessionId(selector);
	const session = idDate ? await readStoredSession(sessionDir(idDate, selector)) : null;
	if (session) return assertRequestedSession(session, selector);
	const matches = (await listStoredSessions()).filter((entry) => entry.session.sessionId === selector);
	if (matches.length === 1 && matches[0]) return assertRequestedSession(matches[0], selector);
	if (matches.length > 1) throw new Error(`multiple transcripts sessions match ${selector}; use one of: ${matches.map(formatSelector).join(", ")}`);
	throw new Error(`transcripts session not found: ${selector}`);
}
async function listStoredSessions() {
	const dirs = await listStoredSessionDirs();
	return (await Promise.all(dirs.map((dir) => readStoredSession(dir, { ignoreInvalid: true })))).filter((session) => session !== null).toSorted((left, right) => (right.session.startedAt ?? "").localeCompare(left.session.startedAt ?? ""));
}
function formatSessionLine(entry) {
	const title = entry.session.title?.trim() || "Transcripts";
	const started = entry.session.startedAt || "unknown";
	const summary = entry.hasSummary ? entry.summaryPath : "no summary.md";
	return `${formatSelector(entry)}\t${started}\t${title}\t${summary}`;
}
async function listCommand(options) {
	const sessions = await listStoredSessions();
	if (options.json) {
		writeJson(sessions.map((entry) => ({
			sessionId: entry.session.sessionId,
			selector: formatSelector(entry),
			date: entry.date,
			title: entry.session.title,
			startedAt: entry.session.startedAt,
			stoppedAt: entry.session.stoppedAt,
			source: entry.session.source,
			path: entry.sessionDir,
			summaryPath: entry.summaryPath,
			hasSummary: entry.hasSummary
		})));
		return;
	}
	if (sessions.length === 0) {
		writeLine("No transcripts found.");
		return;
	}
	for (const session of sessions) writeLine(formatSessionLine(session));
}
async function showCommand(sessionId, options) {
	const session = await requireStoredSession(sessionId);
	if (options.json) {
		const summary = session.hasSummary ? await fs.readFile(session.summaryPath, "utf8") : null;
		writeJson({
			session: session.session,
			selector: formatSelector(session),
			path: session.sessionDir,
			summaryPath: session.summaryPath,
			summary
		});
		return;
	}
	if (!session.hasSummary) throw new Error(`summary.md not found for transcripts session: ${sessionId}`);
	process.stdout.write(await fs.readFile(session.summaryPath, "utf8"));
}
async function pathCommand(selector, options) {
	const session = await requireStoredSession(selector);
	const selectedPath = options.dir ? session.sessionDir : options.metadata ? path.join(session.sessionDir, "metadata.json") : options.transcript ? path.join(session.sessionDir, "transcript.jsonl") : session.summaryPath;
	if (options.json) {
		writeJson({
			sessionId: session.session.sessionId,
			selector: formatSelector(session),
			path: selectedPath,
			exists: await pathExists(selectedPath)
		});
		return;
	}
	writeLine(selectedPath);
}
function registerTranscriptsCli(program) {
	const transcripts = program.command("transcripts").description("Inspect stored transcripts");
	transcripts.command("list").description("List stored transcript sessions").option("--json", "Print JSON").action(async (options) => {
		await listCommand(options);
	});
	transcripts.command("show").description("Print a transcript summary markdown file").argument("<session>", "Transcripts session id or YYYY-MM-DD/session selector").option("--json", "Print JSON").action(async (sessionId, options) => {
		await showCommand(sessionId, options);
	});
	transcripts.command("path").description("Print a stored transcripts artifact path").argument("<session>", "Transcripts session id or YYYY-MM-DD/session selector").option("--dir", "Print the session directory").option("--metadata", "Print metadata.json").option("--transcript", "Print transcript.jsonl").option("--json", "Print JSON").action(async (sessionId, options) => {
		await pathCommand(sessionId, options);
	});
}
//#endregion
export { registerTranscriptsCli };
