import { redirect } from "next/navigation";
import { OperationsDashboard, type OperationRow } from "@/components/operations-dashboard";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export default async function FulfillmentPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");
  const rows = await db()<OperationRow[]>`
    SELECT ms.id AS schedule_id, ms.schedule_date::text, ms.cutoff_time::text,
      e.name AS enterprise_name, dl.name AS location_name,
      mso.option_label, m.title AS menu_title, COUNT(mp.id)::int AS meal_count
    FROM menu_schedules ms JOIN enterprises e ON e.id=ms.enterprise_id
    JOIN meal_preferences mp ON mp.schedule_id=ms.id AND mp.is_opted_in=TRUE
    JOIN delivery_locations dl ON dl.id=mp.location_id
    JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id
    JOIN menus m ON m.id=mso.menu_id
    WHERE ms.schedule_date BETWEEN CURRENT_DATE-7 AND CURRENT_DATE+14
    GROUP BY ms.id,e.name,dl.name,mso.option_label,m.title
    ORDER BY ms.schedule_date,e.name,dl.name,mso.option_label
  `;
  return <OperationsDashboard fullName={session.fullName} initialRows={[...rows]} />;
}
