import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateFeedback } from "@/lib/feedback";
import { log, logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });

  try {
    const validation = validateFeedback(await request.json());
    if (!validation.ok) return NextResponse.json({ error: validation.error, requestId }, { status: 400 });
    const { category, message, audio, pagePath } = validation.value;
    const rows = await db()<{ id: string }[]>`
      INSERT INTO platform_feedback (
        submitted_by_user_id, submitter_role, enterprise_id, category, message,
        audio_public_id, audio_url, audio_duration_seconds, page_path
      ) VALUES (
        ${session.userId}, ${session.role}, ${session.enterpriseId}, ${category}, ${message},
        ${audio?.publicId ?? null}, ${audio?.url ?? null}, ${audio?.durationSeconds ?? null}, ${pagePath}
      ) RETURNING id
    `;
    log("platform_feedback.submitted", { requestId, feedbackId: rows[0].id, actorUserId: session.userId, actorRole: session.role, category, hasText: Boolean(message), hasVoice: Boolean(audio), pagePath });
    return NextResponse.json({ feedbackId: rows[0].id, requestId }, { status: 201 });
  } catch (error) {
    logError("platform_feedback.submit_failed", error, { requestId, actorUserId: session.userId, actorRole: session.role });
    return NextResponse.json({ error: "FEEDBACK_SAVE_FAILED", requestId }, { status: 500 });
  }
}
