import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { nextAvailableEnterpriseSlug, slugifyEnterpriseName, validateEnterpriseStep, type EnterpriseDraft } from "@/lib/enterprise-onboarding";

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
    const draft = enterpriseDraft(body);
    if (!draft || Object.keys(validateEnterpriseStep("review", draft)).length > 0) {
      return NextResponse.json({ error: "MISSING_REQUIRED_FIELDS", requestId }, { status: 400 });
    }
    const locationCodes = draft.locations.map((location) => location.code.trim().toLowerCase());
    if (new Set(locationCodes).size !== locationCodes.length) {
      return NextResponse.json({ error: "DUPLICATE_LOCATION_CODE", requestId }, { status: 400 });
    }
    const result = await db().begin(async (transaction) => {
      const baseSlug = slugifyEnterpriseName(draft.name);
      const existingSlugs = await transaction<{ slug: string }[]>`
        SELECT slug FROM enterprises
        WHERE slug = ${baseSlug} OR slug LIKE ${`${baseSlug}-%`}
      `;
      const slug = nextAvailableEnterpriseSlug(draft.name, existingSlugs.map((item) => item.slug));
      const enterprises = await transaction<{ id: string }[]>`
        INSERT INTO enterprises (name, slug, poc_name, poc_phone, poc_email)
        VALUES (${draft.name.trim()}, ${slug}, ${draft.pocName.trim()}, ${draft.pocPhone.trim()}, ${draft.pocEmail.trim()}) RETURNING id
      `;
      const enterpriseId = enterprises[0].id;
      for (const location of draft.locations) {
        await transaction`INSERT INTO delivery_locations (enterprise_id, name, code, address) VALUES (${enterpriseId}, ${location.name.trim()}, ${location.code.trim()}, ${location.address.trim()})`;
      }
      const users = await transaction<{ id: string }[]>`
        INSERT INTO app_users (username, password_hash, full_name, role, enterprise_id)
        VALUES (${draft.adminUsername.trim()}, crypt(${draft.adminPassword}, gen_salt('bf')), ${draft.adminFullName.trim()}, 'ENTERPRISE_ADMIN', ${enterpriseId}) RETURNING id
      `;
      await transaction`INSERT INTO enterprise_admins (enterprise_id, user_id) VALUES (${enterpriseId}, ${users[0].id})`;
      return { enterpriseId, enterpriseAdminUsername: draft.adminUsername.trim(), slug };
    });
    log("enterprise.created", { requestId, actorUserId: session.userId, ...result, locations: draft.locations.length });
    return NextResponse.json({ ...result, requestId }, { status: 201 });
  } catch (error) {
    logError("enterprise.create_failed", error, { requestId, actorUserId: session.userId });
    if (isUniqueViolation(error)) {
      const duplicate = error.constraint_name === "app_users_username_key" ? "ENTERPRISE_ADMIN_USERNAME_IN_USE" : "ENTERPRISE_DETAILS_IN_USE";
      return NextResponse.json({ error: duplicate, requestId }, { status: 409 });
    }
    return NextResponse.json({ error: "ENTERPRISE_CREATION_FAILED", requestId }, { status: 500 });
  }
}

function enterpriseDraft(body: unknown): EnterpriseDraft | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  const admin = value.admin && typeof value.admin === "object" ? value.admin as Record<string, unknown> : null;
  if (!admin || !Array.isArray(value.locations) || !value.locations.every((location) => location && typeof location === "object")) return null;
  const locations = value.locations.map((location) => location as Record<string, unknown>);
  const strings = [value.name, value.pocName, value.pocPhone, value.pocEmail, admin.fullName, admin.username, admin.password, ...locations.flatMap((location) => [location.name, location.code, location.address])];
  if (!strings.every((item) => typeof item === "string")) return null;
  return {
    name: value.name as string,
    pocName: value.pocName as string,
    pocPhone: value.pocPhone as string,
    pocEmail: value.pocEmail as string,
    locations: locations.map((location) => ({ name: location.name as string, code: location.code as string, address: location.address as string })),
    adminFullName: admin.fullName as string,
    adminUsername: admin.username as string,
    adminPassword: admin.password as string,
  };
}

function isUniqueViolation(error: unknown): error is { code: "23505"; constraint_name?: string } {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505");
}
