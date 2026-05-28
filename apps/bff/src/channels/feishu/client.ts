import { logger } from "../../utils/logger.js";
import WebSocket from 'ws';
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  encryptKey?: string;
  verificationToken?: string;
}

export interface FeishuMessage {
  message_id: string;
  root_id?: string;
  parent_id?: string;
  create_time: string;
  sender: {
    sender_id: {
      open_id: string;
      user_id?: string;
      union_id?: string;
    };
    sender_type: string;
    tenant_key: string;
  };
  message_type: string;
  content: string;
  mentions?: Array<{
    key: string;
    id: { open_id: string };
    id_type: string;
    name: string;
  }>;
}

export interface FeishuCard {
  config: {
    wide_screen_mode?: boolean;
    enable_forward?: boolean;
  };
  header?: {
    title: {
      tag: string;
      content: string;
    };
    template?: string;
  };
  elements: Array<{
    tag: string;
    content?: string;
    text?: {
      tag: string;
      content: string;
    };
    actions?: Array<{
      tag: string;
      text?: { tag: string; content: string };
      type?: string;
      value?: Record<string, unknown>;
    }>;
  }>;
}

export class FeishuClient {
  private config: FeishuConfig;
  private wsConnection: WebSocket | null = null;
  private wsUrl = 'wss://open.feishu.cn/open-ws/v1/connect';
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;

  // 事件处理器
  private messageHandlers: Array<(message: FeishuMessage) => void> = [];
  private disconnectHandlers: Array<() => void> = [];
  private connectHandlers: Array<() => void> = [];

  constructor(config: FeishuConfig) {
    this.config = config;
  }

  /**
   * 获取 tenant_access_token
   */
  async getAccessToken(): Promise<string> {
    try {
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        }),
      });

      const data = await response.json() as any;

      if (data.code !== 0) {
        throw new Error(`Failed to get access token: ${data.msg}`);
      }

      return data.tenant_access_token;
    } catch (error) {
      throw new Error(`Access token request failed: ${(error as Error).message}`);
    }
  }

  /**
   * 建立 WebSocket 连接
   */
  async connect(): Promise<void> {
    try {
      const token = await this.getAccessToken();

      this.wsConnection = new WebSocket(this.wsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      this.setupEventHandlers();
    } catch (error) {
      logger.error('[FeishuClient] Connection failed:', error);
      throw error;
    }
  }

  /**
   * 断开 WebSocket 连接
   */
  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    this.isConnected = false;
    logger.info('[FeishuClient] Disconnected');
  }

  /**
   * 发送文本消息
   */
  async sendMessage(userId: string, content: string): Promise<void> {
    await this.sendCard(userId, {
      config: { wide_screen_mode: true },
      elements: [
        {
          tag: "div",
          text: {
            tag: "plain_text",
            content: content
          }
        }
      ]
    });
  }

  /**
   * 发送卡片消息
   */
  async sendCard(userId: string, card: FeishuCard): Promise<void> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receive_id: userId,
          msg_type: 'interactive',
          content: JSON.stringify(card),
        }),
      });

      const data = await response.json() as any;

      if (data.code !== 0) {
        throw new Error(`Send message failed: ${data.msg}`);
      }

      logger.info(`[FeishuClient] Message sent to ${userId}`);
    } catch (error) {
      logger.error('[FeishuClient] Send message failed:', error);
      throw error;
    }
  }

  /**
   * 注册消息处理器
   */
  onMessage(handler: (message: FeishuMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * 注册断开连接处理器
   */
  onDisconnect(handler: () => void): void {
    this.disconnectHandlers.push(handler);
  }

  /**
   * 注册连接成功处理器
   */
  onConnect(handler: () => void): void {
    this.connectHandlers.push(handler);
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): { connected: boolean; reconnectAttempts: number } {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  private setupEventHandlers(): void {
    if (!this.wsConnection) return;

    this.wsConnection.on('open', () => {
      logger.info('[FeishuClient] WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();

      // 通知连接成功处理器
      this.connectHandlers.forEach(handler => handler());
    });

    this.wsConnection.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // 处理不同类型的消息
        if (message.type === 'event') {
          const event = JSON.parse(message.event);
          const feishuMessage = event.event as FeishuMessage;

          // 通知所有消息处理器
          this.messageHandlers.forEach(handler => handler(feishuMessage));
        } else if (message.type === 'heartbeat') {
          // 心跳响应，无需处理
          logger.info('[FeishuClient] Heartbeat received');
        }
      } catch (error) {
        logger.error('[FeishuClient] Message parsing failed:', error);
      }
    });

    this.wsConnection.on('close', (code: number, reason: Buffer) => {
      logger.info(`[FeishuClient] WebSocket closed: ${code} - ${reason.toString()}`);
      this.isConnected = false;

      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // 通知断开连接处理器
      this.disconnectHandlers.forEach(handler => handler());

      // 自动重连
      this.attemptReconnect();
    });

    this.wsConnection.on('error', (error: Error) => {
      logger.error('[FeishuClient] WebSocket error:', error);
    });
  }

  private startHeartbeat(): void {
    // 飞书 WebSocket 需要每 20 秒发送一次心跳
    this.heartbeatInterval = setInterval(() => {
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 20000);
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('[FeishuClient] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // 指数退避，最大30秒

    logger.info(`[FeishuClient] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error('[FeishuClient] Reconnection failed:', error);
      }
    }, delay);
  }
}