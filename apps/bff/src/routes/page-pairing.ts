import { Router } from "express";
import { pagePairingManager } from "../channels/page-pairing.js";

export const pagePairingRouter = Router();

// POST /api/page-pairing/generate - 生成配对码
pagePairingRouter.post("/generate", async (req, res) => {
  try {
    const { channelId, userId } = req.body || {};

    if (!channelId || !userId) {
      return res.status(400).json({
        error: "channelId and userId are required"
      });
    }

    const result = await pagePairingManager.generatePairingCode(channelId, userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/page-pairing/verify - 验证配对码
pagePairingRouter.post("/verify", async (req, res) => {
  try {
    const { channelId, userId, pairingCode, userName } = req.body || {};

    if (!channelId || !userId || !pairingCode) {
      return res.status(400).json({
        error: "channelId, userId, and pairingCode are required"
      });
    }

    const result = await pagePairingManager.verifyPairingCode({
      channelId,
      userId,
      pairingCode,
      userName
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/page-pairing/status/:channelId/:userId - 获取配对状态
pagePairingRouter.get("/status/:channelId/:userId", async (req, res) => {
  try {
    const { channelId, userId } = req.params;

    const isPaired = await pagePairingManager.isUserPaired(channelId, userId);
    res.json({ paired: isPaired });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/page-pairing/instructions - 获取配对说明
pagePairingRouter.get("/instructions", async (_req, res) => {
  try {
    const instructions = pagePairingManager.getPairingInstructions();
    res.json({ instructions });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/page-pairing/stats - 获取配对统计
pagePairingRouter.get("/stats", async (_req, res) => {
  try {
    const stats = await pagePairingManager.getPairingStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});