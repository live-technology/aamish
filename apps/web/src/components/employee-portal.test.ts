import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EmployeeReviewWorkspace } from "./employee-review-workspace";
import { MealCalendar, type EmployeeSchedule } from "./employee-portal";

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
  test("shows historical, today, and planned states with review status and controls", () => {
    const html = renderToStaticMarkup(createElement(MealCalendar, { today: localDate(0), schedules: [schedule(-30, { review_id: "review", review_rating: 4 }), schedule(0), schedule(2)], updatePreference: async () => undefined }));
    expect(html).toContain("Past"); expect(html).toContain("Today"); expect(html).toContain("Planned");
    expect(html).toContain("Reviewed 4/5"); expect(html).toContain("Meal option"); expect(html).toContain("Skip");
  });

  test("offers any past received meal and explains the fixed edit window", () => {
    const html = renderToStaticMarkup(createElement(EmployeeReviewWorkspace, { schedules: [schedule(-2000)], onSaved: () => undefined }));
    expect(html).toContain("Open anytime"); expect(html).toContain("exactly 24 hours"); expect(html).toContain("up to one minute");
  });
});
