import { a as logWarn } from "./logger-Bcz1IQSW.js";
import { f as isLoopbackIpAddress } from "./ip-Y63B6JB6.js";
import { c as shouldUseEnvHttpProxyForUrl, i as hasProxyEnvConfigured } from "./proxy-env-Cs0G_0hd.js";
import { t as getActiveManagedProxyLoopbackMode } from "./active-proxy-state-BBaqWhZo.js";
import { n as createHttp1EnvHttpProxyAgent, r as createHttp1ProxyAgent, t as createHttp1Agent } from "./undici-runtime-CMbtDO5P.js";
import { o as globalUndiciStreamTimeoutMs } from "./undici-global-dispatcher-DsSuVk_O.js";
import { n as buildTimeoutAbortSignal } from "./fetch-timeout-yG8tB5AA.js";
import { n as normalizeRequestInitHeadersForFetch, t as normalizeHeadersInitForFetch } from "./fetch-headers-D18pVzIl.js";
import { _ as resolvePinnedHostnameWithPolicy, a as createPinnedDispatcher, i as closeDispatcher, n as assertHostnameAllowedWithPolicy, t as SsrFBlockedError, v as resolveSsrFPolicyForUrl } from "./ssrf-DcS_PaqX.js";
import { t as retainSafeHeadersForCrossOriginRedirect$1 } from "./redirect-headers-22x4fu-r.js";
import { r as isMockedFetch, t as fetchWithRuntimeDispatcher } from "./runtime-fetch-BNotIgLc.js";
//#region src/infra/net/configured-local-origin-bypass.ts
function resolveHttpOrigin(value) {
	try {
		const parsed = new URL(value.trim());
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
		parsed.hostname = parsed.hostname.replace(/\.+$/, "");
		return parsed.origin.toLowerCase();
	} catch {
		return;
	}
}
function isLoopbackManagedProxyBypassHost(hostname) {
	const normalized = hostname.trim().toLowerCase().replace(/\.+$/, "").replace(/^\[(.*)\]$/, "$1");
	return normalized === "localhost" || isLoopbackIpAddress(normalized);
}
function isExactConfiguredLocalOriginBypass(params) {
	if (params.managedProxyBypass?.kind !== "configured-local-origin") return false;
	const baseOrigin = resolveHttpOrigin(params.managedProxyBypass.baseUrl);
	if (!baseOrigin) return false;
	let baseHostname;
	try {
		baseHostname = new URL(params.managedProxyBypass.baseUrl.trim()).hostname;
	} catch {
		return false;
	}
	if (!isLoopbackManagedProxyBypassHost(baseHostname)) return false;
	return resolveHttpOrigin(params.url.toString()) === baseOrigin;
}
function isPinnedLoopbackTarget(addresses) {
	return addresses.length > 0 && addresses.every((address) => isLoopbackIpAddress(address));
}
function shouldUseConfiguredLocalOriginManagedProxyBypass(params) {
	if (!isExactConfiguredLocalOriginBypass(params)) return false;
	const loopbackMode = getActiveManagedProxyLoopbackMode();
	if (loopbackMode === "proxy") return false;
	if (loopbackMode === "block" && isLoopbackManagedProxyBypassHost(params.url.hostname)) throw new SsrFBlockedError("proxy: configured local provider loopback connections are blocked by proxy.loopbackMode");
	return isPinnedLoopbackTarget(params.resolvedAddresses);
}
//#endregion
//#region src/infra/net/fetch-guard.ts
function resolveDispatcherTimeoutMs(fromParams) {
	if (fromParams !== void 0) return fromParams;
	if (globalUndiciStreamTimeoutMs !== void 0) return globalUndiciStreamTimeoutMs;
}
const GUARDED_FETCH_MODE = {
	STRICT: "strict",
	TRUSTED_ENV_PROXY: "trusted_env_proxy",
	TRUSTED_EXPLICIT_PROXY: "trusted_explicit_proxy"
};
const DEFAULT_MAX_REDIRECTS = 3;
const OPENCLAW_DEBUG_PROXY_ENABLED = "OPENCLAW_DEBUG_PROXY_ENABLED";
function isTruthyEnvValue(value) {
	return value === "1" || value === "true" || value === "yes" || value === "on";
}
function withStrictGuardedFetchMode(params) {
	return {
		...params,
		mode: GUARDED_FETCH_MODE.STRICT
	};
}
function withTrustedEnvProxyGuardedFetchMode(params) {
	return {
		...params,
		mode: GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY
	};
}
function withTrustedExplicitProxyGuardedFetchMode(params) {
	return {
		...params,
		mode: GUARDED_FETCH_MODE.TRUSTED_EXPLICIT_PROXY
	};
}
function resolveGuardedFetchMode(params) {
	if (params.mode) return params.mode;
	if (params.proxy === "env" && params.dangerouslyAllowEnvProxyWithoutPinnedDns === true) return GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY;
	return GUARDED_FETCH_MODE.STRICT;
}
function isManagedProxyActive() {
	return process.env["OPENCLAW_PROXY_ACTIVE"] === "1";
}
function assertExplicitProxySupportsPinnedDns(url, dispatcherPolicy, pinDns) {
	if (pinDns !== false && dispatcherPolicy?.mode === "explicit-proxy" && url.protocol !== "https:") throw new Error("Explicit proxy SSRF pinning requires HTTPS targets; plain HTTP targets are not supported");
}
function createPolicyDispatcherWithoutPinnedDns(dispatcherPolicy, timeoutMs) {
	if (!dispatcherPolicy) return null;
	if (dispatcherPolicy.mode === "direct") return createHttp1Agent(dispatcherPolicy.connect ? { connect: { ...dispatcherPolicy.connect } } : void 0, timeoutMs);
	if (dispatcherPolicy.mode === "env-proxy") return createHttp1EnvHttpProxyAgent({
		...dispatcherPolicy.connect ? { connect: { ...dispatcherPolicy.connect } } : {},
		...dispatcherPolicy.proxyTls ? { proxyTls: { ...dispatcherPolicy.proxyTls } } : {}
	}, timeoutMs);
	const proxyUrl = dispatcherPolicy.proxyUrl.trim();
	if (dispatcherPolicy.proxyTls) return createHttp1ProxyAgent({
		uri: proxyUrl,
		requestTls: { ...dispatcherPolicy.proxyTls }
	}, timeoutMs);
	return createHttp1ProxyAgent({ uri: proxyUrl }, timeoutMs);
}
async function assertExplicitProxyAllowed(dispatcherPolicy, lookupFn, policy) {
	if (!dispatcherPolicy || dispatcherPolicy.mode !== "explicit-proxy") return;
	let parsedProxyUrl;
	try {
		parsedProxyUrl = new URL(dispatcherPolicy.proxyUrl);
	} catch {
		throw new Error("Invalid explicit proxy URL");
	}
	if (!["http:", "https:"].includes(parsedProxyUrl.protocol)) throw new Error("Explicit proxy URL must use http or https");
	const proxyPolicy = policy || dispatcherPolicy.allowPrivateProxy === true ? {
		...policy,
		hostnameAllowlist: void 0,
		...dispatcherPolicy.allowPrivateProxy === true ? { allowPrivateNetwork: true } : {}
	} : void 0;
	await resolvePinnedHostnameWithPolicy(parsedProxyUrl.hostname, {
		lookupFn,
		policy: proxyPolicy
	});
}
function isRedirectStatus(status) {
	return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}
