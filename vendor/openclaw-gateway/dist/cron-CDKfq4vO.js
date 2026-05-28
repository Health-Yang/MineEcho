import { c as normalizeOptionalString } from "./string-coerce-DKw2K5wM.js";
import { i as formatErrorMessage } from "./errors-BsfWgA0I.js";
import { a as isSubagentSessionKey } from "./session-key-utils-AmKO9Roj.js";
import { c as resolveDefaultAgentId } from "./agent-scope-config-BfxErZq2.js";
import { u as normalizeMessageChannel } from "./message-channel-CD8Rw4Ab.js";
import { B as validateCronUpdateParams, F as validateCronListParams, Gn as validateWakeParams, I as validateCronRemoveParams, Ii as ErrorCodes, L as validateCronRunParams, Li as errorShape, N as validateCronAddParams, P as validateCronGetParams, R as validateCronRunsParams, t as formatValidationErrors, z as validateCronStatusParams } from "./protocol-BkfNT2Bp.js";
import { a as resolveCronRunLogPath, n as readCronRunLogEntriesPage, r as readCronRunLogEntriesPageAll } from "./run-log-CGtDW323.js";
import { a as resolveCronDeliverySessionKey, r as isInvalidCronSessionTargetIdError } from "./webhook-url-Bch1Wp-U.js";
import { i as parseAbsoluteTimeMs } from "./stagger-Bn6ApiDa.js";
import { r as normalizeCronJobPatch, t as normalizeCronJobCreate } from "./normalize-BZxiuyCR.js";
import { d as listConfiguredAnnounceChannelIdsForConfig } from "./channel-plugin-ids-KD4z3Jyk.js";
import { n as resolveTargetPrefixedChannel, o as validateTargetProviderPrefix } from "./target-parsing-loaded-BPWzTLZz.js";
import { n as resolveCronDeliveryPlan, t as hasExplicitCronDeliveryTarget } from "./delivery-plan-ByuK9NBT.js";
import { _ as resolveDeliveryTarget, n as applyJobPatch } from "./jobs-D9tfyDpF.js";
//#region src/cron/delivery-preview.ts
function formatTarget(channel, to) {
	if (!channel) return "last";
	if (to) return `${channel}:${to}`;
	return channel;
}
function formatDeliveryDetail(params) {
	if (params.requestedChannel === "last" || !params.requestedChannel) {
		if (!params.resolved) return params.error ? `last -> no route, will fail-closed: ${params.error}` : "last -> no route, will fail-closed";
		return params.sessionKey ? `resolved from last, session ${params.sessionKey}` : "resolved from last, main session";
	}
	return params.resolved ? "explicit" : params.error ?? "unresolved";
}
async function resolveCronDeliveryPreview(params) {
	const plan = resolveCronDeliveryPlan(params.job);
	if (plan.mode === "none" && !hasExplicitCronDeliveryTarget(plan)) return {
		label: "not requested",
		detail: "not requested"
	};
	if (plan.mode === "webhook") return {
		label: plan.to ? `webhook:${plan.to}` : "webhook",
		detail: plan.to ? "webhook" : "webhook target missing"
	};
	const requestedChannel = plan.channel ?? "last";
	const agentId = params.job.agentId?.trim() || params.defaultAgentId || resolveDefaultAgentId(params.cfg);
	const deliverySessionKey = resolveCronDeliverySessionKey(params.job);
	const resolved = await resolveDeliveryTarget(params.cfg, agentId, {
		channel: requestedChannel,
		to: plan.to,
		threadId: plan.threadId,
		accountId: plan.accountId,
		sessionKey: deliverySessionKey
	}, { dryRun: true });
	if (!resolved.ok) return {
		label: `${plan.mode} -> ${formatTarget(requestedChannel, plan.to ?? null)}`,
		detail: plan.mode === "none" ? `message tool target unresolved: ${resolved.error.message}` : formatDeliveryDetail({
			requestedChannel,
			resolved: false,
			sessionKey: deliverySessionKey,
			error: resolved.error.message
		})
	};
	return {
		label: `${plan.mode} -> ${formatTarget(resolved.channel, resolved.to)}`,
		detail: formatDeliveryDetail({
			requestedChannel,
			resolved: true,
			sessionKey: deliverySessionKey
		})
	};
}
async function resolveCronDeliveryPreviews(params) {
	const entries = await Promise.all(params.jobs.map(async (job) => [job.id, await resolveCronDeliveryPreview({
		cfg: params.cfg,
		defaultAgentId: params.defaultAgentId,
		job
	})]));
	return Object.fromEntries(entries);
}
//#endregion
//#region src/cron/validate-timestamp.ts
const ONE_MINUTE_MS = 60 * 1e3;
const TEN_YEARS_MS = 10 * 365.25 * 24 * 60 * 60 * 1e3;
/**
* Validates at timestamps in cron schedules.
* Rejects timestamps that are:
* - More than 1 minute in the past
* - More than 10 years in the future
*/
function validateScheduleTimestamp(schedule, nowMs = Date.now()) {
	if (schedule.kind !== "at") return { ok: true };
	const atRaw = normalizeOptionalString(schedule.at) ?? "";
	const atMs = atRaw ? parseAbsoluteTimeMs(atRaw) : null;
	if (atMs === null || !Number.isFinite(atMs)) return {
		ok: false,
		message: `Invalid schedule.at: expected ISO-8601 timestamp (got ${schedule.at})`
	};
	const diffMs = atMs - nowMs;
	if (diffMs < -6e4) {
		const nowDate = new Date(nowMs).toISOString();
		return {
			ok: false,
			message: `schedule.at is in the past: ${new Date(atMs).toISOString()} (${Math.floor(-diffMs / ONE_MINUTE_MS)} minutes ago). Current time: ${nowDate}`
		};
	}
	if (diffMs > TEN_YEARS_MS) return {
		ok: false,
		message: `schedule.at is too far in the future: ${new Date(atMs).toISOString()} (${Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1e3))} years ahead). Maximum allowed: 10 years`
	};
	return { ok: true };
}
//#endregion
//#region src/gateway/server-methods/cron.ts
function listConfiguredAnnounceChannelIds(cfg) {
	return listConfiguredAnnounceChannelIdsForConfig({
		config: cfg,
		env: process.env
	});
}
function assertConfiguredAnnounceChannel(params) {
	if (params.channel === "last") return;
	const configuredChannels = listConfiguredAnnounceChannelIds(params.cfg).toSorted();
	const normalizedChannel = normalizeMessageChannel(params.channel);
	if (!normalizedChannel) {
		if (configuredChannels.length <= 1) return;
		throw new Error(`${params.field} is required when multiple channels are configured: ${configuredChannels.join(", ")}`);
	}
	if (configuredChannels.length === 0) return;
	if (configuredChannels.includes(normalizedChannel)) return;
	throw new Error(`${params.field} must be one of: ${configuredChannels.join(", ")}`);
}
function resolveAnnounceValidationChannel(params) {
	if (params.channel && params.channel !== "last") return params.channel;
	return resolveTargetPrefixedChannel(params.to) ?? params.channel;
}
function assertCompatibleAnnounceTarget(params) {
	if (!params.channel || params.channel === "last") return;
	const error = validateTargetProviderPrefix({
		channel: params.channel,
		to: params.to
	});
	if (error) throw new Error(`${params.field}: ${error.message}`);
}
function assertValidCronAnnounceDelivery(params) {
	if (params.delivery && (params.delivery.mode ?? "announce") === "announce") {
		assertCompatibleAnnounceTarget({
			channel: params.delivery.channel,
			to: params.delivery.to,
			field: "delivery.channel"
		});
		assertConfiguredAnnounceChannel({
			cfg: params.cfg,
			channel: resolveAnnounceValidationChannel({
				channel: params.delivery.channel,
				to: params.delivery.to
			}),
			field: "delivery.channel"
		});
	}
	const failureDestination = params.delivery?.failureDestination;
	if (failureDestination && (failureDestination.mode ?? "announce") === "announce") {
		assertCompatibleAnnounceTarget({
			channel: failureDestination.channel,
			to: failureDestination.to,
			field: "delivery.failureDestination.channel"
		});
		assertConfiguredAnnounceChannel({
			cfg: params.cfg,
			channel: resolveAnnounceValidationChannel({
				channel: failureDestination.channel,
				to: failureDestination.to
			}),
			field: "delivery.failureDestination.channel"
		});
	}
}
function assertValidCronCreateDelivery(cfg, jobCreate) {
	assertValidCronAnnounceDelivery({
		cfg,
		delivery: jobCreate.delivery
	});
}
function assertValidCronUpdateDelivery(params) {
	if (!params.currentJob || !("delivery" in params.patch)) return;
	const nextJob = structuredClone(params.currentJob);
	applyJobPatch(nextJob, params.patch, { defaultAgentId: params.defaultAgentId });
	assertValidCronAnnounceDelivery({
		cfg: params.cfg,
		delivery: nextJob.delivery
	});
}
const cronHandlers = {
	wake: ({ params, respond, context }) => {
		if (!validateWakeParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid wake params: ${formatValidationErrors(validateWakeParams.errors)}`));
			return;
		}
		const p = params;
		const sessionKey = p.sessionKey?.trim() || void 0;
		if (sessionKey && isSubagentSessionKey(sessionKey)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "wake sessionKey cannot target a subagent session"));
			return;
		}
		respond(true, context.cron.wake({
			mode: p.mode,
			text: p.text,
			...sessionKey ? { sessionKey } : {}
		}), void 0);
	},
	"cron.list": async ({ params, respond, context }) => {
		if (!validateCronListParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.list params: ${formatValidationErrors(validateCronListParams.errors)}`));
			return;
		}
		const p = params;
		const page = await context.cron.listPage({
			includeDisabled: p.includeDisabled,
			limit: p.limit,
			offset: p.offset,
			query: p.query,
			enabled: p.enabled,
			sortBy: p.sortBy,
			sortDir: p.sortDir,
			agentId: p.agentId
		});
		const deliveryPreviews = await resolveCronDeliveryPreviews({
			cfg: context.getRuntimeConfig(),
			defaultAgentId: context.cron.getDefaultAgentId(),
			jobs: page.jobs
		});
		respond(true, {
			...page,
			deliveryPreviews
		}, void 0);
	},
	"cron.status": async ({ params, respond, context }) => {
		if (!validateCronStatusParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.status params: ${formatValidationErrors(validateCronStatusParams.errors)}`));
			return;
		}
		respond(true, await context.cron.status(), void 0);
	},
	"cron.get": async ({ params, respond, context }) => {
		if (!validateCronGetParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.get params: ${formatValidationErrors(validateCronGetParams.errors)}`));
			return;
		}
		const p = params;
		const jobId = p.id ?? p.jobId;
		if (!jobId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid cron.get params: missing id"));
			return;
		}
		const job = await context.cron.readJob(jobId);
		if (!job) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `cron job not found: ${jobId}`));
			return;
		}
		respond(true, job, void 0);
	},
	"cron.add": async ({ params, respond, context }) => {
		const sessionKey = typeof params?.sessionKey === "string" ? params.sessionKey : void 0;
		let normalized;
		try {
			normalized = normalizeCronJobCreate(params, { sessionContext: { sessionKey } }) ?? params;
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.add params: ${formatErrorMessage(err)}`));
			return;
		}
		if (!validateCronAddParams(normalized)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.add params: ${formatValidationErrors(validateCronAddParams.errors)}`));
			return;
		}
		const jobCreate = normalized;
		const cfg = context.getRuntimeConfig();
		const timestampValidation = validateScheduleTimestamp(jobCreate.schedule);
		if (!timestampValidation.ok) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, timestampValidation.message));
			return;
		}
		try {
			assertValidCronCreateDelivery(cfg, jobCreate);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.add params: ${formatErrorMessage(err)}`));
			return;
		}
		let job;
		try {
			job = await context.cron.add(jobCreate);
		} catch (err) {
			if (!(err instanceof TypeError) && !(err instanceof RangeError)) throw err;
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.add params: ${formatErrorMessage(err)}`));
			return;
		}
		context.logGateway.info("cron: job created", {
			jobId: job.id,
			schedule: jobCreate.schedule
		});
		respond(true, job, void 0);
	},
	"cron.update": async ({ params, respond, context }) => {
		let normalizedPatch;
		try {
			normalizedPatch = normalizeCronJobPatch(params?.patch);
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.update params: ${formatErrorMessage(err)}`));
			return;
		}
		const candidate = normalizedPatch && typeof params === "object" && params !== null ? {
			...params,
			patch: normalizedPatch
		} : params;
		if (!validateCronUpdateParams(candidate)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.update params: ${formatValidationErrors(validateCronUpdateParams.errors)}`));
			return;
		}
		const p = candidate;
		const jobId = p.id ?? p.jobId;
		if (!jobId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid cron.update params: missing id"));
			return;
		}
		const patch = p.patch;
		const cfg = context.getRuntimeConfig();
		if (patch.schedule) {
			const timestampValidation = validateScheduleTimestamp(patch.schedule);
			if (!timestampValidation.ok) {
				respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, timestampValidation.message));
				return;
			}
		}
		try {
			assertValidCronUpdateDelivery({
				cfg,
				defaultAgentId: context.cron.getDefaultAgentId(),
				currentJob: context.cron.getJob(jobId),
				patch
			});
		} catch (err) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.update params: ${formatErrorMessage(err)}`));
			return;
		}
		let job;
		try {
			job = await context.cron.update(jobId, patch);
		} catch (err) {
			if (!(err instanceof TypeError) && !(err instanceof RangeError)) throw err;
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.update params: ${formatErrorMessage(err)}`));
			return;
		}
		context.logGateway.info("cron: job updated", { jobId });
		respond(true, job, void 0);
	},
	"cron.remove": async ({ params, respond, context }) => {
		if (!validateCronRemoveParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.remove params: ${formatValidationErrors(validateCronRemoveParams.errors)}`));
			return;
		}
		const p = params;
		const jobId = p.id ?? p.jobId;
		if (!jobId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid cron.remove params: missing id"));
			return;
		}
		const result = await context.cron.remove(jobId);
		if (!result.removed) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid cron.remove params: id not found"));
			return;
		}
		context.logGateway.info("cron: job removed", { jobId });
		respond(true, result, void 0);
	},
	"cron.run": async ({ params, respond, context }) => {
		if (!validateCronRunParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.run params: ${formatValidationErrors(validateCronRunParams.errors)}`));
			return;
		}
		const p = params;
		const jobId = p.id ?? p.jobId;
		if (!jobId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid cron.run params: missing id"));
			return;
		}
		let result;
		try {
			result = await context.cron.enqueueRun(jobId, p.mode ?? "force");
		} catch (error) {
			if (isInvalidCronSessionTargetIdError(error)) {
				respond(true, {
					ok: true,
					ran: false,
					reason: "invalid-spec"
				}, void 0);
				return;
			}
			throw error;
		}
		respond(true, result, void 0);
	},
	"cron.runs": async ({ params, respond, context }) => {
		if (!validateCronRunsParams(params)) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `invalid cron.runs params: ${formatValidationErrors(validateCronRunsParams.errors)}`));
			return;
		}
		const p = params;
		const explicitScope = p.scope;
		const jobId = p.id ?? p.jobId;
		const scope = explicitScope ?? (jobId ? "job" : "all");
		if (scope === "job" && !jobId) {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid cron.runs params: missing id"));
			return;
		}
		if (scope === "all") {
			const jobs = await context.cron.list({ includeDisabled: true });
			const jobNameById = Object.fromEntries(jobs.filter((job) => typeof job.id === "string" && typeof job.name === "string").map((job) => [job.id, job.name]));
			respond(true, await readCronRunLogEntriesPageAll({
				storePath: context.cronStorePath,
				limit: p.limit,
				offset: p.offset,
				statuses: p.statuses,
				status: p.status,
				runId: p.runId,
				deliveryStatuses: p.deliveryStatuses,
				deliveryStatus: p.deliveryStatus,
				query: p.query,
				sortDir: p.sortDir,
				jobNameById
			}), void 0);
			return;
		}
		let logPath;
		try {
			logPath = resolveCronRunLogPath({
				storePath: context.cronStorePath,
				jobId
			});
		} catch {
			respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, "invalid cron.runs params: invalid id"));
			return;
		}
		respond(true, await readCronRunLogEntriesPage(logPath, {
			limit: p.limit,
			offset: p.offset,
			jobId,
			statuses: p.statuses,
			status: p.status,
			runId: p.runId,
			deliveryStatuses: p.deliveryStatuses,
			deliveryStatus: p.deliveryStatus,
			query: p.query,
			sortDir: p.sortDir
		}), void 0);
	}
};
//#endregion
export { cronHandlers };
