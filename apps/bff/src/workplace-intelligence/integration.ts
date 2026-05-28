/**
 * Workplace Intelligence System - Integration
 * 职场关系智能系统与 Chat 流程的集成模块
 *
 * 设计原则：
 * 1. 向后兼容：不修改现有 chat 响应格式
 * 2. 非侵入式：通过元数据传递建议，不影响主流程
 * 3. 可配置：支持全局和用户级开关
 * 4. 性能优先：本地检测，无外部依赖
 */

import type { Request, Response } from "express";
import type {
  WorkplaceIntelligenceConfig,
  DetectionResult,
  WorkplaceAdvice,
  UserRoleInfo,
  EnhancedMessageMetadata,
} from "./types.js";
import { scenarioDetector } from "./detector.js";
import { longTermMemoryManager } from "../memory/long-term-memory.js";
import { logger } from "../utils/logger.js";

/**
 * 集成配置（可从环境变量或配置文件加载）
 */
const INTEGRATION_CONFIG = {
  /** 全局开关 */
  enabled: process.env.WORKPLACE_INTELLIGENCE_ENABLED !== "false",
  /** 建议插入位置："before" | "after" | "separate" */
  insertPosition: (process.env.WORKPLACE_INTELLIGENCE_POSITION || "after") as
    | "before"
    | "after"
    | "separate",
  /** 最大建议长度 */
  maxAdviceLength: parseInt(
    process.env.WORKPLACE_INTELLIGENCE_MAX_LENGTH || "500",
    10
  ),
  /** 是否只在流式响应中附加建议 */
  streamOnly: process.env.WORKPLACE_INTELLIGENCE_STREAM_ONLY === "true",
  /** 严重级别阈值：低于此级别不显示建议 */
  minSeverityLevel: (process.env.WORKPLACE_INTELLIGENCE_MIN_SEVERITY ||
    "medium") as "low" | "medium" | "high" | "critical",
};

/**
 * 职场智能系统集成类
 */
