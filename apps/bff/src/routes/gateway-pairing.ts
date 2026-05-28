import { Router } from "express";
import { gatewayPairingManager } from "../channels/gateway-pairing.js";

export const gatewayPairingRouter = Router();

// POST /api/gateway-pairing/command - 生成配对命令
gatewayPairingRouter.post("/command", async (req, res) => {
  try {
    const { channelId, userId } = req.body || {};

    if (!channelId || !userId) {
      return res.status(400).json({
        error: "channelId and userId are required"
      });
    }

    const result = await gatewayPairingManager.generatePairingCommand(channelId, userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/gateway-pairing/verify - 验证配对命令
gatewayPairingRouter.post("/verify", async (req, res) => {
  try {
    const { pairingToken, channelId, userId } = req.body || {};

    if (!pairingToken || !channelId || !userId) {
      return res.status(400).json({
        error: "pairingToken, channelId, and userId are required"
      });
    }

    const result = await gatewayPairingManager.verifyGatewayCommand(pairingToken, channelId, userId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/gateway-pairing/handle-command - 处理用户输入的命令
gatewayPairingRouter.post("/handle-command", async (req, res) => {
  try {
    const { channelId, userId, command } = req.body || {};

    if (!channelId || !userId || !command) {
      return res.status(400).json({
        error: "channelId, userId, and command are required"
      });
    }

    const result = await gatewayPairingManager.handleCommandInput(channelId, userId, command);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/gateway-pairing/status/:channelId/:userId - 获取配对状态
gatewayPairingRouter.get("/status/:channelId/:userId", async (req, res) => {
  try {
    const { channelId, userId } = req.params;

    const isPaired = await gatewayPairingManager.isUserPaired(channelId, userId);
    res.json({ paired: isPaired });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/gateway-pairing/instructions - 获取配对说明
gatewayPairingRouter.get("/instructions", async (_req, res) => {
  try {
    const instructions = gatewayPairingManager.getPairingInstructions();
    res.json({ instructions });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /api/gateway-pairing/pending - 获取待处理命令统计
gatewayPairingRouter.get("/pending", async (_req, res) => {
  try {
    const stats = gatewayPairingManager.getPendingCommandsStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /api/gateway-pairing/cleanup - 清理过期命令
gatewayPairingRouter.post("/cleanup", async (_req, res) => {
  try {
    gatewayPairingManager.cleanupExpiredCommands();
    const stats = gatewayPairingManager.getPendingCommandsStats();
    res.json({ message: "Cleanup completed", stats });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});