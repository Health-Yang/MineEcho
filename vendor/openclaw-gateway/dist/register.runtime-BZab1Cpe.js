import { a as unregisterAcpRuntimeBackend, n as registerAcpRuntimeBackend, t as getAcpRuntimeBackend } from "./registry-COKHeWJa.js";
import "./acp-runtime-backend-Dls5X9sp.js";
//#region extensions/acpx/register.runtime.ts
const ACPX_BACKEND_ID = "acpx";
let serviceModulePromise = null;
function createDeferredResult() {
	let resolve;
	let reject;
	return {
		promise: new Promise((resolvePromise, rejectPromise) => {
			resolve = resolvePromise;
			reject = rejectPromise;
		}),
		resolve,
		reject
	};
}
var LegacyRunTurnEventQueue = class {
	constructor() {
		this.items = [];
		this.waits = [];
		this.closed = false;
	}
	push(item) {
		if (this.closed) return;
		const waiter = this.waits.shift();
		if (waiter) {
			waiter.resolve(item);
			return;
		}
		this.items.push(item);
	}
	clear() {
		this.items.length = 0;
	}
	close() {
		if (this.closed) return;
		this.closed = true;
		for (const waiter of this.waits.splice(0)) waiter.resolve(null);
	}
	fail(error) {
		if (this.closed) return;
		this.error = error;
		this.closed = true;
		for (const waiter of this.waits.splice(0)) waiter.reject(error);
	}
	async next() {
		const item = this.items.shift();
		if (item) return item;
		if (this.error) throw this.error;
		if (this.closed) return null;
		return await new Promise((resolve, reject) => {
			this.waits.push({
				resolve,
				reject
			});
		});
	}
	async *iterate() {
		for (;;) {
			const item = await this.next();
			if (!item) return;
			yield item;
		}
	}
};
function loadServiceModule() {
	serviceModulePromise ??= import("./service-BFC0ZghX.js");
	return serviceModulePromise;
}
async function startRealService(state) {
	if (state.realRuntime) return state.realRuntime;
	if (!state.ctx) throw new Error("ACPX runtime service is not started");
	state.startPromise ??= (async () => {
		const { createAcpxRuntimeService } = await loadServiceModule();
		const service = createAcpxRuntimeService(state.params);
		state.realService = service;
		await service.start(state.ctx);
		const backend = getAcpRuntimeBackend(ACPX_BACKEND_ID);
		if (!backend?.runtime) throw new Error("ACPX runtime service did not register an ACP backend");
		state.realRuntime = backend.runtime;
		return state.realRuntime;
	})();
	try {
		return await state.startPromise;
	} catch (error) {
		state.startPromise = null;
		state.realService = null;
		throw error;
	}
}
function lazyStartTurn(resolveRuntime, input) {
	const turnPromise = resolveRuntime().then((runtime) => {
		if (runtime.startTurn) return runtime.startTurn(input);
		return legacyRunTurnAsStartTurn(runtime, input);
	});
	return {
		requestId: input.requestId,
		events: { async *[Symbol.asyncIterator]() {
			yield* (await turnPromise).events;
		} },
		result: turnPromise.then((turn) => turn.result),
		cancel(inputArgs) {
			return turnPromise.then((turn) => turn.cancel(inputArgs));
		},
		closeStream(inputArgs) {
			return turnPromise.then((turn) => turn.closeStream(inputArgs));
		}
	};
}
function legacyRunTurnAsStartTurn(runtime, input) {
	const result = createDeferredResult();
	result.promise.catch(() => {});
	const queue = new LegacyRunTurnEventQueue();
	let resultSettled = false;
	const settleResult = (next) => {
		if (resultSettled) return;
		resultSettled = true;
		result.resolve(next);
	};
	(async () => {
		try {
			for await (const event of runtime.runTurn(input)) {
				if (event.type === "done") {
					settleResult({
						status: "completed",
						...event.stopReason ? { stopReason: event.stopReason } : {}
					});
					continue;
				}
				if (event.type === "error") {
					settleResult({
						status: "failed",
						error: {
							message: event.message,
							...event.code ? { code: event.code } : {},
							...event.detailCode ? { detailCode: event.detailCode } : {},
							...event.retryable === void 0 ? {} : { retryable: event.retryable }
						}
					});
					continue;
				}
				queue.push(event);
			}
			settleResult({
				status: "failed",
				error: {
					code: "ACP_TURN_FAILED",
					message: "ACP turn ended without a terminal done event."
				}
			});
		} catch (error) {
			result.reject(error);
			queue.fail(error);
			return;
		}
		queue.close();
	})();
	return {
		requestId: input.requestId,
		events: queue.iterate(),
		result: result.promise,
		async cancel(inputArgs) {
			await runtime.cancel({
				handle: input.handle,
				reason: inputArgs?.reason
			});
		},
		async closeStream() {
			queue.clear();
			queue.close();
		}
	};
}
function createDeferredRuntime(state) {
	const resolveRuntime = () => startRealService(state);
	return {
		async ensureSession(input) {
			return await (await resolveRuntime()).ensureSession(input);
		},
		startTurn(input) {
			return lazyStartTurn(resolveRuntime, input);
		},
		async *runTurn(input) {
			yield* (await resolveRuntime()).runTurn(input);
		},
		async getCapabilities(input) {
			return await (await resolveRuntime()).getCapabilities?.(input) ?? { controls: [] };
		},
		async getStatus(input) {
			return await (await resolveRuntime()).getStatus?.(input) ?? {};
		},
		async setMode(input) {
			await (await resolveRuntime()).setMode?.(input);
		},
		async setConfigOption(input) {
			await (await resolveRuntime()).setConfigOption?.(input);
		},
		async doctor() {
			return await (await resolveRuntime()).doctor?.() ?? {
				ok: true,
				message: "ok"
			};
		},
		async prepareFreshSession(input) {
			await (await resolveRuntime()).prepareFreshSession?.(input);
		},
		async cancel(input) {
			await (await resolveRuntime()).cancel(input);
		},
		async close(input) {
			await (await resolveRuntime()).close(input);
		}
	};
}
function createAcpxRuntimeService(params = {}) {
	const state = {
		ctx: null,
		params,
		realRuntime: null,
		realService: null,
		startPromise: null
	};
	return {
		id: "acpx-runtime",
		async start(ctx) {
			if (process.env.OPENCLAW_SKIP_ACPX_RUNTIME === "1") {
				ctx.logger.info("skipping embedded acpx runtime backend (OPENCLAW_SKIP_ACPX_RUNTIME=1)");
				return;
			}
			state.ctx = ctx;
			registerAcpRuntimeBackend({
				id: ACPX_BACKEND_ID,
				runtime: createDeferredRuntime(state)
			});
			ctx.logger.info("embedded acpx runtime backend registered lazily");
		},
		async stop(ctx) {
			if (state.realService) await state.realService.stop?.(ctx);
			else unregisterAcpRuntimeBackend(ACPX_BACKEND_ID);
			state.ctx = null;
			state.realRuntime = null;
			state.realService = null;
			state.startPromise = null;
		}
	};
}
//#endregion
export { createAcpxRuntimeService as t };
