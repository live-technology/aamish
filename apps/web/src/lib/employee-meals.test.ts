import { describe, expect, test } from "bun:test";
import { mealFulfillmentState, mealPhase, mealsForHistory, mealsForWeek, reviewState } from "./employee-meals";

const meal = (date: string, title = "Chicken rice") => ({ schedule_date: date, location_name: "Mirpur", options: [{ title }] });

describe("employee meal journeys", () => {
  test("keeps My Week to today plus six days in nearest-first order", () => {
    const result = mealsForWeek([meal("2026-09-10"), meal("2026-09-03"), meal("2026-09-09"), meal("2026-09-02")], "2026-09-03");
    expect(result.map((item) => item.schedule_date)).toEqual(["2026-09-03", "2026-09-09"]);
  });

  test("distinguishes current, future, received, and skipped meals", () => {
    expect(mealPhase(meal("2026-09-03"), "2026-09-03")).toBe("Today");
    expect(mealPhase(meal("2026-09-04"), "2026-09-03")).toBe("Upcoming");
    expect(mealFulfillmentState({ ...meal("2026-09-02"), is_opted_in: true }, "2026-09-03")).toBe("Received");
    expect(mealFulfillmentState({ ...meal("2026-09-04"), is_opted_in: false }, "2026-09-03")).toBe("Skipped");
  });

  test("filters only past history by date and meal context", () => {
    const result = mealsForHistory([meal("2026-08-01"), meal("2026-08-10", "Fish curry"), meal("2026-09-04")], "2026-09-03", { query: "fish", from: "2026-08-05", to: "2026-08-31" });
    expect(result.map((item) => item.schedule_date)).toEqual(["2026-08-10"]);
  });

  test("shows skipped, unlimited submission, and the exact 24-hour edit boundary", () => {
    const base = { schedule_date: "2020-01-01", is_opted_in: true, review_id: null, review_rating: null, review_created_at: null };
    expect(reviewState({ ...base, is_opted_in: false }).label).toBe("Skipped");
    expect(reviewState(base).label).toBe("Review open anytime");
    const reviewed = { ...base, review_id: "review", review_rating: 4, review_created_at: "2026-09-02T00:00:00Z" };
    expect(reviewState(reviewed, new Date("2026-09-02T23:59:00Z")).label).toContain("left to edit");
    expect(reviewState(reviewed, new Date("2026-09-03T00:00:00Z")).label).toContain("left to edit");
    expect(reviewState(reviewed, new Date("2026-09-03T00:00:00.001Z")).label).toContain("Read only");
  });
});
