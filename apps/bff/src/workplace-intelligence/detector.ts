/**
 * Workplace Intelligence System - Scenario Detector
 * 职场敏感场景检测器
 *
 * 基于规则引擎本地检测敏感场景，无需调用外部 AI
 */

import type {
  DetectionResult,
  DetectedScenario,
  DetectionRule,
  WorkplaceIntelligenceConfig,
  UserRoleInfo,
  WorkplaceAdvice,
} from "./types.js";
import { DEFAULT_CONFIG } from "./types.js";
import { ALL_DETECTION_RULES } from "./detection-rules.js";
import { generateAdvice } from "./advice-templates.js";
import { logger } from "../utils/logger.js";
import { LRUCache } from "../utils/lru-cache.js";

// 冷却表上限配置
const MAX_COOLDOWN_ENTRIES = parseInt(process.env.MAX_COOLDOWN_ENTRIES || "10000", 10);

/**
 * 场景检测器类
 */
export class ScenarioDetector {
  private config: WorkplaceIntelligenceConfig;
  private rules: DetectionRule[];
  /** 冷却记录：用户ID -> 场景类型 -> 上次检测时间 - 使用LRU缓存限制上限 */
  private cooldownMap: LRUCache<string, Map<string, number>>;

  constructor(config: Partial<WorkplaceIntelligenceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rules = [...ALL_DETECTION_RULES];

    // 初始化LRU缓存限制冷却表上限
    this.cooldownMap = new LRUCache<string, Map<string, number>>({
      maxSize: MAX_COOLDOWN_ENTRIES,
      name: "WorkplaceCooldownMap",
      logEviction: true,
    });

    // 加载自定义规则
    if (this.config.customRules) {
      for (const customRule of this.config.customRules) {
        const existingIndex = this.rules.findIndex(
          (r) => r.id === customRule.id
        );
        if (existingIndex >= 0) {
          // 覆盖现有规则
          this.rules[existingIndex] = {
            ...this.rules[existingIndex],
            ...customRule,
          } as DetectionRule;
        } else if (customRule.id) {
          // 添加新规则
          this.rules.push(customRule as DetectionRule);
        }
      }
    }

    // 过滤禁用的场景类型
    if (this.config.disabledScenarioTypes?.length) {
      this.rules = this.rules.filter(
        (r) => !this.config.disabledScenarioTypes?.includes(r.type)
      );
    }
  }

  /**
   * 检测消息中的敏感场景
   */
  detect(messageContent: string, userId: string): DetectionResult {
    const startTime = Date.now();

    if (!this.config.enabled) {
      return {
        hasSensitiveScenario: false,
        scenarios: [],
        processingTimeMs: Date.now() - startTime,
      };
    }

    const scenarios: DetectedScenario[] = [];
    const content = messageContent.toLowerCase();

    for (const rule of this.rules) {
      // 检查冷却期
      if (this.isInCooldown(userId, rule.type)) {
        continue;
      }

      const matchResult = this.matchRule(content, rule);
      if (matchResult.matched && matchResult.confidence >= rule.minConfidence) {
        const scenario: DetectedScenario = {
          type: rule.type,
          subtype: rule.subtype,
          severity: rule.severity,
          confidence: matchResult.confidence,
          matchedKeywords: matchResult.matchedKeywords,
          contextSnippet: this.extractContext(messageContent, matchResult.matchedKeywords),
          detectedAt: Date.now(),
        };

        scenarios.push(scenario);

        // 更新冷却时间
        this.updateCooldown(userId, rule.type);

        logger.debug("[WorkplaceIntelligence] Detected scenario:", {
          userId,
          type: rule.type,
          subtype: rule.subtype,
          confidence: matchResult.confidence,
        });
      }
    }

    // 按严重程度排序
    scenarios.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    // 生成建议（只取最高优先级的场景）
    let advice: WorkplaceAdvice | undefined;
    if (scenarios.length > 0 && this.config.adviceGenerationEnabled) {
      // 优先处理高严重程度的场景
      const criticalOrHigh = scenarios.find(
        (s) => s.severity === "critical" || s.severity === "high"
      );
      const targetScenario = criticalOrHigh || scenarios[0];
      advice = generateAdvice(targetScenario);
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      hasSensitiveScenario: scenarios.length > 0,
      scenarios,
      advice,
      processingTimeMs,
    };
  }

