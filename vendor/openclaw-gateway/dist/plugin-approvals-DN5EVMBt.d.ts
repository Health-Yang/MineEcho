import { l as InteractiveButtonStyle } from "./reply-payload-DVcklM6x.js";
import { o as ExecApprovalDecision } from "./exec-approvals-B9y4j5Wc.js";

//#region src/infra/plugin-approvals.d.ts
type PluginApprovalActionKind = "decision" | "command";
type PluginApprovalActionStyle = InteractiveButtonStyle;
type PluginApprovalDecisionActionTemplate = {
  kind: "decision";
  label: string;
  style: PluginApprovalActionStyle;
  decision: ExecApprovalDecision;
  commandTemplate: string;
};
type PluginApprovalCommandActionTemplate = {
  kind: "command";
  label: string;
  style: PluginApprovalActionStyle;
  commandTemplate: string;
};
type PluginApprovalActionTemplate = PluginApprovalDecisionActionTemplate | PluginApprovalCommandActionTemplate;
type PluginApprovalDecisionActionDescriptor = Omit<PluginApprovalDecisionActionTemplate, "commandTemplate"> & {
  command: string;
};
type PluginApprovalCommandActionDescriptor = Omit<PluginApprovalCommandActionTemplate, "commandTemplate"> & {
  command: string;
};
type PluginApprovalActionDescriptor = PluginApprovalDecisionActionDescriptor | PluginApprovalCommandActionDescriptor;
declare function validatePluginApprovalActionTemplates(actions: readonly PluginApprovalActionTemplate[]): string | null;
type PluginApprovalRequestPayload = {
  pluginId?: string | null;
  title: string;
  description: string;
  severity?: "info" | "warning" | "critical" | null;
  toolName?: string | null;
  toolCallId?: string | null;
  allowedDecisions?: readonly ExecApprovalDecision[] | null;
  actions?: readonly PluginApprovalActionDescriptor[] | null;
  agentId?: string | null;
  sessionKey?: string | null;
  turnSourceChannel?: string | null;
  turnSourceTo?: string | null;
  turnSourceAccountId?: string | null;
  turnSourceThreadId?: string | number | null;
};
type PluginApprovalRequest = {
  id: string;
  request: PluginApprovalRequestPayload;
  createdAtMs: number;
  expiresAtMs: number;
};
type PluginApprovalResolved = {
  id: string;
  decision: ExecApprovalDecision;
  resolvedBy?: string | null;
  ts: number;
  request?: PluginApprovalRequestPayload;
};
declare const DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS = 120000;
declare const MAX_PLUGIN_APPROVAL_TIMEOUT_MS = 600000;
declare const PLUGIN_APPROVAL_TITLE_MAX_LENGTH = 80;
declare const PLUGIN_APPROVAL_DESCRIPTION_MAX_LENGTH = 256;
declare const PLUGIN_APPROVAL_ACTION_LABEL_MAX_LENGTH = 40;
declare const PLUGIN_APPROVAL_ACTION_COMMAND_TEMPLATE_MAX_LENGTH = 200;
declare const MAX_PLUGIN_APPROVAL_ACTIONS = 6;
declare const DEFAULT_PLUGIN_APPROVAL_DECISIONS: readonly ["allow-once", "allow-always", "deny"];
declare function approvalDecisionLabel(decision: ExecApprovalDecision): string;
declare function resolvePluginApprovalRequestAllowedDecisions(params?: {
  allowedDecisions?: readonly ExecApprovalDecision[] | readonly string[] | null;
}): readonly ExecApprovalDecision[];
declare function expandPluginApprovalActionTemplates(params: {
  approvalId: string;
  actions?: readonly PluginApprovalActionTemplate[] | null;
}): readonly PluginApprovalActionDescriptor[] | undefined;
declare function buildPluginApprovalRequestMessage(request: PluginApprovalRequest, nowMsValue: number): string;
declare function buildPluginApprovalResolvedMessage(resolved: PluginApprovalResolved): string;
declare function buildPluginApprovalExpiredMessage(request: PluginApprovalRequest): string;
//#endregion
export { buildPluginApprovalResolvedMessage as C, validatePluginApprovalActionTemplates as E, buildPluginApprovalRequestMessage as S, resolvePluginApprovalRequestAllowedDecisions as T, PluginApprovalRequest as _, PLUGIN_APPROVAL_ACTION_COMMAND_TEMPLATE_MAX_LENGTH as a, approvalDecisionLabel as b, PLUGIN_APPROVAL_TITLE_MAX_LENGTH as c, PluginApprovalActionStyle as d, PluginApprovalActionTemplate as f, PluginApprovalDecisionActionTemplate as g, PluginApprovalDecisionActionDescriptor as h, MAX_PLUGIN_APPROVAL_TIMEOUT_MS as i, PluginApprovalActionDescriptor as l, PluginApprovalCommandActionTemplate as m, DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS as n, PLUGIN_APPROVAL_ACTION_LABEL_MAX_LENGTH as o, PluginApprovalCommandActionDescriptor as p, MAX_PLUGIN_APPROVAL_ACTIONS as r, PLUGIN_APPROVAL_DESCRIPTION_MAX_LENGTH as s, DEFAULT_PLUGIN_APPROVAL_DECISIONS as t, PluginApprovalActionKind as u, PluginApprovalRequestPayload as v, expandPluginApprovalActionTemplates as w, buildPluginApprovalExpiredMessage as x, PluginApprovalResolved as y };