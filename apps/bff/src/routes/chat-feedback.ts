import { Router } from "express";
import { z } from "zod";
import { trajectoryStore } from "../learning/trajectory-store.js";
import { longTermMemoryManager } from "../memory/long-term-memory.js";

export const chatFeedbackRouter = Router();

const feedbackSchema = z.object({
  sessionId: z.string(),
  messageId: z.string(),
  rating: z.enum(["positive", "negative", "neutral"]),
  comment: z.string().optional(),
});

chatFeedbackRouter.post("/", async (req, res) => {
  const parseResult = feedbackSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: "Invalid request body", details: parseResult.error.format() });
  }

  const { sessionId, messageId, rating, comment } = parseResult.data;
  const userId = (req.headers["x-user-id"] as string) || "default-user";

  try {
    // 1. Update the matching trajectory turn with feedback
    const updated = await trajectoryStore.updateTurnWithFeedback(sessionId, messageId, {
      rating,
      comment,
      timestamp: Date.now(),
    });

    // Also record to feedback queue for analytics
    trajectoryStore.recordFeedback({
      sessionId,
      messageId,
      userId,
      timestamp: Date.now(),
      rating,
      comment,
    });

    // 2. Update long-term memory skill usage stats with feedback summary
    await longTermMemoryManager.recordSkillUsage(
      userId,
      "chat",
      "对话",
      true,
      {
        feedback: rating,
      }
    );

    return res.json({ ok: true, trajectoryUpdated: updated });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String((error as Error).message) });
  }
});
