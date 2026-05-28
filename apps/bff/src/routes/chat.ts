import { Router, type Request } from "express";
import multer from "multer";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { z } from "zod";
import {
  chatSend,
  chatSendStream,
  chatHistory,
  chatHistoryWithRaw,
  chatAbort,
  chatClearSession,
  isGatewayConfigured,
  isGatewayConnected,
  getGatewayConfigDebug,
  getGatewayConnectionInfo,
  getGatewayUrl,
} from "../gateway/client.js";
import { redactSecrets } from "../utils/redact.js";
import { getWorkspaceRoot } from "./workspace.js";
import { processMessageForTriggers } from "../triggers/index.js";
import { buildMemoryContext, formatMemoryContext } from "../memory/context-builder.js";
import { workingMemoryManager, shortTermMemoryManager, userProfileLearner, longTermMemoryManager, onTurnCompleted, clearSessionTurnCount } from "../memory/index.js";
import { storeConversationToMemoryTree, storeSkillToMemoryTree } from "../memory/memory-tree-service.js";
import { recordSkillCall } from "../skills/usage-reporter.js";
import { buildSkillRegistry } from "../skills/registry.js";
import { loadCustomSkills, loadSkillsState } from "../skills/state.js";
import { logger } from "../utils/logger.js";
import { recordMessage, recordSkillInvocation, recordError } from "../statistics/conversation-stats.js";
import { trajectoryStore } from "../learning/trajectory-store.js";
import { loadMessages, appendMessage, clearMessages as clearLocalMessages } from "../chat/message-store.js";
import { workplaceIntelligenceIntegration } from "../workplace-intelligence/index.js";
import type { DetectionResult } from "../workplace-intelligence/index.js";
import {
  detectRiskAsync,
  getFormattedRiskAlert,
  resetSessionAlertCount,
  type RiskAlert,
} from "../risk/index.js";
import { buildKbContextWithSources } from "../knowledge-base/service.js";
import { loadApps } from "../ai-apps/store.js";
import { invokeApp, invokeAppStream } from "../ai-apps/adapters.js";
import { findEnabledAiAppForSkill } from "../ai-apps/direct-chat.js";
import { getChatUploadDir } from "./chat-upload-path.js";
import { appendAttachmentContext, type ChatAttachment } from "./chat-attachments.js";
import { getSkillTriggerEntries } from "../triggers/skill-loader.js";
import {
  buildKnowledgeEvidence,
  buildMemoryEvidence,
  buildSkillEvidence,
  type ChatKnowledgeEvidence,
} from "./chat-context-evidence.js";
import { budgetTaskOutputForMemory } from "../task-output/task-output-budget.js";

/** Mode → system prompt 映射，与前端 modeConfig.ts 保持一致 */
const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  general: "你是 MineEcho，你的 AI 智能助手。请以自然、专业的方式回答用户问题。你可以调用已配置的技能来帮助用户完成任务。回答应简洁、准确，并根据上下文提供有价值的建议。在回答中，如果你了解用户的技术背景或偏好，请自然地融入这些信息，不要刻意提及\"根据你的历史记录\"等话术。",
  auto: "你是 MineEcho，你的 AI 智能助手，运行在\"自动模式\"下。你的首要任务是准确理解用户意图，并自动选择最合适的响应策略：如果是简单问题，直接给出简洁答案；如果需要搜索信息，主动调用搜索技能；如果是复杂任务，分解步骤，逐步执行；如果涉及代码，自动切换为代码优化模式；如果需要创意，激发发散思维。无需用户明确指定，你应该判断并采取最优行动。",
  "agent-team": "你是 MineEcho Agent Team 的协调者，运行在\"Agent Team 模式\"下。面对复杂任务时，你应该：1. 任务分析：首先将任务拆解为独立的子任务；2. 角色分配：为每个子任务指定合适的处理策略；3. 并行处理：尽可能并行执行不相互依赖的子任务；4. 结果整合：将各子任务结果汇总，形成完整解决方案；5. 质量验证：检查最终结果是否满足原始需求。在回答时，请清晰展示任务分解过程和各步骤进度。",
  coding: "你是 MineEcho 代码助手，运行在\"代码开发模式\"下。你的专长是：代码生成（根据需求生成高质量、可维护的代码）、代码审查（发现潜在 bug、安全问题和性能瓶颈）、调试辅助（分析错误信息，提供精准的修复方案）、架构设计（提供合理的系统设计建议）、最佳实践（遵循语言/框架的最佳实践和设计模式）。代码必须附带简洁的注释说明关键逻辑，提供完整可运行的代码示例。",
  brainstorming: "你是 MineEcho 创意伙伴，运行在\"头脑风暴模式\"下。在这个模式下，你应该：发散优先（鼓励多样化、跳跃性的思维，暂缓评判）、数量优于质量（先产生尽可能多的想法，再筛选）、跨界联想（从不同领域借鉴灵感，打破惯性思维）、具体化（将抽象想法具体化为可执行的方案）、结构整理（最终将发散的想法归纳成有结构的输出）。使用清单、思维导图结构呈现想法，提供最推荐的方向及理由。",
};

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

/**
 * 根据 mode 在用户消息前拼接对应的 system prompt。
 * 如果 mode 未映射，直接返回原始 content。
 * 使用 XML 结构化边界防止 prompt 注入攻击。
 */
function buildMessageWithMode(content: string, mode: string, userId?: string): string {
  let systemPrompt = MODE_SYSTEM_PROMPTS[mode];
  if (!systemPrompt) return content;

  // 时间友好模式：给系统提示添加自然的时间意识（深夜/早安，一天一次）
  if (userId) {
    const nightHint = getLateNightSystemHint(userId);
    if (nightHint) {
      systemPrompt = systemPrompt + "\n\n" + nightHint;
    }
    const morningHint = getMorningSystemHint(userId);
    if (morningHint) {
      systemPrompt = systemPrompt + "\n\n" + morningHint;
    }
  }

  // 追加格式提醒：确保模型在 user message 层面也收到格式要求（双重保障）
  const formatReminder =
    "\n\n【格式要求 - 必须遵守】回复必须使用 Markdown 格式：段落间有空行，使用标题分节，列表组织并列内容，关键信息加粗。禁止大段纯文本堆在一起。";
  return `<system>${escapeXml(systemPrompt + formatReminder)}</system>\n<user>${escapeXml(content)}</user>`;
}

/**
 * 构建每次请求的 system prompt extension（模式提示词 + 查询相关记忆上下文）。
 * 记忆上下文必须按当前问题实时构建，避免跨天旧记忆被 session 缓存卡住。
 */
async function buildRequestSystemPromptExtension(mode: string, userId: string, sessionId: string, query: string): Promise<string | null> {
  const parts: string[] = [];

  // Mode system prompt
  const modePrompt = MODE_SYSTEM_PROMPTS[mode];
  if (modePrompt) {
    parts.push(modePrompt);
  }

  // Memory context
  try {
    const memoryContext = await buildMemoryContext(userId, sessionId, query);
    if (memoryContext) {
      const contextStr = formatMemoryContext(memoryContext);
      parts.push(`以下是你对这位用户的了解（自然融入回答，不要提及信息来源）：\n${contextStr}`);
    }
  } catch (error) {
    logger.error("[MemoryContext] Failed to build context:", { error });
  }

  return parts.length > 0 ? parts.join('\n\n') : null;
}

