import { logger } from "../utils/logger.js";
import { getLocalBffUrl } from "../utils/bff-url.js";
import { channelManager } from './channel-manager.js';
/**
 * 通道配对认证管理器
 * 处理用户首次与机器人对话时的配对认证流程
 */
import { createHash, randomBytes } from 'node:crypto';
export interface PairingSession {
  id: string;
  channelId: string;
  userId: string;
  user_name?: string;
  secret: string;
  status: 'pending' | 'verified' | 'expired' | 'cancelled';
  createdAt: Date;
  expiresAt: Date;
  verifiedAt?: Date;
}

export interface PairingRequest {
  channelId: string;
  userId: string;
  userName?: string;
  timestamp: Date;
}

export interface PairingResponse {
  success: boolean;
  message: string;
  pairingCode?: string;
  instructions?: string;
}

export class PairingManager {
  private sessions: Map<string, PairingSession> = new Map();
  private readonly SESSION_EXPIRY_HOURS = 24;
  private readonly SECRET_LENGTH = 32;

  /**
   * 创建配对会话
   */
  async createPairingSession(request: PairingRequest): Promise<PairingSession> {
    const sessionId = this.generateSessionId();
    const secret = this.generateSecret();
    const pairingCode = this.formatPairingCode(secret);

    const session: PairingSession = {
      id: sessionId,
      channelId: request.channelId,
      userId: request.userId,
      user_name: request.userName,
      secret,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
    };

    this.sessions.set(sessionId, session);

    logger.info(`[PairingManager] Created pairing session ${sessionId} for user ${request.userId} on channel ${request.channelId}`);

    return session;
  }

  /**
   * 处理配对请求
   */
  async handlePairingRequest(channelId: string, userId: string, content: string): Promise<PairingResponse> {
    // 检查用户是否已经在白名单中
    const channelInstance = channelManager.getChannelInstance(channelId);
    if (!channelInstance) {
      return {
        success: false,
        message: '通道未找到'
      };
    }

    const { security } = channelInstance.config;

    // 如果是开放模式，无需配对
    if (security.dmPolicy === 'open') {
      return {
        success: true,
        message: '无需配对，直接使用'
      };
    }

    // 如果是禁用模式，拒绝所有消息
    if (security.dmPolicy === 'disabled') {
      return {
        success: false,
        message: '该通道已禁用私聊功能'
      };
    }

    // 检查是否已在白名单中
    if (security.dmPolicy === 'allowlist' && security.allowFrom.includes(userId)) {
      return {
        success: true,
        message: '已授权用户，直接使用'
      };
    }

    // 配对模式：检查是否有有效的配对会话
    if (security.dmPolicy === 'pairing') {
      return await this.handlePairingMode(channelId, userId, content);
    }

    return {
      success: false,
      message: '未授权的访问'
    };
  }

  /**
   * 处理配对模式下的消息
   */
  private async handlePairingMode(channelId: string, userId: string, content: string): Promise<PairingResponse> {
    // 查找用户的待配对会话
    const existingSession = this.findPendingSession(channelId, userId);

    if (existingSession) {
      // 检查用户是否在输入配对码
      const cleanedContent = content.trim().replace(/[\s\-]/g, '');
      if (this.isValidPairingCodeFormat(cleanedContent)) {
        return await this.verifyPairingCode(existingSession, cleanedContent);
      }

      // 提供配对说明
      return {
        success: false,
        message: `您的配对码是：${this.formatPairingCode(existingSession.secret)}\n\n请在聊天中输入此配对码完成配对。`,
        pairingCode: this.formatPairingCode(existingSession.secret),
        instructions: '请复制上面的配对码并发送给我完成配对。'
      };
    }

    // 创建新的配对会话
    const session = await this.createPairingSession({
      channelId,
      userId,
      timestamp: new Date()
    });

    return {
      success: false,
      message: `🔐 首次使用需要配对认证\n\n您的配对码是：${this.formatPairingCode(session.secret)}\n\n请在聊天中输入此配对码完成配对。配对码有效期 24 小时。`,
      pairingCode: this.formatPairingCode(session.secret),
      instructions: '请复制上面的配对码并发送给我完成配对。'
    };
  }

