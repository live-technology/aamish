import { describe, expect, test } from "bun:test";
import { filterEnterpriseMeals, type EnterpriseMealRow } from "./enterprise-meals";

const rows: EnterpriseMealRow[] = [
  { schedule_id: "s1", schedule_date: "2026-09-02", cutoff_time: "2026-09-02T04:00:00Z", status: "PUBLISHED", location_name: "Gulshan", option_label: "A", menu_title: "Chicken lunch", menu_description: "Rice and chicken", menu_price: 250, image_url: "https://example.com/chicken.jpg", order_count: 4, opted_out_count: 1 },
  { schedule_id: "s1", schedule_date: "2026-09-02", cutoff_time: "2026-09-02T04:00:00Z", status: "PUBLISHED", location_name: "Banani", option_label: "B", menu_title: "Vegetable lunch", menu_description: "Rice and vegetables", menu_price: 180, image_url: null, order_count: 0, opted_out_count: 0 },
];

describe("enterprise meal plan", () => {
  test("filters by durable service context without dropping zero counts", () => {
    expect(filterEnterpriseMeals(rows, { location: "Banani", from: "2026-09-01", to: "2026-09-03", query: "vegetable" })).toEqual([rows[1]]);
    expect(filterEnterpriseMeals(rows, { location: "", from: "", to: "", query: "" })).toHaveLength(2);
    expect(filterEnterpriseMeals(rows, { location: "", from: "2026-09-03", to: "", query: "" })).toHaveLength(0);
  });
});
