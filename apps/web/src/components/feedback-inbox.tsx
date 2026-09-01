"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert, Lightbulb, MessageCircleQuestion, MessageSquareText, Mic, Search, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import styles from "./feedback-workspace.module.css";

export type FeedbackRow = {
  id: string; category: "BUG" | "IDEA" | "QUESTION" | "OTHER"; message: string | null;
  audio_url: string | null; audio_duration_seconds: number | null; page_path: string; status: string;
  submitter_role: string; submitter_name: string; username: string; enterprise_name: string | null;
  created_at: string; transcript: string | null; transcript_english: string | null;
  transcription_summary: string | null; transcription_confidence: string | null;
  transcription_model: string | null; transcribed_at: string | null; quality_category: string | null;
};

const icons = { BUG: TriangleAlert, IDEA: Lightbulb, QUESTION: MessageCircleQuestion, OTHER: MessageSquareText };
const statuses = ["NEW", "REVIEWED", "PLANNED", "CLOSED"];

export function filterFeedback(items: FeedbackRow[], category: string, status: string, search: string) {
  const query = search.trim().toLowerCase();
  return items.filter((item) => (category === "ALL" || item.category === category) && (status === "ALL" || item.status === status) && (!query || [item.message,item.transcript,item.transcript_english,item.transcription_summary,item.submitter_name,item.username,item.enterprise_name,item.page_path].filter(Boolean).join(" ").toLowerCase().includes(query)));
}

export function FeedbackInbox({ fullName, feedback }: { fullName: string; feedback: FeedbackRow[] }) {
  const [items, setItems] = useState(feedback);
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ id: string; message: string; requestId?: string } | null>(null);
  const [notice, setNotice] = useState("");
  const visible = useMemo(() => filterFeedback(items, category, status, search), [items, category, status, search]);
  const hasFilters = category !== "ALL" || status !== "ALL" || Boolean(search);

  async function changeStatus(id: string, nextStatus: string) {
    setSavingId(id); setFailure(null); setNotice("");
    try {
      const response = await fetch("/api/admin/feedback", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: nextStatus }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: data.error || "FEEDBACK_UPDATE_FAILED", requestId: data.requestId };
      setItems((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
      setNotice(`Feedback moved to ${nextStatus.toLowerCase()}.`);
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setFailure({ id, message: clientErrorMessage(error.code || "FEEDBACK_UPDATE_FAILED", "The feedback status could not be changed."), requestId: error.requestId });
    } finally { setSavingId(null); }
  }

  function reset() { setCategory("ALL"); setStatus("ALL"); setSearch(""); }

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/feedback" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Internal beta signals" title="Product feedback" description="Review platform bugs, ideas, questions, and voice notes without mixing them with confirmed food-quality incidents." actions={<Link className={styles.qualityLink} href="/admin/quality"><ShieldCheck size={17} aria-hidden="true" />Open food quality</Link>} />
    {notice && <div className={styles.notice}><Alert tone="success" title="Status updated">{notice}</Alert></div>}
    <section className={styles.summary} aria-label="Product feedback totals"><Summary value={items.length} label="Recent submissions" /><Summary value={items.filter((item) => item.status === "NEW").length} label="New to review" /><Summary value={items.filter((item) => item.category === "BUG").length} label="Product bugs" /><Summary value={items.filter((item) => item.audio_url).length} label="Voice notes" /></section>

    {items.length === 0 ? <EmptyState icon={<MessageSquareText size={25} aria-hidden="true" />} title="No product feedback yet" description="Text and voice feedback submitted by internal testers will appear here." /> : <>
      <section className={styles.filters} aria-label="Product feedback filters"><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Search product feedback</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search text, transcript, person, or page" /></label><label><span>Type</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">All types</option>{Object.keys(icons).map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>{hasFilters && <Button type="button" variant="quiet" size="small" onClick={reset}><X size={14} aria-hidden="true" />Reset</Button>}</section>
      <div className={styles.resultHeading}><h2>{visible.length} {visible.length === 1 ? "submission" : "submissions"}</h2><span>Original content remains unchanged</span></div>
      {visible.length === 0 ? <EmptyState title="No feedback matches" description="Change the type, status, or search to see other submissions." action={<Button type="button" variant="secondary" onClick={reset}>Reset filters</Button>} /> : <section className={styles.list} aria-label="Product feedback inbox">{visible.map((item) => <FeedbackCard item={item} saving={savingId === item.id} failure={failure?.id === item.id ? failure : null} changeStatus={changeStatus} key={item.id} />)}</section>}
    </>}
  </AppShell>;
}

function FeedbackCard({ item, saving, failure, changeStatus }: { item: FeedbackRow; saving: boolean; failure: { message: string; requestId?: string } | null; changeStatus: (id: string, status: string) => Promise<void> }) {
  const Icon = icons[item.category];
  return <article className={styles.card}><header><div className={styles.kind}><Icon size={15} aria-hidden="true" /><span>{item.category}</span></div><StatusBadge tone={item.status === "NEW" ? "warning" : item.status === "CLOSED" ? "success" : "neutral"}>{item.status}</StatusBadge></header><div className={styles.identity}><div><strong>{item.submitter_name}</strong><span>{item.enterprise_name || "Aamish"} · {item.submitter_role.replaceAll("_", " ").toLowerCase()} · @{item.username}</span></div><time>{formatTimestamp(item.created_at)}</time></div>{item.message && <p className={styles.message}>{item.message}</p>}{item.audio_url && <div className={styles.audio}><Mic size={16} aria-hidden="true" /><audio controls preload="none" src={item.audio_url} /><span>{item.audio_duration_seconds ?? 0}s</span></div>}{item.audio_url && !item.transcript && <Alert tone="info" title="Transcription pending">The original voice note is available while its transcript is being prepared.</Alert>}{item.transcript && <section className={styles.transcript}><header><strong>Voice transcript</strong>{item.transcription_confidence && <span>{item.transcription_confidence} confidence</span>}</header><p>{item.transcript}</p>{item.transcript_english && item.transcript_english !== item.transcript && <><strong>English translation</strong><p>{item.transcript_english}</p></>}{item.transcription_summary && <small>{item.transcription_summary}</small>}</section>}{item.quality_category && <div className={styles.qualityFlag}><ShieldCheck size={15} aria-hidden="true" /><span>Also classified for food quality · {item.quality_category.replaceAll("_", " ").toLowerCase()}</span><Link href="/admin/quality">Open quality <ArrowRight size={14} /></Link></div>}{failure && <Alert tone="danger" title="Status was not updated">{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}<footer><div><code>{item.page_path}</code>{item.category === "BUG" && !item.quality_category && <span><CircleAlert size={13} />Product bug · not a confirmed food issue</span>}</div><label><span className="sr-only">Status for feedback from {item.submitter_name}</span><select aria-label={`Status for feedback from ${item.submitter_name}`} value={item.status} disabled={saving} onChange={(event) => void changeStatus(item.id, event.target.value)}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label></footer></article>;
}

function Summary({ value, label }: { value: number; label: string }) { return <article><strong>{value}</strong><span>{label}</span></article>; }
function formatTimestamp(value: string) { return new Date(value).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }); }
