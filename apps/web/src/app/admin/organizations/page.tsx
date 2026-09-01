import { redirect } from "next/navigation";
import { AdminOnboarding } from "@/components/admin-onboarding";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import type { EditableEnterprise } from "@/lib/enterprise-edit";

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ new?: string | string[] }> }) {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");

  const enterprises = await db()<EditableEnterprise[]>`
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
  const params = await searchParams;
  return <AdminOnboarding fullName={session.fullName} initialEnterprises={[...enterprises]} startOpen={params.new === "enterprise"} />;
}
