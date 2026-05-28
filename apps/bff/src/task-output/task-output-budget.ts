import { compactToolOutput } from "../tokenjuice/index.js";
import { logger } from "../utils/logger.js";

export type TaskOutputScenario =
  | "ai-app"
  | "command"
  | "skill"
  | "document"
  | "coding"
  | "troubleshooting"
  | "general";

export interface TaskOutputBudgetInput {
  toolName: string;
  command?: string;
  input?: string;
  output: string;
  error?: string;
  exitCode?: number;
  scenario?: TaskOutputScenario;
  maxInlineChars?: number;
}

export interface TaskOutputBudgetResult {
  content: string;
  compacted: boolean;
  rawChars: number;
  reducedChars: number;
  ratio: number;
}

const DEFAULT_MAX_INLINE_CHARS = 4000;
const COMPACTION_TRIGGER_CHARS = 1800;

function countRawChars(output: string, error?: string): number {
  return output.length + (error?.length ?? 0);
}

function shouldCompact(input: TaskOutputBudgetInput, rawChars: number, maxInlineChars: number): boolean {
  if (rawChars > maxInlineChars) return true;
  if (rawChars < COMPACTION_TRIGGER_CHARS) return false;
  return input.scenario === "command" || input.scenario === "skill" || input.scenario === "troubleshooting" || input.scenario === "coding";
}

function buildCommand(input: TaskOutputBudgetInput): string | undefined {
  if (input.command) return input.command;
  if (input.scenario === "ai-app") return input.input ? `ai_app ${input.toolName}` : undefined;
  if (input.scenario === "skill") return `skill ${input.toolName}`;
  return undefined;
}

export async function budgetTaskOutputForMemory(input: TaskOutputBudgetInput): Promise<TaskOutputBudgetResult> {
  const output = input.output || "";
  const error = input.error || "";
  const rawChars = countRawChars(output, error);
  const maxInlineChars = input.maxInlineChars ?? DEFAULT_MAX_INLINE_CHARS;

  if (!shouldCompact(input, rawChars, maxInlineChars)) {
    return {
      content: output,
      compacted: false,
      rawChars,
      reducedChars: output.length,
      ratio: rawChars > 0 ? output.length / rawChars : 1,
    };
  }

  try {
    const compacted = await compactToolOutput(
      {
        toolName: input.toolName,
        command: buildCommand(input),
        stdout: output,
        stderr: error || undefined,
        exitCode: input.exitCode,
        metadata: {
          scenario: input.scenario || "general",
          input: input.input ? input.input.slice(0, 1000) : undefined,
          memoryBudget: true,
        },
      },
      { maxInlineChars }
    );

    const commandLine = buildCommand(input);
    const prefix = [
      "[TokenJuice 已为记忆系统压缩任务输出]",
      commandLine ? `命令/工具: ${commandLine}` : `工具: ${input.toolName}`,
      input.scenario ? `场景: ${input.scenario}` : undefined,
      `原始字符: ${rawChars}`,
      `压缩后字符: ${compacted.inlineText.length}`,
      "",
    ].filter(Boolean).join("\n");

    const content = `${prefix}${compacted.inlineText}`.slice(0, maxInlineChars);
    return {
      content,
      compacted: true,
      rawChars,
      reducedChars: content.length,
      ratio: rawChars > 0 ? content.length / rawChars : 1,
    };
  } catch (error_) {
    logger.warn("[TaskOutputBudget] TokenJuice compaction failed:", { error: (error_ as Error).message });
    const fallback = output.length > maxInlineChars
      ? `${output.slice(0, Math.max(0, maxInlineChars - 80))}\n\n[输出过长，已为记忆系统截断]`
      : output;
    return {
      content: fallback,
      compacted: fallback !== output,
      rawChars,
      reducedChars: fallback.length,
      ratio: rawChars > 0 ? fallback.length / rawChars : 1,
    };
  }
}
