import { logger } from "../utils/logger.js";
import { FeishuChannel } from './feishu/index.js';
import { WeWorkChannel } from './wework/index.js';
export interface ChannelConfig {
  id: string;
  name: string;
  type: 'feishu' | 'wework' | 'dingtalk' | 'web';
  enabled: boolean;
  credentials: any;
  security: {
    dmPolicy: 'pairing' | 'allowlist' | 'open' | 'disabled';
    allowFrom: string[];
  };
  healthFeatures: {
    alertForwarding: boolean;
    emergencyNotifications: boolean;
  };
}

export interface ChannelStatus {
  connected: boolean;
  lastSeen?: string;
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  errorMessage?: string;
  stats: {
    messagesReceived: number;
    messagesSent: number;
    lastActivity?: string;
  };
}

export interface MessageHandler {
  (channelId: string, message: any): Promise<void>;
}

export interface ChannelInstance {
  id: string;
  type: string;
  channel: FeishuChannel | WeWorkChannel;
  config: ChannelConfig;
  status: ChannelStatus;
}

export class ChannelManager {
  private channels: Map<string, ChannelInstance> = new Map();
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private isInitialized = false;

  /**
   * 初始化通道管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('[ChannelManager] Already initialized');
      return;
    }

    logger.info('[ChannelManager] Initializing...');
    this.isInitialized = true;
  }

  /**
   * 注册通道
   */
  async registerChannel(config: ChannelConfig): Promise<void> {
    if (!config.enabled) {
      logger.info(`[ChannelManager] Channel ${config.id} is disabled, skipping registration`);
      return;
    }

    try {
      let channelInstance: FeishuChannel | WeWorkChannel;

      switch (config.type) {
        case 'feishu':
          channelInstance = new FeishuChannel(config as any);
          break;

        case 'wework':
          channelInstance = new WeWorkChannel(config as any);
          break;

        case 'web':
          // Web 通道是虚拟的，不需要实际的客户端
          logger.info(`[ChannelManager] Web channel registered: ${config.id}`);
          return;

        default:
          throw new Error(`Unsupported channel type: ${config.type}`);
      }

      // 初始化通道
      await channelInstance.initialize();

      // 注册消息处理器
      channelInstance.onMessage(async (message) => {
        await this.handleIncomingMessage(config.id, message);
      });

      // 存储通道实例
      this.channels.set(config.id, {
        id: config.id,
        type: config.type,
        channel: channelInstance,
        config,
        status: channelInstance.getStatus()
      });

      logger.info(`[ChannelManager] Channel registered: ${config.id} (${config.type})`);
    } catch (error) {
      logger.error(`[ChannelManager] Failed to register channel ${config.id}:`, error);
      throw error;
    }
  }

