import type { GatewayAuthMode, GatewayTailscaleMode } from "../config/types.gateway.js";
export declare function isUnsafeGatewayTailscaleNoAuth(params: {
    authMode?: GatewayAuthMode;
    tailscaleMode?: GatewayTailscaleMode;
}): boolean;
export declare function formatUnsafeGatewayTailscaleNoAuthMessage(tailscaleMode: GatewayTailscaleMode): string;
