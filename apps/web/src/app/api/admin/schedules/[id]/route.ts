import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { cutoffIsoForDate, validateCutoffTime } from "@/lib/platform-cutoff";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const { id } = await params;

  try {
    const body = await request.json();
    if (!validateCutoffTime(body.cutoffTime)) return NextResponse.json({ error: "INVALID_CUTOFF_SETTING", requestId }, { status: 400 });

    const updated = await db().begin(async (transaction) => {
      const schedules = await transaction<{ schedule_date: string; status: string }[]>`SELECT schedule_date::text, status FROM menu_schedules WHERE id=${id} FOR UPDATE`;
      if (!schedules[0]) throw new Error("SCHEDULE_NOT_FOUND");
      if (schedules[0].status === "CANCELLED") throw new Error("SCHEDULE_CANCELLED");
      const cutoffIso = cutoffIsoForDate(schedules[0].schedule_date, body.cutoffTime);
      const rows = await transaction<{ id: string }[]>`UPDATE menu_schedules SET cutoff_time=${cutoffIso} WHERE id=${id} RETURNING id`;
      return rows[0];
    });

    log("schedule.cutoff_updated", { requestId, actorUserId: session.userId, scheduleId: updated.id, cutoffTime: body.cutoffTime });
    return NextResponse.json({ scheduleId: updated.id, requestId });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SCHEDULE_UPDATE_FAILED";
    const status = code === "SCHEDULE_NOT_FOUND" ? 404 : code === "SCHEDULE_CANCELLED" || code === "INVALID_CUTOFF" ? 400 : 500;
    if (status === 500) logError("schedule.update_failed", error, { requestId, actorUserId: session.userId, scheduleId: id });
    return NextResponse.json({ error: status === 400 && code === "INVALID_CUTOFF" ? "INVALID_CUTOFF_SETTING" : code, requestId }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const { id } = await params;

  try {
    const rows = await db()<{ id: string }[]>`UPDATE menu_schedules SET status='CANCELLED' WHERE id=${id} AND status != 'CANCELLED' RETURNING id`;
    if (!rows[0]) return NextResponse.json({ error: "SCHEDULE_NOT_FOUND", requestId }, { status: 404 });
    log("schedule.cancelled", { requestId, actorUserId: session.userId, scheduleId: id });
    return NextResponse.json({ scheduleId: id, requestId });
  } catch (error) {
    logError("schedule.cancel_failed", error, { requestId, actorUserId: session.userId, scheduleId: id });
    return NextResponse.json({ error: "SCHEDULE_CANCEL_FAILED", requestId }, { status: 500 });
  }
}