/**
 * 构建用户消息：仅包含 KB 上下文（查询相关）+ 原始用户内容。
 */
async function buildUserMessage(content: string, _mode: string, _userId: string, _sessionId: string, useKb = false): Promise<{
  message: string;
  knowledgeSources: ChatKnowledgeEvidence[];
}> {
  let baseMessage = content;
  let knowledgeSources: ChatKnowledgeEvidence[] = [];

  // Build KB context (if enabled) — stays in user message because it's query-dependent
  if (useKb) {
    try {
      const kb = await buildKbContextWithSources(content);
      knowledgeSources = buildKnowledgeEvidence(kb.sources);
      if (kb.context) {
        baseMessage = `${baseMessage}\n\n${kb.context}`;
      }
    } catch (error) {
      logger.error("[KBContext] Failed to inject knowledge base context:", { error });
    }
  }

  return { message: baseMessage, knowledgeSources };
}

/**
 * 检测 AI 回复是否引用了用户记忆上下文中的技术栈/领域专长关键词
 */
function detectMemoryUsage(
  assistantContent: string,
  memoryContext: any
): string[] {
  const used: string[] = [];
  if (memoryContext?.userProfile?.technicalStack) {
    for (const tech of memoryContext.userProfile.technicalStack) {
      if (assistantContent.includes(tech)) {
        used.push(tech);
      }
    }
  }
  // 也检查领域专长
  if (memoryContext?.userProfile?.domainExpertise) {
    for (const domain of memoryContext.userProfile.domainExpertise) {
      if (assistantContent.includes(domain)) {
        used.push(domain);
      }
    }
  }
  return used;
}

/**
 * 判断是否是首次使用某个 skill（基于 longTermMemoryManager.recordSkillUsage 的数据）
 */
async function isFirstTimeSkillMatch(
  userId: string,
  skillId: string
): Promise<boolean> {
  const patterns = await longTermMemoryManager.getSkillPatterns(userId);
  if (!patterns) return true;
  const pattern = patterns.patterns.find((p: any) => p.skillId === skillId);
  // 如果 pattern 不存在，或者是本次调用前 totalUses <= 1
  return !pattern || pattern.totalUses <= 1;
}

/**
 * 从消息内容中移除 system prompt（用于返回给前端显示）
 */
function stripSystemPrompt(content: string, mode: string): string {
  const systemPrompt = MODE_SYSTEM_PROMPTS[mode];
  if (!systemPrompt || !content) return content;

  // 如果消息以 system prompt 开头，移除它
  if (content.startsWith(systemPrompt)) {
    return content.slice(systemPrompt.length).replace(/^\n+/, '').trim();
  }

  return content;
}

/**
 * 从消息内容中移除记忆上下文（用于返回给前端显示）
 */
function stripMemoryContext(content: string): string {
  if (!content) return content;

  // Match the new natural memory context block
  const memoryContextRegex = /以下是你对这位用户的了解（自然融入回答，不要提及信息来源）：[\s\S]*?\n\n/;

  // If contains new memory context marker, extract actual message
  if (content.includes('以下是你对这位用户的了解')) {
    return content.replace(memoryContextRegex, '').trim();
  }

  // Also keep backward compatibility with old format
  const oldMemoryContextRegex = /\[用户记忆上下文 - 仅供参考，不要在回复中提及\][\s\S]*?\[用户实际消息\]\s*/;
  if (content.includes('[用户记忆上下文')) {
    return content.replace(oldMemoryContextRegex, '').trim();
  }

  return content;
}

/**
 * 从消息内容中移除知识库上下文（用于返回给前端显示）
 */
function stripKbContext(content: string): string {
  if (!content) return content;

  const kbContextRegex = /\[知识库上下文 - [^\]]*\][\s\S]*?\[知识库上下文结束\]\s*/;

  if (content.includes('[知识库上下文')) {
    return content.replace(kbContextRegex, '').trim();
  }

  return content;
}

export const chatRouter = Router();

// 配置文件上传
const UPLOAD_DIR = getChatUploadDir();

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    } catch (err) {
      cb(err as Error, UPLOAD_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 限制
    files: 5, // 最多 5 个文件
  },
  fileFilter: (_req, file, cb) => {
    // 允许的文件类型：图片、文档、文本
    const isAllowed =
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("text/") ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/json" ||
      file.mimetype === "application/octet-stream" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel";

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
});

interface Attachment extends ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

/** 职场智能检测结果存储（按 session） */
const workplaceIntelligenceResults = new Map<string, DetectionResult>();

/** 风险提醒存储（按 session） */
const riskAlertResults = new Map<string, RiskAlert>();

/** 定时清理过期的 session 数据（30 分钟 TTL） */
const SESSION_TTL_MS = 30 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  // Note: DetectionResult and RiskAlert don't have timestamps, so we use a separate tracking map
}, 30 * 60 * 1000).unref?.();

/** Session 最后访问时间跟踪 */
const sessionLastAccess = new Map<string, number>();

function touchSession(sessionId: string): void {
  sessionLastAccess.set(sessionId, Date.now());
}

function cleanupStaleSessions(): void {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [sessionId, lastAccess] of sessionLastAccess.entries()) {
    if (lastAccess < cutoff) {
      workplaceIntelligenceResults.delete(sessionId);
      riskAlertResults.delete(sessionId);
      clearSessionTurnCount(sessionId);
      sessionLastAccess.delete(sessionId);
      logger.debug(`[Chat] Cleaned up stale session data: ${sessionId}`);
    }
  }
}

// 每 5 分钟清理一次过期 session 数据
const sessionCleanupInterval = setInterval(cleanupStaleSessions, 5 * 60 * 1000);
if (typeof sessionCleanupInterval.unref === "function") {
  sessionCleanupInterval.unref();
}

// API 参数验证 Schema
const chatRequestSchema = z.object({
  content: z.string().min(1).max(10000),
  sessionId: z.string().min(1).max(128).default("main"),
  mode: z.enum(['general', 'auto', 'agent-team', 'coding', 'brainstorming']).default("general"),
  useKb: z.boolean().default(false),
  attachments: z.array(z.object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(512),
    type: z.string().max(128).default("application/octet-stream"),
    size: z.number().nonnegative().max(20 * 1024 * 1024),
    url: z.string().min(1).max(1024),
  })).max(5).default([]),
  preferredSkill: z.object({
    skillId: z.string().min(1).max(128),
    skillName: z.string().max(256).nullable().optional(),
  }).optional(),
});

const chatHistoryQuerySchema = z.object({
  sessionId: z.string().min(1).max(128).default("main"),
  mode: z.enum(['general', 'auto', 'agent-team', 'coding', 'brainstorming']).default("general"),
});

const abortRequestSchema = z.object({
  runId: z.string().min(1).max(128),
  sessionId: z.string().min(1).max(128).default("main"),
});

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/** 记录今天已收到深夜好友模式提示的用户（userId -> date string） */
const lateNightHintSent = new Map<string, string>();

