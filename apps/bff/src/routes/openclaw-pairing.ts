import { Router } from "express";
import { openClawPairingManager } from "../channels/openclaw-pairing.js";

export const openClawPairingRouter = Router();

// POST /api/openclaw-pairing/verify - 验证配对码
openClawPairingRouter.post("/verify", async (req, res) => {
  try {
    const { channelId, userId, pairingCode, userName } = req.body || {};

    if (!channelId || !userId || !pairingCode) {
      return res.status(400).json({
        error: "channelId, userId, and pairingCode are required"
      });
    }

    const result = await openClawPairingManager.handlePairingRequest({
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

// GET /api/openclaw-pairing/status/:channelId/:userId - 获取配对状态
openClawPairingRouter.get("/status/:channelId/:userId", async (req, res) => {
  try {
    const { channelId, userId } = req.params;

    const status = await openClawPairingManager.getPairingStatus(channelId, userId);
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/openclaw-pairing/instructions - 获取配对说明
openClawPairingRouter.get("/instructions", async (_req, res) => {
  try {
    const instructions = openClawPairingManager.getPairingInstructions();
    res.json({ instructions });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/openclaw-pairing/test - 测试配对码验证
openClawPairingRouter.post("/test", async (req, res) => {
  try {
    const { pairingCode } = req.body || {};

    if (!pairingCode) {
      return res.status(400).json({ error: "pairingCode is required" });
    }

    const validation = await openClawPairingManager.validatePairingCode(pairingCode);
    res.json(validation);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});