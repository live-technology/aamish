import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateFoodQualityReport } from "@/lib/food-quality-reports";
import { log, logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "EMPLOYEE" || !session.employeeId || !session.enterpriseId) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const payload = await request.json().catch(() => null);
    const validation = validateFoodQualityReport(payload);
    if (!validation.ok) return NextResponse.json({ error: validation.error, requestId }, { status: 400 });
    const { scheduleId, message } = validation.value;
    const rows = await db()<{ id: string }[]>`
      INSERT INTO platform_feedback (
        submitted_by_user_id,submitter_role,enterprise_id,category,message,page_path,
        meal_service_date,meal_schedule_id,quality_status,quality_classification_source
      )
      SELECT ${session.userId},${session.role},${session.enterpriseId},'BUG',${message},'/employee/reviews',
        ms.schedule_date,ms.id,'NEW','EMPLOYEE_REPORT'
      FROM menu_schedules ms JOIN meal_preferences mp ON mp.schedule_id=ms.id
      WHERE ms.id=${scheduleId} AND ms.enterprise_id=${session.enterpriseId}
        AND mp.employee_id=${session.employeeId} AND mp.is_opted_in=TRUE
        AND ms.status <> 'CANCELLED'
        AND ms.schedule_date < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date
      RETURNING id
    `;
    if (!rows[0]) return NextResponse.json({ error: "FOOD_QUALITY_REPORT_NOT_AVAILABLE", requestId }, { status: 400 });
    log("food_quality.reported", { requestId, reportId: rows[0].id, actorUserId: session.userId, actorRole: session.role, enterpriseId: session.enterpriseId, scheduleId });
    return NextResponse.json({ reportId: rows[0].id, requestId }, { status: 201 });
  } catch (error) {
    logError("food_quality.report_failed", error, { requestId, actorUserId: session.userId, actorRole: session.role, enterpriseId: session.enterpriseId });
    return NextResponse.json({ error: "FOOD_QUALITY_REPORT_FAILED", requestId }, { status: 500 });
  }
}
