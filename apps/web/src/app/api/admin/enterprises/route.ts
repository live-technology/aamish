import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";

export async function GET() {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const enterprises = await db()`
      SELECT e.id, e.name, e.slug, e.status, e.poc_name, e.poc_email,
        COUNT(DISTINCT dl.id)::int AS location_count,
        COUNT(DISTINCT ea.id)::int AS admin_count
      FROM enterprises e
      LEFT JOIN delivery_locations dl ON dl.enterprise_id = e.id
      LEFT JOIN enterprise_admins ea ON ea.enterprise_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;
    return NextResponse.json({ enterprises, requestId });
  } catch (error) {
    logError("enterprise.list_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "ENTERPRISE_LIST_FAILED", requestId }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const body = await request.json();
    if (!body.name || !body.slug || !body.pocName || !body.pocEmail || !body.admin?.username || !body.admin?.password || !Array.isArray(body.locations) || body.locations.length < 1 || body.locations.some((location: { name?: string; code?: string }) => !location.name || !location.code)) {
      return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS", requestId }, { status: 400 });
    }
    const result = await db().begin(async (transaction) => {
      const enterprises = await transaction<{ id: string }[]>`
        INSERT INTO enterprises (name, slug, poc_name, poc_phone, poc_email)
        VALUES (${body.name}, ${body.slug}, ${body.pocName}, ${body.pocPhone ?? ""}, ${body.pocEmail}) RETURNING id
      `;
      const enterpriseId = enterprises[0].id;
      for (const location of body.locations) {
        await transaction`INSERT INTO delivery_locations (enterprise_id, name, code, address) VALUES (${enterpriseId}, ${location.name}, ${location.code}, ${location.address ?? location.name})`;
      }
      const users = await transaction<{ id: string }[]>`
        INSERT INTO app_users (username, password_hash, full_name, role, enterprise_id)
        VALUES (${body.admin.username}, crypt(${body.admin.password}, gen_salt('bf')), ${body.admin.fullName}, 'ENTERPRISE_ADMIN', ${enterpriseId}) RETURNING id
      `;
      await transaction`INSERT INTO enterprise_admins (enterprise_id, user_id) VALUES (${enterpriseId}, ${users[0].id})`;
      return { enterpriseId, enterpriseAdminUsername: body.admin.username };
    });
    log("enterprise.created", { requestId, actorUserId: session.userId, ...result, locations: body.locations.length });
    return NextResponse.json({ ...result, requestId }, { status: 201 });
  } catch (error) {
    logError("enterprise.create_failed", error, { requestId, actorUserId: session.userId });
    return NextResponse.json({ error: "ENTERPRISE_CREATION_FAILED", requestId }, { status: 500 });
  }
}
