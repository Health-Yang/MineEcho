import type { WeWorkMessage, NewsArticle } from './client.js';
import { logger } from "../../utils/logger.js";
export interface ProcessedMessage {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
  isGroupChat: boolean;
  replyTo?: string;
  messageType: 'text' | 'image' | 'voice' | 'video' | 'file' | 'location' | 'event' | 'unknown';
  healthContent?: HealthContent;
  event?: {
    type: string;
    key?: string;
  };
}

export interface HealthContent {
  isHealthRelated: boolean;
  category: 'consultation' | 'emergency' | 'monitoring' | 'general';
  keywords: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

export interface HealthAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  recommendations: string[];
  targetUserId: string;
  timestamp: Date;
}

export class WeWorkMessageHandler {
  private healthKeywords = {
    emergency: ['急救', '紧急', '危险', '发病', '昏迷', '出血', '胸痛', '呼吸困难'],
    consultation: ['咨询', '问诊', '症状', '用药', '治疗', '诊断', '医生'],
    monitoring: ['监测', '记录', '数据', '报告', '指标', '血压', '血糖', '心率'],
    general: ['健康', '养生', '保健', '运动', '饮食', '睡眠']
  };

  /**
   * 解析接收到的企业微信消息（XML 格式）
   */
  parseIncomingMessage(xml: string): WeWorkMessage {
    try {
      // 简单的 XML 解析（生产环境应使用 xml2js 等库）
      const message: any = {};

      // 提取常见字段
      const fields = [
        'ToUserName', 'FromUserName', 'CreateTime', 'MsgType', 'Content',
        'MsgId', 'PicUrl', 'MediaId', 'Format', 'ThumbMediaId',
        'Location_X', 'Location_Y', 'Scale', 'Label', 'Title',
        'Description', 'Url', 'Event', 'EventKey', 'Ticket',
        'Latitude', 'Longitude', 'Precision', 'Recognition'
      ];

      for (const field of fields) {
        const regex = new RegExp(`<${field}><\\!\\[CDATA\\[(.+?)\\]\\]><\\/${field}>|<${field}>(.+?)<\\/${field}>`, 'i');
        const match = xml.match(regex);
        if (match) {
          message[field] = match[1] || match[2];
        }
      }

      // 转换类型
      if (message.CreateTime) {
        message.CreateTime = parseInt(message.CreateTime);
      }
      if (message.MsgId) {
        message.MsgId = parseInt(message.MsgId);
      }
      if (message.Location_X) {
        message.Location_X = parseFloat(message.Location_X);
      }
      if (message.Location_Y) {
        message.Location_Y = parseFloat(message.Location_Y);
      }
      if (message.Scale) {
        message.Scale = parseInt(message.Scale);
      }
      if (message.Latitude) {
        message.Latitude = parseFloat(message.Latitude);
      }
      if (message.Longitude) {
        message.Longitude = parseFloat(message.Longitude);
      }
      if (message.Precision) {
        message.Precision = parseFloat(message.Precision);
      }

      return message as WeWorkMessage;
    } catch (error) {
      logger.error('[WeWorkMessageHandler] Failed to parse XML:', error);
      throw new Error('Invalid XML message format');
    }
  }

  /**
   * 处理接收到的消息
   */
  async handleIncoming(message: WeWorkMessage): Promise<ProcessedMessage> {
    try {
      const content = this.extractMessageContent(message);
      const healthContent = this.analyzeHealthContent(content);

      return {
        id: message.MsgId?.toString() || `msg_${Date.now()}`,
        content,
        senderId: message.FromUserName,
        senderName: await this.getSenderName(message.FromUserName),
        timestamp: new Date(message.CreateTime * 1000),
        isGroupChat: message.ToUserName.startsWith('gh_'), // 群聊标识
        replyTo: message.MsgType === 'text' ? undefined : undefined, // 文本消息没有父消息
        messageType: this.getMessageType(message.MsgType),
        healthContent,
        event: message.Event ? {
          type: message.Event,
          key: message.EventKey
        } : undefined
      };
    } catch (error) {
      logger.error('[WeWorkMessageHandler] Failed to process message:', error);
      throw error;
    }
  }

  /**
   * 构建文本消息
   */
  buildTextMessage(content: string): string {
    return content;
  }

  /**
   * 构建图文消息
   */
  buildNewsMessage(alert: HealthAlert): NewsArticle[] {
    const severityIcons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
      emergency: '🆘'
    };

