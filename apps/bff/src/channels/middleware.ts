import { logger } from "../utils/logger.js";
import type { ProcessedMessage } from '../channels/feishu/message-handler.js';
import { gatewayPairingManager } from './gateway-pairing.js';
import { pagePairingManager } from './page-pairing.js';
import { channelManager } from './channel-manager.js';
export interface HealthInsight {
  type: 'health_trend' | 'risk_alert' | 'recommendation' | 'emergency';
  confidence: number;
  message: string;
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

export interface GatewayMessage {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
  timestamp: Date;
  healthContent?: {
    isHealthRelated: boolean;
    category: string;
    keywords: string[];
    urgency: string;
  };
}

export class MessageMiddleware {
  private healthPatterns = {
    emergency: [
      /急救|紧急|危险|发病|昏迷|出血|胸痛|呼吸困难/,
      /120|急救电话|急诊|抢救/
    ],
    consultation: [
      /咨询|问诊|症状|用药|治疗|诊断|医生/,
      /头痛|发烧|咳嗽|感冒|疼痛|不适/
    ],
    monitoring: [
      /监测|记录|数据|报告|指标/,
      /血压|血糖|心率|体重|睡眠/
    ]
  };

  /**
   * 处理来自通道的入站消息
   */
  async processInboundMessage(channelId: string, message: any): Promise<GatewayMessage> {
    try {
      // 1. 消息格式标准化
      const standardizedMessage = this.standardizeMessage(channelId, message);

      // 2. 检查是否为配对码输入
      const content = standardizedMessage.content.trim();
      if (this.isPairingCode(content)) {
        return await this.handlePairingCodeInput(channelId, standardizedMessage.senderId, content);
      }

      // 3. 检查是否为 Gateway 配对命令
      if (this.isGatewayPairingCommand(content)) {
        return await this.handleGatewayPairingCommand(channelId, standardizedMessage.senderId, content);
      }

      // 4. 检查是否为配对帮助请求
      if (this.isPairingHelpRequest(content)) {
        await this.processOutboundMessage(channelId, standardizedMessage.senderId,
          gatewayPairingManager.getPairingInstructions());
        throw new Error('配对帮助信息已发送');
      }

      // 5. 检查是否为获取配对命令请求
      if (this.isGetPairingCommandRequest(content)) {
        return await this.handleGetPairingCodeRequest(channelId, standardizedMessage.senderId);
      }

      // 6. 配对认证检查
      const isPaired = await pagePairingManager.isUserPaired(channelId, standardizedMessage.senderId);
      if (!isPaired) {
        // 发送配对说明
        await this.processOutboundMessage(channelId, standardizedMessage.senderId,
          '🔐 首次使用需要配对\n\n' + pagePairingManager.getPairingInstructions());
        throw new Error('用户未配对');
      }

      // 7. 健康内容分析
      const healthContent = this.analyzeHealthContent(standardizedMessage.content);

      // 8. 安全验证
      await this.validateMessage(standardizedMessage);

      return {
        ...standardizedMessage,
        healthContent
      };
    } catch (error) {
      logger.error('[MessageMiddleware] Failed to process inbound message:', error);
      throw error;
    }
  }

  /**
   * 处理出站消息（从 Gateway 到通道）
   */
  async processOutboundMessage(
    channelId: string,
    targetUserId: string,
    content: string,
    options: {
      isHealthAlert?: boolean;
      urgency?: 'low' | 'medium' | 'high' | 'emergency';
    } = {}
  ): Promise<void> {
    try {
      // 1. 消息格式化
      const formattedContent = this.formatOutboundMessage(content, options);

      // 2. 路由到目标通道
      await channelManager.routeMessage(channelId, targetUserId, formattedContent);

      logger.info(`[MessageMiddleware] Outbound message sent to ${channelId}:${targetUserId}`);
    } catch (error) {
      logger.error('[MessageMiddleware] Failed to process outbound message:', error);
      throw error;
    }
  }

  /**
   * 发送健康警报
   */
  async sendHealthAlert(
    channelId: string,
    targetUserId: string,
    insight: HealthInsight
  ): Promise<void> {
    const instance = channelManager.getChannelInstance(channelId);
    if (!instance) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const alert = {
      id: `alert_${Date.now()}`,
      type: insight.type,
      severity: this.mapUrgencyToSeverity(insight.urgency),
      message: insight.message,
      recommendations: insight.recommendations,
      targetUserId,
      timestamp: new Date()
    };

    // 根据通道类型发送不同格式的警报
    switch (instance.type) {
      case 'feishu':
        if (instance.channel.sendHealthAlert) {
          await instance.channel.sendHealthAlert(targetUserId, alert);
        }
        break;

      case 'wework':
        if (instance.channel.sendHealthAlert) {
          await instance.channel.sendHealthAlert(targetUserId, alert);
        }
        break;

      default:
        // 通用文本格式
        const textAlert = this.formatTextAlert(alert);
        await this.processOutboundMessage(channelId, targetUserId, textAlert, {
          isHealthAlert: true,
          urgency: insight.urgency
        });
    }
  }

