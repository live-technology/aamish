import { FeedbackHeading } from "@/components/feedback-heading";
import { notFound } from "next/navigation";
import { GuestFeedbackForm } from "@/components/guest-feedback-form";
import { db } from "@/lib/db";
import { isRequestId } from "@/lib/meal-requests";
import styles from "@/components/guest-feedback.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Share your feedback | Aamish", robots: { index: false, follow: false } };

export default async function GuestFeedbackPage({ params }: { params: Promise<{ enterpriseId: string }> }) {
  const { enterpriseId } = await params;
  if (!isRequestId(enterpriseId)) notFound();
  const rows = await db()`SELECT name, logo_url FROM enterprises WHERE id = ${enterpriseId} AND status = 'ACTIVE'`;
  if (!rows.length) notFound();
  return <main id="main" className={styles.page}>
    <FeedbackHeading enterpriseName={rows[0].name} logoUrl={rows[0].logo_url} />
    <GuestFeedbackForm enterpriseId={enterpriseId} />
  </main>;
}
