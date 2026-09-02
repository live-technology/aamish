type ReviewableSchedule = { schedule_date: string; can_review: boolean };

export type ReviewPhoto = { publicId: string; url: string; thumbnailUrl: string };
export type ReviewVoice = { publicId: string; url: string; durationSeconds: number };
export type ValidReview = { scheduleId: string; rating: number; comment: string | null; tags: string[]; photos: ReviewPhoto[]; voice: ReviewVoice | null };

export function eligibleReviewSchedule<T extends ReviewableSchedule>(schedules: T[], today: string): T | undefined {
  return schedules
    .filter((schedule) => schedule.can_review && schedule.schedule_date <= today)
    .sort((a, b) => b.schedule_date.localeCompare(a.schedule_date))[0];
}

export function reviewIsEditable(createdAt: string, now = new Date()) {
  const submitted = new Date(createdAt).valueOf();
  return Number.isFinite(submitted) && now.valueOf() <= submitted + 24 * 60 * 60 * 1000;
}

function isCloudinaryUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
  } catch { return false; }
}

export function validateReview(input: unknown): { ok: true; value: ValidReview } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "INVALID_REVIEW" };
  const body = input as Record<string, unknown>;
  if (typeof body.scheduleId !== "string" || !body.scheduleId) return { ok: false, error: "INVALID_REVIEW" };
  if (!Number.isInteger(body.rating) || Number(body.rating) < 1 || Number(body.rating) > 5) return { ok: false, error: "INVALID_REVIEW" };
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  if (comment.length > 4000) return { ok: false, error: "INVALID_REVIEW" };
  if (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== "string")) return { ok: false, error: "INVALID_REVIEW" };
  if (!Array.isArray(body.photos) || body.photos.length > 5) return { ok: false, error: "INVALID_REVIEW" };
  const photos: ReviewPhoto[] = [];
  for (const item of body.photos) {
    if (!item || typeof item !== "object") return { ok: false, error: "INVALID_REVIEW" };
    const photo = item as Record<string, unknown>;
    if (typeof photo.publicId !== "string" || !photo.publicId.startsWith("aamish/reviews/") || !isCloudinaryUrl(photo.url) || !isCloudinaryUrl(photo.thumbnailUrl)) return { ok: false, error: "INVALID_REVIEW" };
    photos.push({ publicId: photo.publicId, url: String(photo.url), thumbnailUrl: String(photo.thumbnailUrl) });
  }
  let voice: ReviewVoice | null = null;
  if (body.voice != null) {
    if (typeof body.voice !== "object") return { ok: false, error: "INVALID_REVIEW_VOICE" };
    const candidate = body.voice as Record<string, unknown>;
    if (typeof candidate.publicId !== "string" || !candidate.publicId.startsWith("aamish/reviews/") || !isCloudinaryUrl(candidate.url)) return { ok: false, error: "INVALID_REVIEW_VOICE" };
    if (!Number.isInteger(candidate.durationSeconds) || Number(candidate.durationSeconds) < 1 || Number(candidate.durationSeconds) > 60) return { ok: false, error: "INVALID_REVIEW_VOICE_DURATION" };
    voice = { publicId: candidate.publicId, url: String(candidate.url), durationSeconds: Number(candidate.durationSeconds) };
  }
  return { ok: true, value: { scheduleId: body.scheduleId, rating: Number(body.rating), comment: comment || null, tags: body.tags as string[], photos, voice } };
}
