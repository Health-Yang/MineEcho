/**
 * Speech-to-Text Transcriber
 *
 * Uses Alibaba Cloud DashScope Qwen-ASR for audio transcription.
 * Flow: upload file → submit async task → poll → download result.
 */

import { readFileSync, existsSync } from "node:fs";
import { logger } from "../utils/logger.js";

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || "";
const DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/api/v1";
const TRANSCRIPTION_MODEL = "qwen3-asr-flash-filetrans";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 150; // 5 minutes max

interface DashScopeFileUploadResult {
  file_id: string;
  url: string;
}

interface DashScopeTaskResult {
  task_status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "UNKNOWN";
  code?: string;
  message?: string;
  transcription_url?: string;
  results?: Array<{
    text: string;
    begin_time?: number;
    end_time?: number;
  }>;
}

/**
 * Upload audio file to DashScope file service.
 * Returns file metadata including a temporary OSS URL.
 */
async function uploadFileToDashScope(
  audioPath: string,
  apiKey: string
): Promise<DashScopeFileUploadResult> {
  const audioBuffer = readFileSync(audioPath);
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: "audio/webm" });
  formData.append("file", blob, "audio.webm");
  formData.append("purpose", "transcription");

  const response = await fetch(`${DASHSCOPE_BASE_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`File upload failed: ${response.status} - ${text}`);
  }

  const json = (await response.json()) as {
    data?: { uploaded_files?: Array<{ file_id: string; url?: string }> };
  };
  const fileInfo = json.data?.uploaded_files?.[0];
  if (!fileInfo?.file_id) {
    throw new Error("File upload response missing file_id");
  }

  let fileUrl = fileInfo.url;
  if (!fileUrl) {
    // Some uploads don't return url immediately; fetch file info to get it
    const infoRes = await fetch(`${DASHSCOPE_BASE_URL}/files/${fileInfo.file_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (infoRes.ok) {
      const infoJson = (await infoRes.json()) as { data?: { url?: string } };
      fileUrl = infoJson.data?.url;
    }
  }
  if (!fileUrl) {
    throw new Error("Unable to obtain file URL after upload");
  }

  return { file_id: fileInfo.file_id, url: fileUrl };
}

/**
 * Submit an async transcription task to DashScope.
 */
async function submitTranscriptionTask(
  fileUrl: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(`${DASHSCOPE_BASE_URL}/services/audio/asr/transcription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify({
      model: TRANSCRIPTION_MODEL,
      input: { file_url: fileUrl },
      parameters: {
        language: "zh",
        enable_itn: false,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`Task submission failed: ${response.status} - ${text}`);
  }

  const json = (await response.json()) as {
    output?: { task_id?: string };
  };
  const taskId = json.output?.task_id;
  if (!taskId) {
    throw new Error("Task submission response missing task_id");
  }

  return taskId;
}

/**
 * Poll task status until completion or timeout.
 */
async function pollTaskResult(
  taskId: string,
  apiKey: string
): Promise<DashScopeTaskResult> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const response = await fetch(`${DASHSCOPE_BASE_URL}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      logger.warn(`[Transcriber] Poll failed: ${response.status}, retrying...`);
      continue;
    }

    const json = (await response.json()) as {
      output?: DashScopeTaskResult & { result?: { transcription_url?: string } };
    };
    const result = json.output;

    if (!result) {
      continue;
    }

    if (result.task_status === "SUCCEEDED") {
      // transcription_url is nested under result.result.transcription_url
      if (result.result?.transcription_url) {
        result.transcription_url = result.result.transcription_url;
      }
      return result;
    }

    if (result.task_status === "FAILED") {
      throw new Error(
        `Transcription failed: ${result.code || "UNKNOWN"} - ${result.message || "No details"}`
      );
    }

    // PENDING or RUNNING: keep polling
  }

  throw new Error("Transcription timed out after 5 minutes");
}

/**
 * Download and parse transcription result from the given URL.
 */
