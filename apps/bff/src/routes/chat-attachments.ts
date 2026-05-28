import { existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { extractContentToMarkdown } from "../knowledge-base/extractors.js";
import { logger } from "../utils/logger.js";
import { getChatUploadDir } from "./chat-upload-path.js";

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface AttachmentContextOptions {
  uploadDir?: string;
  maxCharsPerFile?: number;
  maxTotalChars?: number;
}

const DEFAULT_MAX_CHARS_PER_FILE = 12000;
const DEFAULT_MAX_TOTAL_CHARS = 30000;

function attachmentFilenameFromUrl(url: string): string | null {
  const prefix = "/api/chat/uploads/";
  if (!url.startsWith(prefix)) return null;
  const raw = decodeURIComponent(url.slice(prefix.length));
  if (!raw || raw.includes("..") || raw.includes("/") || raw.includes("\\")) return null;
  return basename(raw);
}

function truncateText(text: string, limit: number): { text: string; truncated: boolean } {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= limit) return { text: normalized, truncated: false };
  return {
    text: `${normalized.slice(0, limit).trim()}\n\n[附件内容已截断，仅保留前 ${limit.toLocaleString()} 字符]`,
    truncated: true,
  };
}

export async function buildAttachmentContext(
  attachments: ChatAttachment[] | undefined,
  options: AttachmentContextOptions = {},
): Promise<string> {
  if (!attachments?.length) return "";

  const uploadDir = resolve(options.uploadDir || getChatUploadDir());
  const maxCharsPerFile = options.maxCharsPerFile ?? DEFAULT_MAX_CHARS_PER_FILE;
  const maxTotalChars = options.maxTotalChars ?? DEFAULT_MAX_TOTAL_CHARS;
  const blocks: string[] = [];
  let usedChars = 0;

  for (const attachment of attachments.slice(0, 5)) {
    const filename = attachmentFilenameFromUrl(attachment.url);
    if (!filename) continue;

    const filePath = resolve(uploadDir, filename);
    if (!filePath.startsWith(uploadDir) || !existsSync(filePath)) continue;

    try {
      const remaining = maxTotalChars - usedChars;
      if (remaining <= 0) break;

      const raw = await extractContentToMarkdown(filePath);
      const effectiveLimit = Math.min(maxCharsPerFile, remaining);
      const clipped = truncateText(raw, effectiveLimit);
      usedChars += clipped.text.length;

      blocks.push(
        `<attachment name="${attachment.name}" type="${attachment.type}" size="${attachment.size}">\n${clipped.text}\n</attachment>`,
      );
    } catch (error) {
      logger.warn("[ChatAttachments] Failed to extract attachment:", {
        name: attachment.name,
        type: attachment.type,
        error: (error as Error).message,
      });
      blocks.push(
        `<attachment name="${attachment.name}" type="${attachment.type}" size="${attachment.size}">\n[无法提取该附件内容：${(error as Error).message}]\n</attachment>`,
      );
    }
  }

  if (blocks.length === 0) return "";

  return [
    "<attachments>",
    "用户随消息上传了以下附件。回答时请优先使用附件正文；如附件内容不足，再说明限制。",
    ...blocks,
    "</attachments>",
  ].join("\n");
}

export async function appendAttachmentContext(
  content: string,
  attachments: ChatAttachment[] | undefined,
  options?: AttachmentContextOptions,
): Promise<string> {
  const attachmentContext = await buildAttachmentContext(attachments, options);
  if (!attachmentContext) return content;
  return `${content}\n\n${attachmentContext}`;
}
