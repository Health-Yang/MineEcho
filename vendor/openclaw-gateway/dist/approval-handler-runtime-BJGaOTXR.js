import { t as createSubsystemLogger } from "./subsystem-1gTaEPwP.js";
import { t as createChannelNativeApprovalRuntime } from "./approval-native-runtime-BNLh7XFN.js";
import { n as buildPendingApprovalView, r as buildResolvedApprovalView, t as buildExpiredApprovalView } from "./approval-view-model-CkRFCrsp.js";
//#region src/infra/approval-handler-runtime.ts
function consumeActiveWrappedEntries(activeEntries, requestId, fallbackEntries) {
	const entries = activeEntries.get(requestId)?.entries ?? fallbackEntries;
	activeEntries.delete(requestId);
	return entries;
}
async function finalizeWrappedEntries(params) {
	for (const wrapped of params.entries) try {
		await params.runEntry(wrapped);
	} catch (error) {
		params.log.error(`failed to finalize ${params.phase} native approval entry approval=${params.request.id}: ${String(error)}`);
	}
}
async function unbindWrappedEntries(params) {
	if (!params.nativeRuntime.interactions?.unbindPending) return;
	for (const wrapped of params.entries) {
		if (wrapped.binding === void 0) continue;
		try {
			await params.nativeRuntime.interactions.unbindPending({
				...params.baseContext,
				entry: wrapped.entry,
				binding: wrapped.binding,
				request: params.request,
				approvalKind: params.approvalKind
			});
		} catch (error) {
			params.log.error(`failed to unbind stopped native approval entry approval=${params.request.id}: ${String(error)}`);
		}
	}
}
async function applyApprovalFinalAction(params) {
	switch (params.result.kind) {
		case "update":
			await params.nativeRuntime.transport.updateEntry?.({
				...params.baseContext,
				entry: params.wrapped.entry,
				payload: params.result.payload,
				phase: params.phase
			});
			return;
		case "delete":
			await params.nativeRuntime.transport.deleteEntry?.({
				...params.baseContext,
				entry: params.wrapped.entry,
				phase: params.phase
			});
			return;
		case "clear-actions":
			await params.nativeRuntime.interactions?.clearPendingActions?.({
				...params.baseContext,
				entry: params.wrapped.entry,
				phase: params.phase
			});
			return;
		case "leave": return;
	}
}
function createChannelApprovalNativeRuntimeAdapter(spec) {
	return {
		...spec.eventKinds ? { eventKinds: spec.eventKinds } : {},
		...spec.resolveApprovalKind ? { resolveApprovalKind: spec.resolveApprovalKind } : {},
		availability: {
			isConfigured: spec.availability.isConfigured,
			shouldHandle: spec.availability.shouldHandle
		},
		presentation: {
			buildPendingPayload: async (params) => await spec.presentation.buildPendingPayload(params),
			buildResolvedResult: async (params) => await spec.presentation.buildResolvedResult(params),
			buildExpiredResult: async (params) => await spec.presentation.buildExpiredResult(params)
		},
		transport: {
			prepareTarget: async (params) => await spec.transport.prepareTarget(params),
			deliverPending: async (params) => await spec.transport.deliverPending(params),
			...spec.transport.updateEntry ? { updateEntry: async (params) => await spec.transport.updateEntry?.(params) } : {},
			...spec.transport.deleteEntry ? { deleteEntry: async (params) => await spec.transport.deleteEntry?.(params) } : {}
		},
		...spec.interactions ? { interactions: {
			...spec.interactions.bindPending ? { bindPending: async (params) => await spec.interactions.bindPending(params) ?? null } : {},
			...spec.interactions.unbindPending ? { unbindPending: async (params) => await spec.interactions?.unbindPending?.(params) } : {},
			...spec.interactions.clearPendingActions ? { clearPendingActions: async (params) => await spec.interactions?.clearPendingActions?.(params) } : {},
			...spec.interactions.cancelDelivered ? { cancelDelivered: async (params) => await spec.interactions?.cancelDelivered?.(params) } : {}
		} } : {},
		...spec.observe ? { observe: {
			...spec.observe.onDeliveryError ? { onDeliveryError: (params) => spec.observe?.onDeliveryError?.(params) } : {},
			...spec.observe.onDuplicateSkipped ? { onDuplicateSkipped: (params) => spec.observe?.onDuplicateSkipped?.(params) } : {},
			...spec.observe.onDelivered ? { onDelivered: (params) => spec.observe?.onDelivered?.(params) } : {}
		} } : {}
	};
}
function createChannelApprovalHandler(adapter) {
	return createChannelNativeApprovalRuntime({
		label: adapter.runtime.label,
		clientDisplayName: adapter.runtime.clientDisplayName,
		cfg: adapter.runtime.cfg,
		gatewayUrl: adapter.runtime.gatewayUrl,
		eventKinds: adapter.runtime.eventKinds,
		channel: adapter.runtime.channel,
		channelLabel: adapter.runtime.channelLabel,
		accountId: adapter.runtime.accountId,
		nativeAdapter: adapter.runtime.nativeAdapter,
		resolveApprovalKind: adapter.runtime.resolveApprovalKind,
		isConfigured: adapter.runtime.isConfigured,
		shouldHandle: adapter.runtime.shouldHandle,
		nowMs: adapter.runtime.nowMs,
		buildPendingContent: adapter.content.buildPendingContent,
		prepareTarget: adapter.transport.prepareTarget,
		deliverTarget: adapter.transport.deliverTarget,
		onDeliveryError: adapter.lifecycle.onDeliveryError,
		onDuplicateSkipped: adapter.lifecycle.onDuplicateSkipped,
		onDelivered: adapter.lifecycle.onDelivered,
		finalizeResolved: adapter.lifecycle.finalizeResolved,
		finalizeExpired: adapter.lifecycle.finalizeExpired,
		onStopped: adapter.lifecycle.onStopped
	});
}
async function createChannelApprovalHandlerFromCapability(params) {
	const nativeRuntime = params.capability?.nativeRuntime;
	if (!nativeRuntime) return null;
	const log = createSubsystemLogger(params.label);
	const activeEntries = /* @__PURE__ */ new Map();
	let stopped = false;
	const resolveApprovalKind = nativeRuntime.resolveApprovalKind ?? ((request) => request.id.startsWith("plugin:") ? "plugin" : "exec");
	const baseContext = {
		cfg: params.cfg,
		accountId: params.accountId,
		gatewayUrl: params.gatewayUrl,
		context: params.context
	};
	return createChannelApprovalHandler({
		runtime: {
			label: params.label,
			clientDisplayName: params.clientDisplayName,
			channel: params.channel,
			channelLabel: params.channelLabel,
			cfg: params.cfg,
			accountId: params.accountId,
			gatewayUrl: params.gatewayUrl,
			eventKinds: nativeRuntime.eventKinds,
			nativeAdapter: params.capability?.native,
			resolveApprovalKind,
			isConfigured: () => nativeRuntime.availability.isConfigured(baseContext),
			shouldHandle: (request) => nativeRuntime.availability.shouldHandle({
				...baseContext,
				request
			}),
			nowMs: params.nowMs
		},
		content: { buildPendingContent: async ({ request, approvalKind, nowMs }) => {
			const view = buildPendingApprovalView(request);
			return {
				view,
				payload: await nativeRuntime.presentation.buildPendingPayload({
					...baseContext,
					request,
					approvalKind,
					nowMs,
					view
				})
			};
		} },
		transport: {
			prepareTarget: async ({ plannedTarget, request, approvalKind, pendingContent }) => {
				return await nativeRuntime.transport.prepareTarget({
					...baseContext,
					plannedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
			},
			deliverTarget: async ({ plannedTarget, preparedTarget, request, approvalKind, pendingContent }) => {
				const entry = await nativeRuntime.transport.deliverPending({
					...baseContext,
					plannedTarget,
					preparedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
				if (!entry) return null;
				if (stopped) {
					await nativeRuntime.interactions?.cancelDelivered?.({
						...baseContext,
						entry,
						request,
						approvalKind
					});
					return null;
				}
				const binding = await nativeRuntime.interactions?.bindPending?.({
					...baseContext,
					entry,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
				if (stopped) {
					if (binding !== void 0 && binding !== null) await nativeRuntime.interactions?.unbindPending?.({
						...baseContext,
						entry,
						binding,
						request,
						approvalKind
					});
					else await nativeRuntime.interactions?.cancelDelivered?.({
						...baseContext,
						entry,
						request,
						approvalKind
					});
					return null;
				}
				const wrapped = {
					entry,
					...binding === void 0 || binding === null ? {} : { binding }
				};
				const activeRequest = activeEntries.get(request.id) ?? {
					request,
					approvalKind,
					entries: []
				};
				activeRequest.entries.push(wrapped);
				activeEntries.set(request.id, activeRequest);
				return wrapped;
			}
		},
		lifecycle: {
			onDeliveryError: ({ error, plannedTarget, request, approvalKind, pendingContent }) => {
				nativeRuntime.observe?.onDeliveryError?.({
					...baseContext,
					error,
					plannedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
			},
			onDuplicateSkipped: ({ plannedTarget, preparedTarget, request, approvalKind, pendingContent }) => {
				nativeRuntime.observe?.onDuplicateSkipped?.({
					...baseContext,
					plannedTarget,
					preparedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload
				});
			},
			onDelivered: ({ plannedTarget, preparedTarget, request, approvalKind, pendingContent, entry }) => {
				nativeRuntime.observe?.onDelivered?.({
					...baseContext,
					plannedTarget,
					preparedTarget,
					request,
					approvalKind,
					view: pendingContent.view,
					pendingPayload: pendingContent.payload,
					entry: entry.entry
				});
			},
			finalizeResolved: async ({ request, resolved, entries }) => {
				const resolvedEntries = consumeActiveWrappedEntries(activeEntries, request.id, entries);
				const view = buildResolvedApprovalView(request, resolved);
				await finalizeWrappedEntries({
					entries: resolvedEntries,
					phase: "resolved",
					request,
					log,
					runEntry: async (wrapped) => {
						if (wrapped.binding !== void 0) await nativeRuntime.interactions?.unbindPending?.({
							...baseContext,
							entry: wrapped.entry,
							binding: wrapped.binding,
							request,
							approvalKind: resolveApprovalKind(request)
						});
						await applyApprovalFinalAction({
							nativeRuntime,
							baseContext,
							wrapped,
							result: await nativeRuntime.presentation.buildResolvedResult({
								...baseContext,
								request,
								resolved,
								view,
								entry: wrapped.entry
							}),
							phase: "resolved"
						});
					}
				});
			},
			finalizeExpired: async ({ request, entries }) => {
				const expiredEntries = consumeActiveWrappedEntries(activeEntries, request.id, entries);
				const view = buildExpiredApprovalView(request);
				await finalizeWrappedEntries({
					entries: expiredEntries,
					phase: "expired",
					request,
					log,
					runEntry: async (wrapped) => {
						if (wrapped.binding !== void 0) await nativeRuntime.interactions?.unbindPending?.({
							...baseContext,
							entry: wrapped.entry,
							binding: wrapped.binding,
							request,
							approvalKind: resolveApprovalKind(request)
						});
						await applyApprovalFinalAction({
							nativeRuntime,
							baseContext,
							wrapped,
							result: await nativeRuntime.presentation.buildExpiredResult({
								...baseContext,
								request,
								view,
								entry: wrapped.entry
							}),
							phase: "expired"
						});
					}
				});
			},
			onStopped: async () => {
				stopped = true;
				if (activeEntries.size === 0) {
					activeEntries.clear();
					return;
				}
				for (const activeRequest of activeEntries.values()) await unbindWrappedEntries({
					entries: activeRequest.entries,
					request: activeRequest.request,
					approvalKind: activeRequest.approvalKind,
					baseContext,
					nativeRuntime,
					log
				});
				activeEntries.clear();
			}
		}
	});
}
//#endregion
export { createChannelApprovalHandlerFromCapability as n, createChannelApprovalNativeRuntimeAdapter as r, createChannelApprovalHandler as t };
