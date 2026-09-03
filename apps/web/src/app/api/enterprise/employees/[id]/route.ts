import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "ENTERPRISE_ADMIN" || !session.enterpriseId) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const { id } = await params;

  try {
    const body = await request.json();
    if (!body.fullName || !body.email || !body.locationId) return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS", requestId }, { status: 400 });
    const isActive = body.isActive !== false;

    const updated = await db().begin(async (transaction) => {
      const locations = await transaction<{ id: string }[]>`SELECT id FROM delivery_locations WHERE id=${body.locationId} AND enterprise_id=${session.enterpriseId}`;
      if (!locations[0]) throw new Error("INVALID_LOCATION");
      const rows = await transaction<{ id: string }[]>`
        UPDATE employees SET full_name=${body.fullName}, email=${body.email}, phone=${body.phone || null}, location_id=${body.locationId}, is_active=${isActive}, updated_at=NOW()
        WHERE id=${id} AND enterprise_id=${session.enterpriseId}
        RETURNING id
      `;
      if (!rows[0]) throw new Error("EMPLOYEE_NOT_FOUND");
      await transaction`UPDATE app_users SET full_name=${body.fullName}, is_active=${isActive} WHERE employee_id=${id}`;
      return rows[0];
    });

    log("employee.updated", { requestId, actorUserId: session.userId, enterpriseId: session.enterpriseId, employeeId: updated.id, isActive });
    return NextResponse.json({ employeeId: updated.id, requestId });
  } catch (error) {
    const code = error instanceof Error ? error.message : "EMPLOYEE_UPDATE_FAILED";
    const status = code === "EMPLOYEE_NOT_FOUND" ? 404 : code === "INVALID_LOCATION" ? 400 : 500;
    if (status === 500) logError("employee.update_failed", error, { requestId, actorUserId: session.userId, employeeId: id });
    return NextResponse.json({ error: code, requestId }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "ENTERPRISE_ADMIN" || !session.enterpriseId) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const { id } = await params;

  try {
    const removed = await db().begin(async (transaction) => {
      const rows = await transaction<{ id: string }[]>`
        UPDATE employees SET is_active=FALSE, updated_at=NOW() WHERE id=${id} AND enterprise_id=${session.enterpriseId} RETURNING id
      `;
      if (!rows[0]) throw new Error("EMPLOYEE_NOT_FOUND");
      await transaction`UPDATE app_users SET is_active=FALSE WHERE employee_id=${id}`;
      return rows[0];
    });
    log("employee.removed", { requestId, actorUserId: session.userId, enterpriseId: session.enterpriseId, employeeId: removed.id });
    return NextResponse.json({ employeeId: removed.id, requestId });
  } catch (error) {
    const code = error instanceof Error ? error.message : "EMPLOYEE_REMOVE_FAILED";
    const status = code === "EMPLOYEE_NOT_FOUND" ? 404 : 500;
    if (status === 500) logError("employee.remove_failed", error, { requestId, actorUserId: session.userId, employeeId: id });
    return NextResponse.json({ error: code, requestId }, { status });
  }
}
