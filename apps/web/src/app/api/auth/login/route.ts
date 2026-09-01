import { NextRequest, NextResponse } from "next/server";
import { log, logError } from "@/lib/logger";
import { setSession, signIn } from "@/lib/auth";
import { destinationForRole } from "@/lib/auth-navigation";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const { username, password } = await request.json();
    if (typeof username !== "string" || typeof password !== "string") return NextResponse.json({ error: "INVALID_REQUEST", requestId }, { status: 400 });
    const session = await signIn(username.trim(), password);
    if (!session) {
      log("auth.login_failed", { requestId, username: username.trim() });
      return NextResponse.json({ error: "INVALID_CREDENTIALS", requestId }, { status: 401 });
    }
    await setSession(session);
    log("auth.login_succeeded", { requestId, userId: session.userId, role: session.role });
    return NextResponse.json({ redirectTo: destinationForRole(session.role), requestId });
  } catch (error) {
    logError("auth.login_error", error, { requestId });
    return NextResponse.json({ error: "LOGIN_FAILED", requestId }, { status: 500 });
  }
}
