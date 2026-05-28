/**
 * JWT Verifier for BFF (L3)
 * Verifies L1-issued JWT tokens using L1's public key
 */

import jwt from 'jsonwebtoken';

let cachedPublicKey: string | null = null;
const L1_URL = process.env.L1_URL || process.env.SKILL_REPO_URL || 'http://127.0.0.1:3081';

/**
 * Preload public key at startup
 */
export async function preloadPublicKey(): Promise<void> {
  await fetchL1PublicKey();
}

/**
 * Fetch public key from L1
 */
export async function fetchL1PublicKey(): Promise<string | null> {
  try {
    const response = await fetch(`${L1_URL}/.well-known/jwt-public-key.pem`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      throw new Error(`L1 returned ${response.status}`);
    }
    const pem = await response.text();
    cachedPublicKey = pem;
    return pem;
  } catch (err: any) {
    console.error('[jwtVerifier] Failed to fetch L1 public key:', err.message);
    return cachedPublicKey;
  }
}

/**
 * Verify a JWT token signed by L1
 */
export function verifyL1Token(token: string): jwt.JwtPayload | null {
  if (!cachedPublicKey) {
    console.error('[jwtVerifier] No public key available');
    return null;
  }
  try {
    const payload = jwt.verify(token, cachedPublicKey, {
      algorithms: ['RS256'],
      clockTolerance: 60,
    }) as jwt.JwtPayload;
    return payload;
  } catch (err: any) {
    console.error('[jwtVerifier] JWT verification failed:', err.message);
    return null;
  }
}

/**
 * JWT Authentication Middleware
 */
export function jwtAuthMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
  }

  const token = auth.slice(7);
  const payload = verifyL1Token(token);

  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }

  req.user = {
    id: (payload.id || payload.sub) as string,
    username: payload.username as string,
    role: payload.role as string,
  };
  req.token = token;
  next();
}

/**
 * Optional JWT middleware - attaches user if token is present, but doesn't reject
 */
export function optionalJwtAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    const payload = verifyL1Token(token);
    if (payload) {
      req.user = {
        id: (payload.id || payload.sub) as string,
        username: payload.username as string,
        role: payload.role as string,
      };
    }
  }
  next();
}
