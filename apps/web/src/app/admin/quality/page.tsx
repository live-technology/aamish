import { redirect } from "next/navigation";
import { QualityDashboard, type QualityIssue, type ReviewRow } from "@/components/quality-dashboard";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export default async function QualityPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");
  const [reviews, issues] = await Promise.all([
    db()<ReviewRow[]>`
      SELECT mr.id,mr.rating,mr.comment,ep.full_name,e.name AS enterprise_name,
        COALESCE(m.title,'Scheduled meal') AS menu_title,mr.created_at::text,
        ms.schedule_date::text,COUNT(rp.id)::int AS photo_count
      FROM meal_reviews mr JOIN menu_schedules ms ON ms.id=mr.schedule_id
      JOIN employees ep ON ep.id=mr.employee_id JOIN enterprises e ON e.id=ep.enterprise_id
      LEFT JOIN meal_preferences mp ON mp.schedule_id=mr.schedule_id AND mp.employee_id=mr.employee_id
      LEFT JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id LEFT JOIN menus m ON m.id=mso.menu_id
      LEFT JOIN review_photos rp ON rp.review_id=mr.id
      WHERE ms.schedule_date>=CURRENT_DATE-45
      GROUP BY mr.id,ms.schedule_date,ep.full_name,e.name,m.title
      ORDER BY ms.schedule_date DESC,mr.created_at DESC
    `,
    db()<QualityIssue[]>`
      SELECT pf.id,pf.message,pf.transcript,pf.transcript_english,pf.created_at::text,
        pf.meal_service_date::text,pf.quality_category,pf.quality_severity,
        pf.quality_status,pf.quality_classification_source,
        COALESCE(e.name,'Aamish') AS enterprise_name,dl.name AS location_name
      FROM platform_feedback pf LEFT JOIN enterprises e ON e.id=pf.enterprise_id
      LEFT JOIN app_users au ON au.id=pf.submitted_by_user_id LEFT JOIN employees ep ON ep.id=au.employee_id
      LEFT JOIN delivery_locations dl ON dl.id=ep.location_id
      WHERE pf.category='BUG'
      ORDER BY (pf.quality_category IS NULL),COALESCE(pf.meal_service_date,pf.created_at::date) DESC,pf.created_at DESC
      LIMIT 100
    `,
  ]);
  return <QualityDashboard fullName={session.fullName} reviews={[...reviews]} initialIssues={[...issues]} />;
}
