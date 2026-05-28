import { a as normalizeLowercaseStringOrEmpty } from "./string-coerce-DKw2K5wM.js";
import { d as resolveRedactOptions, o as redactSensitiveLines } from "./redact-9hVaCauP.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { t as formatCliCommand } from "./command-format-CItqrBX6.js";
import { t as clearActiveProgressLine } from "./progress-line-C1NvDnL7.js";
import { t as formatDocsLink } from "./links-CM5vg8_V.js";
import { n as isRich, r as theme, t as colorize } from "./theme-D58JpUfy.js";
import { t as createLazyImportLoader } from "./lazy-promise-Djskx0qC.js";
import { p as formatTimestamp } from "./logger-xjL_xnHy.js";
import { i as isLoopbackHost } from "./net-ziAus6sd.js";
import { i as GATEWAY_CLIENT_NAMES, r as GATEWAY_CLIENT_MODES } from "./client-info-BxgIUTRt.js";
import { d as readConnectPairingRequiredMessage } from "./connect-error-details-Co08hq5R.js";
import { l as isGatewayTransportError, n as buildGatewayConnectionDetails } from "./call-D_O83KsN.js";
import { t as computeBackoff } from "./backoff-BQ4uO4hX.js";
import { n as callGatewayFromCli, t as addGatewayClientOptions } from "./gateway-rpc-D3vd8eva.js";
import { t as readConfiguredLogTail } from "./log-tail-quJdRb5H.js";
import { t as parseLogLine } from "./parse-log-line-C0kclqqn.js";
import { setTimeout } from "node:timers/promises";
//#region src/terminal/stream-writer.ts
function isBrokenPipeError(err) {
	const code = err?.code;
	return code === "EPIPE" || code === "EIO";
}
function createSafeStreamWriter(options = {}) {
	let closed = false;
	let notified = false;
	const noteBrokenPipe = (err, stream) => {
		if (notified) return;
		notified = true;
		options.onBrokenPipe?.(err, stream);
	};
	const handleError = (err, stream) => {
		if (!isBrokenPipeError(err)) throw err;
		closed = true;
		noteBrokenPipe(err, stream);
		return false;
	};
	const write = (stream, text) => {
		if (closed) return false;
		try {
			options.beforeWrite?.();
		} catch (err) {
			return handleError(err, process.stderr);
		}
		try {
			stream.write(text);
			return !closed;
		} catch (err) {
			return handleError(err, stream);
		}
	};
	const writeLine = (stream, text) => write(stream, `${text}\n`);
	return {
		write,
		writeLine,
		reset: () => {
			closed = false;
			notified = false;
		},
		isClosed: () => closed
	};
}
//#endregion
//#region src/cli/logs-cli.ts
const logsCliRuntimeLoader = createLazyImportLoader(() => import("./logs-cli.runtime.js"));
async function loadLogsCliRuntime() {
	return logsCliRuntimeLoader.load();
}
var JournalFallbackUnavailableError = class extends Error {
	constructor() {
		super("Active systemd journal unavailable for logs follow fallback");
		this.name = "JournalFallbackUnavailableError";
	}
};
const LOCAL_FALLBACK_NOTICE = "Local Gateway RPC unavailable; reading configured file log instead.";
const JOURNAL_FALLBACK_NOTICE = "Local Gateway RPC unavailable; reading active systemd gateway journal instead.";
const JOURNAL_CURSOR_PREFIX = "-- cursor: ";
const JOURNAL_MAX_LIMIT = 5e3;
const JOURNAL_MAX_BYTES = 1e6;
function parsePositiveInt(value, fallback) {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
async function fetchLogs(opts, cursors, showProgress) {
	const limit = parsePositiveInt(opts.limit, 200);
	const maxBytes = parsePositiveInt(opts.maxBytes, 25e4);
	if (cursors.forceJournal) {
		const journalPayload = await readSystemdJournalFallback({
			cursor: cursors.journal,
			since: cursors.journalSince,
			limit,
			maxBytes
		});
		if (journalPayload) return journalPayload;
		throw new JournalFallbackUnavailableError();
	}
	try {
		const payload = await callGatewayFromCli("logs.tail", opts, {
			cursor: cursors.gateway,
			limit,
			maxBytes
		}, buildLogsTailGatewayExtra(opts, showProgress));
		if (!payload || typeof payload !== "object") throw new Error("Unexpected logs.tail response");
		return payload;
	} catch (error) {
		if (!shouldUseLocalLogsFallback(opts, error)) throw error;
		if (opts.follow) {
			const journalPayload = await readSystemdJournalFallback({
				cursor: cursors.journal,
				since: cursors.journalSince,
				limit,
				maxBytes
			});
			if (journalPayload) return journalPayload;
			throw error;
		}
		return {
			...await readConfiguredLogTail({
				cursor: cursors.gateway,
				limit,
				maxBytes
			}),
			sourceKind: "file",
			localFallback: true
		};
	}
}
function normalizeErrorMessage(error) {
	if (error instanceof Error) return error.message;
	return String(error);
}
function shouldUseLocalLogsFallback(opts, error) {
	if (!isLocalGatewayRpcUnavailableError(error)) return false;
	if (typeof opts.url === "string" && opts.url.trim().length > 0) return false;
	return isImplicitLoopbackGatewayConnection(isGatewayTransportError(error) ? error.connectionDetails : buildGatewayConnectionDetails());
}
function buildLogsTailGatewayExtra(opts, showProgress) {
	const base = { progress: showProgress };
	if (!shouldUsePassiveLocalLogsClient(opts)) return base;
	return {
		...base,
		clientName: GATEWAY_CLIENT_NAMES.GATEWAY_CLIENT,
		mode: GATEWAY_CLIENT_MODES.BACKEND,
		deviceIdentity: null
	};
}
function shouldUsePassiveLocalLogsClient(opts) {
	if (typeof opts.url === "string" && opts.url.trim().length > 0) return false;
	return isImplicitLoopbackGatewayConnection(buildGatewayConnectionDetails());
}
function isImplicitLoopbackGatewayConnection(connection) {
	if (connection.urlSource !== "local loopback") return false;
	try {
		return isLoopbackHost(new URL(connection.url).hostname);
	} catch {
		return false;
	}
}
function isLocalGatewayRpcUnavailableError(error) {
	if (isGatewayTransportError(error)) return error.kind === "closed" || error.kind === "timeout";
	const message = normalizeLowercaseStringOrEmpty(normalizeErrorMessage(error));
	if (readConnectPairingRequiredMessage(message)) return true;
	return isPlainGatewayRequestCloseError(message) || isPlainGatewayRequestTimeoutError(message);
}
function isPlainGatewayRequestCloseError(message) {
	return message.startsWith("gateway closed (");
}
function isPlainGatewayRequestTimeoutError(message) {
	return /^gateway timeout after \d+ms\b/u.test(message);
}
async function readSystemdJournalFallback(params) {
	if (process.platform !== "linux") return null;
	const runtime = await loadLogsCliRuntime();
	const service = await runtime.readSystemdServiceRuntime(process.env);
	if (service.status !== "running" || typeof service.pid !== "number") return null;
	const limit = clampPositiveInt(params.limit, 1, JOURNAL_MAX_LIMIT);
	const maxBytes = clampPositiveInt(params.maxBytes, 1, JOURNAL_MAX_BYTES);
	const unitName = resolveLogsSystemdUnitName(runtime, process.env);
	const source = `journalctl --user --boot --user-unit=${unitName} _PID=${service.pid}`;
	const args = [
		"--user",
		"--boot",
		`--user-unit=${unitName}`,
		`_PID=${service.pid}`,
		"--no-pager",
		"--output=cat",
		"--show-cursor"
	];
	if (typeof params.cursor === "string" && params.cursor.trim().length > 0) args.push(`--after-cursor=${params.cursor}`);
	else if (params.since) args.push(`--since=${params.since}`);
	else args.push("-n", String(limit));
	const result = await runtime.execFileUtf8Tail("journalctl", args, {
		env: process.env,
		maxBytes
	});
	if (result.code !== 0) return null;
	const boundedOutput = normalizeTailText(result.stdout, result.truncated);
	const parsed = parseJournalctlOutput(boundedOutput.text);
	const lines = parsed.lines.length > limit ? parsed.lines.slice(-limit) : parsed.lines;
	const redaction = resolveRedactOptions();
	return {
		source,
		sourceKind: "journal",
		service: {
			pid: service.pid,
			unit: unitName
		},
		cursor: parsed.cursor ?? params.cursor,
		lines: redactSensitiveLines(lines, redaction),
		truncated: boundedOutput.truncated || parsed.lines.length > limit,
		localFallback: true
	};
}
function clampPositiveInt(value, min, max) {
	if (!Number.isFinite(value)) return min;
	return Math.max(min, Math.min(max, Math.floor(value)));
}
function normalizeTailText(text, truncated) {
	if (!truncated) return {
		text,
		truncated
	};
	const firstNewline = text.indexOf("\n");
	if (firstNewline < 0) return {
		text: "",
		truncated
	};
	return {
		text: text.slice(firstNewline + 1),
		truncated
	};
}
function parseJournalctlOutput(output) {
	const lines = [];
	let cursor;
	for (const rawLine of output.split(/\r?\n/u)) {
		if (!rawLine) continue;
		if (rawLine.startsWith(JOURNAL_CURSOR_PREFIX)) {
			cursor = rawLine.slice(11).trim() || cursor;
			continue;
		}
		lines.push(rawLine);
	}
	return {
		lines,
		cursor
	};
}
function resolveLogsSystemdUnitName(runtime, env) {
	const override = env.OPENCLAW_SYSTEMD_UNIT?.trim();
	if (override) return override.endsWith(".service") ? override : `${override}.service`;
	return `${runtime.resolveGatewaySystemdServiceName(env.OPENCLAW_PROFILE)}.service`;
}
const MAX_FOLLOW_RETRIES = 8;
const FOLLOW_BACKOFF_POLICY = {
	initialMs: 1e3,
	maxMs: 3e4,
	factor: 2,
	jitter: .2
};
function isTransientFollowError(error) {
	if (error instanceof JournalFallbackUnavailableError) return true;
	if (isGatewayTransportError(error)) {
		if (error.kind === "timeout") return true;
		const code = error.code ?? 0;
		return code !== 1008 && !(code >= 4e3 && code <= 4999);
	}
	const message = normalizeLowercaseStringOrEmpty(normalizeErrorMessage(error));
	if (readConnectPairingRequiredMessage(message)) return false;
	return isPlainGatewayRequestCloseError(message) || isPlainGatewayRequestTimeoutError(message);
}
function formatLogTimestamp(value, mode = "plain", localTime = true) {
	if (!value) return "";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return value;
	if (mode === "pretty") return formatTimestamp(parsed, {
		style: "short",
		timeZone: localTime ? void 0 : "UTC"
	});
	return localTime ? formatTimestamp(parsed, { style: "long" }) : parsed.toISOString();
}
function formatLogLine(raw, opts) {
	const parsed = parseLogLine(raw);
	if (!parsed) return raw;
	const label = parsed.subsystem ?? parsed.module ?? "";
	const time = formatLogTimestamp(parsed.time, opts.pretty ? "pretty" : "plain", opts.localTime);
	const level = parsed.level ?? "";
	const levelLabel = level.padEnd(5).trim();
	const message = parsed.message || parsed.raw;
	if (!opts.pretty) return [
		time,
		level,
		label,
		message
	].filter(Boolean).join(" ").trim();
	const timeLabel = colorize(opts.rich, theme.muted, time);
	const labelValue = colorize(opts.rich, theme.accent, label);
	const levelValue = level === "error" || level === "fatal" ? colorize(opts.rich, theme.error, levelLabel) : level === "warn" ? colorize(opts.rich, theme.warn, levelLabel) : level === "debug" || level === "trace" ? colorize(opts.rich, theme.muted, levelLabel) : colorize(opts.rich, theme.info, levelLabel);
	const messageValue = level === "error" || level === "fatal" ? colorize(opts.rich, theme.error, message) : level === "warn" ? colorize(opts.rich, theme.warn, message) : level === "debug" || level === "trace" ? colorize(opts.rich, theme.muted, message) : colorize(opts.rich, theme.info, message);
	return [[
		timeLabel,
		levelValue,
		labelValue
	].filter(Boolean).join(" "), messageValue].filter(Boolean).join(" ").trim();
}
function createLogWriters() {
	const writer = createSafeStreamWriter({
		beforeWrite: () => clearActiveProgressLine(),
		onBrokenPipe: (err, stream) => {
			const code = err.code ?? "EPIPE";
			const message = `openclaw logs: output ${stream === process.stdout ? "stdout" : "stderr"} closed (${code}). Stopping tail.`;
			try {
				clearActiveProgressLine();
				process.stderr.write(`${message}\n`);
			} catch {}
		}
	});
	return {
		logLine: (text) => writer.writeLine(process.stdout, text),
		errorLine: (text) => writer.writeLine(process.stderr, text),
		emitJsonLine: (payload, toStdErr = false) => writer.write(toStdErr ? process.stderr : process.stdout, `${JSON.stringify(payload)}\n`)
	};
}
async function emitGatewayError(err, opts, mode, rich, emitJsonLine, errorLine) {
	const runtime = await loadLogsCliRuntime();
	const message = "Gateway not reachable. Is it running and accessible?";
	const hint = `Hint: run \`${formatCliCommand("openclaw doctor")}\`.`;
	const errorText = formatErrorMessage(err);
	const details = runtime.buildGatewayConnectionDetails({ url: opts.url });
	if (mode === "json") {
		if (!emitJsonLine({
			type: "error",
			message,
			error: errorText,
			details,
			hint
		}, true)) return;
		return;
	}
	if (!errorLine(colorize(rich, theme.error, message))) return;
	if (!errorLine(details.message)) return;
	errorLine(colorize(rich, theme.muted, hint));
}
function registerLogsCli(program) {
	const logs = program.command("logs").description("Tail gateway file logs via RPC").option("--limit <n>", "Max lines to return", "200").option("--max-bytes <n>", "Max bytes to read", "250000").option("--follow", "Follow log output", false).option("--interval <ms>", "Polling interval in ms", "1000").option("--json", "Emit JSON log lines", false).option("--plain", "Plain text output (no ANSI styling)", false).option("--no-color", "Disable ANSI colors").option("--local-time", "Display timestamps in local timezone (default)", false).option("--utc", "Display timestamps in UTC", false).addHelpText("after", () => `\n${theme.muted("Docs:")} ${formatDocsLink("/cli/logs", "docs.openclaw.ai/cli/logs")}\n`);
	addGatewayClientOptions(logs);
	logs.action(async (opts) => {
		const { logLine, errorLine, emitJsonLine } = createLogWriters();
		const interval = parsePositiveInt(opts.interval, 1e3);
		let gatewayCursor;
		let journalCursor;
		let journalSince;
		let forceJournal = false;
		let first = true;
		const jsonMode = Boolean(opts.json);
		const pretty = !jsonMode && process.stdout.isTTY && !opts.plain;
		const rich = isRich() && opts.color !== false;
		const localTime = !opts.utc;
		let followRetryAttempt = 0;
		while (true) {
			let payload;
			const showProgress = first && !opts.follow;
			const gatewayPollStartedAt = (/* @__PURE__ */ new Date()).toISOString();
			try {
				payload = await fetchLogs(opts, {
					gateway: gatewayCursor,
					journal: journalCursor,
					journalSince,
					forceJournal
				}, showProgress);
			} catch (err) {
				if (err instanceof JournalFallbackUnavailableError) forceJournal = false;
				if (opts.follow && followRetryAttempt < MAX_FOLLOW_RETRIES && isTransientFollowError(err)) {
					followRetryAttempt += 1;
					const backoffMs = computeBackoff(FOLLOW_BACKOFF_POLICY, followRetryAttempt);
					const message = `[logs] gateway disconnected, reconnecting in ${Math.round(backoffMs / 1e3)}s...`;
					if (jsonMode) {
						if (!emitJsonLine({
							type: "notice",
							message
						}, true)) return;
					} else if (!errorLine(colorize(rich, theme.warn, message))) return;
					await setTimeout(backoffMs);
					continue;
				}
				await emitGatewayError(err, opts, jsonMode ? "json" : "text", rich, emitJsonLine, errorLine);
				process.exit(1);
				return;
			}
			if (followRetryAttempt > 0) {
				const message = "[logs] gateway reconnected";
				if (jsonMode) {
					if (!emitJsonLine({
						type: "notice",
						message
					}, true)) return;
				} else if (!errorLine(colorize(rich, theme.muted, message))) return;
			}
			followRetryAttempt = 0;
			const lines = Array.isArray(payload.lines) ? payload.lines : [];
			if (jsonMode) {
				if (first) {
					if (!emitJsonLine({
						type: "meta",
						file: payload.file,
						source: payload.source,
						sourceKind: payload.sourceKind,
						service: payload.service,
						cursor: payload.cursor,
						size: payload.size
					})) return;
				}
				for (const line of lines) {
					const parsed = parseLogLine(line);
					if (parsed) {
						if (!emitJsonLine({
							type: "log",
							...parsed
						})) return;
					} else if (!emitJsonLine({
						type: "raw",
						raw: line
					})) return;
				}
				if (payload.truncated) {
					if (!emitJsonLine({
						type: "notice",
						message: "Log tail truncated (increase --max-bytes)."
					})) return;
				}
				if (payload.reset) {
					if (!emitJsonLine({
						type: "notice",
						message: "Log cursor reset (file rotated)."
					})) return;
				}
			} else {
				if (first && payload.localFallback === true) {
					const notice = payload.sourceKind === "journal" ? JOURNAL_FALLBACK_NOTICE : LOCAL_FALLBACK_NOTICE;
					if (!errorLine(colorize(rich, theme.warn, notice))) return;
				}
				if (first) {
					if (payload.sourceKind === "journal" && payload.source) {
						if (!logLine(`${pretty ? colorize(rich, theme.muted, "Log source:") : "Log source:"} ${payload.source}`)) return;
						if (payload.service?.pid !== void 0 && !logLine(`Service PID: ${payload.service.pid}`)) return;
						if (payload.service?.unit && !logLine(`Service Unit: ${payload.service.unit}`)) return;
					} else if (payload.file) {
						if (!logLine(`${pretty ? colorize(rich, theme.muted, "Log file:") : "Log file:"} ${payload.file}`)) return;
					}
				}
				for (const line of lines) if (!logLine(formatLogLine(line, {
					pretty,
					rich,
					localTime
				}))) return;
				if (payload.truncated) {
					if (!errorLine("Log tail truncated (increase --max-bytes).")) return;
				}
				if (payload.reset) {
					if (!errorLine("Log cursor reset (file rotated).")) return;
				}
			}
			if (payload.sourceKind === "journal") {
				forceJournal = true;
				if (typeof payload.cursor === "string" && payload.cursor.trim().length > 0) journalCursor = payload.cursor;
			} else if (typeof payload.cursor === "number" && Number.isFinite(payload.cursor)) {
				gatewayCursor = payload.cursor;
				if (opts.follow) journalSince = gatewayPollStartedAt;
			} else if (typeof payload.cursor === "string" && payload.cursor.trim().length > 0) journalCursor = payload.cursor;
			first = false;
			if (!opts.follow) return;
			await setTimeout(interval);
		}
	});
}
//#endregion
export { formatLogTimestamp, registerLogsCli };
