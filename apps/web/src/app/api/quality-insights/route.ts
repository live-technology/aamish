import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { qualityFiltersFrom, qualityInsightScope, validInsightRange } from "@/lib/quality-insights";
import { loadQualityInsights } from "@/lib/quality-insights-query";
import { log, logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  const scope = session ? qualityInsightScope(session.role, session.enterpriseId) : null;
  if (!session || !scope) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const params = request.nextUrl.searchParams;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const raw = { from: params.get("from") || undefined, to: params.get("to") || undefined, enterprise: params.get("enterprise") || undefined, location: params.get("location") || undefined, menu: params.get("menu") || undefined, rating: params.get("rating") || undefined };
  if ((raw.from || raw.to) && !validInsightRange(raw.from, raw.to)) return NextResponse.json({ error: "INVALID_DATE_RANGE", requestId }, { status: 400 });
  const filters = qualityFiltersFrom(raw, today);
  try {
    const requestedOffset = Number(params.get("offset"));
    const offset = Number.isInteger(requestedOffset) && requestedOffset > 0 ? Math.min(requestedOffset, 10_000) : 0;
    const data = await loadQualityInsights(filters, scope.enterpriseId, offset);
    log("quality.insights_listed", { requestId, actorUserId: session.userId, role: session.role, from: filters.from, to: filters.to, reviewCount: data.summary.reviewCount });
    return NextResponse.json({ data, requestId });
  } catch (error) {
    logError("quality.insights_failed", error, { requestId, actorUserId: session.userId, role: session.role, from: filters.from, to: filters.to });
    return NextResponse.json({ error: "QUALITY_INSIGHTS_FAILED", requestId }, { status: 500 });
  }
}
