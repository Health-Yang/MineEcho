import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { promises } from "node:fs";
import path from "node:path";
//#region src/agents/internal-session-effects.ts
function resolveInternalSessionEffectsTranscriptPath(runId) {
	const safeRunId = runId.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "run";
	return path.join(resolveStateDir(), "internal-agent-runs", `${safeRunId}.jsonl`);
}
async function prepareInternalSessionEffectsTranscript(params) {
	const sessionFile = resolveInternalSessionEffectsTranscriptPath(params.runId);
	await promises.mkdir(path.dirname(sessionFile), {
		recursive: true,
		mode: 448
	});
	if (!params.sessionFile) {
		await promises.writeFile(sessionFile, "", { mode: 384 });
		await promises.chmod(sessionFile, 384);
		return sessionFile;
	}
	try {
		const contents = await promises.readFile(params.sessionFile);
		await promises.writeFile(sessionFile, contents, { mode: 384 });
		await promises.chmod(sessionFile, 384);
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		await promises.writeFile(sessionFile, "", { mode: 384 });
		await promises.chmod(sessionFile, 384);
	}
	return sessionFile;
}
async function removeInternalSessionEffectsTranscript(sessionFile) {
	const dir = path.join(resolveStateDir(), "internal-agent-runs");
	const resolved = sessionFile ? path.resolve(sessionFile) : "";
	if (!resolved || path.dirname(resolved) !== path.resolve(dir)) return;
	try {
		await promises.rm(resolved, { force: true });
	} catch {}
}
//#endregion
export { removeInternalSessionEffectsTranscript as n, resolveInternalSessionEffectsTranscriptPath as r, prepareInternalSessionEffectsTranscript as t };
