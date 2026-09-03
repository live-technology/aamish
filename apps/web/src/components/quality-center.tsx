"use client";

import Link from "next/link";
import { BarChart3, MessageSquareText, Search, ShieldAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MealQualityInsights } from "@/components/meal-quality-insights";
import { filterQualityIssues, type QualityIssue } from "@/components/quality-dashboard";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import type { QualityInsightData } from "@/lib/quality-insights";
import { QUALITY_CATEGORIES, QUALITY_SEVERITIES, QUALITY_STATUSES, suggestQualityClassification } from "@/lib/quality-triage";
import { superAdminNavigation } from "@/lib/super-admin-navigation";
import styles from "./quality-workspace.module.css";

type Failure = { id: string; message: string; requestId?: string };

export function QualityCenter({ fullName, initialInsights, initialIssues }: { fullName: string; initialInsights: QualityInsightData; initialIssues: QualityIssue[] }) {
  const [view, setView] = useState<"INSIGHTS" | "ISSUES">("INSIGHTS");
  const [issues, setIssues] = useState(initialIssues);
  const [classification, setClassification] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [notice, setNotice] = useState("");
  const visibleIssues = useMemo(() => filterQualityIssues(issues, classification, status, severity, search), [issues, classification, status, severity, search]);

  async function saveIssue(issue: QualityIssue, form: HTMLFormElement) {
    const data = new FormData(form);
    const payload = { id: issue.id, category: data.get("category"), severity: data.get("severity"), status: data.get("status"), mealServiceDate: data.get("mealServiceDate") };
    setSavingId(issue.id); setFailure(null); setNotice("");
    try {
      const response = await fetch("/api/admin/quality", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: result.error || "QUALITY_UPDATE_FAILED", requestId: result.requestId };
      setIssues((current) => current.map((item) => item.id === issue.id ? { ...item, quality_category: String(payload.category), quality_severity: String(payload.severity), quality_status: String(payload.status), meal_service_date: String(payload.mealServiceDate) || null, quality_classification_source: "HUMAN" } : item));
      setNotice("Food-quality triage was saved with a human-confirmed classification."); setClassification("ALL");
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setFailure({ id: issue.id, message: clientErrorMessage(error.code || "QUALITY_UPDATE_FAILED", "The quality triage could not be saved."), requestId: error.requestId });
    } finally { setSavingId(null); }
  }

  function resetIssueFilters() { setClassification("ALL"); setStatus("ALL"); setSeverity("ALL"); setSearch(""); }

  return <AppShell workspace="Aamish operations" fullName={fullName} roleLabel="Aamish administrator" currentPath="/admin/quality" navigation={superAdminNavigation}>
    <PageHeader eyebrow="Food service signals" title="Quality insights" description="See where meal satisfaction is improving, where it is declining, and which employee feedback needs action." actions={<Link className={styles.feedbackLink} href="/admin/feedback"><MessageSquareText size={17} aria-hidden="true" />Product feedback</Link>} />
    {notice && <div className={styles.notice}><Alert tone="success" title="Triage saved">{notice}</Alert></div>}
    <div className={styles.viewTabs} role="tablist" aria-label="Quality workspace"><button type="button" role="tab" aria-selected={view === "INSIGHTS"} className={view === "INSIGHTS" ? styles.activeView : ""} onClick={() => setView("INSIGHTS")}><BarChart3 size={16} />Meal insights <span>{initialInsights.summary.reviewCount}</span></button><button type="button" role="tab" aria-selected={view === "ISSUES"} className={view === "ISSUES" ? styles.activeView : ""} onClick={() => setView("ISSUES")}><ShieldAlert size={16} />Food incidents <span>{issues.length}</span></button></div>
    {view === "INSIGHTS" ? <MealQualityInsights initialData={initialInsights} role="SUPER_ADMIN" /> : <section><div className={styles.sectionHeading}><div><p>Food issue timeline</p><h2>Human-reviewed quality triage</h2></div><span>Original reports remain immutable</span></div><section className={styles.filters} aria-label="Quality issue filters"><label className={styles.search}><Search size={16} /><span className="sr-only">Search quality reports</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search report, organization, or location" /></label><label><span>Classification</span><select value={classification} onChange={(event) => setClassification(event.target.value)}><option value="ALL">All food reports</option><option value="CONFIRMED">Confirmed food issues</option><option value="UNCLASSIFIED">Needs classification</option></select></label><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option>{QUALITY_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Severity</span><select value={severity} onChange={(event) => setSeverity(event.target.value)}><option value="ALL">All severities</option>{QUALITY_SEVERITIES.map((value) => <option key={value}>{value}</option>)}</select></label>{(classification !== "ALL" || status !== "ALL" || severity !== "ALL" || search) && <Button type="button" variant="quiet" size="small" onClick={resetIssueFilters}><X size={14} />Reset</Button>}</section>{classification === "UNCLASSIFIED" && <Alert tone="warning" title="Classification required">Employee-reported meal concerns need a human-confirmed category and severity.</Alert>}<div className={styles.issueCount}>{visibleIssues.length} {visibleIssues.length === 1 ? "report" : "reports"}</div>{visibleIssues.length === 0 ? <EmptyState icon={<ShieldAlert size={24} />} title="No quality reports match" description={classification === "CONFIRMED" ? "Confirmed food incidents will appear here after human classification." : "Change the filters to inspect other reports."} action={<Button type="button" variant="secondary" onClick={resetIssueFilters}>Reset filters</Button>} /> : <section className={styles.issueList}>{visibleIssues.map((issue) => <QualityIssueCard issue={issue} saving={savingId === issue.id} failure={failure?.id === issue.id ? failure : null} saveIssue={saveIssue} key={issue.id} />)}</section>}</section>}
  </AppShell>;
}

function QualityIssueCard({ issue, saving, failure, saveIssue }: { issue: QualityIssue; saving: boolean; failure: Failure | null; saveIssue: (issue: QualityIssue, form: HTMLFormElement) => Promise<void> }) {
  const suggestion = suggestQualityClassification([issue.message,issue.transcript_english,issue.transcript].filter(Boolean).join(" "));
  const confirmed = Boolean(issue.quality_category);
  const employeeMealReport = Boolean(issue.is_employee_meal_report);
  return <form className={styles.issue} onSubmit={(event) => { event.preventDefault(); void saveIssue(issue, event.currentTarget); }}><header><div><span className={styles.issueIcon}><ShieldAlert size={17} /></span><div><strong>{issue.enterprise_name}{issue.location_name ? ` · ${issue.location_name}` : ""}</strong><small>Submitted {formatTimestamp(issue.created_at)}</small></div></div><div>{confirmed ? <StatusBadge tone="success">HUMAN CLASSIFIED</StatusBadge> : <StatusBadge tone="warning">{employeeMealReport ? "EMPLOYEE REPORTED · NEEDS REVIEW" : "NEEDS REVIEW"}</StatusBadge>}<StatusBadge tone={issue.quality_severity === "CRITICAL" || issue.quality_severity === "HIGH" ? "dangerTone" : "neutral"}>{issue.quality_severity || suggestion.severity}</StatusBadge></div></header><div className={styles.original}><small>{employeeMealReport ? "Employee meal report" : "Original report"}</small>{issue.message && <p>{issue.message}</p>}{issue.transcript && <blockquote><strong>Voice transcript</strong><span>{issue.transcript}</span></blockquote>}</div><Alert tone="info" title={confirmed ? "Stored classification" : "Reviewable suggestion"}>{confirmed ? `${label(issue.quality_category!)} · ${issue.quality_severity?.toLowerCase()} severity · ${issue.quality_classification_source?.toLowerCase() || "human"}` : `${label(suggestion.category)} · ${suggestion.severity.toLowerCase()} severity. Nothing is classified until you save.`}</Alert><div className={styles.triageFields}><label><span>Category</span><select name="category" defaultValue={issue.quality_category || suggestion.category}>{QUALITY_CATEGORIES.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label><label><span>Severity</span><select name="severity" defaultValue={issue.quality_severity || suggestion.severity}>{QUALITY_SEVERITIES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Status</span><select name="status" defaultValue={issue.quality_status}>{QUALITY_STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Meal service date</span><input type="date" name="mealServiceDate" defaultValue={issue.meal_service_date || ""} readOnly={employeeMealReport} /></label></div>{failure && <Alert tone="danger" title="Triage was not saved">{failure.message}{failure.requestId && <code>Request ID: {failure.requestId}</code>}</Alert>}<footer><span>{issue.meal_service_date ? `Meal served ${formatDate(issue.meal_service_date)}` : "Meal service date not provided"}</span><Button type="submit" size="small" loading={saving} loadingLabel="Saving triage…">Save triage</Button></footer></form>;
}

function label(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/^./, (character) => character.toUpperCase()); }
function formatTimestamp(value: string) { return new Date(value).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }); }
function formatDate(value: string) { return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-BD", { timeZone: "UTC", weekday: "short", day: "numeric", month: "long", year: "numeric" }); }
