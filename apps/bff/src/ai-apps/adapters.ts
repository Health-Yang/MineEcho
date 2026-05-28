import type { AiApp, AiAppConfig } from "./store.js";

function getNested(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function extractContentFromResponse(data: unknown, path?: string): string {
  if (path) {
    const v = getNested(data, path);
    if (typeof v === "string") return v;
    if (v != null) return String(v);
  }
  const o = data as Record<string, unknown>;
  if (typeof o.answer === "string") return o.answer;
  if (typeof o.content === "string") return o.content;
  if (typeof o.text === "string") return o.text;
  if (typeof o.data === "string") return o.data;
  if (o.data && typeof (o.data as Record<string, unknown>).content === "string") return (o.data as { content: string }).content;
  const choices = o.choices as Array<{ message?: { content?: string } }> | undefined;
  if (Array.isArray(choices) && choices[0]?.message?.content) return choices[0].message.content;
  return "";
}

export function formatAiAppHttpError(status: number, raw: string): string {
  let message = raw.slice(0, 200);
  let statusText = "";
  let code: unknown;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    message = typeof data.message === "string" ? data.message : message;
    statusText = typeof data.statusText === "string" ? data.statusText : "";
    code = data.code;
  } catch {
    message = raw.slice(0, 200);
  }

  const combined = `${code ?? ""} ${statusText} ${message}`.toLowerCase();
  if (combined.includes("aipointsnotenough") || combined.includes("ai_points_not_enough") || code === 500004) {
    return "FastGPT 点数不足：请检查应用所属团队的 AI Points / 余额，充值或更换可用 API Key 后重试。";
  }

  return `HTTP ${status}: ${message}`;
}

/** FastGPT/OpenAI 风格：若只填了 base（如 https://xxx/api），自动补全 /v1/chat/completions */
function resolveChatEndpoint(endpoint: string, requestStyle: string | undefined): string {
  if (requestStyle !== "messages") return endpoint;
  const u = endpoint.trim().replace(/\/+$/, "");
  if (/\/v1\/chat\/completions$/i.test(u) || /\/chat\/completions$/i.test(u)) return u;
  return (u.endsWith("/") ? u.slice(0, -1) : u) + "/v1/chat/completions";
}

const DEFAULT_AI_APP_MAX_TOKENS = 65536;
const MIN_AI_APP_MAX_TOKENS = 512;
const MAX_AI_APP_MAX_TOKENS = 131072;
const DEFAULT_AI_APP_TIMEOUT_MS = 120000;
const MIN_AI_APP_TIMEOUT_MS = 5000;
const MAX_AI_APP_TIMEOUT_MS = 600000;

function normalizeAiAppMaxTokens(value: unknown): number | undefined {
  const configured = Number(value);
  if (!Number.isFinite(configured) || configured < MIN_AI_APP_MAX_TOKENS) return undefined;
  return Math.min(Math.floor(configured), MAX_AI_APP_MAX_TOKENS);
}

function getAiAppMaxTokens(config: AiAppConfig): number {
  return (
    normalizeAiAppMaxTokens(config.maxTokens) ??
    normalizeAiAppMaxTokens(process.env.MINEECHO_AI_APP_MAX_TOKENS) ??
    DEFAULT_AI_APP_MAX_TOKENS
  );
}

export function buildRequestBody(input: string, config: AiAppConfig): string {
  if (config.requestStyle === "messages") {
    return JSON.stringify({
      messages: [{ role: "user" as const, content: input }],
      stream: false,
      max_tokens: getAiAppMaxTokens(config),
    });
  }
  const queryKey = config.queryKey || "query";
  return JSON.stringify({ [queryKey]: input });
}

export function buildStreamingRequestBody(input: string, config: AiAppConfig): string {
  if (config.requestStyle !== "messages") return buildRequestBody(input, config);
  return JSON.stringify({
    messages: [{ role: "user" as const, content: input }],
    stream: true,
    max_tokens: getAiAppMaxTokens(config),
  });
}

export function extractDeltaFromStreamChunk(rawChunk: string): string {
  const trimmed = rawChunk.trim();
  if (!trimmed || trimmed === "[DONE]") return "";
  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;
    const choices = data.choices as Array<{ delta?: { content?: string }; message?: { content?: string }; text?: string }> | undefined;
    if (Array.isArray(choices)) {
      const first = choices[0];
      if (typeof first?.delta?.content === "string") return first.delta.content;
      if (typeof first?.message?.content === "string") return first.message.content;
      if (typeof first?.text === "string") return first.text;
    }
    const content = extractContentFromResponse(data);
    return content || "";
  } catch {
    return "";
  }
}

