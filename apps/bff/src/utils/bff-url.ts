export const DEFAULT_BFF_PORT = 3085;

type EnvLike = { BFF_PORT?: string };

export function getBffPort(env: EnvLike = process.env): number {
  const parsed = Number(env.BFF_PORT);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_BFF_PORT;
  }
  return parsed;
}

export function getBffBaseUrl(env: EnvLike = process.env): string {
  return `http://127.0.0.1:${getBffPort(env)}`;
}

export function getLocalBffUrl(path: string, env: EnvLike = process.env): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBffBaseUrl(env)}${normalizedPath}`;
}
