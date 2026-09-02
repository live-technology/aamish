"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, MessageSquareText, Mic, Search, ShieldAlert, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import { dailyCsat } from "@/lib/csat";
import { QUALITY_CATEGORIES, QUALITY_SEVERITIES, QUALITY_STATUSES, suggestQualityClassification } from "@/lib/quality-triage";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import styles from "./quality-workspace.module.css";

export type ReviewRow = { id: string; rating: number; comment: string | null; full_name: string; enterprise_name: string; menu_title: string; created_at: string; schedule_date: string; photo_count: number; voice_url: string | null; voice_duration_seconds: number | null };
export type QualityIssue = { id: string; message: string | null; transcript: string | null; transcript_english: string | null; created_at: string; meal_service_date: string | null; quality_category: string | null; quality_severity: string | null; quality_status: string; quality_classification_source: string | null; enterprise_name: string; location_name: string | null };
type Failure = { id: string; message: string; requestId?: string };

export function filterQualityIssues(issues: QualityIssue[], classification: string, status: string, severity: string, search: string) {
  const query = search.trim().toLowerCase();
  return issues.filter((issue) => {
    const confirmed = Boolean(issue.quality_category);
    if (classification === "CONFIRMED" && !confirmed) return false;
    if (classification === "UNCLASSIFIED" && confirmed) return false;
    if (status !== "ALL" && issue.quality_status !== status) return false;
    if (severity !== "ALL" && issue.quality_severity !== severity) return false;
    return !query || [issue.message,issue.transcript,issue.transcript_english,issue.enterprise_name,issue.location_name,issue.quality_category].filter(Boolean).join(" ").toLowerCase().includes(query);
  });
}

