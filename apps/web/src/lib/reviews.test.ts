import { describe, expect, test } from "bun:test";
import { eligibleReviewSchedule } from "./reviews";

describe("eligibleReviewSchedule", () => {
  test("selects the latest eligible received meal", () => {
    const schedules = [
      { id: "old", schedule_date: "2026-08-29", can_review: true },
      { id: "skipped", schedule_date: "2026-08-30", can_review: false },
      { id: "future", schedule_date: "2026-09-02", can_review: true },
      { id: "today", schedule_date: "2026-09-01", can_review: true },
    ];
    expect(eligibleReviewSchedule(schedules, "2026-09-01")?.id).toBe("today");
  });

  test("returns undefined when no meal is reviewable", () => {
    expect(eligibleReviewSchedule([{ id: "skipped", schedule_date: "2026-09-01", can_review: false }], "2026-09-01")).toBeUndefined();
  });
});
