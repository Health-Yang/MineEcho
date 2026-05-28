import { logger } from "../utils/logger.js";
import { getLocalBffUrl } from "../utils/bff-url.js";
/**
 * OpenClaw Gateway 配对管理器
 * 处理用户在 OpenClaw Gateway 执行命令进行配对的流程
 */
import { createHash, randomBytes } from 'node:crypto';
export interface GatewayPairingCommand {
  command: string;
  channelId: string;
  userId: string;
  timestamp: Date;
}

export interface GatewayPairingResponse {
  success: boolean;
  message: string;
  pairingCommand?: string;
  instructions?: string;
}

export class GatewayPairingManager {
  private pendingCommands: Map<string, GatewayPairingCommand> = new Map();

  /**
   * 生成 Gateway 配对命令
   * 用户需要在 OpenClaw Gateway 中执行此命令来完成配对
   */
  async generatePairingCommand(channelId: string, userId: string): Promise<GatewayPairingResponse> {
    try {
      // 生成唯一的配对令牌
      const pairingToken = this.generatePairingToken();
      const commandId = `pair_${Date.now()}_${randomBytes(4).toString('hex')}`;

      // 存储待处理的配对命令
      const command: GatewayPairingCommand = {
        command: `openclaw pair --token ${pairingToken} --channel ${channelId} --user ${userId}`,
        channelId,
        userId,
        timestamp: new Date()
      };

      this.pendingCommands.set(commandId, command);

      // 设置过期时间（24小时）
      setTimeout(() => {
        this.pendingCommands.delete(commandId);
      }, 24 * 60 * 60 * 1000);

      return {
        success: true,
        message: `🔐 请在 MineEcho Gateway 中执行以下命令完成配对：`,
        pairingCommand: command.command,
        instructions: `1. 打开终端，连接到 MineEcho Gateway\n2. 执行上面的命令\n3. 等待配对完成\n4. 返回 MineEcho 继续使用`
      };

    } catch (error) {
      return {
        success: false,
        message: `❌ 生成配对命令失败：${(error as Error).message}`
      };
    }
  }

  /**
   * 验证 Gateway 配对命令
   * 由 OpenClaw Gateway 调用，确认命令已执行
   */
  async verifyGatewayCommand(pairingToken: string, channelId: string, userId: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      // 查找匹配的待处理命令
      for (const [commandId, command] of this.pendingCommands.entries()) {
        if (command.channelId === channelId &&
            command.userId === userId &&
            command.command.includes(pairingToken)) {

          // 验证成功，将用户添加到白名单
          await this.addUserToWhitelist(channelId, userId);

          // 清理待处理命令
          this.pendingCommands.delete(commandId);

          logger.info(`[GatewayPairingManager] User ${userId} paired successfully via Gateway command`);

          return { valid: true };
        }
      }

      return {
        valid: false,
        error: '配对令牌无效或已过期'
      };

    } catch (error) {
      return {
        valid: false,
        error: `验证失败：${(error as Error).message}`
      };
    }
  }

  /**
   * 处理用户输入的 Gateway 命令
   * 用户可能直接发送命令字符串
   */
  async handleCommandInput(channelId: string, userId: string, input: string): Promise<GatewayPairingResponse> {
    try {
      // 检查是否为 Gateway 配对命令格式
      const commandMatch = input.match(/openclaw\s+pair\s+--token\s+([a-f0-9]+)\s+--channel\s+(\w+)\s+--user\s+(\S+)/);

      if (!commandMatch) {
        return {
          success: false,
          message: '❌ 无效的配对命令格式'
        };
      }

      const [, token, inputChannelId, inputUserId] = commandMatch;

      // 验证命令参数
      if (inputChannelId !== channelId || inputUserId !== userId) {
        return {
          success: false,
          message: '❌ 配对命令参数不匹配'
        };
      }

      // 验证配对令牌
      const verification = await this.verifyGatewayCommand(token, channelId, userId);

      if (verification.valid) {
        return {
          success: true,
          message: '✅ 配对成功！\n\n您现在可以正常使用 MineEcho 了。\n\n输入 "帮助" 查看可用命令。'
        };
      } else {
        return {
          success: false,
          message: `❌ 配对失败：${verification.error}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `❌ 处理配对命令失败：${(error as Error).message}`
      };
    }
  }

  /**
   * 生成配对令牌
   */
  private generatePairingToken(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * 将用户添加到白名单
   */
  private async addUserToWhitelist(channelId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(getLocalBffUrl(`/api/channels/${channelId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          security: {
            allowFrom: [userId]
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update channel security: ${response.statusText}`);
      }

      logger.info(`[GatewayPairingManager] Added user ${userId} to channel ${channelId} whitelist`);
    } catch (error) {
      logger.error('[GatewayPairingManager] Failed to add user to whitelist:', error);
      throw error;
    }
  }

  /**
   * 获取配对说明
   */
  getPairingInstructions(): string {
    return `🔐 Gateway 配对说明

1. 在飞书/MineEcho 机器人中发送："获取配对命令"
2. 复制收到的配对命令
3. 打开终端，连接到 MineEcho Gateway 服务器
4. 粘贴并执行配对命令
5. 等待配对完成提示
6. 返回 MineEcho 继续使用

配对命令格式：
openclaw pair --token <令牌> --channel <通道> --user <用户ID>

注意事项：
- 需要有 Gateway 的访问权限
- 配对令牌有效期 24 小时
- 每个用户只需配对一次

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
   * 获取待处理命令统计
   */
  getPendingCommandsStats(): {
    total: number;
    commands: Array<{
      id: string;
      channelId: string;
      userId: string;
      timestamp: string;
    }>;
  } {
    const commands = Array.from(this.pendingCommands.entries()).map(([id, cmd]) => ({
      id,
      channelId: cmd.channelId,
      userId: cmd.userId,
      timestamp: cmd.timestamp.toISOString()
    }));

    return {
      total: commands.length,
      commands
    };
  }

  /**
   * 清理过期命令
   */
  cleanupExpiredCommands(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [commandId, command] of this.pendingCommands.entries()) {
      const hoursDiff = (now.getTime() - command.timestamp.getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) {
        this.pendingCommands.delete(commandId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`[GatewayPairingManager] Cleaned up ${cleanedCount} expired commands`);
    }
  }
}

// 导出单例实例
export const gatewayPairingManager = new GatewayPairingManager();

// 定时清理过期命令（每小时清理一次）
setInterval(() => {
  gatewayPairingManager.cleanupExpiredCommands();
}, 60 * 60 * 1000);
