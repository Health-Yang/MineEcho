import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { t as resolveAgentHarnessPolicy } from "./policy-vFgV2Ptr.js";
import { a as resolveContextEngine } from "./registry-DxH_0Os-.js";
import { pt as createPreparedEmbeddedPiSettingsManager, t as maybeCompactAgentHarnessSession } from "./selection-C4e-Qn9W.js";
import { p as buildEmbeddedCompactionRuntimeContext } from "./attempt.prompt-helpers-6Y-UzS6M.js";
import { _ as resolveCompactionTimeoutMs, g as compactWithSafetyTimeout, h as compactContextEngineWithSafetyTimeout, o as shouldPreemptivelyCompactBeforePrompt } from "./attempt.tool-run-context-TMML7ez9.js";
import { a as resolveEffectiveCompactionMode, n as applyPiAutoCompactionGuard } from "./pi-settings-BdQiXWNP.js";
import { t as ensureContextEnginesInitialized } from "./init-Dd1uDq_y.js";
import { a as resolveLiveToolResultMaxChars } from "./tool-result-truncation-B6rIoGLw.js";
import { c as runContextEngineMaintenance } from "./context-engine-lifecycle-DxaBy-g1.js";
import { t as ensureSelectedAgentHarnessPlugin } from "./runtime-plugin-C_po5gkc.js";
import { n as recordCliCompactionInStore } from "./session-store-C4u6Buay.js";
import { SessionManager } from "@earendil-works/pi-coding-agent";
//#region src/agents/command/cli-compaction.ts
const log = createSubsystemLogger("agents/cli-compaction");
const cliCompactionDeps = {
	openSessionManager: (sessionFile) => SessionManager.open(sessionFile),
	ensureContextEnginesInitialized,
	resolveContextEngine,
	createPreparedEmbeddedPiSettingsManager,
	applyPiAutoCompactionGuard,
	shouldPreemptivelyCompactBeforePrompt,
	resolveLiveToolResultMaxChars,
	runContextEngineMaintenance,
	ensureSelectedAgentHarnessPlugin,
	maybeCompactAgentHarnessSession,
	recordCliCompactionInStore
};
function setCliCompactionTestDeps(overrides) {
	Object.assign(cliCompactionDeps, overrides);
}
function resetCliCompactionTestDeps() {
	Object.assign(cliCompactionDeps, {
		openSessionManager: (sessionFile) => SessionManager.open(sessionFile),
		ensureContextEnginesInitialized,
		resolveContextEngine,
		createPreparedEmbeddedPiSettingsManager,
		applyPiAutoCompactionGuard,
		shouldPreemptivelyCompactBeforePrompt,
		resolveLiveToolResultMaxChars,
		runContextEngineMaintenance,
		ensureSelectedAgentHarnessPlugin,
		maybeCompactAgentHarnessSession,
		recordCliCompactionInStore
	});
}
function resolvePositiveInteger(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return;
	return Math.floor(value);
}
function getSessionBranchMessages(sessionManager) {
	return sessionManager.getBranch().flatMap((entry) => entry.type === "message" && typeof entry.message === "object" && entry.message !== null ? [entry.message] : []);
}
function resolveSessionTokenSnapshot(sessionEntry) {
	return resolvePositiveInteger(sessionEntry?.totalTokensFresh === false ? void 0 : sessionEntry?.totalTokens);
}
function isNativeHarnessCompactionSession(sessionEntry, provider) {
	const harnessId = sessionEntry?.agentHarnessId?.trim().toLowerCase();
	if (!harnessId || harnessId === "pi") return false;
	const providerId = provider.trim().toLowerCase();
	return harnessId === providerId || harnessId === "codex" && (providerId === "codex" || providerId === "openai" || providerId === "openai-codex");
}
function isUnsupportedNativeHarnessCompaction(result) {
	return result?.ok === false && result.failure?.reason === "unsupported_harness_compaction";
}
function isRecoverableNativeHarnessCompactionFailure(result) {
	return result?.ok === false && (result.failure?.reason === "missing_thread_binding" || result.failure?.reason === "stale_thread_binding");
}
function isCodexNativeHarnessCompactionSession(sessionEntry, provider) {
	const harnessId = sessionEntry.agentHarnessId?.trim().toLowerCase();
	const providerId = provider.trim().toLowerCase();
	return harnessId === "codex" && (providerId === "codex" || providerId === "openai" || providerId === "openai-codex");
}
function shouldSkipAutomaticCompactionForCodexRuntime(params) {
	const runtimeOverride = params.sessionEntry.agentRuntimeOverride?.trim().toLowerCase();
	if (runtimeOverride && runtimeOverride !== "auto" && runtimeOverride !== "default") return runtimeOverride === "codex";
	if (params.sessionEntry.agentHarnessId?.trim().toLowerCase()) return isCodexNativeHarnessCompactionSession(params.sessionEntry, params.provider);
	return resolveAgentHarnessPolicy({
		provider: params.provider,
		modelId: params.model,
		config: params.cfg,
		agentId: params.sessionAgentId,
		sessionKey: params.sessionKey
	}).runtime === "codex";
}
function readAgentIdFromSessionKey(sessionKey) {
	const parts = sessionKey.trim().split(":");
	return parts[0] === "agent" && parts[1]?.trim() ? parts[1].trim() : void 0;
}
function buildCliCompactionRuntimeContext(params) {
	return {
		...buildEmbeddedCompactionRuntimeContext({
			sessionKey: params.sessionKey,
			messageChannel: params.messageChannel,
			messageProvider: params.messageChannel,
			agentAccountId: params.agentAccountId,
			authProfileId: void 0,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			config: params.cfg,
			skillsSnapshot: params.skillsSnapshot,
			senderIsOwner: params.senderIsOwner,
			provider: params.provider,
			modelId: params.model,
			thinkLevel: params.thinkLevel,
			extraSystemPrompt: params.extraSystemPrompt
		}),
		currentTokenCount: params.currentTokenCount,
		tokenBudget: params.contextTokenBudget,
		trigger: params.trigger
	};
}
async function compactCliTranscript(params) {
	const runtimeContext = buildCliCompactionRuntimeContext({
		sessionKey: params.sessionKey,
		messageChannel: params.messageChannel,
		agentAccountId: params.agentAccountId,
		workspaceDir: params.workspaceDir,
		agentDir: params.agentDir,
		cfg: params.cfg,
		skillsSnapshot: params.skillsSnapshot,
		senderIsOwner: params.senderIsOwner,
		provider: params.provider,
		model: params.model,
		thinkLevel: params.thinkLevel,
		extraSystemPrompt: params.extraSystemPrompt,
		currentTokenCount: params.currentTokenCount,
		contextTokenBudget: params.contextTokenBudget,
		trigger: "cli_budget"
	});
	let compactResult;
	try {
		compactResult = await compactContextEngineWithSafetyTimeout(params.contextEngine, {
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile,
			tokenBudget: params.contextTokenBudget,
			currentTokenCount: params.currentTokenCount,
			force: true,
			compactionTarget: "budget",
			runtimeContext
		}, resolveCompactionTimeoutMs(params.cfg));
	} catch (error) {
		log.warn(`CLI transcript compaction failed for ${params.provider}/${params.model}: ${error instanceof Error ? error.message : String(error)}`);
		return {
			compacted: false,
			failureReason: error instanceof Error ? error.message : String(error)
		};
	}
	if (!compactResult.compacted) {
		log.warn(`CLI transcript compaction did not reduce context for ${params.provider}/${params.model}: ${compactResult.reason ?? "nothing to compact"}`);
		return {
			compacted: false,
			failureReason: compactResult.reason ?? "compaction did not reduce context"
		};
	}
	try {
		await cliCompactionDeps.runContextEngineMaintenance({
			contextEngine: params.contextEngine,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile,
			reason: "compaction",
			sessionManager: params.sessionManager,
			runtimeContext,
			config: params.cfg
		});
	} catch (error) {
		if (!params.bestEffortMaintenance) throw error;
		log.warn(`CLI transcript compaction maintenance failed after fallback for ${params.provider}/${params.model}: ${error instanceof Error ? error.message : String(error)}`);
	}
	return { compacted: true };
}
async function compactNativeHarnessCliTranscript(params) {
	let result;
	try {
		const sessionAgentId = readAgentIdFromSessionKey(params.sessionKey);
		const nativeHarnessId = params.sessionEntry.agentHarnessId?.trim();
		await cliCompactionDeps.ensureSelectedAgentHarnessPlugin({
			provider: params.provider,
			modelId: params.model,
			config: params.cfg,
			sessionKey: params.sessionKey,
			workspaceDir: params.workspaceDir,
			...sessionAgentId ? { agentId: sessionAgentId } : {},
			...nativeHarnessId ? { agentHarnessRuntimeOverride: nativeHarnessId } : {}
		});
		result = await compactWithSafetyTimeout((abortSignal) => cliCompactionDeps.maybeCompactAgentHarnessSession({
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile: params.sessionFile,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			config: params.cfg,
			skillsSnapshot: params.skillsSnapshot,
			provider: params.provider,
			model: params.model,
			contextTokenBudget: params.contextTokenBudget,
			currentTokenCount: params.currentTokenCount,
			trigger: "budget",
			force: true,
			messageChannel: params.messageChannel,
			agentAccountId: params.agentAccountId,
			senderIsOwner: params.senderIsOwner,
			thinkLevel: params.thinkLevel,
			extraSystemPrompt: params.extraSystemPrompt,
			allowGatewaySubagentBinding: true,
			...params.contextEngine ? {
				contextEngine: params.contextEngine,
				contextEngineRuntimeContext: buildCliCompactionRuntimeContext({
					sessionKey: params.sessionKey,
					messageChannel: params.messageChannel,
					agentAccountId: params.agentAccountId,
					workspaceDir: params.workspaceDir,
					agentDir: params.agentDir,
					cfg: params.cfg,
					skillsSnapshot: params.skillsSnapshot,
					senderIsOwner: params.senderIsOwner,
					provider: params.provider,
					model: params.model,
					thinkLevel: params.thinkLevel,
					extraSystemPrompt: params.extraSystemPrompt,
					currentTokenCount: params.currentTokenCount,
					contextTokenBudget: params.contextTokenBudget,
					trigger: "cli_native_budget"
				})
			} : {},
			...nativeHarnessId ? { agentHarnessId: nativeHarnessId } : {},
			...abortSignal ? { abortSignal } : {}
		}), resolveCompactionTimeoutMs(params.cfg));
	} catch (error) {
		log.warn(`CLI native harness compaction failed for ${params.provider}/${params.model}: ${error instanceof Error ? error.message : String(error)}`);
		return {
			compacted: false,
			failureReason: error instanceof Error ? error.message : String(error)
		};
	}
	if (!result?.compacted) {
		const fallbackToContextEngine = !isCodexNativeHarnessCompactionSession(params.sessionEntry, params.provider) && (isUnsupportedNativeHarnessCompaction(result) || isRecoverableNativeHarnessCompactionFailure(result));
		log.warn(`CLI native harness compaction did not reduce context for ${params.provider}/${params.model}: ${result?.reason ?? "nothing to compact"}`);
		return {
			compacted: false,
			fallbackToContextEngine,
			failureReason: result?.reason ?? "native harness compaction did not reduce context"
		};
	}
	return {
		compacted: true,
		result
	};
}
async function runCliTurnCompactionLifecycle(params) {
	const sessionEntry = params.sessionEntry;
	const sessionFile = sessionEntry?.sessionFile;
	const contextTokenBudget = resolvePositiveInteger(sessionEntry?.contextTokens);
	if (!sessionFile || !contextTokenBudget) return sessionEntry;
	if (shouldSkipAutomaticCompactionForCodexRuntime({
		cfg: params.cfg,
		sessionEntry,
		sessionAgentId: params.sessionAgentId,
		sessionKey: params.sessionKey,
		provider: params.provider,
		model: params.model
	})) {
		log.debug("skipping OpenClaw CLI compaction for Codex runtime session", {
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			provider: params.provider,
			model: params.model
		});
		return sessionEntry;
	}
	const sessionManager = cliCompactionDeps.openSessionManager(sessionFile);
	const settingsManager = await cliCompactionDeps.createPreparedEmbeddedPiSettingsManager({
		cwd: params.workspaceDir,
		agentDir: params.agentDir,
		cfg: params.cfg,
		contextTokenBudget
	});
	const preemptiveCompaction = cliCompactionDeps.shouldPreemptivelyCompactBeforePrompt({
		messages: getSessionBranchMessages(sessionManager),
		prompt: "",
		contextTokenBudget,
		reserveTokens: settingsManager.getCompactionReserveTokens(),
		toolResultMaxChars: cliCompactionDeps.resolveLiveToolResultMaxChars({
			contextWindowTokens: contextTokenBudget,
			cfg: params.cfg,
			agentId: params.sessionAgentId
		})
	});
	const tokenSnapshot = resolveSessionTokenSnapshot(params.sessionEntry);
	const currentTokenCount = Math.max(preemptiveCompaction.estimatedPromptTokens, tokenSnapshot ?? 0);
	if (!preemptiveCompaction.shouldCompact && currentTokenCount <= preemptiveCompaction.promptBudgetBeforeReserve) return params.sessionEntry;
	let compacted = false;
	let nativeCompactionResult;
	let useContextEngineCompaction = true;
	let nativeFallbackToContextEngine = false;
	let resolvedContextEngine;
	let autoCompactionGuardApplied = false;
	const applyAutoCompactionGuard = async (contextEngine) => {
		if (autoCompactionGuardApplied) return;
		autoCompactionGuardApplied = true;
		await cliCompactionDeps.applyPiAutoCompactionGuard({
			settingsManager,
			contextEngineInfo: contextEngine.info,
			compactionMode: resolveEffectiveCompactionMode(params.cfg)
		});
	};
	if (isNativeHarnessCompactionSession(params.sessionEntry, params.provider)) {
		cliCompactionDeps.ensureContextEnginesInitialized();
		resolvedContextEngine = await cliCompactionDeps.resolveContextEngine(params.cfg);
		await applyAutoCompactionGuard(resolvedContextEngine);
		const nativeOutcome = await compactNativeHarnessCliTranscript({
			cfg: params.cfg,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile,
			sessionEntry: params.sessionEntry,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			provider: params.provider,
			model: params.model,
			contextTokenBudget,
			currentTokenCount,
			contextEngine: resolvedContextEngine,
			skillsSnapshot: params.skillsSnapshot,
			messageChannel: params.messageChannel,
			agentAccountId: params.agentAccountId,
			senderIsOwner: params.senderIsOwner,
			thinkLevel: params.thinkLevel,
			extraSystemPrompt: params.extraSystemPrompt
		});
		if (nativeOutcome.compacted) {
			compacted = true;
			nativeCompactionResult = nativeOutcome.result;
			useContextEngineCompaction = false;
		} else if (!nativeOutcome.fallbackToContextEngine) throw new Error(`CLI native harness compaction failed for ${params.provider}/${params.model}: ${nativeOutcome.failureReason ?? "compaction did not reduce context"}`);
		else nativeFallbackToContextEngine = true;
	}
	if (useContextEngineCompaction) {
		if (!resolvedContextEngine) {
			cliCompactionDeps.ensureContextEnginesInitialized();
			resolvedContextEngine = await cliCompactionDeps.resolveContextEngine(params.cfg);
		}
		const contextEngine = resolvedContextEngine;
		await applyAutoCompactionGuard(contextEngine);
		const contextOutcome = await compactCliTranscript({
			contextEngine,
			sessionId: params.sessionId,
			sessionKey: params.sessionKey,
			sessionFile,
			sessionManager,
			cfg: params.cfg,
			workspaceDir: params.workspaceDir,
			agentDir: params.agentDir,
			provider: params.provider,
			model: params.model,
			contextTokenBudget,
			currentTokenCount,
			skillsSnapshot: params.skillsSnapshot,
			messageChannel: params.messageChannel,
			agentAccountId: params.agentAccountId,
			senderIsOwner: params.senderIsOwner,
			thinkLevel: params.thinkLevel,
			extraSystemPrompt: params.extraSystemPrompt,
			bestEffortMaintenance: nativeFallbackToContextEngine
		});
		compacted = contextOutcome.compacted;
		if (!compacted) throw new Error(`CLI transcript compaction failed for ${params.provider}/${params.model}: ${contextOutcome.failureReason ?? "compaction did not reduce context"}`);
	}
	if (!compacted || !params.sessionStore || !params.storePath) return params.sessionEntry;
	return await cliCompactionDeps.recordCliCompactionInStore({
		provider: params.provider,
		sessionKey: params.sessionKey,
		sessionStore: params.sessionStore,
		storePath: params.storePath,
		tokensAfter: nativeCompactionResult?.result?.tokensAfter,
		newSessionId: nativeCompactionResult?.result?.sessionId,
		newSessionFile: nativeCompactionResult?.result?.sessionFile
	}) ?? params.sessionEntry;
}
//#endregion
export { resetCliCompactionTestDeps, runCliTurnCompactionLifecycle, setCliCompactionTestDeps };