/**
 * 深夜好友模式：仅在 22:00-06:00 且当天第一次交互时，
 * 给 AI 添加一条自然的时间关怀提示，让它像朋友一样自然地关心用户。
 * 不强制插入固定文案，由 AI 自己决定何时、如何表达。
 */
function getLateNightSystemHint(userId: string): string | null {
  const hour = new Date().getHours();
  const isNightTime = hour >= 22 || hour < 6;
  if (!isNightTime) return null;

  const today = getTodayDateString();
  if (lateNightHintSent.get(userId) === today) return null;

  lateNightHintSent.set(userId, today);
  return `【当前是深夜】用户这么晚还在和你聊天，你像TA的好朋友一样，如果话题合适，可以像朋友随口关心那样提醒一下用户注意休息，不要硬插固定话术，也不要每次都提。简短自然就好。`;
}

/** 记录今天已收到早安友好模式提示的用户（userId -> date string） */
const morningHintSent = new Map<string, string>();

/**
 * 早安友好模式：仅在 06:00-12:00 且当天第一次交互时，
 * 给 AI 添加一条自然的早安意识提示，让 AI 像朋友一样自然地问候用户。
 * 不强制插入固定文案，由 AI 自己决定如何表达。
 */
function getMorningSystemHint(userId: string): string | null {
  const hour = new Date().getHours();
  const isMorning = hour >= 6 && hour < 12;
  if (!isMorning) return null;

  const today = getTodayDateString();
  if (morningHintSent.get(userId) === today) return null;

  morningHintSent.set(userId, today);
  return `【当前是早晨】今天是新的一天，用户刚刚上线。你像TA的好朋友一样，自然地打个招呼、问候一下，然后继续回答用户的问题。不要生硬地插入固定话术。`;
}

function isConnectionError(e: unknown): boolean {
  const msg = (e as Error)?.message ?? "";
  return /ECONNREFUSED|Gateway closed|connect\.challenge|not send/.test(msg);
}

/** OpenClaw 可能返回多种 content 结构（string/array/object），统一提取为 string */
function normalizeMessageContent(c: unknown, includeThinking = false): string {
  const extract = (v: unknown, depth = 0): string => {
    if (depth > 5 || v == null) return "";
    if (typeof v === "string") return v;

    if (Array.isArray(v)) {
      return v.map((item) => extract(item, depth + 1)).filter(Boolean).join("");
    }

    if (typeof v === "object") {
      const obj = v as Record<string, unknown>;

      // 优先处理 block 类型
      if (obj.type === "text" && typeof obj.text === "string") return obj.text;
      if (includeThinking && obj.type === "thinking" && typeof obj.thinking === "string") return obj.thinking;

      // 常见直出字段
      const directKeys = ["text", "content", "value", "output_text", "delta"] as const;
      for (const key of directKeys) {
        const candidate = obj[key];
        if (typeof candidate === "string" && candidate.trim()) return candidate;
      }

      // 常见嵌套字段
      const nestedKeys = ["parts", "content", "message", "output", "result", "response"] as const;
      for (const key of nestedKeys) {
        const nested = obj[key];
        if (nested != null && nested !== v) {
          const text = extract(nested, depth + 1);
          if (text) return text;
        }
      }
    }

    return "";
  };

  const raw = extract(c);
  return raw
    .replace(/\s*<final\s*>\s*<\/final>\s*/gi, " ")
    .replace(/\s*<final\s*\/>\s*/gi, " ")
    .trim();
}

/** OpenClaw 默认身份模板为英文，替换为中文以便界面一致 */
const IDENTITY_TEMPLATE_ZH =
  "**IDENTITY.md - 我是谁？**\n\n在第一次对话时填写，让它成为你的助手。\n\n- **名字**：怎么称呼我\n- **形象**：生物/角色（如：龙虾助手）\n- **风格**：语气与个性\n- **表情**：代表我的 emoji\n- **头像**：头像图片路径\n\n这不只是元数据，而是确定「我是谁」的起点。\n\n将本文件保存在工作区根目录，命名为 IDENTITY.md。头像请使用相对路径，如 avatars/openclaw.png。";

function localizeIdentityContent(content: string): string {
  if (!content || typeof content !== "string") return content;
  const s = content.trim();
  if (
    (s.includes("IDENTITY.md") && s.includes("Who Am I")) ||
    (s.includes("Fill this in during your first conversation") && s.includes("Make it yours"))
  ) {
    return IDENTITY_TEMPLATE_ZH;
  }
  return content;
}



chatRouter.get("/history", async (req, res) => {
  const parseResult = chatHistoryQuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid parameters", details: parseResult.error.format() });
  }
  const { sessionId, mode } = parseResult.data;

  if (!isGatewayConfigured()) {
    return res.status(503).json({
      error: "服务暂时不可用",
      message: "AI服务连接失败，请稍后重试",
      code: "SERVICE_UNAVAILABLE"
    });
  }
  try {
    // 优先从本地持久化存储读取历史记录（Gateway 内存历史在重启后会丢失）
    const localMessages = loadMessages(sessionId);
    if (localMessages.length > 0) {
      return res.json({ sessionId, messages: localMessages, source: "local" });
    }

    // Fallback: 从 Gateway 读取（兼容旧数据）
    const messages = await chatHistoryWithRaw(sessionId);
    const normalized = messages.map((m, i) => {
      let content = normalizeMessageContent(m.content);

      // 如果是用户消息，移除 system prompt 和记忆上下文
      if (m.role === "user") {
        content = stripSystemPrompt(content, mode);
        content = stripMemoryContext(content);
        content = stripKbContext(content);
      }

      return {
        id: m.id ?? `msg-${i}`,
        role: m.role === "user" ? "user" : "assistant",
        content: localizeIdentityContent(content),
        ts: m.ts ?? Date.now(),
      };
    });
    return res.json({ sessionId, messages: normalized, source: "gateway" });
  } catch (e) {
    logger.warn("Gateway chat.history failed:", { error: redactSecrets((e as Error).message) });
    // 即使 Gateway 失败，也尝试返回本地存储的数据
    const localMessages = loadMessages(sessionId);
    if (localMessages.length > 0) {
      return res.json({ sessionId, messages: localMessages, source: "local" });
    }
    return res.status(503).json({
      error: "服务暂时不可用",
      message: "AI服务连接失败，请稍后重试",
      code: "SERVICE_UNAVAILABLE"
    });
  }
});

function getUserId(req: Request): string {
  const headerId = req.headers['x-user-id'];
  if (headerId && typeof headerId === 'string') return headerId;
  return 'anonymous';
}

/**
 * Record interaction to memory system
 * This is called after a successful chat completion
 */
