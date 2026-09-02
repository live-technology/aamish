import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { listAdminSchedules } from "@/lib/admin-schedules";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { DEFAULT_CUTOFF_TIME, PLATFORM_TIMEZONE, readCutoffTime } from "@/lib/platform-cutoff";
import { addDays, isYmd } from "@/lib/service-planning";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    const fromParam = request.nextUrl.searchParams.get("from") || undefined;
    const toParam = request.nextUrl.searchParams.get("to") || undefined;
    const from = isYmd(fromParam) ? fromParam : today;
    const to = isYmd(toParam) && toParam >= from ? toParam : addDays(from, 6);
    const schedules = await listAdminSchedules(from, to);
    return NextResponse.json({ schedules, requestId });
  } catch (error) {
    logError("schedule.list_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "SCHEDULE_LIST_FAILED", requestId }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const body = await request.json();
    if (!body.enterpriseId || !body.scheduleDate || !Array.isArray(body.menuIds) || body.menuIds.length < 1) return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS", requestId }, { status: 400 });
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    if (body.scheduleDate < today) return NextResponse.json({ error: "PAST_MEAL_DATE", requestId }, { status: 400 });
    const uniqueMenuIds = [...new Set(body.menuIds)] as string[];
    if (uniqueMenuIds.length !== body.menuIds.length) return NextResponse.json({ error: "DUPLICATE_PACKAGE_OPTION", requestId }, { status: 400 });
    const result = await db().begin(async (transaction) => {
      const cutoffRows = await transaction<{ local_time: string | null }[]>`SELECT value->>'local_time' AS local_time FROM platform_settings WHERE key='MEAL_CUTOFF'`;
      const cutoffTime = readCutoffTime(cutoffRows[0]?.local_time ?? DEFAULT_CUTOFF_TIME);
      const schedules = await transaction<{ id: string }[]>`
        INSERT INTO menu_schedules (enterprise_id, menu_id, schedule_date, cutoff_time, status)
        VALUES (${body.enterpriseId}, ${uniqueMenuIds[0]}, ${body.scheduleDate}, (${body.scheduleDate}::date + ${cutoffTime}::time) AT TIME ZONE ${PLATFORM_TIMEZONE}::text, 'PUBLISHED') RETURNING id
      `;
      let firstOptionId = "";
      for (const [index, menuId] of uniqueMenuIds.entries()) {
        const options = await transaction<{ id: string }[]>`INSERT INTO menu_schedule_options (schedule_id, menu_id, option_label) VALUES (${schedules[0].id}, ${menuId}, ${String.fromCharCode(65 + index)}) RETURNING id`;
        if (index === 0) firstOptionId = options[0].id;
      }
      await transaction`INSERT INTO meal_preferences (schedule_id,employee_id,location_id,selected_option_id) SELECT ${schedules[0].id},id,location_id,${firstOptionId} FROM employees WHERE enterprise_id=${body.enterpriseId} AND is_active=TRUE ON CONFLICT DO NOTHING`;
      return { scheduleId: schedules[0].id, optionCount: uniqueMenuIds.length, cutoffTime };
    });
    log("schedule.published", { requestId, actorUserId: session.userId, ...result, enterpriseId: body.enterpriseId, scheduleDate: body.scheduleDate });
    return NextResponse.json({ ...result, requestId }, { status: 201 });
  } catch (error) {
    logError("schedule.publish_failed", error, { requestId, actorUserId: session.userId });
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ error: "SCHEDULE_ALREADY_EXISTS", requestId }, { status: 409 });
    return NextResponse.json({ error: "SCHEDULE_PUBLISH_FAILED", requestId }, { status: 500 });
  }
}
