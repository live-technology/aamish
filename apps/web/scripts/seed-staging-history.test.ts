import { describe, expect, test } from "bun:test";
import { historicalDates, OFFICE_MENUS, ORGANIZATIONS, officeMenuForDate, parseSeedOptions, upcomingDates } from "./seed-staging-history";

describe("staging history seed", () => {
  test("creates four deliberately different organization sizes", () => { expect(ORGANIZATIONS.map((item) => item.employees)).toEqual([50, 180, 350, 650]); });
  test("builds exactly 45 completed dates", () => { const dates = historicalDates("2026-09-02"); expect(dates).toHaveLength(45); expect(dates[0]).toBe("2026-07-19"); expect(dates.at(-1)).toBe("2026-09-01"); });
  test("builds the next seven service dates", () => { expect(upcomingDates("2026-09-02")).toEqual(["2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09"]); });
  test("marks beef and fish services for a chicken alternate", () => { expect(OFFICE_MENUS.filter((item) => item.alternate).map((item) => item.day)).toEqual([0, 1, 2, 3]); expect(officeMenuForDate("2026-09-01").title).toBe("Tuesday Office Meal"); });
  test("requires an explicit host and destructive confirmation", () => { expect(() => parseSeedOptions([])).toThrow(); expect(() => parseSeedOptions(["--expected-host", "stage.example", "--execute"])).toThrow(); expect(parseSeedOptions(["--expected-host", "stage.example", "--execute", "--confirm=RESET-STAGING-DATABASE"]).execute).toBe(true); });
});
