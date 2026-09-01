import { redirect } from "next/navigation";
import { MenuCalendar } from "@/components/menu-calendar";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import type { MenuPackage } from "@/components/package-manager";

export default async function CalendarPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect("/");
  const enterprises = await db()< { id: string; name: string }[]>`SELECT id, name FROM enterprises WHERE status = 'ACTIVE' ORDER BY name`;
  const menus = await db()<MenuPackage[]>`SELECT id, title, description, category, price::float, status, image_mobile_url FROM menus WHERE status = 'ACTIVE' ORDER BY title`;
  const schedules = await db()< { id: string; schedule_date: string; cutoff_time: string; status: string; enterprise_name: string; options: { label: string; title: string }[] }[]>`
    SELECT ms.id, ms.schedule_date::text, ms.cutoff_time::text, ms.status, e.name AS enterprise_name,
      COALESCE(json_agg(json_build_object('label', mso.option_label, 'title', m.title) ORDER BY mso.option_label) FILTER (WHERE mso.id IS NOT NULL), '[]') AS options
    FROM menu_schedules ms JOIN enterprises e ON e.id = ms.enterprise_id
    LEFT JOIN menu_schedule_options mso ON mso.schedule_id = ms.id LEFT JOIN menus m ON m.id = mso.menu_id
    GROUP BY ms.id, e.name ORDER BY ms.schedule_date DESC
  `;
  return <MenuCalendar enterprises={[...enterprises]} menus={[...menus]} initialSchedules={[...schedules]} />;
}