async function downloadTranscription(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download transcription: ${response.status}`);
  }

  const json = (await response.json()) as {
    transcripts?: Array<{
      text?: string;
      sentences?: Array<{ text: string; begin_time?: number; end_time?: number }>;
    }>;
  };

  const transcript = json.transcripts?.[0];
  if (transcript?.text) {
    return transcript.text;
  }
  const sentences = transcript?.sentences || [];
  return sentences.map((s) => s.text).join("\n");
}

/**
 * Transcribe an audio file to text using DashScope Qwen-ASR.
 *
 * @param audioPath Absolute path to the audio file
 * @returns Transcription result or error
 */
export async function transcribeAudio(
  audioPath: string
): Promise<{ text: string; error?: string }> {
  if (!existsSync(audioPath)) {
    logger.error(`[Transcriber] Audio file not found: ${audioPath}`);
    return { text: "", error: "Audio file not found" };
  }

  // Priority: 1) dedicated transcription config 2) env var 3) openclaw.json fallback
  let apiKey: string | null = DASHSCOPE_API_KEY || null;
  if (!apiKey) {
    try {
      const { loadTranscriptionConfig } = await import("../config/transcription.js");
      const txCfg = await loadTranscriptionConfig();
      if (txCfg.enabled && txCfg.apiKey) {
        apiKey = txCfg.apiKey;
      }
    } catch {
      // transcription config not available, continue to fallback
    }
  }
  if (!apiKey) {
    apiKey = await readDashScopeKeyFromOpenclaw();
  }
  if (!apiKey) {
    return {
      text: "",
      error:
        "未配置 DashScope API Key，无法自动转录音频。\n" +
        "解决方案：\n" +
        "1. 在设置页面 > 语音转录中配置 API Key\n" +
        "2. 设置环境变量 DASHSCOPE_API_KEY\n" +
        "3. 或在 openclaw.json 的 models.providers 中配置 dashscope/aliyun 的 apiKey",
    };
  }

  try {
    logger.info(`[Transcriber] Starting transcription for: ${audioPath}`);

    // Step 1: Upload file
    logger.info(`[Transcriber] Uploading file to DashScope...`);
    const uploadResult = await uploadFileToDashScope(audioPath, apiKey);
    logger.info(`[Transcriber] File uploaded: ${uploadResult.file_id}`);

    // Step 2: Submit transcription task
    logger.info(`[Transcriber] Submitting transcription task...`);
    const taskId = await submitTranscriptionTask(uploadResult.url, apiKey);
    logger.info(`[Transcriber] Task submitted: ${taskId}`);

    // Step 3: Poll for result
    logger.info(`[Transcriber] Polling for result...`);
    const taskResult = await pollTaskResult(taskId, apiKey);

    // Step 4: Download transcription
    if (!taskResult.transcription_url) {
      throw new Error("Task succeeded but no transcription_url returned");
    }
    const text = await downloadTranscription(taskResult.transcription_url);
    logger.info(`[Transcriber] Transcription completed: ${text.length} chars`);

    return { text };
  } catch (err) {
    const msg = (err as Error).message;
    logger.error(`[Transcriber] Transcription failed: ${msg}`);
    return { text: "", error: `转录失败: ${msg}` };
  }
}

/** Try to read DashScope API key from openclaw.json providers */
async function readDashScopeKeyFromOpenclaw(): Promise<string | null> {
  const { readFileSync, existsSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { homedir } = await import("node:os");

  const candidates = [
    process.env.OPENCLAW_HOME ? join(process.env.OPENCLAW_HOME, ".openclaw", "openclaw.json") : null,
    join(process.cwd(), ".openclaw", "openclaw.json"),
    join(process.cwd(), "..", ".openclaw", "openclaw.json"),
    join(homedir(), ".openclaw", "openclaw.json"),
  ].filter(Boolean) as string[];

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      const raw = readFileSync(path, "utf8");
      const data = JSON.parse(raw) as {
        models?: {
          providers?: Record<string, { apiKey?: string }>;
        };
      };
      const providers = data?.models?.providers || {};
      for (const [id, cfg] of Object.entries(providers)) {
        if ((id === "aliyun" || id === "dashscope") && cfg?.apiKey) {
          return cfg.apiKey;
        }
      }
    } catch {
      /* skip */
    }
  }
  return null;
}