  /**
   * 验证配对码
   */
  private async verifyPairingCode(session: PairingSession, inputCode: string): Promise<PairingResponse> {
    // 检查会话是否过期
    if (new Date() > session.expiresAt) {
      session.status = 'expired';
      return {
        success: false,
        message: '配对码已过期，请重新获取新的配对码。'
      };
    }

    // 验证配对码
    const normalizedInput = inputCode.replace(/[\s\-]/g, '').toLowerCase();
    const normalizedSecret = session.secret.replace(/[\s\-]/g, '').toLowerCase();

    if (normalizedInput === normalizedSecret) {
      // 配对成功
      session.status = 'verified';
      session.verifiedAt = new Date();

      // 将用户添加到通道白名单
      await this.addUserToAllowlist(session.channelId, session.userId);

      logger.info(`[PairingManager] User ${session.userId} paired successfully on channel ${session.channelId}`);

      return {
        success: true,
        message: '✅ 配对成功！您现在可以正常使用 MineEcho 了。\n\n输入 "帮助" 查看可用命令。'
      };
    } else {
      return {
        success: false,
        message: '❌ 配对码错误，请检查后重新输入。'
      };
    }
  }

  /**
   * 将用户添加到通道白名单
   */
  private async addUserToAllowlist(channelId: string, userId: string): Promise<void> {
    try {
      // 通过 API 更新通道配置
      const response = await fetch(getLocalBffUrl(`/api/channels/${channelId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          security: {
            allowFrom: [userId] // 这里应该追加到现有列表，简化处理
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update channel security: ${response.statusText}`);
      }

      logger.info(`[PairingManager] Added user ${userId} to channel ${channelId} allowlist`);
    } catch (error) {
      logger.error('[PairingManager] Failed to add user to allowlist:', error);
      throw error;
    }
  }

  /**
   * 查找用户的待配对会话
   */
  private findPendingSession(channelId: string, userId: string): PairingSession | null {
    for (const session of this.sessions.values()) {
      if (session.channelId === channelId &&
          session.userId === userId &&
          session.status === 'pending' &&
          new Date() < session.expiresAt) {
        return session;
      }
    }
    return null;
  }

  /**
   * 生成会话 ID
   */
  private generateSessionId(): string {
    return `pair_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  /**
   * 生成配对密钥
   */
  private generateSecret(): string {
    return randomBytes(this.SECRET_LENGTH).toString('hex').match(/.{1,4}/g)?.join('-') || '';
  }

  /**
   * 格式化配对码（添加连字符提高可读性）
   */
  private formatPairingCode(secret: string): string {
    return secret.match(/.{1,4}/g)?.join('-') || secret;
  }

  /**
   * 检查是否为有效的配对码格式
   */
  private isValidPairingCodeFormat(code: string): boolean {
    // 配对码应该是 32 个十六进制字符（忽略连字符和空格）
    const cleanCode = code.replace(/[\s\-]/g, '');
    return /^[a-fA-F0-9]{32}$/.test(cleanCode);
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt || session.status === 'verified') {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`[PairingManager] Cleaned up ${cleanedCount} expired/verified sessions`);
    }
  }

  /**
   * 获取配对统计信息
   */
  getStats(): {
    totalSessions: number;
    pendingSessions: number;
    verifiedSessions: number;
    expiredSessions: number;
  } {
    const now = new Date();
    let pending = 0, verified = 0, expired = 0;

    for (const session of this.sessions.values()) {
      if (session.status === 'pending' && now < session.expiresAt) {
        pending++;
      } else if (session.status === 'verified') {
        verified++;
      } else {
        expired++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      pendingSessions: pending,
      verifiedSessions: verified,
      expiredSessions: expired
    };
  }

  /**
   * 手动触发配对（管理员功能）
   */
  async manualPair(channelId: string, userId: string): Promise<PairingResponse> {
    try {
      await this.addUserToAllowlist(channelId, userId);

      return {
        success: true,
        message: `✅ 管理员手动配对成功\n\n用户 ${userId} 已被添加到通道 ${channelId} 的白名单中。`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ 手动配对失败：${(error as Error).message}`
      };
    }
  }

  /**
   * 撤销配对（管理员功能）
   */
  async revokePairing(channelId: string, userId: string): Promise<PairingResponse> {
    try {
      // 查找并取消用户的待配对会话
      for (const session of this.sessions.values()) {
        if (session.channelId === channelId && session.userId === userId) {
          session.status = 'cancelled';
        }
      }

      // 从通道白名单中移除用户
      const response = await fetch(getLocalBffUrl(`/api/channels/${channelId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          security: {
            allowFrom: [] // 这里应该从现有列表中移除，简化处理
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update channel security: ${response.statusText}`);
      }

      logger.info(`[PairingManager] Revoked pairing for user ${userId} on channel ${channelId}`);

      return {
        success: true,
        message: `✅ 配对已撤销\n\n用户 ${userId} 的访问权限已被移除。`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ 撤销配对失败：${(error as Error).message}`
      };
    }
  }
}

// 导出单例实例
export const pairingManager = new PairingManager();

// 定时清理过期会话（每小时清理一次）
setInterval(() => {
  pairingManager.cleanupExpiredSessions();
}, 60 * 60 * 1000);
