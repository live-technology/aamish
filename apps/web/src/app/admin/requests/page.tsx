import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH, destinationForRole } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import { AppShell } from "@/components/ui/app-shell";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/primitives";
import { MealRequestInbox, RefreshMealRequests, type MealRequestRow } from "@/components/meal-request-inbox";
import styles from "@/components/meal-request-inbox.module.css";

export default async function MealRequestsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  if (session.role !== "SUPER_ADMIN") redirect(destinationForRole(session.role));
  const params = await searchParams;
  const page = typeof params.page === "string" && /^\d{1,6}$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  let rows: MealRequestRow[] = [];
  let failureId: string | undefined;
  try {
    rows = [...await db()<MealRequestRow[]>`SELECT id, requirement, contact, contact_type, status, created_at::text,
      (audio_public_id IS NOT NULL) AS has_audio, audio_duration_seconds FROM meal_requests
      ORDER BY created_at DESC, id DESC LIMIT 26 OFFSET ${(page - 1) * 25}`];
  } catch {
    failureId = crypto.randomUUID();
    log("meal_request.inbox_failed", { requestId: failureId });
  }
  return <AppShell workspace="Aamish admin" fullName={session.fullName} roleLabel="Aamish administrator" currentPath="/admin/requests" navigation={superAdminNavigation}>
    <PageHeader eyebrow="CONVERSATIONS THAT BECOME MEALS" title="Meal requests" description="Read what people are planning, listen to their messages, and follow up." actions={<RefreshMealRequests />} />
    {failureId ? <ErrorState title="Couldn’t load meal requests" description="Please refresh to try again." requestId={failureId} /> : rows.length ? <MealRequestInbox rows={rows.slice(0, 25)} /> : <EmptyState icon={<Inbox size={27} />} title={page === 1 ? "The next gathering starts here" : "No more requests"} description={page === 1 ? "Enquiries from the landing page will appear here, with contact details and any voice message." : "Go back to see earlier pages of enquiries."} />}
    {!failureId && <nav className={styles.pagination} aria-label="Meal request pages">{page > 1 ? <Link href={`/admin/requests?page=${page - 1}`}>Previous</Link> : <span />}<span>Page {page}</span>{rows.length > 25 ? <Link href={`/admin/requests?page=${page + 1}`}>Next</Link> : <span />}</nav>}
  </AppShell>;
}
