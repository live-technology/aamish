import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { validateReview } from "@/lib/reviews";

type ExistingReview = { id: string; created_at: string; editable: boolean };

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "EMPLOYEE" || !session.employeeId || !session.enterpriseId) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const validation = validateReview(await request.json());
    if (!validation.ok) return NextResponse.json({ error: validation.error, requestId }, { status: 400 });
    const { scheduleId, rating, comment, tags, photos, voice } = validation.value;
    const result = await db().begin(async (transaction) => {
      const eligible = await transaction<{ id: string }[]>`
        SELECT ms.id FROM menu_schedules ms
        JOIN meal_preferences mp ON mp.schedule_id=ms.id
        WHERE ms.id=${scheduleId} AND ms.enterprise_id=${session.enterpriseId}
          AND mp.employee_id=${session.employeeId} AND mp.is_opted_in=TRUE
          AND ms.schedule_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date
      `;
      if (!eligible[0]) throw new Error("REVIEW_NOT_AVAILABLE");
      const existing = await transaction<ExistingReview[]>`
        SELECT id,created_at::text,NOW()<=created_at+INTERVAL '24 hours' AS editable
        FROM meal_reviews WHERE schedule_id=${scheduleId} AND employee_id=${session.employeeId} FOR UPDATE
      `;
      let reviewId: string;
      let createdAt: string;
      if (existing[0]) {
        if (!existing[0].editable) throw new Error("REVIEW_EDIT_WINDOW_CLOSED");
        reviewId = existing[0].id;
        createdAt = existing[0].created_at;
        await transaction`
          UPDATE meal_reviews SET rating=${rating},comment=${comment},feedback_tags=${tags},is_edited=TRUE,updated_at=NOW(),
            voice_public_id=${voice?.publicId ?? null},voice_url=${voice?.url ?? null},voice_duration_seconds=${voice?.durationSeconds ?? null}
          WHERE id=${reviewId}
        `;
      } else {
        const inserted = await transaction<{ id: string; created_at: string }[]>`
          INSERT INTO meal_reviews(schedule_id,employee_id,rating,comment,feedback_tags,voice_public_id,voice_url,voice_duration_seconds)
          VALUES(${scheduleId},${session.employeeId},${rating},${comment},${tags},${voice?.publicId ?? null},${voice?.url ?? null},${voice?.durationSeconds ?? null})
          RETURNING id,created_at::text
        `;
        reviewId = inserted[0].id;
        createdAt = inserted[0].created_at;
      }
      await transaction`DELETE FROM review_photos WHERE review_id=${reviewId}`;
      for (const photo of photos) await transaction`
        INSERT INTO review_photos(review_id,cloudinary_public_id,image_url,thumbnail_url)
        VALUES(${reviewId},${photo.publicId},${photo.url},${photo.thumbnailUrl})
      `;
      return { reviewId, createdAt, editDeadline: new Date(new Date(createdAt).valueOf() + 24 * 60 * 60 * 1000).toISOString(), updated: Boolean(existing[0]) };
    });
    log("review.saved", { requestId, actorUserId: session.userId, reviewId: result.reviewId, scheduleId, rating, photos: photos.length, hasVoice: Boolean(voice), updated: result.updated });
    return NextResponse.json({ ...result, requestId }, { status: result.updated ? 200 : 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REVIEW_FAILED";
    logError("review.save_failed", error, { requestId, actorUserId: session.userId });
    const status = code === "REVIEW_EDIT_WINDOW_CLOSED" ? 409 : code === "REVIEW_NOT_AVAILABLE" ? 400 : 500;
    return NextResponse.json({ error: code, requestId }, { status });
  }
}
