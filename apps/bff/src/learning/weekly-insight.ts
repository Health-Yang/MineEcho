/**
 * Weekly Insight Engine
 *
 * 规则引擎：从用户记忆中生成每周默契简报（不用LLM，避免延迟和成本）
 * 核心约束：绝对不影响现有功能和逻辑
 */

import { longTermMemoryManager } from "../memory/long-term-memory.js";
import { triggerStorage } from "../triggers/storage.js";
import { logger } from "../utils/logger.js";

export interface WeeklyInsight {
  topSkills: Array<{
    skillName: string;
    pattern: string; // 叙事化描述，如"周三下午固定出现"
  }>;
  learnedExpressions: Array<{
    expression: string;
    meaning: string;
  }>;
  suggestion: string | null;
  newUnlocks: string[];
  hasData: boolean;
}

export async function generateWeeklyInsight(userId: string): Promise<WeeklyInsight> {
  const patterns = await longTermMemoryManager.getSkillPatterns(userId);
  const profile = await longTermMemoryManager.getUserProfile(userId);

  if (!patterns || patterns.patterns.length === 0) {
    return { topSkills: [], learnedExpressions: [], suggestion: null, newUnlocks: [], hasData: false };
  }

  const topSkills = patterns.patterns
    .sort((a, b) => b.totalUses - a.totalUses)
    .slice(0, 3)
    .map((p) => ({
      skillName: p.skillName || p.skillId,
      pattern: inferPatternFromUsage(p),
    }));

  // 从 triggerStorage 获取最近7天新增的触发词
  const triggers = await triggerStorage.getByUser(userId);
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const learnedExpressions = triggers
    .filter((t) => t.createdAt > sevenDaysAgo)
    .slice(0, 3)
    .map((t) => ({
      expression: t.triggerPhrase,
      meaning: `调用 ${t.skillName}`,
    }));

  // 生成建议
  const suggestion = generateSuggestion(patterns, profile);

  return {
    topSkills,
    learnedExpressions,
    suggestion,
    newUnlocks: learnedExpressions.length > 0 ? ["新触发词学习已开启"] : [],
    hasData: true,
  };
}

function inferPatternFromUsage(usage: any): string {
  const days = Object.entries(usage.usageByDay || {})
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 2)
    .map(([day]) => day);
  if (days.length > 0) {
    return `${days.join("、")}经常使用`;
  }
  return `已使用 ${usage.totalUses} 次`;
}

function generateSuggestion(patterns: any, profile: any): string | null {
  // 简单规则：如果某个skill成功率低但使用频繁，给出建议
  const struggling = patterns.patterns.find(
    (p: any) => (p.averageSuccessRate || 0) < 0.6 && p.totalUses >= 5
  );
  if (struggling) {
    return `你经常使用「${struggling.skillName}」，但成功率似乎不高。需要我帮你检查一下吗？`;
  }

  // 如果技术栈有新检测到的
  const techStack = profile?.technicalStack;
  if (
    techStack &&
    (techStack.languages.length > 0 ||
      techStack.frameworks.length > 0 ||
      techStack.tools.length > 0)
  ) {
    const allTech = [
      ...techStack.languages.slice(0, 2),
      ...techStack.frameworks.slice(0, 2),
      ...techStack.tools.slice(0, 2),
    ];
    if (allTech.length > 0) {
      return `我注意到你在使用 ${allTech.join("、")}，有相关技能可以推荐给你。`;
    }
  }

  return null;
}
