import { r as getPluginRegistryState } from "./runtime-state-DRIYGASz.js";
import { Ii as ErrorCodes, Li as errorShape } from "./protocol-BkfNT2Bp.js";
import { i as gatewayStartupUnavailableDetails } from "./startup-unavailable-xtMvD-hR.js";
import { n as createCoreGatewayMethodDescriptors, r as isCoreGatewayMethodClassified } from "./core-descriptors-BUnLwpF8.js";
import { t as ADMIN_SCOPE } from "./operator-scopes-DGvgHuOd.js";
import { n as authorizeOperatorScopesForMethod } from "./method-scopes-BnJ64Q8O.js";
import { i as createPluginGatewayMethodDescriptors, n as createGatewayMethodRegistry, t as createGatewayMethodDescriptorsFromHandlers } from "./registry-Doj5s8ld.js";
import { n as withPluginRuntimeGatewayRequestScope } from "./gateway-request-scope-B9qYB9tg.js";
import { t as consumeControlPlaneWriteBudget } from "./control-plane-rate-limit-AYt-ugaJ.js";
import { n as resolveControlPlaneActor, t as formatControlPlaneActor } from "./control-plane-audit-Ckq5Tcro.js";
import { n as parseGatewayRole, t as isRoleAuthorizedForMethod } from "./role-policy-DY6Lox61.js";
//#region src/gateway/server-methods.ts
function lazyHandlerModule(loadModule, selectHandlers) {
	let handlersPromise = null;
	return () => handlersPromise ??= loadModule().then(selectHandlers);
}
function createLazyCoreHandlers(params) {
	return Object.fromEntries(params.methods.map((method) => [method, async (opts) => {
		const handler = (await params.loadHandlers())[method];
		if (!handler) throw new Error(`lazy gateway handler not found: ${method}`);
		await handler(opts);
	}]));
}
const loadAgentHandlers = lazyHandlerModule(() => import("./agent-B-n1oPqN.js"), (module) => module.agentHandlers);
const loadAgentsHandlers = lazyHandlerModule(() => import("./agents-BzpFMOeR.js"), (module) => module.agentsHandlers);
const loadArtifactsHandlers = lazyHandlerModule(() => import("./artifacts-Dqy1TNsG.js"), (module) => module.artifactsHandlers);
const loadChannelsHandlers = lazyHandlerModule(() => import("./channels-CvnpYxnU.js"), (module) => module.channelsHandlers);
const loadChatHandlers = lazyHandlerModule(() => import("./chat-C600A334.js"), (module) => module.chatHandlers);
const loadCommandsHandlers = lazyHandlerModule(() => import("./commands-hIdShG-w.js"), (module) => module.commandsHandlers);
const loadConfigHandlers = lazyHandlerModule(() => import("./config-DNxMIeL8.js"), (module) => module.configHandlers);
const loadConnectHandlers = lazyHandlerModule(() => import("./connect-DsiOxdVU.js"), (module) => module.connectHandlers);
const loadCronHandlers = lazyHandlerModule(() => import("./cron-CDKfq4vO.js"), (module) => module.cronHandlers);
const loadDeviceHandlers = lazyHandlerModule(() => import("./devices-D8KB0tT8.js"), (module) => module.deviceHandlers);
const loadDiagnosticsHandlers = lazyHandlerModule(() => import("./diagnostics-C4iugjbm.js"), (module) => module.diagnosticsHandlers);
const loadDoctorHandlers = lazyHandlerModule(() => import("./doctor-DkZQKJv8.js"), (module) => module.doctorHandlers);
const loadEnvironmentsHandlers = lazyHandlerModule(() => import("./environments-BFxj_Wz1.js"), (module) => module.environmentsHandlers);
const loadExecApprovalsHandlers = lazyHandlerModule(() => import("./exec-approvals-Ww1M_1UE.js"), (module) => module.execApprovalsHandlers);
const loadHealthHandlers = lazyHandlerModule(() => import("./health-DCPBpY0t.js"), (module) => module.healthHandlers);
const loadLogsHandlers = lazyHandlerModule(() => import("./logs-Cymf-2qm.js"), (module) => module.logsHandlers);
const loadModelsAuthStatusHandlers = lazyHandlerModule(() => import("./models-auth-status-DgCUIRbn.js"), (module) => module.modelsAuthStatusHandlers);
const loadModelsHandlers = lazyHandlerModule(() => import("./models-D59QvTd9.js"), (module) => module.modelsHandlers);
const loadNativeHookRelayHandlers = lazyHandlerModule(() => import("./native-hook-relay-DG-GLMoM.js"), (module) => module.nativeHookRelayHandlers);
const loadNodePendingHandlers = lazyHandlerModule(() => import("./nodes-pending-zb3UcEvS.js"), (module) => module.nodePendingHandlers);
const loadNodeHandlers = lazyHandlerModule(() => import("./nodes-Chzoxkc7.js"), (module) => module.nodeHandlers);
const loadPluginHostHookHandlers = lazyHandlerModule(() => import("./plugin-host-hooks-B5MNOP6u.js"), (module) => module.pluginHostHookHandlers);
const loadPushHandlers = lazyHandlerModule(() => import("./push-CKVQz0JO.js"), (module) => module.pushHandlers);
const loadRestartHandlers = lazyHandlerModule(() => import("./restart-CJKCdnmd.js"), (module) => module.restartHandlers);
const loadSendHandlers = lazyHandlerModule(() => import("./send-TKxqt0UJ.js"), (module) => module.sendHandlers);
const loadSessionsHandlers = lazyHandlerModule(() => import("./sessions-DYK2wJb_.js"), (module) => module.sessionsHandlers);
const loadSkillsHandlers = lazyHandlerModule(() => import("./skills-CogTklTE.js"), (module) => module.skillsHandlers);
const loadSystemHandlers = lazyHandlerModule(() => import("./system-B4QkNbsp.js"), (module) => module.systemHandlers);
const loadTalkHandlers = lazyHandlerModule(() => import("./talk-CAUwW9fu.js"), (module) => module.talkHandlers);
const loadTasksHandlers = lazyHandlerModule(() => import("./tasks-CRlMNegQ.js"), (module) => module.tasksHandlers);
const loadToolsCatalogHandlers = lazyHandlerModule(() => import("./tools-catalog-BZz3HDCq.js"), (module) => module.toolsCatalogHandlers);
const loadToolsEffectiveHandlers = lazyHandlerModule(() => import("./tools-effective-mEzbB4q0.js"), (module) => module.toolsEffectiveHandlers);
const loadToolsInvokeHandlers = lazyHandlerModule(() => import("./tools-invoke-DmkUhi17.js"), (module) => module.toolsInvokeHandlers);
const loadTtsHandlers = lazyHandlerModule(() => import("./tts-Bg8yxg_E.js"), (module) => module.ttsHandlers);
const loadUpdateHandlers = lazyHandlerModule(() => import("./update-0d2J8RFT.js"), (module) => module.updateHandlers);
const loadUsageHandlers = lazyHandlerModule(() => import("./usage-CGq21urE.js"), (module) => module.usageHandlers);
const loadVoicewakeRoutingHandlers = lazyHandlerModule(() => import("./voicewake-routing-DptXn2S2.js"), (module) => module.voicewakeRoutingHandlers);
const loadVoicewakeHandlers = lazyHandlerModule(() => import("./voicewake-CazivcmG.js"), (module) => module.voicewakeHandlers);
const loadWebHandlers = lazyHandlerModule(() => import("./web-Dz33cIdX.js"), (module) => module.webHandlers);
const loadWizardHandlers = lazyHandlerModule(() => import("./wizard-BrBDH_Kq.js"), (module) => module.wizardHandlers);
function authorizeGatewayMethod(method, client, params) {
	if (!client?.connect) return null;
	if (method === "health") return null;
	const roleRaw = client.connect.role ?? "operator";
	const role = parseGatewayRole(roleRaw);
	if (!role) return errorShape(ErrorCodes.INVALID_REQUEST, `unauthorized role: ${roleRaw}`);
	const scopes = client.connect.scopes ?? [];
	if (!isRoleAuthorizedForMethod(role, method)) return errorShape(ErrorCodes.INVALID_REQUEST, `unauthorized role: ${role}`);
	if (role === "node") return null;
	if (scopes.includes("operator.admin")) return null;
	const scopeAuth = authorizeOperatorScopesForMethod(method, scopes, params);
	if (!scopeAuth.allowed) return errorShape(ErrorCodes.INVALID_REQUEST, `missing scope: ${scopeAuth.missingScope}`);
	return null;
}
const coreGatewayHandlers = {
	...createLazyCoreHandlers({
		methods: ["connect"],
		loadHandlers: loadConnectHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["logs.tail"],
		loadHandlers: loadLogsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["voicewake.get", "voicewake.set"],
		loadHandlers: loadVoicewakeHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["voicewake.routing.get", "voicewake.routing.set"],
		loadHandlers: loadVoicewakeRoutingHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["health", "status"],
		loadHandlers: loadHealthHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"channels.status",
			"channels.start",
			"channels.stop",
			"channels.logout"
		],
		loadHandlers: loadChannelsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"chat.history",
			"chat.abort",
			"chat.send",
			"chat.inject"
		],
		loadHandlers: loadChatHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["commands.list"],
		loadHandlers: loadCommandsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"wake",
			"cron.list",
			"cron.status",
			"cron.get",
			"cron.add",
			"cron.update",
			"cron.remove",
			"cron.run",
			"cron.runs"
		],
		loadHandlers: loadCronHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"device.pair.list",
			"device.pair.approve",
			"device.pair.reject",
			"device.pair.remove",
			"device.token.rotate",
			"device.token.revoke"
		],
		loadHandlers: loadDeviceHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["diagnostics.stability"],
		loadHandlers: loadDiagnosticsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"doctor.memory.status",
			"doctor.memory.dreamDiary",
			"doctor.memory.backfillDreamDiary",
			"doctor.memory.resetDreamDiary",
			"doctor.memory.resetGroundedShortTerm",
			"doctor.memory.repairDreamingArtifacts",
			"doctor.memory.dedupeDreamDiary",
			"doctor.memory.remHarness"
		],
		loadHandlers: loadDoctorHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["environments.list", "environments.status"],
		loadHandlers: loadEnvironmentsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"exec.approvals.get",
			"exec.approvals.set",
			"exec.approvals.node.get",
			"exec.approvals.node.set"
		],
		loadHandlers: loadExecApprovalsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["web.login.start", "web.login.wait"],
		loadHandlers: loadWebHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["models.list"],
		loadHandlers: loadModelsHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["models.authLogout", "models.authStatus"],
		loadHandlers: loadModelsAuthStatusHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["nativeHook.invoke"],
		loadHandlers: loadNativeHookRelayHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["plugins.uiDescriptors", "plugins.sessionAction"],
		loadHandlers: loadPluginHostHookHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"config.get",
			"config.schema",
			"config.schema.lookup",
			"config.set",
			"config.patch",
			"config.apply",
			"config.openFile"
		],
		loadHandlers: loadConfigHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"wizard.start",
			"wizard.next",
			"wizard.cancel",
			"wizard.status"
		],
		loadHandlers: loadWizardHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"talk.session.create",
			"talk.session.join",
			"talk.session.appendAudio",
			"talk.session.startTurn",
			"talk.session.endTurn",
			"talk.session.cancelTurn",
			"talk.session.cancelOutput",
			"talk.session.submitToolResult",
			"talk.session.steer",
			"talk.session.close",
			"talk.client.create",
			"talk.client.toolCall",
			"talk.client.steer",
			"talk.catalog",
			"talk.config",
			"talk.speak",
			"talk.mode"
		],
		loadHandlers: loadTalkHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"tasks.list",
			"tasks.get",
			"tasks.cancel"
		],
		loadHandlers: loadTasksHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["tools.catalog"],
		loadHandlers: loadToolsCatalogHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["tools.effective"],
		loadHandlers: loadToolsEffectiveHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["tools.invoke"],
		loadHandlers: loadToolsInvokeHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"tts.status",
			"tts.enable",
			"tts.disable",
			"tts.convert",
			"tts.setProvider",
			"tts.personas",
			"tts.setPersona",
			"tts.providers"
		],
		loadHandlers: loadTtsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"skills.upload.begin",
			"skills.upload.chunk",
			"skills.upload.commit",
			"skills.status",
			"skills.bins",
			"skills.search",
			"skills.detail",
			"skills.install",
			"skills.update"
		],
		loadHandlers: loadSkillsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"sessions.list",
			"sessions.cleanup",
			"sessions.subscribe",
			"sessions.unsubscribe",
			"sessions.messages.subscribe",
			"sessions.messages.unsubscribe",
			"sessions.preview",
			"sessions.describe",
			"sessions.resolve",
			"sessions.compaction.list",
			"sessions.compaction.get",
			"sessions.create",
			"sessions.compaction.branch",
			"sessions.compaction.restore",
			"sessions.send",
			"sessions.steer",
			"sessions.abort",
			"sessions.patch",
			"sessions.pluginPatch",
			"sessions.reset",
			"sessions.delete",
			"sessions.get",
			"sessions.compact"
		],
		loadHandlers: loadSessionsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"gateway.identity.get",
			"last-heartbeat",
			"set-heartbeats",
			"system-presence",
			"system-event"
		],
		loadHandlers: loadSystemHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["update.status", "update.run"],
		loadHandlers: loadUpdateHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"node.pair.request",
			"node.pair.list",
			"node.pair.approve",
			"node.pair.reject",
			"node.pair.remove",
			"node.pair.verify",
			"node.rename",
			"node.list",
			"node.describe",
			"node.pluginSurface.refresh",
			"node.pending.pull",
			"node.pending.ack",
			"node.invoke",
			"node.invoke.result",
			"node.event"
		],
		loadHandlers: loadNodeHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["node.pending.drain", "node.pending.enqueue"],
		loadHandlers: loadNodePendingHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"push.test",
			"push.web.vapidPublicKey",
			"push.web.subscribe",
			"push.web.unsubscribe",
			"push.web.test"
		],
		loadHandlers: loadPushHandlers
	}),
	...createLazyCoreHandlers({
		methods: ["gateway.restart.request", "gateway.restart.preflight"],
		loadHandlers: loadRestartHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"message.action",
			"send",
			"poll"
		],
		loadHandlers: loadSendHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"usage.status",
			"usage.cost",
			"sessions.usage",
			"sessions.usage.timeseries",
			"sessions.usage.logs"
		],
		loadHandlers: loadUsageHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"agent",
			"agent.identity.get",
			"agent.wait"
		],
		loadHandlers: loadAgentHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"agents.list",
			"agents.create",
			"agents.update",
			"agents.delete",
			"agents.files.list",
			"agents.files.get",
			"agents.files.set"
		],
		loadHandlers: loadAgentsHandlers
	}),
	...createLazyCoreHandlers({
		methods: [
			"artifacts.list",
			"artifacts.get",
			"artifacts.download"
		],
		loadHandlers: loadArtifactsHandlers
	})
};
function createRequestGatewayMethodRegistry(extraHandlers) {
	const activePluginRegistry = getPluginRegistryState()?.activeRegistry;
	const activePluginHandlers = activePluginRegistry?.gatewayHandlers ?? {};
	const extraHandlerEntries = Object.entries(extraHandlers ?? {});
	const pluginMethodNames = new Set(Object.keys(activePluginHandlers));
	const coreDescriptorHandlers = { ...coreGatewayHandlers };
	for (const [method, extraHandler] of extraHandlerEntries) if (!pluginMethodNames.has(method) && isCoreGatewayMethodClassified(method)) coreDescriptorHandlers[method] = extraHandler;
	const coreDescriptors = createCoreGatewayMethodDescriptors(coreDescriptorHandlers);
	for (const descriptor of coreDescriptors) {
		const extraHandler = extraHandlers?.[descriptor.name];
		if (extraHandler && !pluginMethodNames.has(descriptor.name)) descriptor.handler = extraHandler;
	}
	const coreMethodNames = new Set(coreDescriptors.map((descriptor) => descriptor.name));
	const auxHandlers = Object.fromEntries(extraHandlerEntries.filter(([method]) => !pluginMethodNames.has(method) && !coreMethodNames.has(method)));
	return createGatewayMethodRegistry([
		...coreDescriptors,
		...activePluginRegistry ? createPluginGatewayMethodDescriptors(activePluginRegistry) : [],
		...createGatewayMethodDescriptorsFromHandlers({
			handlers: auxHandlers,
			owner: {
				kind: "aux",
				area: "gateway-extra"
			},
			defaultScope: ADMIN_SCOPE
		})
	]);
}
async function handleGatewayRequest(opts) {
	const { req, respond, client, isWebchatConnect, context } = opts;
	const methodRegistry = opts.methodRegistry ?? createRequestGatewayMethodRegistry(opts.extraHandlers);
	const authError = authorizeGatewayMethod(req.method, client, req.params);
	if (authError) {
		respond(false, void 0, authError);
		return;
	}
	if (context.unavailableGatewayMethods?.has(req.method)) {
		respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, `${req.method} unavailable during gateway startup`, {
			retryable: true,
			retryAfterMs: 500,
			details: {
				...gatewayStartupUnavailableDetails(),
				method: req.method
			}
		}));
		return;
	}
	if (methodRegistry.isControlPlaneWrite(req.method)) {
		const budget = consumeControlPlaneWriteBudget({ client });
		if (!budget.allowed) {
			const actor = resolveControlPlaneActor(client);
			context.logGateway.warn(`control-plane write rate-limited method=${req.method} ${formatControlPlaneActor(actor)} retryAfterMs=${budget.retryAfterMs} key=${budget.key}`);
			respond(false, void 0, errorShape(ErrorCodes.UNAVAILABLE, `rate limit exceeded for ${req.method}; retry after ${Math.ceil(budget.retryAfterMs / 1e3)}s`, {
				retryable: true,
				retryAfterMs: budget.retryAfterMs,
				details: {
					method: req.method,
					limit: "3 per 60s"
				}
			}));
			return;
		}
	}
	const handler = methodRegistry.getHandler(req.method);
	if (!handler) {
		respond(false, void 0, errorShape(ErrorCodes.INVALID_REQUEST, `unknown method: ${req.method}`));
		return;
	}
	const invokeHandler = () => handler({
		req,
		params: req.params ?? {},
		client,
		isWebchatConnect,
		respond,
		context
	});
	await withPluginRuntimeGatewayRequestScope({
		context,
		client,
		isWebchatConnect
	}, invokeHandler);
}
//#endregion
export { coreGatewayHandlers, handleGatewayRequest };
