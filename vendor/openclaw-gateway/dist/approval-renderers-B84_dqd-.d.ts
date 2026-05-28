import { r as ReplyPayload } from "./reply-payload-BYNzxEH3.js";
import { _ as PluginApprovalRequest, y as PluginApprovalResolved } from "./plugin-approvals-DN5EVMBt.js";
import { r as ExecApprovalReplyDecision, t as ExecApprovalActionDescriptor } from "./exec-approval-reply-CxEEEF3v.js";

//#region src/plugin-sdk/approval-renderers.d.ts
/** Build a pending approval reply payload using the portable presentation API. */
declare function buildApprovalPendingReplyPayload(params: {
  approvalKind?: "exec" | "plugin";
  approvalId: string;
  approvalSlug: string;
  text: string;
  agentId?: string | null;
  allowedDecisions?: readonly ExecApprovalReplyDecision[];
  actions?: readonly ExecApprovalActionDescriptor[];
  sessionKey?: string | null;
  title?: string | null;
  description?: string | null;
  severity?: "info" | "warning" | "critical" | null;
  toolName?: string | null;
  pluginId?: string | null;
  channelData?: Record<string, unknown>;
}): ReplyPayload;
/** Build a resolved approval reply payload with approval metadata but no controls. */
declare function buildApprovalResolvedReplyPayload(params: {
  approvalId: string;
  approvalSlug: string;
  text: string;
  channelData?: Record<string, unknown>;
}): ReplyPayload;
declare function buildPluginApprovalPendingReplyPayload(params: {
  request: PluginApprovalRequest;
  nowMs: number;
  text?: string;
  approvalSlug?: string;
  allowedDecisions?: readonly ExecApprovalReplyDecision[];
  channelData?: Record<string, unknown>;
}): ReplyPayload;
declare function buildPluginApprovalResolvedReplyPayload(params: {
  resolved: PluginApprovalResolved;
  text?: string;
  approvalSlug?: string;
  channelData?: Record<string, unknown>;
}): ReplyPayload;
//#endregion
export { buildPluginApprovalResolvedReplyPayload as i, buildApprovalResolvedReplyPayload as n, buildPluginApprovalPendingReplyPayload as r, buildApprovalPendingReplyPayload as t };