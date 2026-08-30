import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";

export async function GET() {
  const requestId = crypto.randomUUID(); const session = await currentSession();
  if (session?.role !== "ENTERPRISE_ADMIN" || !session.enterpriseId) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const employees = await db()`SELECT ep.id, ep.employee_code, ep.full_name, ep.email, ep.phone, ep.is_active, dl.name AS location_name, au.username FROM employees ep JOIN delivery_locations dl ON dl.id=ep.location_id LEFT JOIN app_users au ON au.employee_id=ep.id WHERE ep.enterprise_id=${session.enterpriseId} ORDER BY ep.created_at DESC`;
  return NextResponse.json({ employees, requestId });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID(); const session = await currentSession();
  if (session?.role !== "ENTERPRISE_ADMIN" || !session.enterpriseId) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const body = await request.json();
    if (!body.employeeCode || !body.fullName || !body.email || !body.locationId || !body.username || !body.password) return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS", requestId }, { status: 400 });
    const result = await db().begin(async (transaction) => {
      const locations = await transaction<{ id: string }[]>`SELECT id FROM delivery_locations WHERE id=${body.locationId} AND enterprise_id=${session.enterpriseId} AND is_active=TRUE`;
      if (!locations[0]) throw new Error("INVALID_LOCATION");
      const employees = await transaction<{ id: string }[]>`INSERT INTO employees (enterprise_id, employee_code, full_name, email, phone, location_id) VALUES (${session.enterpriseId}, ${body.employeeCode}, ${body.fullName}, ${body.email}, ${body.phone || null}, ${body.locationId}) RETURNING id`;
      await transaction`INSERT INTO app_users (username,password_hash,full_name,role,enterprise_id,employee_id) VALUES (${body.username},crypt(${body.password},gen_salt('bf')),${body.fullName},'EMPLOYEE',${session.enterpriseId},${employees[0].id})`;
      await transaction`INSERT INTO meal_preferences (schedule_id,employee_id,location_id,selected_option_id) SELECT ms.id,${employees[0].id},${body.locationId},(SELECT id FROM menu_schedule_options WHERE schedule_id=ms.id ORDER BY option_label LIMIT 1) FROM menu_schedules ms WHERE ms.enterprise_id=${session.enterpriseId} AND ms.schedule_date>=CURRENT_DATE ON CONFLICT DO NOTHING`;
      return { employeeId: employees[0].id, username: body.username };
    });
    log("employee.created", { requestId, actorUserId: session.userId, enterpriseId: session.enterpriseId, ...result });
    return NextResponse.json({ ...result, requestId }, { status: 201 });
  } catch (error) {
    logError("employee.create_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: error instanceof Error ? error.message : "EMPLOYEE_CREATION_FAILED", requestId }, { status: 500 });
  }
}
