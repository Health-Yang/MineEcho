import { r as normalizeOptionalString } from "./string-utils-DTdv1UKc.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fork } from "node:child_process";
//#region packages/memory-host-sdk/src/host/embedding-defaults.ts
const DEFAULT_LOCAL_MODEL = "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf";
//#endregion
//#region packages/memory-host-sdk/src/host/embedding-vectors.ts
function sanitizeAndNormalizeEmbedding(vec) {
	const sanitized = vec.map((value) => Number.isFinite(value) ? value : 0);
	const magnitude = Math.sqrt(sanitized.reduce((sum, value) => sum + value * value, 0));
	if (magnitude < 1e-10) return sanitized;
	return sanitized.map((value) => value / magnitude);
}
//#endregion
//#region packages/memory-host-sdk/src/host/embedding-worker-errors.ts
const LOCAL_EMBEDDING_WORKER_ERROR_CODES = {
	exited: "LOCAL_EMBEDDING_WORKER_EXITED",
	processError: "LOCAL_EMBEDDING_WORKER_PROCESS_ERROR",
	ipcError: "LOCAL_EMBEDDING_WORKER_IPC_ERROR"
};
new Set(Object.values(LOCAL_EMBEDDING_WORKER_ERROR_CODES));
function createLocalEmbeddingWorkerFailureError(params) {
	return Object.assign(new Error(params.message), {
		code: params.code,
		reason: params.reason,
		...params.exitCode !== void 0 ? { exitCode: params.exitCode } : {},
		...params.signal !== void 0 ? { signal: params.signal } : {},
		...params.cause !== void 0 ? { cause: params.cause } : {}
	});
}
//#endregion
//#region packages/memory-host-sdk/src/host/embeddings-worker.ts
function resolveDefaultWorkerScriptPath() {
	const currentPath = fileURLToPath(import.meta.url);
	const extension = path.extname(currentPath);
	const currentName = path.basename(currentPath);
	const sibling = extension === ".ts" ? "embeddings-worker-child.ts" : currentName.startsWith("embeddings-worker.") ? "embeddings-worker-child.js" : "memory-core-local-embedding-worker.js";
	return path.join(path.dirname(currentPath), sibling);
}
function serializeLocalEmbeddingOptions(options) {
	return {
		config: {},
		provider: "local",
		model: options.model,
		fallback: "none",
		local: options.local
	};
}
function createWorkerExitError(code, signal) {
	return createLocalEmbeddingWorkerFailureError({
		message: `Local embedding worker exited unexpectedly (${signal ? `signal ${signal}` : `exit code ${code ?? "unknown"}`})`,
		code: LOCAL_EMBEDDING_WORKER_ERROR_CODES.exited,
		reason: signal ? "signal" : "exit",
		exitCode: code,
		signal
	});
}
function createWorkerResponseError(error) {
	if (typeof error.error === "object" && error.error) {
		const message = error.error.message || "Local embedding worker failed";
		const workerError = new Error(message);
		if (error.error.code) workerError.code = error.error.code;
		return workerError;
	}
	return new Error(error.error || "Local embedding worker failed");
}
const WORKER_UNSAFE_EXEC_ARGV_FLAGS = new Set(["--inspect", "--inspect-brk"]);
const WORKER_UNSAFE_EXEC_ARGV_FLAGS_WITH_VALUE = new Set([
	"--eval",
	"-e",
	"--print",
	"-p",
	"--input-type",
	"--inspect-port"
]);
const WORKER_UNSAFE_EXEC_ARGV_OPTION_PREFIXES = [
	"--eval=",
	"--print=",
	"--input-type=",
	"--inspect=",
	"--inspect-brk=",
	"--inspect-port="
];
const WORKER_CLOSE_GRACE_MS = 250;
function resolveWorkerExecArgv() {
	const args = [];
	let skipNext = false;
	for (const arg of process.execArgv) {
		if (skipNext) {
			skipNext = false;
			continue;
		}
		if (WORKER_UNSAFE_EXEC_ARGV_FLAGS.has(arg)) continue;
		if (WORKER_UNSAFE_EXEC_ARGV_FLAGS_WITH_VALUE.has(arg)) {
			skipNext = true;
			continue;
		}
		if (WORKER_UNSAFE_EXEC_ARGV_OPTION_PREFIXES.some((prefix) => arg.startsWith(prefix))) continue;
		args.push(arg);
	}
	return args;
}
var LocalEmbeddingWorkerClient = class {
	constructor(scriptPath) {
		this.scriptPath = scriptPath;
		this.child = null;
		this.nextRequestId = 1;
		this.pending = /* @__PURE__ */ new Map();
	}
	async initialize(options) {
		await this.send({
			type: "initialize",
			options
		});
	}
	async embedQuery(options, text, callOptions) {
		const result = await this.send({
			type: "embedQuery",
			options,
			text
		}, callOptions);
		return Array.isArray(result) ? result : [];
	}
	async embedBatch(options, texts, callOptions) {
		const result = await this.send({
			type: "embedBatch",
			options,
			texts
		}, callOptions);
		return Array.isArray(result) ? result : [];
	}
	async close() {
		if (!this.child) return;
		let timeout;
		const closeRequest = this.send({ type: "close" }).then(() => "closed");
		const closeTimeout = new Promise((resolve) => {
			timeout = setTimeout(() => resolve("timeout"), WORKER_CLOSE_GRACE_MS);
			timeout.unref?.();
		});
		try {
			if (await Promise.race([closeRequest, closeTimeout]) === "timeout") closeRequest.catch(() => {});
		} finally {
			if (timeout) clearTimeout(timeout);
			this.shutdownChild();
		}
	}
	ensureChild() {
		if (this.child?.connected) return this.child;
		const child = fork(this.scriptPath, [], {
			execArgv: resolveWorkerExecArgv(),
			serialization: "json",
			stdio: [
				"ignore",
				"ignore",
				"ignore",
				"ipc"
			]
		});
		child.on("message", (message) => this.handleMessage(message));
		child.on("exit", (code, signal) => {
			if (this.child === child) this.child = null;
			this.rejectPending(createWorkerExitError(code, signal));
		});
		child.on("error", (err) => {
			if (this.child === child) this.child = null;
			this.rejectPending(createLocalEmbeddingWorkerFailureError({
				message: `Local embedding worker process failed: ${err.message}`,
				code: LOCAL_EMBEDDING_WORKER_ERROR_CODES.processError,
				reason: "process-error",
				cause: err
			}));
		});
		this.child = child;
		return child;
	}
	async send(request, options) {
		options?.signal?.throwIfAborted();
		const child = this.ensureChild();
		const id = this.nextRequestId++;
		const payload = {
			...request,
			id
		};
		return await new Promise((resolve, reject) => {
			const pending = {
				resolve,
				reject
			};
			if (options?.signal) {
				const abort = () => {
					this.pending.delete(id);
					this.shutdownChild();
					reject(options.signal?.reason ?? /* @__PURE__ */ new Error("Local embedding request aborted"));
				};
				options.signal.addEventListener("abort", abort, { once: true });
				pending.abort = () => options.signal?.removeEventListener("abort", abort);
			}
			this.pending.set(id, pending);
			child.send(payload, (err) => {
				if (err) {
					this.pending.delete(id);
					pending.abort?.();
					reject(createLocalEmbeddingWorkerFailureError({
						message: `Local embedding worker IPC failed: ${err.message}`,
						code: LOCAL_EMBEDDING_WORKER_ERROR_CODES.ipcError,
						reason: "ipc",
						cause: err
					}));
				}
			});
		});
	}
	handleMessage(message) {
		const response = message;
		if (typeof response.id !== "number") return;
		const pending = this.pending.get(response.id);
		if (!pending) return;
		this.pending.delete(response.id);
		pending.abort?.();
		if (response.ok) {
			pending.resolve(response.value);
			return;
		}
		pending.reject(createWorkerResponseError(response));
	}
	shutdownChild() {
		const child = this.child;
		this.child = null;
		if (!child) return;
		if (child.connected) child.disconnect();
		if (!child.killed) child.kill();
	}
	rejectPending(err) {
		const pending = [...this.pending.values()];
		this.pending.clear();
		for (const entry of pending) {
			entry.abort?.();
			entry.reject(err);
		}
	}
};
async function createLocalEmbeddingWorkerProvider(options, runtimeOptions) {
	const modelPath = normalizeOptionalString(options.local?.modelPath) || "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf";
	const workerOptions = serializeLocalEmbeddingOptions(options);
	const client = new LocalEmbeddingWorkerClient(runtimeOptions?.workerScriptPath ?? resolveDefaultWorkerScriptPath());
	try {
		await client.initialize(workerOptions);
	} catch (err) {
		await client.close().catch(() => {});
		throw err;
	}
	let closed = false;
	const throwIfClosed = () => {
		if (closed) throw new Error("Local embedding provider has been closed");
	};
	return {
		id: "local",
		model: modelPath,
		embedQuery: async (text, callOptions) => {
			throwIfClosed();
			return await client.embedQuery(workerOptions, text, callOptions);
		},
		embedBatch: async (texts, callOptions) => {
			throwIfClosed();
			return await client.embedBatch(workerOptions, texts, callOptions);
		},
		close: async () => {
			if (closed) return;
			closed = true;
			await client.close();
		}
	};
}
//#endregion
//#region packages/memory-host-sdk/src/host/node-llama.ts
const NODE_LLAMA_CPP_MODULE = "node-llama-cpp";
async function importNodeLlamaCpp() {
	return import(NODE_LLAMA_CPP_MODULE);
}
//#endregion
//#region packages/memory-host-sdk/src/host/embeddings.ts
async function disposeResources(resources) {
	let firstError;
	for (const resource of resources) try {
		await resource?.dispose?.();
	} catch (err) {
		firstError ??= err;
	}
	if (firstError) throw firstError;
}
async function createLocalEmbeddingProvider(options) {
	return await createLocalEmbeddingWorkerProvider(options);
}
async function createLocalEmbeddingProviderInProcess(options) {
	const modelPath = normalizeOptionalString(options.local?.modelPath) || "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf";
	const modelCacheDir = normalizeOptionalString(options.local?.modelCacheDir);
	const contextSize = options.local?.contextSize ?? 4096;
	const { getLlama, resolveModelFile, LlamaLogLevel } = await importNodeLlamaCpp();
	let llama = null;
	let embeddingModel = null;
	let embeddingContext = null;
	let initPromise = null;
	let initAbortController = null;
	let closePromise = null;
	let closed = false;
	const throwIfClosed = () => {
		if (closed) throw new Error("Local embedding provider has been closed");
	};
	const disposeAndThrowIfClosed = async (resource) => {
		if (!closed) return resource;
		await disposeResources([resource]);
		throwIfClosed();
		return resource;
	};
	const ensureContext = async () => {
		throwIfClosed();
		if (embeddingContext) return embeddingContext;
		if (initPromise) return initPromise;
		initPromise = (async () => {
			const abortController = new AbortController();
			initAbortController = abortController;
			try {
				if (!llama) llama = await disposeAndThrowIfClosed(await getLlama({ logLevel: LlamaLogLevel.error }));
				if (!embeddingModel) {
					const resolved = await resolveModelFile(modelPath, {
						...modelCacheDir ? { directory: modelCacheDir } : {},
						signal: abortController.signal
					});
					throwIfClosed();
					embeddingModel = await disposeAndThrowIfClosed(await llama.loadModel({
						modelPath: resolved,
						loadSignal: abortController.signal
					}));
				}
				if (!embeddingContext) embeddingContext = await disposeAndThrowIfClosed(await embeddingModel.createEmbeddingContext({
					contextSize,
					createSignal: abortController.signal
				}));
				return embeddingContext;
			} catch (err) {
				initPromise = null;
				throw err;
			} finally {
				if (initAbortController === abortController) initAbortController = null;
			}
		})();
		return initPromise;
	};
	return {
		id: "local",
		model: modelPath,
		embedQuery: async (text, options) => {
			throwIfClosed();
			options?.signal?.throwIfAborted();
			const ctx = await ensureContext();
			throwIfClosed();
			options?.signal?.throwIfAborted();
			const embedding = await ctx.getEmbeddingFor(text);
			return sanitizeAndNormalizeEmbedding(Array.from(embedding.vector));
		},
		embedBatch: async (texts, options) => {
			throwIfClosed();
			options?.signal?.throwIfAborted();
			const ctx = await ensureContext();
			throwIfClosed();
			options?.signal?.throwIfAborted();
			const embeddings = [];
			for (const text of texts) {
				throwIfClosed();
				options?.signal?.throwIfAborted();
				const embedding = await ctx.getEmbeddingFor(text);
				embeddings.push(sanitizeAndNormalizeEmbedding(Array.from(embedding.vector)));
			}
			return embeddings;
		},
		close: async () => {
			if (closePromise) return closePromise;
			closed = true;
			initAbortController?.abort();
			initAbortController = null;
			closePromise = (async () => {
				const context = embeddingContext;
				const model = embeddingModel;
				const runtime = llama;
				embeddingContext = null;
				embeddingModel = null;
				llama = null;
				initPromise = null;
				await disposeResources([
					context,
					model,
					runtime
				]);
			})();
			return closePromise;
		}
	};
}
//#endregion
export { DEFAULT_LOCAL_MODEL as i, createLocalEmbeddingProviderInProcess as n, sanitizeAndNormalizeEmbedding as r, createLocalEmbeddingProvider as t };
