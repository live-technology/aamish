import { describe, expect, test } from "bun:test";
import { validateFoodQualityReport } from "./food-quality-reports";

describe("food-quality reports", () => {
  test("requires a linked schedule and useful description", () => {
    expect(validateFoodQualityReport({ scheduleId: "04B8753F-ED7C-4E3C-8B36-548D24F301A0", message: "  Food smelled stale  " })).toEqual({
      ok: true,
      value: { scheduleId: "04b8753f-ed7c-4e3c-8b36-548d24f301a0", message: "Food smelled stale" },
    });
    expect(validateFoodQualityReport({ scheduleId: "", message: "Food smelled stale" }).ok).toBe(false);
    expect(validateFoodQualityReport({ scheduleId: "meal-1", message: "Food smelled stale" }).ok).toBe(false);
    expect(validateFoodQualityReport({ scheduleId: "04b8753f-ed7c-4e3c-8b36-548d24f301a0", message: "x" }).ok).toBe(false);
  });

  test("rejects malformed and oversized payloads before querying the database", () => {
    const scheduleId = "04b8753f-ed7c-4e3c-8b36-548d24f301a0";
    expect(validateFoodQualityReport(null)).toEqual({ ok: false, error: "INVALID_FOOD_QUALITY_REPORT" });
    expect(validateFoodQualityReport({ scheduleId, message: "x".repeat(2001) })).toEqual({ ok: false, error: "INVALID_FOOD_QUALITY_REPORT" });
  });
});
