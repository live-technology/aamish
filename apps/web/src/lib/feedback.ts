export const FEEDBACK_CATEGORIES = ["BUG", "IDEA", "QUESTION", "OTHER"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

type FeedbackAudio = {
  publicId?: unknown;
  url?: unknown;
  durationSeconds?: unknown;
};

export type ValidFeedback = {
  category: FeedbackCategory;
  message: string | null;
  audio: { publicId: string; url: string; durationSeconds: number } | null;
  pagePath: string;
};

export function validateFeedback(input: unknown): { ok: true; value: ValidFeedback } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "INVALID_FEEDBACK" };
  const body = input as { category?: unknown; message?: unknown; audio?: FeedbackAudio | null; pagePath?: unknown };
  if (typeof body.category !== "string" || !FEEDBACK_CATEGORIES.includes(body.category as FeedbackCategory)) return { ok: false, error: "INVALID_CATEGORY" };

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length > 4000) return { ok: false, error: "FEEDBACK_TOO_LONG" };
  if (typeof body.pagePath !== "string" || !body.pagePath.startsWith("/") || body.pagePath.length > 500) return { ok: false, error: "INVALID_PAGE" };

  let audio: ValidFeedback["audio"] = null;
  if (body.audio) {
    const { publicId, url, durationSeconds } = body.audio;
    if (typeof publicId !== "string" || !publicId.startsWith("aamish/feedbacks/")) return { ok: false, error: "INVALID_AUDIO" };
    if (typeof url !== "string") return { ok: false, error: "INVALID_AUDIO" };
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return { ok: false, error: "INVALID_AUDIO" };
    } catch {
      return { ok: false, error: "INVALID_AUDIO" };
    }
    if (typeof durationSeconds !== "number" || !Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 120) return { ok: false, error: "INVALID_AUDIO_DURATION" };
    audio = { publicId, url, durationSeconds };
  }

  if (!message && !audio) return { ok: false, error: "FEEDBACK_CONTENT_REQUIRED" };
  return { ok: true, value: { category: body.category as FeedbackCategory, message: message || null, audio, pagePath: body.pagePath } };
}
