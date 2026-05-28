/**
 * Commitment Extractor
 *
 * Extracts action items and commitments from meeting transcripts using the Gateway LLM.
 */

import { logger } from "../utils/logger.js";
import { chatSend } from "../gateway/client.js";

const EXTRACTION_PROMPT_TEMPLATE = `你是一个专业的会议记录分析助手。请仔细阅读以下会议转录文本，提取两种类型的信息：

1. **承诺/行动项**：包含具体任务的事项，可以有明确的执行人，也可以只有任务描述
2. **日历事件**：会议中提到的所有时间相关事项，包括：
   - 预约会议、待办会议
   - 出差、拜访、客户访问
   - 培训、学习计划
   - 截止时间、交付期限
   - 任何提到具体时间点的未来计划

请提取以下格式的信息：

**承诺/行动项**：
- who: 责任人姓名或角色（如果会议中明确提到了执行人则填写，否则填 null）
- what: 具体要做的事情（必填）
- deadline: 截止时间（YYYY-MM-DD 或相对时间如"下周一"；没有则填 null）
- confidence: 置信度（0.0-1.0）

**日历事件**（即使没有指定负责人也要提取）：
- title: 事件标题（如"产品评审会议"、"长沙出差"、"客户拜访"等）
- startAt: 开始时间（YYYY-MM-DD HH:mm；无法确定则填 null）
- endAt: 结束时间（可选）
- description: 事件描述
- confidence: 置信度（0.0-1.0）

重要规则：
1. 承诺的 what 字段是必填的，即使没有明确说谁来做，只要提到了要做的事情就要提取
2. 日历事件要尽量提取，只要有明确的时间点或明确的计划就要创建事件
3. 对于"去XX"、"出差"、"拜访"等，要提取为日历事件
4. 对于"下周X"、"X号"等相对时间，要转换为具体日期
5. 如果会议中明确说了"张三负责XXX"或"李四下周要YYY"，who 就填对应的名字
6. 如果只是提到"我们下周要开会"或"需要做XXX"，who 可以填 null，后续由用户手动补充

请严格以 JSON 对象格式输出，包含两个数组：
{
  "commitments": [
    {"who": "张三", "what": "完成API文档更新", "deadline": "2024-06-15", "confidence": 0.95},
    {"who": null, "what": "准备下周的产品评审会议资料", "deadline": null, "confidence": 0.85}
  ],
  "calendarEvents": [
    {"title": "产品评审会议", "startAt": "2024-06-16 14:00", "endAt": "2024-06-16 15:00", "description": "新产品功能评审", "confidence": 0.9},
    {"title": "长沙出差", "startAt": "2024-06-20", "endAt": null, "description": "去长沙出差，拜访客户", "confidence": 0.8}
  ]
}

如果没有任何信息，请返回 {"commitments": [], "calendarEvents": []}。
不要包含任何其他文字或 Markdown 代码块标记。

转录文本：
{transcript}`;

export interface ExtractedCommitment {
  who: string;
  what: string;
  deadline: string | null;
  confidence: number;
}

export interface ExtractedCalendarEvent {
  title: string;
  startAt: string | null;
  endAt: string | null;
  description: string;
  confidence: number;
}

export interface ExtractionResult {
  commitments: ExtractedCommitment[];
  calendarEvents: ExtractedCalendarEvent[];
}

/**
 * Extract commitments/action items and calendar events from a meeting transcript.
 *
 * @param transcript The full meeting transcript text
 * @returns Object containing commitments and calendar events
 */
export async function extractCommitments(transcript: string): Promise<ExtractionResult> {
  if (!transcript || !transcript.trim()) {
    return { commitments: [], calendarEvents: [] };
  }

  try {
    logger.info(`[CommitmentExtractor] Extracting commitments and events from transcript (${transcript.length} chars)`);

    const prompt = EXTRACTION_PROMPT_TEMPLATE.replace("{transcript}", transcript);
    const result = await chatSend(
      `meeting-commitments-${Date.now()}`,
      prompt,
      { model: "openclaw" },
      "你是一个专业的会议记录分析助手。你的任务是从会议记录中提取承诺/行动项和日程事件。只输出纯 JSON 对象，包含 commitments 和 calendarEvents 两个数组，不要添加任何解释或 Markdown 标记。"
    );

    if (result.error) {
      logger.error(`[CommitmentExtractor] Gateway error: ${result.error}`);
      return { commitments: [], calendarEvents: [] };
    }

    const raw = (result.content || "").trim();

    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonStr = raw;
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // Try to find JSON object in the response
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objMatch) {
      jsonStr = objMatch[0];
    }

    const parsed = JSON.parse(jsonStr) as ExtractionResult;
    if (!parsed || typeof parsed !== "object") {
      logger.warn("[CommitmentExtractor] Parsed result is not an object");
      return { commitments: [], calendarEvents: [] };
    }

    // Validate and normalize commitments
    const commitments = (parsed.commitments || [])
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        who: String(item.who || "").trim(),
        what: String(item.what || "").trim(),
        deadline: item.deadline && typeof item.deadline === "string" ? item.deadline.trim() : null,
        confidence: typeof item.confidence === "number" ? Math.max(0, Math.min(1, item.confidence)) : 0.5,
      }))
      .filter((item) => item.what); // Only require 'what' to be present

    // Validate and normalize calendar events
    const calendarEvents = (parsed.calendarEvents || [])
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        title: String(item.title || "").trim(),
        startAt: item.startAt && typeof item.startAt === "string" ? item.startAt.trim() : null,
        endAt: item.endAt && typeof item.endAt === "string" ? item.endAt.trim() : null,
        description: String(item.description || "").trim(),
        confidence: typeof item.confidence === "number" ? Math.max(0, Math.min(1, item.confidence)) : 0.5,
      }))
      .filter((item) => item.title);

    logger.info(`[CommitmentExtractor] Extracted ${commitments.length} commitments, ${calendarEvents.length} calendar events`);
    return { commitments, calendarEvents };
  } catch (err) {
    logger.error("[CommitmentExtractor] Unexpected error:", err);
    return { commitments: [], calendarEvents: [] };
  }
}
