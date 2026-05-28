import { Router } from "express";
import { getMineEchoHome } from "../utils/config-path.js";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { credentialManager, type ChannelCredentials } from "../utils/credential-manager.js";

export const channelsRouter = Router();

interface Channel {
  id: string;
  name: string;
  enabled: boolean;
  icon: string;
  description: string;
  type: 'web' | 'feishu' | 'wework' | 'dingtalk';
  config?: Record<string, unknown>;

  // 安全配置
  security?: {
    dmPolicy: 'pairing' | 'allowlist' | 'open' | 'disabled';
    allowFrom: string[];
  };

  // 平台凭证（加密存储）
  credentials?: {
    appId?: string;
    appSecret?: string;
    corpId?: string;
    agentId?: string;
    encryptKey?: string;
    verificationToken?: string;
  };

  // 连接状态
  status?: {
    connected: boolean;
    lastSeen?: string;
    quality: 'excellent' | 'good' | 'poor' | 'disconnected';
    errorMessage?: string;
  };

  // 健康功能配置
  healthFeatures?: {
    alertForwarding: boolean;
    emergencyNotifications: boolean;
  };
}

const defaultChannels: Channel[] = [
  {
    id: "web",
    name: "Web 聊天",
    enabled: true,
    icon: "🌐",
    description: "当前控制台内置聊天",
    type: "web",
    security: { dmPolicy: "open", allowFrom: [] },
    status: { connected: true, quality: "excellent" },
    healthFeatures: { alertForwarding: true, emergencyNotifications: true }
  },
  {
    id: "feishu",
    name: "飞书",
    enabled: false,
    icon: "📋",
    description: "飞书 / Lark 消息",
    type: "feishu",
    security: { dmPolicy: "pairing", allowFrom: [] },
    credentials: {},
    status: { connected: false, quality: "disconnected" },
    healthFeatures: { alertForwarding: false, emergencyNotifications: false }
  },
  {
    id: "wework",
    name: "企业微信",
    enabled: false,
    icon: "💼",
    description: "企业微信消息",
    type: "wework",
    security: { dmPolicy: "allowlist", allowFrom: [] },
    credentials: {},
    status: { connected: false, quality: "disconnected" },
    healthFeatures: { alertForwarding: false, emergencyNotifications: false }
  },
  {
    id: "dingtalk",
    name: "钉钉",
    enabled: false,
    icon: "💬",
    description: "钉钉工作台消息",
    type: "dingtalk",
    security: { dmPolicy: "allowlist", allowFrom: [] },
    credentials: {},
    status: { connected: false, quality: "disconnected" },
    healthFeatures: { alertForwarding: false, emergencyNotifications: false }
  },
];

async function loadChannels(): Promise<Channel[]> {
  const mineechoHome = getMineEchoHome();
  const filePath = join(mineechoHome, "channels.json");

  try {
    const data = await readFile(filePath, "utf8");
    const saved = JSON.parse(data).channels as Channel[];
    // Merge saved enabled/config over defaults
    return defaultChannels.map((d) => {
      const s = saved.find((c) => c.id === d.id);
      return s ? { ...d, enabled: s.enabled, config: s.config } : d;
    });
  } catch {
    // Return defaults if file doesn't exist or is invalid
    return defaultChannels;
  }
}

async function saveChannels(channels: Channel[]): Promise<void> {
  const mineechoHome = getMineEchoHome();
  await mkdir(mineechoHome, { recursive: true });
  const filePath = join(mineechoHome, "channels.json");
  await writeFile(filePath, JSON.stringify({ channels }, null, 2), "utf8");
}