  /**
   * 发送紧急通知
   */
  async sendEmergencyNotification(
    channelId: string,
    targetUserId: string,
    alert: {
      message: string;
      recommendations: string[];
    }
  ): Promise<void> {
    const instance = channelManager.getChannelInstance(channelId);
    if (!instance) {
      throw new Error(`Channel ${channelId} not found`);
    }

    const emergencyAlert = {
      id: `emergency_${Date.now()}`,
      type: 'emergency',
      severity: 'emergency' as const,
      message: alert.message,
      recommendations: alert.recommendations,
      targetUserId,
      timestamp: new Date()
    };

    // 根据通道类型发送紧急通知
    switch (instance.type) {
      case 'feishu':
        if (instance.channel.sendEmergencyNotification) {
          await instance.channel.sendEmergencyNotification(targetUserId, emergencyAlert);
        }
        break;

      case 'wework':
        if (instance.channel.sendEmergencyNotification) {
          await instance.channel.sendEmergencyNotification(targetUserId, emergencyAlert);
        }
        break;

      default:
        // 通用紧急通知格式
        const textAlert = this.formatEmergencyTextAlert(emergencyAlert);
        await this.processOutboundMessage(channelId, targetUserId, textAlert, {
          isHealthAlert: true,
          urgency: 'emergency'
        });
    }
  }

  /**
   * 分析消息中的健康内容
   */
  analyzeHealthContent(content: string): {
    isHealthRelated: boolean;
    category: string;
    keywords: string[];
    urgency: string;
  } {
    const lowerContent = content.toLowerCase();
    let urgency = 'low';
    let category = 'general';
    const keywords: string[] = [];

    // 检查紧急模式
    for (const pattern of this.healthPatterns.emergency) {
      if (pattern.test(lowerContent)) {
        urgency = 'emergency';
        category = 'emergency';
        const matches = lowerContent.match(pattern);
        if (matches) keywords.push(...matches);
      }
    }

    // 检查咨询模式
    if (urgency !== 'emergency') {
      for (const pattern of this.healthPatterns.consultation) {
        if (pattern.test(lowerContent)) {
          urgency = 'medium';
          category = 'consultation';
          const matches = lowerContent.match(pattern);
          if (matches) keywords.push(...matches);
        }
      }
    }

    // 检查监测模式
    if (urgency === 'low') {
      for (const pattern of this.healthPatterns.monitoring) {
        if (pattern.test(lowerContent)) {
          urgency = 'low';
          category = 'monitoring';
          const matches = lowerContent.match(pattern);
          if (matches) keywords.push(...matches);
        }
      }
    }

    return {
      isHealthRelated: keywords.length > 0,
      category,
      keywords: [...new Set(keywords)], // 去重
      urgency
    };
  }

  /**
   * 生成健康洞察
   */
  async generateHealthInsight(message: GatewayMessage): Promise<HealthInsight | null> {
    if (!message.healthContent?.isHealthRelated) {
      return null;
    }

    const { category, urgency, keywords } = message.healthContent;

    let insightType: HealthInsight['type'];
    let confidence: number;
    let recommendations: string[] = [];

    switch (category) {
      case 'emergency':
        insightType = 'emergency';
        confidence = 0.9;
        recommendations = [
          '请立即拨打急救电话 120',
          '保持冷静，等待专业救援',
          '如有必要，进行基本急救措施'
        ];
        break;

      case 'consultation':
        insightType = 'recommendation';
        confidence = 0.7;
        recommendations = [
          '建议咨询专业医生',
          '可以记录症状详情以便诊断',
          '注意休息和观察症状变化'
        ];
        break;

      case 'monitoring':
        insightType = 'health_trend';
        confidence = 0.6;
        recommendations = [
          '定期记录相关健康数据',
          '关注指标变化趋势',
          '如有异常及时就医'
        ];
        break;

      default:
        insightType = 'recommendation';
        confidence = 0.5;
        recommendations = [
          '保持健康的生活方式',
          '定期体检',
          '关注身体变化'
        ];
    }

    return {
      type: insightType,
      confidence,
      message: `基于您提到的"${keywords.slice(0, 3).join('、')}"相关内容，${this.getInsightMessage(category)}`,
      recommendations,
      urgency: urgency as HealthInsight['urgency']
    };
  }

  private standardizeMessage(channelId: string, message: any): GatewayMessage {
    return {
      id: message.id || `msg_${Date.now()}`,
      content: message.content || '',
      senderId: message.senderId || message.FromUserName || 'unknown',
      channelId,
      timestamp: message.timestamp || new Date()
    };
  }

  private formatOutboundMessage(
    content: string,
    options: { isHealthAlert?: boolean; urgency?: string }
  ): string {
    if (options.isHealthAlert) {
      const urgencyPrefix = {
        low: '💡',
        medium: 'ℹ️',
        high: '⚠️',
        emergency: '🆘'
      };

      const prefix = urgencyPrefix[options.urgency as keyof typeof urgencyPrefix] || 'ℹ️';
      return `${prefix} 健康提醒\n\n${content}`;
    }

    return content;
  }

