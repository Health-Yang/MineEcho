import { logger } from "../../utils/logger.js";
import { FeishuClient, type FeishuConfig } from './client.js';
import { FeishuMessageHandler, type ProcessedMessage, type HealthAlert } from './message-handler.js';
export interface ChannelConfig {
  id: string;
  name: string;
  type: 'feishu';
  enabled: boolean;
  credentials: FeishuConfig;
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
  (message: ProcessedMessage): Promise<void>;
}

export class FeishuChannel {
  private client: FeishuClient;
  private messageHandler: FeishuMessageHandler;
  private config: ChannelConfig;
  private status: ChannelStatus;
  private messageHandlers: MessageHandler[] = [];
  private isInitialized = false;

  constructor(config: ChannelConfig) {
    this.config = config;
    this.client = new FeishuClient(config.credentials);
    this.messageHandler = new FeishuMessageHandler();
    this.status = {
      connected: false,
      quality: 'disconnected',
      stats: {
        messagesReceived: 0,
        messagesSent: 0
      }
    };

    this.setupEventHandlers();
  }

  /**
   * 初始化通道
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('[FeishuChannel] Already initialized');
      return;
    }

    try {
      // 验证凭证
      if (!this.config.credentials.appId || !this.config.credentials.appSecret) {
        throw new Error('飞书应用凭证未配置');
      }

      // 测试连接
      await this.client.getAccessToken();

      this.isInitialized = true;
      logger.info(`[FeishuChannel] Initialized successfully: ${this.config.id}`);
    } catch (error) {
      logger.error('[FeishuChannel] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 启动通道连接
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.client.connect();
      this.status.connected = true;
      this.status.quality = 'good';
      this.status.errorMessage = undefined;
      this.status.lastSeen = new Date().toISOString();

      logger.info(`[FeishuChannel] Started: ${this.config.id}`);
    } catch (error) {
      this.status.connected = false;
      this.status.quality = 'disconnected';
      this.status.errorMessage = (error as Error).message;

      logger.error('[FeishuChannel] Start failed:', error);
      throw error;
    }
  }

  /**
   * 停止通道连接
   */
  async stop(): Promise<void> {
    try {
      await this.client.disconnect();
      this.status.connected = false;
      this.status.quality = 'disconnected';
      this.status.lastSeen = new Date().toISOString();

      logger.info(`[FeishuChannel] Stopped: ${this.config.id}`);
    } catch (error) {
      logger.error('[FeishuChannel] Stop failed:', error);
      throw error;
    }
  }

  /**
   * 发送消息
   */
  async sendMessage(target: string, content: string): Promise<void> {
    if (!this.status.connected) {
      throw new Error('Channel is not connected');
    }

    try {
      await this.client.sendMessage(target, content);

      this.status.stats.messagesSent++;
      this.status.stats.lastActivity = new Date().toISOString();
      this.status.lastSeen = new Date().toISOString();

      logger.info(`[FeishuChannel] Message sent to ${target}`);
    } catch (error) {
      logger.error('[FeishuChannel] Send message failed:', error);
      throw error;
    }
  }

  /**
   * 发送卡片消息
   */
  async sendCard(target: string, card: any): Promise<void> {
    if (!this.status.connected) {
      throw new Error('Channel is not connected');
    }

    try {
      await this.client.sendCard(target, card);

      this.status.stats.messagesSent++;
      this.status.stats.lastActivity = new Date().toISOString();
      this.status.lastSeen = new Date().toISOString();

      logger.info(`[FeishuChannel] Card sent to ${target}`);
    } catch (error) {
      logger.error('[FeishuChannel] Send card failed:', error);
      throw error;
    }
  }

  /**
   * 发送健康警报
   */
  async sendHealthAlert(target: string, alert: HealthAlert): Promise<void> {
    if (!this.config.healthFeatures.alertForwarding) {
      logger.info('[FeishuChannel] Health alert forwarding is disabled');
      return;
    }

    const card = this.messageHandler.buildHealthAlertCard(alert);
    await this.sendCard(target, card);
  }

  /**
   * 发送紧急通知
   */
  async sendEmergencyNotification(target: string, alert: HealthAlert): Promise<void> {
    if (!this.config.healthFeatures.emergencyNotifications) {
      logger.info('[FeishuChannel] Emergency notifications are disabled');
      return;
    }

    const card = this.messageHandler.buildEmergencyCard(alert);
    await this.sendCard(target, card);
  }

  /**
   * 注册消息处理器
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * 获取通道状态
   */
  getStatus(): ChannelStatus {
    const connectionStatus = this.client.getConnectionStatus();

    return {
      ...this.status,
      connected: connectionStatus.connected,
      quality: this.calculateConnectionQuality(connectionStatus.connected, connectionStatus.reconnectAttempts)
    };
  }

  /**
   * 获取通道配置信息（清理敏感数据）
   */
  getChannelInfo(): any {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type,
      enabled: this.config.enabled,
      security: this.config.security,
      healthFeatures: this.config.healthFeatures,
      status: this.getStatus()
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ChannelConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 如果凭证更新，重新初始化客户端
    if (newConfig.credentials) {
      this.client = new FeishuClient(this.config.credentials);
      this.setupEventHandlers();
      this.isInitialized = false;
    }
  }

  private setupEventHandlers(): void {
    // 注册消息处理器
    this.client.onMessage(async (feishuMessage) => {
      try {
        const processedMessage = await this.messageHandler.handleIncoming(feishuMessage);

        this.status.stats.messagesReceived++;
        this.status.stats.lastActivity = new Date().toISOString();
        this.status.lastSeen = new Date().toISOString();

        // 通知所有注册的处理器
        for (const handler of this.messageHandlers) {
          try {
            await handler(processedMessage);
          } catch (error) {
            logger.error('[FeishuChannel] Message handler error:', error);
          }
        }
      } catch (error) {
        logger.error('[FeishuChannel] Message processing failed:', error);
      }
    });

    // 注册连接状态处理器
    this.client.onConnect(() => {
      this.status.connected = true;
      this.status.quality = 'good';
      this.status.errorMessage = undefined;
      this.status.lastSeen = new Date().toISOString();
      logger.info(`[FeishuChannel] Connected: ${this.config.id}`);
    });

    this.client.onDisconnect(() => {
      this.status.connected = false;
      this.status.quality = 'disconnected';
      this.status.lastSeen = new Date().toISOString();
      logger.info(`[FeishuChannel] Disconnected: ${this.config.id}`);
    });
  }

  private calculateConnectionQuality(connected: boolean, reconnectAttempts: number): ChannelStatus['quality'] {
    if (!connected) return 'disconnected';
    if (reconnectAttempts === 0) return 'excellent';
    if (reconnectAttempts <= 2) return 'good';
    return 'poor';
  }
}