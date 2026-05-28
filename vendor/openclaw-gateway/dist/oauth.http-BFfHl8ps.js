import { r as fetchWithSsrFGuard } from "./fetch-guard-D0S6eBky.js";
import "./ssrf-runtime-C8F9j9mo.js";
import { a as DEFAULT_FETCH_TIMEOUT_MS } from "./oauth.shared-BD6M390i.js";
//#region extensions/google/oauth.http.ts
async function fetchWithTimeout(url, init, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
	const { response, release } = await fetchWithSsrFGuard({
		url,
		init,
		timeoutMs
	});
	try {
		const body = await response.arrayBuffer();
		return new Response(body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers
		});
	} finally {
		await release();
	}
}
//#endregion
export { fetchWithTimeout as t };