    return [
      {
        title: `${severityIcons[alert.severity]} 健康警报 - ${alert.type}`,
        description: alert.message,
        url: `https://your-domain.com/alerts/${alert.id}`, // TODO: 配置实际的详情页面 URL
        picurl: this.getSeverityImage(alert.severity)
      }
    ];
  }

  /**
   * 构建健康警报文章
   */
  buildHealthAlertArticle(alert: HealthAlert): NewsArticle {
    const severityColors = {
      info: 'blue',
      warning: 'orange',
      critical: 'red',
      emergency: 'darkred'
    };

    const description = alert.recommendations.length > 0
      ? `${alert.message}\n\n建议措施：\n${alert.recommendations.map(r => `• ${r}`).join('\n')}`
      : alert.message;

    return {
      title: `健康警报 - ${alert.type}`,
      description,
      url: `https://your-domain.com/alerts/${alert.id}`,
      picurl: this.getSeverityImage(alert.severity)
    };
  }

  /**
   * 构建 Markdown 消息
   */
  buildMarkdownMessage(alert: HealthAlert): string {
    const severityIcons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
      emergency: '🆘'
    };

    let markdown = `# ${severityIcons[alert.severity]} 健康警报\n\n`;
    markdown += `**警报类型：** ${alert.type}\n`;
    markdown += `**严重程度：** ${alert.severity}\n\n`;
    markdown += `**警报内容：**\n${alert.message}\n\n`;

    if (alert.recommendations.length > 0) {
      markdown += `**建议措施：**\n`;
      alert.recommendations.forEach(rec => {
        markdown += `• ${rec}\n`;
      });
      markdown += '\n';
    }

    markdown += `**时间：** ${alert.timestamp.toLocaleString('zh-CN')}\n`;

    return markdown;
  }

  /**
   * 构建紧急通知消息
   */
  buildEmergencyMessage(alert: HealthAlert): string {
    let message = `🆘 紧急健康警报\n\n`;
    message += `紧急情况：${alert.message}\n\n`;
    message += `请立即采取行动！\n\n`;
    message += `紧急联系方式：\n`;
    message += `• 急救电话：120\n`;
    message += `• 医院急诊：请立即就医\n`;
    message += `• 家属通知：已自动发送\n`;

    return message;
  }

  private extractMessageContent(message: WeWorkMessage): string {
    switch (message.MsgType) {
      case 'text':
        return message.Content || '';
      case 'image':
        return '[图片]';
      case 'voice':
        return '[语音]';
      case 'video':
        return '[视频]';
      case 'file':
        return '[文件]';
      case 'location':
        return `[位置] ${message.Label || ''}`;
      case 'event':
        return `[事件] ${message.Event} - ${message.EventKey || ''}`;
      case 'link':
        return `[链接] ${message.Title || ''} - ${message.Description || ''}`;
      default:
        return '[未知消息类型]';
    }
  }

  private analyzeHealthContent(content: string): HealthContent {
    const lowerContent = content.toLowerCase();
    let urgency: HealthContent['urgency'] = 'low';
    let category: HealthContent['category'] = 'general';
    const keywords: string[] = [];

    // 检查紧急关键词
    for (const keyword of this.healthKeywords.emergency) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        urgency = 'emergency';
        category = 'emergency';
        keywords.push(keyword);
      }
    }

    // 检查咨询关键词
    if (urgency !== 'emergency') {
      for (const keyword of this.healthKeywords.consultation) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          urgency = 'medium';
          category = 'consultation';
          keywords.push(keyword);
        }
      }
    }

    // 检查监测关键词
    if (urgency === 'low') {
      for (const keyword of this.healthKeywords.monitoring) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          urgency = 'low';
          category = 'monitoring';
          keywords.push(keyword);
        }
      }
    }

    // 检查一般健康关键词
    if (keywords.length === 0) {
      for (const keyword of this.healthKeywords.general) {
        if (lowerContent.includes(keyword.toLowerCase())) {
          keywords.push(keyword);
        }
      }
    }

    return {
      isHealthRelated: keywords.length > 0,
      category,
      keywords,
      urgency
    };
  }

  private getMessageType(type: string): ProcessedMessage['messageType'] {
    switch (type) {
      case 'text':
        return 'text';
      case 'image':
        return 'image';
      case 'voice':
        return 'voice';
      case 'video':
        return 'video';
      case 'file':
        return 'file';
      case 'location':
        return 'location';
      case 'event':
        return 'event';
      default:
        return 'unknown';
    }
  }

  private async getSenderName(userId: string): Promise<string> {
    // TODO: 调用企业微信 API 获取用户信息
    // 暂时返回默认值
    return '用户';
  }

  private getSeverityImage(severity: HealthAlert['severity']): string {
    // 返回不同严重程度的图标 URL
    const images = {
      info: 'https://via.placeholder.com/64x64/007bff/ffffff?text=ℹ️',
      warning: 'https://via.placeholder.com/64x64/ffc107/000000?text=⚠️',
      critical: 'https://via.placeholder.com/64x64/dc3545/ffffff?text=🚨',
      emergency: 'https://via.placeholder.com/64x64/8B0000/ffffff?text=🆘'
    };

    return images[severity];
  }
}