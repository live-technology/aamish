import { redirect } from "next/navigation";
import { FeedbackInbox, type FeedbackRow } from "@/components/feedback-inbox";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH } from "@/lib/auth-navigation";
import { db } from "@/lib/db";

export default async function FeedbackPage() {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(session.role === "ENTERPRISE_ADMIN" ? "/enterprise" : "/employee");
  const feedback = await db()<FeedbackRow[]>`
    SELECT pf.id,pf.category,pf.message,pf.audio_url,pf.audio_duration_seconds,
      pf.page_path,pf.status,pf.submitter_role,pf.created_at::text,
      pf.transcript,pf.transcript_english,pf.transcription_summary,
      pf.transcription_confidence,pf.transcription_model,pf.transcribed_at::text,
      pf.quality_category,COALESCE(au.full_name,'Deleted user') AS submitter_name,
      COALESCE(au.username,'unknown') AS username,e.name AS enterprise_name
    FROM platform_feedback pf LEFT JOIN app_users au ON au.id=pf.submitted_by_user_id
    LEFT JOIN enterprises e ON e.id=pf.enterprise_id
    WHERE pf.meal_schedule_id IS NULL
    ORDER BY pf.created_at DESC LIMIT 100
  `;
  return <FeedbackInbox fullName={session.fullName} feedback={[...feedback]} />;
}
