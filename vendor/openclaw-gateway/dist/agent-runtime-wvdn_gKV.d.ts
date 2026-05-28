import { Cn as AgentDefaultsConfig, i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { t as PluginManifestRecord } from "./manifest-registry-Brx4o2lo.js";
import { o as VerboseLevel, r as ThinkLevel } from "./thinking.shared-EYzuf-Uq.js";
import { m as EmbeddedPiRunMeta, v as MessagingToolSend } from "./params-Dt3_O5uS.js";
import { s as SessionEntry } from "./types-DQR5UfEP.js";
import { t as ModelCatalogEntry } from "./model-catalog.types-BVKKEu7g.js";
import { n as RuntimeEnv } from "./runtime-Bxifh4bY.js";
import { t as CliDeps } from "./deps.types-C8BV1CgG.js";
import { a as OutboundSessionContext } from "./delivery-queue-DAkuhD1U.js";
import { l as projectOutboundPayloadPlanForJson } from "./deliver-D7CBLySq.js";
import { d as ToolExecutorRef, m as ToolPlanEntry, o as ToolAvailabilityContext, p as ToolPlan, r as JsonObject, s as ToolAvailabilityDiagnostic, t as BuildToolPlanOptions, u as ToolDescriptor } from "./types-Cncbh-d7.js";
import { s as AcpSessionResolution, t as AcpSessionManager } from "./manager.core-BDnlqpfU.js";
import { n as AgentCommandOpts, r as AgentCommandResultMetaOverrides, t as AgentCommandIngressOpts } from "./types-DcgKFIQG.js";
//#region src/agents/identity-avatar.d.ts
type AgentAvatarResolution = {
  kind: "none";
  reason: string;
  source?: string;
} | {
  kind: "local";
  filePath: string;
  source: string;
} | {
  kind: "remote";
  url: string;
  source: string;
} | {
  kind: "data";
  url: string;
  source: string;
};
type AgentAvatarPublicSourceInput = {
  kind: AgentAvatarResolution["kind"];
  source?: string | null;
};
declare function resolvePublicAgentAvatarSource(resolved: AgentAvatarPublicSourceInput): string | undefined;
declare function resolveAgentAvatar(cfg: OpenClawConfig, agentId: string, opts?: {
  includeUiOverride?: boolean;
}): AgentAvatarResolution;
//#endregion
//#region src/agents/auth-profiles/path-resolve.d.ts
declare function resolveAuthStorePathForDisplay(agentDir?: string): string;
//#endregion
//#region src/agents/model-catalog-scope.d.ts
declare function resolveModelCatalogScope(params: {
  cfg?: OpenClawConfig;
  provider: string;
  model: string;
}): {
  providerRefs: string[];
  modelRefs: string[];
};
declare function resolveProviderDiscoveryProviderIdsForCatalogScope(params: {
  providerRefs?: readonly string[];
  modelRefs?: readonly string[];
}): string[] | undefined;
//#endregion
//#region src/tools/availability.d.ts
declare function evaluateToolAvailability(params: {
  descriptor: ToolDescriptor;
  context?: ToolAvailabilityContext;
}): readonly ToolAvailabilityDiagnostic[];
//#endregion
//#region src/tools/descriptors.d.ts
declare function defineToolDescriptor(descriptor: ToolDescriptor): ToolDescriptor;
declare function defineToolDescriptors(descriptors: readonly ToolDescriptor[]): readonly ToolDescriptor[];
//#endregion
//#region src/tools/diagnostics.d.ts
type ToolPlanContractErrorCode = "duplicate-tool-name" | "missing-executor";
declare class ToolPlanContractError extends Error {
  readonly code: ToolPlanContractErrorCode;
  readonly toolName: string;
  constructor(params: {
    code: ToolPlanContractErrorCode;
    toolName: string;
    message: string;
  });
}
//#endregion
//#region src/tools/execution.d.ts
declare function formatToolExecutorRef(ref: ToolExecutorRef): string;
//#endregion
//#region src/tools/planner.d.ts
declare function buildToolPlan(options: BuildToolPlanOptions): ToolPlan;
//#endregion
//#region src/tools/protocol.d.ts
type ToolProtocolDescriptor = {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: JsonObject;
};
declare function toToolProtocolDescriptor(entry: ToolPlanEntry): ToolProtocolDescriptor;
declare function toToolProtocolDescriptors(entries: readonly ToolPlanEntry[]): readonly ToolProtocolDescriptor[];
//#endregion
//#region src/agents/command/delivery.d.ts
type AgentCommandDeliveryPayloadStatus = "sent" | "suppressed" | "failed";
type AgentCommandDeliveryPayloadOutcome = {
  index: number;
  status: AgentCommandDeliveryPayloadStatus;
  reason?: string;
  resultCount?: number;
  sentBeforeError?: boolean;
  stage?: string;
  error?: string;
  hookEffect?: {
    cancelReason?: string;
    metadata?: Record<string, unknown>;
  };
};
type AgentCommandDeliveryStatus = {
  requested: true;
  attempted: boolean;
  status: "sent" | "suppressed" | "partial_failed" | "failed"; /** `partial` means at least one payload was sent before a later payload failed. */
  succeeded: true | false | "partial";
  error?: true;
  errorMessage?: string; /** Free-form lowercase_snake reason from durable delivery or preflight validation. */
  reason?: string;
  resultCount?: number;
  sentBeforeError?: true;
  payloadOutcomes?: AgentCommandDeliveryPayloadOutcome[];
};
type AgentCommandDeliveryResult = {
  payloads: ReturnType<typeof projectOutboundPayloadPlanForJson>;
  meta: EmbeddedPiRunMeta & AgentCommandResultMetaOverrides;
  didSendViaMessagingTool?: boolean;
  messagingToolSentTexts?: string[];
  messagingToolSentMediaUrls?: string[];
  messagingToolSentTargets?: MessagingToolSend[];
  deliverySucceeded?: boolean;
  deliveryStatus?: AgentCommandDeliveryStatus;
};
//#endregion
//#region src/agents/agent-runtime-config.d.ts
declare function resolveAgentRuntimeConfig(runtime: RuntimeEnv, params?: {
  runtimeTargetsChannelSecrets?: boolean;
}): Promise<{
  loadedRaw: OpenClawConfig;
  sourceConfig: OpenClawConfig;
  cfg: OpenClawConfig;
}>;
//#endregion
//#region src/agents/agent-command.d.ts
declare function prepareAgentCommandExecution(opts: AgentCommandOpts, runtime: RuntimeEnv): Promise<{
  body: string;
  transcriptBody: string;
  cfg: OpenClawConfig;
  configuredThinkingCatalog: ModelCatalogEntry[];
  normalizedSpawned: {
    spawnedBy?: string;
    groupId?: string;
    groupChannel?: string;
    groupSpace?: string;
    workspaceDir?: string;
  };
  agentCfg: AgentDefaultsConfig | undefined;
  thinkOverride: ThinkLevel | undefined;
  thinkOnce: ThinkLevel | undefined;
  verboseOverride: VerboseLevel | undefined;
  timeoutMs: number;
  sessionId: string;
  sessionKey: string | undefined;
  sessionEntry: SessionEntry | undefined;
  sessionStore: Record<string, SessionEntry> | undefined;
  storePath: string;
  isNewSession: boolean;
  persistedThinking: ThinkLevel | undefined;
  persistedVerbose: VerboseLevel | undefined;
  sessionAgentId: string;
  outboundSession: OutboundSessionContext | undefined;
  workspaceDir: string;
  agentDir: string;
  modelManifestContext: {
    manifestPlugins: readonly PluginManifestRecord[];
  };
  runId: string;
  acpManager: AcpSessionManager;
  acpResolution: AcpSessionResolution | null;
}>;
declare function agentCommand(opts: AgentCommandOpts, runtime?: RuntimeEnv, deps?: CliDeps): Promise<AgentCommandDeliveryResult>;
declare function agentCommandFromIngress(opts: AgentCommandIngressOpts, runtime?: RuntimeEnv, deps?: CliDeps): Promise<AgentCommandDeliveryResult>;
declare const testing: {
  resolveAgentRuntimeConfig: typeof resolveAgentRuntimeConfig;
  prepareAgentCommandExecution: typeof prepareAgentCommandExecution;
};
//#endregion
export { resolvePublicAgentAvatarSource as _, toToolProtocolDescriptors as a, ToolPlanContractError as c, evaluateToolAvailability as d, resolveModelCatalogScope as f, resolveAgentAvatar as g, AgentAvatarResolution as h, toToolProtocolDescriptor as i, defineToolDescriptor as l, resolveAuthStorePathForDisplay as m, agentCommandFromIngress as n, buildToolPlan as o, resolveProviderDiscoveryProviderIdsForCatalogScope as p, testing as r, formatToolExecutorRef as s, agentCommand as t, defineToolDescriptors as u };