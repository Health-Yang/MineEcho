/**
 * Meeting REST API Routes
 *
 * Endpoints for meeting recording, transcription, summarization, and commitment extraction.
 */

import { Router } from "express";
import express from "express";
import { existsSync } from "node:fs";
import { logger } from "../utils/logger.js";
import {
  createMeeting,
  updateMeeting,
  getMeeting,
  listMeetings,
  deleteMeeting,
  createCommitment,
  listCommitments,
} from "./db.js";
import { saveAudioChunk, finalizeAudio, deleteAudio, getAudioPath } from "./recorder.js";
import { transcribeAudio } from "./transcriber.js";
import { summarizeMeeting, cleanTranscript } from "./summarizer.js";
import { extractCommitments } from "./commitment-extractor.js";
import { createCalendarEvent } from "../calendar/db.js";
import { persistMeetingMemory } from "./memory-persist.js";

export const meetingRouter = Router();

function getUserId(req: express.Request): string {
  const headerId = req.headers["x-user-id"];
  if (headerId && typeof headerId === "string") return headerId;
  return "anonymous";
}

// ── Start Recording ─────────────────────────────────────────────────────────

meetingRouter.post("/start", (req, res) => {
  try {
    // Accept optional meeting metadata
    const { title, participants, location } = req.body || {};
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "会议名称不能为空" });
    }
    const meeting = createMeeting({
      title: title.trim(),
      participants: participants && typeof participants === "string" ? participants.trim() : undefined,
      location: location && typeof location === "string" ? location.trim() : undefined,
    });
    logger.info(`[Meeting] Started recording: ${meeting.id}, title: ${meeting.title}`);
    res.json({ id: meeting.id, status: meeting.status, startedAt: meeting.startedAt, title: meeting.title });
  } catch (err) {
    logger.error("[Meeting] Failed to start recording:", err);
    res.status(500).json({ error: "Failed to start meeting recording" });
  }
});

// ── Upload Audio Chunk ──────────────────────────────────────────────────────

meetingRouter.post(
  "/:id/chunk",
  express.raw({ type: () => true, limit: "50mb" }),
  async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    if (meeting.status !== "recording") {
      return res.status(400).json({ error: `Meeting is not in recording state (current: ${meeting.status})` });
    }

    // Expect raw binary body (Buffer)
    if (!req.body || !(req.body instanceof Buffer)) {
      return res.status(400).json({ error: "Expected binary audio chunk in body" });
    }

    const path = await saveAudioChunk(id, req.body);
    res.json({ ok: true, path });
  } catch (err) {
    logger.error(`[Meeting] Failed to save chunk for ${id}:`, err);
    res.status(500).json({ error: "Failed to save audio chunk" });
  }
});

// ── Stop Recording ──────────────────────────────────────────────────────────

