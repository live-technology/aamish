import { redirect } from "next/navigation";
import { QualityCenter } from "@/components/quality-center";
import type { QualityIssue } from "@/components/quality-dashboard";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import { qualityFiltersFrom } from "@/lib/quality-insights";
import { loadQualityInsights } from "@/lib/quality-insights-query";

export default async function QualityPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; enterprise?: string; location?: string; menu?: string; rating?: string }> }) {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const filters = qualityFiltersFrom(await searchParams, today);
  const [initialInsights, issues] = await Promise.all([
    loadQualityInsights(filters, null),
    db()<QualityIssue[]>`
      SELECT pf.id,pf.message,pf.transcript,pf.transcript_english,pf.created_at::text,
        pf.meal_service_date::text,pf.quality_category,pf.quality_severity,
        pf.quality_status,pf.quality_classification_source,
        (pf.meal_schedule_id IS NOT NULL) AS is_employee_meal_report,
        COALESCE(e.name,'Aamish') AS enterprise_name,dl.name AS location_name
      FROM platform_feedback pf LEFT JOIN enterprises e ON e.id=pf.enterprise_id
      LEFT JOIN app_users au ON au.id=pf.submitted_by_user_id LEFT JOIN employees ep ON ep.id=au.employee_id
      LEFT JOIN meal_preferences mp ON mp.schedule_id=pf.meal_schedule_id AND mp.employee_id=au.employee_id
      LEFT JOIN delivery_locations dl ON dl.id=COALESCE(mp.location_id,ep.location_id)
      WHERE pf.category='BUG' AND (pf.meal_schedule_id IS NOT NULL OR pf.quality_category IS NOT NULL)
      ORDER BY (pf.quality_category IS NULL),COALESCE(pf.meal_service_date,pf.created_at::date) DESC,pf.created_at DESC
      LIMIT 100
    `,
  ]);

  return <QualityCenter fullName={session.fullName} initialInsights={initialInsights} initialIssues={[...issues]} />;
}