function recordInteraction(
  userId: string,
  userContent: string,
  assistantContent: string,
  sessionId: string,
  mode: string,
  matchedSkillId?: string,
  matchedSkillName?: string
): void {
  // Fire and forget - don't block the response
  Promise.resolve().then(async () => {
    try {
      const isFirstTimeSkill = matchedSkillId ? await isFirstTimeSkillMatch(userId, matchedSkillId) : false;
      // Record user query as interaction
      const interaction = await shortTermMemoryManager.addInteraction(userId, {
        type: "chat",
        content: userContent,
        skillId: matchedSkillId,
        skillName: matchedSkillName,
        outcome: "success",
      }, {
        isComplexTask: userContent.length > 200,
        isFirstTimeSkill,
        hasNegativeFeedback: false, // could be detected from user feedback in future
      });

      // Learn from this interaction for long-term profile
      await userProfileLearner.learnFromInteraction(userId, interaction);

      const memoryAssistantContent = await budgetAssistantForLearning({
        assistantContent,
        userContent,
        matchedSkillId,
        mode,
      });

      // Store to memory tree for hierarchical summarization
      await storeConversationToMemoryTree(userId, userContent, memoryAssistantContent, {
        skillId: matchedSkillId,
        skillName: matchedSkillName,
        sessionId,
        mode,
      });

      // Store skill usage to memory tree if applicable
      if (matchedSkillId) {
        await storeSkillToMemoryTree(userId, matchedSkillId, matchedSkillName || matchedSkillId, userContent, true);
      }

      logger.debug("[Memory] Recorded chat interaction:", {
        userId,
        sessionId,
        mode,
        contentLength: userContent.length,
      });
    } catch (err) {
      // Fail silently - don't break the chat flow
      logger.warn("[Memory] Failed to record interaction:", {
        error: (err as Error).message,
        userId,
      });
    }
  });
}

async function budgetAssistantForLearning(input: {
  assistantContent: string;
  userContent: string;
  matchedSkillId?: string;
  mode: string;
}): Promise<string> {
  const result = await budgetTaskOutputForMemory({
    toolName: input.matchedSkillId ? "skill" : "chat",
    input: input.userContent,
    output: input.assistantContent,
    scenario: input.matchedSkillId ? "skill" : "general",
    maxInlineChars: 5000,
  });
  return result.content;
}

async function findMatchedAiApp(skillId: string | undefined) {
  const apps = await loadApps();
  return findEnabledAiAppForSkill(apps, skillId);
}

let runtimeSkillRegistryCache: {
  registry: ReturnType<typeof buildSkillRegistry>;
  expiresAt: number;
} | null = null;

async function buildRuntimeSkillRegistry() {
  const now = Date.now();
  if (runtimeSkillRegistryCache && runtimeSkillRegistryCache.expiresAt > now) {
    return runtimeSkillRegistryCache.registry;
  }

  const [state, apps, customSkills] = await Promise.all([
    loadSkillsState(),
    loadApps(),
    loadCustomSkills(),
  ]);
  const registry = buildSkillRegistry({
    triggerEntries: getSkillTriggerEntries(),
    customSkills,
    aiApps: apps,
    state,
  });
  runtimeSkillRegistryCache = {
    registry,
    expiresAt: now + 5000,
  };
  return registry;
}

