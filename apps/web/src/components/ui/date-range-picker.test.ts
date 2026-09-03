import { describe, expect, test } from "bun:test";
import { calendarDays, orderedRange } from "./date-range-picker";

describe("date range picker", () => {
  test("orders a backwards two-click selection", () => {
    expect(orderedRange("2026-09-20", "2026-09-04")).toEqual({ from: "2026-09-04", to: "2026-09-20" });
  });

  test("builds a stable six-week grid around the visible month", () => {
    const days = calendarDays("2026-09");
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-08-30");
    expect(days.at(-1)).toBe("2026-10-10");
  });
});
