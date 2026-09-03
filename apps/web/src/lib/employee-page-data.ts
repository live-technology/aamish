import { redirect } from "next/navigation";
import type { EmployeeSchedule } from "@/components/employee-portal";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export async function employeePageData() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role === "SUPER_ADMIN") redirect("/admin");
  if (session.role === "ENTERPRISE_ADMIN") redirect("/enterprise");
  if (!session.employeeId || !session.enterpriseId) redirect("/login");
  const [profile, schedules] = await Promise.all([
    db()<{ enterprise_name: string }[]>`SELECT name AS enterprise_name FROM enterprises WHERE id=${session.enterpriseId}`,
    db()<EmployeeSchedule[]>`
      SELECT ms.id,ms.schedule_date::text,ms.cutoff_time::text,ms.status,
        COALESCE(mp.is_opted_in,FALSE) AS is_opted_in,mp.selected_option_id,dl.name AS location_name,
        (mp.id IS NOT NULL AND mp.is_opted_in=TRUE AND ms.status<>'CANCELLED' AND ms.schedule_date <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date) AS can_review,
        mr.id AS review_id,mr.rating AS review_rating,mr.comment AS review_comment,mr.created_at::text AS review_created_at,
        mr.updated_at::text AS review_updated_at,mr.voice_public_id AS review_voice_public_id,mr.voice_url AS review_voice_url,
        mr.voice_duration_seconds AS review_voice_duration_seconds,
        COALESCE((SELECT json_agg(json_build_object('publicId',rp.cloudinary_public_id,'url',rp.image_url,'thumbnailUrl',COALESCE(rp.thumbnail_url,rp.image_url)) ORDER BY rp.created_at) FROM review_photos rp WHERE rp.review_id=mr.id),'[]') AS review_photos,
        COALESCE(json_agg(json_build_object('id',mso.id,'label',mso.option_label,'title',m.title,'description',m.description,'image_url',COALESCE(m.image_mobile_url,m.image_desktop_url)) ORDER BY mso.option_label) FILTER(WHERE mso.id IS NOT NULL),'[]') AS options
      FROM menu_schedules ms
      JOIN employees ep ON ep.id=${session.employeeId} AND ep.enterprise_id=${session.enterpriseId}
      JOIN delivery_locations dl ON dl.id=ep.location_id
      LEFT JOIN meal_preferences mp ON mp.schedule_id=ms.id AND mp.employee_id=ep.id
      LEFT JOIN meal_reviews mr ON mr.schedule_id=ms.id AND mr.employee_id=ep.id
      LEFT JOIN menu_schedule_options mso ON mso.schedule_id=ms.id LEFT JOIN menus m ON m.id=mso.menu_id
      WHERE ms.enterprise_id=${session.enterpriseId}
        AND (ms.schedule_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Dhaka')::date OR mp.id IS NOT NULL)
      GROUP BY ms.id,mp.id,dl.name,mr.id
      ORDER BY ms.schedule_date DESC
    `,
  ]);
  return { fullName: session.fullName, enterpriseName: profile[0]?.enterprise_name || "Enterprise", schedules: [...schedules] };
}
