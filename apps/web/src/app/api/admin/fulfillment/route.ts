import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { validFulfillmentRange } from "@/lib/fulfillment";
import { listFulfillmentRows } from "@/lib/fulfillment-query";
import { log, logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const range = validFulfillmentRange(request.nextUrl.searchParams.get("from") || undefined, request.nextUrl.searchParams.get("to") || undefined);
  if (!range) return NextResponse.json({ error: "INVALID_DATE_RANGE", requestId }, { status: 400 });
  try {
    const rows = await listFulfillmentRows(range.from, range.to);
    log("fulfillment.listed", { requestId, actorUserId: session.userId, from: range.from, to: range.to, rowCount: rows.length });
    return NextResponse.json({ rows, requestId });
  } catch (error) {
    logError("fulfillment.list_failed", error, { requestId, actorUserId: session.userId, from: range.from, to: range.to });
    return NextResponse.json({ error: "FULFILLMENT_LIST_FAILED", requestId }, { status: 500 });
  }
}
