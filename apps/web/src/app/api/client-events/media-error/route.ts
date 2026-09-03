import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { log } from "@/lib/logger";
import { validMediaErrorSurface } from "@/lib/media-events";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED", requestId }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!validMediaErrorSurface(body.surface)) return NextResponse.json({ error: "INVALID_MEDIA_EVENT", requestId }, { status: 400 });

  log("media.load_failed", { requestId, actorUserId: session.userId, actorRole: session.role, surface: body.surface });
  return NextResponse.json({ requestId }, { status: 202 });
}
