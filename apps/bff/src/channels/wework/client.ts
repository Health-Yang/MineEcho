import { createHash, createHmac } from 'node:crypto';
import { logger } from "../../utils/logger.js";
export interface WeWorkConfig {
  corpId: string;
  agentId: string;
  appSecret: string;
  callbackUrl?: string;
  callbackToken?: string;
  callbackEncodingAesKey?: string;
}

export interface WeWorkMessage {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: string;
  Content?: string;
  MsgId?: number;
  PicUrl?: string;
  MediaId?: string;
  Format?: string;
  ThumbMediaId?: string;
  Location_X?: number;
  Location_Y?: number;
  Scale?: number;
  Label?: string;
  Title?: string;
  Description?: string;
  Url?: string;
  Event?: string;
  EventKey?: string;
  Ticket?: string;
  Latitude?: number;
  Longitude?: number;
  Precision?: number;
  Recognition?: string;
  AppId?: string;
  PageId?: string;
  Score?: number;
  SessionID?: string;
  SuccessPOIId?: string;
  ShopID?: string;
  HardwareInfo?: any;
}

export interface WeWorkMessageRequest {
  touser?: string;
  toparty?: string;
  totag?: string;
  msgtype: string;
  agentid: number;
  text?: {
    content: string;
  };
  news?: {
    articles: Array<{
      title: string;
      description: string;
      url: string;
      picurl?: string;
    }>;
  };
  markdown?: {
    content: string;
  };
  image?: {
    media_id: string;
  };
  voice?: {
    media_id: string;
  };
  video?: {
    media_id: string;
    title?: string;
    description?: string;
  };
  file?: {
    media_id: string;
  };
  template_card?: any;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  picurl?: string;
}

export interface CallbackParams {
  msg_signature: string;
  timestamp: string;
  nonce: string;
  echostr?: string;
  xml?: string;
}

export class WeWorkClient {
  private config: WeWorkConfig;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private baseUrl = 'https://qyapi.weixin.qq.com/cgi-bin';

  constructor(config: WeWorkConfig) {
    this.config = config;
  }

  /**
   * 获取 access_token
   */
  async getAccessToken(): Promise<string> {
    // 检查 token 是否过期
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const url = `${this.baseUrl}/gettoken?corpid=${this.config.corpId}&corpsecret=${this.config.appSecret}`;
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.errcode !== 0) {
        throw new Error(`Failed to get access token: ${data.errmsg}`);
      }

      this.accessToken = data.access_token;
      // 设置过期时间（提前5分钟刷新）
      this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

      logger.info('[WeWorkClient] Access token obtained');
      return this.accessToken as string;
    } catch (error) {
      logger.error('[WeWorkClient] Get access token failed:', error);
      throw error;
    }
  }

  /**
   * 发送文本消息
   */
  async sendMessage(userId: string, content: string): Promise<void> {
    const message: WeWorkMessageRequest = {
      touser: userId,
      msgtype: 'text',
      agentid: parseInt(this.config.agentId),
      text: {
        content: content
      }
    };

    await this.send(message);
  }

  /**
   * 发送图文消息
   */
  async sendNewsMessage(userId: string, articles: NewsArticle[]): Promise<void> {
    const message: WeWorkMessageRequest = {
      touser: userId,
      msgtype: 'news',
      agentid: parseInt(this.config.agentId),
      news: {
        articles: articles.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          picurl: article.picurl
        }))
      }
    };

    await this.send(message);
  }

  /**
   * 发送 Markdown 消息
   */
  async sendMarkdownMessage(userId: string, content: string): Promise<void> {
    const message: WeWorkMessageRequest = {
      touser: userId,
      msgtype: 'markdown',
      agentid: parseInt(this.config.agentId),
      markdown: {
        content: content
      }
    };

    await this.send(message);
  }

  /**
   * 设置回调 URL
   */
  async setupCallback(url: string, token: string): Promise<void> {
    this.config.callbackUrl = url;
    this.config.callbackToken = token;

    // 验证回调 URL
    await this.verifyCallbackUrl();
    logger.info('[WeWorkClient] Callback URL setup completed');
  }

  /**
   * 验证回调签名
   */
  verifyCallbackSignature(params: CallbackParams): boolean {
    if (!this.config.callbackToken) {
      logger.error('[WeWorkClient] Callback token not configured');
      return false;
    }

    try {
      // 1. 将 token、timestamp、nonce、echostr 参数进行字典序排序
      const sortedParams = [this.config.callbackToken, params.timestamp, params.nonce];
      if (params.echostr) {
        sortedParams.push(params.echostr);
      }
      sortedParams.sort();

      // 2. 将四个参数字符串拼接成一个字符串进行 sha1 加密
      const combinedString = sortedParams.join('');
      const calculatedSignature = createHash('sha1').update(combinedString).digest('hex');

      // 3. 获得加密后的字符串可与 signature 对比
      return calculatedSignature === params.msg_signature;
    } catch (error) {
      logger.error('[WeWorkClient] Signature verification failed:', error);
      return false;
    }
  }

  /**
   * 解密回调消息
   */
  decryptMessage(encryptedXml: string): string {
    if (!this.config.callbackEncodingAesKey) {
      throw new Error('Encoding AES key not configured');
    }

    // TODO: 实现企业微信消息解密
    // 企业微信使用 AES-256-CBC 加密，需要先解密
    logger.info('[WeWorkClient] Message decryption not implemented yet');
    return encryptedXml;
  }

  /**
   * 加密回复消息
   */
  encryptMessage(plaintext: string): string {
    if (!this.config.callbackEncodingAesKey) {
      throw new Error('Encoding AES key not configured');
    }

    // TODO: 实现企业微信消息加密
    logger.info('[WeWorkClient] Message encryption not implemented yet');
    return plaintext;
  }

  /**
   * 获取应用概况列表
   */
  async getAgentList(): Promise<any> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/agent/list?access_token=${token}&agentid=${this.config.agentId}`;

    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.errcode !== 0) {
      throw new Error(`Failed to get agent list: ${data.errmsg}`);
    }

    return data.agent;
  }

  /**
   * 获取部门成员详情
   */
  async getDepartmentUsers(departmentId: number = 1): Promise<any[]> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/user/list?access_token=${token}&department_id=${departmentId}&fetch_child=1`;

    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.errcode !== 0) {
      throw new Error(`Failed to get department users: ${data.errmsg}`);
    }

    return data.userlist || [];
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<any> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/user/get?access_token=${token}&userid=${userId}`;

    const response = await fetch(url);
    const data = await response.json() as any;

    if (data.errcode !== 0) {
      throw new Error(`Failed to get user info: ${data.errmsg}`);
    }

    return data;
  }

  private async send(message: WeWorkMessageRequest): Promise<void> {
    try {
      const token = await this.getAccessToken();
      const url = `${this.baseUrl}/message/send?access_token=${token}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const data = await response.json() as any;

      if (data.errcode !== 0) {
        throw new Error(`Send message failed: ${data.errmsg} (errcode: ${data.errcode})`);
      }

      logger.info(`[WeWorkClient] Message sent successfully (msgid: ${data.msgid})`);
    } catch (error) {
      logger.error('[WeWorkClient] Send message failed:', error);
      throw error;
    }
  }

  private async verifyCallbackUrl(): Promise<void> {
    // TODO: 实现回调 URL 验证
    // 企业微信需要先验证回调 URL 的有效性
    logger.info('[WeWorkClient] Callback URL verification not implemented yet');
  }
}