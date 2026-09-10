import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { requestAudioUrl } from "@/lib/meal-request-media";
import { isRequestId } from "@/lib/meal-requests";

import { guestFeedbackScope } from "@/lib/guest-feedback";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string; enterpriseId: string }> }) {
  const requestId = crypto.randomUUID();
  const headers: Record<string, string> = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Request-Id": requestId };
  try {
    const session = await currentSession();
    const scope = guestFeedbackScope(session);
    if (!scope) return Response.json({ error: "Access denied." }, { status: 403, headers });
    const { id, enterpriseId } = await context.params;
    if (!isRequestId(id) || !isRequestId(enterpriseId) || (scope.enterpriseId && scope.enterpriseId !== enterpriseId)) return new Response(null, { status: 404, headers });
    const rows = await db()`SELECT audio_public_id, audio_format FROM guest_feedback WHERE id = ${id} AND enterprise_id = ${enterpriseId}`;
    if (!rows[0]?.audio_public_id) return new Response(null, { status: 404, headers });
    const range = request.headers.get("range");
    if (range && !/^bytes=\d*-\d*$/.test(range)) return new Response(null, { status: 416, headers });
    const response = await fetch(requestAudioUrl(rows[0].audio_public_id, rows[0].audio_format), { headers: range ? { Range: range } : {}, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      log("guest_feedback.audio_unavailable", { requestId, feedbackId: id, upstreamStatus: response.status });
      return new Response(null, { status: response.status === 416 ? 416 : 502, headers });
    }
    for (const key of ["content-length", "content-range", "accept-ranges"]) {
      const value = response.headers.get(key);
      if (value) headers[key] = value;
    }
    headers["Content-Type"] = rows[0].audio_format === "ogg" ? "audio/ogg" : rows[0].audio_format === "webm" ? "audio/webm" : "audio/mp4";
    return new Response(response.body, { status: response.status, headers });
  } catch {
    log("guest_feedback.audio_failed", { requestId });
    return new Response(null, { status: 503, headers });
  }
}
