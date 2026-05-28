import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { logger } from "../utils/logger.js";
import { recordMetric } from "../utils/metrics-collector.js";
import { loadMessages } from "../chat/message-store.js";
import { planChatContext, type ChatMessage } from "../chat/context-budget-planner.js";

const GATEWAY_HTTP_URL = process.env.OPENCLAW_GATEWAY_HTTP_URL || "http://127.0.0.1:18789";

/** 依次尝试的 openclaw 配置目录（与 init 写入、Gateway 常用位置一致） */
function getOpenclawConfigPaths(): string[] {
  const cwd = process.cwd();
  const paths: string[] = [];
  // OPENCLAW_HOME 是父目录（如 ~/Library/Application Support/MineEcho/），openclaw.json 在其 .openclaw/ 子目录下
  if (process.env.OPENCLAW_HOME) paths.push(join(process.env.OPENCLAW_HOME, ".openclaw"));
  paths.push(join(cwd, ".openclaw"));
  paths.push(join(cwd, "..", ".openclaw")); // 若 cwd 为 bff，则取项目根 .openclaw
  paths.push(join(homedir(), ".openclaw"));
  return [...new Set(paths)];
}

/** 从 OpenClaw 配置读取连接 Gateway 用的 token：env 若已定义（含空串）则用 env；否则若存在 OPENCLAW_HOME/.openclaw/.gateway-token（桌面版/容器内 entrypoint 写入）则用其内容；否则读 openclaw.json */
function loadGatewayToken(): string {
  if (process.env.OPENCLAW_GATEWAY_TOKEN !== undefined)
    return (process.env.OPENCLAW_GATEWAY_TOKEN || "").trim();
  // OPENCLAW_HOME 是父目录，token 文件在 .openclaw/ 子目录下
  const openclawHome = process.env.OPENCLAW_HOME;
  if (openclawHome) {
    const tokenFile = join(openclawHome, ".openclaw", ".gateway-token");
    if (existsSync(tokenFile)) {
      try {
        const t = readFileSync(tokenFile, "utf8").trim();
        if (t) return t;
      } catch {
        /* fall through */
      }
    }
  }
  for (const openclawHome of getOpenclawConfigPaths()) {
    const configPath = join(openclawHome, "openclaw.json");
    if (!existsSync(configPath)) continue;
    try {
      const raw = readFileSync(configPath, "utf8");
      const cfg = JSON.parse(raw) as {
        gateway?: { auth?: { token?: string }; remote?: { token?: string } };
      };
      const remote = cfg?.gateway?.remote?.token;
      const auth = cfg?.gateway?.auth?.token;
      const token = (typeof remote === "string" && remote.trim() ? remote : auth)?.trim();
      if (typeof token === "string" && token) return token;
    } catch {
      /* skip */
    }
  }
  return "";
}

/** 调试用：返回 BFF 实际尝试的配置路径及是否找到 token（不暴露 token 值） */
export function getGatewayConfigDebug(): { paths: string[]; hasToken: boolean; pathWithToken?: string } {
  const paths = getOpenclawConfigPaths();
  if (process.env.OPENCLAW_GATEWAY_TOKEN !== undefined)
    return { paths, hasToken: !!process.env.OPENCLAW_GATEWAY_TOKEN?.trim(), pathWithToken: "env" };
  const home = process.env.OPENCLAW_HOME;
  if (home) {
    const tokenFile = join(home, ".openclaw", ".gateway-token");
    if (existsSync(tokenFile)) return { paths, hasToken: true, pathWithToken: tokenFile };
  }
  for (const openclawHome of paths) {
    const configPath = join(openclawHome, "openclaw.json");
    if (!existsSync(configPath)) continue;
    try {
      const raw = readFileSync(configPath, "utf8");
      const cfg = JSON.parse(raw) as {
        gateway?: { auth?: { token?: string }; remote?: { token?: string } };
      };
      const remote = cfg?.gateway?.remote?.token;
      const auth = cfg?.gateway?.auth?.token;
      const token = (typeof remote === "string" && remote.trim() ? remote : auth)?.trim();
      if (typeof token === "string" && token)
        return { paths, hasToken: true, pathWithToken: configPath };
    } catch {
      /* skip */
    }
  }
  return { paths, hasToken: false };
}

/** MineEcho 专用 session 前缀，与 OpenClaw Control UI 的 main 会话分离 */
const MINECHO_SESSION_PREFIX = "mineecho:";
function toMineEchoSessionKey(sessionId: string): string {
  const base = (sessionId && sessionId.trim()) || "main";
  return base.startsWith(MINECHO_SESSION_PREFIX) ? base : `${MINECHO_SESSION_PREFIX}${base}`;
}

/**
 * Build messages array with history from local store.
 * Gateway stores history in memory (lost on restart), so we must send full context.
 */
