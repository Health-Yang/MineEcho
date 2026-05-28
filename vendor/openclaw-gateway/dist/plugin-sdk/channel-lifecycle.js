import { i as deliverFinalizableLivePreview } from "../live-CF0ee90S.js";
import { a as waitUntilAbort, i as runPassiveAccountLifecycle, n as createChannelRunQueue, o as createRunStateMachine, r as keepHttpServerTaskAlive, t as createAccountStatusSink } from "../channel-lifecycle.core-CDt0hRZR.js";
import { a as takeMessageIdAfterStop, i as createFinalizableDraftStreamControlsForState, n as createFinalizableDraftLifecycle, o as createDraftStreamLoop, r as createFinalizableDraftStreamControls, t as clearFinalizableDraftMessage } from "../draft-stream-controls-BQxtd4iQ.js";
//#region src/channels/draft-preview-finalizer.ts
/**
* @deprecated Use `deliverFinalizableLivePreview` from `openclaw/plugin-sdk/channel-outbound`.
*/
async function deliverFinalizableDraftPreview(params) {
	const result = await deliverFinalizableLivePreview({
		kind: params.kind,
		payload: params.payload,
		...params.draft ? { draft: params.draft } : {},
		buildFinalEdit: params.buildFinalEdit,
		editFinal: params.editFinal,
		deliverNormally: params.deliverNormally,
		onPreviewFinalized: async (id) => {
			await params.onPreviewFinalized?.(id);
		},
		...params.onNormalDelivered ? { onNormalDelivered: params.onNormalDelivered } : {},
		...params.logPreviewEditFailure ? { logPreviewEditFailure: params.logPreviewEditFailure } : {}
	});
	return result.kind === "preview-retained" ? "normal-skipped" : result.kind;
}
//#endregion
//#region src/channels/transport/stall-watchdog.ts
function createArmableStallWatchdog(params) {
	const timeoutMs = Math.max(1, Math.floor(params.timeoutMs));
	const checkIntervalMs = Math.max(100, Math.floor(params.checkIntervalMs ?? Math.min(5e3, Math.max(250, timeoutMs / 6))));
	let armed = false;
	let stopped = false;
	let lastActivityAt = Date.now();
	let timer = null;
	const clearTimer = () => {
		if (!timer) return;
		clearInterval(timer);
		timer = null;
	};
	const disarm = () => {
		armed = false;
	};
	const stop = () => {
		if (stopped) return;
		stopped = true;
		disarm();
		clearTimer();
		params.abortSignal?.removeEventListener("abort", stop);
	};
	const arm = (atMs) => {
		if (stopped) return;
		lastActivityAt = atMs ?? Date.now();
		armed = true;
	};
	const touch = (atMs) => {
		if (stopped) return;
		lastActivityAt = atMs ?? Date.now();
	};
	const check = () => {
		if (!armed || stopped) return;
		const idleMs = Date.now() - lastActivityAt;
		if (idleMs < timeoutMs) return;
		disarm();
		params.runtime?.error?.(`[${params.label}] transport watchdog timeout: idle ${Math.round(idleMs / 1e3)}s (limit ${Math.round(timeoutMs / 1e3)}s)`);
		params.onTimeout({
			idleMs,
			timeoutMs
		});
	};
	if (params.abortSignal?.aborted) stop();
	else {
		params.abortSignal?.addEventListener("abort", stop, { once: true });
		timer = setInterval(check, checkIntervalMs);
		timer.unref?.();
	}
	return {
		arm,
		touch,
		disarm,
		stop,
		isArmed: () => armed
	};
}
//#endregion
export { clearFinalizableDraftMessage, createAccountStatusSink, createArmableStallWatchdog, createChannelRunQueue, createDraftStreamLoop, createFinalizableDraftLifecycle, createFinalizableDraftStreamControls, createFinalizableDraftStreamControlsForState, createRunStateMachine, deliverFinalizableDraftPreview, keepHttpServerTaskAlive, runPassiveAccountLifecycle, takeMessageIdAfterStop, waitUntilAbort };
