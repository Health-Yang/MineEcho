export type MainTabKey =
  | "chat"
  | "skills"
  | "knowledge"
  | "memory"
  | "meeting"
  | "cron"
  | "config";

export function getMainTabFromPath(pathname: string): MainTabKey {
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/skills")) return "skills";
  if (pathname.startsWith("/knowledge")) return "knowledge";
  if (pathname.startsWith("/memory")) return "memory";
  if (pathname.startsWith("/calendar")) return "meeting";
  if (pathname.startsWith("/meeting")) return "meeting";
  if (pathname.startsWith("/cron")) return "cron";
  if (pathname.startsWith("/config") || pathname.startsWith("/settings") || pathname.startsWith("/init")) {
    return "config";
  }
  return "chat";
}
