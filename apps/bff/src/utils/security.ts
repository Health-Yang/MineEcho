/**
 * Security utilities: audit logging, external AI controls, rate limiting
 */

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Request } from "express";
import { logger } from "./logger.js";
import { getMineEchoHome } from "./config-path.js";

export interface AuditLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  type: "ai-app-invoke" | "gateway-request" | "skill-install" | "config-change";
  sourceIp?: string;
  userAgent?: string;
  details: {
    action: string;
    appId?: string;
    endpoint?: string;
    status?: string;
    error?: string;
    [key: string]: unknown;
  };
}

/**
 * Check if external AI applications are disabled
 * Set MINECHO_AI_APPS_DISABLED=true to disable all external AI app calls
 */
export function isExternalAiDisabled(): boolean {
  return process.env.MINECHO_AI_APPS_DISABLED === "true";
}

/**
 * Check if an AI app endpoint is in the allowed whitelist
 */
export function isAiAppEndpointAllowed(endpoint: string): boolean {
  const allowedEndpoints = (process.env.MINECHO_AI_APP_ALLOWED_ENDPOINTS || "")
    .split(",")
    .map(e => e.trim())
    .filter(Boolean);

  // If no whitelist configured, allow all (backward compatible)
  if (allowedEndpoints.length === 0) return true;

  // Check if endpoint starts with any allowed prefix
  return allowedEndpoints.some(allowed => endpoint.startsWith(allowed));
}

/**
 * Write audit log entry
 */
export function writeAuditLog(entry: AuditLogEntry): void {
  const logDir = process.env.MINECHO_AUDIT_LOG_DIR || join(getMineEchoHome(), "logs");

  if (!existsSync(logDir)) {
    try {
      mkdirSync(logDir, { recursive: true });
    } catch (_) {
      logger.warn("[Security] Failed to create audit log directory:", { dir: logDir });
      return;
    }
  }

  const date = new Date().toISOString().split("T")[0];
  const logFile = join(logDir, `audit-${date}.log`);

  const logLine = JSON.stringify(entry) + "\n";

  try {
    writeFileSync(logFile, logLine, { flag: "a" });
  } catch (e) {
    logger.warn("[Security] Failed to write audit log:", { error: e });
  }
}

/**
 * Sanitize log entry to remove sensitive data
 */
export function sanitizeAuditDetails<T extends Record<string, unknown>>(details: T): T {
  const sanitized = { ...details } as Record<string, unknown>;
  const sensitiveKeys = ["apiKey", "token", "password", "secret", "auth"];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized as T;
}

/**
 * Create middleware to check if external AI is disabled
 */
export function externalAiCheckMiddleware(req: unknown, res: { status: (code: number) => { json: (body: object) => void }; json: (body: object) => void }, next: () => void): void {
  if (isExternalAiDisabled()) {
    res.status(403).json({
      error: "External AI applications are disabled by security policy",
      code: "AI_APPS_DISABLED"
    });
    return;
  }
  next();
}

/**
 * Log AI application invocation
 */
export function logAiAppInvocation(
  appId: string,
  endpoint: string,
  status: "success" | "error",
  error?: string,
  req?: { ip?: string; headers?: Record<string, string | string[] | undefined> }
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    level: status === "error" ? "error" : "info",
    type: "ai-app-invoke",
    sourceIp: req?.ip,
    userAgent: typeof req?.headers?.["user-agent"] === "string" ? req.headers["user-agent"] : undefined,
    details: sanitizeAuditDetails({
      action: "invoke_ai_app",
      appId,
      endpoint: endpoint.replace(/\?.*$/, ""), // Remove query params
      status,
      ...(error && { error })
    })
  };

  writeAuditLog(entry);
}

// ===== Rate Limiting =====

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: { ip?: string; path?: string; headers?: Record<string, string | string[] | undefined>; user?: { id?: string } }) => string;
  skipSuccessfulRequests?: boolean;
  skipPaths?: (string | RegExp)[];
  global?: boolean;
}

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-backed rate limiting
 */
function getClientIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const ips = forwarded.split(',').map(s => s.trim());
    return ips[ips.length - 1] || req.ip || 'unknown';
  }
  return req.ip || 'unknown';
}

export function createRateLimiter(options: RateLimitOptions) {
  const windowMs = options.windowMs || 60000; // Default 1 minute
  const maxRequests = options.maxRequests || 100; // Default 100 requests per window

  return function rateLimitMiddleware(
    req: { ip?: string; path?: string; method?: string; headers?: Record<string, string | string[] | undefined>; user?: { id?: string } },
    res: { status: (code: number) => { json: (body: object) => void }; setHeader: (name: string, value: string) => void },
    next: () => void
  ): void {
    // Skip rate limiting for health checks and configured paths
    if (req.path === "/api/health") {
      next();
      return;
    }
    if (options.skipPaths?.some((p) => (typeof p === "string" ? req.path === p : p.test(req.path || "")))) {
      next();
      return;
    }

    const clientIp = getClientIp(req);
    const userId = req.user?.id;
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : options.global
        ? (userId ? `global:user:${userId}` : `global:ip:${clientIp}`)
        : (userId ? `user:${userId}:${req.path || "global"}` : `ip:${clientIp}:${req.path || "global"}`);

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      rateLimitStore.delete(key);
    }

    const currentEntry = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

    // Check if limit exceeded
    if (currentEntry.count >= maxRequests) {
      const retryAfter = Math.ceil((currentEntry.resetTime - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({
        error: "Too many requests, please try again later",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter
      });
      return;
    }

    // Increment count
    currentEntry.count++;
    rateLimitStore.set(key, currentEntry);

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, maxRequests - currentEntry.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(currentEntry.resetTime / 1000)));

    next();
  };
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Create a global rate limiter (per IP/user, not per path) for expensive endpoints.
 * This limits the total number of requests across all paths for a given client.
 */
export function createGlobalRateLimiter(options: Omit<RateLimitOptions, 'global'>) {
  return createRateLimiter({ ...options, global: true });
}
