/**
 * Skill Analytics - Reads trajectory + usage data to generate performance reports
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getMineEchoHome } from "../utils/config-path.js";
import { longTermMemoryManager } from "../memory/long-term-memory.js";
import { logger } from "../utils/logger.js";
import type { SkillUsageRecord } from "../skills/usage-reporter.js";
import type { TrajectoryTurn } from "./trajectory-store.js";

export interface SkillPerformanceReport {
  skillId: string;
  totalCalls: number;
  successRate: number;
  averageLatencyMs: number;
  averageTokensPerCall: number;
  topFailureReasons: Array<{ reason: string; count: number }>;
  status: "healthy" | "needs_review" | "critical";
}

function getTrajectoryDir(): string {
  return join(getMineEchoHome(), "trajectories");
}

function normalizeFailureReason(reason: string): string {
  return reason.toLowerCase().trim().slice(0, 100);
}

function readTrajectoryFiles(days?: number): TrajectoryTurn[] {
  const dir = getTrajectoryDir();
  if (!existsSync(dir)) return [];

  const cutoff = days ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
  const turns: TrajectoryTurn[] = [];

  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
    for (const file of files) {
      const content = readFileSync(join(dir, file), "utf8");
      const lines = content.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        try {
          const turn = JSON.parse(line) as TrajectoryTurn;
          if (!cutoff || (turn.timestamp || 0) >= cutoff) {
            turns.push(turn);
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
  } catch (error) {
    logger.error("[SkillAnalytics] Failed to read trajectory files:", { error });
  }

  return turns;
}

function getLocalUsageRecordsSync(): SkillUsageRecord[] {
  const queueDir = join(getMineEchoHome(), ".usage-queue");
  if (!existsSync(queueDir)) return [];

  const records: SkillUsageRecord[] = [];
  try {
    const files = readdirSync(queueDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const content = readFileSync(join(queueDir, file), "utf8");
        records.push(JSON.parse(content) as SkillUsageRecord);
      } catch {
        // ignore malformed files
      }
    }
  } catch (error) {
    logger.error("[SkillAnalytics] Failed to read usage queue:", { error });
  }
  return records;
}

export function aggregateSkillPerformance(skillId: string, days = 7): SkillPerformanceReport | null {
  const usageRecords = getLocalUsageRecordsSync();
  const turns = readTrajectoryFiles(days);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  // Combine usage reporter records and trajectory tool calls for this skill
  const filteredUsage = usageRecords.filter(
    (r) => r.skillId === skillId && r.ts >= cutoff
  );

  const filteredTurns = turns.filter(
    (t) =>
      t.timestamp >= cutoff &&
      (t.toolCalls?.some((tc) => tc.name === skillId || tc.id === skillId) || t.skillName === skillId)
  );

  const totalCalls = filteredUsage.length + (filteredTurns.length > 0 ? filteredTurns.length : 0);

  if (totalCalls === 0) {
    return null;
  }

  const successesUsage = filteredUsage.filter((r) => r.success).length;
  const successesTurns = filteredTurns.filter((t) => !t.error && t.toolCalls?.every((tc) => tc.success !== false)).length;
  const successRate = totalCalls > 0 ? (successesUsage + successesTurns) / totalCalls : 1;

  const latencies: number[] = [
    ...filteredUsage.map((r) => r.latency).filter((l): l is number => typeof l === "number" && l > 0),
    ...filteredTurns.map((t) => t.latencyMs).filter((l): l is number => typeof l === "number" && l > 0),
  ];
  const averageLatencyMs = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  const tokens: number[] = [
    ...filteredUsage.map((r) => (r.tokens?.input || 0) + (r.tokens?.output || 0)).filter((t) => t > 0),
    ...filteredTurns.map((t) => (t.tokensInput || 0) + (t.tokensOutput || 0)).filter((t) => t > 0),
  ];
  const averageTokensPerCall = tokens.length > 0
    ? tokens.reduce((a, b) => a + b, 0) / tokens.length
    : 0;

  const failureMap = new Map<string, number>();
  for (const r of filteredUsage) {
    if (!r.success) {
      const reason = normalizeFailureReason(
        String(r.metadata?.errorMessage || r.metadata?.error || "unknown")
      );
      failureMap.set(reason, (failureMap.get(reason) || 0) + 1);
    }
  }
  for (const t of filteredTurns) {
    if (t.error) {
      const reason = normalizeFailureReason(t.error || "unknown");
      failureMap.set(reason, (failureMap.get(reason) || 0) + 1);
    }
    for (const tc of t.toolCalls || []) {
      if (tc.success === false && tc.result) {
        const reason = normalizeFailureReason(tc.result);
        failureMap.set(reason, (failureMap.get(reason) || 0) + 1);
      }
    }
  }
  const topFailureReasons = Array.from(failureMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  let status: "healthy" | "needs_review" | "critical" = "healthy";
  if (successRate < 0.5 && totalCalls >= 5) {
    status = "critical";
  } else if (successRate < 0.7 && totalCalls >= 10) {
    status = "needs_review";
  }

  return {
    skillId,
    totalCalls,
    successRate,
    averageLatencyMs,
    averageTokensPerCall,
    topFailureReasons,
    status,
  };
}

export function generateSkillImprovementSuggestions(skillId: string): string[] {
  const report = aggregateSkillPerformance(skillId);
  if (!report) {
    return ["暂无该技能的使用数据，无法生成建议。"];
  }

  const suggestions: string[] = [];

  if (report.status === "critical") {
    suggestions.push(
      `该技能最近成功率仅 ${Math.round(report.successRate * 100)}%（${report.totalCalls} 次调用），建议检查实现逻辑。`
    );
  } else if (report.status === "needs_review") {
    suggestions.push(
      `该技能成功率 ${Math.round(report.successRate * 100)}%（${report.totalCalls} 次调用），有优化空间。`
    );
  }

  if (report.topFailureReasons.length > 0) {
    const top = report.topFailureReasons[0];
    suggestions.push(
      `高频失败原因：${top.reason}（${top.count} 次），建议排查相关问题。`
    );
  }

  if (report.averageLatencyMs > 5000) {
    suggestions.push(
      `平均响应时间 ${Math.round(report.averageLatencyMs)}ms，建议增加超时时间或优化性能。`
    );
  }

  if (suggestions.length === 0) {
    return ["该技能运行状况良好。"];
  }

  return suggestions;
}

export async function getUserSkillInsights(userId: string): Promise<{
  topSkills: string[];
  strugglingSkills: string[];
  suggestedTriggers: string[];
}> {
  const patterns = await longTermMemoryManager.getSkillPatterns(userId);
  const skillUsages = patterns?.patterns || [];

  const topSkills = skillUsages
    .sort((a, b) => b.totalUses - a.totalUses)
    .slice(0, 5)
    .map((p) => p.skillId);

  const strugglingSkills = skillUsages
    .filter((p) => (p.averageSuccessRate || 0) < 0.6 && p.totalUses >= 3)
    .map((p) => p.skillId);

  const suggestedTriggers = extractSuggestedTriggers(userId);

  return {
    topSkills,
    strugglingSkills,
    suggestedTriggers,
  };
}

function extractSuggestedTriggers(userId: string): string[] {
  const turns = readTrajectoryFiles(7);
  const userTurns = turns.filter((t) => t.userId === userId && t.toolCalls && t.toolCalls.length > 0);

  const phrases = new Set<string>();
  for (const turn of userTurns) {
    const words = turn.userMessage.trim().split(/\s+/);
    const phrase = words.slice(0, 8).join(" ");
    if (phrase.length > 3) {
      phrases.add(phrase);
    }
  }

  return Array.from(phrases).slice(0, 10);
}
