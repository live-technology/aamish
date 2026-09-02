import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmployeeReviewWorkspace } from "./employee-review-workspace";
import { MealCalendar, TodayMeal, type EmployeeSchedule } from "./employee-portal";

function localDate(offset: number) {
  const value = new Date(); value.setDate(value.getDate() + offset);
  return value.toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function schedule(offset: number, overrides: Partial<EmployeeSchedule> = {}): EmployeeSchedule {
  return {
    id: `schedule-${offset}`, schedule_date: localDate(offset), cutoff_time: new Date(Date.now() + 86_400_000).toISOString(), status: "PUBLISHED",
    is_opted_in: true, selected_option_id: "option", location_name: "Gulshan", can_review: offset < 0,
    options: [{ id: "option", label: "A", title: "Homestyle lunch", description: "Rice and curry", image_url: null }],
    review_id: null, review_rating: null, review_comment: null, review_created_at: null, review_updated_at: null, review_photos: [],
    review_voice_public_id: null, review_voice_url: null, review_voice_duration_seconds: null, ...overrides,
  };
}

describe("employee meal and review calendar", () => {
  test("shows only today plus six days, nearest first, with current controls", () => {
    const html = renderToStaticMarkup(createElement(MealCalendar, { today: localDate(0), schedules: [schedule(-1), schedule(7), schedule(2), schedule(0)], updatePreference: async () => undefined }));
    expect(html).toContain("My Week"); expect(html).toContain("Today"); expect(html).toContain("Upcoming");
    expect(html).not.toContain(formatScheduleDate(-1)); expect(html).not.toContain(formatScheduleDate(7));
    expect(html.indexOf(formatScheduleDate(0))).toBeLessThan(html.indexOf(formatScheduleDate(2)));
    expect(html).toContain("Meal option"); expect(html).toContain("Skip");
  });

  test("shows skipped meals with a reserve action", () => {
    const html = renderToStaticMarkup(createElement(MealCalendar, { today: localDate(0), schedules: [schedule(1, { is_opted_in: false })], updatePreference: async () => undefined }));
    expect(html).toContain("Skipped"); expect(html).toContain("Reserve"); expect(html).toContain("disabled");
  });

  test("Today is an immediate decision surface with no review or rating UI", () => {
    const html = renderToStaticMarkup(createElement(TodayMeal, { today: localDate(0), schedule: schedule(0), updatePreference: async () => undefined }));
    expect(html).toContain("Today’s meal"); expect(html).toContain("Meal reserved"); expect(html).toContain("Skip this meal");
    expect(html).not.toContain("Review"); expect(html).not.toContain("rating");
  });

  test("offers any past received meal and explains the fixed edit window", () => {
    const html = renderToStaticMarkup(createElement(EmployeeReviewWorkspace, { schedules: [schedule(-2000)], today: localDate(0), onSaved: () => undefined }));
    expect(html).toContain("Open anytime"); expect(html).toContain("exactly 24 hours"); expect(html).toContain("up to one minute");
  });
});

function formatScheduleDate(offset: number) {
  return new Date(`${localDate(offset)}T00:00:00`).toLocaleDateString("en-BD", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
