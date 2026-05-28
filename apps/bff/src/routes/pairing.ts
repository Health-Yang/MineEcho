import { Router } from "express";
import { pairingManager } from "../channels/pairing-manager.js";

export const pairingRouter = Router();

// GET /api/pairing/stats - 获取配对统计信息
pairingRouter.get("/stats", async (_req, res) => {
  try {
    const stats = pairingManager.getStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/pairing/manual - 管理员手动配对
pairingRouter.post("/manual", async (req, res) => {
  try {
    const { channelId, userId } = req.body || {};

    if (!channelId || !userId) {
      return res.status(400).json({ error: "channelId and userId are required" });
    }

    const result = await pairingManager.manualPair(channelId, userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/pairing/revoke - 管理员撤销配对
pairingRouter.post("/revoke", async (req, res) => {
  try {
    const { channelId, userId } = req.body || {};

    if (!channelId || !userId) {
      return res.status(400).json({ error: "channelId and userId are required" });
    }

    const result = await pairingManager.revokePairing(channelId, userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/pairing/cleanup - 清理过期会话
pairingRouter.post("/cleanup", async (_req, res) => {
  try {
    pairingManager.cleanupExpiredSessions();
    const stats = pairingManager.getStats();
    res.json({ message: "Cleanup completed", stats });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});