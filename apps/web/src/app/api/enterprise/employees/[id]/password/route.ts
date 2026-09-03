import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { temporaryPasswordFrom } from "@/lib/password-reset";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "ENTERPRISE_ADMIN" || !session.enterpriseId) {
    return NextResponse.json(
      { error: "FORBIDDEN", requestId },
      { status: 403 },
    );
  }
  const { id: employeeId } = await params;

  try {
    const password = temporaryPasswordFrom(await request.json());
    if (!password)
      return NextResponse.json(
        { error: "INVALID_TEMPORARY_PASSWORD", requestId },
        { status: 400 },
      );

    const users = await db()<{ id: string }[]>`
      UPDATE app_users AS au
      SET password_hash=crypt(${password},gen_salt('bf')), must_change_password=TRUE, auth_version=auth_version+1
      FROM employees AS ep
      WHERE au.employee_id=ep.id
        AND ep.id=${employeeId}
        AND ep.enterprise_id=${session.enterpriseId}
        AND au.enterprise_id=${session.enterpriseId}
        AND au.role='EMPLOYEE'
      RETURNING au.id
    `;
    if (!users[0])
      return NextResponse.json(
        { error: "EMPLOYEE_NOT_FOUND", requestId },
        { status: 404 },
      );

    log("employee.password_reset", {
      requestId,
      actorUserId: session.userId,
      enterpriseId: session.enterpriseId,
      employeeId,
    });
    return NextResponse.json({ employeeId, requestId });
  } catch (error) {
    logError("employee.password_reset_failed", error, {
      requestId,
      actorUserId: session.userId,
      enterpriseId: session.enterpriseId,
      employeeId,
    });
    return NextResponse.json(
      { error: "PASSWORD_RESET_FAILED", requestId },
      { status: 500 },
    );
  }
}
