import { NextRequest, NextResponse } from "next/server";
import { currentSession, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { destinationForRole } from "@/lib/auth-navigation";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession({ allowPendingPassword: true });
  if (!session)
    return NextResponse.json(
      { error: "UNAUTHORIZED", requestId },
      { status: 401 },
    );
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8)
      return NextResponse.json(
        { error: "PASSWORD_TOO_SHORT", requestId },
        { status: 400 },
      );
    const changed = await db()<
      { authVersion: number }[]
    >`UPDATE app_users SET password_hash=crypt(${password},gen_salt('bf')),must_change_password=FALSE,auth_version=auth_version+1 WHERE id=${session.userId} AND password_hash<>crypt(${password},password_hash) RETURNING auth_version AS "authVersion"`;
    if (!changed[0])
      return NextResponse.json(
        { error: "PASSWORD_MUST_CHANGE", requestId },
        { status: 400 },
      );
    await setSession({
      ...session,
      mustChangePassword: false,
      authVersion: changed[0].authVersion,
    });
    log("auth.password_changed", {
      requestId,
      actorUserId: session.userId,
      role: session.role,
    });
    return NextResponse.json({
      redirectTo: destinationForRole(session.role),
      requestId,
    });
  } catch (error) {
    logError("auth.password_change_failed", error, {
      requestId,
      actorUserId: session.userId,
    });
    return NextResponse.json(
      { error: "PASSWORD_CHANGE_FAILED", requestId },
      { status: 500 },
    );
  }
}