  /**
   * 注销通道
   */
  async unregisterChannel(channelId: string): Promise<void> {
    const instance = this.channels.get(channelId);
    if (!instance) {
      logger.info(`[ChannelManager] Channel ${channelId} not found`);
      return;
    }

    try {
      // 停止通道
      await instance.channel.stop();

      // 移除通道实例
      this.channels.delete(channelId);

      // 清理消息处理器
      this.messageHandlers.delete(channelId);

      logger.info(`[ChannelManager] Channel unregistered: ${channelId}`);
    } catch (error) {
      logger.error(`[ChannelManager] Failed to unregister channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * 启动通道
   */
  async startChannel(channelId: string): Promise<void> {
    const instance = this.channels.get(channelId);
    if (!instance) {
      throw new Error(`Channel ${channelId} not found`);
    }

    try {
      await instance.channel.start();
      instance.status = instance.channel.getStatus();

      logger.info(`[ChannelManager] Channel started: ${channelId}`);
    } catch (error) {
      logger.error(`[ChannelManager] Failed to start channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * 停止通道
   */
  async stopChannel(channelId: string): Promise<void> {
    const instance = this.channels.get(channelId);
    if (!instance) {
      throw new Error(`Channel ${channelId} not found`);
    }

    try {
      await instance.channel.stop();
      instance.status = instance.channel.getStatus();

      logger.info(`[ChannelManager] Channel stopped: ${channelId}`);
    } catch (error) {
      logger.error(`[ChannelManager] Failed to stop channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * 发送消息到指定通道
   */
  async routeMessage(channelId: string, target: string, content: string): Promise<void> {
    const instance = this.channels.get(channelId);
    if (!instance) {
      throw new Error(`Channel ${channelId} not found`);
    }

    if (!instance.status.connected) {
      throw new Error(`Channel ${channelId} is not connected`);
    }

    try {
      await instance.channel.sendMessage(target, content);

      // 更新统计信息
      instance.status.stats.messagesSent++;
      instance.status.stats.lastActivity = new Date().toISOString();

      logger.info(`[ChannelManager] Message routed to ${channelId}: ${target}`);
    } catch (error) {
      logger.error(`[ChannelManager] Failed to route message to ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * 注册消息处理器
   */
  onMessage(channelId: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(channelId)) {
      this.messageHandlers.set(channelId, []);
    }
    this.messageHandlers.get(channelId)!.push(handler);
  }

  /**
   * 获取通道状态
   */
  getChannelStatus(channelId: string): ChannelStatus | null {
    const instance = this.channels.get(channelId);
    if (!instance) {
      return null;
    }

    // 更新状态
    instance.status = instance.channel.getStatus();
    return instance.status;
  }

  /**
   * 获取所有通道状态
   */
  getAllChannels(): Array<{
    id: string;
    type: string;
    config: ChannelConfig;
    status: ChannelStatus;
  }> {
    const result: Array<{
      id: string;
      type: string;
      config: ChannelConfig;
      status: ChannelStatus;
    }> = [];

    for (const instance of this.channels.values()) {
      // 更新状态
      instance.status = instance.channel.getStatus();

      result.push({
        id: instance.id,
        type: instance.type,
        config: instance.config,
        status: instance.status
      });
    }

    return result;
  }

  /**
   * 获取通道实例
   */
  getChannelInstance(channelId: string): ChannelInstance | null {
    return this.channels.get(channelId) || null;
  }

  /**
   * 处理接收到的消息
   */
  private async handleIncomingMessage(channelId: string, message: any): Promise<void> {
    logger.info(`[ChannelManager] Incoming message from ${channelId}:`, message);

    // 更新统计信息
    const instance = this.channels.get(channelId);
    if (instance) {
      instance.status.stats.messagesReceived++;
      instance.status.stats.lastActivity = new Date().toISOString();
    }

    // 通知所有注册的处理器
    const handlers = this.messageHandlers.get(channelId) || [];
    for (const handler of handlers) {
      try {
        await handler(channelId, message);
      } catch (error) {
        logger.error(`[ChannelManager] Message handler error for ${channelId}:`, error);
      }
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    totalChannels: number;
    connectedChannels: number;
    channels: Array<{ id: string; connected: boolean; quality: string }>;
  }> {
    const channels = [];

    for (const instance of this.channels.values()) {
      const status = instance.channel.getStatus();
      channels.push({
        id: instance.id,
        connected: status.connected,
        quality: status.quality
      });
    }

    return {
      totalChannels: this.channels.size,
      connectedChannels: channels.filter(c => c.connected).length,
      channels
    };
  }

  /**
   * 重新加载所有通道配置
   */
  async reloadChannels(channelConfigs: ChannelConfig[]): Promise<void> {
    logger.info('[ChannelManager] Reloading all channels...');

    // 停止并移除现有通道
    for (const instance of this.channels.values()) {
      try {
        await instance.channel.stop();
      } catch (error) {
        logger.error(`[ChannelManager] Failed to stop channel ${instance.id}:`, error);
      }
    }
    this.channels.clear();
    this.messageHandlers.clear();

    // 重新注册通道
    for (const config of channelConfigs) {
      if (config.enabled) {
        try {
          await this.registerChannel(config);
          // Web 通道是虚拟的，不需要启动
          if (config.type !== 'web') {
            await this.startChannel(config.id);
          }
        } catch (error) {
          logger.error(`[ChannelManager] Failed to register channel ${config.id}:`, error);
        }
      }
    }

    logger.info('[ChannelManager] Channels reloaded');
  }
}

// 导出单例实例
export const channelManager = new ChannelManager();