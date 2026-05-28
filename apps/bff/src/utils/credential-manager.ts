import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { logger } from "../utils/logger.js";

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function getKey(): Buffer {
  const envKey = process.env.MINECHO_ENCRYPTION_KEY;
  if (envKey) {
    return scryptSync(envKey, 'mineecho-salt-v1', 32);
  }
  // 无加密密钥时，使用稳定的 fallback key（桌面版首次启动时无法预设密钥）
  if (process.env.NODE_ENV === 'production') {
    logger.warn('[CredentialManager] MINECHO_ENCRYPTION_KEY not set, using built-in fallback key');
  }
  return scryptSync('mineecho-dev-key', 'dev-salt', 32);
}

export interface ChannelCredentials {
  appId?: string;
  appSecret?: string;
  corpId?: string;
  agentId?: string;
  encryptKey?: string;
  verificationToken?: string;
  callbackUrl?: string;
}

export class CredentialManager {
  private key: Buffer;

  constructor() {
    this.key = getKey();
  }

  /**
   * 加密凭证数据
   */
  encrypt(data: string): string {
    try {
      const iv = randomBytes(IV_LENGTH);
      const salt = randomBytes(SALT_LENGTH);
      const cipher = createCipheriv(ALGORITHM, this.key, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      return [
        salt.toString('hex'),
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted
      ].join(':');
    } catch (error) {
      throw new Error(`Encryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * 解密凭证数据
   */
  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }
      const salt = Buffer.from(parts[0], 'hex');
      const iv = Buffer.from(parts[1], 'hex');
      const authTag = Buffer.from(parts[2], 'hex');
      const encrypted = parts[3];

      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${(error as Error).message}`);
    }
  }

  /**
   * 存储凭证到通道配置
   */
  async storeCredentials(channelId: string, credentials: ChannelCredentials): Promise<Record<string, unknown>> {
    const credentialsJson = JSON.stringify(credentials);
    const encryptedCredentials = this.encrypt(credentialsJson);

    return {
      encrypted: true,
      data: encryptedCredentials,
      timestamp: new Date().toISOString(),
      channelId
    };
  }

  /**
   * 从通道配置中检索凭证
   */
  async retrieveCredentials(encryptedData: string): Promise<ChannelCredentials> {
    try {
      const decryptedJson = this.decrypt(encryptedData);
      return JSON.parse(decryptedJson) as ChannelCredentials;
    } catch (error) {
      throw new Error(`Failed to retrieve credentials: ${(error as Error).message}`);
    }
  }

  /**
   * 验证凭证完整性
   */
  validateCredentials(credentials: ChannelCredentials, type: 'feishu' | 'wework' | 'dingtalk'): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (type) {
      case 'feishu':
        if (!credentials.appId) errors.push('App ID is required');
        if (!credentials.appSecret) errors.push('App Secret is required');
        break;

      case 'wework':
        if (!credentials.corpId) errors.push('Corp ID is required');
        if (!credentials.agentId) errors.push('Agent ID is required');
        if (!credentials.appSecret) errors.push('Secret is required');
        break;

      case 'dingtalk':
        if (!credentials.appId) errors.push('App Key is required');
        if (!credentials.appSecret) errors.push('App Secret is required');
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成默认加密密钥（仅用于开发环境）
   */
  private generateDefaultKey(): string {
    logger.warn('[CredentialManager] Using default encryption key. Set MINECHO_ENCRYPTION_KEY for production.');
    return randomBytes(32).toString('hex');
  }

  /**
   * 清理敏感数据
   */
  sanitizeCredentials(credentials: ChannelCredentials): ChannelCredentials {
    const sanitized = { ...credentials };

    // 清理敏感字段，只保留配置状态
    if (sanitized.appSecret) sanitized.appSecret = '***';
    if (sanitized.encryptKey) sanitized.encryptKey = '***';
    if (sanitized.verificationToken) sanitized.verificationToken = '***';

    return sanitized;
  }
}

// 导出单例实例
export const credentialManager = new CredentialManager();
