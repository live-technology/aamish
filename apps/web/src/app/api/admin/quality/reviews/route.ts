import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import type { ReviewRow } from "@/components/quality-dashboard";

const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const date = params.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "INVALID_DATE", requestId }, { status: 400 });
  const offset = Math.max(0, Number(params.get("offset")) || 0);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.get("limit")) || PAGE_SIZE));

  try {
    const reviews = await db()<ReviewRow[]>`
      SELECT mr.id,mr.rating,mr.comment,ep.full_name,e.name AS enterprise_name,
        COALESCE(m.title,'Scheduled meal') AS menu_title,mr.created_at::text,mr.voice_url,mr.voice_duration_seconds,
        ms.schedule_date::text,COUNT(rp.id)::int AS photo_count
      FROM meal_reviews mr JOIN menu_schedules ms ON ms.id=mr.schedule_id
      JOIN employees ep ON ep.id=mr.employee_id JOIN enterprises e ON e.id=ep.enterprise_id
      LEFT JOIN meal_preferences mp ON mp.schedule_id=mr.schedule_id AND mp.employee_id=mr.employee_id
      LEFT JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id LEFT JOIN menus m ON m.id=mso.menu_id
      LEFT JOIN review_photos rp ON rp.review_id=mr.id
      WHERE ms.schedule_date=${date}
      GROUP BY mr.id,ms.schedule_date,ep.full_name,e.name,m.title
      ORDER BY mr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return NextResponse.json({ reviews, requestId, hasMore: reviews.length === limit });
  } catch (error) {
    logError("quality.reviews_page_failed", error, { requestId, actorUserId: session.userId, date, offset, limit });
    return NextResponse.json({ error: "REVIEWS_FETCH_FAILED", requestId }, { status: 500 });
  }
}
