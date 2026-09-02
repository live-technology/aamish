import { describe, expect, test } from "bun:test";
import { countState, filterOperationRows, fulfillmentCsv, fulfillmentTotals, groupByEnterprise, groupForDispatch, presetRange, procurementTotals, validFulfillmentRange, type OperationRow } from "@/lib/fulfillment";

const rows: OperationRow[] = [
  { schedule_id: "s-1", schedule_date: "2026-09-01", cutoff_time: "2026-09-01T04:00:00.000Z", enterprise_name: "Live Technology", location_name: "Banani", option_label: "A", menu_title: "Homestyle lunch", meal_count: 7 },
  { schedule_id: "s-1", schedule_date: "2026-09-01", cutoff_time: "2026-09-01T04:00:00.000Z", enterprise_name: "Live Technology", location_name: "Banani", option_label: "B", menu_title: "Vegetarian lunch", meal_count: 3 },
  { schedule_id: "s-2", schedule_date: "2026-09-04", cutoff_time: "2026-09-04T04:00:00.000Z", enterprise_name: "Acme", location_name: "Gulshan", option_label: "A", menu_title: "Premium lunch", meal_count: 5 },
  { schedule_id: "s-3", schedule_date: "2026-08-28", cutoff_time: "2026-08-28T04:00:00.000Z", enterprise_name: "Acme", location_name: "Uttara", option_label: "A", menu_title: "Regular lunch", meal_count: 4 },
];

describe("fulfillment dashboard contracts", () => {
  test("builds precise quick ranges and rejects invalid custom dates", () => {
    expect(presetRange("TODAY", "2026-09-01")).toEqual({ from: "2026-09-01", to: "2026-09-01" });
    expect(presetRange("NEXT_7", "2026-09-01")).toEqual({ from: "2026-09-01", to: "2026-09-07" });
    expect(presetRange("PREVIOUS_7", "2026-09-01")).toEqual({ from: "2026-08-25", to: "2026-08-31" });
    expect(validFulfillmentRange("2026-09-07", "2026-09-01")).toBeUndefined();
    expect(validFulfillmentRange("bad", "2026-09-01")).toBeUndefined();
  });

  test("searches organization, location, and menu without changing counts", () => {
    expect(filterOperationRows(rows, "vegetarian")).toHaveLength(1);
    expect(filterOperationRows(rows, "gulshan")[0].schedule_id).toBe("s-2");
    expect(fulfillmentTotals(rows)).toEqual({ meals: 19, services: 3, locations: 3, menus: 4 });
  });

  test("aggregates enterprise, location, menu, and dispatch quantities", () => {
    const now = new Date("2026-09-02T00:00:00.000Z");
    const enterprises = groupByEnterprise(rows, now);
    expect(enterprises[0]).toMatchObject({ name: "Live Technology", total: 10, open: 0, locked: 10 });
    expect(enterprises[0].locations[0]).toMatchObject({ name: "Banani", total: 10 });
    expect(procurementTotals(rows, now).find(({ menu }) => menu === "Premium lunch")).toMatchObject({ total: 5, open: 5, locked: 0, enterprises: 1, locations: 1 });
    expect(groupForDispatch(rows)).toHaveLength(3);
  });

  test("exports exactly the filtered rows with safe CSV cells and count state", () => {
    const special = { ...rows[0], enterprise_name: "Acme, Ltd" };
    const csv = fulfillmentCsv([special], new Date("2026-09-02T00:00:00.000Z"));
    expect(csv.split("\n")).toHaveLength(2);
    expect(csv).toContain('2026-09-01,"Acme, Ltd",Banani,Homestyle lunch,A,7,LOCKED');
    expect(countState(rows[2].cutoff_time, new Date("2026-09-02T00:00:00.000Z"))).toBe("OPEN");
  });
});
