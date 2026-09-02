import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { DEFAULT_CUTOFF_TIME, PLATFORM_TIMEZONE, readCutoffTime, validateCutoffTime } from "@/lib/platform-cutoff";

type SettingRow = { local_time: string | null };

export async function GET() {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const rows = await db()<SettingRow[]>`SELECT value->>'local_time' AS local_time FROM platform_settings WHERE key='MEAL_CUTOFF'`;
    return NextResponse.json({ cutoffTime: readCutoffTime(rows[0]?.local_time), timezone: PLATFORM_TIMEZONE, requestId });
  } catch (error) {
    logError("platform_cutoff.read_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "CUTOFF_SETTING_READ_FAILED", requestId }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const body = await request.json();
    if (!validateCutoffTime(body.cutoffTime)) return NextResponse.json({ error: "INVALID_CUTOFF_SETTING", requestId }, { status: 400 });
    const result = await db().begin(async (transaction) => {
      const current = await transaction<SettingRow[]>`SELECT value->>'local_time' AS local_time FROM platform_settings WHERE key='MEAL_CUTOFF' FOR UPDATE`;
      const oldValue = readCutoffTime(current[0]?.local_time ?? DEFAULT_CUTOFF_TIME);
      await transaction`
        INSERT INTO platform_settings(key,value,updated_by_user_id)
        VALUES('MEAL_CUTOFF',jsonb_build_object('local_time',${body.cutoffTime}::text,'timezone',${PLATFORM_TIMEZONE}::text),${session.userId})
        ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_by_user_id=EXCLUDED.updated_by_user_id,updated_at=NOW()
      `;
      const affected = await transaction<{ affected_services: number }[]>`
        WITH recalculated AS (
          UPDATE menu_schedules
          SET cutoff_time=(schedule_date + ${body.cutoffTime}::time) AT TIME ZONE ${PLATFORM_TIMEZONE}::text
          WHERE schedule_date >= (CURRENT_TIMESTAMP AT TIME ZONE ${PLATFORM_TIMEZONE}::text)::date
          RETURNING id
        ) SELECT COUNT(*)::int AS affected_services FROM recalculated
      `;
      return { oldValue, affectedServices: affected[0]?.affected_services ?? 0 };
    });
    log("platform_cutoff.updated", { requestId, actorUserId: session.userId, oldValue: result.oldValue, newValue: body.cutoffTime, affectedServices: result.affectedServices });
    return NextResponse.json({ cutoffTime: body.cutoffTime, timezone: PLATFORM_TIMEZONE, affectedServices: result.affectedServices, requestId });
  } catch (error) {
    logError("platform_cutoff.update_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "CUTOFF_SETTING_UPDATE_FAILED", requestId }, { status: 500 });
  }
}
