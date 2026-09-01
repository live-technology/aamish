import { redirect } from "next/navigation";
import { MenuCalendar, type EnterpriseChoice, type Schedule } from "@/components/menu-calendar";
import type { MenuPackage } from "@/components/package-manager";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export default async function CalendarPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");
  const enterprises = await db()<EnterpriseChoice[]>`
    SELECT e.id, e.name, COUNT(em.id)::int AS active_employee_count
    FROM enterprises e LEFT JOIN employees em ON em.enterprise_id=e.id AND em.is_active=TRUE
    WHERE e.status='ACTIVE' GROUP BY e.id ORDER BY e.name
  `;
  const menus = await db()<MenuPackage[]>`SELECT id, title, description, category, price::float, status, image_mobile_url FROM menus WHERE status='ACTIVE' ORDER BY title`;
  const schedules = await db()<Schedule[]>`
    SELECT ms.id, ms.schedule_date::text, ms.cutoff_time::text, ms.status, e.name AS enterprise_name,
      COALESCE(json_agg(json_build_object('label',mso.option_label,'title',m.title) ORDER BY mso.option_label) FILTER (WHERE mso.id IS NOT NULL),'[]') AS options
    FROM menu_schedules ms JOIN enterprises e ON e.id=ms.enterprise_id
    LEFT JOIN menu_schedule_options mso ON mso.schedule_id=ms.id LEFT JOIN menus m ON m.id=mso.menu_id
    GROUP BY ms.id,e.name ORDER BY ms.schedule_date DESC
  `;
  return <MenuCalendar fullName={session.fullName} enterprises={[...enterprises]} menus={[...menus]} initialSchedules={[...schedules]} />;
}
