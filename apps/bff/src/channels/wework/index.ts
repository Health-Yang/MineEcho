import { logger } from "../../utils/logger.js";
import { WeWorkClient, type WeWorkConfig } from './client.js';
import { WeWorkMessageHandler, type ProcessedMessage, type HealthAlert } from './message-handler.js';
export interface ChannelConfig {
  id: string;
  name: string;
  type: 'wework';
  enabled: boolean;
  credentials: WeWorkConfig;
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

export class WeWorkChannel {
  private client: WeWorkClient;
  private messageHandler: WeWorkMessageHandler;
  private config: ChannelConfig;
  private status: ChannelStatus;
  private messageHandlers: MessageHandler[] = [];
  private isInitialized = false;

  constructor(config: ChannelConfig) {
    this.config = config;
    this.client = new WeWorkClient(config.credentials);
    this.messageHandler = new WeWorkMessageHandler();
    this.status = {
      connected: false,
      quality: 'disconnected',
      stats: {
        messagesReceived: 0,
        messagesSent: 0
      }
    };
  }

  /**
   * 初始化通道
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('[WeWorkChannel] Already initialized');
      return;
    }

    try {
      // 验证凭证
      if (!this.config.credentials.corpId || !this.config.credentials.agentId || !this.config.credentials.appSecret) {
        throw new Error('企业微信配置未完成');
      }

      // 测试连接
      await this.client.getAccessToken();

      // 设置回调 URL（如果配置了）
      if (this.config.credentials.callbackUrl && this.config.credentials.callbackToken) {
        await this.client.setupCallback(
          this.config.credentials.callbackUrl,
          this.config.credentials.callbackToken
        );
      }

      this.isInitialized = true;
      logger.info(`[WeWorkChannel] Initialized successfully: ${this.config.id}`);
    } catch (error) {
      logger.error('[WeWorkChannel] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 启动通道（企业微信是被动的，主要设置回调）
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 验证应用配置
      const agentInfo = await this.client.getAgentList();
      logger.info(`[WeWorkChannel] Agent info:`, agentInfo);

      this.status.connected = true;
      this.status.quality = 'good';
      this.status.errorMessage = undefined;
      this.status.lastSeen = new Date().toISOString();

      logger.info(`[WeWorkChannel] Started: ${this.config.id}`);
    } catch (error) {
      this.status.connected = false;
      this.status.quality = 'disconnected';
      this.status.errorMessage = (error as Error).message;

      logger.error('[WeWorkChannel] Start failed:', error);
      throw error;
    }
  }

  /**
   * 停止通道
   */
  async stop(): Promise<void> {
    this.status.connected = false;
    this.status.quality = 'disconnected';
    this.status.lastSeen = new Date().toISOString();

    logger.info(`[WeWorkChannel] Stopped: ${this.config.id}`);
  }

  /**
   * 发送文本消息
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

      logger.info(`[WeWorkChannel] Message sent to ${target}`);
    } catch (error) {
      logger.error('[WeWorkChannel] Send message failed:', error);
      throw error;
    }
  }

  /**
   * 发送图文消息
   */
  async sendNewsMessage(target: string, articles: any[]): Promise<void> {
    if (!this.status.connected) {
      throw new Error('Channel is not connected');
    }

    try {
      await this.client.sendNewsMessage(target, articles);

      this.status.stats.messagesSent++;
      this.status.stats.lastActivity = new Date().toISOString();
      this.status.lastSeen = new Date().toISOString();

      logger.info(`[WeWorkChannel] News message sent to ${target}`);
    } catch (error) {
      logger.error('[WeWorkChannel] Send news message failed:', error);
      throw error;
    }
  }

  /**
   * 发送 Markdown 消息
   */
  async sendMarkdownMessage(target: string, content: string): Promise<void> {
    if (!this.status.connected) {
      throw new Error('Channel is not connected');
    }

    try {
      await this.client.sendMarkdownMessage(target, content);

      this.status.stats.messagesSent++;
      this.status.stats.lastActivity = new Date().toISOString();
      this.status.lastSeen = new Date().toISOString();

      logger.info(`[WeWorkChannel] Markdown message sent to ${target}`);
    } catch (error) {
      logger.error('[WeWorkChannel] Send markdown message failed:', error);
      throw error;
    }
  }

  /**
   * 发送健康警报
   */
  async sendHealthAlert(target: string, alert: HealthAlert): Promise<void> {
    if (!this.config.healthFeatures.alertForwarding) {
      logger.info('[WeWorkChannel] Health alert forwarding is disabled');
      return;
    }

    // 优先使用图文消息，如果失败则使用 Markdown
    try {
      const articles = this.messageHandler.buildNewsMessage(alert);
      await this.sendNewsMessage(target, articles);
    } catch (error) {
      logger.warn('[WeWorkChannel] News message failed, trying markdown:', error);
      const markdown = this.messageHandler.buildMarkdownMessage(alert);
      await this.sendMarkdownMessage(target, markdown);
    }
  }

  /**
   * 发送紧急通知
   */
  async sendEmergencyNotification(target: string, alert: HealthAlert): Promise<void> {
    if (!this.config.healthFeatures.emergencyNotifications) {
      logger.info('[WeWorkChannel] Emergency notifications are disabled');
      return;
    }

    const message = this.messageHandler.buildEmergencyMessage(alert);
    await this.sendMessage(target, message);
  }

  /**
   * 处理接收到的消息（从回调调用）
   */
  async handleIncomingMessage(xmlData: string): Promise<void> {
    try {
      // 验证签名（如果配置了）
      if (this.config.credentials.callbackToken) {
        // TODO: 在实际调用前验证签名
      }

      const message = this.messageHandler.parseIncomingMessage(xmlData);
      const processedMessage = await this.messageHandler.handleIncoming(message);

      this.status.stats.messagesReceived++;
      this.status.stats.lastActivity = new Date().toISOString();
      this.status.lastSeen = new Date().toISOString();

      // 通知所有注册的处理器
      for (const handler of this.messageHandlers) {
        try {
          await handler(processedMessage);
        } catch (error) {
          logger.error('[WeWorkChannel] Message handler error:', error);
        }
      }
    } catch (error) {
      logger.error('[WeWorkChannel] Message processing failed:', error);
    }
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
    return { ...this.status };
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
      status: this.getStatus(),
      callbackUrl: this.config.credentials.callbackUrl
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ChannelConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // 如果凭证更新，重新初始化客户端
    if (newConfig.credentials) {
      this.client = new WeWorkClient(this.config.credentials);
      this.isInitialized = false;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<any> {
    return await this.client.getUserInfo(userId);
  }

  /**
   * 获取部门成员
   */
  async getDepartmentUsers(departmentId?: number): Promise<any[]> {
    return await this.client.getDepartmentUsers(departmentId);
  }
}