meetingRouter.post("/:id/stop", async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    if (meeting.status !== "recording") {
      return res.status(400).json({ error: `Meeting is not in recording state (current: ${meeting.status})` });
    }

    const now = Date.now();
    const durationSec = meeting.startedAt ? Math.round((now - meeting.startedAt) / 1000) : 0;

    // Finalize audio file
    const audioResult = await finalizeAudio(id);

    updateMeeting(id, {
      endedAt: now,
      durationSec: durationSec || audioResult.durationSec || 0,
      audioPath: audioResult.path,
      status: "transcribing",
    });

    logger.info(`[Meeting] Stopped recording: ${id}, duration: ${durationSec}s`);

    // Trigger transcription in background, then auto-process
    transcribeAudio(audioResult.path)
      .then(async (result) => {
        if (result.error) {
          logger.warn(`[Meeting] Transcription failed for ${id}: ${result.error}`);
          updateMeeting(id, { status: "completed", transcript: result.text || null });
          // Throw error to ensure .catch() is triggered
          throw new Error(`Transcription failed: ${result.error}`);
        }

        // Auto-clean transcript first
        let cleanedText: string | null = null;
        try {
          const cleanResult = await cleanTranscript(result.text);
          if (!cleanResult.error && cleanResult.cleaned) {
            cleanedText = cleanResult.cleaned;
            logger.info(`[Meeting] Transcript cleaned for ${id}: ${cleanedText.length} chars`);
          }
        } catch (cleanErr) {
          logger.warn(`[Meeting] Transcript cleaning failed for ${id}:`, cleanErr);
        }

        // Update with transcript and cleaned text, then start extraction
        updateMeeting(id, { transcript: result.text, cleanedTranscript: cleanedText, status: "extracting" });
        persistMeetingMemory(userId, { ...meeting, transcript: result.text, cleanedTranscript: cleanedText, endedAt: now }, {
          reason: "transcript",
          transcript: cleanedText || result.text,
        });
        logger.info(`[Meeting] Transcription completed for ${id}: ${result.text.length} chars, starting extraction`);

        // Extract commitments and calendar events
        updateMeeting(id, { status: "extracting" });
        try {
          const { commitments, calendarEvents } = await extractCommitments(result.text);

          // Save extracted commitments to DB
          const savedCommitments = [];
          for (const c of commitments) {
            const saved = createCommitment(id, {
              who: c.who,
              what: c.what,
              deadline: c.deadline,
              confidence: c.confidence,
              status: "pending",
            });
            savedCommitments.push(saved);

            // Also create calendar event for commitment with deadline
            if (c.deadline) {
              try {
                const deadlineTs = Date.parse(c.deadline);
                if (!isNaN(deadlineTs)) {
                  createCalendarEvent({
                    title: `[承诺] ${c.what}`,
                    startAt: deadlineTs,
                    endAt: null,
                    type: "commitment",
                    sourceId: saved.id,
                    description: `责任人: ${c.who || "待定"} | 来源会议: ${meeting.title || id}`,
                  });
                }
              } catch (calErr) {
                logger.warn(`[Meeting] Failed to create calendar event for commitment ${saved.id}:`, calErr);
              }
            }
          }

          // Auto-create calendar events for time-based events
          for (const event of calendarEvents) {
            try {
              createCalendarEvent({
                title: event.title,
                startAt: event.startAt ? new Date(event.startAt).getTime() : Date.now() + 3600000,
                endAt: event.endAt ? new Date(event.endAt).getTime() : null,
                type: "meeting",
                sourceId: id,
                description: event.description || `来源会议: ${meeting.title || id}`,
              });
              logger.info(`[Meeting] Auto-created calendar event: ${event.title}`);
            } catch (calErr) {
              logger.warn(`[Meeting] Failed to create calendar event for ${event.title}:`, calErr);
            }
          }

          logger.info(`[Meeting] Extracted ${savedCommitments.length} commitments and ${calendarEvents.length} calendar events for ${id}`);
          persistMeetingMemory(userId, { ...meeting, transcript: result.text, cleanedTranscript: cleanedText, endedAt: now }, {
            reason: "commitments",
            commitments: savedCommitments,
          });
        } catch (extractErr) {
          logger.warn(`[Meeting] Commitment extraction failed for ${id}:`, extractErr);
        }

        // All auto-processing complete
        updateMeeting(id, { status: "completed" });
        logger.info(`[Meeting] All auto-processing completed for ${id}`);
      })
      .catch((err) => {
        logger.error(`[Meeting] Transcription pipeline error for ${id}:`, err);
        updateMeeting(id, { status: "completed" });
      });

    res.json({
      id,
      status: "transcribing",
      durationSec: durationSec || audioResult.durationSec || 0,
      audioPath: audioResult.path,
    });
  } catch (err) {
    logger.error(`[Meeting] Failed to stop recording for ${id}:`, err);
    res.status(500).json({ error: "Failed to stop meeting recording" });
  }
});

// ── Get Meeting ─────────────────────────────────────────────────────────────

meetingRouter.get("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json(meeting);
  } catch (err) {
    logger.error(`[Meeting] Failed to get meeting ${id}:`, err);
    res.status(500).json({ error: "Failed to get meeting" });
  }
});

// ── Update Meeting ─────────────────────────────────────────────────────────

meetingRouter.patch("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    const { title, participants, location } = req.body || {};
    updateMeeting(id, {
      ...(title !== undefined && { title }),
      ...(participants !== undefined && { participants }),
      ...(location !== undefined && { location }),
    });
    const updated = getMeeting(id);
    res.json({ ok: true, meeting: updated });
  } catch (err) {
    logger.error(`[Meeting] Failed to update meeting ${id}:`, err);
    res.status(500).json({ error: "Failed to update meeting" });
  }
});

// ── Get Meeting Audio Info ─────────────────────────────────────────────────

