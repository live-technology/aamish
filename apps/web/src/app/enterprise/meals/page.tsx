import { redirect } from "next/navigation";
import { EnterpriseMeals, type EnterpriseMealRow } from "@/components/enterprise-meals";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export default async function EnterpriseMealsPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role === "SUPER_ADMIN") redirect("/admin");
  if (session.role === "EMPLOYEE") redirect("/employee");
  if (!session.enterpriseId) redirect("/login");
  const enterpriseId = session.enterpriseId;
  const [enterpriseRows, rows] = await Promise.all([
    db()<{ name: string }[]>`SELECT name FROM enterprises WHERE id=${enterpriseId}`,
    db()<EnterpriseMealRow[]>`
      SELECT ms.id AS schedule_id,ms.schedule_date::text,ms.cutoff_time::text,ms.status,
        dl.name AS location_name,mso.option_label,m.title AS menu_title,m.image_mobile_url AS image_url,COUNT(mp.id)::int AS order_count
      FROM menu_schedules ms
      JOIN menu_schedule_options mso ON mso.schedule_id=ms.id
      JOIN menus m ON m.id=mso.menu_id
      CROSS JOIN delivery_locations dl
      LEFT JOIN meal_preferences mp ON mp.schedule_id=ms.id AND mp.selected_option_id=mso.id
        AND mp.location_id=dl.id AND mp.is_opted_in=TRUE
      WHERE ms.enterprise_id=${enterpriseId} AND dl.enterprise_id=${enterpriseId} AND dl.is_active=TRUE
        AND ms.schedule_date BETWEEN CURRENT_DATE AND CURRENT_DATE+14
      GROUP BY ms.id,ms.schedule_date,ms.cutoff_time,ms.status,dl.id,dl.name,mso.option_label,m.title,m.image_mobile_url
      ORDER BY ms.schedule_date,dl.name,mso.option_label`,
  ]);
  return <EnterpriseMeals enterpriseName={enterpriseRows[0]?.name || "Enterprise"} fullName={session.fullName} rows={[...rows]} />;
}
