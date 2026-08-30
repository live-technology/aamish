import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE = "aamish_session";
const secret = process.env.SESSION_SECRET ?? "local-development-secret-change-before-deploy";

export type Session = {
  userId: string;
  username: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ENTERPRISE_ADMIN" | "EMPLOYEE";
  enterpriseId: string | null;
  employeeId: string | null;
};

function sign(value: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encode(session: Session) {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(value: string): Session | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session; } catch { return null; }
}

export async function currentSession() {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return value ? decode(value) : null;
}

export async function signIn(username: string, password: string): Promise<Session | null> {
  const rows = await db()<Session[]>`
    SELECT id AS "userId", username, full_name AS "fullName", role, enterprise_id AS "enterpriseId", employee_id AS "employeeId"
    FROM app_users
    WHERE username = ${username} AND is_active = TRUE
      AND password_hash = crypt(${password}, password_hash)
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function setSession(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(session), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
