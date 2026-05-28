import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { y as resolveStateDir } from "./paths-CQv1_CDw.js";
import { _ as uniqueStrings, l as normalizeStringEntries } from "./string-normalization-B8G0vlWE.js";
import "./common-BooMjDNL.js";
import { n as listTranscriptSourceProviders, t as getTranscriptSourceProvider } from "./provider-registry-DzPQYfkt.js";
import { createReadStream } from "node:fs";
import path from "node:path";
import fs$1 from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Type } from "typebox";
import { createInterface } from "node:readline";
//#region src/transcripts/config.ts
function resolveAutoStart(raw) {
	if (!Array.isArray(raw)) return [];
	return raw.map((entry) => {
		const config = entry && typeof entry === "object" ? entry : {};
		const providerId = normalizeOptionalString(config.providerId);
		if (!providerId) return;
		return {
			providerId,
			sessionId: normalizeOptionalString(config.sessionId),
			title: normalizeOptionalString(config.title),
			accountId: normalizeOptionalString(config.accountId),
			guildId: normalizeOptionalString(config.guildId),
			channelId: normalizeOptionalString(config.channelId),
			meetingUrl: normalizeOptionalString(config.meetingUrl)
		};
	}).filter((entry) => entry !== void 0);
}
function resolveTranscriptsConfig(raw) {
	const config = raw && typeof raw === "object" ? raw : {};
	const maxUtterances = typeof config.maxUtterances === "number" && Number.isFinite(config.maxUtterances) ? Math.max(1, Math.min(1e4, Math.floor(config.maxUtterances))) : 2e3;
	return {
		enabled: config.enabled === true,
		maxUtterances,
		autoStart: resolveAutoStart(config.autoStart)
	};
}
//#endregion
//#region src/transcripts/manual-source.ts
function parseSpeakerLine(line) {
	const match = /^([^:\n]{1,80}):\s+(.+)$/.exec(line.trim());
	if (!match) return { text: line.trim() };
	return {
		speakerLabel: match[1]?.trim(),
		text: match[2]?.trim() ?? ""
	};
}
const manualTranscriptSourceProvider = {
	id: "manual-transcript",
	aliases: ["import", "transcript"],
	name: "Manual Transcript Import",
	sourceKinds: ["posthoc-transcript"],
	async importTranscript(request) {
		const now = (/* @__PURE__ */ new Date()).toISOString();
		return request.text.split(/\r?\n/).map((line) => parseSpeakerLine(line)).filter((entry) => entry.text).map((entry, index) => ({
			id: `${request.session.sessionId}-${index + 1}`,
			sessionId: request.session.sessionId,
			startedAt: now,
			final: true,
			speaker: { label: entry.speakerLabel ?? request.speakerLabel ?? "Speaker" },
			text: entry.text
		}));
	}
};
//#endregion
//#region src/transcripts/summary.ts
const ACTION_PATTERNS = /\b(todo|action|follow up|follow-up|assign|owner|next step|ship|fix|send|schedule)\b/i;
const DECISION_PATTERNS = /\b(decided|decision|we will|we'll|agreed|approved|go with|ship it)\b/i;
const RISK_PATTERNS = /\b(risk|blocked|blocker|concern|issue|problem|unknown|deadline|privacy|security)\b/i;
function firstSentences(utterances, limit) {
	return normalizeStringEntries((normalizeStringEntries(utterances.map((utterance) => utterance.text)).join(" ").match(/[^.!?]+[.!?]?/g) ?? []).slice(0, limit)).join(" ");
}
function collectMatches(utterances, pattern) {
	return utterances.filter((utterance) => pattern.test(utterance.text)).map(formatSpeakerLine).filter(Boolean).slice(0, 12);
}
function formatSpeakerLine(utterance) {
	const text = utterance.text.trim();
	if (!text) return "";
	const speaker = utterance.speaker?.label?.trim();
	return speaker ? `${speaker}: ${text}` : text;
}
function formatTranscript(utterances) {
	return utterances.map(formatSpeakerLine).filter(Boolean);
}
function summarizeTranscripts(params) {
	const title = params.session.title?.trim() || "Transcripts";
	const overview = firstSentences(params.utterances, 4) || "No transcript captured yet.";
	return {
		sessionId: params.session.sessionId,
		title,
		generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		overview,
		transcript: formatTranscript(params.utterances),
		decisions: collectMatches(params.utterances, DECISION_PATTERNS),
		actionItems: collectMatches(params.utterances, ACTION_PATTERNS),
		risks: collectMatches(params.utterances, RISK_PATTERNS),
		utteranceCount: params.utterances.length
	};
}
function renderList(items) {
	return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None captured";
}
function renderTranscriptsMarkdown(summary) {
	return [
		`# ${summary.title}`,
		"",
		`Generated: ${summary.generatedAt}`,
		`Session: ${summary.sessionId}`,
		"",
		"## Overview",
		summary.overview,
		"",
		"## Transcript",
		renderList(summary.transcript),
		"",
		"## Decisions",
		renderList(summary.decisions),
		"",
		"## Action Items",
		renderList(summary.actionItems),
		"",
		"## Risks",
		renderList(summary.risks),
		"",
		`Transcript utterances: ${summary.utteranceCount}`
	].join("\n");
}
//#endregion
//#region src/transcripts/store.ts
function safeSegment(value) {
	return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "session";
}
function dateSegment(value) {
	return value?.match(/^(\d{4}-\d{2}-\d{2})T/)?.[1] ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function readJsonFile(filePath) {
	try {
		return JSON.parse(await fs$1.readFile(filePath, "utf8"));
	} catch (err) {
		if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") return;
		throw err;
	}
}
function normalizeMaxUtterances(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) return;
	return Math.max(1, Math.floor(value));
}
function sameSessionIdentity$1(left, right) {
	return left.sessionId === right.sessionId && left.startedAt === right.startedAt;
}
var TranscriptsStore = class {
	constructor(rootDir) {
		this.rootDir = rootDir;
	}
	sessionDir(session) {
		return path.join(this.rootDir, dateSegment(session.startedAt), safeSegment(session.sessionId));
	}
	async hasSessionMetadata(dir) {
		return await readJsonFile(path.join(dir, "metadata.json")) !== void 0;
	}
	async findSessionDirForSession(session) {
		const datedDir = this.sessionDir(session);
		const datedSession = await readJsonFile(path.join(datedDir, "metadata.json"));
		if (datedSession && sameSessionIdentity$1(datedSession, session)) return datedDir;
		return datedDir;
	}
	async findSessionDir(selector) {
		const qualified = selector.match(/^(\d{4}-\d{2}-\d{2})\/(.+)$/);
		if (qualified?.[1] && qualified[2]) {
			const directDir = path.join(this.rootDir, qualified[1], safeSegment(qualified[2]));
			return await this.hasSessionMetadata(directDir) ? directDir : void 0;
		}
		const safeSessionId = safeSegment(selector);
		const idDate = selector.match(/^meeting-(\d{4})-(\d{2})-(\d{2})T/)?.slice(1, 4).join("-");
		if (idDate) {
			const directDir = path.join(this.rootDir, idDate, safeSessionId);
			return await this.hasSessionMetadata(directDir) ? directDir : void 0;
		}
		let entries;
		try {
			entries = await fs$1.readdir(this.rootDir, { withFileTypes: true });
		} catch (err) {
			if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") return;
			throw err;
		}
		const datedEntries = entries.filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name)).toSorted((left, right) => right.name.localeCompare(left.name));
		const matches = [];
		for (const entry of datedEntries) {
			const candidate = path.join(this.rootDir, entry.name, safeSessionId);
			if ((await readJsonFile(path.join(candidate, "metadata.json")))?.sessionId === selector) matches.push(candidate);
		}
		if (matches.length > 1) throw new Error(`multiple transcripts sessions match ${selector}; use a YYYY-MM-DD/${selector} selector`);
		return matches[0];
	}
	async writeSession(session) {
		const dir = this.sessionDir(session);
		await fs$1.mkdir(dir, { recursive: true });
		await fs$1.writeFile(path.join(dir, "metadata.json"), `${JSON.stringify(session, null, 2)}\n`);
	}
	async readSession(sessionId) {
		return (await this.readSessionEntry(sessionId))?.session;
	}
	async readSessionEntry(sessionId) {
		const dir = await this.findSessionDir(sessionId);
		if (!dir) return;
		const session = await readJsonFile(path.join(dir, "metadata.json"));
		return session ? {
			session,
			sessionDir: dir
		} : void 0;
	}
	async appendUtterance(sessionId, utterance) {
		const dir = await this.findSessionDir(sessionId) ?? path.join(this.rootDir, dateSegment(sessionId), safeSegment(sessionId));
		await this.appendUtteranceToDir(dir, sessionId, utterance);
	}
	async appendUtteranceForSession(session, utterance) {
		const dir = await this.findSessionDirForSession(session);
		await this.appendUtteranceToDir(dir, session.sessionId, utterance);
	}
	async appendUtteranceToDir(dir, sessionId, utterance) {
		await fs$1.mkdir(dir, { recursive: true });
		await fs$1.appendFile(path.join(dir, "transcript.jsonl"), `${JSON.stringify({
			...utterance,
			sessionId
		})}\n`);
	}
	async readUtterancesForSession(session, options = {}) {
		return await this.readUtterancesFromDir(await this.findSessionDirForSession(session), options);
	}
	async readUtterancesFromSessionDir(sessionDir, options = {}) {
		return await this.readUtterancesFromDir(sessionDir, options);
	}
	async readUtterances(sessionId, options = {}) {
		const dir = await this.findSessionDir(sessionId);
		if (!dir) return [];
		return await this.readUtterancesFromDir(dir, options);
	}
	async readUtterancesFromDir(dir, options = {}) {
		const transcriptPath = path.join(dir, "transcript.jsonl");
		const maxUtterances = normalizeMaxUtterances(options.maxUtterances);
		if (maxUtterances !== void 0) {
			const utterances = [];
			try {
				const lines = createInterface({
					input: createReadStream(transcriptPath, { encoding: "utf8" }),
					crlfDelay: Infinity
				});
				for await (const line of lines) {
					if (!line) continue;
					utterances.push(JSON.parse(line));
					if (utterances.length > maxUtterances) utterances.shift();
				}
			} catch (err) {
				if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") return [];
				throw err;
			}
			return utterances;
		}
		let raw;
		try {
			raw = await fs$1.readFile(transcriptPath, "utf8");
		} catch (err) {
			if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") return [];
			throw err;
		}
		return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
	}
	async updateStopped(sessionId, stoppedAt) {
		const dir = await this.findSessionDir(sessionId);
		if (!dir) return;
		const session = await readJsonFile(path.join(dir, "metadata.json"));
		if (!session) return;
		await fs$1.writeFile(path.join(dir, "metadata.json"), `${JSON.stringify({
			...session,
			stoppedAt
		}, null, 2)}\n`);
	}
	async writeSummary(summary, session) {
		const dir = session !== void 0 ? await this.findSessionDirForSession(session) : await this.findSessionDir(summary.sessionId) ?? path.join(this.rootDir, dateSegment(summary.sessionId), safeSegment(summary.sessionId));
		return await this.writeSummaryToDir(summary, dir);
	}
	async writeSummaryToDir(summary, dir) {
		await fs$1.mkdir(dir, { recursive: true });
		await fs$1.writeFile(path.join(dir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
		const markdown = renderTranscriptsMarkdown(summary);
		const markdownPath = path.join(dir, "summary.md");
		await fs$1.writeFile(markdownPath, `${markdown}\n`);
		return markdownPath;
	}
};
//#endregion
//#region src/agents/tools/transcripts-tool.ts
const activeSessions = /* @__PURE__ */ new Map();
const AUTO_START_RETRY_ATTEMPTS = 12;
const AUTO_START_RETRY_MS = 5e3;
const AUTO_START_STOP_TIMEOUT_MS = 5e3;
const AUTO_START_PROVIDER_READY_TIMEOUT_MS = 3e4;
function sameSessionIdentity(left, right) {
	return left.sessionId === right.sessionId && left.startedAt === right.startedAt;
}
function asParamsRecord(params) {
	return params && typeof params === "object" && !Array.isArray(params) ? params : {};
}
function readStringParam(params, key, options = {}) {
	const value = params[key];
	if (typeof value !== "string") {
		if (options.required) throw new Error(`${key} required`);
		return;
	}
	const normalized = options.trim === false ? value : value.trim();
	if (!normalized && options.required) throw new Error(`${key} required`);
	return normalized || void 0;
}
const TranscriptsSchema = Type.Object({
	action: Type.String({ description: "start, stop, status, import, or summarize." }),
	sessionId: Type.Optional(Type.String({ minLength: 1 })),
	title: Type.Optional(Type.String({ minLength: 1 })),
	providerId: Type.Optional(Type.String({ minLength: 1 })),
	accountId: Type.Optional(Type.String({ minLength: 1 })),
	guildId: Type.Optional(Type.String({ minLength: 1 })),
	channelId: Type.Optional(Type.String({ minLength: 1 })),
	meetingUrl: Type.Optional(Type.String({ minLength: 1 })),
	transcript: Type.Optional(Type.String({ minLength: 1 })),
	speakerLabel: Type.Optional(Type.String({ minLength: 1 }))
}, { additionalProperties: false });
function createSessionId() {
	return `transcript-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
}
function createStore(ctx) {
	return new TranscriptsStore(path.join(ctx.stateDir, "transcripts"));
}
async function waitForPendingAutoStartsToSettle(pendingStarts) {
	if (pendingStarts.size === 0) return true;
	let timeout;
	try {
		return await Promise.race([Promise.allSettled(pendingStarts).then(() => true), new Promise((resolve) => {
			timeout = setTimeout(() => resolve(false), AUTO_START_STOP_TIMEOUT_MS);
			timeout.unref?.();
		})]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}
function sourceFromParams(params) {
	return {
		providerId: readStringParam(params, "providerId", { trim: true }) ?? "manual-transcript",
		accountId: readStringParam(params, "accountId", { trim: true }),
		guildId: readStringParam(params, "guildId", { trim: true }),
		channelId: readStringParam(params, "channelId", { trim: true }),
		meetingUrl: readStringParam(params, "meetingUrl", { trim: true })
	};
}
function resolveSourceProvider(providerId, ctx) {
	return providerId === manualTranscriptSourceProvider.id ? manualTranscriptSourceProvider : getTranscriptSourceProvider(providerId, ctx.config);
}
function toolText(text, details) {
	return {
		content: [{
			type: "text",
			text
		}],
		details: details ?? {}
	};
}
async function summarizeAndPersist(params) {
	const utterances = params.sessionDir !== void 0 ? await params.store.readUtterancesFromSessionDir(params.sessionDir, { maxUtterances: params.config.maxUtterances }) : await params.store.readUtterancesForSession(params.session, { maxUtterances: params.config.maxUtterances });
	const summary = summarizeTranscripts({
		session: params.session,
		utterances
	});
	return {
		summary,
		summaryPath: params.sessionDir !== void 0 ? await params.store.writeSummaryToDir(summary, params.sessionDir) : await params.store.writeSummary(summary, params.session)
	};
}
async function startTranscripts(params) {
	if (params.abortSignal?.aborted) throw new Error("transcripts start aborted");
	const source = sourceFromParams(params.rawParams);
	const provider = resolveSourceProvider(source.providerId, params.ctx);
	if (!provider?.start) throw new Error(`transcripts provider ${source.providerId} cannot start live capture`);
	const session = {
		sessionId: readStringParam(params.rawParams, "sessionId", { trim: true }) ?? createSessionId(),
		title: readStringParam(params.rawParams, "title", { trim: true }),
		source,
		startedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	await params.store.writeSession(session);
	const result = await provider.start({
		cfg: params.ctx.config,
		session,
		abortSignal: params.abortSignal,
		startupWaitMs: params.startupWaitMs,
		onUtterance: (utterance) => params.store.appendUtteranceForSession(session, utterance)
	});
	if (!result.ok) throw new Error(result.error);
	if (params.abortSignal?.aborted) {
		await provider.stop?.({
			cfg: params.ctx.config,
			sessionId: session.sessionId,
			source: session.source,
			reason: "service-stop"
		});
		throw new Error("transcripts start aborted");
	}
	activeSessions.set(session.sessionId, {
		session,
		providerId: provider.id
	});
	return toolText(`Transcripts started: ${session.sessionId}`, {
		sessionId: session.sessionId,
		providerId: provider.id
	});
}
async function stopTranscripts(params) {
	const sessionSelector = readStringParam(params.rawParams, "sessionId", {
		required: true,
		trim: true
	});
	const directActive = activeSessions.get(sessionSelector);
	const resolvedEntry = directActive ? {
		session: directActive.session,
		sessionDir: params.store.sessionDir(directActive.session)
	} : await params.store.readSessionEntry(sessionSelector);
	const resolvedSession = resolvedEntry?.session;
	const activeCandidate = resolvedSession !== void 0 ? activeSessions.get(resolvedSession.sessionId) : void 0;
	const activeMatchesResolved = activeCandidate !== void 0 && resolvedSession !== void 0 && sameSessionIdentity(activeCandidate.session, resolvedSession);
	const selectedActive = directActive ?? (activeMatchesResolved ? activeCandidate : void 0);
	const session = selectedActive?.session ?? resolvedSession;
	if (!session) throw new Error(`transcripts session not found: ${sessionSelector}`);
	const sessionId = session.sessionId;
	const provider = resolveSourceProvider(selectedActive?.providerId ?? session.source.providerId, params.ctx);
	let providerStopError;
	if (selectedActive && provider?.stop) {
		const result = await provider.stop({
			cfg: params.ctx.config,
			sessionId,
			source: session.source,
			reason: "tool-stop"
		});
		if (!result.ok) providerStopError = result.error;
	}
	const stoppedAt = (/* @__PURE__ */ new Date()).toISOString();
	if (selectedActive) activeSessions.delete(sessionId);
	const stoppedSession = {
		...session,
		stoppedAt,
		...providerStopError ? { metadata: {
			...session.metadata,
			providerStopError,
			providerStopFailedAt: stoppedAt
		} } : {}
	};
	if (selectedActive) await params.store.writeSession(stoppedSession);
	else await params.store.updateStopped(sessionSelector, stoppedAt);
	const { summaryPath, summary } = await summarizeAndPersist({
		config: resolveTranscriptsConfig(params.ctx.config?.transcripts),
		store: params.store,
		session: stoppedSession,
		sessionDir: selectedActive ? void 0 : resolvedEntry?.sessionDir
	});
	return toolText(`Transcripts stopped: ${sessionId}\nSummary: ${summaryPath}`, {
		sessionId,
		...providerStopError ? { providerStopError } : {},
		summary,
		summaryPath
	});
}
async function importTranscripts(params) {
	const source = sourceFromParams(params.rawParams);
	const provider = resolveSourceProvider(source.providerId, params.ctx);
	if (!provider?.importTranscript) throw new Error(`transcripts provider ${source.providerId} cannot import transcripts`);
	const session = {
		sessionId: readStringParam(params.rawParams, "sessionId", { trim: true }) ?? createSessionId(),
		title: readStringParam(params.rawParams, "title", { trim: true }),
		source,
		startedAt: (/* @__PURE__ */ new Date()).toISOString(),
		stoppedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	const transcript = readStringParam(params.rawParams, "transcript", {
		required: true,
		trim: false
	});
	await params.store.writeSession(session);
	const utterances = await provider.importTranscript({
		cfg: params.ctx.config,
		session,
		text: transcript,
		speakerLabel: readStringParam(params.rawParams, "speakerLabel", { trim: true })
	});
	for (const utterance of utterances) await params.store.appendUtteranceForSession(session, utterance);
	const { summaryPath, summary } = await summarizeAndPersist({
		config: resolveTranscriptsConfig(params.ctx.config?.transcripts),
		store: params.store,
		session
	});
	return toolText(`Transcript imported: ${session.sessionId}\nSummary: ${summaryPath}`, {
		sessionId: session.sessionId,
		utteranceCount: utterances.length,
		summary,
		summaryPath
	});
}
async function summarizeExisting(params) {
	const sessionId = readStringParam(params.rawParams, "sessionId", {
		required: true,
		trim: true
	});
	const entry = await params.store.readSessionEntry(sessionId);
	if (!entry) throw new Error(`transcripts session not found: ${sessionId}`);
	const { summaryPath, summary } = await summarizeAndPersist({
		config: params.config,
		store: params.store,
		session: entry.session,
		sessionDir: entry.sessionDir
	});
	return toolText(`Transcripts summarized: ${sessionId}\nSummary: ${summaryPath}`, {
		sessionId,
		summary,
		summaryPath
	});
}
async function statusTranscripts(ctx) {
	const uniqueProviders = uniqueStrings([manualTranscriptSourceProvider.id, ...listTranscriptSourceProviders(ctx.config).map((provider) => provider.id)]);
	const active = [...activeSessions.values()].map((entry) => ({
		sessionId: entry.session.sessionId,
		providerId: entry.providerId,
		title: entry.session.title,
		source: entry.session.source
	}));
	return toolText([`Transcripts providers: ${uniqueProviders.length ? uniqueProviders.join(", ") : "none"}`, `Active sessions: ${active.length}`].join("\n"), {
		providers: uniqueProviders,
		active
	});
}
function createTranscriptsTool(options) {
	const ctx = {
		config: options?.config,
		stateDir: options?.stateDir ?? resolveStateDir(),
		logger: options?.logger ?? console
	};
	return {
		name: "transcripts",
		label: "Transcripts",
		description: "Start, stop, import, summarize, or inspect transcripts from Discord, Google Meet, Slack huddles, and other meeting sources.",
		parameters: TranscriptsSchema,
		async execute(_toolCallId, rawParams) {
			const config = resolveTranscriptsConfig(ctx.config?.transcripts);
			if (!config.enabled) throw new Error("transcripts are disabled");
			const params = asParamsRecord(rawParams);
			const action = readStringParam(params, "action", {
				required: true,
				trim: true
			});
			const store = createStore(ctx);
			switch (action) {
				case "start": return await startTranscripts({
					ctx,
					store,
					rawParams: params
				});
				case "stop": return await stopTranscripts({
					ctx,
					store,
					rawParams: params
				});
				case "import": return await importTranscripts({
					ctx,
					store,
					rawParams: params
				});
				case "summarize": return await summarizeExisting({
					config,
					store,
					rawParams: params
				});
				case "status": return await statusTranscripts(ctx);
				default: throw new Error(`unsupported transcripts action: ${action}`);
			}
		}
	};
}
function createTranscriptsAutoStartService(ctx) {
	let stopped = false;
	const timers = /* @__PURE__ */ new Set();
	const startedSessionIds = /* @__PURE__ */ new Set();
	const pendingStartControllers = /* @__PURE__ */ new Set();
	const pendingStarts = /* @__PURE__ */ new Set();
	const schedule = (run, delayMs) => {
		const timer = setTimeout(() => {
			timers.delete(timer);
			run();
		}, delayMs);
		timers.add(timer);
	};
	const startEntry = (entry, attempt, store) => {
		if (stopped || startedSessionIds.has(entry.sessionId ?? "")) return;
		const abortController = new AbortController();
		pendingStartControllers.add(abortController);
		const startTask = startTranscripts({
			ctx,
			store,
			abortSignal: abortController.signal,
			startupWaitMs: AUTO_START_PROVIDER_READY_TIMEOUT_MS,
			rawParams: {
				action: "start",
				...entry,
				sessionId: entry.sessionId ?? createSessionId()
			}
		}).then((result) => {
			const sessionId = result.details?.sessionId;
			if (typeof sessionId === "string") startedSessionIds.add(sessionId);
		}).catch((err) => {
			if (stopped) return;
			if (attempt >= AUTO_START_RETRY_ATTEMPTS) {
				ctx.logger.warn(`transcripts autoStart failed provider=${entry.providerId}: ${err instanceof Error ? err.message : String(err)}`);
				return;
			}
			schedule(() => startEntry(entry, attempt + 1, store), AUTO_START_RETRY_MS);
		}).finally(() => {
			pendingStartControllers.delete(abortController);
			pendingStarts.delete(startTask);
		});
		pendingStarts.add(startTask);
	};
	return {
		start() {
			const config = resolveTranscriptsConfig(ctx.config?.transcripts);
			if (!config.enabled || config.autoStart.length === 0) return;
			const store = new TranscriptsStore(path.join(ctx.stateDir, "transcripts"));
			for (const entry of config.autoStart) startEntry({
				...entry,
				sessionId: entry.sessionId ?? createSessionId()
			}, 1, store);
		},
		async stop() {
			stopped = true;
			for (const timer of timers) clearTimeout(timer);
			timers.clear();
			for (const controller of pendingStartControllers) controller.abort();
			if (!await waitForPendingAutoStartsToSettle(pendingStarts)) ctx.logger.warn(`transcripts autoStart stop timed out waiting for ${pendingStarts.size} pending start${pendingStarts.size === 1 ? "" : "s"}`);
			const store = new TranscriptsStore(path.join(ctx.stateDir, "transcripts"));
			for (const sessionId of startedSessionIds) await stopTranscripts({
				ctx,
				store,
				rawParams: {
					action: "stop",
					sessionId
				}
			}).catch((err) => ctx.logger.warn(`transcripts autoStart stop failed session=${sessionId}: ${err instanceof Error ? err.message : String(err)}`));
			startedSessionIds.clear();
		}
	};
}
//#endregion
export { createTranscriptsTool as n, resolveTranscriptsConfig as r, createTranscriptsAutoStartService as t };