  /**
   * 匹配单条规则
   * 规则匹配逻辑：
   * - 必须关键词：至少匹配 60%（向上取整）
   * - 可选关键词：匹配越多，置信度越高
   * - 排除关键词：任一匹配则拒绝
   */
  private matchRule(
    content: string,
    rule: DetectionRule
  ): { matched: boolean; confidence: number; matchedKeywords: string[] } {
    const matchedKeywords: string[] = [];

    // 1. 检查必须关键词（至少匹配一定比例）
    let requiredMatched = 0;
    for (const keyword of rule.keywords) {
      if (this.containsKeyword(content, keyword)) {
        matchedKeywords.push(keyword);
        requiredMatched++;
      }
    }

    // 计算必须关键词的匹配比例（至少 60%，向上取整）
    const requiredThreshold = Math.ceil(rule.keywords.length * 0.6);
    if (requiredMatched < requiredThreshold) {
      return { matched: false, confidence: 0, matchedKeywords: [] };
    }

    // 2. 检查可选关键词（OR 关系）
    let optionalMatched = 0;
    if (rule.optionalKeywords && rule.optionalKeywords.length > 0) {
      for (const keyword of rule.optionalKeywords) {
        if (this.containsKeyword(content, keyword)) {
          matchedKeywords.push(keyword);
          optionalMatched++;
        }
      }
    }

    // 3. 检查排除关键词
    if (rule.excludeKeywords) {
      for (const keyword of rule.excludeKeywords) {
        if (this.containsKeyword(content, keyword)) {
          return { matched: false, confidence: 0, matchedKeywords: [] };
        }
      }
    }

    // 4. 计算置信度
    // 基础置信度 = 规则权重 * 必须关键词匹配比例
    const requiredRatio = requiredMatched / rule.keywords.length;
    let confidence = rule.weight * requiredRatio;

    // 可选关键词匹配增加置信度
    if (rule.optionalKeywords && rule.optionalKeywords.length > 0) {
      const optionalRatio = optionalMatched / rule.optionalKeywords.length;
      confidence += optionalRatio * 0.15; // 最多增加 0.15
    }

    // 关键词密度因子：匹配的关键词越多，置信度越高
    const totalKeywords = rule.keywords.length + (rule.optionalKeywords?.length || 0);
    const keywordDensity = matchedKeywords.length / totalKeywords;
    confidence += keywordDensity * 0.1;

    // 限制最大置信度为 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      matched: confidence >= rule.minConfidence,
      confidence,
      matchedKeywords,
    };
  }

  /**
   * 检查内容是否包含关键词（支持中文分词简单匹配）
   */
  private containsKeyword(content: string, keyword: string): boolean {
    // 转义正则特殊字符
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedKeyword, "i");
    return regex.test(content);
  }

  /**
   * 提取上下文片段
   */
  private extractContext(
    content: string,
    keywords: string[],
    windowSize: number = 30
  ): string {
    if (keywords.length === 0) return content.slice(0, 100);

    const lowerContent = content.toLowerCase();
    let bestIndex = -1;
    let bestScore = 0;

    // 找到包含最多关键词的位置
    for (let i = 0; i < lowerContent.length; i++) {
      let score = 0;
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        const index = lowerContent.indexOf(keywordLower, i);
        if (index >= i && index < i + keywordLower.length + windowSize) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    if (bestIndex < 0) bestIndex = 0;

    // 提取窗口大小的上下文
    const start = Math.max(0, bestIndex - windowSize);
    const end = Math.min(content.length, bestIndex + windowSize * 2);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return snippet;
  }

  /**
   * 检查是否在冷却期
   */
  private isInCooldown(userId: string, scenarioType: string): boolean {
    const userCooldowns = this.cooldownMap.get(userId);
    if (!userCooldowns) return false;

    const lastDetected = userCooldowns.get(scenarioType);
    if (!lastDetected) return false;

    return Date.now() - lastDetected < this.config.cooldownPeriodMs;
  }

  /**
   * 更新冷却时间
   */
  private updateCooldown(userId: string, scenarioType: string): void {
    let userCooldowns = this.cooldownMap.get(userId);
    if (!userCooldowns) {
      userCooldowns = new Map();
      this.cooldownMap.set(userId, userCooldowns);
    }
    userCooldowns.set(scenarioType, Date.now());
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<WorkplaceIntelligenceConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info("[WorkplaceIntelligence] Config updated:", this.config);
  }

  /**
   * 获取当前配置
   */
  getConfig(): WorkplaceIntelligenceConfig {
    return { ...this.config };
  }

  /**
   * 清空冷却记录
   */
  clearCooldown(userId?: string): void {
    if (userId) {
      this.cooldownMap.delete(userId);
    } else {
      this.cooldownMap.clear();
    }
  }

  /**
   * 获取检测器统计信息
   */
  getStats(): {
    rulesCount: number;
    enabled: boolean;
    cooldownEntries: number;
  } {
    let cooldownEntries = 0;
    for (const userCooldowns of this.cooldownMap.values()) {
      cooldownEntries += userCooldowns.size;
    }

    return {
      rulesCount: this.rules.length,
      enabled: this.config.enabled,
      cooldownEntries,
    };
  }
}

// 导出单例实例
export const scenarioDetector = new ScenarioDetector();