chatRouter.post("/send", async (req, res) => {
  const parseResult = chatRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid request body", details: parseResult.error.format() });
  }
  const { content, sessionId, mode, useKb, attachments, preferredSkill } = parseResult.data;

  if (!isGatewayConfigured()) {
    return res.status(503).json({
      error: "服务暂时不可用",
      message: "AI服务连接失败，请稍后重试",
      code: "SERVICE_UNAVAILABLE"
    });
  }

  // Process message for trigger matching and skill injection
  const userId = getUserId(req);
  const skillRegistry = await buildRuntimeSkillRegistry();
  const triggerResult = await processMessageForTriggers(userId, content.trim(), {
    autoInject: true,
    threshold: 0.7,
    preferredSkill,
    registry: skillRegistry,
    mode,
  });

  // Workplace Intelligence: Detect sensitive scenarios
  const wiResult = await workplaceIntelligenceIntegration.processUserMessage(
    userId,
    content.trim()
  );
  // Store result for later use in response
  if (wiResult.hasSensitiveScenario) {
    workplaceIntelligenceResults.set(sessionId, wiResult);
    touchSession(sessionId);
  }

  // Risk Alert: Async detection (non-blocking)
  const riskDetectionPromise = detectRiskAsync({
    userId,
    sessionId,
    message: content.trim(),
    enableAlert: true,
  }).then((result) => {
    if (result.alert) {
      riskAlertResults.set(sessionId, result.alert);
      touchSession(sessionId);
    }
  }).catch((err) => {
    logger.warn("[RiskAlert] Detection failed:", { error: err.message });
  });

  const processedContent = await appendAttachmentContext(triggerResult.processedMessage, attachments);
  let startTime = Date.now();
  const traceId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const directSkillId = triggerResult.matchedTrigger?.trigger.skillId;
    const directSkillName = triggerResult.matchedTrigger?.trigger.skillName;
    const matchedAiApp = await findMatchedAiApp(directSkillId);
    if (matchedAiApp) {
      const result = await invokeApp(matchedAiApp, processedContent);
      const latencyMs = Date.now() - startTime;
      const assistantContent = result.error
        ? `AI 应用调用失败：${result.error}`
        : result.content || "AI 应用未返回内容。";

      appendMessage(sessionId, {
        role: "user",
        content: content.trim(),
        ts: Date.now(),
        attachments: attachments.length ? attachments : undefined,
      });
      appendMessage(sessionId, { role: "assistant", content: assistantContent, ts: Date.now() });
      recordInteraction(userId, processedContent, assistantContent, sessionId, mode, directSkillId, directSkillName);
      recordSkillCall({
        userId,
        skillId: directSkillId || matchedAiApp.id,
        latencyMs,
        success: !result.error,
        metadata: {
          skillName: directSkillName || matchedAiApp.name,
          sessionId,
          mode,
          directAiApp: true,
          errorMessage: result.error,
        },
      });
      return res.json({
        content: assistantContent,
        error: result.error || null,
        directAiApp: true,
        skillId: directSkillId,
        skillName: directSkillName,
      });
    }

    // 提前构建 memoryContext，用于 detectMemoryUsage（不阻塞主流程，失败静默忽略）
    let memoryContext: any = null;
    try {
      memoryContext = await buildMemoryContext(userId, sessionId, processedContent);
    } catch (err) {
      logger.warn("[CognitiveSpark] Failed to build memory context:", { error: (err as Error).message });
    }

    // 直接发送到 Gateway，由 OpenClaw 处理技能路由
    // 使用处理后的内容（可能包含技能注入）
    let payload: { content?: string; error?: string | null; tokensInput?: number; tokensOutput?: number };
    let knowledgeSources: ChatKnowledgeEvidence[] = [];
    try {
      const systemPromptExtension = await buildRequestSystemPromptExtension(mode, userId, sessionId, processedContent);
      const userMessage = await buildUserMessage(processedContent, mode, userId, sessionId, useKb);
      knowledgeSources = userMessage.knowledgeSources;
      payload = await chatSend(sessionId, userMessage.message, undefined, systemPromptExtension ?? undefined);
    } catch (first: unknown) {
      if (isConnectionError(first)) {
        await new Promise((r) => setTimeout(r, 2500));
        const systemPromptExtension = await buildRequestSystemPromptExtension(mode, userId, sessionId, processedContent);
        const userMessage = await buildUserMessage(processedContent, mode, userId, sessionId, useKb);
        knowledgeSources = userMessage.knowledgeSources;
        payload = await chatSend(sessionId, userMessage.message, undefined, systemPromptExtension ?? undefined);
      } else {
        throw first;
      }
    }
    const latencyMs = Date.now() - startTime;
    logger.info('[Chat] Non-stream completed', { traceId, durationMs: latencyMs });
    const hasError = !!payload.error;
    let assistantContent = (payload.content ?? "") || (hasError ? `调用失败：${payload.error}` : "") || "（无回复内容）";

    // Wait for risk detection to complete
    await riskDetectionPromise.catch(() => {});

    // Risk Alert: Attach alert if applicable
    const riskAlert = riskAlertResults.get(sessionId);
    if (riskAlert) {
      const riskAlertText = getFormattedRiskAlert(riskAlert);
      assistantContent = `${assistantContent}\n\n${riskAlertText}`;
      riskAlertResults.delete(sessionId);
    }

    // Workplace Intelligence: Attach advice if applicable
    const wiResult = workplaceIntelligenceResults.get(sessionId);
    if (wiResult?.advice && workplaceIntelligenceIntegration.shouldShowAdvice(wiResult.advice)) {
      const { content: enhancedContent, isSeparate } = workplaceIntelligenceIntegration.attachAdviceToResponse(
        assistantContent,
        wiResult.advice
      );
      if (!isSeparate) {
        assistantContent = enhancedContent;
      }
      // Clean up after use
      workplaceIntelligenceResults.delete(sessionId);
    }

    const assistantMsg = {
      id: `a-${Date.now()}`,
      role: "assistant" as const,
      content: assistantContent,
      ts: Date.now() + 1,
    };

    // Record conversation statistics (fire and forget)
    recordMessage(userId, sessionId, "user", processedContent.length, 0);
    recordMessage(userId, sessionId, "assistant", 0, assistantContent.length);
    const matchedSkillId = triggerResult.matchedTrigger?.trigger.skillId;
    const matchedSkillName = triggerResult.matchedTrigger?.trigger.skillName;
    recordInteraction(userId, processedContent, assistantContent, sessionId, mode, matchedSkillId, matchedSkillName);

    // Fire-and-forget background review
    const recentTurns = [{ userMessage: processedContent, assistantContent, mode, timestamp: Date.now() }];
    onTurnCompleted(sessionId, userId, recentTurns[0], recentTurns).catch(() => {});

    // Record skill usage if a trigger was matched
    if (matchedSkillId) {
      recordSkillCall({
        userId,
        skillId: matchedSkillId,
        tokensInput: payload.tokensInput,
        tokensOutput: payload.tokensOutput,
        latencyMs,
        success: !hasError,
        metadata: {
          skillName: matchedSkillName,
          sessionId,
          mode,
          errorMessage: hasError ? payload.error || undefined : undefined,
        },
      });
      await longTermMemoryManager.recordSkillUsage(
        userId,
        matchedSkillId,
        matchedSkillName || matchedSkillId,
        !hasError,
        {
          latencyMs,
          tokens: (payload.tokensInput || 0) + (payload.tokensOutput || 0) || undefined,
        }
      ).catch(() => {});

      // Record skill invocation to short-term memory for importance scoring
      await shortTermMemoryManager.addInteraction(userId, {
        type: "skill_invocation",
        content: `Used skill: ${matchedSkillName || matchedSkillId}`,
        skillId: matchedSkillId,
        skillName: matchedSkillName,
        outcome: hasError ? "failure" : "success",
      }, {
        isFirstTimeSkill: await isFirstTimeSkillMatch(userId, matchedSkillId),
      }).catch(() => {});
    }

    const trajectoryAssistantContent = await budgetAssistantForLearning({
      assistantContent,
      userContent: processedContent,
      matchedSkillId,
      mode,
    });

    // Record trajectory
    trajectoryStore.recordTurn({
      sessionId,
      userId,
      timestamp: Date.now(),
      mode,
      userMessage: processedContent,
      assistantContent: trajectoryAssistantContent,
      latencyMs,
      tokensInput: payload.tokensInput,
      tokensOutput: payload.tokensOutput,
      error: hasError ? payload.error || undefined : undefined,
      skillName: matchedSkillName,
    });

    // 认知闪光：检测记忆引用
    const usedMemories = detectMemoryUsage(assistantContent, memoryContext);

    // 认知闪光：首次 Skill 匹配"顿悟时刻"
    let firstMatchTip: string | null = null;
    if (matchedSkillId && triggerResult.matchedTrigger) {
      const isFirstMatch = await isFirstTimeSkillMatch(userId, matchedSkillId);
      if (isFirstMatch) {
        firstMatchTip = `以后直接说"${triggerResult.matchedTrigger.trigger.triggerPhrase}"，我就能直接调用这个功能。`;
      }
    }

    return res.json({
      sessionId,
      message: assistantMsg,
      source: hasError ? "gateway-error" : "gateway",
      error: hasError ? payload.error : undefined,
      contextEvidence: {
        memories: buildMemoryEvidence(memoryContext),
        knowledge: knowledgeSources,
        skill: buildSkillEvidence({
          skillId: matchedSkillId,
          skillName: matchedSkillName,
          score: triggerResult.matchedTrigger?.confidence,
        }),
      },
    });
  } catch (e) {
    const safeMsg = redactSecrets((e as Error).message);
    recordError(userId, sessionId);
    logger.warn("Gateway chat.send failed:", { error: safeMsg });

    // Record trajectory on error
    trajectoryStore.recordTurn({
      sessionId,
      userId,
      timestamp: Date.now(),
      mode,
      userMessage: processedContent,
      assistantContent: "",
      latencyMs: Date.now() - startTime,
      error: safeMsg,
      skillName: triggerResult.matchedTrigger?.trigger.skillName,
    });

    return res.status(503).json({
      error: "服务暂时不可用",
      message: "AI服务连接失败，请稍后重试",
      code: "SERVICE_UNAVAILABLE"
    });
  }
});

