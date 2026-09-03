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
  if (session?.role !== "SUPER_ADMIN")
    return NextResponse.json(
      { error: "FORBIDDEN", requestId },
      { status: 403 },
    );
  const { id: enterpriseId } = await params;

  try {
    const password = temporaryPasswordFrom(await request.json());
    if (!password)
      return NextResponse.json(
        { error: "INVALID_TEMPORARY_PASSWORD", requestId },
        { status: 400 },
      );

    const users = await db()<{ id: string; username: string }[]>`
      WITH target AS (
        SELECT au.id
        FROM enterprise_admins ea
        JOIN app_users au ON au.id=ea.user_id
        WHERE ea.enterprise_id=${enterpriseId}
          AND au.enterprise_id=${enterpriseId}
          AND au.role='ENTERPRISE_ADMIN'
        ORDER BY ea.created_at, ea.id
        LIMIT 1
      )
      UPDATE app_users AS au
      SET password_hash=crypt(${password},gen_salt('bf')), must_change_password=TRUE, auth_version=auth_version+1
      FROM target
      WHERE au.id=target.id
      RETURNING au.id, au.username
    `;
    if (!users[0])
      return NextResponse.json(
        { error: "ENTERPRISE_ADMIN_NOT_FOUND", requestId },
        { status: 404 },
      );

    log("enterprise_admin.password_reset", {
      requestId,
      actorUserId: session.userId,
      enterpriseId,
      targetUserId: users[0].id,
    });
    return NextResponse.json({
      enterpriseId,
      username: users[0].username,
      requestId,
    });
  } catch (error) {
    logError("enterprise_admin.password_reset_failed", error, {
      requestId,
      actorUserId: session.userId,
      enterpriseId,
    });
    return NextResponse.json(
      { error: "PASSWORD_RESET_FAILED", requestId },
      { status: 500 },
    );
  }
}
