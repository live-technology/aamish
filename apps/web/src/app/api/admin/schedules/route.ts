import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";

export async function GET() {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const schedules = await db()`
    SELECT ms.id, ms.schedule_date::text, ms.cutoff_time::text, ms.status, e.name AS enterprise_name,
      COALESCE(json_agg(json_build_object('label', mso.option_label, 'title', m.title) ORDER BY mso.option_label) FILTER (WHERE mso.id IS NOT NULL), '[]') AS options
    FROM menu_schedules ms
    JOIN enterprises e ON e.id = ms.enterprise_id
    LEFT JOIN menu_schedule_options mso ON mso.schedule_id = ms.id
    LEFT JOIN menus m ON m.id = mso.menu_id
    GROUP BY ms.id, e.name
    ORDER BY ms.schedule_date DESC
  `;
  return NextResponse.json({ schedules, requestId });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const body = await request.json();
    if (!body.enterpriseId || !body.scheduleDate || !body.cutoffTime || !Array.isArray(body.menuIds) || body.menuIds.length < 1) return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS", requestId }, { status: 400 });
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    if (body.scheduleDate < today) return NextResponse.json({ error: "PAST_MEAL_DATE", requestId }, { status: 400 });
    if (Number.isNaN(new Date(body.cutoffTime).valueOf()) || new Date(body.cutoffTime) <= new Date()) return NextResponse.json({ error: "CUTOFF_MUST_BE_FUTURE", requestId }, { status: 400 });
    const uniqueMenuIds = [...new Set(body.menuIds)] as string[];
    if (uniqueMenuIds.length !== body.menuIds.length) return NextResponse.json({ error: "DUPLICATE_PACKAGE_OPTION", requestId }, { status: 400 });
    const result = await db().begin(async (transaction) => {
      const schedules = await transaction<{ id: string }[]>`
        INSERT INTO menu_schedules (enterprise_id, menu_id, schedule_date, cutoff_time, status)
        VALUES (${body.enterpriseId}, ${uniqueMenuIds[0]}, ${body.scheduleDate}, ${new Date(body.cutoffTime).toISOString()}, 'PUBLISHED') RETURNING id
      `;
      let firstOptionId = "";
      for (const [index, menuId] of uniqueMenuIds.entries()) {
        const options = await transaction<{ id: string }[]>`INSERT INTO menu_schedule_options (schedule_id, menu_id, option_label) VALUES (${schedules[0].id}, ${menuId}, ${String.fromCharCode(65 + index)}) RETURNING id`;
        if (index === 0) firstOptionId = options[0].id;
      }
      await transaction`INSERT INTO meal_preferences (schedule_id,employee_id,location_id,selected_option_id) SELECT ${schedules[0].id},id,location_id,${firstOptionId} FROM employees WHERE enterprise_id=${body.enterpriseId} AND is_active=TRUE ON CONFLICT DO NOTHING`;
      return { scheduleId: schedules[0].id, optionCount: uniqueMenuIds.length };
    });
    log("schedule.published", { requestId, actorUserId: session.userId, ...result, enterpriseId: body.enterpriseId, scheduleDate: body.scheduleDate });
    return NextResponse.json({ ...result, requestId }, { status: 201 });
  } catch (error) {
    logError("schedule.publish_failed", error, { requestId, actorUserId: session.userId });
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ error: "SCHEDULE_ALREADY_EXISTS", requestId }, { status: 409 });
    return NextResponse.json({ error: "SCHEDULE_PUBLISH_FAILED", requestId }, { status: 500 });
  }
}
