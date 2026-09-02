import { redirect } from "next/navigation";
import { EnterprisePeople, type EnterpriseEmployee, type EnterpriseLocation } from "@/components/enterprise-people";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export default async function EnterprisePeoplePage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role === "SUPER_ADMIN") redirect("/admin");
  if (session.role === "EMPLOYEE") redirect("/employee");
  if (!session.enterpriseId) redirect("/login");
  const enterpriseId = session.enterpriseId;
  const [enterpriseRows, locations, employees] = await Promise.all([
    db()<{ name: string }[]>`SELECT name FROM enterprises WHERE id=${enterpriseId}`,
    db()<EnterpriseLocation[]>`SELECT id,name,code FROM delivery_locations WHERE enterprise_id=${enterpriseId} AND is_active=TRUE ORDER BY name`,
    db()<EnterpriseEmployee[]>`SELECT ep.id,ep.employee_code,ep.full_name,ep.email,ep.phone,ep.is_active,ep.location_id,dl.name AS location_name,au.username FROM employees ep JOIN delivery_locations dl ON dl.id=ep.location_id LEFT JOIN app_users au ON au.employee_id=ep.id WHERE ep.enterprise_id=${enterpriseId} ORDER BY ep.created_at DESC`,
  ]);
  return <EnterprisePeople enterpriseName={enterpriseRows[0]?.name || "Enterprise"} fullName={session.fullName} locations={[...locations]} initialEmployees={[...employees]} />;
}
