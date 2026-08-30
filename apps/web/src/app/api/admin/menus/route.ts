import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";

export async function GET() {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  const menus = await db()`SELECT id, title, description, category, price::float, status, image_mobile_url FROM menus ORDER BY created_at DESC`;
  return NextResponse.json({ menus, requestId });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const body = await request.json();
    if (!body.title || !body.description || !body.category || !body.imageUrl || body.price === "" || Number.isNaN(Number(body.price))) return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS", requestId }, { status: 400 });
    const rows = await db()`INSERT INTO menus (title, description, category, price, image_desktop_url, image_mobile_url, status) VALUES (${body.title}, ${body.description}, ${body.category}, ${Number(body.price)}, ${body.imageUrl || null}, ${body.imageUrl || null}, ${body.status === "ACTIVE" ? "ACTIVE" : "DRAFT"}) RETURNING id, title, status`;
    log("menu.created", { requestId, actorUserId: session.userId, menuId: rows[0].id, status: rows[0].status });
    return NextResponse.json({ menu: rows[0], requestId }, { status: 201 });
  } catch (error) {
    logError("menu.create_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "MENU_CREATION_FAILED", requestId }, { status: 500 });
  }
}
