export type ChatStatusInput = {
  status?: string;
  toolName?: string;
  message?: string;
  answerStarted?: boolean;
};

const TOOL_NAME_MAP: Record<string, string> = {
  "hci-solution-generator": "生成超融合实施方案",
  "code-interpreter": "执行代码",
  "web-search": "搜索网络",
  "file-search": "搜索文件",
  "knowledge-retrieval": "检索知识库",
  "document-parser": "解析文档",
  "image-generator": "生成图片",
  "data-analysis": "分析数据",
};

function containsElapsedWait(message: string): boolean {
  return /已?等待|等待.{0,8}(\d+|[一二三四五六七八九十半]+)\s*(秒|分钟|min|s)/i.test(message);
}

function cleanServerMessage(message?: string): string | null {
  const trimmed = message?.trim();
  if (!trimmed || containsElapsedWait(trimmed)) return null;
  return trimmed;
}

export function getChatProcessingStatus(input: ChatStatusInput): string | null {
  if (input.status === "tool_done") return null;

  if (input.status === "tool_start" && input.toolName) {
    const friendlyName = TOOL_NAME_MAP[input.toolName] || input.toolName;
    return cleanServerMessage(input.message) || `正在调用「${friendlyName}」`;
  }

  if (input.answerStarted) return null;

  switch (input.status) {
    case "retrieving_kb":
      return cleanServerMessage(input.message) || "正在检索相关记忆与知识库";
    case "waiting_model":
      return "模型正在处理";
    case "processing":
    case "thinking":
      return cleanServerMessage(input.message) || "正在整理上下文";
    default:
      return cleanServerMessage(input.message);
  }
}
