/**
 * JWT Utility Module
 *
 * Provides JWT token generation and verification utilities.
 */

import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

// ── Configuration ────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "mineecho-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d"; // 7 days

// ── Types ────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  email: string;
  accountId?: string;
  iat?: number;  // Issued at
  exp?: number;  // Expiration
}

// ── Token Generation ─────────────────────────────────────────────────────────

/**
 * Generate a JWT token for a user
 * @param payload - User data to include in the token
 * @returns Signed JWT token string
 */
export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (err) {
    logger.error("[JWT] Failed to sign token:", err);
    throw new Error("Failed to generate token");
  }
}

// ── Token Verification ────────────────────────────────────────────────────────

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload if valid, throws error if invalid
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (err) {
    const error = err as Error & { name?: string };
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    logger.error("[JWT] Token verification failed:", err);
    throw new Error("Token verification failed");
  }
}

// ── Token Extraction ─────────────────────────────────────────────────────────

/**
 * Extract JWT token from Authorization header
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Token string if found, null otherwise
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  const token = parts[1].trim();
  if (!token) {
    return null;
  }

  return token;
}

// ── Token Parsing (without verification) ────────────────────────────────────

/**
 * Decode token without verification (for debugging/logging)
 * @param token - JWT token to decode
 * @returns Decoded payload or null if invalid format
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// ── Token Expiry Check ──────────────────────────────────────────────────────

/**
 * Check if a token is expired (without verification)
 * @param token - JWT token to check
 * @returns true if expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload & { exp?: number };
    if (!decoded || !decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
