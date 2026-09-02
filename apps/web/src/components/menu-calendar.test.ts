import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DayPlan, PrerequisiteState, scheduleStepError } from "./menu-calendar";

describe("service calendar contracts", () => {
  test("validates service details and distinct menu options by step", () => {
    expect(scheduleStepError(1, { enterpriseId: "", scheduleDate: "", menuIds: [""] })).toContain("organization");
    expect(scheduleStepError(2, { enterpriseId: "e-1", scheduleDate: "2026-09-02", menuIds: ["m-1", "m-1"] })).toContain("different package");
    expect(scheduleStepError(2, { enterpriseId: "e-1", scheduleDate: "2026-09-02", menuIds: ["m-1", "m-2"] })).toBe("");
  });

  test("explains the missing organization prerequisite with a direct action", () => {
    const html = renderToStaticMarkup(createElement(PrerequisiteState, { enterprises: [] }));
    expect(html).toContain("Complete setup before scheduling");
    expect(html).toContain('href="/admin/organizations"');
    expect(html).toContain("Add organization");
  });

  test("shows daily quantities, locations, and menus without leaving the week", async () => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    const plan = { id: "s-1", schedule_date: today, cutoff_time: `${today}T23:59:00+06:00`, status: "PUBLISHED", enterprise_name: "Meridian", meal_count: 12, locations: [{ name: "Head Office", count: 12 }], options: [{ label: "A", title: "Office Meal", count: 12 }] };
    const html = renderToStaticMarkup(createElement(DayPlan, { date: today, schedules: [plan], today, onSchedule: () => {}, onEdit: () => {}, onCancel: () => {}, cancellingId: null }));
    expect(html).toContain("Head Office");
    expect(html).toContain("Office Meal");
    expect(html).toContain("Live projection");
    expect(html).toContain("projected meals");
    const source = await Bun.file(new URL("./menu-calendar.tsx", import.meta.url)).text();
    expect(source).toContain("Production &amp; dispatch");
    expect(source).toContain("Previous week");
    expect(source).not.toContain("month view");
  });

  test("describes an empty date without implying its quantity is locked", () => {
    const html = renderToStaticMarkup(createElement(DayPlan, { date: "2026-09-10", schedules: [], today: "2026-09-03", onSchedule: () => {}, onEdit: () => {}, onCancel: () => {}, cancellingId: null }));
    expect(html).toContain("no meals planned");
    expect(html).not.toContain("locked meals");
  });
});
