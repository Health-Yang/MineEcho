/**
 * 从对外输出（响应、日志）中脱敏，避免 gateway token 等敏感信息泄露。
 * 移除形如 32+ 位十六进制 token 的片段。
 */
export function redactSecrets(msg: string): string {
  if (typeof msg !== "string") return String(msg);
  return msg
    .replace(/\bsk-cp-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]")
    .replace(/[a-fA-F0-9]{32,}/g, "[REDACTED]");
}
