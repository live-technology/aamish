import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { logError } from "@/lib/logger";
import type { EnterpriseReviewRow } from "@/components/enterprise-reviews";

const PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "ENTERPRISE_ADMIN" || !session.enterpriseId) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const search = params.get("search")?.trim() || "";
  const location = params.get("location") || "";
  const dateParam = params.get("date");
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : null;
  const ratingParam = params.get("rating") || "";
  const ratingLow = ratingParam === "LOW";
  const ratingExact = ratingParam && ratingParam !== "LOW" ? Number(ratingParam) : null;
  const offset = Math.max(0, Number(params.get("offset")) || 0);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.get("limit")) || PAGE_SIZE));
  const enterpriseId = session.enterpriseId;

  try {
    const reviews = await db()<EnterpriseReviewRow[]>`
      SELECT mr.id,mr.rating,mr.comment,mr.created_at::text,mr.voice_url,mr.voice_duration_seconds,
        ms.schedule_date::text,ep.full_name,dl.name AS location_name,COALESCE(m.title,'Scheduled meal') AS menu_title
      FROM meal_reviews mr JOIN menu_schedules ms ON ms.id=mr.schedule_id
      JOIN employees ep ON ep.id=mr.employee_id AND ep.enterprise_id=${enterpriseId}
      JOIN delivery_locations dl ON dl.id=ep.location_id
      LEFT JOIN meal_preferences mp ON mp.schedule_id=mr.schedule_id AND mp.employee_id=mr.employee_id
      LEFT JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id LEFT JOIN menus m ON m.id=mso.menu_id
      WHERE ms.enterprise_id=${enterpriseId} AND ms.schedule_date>=CURRENT_DATE-30
        AND (${search}='' OR ep.full_name ILIKE ${`%${search}%`} OR mr.comment ILIKE ${`%${search}%`} OR COALESCE(m.title,'') ILIKE ${`%${search}%`})
        AND (${location}='' OR dl.name=${location})
        AND (${date}::date IS NULL OR ms.schedule_date=${date}::date)
        AND (NOT ${ratingLow} OR mr.rating<=2)
        AND (${ratingExact}::int IS NULL OR mr.rating=${ratingExact}::int)
      ORDER BY ms.schedule_date DESC,mr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return NextResponse.json({ reviews, requestId, hasMore: reviews.length === limit });
  } catch (error) {
    logError("enterprise.reviews_page_failed", error, { requestId, actorUserId: session.userId, enterpriseId, offset, limit });
    return NextResponse.json({ error: "REVIEWS_FETCH_FAILED", requestId }, { status: 500 });
  }
}
