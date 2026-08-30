import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

export function GET() {
  const requestId = crypto.randomUUID();
  log("health.checked", { requestId });
  return NextResponse.json({ status: "ok", service: "aamish-web", requestId });
}
