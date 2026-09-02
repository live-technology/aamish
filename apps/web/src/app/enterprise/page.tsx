import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import { EnterpriseOverview, type EnterpriseOverviewMetrics, type EnterpriseUpcomingMeal } from "@/components/enterprise-overview";

export default async function EnterprisePage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role === "SUPER_ADMIN") redirect("/admin");
  if (session.role === "EMPLOYEE") redirect("/employee");
  if (!session.enterpriseId) redirect("/login");
  const enterpriseId = session.enterpriseId;
  const [enterpriseRows, metricsRows, upcomingMeals] = await Promise.all([
    db()<{ name: string }[]>`SELECT name FROM enterprises WHERE id=${enterpriseId}`,
    db()<EnterpriseOverviewMetrics[]>`
      SELECT
        (SELECT COUNT(*)::int FROM employees WHERE enterprise_id=${enterpriseId} AND is_active=TRUE) AS employee_count,
        (SELECT COUNT(*)::int FROM delivery_locations WHERE enterprise_id=${enterpriseId} AND is_active=TRUE) AS location_count,
        (SELECT COUNT(*)::int FROM meal_preferences mp JOIN menu_schedules ms ON ms.id=mp.schedule_id WHERE ms.enterprise_id=${enterpriseId} AND ms.schedule_date=CURRENT_DATE AND mp.is_opted_in=TRUE) AS today_orders,
        (SELECT COUNT(DISTINCT schedule_date)::int FROM menu_schedules WHERE enterprise_id=${enterpriseId} AND schedule_date BETWEEN CURRENT_DATE+1 AND CURRENT_DATE+14) AS upcoming_meal_days,
        (SELECT AVG(mr.rating)::float FROM meal_reviews mr JOIN menu_schedules ms ON ms.id=mr.schedule_id WHERE ms.enterprise_id=${enterpriseId} AND ms.schedule_date>=CURRENT_DATE-45) AS average_rating`,
    db()<EnterpriseUpcomingMeal[]>`
      SELECT ms.id AS schedule_id,ms.schedule_date::text,ms.status,COUNT(mp.id)::int AS order_count
      FROM menu_schedules ms
      LEFT JOIN meal_preferences mp ON mp.schedule_id=ms.id AND mp.is_opted_in=TRUE
      WHERE ms.enterprise_id=${enterpriseId} AND ms.schedule_date BETWEEN CURRENT_DATE AND CURRENT_DATE+14
      GROUP BY ms.id,ms.schedule_date,ms.status
      ORDER BY ms.schedule_date
      LIMIT 4`,
  ]);
  return <EnterpriseOverview enterpriseName={enterpriseRows[0]?.name || "Enterprise"} fullName={session.fullName} metrics={metricsRows[0]} upcomingMeals={[...upcomingMeals]} />;
}