function getAiAppTimeoutMs(): number {
  const configured = Number(process.env.MINEECHO_AI_APP_TIMEOUT_MS);
  if (Number.isFinite(configured) && configured >= MIN_AI_APP_TIMEOUT_MS) return Math.min(configured, MAX_AI_APP_TIMEOUT_MS);
  return DEFAULT_AI_APP_TIMEOUT_MS;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = getAiAppTimeoutMs()): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error(`外部 AI 应用超过 ${Math.round(timeoutMs / 1000)} 秒仍未返回结果。路由已命中，请检查外部应用接口、模型生成耗时、知识库检索速度，或适当降低该应用的最大输出 Token。`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function invokeRag(query: string, config: AiAppConfig): Promise<{ content: string; error?: string }> {
  const url = resolveChatEndpoint(config.endpoint, config.requestStyle);
  const method = (config.method || "POST").toUpperCase();
  const body = buildRequestBody(query, config);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
  try {
    const res = await fetchWithTimeout(url, { method, headers, body });
    const raw = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      const preview = raw.slice(0, 80).replace(/\s+/g, " ").trim();
      if (preview.length > 0 && !raw.trimStart().startsWith("<")) {
        return { content: raw.trim() };
      }
      return {
        content: "",
        error: `接口返回的不是 JSON（可能返回了 HTML 或纯文本）。预览: ${preview || "(空)"}…`,
      };
    }
    const content = extractContentFromResponse(data, config.responseContentPath);
    if (!content && !res.ok) return { content: "", error: formatAiAppHttpError(res.status, raw) };
    return { content };
  } catch (e) {
    return { content: "", error: (e as Error).message };
  }
}

export async function invokeWorkflow(input: string, config: AiAppConfig): Promise<{ content: string; error?: string }> {
  const url = resolveChatEndpoint(config.endpoint, config.requestStyle);
  const method = (config.method || "POST").toUpperCase();
  const body = buildRequestBody(input, config);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;
  try {
    const res = await fetchWithTimeout(url, { method, headers, body });
    const raw = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      const preview = raw.slice(0, 80).replace(/\s+/g, " ").trim();
      if (preview.length > 0 && !raw.trimStart().startsWith("<")) {
        return { content: raw.trim() };
      }
      return {
        content: "",
        error: `接口返回的不是 JSON（可能返回了 HTML 或纯文本）。预览: ${preview || "(空)"}…`,
      };
    }
    const content = extractContentFromResponse(data, config.responseContentPath);
    if (!content && !res.ok) return { content: "", error: formatAiAppHttpError(res.status, raw) };
    return { content };
  } catch (e) {
    return { content: "", error: (e as Error).message };
  }
}

export async function invokeApp(app: AiApp, userMessage: string): Promise<{ content: string; error?: string }> {
  if (app.type === "rag") return invokeRag(userMessage, app.config);
  if (app.type === "workflow") return invokeWorkflow(userMessage, app.config);
  return { content: "", error: "Unknown app type" };
}

export async function invokeAppStream(
  app: AiApp,
  userMessage: string,
  onDelta: (delta: string) => void
): Promise<{ content: string; error?: string; streamed: boolean }> {
  const config = app.config;
  if (config.requestStyle !== "messages") {
    const result = await invokeApp(app, userMessage);
    if (result.content) onDelta(result.content);
    return { ...result, streamed: false };
  }

  const url = resolveChatEndpoint(config.endpoint, config.requestStyle);
  const method = (config.method || "POST").toUpperCase();
  const body = buildStreamingRequestBody(userMessage, config);
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "text/event-stream" };
  if (config.apiKey) headers["Authorization"] = `Bearer ${config.apiKey}`;

  try {
    const res = await fetchWithTimeout(url, { method, headers, body });
    if (!res.ok) {
      const raw = await res.text();
      return { content: "", error: formatAiAppHttpError(res.status, raw), streamed: false };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!res.body || !/text\/event-stream|stream/i.test(contentType)) {
      const raw = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        const content = raw.trim();
        if (content) onDelta(content);
        return { content, streamed: false };
      }
      const content = extractContentFromResponse(data, config.responseContentPath);
      if (content) onDelta(content);
      return { content, streamed: false };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const dataLines = event
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());

        for (const dataLine of dataLines) {
          const delta = extractDeltaFromStreamChunk(dataLine);
          if (!delta) continue;
          fullContent += delta;
          onDelta(delta);
        }
      }
    }

    const tail = buffer.trim();
    if (tail) {
      const dataLines = tail
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim());
      for (const dataLine of dataLines) {
        const delta = extractDeltaFromStreamChunk(dataLine);
        if (!delta) continue;
        fullContent += delta;
        onDelta(delta);
      }
    }

    return { content: fullContent, streamed: true };
  } catch (e) {
    return { content: "", error: (e as Error).message, streamed: false };
  }
}
