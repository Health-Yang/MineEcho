import { At as boolean, Et as array, Nn as record, Rn as string, Tn as object, Xn as union, dn as literal, wn as number } from "./schemas-Del5uzR8.js";
import { n as ZodIssueCode } from "./compat-bCpUj7Jq.js";
import { i as ContextVisibilityModeSchema, l as GroupPolicySchema } from "./zod-schema.core-BPJs63Rs.js";
//#region src/config/zod-schema.approvals.ts
const NativeExecApprovalEnableModeSchema = union([boolean(), literal("auto")]);
const ExecApprovalForwardTargetSchema = object({
	channel: string().min(1),
	to: string().min(1),
	accountId: string().optional(),
	threadId: union([string(), number()]).optional()
}).strict();
const ExecApprovalForwardingSchema = object({
	enabled: boolean().optional(),
	mode: union([
		literal("session"),
		literal("targets"),
		literal("both")
	]).optional(),
	agentFilter: array(string()).optional(),
	sessionFilter: array(string()).optional(),
	targets: array(ExecApprovalForwardTargetSchema).optional()
}).strict().optional();
const ApprovalsSchema = object({
	exec: ExecApprovalForwardingSchema,
	plugin: ExecApprovalForwardingSchema
}).strict().optional();
//#endregion
//#region src/config/zod-schema.channels.ts
const ChannelHeartbeatVisibilitySchema = object({
	showOk: boolean().optional(),
	showAlerts: boolean().optional(),
	useIndicator: boolean().optional()
}).strict().optional();
const ChannelHealthMonitorSchema = object({ enabled: boolean().optional() }).strict().optional();
//#endregion
//#region src/config/zod-schema.channels-config.ts
const ChannelModelByChannelSchema = record(string(), record(string(), string())).optional();
const ChannelBotLoopProtectionSchema = object({
	enabled: boolean().optional(),
	maxEventsPerWindow: number().int().positive().optional(),
	windowSeconds: number().int().positive().optional(),
	cooldownSeconds: number().int().positive().optional()
}).strict();
function addLegacyChannelAcpBindingIssues(value, ctx, path = []) {
	if (!value || typeof value !== "object") return;
	if (Array.isArray(value)) {
		value.forEach((entry, index) => addLegacyChannelAcpBindingIssues(entry, ctx, [...path, index]));
		return;
	}
	const record = value;
	const bindings = record.bindings;
	if (bindings && typeof bindings === "object" && !Array.isArray(bindings)) {
		const acp = bindings.acp;
		if (acp && typeof acp === "object") ctx.addIssue({
			code: ZodIssueCode.custom,
			path: [
				...path,
				"bindings",
				"acp"
			],
			message: "Legacy channel-local ACP bindings were removed; use top-level bindings[] entries."
		});
	}
	for (const [key, entry] of Object.entries(record)) addLegacyChannelAcpBindingIssues(entry, ctx, [...path, key]);
}
const ChannelsSchema = object({
	defaults: object({
		groupPolicy: GroupPolicySchema.optional(),
		contextVisibility: ContextVisibilityModeSchema.optional(),
		heartbeat: ChannelHeartbeatVisibilitySchema,
		botLoopProtection: ChannelBotLoopProtectionSchema.optional()
	}).strict().optional(),
	modelByChannel: ChannelModelByChannelSchema
}).passthrough().superRefine((value, ctx) => {
	addLegacyChannelAcpBindingIssues(value, ctx);
}).optional();
//#endregion
export { ApprovalsSchema as a, ChannelHeartbeatVisibilitySchema as i, ChannelsSchema as n, NativeExecApprovalEnableModeSchema as o, ChannelHealthMonitorSchema as r, ChannelBotLoopProtectionSchema as t };
