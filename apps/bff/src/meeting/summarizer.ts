/**
 * AI Meeting Summarizer
 *
 * Generates structured meeting summaries from transcripts using the Gateway LLM.
 * Also provides transcript cleaning/organizing functionality.
 */

import { logger } from "../utils/logger.js";
import { chatSend } from "../gateway/client.js";

const SUMMARY_PROMPT_TEMPLATE = `你是一位资深项目经理，负责整理会议纪要。请根据以下会议转录文本，生成一份专业、完整、可直接发布的会议纪要。

## 输出格式要求

使用 Markdown 格式，严格遵循以下结构：

# 会议纪要

## 基本信息
- **会议时间：** [从文本中提取或标注"待确认"]
- **会议地点：** [从文本中提取或标注"待确认"]
- **参会人员：** [列出所有提及的人员/角色]
- **记录人：** MineEcho AI 助手

## 一、会议主题
[一句话概括本次会议的核心议题]

## 二、讨论内容
[按逻辑分段描述讨论要点，每个话题一段，段与段之间空一行]

### [子话题标题]
[详细描述该话题的讨论内容，包括关键观点、分歧点、共识等]

## 三、决策与共识
[列出会议上形成的明确决策和共识]

## 四、行动计划
| 序号 | 行动项 | 负责人 | 截止时间 |
|:---:|--------|--------|----------|
| 1 | [具体行动项] | [负责人] | [时间] |
| ... | ... | ... | ... |

## 五、待跟进事项
[列出需要后续跟进的问题或待确认的事项]

---
*本纪要由 AI 辅助整理，如有不准确之处请指正。*

---

## 写作规范
1. **一级标题用 # 标题（#后要空格）**
2. **二级标题用 ## 标题**
3. **每个段落之间空一行**
4. **使用规范的书面语言，避免口语化表达**
5. **去除所有语气词（呃、嗯、啊、那个、这个、然后等）**
6. **将碎片化表达整合为完整句子**
7. **内容要详尽，不要省略讨论细节**

转录文本：
{transcript}`;

const CLEAN_TRANSCRIPT_PROMPT_TEMPLATE = `你是一位资深项目经理，负责将口语化的会议转录整理成专业、详尽、可发布的书面版本。

## 核心任务
将下面的口语转录转换为结构清晰、段落分明、专业可读的文字记录。

## 输出格式
使用 Markdown 格式输出，包含以下部分：

# 会议记录

## 基本信息
- **会议时间：** [提取或标注待确认]
- **参会人员：** [列出所有人员]

## 会议内容

### [发言人/角色]: [发言主题或概括]
[详细整理该部分的讨论内容，将碎片化表达整合为完整段落。要点：
- 保留所有重要信息、观点、数据
- 去除语气词和不影响意思的重复
- 整合断断续续的表述为完整句子
- 用段落形式组织内容，每段聚焦一个子话题
- 保留发言人的原始观点和语气特点]

### [下一位发言人]: [下一个讨论话题]
[继续整理下一段讨论内容...]

## 核心结论
[如果有明确的结论或决定，在此总结]

## 待办事项
[列出所有提及的后续行动项]

---

## 写作规范
1. **标题格式：# 标题（#后必须有空格），## 子标题**
2. **段落之间空一行**
3. **每个发言人的内容用段落形式呈现，不使用列表**
4. **保留讨论的完整上下文和逻辑连贯性**
5. **去除语气词但保留语义完整性**
6. **专业书面语言，但保留发言人的表达风格**
7. **内容详尽，不要省略重要的讨论细节**

转录文本：
{transcript}`;

/**
 * Clean up a transcript by removing filler words and converting to formal written language.
 */
export async function cleanTranscript(transcript: string): Promise<{ cleaned: string; error?: string }> {
  if (!transcript || !transcript.trim()) {
    return { cleaned: "", error: "Transcript is empty" };
  }

  try {
    logger.info(`[Summarizer] Cleaning transcript (${transcript.length} chars)`);

    const prompt = CLEAN_TRANSCRIPT_PROMPT_TEMPLATE.replace("{transcript}", transcript);
    const result = await chatSend(
      `meeting-clean-${Date.now()}`,
      prompt,
      { model: "openclaw" },
      "你是一个专业的会议记录员。你的任务是将口语化的转录文本转换为规范的书面积面语言，去除填充词，保留原意。"
    );

    if (result.error) {
      logger.error(`[Summarizer] Transcript cleaning error: ${result.error}`);
      return { cleaned: "", error: `Transcript cleaning failed: ${result.error}` };
    }

    const cleaned = (result.content || "").trim();
    logger.info(`[Summarizer] Transcript cleaned: ${cleaned.length} chars`);
    return { cleaned };
  } catch (err) {
    logger.error("[Summarizer] Unexpected error during transcript cleaning:", err);
    return { cleaned: "", error: `Transcript cleaning error: ${(err as Error).message}` };
  }
}

/**
 * Summarize a meeting transcript into a structured summary.
 *
 * @param transcript The full meeting transcript text
 * @returns Summary text or error
 */
export async function summarizeMeeting(transcript: string): Promise<{ summary: string; error?: string }> {
  if (!transcript || !transcript.trim()) {
    return { summary: "", error: "Transcript is empty" };
  }

  try {
    logger.info(`[Summarizer] Summarizing transcript (${transcript.length} chars)`);

    const prompt = SUMMARY_PROMPT_TEMPLATE.replace("{transcript}", transcript);
    const result = await chatSend(
      `meeting-summary-${Date.now()}`,
      prompt,
      { model: "openclaw" },
      "你是一个专业的会议记录员。你的任务是生成结构清晰、内容准确的会议纪要。使用 Markdown 格式输出。"
    );

    if (result.error) {
      logger.error(`[Summarizer] Gateway error: ${result.error}`);
      return { summary: "", error: `Summary generation failed: ${result.error}` };
    }

    const summary = (result.content || "").trim();
    logger.info(`[Summarizer] Summary generated: ${summary.length} chars`);
    return { summary };
  } catch (err) {
    logger.error("[Summarizer] Unexpected error:", err);
    return { summary: "", error: `Summary error: ${(err as Error).message}` };
  }
}