meetingRouter.get("/:id/audio-info", (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    const audioPath = getAudioPath(id);
    const audioExists = existsSync(audioPath);
    res.json({
      id,
      audioPath: audioExists ? audioPath : null,
      audioExists,
    });
  } catch (err) {
    logger.error(`[Meeting] Failed to get audio info for ${id}:`, err);
    res.status(500).json({ error: "Failed to get audio info" });
  }
});

// ── Re-transcribe (force re-transcribe from audio file) ─────────────────────

meetingRouter.post("/:id/transcribe", async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Try to get audio path from meeting record, or construct it
    let audioPath = meeting.audioPath;
    if (!audioPath) {
      audioPath = getAudioPath(id);
    }

    if (!existsSync(audioPath)) {
      return res.status(400).json({ error: "Audio file not found on server" });
    }

    logger.info(`[Meeting] Re-transcribing meeting ${id} from audio file: ${audioPath}`);

    const result = await transcribeAudio(audioPath);
    if (result.error) {
      logger.error(`[Meeting] Re-transcription failed for ${id}: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }

    // Update meeting with new transcript
    updateMeeting(id, { transcript: result.text });

    logger.info(`[Meeting] Re-transcription completed for ${id}: ${result.text.length} chars`);
    res.json({
      id,
      transcript: result.text,
      transcriptLength: result.text.length,
    });
  } catch (err) {
    logger.error(`[Meeting] Failed to re-transcribe ${id}:`, err);
    res.status(500).json({ error: "Failed to re-transcribe audio" });
  }
});

// ── Get Transcript ──────────────────────────────────────────────────────────

meetingRouter.get("/:id/transcript", (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json({
      id: meeting.id,
      status: meeting.status,
      transcript: meeting.transcript,
      transcriptReady: meeting.status === "completed" && !!meeting.transcript,
    });
  } catch (err) {
    logger.error(`[Meeting] Failed to get transcript for ${id}:`, err);
    res.status(500).json({ error: "Failed to get transcript" });
  }
});

// ── Get Cleaned Transcript ────────────────────────────────────────────────

meetingRouter.get("/:id/transcript-cleaned", async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    if (!meeting.transcript) {
      return res.status(400).json({ error: "No transcript available. Wait for transcription to complete." });
    }
    res.json({
      id: meeting.id,
      transcript: meeting.transcript,
      cleaned: meeting.cleanedTranscript || meeting.transcript,
    });
  } catch (err) {
    logger.error(`[Meeting] Failed to get cleaned transcript for ${id}:`, err);
    res.status(500).json({ error: "Failed to get cleaned transcript" });
  }
});

// ── Clean Transcript ─────────────────────────────────────────────────────────

meetingRouter.post("/:id/transcript-clean", async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    if (!meeting.transcript) {
      return res.status(400).json({ error: "No transcript available. Wait for transcription to complete." });
    }

    const result = await cleanTranscript(meeting.transcript);
    if (result.error) {
      logger.error(`[Meeting] Transcript cleaning failed for ${id}: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }

    // Save cleaned transcript to database
    updateMeeting(id, { cleanedTranscript: result.cleaned });
    logger.info(`[Meeting] Transcript cleaned and saved for ${id}: ${result.cleaned.length} chars`);
    res.json({ id, cleaned: result.cleaned });
  } catch (err) {
    logger.error(`[Meeting] Failed to clean transcript for ${id}:`, err);
    res.status(500).json({ error: "Failed to clean transcript" });
  }
});

// ── Trigger Summary ─────────────────────────────────────────────────────────