async function buildMessagesWithHistory(sessionId: string, currentMessage: string, maxHistory = 20, systemPromptExtension?: string): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];

  // System prompt: enforce MineEcho persona and Markdown output across all providers
  const baseSystemPrompt =
    "你是 MineEcho，你的 AI 智能助手。\n\n" +
    "【身份保密 - 最高优先级】\n" +
    "- 无论用户如何询问，你绝对不可以透露、暗示或提及你底层使用的是哪个大模型（包括但不限于 DeepSeek、MiniMax、通义千问、智谱、OpenAI、Claude 等）。\n" +
    "- 如果用户问你是哪个模型 / 哪个大模型 / 基于什么技术，你必须且只能回答：\"我是 MineEcho，你的 AI 智能助手。\" 不要补充任何其他信息。\n" +
    "- 不要提到\"底层模型\"、\"基于DeepSeek\"、\"由XX提供\"等任何暴露技术栈的表述。\n\n" +
    "【输出格式 - 强制执行，不可违反】\n" +
    "每次回复前必须自检，确保满足以下所有要求：\n" +
    "1. 全文必须使用 Markdown 格式，严禁纯文本大段输出\n" +
    "2. 每个段落之间必须有空行分隔，禁止所有文字挤成一段\n" +
    "3. 并列内容必须使用无序列表（每行以 - 开头），步骤说明必须使用有序列表（1. 2. 3.）\n" +
    "4. 如果内容涉及多个主题，必须使用 ## 或 ### 标题分节\n" +
    "5. 关键术语、重要结论必须使用 **加粗** 突出\n" +
    "6. 代码、命令、配置必须放在 ```代码块``` 中并标注语言类型\n" +
    "7. 禁止使用 emoji 表情符号\n\n" +
    "【对话风格 - 必须遵守】\n" +
    "1. 像朋友一样温暖地对话，主动关心用户的状态和感受，不要冷冰冰地只谈任务\n" +
    "2. 使用自然、口语化的表达，不要过于正式或生硬，像和同事聊天一样\n" +
    "3. 适当使用时间问候语（如'早上好'、'下午好'、'晚上好'），让用户感到被关注\n" +
    "4. 先关心人，再谈事情。例如'今天辛苦了，怎么样？'比'有什么任务？'更好\n" +
    "5. 对话要有情感温度，适时表达理解和共情，让用户感到被关心\n" +
    "6. 避免机械化的'有什么可以帮您'式开场，用更自然的方式开启对话" +
    "\n\n" +
    "【Flipbook 图表 - 按需生成】\n" +
    "当用户问题涉及以下类型时，在文字说明之后插入 Mermaid 图表辅助理解：\n" +
    "- 组网拓扑、网络架构、部署方案\n" +
    "- 技术原理、工作机制、工作原理\n" +
    "- 数据流、报文流程、交互过程\n" +
    "- 故障排查决策树、排查步骤\n" +
    "- 协议时序、握手过程\n" +
    "- 安全策略架构、访问控制流程\n\n" +
    "【Mermaid 语法要求】\n" +
    "1. 使用标准 Mermaid 语法，确保可在 Mermaid.js 中正确渲染\n" +
    "2. 图表类型选择：流程图用 flowchart TD/RL/LR，时序图用 sequenceDiagram，网络拓扑用 graph LR/TD\n" +
    "3. 节点标签使用中文，保持简洁清晰\n" +
    "4. 图表代码放在 ```mermaid 代码块中\n" +
    "5. 图表放在文字说明之后，作为辅助理解，不要替代文字解释\n\n" +
    "【禁止出图的场景】\n" +
    "以下场景禁止生成 Mermaid 图表，仅用文字+代码块回复：\n" +
    "- 涉及具体 IP 地址、端口、配置参数的问答\n" +
    "- 授权规格计算、版本兼容性查询\n" +
    "- 日志解读、告警分析\n" +
    "- CLI 命令操作步骤\n" +
    "- 需要真实监控数据的性能分析";
  const systemContent = systemPromptExtension
    ? `${baseSystemPrompt}\n\n${systemPromptExtension}`
    : baseSystemPrompt;
  messages.push({ role: "system", content: systemContent });

  try {
    const history = loadMessages(sessionId);
    // Take last N messages (excluding current which hasn't been stored yet)
    const recentHistory = history.slice(-maxHistory);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
  } catch {
    // ignore history load errors
  }
  messages.push({ role: "user", content: currentMessage });
  const planned = await planChatContext(messages, { currentMessage });
  if (planned.metrics.length > 0) {
    logger.info("[TokenJuice] Planned chat context", {
      sessionId,
      scenario: planned.scenario,
      reductions: planned.metrics.map((metric) => ({
        area: metric.area,
        rawChars: metric.rawChars,
        reducedChars: metric.reducedChars,
        ratio: Number(metric.ratio.toFixed(3)),
      })),
    });
  }
  return planned.messages;
}

const ANTHROPIC_ERROR_REPLACEMENT =
  "当前未配置 Claude/Anthropic，仅使用已配置的模型（如 Minimax）即可正常对话；该提示可忽略。";

