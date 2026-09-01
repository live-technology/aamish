import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import { EnterprisePortal, type Employee, type EnterpriseOrder, type EnterpriseReview } from "@/components/enterprise-portal";

export default async function EnterprisePage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "ENTERPRISE_ADMIN" || !session.enterpriseId) redirect("/");
  const enterpriseId = session.enterpriseId;
  const [enterpriseRows, locations, employees, orders, reviews] = await Promise.all([
    db()<{ name: string }[]>`SELECT name FROM enterprises WHERE id=${enterpriseId}`,
    db()<{ id: string; name: string; code: string }[]>`SELECT id,name,code FROM delivery_locations WHERE enterprise_id=${enterpriseId} AND is_active=TRUE ORDER BY name`,
    db()<Employee[]>`SELECT ep.id,ep.employee_code,ep.full_name,ep.email,ep.is_active,dl.name AS location_name,au.username FROM employees ep JOIN delivery_locations dl ON dl.id=ep.location_id LEFT JOIN app_users au ON au.employee_id=ep.id WHERE ep.enterprise_id=${enterpriseId} ORDER BY ep.created_at DESC`,
    db()<EnterpriseOrder[]>`
      SELECT ms.id AS schedule_id, ms.schedule_date::text, ms.cutoff_time::text, ms.status,
        dl.name AS location_name, mso.option_label, m.title AS menu_title,
        COUNT(mp.id)::int AS order_count
      FROM menu_schedules ms
      JOIN menu_schedule_options mso ON mso.schedule_id=ms.id
      JOIN menus m ON m.id=mso.menu_id
      CROSS JOIN delivery_locations dl
      LEFT JOIN meal_preferences mp ON mp.schedule_id=ms.id AND mp.selected_option_id=mso.id
        AND mp.location_id=dl.id AND mp.is_opted_in=TRUE
      WHERE ms.enterprise_id=${enterpriseId} AND dl.enterprise_id=${enterpriseId} AND dl.is_active=TRUE
        AND ms.schedule_date BETWEEN CURRENT_DATE AND CURRENT_DATE+14
      GROUP BY ms.id,ms.schedule_date,ms.cutoff_time,ms.status,dl.id,dl.name,mso.option_label,m.title
      ORDER BY ms.schedule_date,dl.name,mso.option_label`,
    db()<EnterpriseReview[]>`
      SELECT mr.id,mr.rating,mr.comment,mr.created_at::text,ms.schedule_date::text,
        ep.full_name,dl.name AS location_name,COALESCE(m.title,'Scheduled meal') AS menu_title
      FROM meal_reviews mr
      JOIN menu_schedules ms ON ms.id=mr.schedule_id
      JOIN employees ep ON ep.id=mr.employee_id AND ep.enterprise_id=${enterpriseId}
      JOIN delivery_locations dl ON dl.id=ep.location_id
      LEFT JOIN meal_preferences mp ON mp.schedule_id=mr.schedule_id AND mp.employee_id=mr.employee_id
      LEFT JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id
      LEFT JOIN menus m ON m.id=mso.menu_id
      WHERE ms.enterprise_id=${enterpriseId} AND ms.schedule_date>=CURRENT_DATE-30
      ORDER BY ms.schedule_date DESC,mr.created_at DESC`,
  ]);
  return <EnterprisePortal enterpriseName={enterpriseRows[0].name} fullName={session.fullName} locations={[...locations]} initialEmployees={[...employees]} orders={[...orders]} reviews={[...reviews]}/>;
}
