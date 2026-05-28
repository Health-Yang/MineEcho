import { logger } from "../utils/logger.js";
/**
 * OpenClaw 配对认证管理器
 * 处理用户从 OpenClaw 获取配对码后在 MineEcho 输入的认证流程
 */
import { createHash, randomBytes } from 'node:crypto';

const GATEWAY_BASE_URL = `http://127.0.0.1:${process.env.OPENCLAW_GATEWAY_PORT || '18789'}`;
const GATEWAY_WS_URL = `ws://127.0.0.1:${process.env.OPENCLAW_GATEWAY_PORT || '18789'}`;
export interface OpenClawPairingRequest {
  channelId: string;
  userId: string;
  pairingCode: string;
  userName?: string;
}

export interface OpenClawPairingResponse {
  success: boolean;
  message: string;
  gatewayConnected?: boolean;
}

export class OpenClawPairingManager {
  private readonly PAIRING_CODE_LENGTH = 32;
  private readonly VALIDITY_HOURS = 24;

  /**
   * 验证 OpenClaw 配对码
   * 配对码格式：32位十六进制，可能包含连字符分隔
   */
  async validatePairingCode(pairingCode: string): Promise<{
    valid: boolean;
    openClawEndpoint?: string;
    gatewayToken?: string;
    error?: string;
  }> {
    try {
      // 清理配对码格式
      const cleanCode = pairingCode.replace(/[\s\-]/g, '').toLowerCase();

      // 验证格式
      if (!/^[a-f0-9]{32}$/.test(cleanCode)) {
        return {
          valid: false,
          error: '配对码格式无效，请检查输入'
        };
      }

      // 这里应该调用 OpenClaw API 验证配对码
      // 目前模拟验证过程
      const isValid = await this.verifyWithOpenClaw(cleanCode);

      if (isValid) {
        return {
          valid: true,
          openClawEndpoint: GATEWAY_WS_URL, // 从环境变量读取端口
          gatewayToken: cleanCode // 配对码作为临时 token
        };
      } else {
        return {
          valid: false,
          error: '配对码无效或已过期'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: `验证失败: ${(error as Error).message}`
      };
    }
  }

  /**
   * 处理用户配对请求
   */
  async handlePairingRequest(request: OpenClawPairingRequest): Promise<OpenClawPairingResponse> {
    try {
      // 1. 验证配对码
      const validation = await this.validatePairingCode(request.pairingCode);

      if (!validation.valid) {
        return {
          success: false,
          message: `❌ 配对失败：${validation.error}\n\n请从 MineEcho 机器人获取新的配对码。`
        };
      }

      // 2. 配置 Gateway 连接
      const gatewayConfigured = await this.configureGatewayConnection({
        endpoint: validation.openClawEndpoint!,
        token: validation.gatewayToken!,
        channelId: request.channelId,
        userId: request.userId
      });

      if (!gatewayConfigured) {
        return {
          success: false,
          message: '❌ Gateway 连接配置失败，请检查网络连接。'
        };
      }

      // 3. 测试 Gateway 连接
      const connectionTest = await this.testGatewayConnection();

      if (!connectionTest) {
        return {
          success: false,
          message: '❌ Gateway 连接测试失败，请重试。'
        };
      }

      // 4. 将用户添加到白名单
      await this.addUserToWhitelist(request.channelId, request.userId);

      return {
        success: true,
        message: '✅ 配对成功！\n\n您现在可以通过 MineEcho 使用智能助手功能了。\n\n输入 "帮助" 查看可用命令。',
        gatewayConnected: true
      };

    } catch (error) {
      logger.error('[OpenClawPairingManager] Pairing failed:', error);
      return {
        success: false,
        message: `❌ 配对过程中出现错误：${(error as Error).message}`
      };
    }
  }

  /**
   * 与 OpenClaw 验证配对码
   */
  private async verifyWithOpenClaw(pairingCode: string): Promise<boolean> {
    try {
      // 方法1: 通过 OpenClaw Gateway API 验证
      const response = await fetch(`${GATEWAY_BASE_URL}/api/pairing/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pairingCode,
          source: 'mineecho'
        }),
      });

      if (response.ok) {
        const result = await response.json() as any;
        return result.valid === true;
      }

      // 方法2: 尝试使用配对码作为 token 连接 Gateway
      const testConnection = await this.testTokenConnection(pairingCode);
      return testConnection;

    } catch (error) {
      logger.warn('[OpenClawPairingManager] OpenClaw verification failed:', error);
      // 如果无法连接 OpenClaw，使用本地验证（开发模式）
      return this.localVerification(pairingCode);
    }
  }

  /**
   * 测试 token 连接
   */
  private async testTokenConnection(token: string): Promise<boolean> {
    try {
      // 尝试使用 token 连接 Gateway
      const response = await fetch(`${GATEWAY_BASE_URL}/api/health`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 本地验证（开发/测试用）
   */
  private localVerification(pairingCode: string): boolean {
    // 简单的本地验证逻辑
    // 在生产环境中，这里应该连接到 OpenClaw 服务器
    const isValidFormat = /^[a-f0-9]{32}$/.test(pairingCode);
    const isNotExpired = this.checkCodeExpiry(pairingCode);

    return isValidFormat && isNotExpired;
  }

  /**
   * 检查配对码过期时间（本地估算）
   */
  private checkCodeExpiry(pairingCode: string): boolean {
    // 这里可以根据配对码的生成时间戳判断
    // 目前简化处理，假设所有格式正确的配对码都有效
    return true;
  }

  /**
   * 配置 Gateway 连接
   */
  private async configureGatewayConnection(config: {
    endpoint: string;
    token: string;
    channelId: string;
    userId: string;
  }): Promise<boolean> {
    try {
      // 更新 BFF 的 Gateway 配置
      const response = await fetch('/api/config/gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: config.endpoint,
          token: config.token,
          pairedBy: config.userId,
          pairedAt: new Date().toISOString()
        }),
      });

      return response.ok;
    } catch (error) {
      logger.error('[OpenClawPairingManager] Gateway configuration failed:', error);
      return false;
    }
  }

  /**
   * 测试 Gateway 连接
   */
  private async testGatewayConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/chat/gateway-status');
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
      await fetch(`/api/channels/${channelId}`, {
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
    } catch (error) {
      logger.warn('[OpenClawPairingManager] Failed to add user to whitelist:', error);
    }
  }

  /**
   * 生成配对说明
   */
  getPairingInstructions(): string {
    return `🔐 配对说明

1. 打开飞书，找到 MineEcho 机器人
2. 发送消息："获取配对码" 或 "pairing"
3. 复制收到的配对码（32位字符）
4. 回到 MineEcho，发送：配对码

配对码有效期 24 小时，每个配对码只能使用一次。

如需帮助，请联系管理员。`;
  }

  /**
   * 检查用户是否已配对
   */
  async isUserPaired(channelId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/channels/${channelId}`);
      const channel = await response.json() as any;

      return channel.security?.allowFrom?.includes(userId) || false;
    } catch {
      return false;
    }
  }

  /**
   * 获取配对状态
   */
  async getPairingStatus(channelId: string, userId: string): Promise<{
    paired: boolean;
    gatewayConnected: boolean;
    lastPaired?: string;
  }> {
    const paired = await this.isUserPaired(channelId, userId);
    let gatewayConnected = false;

    try {
      const response = await fetch('/api/chat/gateway-status');
      const status = await response.json() as any;
      gatewayConnected = status.connected === true;
    } catch {
      // ignore
    }

    return {
      paired,
      gatewayConnected
    };
  }
}

// 导出单例实例
export const openClawPairingManager = new OpenClawPairingManager();