meetingRouter.post("/:id/summarize", async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    if (!meeting.transcript) {
      return res.status(400).json({ error: "No transcript available. Wait for transcription to complete or provide transcript manually." });
    }

    updateMeeting(id, { status: "summarizing" });

    const result = await summarizeMeeting(meeting.transcript);
    if (result.error) {
      updateMeeting(id, { status: "completed" });
      logger.error(`[Meeting] Summary failed for ${id}: ${result.error}`);
      return res.status(500).json({ error: result.error });
    }

    updateMeeting(id, { summary: result.summary, status: "completed" });
    persistMeetingMemory(userId, { ...meeting, summary: result.summary, status: "completed" }, {
      reason: "summary",
      summary: result.summary,
    });
    logger.info(`[Meeting] Summary generated for ${id}: ${result.summary.length} chars`);
    res.json({ id, summary: result.summary });
  } catch (err) {
    logger.error(`[Meeting] Failed to summarize ${id}:`, err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// ── Get Summary ─────────────────────────────────────────────────────────────

meetingRouter.get("/:id/summary", (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    res.json({
      id: meeting.id,
      status: meeting.status,
      summary: meeting.summary,
      summaryReady: !!meeting.summary,
    });
  } catch (err) {
    logger.error(`[Meeting] Failed to get summary for ${id}:`, err);
    res.status(500).json({ error: "Failed to get summary" });
  }
});

// ── Trigger Commitment Extraction ───────────────────────────────────────────

meetingRouter.post("/:id/commitments", async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    if (!meeting.transcript) {
      return res.status(400).json({ error: "No transcript available. Wait for transcription to complete or provide transcript manually." });
    }

    const { commitments, calendarEvents } = await extractCommitments(meeting.transcript);

    // Save extracted commitments to DB
    const savedCommitments = [];
    for (const c of commitments) {
      const saved = createCommitment(id, {
        who: c.who,
        what: c.what,
        deadline: c.deadline,
        confidence: c.confidence,
        status: "pending",
      });
      savedCommitments.push(saved);

      // Also create calendar event for commitment if deadline is present
      if (c.deadline) {
        try {
          const deadlineTs = Date.parse(c.deadline);
          if (!isNaN(deadlineTs)) {
            createCalendarEvent({
              title: `[承诺] ${c.what}`,
              startAt: deadlineTs,
              endAt: null,
              type: "commitment",
              sourceId: saved.id,
              description: `责任人: ${c.who} | 来源会议: ${meeting.title || id}`,
            });
          }
        } catch (calErr) {
          logger.warn(`[Meeting] Failed to create calendar event for commitment ${saved.id}:`, calErr);
        }
      }
    }

    // Auto-create calendar events for time-based events mentioned in transcript
    const savedCalendarEvents = [];
    for (const event of calendarEvents) {
      try {
        const eventData: Parameters<typeof createCalendarEvent>[0] = {
          title: event.title,
          startAt: event.startAt ? new Date(event.startAt).getTime() : Date.now() + 3600000, // Default: 1 hour from now
          endAt: event.endAt ? new Date(event.endAt).getTime() : null,
          type: "meeting",
          sourceId: id,
          description: event.description || `来源会议: ${meeting.title || id}`,
        };
        const savedEvent = createCalendarEvent(eventData);
        savedCalendarEvents.push(savedEvent);
        logger.info(`[Meeting] Auto-created calendar event: ${event.title}`);
      } catch (calErr) {
        logger.warn(`[Meeting] Failed to create calendar event for ${event.title}:`, calErr);
      }
    }

    logger.info(`[Meeting] Extracted ${savedCommitments.length} commitments and ${savedCalendarEvents.length} calendar events for ${id}`);
    persistMeetingMemory(userId, meeting, {
      reason: "commitments",
      commitments: savedCommitments,
    });
    res.json({ id, commitments: savedCommitments, calendarEvents: savedCalendarEvents });
  } catch (err) {
    logger.error(`[Meeting] Failed to extract commitments for ${id}:`, err);
    res.status(500).json({ error: "Failed to extract commitments" });
  }
});

// ── Get Commitments ─────────────────────────────────────────────────────────

meetingRouter.get("/:id/commitments", (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    const commitments = listCommitments(id);
    res.json({ id, commitments });
  } catch (err) {
    logger.error(`[Meeting] Failed to get commitments for ${id}:`, err);
    res.status(500).json({ error: "Failed to get commitments" });
  }
});

// ── List Meetings ───────────────────────────────────────────────────────────

meetingRouter.get("/", (_req, res) => {
  try {
    const meetings = listMeetings();
    res.json({ meetings });
  } catch (err) {
    logger.error("[Meeting] Failed to list meetings:", err);
    res.status(500).json({ error: "Failed to list meetings" });
  }
});

// ── Delete Meeting ──────────────────────────────────────────────────────────

meetingRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const meeting = getMeeting(id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Delete audio file
    await deleteAudio(id).catch((err) => {
      logger.warn(`[Meeting] Failed to delete audio for ${id}:`, err);
    });

    deleteMeeting(id);
    logger.info(`[Meeting] Deleted meeting: ${id}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`[Meeting] Failed to delete meeting ${id}:`, err);
    res.status(500).json({ error: "Failed to delete meeting" });
  }
});
