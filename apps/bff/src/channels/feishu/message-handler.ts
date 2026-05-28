import { logger } from "../../utils/logger.js";
import type { FeishuMessage, FeishuCard } from './client.js';
export interface ProcessedMessage {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  timestamp: Date;
  isMentioned: boolean;
  replyTo?: string;
  messageType: 'text' | 'image' | 'file' | 'interactive' | 'unknown';
  healthContent?: HealthContent;
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

export class FeishuMessageHandler {
  private healthKeywords = {
    emergency: ['急救', '紧急', '危险', '发病', '昏迷', '出血', '胸痛', '呼吸困难'],
    consultation: ['咨询', '问诊', '症状', '用药', '治疗', '诊断', '医生'],
    monitoring: ['监测', '记录', '数据', '报告', '指标', '血压', '血糖', '心率'],
    general: ['健康', '养生', '保健', '运动', '饮食', '睡眠']
  };

  /**
   * 处理接收到的飞书消息
   */
  async handleIncoming(message: FeishuMessage): Promise<ProcessedMessage> {
    try {
      const content = this.parseMessageContent(message);
      const healthContent = this.analyzeHealthContent(content);

      return {
        id: message.message_id,
        content,
        senderId: message.sender.sender_id.open_id,
        senderName: await this.getSenderName(message.sender.sender_id.open_id),
        timestamp: new Date(parseInt(message.create_time)),
        isMentioned: this.checkIfMentioned(message),
        replyTo: message.root_id,
        messageType: this.getMessageType(message.message_type),
        healthContent
      };
    } catch (error) {
      logger.error('[FeishuMessageHandler] Failed to process message:', error);
      throw error;
    }
  }

  /**
   * 格式化出站消息
   */
  async formatOutbound(content: string): Promise<FeishuCard> {
    // 检查是否包含健康警报
    const isHealthAlert = this.isHealthAlert(content);

    if (isHealthAlert) {
      return this.buildHealthAlertCard({
        id: `alert_${Date.now()}`,
        type: 'health_alert',
        severity: 'warning',
        message: content,
        recommendations: [],
        targetUserId: '',
        timestamp: new Date()
      });
    }

    // 普通文本消息
    return {
      config: { wide_screen_mode: true },
      elements: [
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: content
          }
        }
      ]
    };
  }

  /**
   * 构建健康警报卡片
   */
  buildHealthAlertCard(alert: HealthAlert): FeishuCard {
    const severityColors = {
      info: 'blue',
      warning: 'orange',
      critical: 'red',
      emergency: 'red'
    };

    const severityIcons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
      emergency: '🆘'
    };

    return {
      config: {
        wide_screen_mode: true,
        enable_forward: false
      },
      header: {
        title: {
          tag: "plain_text",
          content: `${severityIcons[alert.severity]} 健康警报 - ${alert.type}`
        },
        template: severityColors[alert.severity]
      },
      elements: [
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**警报内容：**\n${alert.message}`
          }
        },
        ...(alert.recommendations.length > 0 ? [
          {
            tag: "div",
            text: {
              tag: "lark_md",
              content: `**建议措施：**\n${alert.recommendations.map(r => `• ${r}`).join('\n')}`
            }
          }
        ] : []),
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**时间：** ${alert.timestamp.toLocaleString('zh-CN')}`
          }
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "确认收到" },
              type: "primary",
              value: { action: "acknowledge", alertId: alert.id }
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "查看详情" },
              type: "default",
              value: { action: "view_details", alertId: alert.id }
            }
          ]
        }
      ]
    };
  }

  /**
   * 构建紧急警报卡片
   */
  buildEmergencyCard(alert: HealthAlert): FeishuCard {
    return {
      config: {
        wide_screen_mode: true,
        enable_forward: true
      },
      header: {
        title: {
          tag: "plain_text",
          content: `🆘 紧急健康警报`
        },
        template: "red"
      },
      elements: [
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**紧急情况：**\n${alert.message}\n\n**请立即采取行动！**`
          }
        },
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content: `**紧急联系方式：**\n• 急救电话：120\n• 医院急诊：请立即就医\n• 家属通知：已自动发送`
          }
        },
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: { tag: "plain_text", content: "拨打急救电话" },
              type: "primary",
              value: { action: "call_emergency" }
            },
            {
              tag: "button",
              text: { tag: "plain_text", content: "通知紧急联系人" },
              type: "danger",
              value: { action: "notify_contacts" }
            }
          ]
        }
      ]
    };
  }

  private parseMessageContent(message: FeishuMessage): string {
    try {
      const content = JSON.parse(message.content);

      switch (message.message_type) {
        case 'text':
          return content.text || '';
        case 'post':
          // 富文本消息，提取文本内容
          return this.extractTextFromPost(content);
        case 'image':
          return '[图片]';
        case 'file':
          return '[文件]';
        case 'interactive':
          return '[卡片消息]';
        default:
          return content.text || '[未知消息类型]';
      }
    } catch {
      return message.content;
    }
  }

  private extractTextFromPost(post: any): string {
    if (!post || !post.content) return '';

    let text = '';
    for (const paragraph of post.content) {
      if (Array.isArray(paragraph)) {
        for (const element of paragraph) {
          if (element.tag === 'text') {
            text += element.text || '';
          } else if (element.tag === 'at') {
            text += `@${element.user_name || '用户'}`;
          }
        }
        text += '\n';
      }
    }
    return text.trim();
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

  private checkIfMentioned(message: FeishuMessage): boolean {
    if (!message.mentions) return false;

    // 检查是否提到了机器人
    return message.mentions.some(mention =>
      mention.id.open_id === process.env.FEISHU_BOT_ID
    );
  }

  private getMessageType(type: string): ProcessedMessage['messageType'] {
    switch (type) {
      case 'text':
        return 'text';
      case 'image':
        return 'image';
      case 'file':
        return 'file';
      case 'interactive':
        return 'interactive';
      default:
        return 'unknown';
    }
  }

  private async getSenderName(openId: string): Promise<string> {
    // TODO: 调用飞书 API 获取用户信息
    // 暂时返回默认值
    return '用户';
  }

  private isHealthAlert(content: string): boolean {
    const alertKeywords = ['警报', '警告', '异常', '风险', '注意'];
    return alertKeywords.some(keyword => content.includes(keyword));
  }
}