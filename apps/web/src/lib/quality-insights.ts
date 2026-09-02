import { addDays, isYmd } from "@/lib/service-planning";

export type QualityInsightFilters = { from: string; to: string; enterprise: string; location: string; menu: string; rating: string };
export type QualityOption = { id: string; label: string };
export type QualitySummary = { reviewCount: number; average: number | null; eligibleMeals: number; responseRate: number; lowCount: number; lowRate: number; openIncidents: number; previousAverage: number | null; change: number | null };
export type QualityBreakdown = { dimension: "ENTERPRISE" | "LOCATION" | "MENU"; id: string; label: string; count: number; average: number; previousCount: number; previousAverage: number | null; change: number | null; meaningfulDecline: boolean };
export type QualityReview = { id: string; rating: number; comment: string | null; created_at: string; schedule_date: string; full_name: string; enterprise_id: string; enterprise_name: string; location_id: string; location_name: string; menu_id: string | null; menu_title: string; voice_url: string | null; voice_duration_seconds: number | null; photos: Array<{ url: string; thumbnailUrl: string }> };
export type QualityInsightData = {
  filters: QualityInsightFilters;
  summary: QualitySummary;
  distribution: Array<{ rating: number; count: number }>;
  trend: Array<{ date: string; count: number; average: number }>;
  breakdowns: QualityBreakdown[];
  reviews: QualityReview[];
  hasMore: boolean;
  options: { enterprises: QualityOption[]; locations: QualityOption[]; menus: QualityOption[] };
};

export const DEFAULT_INSIGHT_DAYS = 30;
export const MEANINGFUL_SAMPLE_SIZE = 5;
export const MEANINGFUL_DECLINE = -0.5;
export const MAX_INSIGHT_DAYS = 366;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function defaultInsightRange(today: string) { return { from: addDays(today, -(DEFAULT_INSIGHT_DAYS - 1)), to: today }; }
export function insightPreset(preset: "LAST_7" | "LAST_30" | "PREVIOUS_30", today: string) {
  if (preset === "LAST_7") return { from: addDays(today, -6), to: today };
  if (preset === "PREVIOUS_30") return { from: addDays(today, -59), to: addDays(today, -30) };
  return defaultInsightRange(today);
}
export function validInsightRange(from: string | undefined, to: string | undefined) {
  if (!isYmd(from) || !isYmd(to) || from > to) return undefined;
  const days = Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000) + 1;
  return days <= MAX_INSIGHT_DAYS ? { from, to } : undefined;
}
export function qualityFiltersFrom(params: { from?: string; to?: string; enterprise?: string; location?: string; menu?: string; rating?: string }, today: string): QualityInsightFilters {
  const range = validInsightRange(params.from, params.to) || defaultInsightRange(today);
  return { ...range, enterprise: UUID.test(params.enterprise || "") ? params.enterprise! : "", location: UUID.test(params.location || "") ? params.location! : "", menu: params.menu === "scheduled-meal" || UUID.test(params.menu || "") ? params.menu! : "", rating: params.rating === "LOW" || /^[1-5]$/.test(params.rating || "") ? params.rating! : "" };
}
export function previousEquivalentRange(from: string, to: string) {
  const days = Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86_400_000) + 1;
  return { from: addDays(from, -days), to: addDays(from, -1) };
}
export function meaningfulDecline(count: number, previousCount: number, change: number | null) { return count >= MEANINGFUL_SAMPLE_SIZE && previousCount >= MEANINGFUL_SAMPLE_SIZE && change !== null && change <= MEANINGFUL_DECLINE; }
export function insightQuery(filters: QualityInsightFilters, offset = 0) {
  const params = new URLSearchParams(filters);
  if (offset) params.set("offset", String(offset));
  return params.toString();
}
export function qualityInsightScope(role: string, enterpriseId?: string | null) {
  if (role === "SUPER_ADMIN") return { enterpriseId: null };
  if (role === "ENTERPRISE_ADMIN" && enterpriseId && UUID.test(enterpriseId)) return { enterpriseId };
  return null;
}
