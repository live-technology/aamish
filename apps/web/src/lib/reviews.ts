type ReviewableSchedule = { schedule_date: string; can_review: boolean };

export function eligibleReviewSchedule<T extends ReviewableSchedule>(schedules: T[], today: string): T | undefined {
  return schedules
    .filter((schedule) => schedule.can_review && schedule.schedule_date <= today)
    .sort((a, b) => b.schedule_date.localeCompare(a.schedule_date))[0];
}
