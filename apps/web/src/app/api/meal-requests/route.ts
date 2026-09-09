import { createHash, createHmac } from "crypto";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { deleteRequestAudio, uploadRequestAudio } from "@/lib/meal-request-media";
import { isRequestId, MealRequestError, normalizeContact, readLimitedForm, requireSameOrigin, validateRequirement, validateVoiceBytes } from "@/lib/meal-requests";

export const runtime = "nodejs";
export const maxDuration = 60;

async function limit(scope: string, seconds: number, maximum: number) {
  const window = new Date(Math.floor(Date.now() / (seconds * 1000)) * seconds * 1000);
  const rows = await db()`INSERT INTO meal_request_rate_limits (scope, window_start, attempts) VALUES (${scope}, ${window}, 1)
    ON CONFLICT (scope, window_start) DO UPDATE SET attempts = meal_request_rate_limits.attempts + 1 RETURNING attempts`;
  if (rows[0].attempts > maximum) throw new MealRequestError("We’ve received several requests. Please try again later or call 01335-114515.", 429);
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let audioPublicId: string | undefined;
  try {
    requireSameOrigin(request);
    // An application-wide budget cannot be bypassed with forged client IP headers.
    await limit("global", 600, 100);
    const form = await readLimitedForm(request);
    const submissionKey = form.get("submissionKey");
    if (!isRequestId(submissionKey)) throw new MealRequestError("Please reload the page and try again.");
    const voice = form.get("audio");
    if (voice !== null && !(voice instanceof File)) throw new MealRequestError("Invalid recording.");
    const audio = voice instanceof File ? voice : null;
    const { contact, contactType } = normalizeContact(form.get("contact"));
    const requirement = validateRequirement(form.get("requirement"), Boolean(audio));
    const bytes = audio ? new Uint8Array(await audio.arrayBuffer()) : null;
    if (bytes && audio) validateVoiceBytes(bytes, audio.type);
    const payloadHash = createHash("sha256").update(JSON.stringify({ requirement, contact, audio: bytes ? createHash("sha256").update(bytes).digest("hex") : null })).digest("hex");
    const contactScope = createHmac("sha256", process.env.SESSION_SECRET || "local-development-secret-change-before-deploy").update(contact).digest("hex");
    const result = await db().begin(async sql => {
      // Concurrent retries serialize before uploading or inserting anything.
      await sql`SELECT pg_advisory_xact_lock(hashtextextended(${submissionKey}, 0))`;
      const existing = await sql`SELECT id, payload_hash FROM meal_requests WHERE submission_key = ${submissionKey}`;
      if (existing.length) {
        if (existing[0].payload_hash !== payloadHash) throw new MealRequestError("This request has already been sent. Start a new request to change the details.", 409);
        return { id: existing[0].id, duplicate: true };
      }
      const contactWindow = new Date(Math.floor(Date.now() / 3600000) * 3600000);
      const attempts = await sql`INSERT INTO meal_request_rate_limits (scope, window_start, attempts) VALUES (${`contact:${contactScope}`}, ${contactWindow}, 1)
        ON CONFLICT (scope, window_start) DO UPDATE SET attempts = meal_request_rate_limits.attempts + 1 RETURNING attempts`;
      if (attempts[0].attempts > 5) throw new MealRequestError("We’ve received several requests. Please try again later or call 01335-114515.", 429);
      let savedAudio: Awaited<ReturnType<typeof uploadRequestAudio>> | null = null;
      if (audio) {
        audioPublicId = `aamish/meal-requests/${crypto.randomUUID()}`;
        savedAudio = await uploadRequestAudio(audio, audioPublicId);
      }
      const rows = await sql`INSERT INTO meal_requests (submission_key, payload_hash, requirement, contact, contact_type, audio_public_id, audio_format, audio_bytes, audio_duration_seconds)
        VALUES (${submissionKey}, ${payloadHash}, ${requirement}, ${contact}, ${contactType}, ${savedAudio?.publicId ?? null}, ${savedAudio?.format ?? null}, ${savedAudio?.bytes ?? null}, ${savedAudio?.duration ?? null}) RETURNING id`;
      return { id: rows[0].id, duplicate: false };
    });
    log("meal_request.submitted", { requestId, mealRequestId: result.id, duplicate: result.duplicate, hasVoice: Boolean(audio), hasText: Boolean(requirement) });
    await db()`DELETE FROM meal_request_rate_limits WHERE window_start < now() - interval '2 days'`.catch(() => {});
    return Response.json({ success: true }, { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
  } catch (error) {
    if (audioPublicId) {
      try {
        // A commit acknowledgement can fail after the commit succeeds. Never delete referenced audio.
        const saved = await db()`SELECT id FROM meal_requests WHERE audio_public_id = ${audioPublicId}`;
        if (!saved.length) await deleteRequestAudio(audioPublicId);
      } catch { log("meal_request.media_cleanup_required", { requestId, audioPublicId }); }
    }
    const status = error instanceof MealRequestError ? error.status : 503;
    // Database errors may contain parameters, so deliberately exclude raw error messages.
    log("meal_request.failed", { requestId, status });
    return Response.json({ error: error instanceof MealRequestError ? error.message : "We couldn’t save your request. Please try again or call 01335-114515.", requestId }, { status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "600" } : {}) } });
  }
}
