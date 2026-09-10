import { createHash } from "crypto";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { deleteRequestAudio, uploadRequestAudio } from "@/lib/meal-request-media";
import { isRequestId, MealRequestError, readLimitedForm, requireSameOrigin, validateVoiceBytes } from "@/lib/meal-requests";

import { validateGuestFeedback } from "@/lib/guest-feedback";

export const runtime = "nodejs";
export const maxDuration = 60;

async function limit(scope: string, seconds: number, maximum: number) {
  const window = new Date(Math.floor(Date.now() / (seconds * 1000)) * seconds * 1000);
  const rows = await db()`INSERT INTO meal_request_rate_limits (scope, window_start, attempts) VALUES (${scope}, ${window}, 1)
    ON CONFLICT (scope, window_start) DO UPDATE SET attempts = meal_request_rate_limits.attempts + 1 RETURNING attempts`;
  if (rows[0].attempts > maximum) throw new MealRequestError("We’ve received a lot of feedback. Please try again in a few minutes.", 429);
}

export async function POST(request: Request, context: { params: Promise<{ enterpriseId: string }> }) {
  const requestId = crypto.randomUUID();
  let audioPublicId: string | undefined;
  try {
    requireSameOrigin(request);
    // An application-wide budget cannot be bypassed with forged client IP headers.
    await limit("guest-feedback:global", 600, 5000);
    const { enterpriseId } = await context.params;
    if (!isRequestId(enterpriseId)) throw new MealRequestError("This feedback link is unavailable.", 404);
    const enterprises = await db()`SELECT id FROM enterprises WHERE id = ${enterpriseId} AND status = 'ACTIVE'`;
    if (!enterprises.length) throw new MealRequestError("This feedback link is unavailable.", 404);
    await limit(`guest-feedback:enterprise:${enterpriseId}`, 600, 1000);
    const form = await readLimitedForm(request);
    const submissionKey = form.get("submissionKey");
    if (!isRequestId(submissionKey)) throw new MealRequestError("Please reload the page and try again.");
    const voice = form.get("audio");
    if (voice !== null && !(voice instanceof File)) throw new MealRequestError("Invalid recording.");
    const audio = voice instanceof File ? voice : null;
    const { rating, review, anonymous, name, phone } = validateGuestFeedback(form);
    const bytes = audio ? new Uint8Array(await audio.arrayBuffer()) : null;
    if (bytes && audio) validateVoiceBytes(bytes, audio.type);
    const payloadHash = createHash("sha256").update(JSON.stringify({ enterpriseId, rating, review, anonymous, name, phone, audio: bytes ? createHash("sha256").update(bytes).digest("hex") : null })).digest("hex");
    if (audio) await limit(`guest-feedback:voice:${enterpriseId}`, 600, 100);
    const result = await db().begin(async sql => {
      // Concurrent retries serialize before uploading or inserting anything.
      await sql`SELECT pg_advisory_xact_lock(hashtextextended(${submissionKey}, 0))`;
      const existing = await sql`SELECT id, payload_hash FROM guest_feedback WHERE submission_key = ${submissionKey}`;
      if (existing.length) {
        if (existing[0].payload_hash !== payloadHash) throw new MealRequestError("This feedback has already been sent. Reload the page to send new feedback.", 409);
        return { id: existing[0].id, duplicate: true };
      }
      let savedAudio: Awaited<ReturnType<typeof uploadRequestAudio>> | null = null;
      if (audio) {
        audioPublicId = `aamish/meal-requests/${crypto.randomUUID()}`;
        savedAudio = await uploadRequestAudio(audio, audioPublicId);
      }
      const rows = await sql`INSERT INTO guest_feedback (enterprise_id, submission_key, payload_hash, rating, review, anonymous, name, phone, audio_public_id, audio_format, audio_bytes, audio_duration_seconds)
        VALUES (${enterpriseId}, ${submissionKey}, ${payloadHash}, ${rating}, ${review}, ${anonymous}, ${name}, ${phone}, ${savedAudio?.publicId ?? null}, ${savedAudio?.format ?? null}, ${savedAudio?.bytes ?? null}, ${savedAudio?.duration ?? null}) RETURNING id`;
      return { id: rows[0].id, duplicate: false };
    });
    log("guest_feedback.submitted", { requestId, feedbackId: result.id, duplicate: result.duplicate, hasVoice: Boolean(audio), hasText: Boolean(review) });
    await db()`DELETE FROM meal_request_rate_limits WHERE window_start < now() - interval '2 days'`.catch(() => {});
    return Response.json({ success: true }, { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
  } catch (error) {
    if (audioPublicId) {
      try {
        // A commit acknowledgement can fail after the commit succeeds. Never delete referenced audio.
        const saved = await db()`SELECT id FROM guest_feedback WHERE audio_public_id = ${audioPublicId}`;
        if (!saved.length) await deleteRequestAudio(audioPublicId);
      } catch { log("guest_feedback.media_cleanup_required", { requestId, audioPublicId }); }
    }
    const status = error instanceof MealRequestError ? error.status : 503;
    // Database errors may contain parameters, so deliberately exclude raw error messages.
    log("guest_feedback.failed", { requestId, status });
    return Response.json({ error: error instanceof MealRequestError ? error.message : "We couldn’t save your feedback. Please try again; your details are still here.", requestId }, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "600" } : {}) } });
  }
}
