/**
 * Performance Metrics and Health Routes
 */

import { Router } from "express";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getAllCacheStats, clearAllCaches } from "../utils/cache.js";
import { isGatewayConfigured, isGatewayConnected, getGatewayUrl } from "../gateway/client.js";
import { getMineEchoHome } from "../utils/config-path.js";
import { getMetrics } from "../utils/metrics-collector.js";
import { getTokenJuiceMetrics } from "../tokenjuice/metrics.js";

export const metricsRouter = Router();

metricsRouter.get("/cache", (_req, res) => {
  try {
    res.json({ caches: getAllCacheStats(), timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

metricsRouter.get("/gateway", async (_req, res) => {
  try {
    res.json({
      configured: isGatewayConfigured(),
      connected:  await isGatewayConnected(),
      url:        isGatewayConfigured() ? getGatewayUrl() : null,
      timestamp:  new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

metricsRouter.get("/all", async (_req, res) => {
  try {
    res.json({
      cache:   getAllCacheStats(),
      tokenjuice: getTokenJuiceMetrics(),
      gateway: {
        configured: isGatewayConfigured(),
        connected:  await isGatewayConnected(),
      },
      memory: {
        used:   process.memoryUsage(),
        uptime: process.uptime(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

metricsRouter.get("/tokenjuice", (_req, res) => {
  try {
    res.json({
      code: 0,
      message: "success",
      data: getTokenJuiceMetrics(),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ code: 500, message: (e as Error).message, data: null });
  }
});

metricsRouter.post("/cache/clear", (_req, res) => {
  try {
    clearAllCaches();
    res.json({ ok: true, message: "All caches cleared" });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// 前端性能指标收集（持久化到磁盘，防止重启丢失）
const METRICS_FILE = join(getMineEchoHome(), "performance-metrics.json");
const MAX_METRICS = 1000;
let performanceMetrics: any[] = [];

async function loadPerformanceMetrics(): Promise<void> {
  try {
    if (existsSync(METRICS_FILE)) {
      const raw = await readFile(METRICS_FILE, "utf8");
      performanceMetrics = JSON.parse(raw);
    }
  } catch {
    performanceMetrics = [];
  }
}

async function savePerformanceMetrics(): Promise<void> {
  try {
    await writeFile(METRICS_FILE, JSON.stringify(performanceMetrics), "utf8");
  } catch {
    // ignore write errors
  }
}

// 启动时加载
loadPerformanceMetrics();

metricsRouter.post("/performance", (req, res) => {
  try {
    const { fcp, lcp, ttfb, url, timestamp } = req.body;
    performanceMetrics.push({
      fcp,
      lcp,
      ttfb,
      url,
      timestamp,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      receivedAt: new Date().toISOString(),
    });

    // 限制存储数量
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.shift();
    }

    // 异步持久化（不阻塞响应）
    savePerformanceMetrics().catch(() => {});

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

metricsRouter.get("/performance", (_req, res) => {
  try {
    // 计算平均值
    const avgFcp = performanceMetrics.length > 0
      ? Math.round(performanceMetrics.reduce((a, b) => a + b.fcp, 0) / performanceMetrics.length)
      : 0;
    const avgLcp = performanceMetrics.length > 0
      ? Math.round(performanceMetrics.reduce((a, b) => a + b.lcp, 0) / performanceMetrics.length)
      : 0;

    res.json({
      count: performanceMetrics.length,
      averages: { fcp: avgFcp, lcp: avgLcp },
      recent: performanceMetrics.slice(-50),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

metricsRouter.get("/requests", (_req, res) => {
  try {
    res.json({
      metrics: getMetrics(),
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
