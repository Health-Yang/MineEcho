import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getMineEchoHome } from './config-path.js';

const USER_ID_FILE = '.user-id';

function generateUserId(): string {
  return `mineecho-${randomBytes(16).toString('hex')}`;
}

export async function getOrCreateUserId(): Promise<string> {
  const home = getMineEchoHome();
  const path = join(home, USER_ID_FILE);
  if (existsSync(path)) {
    return (await readFile(path, 'utf8')).trim();
  }
  const userId = generateUserId();
  await writeFile(path, userId, 'utf8');
  return userId;
}

export function getUserIdFromRequest(req: any): string {
  const headerId = req.headers['x-user-id'];
  if (headerId && typeof headerId === 'string') return headerId;
  return 'anonymous';
}

export async function isValidUserId(req: any): Promise<boolean> {
  // Desktop mode (localhost): always valid
  const clientIp = req.ip || req.socket?.remoteAddress || '';
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
    return true;
  }
  // Network mode: validate against stored user-id
  if (process.env.MINECHO_REQUIRE_AUTH !== 'true') {
    return true;
  }
  const storedId = await getOrCreateUserId();
  const headerId = req.headers['x-user-id'];
  return headerId === storedId;
}
