import { redirect } from "next/navigation";
import { AdminOverview, type AdminOverviewMetrics, type RecentEnterprise } from "@/components/admin-overview";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import { readCutoffTime } from "@/lib/platform-cutoff";

export default async function AdminPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");
  const [metrics, recentEnterprises, cutoffRows] = await Promise.all([
    db()<AdminOverviewMetrics[]>`
      SELECT
        (SELECT COUNT(*)::int FROM enterprises WHERE status = 'ACTIVE') AS enterprise_count,
        (SELECT COUNT(*)::int FROM delivery_locations WHERE is_active = TRUE) AS location_count,
        (SELECT COUNT(*)::int FROM menus WHERE status = 'ACTIVE') AS active_menu_count,
        (SELECT COUNT(*)::int FROM menu_schedules WHERE status = 'PUBLISHED' AND schedule_date >= CURRENT_DATE) AS upcoming_service_count,
        (SELECT COUNT(mp.id)::int FROM meal_preferences mp JOIN menu_schedules ms ON ms.id = mp.schedule_id WHERE ms.schedule_date = CURRENT_DATE AND mp.is_opted_in = TRUE) AS meals_today,
        (SELECT COUNT(*)::int FROM platform_feedback WHERE category = 'BUG' AND quality_status NOT IN ('RESOLVED', 'DISMISSED')) AS open_quality_count,
        (SELECT COUNT(*)::int FROM platform_feedback WHERE status = 'NEW') AS new_feedback_count
    `,
    db()<RecentEnterprise[]>`
      SELECT e.id, e.name, e.status, e.created_at::text,
        COUNT(DISTINCT dl.id)::int AS location_count
      FROM enterprises e
      LEFT JOIN delivery_locations dl ON dl.enterprise_id = e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC
      LIMIT 4
    `,
    db()<{ local_time: string | null }[]>`SELECT value->>'local_time' AS local_time FROM platform_settings WHERE key='MEAL_CUTOFF'`,
  ]);

  return <AdminOverview fullName={session.fullName} metrics={metrics[0]} recentEnterprises={[...recentEnterprises]} initialCutoffTime={readCutoffTime(cutoffRows[0]?.local_time)} />;
}
