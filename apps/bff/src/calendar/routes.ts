/**
 * Calendar REST API Routes
 *
 * Endpoints for calendar event CRUD operations.
 */

import { Router } from "express";
import { logger } from "../utils/logger.js";
import {
  createCalendarEvent,
  getCalendarEvent,
  listCalendarEvents,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "./db.js";

export const calendarRouter = Router();

// ── List Events ─────────────────────────────────────────────────────────────

calendarRouter.get("/", (req, res) => {
  try {
    const { start, end, type } = req.query;
    const options: { start?: number; end?: number; type?: string } = {};

    if (start) {
      const startTs = Number(start);
      if (!isNaN(startTs)) options.start = startTs;
    }
    if (end) {
      const endTs = Number(end);
      if (!isNaN(endTs)) options.end = endTs;
    }
    if (type && typeof type === "string") {
      options.type = type;
    }

    const events = listCalendarEvents(options);
    res.json({ events });
  } catch (err) {
    logger.error("[Calendar] Failed to list events:", err);
    res.status(500).json({ error: "Failed to list calendar events" });
  }
});

// ── Create Event ────────────────────────────────────────────────────────────

calendarRouter.post("/", (req, res) => {
  try {
    const { title, startAt, endAt, type, sourceId, description } = req.body;

    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "title is required" });
    }
    if (!startAt || typeof startAt !== "number") {
      return res.status(400).json({ error: "startAt (timestamp) is required" });
    }
    if (!type || !["meeting", "commitment", "personal"].includes(type)) {
      return res.status(400).json({ error: "type must be one of: meeting, commitment, personal" });
    }

    const event = createCalendarEvent({
      title,
      startAt,
      endAt: endAt || null,
      type,
      sourceId: sourceId || null,
      description: description || null,
    });

    logger.info(`[Calendar] Created event: ${event.id}`);
    res.status(201).json(event);
  } catch (err) {
    logger.error("[Calendar] Failed to create event:", err);
    res.status(500).json({ error: "Failed to create calendar event" });
  }
});

// ── Get Event ───────────────────────────────────────────────────────────────

calendarRouter.get("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const event = getCalendarEvent(id);
    if (!event) {
      return res.status(404).json({ error: "Calendar event not found" });
    }
    res.json(event);
  } catch (err) {
    logger.error(`[Calendar] Failed to get event ${id}:`, err);
    res.status(500).json({ error: "Failed to get calendar event" });
  }
});

// ── Update Event ────────────────────────────────────────────────────────────

calendarRouter.patch("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const event = getCalendarEvent(id);
    if (!event) {
      return res.status(404).json({ error: "Calendar event not found" });
    }

    const { title, startAt, endAt, type, sourceId, description } = req.body;
    const updates: Parameters<typeof updateCalendarEvent>[1] = {};

    if (title !== undefined) updates.title = title;
    if (startAt !== undefined) updates.startAt = startAt;
    if (endAt !== undefined) updates.endAt = endAt;
    if (type !== undefined) {
      if (!["meeting", "commitment", "personal"].includes(type)) {
        return res.status(400).json({ error: "type must be one of: meeting, commitment, personal" });
      }
      updates.type = type;
    }
    if (sourceId !== undefined) updates.sourceId = sourceId;
    if (description !== undefined) updates.description = description;

    updateCalendarEvent(id, updates);
    logger.info(`[Calendar] Updated event: ${id}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`[Calendar] Failed to update event ${id}:`, err);
    res.status(500).json({ error: "Failed to update calendar event" });
  }
});

// ── Delete Event ────────────────────────────────────────────────────────────

calendarRouter.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    const event = getCalendarEvent(id);
    if (!event) {
      return res.status(404).json({ error: "Calendar event not found" });
    }

    deleteCalendarEvent(id);
    logger.info(`[Calendar] Deleted event: ${id}`);
    res.json({ ok: true });
  } catch (err) {
    logger.error(`[Calendar] Failed to delete event ${id}:`, err);
    res.status(500).json({ error: "Failed to delete calendar event" });
  }
});
