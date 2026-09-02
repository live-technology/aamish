import { redirect } from "next/navigation";
import { EnterpriseReviews, type EnterpriseReviewRow, type ReviewStats } from "@/components/enterprise-reviews";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

const REVIEW_PAGE_SIZE = 30;

export default async function EnterpriseReviewsPage() {
  const session = await currentSession(); if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role === "SUPER_ADMIN") redirect("/admin"); if (session.role === "EMPLOYEE") redirect("/employee"); if (!session.enterpriseId) redirect("/login");
  const enterpriseId = session.enterpriseId;
  const [enterpriseRows, stats, locationRows, reviews] = await Promise.all([
    db()<{ name: string }[]>`SELECT name FROM enterprises WHERE id=${enterpriseId}`,
    db()<ReviewStats[]>`
      SELECT COUNT(mr.id)::int AS count,AVG(mr.rating)::float AS average,
        COUNT(DISTINCT ms.schedule_date)::int AS meal_days,
        COUNT(mr.id) FILTER (WHERE mr.rating<=2)::int AS low_ratings
      FROM meal_reviews mr JOIN menu_schedules ms ON ms.id=mr.schedule_id
      JOIN employees ep ON ep.id=mr.employee_id AND ep.enterprise_id=${enterpriseId}
      WHERE ms.enterprise_id=${enterpriseId} AND ms.schedule_date>=CURRENT_DATE-30
    `,
    db()<{ name: string }[]>`SELECT DISTINCT dl.name FROM delivery_locations dl WHERE dl.enterprise_id=${enterpriseId} ORDER BY dl.name`,
    db()<EnterpriseReviewRow[]>`SELECT mr.id,mr.rating,mr.comment,mr.created_at::text,mr.voice_url,mr.voice_duration_seconds,ms.schedule_date::text,ep.full_name,dl.name AS location_name,COALESCE(m.title,'Scheduled meal') AS menu_title FROM meal_reviews mr JOIN menu_schedules ms ON ms.id=mr.schedule_id JOIN employees ep ON ep.id=mr.employee_id AND ep.enterprise_id=${enterpriseId} JOIN delivery_locations dl ON dl.id=ep.location_id LEFT JOIN meal_preferences mp ON mp.schedule_id=mr.schedule_id AND mp.employee_id=mr.employee_id LEFT JOIN menu_schedule_options mso ON mso.id=mp.selected_option_id LEFT JOIN menus m ON m.id=mso.menu_id WHERE ms.enterprise_id=${enterpriseId} AND ms.schedule_date>=CURRENT_DATE-30 ORDER BY ms.schedule_date DESC,mr.created_at DESC LIMIT ${REVIEW_PAGE_SIZE}`,
  ]);
  return (
    <EnterpriseReviews
      enterpriseName={enterpriseRows[0]?.name || "Enterprise"}
      fullName={session.fullName}
      stats={stats[0] || { count: 0, average: null, meal_days: 0, low_ratings: 0 }}
      locations={locationRows.map((row) => row.name)}
      initialReviews={[...reviews]}
      initialHasMore={reviews.length === REVIEW_PAGE_SIZE}
    />
  );
}
