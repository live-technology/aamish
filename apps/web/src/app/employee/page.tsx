import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmployeePortal, type EmployeeSchedule } from "@/components/employee-portal";

export default async function EmployeePage(){const session=await currentSession();if(!session)redirect("/login");if(session.role!=="EMPLOYEE"||!session.employeeId||!session.enterpriseId)redirect("/");const profile=(await db()< {enterprise_name:string}[]>`SELECT e.name AS enterprise_name FROM enterprises e WHERE e.id=${session.enterpriseId}`)[0];const schedules=await db()<EmployeeSchedule[]>`
SELECT ms.id,ms.schedule_date::text,ms.cutoff_time::text,ms.status,COALESCE(mp.is_opted_in,TRUE) AS is_opted_in,mp.selected_option_id,dl.name AS location_name,
(mp.id IS NOT NULL AND mp.is_opted_in=TRUE AND ms.schedule_date BETWEEN CURRENT_DATE-7 AND CURRENT_DATE) AS can_review,
COALESCE(json_agg(json_build_object('id',mso.id,'label',mso.option_label,'title',m.title,'description',m.description,'image_url',m.image_mobile_url) ORDER BY mso.option_label) FILTER(WHERE mso.id IS NOT NULL),'[]') AS options
FROM menu_schedules ms JOIN employees ep ON ep.id=${session.employeeId} JOIN delivery_locations dl ON dl.id=ep.location_id LEFT JOIN meal_preferences mp ON mp.schedule_id=ms.id AND mp.employee_id=ep.id LEFT JOIN menu_schedule_options mso ON mso.schedule_id=ms.id LEFT JOIN menus m ON m.id=mso.menu_id WHERE ms.enterprise_id=${session.enterpriseId} AND ms.schedule_date BETWEEN CURRENT_DATE-7 AND CURRENT_DATE+14 GROUP BY ms.id,mp.id,dl.name ORDER BY (ms.schedule_date=CURRENT_DATE) DESC,ms.schedule_date ASC LIMIT 8`;
return <EmployeePortal fullName={session.fullName} enterpriseName={profile.enterprise_name} schedules={[...schedules]}/>}
