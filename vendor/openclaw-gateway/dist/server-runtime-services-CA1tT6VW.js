import { n as isVitestRuntimeEnv } from "./env-DmmbBEHd.js";
import { t as isGatewayModelPricingEnabled } from "./model-pricing-config-CpVOfxdS.js";
import { r as startHeartbeatRunner } from "./heartbeat-runner-Ccq-U2xP.js";
import "./server-runtime-startup-services-CTwHRNNM.js";
//#region src/gateway/server-runtime-services.ts
function createNoopHeartbeatRunner() {
	return {
		stop: () => {},
		updateConfig: (_cfg) => {}
	};
}
function startGatewayCronWithLogging(params) {
	params.cron.start().catch((err) => params.logCron.error(`failed to start: ${String(err)}`));
}
function clearGatewayMaintenanceHandles(maintenance) {
	if (!maintenance) return;
	clearInterval(maintenance.tickInterval);
	clearInterval(maintenance.healthInterval);
	clearInterval(maintenance.dedupeCleanup);
	if (maintenance.mediaCleanup) clearInterval(maintenance.mediaCleanup);
}
async function runGatewayPostReadyMaintenance(params) {
	try {
		const maintenance = await params.startMaintenance();
		if (maintenance) params.applyMaintenance(maintenance);
	} catch (err) {
		params.log.warn(`gateway post-ready maintenance startup failed: ${String(err)}`);
	}
	if (params.shouldStartCron()) {
		params.markCronStartHandled();
		startGatewayCronWithLogging({
			cron: params.cron,
			logCron: params.logCron
		});
	}
	params.recordPostReadyMemory();
}
function scheduleGatewayPostReadyMaintenance(params) {
	const timer = setTimeout(() => {
		params.onStarted?.();
		if (params.isClosing()) return;
		runGatewayPostReadyMaintenance({
			startMaintenance: async () => {
				if (params.isClosing()) return null;
				const maintenance = await params.startMaintenance();
				if (params.isClosing()) {
					clearGatewayMaintenanceHandles(maintenance);
					return null;
				}
				return maintenance;
			},
			applyMaintenance: (maintenance) => {
				if (params.isClosing()) {
					clearGatewayMaintenanceHandles(maintenance);
					return;
				}
				params.applyMaintenance(maintenance);
			},
			shouldStartCron: () => !params.isClosing() && params.shouldStartCron(),
			markCronStartHandled: params.markCronStartHandled,
			cron: params.cron,
			logCron: params.logCron,
			log: params.log,
			recordPostReadyMemory: () => {
				if (!params.isClosing()) params.recordPostReadyMemory();
			}
		});
	}, params.delayMs);
	timer.unref?.();
	return timer;
}
function recoverPendingOutboundDeliveries(params) {
	(async () => {
		const { recoverPendingDeliveries } = await import("./delivery-queue-DGiU5MyZ.js");
		const { deliverOutboundPayloadsInternal } = await import("./deliver-vbUQNaaf.js");
		await recoverPendingDeliveries({
			deliver: deliverOutboundPayloadsInternal,
			log: params.log.child("delivery-recovery"),
			cfg: params.cfg
		});
	})().catch((err) => params.log.error(`Delivery recovery failed: ${String(err)}`));
}
function recoverPendingSessionDeliveries(params) {
	setTimeout(() => {
		(async () => {
			const { recoverPendingRestartContinuationDeliveries } = await import("./server-restart-sentinel-b1tSg1Xi.js");
			const logRecovery = params.log.child("session-delivery-recovery");
			await recoverPendingRestartContinuationDeliveries({
				deps: params.deps,
				log: logRecovery,
				maxEnqueuedAt: params.maxEnqueuedAt
			});
		})().catch((err) => params.log.error(`Session delivery recovery failed: ${String(err)}`));
	}, 1250).unref?.();
}
function startGatewayModelPricingRefreshOnDemand(params) {
	if (!isGatewayModelPricingEnabled(params.config)) return () => {};
	let stopped = false;
	let stopRefresh;
	(async () => {
		const { startGatewayModelPricingRefresh } = await import("./model-pricing-cache-DaDVJeAQ.js");
		if (stopped) return;
		stopRefresh = startGatewayModelPricingRefresh({
			config: params.config,
			...params.pluginLookUpTable ? { pluginLookUpTable: params.pluginLookUpTable } : {}
		});
		if (stopped) {
			stopRefresh();
			stopRefresh = void 0;
		}
	})().catch((err) => params.log.error(`Model pricing refresh failed to start: ${String(err)}`));
	return () => {
		stopped = true;
		stopRefresh?.();
		stopRefresh = void 0;
	};
}
function activateGatewayScheduledServices(params) {
	if (params.minimalTestGateway) return {
		heartbeatRunner: createNoopHeartbeatRunner(),
		stopModelPricingRefresh: () => {}
	};
	const heartbeatRunner = startHeartbeatRunner({ cfg: params.cfgAtStart });
	if (params.startCron !== false) startGatewayCronWithLogging({
		cron: params.cron,
		logCron: params.logCron
	});
	recoverPendingOutboundDeliveries({
		cfg: params.cfgAtStart,
		log: params.log
	});
	recoverPendingSessionDeliveries({
		deps: params.deps,
		log: params.log,
		maxEnqueuedAt: params.sessionDeliveryRecoveryMaxEnqueuedAt
	});
	return {
		heartbeatRunner,
		stopModelPricingRefresh: !isVitestRuntimeEnv() ? startGatewayModelPricingRefreshOnDemand({
			config: params.cfgAtStart,
			...params.pluginLookUpTable ? { pluginLookUpTable: params.pluginLookUpTable } : {},
			log: params.log
		}) : () => {}
	};
}
//#endregion
export { startGatewayCronWithLogging as i, runGatewayPostReadyMaintenance as n, scheduleGatewayPostReadyMaintenance as r, activateGatewayScheduledServices as t };