function isAmbientGlobalFetch(params) {
	return typeof params.fetchImpl === "function" && typeof params.globalFetch === "function" && params.fetchImpl === params.globalFetch;
}
function retainSafeHeadersForCrossOriginRedirectHeaders(headers) {
	return retainSafeHeadersForCrossOriginRedirect$1(headers);
}
async function captureGuardedFetchExchange(params) {
	if (params.capture === false || !isTruthyEnvValue(process.env[OPENCLAW_DEBUG_PROXY_ENABLED])) return;
	const { captureHttpExchange, isDebugProxyGlobalFetchPatchInstalled } = await import("./runtime-BnT5kAyk.js");
	if (params.capturedByGlobalFetchPatch && isDebugProxyGlobalFetchPatchInstalled()) return;
	captureHttpExchange({
		url: params.url,
		method: params.method,
		requestHeaders: params.requestHeaders,
		requestBody: params.requestBody,
		response: params.response,
		transport: params.transport,
		flowId: params.capture?.flowId,
		meta: {
			captureOrigin: "guarded-fetch",
			...params.auditContext ? { auditContext: params.auditContext } : {},
			...params.capture?.meta
		}
	});
}
function retainSafeHeadersForCrossOriginRedirect(init) {
	if (!init?.headers) return init;
	return {
		...init,
		headers: retainSafeHeadersForCrossOriginRedirect$1(init.headers)
	};
}
function dropBodyHeaders(headers) {
	if (!headers) return headers;
	const nextHeaders = new Headers(normalizeHeadersInitForFetch(headers));
	nextHeaders.delete("content-encoding");
	nextHeaders.delete("content-language");
	nextHeaders.delete("content-length");
	nextHeaders.delete("content-location");
	nextHeaders.delete("content-type");
	nextHeaders.delete("transfer-encoding");
	return nextHeaders;
}
function rewriteRedirectInitForMethod(params) {
	const { init, status } = params;
	if (!init) return init;
	const currentMethod = init.method?.toUpperCase() ?? "GET";
	if (!(status === 303 ? currentMethod !== "GET" && currentMethod !== "HEAD" : (status === 301 || status === 302) && currentMethod === "POST")) return init;
	return {
		...init,
		method: "GET",
		body: void 0,
		headers: dropBodyHeaders(init.headers)
	};
}
function rewriteRedirectInitForCrossOrigin(params) {
	const { init, allowUnsafeReplay } = params;
	if (!init || allowUnsafeReplay) return init;
	const currentMethod = init.method?.toUpperCase() ?? "GET";
	if (currentMethod === "GET" || currentMethod === "HEAD") return init;
	return {
		...init,
		body: void 0,
		headers: dropBodyHeaders(init.headers)
	};
}
async function fetchWithSsrFGuard(params) {
	const { managedProxyBypass: _ignoredManagedProxyBypass, ...publicParams } = params;
	return await fetchWithSsrFGuardInternal(publicParams);
}
async function fetchConfiguredLocalOriginWithSsrFGuard({ configuredLocalOriginBaseUrl, ...params }) {
	return await fetchWithSsrFGuardInternal({
		...params,
		managedProxyBypass: {
			kind: "configured-local-origin",
			baseUrl: configuredLocalOriginBaseUrl
		}
	});
}
async function fetchWithSsrFGuardInternal(params) {
	const defaultFetch = params.fetchImpl ?? globalThis.fetch;
	if (!defaultFetch) throw new Error("fetch is not available");
	const isUsingMockedFetch = isMockedFetch(defaultFetch);
	const maxRedirects = typeof params.maxRedirects === "number" && Number.isFinite(params.maxRedirects) ? Math.max(0, Math.floor(params.maxRedirects)) : DEFAULT_MAX_REDIRECTS;
	const mode = resolveGuardedFetchMode(params);
	const { signal, cleanup, refresh } = buildTimeoutAbortSignal({
		timeoutMs: params.timeoutMs,
		signal: params.signal,
		operation: "fetchWithSsrFGuard",
		url: params.url
	});
	let released = false;
	const release = async (dispatcher) => {
		if (released) return;
		released = true;
		cleanup();
		await closeDispatcher(dispatcher ?? void 0);
	};
	const visited = new Set([params.url]);
	let currentUrl = params.url;
	let currentInit = normalizeRequestInitHeadersForFetch(params.init ? { ...params.init } : void 0);
	let redirectCount = 0;
	while (true) {
		let parsedUrl;
		try {
			parsedUrl = new URL(currentUrl);
		} catch {
			await release();
			throw new Error("Invalid URL: must be http or https");
		}
		if (!["http:", "https:"].includes(parsedUrl.protocol)) {
			await release();
			throw new Error("Invalid URL: must be http or https");
		}
		if (params.requireHttps === true && parsedUrl.protocol !== "https:") {
			await release();
			throw new Error("URL must use https");
		}
		let dispatcher = null;
		const policyForUrl = resolveSsrFPolicyForUrl(parsedUrl, params.policy);
		try {
			const usesTrustedExplicitProxyMode = mode === GUARDED_FETCH_MODE.TRUSTED_EXPLICIT_PROXY && params.dispatcherPolicy?.mode === "explicit-proxy";
			assertExplicitProxySupportsPinnedDns(parsedUrl, params.dispatcherPolicy, usesTrustedExplicitProxyMode ? false : params.pinDns);
			await assertExplicitProxyAllowed(params.dispatcherPolicy, params.lookupFn, params.policy);
			const canUseTrustedEnvProxy = mode === GUARDED_FETCH_MODE.TRUSTED_ENV_PROXY && shouldUseEnvHttpProxyForUrl(parsedUrl.toString());
			const canUseManagedProxy = mode === GUARDED_FETCH_MODE.STRICT && isManagedProxyActive() && hasProxyEnvConfigured();
			const canUseMockedFetchWithoutDns = isUsingMockedFetch && params.lookupFn === void 0 && !canUseTrustedEnvProxy && !canUseManagedProxy && !usesTrustedExplicitProxyMode && params.pinDns !== false;
			const timeoutMs = resolveDispatcherTimeoutMs(params.timeoutMs);
			if (canUseTrustedEnvProxy || params.pinDns === false) assertHostnameAllowedWithPolicy(parsedUrl.hostname, policyForUrl);
			if (canUseTrustedEnvProxy) dispatcher = createHttp1EnvHttpProxyAgent(void 0, timeoutMs);
			else if (canUseManagedProxy) {
				const pinned = await resolvePinnedHostnameWithPolicy(parsedUrl.hostname, {
					lookupFn: params.lookupFn,
					policy: policyForUrl
				});
				dispatcher = shouldUseConfiguredLocalOriginManagedProxyBypass({
					url: parsedUrl,
					managedProxyBypass: params.managedProxyBypass,
					resolvedAddresses: pinned.addresses
				}) ? createPinnedDispatcher(pinned, params.dispatcherPolicy, policyForUrl, timeoutMs) : createHttp1EnvHttpProxyAgent(void 0, timeoutMs);
			} else if (usesTrustedExplicitProxyMode) {
				assertHostnameAllowedWithPolicy(parsedUrl.hostname, policyForUrl);
				dispatcher = createPolicyDispatcherWithoutPinnedDns(params.dispatcherPolicy, timeoutMs);
			} else if (canUseMockedFetchWithoutDns) assertHostnameAllowedWithPolicy(parsedUrl.hostname, policyForUrl);
			else if (params.pinDns === false) {
				await resolvePinnedHostnameWithPolicy(parsedUrl.hostname, {
					lookupFn: params.lookupFn,
					policy: policyForUrl
				});
				dispatcher = createPolicyDispatcherWithoutPinnedDns(params.dispatcherPolicy, timeoutMs);
			} else dispatcher = createPinnedDispatcher(await resolvePinnedHostnameWithPolicy(parsedUrl.hostname, {
				lookupFn: params.lookupFn,
				policy: policyForUrl
			}), params.dispatcherPolicy, policyForUrl, timeoutMs);
			const init = {
				...currentInit ? { ...currentInit } : {},
				redirect: "manual",
				...dispatcher ? { dispatcher } : {},
				...signal ? { signal } : {}
			};
			const supportsDispatcherInit = params.fetchImpl !== void 0 && !isAmbientGlobalFetch({
				fetchImpl: params.fetchImpl,
				globalFetch: globalThis.fetch
			}) || isUsingMockedFetch;
			const shouldUseRuntimeFetch = Boolean(dispatcher) && !supportsDispatcherInit;
			const response = shouldUseRuntimeFetch ? await fetchWithRuntimeDispatcher(parsedUrl.toString(), init) : await defaultFetch(parsedUrl.toString(), init);
			const capturedByGlobalFetchPatch = !shouldUseRuntimeFetch && isAmbientGlobalFetch({
				fetchImpl: defaultFetch,
				globalFetch: globalThis.fetch
			});
			await captureGuardedFetchExchange({
				url: parsedUrl.toString(),
				method: currentInit?.method ?? "GET",
				requestHeaders: currentInit?.headers,
				requestBody: currentInit?.body ?? null,
				response,
				transport: "http",
				capture: params.capture,
				auditContext: params.auditContext,
				capturedByGlobalFetchPatch
			});
			if (isRedirectStatus(response.status)) {
				const location = response.headers.get("location");
				if (!location) {
					await release(dispatcher);
					throw new Error(`Redirect missing location header (${response.status})`);
				}
				redirectCount += 1;
				if (redirectCount > maxRedirects) {
					await release(dispatcher);
					throw new Error(`Too many redirects (limit: ${maxRedirects})`);
				}
				const nextParsedUrl = new URL(location, parsedUrl);
				const nextUrl = nextParsedUrl.toString();
				if (visited.has(nextUrl)) {
					await release(dispatcher);
					throw new Error("Redirect loop detected");
				}
				currentInit = rewriteRedirectInitForMethod({
					init: currentInit,
					status: response.status
				});
				if (nextParsedUrl.origin !== parsedUrl.origin) {
					currentInit = rewriteRedirectInitForCrossOrigin({
						init: currentInit,
						allowUnsafeReplay: params.allowCrossOriginUnsafeRedirectReplay === true
					});
					currentInit = retainSafeHeadersForCrossOriginRedirect(currentInit);
				}
				visited.add(nextUrl);
				response.body?.cancel();
				await closeDispatcher(dispatcher);
				currentUrl = nextUrl;
				continue;
			}
			return {
				response,
				finalUrl: currentUrl,
				release: async () => release(dispatcher),
				refreshTimeout: refresh
			};
		} catch (err) {
			if (err instanceof SsrFBlockedError) logWarn(`security: blocked URL fetch (${params.auditContext ?? "url-fetch"}) targetOrigin=${parsedUrl.origin} reason=${err.message}`);
			await release(dispatcher);
			throw err;
		}
	}
}
//#endregion
export { withStrictGuardedFetchMode as a, retainSafeHeadersForCrossOriginRedirectHeaders as i, fetchConfiguredLocalOriginWithSsrFGuard as n, withTrustedEnvProxyGuardedFetchMode as o, fetchWithSsrFGuard as r, withTrustedExplicitProxyGuardedFetchMode as s, GUARDED_FETCH_MODE as t };
