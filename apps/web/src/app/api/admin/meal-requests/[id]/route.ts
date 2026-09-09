import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { isRequestId, isRequestStatus, MealRequestError, requireSameOrigin } from "@/lib/meal-requests";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const session = await currentSession();
    if (session?.role !== "SUPER_ADMIN") return Response.json({ error: "Access denied.", requestId }, { status: 403 });
    requireSameOrigin(request);
    const { id } = await context.params;
    if (!isRequestId(id)) return Response.json({ error: "Request not found.", requestId }, { status: 404 });
    const value = await request.json().catch(() => null);
    if (!isRequestStatus(value?.status)) return Response.json({ error: "Choose New, Contacted, or Closed.", requestId }, { status: 400 });
    const rows = await db()`UPDATE meal_requests SET status = ${value.status}, updated_at = now() WHERE id = ${id} RETURNING id`;
    if (!rows.length) return Response.json({ error: "Request not found.", requestId }, { status: 404 });
    log("meal_request.status_changed", { requestId, mealRequestId: id, actorUserId: session.userId, status: value.status });
    return Response.json({ success: true, status: value.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof MealRequestError ? error.status : 503;
    log("meal_request.status_failed", { requestId, status });
    return Response.json({ error: "Couldn’t update the status. Please try again.", requestId }, { status });
  }
}
