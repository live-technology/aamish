import { describe, expect, test } from "bun:test";
import { filterEnterpriseMeals, type EnterpriseMealRow } from "./enterprise-meals";

const rows: EnterpriseMealRow[] = [
  { schedule_id: "s1", schedule_date: "2026-09-02", cutoff_time: "2026-09-02T04:00:00Z", status: "PUBLISHED", location_name: "Gulshan", option_label: "A", menu_title: "Chicken lunch", order_count: 4 },
  { schedule_id: "s1", schedule_date: "2026-09-02", cutoff_time: "2026-09-02T04:00:00Z", status: "PUBLISHED", location_name: "Banani", option_label: "B", menu_title: "Vegetable lunch", order_count: 0 },
];

describe("enterprise meal plan", () => {
  test("filters by durable service context without dropping zero counts", () => {
    expect(filterEnterpriseMeals(rows, { location: "Banani", date: "2026-09-02", query: "vegetable" })).toEqual([rows[1]]);
    expect(filterEnterpriseMeals(rows, { location: "", date: "", query: "" })).toHaveLength(2);
  });
});