export class WorkplaceIntelligenceIntegration {
  private detector = scenarioDetector;
  private severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };

  /**
   * 处理用户消息，检测敏感场景
   * 在 chat 流程的早期调用
   */
  async processUserMessage(
    userId: string,
    messageContent: string
  ): Promise<DetectionResult> {
    if (!INTEGRATION_CONFIG.enabled) {
      return {
        hasSensitiveScenario: false,
        scenarios: [],
        processingTimeMs: 0,
      };
    }

    try {
      const result = this.detector.detect(messageContent, userId);

      logger.debug("[WorkplaceIntelligence] Processed message:", {
        userId,
        hasSensitiveScenario: result.hasSensitiveScenario,
        scenarioCount: result.scenarios.length,
        processingTimeMs: result.processingTimeMs,
      });

      return result;
    } catch (error) {
      logger.error("[WorkplaceIntelligence] Detection failed:", {
        error: (error as Error).message,
        userId,
      });
      // 失败时返回空结果，不影响主流程
      return {
        hasSensitiveScenario: false,
        scenarios: [],
        processingTimeMs: 0,
      };
    }
  }

  /**
   * 获取用户角色信息
   * 用于个性化建议
   */
  async getUserRoleInfo(userId: string): Promise<UserRoleInfo | undefined> {
    try {
      const profile = await longTermMemoryManager.getUserProfile(userId);
      if (!profile) return undefined;

      // 从用户画像中提取角色信息
      // 这里可以根据实际业务需求扩展
      const roleInfo: UserRoleInfo = {
        title: this.inferTitleFromProfile(profile),
        yearsOfExperience: this.inferExperienceFromProfile(profile),
        isManager: false, // 可以从 profile 扩展
      };

      return roleInfo;
    } catch (error) {
      logger.warn("[WorkplaceIntelligence] Failed to get user role info:", {
        error: (error as Error).message,
        userId,
      });
      return undefined;
    }
  }

  /**
   * 从用户画像推断职位
   */
  private inferTitleFromProfile(profile: {
    domainExpertise?: Array<{ level: string }>;
    technicalStack?: { proficiency?: Record<string, string> };
  }): string | undefined {
    // 基于领域专业水平推断
    const expertDomains =
      profile.domainExpertise?.filter(
        (d) => d.level === "expert" || d.level === "advanced"
      ) || [];

    if (expertDomains.length >= 3) {
      return "资深工程师";
    } else if (expertDomains.length >= 1) {
      return "中级工程师";
    }

    // 基于技术栈深度推断
    const proficiencies = Object.values(
      profile.technicalStack?.proficiency || {}
    );
    const expertSkills = proficiencies.filter((p) => p === "expert").length;

    if (expertSkills >= 3) {
      return "高级工程师";
    } else if (expertSkills >= 1) {
      return "工程师";
    }

    return "初级工程师";
  }

  /**
   * 从用户画像推断工作年限
   */
  private inferExperienceFromProfile(profile: {
    createdAt?: number;
  }): number | undefined {
    // 简化推断：基于账户创建时间
    // 实际可以基于技能使用模式、项目历史等更精确推断
    if (profile.createdAt) {
      const daysSinceCreated =
        (Date.now() - profile.createdAt) / (1000 * 60 * 60 * 24);
      // 假设早期用户经验更丰富
      if (daysSinceCreated > 365) {
        return Math.floor(daysSinceCreated / 365);
      }
    }
    return undefined;
  }

  /**
   * 检查建议是否应该显示
   */
  shouldShowAdvice(advice: WorkplaceAdvice): boolean {
    // 检查严重级别阈值
    const adviceSeverity = this.severityOrder[advice.scenario.severity];
    const minSeverity = this.severityOrder[INTEGRATION_CONFIG.minSeverityLevel];

    if (adviceSeverity < minSeverity) {
      return false;
    }

    // 检查长度限制
    if (advice.content.length > INTEGRATION_CONFIG.maxAdviceLength) {
      return false;
    }

    return true;
  }

  /**
   * 将建议附加到 AI 响应
   *
   * 策略：
   * - "before": 建议放在技术回答之前
   * - "after": 建议放在技术回答之后（默认）
   * - "separate": 建议作为独立消息
   */
  attachAdviceToResponse(
    aiResponse: string,
    advice: WorkplaceAdvice,
    position?: "before" | "after" | "separate"
  ): { content: string; isSeparate: boolean } {
    const pos = position || INTEGRATION_CONFIG.insertPosition;

    if (pos === "separate") {
      return {
        content: aiResponse,
        isSeparate: true,
      };
    }

    const separator = "\n\n---\n\n";
    const adviceContent = advice.content;

    if (pos === "before") {
      return {
        content: `${adviceContent}${separator}${aiResponse}`,
        isSeparate: false,
      };
    } else {
      // "after"
      return {
        content: `${aiResponse}${separator}${adviceContent}`,
        isSeparate: false,
      };
    }
  }

  /**
   * 构建增强的元数据
   * 用于传递给前端或存储到记忆系统
   */
  buildEnhancedMetadata(
    detectionResult: DetectionResult,
    originalMetadata?: Record<string, unknown>
  ): EnhancedMessageMetadata {
    return {
      originalMetadata,
      detectedScenarios: detectionResult.scenarios,
      workplaceAdvice: detectionResult.advice,
      detectedAt: Date.now(),
    };
  }

  /**
   * 获取集成配置
   */
  getConfig() {
    return { ...INTEGRATION_CONFIG };
  }

  /**
   * 更新集成配置（运行时）
   */
  updateConfig(
    config: Partial<{
      enabled: boolean;
      insertPosition: "before" | "after" | "separate";
      maxAdviceLength: number;
      streamOnly: boolean;
      minSeverityLevel: "low" | "medium" | "high" | "critical";
    }>
  ): void {
    const ALLOWED_CONFIG_KEYS = ['enabled', 'insertPosition', 'maxAdviceLength', 'streamOnly', 'minSeverityLevel'];
    for (const key of ALLOWED_CONFIG_KEYS) {
      if (key in config) {
        (INTEGRATION_CONFIG as any)[key] = (config as any)[key];
      }
    }
    logger.info("[WorkplaceIntelligence] Integration config updated:", config);
  }

  /**
   * 获取系统状态
   */
  getStatus(): {
    enabled: boolean;
    config: typeof INTEGRATION_CONFIG;
    detectorStats: ReturnType<typeof scenarioDetector.getStats>;
  } {
    return {
      enabled: INTEGRATION_CONFIG.enabled,
      config: this.getConfig(),
      detectorStats: this.detector.getStats(),
    };
  }
}

// 导出单例实例
export const workplaceIntelligenceIntegration =
  new WorkplaceIntelligenceIntegration();
