import type { InteractiveButtonStyle } from "../interactive/payload.js";
import type { ExecApprovalDecision } from "./exec-approvals.js";
export type PluginApprovalActionKind = "decision" | "command";
export type PluginApprovalActionStyle = InteractiveButtonStyle;
export type PluginApprovalDecisionActionTemplate = {
    kind: "decision";
    label: string;
    style: PluginApprovalActionStyle;
    decision: ExecApprovalDecision;
    commandTemplate: string;
};
export type PluginApprovalCommandActionTemplate = {
    kind: "command";
    label: string;
    style: PluginApprovalActionStyle;
    commandTemplate: string;
};
export type PluginApprovalActionTemplate = PluginApprovalDecisionActionTemplate | PluginApprovalCommandActionTemplate;
export type PluginApprovalDecisionActionDescriptor = Omit<PluginApprovalDecisionActionTemplate, "commandTemplate"> & {
    command: string;
};
export type PluginApprovalCommandActionDescriptor = Omit<PluginApprovalCommandActionTemplate, "commandTemplate"> & {
    command: string;
};
export type PluginApprovalActionDescriptor = PluginApprovalDecisionActionDescriptor | PluginApprovalCommandActionDescriptor;
export declare function validatePluginApprovalActionTemplates(actions: readonly PluginApprovalActionTemplate[]): string | null;
export type PluginApprovalRequestPayload = {
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
export type PluginApprovalRequest = {
    id: string;
    request: PluginApprovalRequestPayload;
    createdAtMs: number;
    expiresAtMs: number;
};
export type PluginApprovalResolved = {
    id: string;
    decision: ExecApprovalDecision;
    resolvedBy?: string | null;
    ts: number;
    request?: PluginApprovalRequestPayload;
};
export declare const DEFAULT_PLUGIN_APPROVAL_TIMEOUT_MS = 120000;
export declare const MAX_PLUGIN_APPROVAL_TIMEOUT_MS = 600000;
export declare const PLUGIN_APPROVAL_TITLE_MAX_LENGTH = 80;
export declare const PLUGIN_APPROVAL_DESCRIPTION_MAX_LENGTH = 256;
export declare const PLUGIN_APPROVAL_ACTION_LABEL_MAX_LENGTH = 40;
export declare const PLUGIN_APPROVAL_ACTION_COMMAND_TEMPLATE_MAX_LENGTH = 200;
export declare const MAX_PLUGIN_APPROVAL_ACTIONS = 6;
export declare const DEFAULT_PLUGIN_APPROVAL_DECISIONS: readonly ["allow-once", "allow-always", "deny"];
export declare function approvalDecisionLabel(decision: ExecApprovalDecision): string;
export declare function resolvePluginApprovalRequestAllowedDecisions(params?: {
    allowedDecisions?: readonly ExecApprovalDecision[] | readonly string[] | null;
}): readonly ExecApprovalDecision[];
export declare function expandPluginApprovalActionTemplates(params: {
    approvalId: string;
    actions?: readonly PluginApprovalActionTemplate[] | null;
}): readonly PluginApprovalActionDescriptor[] | undefined;
export declare function buildPluginApprovalRequestMessage(request: PluginApprovalRequest, nowMsValue: number): string;
export declare function buildPluginApprovalResolvedMessage(resolved: PluginApprovalResolved): string;
export declare function buildPluginApprovalExpiredMessage(request: PluginApprovalRequest): string;
