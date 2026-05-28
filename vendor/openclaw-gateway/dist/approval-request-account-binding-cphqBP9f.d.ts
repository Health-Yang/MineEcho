import { i as OpenClawConfig } from "./types.openclaw-AW0IHsvN.js";
import { s as ExecApprovalRequest } from "./exec-approvals-B9y4j5Wc.js";
import { _ as PluginApprovalRequest } from "./plugin-approvals-DN5EVMBt.js";

//#region src/infra/approval-request-account-binding.d.ts
type ApprovalRequestLike = ExecApprovalRequest | PluginApprovalRequest;
declare function resolveApprovalRequestAccountId(params: {
  cfg: OpenClawConfig;
  request: ApprovalRequestLike;
  channel?: string | null;
}): string | null;
declare function resolveApprovalRequestChannelAccountId(params: {
  cfg: OpenClawConfig;
  request: ApprovalRequestLike;
  channel: string;
}): string | null;
declare function doesApprovalRequestMatchChannelAccount(params: {
  cfg: OpenClawConfig;
  request: ApprovalRequestLike;
  channel: string;
  accountId?: string | null;
}): boolean;
//#endregion
export { resolveApprovalRequestAccountId as n, resolveApprovalRequestChannelAccountId as r, doesApprovalRequestMatchChannelAccount as t };