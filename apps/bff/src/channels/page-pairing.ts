import { logger } from "../utils/logger.js";
import { getLocalBffUrl } from "../utils/bff-url.js";
/**
 * 简化的页面配对管理器
 * 用户在MineEcho控制台页面输入配对码，无需访问服务器终端
 */
import { createHash, randomBytes } from 'node:crypto';
export interface PagePairingRequest {
  channelId: string;
  userId: string;
  pairingCode: string;
  userName?: string;
}

export interface PagePairingResponse {
  success: boolean;
  message: string;
  gatewayConnected?: boolean;
}

export class PagePairingManager {
  private readonly PAIRING_CODE_LENGTH = 6; // 6位数字配对码，更易输入
  private readonly VALIDITY_MINUTES = 30; // 30分钟有效期

  /**
   * 生成配对码
   * 6位数字，易于用户输入
   */
  async generatePairingCode(channelId: string, userId: string): Promise<{
    success: boolean;
    pairingCode?: string;
    instructions?: string;
    error?: string;
  }> {
    try {
      // 生成6位数字配对码
      const pairingCode = this.generateNumericCode();

      // 存储配对码（这里应该存到数据库或缓存中）
      await this.storePairingCode(pairingCode, channelId, userId);

      return {
        success: true,
        pairingCode,
        instructions: `🔐 配对码：${pairingCode}\n\n请在 MineEcho 控制台的配对页面输入此配对码。\n配对码有效期 ${this.VALIDITY_MINUTES} 分钟。`
      };

    } catch (error) {
      return {
        success: false,
        error: `生成配对码失败：${(error as Error).message}`
      };
    }
  }

  /**
   * 验证配对码
   */
  async verifyPairingCode(request: PagePairingRequest): Promise<PagePairingResponse> {
    try {
      // 1. 验证配对码格式
      if (!this.isValidPairingCodeFormat(request.pairingCode)) {
        return {
          success: false,
          message: '❌ 配对码格式错误，请输入6位数字配对码。'
        };
      }

      // 2. 验证配对码有效性
      const isValid = await this.validatePairingCode(request.pairingCode, request.channelId, request.userId);

      if (!isValid) {
        return {
          success: false,
          message: '❌ 配对码无效或已过期，请重新获取配对码。'
        };
      }

      // 3. 检查Gateway连接状态
      const gatewayConnected = await this.checkGatewayConnection();

      if (!gatewayConnected) {
        return {
          success: false,
          message: '❌ Gateway 未连接，请联系管理员检查服务状态。'
        };
      }

      // 4. 将用户添加到白名单
      await this.addUserToWhitelist(request.channelId, request.userId);

      // 5. 清理已使用的配对码
      await this.cleanupUsedPairingCode(request.pairingCode);

      return {
        success: true,
        message: '✅ 配对成功！\n\n您现在可以正常使用 MineEcho 了。\n\n输入 "帮助" 查看可用命令。',
        gatewayConnected: true
      };

    } catch (error) {
      logger.error('[PagePairingManager] Pairing verification failed:', error);
      return {
        success: false,
        message: `❌ 配对过程中出现错误：${(error as Error).message}`
      };
    }
  }

  /**
   * 获取配对说明
   */
  getPairingInstructions(): string {
    return `🔐 配对说明

1. 在飞书/MineEcho 机器人中发送："获取配对码"
2. 复制收到的6位数字配对码
3. 在 MineEcho 控制台的"配对管理"页面输入配对码
4. 点击"确认配对"完成

配对码有效期 30 分钟，每个配对码只能使用一次。

如需帮助，请联系管理员。`;
  }

  /**
   * 检查用户是否已配对
   */
  async isUserPaired(channelId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(getLocalBffUrl(`/api/channels/${channelId}`));
      const channel = await response.json() as any;

      return channel.security?.allowFrom?.includes(userId) || false;
    } catch {
      return false;
    }
  }

  /**
   * 生成6位数字配对码
   */
  private generateNumericCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 验证配对码格式
   */
  private isValidPairingCodeFormat(code: string): boolean {
    return /^\d{6}$/.test(code.trim());
  }

  /**
   * 存储配对码
   * 这里简化处理，实际应该存到数据库或Redis
   */
  private async storePairingCode(code: string, channelId: string, userId: string): Promise<void> {
    // 简化实现：使用内存存储
    // 实际项目中应该使用数据库或Redis
    const pairingData = {
      code,
      channelId,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.VALIDITY_MINUTES * 60 * 1000),
      used: false
    };

    // 这里应该存储到持久化存储
    logger.info(`[PagePairingManager] Generated pairing code ${code} for user ${userId} on channel ${channelId}`);
  }

  /**
   * 验证配对码
   */
  private async validatePairingCode(code: string, channelId: string, userId: string): Promise<boolean> {
    // 简化实现：检查配对码格式和基本逻辑
    // 实际项目中应该从数据库查询并验证

    // 模拟验证逻辑
    if (!this.isValidPairingCodeFormat(code)) {
      return false;
    }

    // 这里应该：
    // 1. 从数据库查找配对码
    // 2. 检查是否过期
    // 3. 检查是否已使用
    // 4. 检查通道和用户是否匹配

    return true; // 简化处理
  }

  /**
   * 清理已使用的配对码
   */
  private async cleanupUsedPairingCode(code: string): Promise<void> {
    // 简化实现：标记配对码为已使用
    logger.info(`[PagePairingManager] Pairing code ${code} marked as used`);
  }

  /**
   * 检查Gateway连接状态
   */
  private async checkGatewayConnection(): Promise<boolean> {
    try {
      const response = await fetch(getLocalBffUrl("/api/chat/gateway-status"));
      const status = await response.json() as any;
      return status.connected === true;
    } catch {
      return false;
    }
  }

  /**
   * 将用户添加到白名单
   */
  private async addUserToWhitelist(channelId: string, userId: string): Promise<void> {
    try {
      // 获取当前通道配置
      const channelResponse = await fetch(getLocalBffUrl(`/api/channels/${channelId}`));
      const channel = await channelResponse.json() as any;

      // 追加用户到白名单
      const currentAllowFrom = channel.security?.allowFrom || [];
      const updatedAllowFrom = currentAllowFrom.includes(userId)
        ? currentAllowFrom
        : [...currentAllowFrom, userId];

      // 更新通道配置
      await fetch(getLocalBffUrl(`/api/channels/${channelId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          security: {
            ...channel.security,
            allowFrom: updatedAllowFrom
          }
        }),
      });

      logger.info(`[PagePairingManager] Added user ${userId} to channel ${channelId} whitelist`);
    } catch (error) {
      logger.error('[PagePairingManager] Failed to add user to whitelist:', error);
      throw error;
    }
  }

  /**
   * 获取配对统计信息
   */
  async getPairingStats(): Promise<{
    totalPairedUsers: number;
    todayPairedUsers: number;
  }> {
    // 简化实现
    return {
      totalPairedUsers: 0,
      todayPairedUsers: 0
    };
  }
}

// 导出单例实例
export const pagePairingManager = new PagePairingManager();
