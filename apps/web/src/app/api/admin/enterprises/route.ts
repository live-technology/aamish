import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { log, logError } from "@/lib/logger";
import { nextAvailableEnterpriseSlug, slugifyEnterpriseName, validateEnterpriseStep, type EnterpriseDraft } from "@/lib/enterprise-onboarding";
import { validateEnterpriseEdit, type EnterpriseEditPayload } from "@/lib/enterprise-edit";

export async function GET() {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const enterprises = await db()`
      SELECT e.id, e.name, e.slug, e.status, e.poc_name, e.poc_phone, e.poc_email,
        COUNT(DISTINCT dl.id)::int AS location_count,
        COUNT(DISTINCT ea.id)::int AS admin_count,
        COALESCE(jsonb_agg(DISTINCT jsonb_build_object('id',dl.id,'name',dl.name,'code',dl.code,'address',dl.address,'is_active',dl.is_active)) FILTER (WHERE dl.id IS NOT NULL),'[]') AS locations
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

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const session = await currentSession();
  if (session?.role !== "SUPER_ADMIN") return NextResponse.json({ error: "FORBIDDEN", requestId }, { status: 403 });
  try {
    const payload = enterpriseEditPayload(await request.json());
    if (!payload) return NextResponse.json({ error: "INVALID_ENTERPRISE_UPDATE", requestId }, { status: 400 });
    const invalid = validateEnterpriseEdit(payload);
    if (invalid) return NextResponse.json({ error: invalid, requestId }, { status: 400 });
    const result = await db().begin(async (transaction) => {
      const enterprises = await transaction<{ id:string }[]>`SELECT id FROM enterprises WHERE id=${payload.id} FOR UPDATE`;
      if (!enterprises[0]) throw new Error("ENTERPRISE_NOT_FOUND");
      const current = await transaction<{id:string}[]>`SELECT id FROM delivery_locations WHERE enterprise_id=${payload.id} FOR UPDATE`;
      const currentIds = new Set(current.map((item) => item.id));
      const submittedIds = new Set(payload.locations.flatMap((location) => location.id ? [location.id] : []));
      if ([...submittedIds].some((id) => !currentIds.has(id))) throw new Error("INVALID_LOCATION");
      for (const location of current.filter((item) => !submittedIds.has(item.id))) {
        const usage = await transaction<{in_use:boolean}[]>`SELECT EXISTS(SELECT 1 FROM employees WHERE location_id=${location.id}) OR EXISTS(SELECT 1 FROM meal_preferences WHERE location_id=${location.id}) AS in_use`;
        if (usage[0]?.in_use) throw new Error("LOCATION_IN_USE");
        await transaction`DELETE FROM delivery_locations WHERE id=${location.id} AND enterprise_id=${payload.id}`;
      }
      for (const location of payload.locations) {
        if (location.id) await transaction`UPDATE delivery_locations SET name=${location.name.trim()},code=${location.code.trim()},address=${location.address.trim()},is_active=${location.isActive} WHERE id=${location.id} AND enterprise_id=${payload.id}`;
        else await transaction`INSERT INTO delivery_locations(enterprise_id,name,code,address,is_active) VALUES(${payload.id},${location.name.trim()},${location.code.trim()},${location.address.trim()},${location.isActive})`;
      }
      await transaction`UPDATE enterprises SET name=${payload.name.trim()},poc_name=${payload.pocName.trim()},poc_phone=${payload.pocPhone.trim()},poc_email=${payload.pocEmail.trim()},status=${payload.status},updated_at=NOW() WHERE id=${payload.id}`;
      return { enterpriseId: payload.id, locations: payload.locations.length };
    });
    log("enterprise.updated", { requestId, actorUserId: session.userId, ...result });
    return NextResponse.json({ ...result, requestId });
  } catch (error) {
    logError("enterprise.update_failed", error, { requestId, actorUserId: session.userId });
    if (isUniqueViolation(error)) return NextResponse.json({ error: "ENTERPRISE_DETAILS_IN_USE", requestId }, { status: 409 });
    const code = error instanceof Error ? error.message : "ENTERPRISE_UPDATE_FAILED";
    const status = code === "ENTERPRISE_NOT_FOUND" ? 404 : code === "LOCATION_IN_USE" ? 409 : code === "INVALID_LOCATION" ? 400 : 500;
    return NextResponse.json({ error: code, requestId }, { status });
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

function enterpriseEditPayload(body: unknown): EnterpriseEditPayload | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (!Array.isArray(value.locations) || !value.locations.every((item) => item && typeof item === "object")) return null;
  const strings = [value.id,value.name,value.pocName,value.pocPhone,value.pocEmail,value.status];
  if (!strings.every((item) => typeof item === "string")) return null;
  const locations = value.locations.map((item) => item as Record<string, unknown>);
  if (!locations.every((item) => (item.id === undefined || typeof item.id === "string") && [item.name,item.code,item.address].every((field) => typeof field === "string") && typeof item.isActive === "boolean")) return null;
  return { id:value.id as string,name:value.name as string,pocName:value.pocName as string,pocPhone:value.pocPhone as string,pocEmail:value.pocEmail as string,status:value.status as string,locations:locations.map((item) => ({id:item.id as string|undefined,name:item.name as string,code:item.code as string,address:item.address as string,isActive:item.isActive as boolean})) };
}
