/**
 * Audio Recording Manager
 *
 * Handles saving audio chunks from browser MediaRecorder (WebM/Opus)
 * and finalizing recordings to disk.
 */

import { join } from "node:path";
import { existsSync, mkdirSync, appendFileSync, closeSync, openSync, statSync, unlinkSync } from "node:fs";
import { logger } from "../utils/logger.js";
import { getMineEchoHome } from "../utils/config-path.js";

export function getAudioDir(): string {
  const dir = join(getMineEchoHome(), "audio");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getAudioPath(meetingId: string): string {
  return join(getAudioDir(), `${meetingId}.webm`);
}

/**
 * Append an audio chunk to the meeting's recording file.
 * Creates the file if it doesn't exist.
 */
export async function saveAudioChunk(meetingId: string, chunk: Buffer): Promise<string> {
  const audioPath = getAudioPath(meetingId);
  try {
    appendFileSync(audioPath, chunk);
    logger.debug(`[Recorder] Saved chunk for meeting ${meetingId}, size: ${chunk.length}`);
    return audioPath;
  } catch (err) {
    logger.error(`[Recorder] Failed to save audio chunk for meeting ${meetingId}:`, err);
    throw err;
  }
}

/**
 * Finalize the audio recording.
 * Returns the file path and an estimated duration (0 if unable to determine).
 */
export async function finalizeAudio(meetingId: string): Promise<{ path: string; durationSec: number }> {
  const audioPath = getAudioPath(meetingId);
  try {
    if (!existsSync(audioPath)) {
      logger.warn(`[Recorder] No audio file found for meeting ${meetingId}`);
      return { path: audioPath, durationSec: 0 };
    }

    const stats = statSync(audioPath);
    // Rough estimate: WebM/Opus at ~24kbps ≈ 3KB/s
    // This is a fallback; real duration requires parsing the container
    const estimatedDuration = Math.round(stats.size / 3000);
    logger.info(`[Recorder] Finalized audio for meeting ${meetingId}: ${stats.size} bytes, ~${estimatedDuration}s`);
    return { path: audioPath, durationSec: estimatedDuration };
  } catch (err) {
    logger.error(`[Recorder] Failed to finalize audio for meeting ${meetingId}:`, err);
    return { path: audioPath, durationSec: 0 };
  }
}

/**
 * Delete the audio file for a meeting.
 */
export async function deleteAudio(meetingId: string): Promise<void> {
  const audioPath = getAudioPath(meetingId);
  try {
    if (existsSync(audioPath)) {
      unlinkSync(audioPath);
      logger.info(`[Recorder] Deleted audio for meeting ${meetingId}`);
    }
  } catch (err) {
    logger.error(`[Recorder] Failed to delete audio for meeting ${meetingId}:`, err);
    throw err;
  }
}
