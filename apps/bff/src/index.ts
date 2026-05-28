import "./load-env.js";
import { join } from "node:path";
import { existsSync } from "node:fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";
import { chatRouter } from "./routes/chat.js";
import { channelsRouter } from "./routes/channels.js";
import { skillsRouter, getMineEchoSkillsDir } from "./routes/skills.js";
import { configRouter } from "./routes/config.js";
import { cronRouter } from "./routes/cron.js";
import { initRouter } from "./routes/init.js";
import { aiAppsRouter } from "./routes/ai-apps.js";
import { accountRouter } from "./routes/account.js";
import { authRouter } from "./auth/routes.js";
import { accountsRouter } from "./accounts/routes.js";
import { invitationsRouter } from "./invitations/routes.js";
import { metricsRouter } from "./routes/metrics.js";
import { skillsSyncRouter } from "./routes/skills-sync.js";
import { workspaceRouter } from "./routes/workspace.js";
import { versionRouter } from "./routes/version.js";
import { triggersRouter } from "./routes/triggers.js";
import { memoryRouter } from "./routes/memory.js";
import { memoryTreeRouter } from "./memory/memory-tree/routes.js";
import { memoryTreeApiRouter } from "./routes/memory-tree-api.js";
import { pairingRouter } from "./routes/pairing.js";
import { openClawPairingRouter } from "./routes/openclaw-pairing.js";
import { gatewayPairingRouter } from "./routes/gateway-pairing.js";
import { pagePairingRouter } from "./routes/page-pairing.js";
import { skillsUpdateRouter, startPeriodicUpdateCheck } from "./routes/skills-update.js";
import { burnoutRouter } from "./routes/burnout.js";
import { riskRouter } from "./routes/risk.js";
import { growthReportRouter } from "./routes/growth-report.js";
import { knowledgeBaseRouter } from "./knowledge-base/routes.js";
import { chatFeedbackRouter } from "./routes/chat-feedback.js";
import { learningRouter } from "./routes/learning.js";
import { meetingRouter } from "./meeting/routes.js";
import { calendarRouter } from "./calendar/routes.js";
import { usageRouter } from "./usage/routes.js";
import { seedRouter } from "./seed/routes.js";
import { createRateLimiter } from "./utils/security.js";
import { syncSkillsFromEnterprise, createSyncTask } from "./skills/sync.js";
import { syncAllEnabledAiApps } from "./routes/ai-apps.js";
import { channelManager } from "./channels/channel-manager.js";
import { startUsageReporter } from "./skills/usage-reporter.js";
import { fetchEnterpriseConfig } from "./account/client.js";
import { startHeartbeat } from "./services/heartbeat.js";
import { longTermMemoryManager } from "./memory/long-term-memory.js";
import { startMemoryDreamScheduler, stopMemoryDreamScheduler } from "./memory/memory-dream-scheduler.js";
import { trajectoryStore } from "./learning/trajectory-store.js";
import { logger } from "./utils/logger.js";
import { getBffPort } from "./utils/bff-url.js";
import { recordMetric } from "./utils/metrics-collector.js";
import { loadSkillTriggersFromDisk } from "./triggers/skill-loader.js";
import { ensureStarterSkillsInstalled } from "./skills/starter-skill-installer.js";
import { isValidUserId, getOrCreateUserId } from "./utils/user-id.js";
import { initConversationStats, initL2Reporter, getConversationStats, getL2Reporter } from "./statistics/index.js";
import { startEmbeddedGateway, stopEmbeddedGateway } from "./gateway/embedded.js";
import { startEmbeddedLightRAG, stopEmbeddedLightRAG } from "./lightrag/embedded.js";
import { startLightRAGIndexWorker, stopLightRAGIndexWorker } from "./knowledge-base/lightrag-index-worker.js";

const app = express();
const PORT = getBffPort();