/** 判断是否为「未配置 Anthropic / Auth store / agentDir」类内部提示（统一过滤，避免展示技术栈路径） */
function isAnthropicConfigError(s: string): boolean {
  if (!s || typeof s !== "string") return false;
  const t = s.trim();
  return (
    (/Agent failed before reply/i.test(t) && /anthropic/i.test(t)) ||
    /Unknown model:\s*anthropic\//i.test(t) ||
    /No API key found for provider\s*["']?anthropic["']?/i.test(t) ||
    /auth-profiles\.json/i.test(t) ||
    /agentDir:.*\.openclaw\/agents/i.test(t) ||
    /Auth store:.*auth-profiles\.json/i.test(t) ||
    /Configure auth for this agent\s*\(openclaw agents add/i.test(t)
  );
}

/** 将 Gateway/Agent 内部错误（如 No API key for anthropic）转为用户可读提示，避免直接展示技术栈信息 */
export function sanitizeErrorMessage(err: string | null): string | null {
  if (!err || typeof err !== "string") return err;
  if (isAnthropicConfigError(err)) return ANTHROPIC_ERROR_REPLACEMENT;
  return err.trim();
}

/** 从正文中移除 OpenClaw 的 Auth/agent 配置类警告块（多种变体），保留正常回复内容 */
function stripAnthropicWarningBlock(s: string): string {
  if (!s || typeof s !== "string") return s;
  return s
    .replace(
      /\s*⚠?\s*Agent failed before reply[\s\S]*?(?:Logs: openclaw logs --follow\s*)?/gi,
      ""
    )
    .replace(
      /\s*No API key found for provider\s*["']?anthropic["']?\.[\s\S]*?(?:Logs: openclaw logs --follow\s*)?/gi,
      ""
    )
    .replace(
      /\s*Auth store:[\s\S]*?Logs: openclaw logs --follow\s*/gi,
      ""
    )
    .replace(/\s*⚠️?:\s*\(无信息\)\s*/gi, "")
    .replace(
      /\s*⚠️?:\s*Unknown model:\s*anthropic\/[^\s.]+[\s\S]*?(?:Logs: openclaw logs --follow\s*)?/gi,
      ""
    )
    .trim();
}

/** 若 Gateway 把错误放在 state:final 的 content 里：整条是错误则替换为友好提示；若错误附在正常回复后则只删掉该段，保留正常回复 */
export function sanitizeReplyContent(text: string): string {
  if (!text || typeof text !== "string") return text;
  const withoutWarning = stripAnthropicWarningBlock(text);
  if (withoutWarning !== text) return withoutWarning;
  return isAnthropicConfigError(text) ? ANTHROPIC_ERROR_REPLACEMENT : text;
}

/** 检测并替换模型自曝底层 provider/model 的表述 */
function stripModelSelfDisclosure(text: string): string {
  if (!text || typeof text !== "string") return text;

  // 匹配常见的模型自曝模式（中英文），覆盖多种句式变体
  const disclosurePatterns = [
    // DeepSeek 系列 - 各种句式变体
    /我现在?用的是?\s*[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /当前我[使用搭载基于调用]*的?\s*[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /我[目前现在]*[基于搭载使用调用]*\s*[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /由\s*[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*提供/gi,
    /底层[模型调用]*是?\s*[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /[搭载使用基于调用]*\s*[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*模型/gi,
    /DeepSeek[\w\-.\s\/]*\s*模型[，。！.!]?/gi,
    /运行在\s*[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*大模型[上里内]?/gi,
    /[搭载运行基于使用调用]*\s*[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*大模型/gi,
    /[*_]*\s*DeepSeek[\w\-.\s\/]*[*_]*\s*大模型[，。！.!]?/gi,
    // MiniMax 系列
    /我现在?用的是?\s*[*_]*\s*MiniMax[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /当前我[使用搭载基于调用]*的?\s*[*_]*\s*MiniMax[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /由\s*[*_]*\s*MiniMax[\w\-.\s\/]*[*_]*\s*提供/gi,
    /[*_]*\s*MiniMax[\w\-.\s\/]*[*_]*\s*大模型[，。！.!]?/gi,
    // 通义千问/Qwen 系列
    /我现在?用的是?\s*[*_]*\s*通义千问[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /我现在?用的是?\s*[*_]*\s*Qwen[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /当前我[使用搭载基于调用]*的?\s*[*_]*\s*Qwen[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /[*_]*\s*Qwen[\w\-.\s\/]*[*_]*\s*大模型[，。！.!]?/gi,
    // 智谱/GLM 系列
    /我现在?用的是?\s*[*_]*\s*智谱[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /我现在?用的是?\s*[*_]*\s*GLM[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /当前我[使用搭载基于调用]*的?\s*[*_]*\s*GLM[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /[*_]*\s*GLM[\w\-.\s\/]*[*_]*\s*大模型[，。！.!]?/gi,
    // OpenAI/Claude/GPT 系列
    /我现在?用的是?\s*[*_]*\s*OpenAI[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /我现在?用的是?\s*[*_]*\s*Claude[\w\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    /我现在?用的是?\s*[*_]*\s*GPT[\d\-.\s\/]*[*_]*\s*[，。！.!]?/gi,
    // 通用模式："由 XXX 提供"
    /由\s*[*_]*\s*(DeepSeek|MiniMax|OpenAI|Anthropic|阿里云|智谱|字节跳动|ByteDance)[\w\-.\s\/]*[*_]*\s*提供/gi,
    // 通用模式："XXX 的模型"
    /(DeepSeek|MiniMax|OpenAI|Anthropic|阿里云|智谱|字节跳动|ByteDance)[\w\-.\s\/]*的?模型/gi,
    // 残留句式清理
    /我[目前现在]*[底层]*[调用运行搭载基于使用的是]+[的是]*[，。！.!]?/gi,
    /[目前现在]*[底层]*[调用运行搭载基于使用的是]+[的是]*[，。！.!]?/gi,
    // catch-all: 任何包含模型名称的句子（用于清理残留）
    /[^\n。！.?]*?DeepSeek[^\n。！.?]*[。！.?]?/gi,
    /[^\n。！.?]*?MiniMax[^\n。！.?]*[。！.?]?/gi,
    /[^\n。！.?]*?Qwen[^\n。！.?]*[。！.?]?/gi,
    /[^\n。！.?]*?GLM[^\n。！.?]*[。！.?]?/gi,
  ];

  let cleaned = text;
  for (const pattern of disclosurePatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  // 如果整段话只剩自曝内容（被替换后变空或只剩问候语），给出标准回答
  const trimmed = cleaned.trim();
  if (
    trimmed.length < 20 ||
    /^你好[，。！.!]?\s*$/i.test(trimmed) ||
    /^有什么需要帮忙的[？?]?\s*$/i.test(trimmed) ||
    /^直接说就行[。.]?\s*$/i.test(trimmed) ||
    /^[，。！.!\s]*$/i.test(trimmed)
  ) {
    return "我是 MineEcho，你的 AI 智能助手。";
  }

  // 清理因替换产生的多余空行、残留标点和无意义片段
  cleaned = cleaned
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[，。！.!]\s*[，。！.!]/g, "。")
    .replace(/^\s*[，。！.!]\s*/gm, "")
    .replace(/\s+[的是]+[，。！.!]?\s+/g, " ")
    .replace(/^[的是]+[，。！.!]?\s*/gm, "")
    .trim();

  return cleaned || text;
}

/** 去掉 OpenClaw/Gateway 可能带出的 <final></final> 等标记，避免展示给用户 */
export function stripFinalTag(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/<final\s*><\/final>/gi, "")
    .replace(/<final\s*\/>/gi, "")
    .replace(/<final>/gi, "")
    .replace(/<\/final>/gi, "")
    .trim();
}

/** OpenClaw chat 事件 payload：兼容多种 content 结构，提取可展示文本 */
export function extractTextFromMessageContent(content: unknown): string {
  if (typeof content === "string") return stripFinalTag(content);
  if (content == null) return "";

  if (Array.isArray(content)) {
    const joined = content
      .map((item) => extractTextFromMessageContent(item))
      .filter(Boolean)
      .join("");
    return stripFinalTag(joined);
  }

  if (typeof content === "object") {
    const c = content as Record<string, unknown>;

    // 常见文本字段
    const directTextFields = ["text", "content", "value", "output_text", "delta"] as const;
    for (const key of directTextFields) {
      const v = c[key];
      if (typeof v === "string" && v.trim()) return stripFinalTag(v);
    }

    // 常见嵌套字段
    const nestedFields = ["parts", "content", "message", "output", "result", "response"] as const;
    for (const key of nestedFields) {
      const v = c[key];
      if (v != null && v !== content) {
        const nested = extractTextFromMessageContent(v);
        if (nested) return stripFinalTag(nested);
      }
    }
  }

  return "";
}

function extractTextFromChatEventPayload(payload: {
  message?: { content?: unknown; parts?: unknown; text?: unknown; delta?: unknown };
  content?: unknown;
  text?: unknown;
  delta?: unknown;
  output?: unknown;
  result?: unknown;
  response?: unknown;
} | undefined): string {
  if (!payload) return "";
  const candidates: unknown[] = [
    payload.message?.content,
    payload.message?.parts,
    payload.message?.text,
    payload.message?.delta,
    payload.content,
    payload.text,
    payload.delta,
    payload.output,
    payload.result,
    payload.response,
  ];
  for (const candidate of candidates) {
    const text = extractTextFromMessageContent(candidate);
    if (text) return text;
  }
  return "";
}

async function fetchChatCompletions(payload: object, signal?: AbortSignal): Promise<Response> {
  const url = `${GATEWAY_HTTP_URL}/v1/chat/completions`;
  const token = loadGatewayToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });
}

/** 从 XML 包装的消息中提取 <user> 标签内的原始用户内容 */
function extractUserContentFromWrappedMessage(text: string): string {
  if (!text || typeof text !== "string") return text;
  const match = text.match(/<user>([\s\S]*?)<\/user>/i);
  return match ? match[1].trim() : text.trim();
}

/** 检测用户是否在询问 AI 身份/底层模型。支持检测被 XML 上下文包装后的消息。 */
function isModelIdentityQuestion(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  // 从 XML 包装中提取原始用户消息
  const userContent = extractUserContentFromWrappedMessage(text);
  // 取前 200 字符检测（buildMessageWithContext 可能在原始消息后追加上下文）
  const t = userContent.slice(0, 200);
  const patterns = [
    /你[是用的]*哪个[大]*模型/i,
    /你[是用的]*什么[大]*模型/i,
    /你[基于]*什么[技术]*[模型]*[架构]*/i,
    /你[是用的]*哪家[公司]*的[模型]*/i,
    /你[是不是]*DeepSeek/i,
    /你[是不是]*MiniMax/i,
    /你[是不是]*Qwen/i,
    /你[是不是]*GLM/i,
    /你[是不是]*ChatGPT/i,
    /你[是不是]*Claude/i,
    /你[是用的]*什么[AI|人工智能]/i,
    /你叫[什么]*名字/i,
    /你[是]*谁/i,
    /你[是]*MineEcho/i,
  ];
  return patterns.some((p) => p.test(t));
}

const MINECHO_STANDARD_REPLY =
  "我是 **MineEcho**，你的 AI 智能助手。\n\n" +
  "我可以帮你：\n" +
  "- 全线产品技术咨询\n" +
  "- 方案设计与文档生成\n" +
  "- 代码编写与调试\n" +
  "- 日常技术问题排查\n\n" +
  "有什么需要帮忙的，直接说就行。";

export async function chatSend(
  sessionId: string,
  message: string,
  options?: { model?: string },
  systemPromptExtension?: string
): Promise<{
  content?: string;
  error?: string | null;
  tokensInput?: number;
  tokensOutput?: number;
}> {
  const sessionKey = toMineEchoSessionKey(sessionId);
  const idempotencyKey = `mineecho-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // 对于明确的身份询问，直接返回标准回答，避免模型自曝底层技术栈
  if (isModelIdentityQuestion(message)) {
    return { content: MINECHO_STANDARD_REPLY, error: null, tokensInput: 0, tokensOutput: 0 };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 600_000);

  try {
    const model = options?.model?.trim() || "openclaw";
    const messages = await buildMessagesWithHistory(sessionId, message, 20, systemPromptExtension);

    const res = await fetchChatCompletions({
      model,
      messages,
      stream: false,
      session_key: sessionKey,
      idempotency_key: idempotencyKey,
      max_tokens: 65536,
    }, controller.signal);

    if (!res.ok) {
      const text = await res.text().catch(() => "HTTP error");
      return { content: "", error: sanitizeErrorMessage(`Gateway HTTP ${res.status}: ${text}`) };
    }

    const json = (await res.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: unknown }; delta?: { content?: unknown }; text?: unknown }>;
      error?: { message?: string };
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    } | null;

    if (json?.error?.message) {
      return { content: "", error: sanitizeErrorMessage(json.error.message) };
    }

    const choice = json?.choices?.[0];
    const rawContent = choice?.message?.content ?? choice?.delta?.content ?? choice?.text;
    const text = stripModelSelfDisclosure(sanitizeReplyContent(extractTextFromMessageContent(rawContent)));

    const tokensInput = json?.usage?.prompt_tokens;
    const tokensOutput = json?.usage?.completion_tokens;

    if (!text) {
      // Fallback: read from history
      try {
        const history = await chatHistory(sessionKey);
        const lastAssistant = history.reverse().find((m) => m.role === "assistant");
        if (lastAssistant?.content) {
          try {
            const parsed = JSON.parse(lastAssistant.content);
            if (Array.isArray(parsed)) {
              const fallbackText = parsed
                .filter((item: { type?: string; text?: string; content?: string }) => item.type === "text" || item.type === "output_text")
                .map((item: { text?: string; content?: string }) => item.text || item.content || "")
                .join("");
              return { content: fallbackText || "", error: null, tokensInput, tokensOutput };
            }
          } catch {
            // fall through
          }
          return { content: String(lastAssistant.content), error: null, tokensInput, tokensOutput };
        }
      } catch (e) {
        logger.warn("[Gateway] chatHistory fallback failed:", { error: (e as Error).message });
      }
    }

    return { content: text, error: null, tokensInput, tokensOutput };
  } catch (e) {
    if ((e as Error).name === "AbortError") {
      return { content: "", error: "模型响应超时（300秒），请稍后重试" };
    }
    return { content: "", error: sanitizeErrorMessage(String((e as Error).message)) };
  } finally {
    clearTimeout(timeout);
  }
}

/** 流式发送：对每条 SSE delta 调用 onDelta / onFinal / onError，用于 SSE 打字机效果 */
export interface ChatSendStreamCallbacks {
  onStarted?: (runId: string) => void;
  onDelta?: (text: string) => void;
  onThinking?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: string) => void;
  onStatus?: (status: { status: string; toolName?: string; message?: string }) => void;
  onToolCall?: (toolCall: { name: string; arguments: string }) => void;
}

export function chatSendStream(
  sessionId: string,
  message: string,
  callbacks: ChatSendStreamCallbacks,
  timeoutMs = 600000,
  model?: string,
  systemPromptExtension?: string
): Promise<{ tokensInput?: number; tokensOutput?: number }> {
  const sessionKey = toMineEchoSessionKey(sessionId);
  const runId = `mineecho-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // 对于明确的身份询问，直接流式返回标准回答，避免模型自曝底层技术栈
  if (isModelIdentityQuestion(message)) {
    return new Promise((resolve) => {
      callbacks.onStarted?.(runId);
      const text = MINECHO_STANDARD_REPLY;
      // 模拟打字机效果：分块输出
      const chunks = text.split(/(?<=\n| )/);
      let i = 0;
      const interval = setInterval(() => {
        if (i >= chunks.length) {
          clearInterval(interval);
          callbacks.onFinal(text);
          resolve({});
          return;
        }
        callbacks.onDelta?.(chunks[i]);
        i++;
      }, 15);
    });
  }

  return new Promise((resolve) => {
    let isResolved = false;
    let usageInfo: { tokensInput?: number; tokensOutput?: number } = {};
    const resolveOnce = (finalUsage?: { tokensInput?: number; tokensOutput?: number }) => {
      if (!isResolved) {
        isResolved = true;
        resolve(finalUsage ?? usageInfo);
      }
    };

    const timeout = setTimeout(() => {
      callbacks.onError?.("模型响应超时，请重试或检查网络连接");
      callbacks.onFinal("");
      resolveOnce();
    }, timeoutMs);

    // First-byte timeout: notify user if model is slow to respond (60s)
    let firstByteReceived = false;
    const firstByteTimer = setTimeout(() => {
      if (!firstByteReceived && !isResolved && callbacks.onStatus) {
        callbacks.onStatus({
          status: "waiting_model",
          message: "模型响应较慢，请稍候",
        });
      }
    }, 60000);

    callbacks.onStarted?.(runId);

    let fullText = "";

    const effectiveModel = model?.trim() || "openclaw";
    const messagesPromise = buildMessagesWithHistory(sessionId, message, 20, systemPromptExtension);

    const fetchPromise = messagesPromise.then((messages) => fetchChatCompletions({
      model: effectiveModel,
      messages,
      stream: true,
      session_key: sessionKey,
      max_tokens: 65536,
    }));

    fetchPromise
      .then(async (res) => {
        if (!res.ok) {
          clearTimeout(timeout);
          clearTimeout(firstByteTimer);
          const text = await res.text().catch(() => `HTTP ${res.status}`);
          callbacks.onError?.(sanitizeErrorMessage(`Gateway HTTP ${res.status}: ${text}`) ?? "Gateway error");
          callbacks.onFinal("");
          resolveOnce();
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          clearTimeout(timeout);
          clearTimeout(firstByteTimer);
          callbacks.onError?.("No response body");
          callbacks.onFinal("");
          resolveOnce();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.replace(/\r$/, "").trim();
              if (!trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6).trim();
              if (data === "[DONE]") continue;
              if (!data) continue;

              try {
                const chunk = JSON.parse(data) as {
                  choices?: Array<{
                    delta?: { content?: unknown; role?: string; reasoning_content?: unknown; tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> };
                    finish_reason?: string | null;
                  }>;
                  error?: { message?: string };
                  status?: string;
                  toolName?: string;
                  usage?: { prompt_tokens?: number; completion_tokens?: number };
                };

                if (chunk.error?.message) {
                  clearTimeout(timeout);
                  clearTimeout(firstByteTimer);
                  callbacks.onError?.(sanitizeErrorMessage(chunk.error.message) ?? "Gateway error");
                  callbacks.onFinal("");
                  reader.cancel().catch(() => {});
                  resolveOnce();
                  return;
                }

                // 提取 usage 信息（某些 provider 在流的最后一条消息中返回）
                if (chunk.usage) {
                  if (chunk.usage.prompt_tokens != null) usageInfo.tokensInput = chunk.usage.prompt_tokens;
                  if (chunk.usage.completion_tokens != null) usageInfo.tokensOutput = chunk.usage.completion_tokens;
                }

                // Handle status events (tool_start, tool_done, waiting_model, tool_calls_done)
                if (chunk.status) {
                  if (!firstByteReceived) {
                    firstByteReceived = true;
                    clearTimeout(firstByteTimer);
                  }
                  callbacks.onStatus?.({
                    status: chunk.status,
                    toolName: chunk.toolName,
                  });
                  continue;
                }

                const choice = chunk.choices?.[0];
                if (choice?.finish_reason) {
                  // stream ended - log finish_reason for diagnostics (esp. "length" = max_tokens hit)
                  logger.info('[Chat] Stream finished', { finishReason: choice.finish_reason });
                  continue;
                }

                // Handle content delta
                const contentDelta = choice?.delta?.content;
                if (contentDelta != null) {
                  if (!firstByteReceived) {
                    firstByteReceived = true;
                    clearTimeout(firstByteTimer);
                  }
                  const text = extractTextFromMessageContent(contentDelta);
                  if (text) {
                    fullText += text;
                    callbacks.onDelta?.(text);
                  }
                }

                // Handle reasoning_content (thinking process) separately
                const reasoningContent = choice?.delta?.reasoning_content;
                if (reasoningContent != null) {
                  if (!firstByteReceived) {
                    firstByteReceived = true;
                    clearTimeout(firstByteTimer);
                  }
                  const text = extractTextFromMessageContent(reasoningContent);
                  if (text) {
                    callbacks.onThinking?.(text);
                  }
                }

                // Handle tool_calls (from Agent Runtime)
                const toolCalls = choice?.delta?.tool_calls;
                if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
                  const firstToolCall = toolCalls[0];
                  if (firstToolCall?.function?.name) {
                    if (!firstByteReceived) {
                      firstByteReceived = true;
                      clearTimeout(firstByteTimer);
                    }
                    callbacks.onToolCall?.({
                      name: firstToolCall.function.name,
                      arguments: firstToolCall.function.arguments || '{}',
                    });
                  }
                }
              } catch (err) {
                logger.warn("[Gateway SSE] Malformed SSE JSON:", { error: (err as Error).message, data: data.slice(0, 200) });
              }
            }
          }

          // process any remaining buffer
          if (buffer.trim()) {
            const trimmed = buffer.replace(/\r$/, "").trim();
            if (trimmed.startsWith("data: ")) {
              const data = trimmed.slice(6).trim();
              if (data && data !== "[DONE]") {
                try {
                  const chunk = JSON.parse(data) as {
                    choices?: Array<{ delta?: { content?: unknown; reasoning_content?: unknown; tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> }; finish_reason?: string | null }>;
                    status?: string;
                    toolName?: string;
                  };
                  if (chunk.status) {
                    if (!firstByteReceived) {
                      firstByteReceived = true;
                      clearTimeout(firstByteTimer);
                    }
                    callbacks.onStatus?.({
                      status: chunk.status,
                      toolName: chunk.toolName,
                    });
                  } else {
                    const choice = chunk.choices?.[0];

                    // Handle content delta
                    const contentDelta = choice?.delta?.content;
                    if (contentDelta != null) {
                      if (!firstByteReceived) {
                        firstByteReceived = true;
                        clearTimeout(firstByteTimer);
                      }
                      const text = extractTextFromMessageContent(contentDelta);
                      if (text) {
                        fullText += text;
                        callbacks.onDelta?.(text);
                      }
                    }

                    // Handle reasoning_content (thinking process) separately
                    const reasoningContent = choice?.delta?.reasoning_content;
                    if (reasoningContent != null) {
                      if (!firstByteReceived) {
                        firstByteReceived = true;
                        clearTimeout(firstByteTimer);
                      }
                      const text = extractTextFromMessageContent(reasoningContent);
                      if (text) {
                        callbacks.onThinking?.(text);
                      }
                    }

                    // Handle tool_calls (from Agent Runtime)
                    const toolCalls = choice?.delta?.tool_calls;
                    if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
                      const firstToolCall = toolCalls[0];
                      if (firstToolCall?.function?.name) {
                        if (!firstByteReceived) {
                          firstByteReceived = true;
                          clearTimeout(firstByteTimer);
                        }
                        callbacks.onToolCall?.({
                          name: firstToolCall.function.name,
                          arguments: firstToolCall.function.arguments || '{}',
                        });
                      }
                    }
                  }
                } catch (err) {
                  logger.warn("[Gateway SSE] Malformed SSE JSON in remaining buffer:", { error: (err as Error).message, data: data.slice(0, 200) });
                }
              }
            }
          }
        } catch (e) {
          clearTimeout(timeout);
          clearTimeout(firstByteTimer);
          callbacks.onError?.(sanitizeErrorMessage(String((e as Error).message)) ?? "Stream error");
          callbacks.onFinal("");
          resolveOnce();
          return;
        } finally {
          reader.releaseLock();
        }

        clearTimeout(timeout);
        clearTimeout(firstByteTimer);
        callbacks.onFinal(stripModelSelfDisclosure(sanitizeReplyContent(fullText)));
        resolveOnce();
      })
      .catch((e) => {
        clearTimeout(timeout);
        clearTimeout(firstByteTimer);
        callbacks.onError?.(sanitizeErrorMessage(String((e as Error).message)) ?? "Request error");
        callbacks.onFinal("");
        resolveOnce();
      });
  });
}

export async function chatAbort(sessionId: string, _runId: string): Promise<{ ok: boolean; aborted?: boolean; runIds?: string[] }> {
  const sessionKey = toMineEchoSessionKey(sessionId);
  try {
    const url = `${GATEWAY_HTTP_URL}/sessions/${encodeURIComponent(sessionKey)}/kill`;
    const token = loadGatewayToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: "POST", headers });
    if (!res.ok) {
      logger.warn("[Gateway] chatAbort HTTP failed:", { status: res.status, sessionKey });
      return { ok: false };
    }
    const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; killed?: boolean };
    return {
      ok: payload?.ok ?? true,
      aborted: payload?.killed,
    };
  } catch (e) {
    logger.warn("[Gateway] chatAbort exception:", { error: (e as Error).message, sessionKey });
    return { ok: false };
  }
}

export async function chatHistory(sessionId: string): Promise<Array<{ id?: string; role: string; content?: string; ts?: number }>> {
  const sessionKey = toMineEchoSessionKey(sessionId);
  try {
    const url = `${GATEWAY_HTTP_URL}/sessions/${encodeURIComponent(sessionKey)}/history`;
    const token = loadGatewayToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      if (res.status === 404) {
        logger.debug("[Gateway] chatHistory 404 (session not yet created):", { sessionKey });
      } else {
        logger.warn("[Gateway] chatHistory HTTP failed:", { status: res.status, sessionKey });
      }
      return [];
    }
    const payload = (await res.json().catch(() => null)) as
      | Array<{ id?: string; role: string; content?: string; ts?: number }>
      | { messages?: Array<{ id?: string; role: string; content?: string; ts?: number }> }
      | null;
    if (Array.isArray(payload)) return payload;
    const p = payload as { messages?: Array<{ id?: string; role: string; content?: string; ts?: number }> } | null;
    if (Array.isArray(p?.messages)) return p.messages;
    return [];
  } catch (e) {
    logger.warn("[Gateway] chatHistory exception:", { error: (e as Error).message, sessionKey });
    return [];
  }
}

export async function chatHistoryWithRaw(sessionId: string): Promise<Array<{ id?: string; role: string; content?: unknown; ts?: number }>> {
  const sessionKey = toMineEchoSessionKey(sessionId);
  try {
    const url = `${GATEWAY_HTTP_URL}/sessions/${encodeURIComponent(sessionKey)}/history`;
    const token = loadGatewayToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      if (res.status === 404) {
        logger.debug("[Gateway] chatHistoryWithRaw 404 (session not yet created):", { sessionKey });
      } else {
        logger.warn("[Gateway] chatHistoryWithRaw HTTP failed:", { status: res.status, sessionKey });
      }
      return [];
    }
    const payload = (await res.json().catch(() => null)) as
      | Array<{ id?: string; role: string; content?: unknown; ts?: number }>
      | { messages?: Array<{ id?: string; role: string; content?: unknown; ts?: number }> }
      | null;
    if (Array.isArray(payload)) return payload;
    const p = payload as { messages?: Array<{ id?: string; role: string; content?: unknown; ts?: number }> } | null;
    if (Array.isArray(p?.messages)) return p.messages;
    return [];
  } catch (e) {
    logger.warn("[Gateway] chatHistoryWithRaw exception:", { error: (e as Error).message, sessionKey });
    return [];
  }
}

export async function chatClearSession(_sessionId: string): Promise<{ ok: boolean }> {
  // V3: Gateway 没有提供 chat.clear 的 HTTP 端点；由前端切换新 session 代替
  return { ok: true };
}

export function isGatewayConfigured(): boolean {
  return Boolean(GATEWAY_HTTP_URL);
}

/** 当前 Gateway 是否可用（真正发起 /health 探测） */
export async function isGatewayConnected(): Promise<boolean> {
  const url = getGatewayUrl();
  if (!url) return false;

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${url}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    recordMetric("gateway.health_check", Date.now() - start, res.ok ? undefined : `HTTP ${res.status}`);
    return res.ok;
  } catch {
    recordMetric("gateway.health_check", Date.now() - start, "connection_failed");
    return false;
  }
}

/** 获取 Gateway 连接状态的详细信息 */
export async function getGatewayConnectionInfo(): Promise<{
  connected: boolean;
  url: string;
  hasToken: boolean;
}> {
  return {
    connected: await isGatewayConnected(),
    url: GATEWAY_HTTP_URL,
    hasToken: !!loadGatewayToken(),
  };
}

/** 在后台触发一次建连尝试（不阻塞），用于状态轮询/刷新时加速恢复显示 */
export function tryConnectInBackground(): void {
  // V3: HTTP 是主通道，不再需要主动维持 WebSocket 长连接
}

export function getGatewayUrl(): string {
  return GATEWAY_HTTP_URL;
}

/** 读取用户当前配置的模型 ID（来自 openclaw.json），用于显式指定 organize / 重任务模型 */
export async function getConfiguredModel(): Promise<string> {
  const openclawHome = process.env.OPENCLAW_HOME || join(homedir(), ".openclaw");
  const configPath = join(openclawHome, "openclaw.json");
  if (!existsSync(configPath)) return "openclaw";
  try {
    const raw = readFileSync(configPath, "utf8");
    const data = JSON.parse(raw) as {
      agent?: { model?: string };
      agents?: { defaults?: { model?: { primary?: string } } };
    };
    const id =
      data?.agent?.model ??
      data?.agents?.defaults?.model?.primary;
    if (typeof id === "string" && id.trim()) {
      // OpenClaw 模型格式是 provider/modelId，直接透传
      return id.trim();
    }
  } catch {
    // fall through
  }
  return "openclaw";
}
