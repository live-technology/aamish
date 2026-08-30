import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { cloudinaryConfig } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { kind } = await request.json();
  if (kind !== "menu" && kind !== "review") return NextResponse.json({ error: "INVALID_UPLOAD_KIND" }, { status: 400 });

  const config = cloudinaryConfig();
  if (!config) return NextResponse.json({ error: "CLOUDINARY_NOT_CONFIGURED" }, { status: 503 });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `aamish/${kind}s`;
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${config.apiSecret}`).digest("hex");

  return NextResponse.json({ cloudName: config.cloudName, apiKey: config.apiKey, timestamp, folder, signature });
}