export function QualityDashboard({ fullName, reviews, initialIssues }: { fullName: string; reviews: ReviewRow[]; initialIssues: QualityIssue[] }) {
  const average = reviews.length ? reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length : 0;
  const days = dailyCsat(reviews);
  const [view, setView] = useState<"ISSUES" | "REVIEWS">("ISSUES");
  const [selectedDate, setSelectedDate] = useState(days.at(-1)?.date || "");
  const [issues, setIssues] = useState(initialIssues);
  const [classification, setClassification] = useState("CONFIRMED");
  const [status, setStatus] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [notice, setNotice] = useState("");
  const visibleIssues = useMemo(() => filterQualityIssues(issues, classification, status, severity, search), [issues, classification, status, severity, search]);
  const visibleReviews = selectedDate ? reviews.filter((review) => review.schedule_date === selectedDate) : reviews;
  const confirmedIssues = issues.filter((issue) => issue.quality_category);
  const openIssues = confirmedIssues.filter((issue) => !["RESOLVED", "DISMISSED"].includes(issue.quality_status));
  const unclassified = issues.filter((issue) => !issue.quality_category);

  async function saveIssue(issue: QualityIssue, form: HTMLFormElement) {
    const data = new FormData(form);
    const payload = { id: issue.id, category: data.get("category"), severity: data.get("severity"), status: data.get("status"), mealServiceDate: data.get("mealServiceDate") };
    setSavingId(issue.id); setFailure(null); setNotice("");
    try {
      const response = await fetch("/api/admin/quality", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: result.error || "QUALITY_UPDATE_FAILED", requestId: result.requestId };
      setIssues((current) => current.map((item) => item.id === issue.id ? { ...item, quality_category: String(payload.category), quality_severity: String(payload.severity), quality_status: String(payload.status), meal_service_date: String(payload.mealServiceDate) || null, quality_classification_source: "HUMAN" } : item));
      setNotice("Food-quality triage was saved with a human-confirmed classification.");
      setClassification("CONFIRMED");
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setFailure({ id: issue.id, message: clientErrorMessage(error.code || "QUALITY_UPDATE_FAILED", "The quality triage could not be saved."), requestId: error.requestId });
    } finally { setSavingId(null); }
  }

  function resetIssueFilters() { setClassification("CONFIRMED"); setStatus("ALL"); setSeverity("ALL"); setSearch(""); }

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/quality" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Food service signals" title="Quality" description="Track confirmed food-quality incidents and employee satisfaction without turning platform bugs into food issues automatically." actions={<Link className={styles.feedbackLink} href="/admin/feedback"><MessageSquareText size={17} aria-hidden="true" />Product feedback</Link>} />
    {notice && <div className={styles.notice}><Alert tone="success" title="Triage saved">{notice}</Alert></div>}
    <section className={styles.summary} aria-label="Quality totals"><Summary value={reviews.length ? average.toFixed(1) : "—"} label="30-day CSAT" /><Summary value={reviews.length} label="Meal reviews" /><Summary value={openIssues.length} label="Open food issues" /><Summary value={unclassified.length} label="Product bugs to classify" /></section>
    <div className={styles.viewTabs} role="group" aria-label="Quality view"><button type="button" className={view === "ISSUES" ? styles.activeView : ""} onClick={() => setView("ISSUES")}><ShieldAlert size={16} />Food issues <span>{confirmedIssues.length}</span></button><button type="button" className={view === "REVIEWS" ? styles.activeView : ""} onClick={() => setView("REVIEWS")}><BarChart3 size={16} />CSAT reviews <span>{reviews.length}</span></button></div>

    {view === "ISSUES" ? <section><div className={styles.sectionHeading}><div><p>Food issue timeline</p><h2>Human-reviewed quality triage</h2></div><span>Original reports remain immutable</span></div><section className={styles.filters} aria-label="Quality issue filters"><label className={styles.search}><Search size={16} /><span className="sr-only">Search quality reports</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search report, organization, or location" /></label><label><span>Classification</span><select value={classification} onChange={(event) => setClassification(event.target.value)}><option value="CONFIRMED">Confirmed food issues</option><option value="UNCLASSIFIED">Needs classification</option><option value="ALL">All reported bugs</option></select></label><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option>{QUALITY_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="ALL">All severities</option>{QUALITY_SEVERITIES.map((value) => <option key={value}>{value}</option>)}</select></label>{(classification !== "CONFIRMED" || status !== "ALL" || severity !== "ALL" || search) && <Button type="button" variant="quiet" size="small" onClick={resetIssueFilters}><X size={14} />Reset</Button>}</section>{classification === "UNCLASSIFIED" && <Alert tone="warning" title="Classification required">These are product bug reports, not confirmed food incidents. Review the original content before saving a food category and severity.</Alert>}<div className={styles.issueCount}>{visibleIssues.length} {visibleIssues.length === 1 ? "report" : "reports"}</div>{visibleIssues.length === 0 ? <EmptyState icon={<ShieldAlert size={24} />} title="No quality reports match" description={classification === "CONFIRMED" ? "Confirmed food incidents will appear here after human classification." : "Change the filters to inspect other reports."} action={<Button type="button" variant="secondary" onClick={resetIssueFilters}>Reset filters</Button>} /> : <section className={styles.issueList}>{visibleIssues.map((issue) => <QualityIssueCard issue={issue} saving={savingId === issue.id} failure={failure?.id === issue.id ? failure : null} saveIssue={saveIssue} key={issue.id} />)}</section>}</section> : <ReviewsPanel reviews={reviews} days={days} selectedDate={selectedDate} setSelectedDate={setSelectedDate} visibleReviews={visibleReviews} />}
  </AppShell>;
}

function QualityIssueCard({ issue, saving, failure, saveIssue }: { issue: QualityIssue; saving: boolean; failure: Failure | null; saveIssue: (issue: QualityIssue, form: HTMLFormElement) => Promise<void> }) {
  const suggestion = suggestQualityClassification([issue.message,issue.transcript_english,issue.transcript].filter(Boolean).join(" "));
  const confirmed = Boolean(issue.quality_category);
  return <form className={styles.issue} onSubmit={(event) => { event.preventDefault(); void saveIssue(issue, event.currentTarget); }}><header><div><span className={styles.issueIcon}><ShieldAlert size={17} /></span><div><strong>{issue.enterprise_name}{issue.location_name ? ` · ${issue.location_name}` : ""}</strong><small>Submitted {formatTimestamp(issue.created_at)}</small></div></div><div>{confirmed ? <StatusBadge tone="success">HUMAN CLASSIFIED</StatusBadge> : <StatusBadge tone="warning">UNCLASSIFIED BUG</StatusBadge>}<StatusBadge tone={issue.quality_severity === "CRITICAL" || issue.quality_severity === "HIGH" ? "dangerTone" : "neutral"}>{issue.quality_severity || suggestion.severity}</StatusBadge></div></header><div className={styles.original}><small>Original report</small>{issue.message && <p>{issue.message}</p>}{issue.transcript && <blockquote><strong>Voice transcript</strong><span>{issue.transcript}</span></blockquote>}</div><Alert tone="info" title={confirmed ? "Stored classification" : "Reviewable suggestion"}>{confirmed ? `${label(issue.quality_category!)} · ${issue.quality_severity?.toLowerCase()} severity · ${issue.quality_classification_source?.toLowerCase() || "human"}` : `${label(suggestion.category)} · ${suggestion.severity.toLowerCase()} severity. Nothing is classified until you save.`}</Alert><div className={styles.triageFields}><label><span>Category</span><select name="category" defaultValue={issue.quality_category || suggestion.category}>{QUALITY_CATEGORIES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label><label><span>Severity</span><select name="severity" defaultValue={issue.quality_severity || suggestion.severity}>{QUALITY_SEVERITIES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Status</span><select name="status" defaultValue={issue.quality_status}>{QUALITY_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Meal service date</span><input type="date" name="mealServiceDate" defaultValue={issue.meal_service_date || ""} /></label></div>{failure && <Alert tone="danger" title="Triage was not saved">{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}<footer><span>{issue.meal_service_date ? `Meal served ${formatDate(issue.meal_service_date)}` : "Meal service date not provided"}</span><Button type="submit" size="small" loading={saving} loadingLabel="Saving triage…">Save triage</Button></footer></form>;
}

function ReviewsPanel({ reviews, days, selectedDate, setSelectedDate, visibleReviews }: { reviews: ReviewRow[]; days: ReturnType<typeof dailyCsat>; selectedDate: string; setSelectedDate: (date: string) => void; visibleReviews: ReviewRow[] }) {
  if (!reviews.length) return <EmptyState icon={<Star size={24} />} title="No meal reviews yet" description="Submitted employee ratings and comments will appear here." />;
  return <section><div className={styles.sectionHeading}><div><p>30-day satisfaction</p><h2>Daily CSAT</h2></div><span>Select a day to inspect its reviews</span></div><section className={styles.trend} aria-label="Daily CSAT trend">{days.map((day) => <button type="button" className={selectedDate === day.date ? styles.selectedDay : ""} key={day.date} onClick={() => setSelectedDate(day.date)} aria-label={`${formatDate(day.date)}: ${day.average.toFixed(1)} from ${day.count} reviews`}><span><i style={{ height: `${Math.max(12, day.average / 5 * 100)}%` }} /></span><b>{day.average.toFixed(1)}</b><small>{new Date(`${day.date}T00:00:00`).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}</small></button>)}</section><div className={styles.dayHeading}><div><CalendarDays size={17} /><h3>{formatDate(selectedDate)}</h3></div><span>{visibleReviews.length} {visibleReviews.length === 1 ? "review" : "reviews"}</span></div><section className={styles.reviewList}>{visibleReviews.map((review) => <article className={review.rating <= 3 ? styles.flaggedReview : ""} key={review.id}><header><div><strong>{review.full_name}</strong><span>{review.enterprise_name} · {review.menu_title}</span></div><b>{review.rating}<Star size={13} fill="currentColor" /></b></header><p>{review.comment || "No written comment."}</p>{review.voice_url&&<div className={styles.reviewVoice}><Mic size={15}/><audio controls preload="none" src={review.voice_url}/><span>{review.voice_duration_seconds}s</span></div>}<footer><span>{review.photo_count} {review.photo_count === 1 ? "photo" : "photos"}</span><time>Submitted {formatTimestamp(review.created_at)}</time></footer></article>)}</section></section>;
}

function Summary({ value, label: text }: { value: string | number; label: string }) { return <article><strong>{value}</strong><span>{text}</span></article>; }
function label(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/^./, (character) => character.toUpperCase()); }
function formatTimestamp(value: string) { return new Date(value).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }); }
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", { weekday: "short", day: "numeric", month: "long", year: "numeric" }); }
