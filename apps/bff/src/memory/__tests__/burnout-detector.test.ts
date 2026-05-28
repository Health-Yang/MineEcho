
/**
 * Burnout Detector Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateBurnoutMetrics,
  calculateRiskScore,
  getRiskLevel,
  generateCareMessage,
  generateCareSuggestions,
  BurnoutDetector,
} from "../burnout-detector.js";
import type { ShortTermMemory, Interaction } from "../types.js";

// Mock dependencies
vi.mock("../short-term-memory.js", () => ({
  shortTermMemoryManager: {
    getMemoryForDate: vi.fn(),
    exportMemory: vi.fn(),
  },
}));

vi.mock("../long-term-memory.js", () => ({
  longTermMemoryManager: {
    getBurnoutHistory: vi.fn(),
    updateBurnoutHistory: vi.fn(),
  },
}));

vi.mock("../../utils/logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("Burnout Detector", () => {
  describe("calculateBurnoutMetrics", () => {
    it("should calculate metrics for normal work day", () => {
      const interactions: Interaction[] = [
        {
          id: "1",
          timestamp: Date.now() - 3600000, // 1 hour ago
          type: "chat",
          content: "Help me with this code",
        },
        {
          id: "2",
          timestamp: Date.now() - 1800000, // 30 min ago
          type: "chat",
          content: "Thanks, that works!",
        },
      ];

      const memory: ShortTermMemory = {
        date: "2024-01-15",
        userId: "user-1",
        dailyInteractions: interactions,
        learnedPreferences: [],
        pendingTasks: [],
        lastUpdated: Date.now(),
      };

      const metrics = calculateBurnoutMetrics(memory);

      expect(metrics.totalActiveMinutes).toBeGreaterThan(0);
      expect(metrics.nightInteractions).toBe(0);
      expect(metrics.weekendInteractions).toBe(0);
      expect(metrics.urgentContentCount).toBe(0);
      expect(metrics.stressIndicators).toEqual([]);
    });

    it("should detect night work interactions", () => {
      const nightTime = new Date("2024-01-15T23:30:00").getTime();
      const interactions: Interaction[] = [
        {
          id: "1",
          timestamp: nightTime,
          type: "chat",
          content: "Emergency bug fix needed",
        },
      ];

      const memory: ShortTermMemory = {
        date: "2024-01-15",
        userId: "user-1",
        dailyInteractions: interactions,
        learnedPreferences: [],
        pendingTasks: [],
        lastUpdated: Date.now(),
      };

      const metrics = calculateBurnoutMetrics(memory);

      expect(metrics.nightInteractions).toBe(1);
      expect(metrics.urgentContentCount).toBe(1);
    });

    it("should detect weekend work", () => {
      // Sunday
      const interactions: Interaction[] = [
        {
          id: "1",
          timestamp: Date.now(),
          type: "chat",
          content: "Working on weekend project",
        },
      ];

      const memory: ShortTermMemory = {
        date: "2024-01-14", // Sunday
        userId: "user-1",
        dailyInteractions: interactions,
        learnedPreferences: [],
        pendingTasks: [],
        lastUpdated: Date.now(),
      };

      const metrics = calculateBurnoutMetrics(memory);

      expect(metrics.weekendInteractions).toBe(1);
    });

    it("should detect stress keywords", () => {
      const interactions: Interaction[] = [
        {
          id: "1",
          timestamp: Date.now(),
          type: "chat",
          content: "I'm so stressed and exhausted from this bug",
        },
        {
          id: "2",
          timestamp: Date.now() + 1000,
          type: "chat",
          content: "The system crashed again, feeling overwhelmed",
        },
      ];

      const memory: ShortTermMemory = {
        date: "2024-01-15",
        userId: "user-1",
        dailyInteractions: interactions,
        learnedPreferences: [],
        pendingTasks: [],
        lastUpdated: Date.now(),
      };

      const metrics = calculateBurnoutMetrics(memory);

      expect(metrics.stressIndicators.length).toBeGreaterThan(0);
      expect(metrics.stressIndicators).toContain("stressed");
      expect(metrics.stressIndicators).toContain("exhausted");
    });

    it("should handle empty interactions", () => {
      const memory: ShortTermMemory = {
        date: "2024-01-15",
        userId: "user-1",
        dailyInteractions: [],
        learnedPreferences: [],
        pendingTasks: [],
        lastUpdated: Date.now(),
      };

      const metrics = calculateBurnoutMetrics(memory);

      expect(metrics.totalActiveMinutes).toBe(0);
      expect(metrics.nightInteractions).toBe(0);
      expect(metrics.stressIndicators).toEqual([]);
    });
  });

  describe("calculateRiskScore", () => {
    it("should return low score for healthy work pattern", () => {
      const metrics = {
        totalActiveMinutes: 120,
        nightInteractions: 0,
        weekendInteractions: 0,
        urgentContentCount: 0,
        stressIndicators: [],
        lastCalculated: Date.now(),
      };

      const { score, factors } = calculateRiskScore(metrics, 2);

      expect(score).toBeLessThan(30);
      expect(factors.length).toBe(0);
    });

    it("should return high score for burnout pattern", () => {
      const metrics = {
        totalActiveMinutes: 600, // 10 hours
        nightInteractions: 5,
        weekendInteractions: 10,
        urgentContentCount: 8,
        stressIndicators: ["stressed", "exhausted", "overwhelmed", "tired"],
        lastCalculated: Date.now(),
      };

      const { score, factors } = calculateRiskScore(metrics, 10);

      expect(score).toBeGreaterThan(70);
      expect(factors.length).toBeGreaterThan(0);
      expect(factors.some((f) => f.includes("夜间"))).toBe(true);
      expect(factors.some((f) => f.includes("连续"))).toBe(true);
    });

    it("should cap score at 100", () => {
      const metrics = {
        totalActiveMinutes: 1000,
        nightInteractions: 20,
        weekendInteractions: 50,
        urgentContentCount: 30,
        stressIndicators: Array(20).fill("stressed"),
        lastCalculated: Date.now(),
      };

      const { score } = calculateRiskScore(metrics, 30);

      expect(score).toBe(100);
    });
  });

  describe("getRiskLevel", () => {
    it("should return low for score < 30", () => {
      expect(getRiskLevel(0)).toBe("low");
      expect(getRiskLevel(29)).toBe("low");
    });

    it("should return medium for score 30-49", () => {
      expect(getRiskLevel(30)).toBe("medium");
      expect(getRiskLevel(49)).toBe("medium");
    });

    it("should return high for score 50-69", () => {
      expect(getRiskLevel(50)).toBe("high");
      expect(getRiskLevel(69)).toBe("high");
    });

    it("should return critical for score >= 70", () => {
      expect(getRiskLevel(70)).toBe("critical");
      expect(getRiskLevel(100)).toBe("critical");
    });
  });

  describe("generateCareSuggestions", () => {
    it("should generate appropriate suggestions for critical level", () => {
      const suggestions = generateCareSuggestions("critical", [
        "夜间工作 5 次",
        "连续工作 10 天",
      ]);

      expect(suggestions).toContain("您的工作强度非常高，建议立即休息");
      expect(suggestions).toContain("考虑推迟非紧急任务，优先保证睡眠");
      expect(suggestions.some((s) => s.includes("熬夜"))).toBe(true);
      expect(suggestions.some((s) => s.includes("连续"))).toBe(true);
    });

    it("should generate appropriate suggestions for high level", () => {
      const suggestions = generateCareSuggestions("high", ["今日活跃 480 分钟"]);

      expect(suggestions).toContain("您最近工作很辛苦，记得适当休息");
      expect(suggestions).toContain("建议每隔 1-2 小时起身活动一下");
    });

    it("should generate gentle suggestions for medium level", () => {
      const suggestions = generateCareSuggestions("medium", []);

      expect(suggestions).toContain("注意劳逸结合，保持工作节奏");
    });
  });

  describe("generateCareMessage", () => {
    it("should generate urgent message for critical level", () => {
      const assessment = {
        userId: "user-1",
        date: "2024-01-15",
        score: 85,
        level: "critical" as const,
        factors: ["夜间工作 5 次", "连续工作 10 天"],
        metrics: {
          totalActiveMinutes: 600,
          nightInteractions: 5,
          weekendInteractions: 0,
          urgentContentCount: 3,
          stressIndicators: [],
          lastCalculated: Date.now(),
        },
        suggestions: ["建议立即休息"],
      };

      const message = generateCareMessage(assessment);

      expect(message.type).toBe("urgent");
      expect(message.title).toContain("⚠️");
      expect(message.content).toContain("工作强度非常高");
      expect(message.actions).toContain("查看建议");
    });

    it("should generate supportive message for high level", () => {
      const assessment = {
        userId: "user-1",
        date: "2024-01-15",
        score: 60,
        level: "high" as const,
        factors: ["今日活跃 480 分钟"],
        metrics: {
          totalActiveMinutes: 480,
          nightInteractions: 0,
          weekendInteractions: 0,
          urgentContentCount: 0,
          stressIndicators: [],
          lastCalculated: Date.now(),
        },
        suggestions: ["记得适当休息"],
      };

      const message = generateCareMessage(assessment);

      expect(message.type).toBe("supportive");
      expect(message.title).toContain("💙");
    });

    it("should generate gentle message for low level", () => {
      const assessment = {
        userId: "user-1",
        date: "2024-01-15",
        score: 15,
        level: "low" as const,
        factors: [],
        metrics: {
          totalActiveMinutes: 60,
          nightInteractions: 0,
          weekendInteractions: 0,
          urgentContentCount: 0,
          stressIndicators: [],
          lastCalculated: Date.now(),
        },
        suggestions: ["保持良好的工作节奏"],
      };

      const message = generateCareMessage(assessment);

      expect(message.type).toBe("gentle");
      expect(message.content).toContain("很健康");
    });
  });

  describe("BurnoutDetector class", () => {
    let detector: BurnoutDetector;

    beforeEach(() => {
      detector = new BurnoutDetector();
      // Reset environment
      process.env.ENABLE_BURNOUT_DETECTION = "true";
    });

    it("should be disabled by default when env var is not set", () => {
      delete process.env.ENABLE_BURNOUT_DETECTION;
      const newDetector = new BurnoutDetector();
      expect(newDetector.isDetectionEnabled()).toBe(false);
    });

    it("should be enabled when env var is set to true", () => {
      process.env.ENABLE_BURNOUT_DETECTION = "true";
      const newDetector = new BurnoutDetector();
      expect(newDetector.isDetectionEnabled()).toBe(true);
    });

    it("should allow runtime toggle", () => {
      detector.setEnabled(false);
      expect(detector.isDetectionEnabled()).toBe(false);

      detector.setEnabled(true);
      expect(detector.isDetectionEnabled()).toBe(true);
    });
  });
});