/** 流式发送：返回 SSE，前端可做打字机效果 */
chatRouter.post("/send-stream", async (req, res) => {
  const parseResult = chatRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid request body", details: parseResult.error.format() });
  }
  const { content, sessionId, mode, useKb, attachments, preferredSkill } = parseResult.data;

  if (!isGatewayConfigured()) {
    return res.status(503).json({
      error: "服务暂时不可用",
      message: "AI服务连接失败，请稍后重试",
      code: "SERVICE_UNAVAILABLE"
    });
  }

  // Process message for trigger matching and skill injection
  const userId = getUserId(req);
  const skillRegistry = await buildRuntimeSkillRegistry();
  const triggerResult = await processMessageForTriggers(userId, content.trim(), {
    autoInject: true,
    threshold: 0.7,
    preferredSkill,
    registry: skillRegistry,
    mode,
  });

  // Workplace Intelligence: Detect sensitive scenarios
  const wiResult = await workplaceIntelligenceIntegration.processUserMessage(
    userId,
    content.trim()
  );
  // Store result for later use in response
  if (wiResult.hasSensitiveScenario) {
    workplaceIntelligenceResults.set(sessionId, wiResult);
    touchSession(sessionId);
  }

  // Risk Alert: Async detection (non-blocking)
  const riskDetectionPromise = detectRiskAsync({
    userId,
    sessionId,
    message: content.trim(),
    enableAlert: true,
  }).then((result) => {
    if (result.alert) {
      riskAlertResults.set(sessionId, result.alert);
      touchSession(sessionId);
    }
  }).catch((err) => {
    logger.warn("[RiskAlert] Detection failed:", { error: err.message });
  });

  const processedContent = await appendAttachmentContext(triggerResult.processedMessage, attachments);
  const traceId = `chat-stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  logger.info("[Chat] Request received", { traceId, sessionId, messageLength: content?.length });

  // Persist user message to local store (survives Gateway restarts)
  appendMessage(sessionId, {
    role: "user",
    content: content.trim(),
    ts: Date.now(),
    attachments: attachments.length ? attachments : undefined,
  });

  const phases = {
    bffReceived: Date.now(),
    gatewayStart: 0,
    firstToken: 0,
    streamEnd: 0,
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  let ended = false;
  const safeEnd = () => {
    if (!ended) {
      ended = true;
      clearInterval(heartbeatTimer);
      res.end();
    }
  };
  const send = (event: string, data: object) => {
    if (ended) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    logger.debug(`[BFF SSE] event=${event}`);
    (res as { flush?: () => void }).flush?.();
  };

  // 技能调用跟踪
  const skillInvocations = new Map<string, { startTime: number; skillName?: string }>();

  // Stream heartbeat: 当 OpenClaw 长时间无 SSE 事件时，主动向前端推送状态
  // 避免用户看到"正在分析问题"卡住 N 秒却没有任何反馈
  let lastEventTime = Date.now();
  let heartbeatCount = 0;
  const HEARTBEAT_INTERVAL_MS = 3000;
  const heartbeatTimer = setInterval(() => {
    if (ended) return;
    const elapsed = Date.now() - lastEventTime;
    if (elapsed >= HEARTBEAT_INTERVAL_MS) {
      heartbeatCount++;
      // 渐进式提示：保持真实但不制造“卡死”感
      const message = heartbeatCount <= 2
        ? "模型正在处理中"
        : `模型仍在处理，已等待约 ${Math.round(elapsed / 1000)} 秒`;
      send("status", { status: "processing", message });
    }
  }, HEARTBEAT_INTERVAL_MS);

  const touchHeartbeat = () => { lastEventTime = Date.now(); heartbeatCount = 0; };

  try {
    const matchedSkillId = triggerResult.matchedTrigger?.trigger.skillId;
    const matchedSkillName = triggerResult.matchedTrigger?.trigger.skillName;
    const matchedAiApp = await findMatchedAiApp(matchedSkillId);
    if (matchedAiApp) {
      clearInterval(heartbeatTimer);
      const startTime = Date.now();
      const runId = `direct-ai-app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      send("started", { runId });
      send("status", {
        status: "tool_start",
        toolName: matchedAiApp.name,
        message: `已选中「${matchedAiApp.name}」，正在请求外部 AI 应用`,
      });

      const aiAppStatusTimer = setInterval(() => {
        const elapsedSeconds = Math.max(5, Math.round((Date.now() - startTime) / 1000));
        send("status", {
          status: "waiting_model",
          toolName: matchedAiApp.name,
          message: `「${matchedAiApp.name}」正在生成回答，已等待 ${elapsedSeconds} 秒`,
        });
      }, 5000);

      const result = await invokeAppStream(matchedAiApp, processedContent, (delta) => {
        touchHeartbeat();
        send("delta", { delta });
      });
      clearInterval(aiAppStatusTimer);
      const latencyMs = Date.now() - startTime;
      const assistantContent = result.error
        ? `AI 应用调用失败：${result.error}`
        : result.content || "AI 应用未返回内容。";

      send("status", { status: "tool_done", toolName: matchedAiApp.name });
      send("final", { content: assistantContent });
      send("done", {});

      appendMessage(sessionId, { role: "assistant", content: assistantContent, ts: Date.now() });
      recordInteraction(userId, processedContent, assistantContent, sessionId, mode, matchedSkillId, matchedSkillName);
      recordSkillCall({
        userId,
        skillId: matchedSkillId || matchedAiApp.id,
        latencyMs,
        success: !result.error,
        metadata: {
          skillName: matchedSkillName || matchedAiApp.name,
          sessionId,
          mode,
          directAiApp: true,
          errorMessage: result.error,
        },
      });
      safeEnd();
      return;
    }

    // 直接发送到 Gateway，由 OpenClaw 处理技能路由
    // 使用处理后的内容（可能包含技能注入）
    const startTime = Date.now();

    // If KB is enabled, notify frontend that retrieval is in progress
    if (useKb) {
      send("status", { status: "retrieving_kb", message: "正在检索知识库" });
    }

    const systemPromptExtension = await buildRequestSystemPromptExtension(mode, userId, sessionId, processedContent);
    const userMessage = await buildUserMessage(processedContent, mode, userId, sessionId, useKb);
    const memoryContext = await buildMemoryContext(userId, sessionId, processedContent).catch(() => null);
    const contextEvidence = {
      memories: buildMemoryEvidence(memoryContext),
      knowledge: userMessage.knowledgeSources,
      skill: buildSkillEvidence({
        skillId: matchedSkillId,
        skillName: matchedSkillName,
        score: triggerResult.matchedTrigger?.confidence,
      }),
    };
    send("metadata", { contextEvidence });

    let streamUsage: { tokensInput?: number; tokensOutput?: number } = {};

    const runStream = async () =>
      chatSendStream(
        sessionId,
        userMessage.message,
        {
          onStarted: (runId) => {
            phases.gatewayStart = Date.now();
            touchHeartbeat();
            logger.info('[Chat] Gateway connected', {
              traceId,
              phase: 'gateway-start',
              connectMs: phases.gatewayStart - phases.bffReceived
            });
            send("started", { runId });

          },
          onDelta: (text) => {
            touchHeartbeat();
            if (!phases.firstToken) {
              phases.firstToken = Date.now();
              logger.info('[Chat] First token received', {
                traceId,
                phase: 'first-token',
                ttfbMs: phases.firstToken - phases.gatewayStart
              });
            }
            // DEBUG: log first 80 chars of each delta to see what Gateway sends
            logger.info(`[Chat] Delta received: ${text.slice(0, 80).replace(/\n/g, '\\n')}`);
            // Parse <thinking> tags from delta text: separate thinking content from answer content
            const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
            if (thinkingMatch) {
              const thinkingText = thinkingMatch[1];
              const answerText = text.replace(/<thinking>[\s\S]*?<\/thinking>/, "");
              if (thinkingText.trim()) {
                send("thinking", { delta: thinkingText });
              }
              if (answerText.trim()) {
                send("delta", { delta: answerText });
              }
            } else {
              send("delta", { delta: text });
            }
          },
          onThinking: (text) => {
            touchHeartbeat();
            send("thinking", { delta: text });
          },
          onFinal: (text) => {
            phases.streamEnd = Date.now();
            logger.info('[Chat] Stream completed', {
              traceId,
              phase: 'complete',
              totalMs: phases.streamEnd - phases.bffReceived,
              gatewayMs: phases.streamEnd - phases.gatewayStart,
            });
            // Resolve async enrichments fire-and-forget; onFinal must remain sync for chatSendStream
            const finalize = async () => {
              // 等待风险检测完成
              await riskDetectionPromise.catch(() => {});

              // 获取风险提醒
              const riskAlert = riskAlertResults.get(sessionId);
              if (riskAlert) {
                riskAlertResults.delete(sessionId);
              }

              // Attach risk alert if available
              let enhancedContent = text || "AI 未能生成回复内容，可能原因：任务过于复杂或模型响应超时。建议简化问题后重试。";
              if (riskAlert) {
                const riskAlertText = getFormattedRiskAlert(riskAlert);
                enhancedContent = `${enhancedContent}\n\n${riskAlertText}`;
              }

              // Workplace Intelligence: Attach advice if applicable
              const wiResult = workplaceIntelligenceResults.get(sessionId);
              if (wiResult?.advice && workplaceIntelligenceIntegration.shouldShowAdvice(wiResult.advice)) {
                const { content: adviceContent } = workplaceIntelligenceIntegration.attachAdviceToResponse(
                  enhancedContent,
                  wiResult.advice
                );
                enhancedContent = adviceContent;
                workplaceIntelligenceResults.delete(sessionId);
              }

              send("final", { content: enhancedContent });
              send("done", {});

              // Persist assistant message to local store
              appendMessage(sessionId, { role: "assistant", content: enhancedContent, ts: Date.now() });

              // Record conversation statistics
              recordMessage(userId, sessionId, "user", processedContent.length, 0);
              recordMessage(userId, sessionId, "assistant", 0, enhancedContent.length);
              // 记录对话到记忆系统
              const streamMatchedSkillId = triggerResult.matchedTrigger?.trigger.skillId;
              const streamMatchedSkillName = triggerResult.matchedTrigger?.trigger.skillName;
              recordInteraction(userId, processedContent, enhancedContent, sessionId, mode, streamMatchedSkillId, streamMatchedSkillName);

              // Fire-and-forget background review
              const recentTurns = [{ userMessage: processedContent, assistantContent: enhancedContent, mode, timestamp: Date.now() }];
              onTurnCompleted(sessionId, userId, recentTurns[0], recentTurns).catch(() => {});

              // Record skill usage if a trigger was matched
              const streamLatencyMs = Date.now() - startTime;
              const streamSkillId = triggerResult.matchedTrigger?.trigger.skillId;
              const streamSkillName = triggerResult.matchedTrigger?.trigger.skillName;
              if (streamSkillId) {
                recordSkillCall({
                  userId,
                  skillId: streamSkillId,
                  tokensInput: streamUsage.tokensInput,
                  tokensOutput: streamUsage.tokensOutput,
                  latencyMs: streamLatencyMs,
                  success: true,
                  metadata: {
                    skillName: streamSkillName,
                    sessionId,
                    mode,
                  },
                });
                await longTermMemoryManager.recordSkillUsage(
                  userId,
                  streamSkillId,
                  streamSkillName || streamSkillId,
                  true,
                  {
                    latencyMs: streamLatencyMs,
                    tokens: (streamUsage.tokensInput || 0) + (streamUsage.tokensOutput || 0) || undefined,
                  }
                ).catch(() => {});

                // Record skill invocation to short-term memory for importance scoring
                await shortTermMemoryManager.addInteraction(userId, {
                  type: "skill_invocation",
                  content: `Used skill: ${streamSkillName || streamSkillId}`,
                  skillId: streamSkillId,
                  skillName: streamSkillName,
                  outcome: "success",
                }, {
                  isFirstTimeSkill: await isFirstTimeSkillMatch(userId, streamSkillId),
                }).catch(() => {});
              }

              const trajectoryAssistantContent = await budgetAssistantForLearning({
                assistantContent: enhancedContent,
                userContent: processedContent,
                matchedSkillId: streamSkillId,
                mode,
              });

              // Record trajectory with usage
              trajectoryStore.recordTurn({
                sessionId,
                userId,
                timestamp: Date.now(),
                mode,
                userMessage: processedContent,
                assistantContent: trajectoryAssistantContent,
                latencyMs: streamLatencyMs,
                tokensInput: streamUsage.tokensInput,
                tokensOutput: streamUsage.tokensOutput,
                skillName: streamSkillName,
              });
              safeEnd();
            };
            finalize().catch((err) => {
              logger.warn("[SSE onFinal] finalize failed:", { error: (err as Error).message });
              send("final", { content: text || "（无回复内容）" });
              send("done", {});
              safeEnd();
            });
          },
          onStatus: (statusPayload) => {
            touchHeartbeat();
            if (statusPayload.status === 'tool_calls_done') {
              send("status", { status: 'tool_calls_done' });
            } else if (statusPayload.status === 'start' && statusPayload.toolName) {
              // OpenClaw tool event phase "start" → frontend expects "tool_start"
              send("status", { status: 'tool_start', toolName: statusPayload.toolName });
            } else if (statusPayload.status === 'end' && statusPayload.toolName) {
              // OpenClaw tool event phase "end" → frontend expects "tool_done"
              send("status", { status: 'tool_done', toolName: statusPayload.toolName });
            } else {
              send("status", statusPayload);
            }
          },
          onToolCall: (toolCall) => {
            touchHeartbeat();
            send("tool_call", {
              toolName: toolCall.name,
              arguments: toolCall.arguments,
            });
          },
          onError: (err) => {
            send("error", { error: redactSecrets(String(err)), traceId });
            send("final", { content: "" });
            send("done", {});

            // Clean up session data on error to prevent memory leak
            workplaceIntelligenceResults.delete(sessionId);
            riskAlertResults.delete(sessionId);
            sessionLastAccess.delete(sessionId);

            // Record failed skill usage / trajectory
            const errorLatencyMs = Date.now() - startTime;
            const matchedSkillId = triggerResult.matchedTrigger?.trigger.skillId;
            const matchedSkillName = triggerResult.matchedTrigger?.trigger.skillName;
            if (matchedSkillId) {
              recordSkillCall({
                userId,
                skillId: matchedSkillId,
                tokensInput: streamUsage.tokensInput,
                tokensOutput: streamUsage.tokensOutput,
                latencyMs: errorLatencyMs,
                success: false,
                metadata: {
                  skillName: matchedSkillName,
                  sessionId,
                  mode,
                  errorMessage: String(err),
                },
              });
              longTermMemoryManager.recordSkillUsage(
                userId,
                matchedSkillId,
                matchedSkillName || matchedSkillId,
                false,
                {
                  latencyMs: errorLatencyMs,
                  failureReason: String(err),
                }
              ).catch(() => {});
            }
            trajectoryStore.recordTurn({
              sessionId,
              userId,
              timestamp: Date.now(),
              mode,
              userMessage: processedContent,
              assistantContent: "",
              latencyMs: errorLatencyMs,
              tokensInput: streamUsage.tokensInput,
              tokensOutput: streamUsage.tokensOutput,
              error: String(err),
              skillName: matchedSkillName,
            });

            safeEnd();
          },
        },
        600000,
        undefined,
        systemPromptExtension ?? undefined
      );
    try {
      streamUsage = await runStream();
    } catch (first: unknown) {
      if (isConnectionError(first)) {
        await new Promise((r) => setTimeout(r, 2500));
        streamUsage = await runStream();
      } else {
        throw first;
      }
    }
    const latencyMs = Date.now() - startTime;
  } catch (e) {
    recordError(getUserId(req), sessionId);
    send("error", { error: redactSecrets(String((e as Error).message)), traceId });
    send("final", { content: "" });
    send("done", {});
    safeEnd();
  }
});

