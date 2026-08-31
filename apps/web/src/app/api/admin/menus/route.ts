import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { validateMenuPackage } from "@/lib/menu-package";

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
    const validated = validateMenuPackage(await request.json(), true);
    if (!validated.ok) return NextResponse.json({ error: validated.error, requestId }, { status: 400 });
    const body = validated.value;
    const rows = await db()`INSERT INTO menus (title, description, category, price, image_desktop_url, image_mobile_url, status) VALUES (${body.title}, ${body.description}, ${body.category}, ${body.price}, ${body.imageUrl}, ${body.imageUrl}, ${body.status}) RETURNING id, title, status`;
    log("menu.created", { requestId, actorUserId: session.userId, menuId: rows[0].id, status: rows[0].status });
    return NextResponse.json({ menu: rows[0], requestId }, { status: 201 });
  } catch (error) {
    logError("menu.create_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "MENU_CREATION_FAILED", requestId }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const raw = await request.json();
    if (!raw.id || typeof raw.id !== "string") return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS", requestId }, { status: 400 });
    const validated = validateMenuPackage(raw, false);
    if (!validated.ok) return NextResponse.json({ error: validated.error, requestId }, { status: 400 });
    const body = validated.value;
    const rows = await db()`
      UPDATE menus SET title=${body.title}, description=${body.description}, category=${body.category}, price=${body.price}, status=${body.status},
        image_desktop_url=COALESCE(${body.imageUrl}, image_desktop_url), image_mobile_url=COALESCE(${body.imageUrl}, image_mobile_url)
      WHERE id=${raw.id}
      RETURNING id, title, description, category, price::float, status, image_mobile_url`;
    if (!rows[0]) return NextResponse.json({ error: "PACKAGE_NOT_FOUND", requestId }, { status: 404 });
    log("menu.updated", { requestId, actorUserId: session.userId, menuId: raw.id, status: body.status, imageReplaced: Boolean(body.imageUrl) });
    return NextResponse.json({ menu: rows[0], requestId });
  } catch (error) {
    logError("menu.update_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "PACKAGE_UPDATE_FAILED", requestId }, { status: 500 });
  }
}
