"use client";

import Image from "next/image";
import { AlertTriangle, ArrowDown, ArrowRight, CalendarDays, ChevronDown, ImageIcon, Mic, Star, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Button, EmptyState, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import { insightPreset, insightQuery, validInsightRange, type QualityBreakdown, type QualityInsightData, type QualityInsightFilters } from "@/lib/quality-insights";
import styles from "./meal-quality-insights.module.css";

type Role = "SUPER_ADMIN" | "ENTERPRISE_ADMIN";
type Dimension = QualityBreakdown["dimension"];
type Sort = "SAMPLE" | "LOWEST" | "CHANGE" | "NAME";

export function MealQualityInsights({ initialData, role }: { initialData: QualityInsightData; role: Role }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState(initialData.filters);
  const [draft, setDraft] = useState(initialData.filters);
  const [dimension, setDimension] = useState<Dimension>(role === "SUPER_ADMIN" ? "ENTERPRISE" : "MENU");
  const [sort, setSort] = useState<Sort>("SAMPLE");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failure, setFailure] = useState<{ message: string; requestId?: string }>();
  const currentBreakdowns = useMemo(() => sortBreakdowns(data.breakdowns.filter((row) => row.dimension === dimension), sort), [data.breakdowns, dimension, sort]);
  const maxDistribution = Math.max(...data.distribution.map(({ count }) => count), 1);
  const maxTrendCount = Math.max(...data.trend.map(({ count }) => count), 1);
  const invalidDates = !validInsightRange(draft.from, draft.to);

  async function load(next: QualityInsightFilters, offset = 0) {
    if (offset) setLoadingMore(true); else setLoading(true);
    setFailure(undefined);
    try {
      const response = await fetch(`/api/quality-insights?${insightQuery(next, offset)}`);
      const result = await response.json().catch(() => ({})) as { data?: QualityInsightData; error?: string; requestId?: string };
      if (!response.ok || !result.data) throw { code: result.error || "QUALITY_INSIGHTS_FAILED", requestId: result.requestId };
      setData((current) => offset ? { ...result.data!, reviews: [...current.reviews, ...result.data!.reviews] } : result.data!);
      setFilters(next); setDraft(next);
      if (!offset) window.history.replaceState(null, "", `${window.location.pathname}?${insightQuery(next)}`);
    } catch (caught) {
      const error = caught as { code?: string; requestId?: string };
      setFailure({ message: clientErrorMessage(error.code || "QUALITY_INSIGHTS_FAILED", "Meal-quality insights could not be loaded."), requestId: error.requestId });
    } finally { setLoading(false); setLoadingMore(false); }
  }

  function chooseRange(preset: "LAST_7" | "LAST_30" | "PREVIOUS_30") { const range = insightPreset(preset, today); void load({ ...draft, ...range }); }
  function drill(dimension: Dimension, id: string) {
    const next = { ...filters, enterprise: dimension === "ENTERPRISE" ? id : filters.enterprise, location: dimension === "LOCATION" ? id : filters.location, menu: dimension === "MENU" ? id : filters.menu };
    void load(next);
  }
  function drillRating(rating: number) { void load({ ...filters, rating: String(rating) }); }
  function drillDay(date: string) { void load({ ...filters, from: date, to: date }); }

  return <section className={styles.workspace} aria-label="Meal quality insights">
    <section className={styles.filterPanel} aria-label="Insight filters">
      <div className={styles.quickRanges}><Button size="small" type="button" variant="secondary" disabled={loading} onClick={() => chooseRange("LAST_7")}>Last 7 days</Button><Button size="small" type="button" variant="secondary" disabled={loading} onClick={() => chooseRange("LAST_30")}>Last 30 days</Button><Button size="small" type="button" variant="secondary" disabled={loading} onClick={() => chooseRange("PREVIOUS_30")}>Previous 30</Button></div>
      <div className={styles.dateRange}><label><span>From</span><input type="date" value={draft.from} onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))} /></label><label><span>To</span><input type="date" value={draft.to} onChange={(event) => setDraft((value) => ({ ...value, to: event.target.value }))} /></label></div>
      <div className={styles.contextFilters}>{role === "SUPER_ADMIN" && <label><span>Enterprise</span><select value={draft.enterprise} onChange={(event) => setDraft((value) => ({ ...value, enterprise: event.target.value, location: "" }))}><option value="">All enterprises</option>{data.options.enterprises.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>}<label><span>Location</span><select value={draft.location} onChange={(event) => setDraft((value) => ({ ...value, location: event.target.value }))}><option value="">All locations</option>{data.options.locations.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label><label><span>Menu</span><select value={draft.menu} onChange={(event) => setDraft((value) => ({ ...value, menu: event.target.value }))}><option value="">All menus</option>{data.options.menus.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label><label><span>Rating</span><select value={draft.rating} onChange={(event) => setDraft((value) => ({ ...value, rating: event.target.value }))}><option value="">All ratings</option><option value="LOW">Low (1–2)</option>{[5,4,3,2,1].map((rating) => <option value={rating} key={rating}>{rating} stars</option>)}</select></label><Button type="button" size="small" loading={loading} loadingLabel="Applying…" disabled={invalidDates} onClick={() => void load(draft)}>Apply filters</Button></div>
    </section>

    {failure && <Alert tone="danger" title="Insights could not be loaded">{failure.message}{failure.requestId && ` Request ID: ${failure.requestId}.`}</Alert>}

    <section className={styles.metrics} aria-label="Quality metrics"><Metric value={formatAverage(data.summary.average)} label="Average rating" detail={<Comparison change={data.summary.change} previous={data.summary.previousAverage} />} /><Metric value={`${data.summary.responseRate.toFixed(0)}%`} label="Review response rate" detail={`${data.summary.reviewCount} of ${data.summary.eligibleMeals} opted-in meals`} /><Metric value={data.summary.reviewCount} label="Review sample" detail="Visible filter context" /><Metric value={`${data.summary.lowRate.toFixed(1)}%`} label="Low-rating rate" detail={`${data.summary.lowCount} rated 1–2`} danger={data.summary.lowRate >= 10} /><Metric value={data.summary.openIncidents} label="Open food incidents" detail="Human classified" danger={data.summary.openIncidents > 0} /></section>

    <section className={styles.chartGrid}>
      <article className={styles.chartCard}><header><div><p>Rating distribution</p><h2>How employees scored meals</h2></div><span>{data.summary.reviewCount} responses</span></header>{data.summary.reviewCount ? <><div className={styles.distribution} aria-label="Rating distribution chart">{data.distribution.map((item) => <button type="button" onClick={() => drillRating(item.rating)} key={item.rating} aria-label={`${item.rating} stars: ${item.count} reviews`}><b>{item.rating}<Star size={11} fill="currentColor" /></b><span><i style={{ width: `${item.count / maxDistribution * 100}%` }} /></span><strong>{item.count}</strong></button>)}</div><table className="sr-only"><caption>Rating distribution table</caption><thead><tr><th>Rating</th><th>Reviews</th></tr></thead><tbody>{data.distribution.map((item) => <tr key={item.rating}><th>{item.rating} stars</th><td>{item.count}</td></tr>)}</tbody></table></> : <p className={styles.noChart}>No ratings in this filter context.</p>}</article>
      <article className={styles.chartCard}><header><div><p>Satisfaction trend</p><h2>Service-day rating</h2></div><span>Tap a day to inspect</span></header>{data.trend.length ? <><div className={styles.trend} aria-label="Daily rating trend">{data.trend.map((day) => <button type="button" onClick={() => drillDay(day.date)} key={day.date} aria-label={`${formatDate(day.date)}: ${day.average.toFixed(1)} from ${day.count} reviews`}><span><i style={{ height: `${Math.max(8, day.average / 5 * 100)}%` }} /></span><b>{day.average.toFixed(1)}</b><small>{shortDate(day.date)}</small><em style={{ opacity: .45 + day.count / maxTrendCount * .55 }}>{day.count}</em></button>)}</div><table className="sr-only"><caption>Daily rating trend table</caption><thead><tr><th>Date</th><th>Average</th><th>Reviews</th></tr></thead><tbody>{data.trend.map((day) => <tr key={day.date}><th>{formatDate(day.date)}</th><td>{day.average.toFixed(1)}</td><td>{day.count}</td></tr>)}</tbody></table></> : <p className={styles.noChart}>No daily ratings in this filter context.</p>}</article>
    </section>

    <section className={styles.breakdown}><header><div><p>Performance breakdown</p><h2>Find where quality changes</h2></div><label><span>Sort rows</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="SAMPLE">Largest sample</option><option value="LOWEST">Lowest rating</option><option value="CHANGE">Largest decline</option><option value="NAME">Name</option></select></label></header><div className={styles.dimensionTabs} role="tablist" aria-label="Quality breakdown dimension">{role === "SUPER_ADMIN" && <button role="tab" aria-selected={dimension === "ENTERPRISE"} onClick={() => setDimension("ENTERPRISE")}>Enterprise</button>}<button role="tab" aria-selected={dimension === "MENU"} onClick={() => setDimension("MENU")}>Menu</button><button role="tab" aria-selected={dimension === "LOCATION"} onClick={() => setDimension("LOCATION")}>Location</button></div>{currentBreakdowns.length ? <div className={styles.tableWrap}><table className={styles.breakdownTable}><caption className="sr-only">Quality breakdown with current and previous-period results</caption><thead><tr><th>{dimensionLabel(dimension)}</th><th>Average</th><th>Sample</th><th>Previous</th><th>Change</th><th><span className="sr-only">Open reviews</span></th></tr></thead><tbody>{currentBreakdowns.map((row) => <tr className={row.meaningfulDecline ? styles.decline : ""} key={row.id}><th scope="row">{row.label}{row.meaningfulDecline && <span><AlertTriangle size={13} />Meaningful decline</span>}</th><td data-label="Average">{row.average.toFixed(1)}</td><td data-label="Sample">{row.count}</td><td data-label="Previous">{row.previousAverage?.toFixed(1) || "—"}<small>{row.previousCount ? `n=${row.previousCount}` : "No sample"}</small></td><td data-label="Change"><Change value={row.change} /></td><td><button type="button" onClick={() => drill(row.dimension, row.id)}>View reviews <ArrowRight size={13} /></button></td></tr>)}</tbody></table></div> : <EmptyState title="No breakdown available" description="Try a broader date range or remove a filter." />}</section>

    <section className={styles.reviewSection}><header><div><p>Authorized review detail</p><h2>{data.summary.reviewCount} matching {data.summary.reviewCount === 1 ? "review" : "reviews"}</h2></div><span>Comments and media remain read-only</span></header>{data.reviews.length ? <div className={styles.reviewList}>{data.reviews.map((review) => <details className={styles.review} key={review.id}><summary><span><strong>{review.full_name}</strong><small>{review.enterprise_name} · {review.location_name}</small></span><span><StatusBadge tone={review.rating <= 2 ? "dangerTone" : review.rating >= 4 ? "success" : "neutral"}><Star size={11} fill="currentColor" />{review.rating}/5</StatusBadge><ChevronDown size={16} /></span></summary><div className={styles.reviewBody}><div className={styles.reviewContext}><span><CalendarDays size={14} />{formatDate(review.schedule_date)}</span><strong>{review.menu_title}</strong></div><p>{review.comment || "No written comment."}</p>{review.photos.length > 0 && <div className={styles.photos} aria-label={`${review.photos.length} review photos`}>{review.photos.map((photo, index) => <a href={photo.url} target="_blank" rel="noreferrer" key={photo.url}><Image src={photo.thumbnailUrl} alt={`Review photo ${index + 1}`} width={96} height={72} unoptimized /></a>)}</div>}{review.voice_url && <div className={styles.voice}><Mic size={15} /><audio controls preload="none" src={review.voice_url} /><span>{review.voice_duration_seconds}s</span></div>}<footer><span><ImageIcon size={13} />{review.photos.length} {review.photos.length === 1 ? "photo" : "photos"}</span><time dateTime={review.created_at}>Submitted {formatTimestamp(review.created_at)}</time></footer></div></details>)}</div> : <EmptyState icon={<Star size={24} />} title="No reviews match" description="Broaden the date range or remove a context filter." />}{data.hasMore && <Button type="button" variant="secondary" loading={loadingMore} loadingLabel="Loading…" onClick={() => void load(filters, data.reviews.length)}>Load more reviews</Button>}</section>
  </section>;
}

function Metric({ value, label, detail, danger = false }: { value: string | number; label: string; detail: React.ReactNode; danger?: boolean }) { return <article className={danger ? styles.metricDanger : ""}><strong>{value}</strong><span>{label}</span><small>{detail}</small></article>; }
function Comparison({ change, previous }: { change: number | null; previous: number | null }) { return <>{change === null ? "No previous comparison" : <span className={change < 0 ? styles.negative : styles.positive}>{change < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}{change > 0 ? "+" : ""}{change.toFixed(1)} vs {previous?.toFixed(1)}</span>}</>; }
function Change({ value }: { value: number | null }) { if (value === null) return <>—</>; return <span className={value < 0 ? styles.negative : styles.positive}>{value < 0 ? <ArrowDown size={12} /> : <TrendingUp size={12} />}{value > 0 ? "+" : ""}{value.toFixed(1)}</span>; }
function sortBreakdowns(rows: QualityBreakdown[], sort: Sort) { return [...rows].sort((a, b) => sort === "LOWEST" ? a.average - b.average || b.count - a.count : sort === "CHANGE" ? (a.change ?? 99) - (b.change ?? 99) : sort === "NAME" ? a.label.localeCompare(b.label) : b.count - a.count || a.label.localeCompare(b.label)); }
function dimensionLabel(dimension: Dimension) { return dimension === "ENTERPRISE" ? "Enterprise" : dimension === "LOCATION" ? "Location" : "Menu"; }
function formatAverage(value: number | null) { return value === null ? "—" : value.toFixed(1); }
function formatDate(value: string) { return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-BD", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }); }
function shortDate(value: string) { return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-BD", { timeZone: "UTC", day: "numeric", month: "short" }); }
function formatTimestamp(value: string) { return new Date(value).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }); }
