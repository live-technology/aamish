import { NextRequest, NextResponse } from "next/server";
import { log, logError } from "@/lib/logger";
import { updatePreference } from "@/lib/operations";
import { currentSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "EMPLOYEE" || !session.employeeId) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const body = await request.json();
    if (typeof body.scheduleId !== "string" || typeof body.optedIn !== "boolean") {
      return NextResponse.json({ error: "INVALID_REQUEST", requestId }, { status: 400 });
    }
    const preference = await updatePreference({ scheduleId: body.scheduleId, employeeId: session.employeeId, optedIn: body.optedIn, selectedOptionId: body.selectedOptionId });
    log("meal.preference.updated", { requestId, scheduleId: body.scheduleId, employeeId: session.employeeId, optedIn: body.optedIn, selectedOptionId: body.selectedOptionId });
    return NextResponse.json({ preference, requestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    logError("meal.preference.update_failed", error, { requestId });
    const status = message === "CUTOFF_TIME_EXPIRED" || message === "SCHEDULE_CANCELLED" ? 403 : message === "Schedule not found" || message === "Meal preference not found" ? 404 : 500;
    return NextResponse.json({ error: message, requestId }, { status });
  }
}