// Security: CORS whitelist - only allow specific origins
// 生产环境（Electron 打包）自动包含 localhost 和 file:// 协议
const isProduction = process.env.NODE_ENV === 'production';
const defaultOrigins = [
  "http://127.0.0.1:3084", "http://localhost:3084",
  "http://127.0.0.1:3085", "http://localhost:3085",
  "http://127.0.0.1:5173", "http://localhost:5173",
  "http://127.0.0.1:5174", "http://localhost:5174",
  "http://127.0.0.1:5175", "http://localhost:5175",
  "http://127.0.0.1:5176", "http://localhost:5176",
  "http://127.0.0.1:5177", "http://localhost:5177",
  "http://127.0.0.1:3083", "http://localhost:3083",
  "http://127.0.0.1:8080", "http://localhost:8080",
  "http://127.0.0.1:4173", "http://localhost:4173",
];
if (isProduction) {
  // Electron 生产环境：允许 file:// 协议和 null origin
  defaultOrigins.push("file://");
}
const allowedOrigins = (process.env.MINECHO_CORS_ORIGINS || defaultOrigins.join(",")).split(",").map(o => o.trim()).filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      // Electron 生产环境或本地请求允许 null origin
      if (isProduction) {
        return callback(null, true);
      }
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (origin.startsWith("file://")) {
      // 允许 Electron file:// 协议
      callback(null, true);
    } else if (isProduction && (origin.includes("localhost") || origin.includes("127.0.0.1"))) {
      // 生产环境允许 localhost（Electron 内嵌 BFF 场景）
      callback(null, true);
    } else {
      logger.warn(`[Security] Blocked CORS request from unauthorized origin: ${origin}`);
      callback(new Error("CORS policy violation"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-User-Id"],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Rate limiting
const rateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.MINECHO_RATE_LIMIT_WINDOW_MS || "60000", 10),
  maxRequests: parseInt(process.env.MINECHO_RATE_LIMIT_MAX || "100", 10),
  skipPaths: ["/api/health", "/api/chat/gateway-status", "/api/init/status"]
});
app.use(rateLimiter);

function isLocalRequest(req: Request): boolean {
  const ip = req.ip || req.socket.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

// Lightweight auth: X-User-Id based
const PUBLIC_PATHS = ['/api/health', '/api/init/status', '/api/init/config'];
app.use(async (req, res, next) => {
  if (PUBLIC_PATHS.some(p => req.path === p || req.path.startsWith(p + '/'))) return next();
  if (req.path === '/api/config' && req.method === 'GET') return next();
  if (!req.path.startsWith('/api/')) return next();
  if (isLocalRequest(req)) return next(); // internal self-calls

  // Network mode with auth required
  if (process.env.MINECHO_REQUIRE_AUTH === 'true') {
    const valid = await isValidUserId(req);
    if (!valid) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing X-User-Id' });
    }
  }
  next();
});

// HTTP request middleware: timing + requestId + metrics
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  (req as any).requestId = requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const route = req.route ? `${req.method} ${req.route.path}` : `${req.method} ${req.path}`;
    const error = res.statusCode >= 500 ? `HTTP ${res.statusCode}` : undefined;
    logger.info(`[HTTP] ${route} ${res.statusCode} ${duration}ms`, {
      requestId,
      method: req.method,
      path: req.path,
      route: req.route?.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });
    recordMetric(`http.${route}`, duration, error);
  });

  next();
});