chatRouter.post("/abort", async (req, res) => {
  const parseResult = abortRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid request body", details: parseResult.error.format() });
  }
  const { runId, sessionId } = parseResult.data;

  if (!isGatewayConfigured()) {
    return res.status(503).json({ error: "Gateway not configured" });
  }
  try {
    const result = await chatAbort(sessionId, runId);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: redactSecrets(String((e as Error).message)) });
  }
});

/** 清空指定 session 的对话历史 */
chatRouter.delete("/history", async (req, res) => {
  const sessionId = (req.query.sessionId as string) || "main";
  // Always clear local persisted history
  clearLocalMessages(sessionId);
  if (!isGatewayConfigured()) {
    return res.json({ ok: true, note: "local history cleared; gateway not configured" });
  }
  try {
    const result = await chatClearSession(sessionId);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ ok: false, error: redactSecrets(String((e as Error).message)) });
  }
});

chatRouter.get("/gateway-status", async (_req, res) => {
  let connected = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${getGatewayUrl()}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    connected = response.ok;
  } catch {
    connected = false;
  }

  const connectionInfo = await getGatewayConnectionInfo();

  res.json({
    configured: isGatewayConfigured(),
    connected,
    url: connectionInfo.url,
    hasToken: connectionInfo.hasToken,
    sessionPrefix: "mineecho:",
  });
});

