import Link from "next/link";
import { redirect } from "next/navigation";
import { currentSession } from "@/lib/auth";
import { SESSION_ENDED_LOGIN_PATH, destinationForRole } from "@/lib/auth-navigation";
import { db } from "@/lib/db";
import { guestFeedbackScope } from "@/lib/guest-feedback";
import { isRequestId } from "@/lib/meal-requests";
import { log } from "@/lib/logger";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import { enterpriseNavigation } from "@/lib/enterprise-navigation";
import { AppShell } from "@/components/ui/app-shell";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/primitives";
import { GuestFeedbackTools, RefreshGuestFeedback } from "./guest-feedback-link";
import styles from "./guest-feedback.module.css";

type Row = { id: string; enterprise_id: string; enterprise_name: string; rating: number; review: string | null; anonymous: boolean; name: string | null; phone: string | null; created_at: string; has_audio: boolean };
export type GuestFeedbackParams = Promise<{ page?: string; enterprise?: string }>;

export async function GuestFeedbackInbox({ searchParams, workspace }: { searchParams: GuestFeedbackParams; workspace: "admin" | "enterprise" }) {
  const session = await currentSession();
  if (!session) redirect(SESSION_ENDED_LOGIN_PATH);
  const scope = guestFeedbackScope(session);
  if (!scope || (workspace === "admin") !== (session.role === "SUPER_ADMIN")) redirect(destinationForRole(session.role));
  const params = await searchParams;
  const page = typeof params.page === "string" && /^\d{1,6}$/.test(params.page) ? Math.max(1, Number(params.page)) : 1;
  // An enterprise administrator's scope always comes from their verified session.
  const enterpriseId = scope.enterpriseId || (isRequestId(params.enterprise) ? params.enterprise : null);
  const path = `/${workspace}/guest-feedback`;
  let rows: Row[] = [];
  let enterprises: { id: string; name: string; status: string }[] = [];
  let failureId: string | undefined;
  try {
    [rows, enterprises] = await Promise.all([
      db()<Row[]>`SELECT f.id, f.enterprise_id, e.name AS enterprise_name, f.rating, f.review, f.anonymous, f.name, f.phone, f.created_at::text,
        (f.audio_public_id IS NOT NULL) AS has_audio FROM guest_feedback f JOIN enterprises e ON e.id = f.enterprise_id
        WHERE (${enterpriseId}::uuid IS NULL OR f.enterprise_id = ${enterpriseId}::uuid)
        ORDER BY f.created_at DESC, f.id DESC LIMIT 26 OFFSET ${(page - 1) * 25}`,
      db()< { id: string; name: string; status: string }[]>`SELECT id, name, status FROM enterprises WHERE (${scope.enterpriseId}::uuid IS NULL OR id = ${scope.enterpriseId}::uuid) ORDER BY name`,
    ]);
  } catch {
    failureId = crypto.randomUUID();
    log("guest_feedback.inbox_failed", { requestId: failureId });
  }
  const pageUrl = (value: number) => `${path}?${new URLSearchParams({ page: String(value), ...(enterpriseId ? { enterprise: enterpriseId } : {}) })}`;
  return <AppShell workspace={workspace === "admin" ? "Aamish admin" : enterprises[0]?.name || "Enterprise"} fullName={session.fullName} roleLabel={workspace === "admin" ? "Aamish administrator" : "Enterprise administrator"} currentPath={path} navigation={workspace === "admin" ? superAdminNavigation : enterpriseNavigation}>
    <PageHeader title="Guest feedback" description="Ratings and reviews from your enterprise feedback links." actions={<RefreshGuestFeedback />} />
    {failureId ? <ErrorState title="Couldn’t load guest feedback" description="Please refresh to try again." requestId={failureId} /> : <>
      <GuestFeedbackTools enterprises={enterprises} selectedId={enterpriseId} canSelect={workspace === "admin"} />
      <div className={styles.inbox}>{rows.length ? rows.slice(0, 25).map(row => <article className={styles.reviewCard} key={row.id}>
        <header><div><h2>{row.enterprise_name}</h2><small>{new Date(row.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })} · Dhaka time</small></div><span className={styles.score} aria-label={`${row.rating} out of 5 stars`}>{"★".repeat(row.rating)}{"☆".repeat(5 - row.rating)} · {row.rating}/5</span></header>
        <p><strong>{row.anonymous ? "Anonymous" : row.name || "Guest"}</strong>{!row.anonymous && row.phone ? <> · <a href={`tel:${row.phone}`}>{row.phone}</a></> : null}</p>
        {row.review ? <p>{row.review}</p> : !row.has_audio ? <p>Rating only</p> : null}
        {row.has_audio && <audio controls preload="none" aria-label="Guest voice review" src={`/api/guest-feedback/${row.enterprise_id}/audio/${row.id}`} />}
      </article>) : <EmptyState title="No guest feedback yet" description="Share the enterprise feedback link or turn it into a QR code. Submitted ratings and reviews will appear here." />}</div>
      <nav className={styles.pagination} aria-label="Guest feedback pages">{page > 1 ? <Link href={pageUrl(page - 1)}>Previous</Link> : <span />}<span>Page {page}</span>{rows.length > 25 ? <Link href={pageUrl(page + 1)}>Next</Link> : <span />}</nav>
    </>}
  </AppShell>;
}
