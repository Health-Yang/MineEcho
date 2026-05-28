/**
 * High-level lifecycle management for OpenClaw's operator-managed network
 * proxy routing.
 *
 * OpenClaw does not spawn or configure the filtering proxy. When enabled, it
 * routes process-wide HTTP clients through the configured forward proxy URL and
 * restores the previous process state on shutdown.
 */
import type { ProxyConfig } from "../../../config/zod-schema.proxy.js";
export type ProxyLoopbackMode = NonNullable<NonNullable<ProxyConfig>["loopbackMode"]>;
export type ProxyHandle = {
    /** The operator-managed proxy URL injected into process.env. */
    proxyUrl: string;
    /** Restore process-wide proxy state. */
    stop: () => Promise<void>;
    /** Synchronously restore process-wide proxy state during hard process exit. */
    kill: (signal?: NodeJS.Signals) => void;
};
export declare function resetProxyLifecycleForTests(): void;
export declare function ensureInheritedManagedProxyRoutingActive(): void;
export declare function startProxy(config: ProxyConfig | undefined): Promise<ProxyHandle | null>;
export declare function stopProxy(handle: ProxyHandle | null): Promise<void>;
export declare function registerManagedProxyGatewayLoopbackBypass(url: string): (() => void) | undefined;
/**
 * Carve out the operator-managed external proxy for the Browser plugin's
 * loopback CDP probe to a Chromium instance OpenClaw spawned itself.
 *
 * The managed proxy installs a process-wide undici dispatcher that would
 * otherwise route `http://127.0.0.1:<cdpPort>/json/version` and the
 * `ws://127.0.0.1:<cdpPort>/devtools/...` upgrade through the external
 * forward proxy, which returns 502 because nothing on the proxy listens for
 * the loopback CDP port. The bypass restores direct loopback delivery for
 * the duration the caller holds the returned `unregister` callback.
 *
 * Loopback-gated by structure: non-loopback authorities (e.g. an `attachOnly`
 * profile pointing at a remote CDP service like Browserless/Browserbase) are
 * not bypassed and continue to traverse the external proxy as configured.
 *
 * Honors `proxy.loopbackMode`:
 * - `gateway-only` (default): register the bypass.
 * - `proxy`: do not bypass — operator opted into proxy-everything routing.
 * - `block`: throw — operator forbids loopback IPC under managed proxy.
 *
 * Note: A loopback `attachOnly` profile whose `cdpUrl` is e.g.
 * `http://127.0.0.1:<port>` would also satisfy this gate. This mirrors the
 * structural semantics of `registerManagedProxyGatewayLoopbackBypass` —
 * loopback IPC on this host is assumed to be operator-trusted.
 */
export declare function registerManagedProxyBrowserCdpBypass(url: string): (() => void) | undefined;
