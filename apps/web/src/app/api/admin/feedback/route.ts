import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateFeedbackStatus } from "@/lib/feedback-triage";
import { log, logError } from "@/lib/logger";

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const body = validateFeedbackStatus(await request.json());
    if (!body) return NextResponse.json({ error: "INVALID_FEEDBACK_STATUS", requestId }, { status: 400 });
    const rows = await db()`UPDATE platform_feedback SET status=${body.status} WHERE id=${body.id} RETURNING id, status`;
    if (!rows[0]) return NextResponse.json({ error: "FEEDBACK_NOT_FOUND", requestId }, { status: 404 });
    log("feedback.status_updated", { requestId, actorUserId: session.userId, feedbackId: body.id, status: body.status });
    return NextResponse.json({ feedback: rows[0], requestId });
  } catch (error) {
    logError("feedback.status_update_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "FEEDBACK_UPDATE_FAILED", requestId }, { status: 500 });
  }
}
