import { describe, expect, test } from "bun:test";
import { filterOperationRows, fulfillmentTotals, type OperationRow } from "./operations-dashboard";

const rows: OperationRow[] = [
  { schedule_id: "s-1", schedule_date: "2026-09-01", cutoff_time: "2026-09-01T04:00:00.000Z", enterprise_name: "Live Technology", location_name: "Banani", option_label: "A", menu_title: "Homestyle lunch", meal_count: 7 },
  { schedule_id: "s-1", schedule_date: "2026-09-01", cutoff_time: "2026-09-01T04:00:00.000Z", enterprise_name: "Live Technology", location_name: "Banani", option_label: "B", menu_title: "Vegetarian lunch", meal_count: 3 },
  { schedule_id: "s-2", schedule_date: "2026-09-04", cutoff_time: "2026-09-04T04:00:00.000Z", enterprise_name: "Acme", location_name: "Gulshan", option_label: "A", menu_title: "Premium lunch", meal_count: 5 },
  { schedule_id: "s-3", schedule_date: "2026-08-28", cutoff_time: "2026-08-28T04:00:00.000Z", enterprise_name: "Acme", location_name: "Uttara", option_label: "A", menu_title: "Regular lunch", meal_count: 4 },
];

describe("fulfillment dashboard contracts", () => {
  test("filters the operational window and exact-date override", () => {
    expect(filterOperationRows(rows, "UPCOMING", "", "", "2026-09-01").map((row) => row.schedule_id)).toEqual(["s-1", "s-1", "s-2"]);
    expect(filterOperationRows(rows, "RECENT", "", "", "2026-09-01").map((row) => row.schedule_id)).toEqual(["s-3"]);
    expect(filterOperationRows(rows, "RECENT", "2026-09-04", "", "2026-09-01").map((row) => row.schedule_id)).toEqual(["s-2"]);
  });

  test("searches organization, location, and menu without changing counts", () => {
    expect(filterOperationRows(rows, "ALL", "", "vegetarian", "2026-09-01")).toHaveLength(1);
    expect(filterOperationRows(rows, "ALL", "", "gulshan", "2026-09-01")[0].schedule_id).toBe("s-2");
    expect(fulfillmentTotals(rows)).toEqual({ meals: 19, services: 3, locations: 3, menus: 4 });
  });

  test("carries an exact planning week into fulfillment", () => {
    const selected = filterOperationRows(rows, "CUSTOM", "", "", "2026-09-03", { from: "2026-09-04", to: "2026-09-09" });
    expect(selected.map(({ schedule_date }) => schedule_date)).toEqual(["2026-09-04"]);
  });
});
