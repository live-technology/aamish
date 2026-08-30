import { redirect } from "next/navigation";
import { FeedbackInbox, type FeedbackRow } from "@/components/feedback-inbox";
import { currentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function FeedbackPage() {
  const session = await currentSession();
  if (!session) redirect("/login");
  if (session.role !== "SUPER_ADMIN") redirect("/");
  const feedback = await db()<FeedbackRow[]>`
    SELECT pf.id, pf.category, pf.message, pf.audio_url, pf.audio_duration_seconds,
      pf.page_path, pf.status, pf.submitter_role, pf.created_at::text,
      COALESCE(au.full_name, 'Deleted user') AS submitter_name,
      COALESCE(au.username, 'unknown') AS username,
      e.name AS enterprise_name
    FROM platform_feedback pf
    LEFT JOIN app_users au ON au.id = pf.submitted_by_user_id
    LEFT JOIN enterprises e ON e.id = pf.enterprise_id
    ORDER BY pf.created_at DESC
    LIMIT 100
  `;
  return <FeedbackInbox feedback={[...feedback]}/>;
}
