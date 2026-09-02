import { redirect } from "next/navigation";
import { MenuCalendar, type EnterpriseChoice } from "@/components/menu-calendar";
import type { MenuPackage } from "@/components/package-manager";
import { listAdminSchedules } from "@/lib/admin-schedules";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import { readCutoffTime } from "@/lib/platform-cutoff";
import { addDays } from "@/lib/service-planning";

export default async function CalendarPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const [enterprises, menus, schedules, cutoffRows] = await Promise.all([
    db()<EnterpriseChoice[]>`SELECT e.id, e.name, COUNT(em.id)::int AS active_employee_count FROM enterprises e LEFT JOIN employees em ON em.enterprise_id=e.id AND em.is_active=TRUE WHERE e.status='ACTIVE' GROUP BY e.id ORDER BY e.name`,
    db()<MenuPackage[]>`SELECT id, title, description, category, price::float, status, image_mobile_url FROM menus WHERE status='ACTIVE' ORDER BY title`,
    listAdminSchedules(today, addDays(today, 6)),
    db()<{ local_time: string | null }[]>`SELECT value->>'local_time' AS local_time FROM platform_settings WHERE key='MEAL_CUTOFF'`,
  ]);
  return <MenuCalendar fullName={session.fullName} enterprises={[...enterprises]} menus={[...menus]} initialSchedules={[...schedules]} platformCutoffTime={readCutoffTime(cutoffRows[0]?.local_time)} />;
}
