import { redirect } from "next/navigation";
import { AdminOnboarding, type Enterprise } from "@/components/admin-onboarding";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<{ new?: string | string[] }> }) {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");

  const enterprises = await db()<Enterprise[]>`
    SELECT e.id, e.name, e.slug, e.status, e.poc_name, e.poc_email,
      COUNT(DISTINCT dl.id)::int AS location_count,
      COUNT(DISTINCT ea.id)::int AS admin_count
    FROM enterprises e
    LEFT JOIN delivery_locations dl ON dl.enterprise_id = e.id
    LEFT JOIN enterprise_admins ea ON ea.enterprise_id = e.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `;
  const params = await searchParams;
  return <AdminOnboarding fullName={session.fullName} initialEnterprises={[...enterprises]} startOpen={params.new === "enterprise"} />;
}
