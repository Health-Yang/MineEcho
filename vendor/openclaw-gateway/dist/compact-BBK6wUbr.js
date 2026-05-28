import { i as asOptionalRecord } from "./record-coerce-Btbek4uV.js";
import { t as log } from "./logger-DLLDK9dc.js";
import "./string-coerce-runtime-qOd7_06l.js";
import "./agent-harness-runtime-BFJ9rqEd.js";
import { t as defaultCodexAppServerClientFactory } from "./client-factory-B5I7lD3g.js";
import { l as resolveCodexAppServerRuntimeOptions } from "./config-ME2vVfAE.js";
import { i as readCodexAppServerBinding } from "./session-binding-T1l8KnfH.js";
import { n as resolveCodexNativeExecutionBlock } from "./sandbox-guard-BkGRFhmz.js";
//#region extensions/codex/src/app-server/compact.ts
const warnedIgnoredCompactionOverrides = /* @__PURE__ */ new Set();
async function maybeCompactCodexAppServerSession(params, options = {}) {
	warnIfIgnoringOpenClawCompactionOverrides(params);
	return compactCodexNativeThread(params, options);
}
function warnIfIgnoringOpenClawCompactionOverrides(params) {
	const ignoredConfig = readIgnoredCompactionOverridePaths(params);
	if (ignoredConfig.length === 0) return;
	const warningKey = ignoredConfig.join("\0");
	if (warnedIgnoredCompactionOverrides.has(warningKey)) return;
	warnedIgnoredCompactionOverrides.add(warningKey);
	log.warn("ignoring OpenClaw compaction overrides for Codex app-server compaction; Codex uses native server-side compaction", {
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		ignoredConfig
	});
}
function readIgnoredCompactionOverridePaths(params) {
	const ignored = /* @__PURE__ */ new Set();
	for (const entry of readCompactionOverrideEntries(params)) {
		const localProvider = typeof entry.record.provider === "string" ? entry.record.provider.trim() : "";
		const inheritedProvider = !localProvider && typeof entry.inheritedRecord?.provider === "string" ? entry.inheritedRecord.provider.trim() : "";
		const providerPath = localProvider ? `${entry.path}.compaction.provider` : inheritedProvider && entry.inheritedPath ? `${entry.inheritedPath}.compaction.provider` : void 0;
		if (typeof entry.record.model === "string" && entry.record.model.trim()) ignored.add(`${entry.path}.compaction.model`);
		if (providerPath) ignored.add(providerPath);
	}
	return [...ignored];
}
function readCompactionOverrideEntries(params) {
	const entries = [];
	const defaultCompaction = asOptionalRecord(asOptionalRecord(params.config?.agents)?.defaults)?.compaction;
	const defaultRecord = asOptionalRecord(defaultCompaction);
	if (defaultRecord) entries.push({
		path: "agents.defaults",
		record: defaultRecord
	});
	const agentId = readAgentIdFromSessionKey(params.sessionKey ?? params.sandboxSessionKey);
	if (!agentId) return entries;
	const agentCompaction = asOptionalRecord((Array.isArray(params.config?.agents?.list) ? params.config.agents.list : []).find((agent) => {
		return (typeof agent?.id === "string" ? agent.id.trim().toLowerCase() : "") === agentId;
	}))?.compaction;
	const agentRecord = asOptionalRecord(agentCompaction);
	if (agentRecord) entries.push({
		path: `agents.list.${agentId}`,
		record: agentRecord,
		inheritedRecord: defaultRecord,
		inheritedPath: "agents.defaults"
	});
	return entries;
}
function readAgentIdFromSessionKey(sessionKey) {
	const parts = sessionKey?.trim().toLowerCase().split(":").filter(Boolean) ?? [];
	if (parts.length < 3 || parts[0] !== "agent") return;
	return parts[1]?.trim() || void 0;
}
async function compactCodexNativeThread(params, options = {}) {
	if (params.trigger !== "manual") {
		log.info("skipping codex app-server compaction for non-manual trigger", {
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			trigger: params.trigger
		});
		return {
			ok: true,
			compacted: false,
			reason: "codex app-server owns automatic compaction",
			result: {
				summary: "",
				firstKeptEntryId: "",
				tokensBefore: params.currentTokenCount ?? 0,
				details: {
					backend: "codex-app-server",
					skipped: true,
					reason: "non_manual_trigger",
					trigger: params.trigger ?? "unknown"
				}
			}
		};
	}
	const nativeExecutionBlock = resolveCodexNativeExecutionBlock({
		config: params.config,
		sessionKey: params.sandboxSessionKey ?? params.sessionKey,
		sessionId: params.sessionId,
		surface: "native compaction"
	});
	if (nativeExecutionBlock) return {
		ok: false,
		compacted: false,
		reason: nativeExecutionBlock
	};
	const appServer = resolveCodexAppServerRuntimeOptions({ pluginConfig: options.pluginConfig });
	const binding = await readCodexAppServerBinding(params.sessionFile, { config: params.config });
	if (!binding?.threadId) return failedCodexThreadBindingCompactionResult(params, {
		reason: "no codex app-server thread binding",
		recovery: "missing_thread_binding"
	});
	const requestedAuthProfileId = params.authProfileId?.trim() || void 0;
	if (requestedAuthProfileId && binding.authProfileId && binding.authProfileId !== requestedAuthProfileId) return {
		ok: false,
		compacted: false,
		reason: "auth profile mismatch for session binding"
	};
	const client = await (options.clientFactory ?? defaultCodexAppServerClientFactory)(appServer.start, requestedAuthProfileId ?? binding.authProfileId, params.agentDir, params.config);
	try {
		await client.request("thread/compact/start", { threadId: binding.threadId });
		log.info("started codex app-server compaction", {
			sessionId: params.sessionId,
			threadId: binding.threadId
		});
	} catch (error) {
		if (isCodexThreadNotFoundError(error)) return failedCodexThreadBindingCompactionResult(params, {
			threadId: binding.threadId,
			reason: formatCompactionError(error),
			recovery: "stale_thread_binding"
		});
		log.warn("codex app-server compaction failed", {
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			threadId: binding.threadId,
			reason: formatCompactionError(error)
		});
		return {
			ok: false,
			compacted: false,
			reason: formatCompactionError(error)
		};
	}
	const resultDetails = {
		backend: "codex-app-server",
		threadId: binding.threadId,
		signal: "thread/compact/start",
		pending: true
	};
	return {
		ok: true,
		compacted: false,
		result: {
			summary: "",
			firstKeptEntryId: "",
			tokensBefore: params.currentTokenCount ?? 0,
			details: resultDetails
		}
	};
}
function failedCodexThreadBindingCompactionResult(params, recovery) {
	log.warn("codex app-server compaction could not use thread binding", {
		sessionId: params.sessionId,
		sessionKey: params.sessionKey,
		threadId: recovery.threadId,
		reason: recovery.reason,
		recovery: recovery.recovery
	});
	return {
		ok: false,
		compacted: false,
		reason: recovery.reason,
		failure: {
			reason: recovery.recovery,
			rawError: recovery.reason
		}
	};
}
function isCodexThreadNotFoundError(error) {
	return formatCompactionError(error).toLowerCase().includes("thread not found");
}
function formatCompactionError(error) {
	if (error instanceof Error) return error.message;
	return String(error);
}
//#endregion
export { maybeCompactCodexAppServerSession };
