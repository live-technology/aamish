"use client";
import { Mic, Search, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { Alert, Button, EmptyState, PageHeader, StatusBadge } from "@/components/ui/primitives";
import { clientErrorMessage } from "@/lib/client-errors";
import { enterpriseNavigation } from "@/lib/enterprise-navigation";
import styles from "./enterprise-reviews.module.css";

export type EnterpriseReviewRow = { id: string; rating: number; comment: string | null; created_at: string; schedule_date: string; full_name: string; location_name: string; menu_title: string; voice_url?: string | null; voice_duration_seconds?: number | null };
export type ReviewStats = { count: number; average: number | null; meal_days: number; low_ratings: number };
type Filters = { query: string; location: string; date: string; rating: string };

export function buildQuery(filters: Filters, offset: number) {
  const params = new URLSearchParams();
  if (filters.query) params.set("search", filters.query);
  if (filters.location) params.set("location", filters.location);
  if (filters.date) params.set("date", filters.date);
  if (filters.rating) params.set("rating", filters.rating);
  if (offset) params.set("offset", String(offset));
  return params.toString();
}

export function EnterpriseReviews({ enterpriseName, fullName, stats, locations, initialReviews, initialHasMore }: { enterpriseName: string; fullName: string; stats: ReviewStats; locations: string[]; initialReviews: EnterpriseReviewRow[]; initialHasMore: boolean }) {
  const [filters, setFilters] = useState<Filters>({ query: "", location: "", date: "", rating: "" });
  const [reviews, setReviews] = useState(initialReviews);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const requestToken = useRef(0);
  const skippedFirstFetch = useRef(false);

  async function fetchPage(offset: number, token: number) {
    setLoading(true); setFailure(null);
    try {
      const response = await fetch(`/api/enterprise/reviews?${buildQuery(filters, offset)}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw { code: result.error };
      if (token !== requestToken.current) return;
      setReviews((current) => (offset === 0 ? result.reviews : [...current, ...result.reviews]));
      setHasMore(Boolean(result.hasMore));
    } catch (caught) {
      if (token !== requestToken.current) return;
      const error = caught as { code?: string };
      setFailure(clientErrorMessage(error.code || "REVIEWS_FETCH_FAILED", "Reviews could not be loaded."));
    } finally {
      if (token === requestToken.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!skippedFirstFetch.current) { skippedFirstFetch.current = true; return; }
    const token = ++requestToken.current;
    const timeout = setTimeout(() => { void fetchPage(0, token); }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query, filters.location, filters.date, filters.rating]);

  function loadMore() { void fetchPage(reviews.length, requestToken.current); }

  return (
    <AppShell workspace={enterpriseName} fullName={fullName} roleLabel="Enterprise administrator" currentPath="/enterprise/reviews" navigation={enterpriseNavigation}>
      <PageHeader eyebrow="Reviews" title="Employee meal feedback" description="Understand the last 30 days of meal ratings, comments, photos, and voice reviews without mixing them with product feedback." />
      <section className={styles.summary}>
        <article><strong>{stats.count}</strong><span>Reviews</span></article>
        <article><strong>{stats.average?.toFixed(1) || "—"}</strong><span>Average rating</span></article>
        <article><strong>{stats.meal_days}</strong><span>Meal days</span></article>
        <article><strong>{stats.low_ratings}</strong><span>Low ratings</span></article>
      </section>
      {stats.count > 0 && (
        <div className={styles.filters}>
          <label className={styles.search}><Search size={15} /><span className="sr-only">Search reviews</span><input placeholder="Search employee, menu or comment" value={filters.query} onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))} /></label>
          <select aria-label="Location" value={filters.location} onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}><option value="">All locations</option>{locations.map((item) => <option key={item}>{item}</option>)}</select>
          <input aria-label="Meal date" type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))} />
          <select aria-label="Rating" value={filters.rating} onChange={(e) => setFilters((f) => ({ ...f, rating: e.target.value }))}><option value="">All ratings</option><option value="LOW">Low (1–2)</option>{[5, 4, 3, 2, 1].map((value) => <option value={value} key={value}>{value} stars</option>)}</select>
        </div>
      )}
      {failure && <Alert tone="danger" title="Reviews could not be loaded">{failure}</Alert>}
      {stats.count === 0 ? (
        <EmptyState icon={<Star size={25} />} title="No reviews yet" description="Employee meal reviews will appear here after submission." />
      ) : reviews.length === 0 && !loading ? (
        <EmptyState icon={<Search size={25} />} title="No reviews match" description="Clear a filter or choose another date, rating, or location." />
      ) : (
        <section className={styles.list}>
          {reviews.map((review) => (
            <article className={styles.review} key={review.id}>
              <header><div><strong>{review.full_name}</strong><span>{review.menu_title} · {review.location_name}</span></div><StatusBadge tone={review.rating <= 2 ? "dangerTone" : review.rating >= 4 ? "success" : "neutral"}><Star size={12} fill="currentColor" />{review.rating}/5</StatusBadge></header>
              {review.comment ? <p>{review.comment}</p> : <p className={styles.muted}>No written comment.</p>}
              {review.voice_url && <div className={styles.voice}><Mic size={15} /><audio controls preload="none" src={review.voice_url} /><span>{review.voice_duration_seconds}s</span></div>}
              <footer><time dateTime={review.schedule_date}>Meal {formatDate(review.schedule_date)}</time><time dateTime={review.created_at}>Submitted {formatTime(review.created_at)}</time></footer>
            </article>
          ))}
        </section>
      )}
      {hasMore && (
        <Button type="button" variant="secondary" onClick={loadMore} loading={loading} loadingLabel="Loading…">Load more reviews</Button>
      )}
    </AppShell>
  );
}
function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }); }
function formatTime(value: string) { return new Date(value).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" }); }
