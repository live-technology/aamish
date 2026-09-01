import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { cloudinaryConfig } from "@/lib/cloudinary";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });

  const { kind } = await request.json();
  if (kind !== "menu" && kind !== "review" && kind !== "feedback") return NextResponse.json({ error: "INVALID_UPLOAD_KIND", requestId }, { status: 400 });
  if ((kind === "menu" && session.role !== "SUPER_ADMIN") || (kind === "review" && session.role !== "EMPLOYEE")) {
    return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  }

  const config = cloudinaryConfig();
  if (!config) return NextResponse.json({ error: "CLOUDINARY_NOT_CONFIGURED", requestId }, { status: 503 });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `aamish/${kind}s`;
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`).digest("hex");

  log("upload.signature_issued", { requestId, actorUserId: session.userId, kind });
  return NextResponse.json({ cloudName: config.cloudName, apiKey: config.apiKey, timestamp, folder, signature, requestId });
}
