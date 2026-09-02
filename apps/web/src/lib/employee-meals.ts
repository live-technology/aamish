type DatedMeal = { schedule_date: string };
type ReviewStateMeal = DatedMeal & {
  is_opted_in: boolean;
  review_id: string | null;
  review_rating: number | null;
  review_created_at: string | null;
};

export type HistoryFilters = { query: string; from: string; to: string };

export function mealPhase(meal: DatedMeal, today: string) {
  if (meal.schedule_date < today) return "Past" as const;
  if (meal.schedule_date === today) return "Today" as const;
  return "Upcoming" as const;
}

export function mealFulfillmentState(meal: DatedMeal & { is_opted_in: boolean }, today: string) {
  if (!meal.is_opted_in) return "Skipped" as const;
  return meal.schedule_date < today ? "Received" as const : "Receiving" as const;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function mealsForWeek<T extends DatedMeal>(meals: T[], today: string) {
  const end = addDays(today, 6);
  return meals.filter((meal) => meal.schedule_date >= today && meal.schedule_date <= end).sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
}

export function mealsForHistory<T extends DatedMeal & { location_name: string; options: { title: string }[] }>(meals: T[], today: string, filters: HistoryFilters) {
  const query = filters.query.trim().toLowerCase();
  return meals.filter((meal) => {
    if (meal.schedule_date >= today) return false;
    if (filters.from && meal.schedule_date < filters.from) return false;
    if (filters.to && meal.schedule_date > filters.to) return false;
    return !query || [meal.location_name, ...meal.options.map((option) => option.title)].join(" ").toLowerCase().includes(query);
  }).sort((a, b) => b.schedule_date.localeCompare(a.schedule_date));
}

export function reviewState(meal: ReviewStateMeal, now = new Date()) {
  if (!meal.is_opted_in) return { label: "Skipped", tone: "neutral" as const };
  if (!meal.review_id || !meal.review_created_at) return { label: "Review open anytime", tone: "info" as const };
  const deadline = new Date(meal.review_created_at).valueOf() + 24 * 60 * 60 * 1000;
  if (now.valueOf() > deadline) return { label: `Reviewed ${meal.review_rating}/5 · Read only`, tone: "neutral" as const };
  const minutes = Math.max(0, Math.ceil((deadline - now.valueOf()) / 60_000));
  const remaining = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  return { label: `Reviewed ${meal.review_rating}/5 · ${remaining} left to edit`, tone: "success" as const };
}