/** 调试：查看 BFF 实际读取的配置路径及是否找到 token（不暴露 token） */
chatRouter.get("/gateway-debug", async (_req, res) => {
  try {
    const debug = getGatewayConfigDebug();
    const connectionInfo = await getGatewayConnectionInfo();
    res.json({
      cwd: process.cwd(),
      gatewayUrl: connectionInfo.url,
      configPathsTried: debug.paths.map((p) => p + "/openclaw.json"),
      hasToken: debug.hasToken,
      pathWithToken: debug.pathWithToken,
      connected: connectionInfo.connected,
      tokenFromEnv: process.env.OPENCLAW_GATEWAY_TOKEN !== undefined,
      openClawHome: process.env.OPENCLAW_HOME,
    });
  } catch (e) {
    res.status(500).json({ error: String((e as Error).message) });
  }
});

/** POST /api/chat/upload - 上传文件 */
chatRouter.post("/upload", upload.array("files", 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "没有上传文件" });
    }

    const attachments: Attachment[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      url: `/api/chat/uploads/${file.filename}`,
    }));

    res.json({ success: true, attachments });
  } catch (e) {
    logger.error("[chat/upload] 上传失败:", { error: (e as Error).message });
    res.status(500).json({ error: "上传失败", message: (e as Error).message });
  }
});

/** GET /api/chat/workplace-intelligence/status - 获取职场智能系统状态 */
chatRouter.get("/workplace-intelligence/status", (_req, res) => {
  const status = workplaceIntelligenceIntegration.getStatus();
  res.json({
    ...status,
    message: "职场关系智能系统用于识别敏感场景并提供职场建议",
  });
});

/** POST /api/chat/workplace-intelligence/config - 更新职场智能系统配置 */
chatRouter.post("/workplace-intelligence/config", (req, res) => {
  const { enabled, insertPosition, maxAdviceLength, minSeverityLevel } = req.body;

  workplaceIntelligenceIntegration.updateConfig({
    enabled,
    insertPosition,
    maxAdviceLength,
    minSeverityLevel,
  });

  res.json({
    success: true,
    config: workplaceIntelligenceIntegration.getConfig(),
  });
});

/** GET /api/chat/uploads/:filename - 获取上传的文件 */
chatRouter.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  // 安全检查：防止目录遍历
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return res.status(400).json({ error: "无效的文件名" });
  }
  const safeFilename = basename(filename);
  const filePath = resolve(UPLOAD_DIR, safeFilename);
  if (!filePath.startsWith(resolve(UPLOAD_DIR))) {
    return res.status(400).json({ error: "无效的文件名" });
  }
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: "文件不存在" });
    }
  });
});

interface SmartSuggestion {
  text: string;
  type: "time" | "pattern" | "memory";
}

/**
 * Generate contextual suggestions for the input bar based on:
 * - Time of day (morning/afternoon/evening context)
 * - Recent skill usage patterns
 * - User profile memories
 */
chatRouter.get("/smart-suggestions", async (req, res) => {
  const userId = getUserId(req);
  const suggestions: SmartSuggestion[] = [];
  const hour = new Date().getHours();

  // Time-based suggestions
  if (hour >= 9 && hour < 12) {
    suggestions.push({ text: "帮我规划今天的工作", type: "time" });
  } else if (hour >= 14 && hour < 18) {
    suggestions.push({ text: "总结一下今天下午的进展", type: "time" });
  } else if (hour >= 18 && hour < 22) {
    suggestions.push({ text: "帮我生成今日工作周报", type: "time" });
  }

  // Pattern-based suggestions from memory
  try {
    const patterns = await longTermMemoryManager.getSkillPatterns(userId);
    if (patterns?.patterns) {
      const topPatterns = patterns.patterns
        .filter((p: any) => p.totalUses >= 3)
        .sort((a: any, b: any) => b.totalUses - a.totalUses)
        .slice(0, 2);
      for (const p of topPatterns) {
        if (p.skillName && p.skillName.length > 2) {
          suggestions.push({ text: p.skillName, type: "pattern" });
        }
      }
    }

    // Domain-based suggestions
    const profile = await longTermMemoryManager.getUserProfile(userId);
    if (profile && profile.domainExpertise && profile.domainExpertise.length > 0) {
      const topDomain = profile.domainExpertise[0];
      if (topDomain.domain?.includes("云") || topDomain.domain?.includes("网络")) {
        suggestions.push({ text: "帮我排查一下网络连接问题", type: "memory" });
      } else if (topDomain.domain?.includes("安全") || topDomain.domain?.includes("攻防")) {
        suggestions.push({ text: "分析一下当前的安全威胁态势", type: "memory" });
      }
    }
  } catch {
    // Silently fail — suggestions are non-critical
  }

  // Deduplicate by text
  const seen = new Set<string>();
  const unique = suggestions.filter((s) => {
    if (seen.has(s.text)) return false;
    seen.add(s.text);
    return true;
  });

  res.json({ suggestions: unique.slice(0, 4) });
});
