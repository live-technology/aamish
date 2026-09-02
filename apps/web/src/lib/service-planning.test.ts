import { describe, expect, test } from "bun:test";
import { addDays, isYmd, schedulesInWeek, weekDates, weekRangeLabel, type PlannedSchedule } from "./service-planning";

const schedule = (date: string): PlannedSchedule => ({ id: date, schedule_date: date, cutoff_time: `${date}T00:05:00+06:00`, status: "PUBLISHED", enterprise_name: "Meridian", meal_count: 10, locations: [], options: [] });

describe("seven-day service planning", () => {
  test("builds exact seven-day windows across month and year boundaries", () => {
    expect(weekDates("2026-12-29")).toEqual(["2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03", "2027-01-04"]);
    expect(addDays("2027-01-04", -7)).toBe("2026-12-28");
    expect(weekRangeLabel("2026-09-03")).toBe("Sep 3 – 9, 2026");
    expect(weekRangeLabel("2026-12-29")).toBe("Dec 29, 2026 – Jan 4, 2027");
  });

  test("includes only services inside the selected dates", () => {
    const rows = [schedule("2026-09-02"), schedule("2026-09-03"), schedule("2026-09-09"), schedule("2026-09-10")];
    expect(schedulesInWeek(rows, "2026-09-03").map(({ schedule_date }) => schedule_date)).toEqual(["2026-09-03", "2026-09-09"]);
  });

  test("accepts only real ISO calendar dates", () => {
    expect(isYmd("2026-09-03")).toBe(true);
    expect(isYmd("2026-02-30")).toBe(false);
    expect(isYmd("09/03/2026")).toBe(false);
  });
});