// ── Routes ──
// All frontend-facing routes are open (no login required)
// L3→L2 service authentication is handled via X-API-Key in enterprise/client.ts
app.use("/api/chat", chatRouter);
app.use("/api/channels", channelsRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/skills", skillsSyncRouter);
app.use("/api/config", configRouter);
app.use("/api/cron", cronRouter);
app.use("/api/init", initRouter);
app.use("/api/ai-apps", aiAppsRouter);
app.use("/api/account", accountRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/auth", authRouter);
app.use("/api/invitations", invitationsRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/skills-sync", skillsSyncRouter);
app.use("/api/workspace", workspaceRouter);
app.use("/api/version", versionRouter);
app.use("/api/triggers", triggersRouter);
app.use("/api/memory", memoryTreeApiRouter);  // Memory tree API (stats, recall, store, context)
app.use("/api/memory", memoryRouter);
app.use("/api/memory/tree", memoryTreeRouter);
app.use("/api/pairing", pairingRouter);
app.use("/api/openclaw-pairing", openClawPairingRouter);
app.use("/api/gateway-pairing", gatewayPairingRouter);
app.use("/api/page-pairing", pagePairingRouter);
app.use("/api/skills-update", skillsUpdateRouter);
app.use("/api/burnout", burnoutRouter);
app.use("/api/risk", riskRouter);
app.use("/api/growth-report", growthReportRouter);
app.use("/api/knowledge-base", knowledgeBaseRouter);
app.use("/api/chat/feedback", chatFeedbackRouter);
app.use("/api/learning", learningRouter);
app.use("/api/meeting", meetingRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/usage", usageRouter);
app.use("/api/seed", seedRouter);

if (process.env.NODE_ENV !== 'production') {
  /** 调试端点：查看对话统计状态 */
  app.get("/api/debug/stats", async (_req, res) => {
    const collector = getConversationStats();
    const reporter = getL2Reporter();

    res.json({
      conversationStats: collector?.getStatus() || null,
      l2Reporter: reporter ? {
        enabled: (reporter as any).config?.enabled,
        isRunning: (reporter as any).isRunning,
        queueSize: await (reporter as any).getQueueSize(),
        consecutiveFailures: (reporter as any).consecutiveFailures,
        lastFlushTime: (reporter as any).lastFlushTime,
      } : null,
      records: collector?.getAllStats() || [],
      aggregated: collector?.getAggregatedStats() || null,
    });
  });

  /** 调试端点：手动触发上报到L2 */
  app.post("/api/debug/stats/flush", async (_req, res) => {
    const reporter = getL2Reporter();
    if (!reporter) {
      return res.status(400).json({ ok: false, error: "L2 reporter not initialized" });
    }

    try {
      await (reporter as any).flush();
      res.json({ ok: true, message: "Flush triggered" });
    } catch (error) {
      res.status(500).json({ ok: false, error: String(error) });
    }
  });
}

// 容器化时由环境变量 CONSOLE_DIST 指定 Console 静态目录，BFF 托管前端
const consoleDist = process.env.CONSOLE_DIST;
if (consoleDist && existsSync(consoleDist)) {
  app.use(express.static(consoleDist));
  app.get("*", (_req, res) => {
    res.sendFile(join(consoleDist, "index.html"));
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "mineecho-bff" });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  logger.info(`MineEcho BFF running at http://127.0.0.1:${PORT}`);
});

// Track active timers for cleanup
const activeTimers: NodeJS.Timeout[] = [];
const activeIntervals: NodeJS.Timeout[] = [];

// Cleanup function for graceful shutdown
async function cleanup() {
  logger.info("[Shutdown] Cleaning up timers and server...");
  activeTimers.forEach(timer => clearTimeout(timer));
  activeIntervals.forEach(interval => clearInterval(interval));

  // Flush pending memory writes to prevent data loss
  try {
    await longTermMemoryManager.flush();
    logger.info("[Shutdown] Memory flush completed");
  } catch (error) {
    logger.error("[Shutdown] Failed to flush memory:", { error });
  }

  // Flush trajectory store
  try {
    await trajectoryStore.flush();
    logger.info("[Shutdown] Trajectory flush completed");
  } catch (error) {
    logger.error("[Shutdown] Failed to flush trajectories:", { error });
  }

  try {
    stopMemoryDreamScheduler();
    logger.info("[Shutdown] Dream scheduler stopped");
  } catch (error) {
    logger.error("[Shutdown] Failed to stop dream scheduler:", { error });
  }

  // Stop embedded Gateway child process
  try {
    await stopEmbeddedGateway();
    logger.info("[Shutdown] Gateway stopped");
  } catch (error) {
    logger.error("[Shutdown] Failed to stop gateway:", { error });
  }

  // LightRAG disabled (migrated to Wiki++ architecture)
  // try {
  //   await stopEmbeddedLightRAG();
  //   logger.info("[Shutdown] LightRAG stopped");
  // } catch (error) {
  //   logger.error("[Shutdown] Failed to stop LightRAG:", { error });
  // }
  // try {
  //   stopLightRAGIndexWorker();
  //   logger.info("[Shutdown] LightRAG index worker stopped");
  // } catch (error) {
  //   logger.error("[Shutdown] Failed to stop LightRAG index worker:", { error });
  // }

  server.close(() => {
    logger.info("[Shutdown] Server closed");
    process.exit(0);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Global uncaught exception handler — prevents process crash from unhandled errors
process.on('uncaughtException', (err) => {
  logger.error('[Process] Uncaught exception:', { error: err.message, stack: err.stack });
  cleanup();
});

// Global unhandled rejection handler — prevents crash from unhandled Promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Process] Unhandled rejection:', { reason: String(reason) });
  // Give logger a chance to flush before exit
  setTimeout(() => {
    cleanup();
  }, 500);
});

// Wrapper for setTimeout with error handling
function safeSetTimeout(callback: () => Promise<void> | void, delay: number): NodeJS.Timeout {
  const timer = setTimeout(async () => {
    try {
      await callback();
    } catch (error) {
      logger.error('[Timer] Uncaught error in setTimeout:', { error });
    }
  }, delay);
  activeTimers.push(timer);
  return timer;
}

// 自动同步技能（如果企业模式已配置）
safeSetTimeout(async () => {
  // 1. 同步企业下发技能（L2 → L3）
  const startupTaskId = `startup-${Date.now()}`;
  createSyncTask(startupTaskId);
  logger.info(`[Startup] 企业技能同步启动，taskId: ${startupTaskId}`);
  const skillResult = await syncSkillsFromEnterprise(undefined, startupTaskId);
  logger.info("[Startup] 企业技能同步完成:", skillResult);

  // 2. 同步所有已启用的 AI 应用到 Gateway Extensions 目录
  //    确保容器重启后不丢失 AI 应用对应的 skill 文件
  const appResult = await syncAllEnabledAiApps();
  logger.info("[Startup] AI 应用同步完成:", appResult);

  // 3. 安装 MineEcho 基础技能，确保开箱即可处理复杂任务入口
  try {
    const starterResult = await ensureStarterSkillsInstalled({ skillsDir: getMineEchoSkillsDir() });
    logger.info("[Startup] MineEcho 基础技能检查完成:", starterResult);
  } catch (error) {
    logger.warn("[Startup] MineEcho 基础技能安装失败:", { error });
  }

  // 4. 加载技能触发词索引（BFF 重启后自动加载）
  try {
    await loadSkillTriggersFromDisk();
    logger.info("[Startup] 技能触发词索引加载完成");
  } catch (error) {
    logger.warn("[Startup] 技能触发词索引加载失败:", { error });
  }

  // 5. 初始化通道管理器
  try {
    await channelManager.initialize();
    logger.info("[Startup] 通道管理器初始化完成");

    // 4.1 初始化种子数据
    try {
      const { seedInit } = await import("./seed/init.js");
      await seedInit();
      logger.info("[Startup] 种子数据初始化完成");
    } catch (seedError) {
      logger.warn("[Startup] 种子数据初始化失败:", { error: seedError });
    }

    // 启动定时技能更新检查
    startPeriodicUpdateCheck((result) => {
      if (result.hasUpdates) {
        logger.info(`[SkillsUpdate] 发现 ${result.updatableSkills} 个技能可更新`);
      }
    });
    logger.info("[Startup] 技能更新检查服务已启动");

    // 5. 启动 AI 后端：使用内嵌 Gateway
    try {
      const gatewayPort = parseInt(process.env.OPENCLAW_GATEWAY_PORT || "18789", 10);
      await startEmbeddedGateway(gatewayPort);
      logger.info("[Startup] 内嵌 Gateway 启动完成");
    } catch (gatewayError) {
      logger.error("[Startup] AI 后端启动失败:", { error: gatewayError });
    }

    // 6. LightRAG disabled (migrated to Wiki++ architecture)
    // try {
    //   const lightragPort = parseInt(process.env.LIGHTRAG_PORT || "3090", 10);
    //   await startEmbeddedLightRAG(lightragPort);
    //   logger.info("[Startup] LightRAG 启动完成");
    //   startLightRAGIndexWorker();
    //   logger.info("[Startup] LightRAG 索引队列 worker 已启动");
    // } catch (lightragError) {
    //   logger.error("[Startup] LightRAG 启动失败:", { error: lightragError });
    // }

    // 启动技能使用统计上报服务
    await startUsageReporter();
    logger.info("[Startup] 技能使用统计上报服务已启动");

    // 启动心跳服务（延迟启动，等待企业配置）
    setTimeout(() => {
      try {
        const { getEnterpriseConfig } = require("./account/client.js");
        const config = getEnterpriseConfig();
        if (config.userId) {
          startHeartbeat(config.userId, { version: "1.0.0", platform: "web" });
          logger.info("[Startup] 心跳服务已启动", { userId: config.userId });
        }
      } catch (error) {
        logger.debug("[Startup] 心跳服务启动延迟，等待企业配置");
      }
    }, 10000); // 延迟10秒，等待配置加载

    // 初始化对话统计收集器
    initConversationStats({ enabled: process.env.ENABLE_CONVERSATION_STATS !== "false" });
    logger.info("[Startup] 对话统计收集器已初始化");

    startMemoryDreamScheduler();
    logger.info("[Startup] 自动记忆整理服务已启动");

    // 启动 L2 统计上报服务（如果配置了 L2 Store）
    const enterpriseCfg = fetchEnterpriseConfig();
    if (enterpriseCfg.enabled && enterpriseCfg.storeUrl) {
      const l2Reporter = initL2Reporter({
        enabled: true,
        l2StoreUrl: enterpriseCfg.storeUrl,
        userId: enterpriseCfg.userId,
        userToken: enterpriseCfg.userToken,
        flushIntervalMs: 5 * 60 * 1000, // 5分钟
        batchSize: 50,
        queueDir: process.env.STATS_QUEUE_DIR || "/tmp/stats-queue"
      });
      await l2Reporter.start();
      logger.info("[Startup] L2 统计上报服务已启动");
    }

    // 加载通道配置并启动已启用的通道
    const channelsResponse = await fetch(`http://127.0.0.1:${PORT}/api/channels`);
    const channelsData = await channelsResponse.json();

    if (channelsData.channels) {
      await channelManager.reloadChannels(channelsData.channels);
      logger.info("[Startup] 通道配置加载完成");
    }
  } catch (error) {
    logger.error("[Startup] 通道管理器初始化失败:", { error });
  }
}, 500);

// Global error handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error('[Error]', { path: req.path, error: err.message });
  if (process.env.NODE_ENV === 'production') {
    return res.status(err.statusCode || 500).json({
      error: 'INTERNAL_ERROR',
      message: 'An internal error occurred'
    });
  }
  res.status(err.statusCode || 500).json({
    error: err.name || 'INTERNAL_ERROR',
    message: err.message
  });
});

// Export for potential async operations
export default app;
