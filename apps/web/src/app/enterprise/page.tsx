import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { EnterprisePortal, type Employee } from "@/components/enterprise-portal";

export default async function EnterprisePage(){const session=await currentSession();if(!session)redirect("/login");if(session.role!=="ENTERPRISE_ADMIN"||!session.enterpriseId)redirect("/");const enterprise=(await db()< {name:string}[]>`SELECT name FROM enterprises WHERE id=${session.enterpriseId}`)[0];const locations=await db()< {id:string;name:string;code:string}[]>`SELECT id,name,code FROM delivery_locations WHERE enterprise_id=${session.enterpriseId} AND is_active=TRUE ORDER BY name`;const employees=await db()<Employee[]>`SELECT ep.id,ep.employee_code,ep.full_name,ep.email,ep.is_active,dl.name AS location_name,au.username FROM employees ep JOIN delivery_locations dl ON dl.id=ep.location_id LEFT JOIN app_users au ON au.employee_id=ep.id WHERE ep.enterprise_id=${session.enterpriseId} ORDER BY ep.created_at DESC`;return <EnterprisePortal enterpriseName={enterprise.name} fullName={session.fullName} locations={[...locations]} initialEmployees={[...employees]}/>}
