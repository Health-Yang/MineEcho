import { n as createLocalEmbeddingProviderInProcess } from "./embeddings-C9YA6RhB.js";
//#region packages/memory-host-sdk/src/host/embeddings-worker-child.ts
let provider = null;
let providerOptionsKey = null;
let requestQueue = Promise.resolve();
function send(message) {
	if (typeof process.send === "function") process.send(message);
}
async function getProvider(options) {
	const key = JSON.stringify(options);
	if (provider && providerOptionsKey === key) return provider;
	await provider?.close?.();
	provider = await createLocalEmbeddingProviderInProcess(options);
	providerOptionsKey = key;
	return provider;
}
async function closeProvider() {
	const current = provider;
	provider = null;
	providerOptionsKey = null;
	await current?.close?.();
}
function serializeError(err) {
	if (!(err instanceof Error)) return { message: String(err) };
	const code = err.code;
	return {
		message: err.message,
		...typeof code === "string" ? { code } : {}
	};
}
async function handleRequest(request) {
	if (request.type === "close") {
		await closeProvider();
		send({
			id: request.id,
			ok: true
		});
		return;
	}
	const currentProvider = await getProvider(request.options);
	if (request.type === "initialize") {
		send({
			id: request.id,
			ok: true
		});
		return;
	}
	if (request.type === "embedQuery") {
		const value = await currentProvider.embedQuery(request.text);
		send({
			id: request.id,
			ok: true,
			value
		});
		return;
	}
	const value = await currentProvider.embedBatch(request.texts);
	send({
		id: request.id,
		ok: true,
		value
	});
}
process.on("message", (message) => {
	const request = message;
	requestQueue = requestQueue.then(async () => {
		try {
			await handleRequest(request);
		} catch (err) {
			send({
				id: request.id,
				ok: false,
				error: serializeError(err)
			});
		}
	});
});
process.once("disconnect", () => {
	closeProvider().finally(() => {
		process.exit(0);
	});
});
//#endregion
export {};
