import { c as normalizeOptionalString, s as normalizeOptionalLowercaseString } from "./string-coerce-DKw2K5wM.js";
import { i as asOptionalRecord } from "./record-coerce-Btbek4uV.js";
import { a as emitTrustedDiagnosticEvent } from "./diagnostic-events-CNGydBWO.js";
import { r as getChildLogger } from "./logger-xjL_xnHy.js";
import { t as getDiagnosticSessionActivitySnapshot } from "./diagnostic-run-activity-DfY2SXQ5.js";
import { d as queueEmbeddedPiMessageWithOutcomeAsync, m as resolveActiveEmbeddedRunSessionId, n as abortEmbeddedPiRun } from "./runs-p1TN18LG.js";
import { n as resolvePluginCapabilityProvider, r as resolvePluginCapabilityProviders } from "./capability-provider-runtime-icyhwXhC.js";
import { n as normalizeCapabilityProviderId, t as buildCapabilityProviderMaps } from "./provider-registry-shared-_hohhuIp.js";
import { t as resolveConfiguredCapabilityProvider } from "./provider-selection-runtime-apdbaXOd.js";
//#region src/talk/provider-types.ts
const REALTIME_VOICE_AUDIO_FORMAT_G711_ULAW_8KHZ = {
	encoding: "g711_ulaw",
	sampleRateHz: 8e3,
	channels: 1
};
const REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ = {
	encoding: "pcm16",
	sampleRateHz: 24e3,
	channels: 1
};
//#endregion
//#region src/talk/talk-events.ts
const TALK_EVENT_TYPES = [
	"session.started",
	"session.ready",
	"session.closed",
	"session.error",
	"session.replaced",
	"turn.started",
	"turn.ended",
	"turn.cancelled",
	"capture.started",
	"capture.stopped",
	"capture.cancelled",
	"capture.once",
	"input.audio.delta",
	"input.audio.committed",
	"transcript.delta",
	"transcript.done",
	"output.text.delta",
	"output.text.done",
	"output.audio.started",
	"output.audio.delta",
	"output.audio.done",
	"tool.call",
	"tool.progress",
	"tool.result",
	"tool.error",
	"usage.metrics",
	"latency.metrics",
	"health.changed"
];
const TURN_SCOPED_TALK_EVENT_TYPES = new Set([
	"turn.started",
	"turn.ended",
	"turn.cancelled",
	"input.audio.delta",
	"input.audio.committed",
	"transcript.delta",
	"transcript.done",
	"output.text.delta",
	"output.text.done",
	"output.audio.started",
	"output.audio.delta",
	"output.audio.done",
	"tool.call",
	"tool.progress",
	"tool.result",
	"tool.error"
]);
const CAPTURE_SCOPED_TALK_EVENT_TYPES = new Set([
	"capture.started",
	"capture.stopped",
	"capture.cancelled",
	"capture.once"
]);
function assertTalkEventCorrelation(input) {
	if (TURN_SCOPED_TALK_EVENT_TYPES.has(input.type) && !input.turnId?.trim()) throw new Error(`Talk event ${input.type} requires turnId`);
	if (CAPTURE_SCOPED_TALK_EVENT_TYPES.has(input.type) && !input.captureId?.trim()) throw new Error(`Talk event ${input.type} requires captureId`);
}
function createTalkEventSequencer(context, options = {}) {
	let seq = 0;
	const now = options.now ?? (() => /* @__PURE__ */ new Date());
	return { next(input) {
		assertTalkEventCorrelation(input);
		seq += 1;
		const timestamp = input.timestamp ?? (() => {
			const value = now();
			return typeof value === "string" ? value : value.toISOString();
		})();
		return {
			...context,
			id: `${context.sessionId}:${seq}`,
			type: input.type,
			turnId: input.turnId,
			captureId: input.captureId,
			seq,
			timestamp,
			final: input.final,
			callId: input.callId,
			itemId: input.itemId,
			parentId: input.parentId,
			payload: input.payload
		};
	} };
}
//#endregion
//#region src/talk/event-metrics.ts
function firstFiniteTalkEventNumber(record, keys) {
	if (!record) return;
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
	}
}
//#endregion
//#region src/talk/diagnostics.ts
function createTalkDiagnosticEvent(event) {
	const payload = asOptionalRecord(event.payload);
	return {
		type: "talk.event",
		sessionId: event.sessionId,
		turnId: event.turnId,
		captureId: event.captureId,
		talkEventType: event.type,
		mode: event.mode,
		transport: event.transport,
		brain: event.brain,
		provider: event.provider,
		final: event.final,
		durationMs: firstFiniteTalkEventNumber(payload, [
			"durationMs",
			"latencyMs",
			"elapsedMs"
		]),
		byteLength: firstFiniteTalkEventNumber(payload, ["byteLength", "audioBytes"])
	};
}
function recordTalkDiagnosticEvent(event) {
	emitTrustedDiagnosticEvent(createTalkDiagnosticEvent(event));
}
//#endregion
//#region src/talk/logging.ts
const OMITTED_TALK_LOG_EVENT_TYPES = new Set([
	"input.audio.delta",
	"output.audio.delta",
	"output.text.delta",
	"transcript.delta",
	"tool.progress"
]);
const TALK_LOGGER_BINDINGS = Object.freeze({ subsystem: "talk" });
function createTalkLogRecord(event) {
	if (OMITTED_TALK_LOG_EVENT_TYPES.has(event.type)) return;
	const payload = asOptionalRecord(event.payload);
	const attributes = {
		sessionId: event.sessionId,
		talkEventType: event.type,
		talkMode: event.mode,
		talkTransport: event.transport,
		talkBrain: event.brain
	};
	if (event.provider) attributes.talkProvider = event.provider;
	if (typeof event.final === "boolean") attributes.talkFinal = event.final;
	const durationMs = firstFiniteTalkEventNumber(payload, [
		"durationMs",
		"latencyMs",
		"elapsedMs"
	]);
	if (durationMs !== void 0) attributes.talkDurationMs = durationMs;
	const byteLength = firstFiniteTalkEventNumber(payload, ["byteLength", "audioBytes"]);
	if (byteLength !== void 0) attributes.talkByteLength = byteLength;
	return {
		level: event.type === "session.error" || event.type === "tool.error" ? "warn" : "info",
		message: `talk event ${event.type}`,
		attributes
	};
}
function recordTalkLogEvent(event) {
	const record = createTalkLogRecord(event);
	if (!record) return;
	try {
		const logger = getChildLogger(TALK_LOGGER_BINDINGS);
		if (record.level === "warn") {
			logger.warn(record.attributes, record.message);
			return;
		}
		logger.info(record.attributes, record.message);
	} catch {}
}
//#endregion
//#region src/talk/observability.ts
function recordTalkObservabilityEvent(event) {
	recordTalkDiagnosticEvent(event);
	recordTalkLogEvent(event);
}
//#endregion
//#region src/talk/talk-session-controller.ts
function createTalkSessionController(params, options = {}) {
	const { maxRecentEvents = 20, turnIdPrefix = "turn", ...context } = params;
	const sequencer = options.sequencer ?? createTalkEventSequencer(context, { now: options.now });
	const recentEvents = [];
	let activeTurnId;
	let outputAudioActive = false;
	let turnSeq = 0;
	const remember = (event) => {
		recentEvents.push(event);
		if (recentEvents.length > maxRecentEvents) recentEvents.splice(0, recentEvents.length - maxRecentEvents);
		try {
			options.onEvent?.(event);
		} catch {}
		return event;
	};
	const emit = (input) => {
		return remember(sequencer.next(input));
	};
	const resolveActiveTurn = (requestedTurnId) => {
		if (!activeTurnId) return {
			ok: false,
			reason: "no_active_turn"
		};
		const normalizedRequested = normalizeOptionalString(requestedTurnId);
		if (normalizedRequested && normalizedRequested !== activeTurnId) return {
			ok: false,
			reason: "stale_turn"
		};
		return activeTurnId;
	};
	const ensureTurn = (ensureParams = {}) => {
		if (activeTurnId) return { turnId: activeTurnId };
		return startTurn(ensureParams);
	};
	const startTurn = (startParams = {}) => {
		const turnId = normalizeOptionalString(startParams.turnId) ?? `${turnIdPrefix}-${++turnSeq}`;
		outputAudioActive = false;
		activeTurnId = turnId;
		return {
			turnId,
			event: emit({
				type: "turn.started",
				turnId,
				payload: startParams.payload ?? {}
			})
		};
	};
	const finishTurn = (type, paramsForTurn = {}) => {
		const turnId = resolveActiveTurn(paramsForTurn.turnId);
		if (typeof turnId !== "string") return turnId;
		outputAudioActive = false;
		activeTurnId = void 0;
		return {
			ok: true,
			turnId,
			event: emit({
				type,
				turnId,
				payload: paramsForTurn.payload ?? {},
				final: true
			})
		};
	};
	return {
		get activeTurnId() {
			return activeTurnId;
		},
		context,
		get outputAudioActive() {
			return outputAudioActive;
		},
		get recentEvents() {
			return recentEvents;
		},
		clearActiveTurn() {
			activeTurnId = void 0;
			outputAudioActive = false;
		},
		emit,
		ensureTurn,
		startTurn,
		endTurn(paramsForTurn) {
			return finishTurn("turn.ended", paramsForTurn);
		},
		cancelTurn(paramsForTurn) {
			return finishTurn("turn.cancelled", paramsForTurn);
		},
		finishOutputAudio(paramsForOutput = {}) {
			if (!outputAudioActive) return;
			const turnId = resolveActiveTurn(paramsForOutput.turnId);
			if (typeof turnId !== "string") return;
			outputAudioActive = false;
			return emit({
				type: "output.audio.done",
				turnId,
				payload: paramsForOutput.payload ?? {},
				final: true
			});
		},
		startOutputAudio(paramsForOutput = {}) {
			const turn = ensureTurn({
				turnId: paramsForOutput.turnId,
				payload: {}
			});
			if (outputAudioActive) return { turnId: turn.turnId };
			outputAudioActive = true;
			return {
				turnId: turn.turnId,
				event: emit({
					type: "output.audio.started",
					turnId: turn.turnId,
					payload: paramsForOutput.payload ?? {}
				})
			};
		}
	};
}
function normalizeTalkTransport(value) {
	const normalized = normalizeOptionalString(value);
	if (!normalized) return;
	if (normalized === "webrtc-sdp") return "webrtc";
	if (normalized === "json-pcm-websocket") return "provider-websocket";
	return normalized;
}
//#endregion
//#region src/talk/consult-question.ts
const REALTIME_VOICE_CONSULT_QUESTION_STOPWORDS = new Set([
	"a",
	"an",
	"and",
	"are",
	"can",
	"check",
	"could",
	"for",
	"in",
	"is",
	"it",
	"look",
	"me",
	"of",
	"on",
	"or",
	"please",
	"see",
	"that",
	"the",
	"this",
	"to",
	"would",
	"you"
]);
const DEFAULT_REALTIME_VOICE_CONSULT_QUESTION_KEYS = [
	"question",
	"prompt",
	"query",
	"task"
];
const DEFAULT_REALTIME_VOICE_SPEAKABLE_RESULT_KEYS = [
	"text",
	"result",
	"output",
	"error"
];
const DEFAULT_REALTIME_VOICE_SPEAKABLE_RESULT_MAX_CHARS = 1800;
function readRealtimeVoiceConsultQuestion(args, keys = DEFAULT_REALTIME_VOICE_CONSULT_QUESTION_KEYS) {
	if (typeof args === "string") return args.trim() || void 0;
	if (!args || typeof args !== "object" || Array.isArray(args)) return;
	const record = args;
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}
}
function normalizeRealtimeVoiceConsultQuestion(value) {
	return value?.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/gu, " ").trim() || void 0;
}
function matchRealtimeVoiceConsultQuestions(left, right, options = {}) {
	const normalizedLeft = normalizeRealtimeVoiceConsultQuestion(left);
	const normalizedRight = normalizeRealtimeVoiceConsultQuestion(right);
	if (!normalizedLeft || !normalizedRight) return false;
	if (normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft)) return true;
	const leftTokens = realtimeVoiceConsultQuestionTokens(normalizedLeft);
	const rightTokens = realtimeVoiceConsultQuestionTokens(normalizedRight);
	if (leftTokens.size === 0 || rightTokens.size === 0) return false;
	let overlap = 0;
	for (const token of leftTokens) if (rightTokens.has(token)) overlap += 1;
	const minTokenOverlapCount = options.minTokenOverlapCount ?? 2;
	if (overlap < minTokenOverlapCount) return false;
	const minTokenOverlapRatio = options.minTokenOverlapRatio ?? .6;
	return overlap / Math.min(leftTokens.size, rightTokens.size) >= minTokenOverlapRatio;
}
function readSpeakableRealtimeVoiceToolResult(result, options = {}) {
	const stringResult = options.stringResult ?? true;
	if (typeof result === "string") return stringResult ? limitSpeakableRealtimeVoiceToolResult(result, options.maxChars) : void 0;
	if (!result || typeof result !== "object" || Array.isArray(result)) return;
	const record = result;
	const keys = options.keys ?? DEFAULT_REALTIME_VOICE_SPEAKABLE_RESULT_KEYS;
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.trim()) return limitSpeakableRealtimeVoiceToolResult(value, options.maxChars);
	}
}
function realtimeVoiceConsultQuestionTokens(value) {
	return new Set(value.split(/[^\p{L}\p{N}]+/gu).map((token) => token.trim()).filter((token) => token.length >= 2 && !REALTIME_VOICE_CONSULT_QUESTION_STOPWORDS.has(token)));
}
function limitSpeakableRealtimeVoiceToolResult(value, maxChars = DEFAULT_REALTIME_VOICE_SPEAKABLE_RESULT_MAX_CHARS) {
	const trimmed = value.trim();
	if (!trimmed) return;
	if (trimmed.length <= maxChars) return trimmed;
	return `${trimmed.slice(0, Math.max(0, maxChars - 16)).trimEnd()} [truncated]`;
}
//#endregion
//#region src/talk/forced-consult-coordinator.ts
const DEFAULT_REALTIME_VOICE_FORCED_CONSULT_NATIVE_DEDUPE_MS = 2e3;
const DEFAULT_REALTIME_VOICE_FORCED_CONSULT_LIMIT = 12;
function createRealtimeVoiceForcedConsultCoordinator(options = {}) {
	const state = /* @__PURE__ */ new Map();
	const recentNativeConsults = [];
	let nextId = 0;
	const now = options.now ?? Date.now;
	const limit = options.limit ?? DEFAULT_REALTIME_VOICE_FORCED_CONSULT_LIMIT;
	const nativeDedupeMs = options.nativeDedupeMs ?? DEFAULT_REALTIME_VOICE_FORCED_CONSULT_NATIVE_DEDUPE_MS;
	const setTimer = options.setTimer ?? ((fn, ms) => {
		const timer = setTimeout(fn, ms);
		timer.unref?.();
		return { clear: () => clearTimeout(timer) };
	});
	const questionsMatch = options.questionsMatch ?? matchRealtimeVoiceConsultQuestions;
	const clearTimer = (stored) => {
		stored.timer?.clear();
		stored.timer = void 0;
	};
	const scheduleCleanup = (stored) => {
		stored.cleanupTimer?.clear();
		stored.cleanupTimer = setTimer(() => {
			if (state.get(stored.handle.id) === stored) state.delete(stored.handle.id);
		}, nativeDedupeMs);
	};
	const prune = () => {
		const earliestRecentNative = now() - nativeDedupeMs;
		for (let index = recentNativeConsults.length - 1; index >= 0; index -= 1) {
			const recent = recentNativeConsults[index];
			if (recent && recent.at < earliestRecentNative) recentNativeConsults.splice(index, 1);
		}
		while (recentNativeConsults.length > limit) recentNativeConsults.shift();
		while (state.size > limit) {
			const first = state.values().next().value;
			if (!first) return;
			first.timer?.clear();
			first.cleanupTimer?.clear();
			state.delete(first.handle.id);
		}
	};
	const findMatching = (question) => {
		if (!question) return;
		return [...state.values()].toReversed().find((candidate) => candidate.questions.some((candidateQuestion) => questionsMatch(candidateQuestion, question)));
	};
	const rememberStoredQuestion = (stored, question) => {
		const trimmed = question?.trim();
		if (!trimmed) return;
		if (stored.questions.some((candidate) => questionsMatch(candidate, trimmed))) return;
		stored.questions.push(trimmed);
	};
	const recordRecentNativeConsult = (question) => {
		recentNativeConsults.push({
			question,
			at: now()
		});
		prune();
	};
	const hasRecentNativeConsult = (question, recentOptions = {}) => {
		prune();
		return recentNativeConsults.toReversed().some((recent) => recent.question ? questionsMatch(recent.question, question) : recentOptions.allowUnknownQuestion === true);
	};
	const getStored = (handle) => state.get(handle.id);
	return {
		prepare(question, prepareOptions) {
			const trimmed = question.trim();
			if (!trimmed) return;
			const id = prepareOptions?.id ?? `forced-consult:${now()}:${++nextId}`;
			const existing = state.get(id);
			if (existing) {
				existing.timer?.clear();
				existing.cleanupTimer?.clear();
			}
			const handle = {
				id,
				question: trimmed,
				...prepareOptions && "context" in prepareOptions ? { context: prepareOptions.context } : {}
			};
			state.set(handle.id, {
				handle,
				createdAt: now(),
				nativeCallIds: /* @__PURE__ */ new Set(),
				questions: [trimmed],
				pending: true,
				started: false,
				delivered: false,
				cancelled: false
			});
			prune();
			return handle;
		},
		schedule(handle, delayMs, run) {
			const stored = getStored(handle);
			if (!stored || !stored.pending || stored.timer) return;
			stored.timer = setTimer(() => {
				stored.timer = void 0;
				if (state.get(handle.id) === stored && stored.pending && !stored.cancelled) run(handle);
			}, delayMs);
		},
		clearPending() {
			for (const stored of state.values()) if (stored.pending) {
				clearTimer(stored);
				state.delete(stored.handle.id);
			}
		},
		consumePending(question) {
			const pendingCandidates = [...state.values()].filter((candidate) => candidate.pending);
			const stored = !question && pendingCandidates.length === 1 ? pendingCandidates[0] : pendingCandidates.toReversed().find((candidate) => candidate.questions.some((candidateQuestion) => questionsMatch(candidateQuestion, question)));
			if (!stored?.pending) return;
			clearTimer(stored);
			stored.pending = false;
			return stored.handle;
		},
		cancelPending(handle) {
			const stored = getStored(handle);
			if (!stored?.pending) return;
			clearTimer(stored);
			stored.pending = false;
			state.delete(handle.id);
		},
		recordNativeConsult(args, nativeCallId) {
			const question = readRealtimeVoiceConsultQuestion(args);
			recordRecentNativeConsult(question);
			const pending = [...state.values()].toReversed().find((candidate) => candidate.pending && candidate.questions.some((candidateQuestion) => questionsMatch(candidateQuestion, question)));
			if (pending) {
				clearTimer(pending);
				rememberStoredQuestion(pending, question);
				if (nativeCallId) pending.nativeCallIds.add(nativeCallId);
				pending.pending = false;
				scheduleCleanup(pending);
				return {
					kind: "pending",
					question,
					handle: pending.handle
				};
			}
			const stored = findMatching(question);
			if (!stored || stored.cancelled) return {
				kind: "none",
				question
			};
			if (nativeCallId) stored.nativeCallIds.add(nativeCallId);
			rememberStoredQuestion(stored, question);
			if (stored.delivered) return {
				kind: "already_delivered",
				question,
				handle: stored.handle
			};
			if (stored.started) return {
				kind: "in_flight",
				question,
				handle: stored.handle
			};
			return {
				kind: "none",
				question
			};
		},
		markStarted(handle) {
			const stored = getStored(handle);
			if (!stored) return;
			clearTimer(stored);
			stored.pending = false;
			stored.started = true;
		},
		markDelivered(handle) {
			const stored = getStored(handle);
			if (!stored) return;
			clearTimer(stored);
			stored.pending = false;
			stored.started = true;
			stored.delivered = true;
			scheduleCleanup(stored);
		},
		markCancelled(handle) {
			const stored = getStored(handle);
			if (!stored) return;
			clearTimer(stored);
			stored.pending = false;
			stored.cancelled = true;
			scheduleCleanup(stored);
		},
		isCancelled(handle) {
			return getStored(handle)?.cancelled === true;
		},
		nativeCallIds(handle) {
			return [...getStored(handle)?.nativeCallIds ?? []];
		},
		handles() {
			return [...state.values()].map((stored) => stored.handle);
		},
		rememberQuestion(handle, question) {
			const stored = getStored(handle);
			if (stored) rememberStoredQuestion(stored, question);
		},
		findRecent(question) {
			prune();
			return findMatching(question)?.handle;
		},
		hasRecent(question) {
			return Boolean(findMatching(question));
		},
		hasRecentNativeConsult,
		remove(handle) {
			const stored = getStored(handle);
			stored?.timer?.clear();
			stored?.cleanupTimer?.clear();
			state.delete(handle.id);
		},
		clear() {
			for (const stored of state.values()) {
				stored.timer?.clear();
				stored.cleanupTimer?.clear();
			}
			state.clear();
			recentNativeConsults.length = 0;
		}
	};
}
//#endregion
//#region src/talk/agent-consult-tool.ts
const REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME = "openclaw_agent_consult";
const REALTIME_VOICE_AGENT_CONSULT_TOOL_POLICIES = [
	"safe-read-only",
	"owner",
	"none"
];
const REALTIME_VOICE_AGENT_CONSULT_TOOL = {
	type: "function",
	name: REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME,
	description: "Delegate the caller's request to the configured OpenClaw agent for normal tool-backed work, actions, context, memory, or reasoning before speaking.",
	parameters: {
		type: "object",
		properties: {
			question: {
				type: "string",
				description: "The concrete question or task the user asked."
			},
			context: {
				type: "string",
				description: "Optional relevant context or transcript summary."
			},
			responseStyle: {
				type: "string",
				description: "Optional style hint for the spoken answer."
			}
		},
		required: ["question"]
	}
};
function buildRealtimeVoiceAgentConsultWorkingResponse(audienceLabel = "person") {
	return {
		status: "working",
		tool: REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME,
		message: `Tell the ${audienceLabel} briefly that you are checking, then wait for the final OpenClaw result before answering with the actual result.`
	};
}
const SAFE_READ_ONLY_TOOLS = [
	"read",
	"web_search",
	"web_fetch",
	"x_search",
	"memory_search",
	"memory_get"
];
function isRealtimeVoiceAgentConsultToolPolicy(value) {
	return typeof value === "string" && REALTIME_VOICE_AGENT_CONSULT_TOOL_POLICIES.includes(value);
}
function resolveRealtimeVoiceAgentConsultToolPolicy(value, fallback) {
	const normalized = normalizeOptionalLowercaseString(value);
	return isRealtimeVoiceAgentConsultToolPolicy(normalized) ? normalized : fallback;
}
function resolveRealtimeVoiceAgentConsultTools(policy, customTools = []) {
	const tools = /* @__PURE__ */ new Map();
	if (policy !== "none") tools.set(REALTIME_VOICE_AGENT_CONSULT_TOOL.name, REALTIME_VOICE_AGENT_CONSULT_TOOL);
	for (const tool of customTools) if (!tools.has(tool.name)) tools.set(tool.name, tool);
	return [...tools.values()];
}
function resolveRealtimeVoiceAgentConsultToolsAllow(policy) {
	if (policy === "owner") return;
	if (policy === "safe-read-only") return [...SAFE_READ_ONLY_TOOLS];
	return [];
}
function buildRealtimeVoiceAgentConsultPolicyInstructions(config) {
	if (config.toolPolicy === "none" || !config.consultPolicy || config.consultPolicy === "auto") return;
	if (config.consultPolicy === "always") return [
		"Consult behavior:",
		"- Call openclaw_agent_consult before every substantive answer.",
		"- You may answer directly only for greetings, acknowledgements, brief latency tests, or filler while waiting for the consult result.",
		"- After the consult result arrives, speak that result concisely."
	].join("\n");
	return [
		"Consult behavior:",
		"- Answer directly for greetings, acknowledgements, simple conversational glue, and brief latency tests.",
		"- Call openclaw_agent_consult before answering requests that need facts, memory, current information, tools, workspace state, or the user's OpenClaw-specific context.",
		"- Keep spoken replies concise and natural."
	].join("\n");
}
function parseRealtimeVoiceAgentConsultArgs(args) {
	const question = readConsultStringArg(args, "question") ?? readConsultStringArg(args, "prompt") ?? readConsultStringArg(args, "query") ?? readConsultStringArg(args, "task");
	if (!question) throw new Error("question required");
	return {
		question,
		context: readConsultStringArg(args, "context"),
		responseStyle: readConsultStringArg(args, "responseStyle")
	};
}
function buildRealtimeVoiceAgentConsultChatMessage(args) {
	const parsed = parseRealtimeVoiceAgentConsultArgs(args);
	return [
		parsed.question,
		parsed.context ? `Context:\n${parsed.context}` : void 0,
		parsed.responseStyle ? `Spoken style:\n${parsed.responseStyle}` : void 0
	].filter(Boolean).join("\n\n");
}
function buildRealtimeVoiceAgentConsultPrompt(params) {
	const parsed = parseRealtimeVoiceAgentConsultArgs(params.args);
	const assistantLabel = params.assistantLabel ?? "Agent";
	const questionSourceLabel = params.questionSourceLabel ?? params.userLabel.toLowerCase();
	const transcript = params.transcript.slice(-12).map((entry) => `${entry.role === "assistant" ? assistantLabel : params.userLabel}: ${entry.text}`).join("\n");
	return [
		`Live voice request from the ${questionSourceLabel} during ${params.surface}.`,
		"Act as the configured OpenClaw agent on behalf of this user. Use available tools when the request asks you to do work.",
		"When finished, return only the concise result the realtime voice agent should speak back.",
		"Do not include markdown, tool logs, or private reasoning. Include citations only when the spoken answer needs them.",
		parsed.responseStyle ? `Spoken style: ${parsed.responseStyle}` : void 0,
		transcript ? `Recent voice transcript for context:\n${transcript}` : void 0,
		parsed.context ? `Additional realtime context:\n${parsed.context}` : void 0,
		`User request:\n${parsed.question}`
	].filter(Boolean).join("\n\n");
}
function collectRealtimeVoiceAgentConsultVisibleText(payloads) {
	const chunks = [];
	for (const payload of payloads) {
		if (payload.isError || payload.isReasoning) continue;
		const text = normalizeOptionalString(payload.text);
		if (text) chunks.push(text);
	}
	return chunks.length > 0 ? chunks.join("\n\n").trim() : null;
}
function readConsultStringArg(args, key) {
	if (!args || typeof args !== "object" || Array.isArray(args)) return;
	return normalizeOptionalString(args[key]);
}
//#endregion
//#region src/talk/agent-run-control-shared.ts
const REALTIME_VOICE_AGENT_CONTROL_MODES = [
	"status",
	"steer",
	"cancel",
	"followup"
];
const REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME = "openclaw_agent_control";
const REALTIME_VOICE_AGENT_CONTROL_TOOL = {
	type: "function",
	name: REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME,
	description: "Control an active OpenClaw tool-backed voice run. Use this when the caller asks in any language for status/progress, cancellation, a redirect/change to the active work, or a follow-up after the current work. Do not use this for ordinary greetings or chatter unless the caller is asking about the active work.",
	parameters: {
		type: "object",
		properties: {
			text: {
				type: "string",
				description: "The caller's exact spoken request or a concise semantic equivalent."
			},
			mode: {
				type: "string",
				enum: REALTIME_VOICE_AGENT_CONTROL_MODES,
				description: "status for progress questions, cancel for stop/abort, steer for changing the current work, followup for work to do after the current result."
			}
		},
		required: ["text", "mode"]
	}
};
function normalizeRealtimeVoiceAgentControlMode(value) {
	const normalized = normalizeOptionalLowercaseString(value);
	return REALTIME_VOICE_AGENT_CONTROL_MODES.includes(normalized) ? normalized : void 0;
}
const CANCEL_CONTROL_PATTERNS = [
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?(?:cancel|cancle|abort)(?:\s+(?:that|this|it|the\s+(?:check|run|task|work)))?(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?(?:never mind|nevermind|forget it|kill it|end that)(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?stop(?:\s+(?:that|this|it|the\s+(?:check|run|task|work)))?(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:can|could|would)\s+you\s+(?:please\s+)?(?:cancel|cancle|stop|abort)(?:\s+(?:that|this|it|the\s+(?:check|run|task|work)))?(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right|actually)[,\s]+)?(?:can|could|would)\s+(?:we|you)\s+(?:just\s+)?(?:cancel|cancle|stop|abort)(?:\s+(?:that|this|it|the\s+(?:check|run|task|work)))?(?:\s*[.!?])?$/,
	/\b(?:cancel|cancle|stop|abort)\s+(?:that|this|it|the\s+(?:check|run|task|work))\b/
];
const STATUS_CONTROL_PATTERNS = [
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:status|progress|update)(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:give me|what'?s|any)\s+(?:an?\s+)?update(?:\s*[.!?])?$/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(where are we|what'?s happening|what (?:are you|is it) doing|what'?s it doing|how (?:is|are) (?:it|you|that|this) going|how'?s it going|are you still working|is it done|did it finish)(\b|[.!?])/
];
const FOLLOWUP_CONTROL_PATTERNS = [/^(after that|when you'?re done|when it'?s done|next|then|also|one more thing|follow up)(\b|[,.!?])/];
const STEER_CONTROL_PATTERNS = [
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?update\s+\S/,
	/^(?:actually|instead|change|switch|focus|use|try|prefer|make|do|check|look at|go with|redirect|steer|tell it to)\b/,
	/^(?:can|could|would)\s+you\s+(?:actually\s+)?(?:change|switch|focus|use|try|prefer|make|do|check|look at|go with|redirect|steer)\b/,
	/\b(?:instead|not that|rather than|change that|switch to|focus on|use the|try the|go with|tell it to)\b/
];
const STOP_REDIRECT_CONTROL_PATTERNS = [
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?stop\s+(?:using|doing|checking|looking at|focusing on|trying)\b/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:can|could|would)\s+(?:you|we)\s+(?:please\s+)?stop\s+(?:using|doing|checking|looking at|focusing on|trying)\b/,
	/^(?:(?:ok|okay|alright|all right)[,\s]+)?(?:please\s+)?stop\s+(?:that|this|it|the\s+(?:check|run|task|work))\s+from\b/
];
function matchesAnyPattern(text, patterns) {
	return patterns.some((pattern) => pattern.test(text));
}
function hasNegatedCancelIntent(text) {
	return /\b(?:don'?t|do\s+not|not|never)\s+(?:please\s+)?(?:cancel|cancle|stop|abort|kill|end)\b/.test(text) || /\bstop\s+(?:it|that|this)\s+from\b/.test(text);
}
function resolveRealtimeVoiceAgentControlIntent(params) {
	const explicitMode = normalizeRealtimeVoiceAgentControlMode(params.mode);
	if (explicitMode) return {
		mode: explicitMode,
		confidence: "high",
		reason: "explicit_mode",
		shouldAutoControl: true
	};
	const normalized = params.text.trim().toLowerCase();
	if (matchesAnyPattern(normalized, STOP_REDIRECT_CONTROL_PATTERNS)) return {
		mode: "steer",
		confidence: "medium",
		reason: "steer_command",
		shouldAutoControl: true
	};
	if (!hasNegatedCancelIntent(normalized) && matchesAnyPattern(normalized, CANCEL_CONTROL_PATTERNS)) return {
		mode: "cancel",
		confidence: "high",
		reason: "cancel_safety",
		shouldAutoControl: true
	};
	if (matchesAnyPattern(normalized, STATUS_CONTROL_PATTERNS)) return {
		mode: "status",
		confidence: "high",
		reason: "status_query",
		shouldAutoControl: true
	};
	if (matchesAnyPattern(normalized, FOLLOWUP_CONTROL_PATTERNS)) return {
		mode: "followup",
		confidence: "high",
		reason: "followup_marker",
		shouldAutoControl: true
	};
	if (matchesAnyPattern(normalized, STEER_CONTROL_PATTERNS)) return {
		mode: "steer",
		confidence: "medium",
		reason: "steer_command",
		shouldAutoControl: true
	};
	return {
		mode: "status",
		confidence: "low",
		reason: "safe_default",
		shouldAutoControl: false
	};
}
function classifyRealtimeVoiceAgentControlText(text) {
	return resolveRealtimeVoiceAgentControlIntent({ text }).mode;
}
function shouldAutoControlRealtimeVoiceAgentText(text) {
	return resolveRealtimeVoiceAgentControlIntent({ text }).shouldAutoControl;
}
function parseRealtimeVoiceAgentControlToolArgs(args) {
	const parsed = parseRealtimeVoiceAgentControlToolArgsRecord(args);
	const record = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
	const text = normalizeOptionalString(record.text) ?? normalizeOptionalString(record.message) ?? normalizeOptionalString(record.request) ?? normalizeOptionalString(record.query);
	if (!text) throw new Error("text required");
	return {
		text,
		mode: normalizeRealtimeVoiceAgentControlMode(record.mode) ?? resolveRealtimeVoiceAgentControlIntent({ text }).mode
	};
}
function parseRealtimeVoiceAgentControlToolArgsRecord(args) {
	if (typeof args !== "string") return args;
	const trimmed = args.trim();
	if (!trimmed) return {};
	try {
		return JSON.parse(trimmed);
	} catch {
		return { text: trimmed };
	}
}
function buildRealtimeVoiceAgentControlSpeechMessage(text) {
	return [
		"Internal OpenClaw voice control result.",
		"Do not call openclaw_agent_consult or any other tool for this message.",
		"Speak this exact OpenClaw status to the voice call, without adding, removing, or rephrasing words.",
		`Status: ${JSON.stringify(text)}`
	].join("\n");
}
function buildRealtimeVoiceAgentCancelProviderResult(message = "Cancelled the active OpenClaw run.") {
	return {
		status: "cancelled",
		message
	};
}
function buildRealtimeVoiceAgentFollowupSteeringText(text) {
	return [
		"Spoken follow-up for the current voice call.",
		"If you are mid-task, incorporate this after the current step or result unless it directly changes the current task.",
		"",
		text
	].join("\n");
}
function formatRealtimeVoiceAgentQueueRejection(mode, reason) {
	if (reason === "compacting") return "OpenClaw is compacting the active run and cannot accept voice steering yet.";
	if (reason === "not_streaming") return "OpenClaw has an active run, but it is not currently accepting steering.";
	return mode === "followup" ? "OpenClaw could not queue that follow-up." : "OpenClaw could not steer the active run.";
}
function isRealtimeVoiceAgentControlToolEvent(event) {
	if (!event.type.startsWith("tool.")) return false;
	return normalizeOptionalString((event.payload && typeof event.payload === "object" ? event.payload : {}).name) === REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME;
}
function formatRealtimeVoiceAgentStatus(params) {
	const recent = (params.recentEvents ?? []).toReversed();
	if (!params.active) return recent.find((event) => event.type === "turn.ended") ? "OpenClaw finished the last voice request." : "I'm not working on an active request right now.";
	const toolEvent = recent.find((event) => event.type.startsWith("tool.") && !isRealtimeVoiceAgentControlToolEvent(event));
	if (toolEvent) {
		const payload = toolEvent.payload && typeof toolEvent.payload === "object" ? toolEvent.payload : {};
		const name = normalizeOptionalString(payload.name);
		const phase = normalizeOptionalString(payload.phase);
		if (toolEvent.type === "tool.call") return name ? `OpenClaw is starting ${name}.` : "OpenClaw is starting a tool.";
		if (toolEvent.type === "tool.result") return name ? `OpenClaw finished ${name} and is continuing.` : "OpenClaw finished a tool and is continuing.";
		if (toolEvent.type === "tool.progress") return name ? `OpenClaw is working in ${name}${phase ? ` (${phase})` : ""}.` : "OpenClaw is still working.";
	}
	if (params.activity?.activeToolName) return `OpenClaw is running ${params.activity.activeToolName}.`;
	if (params.activity?.activeWorkKind === "model_call") return "OpenClaw is waiting on the model.";
	if (params.activity?.activeWorkKind === "embedded_run" || params.activity?.hasActiveEmbeddedRun) return "OpenClaw is working on the current voice request.";
	return "OpenClaw is working on the current voice request.";
}
//#endregion
//#region src/talk/agent-run-control.ts
const defaultDeps = {
	abortEmbeddedPiRun,
	getDiagnosticSessionActivitySnapshot,
	queueEmbeddedPiMessageWithOutcomeAsync,
	resolveActiveEmbeddedRunSessionId
};
async function controlRealtimeVoiceAgentRun(params, deps = defaultDeps) {
	const sessionKey = params.sessionKey.trim();
	const text = params.text.trim();
	const mode = resolveRealtimeVoiceAgentControlIntent({
		text,
		mode: params.mode
	}).mode;
	const sessionId = deps.resolveActiveEmbeddedRunSessionId(sessionKey);
	const activity = deps.getDiagnosticSessionActivitySnapshot({
		sessionId,
		sessionKey
	});
	const active = Boolean(sessionId || activity.activeWorkKind || activity.hasActiveEmbeddedRun);
	if (mode === "status") return {
		ok: true,
		mode,
		sessionKey,
		...sessionId ? { sessionId } : {},
		active,
		message: formatRealtimeVoiceAgentStatus({
			active,
			recentEvents: params.recentEvents,
			activity
		}),
		speak: true,
		show: true,
		suppress: false
	};
	if (mode === "cancel") {
		if (!sessionId) return {
			ok: false,
			mode,
			sessionKey,
			active: false,
			aborted: false,
			reason: "no_active_run",
			message: "There is no active OpenClaw run to cancel.",
			speak: true,
			show: true,
			suppress: false
		};
		const aborted = deps.abortEmbeddedPiRun(sessionId);
		const message = aborted ? "Cancelled the active OpenClaw run." : "OpenClaw could not cancel the active run.";
		return {
			ok: aborted,
			mode,
			sessionKey,
			sessionId,
			active: true,
			aborted,
			...aborted ? {} : { reason: "abort_rejected" },
			message,
			speak: true,
			show: true,
			suppress: false,
			...aborted ? { providerResult: buildRealtimeVoiceAgentCancelProviderResult(message) } : {}
		};
	}
	if (!sessionId) return {
		ok: false,
		mode,
		sessionKey,
		active: false,
		queued: false,
		reason: "no_active_run",
		message: "There is no active OpenClaw run to steer.",
		speak: true,
		show: true,
		suppress: false
	};
	const steerText = mode === "followup" ? buildRealtimeVoiceAgentFollowupSteeringText(text) : text;
	const outcome = await deps.queueEmbeddedPiMessageWithOutcomeAsync(sessionId, steerText, {
		steeringMode: "all",
		debounceMs: 0
	});
	if (!outcome.queued) return {
		ok: false,
		mode,
		sessionKey,
		sessionId: outcome.sessionId,
		active: true,
		queued: false,
		reason: outcome.reason,
		message: formatRealtimeVoiceAgentQueueRejection(mode, outcome.reason),
		speak: true,
		show: true,
		suppress: false
	};
	return {
		ok: true,
		mode,
		sessionKey,
		sessionId: outcome.sessionId,
		active: true,
		queued: true,
		target: outcome.target,
		message: mode === "followup" ? "Queued that follow-up for the active OpenClaw run." : "Got it. I steered the active run.",
		speak: true,
		show: true,
		suppress: false,
		...outcome.enqueuedAtMs !== void 0 ? { enqueuedAtMs: outcome.enqueuedAtMs } : {},
		...outcome.deliveredAtMs !== void 0 ? { deliveredAtMs: outcome.deliveredAtMs } : {}
	};
}
//#endregion
//#region src/talk/provider-registry.ts
function normalizeRealtimeVoiceProviderId(providerId) {
	return normalizeCapabilityProviderId(providerId);
}
function resolveRealtimeVoiceProviderEntries(cfg) {
	return resolvePluginCapabilityProviders({
		key: "realtimeVoiceProviders",
		cfg
	});
}
function buildProviderMaps(cfg) {
	return buildCapabilityProviderMaps(resolveRealtimeVoiceProviderEntries(cfg));
}
function listRealtimeVoiceProviders(cfg) {
	return [...buildProviderMaps(cfg).canonical.values()];
}
function getRealtimeVoiceProvider(providerId, cfg) {
	const normalized = normalizeRealtimeVoiceProviderId(providerId);
	if (!normalized) return;
	const directProvider = resolvePluginCapabilityProvider({
		key: "realtimeVoiceProviders",
		providerId: normalized,
		cfg
	});
	if (directProvider) return directProvider;
	return buildProviderMaps(cfg).aliases.get(normalized);
}
function canonicalizeRealtimeVoiceProviderId(providerId, cfg) {
	const normalized = normalizeRealtimeVoiceProviderId(providerId);
	if (!normalized) return;
	return getRealtimeVoiceProvider(normalized, cfg)?.id ?? normalized;
}
//#endregion
//#region src/talk/provider-resolver.ts
function resolveConfiguredRealtimeVoiceProvider(params) {
	const cfgForResolve = params.cfgForResolve ?? params.cfg ?? {};
	const providers = params.providers ?? listRealtimeVoiceProviders(params.cfg);
	const resolution = resolveConfiguredCapabilityProvider({
		configuredProviderId: params.configuredProviderId,
		providerConfigs: params.providerConfigs,
		cfg: params.cfg,
		cfgForResolve,
		getConfiguredProvider: (providerId) => params.providers?.find((entry) => entry.id === providerId) ?? getRealtimeVoiceProvider(providerId, params.cfg),
		listProviders: () => providers,
		resolveProviderConfig: ({ provider, cfg, rawConfig }) => {
			const rawConfigWithOverrides = {
				...params.defaultModel && rawConfig.model === void 0 ? {
					...rawConfig,
					model: params.defaultModel
				} : rawConfig,
				...params.providerConfigOverrides
			};
			return provider.resolveConfig?.({
				cfg,
				rawConfig: rawConfigWithOverrides
			}) ?? rawConfigWithOverrides;
		},
		isProviderConfigured: ({ provider, cfg, providerConfig }) => provider.isConfigured({
			cfg,
			providerConfig
		})
	});
	if (!resolution.ok && resolution.code === "missing-configured-provider") throw new Error(`Realtime voice provider "${resolution.configuredProviderId}" is not registered`);
	if (!resolution.ok && resolution.code === "no-registered-provider") throw new Error(params.noRegisteredProviderMessage ?? "No realtime voice provider registered");
	if (!resolution.ok) throw new Error(`Realtime voice provider "${resolution.provider?.id}" is not configured`);
	return {
		provider: resolution.provider,
		providerConfig: resolution.providerConfig
	};
}
//#endregion
//#region src/talk/session-runtime.ts
function createRealtimeVoiceBridgeSession(params) {
	let bridge;
	const requireBridge = () => {
		if (!bridge) throw new Error("Realtime voice bridge is not ready");
		return bridge;
	};
	const session = {
		get bridge() {
			return requireBridge();
		},
		acknowledgeMark: () => requireBridge().acknowledgeMark(),
		close: () => requireBridge().close(),
		connect: () => requireBridge().connect(),
		sendAudio: (audio) => requireBridge().sendAudio(audio),
		sendUserMessage: (text) => requireBridge().sendUserMessage?.(text),
		handleBargeIn: (options) => requireBridge().handleBargeIn?.(options),
		setMediaTimestamp: (ts) => requireBridge().setMediaTimestamp(ts),
		submitToolResult: (callId, result, options) => requireBridge().submitToolResult(callId, result, options),
		triggerGreeting: (instructions) => requireBridge().triggerGreeting?.(instructions)
	};
	const canSendAudio = () => params.audioSink.isOpen?.() ?? true;
	bridge = params.provider.createBridge({
		cfg: params.cfg,
		providerConfig: params.providerConfig,
		audioFormat: params.audioFormat,
		instructions: params.instructions,
		autoRespondToAudio: params.autoRespondToAudio,
		interruptResponseOnInputAudio: params.interruptResponseOnInputAudio,
		tools: params.tools,
		onAudio: (audio) => {
			if (canSendAudio()) params.audioSink.sendAudio(audio);
		},
		onClearAudio: () => {
			if (canSendAudio()) params.audioSink.clearAudio?.();
		},
		onMark: (markName) => {
			if (!canSendAudio() || params.markStrategy === "ignore") return;
			if (params.markStrategy === "ack-immediately") {
				bridge?.acknowledgeMark();
				return;
			}
			if (params.markStrategy === void 0 || params.markStrategy === "transport") params.audioSink.sendMark?.(markName);
		},
		onTranscript: params.onTranscript,
		onEvent: params.onEvent,
		onToolCall: (event) => {
			if (!bridge) return;
			params.onToolCall?.(event, session);
		},
		onReady: () => {
			if (!bridge) return;
			if (params.triggerGreetingOnReady) bridge.triggerGreeting?.(params.initialGreetingInstructions);
			params.onReady?.(session);
		},
		onError: params.onError,
		onClose: params.onClose
	});
	return session;
}
//#endregion
export { resolveRealtimeVoiceAgentConsultToolsAllow as A, recordTalkLogEvent as B, buildRealtimeVoiceAgentConsultPrompt as C, parseRealtimeVoiceAgentConsultArgs as D, isRealtimeVoiceAgentConsultToolPolicy as E, readSpeakableRealtimeVoiceToolResult as F, REALTIME_VOICE_AUDIO_FORMAT_G711_ULAW_8KHZ as G, recordTalkDiagnosticEvent as H, createTalkSessionController as I, REALTIME_VOICE_AUDIO_FORMAT_PCM16_24KHZ as K, normalizeTalkTransport as L, matchRealtimeVoiceConsultQuestions as M, normalizeRealtimeVoiceConsultQuestion as N, resolveRealtimeVoiceAgentConsultToolPolicy as O, readRealtimeVoiceConsultQuestion as P, recordTalkObservabilityEvent as R, buildRealtimeVoiceAgentConsultPolicyInstructions as S, collectRealtimeVoiceAgentConsultVisibleText as T, TALK_EVENT_TYPES as U, createTalkDiagnosticEvent as V, createTalkEventSequencer as W, shouldAutoControlRealtimeVoiceAgentText as _, listRealtimeVoiceProviders as a, REALTIME_VOICE_AGENT_CONSULT_TOOL_POLICIES as b, REALTIME_VOICE_AGENT_CONTROL_MODES as c, buildRealtimeVoiceAgentCancelProviderResult as d, buildRealtimeVoiceAgentControlSpeechMessage as f, resolveRealtimeVoiceAgentControlIntent as g, parseRealtimeVoiceAgentControlToolArgs as h, getRealtimeVoiceProvider as i, createRealtimeVoiceForcedConsultCoordinator as j, resolveRealtimeVoiceAgentConsultTools as k, REALTIME_VOICE_AGENT_CONTROL_TOOL as l, normalizeRealtimeVoiceAgentControlMode as m, resolveConfiguredRealtimeVoiceProvider as n, normalizeRealtimeVoiceProviderId as o, classifyRealtimeVoiceAgentControlText as p, canonicalizeRealtimeVoiceProviderId as r, controlRealtimeVoiceAgentRun as s, createRealtimeVoiceBridgeSession as t, REALTIME_VOICE_AGENT_CONTROL_TOOL_NAME as u, REALTIME_VOICE_AGENT_CONSULT_TOOL as v, buildRealtimeVoiceAgentConsultWorkingResponse as w, buildRealtimeVoiceAgentConsultChatMessage as x, REALTIME_VOICE_AGENT_CONSULT_TOOL_NAME as y, createTalkLogRecord as z };
