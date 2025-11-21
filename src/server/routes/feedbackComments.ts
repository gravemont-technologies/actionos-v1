import { Router } from "express";
import { z } from "zod";
import { clerkAuthMiddleware } from "../middleware/clerkAuth.js";
import { getSupabaseClient } from "../db/supabase.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Require auth for feedback submissions to help associate profile/user
router.use(clerkAuthMiddleware);

const schema = z.object({
  profile_id: z.string().optional(),
  category: z.string().min(1).max(80),
  message: z.string().min(1).max(5000),
  metadata: z.any().optional(),
});

router.post("/", async (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase.from("feedback_comments").insert({
      profile_id: parsed.data.profile_id ?? null,
      user_id: req.userId ?? null,
      category: parsed.data.category,
      message: parsed.data.message,
      metadata: parsed.data.metadata ?? {},
    });
    if (error) throw error;
    logger.info({ userId: req.userId, profileId: parsed.data.profile_id }, "Feedback comment stored");
    return res.json({ status: "ok" });
  } catch (err) {
    logger.error({ err }, "Failed to store feedback comment");
    return next(err);
  }
});

export default router;
