import { recordTokenJuiceMetric } from "../tokenjuice/metrics.js";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type TaskScenario =
  | "coding"
  | "troubleshooting"
  | "command"
  | "document"
  | "research"
  | "general";

export interface ContextBudgetMetric {
  area: "history" | "memory" | "knowledge" | "tool" | "system";
  scenario: TaskScenario;
  rawChars: number;
  reducedChars: number;
  ratio: number;
  reducer: string;
}

export interface ContextBudgetPlan {
  messages: ChatMessage[];
  scenario: TaskScenario;
  metrics: ContextBudgetMetric[];
}

export interface ContextBudgetOptions {
  currentMessage: string;
  historyMaxChars?: number;
  systemExtensionMaxChars?: number;
}

const DEFAULT_HISTORY_MAX_CHARS = 2400;
const DEFAULT_SYSTEM_EXTENSION_MAX_CHARS = 4200;

const SCENARIO_PATTERNS: Array<{ scenario: TaskScenario; patterns: RegExp[] }> = [
  {
    scenario: "research",
    patterns: [/搜索|调研|最新|资料|引用|来源|网页|浏览器|竞品|对比/i],
  },
  {
    scenario: "troubleshooting",
    patterns: [/报错|错误|异常|失败|排查|修复|debug|TypeError|Error:|failed|failure/i],
  },
  {
    scenario: "coding",
    patterns: [/代码|编程|函数|组件|接口|重构|实现|脚本|测试|React|Vue|TypeScript|Python|JavaScript/i],
  },
  {
    scenario: "command",
    patterns: [/执行|命令|终端|shell|日志|ls |cat |npm |pnpm |yarn |git |docker |kubectl |curl /i],
  },
  {
    scenario: "document",
    patterns: [/文档|材料|汇报|方案|PPT|报告|总结|邮件|PRD|简历|合同/i],
  },
];

export function classifyTaskScenario(text: string): TaskScenario {
  const normalized = text.trim();
  for (const item of SCENARIO_PATTERNS) {
    if (item.patterns.some((pattern) => pattern.test(normalized))) {
      return item.scenario;
    }
  }
  return "general";
}

function estimateRatio(rawChars: number, reducedChars: number): number {
  return rawChars > 0 ? reducedChars / rawChars : 1;
}

function compactMiddle(text: string, maxChars: number): string {
  const normalized = text.replace(/\n{3,}/g, "\n\n").trim();
  if (normalized.length <= maxChars) return normalized;

  const headChars = Math.max(200, Math.floor(maxChars * 0.55));
  const tailChars = Math.max(160, maxChars - headChars - 80);
  const head = normalized.slice(0, headChars).trimEnd();
  const tail = normalized.slice(-tailChars).trimStart();
  return `${head}\n\n[TokenLess 已压缩中间 ${normalized.length - head.length - tail.length} 字]\n\n${tail}`;
}

function compactSystemContent(content: string, maxChars: number): { content: string; area: ContextBudgetMetric["area"] } {
  const marker = content.search(/\n\n(?=\[(用户画像|待办任务|常用技能|最近交互|相关旧记忆|知识库|知识引用|相关资料)\])/);
  if (marker < 0) {
    return { content: compactMiddle(content, maxChars), area: "system" };
  }

  const base = content.slice(0, marker).trimEnd();
  const extension = content.slice(marker).trim();
  const baseBudget = Math.min(base.length, Math.max(1600, Math.floor(maxChars * 0.62)));
  const extensionBudget = Math.max(800, maxChars - baseBudget);
  return {
    content: `${compactMiddle(base, baseBudget)}\n\n${compactMiddle(extension, extensionBudget)}`.trim(),
    area: extension.includes("知识") ? "knowledge" : "memory",
  };
}

function classifyArea(message: ChatMessage): ContextBudgetMetric["area"] {
  if (message.role === "system") {
    if (/相关旧记忆|用户画像|最近交互|待办任务/.test(message.content)) return "memory";
    if (/知识库|知识引用|相关资料/.test(message.content)) return "knowledge";
    return "system";
  }
  if (/exit \d+|npm ERR|Traceback|TypeError|Error:|Command|stdout|stderr|日志/.test(message.content)) {
    return "tool";
  }
  return "history";
}

function recordBudgetMetric(metric: ContextBudgetMetric): void {
  recordTokenJuiceMetric({
    family: `chat-${metric.area}`,
    reducer: metric.reducer,
    rawChars: metric.rawChars,
    reducedChars: metric.reducedChars,
    ratio: metric.ratio,
  });
}

export async function planChatContext(
  messages: ChatMessage[],
  options: ContextBudgetOptions
): Promise<ContextBudgetPlan> {
  const scenario = classifyTaskScenario(options.currentMessage);
  const historyMaxChars = options.historyMaxChars ?? DEFAULT_HISTORY_MAX_CHARS;
  const systemExtensionMaxChars = options.systemExtensionMaxChars ?? DEFAULT_SYSTEM_EXTENSION_MAX_CHARS;
  const metrics: ContextBudgetMetric[] = [];

  const plannedMessages = messages.map((message, index) => {
    const isCurrentUserMessage = index === messages.length - 1 && message.role === "user";
    if (isCurrentUserMessage) return message;

    const maxChars = message.role === "system" ? systemExtensionMaxChars : historyMaxChars;
    if (message.content.length <= maxChars) return message;

    const compacted =
      message.role === "system"
        ? compactSystemContent(message.content, maxChars)
        : { content: compactMiddle(message.content, maxChars), area: classifyArea(message) };

    const metric: ContextBudgetMetric = {
      area: compacted.area,
      scenario,
      rawChars: message.content.length,
      reducedChars: compacted.content.length,
      ratio: estimateRatio(message.content.length, compacted.content.length),
      reducer: `context-budget/${scenario}`,
    };
    metrics.push(metric);
    recordBudgetMetric(metric);

    return {
      ...message,
      content: compacted.content,
    };
  });

  return { messages: plannedMessages, scenario, metrics };
}