  private formatTextAlert(alert: any): string {
    const severityIcons = {
      info: 'ℹ️',
      warning: '⚠️',
      critical: '🚨',
      emergency: '🆘'
    };

    let message = `${severityIcons[alert.severity as keyof typeof severityIcons] || 'ℹ️'} 健康警报\n\n`;
    message += `类型：${alert.type}\n`;
    message += `内容：${alert.message}\n`;

    if (alert.recommendations?.length > 0) {
      message += `\n建议措施：\n`;
      alert.recommendations.forEach((rec: string) => {
        message += `• ${rec}\n`;
      });
    }

    message += `\n时间：${alert.timestamp.toLocaleString('zh-CN')}`;

    return message;
  }

  private formatEmergencyTextAlert(alert: any): string {
    let message = `🆘 紧急健康警报\n\n`;
    message += `紧急情况：${alert.message}\n\n`;
    message += `请立即采取行动！\n\n`;
    message += `紧急联系方式：\n`;
    message += `• 急救电话：120\n`;
    message += `• 医院急诊：请立即就医\n`;

    if (alert.recommendations?.length > 0) {
      message += `\n建议措施：\n`;
      alert.recommendations.forEach((rec: string) => {
        message += `• ${rec}\n`;
      });
    }

    return message;
  }

  private mapUrgencyToSeverity(urgency: string): 'info' | 'warning' | 'critical' | 'emergency' {
    switch (urgency) {
      case 'emergency':
        return 'emergency';
      case 'high':
        return 'critical';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  }

  private getInsightMessage(category: string): string {
    switch (category) {
      case 'emergency':
        return '这可能是一个紧急情况，请立即寻求专业医疗帮助。';
      case 'consultation':
        return '建议您咨询专业医生以获得准确的诊断和治疗建议。';
      case 'monitoring':
        return '建议您定期监测相关健康指标，关注变化趋势。';
      default:
        return '建议您保持健康的生活方式，关注身体状况。';
    }
  }

  private async validateMessage(message: GatewayMessage): Promise<void> {
    // 基本验证
    if (!message.content || message.content.trim().length === 0) {
      throw new Error('Message content is empty');
    }

    if (message.content.length > 10000) {
      throw new Error('Message content is too long');
    }

    // TODO: 添加更多安全验证
    // - 敏感信息过滤
    // - 恶意内容检测
    // - 频率限制
  }

  /**
   * 检查是否为配对码格式
   */
  private isPairingCode(content: string): boolean {
    const cleanContent = content.replace(/[\s\-]/g, '');
    // 支持6位数字配对码
    return /^\d{6}$/.test(cleanContent);
  }

  /**
   * 检查是否为配对帮助请求
   */
  private isPairingHelpRequest(content: string): boolean {
    const helpKeywords = ['配对', 'pairing', '连接', 'connect', '授权', 'auth'];
    const lowerContent = content.toLowerCase();
    return helpKeywords.some(keyword => lowerContent.includes(keyword));
  }

  /**
   * 处理配对码输入
   */
  private async handlePairingCodeInput(channelId: string, userId: string, pairingCode: string): Promise<GatewayMessage> {
    const result = await pagePairingManager.verifyPairingCode({
      channelId,
      userId,
      pairingCode
    });

    // 发送配对结果
    await this.processOutboundMessage(channelId, userId, result.message);

    throw new Error('配对处理完成');
  }

  /**
   * 处理 Gateway 配对命令输入
   */
  private async handleGatewayPairingCommand(channelId: string, userId: string, command: string): Promise<GatewayMessage> {
    const result = await gatewayPairingManager.handleCommandInput(channelId, userId, command);

    // 发送配对结果
    await this.processOutboundMessage(channelId, userId, result.message);

    throw new Error('Gateway 配对命令处理完成');
  }

  /**
   * 处理获取配对命令请求
   */
  private async handleGetPairingCodeRequest(channelId: string, userId: string): Promise<GatewayMessage> {
    const result = await pagePairingManager.generatePairingCode(channelId, userId);

    // 发送配对码
    let message = '🔐 您的配对码';
    if (result.pairingCode) {
      message += `\n\n配对码：${result.pairingCode}`;
    }
    if (result.instructions) {
      message += `\n\n${result.instructions}`;
    }

    await this.processOutboundMessage(channelId, userId, message);

    throw new Error('配对码已发送');
  }

  /**
   * 检查是否为 Gateway 配对命令格式
   */
  private isGatewayPairingCommand(content: string): boolean {
    return /openclaw\s+pair\s+--token\s+[a-f0-9]+\s+--channel\s+\w+\s+--user\s+\S+/.test(content);
  }

  /**
   * 检查是否为获取配对命令请求
   */
  private isGetPairingCommandRequest(content: string): boolean {
    const requestKeywords = ['获取配对码', '配对码', 'get pairing code', 'pairing code', '获取配对命令', '配对命令'];
    const lowerContent = content.toLowerCase();
    return requestKeywords.some(keyword => lowerContent.includes(keyword));
  }
}

// 导出单例实例
export const messageMiddleware = new MessageMiddleware();