// GET / - returns all channels
channelsRouter.get("/", async (_req, res) => {
  try {
    const channels = await loadChannels();
    res.json({ channels });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /:id - returns single channel by id
channelsRouter.get("/:id", async (req, res) => {
  try {
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: "channel not found" });
    }
    res.json(channel);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// PATCH /:id - updates channel enabled/config
channelsRouter.patch("/:id", async (req, res) => {
  try {
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: "channel not found" });
    }

    const { enabled, config } = req.body || {};
    if (typeof enabled === "boolean") {
      channel.enabled = enabled;
    }
    if (config && typeof config === "object") {
      channel.config = { ...channel.config, ...config };
    }

    await saveChannels(channels);
    res.json(channel);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /:id/configure - configure channel credentials and settings
channelsRouter.post("/:id/configure", async (req, res) => {
  try {
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: "channel not found" });
    }

    const { credentials, security, healthFeatures } = req.body || {};

    // 验证凭证格式
    if (credentials && channel.type !== 'web') {
      const validation = credentialManager.validateCredentials(credentials, channel.type as 'feishu' | 'wework' | 'dingtalk');
      if (!validation.valid) {
        return res.status(400).json({ error: "Invalid credentials", details: validation.errors });
      }

      // 加密存储凭证
      const encryptedCredentials = await credentialManager.storeCredentials(channel.id, credentials);
      channel.credentials = encryptedCredentials as any;
    }

    // 更新安全配置
    if (security && typeof security === "object") {
      channel.security = { ...channel.security, ...security };
    }

    // 更新健康功能配置
    if (healthFeatures && typeof healthFeatures === "object") {
      channel.healthFeatures = { ...channel.healthFeatures, ...healthFeatures };
    }

    await saveChannels(channels);

    // 返回清理后的凭证信息
    const responseChannel = { ...channel };
    if (responseChannel.credentials) {
      responseChannel.credentials = credentialManager.sanitizeCredentials(responseChannel.credentials as any);
    }

    res.json(responseChannel);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /:id/test - test channel connection
channelsRouter.post("/:id/test", async (req, res) => {
  try {
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: "channel not found" });
    }

    // 模拟连接测试（实际实现需要具体的平台 SDK）
    const testResult = await testChannelConnection(channel);

    res.json({
      channelId: channel.id,
      success: testResult.success,
      message: testResult.message,
      details: testResult.details,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// GET /:id/status - get real-time channel status
channelsRouter.get("/:id/status", async (req, res) => {
  try {
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: "channel not found" });
    }

    // 获取实时状态（实际实现需要查询连接管理器）
    const status = await getChannelRealtimeStatus(channel);

    res.json({
      channelId: channel.id,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /:id/connect - establish channel connection
channelsRouter.post("/:id/connect", async (req, res) => {
  try {
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: "channel not found" });
    }

    if (!channel.enabled) {
      return res.status(400).json({ error: "Channel is disabled" });
    }

    // 建立连接（实际实现需要通道管理器）
    const connectResult = await connectChannel(channel);

    // 更新状态
    channel.status = {
      connected: connectResult.success,
      lastSeen: new Date().toISOString(),
      quality: connectResult.success ? 'good' : 'disconnected',
      errorMessage: connectResult.success ? undefined : connectResult.message
    };

    await saveChannels(channels);

    res.json({
      channelId: channel.id,
      success: connectResult.success,
      message: connectResult.message,
      status: channel.status
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// POST /:id/disconnect - disconnect channel
channelsRouter.post("/:id/disconnect", async (req, res) => {
  try {
    const channels = await loadChannels();
    const channel = channels.find((c) => c.id === req.params.id);
    if (!channel) {
      return res.status(404).json({ error: "channel not found" });
    }

    // 断开连接
    const disconnectResult = await disconnectChannel(channel);

    // 更新状态
    channel.status = {
      connected: false,
      lastSeen: new Date().toISOString(),
      quality: 'disconnected',
      errorMessage: undefined
    };

    await saveChannels(channels);

    res.json({
      channelId: channel.id,
      success: disconnectResult.success,
      message: disconnectResult.message,
      status: channel.status
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// 辅助函数：测试通道连接
export async function testChannelConnection(channel: Channel): Promise<{ success: boolean; message: string; details?: any }> {
  // 根据通道类型进行不同的测试
  switch (channel.type) {
    case 'web':
      return { success: true, message: 'Web 通道始终可用' };

    case 'feishu':
      // 飞书连接测试
      if (!channel.credentials || !(channel.credentials as any).appId) {
        return { success: false, message: '飞书应用凭证未配置' };
      }
      return { success: false, message: '飞书通道仍是实验功能，尚未接入真实连接测试适配器' };

    case 'wework':
      // 企业微信连接测试
      if (!channel.credentials || !(channel.credentials as any).corpId) {
        return { success: false, message: '企业微信配置未完成' };
      }
      return { success: false, message: '企业微信通道仍是实验功能，尚未接入真实连接测试适配器' };

    case 'dingtalk':
      // 钉钉连接测试
      if (!channel.credentials || !(channel.credentials as any).appId) {
        return { success: false, message: '钉钉应用配置未完成' };
      }
      return { success: false, message: '钉钉通道仍是实验功能，尚未接入真实连接测试适配器' };

    default:
      return { success: false, message: '不支持的通道类型' };
  }
}

// 辅助函数：获取通道实时状态
async function getChannelRealtimeStatus(channel: Channel): Promise<any> {
  // 返回当前存储的状态（实际实现应该查询连接管理器）
  return channel.status || {
    connected: false,
    quality: 'disconnected',
    errorMessage: '状态未初始化'
  };
}

// 辅助函数：建立通道连接
export async function connectChannel(channel: Channel): Promise<{ success: boolean; message: string }> {
  // 根据通道类型建立连接
  switch (channel.type) {
    case 'web':
      return { success: true, message: 'Web 通道已就绪' };

    case 'feishu':
      return { success: false, message: '飞书通道仍是实验功能，尚未接入真实连接适配器' };

    case 'wework':
      return { success: false, message: '企业微信通道仍是实验功能，尚未接入真实连接适配器' };

    default:
      return { success: false, message: '不支持的通道类型' };
  }
}

// 辅助函数：断开通道连接
export async function disconnectChannel(channel: Channel): Promise<{ success: boolean; message: string }> {
  // 根据通道类型断开连接
  switch (channel.type) {
    case 'web':
      return { success: true, message: 'Web 通道无需断开' };

    case 'feishu':
      return { success: true, message: '飞书实验通道未建立真实连接，无需断开' };

    case 'wework':
      return { success: true, message: '企业微信实验通道未建立真实连接，无需断开' };

    default:
      return { success: false, message: '不支持的通道类型' };
  }
}
